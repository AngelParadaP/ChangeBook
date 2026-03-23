"use server";

import { db } from "@/db";
import { supportTickets, ticketMessages, users, userReports } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function createTicket(title: string, description: string, type: "appeal" | "issue" | "other" = "issue") {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const [newTicket] = await db.insert(supportTickets).values({
      userId: session.user.id,
      title,
      description,
      type,
    }).returning();

    // The user's first description behaves like the first message
    await db.insert(ticketMessages).values({
      ticketId: newTicket.id,
      senderId: session.user.id,
      content: description,
    });

    return { success: true, ticket: newTicket };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Error al crear el ticket" };
  }
}

export async function getMyTickets() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const tickets = await db
      .select({
        id: supportTickets.id,
        title: supportTickets.title,
        status: supportTickets.status,
        type: supportTickets.type,
        createdAt: supportTickets.createdAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.userId, session.user.id))
      .orderBy(desc(supportTickets.createdAt));

    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: "Error al cargar tickets" };
  }
}

export async function getAdminTickets() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    // Verificamos si es admin
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (user?.role !== "admin") return { success: false, error: "No autorizado" };

    const tickets = await db
      .select({
        id: supportTickets.id,
        title: supportTickets.title,
        status: supportTickets.status,
        type: supportTickets.type,
        createdAt: supportTickets.createdAt,
        userId: supportTickets.userId,
        username: users.username,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));

    return { success: true, tickets };
  } catch (error) {
    return { success: false, error: "Error al cargar tickets" };
  }
}

export async function getMyStrikes() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const misReportes = await db
      .select({
        id: userReports.id,
        reason: userReports.reason,
        createdAt: userReports.createdAt,
      })
      .from(userReports)
      .where(and(eq(userReports.reportedId, session.user.id), eq(userReports.status, "reviewed")))
      .orderBy(desc(userReports.createdAt));

    return { success: true, strikes: misReportes };
  } catch (error) {
    return { success: false, error: "Error al cargar strikes" };
  }
}

export async function getTicketDetails(ticketId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) return { success: false, error: "Ticket no encontrado" };

    // Auth check: either user is the ticket owner or an admin
    if (ticket.userId !== session.user.id) {
      const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
      if (u?.role !== "admin") return { success: false, error: "No autorizado" };
    }

    const messages = await db
      .select({
        id: ticketMessages.id,
        content: ticketMessages.content,
        imageUrl: ticketMessages.imageUrl,
        createdAt: ticketMessages.createdAt,
        senderId: ticketMessages.senderId,
        senderUsername: users.username,
        senderRole: users.role,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.senderId, users.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));

    return { success: true, ticket, messages, currentUserId: session.user.id };
  } catch (error) {
    return { success: false, error: "Error al cargar el detalle del ticket" };
  }
}

export async function sendTicketMessage(ticketId: string, content: string, imageUrl?: string | null) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    if (!content.trim() && !imageUrl) return { success: false, error: "El mensaje no puede estar vacío" };

    await db.insert(ticketMessages).values({
      ticketId,
      senderId: session.user.id,
      content,
      imageUrl,
    });

    // We can auto-update the ticket update timestamp & set to in_progress if admin replied
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (user?.role === "admin") {
      await db.update(supportTickets).set({ status: "in_progress", updatedAt: new Date(), adminId: session.user.id }).where(eq(supportTickets.id, ticketId));
    } else {
      await db.update(supportTickets).set({ updatedAt: new Date() }).where(eq(supportTickets.id, ticketId));
    }

    const { pusherServer } = await import("@/lib/pusher");
    await pusherServer.trigger(`ticket-${ticketId}`, "new-ticket-message", {});

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al enviar mensaje" };
  }
}

export async function closeTicket(ticketId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
    if (u?.role !== "admin") return { success: false, error: "No autorizado" };

    await db.update(supportTickets).set({ status: "closed", updatedAt: new Date() }).where(eq(supportTickets.id, ticketId));
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al cerrar el ticket" };
  }
}

export async function getTicketMessages(ticketId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const messages = await db
      .select({
        id: ticketMessages.id,
        content: ticketMessages.content,
        imageUrl: ticketMessages.imageUrl,
        createdAt: ticketMessages.createdAt,
        senderId: ticketMessages.senderId,
        senderUsername: users.username,
        senderRole: users.role,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.senderId, users.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(asc(ticketMessages.createdAt));

    return { success: true, messages };
  } catch (error) {
    return { success: false, error: "Error al cargar mensajes" };
  }
}

