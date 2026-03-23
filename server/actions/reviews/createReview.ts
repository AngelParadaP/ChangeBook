"use server";

import { db } from "@/db";
import { userReviews, exchanges } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createReview(
    exchangeId: string,
    reviewedId: string,
    rating: number,
    comment?: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const reviewerId = session.user.id;

        // Validar rating
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return { success: false, error: "La calificación debe ser un número entero entre 1 y 5" };
        }

        // No puedes reseñarte a ti mismo
        if (reviewerId === reviewedId) {
            return { success: false, error: "No puedes dejar una reseña sobre ti mismo" };
        }

        // Verificar que el exchange existe y está completado
        const exchange = await db.query.exchanges.findFirst({
            where: eq(exchanges.id, exchangeId),
        });

        if (!exchange) {
            return { success: false, error: "Intercambio no encontrado" };
        }

        if (exchange.status !== "completado") {
            return { success: false, error: "Solo puedes dejar reseñas en intercambios completados" };
        }

        // Verificar que el usuario fue parte del exchange
        const isOwner = exchange.ownerId === reviewerId;
        const isRequester = exchange.requesterId === reviewerId;

        if (!isOwner && !isRequester) {
            return { success: false, error: "No participaste en este intercambio" };
        }

        // Verificar que el reviewed es la otra parte del exchange
        const expectedReviewedId = isOwner ? exchange.requesterId : exchange.ownerId;
        if (reviewedId !== expectedReviewedId) {
            return { success: false, error: "Solo puedes reseñar a la otra persona del intercambio" };
        }

        // Verificar que no exista ya una reseña de este reviewer para este exchange
        const existingReview = await db.query.userReviews.findFirst({
            where: and(
                eq(userReviews.reviewerId, reviewerId),
                eq(userReviews.exchangeId, exchangeId)
            ),
        });

        if (existingReview) {
            return { success: false, error: "Ya dejaste una reseña para este intercambio" };
        }

        // Crear la reseña
        await db.insert(userReviews).values({
            reviewerId,
            reviewedId,
            exchangeId,
            rating,
            comment: comment?.trim() || null,
        });

        return { success: true, message: "¡Reseña enviada exitosamente!" };
    } catch (error) {
        console.error("Error creating review:", error);
        return { success: false, error: "Error al crear la reseña" };
    }
}
