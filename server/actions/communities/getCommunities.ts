"use server";

import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, count, eq, ilike, inArray, notInArray, arrayOverlaps } from "drizzle-orm";

interface GetCommunitiesParams {
  query?: string;
  page?: number;
  limit?: number;
  filter?: "all" | "mine" | "discover";
  genres?: string[];
}

export async function getCommunities({ query = "", page = 0, limit = 20, filter = "all", genres }: GetCommunitiesParams = {}) {
  try {
    const offset = page * limit;
    const user = await getCurrentUser();

    // Build conditions array
    const conditions = [];

    if (query) {
      conditions.push(ilike(communities.name, `%${query}%`));
    }

    // If genres are provided and not empty, add arrayOverlaps filter
    if (genres && genres.length > 0) {
      conditions.push(arrayOverlaps(communities.genres, genres));
    }

    // For "mine" and "discover" filters, we need the user's community IDs
    if (user?.id && (filter === "mine" || filter === "discover")) {
      const userMemberships = await db
        .select({ communityId: communityMembers.communityId })
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.status, "active")));

      const userCommunityIds = userMemberships.map(m => m.communityId);

      if (filter === "mine") {
        if (userCommunityIds.length === 0) {
          return { success: true, communities: [] };
        }
        conditions.push(inArray(communities.id, userCommunityIds));
      } else if (filter === "discover") {
        if (userCommunityIds.length > 0) {
          conditions.push(notInArray(communities.id, userCommunityIds));
        }
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        imageUrl: communities.imageUrl,
        memberCount: count(communityMembers.userId).as("member_count"),
      })
      .from(communities)
      .leftJoin(communityMembers, and(eq(communities.id, communityMembers.communityId), eq(communityMembers.status, "active")))
      .where(whereClause)
      .groupBy(communities.id)
      .limit(limit)
      .offset(offset);

    // Get membership status if user is logged in
    let memberCommunityIds = new Set<string>();

    if (user?.id && results.length > 0) {
      const ids = results.map(c => c.id);
      const memberships = await db.select({ cid: communityMembers.communityId })
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.status, "active"), inArray(communityMembers.communityId, ids)));
      
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

