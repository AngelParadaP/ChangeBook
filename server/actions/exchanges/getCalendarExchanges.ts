"use server";

import { db } from "@/db";
import { exchanges, books, users } from "@/db/schema";
import { eq, or, desc, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface CalendarExchange {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl: string;
  otherUserName: string | null;
  otherUserUsername: string | null;
  otherUserImageURL: string | null;
  role: "owner" | "requester"; // current user's role in this exchange
  status: string;
  startDate: Date;
  endDate: Date;
  meetingLocation: string;
  meetingTime: string | null;
}

export async function getCalendarExchanges() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    const userId = session.user.id;

    // Get all non-rejected/non-cancelled exchanges the user is part of
    const results = await db
      .select({
        id: exchanges.id,
        bookId: exchanges.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookImageUrl: books.imageUrl,
        ownerId: exchanges.ownerId,
        ownerName: users.name,
        ownerUsername: users.username,
        ownerImageURL: users.imageURL,
        requesterId: exchanges.requesterId,
        status: exchanges.status,
        startDate: exchanges.startDate,
        endDate: exchanges.endDate,
        meetingLocation: exchanges.meetingLocation,
        meetingTime: exchanges.meetingTime,
        createdAt: exchanges.createdAt,
      })
      .from(exchanges)
      .leftJoin(books, eq(exchanges.bookId, books.id))
      .leftJoin(users, eq(exchanges.ownerId, users.id))
      .where(
        and(
          or(eq(exchanges.ownerId, userId), eq(exchanges.requesterId, userId)),
          // Include all statuses except permanently negative ones for better calendar view
          // We show: pendiente, aceptado, en_curso, completado, rechazado, cancelado (all)
        )
      )
      .orderBy(desc(exchanges.startDate));

    // Fetch requester details
    const requesterIds = [...new Set(results.map((r) => r.requesterId))];
    let requesterMap: Record<string, { name: string; username: string; imageURL: string | null }> = {};

    if (requesterIds.length > 0) {
      const requesters = await db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          imageURL: users.imageURL,
        })
        .from(users)
        .where(inArray(users.id, requesterIds));

      requesterMap = requesters.reduce(
        (acc, r) => {
          acc[r.id] = { name: r.name, username: r.username, imageURL: r.imageURL };
          return acc;
        },
        {} as Record<string, { name: string; username: string; imageURL: string | null }>
      );
    }

    const calendarExchanges: CalendarExchange[] = results.map((r) => {
      const isOwner = r.ownerId === userId;
      const otherUser = isOwner
        ? requesterMap[r.requesterId]
        : { name: r.ownerName, username: r.ownerUsername, imageURL: r.ownerImageURL };

      return {
        id: r.id,
        bookTitle: r.bookTitle || "Libro eliminado",
        bookAuthor: r.bookAuthor || "",
        bookImageUrl: r.bookImageUrl || "",
        otherUserName: otherUser?.name || null,
        otherUserUsername: otherUser?.username || null,
        otherUserImageURL: otherUser?.imageURL || null,
        role: isOwner ? "owner" : "requester",
        status: r.status,
        startDate: r.startDate,
        endDate: r.endDate,
        meetingLocation: r.meetingLocation,
        meetingTime: r.meetingTime,
      };
    });

    return { success: true, exchanges: calendarExchanges };
  } catch (error) {
    console.error("Error fetching calendar exchanges:", error);
    return { success: false, error: "Error al obtener intercambios" };
  }
}
