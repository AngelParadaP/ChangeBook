"use server";

import { db } from "@/db";
import { users, accountVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

export async function resendVerificationEmailAction(codigo: string) {
  if (!codigo || codigo.trim() === "") {
    return { error: "Proporciona tu código de alumno para reenviar el correo." };
  }

  try {
    // Buscar al usuario
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.studentCode, codigo))
      .limit(1);

    if (!user) {
      // Mensaje genérico para no revelar si el usuario existe
      return { success: true, message: "Si tu código está registrado y no verificado, recibirás un correo." };
    }

    if (user.verified) {
      return { error: "Esta cuenta ya está verificada. Puedes iniciar sesión." };
    }

    if (!user.email) {
      return { error: "Tu cuenta no tiene un correo asignado." };
    }

    // Inactivar tokens anteriores (opcional, pero buena práctica)
    await db
      .update(accountVerificationTokens)
      .set({ used: 1 })
      .where(eq(accountVerificationTokens.userId, user.id));

    // Generar nuevo token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await db.insert(accountVerificationTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

    const emailResult = await sendVerificationEmail(user.email, verifyUrl, user.name);

    if (!emailResult.success) {
      return { error: "Error al enviar el correo. Por favor intenta de nuevo más tarde." };
    }

    return { success: true, message: "Se ha reenviado el enlace de verificación a tu correo." };
  } catch (error) {
    console.error("[resendVerificationEmailAction] Error:", error);
    return { error: "Error inesperado al intentar reenviar el correo." };
  }
}
