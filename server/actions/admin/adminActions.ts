"use server";

import { db } from "@/db";
import { users, userReports, notifications, exchanges, books } from "@/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);
  return user?.role === "admin";
}

export async function getPendingReports() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "No autorizado.", reports: [] };

  try {
    const rawReports = await db
      .select({
        id: userReports.id,
        reason: userReports.reason,
        createdAt: userReports.createdAt,
        reporterId: userReports.reporterId,
        reportedId: userReports.reportedId,
        status: userReports.status,
        imageUrl: userReports.imageUrl,
      })
      .from(userReports)
      .where(eq(userReports.status, "pending"))
      .orderBy(desc(userReports.createdAt));

    // For each report, we manually fetch users because we need info from both reporter and reported
    const enhancedReports = await Promise.all(
      rawReports.map(async (report) => {
        const [reporter] = await db.select({ username: users.username, name: users.name }).from(users).where(eq(users.id, report.reporterId)).limit(1);
        const [reported] = await db.select({ username: users.username, name: users.name, strikes: users.strikes, banned: users.banned, suspendedUntil: users.suspendedUntil }).from(users).where(eq(users.id, report.reportedId)).limit(1);

        return {
          ...report,
          reporterUsername: reporter?.username || "Desconocido",
          reportedUsername: reported?.username || "Desconocido",
          reportedStrikes: reported?.strikes || 0,
          reportedBanned: reported?.banned || false,
          reportedSuspendedUntil: reported?.suspendedUntil || null,
        };
      })
    );

    return { success: true, reports: enhancedReports };
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, error: "Error al obtener reportes", reports: [] };
  }
}

export async function dismissReportAction(reportId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "No autorizado." };

  try {
    await db
      .update(userReports)
      .set({ status: "dismissed" })
      .where(eq(userReports.id, reportId));

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al descartar reporte" };
  }
}

export async function applyStrikeAction(reportId: string, reportedId: string) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { success: false, error: "No autorizado." };

  try {
    // 1. Get current user stats
    const [userToPenalize] = await db.select({ strikes: users.strikes }).from(users).where(eq(users.id, reportedId)).limit(1);
    if (!userToPenalize) return { success: false, error: "Usuario a penalizar no encontrado." };

    const newStrikes = userToPenalize.strikes + 1;
    let banned = false;
    let suspendedUntil: Date | null = null;

    // 2. Decide penalty based on new strikes
    if (newStrikes === 3) {
      // 2 weeks
      suspendedUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    } else if (newStrikes === 4) {
      // 1 month (approx 30 days)
      suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (newStrikes >= 5) {
      banned = true;
    }

    // 3. Update user
    await db.update(users)
      .set({
        strikes: newStrikes,
        banned,
        suspendedUntil
      })
      .where(eq(users.id, reportedId));

    // 4. Update report
    await db.update(userReports)
      .set({ status: "reviewed" })
      .where(eq(userReports.id, reportId));

    // 4.5 Cancel active exchanges if banned or suspended
    if (banned || suspendedUntil) {
      const userExchanges = await db.select()
        .from(exchanges)
        .where(
          and(
            or(eq(exchanges.ownerId, reportedId), eq(exchanges.requesterId, reportedId)),
            inArray(exchanges.status, ["pendiente", "aceptado", "en_curso"])
          )
        );

      if (userExchanges.length > 0) {
        const exchangeIds = userExchanges.map((e) => e.id);
        const bookIdsToFree = userExchanges.map((e) => e.bookId);

        // Cancel the exchanges
        await db.update(exchanges)
          .set({ status: "cancelado", updatedAt: new Date() })
          .where(inArray(exchanges.id, exchangeIds));

        // Free the books
        await db.update(books)
          .set({ status: "disponible" })
          .where(inArray(books.id, bookIdsToFree));

        // Notify the OTHER parties
        const notificationsToInsert = userExchanges.map((ex) => ({
          userId: ex.ownerId === reportedId ? ex.requesterId : ex.ownerId,
          type: "exchange_cancelled" as const,
          message: "Un intercambio ha sido cancelado automáticamente por medidas de seguridad de la administración.",
          exchangeId: ex.id,
        }));

        await db.insert(notifications).values(notificationsToInsert);
      }
    }

    // 5. Send Notification
    let strikeMessage = `Has recibido tu strike #${newStrikes} por infringir las reglas.`;
    if (suspendedUntil && newStrikes === 3) strikeMessage = `Has recibido tu 3er strike. Cuenta suspendida por 2 semanas.`;
    if (suspendedUntil && newStrikes === 4) strikeMessage = `Has recibido tu 4to strike. Cuenta suspendida por 1 mes.`;
    if (banned) strikeMessage = `Has recibido tu 5to strike. Tu cuenta ha sido baneada permanentemente.`;

    await db.insert(notifications).values({
      userId: reportedId,
      type: "strike_received",
      message: strikeMessage,
    });

    return {
      success: true,
      message: `Penalización aplicada. Ahora tiene ${newStrikes} strikes.`
    };
  } catch (error) {
    console.error("error applying strike", error);
    return { success: false, error: "Error al aplicar el strike" };
  }
}
