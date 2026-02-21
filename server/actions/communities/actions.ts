"use server";

import { db } from "@/db";
import { communityMembers, posts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function joinCommunity(communityId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    // Check if already a member
    const [existingMember] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, communityId)));

    if (existingMember) {
      return { success: false, error: "Ya eres miembro de esta comunidad" };
    }

    await db.insert(communityMembers).values({
      userId: user.id,
      communityId,
      role: "member",
    });

    return { success: true };
  } catch (error) {
    console.error("Error joining community:", error);
    return { success: false, error: "Error al unirse a la comunidad" };
  }
}

export async function createPost(data: { communityId: string; content: string; imageUrl?: string }) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }
    
    // Check membership before posting?
    const [member] = await db
      .select({ status: communityMembers.status })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, data.communityId)));

    if (!member) {
      return { success: false, error: "Debes ser miembro de la comunidad para publicar" };
    }

    if (member.status === "banned" || member.status === "muted") {
        return { success: false, error: "No tienes permiso para publicar en esta comunidad" };
    }

    const [newPost] = await db.insert(posts).values({
      content: data.content,
      imageUrl: data.imageUrl,
      userId: user.id,
      communityId: data.communityId,
    }).returning();

    return { success: true, post: newPost };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error: "Error al crear la publicación" };
  }
}
