"use server";

import { db } from "@/db";
import { chatRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

/**
 * Lightweight action to get info about a specific chat room.
 * Works regardless of whether the room is hidden or not.
 */
export async function getRoomInfo(roomId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser?.id) {
            return { success: false as const, error: "No autenticado" };
        }

        const room = await db.query.chatRooms.findFirst({
            where: (chatRooms, { eq }) => eq(chatRooms.id, roomId),
        });

        if (!room) {
            return { success: false as const, error: "Sala no encontrada" };
        }

        // Verify the user is a participant
        if (room.participant1Id !== currentUser.id && room.participant2Id !== currentUser.id) {
            return { success: false as const, error: "No eres participante de esta sala" };
        }

        const otherUserId = room.participant1Id === currentUser.id
            ? room.participant2Id
            : room.participant1Id;

        const [otherUser] = await db
            .select({
                id: users.id,
                username: users.username,
                name: users.name,
                imageURL: users.imageURL,
            })
            .from(users)
            .where(eq(users.id, otherUserId))
            .limit(1);

        if (!otherUser) {
            return { success: false as const, error: "Usuario no encontrado" };
        }

        return { success: true as const, otherUser };
    } catch (error) {
        console.error("Error in getRoomInfo:", error);
        return { success: false as const, error: "Error al obtener info de la sala" };
    }
}
