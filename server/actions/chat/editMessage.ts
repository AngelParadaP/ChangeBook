"use server";

import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function editMessage(messageId: string, newContent: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        if (!newContent.trim()) {
            return { success: false, error: "El mensaje no puede estar vacío" };
        }

        // Verify ownership
        const [msg] = await db
            .select({ senderId: messages.senderId, roomId: messages.roomId })
            .from(messages)
            .where(eq(messages.id, messageId))
            .limit(1);

        if (!msg || msg.senderId !== currentUser.id) {
            return { success: false, error: "No puedes editar este mensaje" };
        }

        const [updated] = await db
            .update(messages)
            .set({ content: newContent.trim(), isEdited: true })
            .where(and(eq(messages.id, messageId), eq(messages.senderId, currentUser.id)))
            .returning();

        // Notify via Pusher
        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(`room-${msg.roomId}`, "message-edited", {
            id: updated.id,
            content: updated.content,
            isEdited: true,
        });

        return { success: true };
    } catch (error) {
        console.error("Error in editMessage:", error);
        return { success: false, error: "Error al editar mensaje" };
    }
}
