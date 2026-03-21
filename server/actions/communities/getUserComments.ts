"use server";

import { db } from "@/db";
import { comments, posts, users, communities } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function getUserComments(communityId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado", comments: [] };
    }

    const results = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        postId: comments.postId,
        postContent: posts.content,
        communityId: posts.communityId,
        communityName: communities.name,
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(and(eq(comments.userId, user.id), eq(posts.communityId, communityId)))
      .orderBy(desc(comments.createdAt))
      .limit(50); // Arbitrary limit for now

    return { success: true, comments: results };
  } catch (error) {
    console.error("Error fetching user comments:", error);
    return { success: false, error: "Error al cargar comentarios", comments: [] };
  }
}
