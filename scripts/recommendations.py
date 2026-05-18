import os
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import svds
from sqlalchemy import create_engine, text
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from dotenv import load_dotenv

load_dotenv(".env.local")
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set.")

parsed = urlparse(DATABASE_URL)
clean_params = {k: v[0] for k, v in parse_qs(parsed.query).items() if k in ('sslmode',)}
clean_url = urlunparse(parsed._replace(query=urlencode(clean_params)))
engine = create_engine(clean_url)

N_FACTORS = 50

def train_and_extract_vectors():
    print("Extrayendo interacciones...")
    
    query = """
    WITH interactions AS (
        SELECT user_id, book_id, 5 AS weight FROM favorites
        UNION ALL
        SELECT requester_id AS user_id, book_id, 10 AS weight FROM exchanges WHERE status IN ('completado', 'en_curso')
        UNION ALL
        SELECT requester_id AS user_id, book_id, 8 AS weight FROM exchanges WHERE status IN ('pendiente', 'aceptado')
        UNION ALL
        SELECT u.id AS user_id, b.id AS book_id, 15 AS weight FROM users u CROSS JOIN books b WHERE u.preferences && b.genres
        UNION ALL
        SELECT cm.user_id, b.id AS book_id, 2 AS weight FROM community_members cm JOIN communities c ON cm.community_id = c.id CROSS JOIN books b WHERE c.genres && b.genres
    )
    SELECT CAST(user_id AS VARCHAR) AS user_id, CAST(book_id AS VARCHAR) AS book_id, SUM(weight) as rating
    FROM interactions
    GROUP BY user_id, book_id;
    """
    
    df = pd.read_sql(query, engine)
    if df.empty:
        print("No hay suficientes datos.")
        return

    user_ids = np.sort(df['user_id'].unique())
    book_ids = np.sort(df['book_id'].unique())
    
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    book_to_idx = {bid: i for i, bid in enumerate(book_ids)}
    
    n_users, n_books = len(user_ids), len(book_ids)
    print(f"Matriz Dispersa: {n_users} usuarios x {n_books} libros")

    # 1. OPTIMIZACIÓN: Crear matriz dispersa directamente
    rows = df['user_id'].map(user_to_idx).values
    cols = df['book_id'].map(book_to_idx).values
    data = df['rating'].values
    
    R_sparse = coo_matrix((data, (rows, cols)), shape=(n_users, n_books), dtype=float).tocsr()

    n_factors = min(N_FACTORS, n_users - 1, n_books - 1)
    if n_factors < 1:
        print("Datos insuficientes para SVD.")
        return

    print(f"Ejecutando SVD Truncado con {n_factors} factores...")
    
    # 2. OPTIMIZACIÓN: svds solo calcula los factores necesarios (muy rápido y poca RAM)
    U_k, sigma_k, Vt_k = svds(R_sparse, k=n_factors, random_state=42)
    
    # svds no ordena los resultados por defecto, los ordenamos
    idx = np.argsort(sigma_k)[::-1]
    U_k = U_k[:, idx]
    sigma_k = sigma_k[idx]
    Vt_k = Vt_k[idx, :]
    
    sqrt_sigma = np.sqrt(np.diag(sigma_k))
    user_vectors = U_k @ sqrt_sigma
    book_vectors = (sqrt_sigma @ Vt_k).T

    # Padding si la matriz era muy pequeña
    if n_factors < N_FACTORS:
        user_vectors = np.hstack([user_vectors, np.zeros((n_users, N_FACTORS - n_factors))])
        book_vectors = np.hstack([book_vectors, np.zeros((n_books, N_FACTORS - n_factors))])

    # 3. OPTIMIZACIÓN: Inserciones en bloque (Batch Inserts)
    print("Guardando vectores en PostgreSQL (Batch)...")
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE user_vectors"))
        conn.execute(text("TRUNCATE TABLE book_vectors"))
        
        user_data = [{"uid": uid, "emb": str(user_vectors[i].tolist())} for i, uid in enumerate(user_ids)]
        if user_data:
            conn.execute(text("INSERT INTO user_vectors (user_id, embedding) VALUES (:uid, CAST(:emb AS vector))"), user_data)
            
        book_data = [{"bid": bid, "emb": str(book_vectors[i].tolist())} for i, bid in enumerate(book_ids)]
        if book_data:
            conn.execute(text("INSERT INTO book_vectors (book_id, embedding) VALUES (:bid, CAST(:emb AS vector))"), book_data)

    print("¡Vectores guardados exitosamente!")

    # 4. OPTIMIZACIÓN: Resolver problema N+1 en las consultas de depuración
    print("\n=== DEBUG: Similitudes libros por usuario ===")
    with engine.connect() as conn:
        # Envolvemos row[0] en str() para asegurar que la clave sea texto
        user_names = {str(row[0]): row[1] for row in conn.execute(text("SELECT id, username FROM users")).fetchall()}
        book_details = {str(row[0]): (row[1], row[2]) for row in conn.execute(text("SELECT id, title, genres FROM books")).fetchall()}

    for i, uid in enumerate(user_ids[:3]): # Limitado a 3 para no ensuciar la consola
        u_vec = user_vectors[i]
        scores = []
        norm_u = np.linalg.norm(u_vec)
        
        if norm_u > 0:
            for j, bid in enumerate(book_ids):
                b_vec = book_vectors[j]
                norm_b = np.linalg.norm(b_vec)
                sim = np.dot(u_vec, b_vec) / (norm_u * norm_b) if norm_b > 0 else 0
                scores.append((bid, sim))
        
        scores.sort(key=lambda x: x[1], reverse=True)
        
        # Aseguramos que uid se pase como string
        username = user_names.get(str(uid), str(uid))
        
        print(f"\n @{username} — Top 3 libros:")
        for bid, sim in scores[:3]:
            # Aseguramos que bid se pase como string
            details = book_details.get(str(bid))
            if details:
                title, genres = details
                print(f"    {sim:.4f} | \"{title}\" [{', '.join(genres or [])}]")

    # ═══════════════════════════════════════════════════════════════════════
    # COMMUNITY VECTORS
    # ═══════════════════════════════════════════════════════════════════════
    print("\n\n=== Generando vectores de comunidades ===")
    
    comm_query = """
    WITH comm_interactions AS (
        SELECT cm.user_id, cm.community_id, 8 AS weight
        FROM community_members cm
        WHERE cm.status = 'active'
        UNION ALL
        SELECT p.user_id, p.community_id, 4 AS weight
        FROM posts p
        UNION ALL
        SELECT u.id AS user_id, c.id AS community_id, 15 AS weight
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
        
        comm_user_ids = np.sort(comm_df['user_id'].unique())
        comm_ids = np.sort(comm_df['community_id'].unique())
        
        comm_user_to_idx = {uid: i for i, uid in enumerate(comm_user_ids)}
        comm_to_idx = {cid: i for i, cid in enumerate(comm_ids)}
        
        n_comm_users, n_comms = len(comm_user_ids), len(comm_ids)
        print(f"Matriz Dispersa: {n_comm_users} usuarios x {n_comms} comunidades")
        
        # 1. Matriz dispersa para comunidades
        rows_c = comm_df['user_id'].map(comm_user_to_idx).values
        cols_c = comm_df['community_id'].map(comm_to_idx).values
        data_c = comm_df['rating'].values
        
        RC_sparse = coo_matrix((data_c, (rows_c, cols_c)), shape=(n_comm_users, n_comms), dtype=float).tocsr()
        
        n_comm_factors = min(N_FACTORS, n_comm_users - 1, n_comms - 1)
        
        if n_comm_factors < 1:
            print("Datos insuficientes para SVD de comunidades.")
        else:
            print(f"Ejecutando SVD Truncado con {n_comm_factors} factores...")
            
            # 2. SVD Truncado
            U_c, sigma_c, Vt_c = svds(RC_sparse, k=n_comm_factors, random_state=42)
            
            idx_c = np.argsort(sigma_c)[::-1]
            U_c = U_c[:, idx_c]
            sigma_c = sigma_c[idx_c]
            Vt_c = Vt_c[idx_c, :]
            
            sqrt_sigma_c = np.sqrt(np.diag(sigma_c))
            comm_user_vecs = U_c @ sqrt_sigma_c
            comm_vecs = (sqrt_sigma_c @ Vt_c).T
            
            # Padding
            if n_comm_factors < N_FACTORS:
                comm_user_vecs = np.hstack([comm_user_vecs, np.zeros((n_comm_users, N_FACTORS - n_comm_factors))])
                comm_vecs = np.hstack([comm_vecs, np.zeros((n_comms, N_FACTORS - n_comm_factors))])
                
            # 3. Inserciones en Batch
            print("Guardando vectores de comunidades en PostgreSQL (Batch)...")
            with engine.begin() as conn:
                conn.execute(text("TRUNCATE TABLE community_vectors"))
                
                comm_data = [{"cid": cid, "emb": str(comm_vecs[i].tolist())} for i, cid in enumerate(comm_ids)]
                if comm_data:
                    conn.execute(text("INSERT INTO community_vectors (community_id, embedding) VALUES (:cid, CAST(:emb AS vector))"), comm_data)
                    
            print("¡Vectores de comunidades guardados exitosamente!")
            
            # 4. Debug optimizado con dictionary comprehension
            print("\n=== DEBUG: Similitudes comunidades por usuario ===")
            with engine.connect() as conn:
                # Envolvemos row[0] en str() para asegurar que todo sea texto
                user_names = {str(row[0]): row[1] for row in conn.execute(text("SELECT id, username FROM users")).fetchall()}
                comm_details = {str(row[0]): (row[1], row[2]) for row in conn.execute(text("SELECT id, name, genres FROM communities")).fetchall()}
                
            for i, uid in enumerate(comm_user_ids[:3]):
                u_vec = comm_user_vecs[i]
                scores = []
                norm_u = np.linalg.norm(u_vec)
                
                if norm_u > 0:
                    for j, cid in enumerate(comm_ids):
                        c_vec = comm_vecs[j]
                        norm_c = np.linalg.norm(c_vec)
                        sim = np.dot(u_vec, c_vec) / (norm_u * norm_c) if norm_c > 0 else 0
                        scores.append((cid, sim))
                
                scores.sort(key=lambda x: x[1], reverse=True)
                
                # Buscamos asegurando que uid sea string
                username = user_names.get(str(uid), str(uid))
                
                print(f"\n @{username} — Comunidades recomendadas:")
                for cid, sim in scores[:3]:
                    # Buscamos asegurando que cid sea string
                    details = comm_details.get(str(cid))
                    if details:
                        name, genres = details
                        print(f"    {sim:.4f} | \"{name}\" [{', '.join(genres or [])}]")

if __name__ == "__main__":
    train_and_extract_vectors()