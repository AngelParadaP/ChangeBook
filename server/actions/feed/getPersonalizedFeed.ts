"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql, desc, eq } from "drizzle-orm";

interface FeedParams {
  page?: number;
  limit?: number;
}

export async function getPersonalizedFeed({ page = 0, limit = 10 }: FeedParams = {}) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return { success: false, error: "No autorizado", books: [] };
    }

    // Get user's preferences
    const [userData] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return { success: false, error: "Usuario no encontrado", books: [] };
    }

    const userPreferences = userData.preferences || [];
    const offset = page * limit;

    // If user has no preferences, just return recent books
    if (userPreferences.length === 0) {
      const recentBooks = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          publisher: books.publisher,
          year: books.year,
          imageUrl: books.imageUrl,
          description: books.description,
          genres: books.genres,
          status: books.status,
          createdAt: books.createdAt,
          ownerId: books.ownerId,
          ownerUsername: users.username,
        })
        .from(books)
        .innerJoin(users, eq(books.ownerId, users.id))
        .where(sql`${books.status} = 'disponible'`)
        .orderBy(desc(books.createdAt))
        .limit(limit)
        .offset(offset);

      return { success: true, books: recentBooks, hasMore: recentBooks.length === limit };
    }

    // Use GIN index for efficient array overlap matching
    // Create ARRAY constructor with escaped values
    const escapedPreferences = userPreferences.map(p => p.replace(/'/g, "''"));
    const preferencesArraySQL = `ARRAY[${escapedPreferences.map(p => `'${p}'`).join(',')}]::text[]`;

    const matchedBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        publisher: books.publisher,
        year: books.year,
        imageUrl: books.imageUrl,
        description: books.description,
        genres: books.genres,
        status: books.status,
        createdAt: books.createdAt,
        ownerId: books.ownerId,
        ownerUsername: users.username,
        // Calculate match score (number of overlapping genres)
        matchScore: sql<number>`(
          SELECT COUNT(*)
          FROM unnest(${books.genres}) AS genre
          WHERE genre = ANY(${sql.raw(preferencesArraySQL)})
        )`.as('match_score'),
      })
      .from(books)
      .innerJoin(users, eq(books.ownerId, users.id))
      .where(
        sql`${books.status} = 'disponible' AND ${books.genres} && ${sql.raw(preferencesArraySQL)}`
      )
      // Order by match score DESC, then by creation date DESC
      .orderBy(
        desc(sql`match_score`),
        desc(books.createdAt)
      )
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      books: matchedBooks,
      hasMore: matchedBooks.length === limit,
    };
  } catch (error) {
    console.error("Error fetching feed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar el feed",
      books: [],
    };
  }
}

