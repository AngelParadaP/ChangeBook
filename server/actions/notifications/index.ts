"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sql } from "drizzle-orm";

export interface NotificationItem {
    id: string;
    type: string;
    message: string;
    exchangeId: string | null;
    isRead: number;
    createdAt: Date;
}

// Obtener las notificaciones del usuario actual
export async function getNotifications(limit: number = 20) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const results = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, session.user.id))
            .orderBy(desc(notifications.createdAt))
            .limit(limit);

        return { success: true, notifications: results as NotificationItem[] };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Error al obtener notificaciones" };
    }
}

// Contar notificaciones no leídas
export async function getUnreadNotificationCount() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, session.user.id),
                    eq(notifications.isRead, 0)
                )
            );

        return { success: true, count: Number(result[0]?.count || 0) };
    } catch (error) {
        console.error("Error counting notifications:", error);
        return { success: false, error: "Error al contar notificaciones" };
    }
}

// Marcar una notificación como leída
export async function markNotificationAsRead(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .update(notifications)
            .set({ isRead: 1 })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, session.user.id)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Error al marcar notificación" };
    }
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .update(notifications)
            .set({ isRead: 1 })
            .where(
                and(
                    eq(notifications.userId, session.user.id),
                    eq(notifications.isRead, 0)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error: "Error al marcar notificaciones" };
    }
}

// Eliminar una notificación
export async function deleteNotification(notificationId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .delete(notifications)
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, session.user.id)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, error: "Error al eliminar notificación" };
    }
}

// Eliminar todas las notificaciones del usuario
export async function deleteAllNotifications() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "No autenticado" };
        }

        await db
            .delete(notifications)
            .where(eq(notifications.userId, session.user.id));

        return { success: true };
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        return { success: false, error: "Error al eliminar notificaciones" };
    }
}
