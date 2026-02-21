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

  // 1. Validar contra SIIAU
  const siiau = await validateWithSIIAU(validatedData.code, validatedData.nip);
  if (!siiau.success) return { error: "Código o NIP de SIIAU incorrectos" };

  // 2. Verificar duplicados
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.studentCode, validatedData.code));
  if (existing) return { error: "Este código ya tiene una cuenta en Kyboo" };

  // 3. Hashear y Guardar
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  // const newUser:

  await db.insert(users).values({
    studentCode: validatedData.code,
    username: validatedData.username,
    password: hashedPassword,
    name: "Usuario de SIIAU",
  });

  return { success: true };
}
