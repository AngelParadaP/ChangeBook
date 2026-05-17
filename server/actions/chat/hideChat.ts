"use server";

import { db } from "@/db";
import { hiddenChatRooms } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function hideChat(roomId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        // Upsert: insert if not exists
        await db
            .insert(hiddenChatRooms)
            .values({ userId: currentUser.id, roomId })
            .onConflictDoNothing();

        return { success: true };
    } catch (error) {
        console.error("Error in hideChat:", error);
        return { success: false, error: "Error al ocultar chat" };
    }
}

export async function unhideChat(roomId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .delete(hiddenChatRooms)
            .where(
                and(
                    eq(hiddenChatRooms.userId, currentUser.id),
                    eq(hiddenChatRooms.roomId, roomId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error in unhideChat:", error);
        return { success: false, error: "Error al mostrar chat" };
    }
}
