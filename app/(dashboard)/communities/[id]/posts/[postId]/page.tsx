import { notFound } from "next/navigation";
import { getPost } from "@/server/actions/communities/getPost";
import { getComments } from "@/server/actions/communities/comments";
import { getUserRole } from "@/server/actions/communities/getUserRole";
import PostDetailClient from "./PostDetailClient";

export default async function PostDetailPage(props: { params: Promise<{ id: string; postId: string }> }) {
  const params = await props.params;
  const { id: communityId, postId } = params;

  // We should check if post belongs to communityId
  const result = await getPost(postId);
  
  if (!result.success || !result.post || result.post.communityId !== communityId) {
    notFound();
  }

  const commentsResult = await getComments(postId);
  const initialComments = commentsResult.success ? commentsResult.comments : [];
  
  const roleResult = await getUserRole(communityId);

  return <PostDetailClient post={result.post} initialComments={initialComments} currentUserRole={roleResult.role} />;
}
