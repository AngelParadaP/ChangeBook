"use server";

import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function createCommunity(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const genresRaw = formData.get("genres") as string | null;
    const image = formData.get("image");

    if (!name || !name.trim()) {
      return { success: false, error: "El nombre es requerido" };
    }

    let genres: string[] = [];
    if (genresRaw) {
      try {
        genres = JSON.parse(genresRaw);
      } catch {
        genres = [];
      }
    }

    let finalImageUrl: string | null = null;
    
    // Process image if present
    if (image instanceof File && image.size > 0) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(image.type)) {
        return { success: false, error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP." };
      }

      if (image.size > 8 * 1024 * 1024) {
        return { success: false, error: "La imagen excede 4MB" };
      }

      try {
        const uploadResult = await utapi.uploadFiles(image);
        if (uploadResult.data && !uploadResult.error) {
          finalImageUrl = uploadResult.data.url;
        } else {
          return { success: false, error: "Error al subir imagen" };
        }
      } catch (e) {
        return { success: false, error: "Error al procesar la imagen" };
      }
    }

    // Use transaction to ensure both community creation and initial membership occur
    const result = await db.transaction(async (tx) => {
      const [newCommunity] = await tx
        .insert(communities)
        .values({
          name: name.trim(),
          description: description ? description.trim() : null,
          imageUrl: finalImageUrl,
          genres: genres,
          ownerId: user.id,
        })
        .returning();

      if (!newCommunity) {
        throw new Error("Failed to create community");
      }

      await tx.insert(communityMembers).values({
        userId: user.id,
        communityId: newCommunity.id,
        role: "admin",
      });

      return newCommunity;
    });

    return { success: true, community: result };
  } catch (error) {
    console.error("Error creating community:", error);
    if ((error as any).code === "23505") { // Unique constraint violation (duplicate name)
      return { success: false, error: "El nombre de la comunidad ya existe" };
    }
    return { success: false, error: "Error al crear la comunidad" };
  }
}
