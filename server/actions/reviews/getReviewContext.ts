"use server";

import { db } from "@/db";
import { exchanges, users, books, userReviews } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface ReviewContextData {
    exchangeId: string;
    reviewedUserId: string;
    reviewedUserName: string;
    bookTitle: string;
    alreadyReviewed: boolean;
}

// Obtener los datos necesarios para abrir un ReviewModal desde una notificación
export async function getReviewContext(exchangeId: string): Promise<{ success: boolean; data?: ReviewContextData; error?: string }> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const exchange = await db.query.exchanges.findFirst({
            where: eq(exchanges.id, exchangeId),
        });

        if (!exchange) {
            return { success: false, error: "Intercambio no encontrado" };
        }

        // Determinar quién es el otro usuario (el que recibirá la reseña)
        const currentUserId = session.user.id;
        const isOwner = exchange.ownerId === currentUserId;
        const isRequester = exchange.requesterId === currentUserId;

        if (!isOwner && !isRequester) {
            return { success: false, error: "No participaste en este intercambio" };
        }

        const reviewedUserId = isOwner ? exchange.requesterId : exchange.ownerId;

        // Obtener nombre del usuario a reseñar
        const reviewedUser = await db.query.users.findFirst({
            where: eq(users.id, reviewedUserId),
            columns: { name: true },
        });

        // Obtener título del libro
        const book = await db.query.books.findFirst({
            where: eq(books.id, exchange.bookId),
            columns: { title: true },
        });

        // Verificar si ya dejó reseña para este exchange
        const existingReview = await db.query.userReviews.findFirst({
            where: and(
                eq(userReviews.reviewerId, currentUserId),
                eq(userReviews.exchangeId, exchangeId)
            ),
        });

        return {
            success: true,
            data: {
                exchangeId: exchange.id,
                reviewedUserId,
                reviewedUserName: reviewedUser?.name || "Usuario",
                bookTitle: book?.title || "Libro",
                alreadyReviewed: !!existingReview,
            },
        };
    } catch (error) {
        console.error("Error getting review context:", error);
        return { success: false, error: "Error al obtener datos de la reseña" };
    }
}
