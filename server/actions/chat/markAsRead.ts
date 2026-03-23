"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface MarkAsReadResult {
    success: boolean;
    error?: string;
}

export async function markAsRead(roomId: string): Promise<MarkAsReadResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        // Marcar como leídos todos los mensajes de la sala que NO fueron enviados por el usuario actual
        const result = await db
            .update(messages)
            .set({ isRead: 1 })
            .where(
                and(
                    eq(messages.roomId, roomId),
                    ne(messages.senderId, currentUser.id),
                    eq(messages.isRead, 0)
                )
            )
            .returning();
            
        // Si efectivamente se actualizaron mensajes, le avisamos a nuestro panel global
        if (result.length > 0) {
            const { pusherServer } = await import("@/lib/pusher");
            // Notificar al propio usuario para limpiar instantaneamente el badge rojo
            await pusherServer.trigger(`user-${currentUser.id}`, "messages-read", { roomId });
            // De paso, también notificar a la otra persona en la sala para el indicador de leido si lo hay
            await pusherServer.trigger(`room-${roomId}`, "messages-read", {});
        }

        return { success: true };
    } catch (error) {
        console.error("Error in markAsRead:", error);
        return { success: false, error: "Error al marcar mensajes como leídos" };
    }
}
