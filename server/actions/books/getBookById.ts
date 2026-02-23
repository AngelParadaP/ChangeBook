"use server";

import { db } from "@/db";
import { books, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getBookById(bookId: string) {
    if (!bookId) {
        return { success: false, error: "ID de libro requerido", book: null };
    }

    try {
        const [result] = await db
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
                ownerName: users.name,
                ownerImageURL: users.imageURL,
            })
            .from(books)
            .leftJoin(users, eq(books.ownerId, users.id))
            .where(eq(books.id, bookId))
            .limit(1);

        if (!result) {
            return { success: false, error: "Libro no encontrado", book: null };
        }

        return { success: true, book: result };
    } catch (error) {
        console.error("Error fetching book:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error al cargar libro",
            book: null,
        };
    }
}
