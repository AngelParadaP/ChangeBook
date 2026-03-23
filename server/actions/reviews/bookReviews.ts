"use server";

import { db } from "@/db";
import { bookReviews, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface BookReviewItem {
    id: string;
    bookId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    reviewerId: string;
    reviewerName: string;
    reviewerUsername: string;
    reviewerImageURL: string | null;
}

export interface BookRatingData {
    averageRating: number;
    totalReviews: number;
    reviews: BookReviewItem[];
}

export async function createBookReview(
    bookId: string,
    rating: number,
    comment?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const reviewerId = session.user.id;

        // Validar rating
        if (rating < 1 || rating > 5) {
            return { success: false, error: "Calificación inválida" };
        }

        // Check if user already reviewed this book
        const existingReview = await db.query.bookReviews.findFirst({
            where: and(
                eq(bookReviews.reviewerId, reviewerId),
                eq(bookReviews.bookId, bookId)
            ),
        });

        if (existingReview) {
            return { success: false, error: "Ya has dejado una reseña para este libro" };
        }

        // Insertar la nueva reseña
        await db.insert(bookReviews).values({
            bookId,
            reviewerId,
            rating,
            comment: comment?.trim() || null,
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating book review:", error);
        return { success: false, error: "Error al guardar la reseña" };
    }
}

export async function getBookReviews(bookId: string): Promise<{ success: boolean; data?: BookRatingData; error?: string }> {
    try {
        const reviews = await db
            .select({
                id: bookReviews.id,
                bookId: bookReviews.bookId,
                rating: bookReviews.rating,
                comment: bookReviews.comment,
                createdAt: bookReviews.createdAt,
                reviewerId: bookReviews.reviewerId,
                reviewerName: users.name,
                reviewerUsername: users.username,
                reviewerImageURL: users.imageURL,
            })
            .from(bookReviews)
            .innerJoin(users, eq(bookReviews.reviewerId, users.id))
            .where(eq(bookReviews.bookId, bookId))
            .orderBy(desc(bookReviews.createdAt));

        if (reviews.length === 0) {
            return {
                success: true,
                data: {
                    averageRating: 0,
                    totalReviews: 0,
                    reviews: [],
                },
            };
        }

        const sumOfRatings = reviews.reduce((acc, current) => acc + current.rating, 0);
        const averageRating = sumOfRatings / reviews.length;
        const roundedAverage = Math.round(averageRating * 10) / 10;

        return {
            success: true,
            data: {
                averageRating: roundedAverage,
                totalReviews: reviews.length,
                reviews: reviews as BookReviewItem[],
            },
        };
    } catch (error) {
        console.error("Error getting book reviews:", error);
        return { success: false, error: "Error al obtener las reseñas" };
    }
}
