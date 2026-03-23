import { z } from "zod";

/**
 * User validation schemas using Zod
 */

const studentCodeSchema = z
  .string()
  .min(7, "El código es demasiado corto")
  .max(12, "El código es demasiado largo");

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres");

export const emailSchema = z
  .string()
  .email("El correo no es válido")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return domain === "alumnos.udg.mx" || domain === "academicos.udg.mx";
    },
    { message: "Usa tu correo institucional (@alumnos.udg.mx o @academicos.udg.mx)" }
  );

export const loginSchema = z.object({
  studentCode: studentCodeSchema,
  password: z.string().min(4, "El NIP es obligatorio"),
});

export const registerSchema = z.object({
  code: studentCodeSchema,
  nip: z.string().min(4, "El NIP de SIIAU es obligatorio"),
  email: emailSchema,
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "No uses espacios ni caracteres especiales"),
  password: passwordSchema,
});

export const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});


export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

