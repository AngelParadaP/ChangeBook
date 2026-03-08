"use server";

import { db } from "@/db";
import { communities, communityMembers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, eq, and } from "drizzle-orm";

interface CommunityLogEntry {
  communityId: string;
  name: string;
  description: string | null;
  genres: string[];
  ownerUsername: string;
  memberCount: number;
  similarityScore: number | null;
  matchScore: number;
  strategy: "vector" | "genre" | "popular";
}

export async function getCommunityRecommendationLog(): Promise<{
  success: boolean;
  error?: string;
  entries?: CommunityLogEntry[];
  hasVector?: boolean;
  totalCommunities?: number;
}> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check for user vector
    const vectorResult = await db.execute(
      sql`SELECT user_id FROM user_vectors WHERE user_id = ${user.id} LIMIT 1`
    );
    const hasVector = vectorResult.rows.length > 0;

    // Get user preferences
    const [userData] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const userPreferences = userData?.preferences || [];

    // Get communities user is already member of
    const memberOf = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.status, "active")));

    const memberIds = memberOf.map(m => m.communityId);
    const excludeClause = memberIds.length > 0
      ? sql`AND c.id NOT IN (${sql.join(memberIds.map(id => sql`${id}`), sql`, `)})`
      : sql``;

    const entries: CommunityLogEntry[] = [];

    if (hasVector) {
      const prefsArray = userPreferences.length > 0
        ? `ARRAY[${userPreferences.map(p => `'${p.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;

      const result = await db.execute(sql`
        SELECT
          c.id,
          c.name,
          c.description,
          c.genres,
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
          CASE WHEN cv.embedding IS NOT NULL AND uv.embedding IS NOT NULL THEN 0 ELSE 1 END ASC,
          CASE WHEN cv.embedding IS NOT NULL AND uv.embedding IS NOT NULL
            THEN cv.embedding <=> uv.embedding
            ELSE 2.0
          END ASC,
          genre_match DESC,
          member_count DESC
        LIMIT 30
      `);

      for (const row of result.rows as any[]) {
        const hasSim = row.similarity_score !== null;
        entries.push({
          communityId: row.id,
          name: row.name,
          description: row.description,
          genres: row.genres || [],
          ownerUsername: row.owner_username,
          memberCount: Number(row.member_count),
          similarityScore: hasSim ? parseFloat(Number(row.similarity_score).toFixed(4)) : null,
          matchScore: Number(row.genre_match || 0),
          strategy: hasSim ? "vector" : (Number(row.genre_match) > 0 ? "genre" : "popular"),
        });
      }
    } else {
      // Fallback: genre or popular
      const prefsArray = userPreferences.length > 0
        ? `ARRAY[${userPreferences.map(p => `'${p.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : `ARRAY[]::text[]`;

      const result = await db.execute(sql`
        SELECT
          c.id,
          c.name,
          c.description,
          c.genres,
          u.username AS owner_username,
          (SELECT COUNT(*) FROM community_members cm2 WHERE cm2.community_id = c.id AND cm2.status = 'active') AS member_count,
          (
            SELECT COUNT(*)
            FROM unnest(c.genres) AS g
            WHERE g = ANY(${sql.raw(prefsArray)})
          ) AS genre_match
        FROM communities c
        JOIN users u ON u.id = c.owner_id
        WHERE c.owner_id != ${user.id}
          ${excludeClause}
        ORDER BY genre_match DESC, member_count DESC, c.created_at DESC
        LIMIT 30
      `);

      for (const row of result.rows as any[]) {
        entries.push({
          communityId: row.id,
          name: row.name,
          description: row.description,
          genres: row.genres || [],
          ownerUsername: row.owner_username,
          memberCount: Number(row.member_count),
          similarityScore: null,
          matchScore: Number(row.genre_match || 0),
          strategy: Number(row.genre_match) > 0 ? "genre" : "popular",
        });
      }
    }

    // Total communities
    const totalRes = await db.execute(sql`SELECT COUNT(*) as total FROM communities`);
    const totalCommunities = Number((totalRes.rows[0] as any).total);

    return { success: true, entries, hasVector, totalCommunities };
  } catch (error) {
    console.error("Error getting community recommendation log:", error);
    return { success: false, error: error instanceof Error ? error.message : "Error" };
  }
}
