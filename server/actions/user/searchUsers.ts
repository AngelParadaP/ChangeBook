"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { ilike, or, ne, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function searchUsers(query: string, limit = 8) {
    if (!query || query.length < 2) {
        return { success: true, users: [] };
    }

    try {
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        const searchPattern = `%${query}%`;

        const searchCondition = or(
            ilike(users.studentCode, searchPattern),
            ilike(users.username, searchPattern),
            ilike(users.name, searchPattern)
        );

        // Exclude current user from results
        const whereCondition = currentUserId
            ? and(searchCondition, ne(users.id, currentUserId))
            : searchCondition;

        const results = await db
            .select({
                id: users.id,
                name: users.name,
                username: users.username,
                studentCode: users.studentCode,
                imageURL: users.imageURL,
                preferences: users.preferences,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(whereCondition)
            .limit(limit);

        return { success: true, users: results };
    } catch (error) {
        console.error("Error searching users:", error);
        return { success: false, error: "Error al buscar usuarios" };
    }
}
