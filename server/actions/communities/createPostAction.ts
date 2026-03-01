"use server";

import { db } from "@/db";
import { posts, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { UTApi } from "uploadthing/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const utapi = new UTApi();

export async function createPostAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const communityId = formData.get("communityId") as string;
    const content = formData.get("content") as string;
    const image = formData.get("image");

    if (!communityId || !content) {
        return { success: false, error: "Faltan datos requeridos" };
    }

    // Check membership
    const [member] = await db
      .select({ status: communityMembers.status })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, communityId)));

    if (!member) {
      return { success: false, error: "Debes ser miembro para publicar" };
    }

    if (member.status === "banned" || member.status === "muted") {
        return { success: false, error: "No tienes permiso para publicar" };
    }

    let imageUrl: string | null = null;

    // Handle Image Upload Server-Side
    if (image instanceof File && image.size > 0) {
        // Validate type/size if needed (already done in createBook, can reuse logic)
        // 4MB limit
        if (image.size > 8 * 1024 * 1024) {
            return { success: false, error: "La imagen excede 4MB" };
        }
        
        try {
            const uploadResult = await utapi.uploadFiles(image);
            if (uploadResult.data && !uploadResult.error) {
                imageUrl = uploadResult.data.url;
            } else {
                console.error("UploadThing error:", uploadResult.error);
                return { success: false, error: "Error al subir imagen" };
            }
        } catch (e) {
            console.error("Upload error:", e);
            return { success: false, error: "Error al procesar la imagen" };
        }
    }

    const [newPost] = await db.insert(posts).values({
      content,
      imageUrl,
      userId: user.id,
      communityId,
    }).returning();

    revalidatePath(`/communities/${communityId}`);
    
    return { success: true, post: newPost };

  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: "Error al crear la publicación" };
  }
}
