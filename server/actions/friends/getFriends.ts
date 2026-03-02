"use server";

import { db } from "@/db";
import { friends, users } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export interface FriendProfile {
    friendshipId: string;
    id: string;
    name: string;
    username: string;
    imageURL: string | null;
    studentCode: string;
}

export async function getFriends() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "No autenticado" };

        const currentUserId = session.user.id;

        const myFriends = await db.select({
            friendshipId: friends.id,
            requesterId: friends.requesterId,
            addresseeId: friends.addresseeId,
            friendId: users.id,
            friendName: users.name,
            friendUsername: users.username,
            friendImageURL: users.imageURL,
            friendStudentCode: users.studentCode,
        })
            .from(friends)
            .leftJoin(users, or(
                and(eq(friends.requesterId, currentUserId), eq(friends.addresseeId, users.id)),
                and(eq(friends.addresseeId, currentUserId), eq(friends.requesterId, users.id))
            ))
            .where(
                and(
                    or(
                        eq(friends.requesterId, currentUserId),
                        eq(friends.addresseeId, currentUserId)
                    ),
                    eq(friends.status, "accepted")
                )
            );

        // Filter and map since leftJoin can include nulls if constraints are weak, but here they shouldn't be
        const friendProfiles: FriendProfile[] = myFriends
            .filter(f => f.friendId !== null)
            .map(f => ({
                friendshipId: f.friendshipId,
                id: f.friendId!,
                name: f.friendName!,
                username: f.friendUsername!,
                imageURL: f.friendImageURL!,
                studentCode: f.friendStudentCode!
            }));

        return { success: true, friends: friendProfiles };
    } catch (error) {
        console.error("Error fetching friends:", error);
        return { success: false, error: "Error al obtener la lista de amigos" };
    }
}
