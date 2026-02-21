import { db } from "@/db";
import { communityMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

export async function getUserRole(communityId: string) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return { role: null };

    const [member] = await db
      .select({ role: communityMembers.role })
      .from(communityMembers)
      .where(and(eq(communityMembers.userId, user.id), eq(communityMembers.communityId, communityId)));

    return { role: member?.role || null };
  } catch (error) {
    console.error("Error getting user role:", error);
    return { role: null };
  }
}
