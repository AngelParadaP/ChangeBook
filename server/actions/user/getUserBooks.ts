"use server";

import { db } from "@/db";
import { books } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserBooks(userId: string) {
  try {
    const userBooks = await db
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
      })
      .from(books)
      .where(eq(books.ownerId, userId))
      .orderBy(desc(books.createdAt));

    return { success: true, books: userBooks };
  } catch (error) {
    console.error("Error fetching user books:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar libros",
      books: [],
    };
  }
}
