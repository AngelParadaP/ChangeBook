import os
import re
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Load .env.local for local development (optional in CI)
try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
except ImportError:
    pass  # dotenv not installed in CI, DATABASE_URL comes from env

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set. Create a .env.local file or export it.")

# Strip connection params that psycopg2 doesn't understand (e.g. uselibpqcompat from Neon)
parsed = urlparse(DATABASE_URL)
clean_params = {k: v[0] for k, v in parse_qs(parsed.query).items() if k in ('sslmode',)}
clean_url = urlunparse(parsed._replace(query=urlencode(clean_params)))
engine = create_engine(clean_url)

N_FACTORS = 50  # Dimensiones del vector de embedding

def train_and_extract_vectors():
    print("Extrayendo interacciones y calculando pesos...")
    
    query = """
    WITH interactions AS (
        SELECT user_id, book_id, 3 AS weight FROM favorites
        UNION ALL
        SELECT requester_id AS user_id, book_id, 5 AS weight FROM exchanges WHERE status IN ('completado', 'en_curso')
        UNION ALL
        SELECT requester_id AS user_id, book_id, 4 AS weight FROM exchanges WHERE status IN ('pendiente', 'aceptado')
        UNION ALL
        SELECT u.id AS user_id, b.id AS book_id, 2 AS weight FROM users u CROSS JOIN books b WHERE u.preferences && b.genres
        UNION ALL
        SELECT cm.user_id, b.id AS book_id, 1 AS weight FROM community_members cm JOIN communities c ON cm.community_id = c.id CROSS JOIN books b WHERE c.genres && b.genres
    )
    SELECT CAST(user_id AS VARCHAR) AS user_id, CAST(book_id AS VARCHAR) AS book_id, SUM(weight) as rating
    FROM interactions
    GROUP BY user_id, book_id;
    """
    
    df = pd.read_sql(query, engine)

    if df.empty:
        print("No hay suficientes datos en la base de datos para entrenar.")
        return

    print(f"Se encontraron {len(df)} interacciones usuario-libro.")

    # Build the user-item matrix
    user_ids = df['user_id'].unique()
    book_ids = df['book_id'].unique()
    
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    book_to_idx = {bid: i for i, bid in enumerate(book_ids)}
    
    n_users = len(user_ids)
    n_books = len(book_ids)
    
    print(f"Matriz: {n_users} usuarios x {n_books} libros")
    
    # Create the rating matrix (fill missing values with 0)
    R = np.zeros((n_users, n_books))
    for _, row in df.iterrows():
        u_idx = user_to_idx[row['user_id']]
        b_idx = book_to_idx[row['book_id']]
        R[u_idx, b_idx] = row['rating']
    
    # Normalize: subtract mean per user (only non-zero entries)
    user_means = np.zeros(n_users)
    for i in range(n_users):
        non_zero = R[i, R[i, :] > 0]
        if len(non_zero) > 1 and non_zero.std() > 0:
            user_means[i] = non_zero.mean()
        elif len(non_zero) > 0:
            # Prevents collapsing homogeneous interactions to completely zero vectors
            user_means[i] = non_zero.mean() / 2.0
    
    R_normalized = R.copy()
    for i in range(n_users):
        mask = R[i, :] > 0
        R_normalized[i, mask] -= user_means[i]
    
    # SVD decomposition
    # R ≈ U * Sigma * Vt
    print(f"Ejecutando SVD con {N_FACTORS} factores...")
    
    # Limit factors to min(n_users, n_books) - 1
    n_factors = min(N_FACTORS, n_users - 1, n_books - 1)
    if n_factors < 1:
        print("No hay suficientes datos para generar vectores significativos.")
        return
    
    U, sigma, Vt = np.linalg.svd(R_normalized, full_matrices=False)
    
    # Truncate to n_factors
    U_k = U[:, :n_factors]
    sigma_k = np.diag(sigma[:n_factors])
    Vt_k = Vt[:n_factors, :]
    
    # User vectors: U_k * sqrt(Sigma_k)
    sqrt_sigma = np.sqrt(sigma_k)
    user_vectors = U_k @ sqrt_sigma    # shape: (n_users, n_factors)
    book_vectors = (sqrt_sigma @ Vt_k).T  # shape: (n_books, n_factors)
    
    # Pad to N_FACTORS if necessary
    if n_factors < N_FACTORS:
        user_pad = np.zeros((n_users, N_FACTORS - n_factors))
        book_pad = np.zeros((n_books, N_FACTORS - n_factors))
        user_vectors = np.hstack([user_vectors, user_pad])
        book_vectors = np.hstack([book_vectors, book_pad])
    
    print(f"Vectores generados: {len(user_ids)} usuarios, {len(book_ids)} libros (dim={N_FACTORS})")
    print("Guardando vectores en PostgreSQL...")

    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE user_vectors"))
        conn.execute(text("TRUNCATE TABLE book_vectors"))
        
        for i, uid in enumerate(user_ids):
            embedding_str = str(user_vectors[i].tolist())
            conn.execute(
                text("INSERT INTO user_vectors (user_id, embedding) VALUES (:uid, CAST(:emb AS vector))"),
                {"uid": uid, "emb": embedding_str}
            )
        
        for i, bid in enumerate(book_ids):
            embedding_str = str(book_vectors[i].tolist())
            conn.execute(
                text("INSERT INTO book_vectors (book_id, embedding) VALUES (:bid, CAST(:emb AS vector))"),
                {"bid": bid, "emb": embedding_str}
            )

    print("¡Vectores de libros guardados exitosamente!")
    
    # Print some debug info
    print("\n=== DEBUG: Similitudes libros por usuario ===")
    for i, uid in enumerate(user_ids):
        u_vec = user_vectors[i]
        scores = []
        for j, bid in enumerate(book_ids):
            b_vec = book_vectors[j]
            # Cosine similarity
            norm_u = np.linalg.norm(u_vec)
            norm_b = np.linalg.norm(b_vec)
            if norm_u > 0 and norm_b > 0:
                sim = np.dot(u_vec, b_vec) / (norm_u * norm_b)
            else:
                sim = 0
            scores.append((bid, sim))
        
        # Get username for this user
        with engine.connect() as conn:
            result = conn.execute(text("SELECT username FROM users WHERE id = :uid"), {"uid": uid})
            username = result.scalar() or uid
        
        scores.sort(key=lambda x: x[1], reverse=True)
        print(f"\n  @{username} — Top 5 libros:")
        for bid, sim in scores[:5]:
            with engine.connect() as conn:
                result = conn.execute(text("SELECT title, genres FROM books WHERE id = :bid"), {"bid": bid})
                row = result.fetchone()
                if row:
                    print(f"    {sim:.4f} | \"{row[0]}\" [{', '.join(row[1] or [])}]")

    # ═══════════════════════════════════════════════════════════════════════
    # COMMUNITY VECTORS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n\n=== Generando vectores de comunidades ===")
    
    comm_query = """
    WITH comm_interactions AS (
        -- Membership is the strongest signal
        SELECT cm.user_id, cm.community_id, 5 AS weight
        FROM community_members cm
        WHERE cm.status = 'active'
        UNION ALL
        -- User posted in the community
        SELECT p.user_id, p.community_id, 3 AS weight
        FROM posts p
        UNION ALL
        -- Genre match between user preferences and community genres
        SELECT u.id AS user_id, c.id AS community_id, 2 AS weight
        FROM users u CROSS JOIN communities c
        WHERE u.preferences && c.genres
    )
    SELECT CAST(user_id AS VARCHAR) AS user_id, CAST(community_id AS VARCHAR) AS community_id, SUM(weight) as rating
    FROM comm_interactions
    GROUP BY user_id, community_id;
    """
    
    comm_df = pd.read_sql(comm_query, engine)
    
    if comm_df.empty:
        print("No hay suficientes datos de comunidades para entrenar.")
    else:
        print(f"Se encontraron {len(comm_df)} interacciones usuario-comunidad.")
        
        comm_user_ids = comm_df['user_id'].unique()
        comm_ids = comm_df['community_id'].unique()
        
        comm_user_to_idx = {uid: i for i, uid in enumerate(comm_user_ids)}
        comm_to_idx = {cid: i for i, cid in enumerate(comm_ids)}
        
        n_comm_users = len(comm_user_ids)
        n_comms = len(comm_ids)
        
        print(f"Matriz: {n_comm_users} usuarios x {n_comms} comunidades")
        
        # Build matrix
        RC = np.zeros((n_comm_users, n_comms))
        for _, row in comm_df.iterrows():
            u_idx = comm_user_to_idx[row['user_id']]
            c_idx = comm_to_idx[row['community_id']]
            RC[u_idx, c_idx] = row['rating']
        
        # Normalize
        comm_user_means = np.zeros(n_comm_users)
        for i in range(n_comm_users):
            non_zero = RC[i, RC[i, :] > 0]
            if len(non_zero) > 1 and non_zero.std() > 0:
                comm_user_means[i] = non_zero.mean()
            elif len(non_zero) > 0:
                comm_user_means[i] = non_zero.mean() / 2.0
        
        RC_normalized = RC.copy()
        for i in range(n_comm_users):
            mask = RC[i, :] > 0
            RC_normalized[i, mask] -= comm_user_means[i]
        
        # SVD
        n_comm_factors = min(N_FACTORS, n_comm_users - 1, n_comms - 1)
        if n_comm_factors < 1:
            print("No hay datos suficientes para SVD de comunidades.")
        else:
            print(f"Ejecutando SVD con {n_comm_factors} factores...")
            
            U_c, sigma_c, Vt_c = np.linalg.svd(RC_normalized, full_matrices=False)
            
            U_ck = U_c[:, :n_comm_factors]
            sigma_ck = np.diag(sigma_c[:n_comm_factors])
            Vt_ck = Vt_c[:n_comm_factors, :]
            
            sqrt_sigma_c = np.sqrt(sigma_ck)
            comm_user_vecs = U_ck @ sqrt_sigma_c
            comm_vecs = (sqrt_sigma_c @ Vt_ck).T
            
            # Pad to N_FACTORS
            if n_comm_factors < N_FACTORS:
                comm_user_vecs = np.hstack([comm_user_vecs, np.zeros((n_comm_users, N_FACTORS - n_comm_factors))])
                comm_vecs = np.hstack([comm_vecs, np.zeros((n_comms, N_FACTORS - n_comm_factors))])
            
            print(f"Vectores: {len(comm_user_ids)} usuarios, {len(comm_ids)} comunidades (dim={N_FACTORS})")
            print("Guardando vectores de comunidades...")
            
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE community_vectors"))
                
                # Update user_vectors with community-aware vectors by averaging
                # We keep existing book-based user vectors and store community vectors separately
                for i, cid in enumerate(comm_ids):
                    embedding_str = str(comm_vecs[i].tolist())
                    conn.execute(
                        text("INSERT INTO community_vectors (community_id, embedding) VALUES (:cid, CAST(:emb AS vector))"),
                        {"cid": cid, "emb": embedding_str}
                    )
            
            print("¡Vectores de comunidades guardados!")
            
            # Debug: show community recommendations per user
            print("\n=== DEBUG: Similitudes comunidades por usuario ===")
            for i, uid in enumerate(comm_user_ids):
                u_vec = comm_user_vecs[i]
                scores = []
                for j, cid in enumerate(comm_ids):
                    c_vec = comm_vecs[j]
                    norm_u = np.linalg.norm(u_vec)
                    norm_c = np.linalg.norm(c_vec)
                    if norm_u > 0 and norm_c > 0:
                        sim = np.dot(u_vec, c_vec) / (norm_u * norm_c)
                    else:
                        sim = 0
                    scores.append((cid, sim))
                
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT username FROM users WHERE id = :uid"), {"uid": uid})
                    username = result.scalar() or uid
                
                scores.sort(key=lambda x: x[1], reverse=True)
                print(f"\n  @{username} — Comunidades recomendadas:")
                for cid, sim in scores:
                    with engine.connect() as conn:
                        result = conn.execute(text("SELECT name, genres FROM communities WHERE id = :cid"), {"cid": cid})
                        row = result.fetchone()
                        if row:
                            print(f"    {sim:.4f} | \"{row[0]}\" [{', '.join(row[1] or [])}]")

if __name__ == "__main__":
    train_and_extract_vectors()

