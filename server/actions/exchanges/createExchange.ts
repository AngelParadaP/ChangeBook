"use server";

import { db } from "@/db";
import { exchanges, books, users, notifications } from "@/db/schema";
import { eq, and, or, ne, lte, gte, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface CreateExchangeData {
    bookId: string;
    startDate: string; // ISO string
    endDate: string; // ISO string
    meetingLocation: string;
    meetingTime?: string; // HH:mm format
    note?: string;
}

export async function createExchange(data: CreateExchangeData) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No estás autenticado" };
        }

        const requesterId = session.user.id;

        // Validar que el libro existe y obtener el dueño
        const book = await db.query.books.findFirst({
            where: eq(books.id, data.bookId),
        });

        if (!book) {
            return { success: false, error: "Libro no encontrado" };
        }

        // No puedes solicitar tu propio libro
        if (book.ownerId === requesterId) {
            return { success: false, error: "No puedes solicitar tu propio libro" };
        }

        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        // Validaciones de fecha
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (startDate < now) {
            return { success: false, error: "La fecha de inicio no puede ser en el pasado" };
        }

        if (endDate <= startDate) {
            return { success: false, error: "La fecha de devolución debe ser posterior a la de entrega" };
        }

        // Máximo 30 días de préstamo
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
            return { success: false, error: "El préstamo no puede ser mayor a 30 días" };
        }

        // Verificar conflictos de fechas solo con intercambios ya aceptados o en curso
        // Las solicitudes pendientes pueden tener fechas superpuestas — el dueño decide cuál aceptar
        const activeStatuses = ["aceptado", "en_curso"] as const;
        const conflictingExchanges = await db
            .select()
            .from(exchanges)
            .where(
                and(
                    eq(exchanges.bookId, data.bookId),
                    inArray(exchanges.status, [...activeStatuses]),
                    lte(exchanges.startDate, endDate),
                    gte(exchanges.endDate, startDate)
                )
            );

        if (conflictingExchanges.length > 0) {
            return {
                success: false,
                error: "Las fechas seleccionadas chocan con otro intercambio existente. Por favor, elige otras fechas.",
            };
        }

        // Validar ubicación
        if (!data.meetingLocation || data.meetingLocation.trim().length === 0) {
            return { success: false, error: "Debes seleccionar un lugar de entrega" };
        }

        // Crear el intercambio
        const [newExchange] = await db
            .insert(exchanges)
            .values({
                bookId: data.bookId,
                ownerId: book.ownerId,
                requesterId,
                startDate,
                endDate,
                meetingLocation: data.meetingLocation.trim(),
                meetingTime: data.meetingTime?.trim() || null,
                requesterNote: data.note?.trim() || null,
                status: "pendiente",
            })
            .returning();

        // Obtener el nombre del solicitante para la notificación
        const requester = await db.query.users.findFirst({
            where: eq(users.id, requesterId),
        });
        const requesterName = requester?.username || requester?.name || "Alguien";

        // Notificar al dueño del libro
        const timeInfo = data.meetingTime ? ` a las ${data.meetingTime}` : "";
        await db.insert(notifications).values({
            userId: book.ownerId,
            type: "exchange_requested",
            message: `@${requesterName} quiere intercambiar "${book.title}". Lugar: ${data.meetingLocation.trim()}${timeInfo}. ¡Revisa la solicitud!`,
            exchangeId: newExchange.id,
        });

        // Trigger pusher event for instant notifications update
        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(`user-${book.ownerId}`, "new-notification", {});

        return {
            success: true,
            exchange: newExchange,
            message: "Solicitud de intercambio enviada exitosamente",
        };
    } catch (error) {
        console.error("Error creating exchange:", error);
        return {
            success: false,
            error: "Error al crear la solicitud. Intenta de nuevo.",
        };
    }
}
