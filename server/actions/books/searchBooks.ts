"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { ilike, or, desc, eq, and, arrayOverlaps } from "drizzle-orm";

export async function searchBooks(query: string, limit = 5, genres?: string[]) {
  if (!query || query.length < 2) {
    return { success: true, books: [] };
  }

  try {
    const searchPattern = `%${query}%`;

    // Build the where conditions
    const textFilter = or(
      ilike(books.title, searchPattern),
      ilike(books.author, searchPattern)
    );

    // If genres are provided and not empty, add arrayOverlaps filter
    const genreFilter =
      genres && genres.length > 0
        ? arrayOverlaps(books.genres, genres)
        : undefined;

    const whereClause = genreFilter
      ? and(textFilter, genreFilter)
      : textFilter;

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
      .where(whereClause)
      .limit(limit)
      .orderBy(desc(books.createdAt));

    return { success: true, books: results };
  } catch (error) {
    console.error("Error searching books:", error);
    return { success: false, error: "Error al buscar libros" };
  }
}
