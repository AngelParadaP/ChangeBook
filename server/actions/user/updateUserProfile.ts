"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function updateUserProfile(formData: FormData) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Extract data from FormData
    const name = formData.get("name") as string | null;
    const username = formData.get("username") as string | null;
    const preferencesRaw = formData.get("preferences") as string | null;
    const imageFile = formData.get("image") as File | null;

    // Parse preferences
    const preferences = preferencesRaw
      ? preferencesRaw.split(",").map((p) => p.trim()).filter((p) => p.length > 0)
      : undefined;

    // Check if username is taken (if updating username)
    if (username && username.trim()) {
      const [existingUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username.trim()))
        .limit(1);

      if (existingUser && existingUser.id !== user.id) {
        return { success: false, error: "El nombre de usuario ya está en uso" };
      }
    }

    // Handle image upload if provided
    let imageURL: string | undefined;
    if (imageFile && imageFile.size > 0) {
      // Validate image file
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.",
        };
      }

      const maxSize = 4 * 1024 * 1024; // 4MB
      if (imageFile.size > maxSize) {
        return {
          success: false,
          error: "El archivo es demasiado grande. Tamaño máximo: 4MB.",
        };
      }

      // Upload image to UploadThing
      try {
        const uploadResult = await utapi.uploadFiles(imageFile);

        if (!uploadResult.data || uploadResult.error) {
          throw new Error(uploadResult.error?.message || "Error al subir la imagen");
        }

        imageURL = uploadResult.data.url;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        return {
          success: false,
          error: "Error al subir la imagen del perfil. Por favor intenta de nuevo.",
        };
      }
    }

    // Build update data
    const updateData: Partial<typeof users.$inferInsert> = {};

    if (name !== null && name.trim()) updateData.name = name.trim();
    if (username !== null && username.trim()) updateData.username = username.trim();
    if (preferences !== undefined) updateData.preferences = preferences;
    if (imageURL !== undefined) updateData.imageURL = imageURL;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No hay datos para actualizar" };
    }

    // Update user profile in database
    try {
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, user.id));

      revalidatePath("/profile");
      revalidatePath("/home");

      return { success: true };
    } catch (dbError) {
      // If database update fails and we uploaded an image, try to delete it
      if (imageURL) {
        try {
          const fileKey = imageURL.split("/").pop();
          if (fileKey) {
            await utapi.deleteFiles(fileKey);
          }
        } catch (deleteError) {
          console.error("Failed to cleanup uploaded image:", deleteError);
        }
      }

      console.error("Error updating profile in database:", dbError);
      return {
        success: false,
        error: dbError instanceof Error ? dbError.message : "Error al actualizar perfil",
      };
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar perfil",
    };
  }
}

