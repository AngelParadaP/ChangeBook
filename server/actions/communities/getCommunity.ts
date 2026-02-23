import { db } from "@/db";
import { communities, communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, count, eq } from "drizzle-orm";

export async function getCommunity(id: string) {
  try {
    const [community] = await db
      .select({
        id: communities.id,
        name: communities.name,
        description: communities.description,
        imageUrl: communities.imageUrl,
        memberCount: count(communityMembers.userId).as("member_count"),
      })
      .from(communities)
      .leftJoin(communityMembers, eq(communities.id, communityMembers.communityId))
      .where(eq(communities.id, id))
      .groupBy(communities.id);

    if (!community) {
      return { success: false, error: "Comunidad no encontrada" };
    }

    const user = await getCurrentUser();
    let isMember = false;
    let role = null;
    
    if (user?.id) {
         const [membership] = await db.select({ role: communityMembers.role })
            .from(communityMembers)
            .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, id)));
         
         if (membership) {
             isMember = true;
             role = membership.role;
         }
    }
    
    // Format count
    const formattedCommunity = {
        ...community,
        memberCount: Number(community.memberCount),
        isMember,
        role
    };

    return { success: true, community: formattedCommunity };
  } catch (error) {
    console.error("Error fetching community:", error);
    return { success: false, error: "Error al cargar la comunidad" };
  }
}
