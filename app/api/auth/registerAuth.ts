"use server";
import { db } from "@/db";
import { users, accountVerificationTokens } from "@/db/schema";
import { validateWithSIIAU } from "@/lib/validations/siiau";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema, RegisterInput } from "@/lib/validations/user";

export async function registerAction(data: RegisterInput) {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    const zodError = result.error.flatten();

    // Extrae todos los mensajes de error y los une con saltos de línea
    const errorMessage = Object.values(zodError.fieldErrors)
      .flat()
      .join(", \n");
    return { error: errorMessage };
  }

  const validatedData = result.data;

  // 1. Validar que los números del correo coinciden con las posiciones 5-8 del código de alumno (índices 4-7)
  // Para académicos (@academicos.udg.mx) saltamos esta validación ya que sus correos no llevan número ni coinciden con códigos
  if (validatedData.email.endsWith("@alumnos.udg.mx")) {
    const emailLocalPart = validatedData.email.split("@")[0];
    const emailNumbersMatch = emailLocalPart.match(/\d+$/);

    if (!emailNumbersMatch) {
      return { error: "Tu correo parece estar incorrecto." };
    }

    const emailNumbers = emailNumbersMatch[0];
    const codePart = validatedData.code.substring(4, 8);

    if (emailNumbers !== codePart) {
      return { error: `Tu correo no coincide con tu código de alumno.` };
    }
  }

  // 2. Validar contra SIIAU (ahora también intenta obtener el nombre del alumno)
  const siiau = await validateWithSIIAU(validatedData.code, validatedData.nip);
  if (!siiau.success) return { error: "Código o NIP de SIIAU incorrectos" };

  // 3. Verificar duplicados de código
  const [existingCode] = await db
    .select()
    .from(users)
    .where(eq(users.studentCode, validatedData.code));
  if (existingCode) return { error: "Este código ya tiene una cuenta en Kyboo" };

  // 4. Verificar duplicados de email
  const [existingEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, validatedData.email));
  if (existingEmail) return { error: "Este correo ya está registrado en Kyboo" };

  // 5. Determinar el nombre del usuario
  // Prioridad: nombre derivado del email
  // El nombre derivado de SIIAU se puede omitir si el email es más confiable y formateable o dejarlo como estaba
  const userName = deriveNameFromEmail(validatedData.email)
    || siiau.name
    || "Usuario de Kyboo";

  // 6. Hashear y Guardar
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  const [newUser] = await db.insert(users).values({
    studentCode: validatedData.code,
    username: validatedData.username,
    email: validatedData.email,
    password: hashedPassword,
    name: userName,
    verified: false,
  }).returning({ id: users.id });

  // 7. Generar token de verificación de cuenta
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

  await db.insert(accountVerificationTokens).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  // 8. Construir URL de verificación y enviar correo
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  const emailResult = await sendVerificationEmail(validatedData.email, verifyUrl, userName);

  if (!emailResult.success) {
    return { error: "Cuenta creada, pero hubo un error al enviar el correo de verificación. Por favor contacta a soporte." };
  }

  return { success: true };
}

/**
 * Deriva un nombre legible a partir del email institucional.
 * "angel.parada9110@alumnos.udg.mx" → "Angel Parada"
 */
function deriveNameFromEmail(email: string): string | null {
  const localPart = email.split("@")[0];
  if (!localPart) return null;

  // Eliminar números y luego reemplazar puntos, guiones bajos y guiones por espacios
  const nameOnly = localPart.replace(/\d+/g, "");
  const parts = nameOnly
    .replace(/[._-]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return parts.length > 0 ? parts.join(" ") : null;
}

