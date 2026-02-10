"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

interface SendMessageResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendMessage(roomId: string, content: string): Promise<SendMessageResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        if (!content.trim()) {
            return { success: false, error: "El mensaje no puede estar vacío" };
        }

        // TODO: Verificar que el usuario sea participante de la sala

        const newMessage = await db
            .insert(messages)
            .values({
                roomId,
                senderId: currentUser.id,
                content: content.trim(),
                isRead: 0,
            })
            .returning();

        revalidatePath(`/chat/${roomId}`);

        return { success: true, messageId: newMessage[0].id };
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return { success: false, error: "Error al enviar mensaje" };
    }
}
