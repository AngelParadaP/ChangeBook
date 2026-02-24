import { NextResponse } from "next/server";
import { db } from "@/db";
import { exchanges, books } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";

// Cron job: auto-start exchanges whose start date has arrived
// This can be triggered by:
// 1. Vercel Cron (add to vercel.json)
// 2. An external cron service calling this endpoint
// 3. Client-side polling from the exchanges page

export async function GET(request: Request) {
    try {
        // Optional: verify a secret key for security
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        // In production you'd want a proper secret check:
        // if (secret !== process.env.CRON_SECRET) {
        //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const now = new Date();

        // Find all accepted exchanges where the start date has passed
        const exchangesToStart = await db
            .select()
            .from(exchanges)
            .where(
                and(
                    eq(exchanges.status, "aceptado"),
                    lte(exchanges.startDate, now)
                )
            );

        let started = 0;
        let skipped = 0;

        for (const exchange of exchangesToStart) {
            // Check if there's already an en_curso exchange for this book
            const existingInProgress = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "en_curso")
                    )
                );

            if (existingInProgress.length > 0) {
                // Can't start — another exchange is already in progress for this book
                skipped++;
                continue;
            }

            // Transition to en_curso
            await db
                .update(exchanges)
                .set({
                    status: "en_curso",
                    updatedAt: new Date(),
                })
                .where(eq(exchanges.id, exchange.id));

            // Mark book as ocupado
            await db
                .update(books)
                .set({ status: "ocupado" })
                .where(eq(books.id, exchange.bookId));

            started++;
        }

        // Auto-complete: exchanges that are en_curso and end date has passed (at 23:59)
        // We set the end-of-day to 23:59 of the end date
        const exchangesEnCurso = await db
            .select()
            .from(exchanges)
            .where(
                eq(exchanges.status, "en_curso")
            );

        let completed = 0;

        for (const exchange of exchangesEnCurso) {
            const endDate = new Date(exchange.endDate);
            // Set the threshold to 23:59 of the end date
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 0, 0);

            // Only auto-complete if we've passed 23:59 of the end date
            if (now < endOfDay) {
                continue;
            }

            // Auto-complete
            await db
                .update(exchanges)
                .set({
                    status: "completado",
                    updatedAt: new Date(),
                })
                .where(eq(exchanges.id, exchange.id));

            // Check if there are remaining active exchanges for this book
            const remaining = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "en_curso")
                    )
                );

            // Also check if there's another accepted exchange starting tomorrow
            // (to avoid briefly marking the book as disponible)
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const nextDayExchange = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "aceptado"),
                        lte(exchanges.startDate, tomorrow)
                    )
                );

            // If no more active and no next-day exchange, set book back to disponible
            if (remaining.length === 0 && nextDayExchange.length === 0) {
                await db
                    .update(books)
                    .set({ status: "disponible" })
                    .where(eq(books.id, exchange.bookId));
            }

            completed++;
        }

        return NextResponse.json({
            success: true,
            message: `Cron ejecutado: ${started} iniciados, ${skipped} omitidos, ${completed} completados`,
            started,
            skipped,
            completed,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("Error in exchange cron:", error);
        return NextResponse.json(
            { success: false, error: "Error al ejecutar cron" },
            { status: 500 }
        );
    }
}
