"use server";

import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { ilike, and, count, eq } from "drizzle-orm";

export async function searchCommunities(query: string, limit = 4) {
    if (!query || query.length < 2) {
        return { success: true, communities: [] };
    }

    try {
        const searchPattern = `%${query}%`;

        const results = await db
            .select({
                id: communities.id,
                name: communities.name,
                description: communities.description,
                imageUrl: communities.imageUrl,
                memberCount: count(communityMembers.userId).as("member_count"),
            })
            .from(communities)
            .leftJoin(
                communityMembers,
                and(
                    eq(communities.id, communityMembers.communityId),
                    eq(communityMembers.status, "active")
                )
            )
            .where(ilike(communities.name, searchPattern))
            .groupBy(communities.id)
            .limit(limit);

        const formattedResults = results.map((c) => ({
            ...c,
            memberCount: Number(c.memberCount),
        }));

        return { success: true, communities: formattedResults };
    } catch (error) {
        console.error("Error searching communities:", error);
        return { success: false, error: "Error al buscar comunidades", communities: [] };
    }
}
