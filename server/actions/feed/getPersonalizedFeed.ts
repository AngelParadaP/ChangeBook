"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, desc, eq } from "drizzle-orm";

interface FeedParams {
  page?: number;
  limit?: number;
}

export async function getPersonalizedFeed({ page = 0, limit = 10 }: FeedParams = {}) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return { success: false, error: "No autorizado", books: [] };
    }

    const offset = page * limit;

    // Get user data (preferences) for genre-based fallback scoring
    const [userData] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return { success: false, error: "Usuario no encontrado", books: [] };
    }

    const userPreferences = userData.preferences || [];

    // Check if the user has a vector embedding
    const userVectorResult = await db.execute(
      sql`SELECT user_id FROM user_vectors WHERE user_id = ${user.id} LIMIT 1`
    );
    const hasVector = userVectorResult.rows.length > 0;

    if (hasVector) {
      // ─── Unified vector + fallback query ──────────────────────────────
      // LEFT JOIN book_vectors: books WITH vectors get cosine similarity,
      // books WITHOUT vectors (new) get scored by genre match + recency.
      const prefsArray = userPreferences.length > 0
        ? `ARRAY[${userPreferences.map(p => `'${p.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;

      const vectorResult = await db.execute(sql`
        SELECT
          b.id,
          b.title,
          b.author,
          b.publisher,
          b.year,
          b.image_url,
          b.description,
          b.genres,
          b.status,
          b.created_at,
          b.owner_id,
          u.username AS owner_username,
          CASE
            WHEN bv.embedding IS NOT NULL
              THEN 1 - (bv.embedding <=> uv.embedding)
            ELSE NULL
          END AS similarity_score,
          (
            SELECT COUNT(*)
            FROM unnest(b.genres) AS g
            WHERE g = ANY(${sql.raw(prefsArray)})
          ) AS genre_match,
          CASE WHEN EXISTS(
            SELECT 1 FROM exchanges e 
            WHERE e.book_id = b.id AND e.requester_id = ${user.id}
          ) THEN 1 ELSE 0 END AS has_requested
        FROM books b
        JOIN users u ON u.id = b.owner_id
        LEFT JOIN book_vectors bv ON bv.book_id = b.id
        CROSS JOIN user_vectors uv
        WHERE uv.user_id = ${user.id}
          AND b.owner_id != ${user.id}
          AND b.status IN ('disponible', 'ocupado')
        ORDER BY
          has_requested ASC,
          CASE WHEN bv.embedding IS NOT NULL
            THEN 0 ELSE 1
          END ASC,
          CASE WHEN bv.embedding IS NOT NULL
            THEN bv.embedding <=> uv.embedding
            ELSE 2.0
          END ASC,
          genre_match DESC,
          b.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      const vectorRows = vectorResult.rows as any[];

      if (vectorRows.length > 0) {
        const mappedBooks = vectorRows.map((row: any) => ({
          id: row.id,
          title: row.title,
          author: row.author,
          publisher: row.publisher,
          year: row.year,
          imageUrl: row.image_url,
          description: row.description,
          genres: row.genres,
          status: row.status,
          createdAt: row.created_at,
          ownerId: row.owner_id,
          ownerUsername: row.owner_username,
        }));

        return {
          success: true,
          books: mappedBooks,
          hasMore: vectorRows.length === limit,
        };
      }
    }

    // ─── Fallback: Genre-prioritized or recent ─────────────────────────
    if (userPreferences.length > 0) {
      const escapedPreferences = userPreferences.map(p => p.replace(/'/g, "''"));
      const preferencesArraySQL = `ARRAY[${escapedPreferences.map(p => `'${p}'`).join(',')}]::text[]`;

      const allBooks = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          publisher: books.publisher,
          year: books.year,
          imageUrl: books.imageUrl,
          description: books.description,
          genres: books.genres,
          status: books.status,
          createdAt: books.createdAt,
          ownerId: books.ownerId,
          ownerUsername: users.username,
          matchScore: sql<number>`(
            SELECT COUNT(*)
            FROM unnest(${books.genres}) AS genre
            WHERE genre = ANY(${sql.raw(preferencesArraySQL)})
          )`.as('match_score'),
          hasRequested: sql<number>`CASE WHEN EXISTS(SELECT 1 FROM exchanges e WHERE e.book_id = ${books.id} AND e.requester_id = ${user.id}) THEN 1 ELSE 0 END`.as('has_requested'),
        })
        .from(books)
        .innerJoin(users, eq(books.ownerId, users.id))
        .where(
          sql`${books.ownerId} != ${user.id} AND ${books.status} IN ('disponible', 'ocupado')`
        )
        .orderBy(
          sql`has_requested ASC`,
          desc(sql`match_score`),
          desc(books.createdAt)
        )
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        books: allBooks,
        hasMore: allBooks.length === limit,
      };
    }

    // ─── No preferences, no vectors → recent books ─────────────────────
    const recentBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        publisher: books.publisher,
        year: books.year,
        imageUrl: books.imageUrl,
        description: books.description,
        genres: books.genres,
        status: books.status,
        createdAt: books.createdAt,
        ownerId: books.ownerId,
        ownerUsername: users.username,
        hasRequested: sql<number>`CASE WHEN EXISTS(SELECT 1 FROM exchanges e WHERE e.book_id = ${books.id} AND e.requester_id = ${user.id}) THEN 1 ELSE 0 END`.as('has_requested'),
      })
      .from(books)
      .innerJoin(users, eq(books.ownerId, users.id))
      .where(sql`${books.ownerId} != ${user.id} AND ${books.status} IN ('disponible', 'ocupado')`)
      .orderBy(sql`has_requested ASC`, desc(books.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true, books: recentBooks, hasMore: recentBooks.length === limit };
  } catch (error) {
    console.error("Error fetching feed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar el feed",
      books: [],
    };
  }
}

