"use server";

import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

/**
 * Genera un token de reset y envía el correo de recuperación.
 * Recibe el código de alumno para buscar el email asociado.
 */
export async function forgotPasswordAction(studentCode: string) {
    if (!studentCode || studentCode.length < 7) {
        return { error: "Ingresa tu código de alumno" };
    }

    try {
        // 1. Buscar al usuario por código de alumno
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.studentCode, studentCode))
            .limit(1);

        if (!user) {
            // No revelar si el usuario existe o no (seguridad)
            return { success: true, message: "Si tu código está registrado, recibirás un correo." };
        }

        if (!user.email) {
            return {
                error: "Tu cuenta no tiene un correo asociado. Contacta a soporte.",
            };
        }

        // 2. Generar token único
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // 3. Guardar token en la BD
        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt,
        });

        // 4. Construir URL de reset
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        // 5. Enviar correo
        const emailResult = await sendPasswordResetEmail(
            user.email,
            resetUrl,
            user.name
        );

        if (!emailResult.success) {
            return { error: "Error al enviar el correo. Intenta de nuevo." };
        }

        // Enmascarar el email para mostrarlo al usuario
        const maskedEmail = maskEmail(user.email);
        return {
            success: true,
            message: `Se envió un enlace de recuperación a ${maskedEmail}`,
        };
    } catch (e: any) {
        console.error("[forgotPasswordAction] Error:", e);
        return { error: "Ocurrió un error inesperado al procesar la solicitud: " + e.message };
    }
}

/**
 * Valida el token y cambia la contraseña del usuario.
 */
export async function resetPasswordAction(token: string, newPassword: string) {
    if (!token) {
        return { error: "Token inválido" };
    }

    if (!newPassword || newPassword.length < 8) {
        return { error: "La contraseña debe tener al menos 8 caracteres" };
    }

    // 1. Buscar token válido (no usado, no expirado)
    const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
            and(
                eq(passwordResetTokens.token, token),
                eq(passwordResetTokens.used, 0),
                gt(passwordResetTokens.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!resetToken) {
        return { error: "El enlace es inválido o ha expirado. Solicita uno nuevo." };
    }

    // 2. Hashear la nueva contraseña
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Actualizar contraseña del usuario
    await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

    // 4. Marcar token como usado
    await db
        .update(passwordResetTokens)
        .set({ used: 1 })
        .where(eq(passwordResetTokens.id, resetToken.id));

    return { success: true };
}

/**
 * Enmascara un email para mostrarlo parcialmente.
 * "juan.perez@alumnos.udg.mx" → "ju****ez@alumnos.udg.mx"
 */
function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***@***.***";

    if (local.length <= 4) {
        return `${local[0]}***@${domain}`;
    }

    return `${local.slice(0, 2)}${"*".repeat(4)}${local.slice(-2)}@${domain}`;
}
