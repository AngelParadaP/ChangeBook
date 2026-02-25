"use server";

import { db } from "@/db";
import { communityMembers, users } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";

interface GetCommunityMembersParams {
  communityId: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export async function getCommunityMembers({
  communityId,
  query = "",
  limit = 20,
  offset = 0,
}: GetCommunityMembersParams) {
  try {
    const conditions = [
      eq(communityMembers.communityId, communityId),
      eq(communityMembers.status, "active"),
    ];

    let userCondition = undefined;
    if (query && query.length >= 2) {
      const pattern = `%${query}%`;
      userCondition = or(
        ilike(users.name, pattern),
        ilike(users.username, pattern)
      );
    }

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        imageURL: users.imageURL,
        role: communityMembers.role,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(
        userCondition
          ? and(...conditions, userCondition)
          : and(...conditions)
      )
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const members = results.slice(0, limit);

    return { success: true, members, hasMore };
  } catch (error) {
    console.error("Error fetching community members:", error);
    return { success: false, error: "Error al cargar miembros", members: [], hasMore: false };
  }
}
