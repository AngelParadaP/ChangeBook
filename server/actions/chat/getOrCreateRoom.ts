"use server";

import { db } from "@/db";
import { chatRooms } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface GetOrCreateRoomResult {
    success: boolean;
    roomId?: string;
    error?: string;
}

export async function getOrCreateRoom(otherUserId: string): Promise<GetOrCreateRoomResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = currentUser.id;

        // No permitir chat consigo mismo
        if (currentUserId === otherUserId) {
            return { success: false, error: "No puedes chatear contigo mismo" };
        }

        // Buscar una sala existente entre estos dos usuarios
        // La sala puede estar en cualquier orden (participant1/participant2)
        const existingRoom = await db
            .select()
            .from(chatRooms)
            .where(
                or(
                    and(
                        eq(chatRooms.participant1Id, currentUserId),
                        eq(chatRooms.participant2Id, otherUserId)
                    ),
                    and(
                        eq(chatRooms.participant1Id, otherUserId),
                        eq(chatRooms.participant2Id, currentUserId)
                    )
                )
            )
            .limit(1);

        if (existingRoom.length > 0) {
            return { success: true, roomId: existingRoom[0].id };
        }

        // Crear una nueva sala
        const newRoom = await db
            .insert(chatRooms)
            .values({
                participant1Id: currentUserId,
                participant2Id: otherUserId,
            })
            .returning();

        return { success: true, roomId: newRoom[0].id };
    } catch (error) {
        console.error("Error in getOrCreateRoom:", error);
        return { success: false, error: "Error al crear/obtener sala de chat" };
    }
}
