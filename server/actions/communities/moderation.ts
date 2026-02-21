"use server";

import { db } from "@/db";
import { communities, communityMembers, posts, comments, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function checkPermission(communityId: string, requiredRole: "admin" | "moderator") {
  const user = await getCurrentUser();
  if (!user || !user.id) return null;

  const [member] = await db
    .select({ role: communityMembers.role })
    .from(communityMembers)
    .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, communityId)));

  if (!member) return null;
  if (requiredRole === "admin" && member.role !== "admin") return null;
  if (requiredRole === "moderator" && member.role !== "admin" && member.role !== "moderator") return null;

  return user.id; // authorized
}

export async function deletePost(postId: string) {
  try {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) return { success: false, error: "Publicación no encontrada" };

    const userId = await checkPermission(post.communityId, "moderator");
    if (!userId && post.userId !== (await getCurrentUser())?.id) {
       return { success: false, error: "No autorizado" };
    }

    // Manual cascade delete
    await db.delete(comments).where(eq(comments.postId, postId));
    await db.delete(postLikes).where(eq(postLikes.postId, postId));
    await db.delete(posts).where(eq(posts.id, postId));
    revalidatePath(`/communities/${post.communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Error al eliminar la publicación" };
  }
}

export async function deleteComment(commentId: string) {
  try {
    // Need to find communityId via post
    const [comment] = await db.select({
        id: comments.id,
        userId: comments.userId,
        postId: comments.postId
    }).from(comments).where(eq(comments.id, commentId));
    
    if (!comment) return { success: false, error: "Comentario no encontrado" };

    const [post] = await db.select({ communityId: posts.communityId }).from(posts).where(eq(posts.id, comment.postId));
    if (!post) return { success: false, error: "Publicación asociada no encontrada" };

    const userId = await checkPermission(post.communityId, "moderator");
    if (!userId && comment.userId !== (await getCurrentUser())?.id) {
       return { success: false, error: "No autorizado" };
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    revalidatePath(`/communities/${post.communityId}/posts/${comment.postId}`);
    revalidatePath(`/communities/${post.communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Error al eliminar el comentario" };
  }
}

export async function banUser(communityId: string, targetUserId: string) {
    try {
        const userId = await checkPermission(communityId, "moderator");
        if (!userId) return { success: false, error: "No autorizado" };

        // Prevent banning self or other admins if just moderator?
        // Check target role
        const [target] = await db.select({ role: communityMembers.role }).from(communityMembers)
            .where(and(eq(communityMembers.userId, targetUserId), eq(communityMembers.communityId, communityId)));
        
        if (target && target.role === "admin") {
            return { success: false, error: "No puedes banear a un administrador" };
        }

        await db.update(communityMembers)
            .set({ status: "banned" })
            .where(and(eq(communityMembers.userId, targetUserId), eq(communityMembers.communityId, communityId)));
            
        return { success: true };
    } catch (error) {
        console.error("Error banning user:", error);
        return { success: false, error: "Error al banear usuario" };
    }
}
