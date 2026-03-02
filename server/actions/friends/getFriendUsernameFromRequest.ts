"use server";

import { db } from "@/db";
import { friends, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getFriendUsernameFromRequest(requestId: string, notificationMessage?: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "No autenticado" };

        const reqs = await db.select().from(friends).where(eq(friends.id, requestId));
        if (reqs.length > 0) {
            const req = reqs[0];
            const targetId = req.requesterId === session.user.id ? req.addresseeId : req.requesterId;

            const usrs = await db.select().from(users).where(eq(users.id, targetId));
            if (usrs.length > 0) return { success: true, username: usrs[0].username };
        }

        // Si la solicitud fue eliminada, usar el mensaje de la notificación como fallback
        if (notificationMessage) {
            const extractedName = notificationMessage
                .replace(" te ha enviado una solicitud de amistad", "")
                .replace(" ha aceptado tu solicitud de amistad", "")
                .trim();

            const usrs = await db.select().from(users).where(eq(users.name, extractedName));
            if (usrs.length === 1) {
                return { success: true, username: usrs[0].username };
            }
        }

        return { success: false, error: "Usuario o solicitud no encontrados" };
    } catch (error) {
        console.error("Error fetching friend username:", error);
        return { success: false, error: "Error de servidor" };
    }
}
