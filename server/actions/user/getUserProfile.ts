"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserProfile(userId: string) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        studentCode: users.studentCode,
        name: users.name,
        username: users.username,
        imageURL: users.imageURL,
        preferences: users.preferences,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "Usuario no encontrado", user: null };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al cargar perfil",
      user: null,
    };
  }
}
