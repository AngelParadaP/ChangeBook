"use server";

import { db } from "@/db";
import { posts, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function togglePostLike(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    const [post] = await db.select({ communityId: posts.communityId }).from(posts).where(eq(posts.id, postId));
    if (!post) {
        return { success: false, error: "Publicación no encontrada" };
    }

    // Check if like exists
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));

    if (existingLike) {
      // Unlike
      await db.delete(postLikes)
        .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));
      
      await db.update(posts)
        .set({ likes: sql`${posts.likes} - 1` })
        .where(eq(posts.id, postId));
    } else {
      // Like
      await db.insert(postLikes).values({
        userId: user.id,
        postId,
      });

      await db.update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));
    }

    revalidatePath(`/communities/${post.communityId}`);
    revalidatePath(`/communities/${post.communityId}/posts/${postId}`);
    revalidatePath("/home");

    return { success: true, liked: !existingLike };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Error al dar like" };
  }
}

export async function hasUserLikedPost(postId: string) {
    const user = await getCurrentUser();
    if (!user || !user.id) return false;

    const [like] = await db.select().from(postLikes)
        .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));
    
    return !!like;
}
