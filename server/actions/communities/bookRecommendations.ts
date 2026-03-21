"use server";

import { db } from "@/db";
import {
  communityBookRecommendations,
  communityMembers,
  books,
  users,
  communities,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq, desc, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Recommend a book to a community.
 * Only community members can recommend their own books.
 * Book must have at least one genre matching the community's genres.
 */
export async function recommendBook(
  communityId: string,
  bookId: string,
  message?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "No autorizado" };

    // Must be an active member
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.status, "active")
        )
      );

    if (!membership) {
      return { success: false, error: "Debes ser miembro de la comunidad" };
    }

    // Must own the book
    const [book] = await db
      .select({ id: books.id, genres: books.genres })
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, user.id)));

    if (!book) {
      return { success: false, error: "Solo puedes recomendar tus propios libros" };
    }

    // Get community genres
    const [community] = await db
      .select({ genres: communities.genres })
      .from(communities)
      .where(eq(communities.id, communityId));

    // Validate genres match (only if community has genres set)
    if (community?.genres && community.genres.length > 0) {
      const bookGenresLower = (book.genres || []).map((g) => g.toLowerCase());
      const communityGenresLower = community.genres.map((g) => g.toLowerCase());
      const hasMatch = bookGenresLower.some((g) =>
        communityGenresLower.includes(g)
      );

      if (!hasMatch) {
        return {
          success: false,
          error:
            "El libro debe tener al menos un género que coincida con los de la comunidad",
        };
      }
    }

    // Check if already recommended
    const [existing] = await db
      .select({ id: communityBookRecommendations.id })
      .from(communityBookRecommendations)
      .where(
        and(
          eq(communityBookRecommendations.communityId, communityId),
          eq(communityBookRecommendations.bookId, bookId)
        )
      );

    if (existing) {
      return { success: false, error: "Este libro ya fue recomendado en esta comunidad" };
    }

    await db.insert(communityBookRecommendations).values({
      communityId,
      userId: user.id,
      bookId,
      message: message || null,
    });

    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error recommending book:", error);
    return { success: false, error: "Error al recomendar libro" };
  }
}

/**
 * Remove a book recommendation.
 */
export async function removeBookRecommendation(recommendationId: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: false, error: "No autorizado" };

    const [rec] = await db
      .select()
      .from(communityBookRecommendations)
      .where(eq(communityBookRecommendations.id, recommendationId));

    if (!rec) return { success: false, error: "Recomendación no encontrada" };

    const isOwner = rec.userId === user.id;

    let isMod = false;
    if (!isOwner) {
      const [member] = await db
        .select({ role: communityMembers.role })
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.userId, user.id),
            eq(communityMembers.communityId, rec.communityId)
          )
        );
      isMod = member?.role === "admin" || member?.role === "moderator";
    }

    if (!isOwner && !isMod) {
      return { success: false, error: "No autorizado" };
    }

    await db
      .delete(communityBookRecommendations)
      .where(eq(communityBookRecommendations.id, recommendationId));

    revalidatePath(`/communities/${rec.communityId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing recommendation:", error);
    return { success: false, error: "Error al eliminar recomendación" };
  }
}

/**
 * Get book recommendations for a specific community.
 * Excludes the current user's own books from results.
 * Supports pagination with offset.
 */
export async function getCommunityBookRecommendations(
  communityId: string,
  offset: number = 0,
  limit: number = 5,
  filterUserId?: string
) {
  try {
    const user = await getCurrentUser();

    let whereConditions = eq(
      communityBookRecommendations.communityId,
      communityId
    );

    // Build query
    const query = db
      .select({
        id: communityBookRecommendations.id,
        message: communityBookRecommendations.message,
        createdAt: communityBookRecommendations.createdAt,
        userId: communityBookRecommendations.userId,
        bookId: books.id,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookImageUrl: books.imageUrl,
        bookGenres: books.genres,
        bookStatus: books.status,
        username: users.username,
        userImage: users.imageURL,
      })
      .from(communityBookRecommendations)
      .innerJoin(books, eq(communityBookRecommendations.bookId, books.id))
      .innerJoin(users, eq(communityBookRecommendations.userId, users.id))
      .orderBy(desc(communityBookRecommendations.createdAt))
      .offset(offset)
      .limit(limit + 1); // +1 to check if there are more

    if (filterUserId) {
      query.where(
        and(whereConditions, eq(communityBookRecommendations.userId, filterUserId))
      );
    } else if (user?.id) {
      query.where(
        and(whereConditions, ne(communityBookRecommendations.userId, user.id))
      );
    } else {
      query.where(whereConditions);
    }

    const recs = await query;

    const hasMore = recs.length > limit;
    const results = hasMore ? recs.slice(0, limit) : recs;

    return { success: true, recommendations: results, hasMore };
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return { success: true, recommendations: [], hasMore: false };
  }
}

/**
 * Get book recommendations from all communities the user follows.
 * Excludes the current user's own books. Supports pagination.
 */
export async function getFollowedCommunitiesBookRecommendations(
  offset: number = 0,
  limit: number = 5
) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { success: true, recommendations: [], hasMore: false };

    // Get user's community IDs
    const memberships = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.userId, user.id),
          eq(communityMembers.status, "active")
        )
      );

    if (memberships.length === 0)
      return { success: true, recommendations: [], hasMore: false };

    const communityIds = memberships.map((m) => m.communityId);

    const recs = await db
      .select({
        id: communityBookRecommendations.id,
        message: communityBookRecommendations.message,
        createdAt: communityBookRecommendations.createdAt,
        userId: communityBookRecommendations.userId,
        bookId: books.id,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookImageUrl: books.imageUrl,
        bookGenres: books.genres,
        bookStatus: books.status,
        username: users.username,
        userImage: users.imageURL,
        communityId: communityBookRecommendations.communityId,
        communityName: communities.name,
      })
      .from(communityBookRecommendations)
      .innerJoin(books, eq(communityBookRecommendations.bookId, books.id))
      .innerJoin(users, eq(communityBookRecommendations.userId, users.id))
      .innerJoin(
        communities,
        eq(communityBookRecommendations.communityId, communities.id)
      )
      .where(
        and(
          inArray(communityBookRecommendations.communityId, communityIds),
          ne(communityBookRecommendations.userId, user.id)
        )
      )
      .orderBy(desc(communityBookRecommendations.createdAt))
      .offset(offset)
      .limit(limit + 1);

    const hasMore = recs.length > limit;
    const results = hasMore ? recs.slice(0, limit) : recs;

    return { success: true, recommendations: results, hasMore };
  } catch (error) {
    console.error("Error fetching followed recs:", error);
    return { success: true, recommendations: [], hasMore: false };
  }
}
