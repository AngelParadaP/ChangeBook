"use server";

import { db } from "@/db";
import { communities, communityMembers, posts, comments, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { revalidatePath } from "next/cache";

const utapi = new UTApi();

export async function updateCommunity(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const communityId = formData.get("communityId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const genresRaw = formData.get("genres") as string | null;
    const image = formData.get("image");

    if (!communityId) {
      return { success: false, error: "Faltan datos requeridos" };
    }

    // Verify admin role
    const [membership] = await db
      .select({ role: communityMembers.role })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (!membership || membership.role !== "admin") {
      return { success: false, error: "Solo el administrador puede editar la comunidad" };
    }

    // Build update data
    const updateData: Partial<typeof communities.$inferInsert> = {};

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    // Allow clearing description
    if (description !== null && description !== undefined) {
      updateData.description = description.trim() || null;
    }

    // Handle genres
    if (genresRaw !== null && genresRaw !== undefined) {
      try {
        updateData.genres = JSON.parse(genresRaw) as string[];
      } catch {
        updateData.genres = [];
      }
    }

    // Handle image upload
    if (image instanceof File && image.size > 0) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(image.type)) {
        return {
          success: false,
          error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.",
        };
      }

      if (image.size > 4 * 1024 * 1024) {
        return { success: false, error: "La imagen excede 4MB" };
      }

      try {
        // Get current image to delete later
        const [currentCommunity] = await db
          .select({ imageUrl: communities.imageUrl })
          .from(communities)
          .where(eq(communities.id, communityId));

        const uploadResult = await utapi.uploadFiles(image);
        if (uploadResult.data && !uploadResult.error) {
          updateData.imageUrl = uploadResult.data.url;

          // Delete old image if exists
          if (currentCommunity?.imageUrl) {
            try {
              const fileKey = currentCommunity.imageUrl.split("/").pop();
              if (fileKey) {
                await utapi.deleteFiles(fileKey);
              }
            } catch (deleteError) {
              console.error("Failed to delete old community image:", deleteError);
            }
          }
        } else {
          console.error("UploadThing error:", uploadResult.error);
          return { success: false, error: "Error al subir imagen" };
        }
      } catch (e) {
        console.error("Upload error:", e);
        return { success: false, error: "Error al procesar la imagen" };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No hay datos para actualizar" };
    }

    const [updated] = await db
      .update(communities)
      .set(updateData)
      .where(eq(communities.id, communityId))
      .returning();

    revalidatePath(`/communities/${communityId}`);
    revalidatePath("/communities");

    return { success: true, community: updated };
  } catch (error) {
    console.error("Error updating community:", error);
    if ((error as any).code === "23505") {
      return { success: false, error: "El nombre de la comunidad ya existe" };
    }
    return { success: false, error: "Error al actualizar la comunidad" };
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verify admin role
    const [membership] = await db
      .select({ role: communityMembers.role })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId)
        )
      );

    if (!membership || membership.role !== "admin") {
      return { success: false, error: "Solo el administrador puede eliminar la comunidad" };
    }

    // Delete in correct order to respect foreign keys
    await db.transaction(async (tx) => {
      // Get all post IDs in this community
      const communityPosts = await tx
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.communityId, communityId));

      const postIds = communityPosts.map((p) => p.id);

      if (postIds.length > 0) {
        // Delete post likes
        await tx
          .delete(postLikes)
          .where(inArray(postLikes.postId, postIds));

        // Delete comments on posts
        await tx
          .delete(comments)
          .where(inArray(comments.postId, postIds));

        // Delete posts
        await tx
          .delete(posts)
          .where(eq(posts.communityId, communityId));
      }

      // Delete community members
      await tx
        .delete(communityMembers)
        .where(eq(communityMembers.communityId, communityId));

      // Get community image to delete from UploadThing
      const [community] = await tx
        .select({ imageUrl: communities.imageUrl })
        .from(communities)
        .where(eq(communities.id, communityId));

      // Delete the community
      await tx
        .delete(communities)
        .where(eq(communities.id, communityId));

      // Try to delete image from UploadThing
      if (community?.imageUrl) {
        try {
          const fileKey = community.imageUrl.split("/").pop();
          if (fileKey) {
            await utapi.deleteFiles(fileKey);
          }
        } catch (deleteError) {
          console.error("Failed to delete community image:", deleteError);
        }
      }
    });

    revalidatePath("/communities");

    return { success: true };
  } catch (error) {
    console.error("Error deleting community:", error);
    return { success: false, error: "Error al eliminar la comunidad" };
  }
}
