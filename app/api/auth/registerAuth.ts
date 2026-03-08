"use server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { validateWithSIIAU } from "@/lib/validations/siiau";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
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

  // 1. Validar contra SIIAU (ahora también intenta obtener el nombre del alumno)
  const siiau = await validateWithSIIAU(validatedData.code, validatedData.nip);
  if (!siiau.success) return { error: "Código o NIP de SIIAU incorrectos" };

  // 2. Verificar duplicados de código
  const [existingCode] = await db
    .select()
    .from(users)
    .where(eq(users.studentCode, validatedData.code));
  if (existingCode) return { error: "Este código ya tiene una cuenta en Kyboo" };

  // 3. Verificar duplicados de email
  const [existingEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, validatedData.email));
  if (existingEmail) return { error: "Este correo ya está registrado en Kyboo" };

  // 4. Determinar el nombre del usuario
  // Prioridad: nombre de SIIAU > nombre derivado del email > fallback
  const userName = siiau.name
    || deriveNameFromEmail(validatedData.email)
    || "Usuario de Kyboo";

  // 5. Hashear y Guardar
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  await db.insert(users).values({
    studentCode: validatedData.code,
    username: validatedData.username,
    email: validatedData.email,
    password: hashedPassword,
    name: userName,
  });

  return { success: true };
}

/**
 * Deriva un nombre legible a partir del email institucional.
 * "juan.perez@alumnos.udg.mx" → "Juan Perez"
 */
function deriveNameFromEmail(email: string): string | null {
  const localPart = email.split("@")[0];
  if (!localPart) return null;

  // Reemplazar puntos, guiones bajos and guiones por espacios
  const parts = localPart
    .replace(/[._-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

  return parts.length >= 2 ? parts.join(" ") : null;
}

