"use server";

import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function createCommunity(data: {
  name: string;
  description: string;
  imageUrl?: string;
  genres?: string[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "No autorizado" };
    }

    const { name, description, imageUrl, genres } = data;

    // Use transaction to ensure both community creation and initial membership occur
    const result = await db.transaction(async (tx) => {
      const [newCommunity] = await tx
        .insert(communities)
        .values({
          name,
          description,
          imageUrl: imageUrl || null,
          genres: genres || [],
          ownerId: user.id,
        })
        .returning();

      if (!newCommunity) {
        throw new Error("Failed to create community");
      }

      await tx.insert(communityMembers).values({
        userId: user.id,
        communityId: newCommunity.id,
        role: "admin",
      });

      return newCommunity;
    });

    return { success: true, community: result };
  } catch (error) {
    console.error("Error creating community:", error);
    if ((error as any).code === "23505") { // Unique constraint violation (duplicate name)
      return { success: false, error: "El nombre de la comunidad ya existe" };
    }
    return { success: false, error: "Error al crear la comunidad" };
  }
}
