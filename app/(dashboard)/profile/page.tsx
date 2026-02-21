import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserProfile } from "@/server/actions/user/getUserProfile";
import { getUserBooks } from "@/server/actions/user/getUserBooks";
import ProfileClient, { UserProfile, Book } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profileResult, booksResult] = await Promise.all([
    getUserProfile(session.user.id),
    getUserBooks(session.user.id),
  ]);

  const initialProfile = (profileResult.success ? profileResult.user : null) as UserProfile | null;
  const initialBooks = (booksResult.success ? booksResult.books : []) as Book[];

  return (
    <ProfileClient 
      initialProfile={initialProfile} 
      initialBooks={initialBooks} 
    />
  );
}
