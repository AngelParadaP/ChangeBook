import { notFound } from "next/navigation";
import { getCommunity } from "@/server/actions/communities/getCommunity";
import { getCommunityPosts } from "@/server/actions/communities/getCommunityPosts";
import CommunityDetailClient from "./CommunityDetailClient";

export default async function CommunityDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await getCommunity(params.id);
  
  if (!result.success || !result.community) {
    notFound();
  }

  const postsResult = await getCommunityPosts({ communityId: params.id, limit: 10 });
  const initialPosts = postsResult.success && postsResult.posts ? postsResult.posts : [];
  const initialHasMore = postsResult.success ? postsResult.hasMore || false : false;

  return (
    <CommunityDetailClient 
      community={result.community} 
      initialPosts={initialPosts} 
      initialHasMore={initialHasMore} 
    />
  );
}
