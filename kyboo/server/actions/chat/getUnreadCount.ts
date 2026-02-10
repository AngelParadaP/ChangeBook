"use server";

import { db } from "@/db";
import { chatRooms, messages } from "@/db/schema";
import { eq, or, and, ne, sql, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface UnreadCountResult {
    success: boolean;
    count?: number;
    error?: string;
}

export async function getUnreadCount(): Promise<UnreadCountResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = currentUser.id;

        // Obtener todas las salas donde el usuario es participante
        const userRooms = await db
            .select({ id: chatRooms.id })
            .from(chatRooms)
            .where(
                or(
                    eq(chatRooms.participant1Id, currentUserId),
                    eq(chatRooms.participant2Id, currentUserId)
                )
            );

        if (userRooms.length === 0) {
            return { success: true, count: 0 };
        }

        const roomIds = userRooms.map(room => room.id);

        // Contar mensajes no leídos en todas las salas del usuario usando inArray
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(messages)
            .where(
                and(
                    inArray(messages.roomId, roomIds),
                    ne(messages.senderId, currentUserId),
                    eq(messages.isRead, 0)
                )
            );

        const totalUnread = Number(result[0]?.count || 0);

        return { success: true, count: totalUnread };
    } catch (error) {
        console.error("Error in getUnreadCount:", error);
        return { success: false, error: "Error al obtener mensajes no leídos" };
    }
}
