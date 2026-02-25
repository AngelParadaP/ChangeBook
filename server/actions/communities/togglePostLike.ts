"use server";

import { db } from "@/db";
import { posts, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq, sql } from "drizzle-orm";

export async function togglePostLike(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "Debes iniciar sesión" };
    }

    // Check if like exists
    const [existingLike] = await db
      .select({ id: postLikes.postId })
      .from(postLikes)
      .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));

    if (existingLike) {
      // Unlike — delete + decrement in parallel
      await Promise.all([
        db.delete(postLikes)
          .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId))),
        db.update(posts)
          .set({ likes: sql`GREATEST(${posts.likes} - 1, 0)` })
          .where(eq(posts.id, postId)),
      ]);
    } else {
      // Like — insert + increment in parallel
      await Promise.all([
        db.insert(postLikes).values({
          userId: user.id,
          postId,
        }),
        db.update(posts)
          .set({ likes: sql`${posts.likes} + 1` })
          .where(eq(posts.id, postId)),
      ]);
    }

    // NOTE: No revalidatePath here!
    // The client already handles optimistic updates.
    // Revalidating would cause a full page re-render that resets
    // the client state, causing the "flash" / sluggishness.

    return { success: true, liked: !existingLike };
  } catch (error) {
    console.error("Error toggling like:", error);
    return { success: false, error: "Error al dar like" };
  }
}

export async function hasUserLikedPost(postId: string) {
    const user = await getCurrentUser();
    if (!user || !user.id) return false;

    const [like] = await db.select({ id: postLikes.postId }).from(postLikes)
        .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));
    
    return !!like;
}
