"use server";

import { db } from "@/db";
import { users, accountVerificationTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function verifyEmailAction(token: string) {
  if (!token) return { error: "Token inválido" };

  try {
    // 1. Buscar token válido (no usado, no expirado)
    const [verificationToken] = await db
      .select()
      .from(accountVerificationTokens)
      .where(
        and(
          eq(accountVerificationTokens.token, token),
          eq(accountVerificationTokens.used, 0),
          gt(accountVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!verificationToken) {
      return { error: "El enlace es inválido o ha expirado." };
    }

    // 2. Marcar usuario como verificado
    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, verificationToken.userId));

    // 3. Marcar token como usado
    await db
      .update(accountVerificationTokens)
      .set({ used: 1 })
      .where(eq(accountVerificationTokens.id, verificationToken.id));

    return { success: true };
  } catch (e: any) {
    console.error("[verifyEmailAction] Error:", e);
    return { error: "Ocurrió un error inesperado al procesar la verificación: " + e.message };
  }
}
