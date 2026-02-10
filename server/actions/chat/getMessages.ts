"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, desc, ne, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface Message {
    id: string;
    content: string;
    senderId: string;
    isRead: number;
    createdAt: Date;
}

interface GetMessagesResult {
    success: boolean;
    messages?: Message[];
    error?: string;
}

export async function getMessages(
    roomId: string,
    limit: number = 50,
    autoMarkAsRead: boolean = true
): Promise<GetMessagesResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        // TODO: Verificar que el usuario sea participante de la sala

        const roomMessages = await db
            .select({
                id: messages.id,
                content: messages.content,
                senderId: messages.senderId,
                isRead: messages.isRead,
                createdAt: messages.createdAt,
            })
            .from(messages)
            .where(eq(messages.roomId, roomId))
            .orderBy(desc(messages.createdAt))
            .limit(limit);

        // Marcar mensajes como leídos automáticamente si está habilitado
        // Esto reduce las peticiones al servidor al combinar operaciones
        if (autoMarkAsRead && roomMessages.length > 0) {
            await db
                .update(messages)
                .set({ isRead: 1 })
                .where(
                    and(
                        eq(messages.roomId, roomId),
                        ne(messages.senderId, currentUser.id),
                        eq(messages.isRead, 0)
                    )
                );
        }

        // Invertir para mostrar del más antiguo al más nuevo
        return {
            success: true,
            messages: roomMessages.reverse().map(msg => ({
                ...msg,
                createdAt: msg.createdAt || new Date(),
            }))
        };
    } catch (error) {
        console.error("Error in getMessages:", error);
        return { success: false, error: "Error al obtener mensajes" };
    }
}
