"use server";

import { db } from "@/db";
import { posts, users, communities, postLikes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function getPost(postId: string) {
  try {
    const user = await getCurrentUser();

    const [post] = await db
      .select({
        id: posts.id,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        likes: posts.likes,
        userId: posts.userId,
        username: users.username,
        userImage: users.imageURL,
        communityId: posts.communityId,
        communityName: communities.name,
        communityImage: communities.imageUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .innerJoin(communities, eq(posts.communityId, communities.id))
      .where(eq(posts.id, postId));

    if (!post) {
      return { success: false, error: "Publicación no encontrada" };
    }

    let hasLiked = false;
    if (user?.id) {
        const [like] = await db.select().from(postLikes)
            .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, postId)));
        hasLiked = !!like;
    }

    return { success: true, post: { ...post, hasLiked } };
  } catch (error) {
    console.error("Error fetching post:", error);
    return { success: false, error: "Error al cargar la publicación" };
  }
}
