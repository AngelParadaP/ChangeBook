"use server";

import { db } from "@/db";
import { communities, communityMembers, posts, users, postLikes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq, inArray, sql, and } from "drizzle-orm";

interface FeedParams {
  page?: number;
  limit?: number;
}

export async function getCommunityFeed({ page = 0, limit = 10 }: FeedParams = {}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
       // If not logged in, maybe show public posts from popular communities? Or just empty.
       // For now, require login.
       return { success: false, error: "No autorizado", posts: [] };
    }

    const offset = page * limit;

    // 1. Get communities user follows
    const subscribedCommunities = await db
      .select({ id: communityMembers.communityId })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.status, "active")));

    const communityIds = subscribedCommunities.map(c => c.id);

    if (communityIds.length === 0) {
      return { success: true, posts: [], hasMore: false, message: "No sigues ninguna comunidad aún." };
    }

    // 2. Query posts
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
      .where(inArray(posts.communityId, communityIds))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const postsWithLikes = await Promise.all(results.map(async (post) => {
        let hasLiked = false;
        // user is guaranteed to be present here due to check at top
        const [like] = await db.select().from(postLikes)
            .where(and(eq(postLikes.userId, user.id), eq(postLikes.postId, post.id)));
        hasLiked = !!like;
        return { ...post, hasLiked };
    }));

    return { success: true, posts: postsWithLikes, hasMore: results.length === limit };

  } catch (error) {
    console.error("Error fetching community feed:", error);
    return { success: false, error: "Error al cargar el feed de comunidades", posts: [] };
  }
}
