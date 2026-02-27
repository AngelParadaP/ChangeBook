"use server";

import { db } from "@/db";
import { books, users, chatRooms } from "@/db/schema";
import { eq, or, and, ilike, ne, desc, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Buscar libros disponibles para intercambio (excluyendo los propios)
export async function searchAvailableBooks(query: string, limit = 20) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        if (!query || query.length < 2) {
            // Si no hay query, mostrar libros recientes (disponibles y ocupados, no intercambiados)
            const results = await db
                .select({
                    id: books.id,
                    title: books.title,
                    author: books.author,
                    imageUrl: books.imageUrl,
                    status: books.status,
                    genres: books.genres,
                    ownerId: books.ownerId,
                    ownerName: users.name,
                    ownerUsername: users.username,
                    ownerImageURL: users.imageURL,
                })
                .from(books)
                .leftJoin(users, eq(books.ownerId, users.id))
                .where(
                    and(
                        ne(books.ownerId, session.user.id),
                        ne(books.status, "intercambiado")
                    )
                )
                .orderBy(desc(books.createdAt))
                .limit(limit);

            return { success: true, books: results };
        }

        const searchPattern = `%${query}%`;

        const results = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                imageUrl: books.imageUrl,
                status: books.status,
                genres: books.genres,
                ownerId: books.ownerId,
                ownerName: users.name,
                ownerUsername: users.username,
                ownerImageURL: users.imageURL,
            })
            .from(books)
            .leftJoin(users, eq(books.ownerId, users.id))
            .where(
                and(
                    ne(books.ownerId, session.user.id),
                    or(
                        ilike(books.title, searchPattern),
                        ilike(books.author, searchPattern),
                        ilike(users.name, searchPattern),
                        ilike(users.username, searchPattern)
                    )
                )
            )
            .orderBy(desc(books.createdAt))
            .limit(limit);

        return { success: true, books: results };
    } catch (error) {
        console.error("Error searching available books:", error);
        return { success: false, error: "Error al buscar libros" };
    }
}

// Obtener los contactos de chat del usuario (para buscar "gente con la que has hablado")
export async function getChatContacts() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const userId = session.user.id;

        // Obtener todas las salas de chat del usuario
        const rooms = await db
            .select()
            .from(chatRooms)
            .where(
                or(
                    eq(chatRooms.participant1Id, userId),
                    eq(chatRooms.participant2Id, userId)
                )
            );

        // Obtener IDs de los otros participantes
        const otherUserIds = rooms.map((room) =>
            room.participant1Id === userId ? room.participant2Id : room.participant1Id
        );

        if (otherUserIds.length === 0) {
            return { success: true, contacts: [] };
        }

        // Obtener info de los contactos
        const contacts = await db
            .select({
                id: users.id,
                name: users.name,
                username: users.username,
                imageURL: users.imageURL,
            })
            .from(users)
            .where(inArray(users.id, otherUserIds));

        return { success: true, contacts };
    } catch (error) {
        console.error("Error fetching chat contacts:", error);
        return { success: false, error: "Error al obtener contactos" };
    }
}

// Obtener libros de un usuario específico (para cuando seleccionas a un contacto)
export async function getUserAvailableBooks(userId: string) {
    try {
        if (!userId) {
            return { success: false, error: "ID de usuario requerido" };
        }

        const userBooks = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                imageUrl: books.imageUrl,
                status: books.status,
                genres: books.genres,
                ownerId: books.ownerId,
            })
            .from(books)
            .where(eq(books.ownerId, userId))
            .orderBy(desc(books.createdAt));

        return { success: true, books: userBooks };
    } catch (error) {
        console.error("Error fetching user books:", error);
        return { success: false, error: "Error al obtener libros del usuario" };
    }
}

// Contar intercambios pendientes (para badge en sidebar)
export async function getPendingExchangeCount() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, count: 0 };
        }

        const { exchanges: exTable } = await import("@/db/schema");
        const { sql } = await import("drizzle-orm");

        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(exTable)
            .where(
                and(
                    eq(exTable.ownerId, session.user.id),
                    eq(exTable.status, "pendiente")
                )
            );

        return { success: true, count: Number(result[0]?.count || 0) };
    } catch (error) {
        console.error("Error counting pending exchanges:", error);
        return { success: false, count: 0 };
    }
}
