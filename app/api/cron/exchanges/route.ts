import { NextResponse } from "next/server";
import { db } from "@/db";
import { exchanges, books, notifications, users } from "@/db/schema";
import { eq, and, lte, gte, ne } from "drizzle-orm";


// Cron job: auto-start exchanges, auto-complete, and send return reminders
// Triggered by Vercel Cron daily at midnight (vercel.json)

export async function GET(request: Request) {
    try {
        const now = new Date();

        const todayStartForCancel = new Date(now);
        todayStartForCancel.setHours(0, 0, 0, 0);

        // ─── 0. Auto-cancel pending exchanges past their start date ─────────
        const pendingExchangesToCancel = await db
            .select()
            .from(exchanges)
            .where(
                and(
                    eq(exchanges.status, "pendiente"),
                    lte(exchanges.startDate, new Date(todayStartForCancel.getTime() - 1))
                )
            );

        let autoCancelled = 0;

        for (const exchange of pendingExchangesToCancel) {
            await db
                .update(exchanges)
                .set({
                    status: "cancelado",
                    ownerNote: "Solicitud expirada automáticamente (el dueño no respondió a tiempo la fecha solicitada).",
                    updatedAt: new Date(),
                })
                .where(eq(exchanges.id, exchange.id));

            const bookInfo = await db.query.books.findFirst({
                where: eq(books.id, exchange.bookId),
            });
            const bTitle = bookInfo?.title || "el libro";

            await db.insert(notifications).values({
                userId: exchange.requesterId,
                type: "exchange_auto_rejected" as const,
                message: `La solicitud por "${bTitle}" fue cancelada automáticamente porque el dueño no aceptó a tiempo.`,
                exchangeId: exchange.id,
            });

            autoCancelled++;
        }

        // ─── 1. Auto-start accepted exchanges whose start date has arrived ───
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
                skipped++;
                continue;
            }

            await db
                .update(exchanges)
                .set({
                    status: "en_curso",
                    updatedAt: new Date(),
                })
                .where(eq(exchanges.id, exchange.id));

            await db
                .update(books)
                .set({ status: "ocupado" })
                .where(eq(books.id, exchange.bookId));

            started++;
        }

        // ─── 2. Auto-complete exchanges past their end date ─────────────────
        const exchangesEnCurso = await db
            .select()
            .from(exchanges)
            .where(
                eq(exchanges.status, "en_curso")
            );

        let completed = 0;

        for (const exchange of exchangesEnCurso) {
            const endDate = new Date(exchange.endDate);
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 0, 0);

            if (now < endOfDay) {
                continue;
            }

            await db
                .update(exchanges)
                .set({
                    status: "completado",
                    updatedAt: new Date(),
                })
                .where(eq(exchanges.id, exchange.id));

            const remaining = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "en_curso")
                    )
                );

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

            if (remaining.length === 0 && nextDayExchange.length === 0) {
                await db
                    .update(books)
                    .set({ status: "disponible" })
                    .where(eq(books.id, exchange.bookId));
            }

            completed++;
        }

        // ─── 3. Send return reminder notifications ──────────────────────────
        // Find exchanges that are "en_curso" and their endDate is tomorrow or today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        // Get all in-progress exchanges
        const activeExchanges = await db
            .select()
            .from(exchanges)
            .where(
                eq(exchanges.status, "en_curso")
            );

        let remindersSent = 0;

        for (const exchange of activeExchanges) {
            const endDate = new Date(exchange.endDate);
            endDate.setHours(0, 0, 0, 0);

            const isTomorrow = endDate.getTime() === tomorrowStart.getTime();
            const isToday = endDate.getTime() === todayStart.getTime();

            if (!isTomorrow && !isToday) continue;

            // Get book title
            const book = await db.query.books.findFirst({
                where: eq(books.id, exchange.bookId),
            });
            const bookTitle = book?.title || "Libro";

            // Get names for personalized messages
            const owner = await db.query.users.findFirst({
                where: eq(users.id, exchange.ownerId),
            });
            const requester = await db.query.users.findFirst({
                where: eq(users.id, exchange.requesterId),
            });
            const ownerName = owner?.username || owner?.name || "el dueño";
            const requesterName = requester?.username || requester?.name || "el solicitante";

            const locationInfo = exchange.meetingLocation
                ? ` en ${exchange.meetingLocation}`
                : "";
            const timeInfo = exchange.meetingTime
                ? ` a las ${exchange.meetingTime}`
                : "";

            if (isTomorrow) {
                // Check if we already sent this reminder today (avoid duplicates)
                const existingReminder = await db
                    .select()
                    .from(notifications)
                    .where(
                        and(
                            eq(notifications.exchangeId, exchange.id),
                            eq(notifications.type, "exchange_reminder_tomorrow"),
                            gte(notifications.createdAt, todayStart),
                            lte(notifications.createdAt, todayEnd)
                        )
                    );

                if (existingReminder.length === 0) {
                    // Notify both owner and requester
                    await db.insert(notifications).values([
                        {
                            userId: exchange.ownerId,
                            type: "exchange_reminder_tomorrow" as const,
                            message: `¡Mañana se entrega "${bookTitle}"! Ponte de acuerdo con @${requesterName} para la hora y lugar de recogida.`,
                            exchangeId: exchange.id,
                        },
                        {
                            userId: exchange.requesterId,
                            type: "exchange_reminder_tomorrow" as const,
                            message: `¡Mañana devuelves "${bookTitle}"! Ponte de acuerdo con @${ownerName} para la hora y lugar de recogida.`,
                            exchangeId: exchange.id,
                        },
                    ]);
                    remindersSent += 2;
                }
            }

            if (isToday) {
                const existingReminder = await db
                    .select()
                    .from(notifications)
                    .where(
                        and(
                            eq(notifications.exchangeId, exchange.id),
                            eq(notifications.type, "exchange_reminder_today"),
                            gte(notifications.createdAt, todayStart),
                            lte(notifications.createdAt, todayEnd)
                        )
                    );

                if (existingReminder.length === 0) {
                    await db.insert(notifications).values([
                        {
                            userId: exchange.ownerId,
                            type: "exchange_reminder_today" as const,
                            message: `¡Hoy se devuelve "${bookTitle}"! Coordina con @${requesterName} para recoger tu libro. ¡No lo olviden!`,
                            exchangeId: exchange.id,
                        },
                        {
                            userId: exchange.requesterId,
                            type: "exchange_reminder_today" as const,
                            message: `¡Hoy devuelves "${bookTitle}"! Coordina con @${ownerName} la entrega del libro. ¡No lo olviden!`,
                            exchangeId: exchange.id,
                        },
                    ]);
                    remindersSent += 2;
                }
            }
        }
        
        // ============================================================================
        // ─── 4. Mantenimiento Real-Time con Pusher ──────────────────────────
        // Para el autokick y recordatorios, notificar a los websockets activos
        // ============================================================================
        const { pusherServer } = await import("@/lib/pusher");
        
        // Recoger a todas las victimas del auto-kick
        for (const exchange of pendingExchangesToCancel) {
             await pusherServer.trigger(`user-${exchange.requesterId}`, "new-notification", {});
             await pusherServer.trigger(`user-${exchange.ownerId}`, "new-notification", {});
        }
        
        // A los que sus libros arrancaron/completaron hoy
        for (const exchange of exchangesToStart) {
             await pusherServer.trigger(`user-${exchange.requesterId}`, "new-notification", {});
             await pusherServer.trigger(`user-${exchange.ownerId}`, "new-notification", {});
        }
        
        for (const exchange of exchangesEnCurso) {
            const endDate = new Date(exchange.endDate);
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 0, 0);
            if (now >= endOfDay) {
                 await pusherServer.trigger(`user-${exchange.requesterId}`, "new-notification", {});
                 await pusherServer.trigger(`user-${exchange.ownerId}`, "new-notification", {});
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cron ejecutado: ${autoCancelled} cancelados auto, ${started} iniciados, ${skipped} omitidos, ${completed} completados, ${remindersSent} recordatorios enviados`,
            autoCancelled,
            started,
            skipped,
            completed,
            remindersSent,
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
