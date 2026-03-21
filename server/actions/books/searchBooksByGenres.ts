"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { eq, arrayOverlaps, and, isNull, lt, or } from "drizzle-orm";

/**
 * Search books by genres with relevance-based ordering.
 * Books matching more of the selected genres appear first.
 * A random factor is added so results don't always show in the same order
 * (while still respecting genre-match priority).
 */
export async function searchBooksByGenres(genres: string[], limit = 40) {
    if (!genres || genres.length === 0) {
        return { success: true, books: [] };
    }

    try {
        // Find all books that have at least one matching genre
        const results = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                publisher: books.publisher,
                imageUrl: books.imageUrl,
                year: books.year,
                description: books.description,
                genres: books.genres,
                status: books.status,
                createdAt: books.createdAt,
                ownerId: books.ownerId,
                ownerUsername: users.username,
            })
            .from(books)
            .leftJoin(users, eq(books.ownerId, users.id))
            .where(
                and(
                    arrayOverlaps(books.genres, genres),
                    eq(users.banned, false),
                    or(isNull(users.suspendedUntil), lt(users.suspendedUntil, new Date()))
                )
            )
            .limit(limit);

        // Calculate match score for each book and shuffle within same score
        const scored = results.map((book) => {
            const matchCount = book.genres.filter((g) => genres.includes(g)).length;
            return {
                ...book,
                matchCount,
                // Random factor for shuffling within same priority tier
                rand: Math.random(),
            };
        });

        // Sort: highest match count first, then random within same tier
        scored.sort((a, b) => {
            if (b.matchCount !== a.matchCount) {
                return b.matchCount - a.matchCount;
            }
            return a.rand - b.rand;
        });

        // Return without internal fields
        const sorted = scored.map(({ matchCount, rand, ...book }) => ({
            ...book,
            matchCount, // Keep this so the UI can show match info
        }));

        return { success: true, books: sorted };
    } catch (error) {
        console.error("Error searching books by genres:", error);
        return { success: false, error: "Error al buscar libros por género" };
    }
}
