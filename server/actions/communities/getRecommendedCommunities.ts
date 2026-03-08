"use server";

import { db } from "@/db";
import { communities, communityMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, desc, eq, and } from "drizzle-orm";

interface CommunityFeedParams {
  page?: number;
  limit?: number;
}

export async function getRecommendedCommunities({ page = 0, limit = 10 }: CommunityFeedParams = {}) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return { success: false, error: "No autorizado", communities: [] };
    }

    const offset = page * limit;

    // Get user preferences for genre-based fallback
    const [userData] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return { success: false, error: "Usuario no encontrado", communities: [] };
    }

    const userPreferences = userData.preferences || [];

    // Get communities the user is already a member of (to exclude them)
    const memberOf = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.status, "active")));

    const memberIds = memberOf.map(m => m.communityId);

    // Build exclusion clause
    const excludeClause = memberIds.length > 0
      ? sql`AND c.id NOT IN (${sql.join(memberIds.map(id => sql`${id}`), sql`, `)})`
      : sql``;

    // Check if user has a vector
    const userVectorResult = await db.execute(
      sql`SELECT user_id FROM user_vectors WHERE user_id = ${user.id} LIMIT 1`
    );
    const hasVector = userVectorResult.rows.length > 0;

    if (hasVector) {
      // ─── Vector-based community recommendations ─────────────────────
      const prefsArray = userPreferences.length > 0
        ? `ARRAY[${userPreferences.map(p => `'${p.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;

      const result = await db.execute(sql`
        SELECT
          c.id,
          c.name,
          c.description,
          c.image_url,
          c.genres,
          c.created_at,
          u.username AS owner_username,
          (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status = 'active') AS member_count,
          CASE
            WHEN cv.embedding IS NOT NULL AND uv.embedding IS NOT NULL
              THEN 1 - (cv.embedding <=> uv.embedding)
            ELSE NULL
          END AS similarity_score,
          (
            SELECT COUNT(*)
            FROM unnest(c.genres) AS g
            WHERE g = ANY(${sql.raw(prefsArray)})
          ) AS genre_match
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        LEFT JOIN community_vectors cv ON cv.community_id = c.id
        LEFT JOIN user_vectors uv ON uv.user_id = ${user.id}
        WHERE c.owner_id != ${user.id}
          ${excludeClause}
        ORDER BY
          CASE WHEN cv.embedding IS NOT NULL AND uv.embedding IS NOT NULL
            THEN 0 ELSE 1
          END ASC,
          CASE WHEN cv.embedding IS NOT NULL AND uv.embedding IS NOT NULL
            THEN cv.embedding <=> uv.embedding
            ELSE 2.0
          END ASC,
          genre_match DESC,
          member_count DESC,
          c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      const rows = result.rows as any[];

      if (rows.length > 0) {
        const mapped = rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          imageUrl: row.image_url,
          genres: row.genres || [],
          createdAt: row.created_at,
          ownerUsername: row.owner_username,
          memberCount: Number(row.member_count),
          similarityScore: row.similarity_score !== null ? parseFloat(Number(row.similarity_score).toFixed(4)) : null,
          genreMatch: Number(row.genre_match || 0),
        }));

        return {
          success: true,
          communities: mapped,
          hasMore: rows.length === limit,
        };
      }
    }

    // ─── Fallback: Genre-prioritized or popular ──────────────────────
    if (userPreferences.length > 0) {
      const escapedPreferences = userPreferences.map(p => p.replace(/'/g, "''"));
      const preferencesArraySQL = `ARRAY[${escapedPreferences.map(p => `'${p}'`).join(',')}]::text[]`;

      const result = await db.execute(sql`
        SELECT
          c.id,
          c.name,
          c.description,
          c.image_url,
          c.genres,
          c.created_at,
          u.username AS owner_username,
          (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status = 'active') AS member_count,
          (
            SELECT COUNT(*)
            FROM unnest(c.genres) AS g
            WHERE g = ANY(${sql.raw(preferencesArraySQL)})
          ) AS genre_match
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        WHERE c.owner_id != ${user.id}
          ${excludeClause}
        ORDER BY genre_match DESC, member_count DESC, c.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      const rows = result.rows as any[];
      const mapped = rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        genres: row.genres || [],
        createdAt: row.created_at,
        ownerUsername: row.owner_username,
        memberCount: Number(row.member_count),
      }));

      return { success: true, communities: mapped, hasMore: rows.length === limit };
    }

    // ─── No preferences: by popularity ───────────────────────────────
    const result = await db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.description,
        c.image_url,
        c.genres,
        c.created_at,
        u.username AS owner_username,
        (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status = 'active') AS member_count
      FROM communities c
      JOIN users u ON u.id = c.owner_id
      WHERE c.owner_id != ${user.id}
        ${excludeClause}
      ORDER BY member_count DESC, c.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const rows = result.rows as any[];
    const mapped = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      genres: row.genres || [],
      createdAt: row.created_at,
      ownerUsername: row.owner_username,
      memberCount: Number(row.member_count),
    }));

    return { success: true, communities: mapped, hasMore: rows.length === limit };
  } catch (error) {
    console.error("Error fetching recommended communities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar comunidades",
      communities: [],
    };
  }
}
