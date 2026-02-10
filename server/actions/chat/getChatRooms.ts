"use server";

import { db } from "@/db";
import { chatRooms, users, messages } from "@/db/schema";
import { eq, or, and, desc, ne, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface ChatRoom {
    id: string;
    otherUser: {
        id: string;
        username: string;
        name: string;
        imageURL: string | null;
    };
    lastMessage: {
        content: string;
        createdAt: Date;
    } | null;
    unreadCount: number;
}

interface GetChatRoomsResult {
    success: boolean;
    rooms?: ChatRoom[];
    error?: string;
}

export async function getChatRooms(): Promise<GetChatRoomsResult> {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = currentUser.id;

        // Obtener todas las salas donde el usuario es participante
        const userRooms = await db
            .select()
            .from(chatRooms)
            .where(
                or(
                    eq(chatRooms.participant1Id, currentUserId),
                    eq(chatRooms.participant2Id, currentUserId)
                )
            );

        // Para cada sala, obtener información del otro usuario y último mensaje
        const roomsWithDetails = await Promise.all(
            userRooms.map(async (room) => {
                // Determinar quién es el otro usuario
                const otherUserId = room.participant1Id === currentUserId
                    ? room.participant2Id
                    : room.participant1Id;

                // Obtener información del otro usuario
                const otherUserData = await db
                    .select({
                        id: users.id,
                        username: users.username,
                        name: users.name,
                        imageURL: users.imageURL,
                    })
                    .from(users)
                    .where(eq(users.id, otherUserId))
                    .limit(1);

                if (otherUserData.length === 0) {
                    return null;
                }

                // Obtener último mensaje de la sala
                const lastMessageData = await db
                    .select({
                        content: messages.content,
                        createdAt: messages.createdAt,
                    })
                    .from(messages)
                    .where(eq(messages.roomId, room.id))
                    .orderBy(desc(messages.createdAt))
                    .limit(1);

                // Contar mensajes no leídos (no enviados por el usuario actual)
                const unreadResult = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(messages)
                    .where(
                        and(
                            eq(messages.roomId, room.id),
                            ne(messages.senderId, currentUserId),
                            eq(messages.isRead, 0)
                        )
                    );

                const unreadCount = Number(unreadResult[0]?.count || 0);

                return {
                    id: room.id,
                    otherUser: otherUserData[0],
                    lastMessage: lastMessageData.length > 0
                        ? {
                            content: lastMessageData[0].content,
                            createdAt: lastMessageData[0].createdAt || new Date(),
                        }
                        : null,
                    unreadCount,
                };
            })
        );

        // Filtrar nulls y ordenar por último mensaje
        const validRooms = roomsWithDetails
            .filter((room): room is ChatRoom => room !== null)
            .sort((a, b) => {
                const aTime = a.lastMessage?.createdAt?.getTime() || 0;
                const bTime = b.lastMessage?.createdAt?.getTime() || 0;
                return bTime - aTime;
            });

        return { success: true, rooms: validRooms };
    } catch (error) {
        console.error("Error in getChatRooms:", error);
        return { success: false, error: "Error al obtener salas de chat" };
    }
}
