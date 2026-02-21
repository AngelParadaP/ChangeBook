"use server";

import { db } from "@/db";
import { comments, posts, users, communityMembers, communities } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export async function createComment({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check membership?
    const [post] = await db.select({ cid: posts.communityId }).from(posts).where(eq(posts.id, postId));
    if (!post) return { success: false, error: "Publicación no encontrada" };

    const [membership] = await db.select({ status: communityMembers.status })
        .from(communityMembers)
        .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, post.cid)));
    
    if (!membership) { 
        return { success: false, error: "Debes ser miembro para comentar" };
    }

    if (membership.status === "banned" || membership.status === "muted") {
        return { success: false, error: "No puedes comentar en esta comunidad" };
    }

    const [newComment] = await db.insert(comments).values({
      content,
      postId,
      userId: user.id,
      parentId: parentId || null,
    }).returning();

    return { success: true, comment: newComment };
  } catch (error) {
    console.error("Error creating comment:", error);
    return { success: false, error: "Error al crear el comentario" };
  }
}

export async function getComments(postId: string) {
    try {
        // Fetch all comments for post
        // We will build hierarchy in JS to avoid complex recursive CTEs for now, assuming valid scale.
        const allComments = await db.select({
            id: comments.id,
            content: comments.content,
            parentId: comments.parentId,
            createdAt: comments.createdAt,
            likes: comments.likes,
            userId: comments.userId,
            username: users.username,
            userImage: users.imageURL,
            role: communityMembers.role, // User's role in the community of this post?
            // Wait, we need to join communityMembers on (user, community)
            // But we don't have communityId in comments table easily? 
            // We can get communityId from parameters if needed or join via posts.
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        // To get role, we need communityId.
        .leftJoin(posts, eq(comments.postId, posts.id))
        .leftJoin(communityMembers, and(eq(communityMembers.userId, comments.userId), eq(communityMembers.communityId, posts.communityId)))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt));

        // Build tree
        // Map by ID
        const commentMap = new Map();
        const rootComments: any[] = [];

        allComments.forEach(c => {
            commentMap.set(c.id, { ...c, replies: [] });
        });

        allComments.forEach(c => {
            if (c.parentId) {
                const parent = commentMap.get(c.parentId);
                if (parent) {
                    parent.replies.push(commentMap.get(c.id));
                } else {
                    // Parent deleted or missing? Treat as root? Or ignore?
                    // Safe to treat as root if parent missing for UI resilience
                    rootComments.push(commentMap.get(c.id));
                }
            } else {
                rootComments.push(commentMap.get(c.id));
            }
        });

        // Sort replies ? asc or desc? usually replies are asc (oldest first) or desc (newest).
        // Reddit uses score. We use date.
        // Let's keep them as is (desc from query).

        return { success: true, comments: rootComments };
    } catch (error) {
        console.error("Error fetching comments:", error);
        return { success: false, error: "Error al cargar comentarios", comments: [] };
    }
}
