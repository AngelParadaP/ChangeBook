"use server";

import { db } from "@/db";
import { communities, posts, users, postLikes, comments } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

interface GetPostsParams {
  communityId: string;
  page?: number;
  limit?: number;
}

export async function getCommunityPosts({ communityId, page = 0, limit = 10 }: GetPostsParams) {
  try {
    const user = await getCurrentUser();
    const offset = page * limit;

    const results = await db
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
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const postsWithLikes = await Promise.all(results.map(async (post) => {
        let hasLiked = false;
        if (user?.id) {
            const [like] = await db.select().from(postLikes)
              .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, post.id)));
            hasLiked = !!like;
        }

        const [{ count }] = await db.select({ count: sql<number>`count(*)` })
          .from(comments)
          .where(eq(comments.postId, post.id));

        return { ...post, hasLiked, commentsCount: Number(count) };
    }));

    return { success: true, posts: postsWithLikes, hasMore: results.length === limit };
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return { success: false, error: "Error al cargar publicaciones", posts: [] };
  }
}
