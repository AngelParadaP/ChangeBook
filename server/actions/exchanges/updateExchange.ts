"use server";

import { db } from "@/db";
import { exchanges, books, notifications } from "@/db/schema";
import { eq, and, inArray, lte, gte, ne } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Actualizar el estado de un intercambio (aceptar, rechazar, completar, cancelar)
export async function updateExchangeStatus(
    exchangeId: string,
    newStatus: "aceptado" | "rechazado" | "en_curso" | "completado" | "cancelado",
    ownerNote?: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const userId = session.user.id;

        // Obtener el intercambio con datos del libro
        const exchange = await db.query.exchanges.findFirst({
            where: eq(exchanges.id, exchangeId),
        });

        if (!exchange) {
            return { success: false, error: "Intercambio no encontrado" };
        }

        // Obtener el título del libro para las notificaciones
        const book = await db.query.books.findFirst({
            where: eq(books.id, exchange.bookId),
        });
        const bookTitle = book?.title || "Libro";

        // Validar permisos según la acción
        const isOwner = exchange.ownerId === userId;
        const isRequester = exchange.requesterId === userId;

        if (!isOwner && !isRequester) {
            return { success: false, error: "No tienes permisos para esta acción" };
        }

        // Validar transiciones de estado
        const validTransitions: Record<string, { allowed: string[]; requiredRole: "owner" | "requester" | "any" }> = {
            aceptado: { allowed: ["pendiente"], requiredRole: "owner" },
            rechazado: { allowed: ["pendiente"], requiredRole: "owner" },
            en_curso: { allowed: ["aceptado"], requiredRole: "owner" },
            completado: { allowed: ["en_curso"], requiredRole: "owner" },
            cancelado: { allowed: ["pendiente", "aceptado"], requiredRole: "any" },
        };

        const transition = validTransitions[newStatus];
        if (!transition) {
            return { success: false, error: "Estado no válido" };
        }

        if (!transition.allowed.includes(exchange.status)) {
            return {
                success: false,
                error: `No se puede cambiar de "${exchange.status}" a "${newStatus}"`,
            };
        }

        if (transition.requiredRole === "owner" && !isOwner) {
            return { success: false, error: "Solo el dueño del libro puede realizar esta acción" };
        }

        if (transition.requiredRole === "requester" && !isRequester) {
            return { success: false, error: "Solo el solicitante puede realizar esta acción" };
        }

        // Si se acepta, verificar que no haya conflictos de fechas con otros intercambios aceptados
        if (newStatus === "aceptado") {
            const conflicting = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        inArray(exchanges.status, ["aceptado" as const, "en_curso" as const]),
                        lte(exchanges.startDate, exchange.endDate),
                        gte(exchanges.endDate, exchange.startDate)
                    )
                );

            if (conflicting.length > 0) {
                return {
                    success: false,
                    error: "Ya existe un intercambio aceptado que choca con estas fechas",
                };
            }
        }

        // Si se va a iniciar (en_curso), varias validaciones
        if (newStatus === "en_curso") {
            // 1. No puede haber otro intercambio en_curso para el mismo libro
            const alreadyInProgress = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "en_curso")
                    )
                );

            if (alreadyInProgress.length > 0) {
                return {
                    success: false,
                    error: "Ya hay otro intercambio en curso para este libro. Debes completarlo o cancelarlo primero.",
                };
            }

            // 2. No puede iniciar un intercambio con fecha más lejana si hay otro aceptado con fecha más cercana
            const earlierAccepted = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "aceptado")
                    )
                );

            const hasEarlierExchange = earlierAccepted.some((e) => {
                if (e.id === exchange.id) return false; // Skip this one
                const otherStart = new Date(e.startDate);
                const thisStart = new Date(exchange.startDate);
                return otherStart < thisStart;
            });

            if (hasEarlierExchange) {
                return {
                    success: false,
                    error: "Tienes otro intercambio aceptado con una fecha de inicio más cercana. Debes iniciar, cancelar o completar ese intercambio primero.",
                };
            }
        }

        // Si se inicia prematuramente (antes de la fecha de inicio original),
        // actualizar la fecha de inicio para que las fechas bloqueadas reflejen la ocupación real
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const originalStart = new Date(exchange.startDate);
        originalStart.setHours(0, 0, 0, 0);

        const updateData: Record<string, unknown> = {
            status: newStatus,
            ownerNote: ownerNote?.trim() || exchange.ownerNote,
            updatedAt: new Date(),
        };

        // Si se inicia antes de la fecha original, ajustar startDate a hoy
        if (newStatus === "en_curso" && now < originalStart) {
            updateData.startDate = now;
        }

        // Actualizar estado
        await db
            .update(exchanges)
            .set(updateData)
            .where(eq(exchanges.id, exchangeId));

        // ─── Auto-rechazar solicitudes pendientes con fechas conflictivas ─────
        if (newStatus === "aceptado") {
            const pendingConflicts = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        eq(exchanges.status, "pendiente"),
                        ne(exchanges.id, exchangeId),
                        lte(exchanges.startDate, exchange.endDate),
                        gte(exchanges.endDate, exchange.startDate)
                    )
                );

            if (pendingConflicts.length > 0) {
                const conflictIds = pendingConflicts.map((c) => c.id);

                // Rechazar todas las solicitudes conflictivas
                await db
                    .update(exchanges)
                    .set({
                        status: "rechazado",
                        ownerNote: "Fechas no disponibles — otro intercambio fue aceptado para estas fechas.",
                        updatedAt: new Date(),
                    })
                    .where(inArray(exchanges.id, conflictIds));

                // Crear notificación para cada solicitante rechazado
                const notificationValues = pendingConflicts.map((conflict) => ({
                    userId: conflict.requesterId,
                    type: "exchange_auto_rejected" as const,
                    message: `Tu solicitud para "${bookTitle}" fue rechazada automáticamente porque otro intercambio con fechas similares fue aceptado.`,
                    exchangeId: conflict.id,
                }));

                await db.insert(notifications).values(notificationValues);
            }
        }

        // ─── Crear notificación para el solicitante ──────────────────────────
        if (newStatus === "aceptado") {
            await db.insert(notifications).values({
                userId: exchange.requesterId,
                type: "exchange_accepted",
                message: `¡Tu solicitud para "${bookTitle}" fue aceptada! Revisa los detalles del intercambio.`,
                exchangeId: exchange.id,
            });
        } else if (newStatus === "rechazado") {
            await db.insert(notifications).values({
                userId: exchange.requesterId,
                type: "exchange_rejected",
                message: `Tu solicitud para "${bookTitle}" fue rechazada.${ownerNote ? ` Nota: ${ownerNote}` : ""}`,
                exchangeId: exchange.id,
            });
        } else if (newStatus === "en_curso") {
            await db.insert(notifications).values({
                userId: exchange.requesterId,
                type: "exchange_started",
                message: `¡El intercambio de "${bookTitle}" ha comenzado! Coordina la entrega.`,
                exchangeId: exchange.id,
            });
        } else if (newStatus === "completado") {
            await db.insert(notifications).values({
                userId: exchange.requesterId,
                type: "exchange_completed",
                message: `El intercambio de "${bookTitle}" fue marcado como completado. ¡Gracias!`,
                exchangeId: exchange.id,
            });
        } else if (newStatus === "cancelado") {
            // Notificar a la otra parte (si el dueño cancela, notificar al solicitante y viceversa)
            const notifyUserId = isOwner ? exchange.requesterId : exchange.ownerId;
            await db.insert(notifications).values({
                userId: notifyUserId,
                type: "exchange_cancelled",
                message: `El intercambio de "${bookTitle}" fue cancelado.`,
                exchangeId: exchange.id,
            });
        }

        // Si se inicia (en_curso), actualizar el estado del libro a "ocupado"
        if (newStatus === "en_curso") {
            await db
                .update(books)
                .set({ status: "ocupado" })
                .where(eq(books.id, exchange.bookId));
        }

        // Si se completa o cancela, verificar si hay más intercambios activos;
        // si no, devolver el libro a "disponible"
        if (newStatus === "completado" || newStatus === "cancelado" || newStatus === "rechazado") {
            const remainingActive = await db
                .select()
                .from(exchanges)
                .where(
                    and(
                        eq(exchanges.bookId, exchange.bookId),
                        inArray(exchanges.status, ["aceptado" as const, "en_curso" as const]),
                    )
                );

            // Si este era el único activo, liberar el libro
            if (remainingActive.length === 0) {
                await db
                    .update(books)
                    .set({ status: "disponible" })
                    .where(eq(books.id, exchange.bookId));
            }
        }

        const statusMessages: Record<string, string> = {
            aceptado: "Intercambio aceptado exitosamente",
            rechazado: "Intercambio rechazado",
            en_curso: "Intercambio iniciado - ¡entrega el libro!",
            completado: "Intercambio completado exitosamente",
            cancelado: "Intercambio cancelado",
        };

        return {
            success: true,
            message: statusMessages[newStatus] || "Estado actualizado",
        };
    } catch (error) {
        console.error("Error updating exchange:", error);
        return { success: false, error: "Error al actualizar el intercambio" };
    }
}
