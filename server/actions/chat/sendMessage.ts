"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendMessage(roomId: string, content: string, imageUrl?: string): Promise<SendMessageResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        if (!content.trim() && !imageUrl) {
            return { success: false, error: "El mensaje no puede estar vacío" };
        }

        // 1. Obtener los participantes de la sala para notificar al receptor
        const room = await db.query.chatRooms.findFirst({
            where: (chatRooms, { eq }) => eq(chatRooms.id, roomId),
        });

        if (!room) {
            return { success: false, error: "Sala no encontrada" };
        }

        const recipientId = room.participant1Id === currentUser.id 
            ? room.participant2Id 
            : room.participant1Id;

        // 2. Insertar el mensaje
        const newMessage = await db
            .insert(messages)
            .values({
                roomId,
                senderId: currentUser.id,
                content: content.trim() || (imageUrl ? "📷 Imagen" : ""),
                imageUrl: imageUrl || null,
                isRead: 0,
            })
            .returning();

        const insertedMessage = {
            ...newMessage[0],
            createdAt: newMessage[0].createdAt || new Date(),
        };

        // 3. Notificar via Pusher
        const { pusherServer } = await import("@/lib/pusher");

        // Notificar al canal de la sala de chat ("room-{roomId}") para que cargue el mensaje en tiempo real
        await pusherServer.trigger(`room-${roomId}`, "new-message", insertedMessage);

        // Notificar al canal global del usuario receptor ("user-{recipientId}") para encender su globo rojo del Sidebar
        await pusherServer.trigger(`user-${recipientId}`, "new-message", { roomId });

        return { success: true, messageId: newMessage[0].id };
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return { success: false, error: "Error al enviar mensaje" };
    }
}
