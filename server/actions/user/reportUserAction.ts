"use server";

import { db } from "@/db";
import { userReports, users } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

export async function reportUserAction(reportedId: string, reason: string, imageUrl?: string | null) {
  if (!reason || reason.trim().length === 0) {
    return { error: "Debes proporcionar un motivo para el reporte." };
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { error: "No autorizado. Inicia sesión para reportar." };
    }

    const reporterId = session.user.id;

    if (reporterId === reportedId) {
      return { error: "No puedes reportar tu propia cuenta." };
    }

    // Verificar si el usuario a reportar existe
    const [reportedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, reportedId))
      .limit(1);

    if (!reportedUser) {
      return { error: "El usuario que intentas reportar no existe." };
    }

    // Insertar el reporte en la tabla pero NO incrementamos strikes automáticamente 
    // para evitar baneos masivos o trolleos entre usuarios.
    // Los strikes se pueden aplicar manualmente o mediante un panel admin en el futuro.
    await db.insert(userReports).values({
      reporterId,
      reportedId,
      reason,
      imageUrl,
    });

    return { success: true, message: "Reporte enviado exitosamente. Será revisado por un administrador." };
  } catch (error: any) {
    console.error("[reportUserAction] Error:", error);
    return { error: "Error inesperado al enviar el reporte." };
  }
}
