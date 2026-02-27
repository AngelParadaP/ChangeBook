"use server";

import { db } from "@/db";
import { favorites, books, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Agregar un libro a favoritos
export async function addFavorite(bookId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const userId = session.user.id;

        // Verificar que el libro existe
        const book = await db.query.books.findFirst({
            where: eq(books.id, bookId),
        });

        if (!book) {
            return { success: false, error: "Libro no encontrado" };
        }

        // Verificar si ya está en favoritos
        const existing = await db.query.favorites.findFirst({
            where: and(
                eq(favorites.bookId, bookId),
                eq(favorites.userId, userId)
            ),
        });

        if (existing) {
            return { success: false, error: "Este libro ya está en tus favoritos" };
        }

        await db.insert(favorites).values({
            bookId,
            userId,
        });

        return { success: true, message: "Libro agregado a favoritos ❤️" };
    } catch (error) {
        console.error("Error adding favorite:", error);
        return { success: false, error: "Error al agregar a favoritos" };
    }
}

// Quitar un libro de favoritos
export async function removeFavorite(bookId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .delete(favorites)
            .where(
                and(
                    eq(favorites.bookId, bookId),
                    eq(favorites.userId, session.user.id)
                )
            );

        return { success: true, message: "Libro removido de favoritos" };
    } catch (error) {
        console.error("Error removing favorite:", error);
        return { success: false, error: "Error al quitar de favoritos" };
    }
}

// Verificar si un libro está en favoritos
export async function isFavorite(bookId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, isFavorite: false };
        }

        const existing = await db.query.favorites.findFirst({
            where: and(
                eq(favorites.bookId, bookId),
                eq(favorites.userId, session.user.id)
            ),
        });

        return { success: true, isFavorite: !!existing };
    } catch (error) {
        console.error("Error checking favorite:", error);
        return { success: false, isFavorite: false };
    }
}

// Obtener todos los favoritos del usuario actual
export async function getMyFavorites() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const results = await db
            .select({
                id: favorites.id,
                bookId: favorites.bookId,
                bookTitle: books.title,
                bookAuthor: books.author,
                bookImageUrl: books.imageUrl,
                bookStatus: books.status,
                bookGenres: books.genres,
                ownerId: books.ownerId,
                ownerName: users.name,
                ownerUsername: users.username,
                ownerImageURL: users.imageURL,
                createdAt: favorites.createdAt,
            })
            .from(favorites)
            .leftJoin(books, eq(favorites.bookId, books.id))
            .leftJoin(users, eq(books.ownerId, users.id))
            .where(eq(favorites.userId, session.user.id))
            .orderBy(desc(favorites.createdAt));

        return { success: true, favorites: results };
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return { success: false, error: "Error al obtener favoritos" };
    }
}
