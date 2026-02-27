"use server";

import { db } from "@/db";
import { exchanges, books } from "@/db/schema";
import { eq, and, inArray, lte, gte } from "drizzle-orm";
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

        // Obtener el intercambio
        const exchange = await db.query.exchanges.findFirst({
            where: eq(exchanges.id, exchangeId),
        });

        if (!exchange) {
            return { success: false, error: "Intercambio no encontrado" };
        }

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
