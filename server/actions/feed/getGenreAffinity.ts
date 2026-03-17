"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, eq } from "drizzle-orm";

interface GenreAffinity {
  genre: string;
  score: number;
  sources: string[];
  breakdown: Record<string, { weight: number; count: number }>;
}

export async function getGenreAffinity(): Promise<{
  success: boolean;
  error?: string;
  bookAffinities?: GenreAffinity[];
  communityAffinities?: GenreAffinity[];
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) return { success: false, error: "No autorizado" };

    // Get user preferences
    const [userData] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const prefs = userData?.preferences || [];

    // ═══════════════════════════════════════════════════════════════════
    // BOOK GENRE AFFINITY
    // Sources: preferences (2), favorites (3), exchanges completed (5),
    //          exchanges pending (4), community membership genre overlap (1)
    // ═══════════════════════════════════════════════════════════════════
    const bookAffinityResult = await db.execute(sql`
      WITH genre_scores AS (
        -- From user preferences (direct signal)
        SELECT unnest(u.preferences) AS genre, 2 AS weight, 'preferencias' AS source
        FROM users u WHERE u.id = ${user.id} AND u.preferences IS NOT NULL

        UNION ALL

        -- From favorited books
        SELECT unnest(b.genres) AS genre, 3 AS weight, 'favoritos' AS source
        FROM favorites f
        JOIN books b ON b.id = f.book_id
        WHERE f.user_id = ${user.id}

        UNION ALL

        -- From completed exchanges (strongest signal)
        SELECT unnest(b.genres) AS genre, 5 AS weight, 'intercambios' AS source
        FROM exchanges e
        JOIN books b ON b.id = e.book_id
        WHERE e.requester_id = ${user.id} AND e.status IN ('completado', 'en_curso')

        UNION ALL

        -- From pending exchanges
        SELECT unnest(b.genres) AS genre, 4 AS weight, 'intercambios' AS source
        FROM exchanges e
        JOIN books b ON b.id = e.book_id
        WHERE e.requester_id = ${user.id} AND e.status IN ('pendiente', 'aceptado')

        UNION ALL

        -- From community memberships (genres of communities user belongs to)
        SELECT unnest(c.genres) AS genre, 1 AS weight, 'comunidades' AS source
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        WHERE cm.user_id = ${user.id} AND cm.status = 'active'
      )
      SELECT
        genre,
        SUM(source_weight) AS total_score,
        json_object_agg(source, json_build_object('weight', source_weight, 'count', source_count)) AS breakdown
      FROM (
        SELECT genre, source, SUM(weight) as source_weight, COUNT(*) as source_count
        FROM genre_scores
        WHERE genre IS NOT NULL
        GROUP BY genre, source
      ) sub
      GROUP BY genre
      ORDER BY total_score DESC
      LIMIT 12
    `);

    const bookAffinities: GenreAffinity[] = (bookAffinityResult.rows as any[]).map(r => ({
      genre: r.genre,
      score: Number(r.total_score),
      sources: Object.keys(r.breakdown || {}),
      breakdown: r.breakdown || {},
    }));

    // ═══════════════════════════════════════════════════════════════════
    // COMMUNITY GENRE AFFINITY
    // Sources: membership (5), posted in community (3), preferences overlap (2)
    // ═══════════════════════════════════════════════════════════════════
    const commAffinityResult = await db.execute(sql`
      WITH comm_genre_scores AS (
        -- From communities user is member of (strong signal)
        SELECT unnest(c.genres) AS genre, 5 AS weight, 'miembro' AS source
        FROM community_members cm
        JOIN communities c ON c.id = cm.community_id
        WHERE cm.user_id = ${user.id} AND cm.status = 'active'

        UNION ALL

        -- From communities user has posted in
        SELECT unnest(c.genres) AS genre, 3 AS weight, 'actividad' AS source
        FROM posts p
        JOIN communities c ON c.id = p.community_id
        WHERE p.user_id = ${user.id}

        UNION ALL

        -- From user preferences (inherent interest)
        SELECT unnest(u.preferences) AS genre, 2 AS weight, 'preferencias' AS source
        FROM users u WHERE u.id = ${user.id} AND u.preferences IS NOT NULL

        UNION ALL

        -- From favorited book genres (indirect interest)
        SELECT unnest(b.genres) AS genre, 1 AS weight, 'favoritos' AS source
        FROM favorites f
        JOIN books b ON b.id = f.book_id
        WHERE f.user_id = ${user.id}
      )
      SELECT
        genre,
        SUM(source_weight) AS total_score,
        json_object_agg(source, json_build_object('weight', source_weight, 'count', source_count)) AS breakdown
      FROM (
        SELECT genre, source, SUM(weight) as source_weight, COUNT(*) as source_count
        FROM comm_genre_scores
        WHERE genre IS NOT NULL
        GROUP BY genre, source
      ) sub
      GROUP BY genre
      ORDER BY total_score DESC
      LIMIT 12
    `);

    const communityAffinities: GenreAffinity[] = (commAffinityResult.rows as any[]).map(r => ({
      genre: r.genre,
      score: Number(r.total_score),
      sources: Object.keys(r.breakdown || {}),
      breakdown: r.breakdown || {},
    }));

    return { success: true, bookAffinities, communityAffinities };
  } catch (error) {
    console.error("Error getting genre affinity:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error" };
  }
}
