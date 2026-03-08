"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, desc, eq } from "drizzle-orm";

interface RecommendationLogEntry {
  bookId: string;
  title: string;
  author: string;
  genres: string[];
  ownerUsername: string;
  similarityScore: number | null;
  matchScore: number;
  strategy: "vector" | "genre" | "recent";
}

export async function getRecommendationLog(): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
  username?: string;
  strategy?: string;
  entries?: RecommendationLogEntry[];
  preferences?: string[];
  hasVector?: boolean;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check for vector
    const vectorResult = await db.execute(
      sql`SELECT user_id FROM user_vectors WHERE user_id = ${user.id} LIMIT 1`
    );
    const hasVector = vectorResult.rows.length > 0;

    // Get user preferences
    const [userData] = await db
      .select({ username: users.username, preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const userPreferences = userData.preferences || [];
    const entries: RecommendationLogEntry[] = [];
    let strategy: "vector" | "genre" | "recent" = "recent";

    if (hasVector) {
      // Vector similarity + new books via LEFT JOIN
      strategy = "vector";
      const prefsArray = userPreferences.length > 0
        ? `ARRAY[${userPreferences.map(p => `'${p.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;

      const vectorRes = await db.execute(sql`
        SELECT
          b.id,
          b.title,
          b.author,
          b.genres,
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
          ) AS genre_match
        FROM books b
        JOIN users u ON u.id = b.owner_id
        LEFT JOIN book_vectors bv ON bv.book_id = b.id
        CROSS JOIN user_vectors uv
        WHERE uv.user_id = ${user.id}
          AND b.owner_id != ${user.id}
          AND b.status IN ('disponible', 'ocupado')
        ORDER BY
          CASE WHEN bv.embedding IS NOT NULL THEN 0 ELSE 1 END ASC,
          CASE WHEN bv.embedding IS NOT NULL
            THEN bv.embedding <=> uv.embedding
            ELSE 2.0
          END ASC,
          genre_match DESC,
          b.created_at DESC
        LIMIT 30
      `);

      for (const row of vectorRes.rows as any[]) {
        const hasSimilarity = row.similarity_score !== null;
        entries.push({
          bookId: row.id,
          title: row.title,
          author: row.author,
          genres: row.genres || [],
          ownerUsername: row.owner_username,
          similarityScore: hasSimilarity ? parseFloat(Number(row.similarity_score).toFixed(4)) : null,
          matchScore: Number(row.genre_match || 0),
          strategy: hasSimilarity ? "vector" : (Number(row.genre_match) > 0 ? "genre" : "recent"),
        });
      }
    } else if (userPreferences.length > 0) {
      // Strategy 2: Genre matching
      strategy = "genre";
      const escapedPreferences = userPreferences.map(p => p.replace(/'/g, "''"));
      const preferencesArraySQL = `ARRAY[${escapedPreferences.map(p => `'${p}'`).join(',')}]::text[]`;

      const genreRes = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          genres: books.genres,
          ownerUsername: users.username,
          matchScore: sql<number>`(
            SELECT COUNT(*)
            FROM unnest(${books.genres}) AS genre
            WHERE genre = ANY(${sql.raw(preferencesArraySQL)})
          )`.as('match_score'),
        })
        .from(books)
        .innerJoin(users, eq(books.ownerId, users.id))
        .where(
          sql`${books.ownerId} != ${user.id} AND ${books.status} IN ('disponible', 'ocupado')`
        )
        .orderBy(desc(sql`match_score`), desc(books.createdAt))
        .limit(30);

      for (const row of genreRes) {
        entries.push({
          bookId: row.id,
          title: row.title,
          author: row.author,
          genres: row.genres || [],
          ownerUsername: row.ownerUsername || "",
          similarityScore: null,
          matchScore: Number(row.matchScore),
          strategy: row.matchScore > 0 ? "genre" : "recent",
        });
      }
    } else {
      // Strategy 3: Recent
      strategy = "recent";
      const recentRes = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          genres: books.genres,
          ownerUsername: users.username,
        })
        .from(books)
        .innerJoin(users, eq(books.ownerId, users.id))
        .where(
          sql`${books.ownerId} != ${user.id} AND ${books.status} IN ('disponible', 'ocupado')`
        )
        .orderBy(desc(books.createdAt))
        .limit(30);

      for (const row of recentRes) {
        entries.push({
          bookId: row.id,
          title: row.title,
          author: row.author,
          genres: row.genres || [],
          ownerUsername: row.ownerUsername || "",
          similarityScore: null,
          matchScore: 0,
          strategy: "recent",
        });
      }
    }

    return {
      success: true,
      userId: user.id,
      username: userData.username,
      strategy,
      entries,
      preferences: userPreferences,
      hasVector,
    };
  } catch (error) {
    console.error("Error getting recommendation log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al obtener el log",
    };
  }
}
