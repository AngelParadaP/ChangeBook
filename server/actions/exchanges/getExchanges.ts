"use server";

import { db } from "@/db";
import { exchanges, books, users } from "@/db/schema";
import { eq, or, desc, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface ExchangeWithDetails {
    id: string;
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    bookImageUrl: string;
    ownerId: string;
    ownerName: string | null;
    ownerUsername: string | null;
    ownerImageURL: string | null;
    requesterId: string;
    requesterName: string | null;
    requesterUsername: string | null;
    requesterImageURL: string | null;
    status: string;
    startDate: Date;
    endDate: Date;
    meetingLocation: string;
    meetingTime: string | null;
    requesterNote: string | null;
    ownerNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Obtener todos los intercambios donde el usuario está involucrado
export async function getMyExchanges(filter?: "all" | "sent" | "received" | "active") {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const userId = session.user.id;

        // Alias para los joins de dueño y solicitante
        const ownerAlias = users;

        // Obtener intercambios
        let whereCondition;

        if (filter === "sent") {
            whereCondition = eq(exchanges.requesterId, userId);
        } else if (filter === "received") {
            whereCondition = eq(exchanges.ownerId, userId);
        } else if (filter === "active") {
            whereCondition = and(
                or(eq(exchanges.ownerId, userId), eq(exchanges.requesterId, userId)),
                inArray(exchanges.status, ["aceptado" as const, "en_curso" as const])
            );
        } else {
            whereCondition = or(
                eq(exchanges.ownerId, userId),
                eq(exchanges.requesterId, userId)
            );
        }

        const results = await db
            .select({
                id: exchanges.id,
                bookId: exchanges.bookId,
                bookTitle: books.title,
                bookAuthor: books.author,
                bookImageUrl: books.imageUrl,
                ownerId: exchanges.ownerId,
                ownerName: ownerAlias.name,
                ownerUsername: ownerAlias.username,
                ownerImageURL: ownerAlias.imageURL,
                requesterId: exchanges.requesterId,
                status: exchanges.status,
                startDate: exchanges.startDate,
                endDate: exchanges.endDate,
                meetingLocation: exchanges.meetingLocation,
                meetingTime: exchanges.meetingTime,
                requesterNote: exchanges.requesterNote,
                ownerNote: exchanges.ownerNote,
                createdAt: exchanges.createdAt,
                updatedAt: exchanges.updatedAt,
            })
            .from(exchanges)
            .leftJoin(books, eq(exchanges.bookId, books.id))
            .leftJoin(ownerAlias, eq(exchanges.ownerId, ownerAlias.id))
            .where(whereCondition)
            .orderBy(desc(exchanges.createdAt));

        // Ahora necesitamos obtener los datos del solicitante
        const requesterIds = [...new Set(results.map((r) => r.requesterId))];
        let requesterMap: Record<string, { name: string; username: string; imageURL: string | null }> = {};

        if (requesterIds.length > 0) {
            const requesters = await db
                .select({
                    id: users.id,
                    name: users.name,
                    username: users.username,
                    imageURL: users.imageURL,
                })
                .from(users)
                .where(inArray(users.id, requesterIds));

            requesterMap = requesters.reduce(
                (acc, r) => {
                    acc[r.id] = { name: r.name, username: r.username, imageURL: r.imageURL };
                    return acc;
                },
                {} as Record<string, { name: string; username: string; imageURL: string | null }>
            );
        }

        const exchangesWithDetails: ExchangeWithDetails[] = results.map((r) => ({
            ...r,
            bookTitle: r.bookTitle || "Libro eliminado",
            bookAuthor: r.bookAuthor || "",
            bookImageUrl: r.bookImageUrl || "",
            requesterName: requesterMap[r.requesterId]?.name || null,
            requesterUsername: requesterMap[r.requesterId]?.username || null,
            requesterImageURL: requesterMap[r.requesterId]?.imageURL || null,
        }));

        return { success: true, exchanges: exchangesWithDetails };
    } catch (error) {
        console.error("Error fetching exchanges:", error);
        return { success: false, error: "Error al obtener intercambios" };
    }
}
