import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPersonalizedFeed } from "@/server/actions/feed/getPersonalizedFeed";
import HomeClient, { Book } from "./HomeClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const result = await getPersonalizedFeed({ page: 0, limit: 10 });
  const initialBooks = (result.success && result.books ? result.books : []) as Book[];
  const initialHasMore = result.success ? result.hasMore || false : false;

  return (
    <HomeClient
      initialBooks={initialBooks}
      initialHasMore={initialHasMore}
    />
  );
}
