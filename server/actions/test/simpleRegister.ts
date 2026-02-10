"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";

export async function simpleRegister(formData: FormData) {
  try {
    const studentCode = formData.get("studentCode") as string;
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Validate required fields
    if (!studentCode || !name || !username || !password) {
      return {
        success: false,
        error: "Todos los campos son obligatorios",
      };
    }

    // Validate student code format (basic validation)
    if (studentCode.length < 5) {
      return {
        success: false,
        error: "El código de estudiante debe tener al menos 5 caracteres",
      };
    }

    // Validate username (no spaces, at least 3 characters)
    if (username.length < 3 || /\s/.test(username)) {
      return {
        success: false,
        error: "El nombre de usuario debe tener al menos 3 caracteres y sin espacios",
      };
    }

    // Validate password (at least 6 characters)
    if (password.length < 6) {
      return {
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres",
      };
    }

    // Check if student code already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.studentCode, studentCode),
    });

    if (existingUser) {
      return {
        success: false,
        error: "Este código de estudiante ya está registrado",
      };
    }

    // Check if username already exists
    const existingUsername = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, username),
    });

    if (existingUsername) {
      return {
        success: false,
        error: "Este nombre de usuario ya está en uso",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await db.insert(users).values({
      studentCode,
      name,
      username,
      password: hashedPassword,
      preferences: [],
    });

    return {
      success: true,
      message: "Usuario registrado exitosamente",
    };
  } catch (error) {
    console.error("Error in simpleRegister:", error);
    return {
      success: false,
      error: "Error al registrar usuario. Por favor, intenta de nuevo.",
    };
  }
}
