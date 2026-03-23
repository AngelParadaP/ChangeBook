"use server";

import { db } from "@/db";
import { friends, notifications, users } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getFriendStatus(otherUserId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = session.user.id;
        if (currentUserId === otherUserId) {
            return { success: false, error: "Mismo usuario" };
        }

        // Buscar si hay una relación de amistad
        const result = await db
            .select()
            .from(friends)
            .where(
                or(
                    and(eq(friends.requesterId, currentUserId), eq(friends.addresseeId, otherUserId)),
                    and(eq(friends.requesterId, otherUserId), eq(friends.addresseeId, currentUserId))
                )
            );

        if (result.length === 0) {
            return { success: true, status: "none", request: null };
        }

        const friendship = result[0];

        if (friendship.status === "accepted") {
            return { success: true, status: "friends", request: friendship };
        } else if (friendship.status === "pending") {
            if (friendship.requesterId === currentUserId) {
                return { success: true, status: "request_sent", request: friendship };
            } else {
                return { success: true, status: "request_received", request: friendship };
            }
        } else {
            return { success: true, status: "none", request: null };
        }
    } catch (error) {
        console.error("Error fetching friend status:", error);
        return { success: false, error: "Error al obtener estado de amistad" };
    }
}

export async function sendFriendRequest(addresseeId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = session.user.id;
        if (currentUserId === addresseeId) {
            return { success: false, error: "No puedes enviarte una solicitud a ti mismo" };
        }

        // Verificar si ya existe
        const existing = await db
            .select()
            .from(friends)
            .where(
                or(
                    and(eq(friends.requesterId, currentUserId), eq(friends.addresseeId, addresseeId)),
                    and(eq(friends.requesterId, addresseeId), eq(friends.addresseeId, currentUserId))
                )
            );

        if (existing.length > 0) {
            if (existing[0].status === "accepted") return { success: false, error: "Ya son amigos" };
            if (existing[0].status === "pending") return { success: false, error: "Ya hay una solicitud pendiente" };

            // Si fue rechazada antes, podríamos actualizarla.
            await db.update(friends)
                .set({ status: "pending", requesterId: currentUserId, addresseeId: addresseeId, updatedAt: new Date() })
                .where(eq(friends.id, existing[0].id));

            // Crear notificación
            await db.insert(notifications).values({
                userId: addresseeId,
                type: "friend_request",
                message: `${session.user.name} te ha enviado una solicitud de amistad`,
                friendRequestId: existing[0].id,
            });

            const { pusherServer } = await import("@/lib/pusher");
            await pusherServer.trigger(`user-${addresseeId}`, "new-notification", {});

            return { success: true };
        }

        const newRequest = await db.insert(friends).values({
            requesterId: currentUserId,
            addresseeId,
            status: "pending",
        }).returning();

        // Crear notificación
        await db.insert(notifications).values({
            userId: addresseeId,
            type: "friend_request",
            message: `${session.user.name} te ha enviado una solicitud de amistad`,
            friendRequestId: newRequest[0].id,
        });

        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(`user-${addresseeId}`, "new-notification", {});

        return { success: true };
    } catch (error) {
        console.error("Error sending friend request:", error);
        return { success: false, error: "Error al enviar solicitud" };
    }
}

export async function acceptFriendRequest(requestId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = session.user.id;

        const req = await db.select().from(friends).where(eq(friends.id, requestId));
        if (req.length === 0) return { success: false, error: "Solicitud no encontrada" };
        if (req[0].addresseeId !== currentUserId) return { success: false, error: "No autorizado" };
        if (req[0].status !== "pending") return { success: false, error: "Estado inválido" };

        await db.update(friends)
            .set({ status: "accepted", updatedAt: new Date() })
            .where(eq(friends.id, requestId));

        // Eliminar la notificación de solicitud de amistad original
        const existingNotifs = await db.select().from(notifications).where(and(eq(notifications.userId, session.user.id), eq(notifications.friendRequestId, requestId)));

        if (existingNotifs.length > 0) {
            await db.delete(notifications).where(eq(notifications.id, existingNotifs[0].id));
        }

        // Notificar al que envió
        await db.insert(notifications).values({
            userId: req[0].requesterId,
            type: "friend_accepted",
            message: `${session.user.name} ha aceptado tu solicitud de amistad`,
            friendRequestId: requestId,
        });

        const { pusherServer } = await import("@/lib/pusher");
        await pusherServer.trigger(`user-${req[0].requesterId}`, "new-notification", {});

        return { success: true };
    } catch (error) {
        console.error("Error accepting friend request:", error);
        return { success: false, error: "Error al aceptar solicitud" };
    }
}

export async function declineFriendRequest(requestId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = session.user.id;

        const req = await db.select().from(friends).where(eq(friends.id, requestId));
        if (req.length === 0) return { success: false, error: "Solicitud no encontrada" };
        if (req[0].addresseeId !== currentUserId) return { success: false, error: "No autorizado" };

        await db.update(friends)
            .set({ status: "declined", updatedAt: new Date() })
            .where(eq(friends.id, requestId));

        // Eliminar la notificación de solicitud de amistad original
        const existingNotifs = await db.select().from(notifications).where(and(eq(notifications.userId, session.user.id), eq(notifications.friendRequestId, requestId)));

        if (existingNotifs.length > 0) {
            await db.delete(notifications).where(eq(notifications.id, existingNotifs[0].id));
        }

        return { success: true };
    } catch (error) {
        console.error("Error declining friend request:", error);
        return { success: false, error: "Error al rechazar solicitud" };
    }
}

export async function removeFriend(friendshipId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const currentUserId = session.user.id;

        const req = await db.select().from(friends).where(eq(friends.id, friendshipId));
        if (req.length === 0) return { success: false, error: "Amistad no encontrada" };
        if (req[0].addresseeId !== currentUserId && req[0].requesterId !== currentUserId) return { success: false, error: "No autorizado" };

        await db.delete(friends).where(eq(friends.id, friendshipId));

        return { success: true };
    } catch (error) {
        console.error("Error removing friend :", error);
        return { success: false, error: "Error al eliminar amigo" };
    }
}
