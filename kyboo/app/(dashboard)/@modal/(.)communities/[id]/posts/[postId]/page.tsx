import { notFound } from "next/navigation";
import { getPost } from "@/server/actions/communities/getPost";
import { getComments } from "@/server/actions/communities/comments";
import { getUserRole } from "@/server/actions/communities/getUserRole";
import PostDetailClient from "@/app/(dashboard)/communities/[id]/posts/[postId]/PostDetailClient";
import { Modal } from "@/components/ui/Modal";

export default async function InterceptedPostPage(props: { params: Promise<{ id: string; postId: string }> }) {
  const params = await props.params;
  const { id: communityId, postId } = params;

  const result = await getPost(postId);
  
  if (!result.success || !result.post || result.post.communityId !== communityId) {
    notFound();
  }

  const commentsResult = await getComments(postId);
  const initialComments = commentsResult.success ? commentsResult.comments : [];
  
  const roleResult = await getUserRole(communityId);

  return (
    <Modal>
      <div className="bg-white dark:bg-zinc-900 min-h-full">
         <PostDetailClient post={result.post} initialComments={initialComments} currentUserRole={roleResult.role} />
      </div>
    </Modal>
  );
}
