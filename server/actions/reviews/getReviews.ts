"use server";

import { db } from "@/db";
import { userReviews, users, exchanges, books } from "@/db/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    reviewerName: string;
    reviewerUsername: string;
    reviewerImageURL: string | null;
    bookTitle: string;
}

export interface UserRatingData {
    averageRating: number;
    totalReviews: number;
    reviews: ReviewItem[];
}

// Obtener la calificación promedio y las reseñas de un usuario
export async function getUserReviews(userId: string): Promise<{ success: boolean; data?: UserRatingData; error?: string }> {
    try {
        // Obtener promedio y conteo
        const statsResult = await db
            .select({
                avgRating: avg(userReviews.rating),
                totalReviews: count(userReviews.id),
            })
            .from(userReviews)
            .where(eq(userReviews.reviewedId, userId));

        const stats = statsResult[0];
        const averageRating = stats?.avgRating ? parseFloat(Number(stats.avgRating).toFixed(1)) : 0;
        const totalReviews = Number(stats?.totalReviews || 0);

        // Obtener las reseñas con datos del reviewer y del libro
        const reviewsResult = await db
            .select({
                id: userReviews.id,
                rating: userReviews.rating,
                comment: userReviews.comment,
                createdAt: userReviews.createdAt,
                reviewerName: users.name,
                reviewerUsername: users.username,
                reviewerImageURL: users.imageURL,
                bookTitle: books.title,
            })
            .from(userReviews)
            .innerJoin(users, eq(userReviews.reviewerId, users.id))
            .innerJoin(exchanges, eq(userReviews.exchangeId, exchanges.id))
            .innerJoin(books, eq(exchanges.bookId, books.id))
            .where(eq(userReviews.reviewedId, userId))
            .orderBy(desc(userReviews.createdAt));

        return {
            success: true,
            data: {
                averageRating,
                totalReviews,
                reviews: reviewsResult,
            },
        };
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        return { success: false, error: "Error al obtener reseñas" };
    }
}

// Verificar si el usuario actual ya dejó una reseña para un exchange específico
export async function hasReviewedExchange(exchangeId: string): Promise<{ success: boolean; hasReviewed?: boolean; error?: string }> {
    try {
        // Importamos getServerSession aquí para evitar problemas de importación circular
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const existing = await db.query.userReviews.findFirst({
            where: and(
                eq(userReviews.reviewerId, session.user.id),
                eq(userReviews.exchangeId, exchangeId)
            ),
        });

        return { success: true, hasReviewed: !!existing };
    } catch (error) {
        console.error("Error checking review:", error);
        return { success: false, error: "Error al verificar reseña" };
    }
}
