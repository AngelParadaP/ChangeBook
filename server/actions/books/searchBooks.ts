"use server";

import { db } from "@/db";
import { books } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export async function searchBooks(query: string) {
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
        imageUrl: books.imageUrl,
        year: books.year,
        status: books.status,
      })
      .from(books)
      .where(
        or(
          ilike(books.title, searchPattern),
          ilike(books.author, searchPattern)
        )
      )
      .limit(5)
      .orderBy(desc(books.createdAt));

    return { success: true, books: results };
  } catch (error) {
    console.error("Error searching books:", error);
    return { success: false, error: "Error al buscar libros" };
  }
}
