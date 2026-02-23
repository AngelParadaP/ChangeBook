"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { ilike, or, desc, eq } from "drizzle-orm";

export async function searchBooks(query: string, limit = 5) {
  if (!query || query.length < 2) {
    return { success: true, books: [] };
  }

  try {
    const searchPattern = `%${query}%`;

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
        or(
          ilike(books.title, searchPattern),
          ilike(books.author, searchPattern)
        )
      )
      .limit(limit)
      .orderBy(desc(books.createdAt));

    return { success: true, books: results };
  } catch (error) {
    console.error("Error searching books:", error);
    return { success: false, error: "Error al buscar libros" };
  }
}
