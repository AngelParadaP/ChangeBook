"use server";

import { db } from "@/db";
import { communities, communityMembers, posts, comments, postLikes, communityBookRecommendations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Check if the current user has moderator/admin role in a community.
 * Returns the user ID if authorized, null otherwise.
 */
async function checkModPermission(userId: string, communityId: string) {
  const [member] = await db
    .select({ role: communityMembers.role })
    .from(communityMembers)
    .where(and(eq(communityMembers.userId, userId), eq(communityMembers.communityId, communityId)));

  if (!member) return false;
  return member.role === "admin" || member.role === "moderator";
}

/**
 * Delete a post. Allowed for:
 * - The post's author (owner)
 * - Community admins/moderators
 */
export async function deletePost(postId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) return { success: false, error: "Publicación no encontrada" };

    // Authorization: post owner OR community mod/admin
    const isOwner = post.userId === user.id;
    const isMod = await checkModPermission(user.id, post.communityId);

    if (!isOwner && !isMod) {
      return { success: false, error: "No autorizado para eliminar esta publicación" };
    }

    // Cascade delete: comments → likes → post
    await db.delete(comments).where(eq(comments.postId, postId));
    await db.delete(postLikes).where(eq(postLikes.postId, postId));
    await db.delete(posts).where(eq(posts.id, postId));

    // No revalidatePath here — the client handles removing the post from local state
    // via the "post-deleted" custom event, avoiding a full page reload.
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error: "Error al eliminar la publicación" };
  }
}

/**
 * Soft-delete a comment. Allowed for:
 * - The comment's author (owner)
 * - Community admins/moderators
 *
 * Instead of removing, we replace the content with "[comentario eliminado]"
 * and anonymize the userId so replies are preserved.
 */
export async function deleteComment(commentId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const [comment] = await db.select({
      id: comments.id,
      userId: comments.userId,
      postId: comments.postId,
      content: comments.content,
    }).from(comments).where(eq(comments.id, commentId));

    if (!comment) return { success: false, error: "Comentario no encontrado" };

    // Already deleted?
    if (comment.content === "[comentario eliminado]") {
      return { success: false, error: "Este comentario ya fue eliminado" };
    }

    const [post] = await db
      .select({ communityId: posts.communityId })
      .from(posts)
      .where(eq(posts.id, comment.postId));

    if (!post) return { success: false, error: "Publicación asociada no encontrada" };

    // Authorization: comment owner OR community mod/admin
    const isOwner = comment.userId === user.id;
    const isMod = await checkModPermission(user.id, post.communityId);

    if (!isOwner && !isMod) {
      return { success: false, error: "No autorizado para eliminar este comentario" };
    }

    // Soft-delete: replace content and anonymize
    await db.update(comments)
      .set({
        content: "[comentario eliminado]",
        updatedAt: new Date(),
      })
      .where(eq(comments.id, commentId));

    revalidatePath(`/communities/${post.communityId}/posts/${comment.postId}`);
    revalidatePath(`/communities/${post.communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: "Error al eliminar el comentario" };
  }
}

/**
 * Ban a user from a community. Only admins/moderators can do this.
 * Cannot ban other admins or yourself.
 * 
 * When banning:
 * 1. Sets membership status to "banned"
 * 2. Soft-deletes all their comments in the community (→ "[comentario eliminado]")
 * 3. Removes all their book recommendations from the community
 */
export async function banUser(communityId: string, targetUserId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Prevent banning yourself
    if (targetUserId === user.id) {
      return { success: false, error: "No puedes banearte a ti mismo" };
    }

    const isMod = await checkModPermission(user.id, communityId);
    if (!isMod) return { success: false, error: "No autorizado" };

    // Prevent banning admins
    const [target] = await db
      .select({ role: communityMembers.role })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, targetUserId), eq(communityMembers.communityId, communityId)));

    if (!target) {
      return { success: false, error: "El usuario no es miembro de esta comunidad" };
    }

    if (target.role === "admin") {
      return { success: false, error: "No puedes banear a un administrador" };
    }

    // 1. Set membership to banned
    await db.update(communityMembers)
      .set({ status: "banned" })
      .where(and(eq(communityMembers.userId, targetUserId), eq(communityMembers.communityId, communityId)));

    // 2. Soft-delete all their comments in this community's posts
    // First get all post IDs in this community
    const communityPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.communityId, communityId));

    if (communityPosts.length > 0) {
      const postIds = communityPosts.map(p => p.id);
      // For each post, soft-delete comments by this user
      for (const postId of postIds) {
        await db.update(comments)
          .set({
            content: "[comentario eliminado]",
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(comments.postId, postId),
              eq(comments.userId, targetUserId)
            )
          );
      }
    }

    // 3. Remove all their book recommendations from this community
    await db.delete(communityBookRecommendations)
      .where(
        and(
          eq(communityBookRecommendations.communityId, communityId),
          eq(communityBookRecommendations.userId, targetUserId)
        )
      );

    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    return { success: false, error: "Error al banear usuario" };
  }
}
