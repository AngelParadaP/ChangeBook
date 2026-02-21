"use server";

import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, count, eq, ilike, inArray } from "drizzle-orm";

interface GetCommunitiesParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function getCommunities({ query = "", page = 0, limit = 20 }: GetCommunitiesParams = {}) {
  try {
    const offset = page * limit;

    let whereClause = undefined;
    if (query) {
      whereClause = ilike(communities.name, `%${query}%`);
    }

    const results = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        imageUrl: communities.imageUrl,
        memberCount: count(communityMembers.userId).as("member_count"),
      })
      .from(communities)
      .leftJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(whereClause)
      .groupBy(communities.id)
      .limit(limit)
      .offset(offset);

    // Get membership status if user is logged in
    const user = await getCurrentUser();
    let memberCommunityIds = new Set<string>();

    if (user?.id && results.length > 0) {
        const ids = results.map(c => c.id);
        const memberships = await db.select({ cid: communityMembers.communityId })
            .from(communityMembers)
            .where(and(eq(communityMembers.userId, user.id), inArray(communityMembers.communityId, ids)));
        
        memberships.forEach(m => memberCommunityIds.add(m.cid));
    }

    // Drizzle count returns string in some drivers, cast to number
    const formattedResults = results.map(c => ({
      ...c,
      memberCount: Number(c.memberCount),
      isMember: memberCommunityIds.has(c.id)
    }));

    return { success: true, communities: formattedResults };
  } catch (error) {
    console.error("Error fetching communities:", error);
    return { success: false, error: "Error al cargar comunidades", communities: [] };
  }
}
