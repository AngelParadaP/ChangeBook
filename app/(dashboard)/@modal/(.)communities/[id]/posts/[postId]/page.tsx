
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
    return (
      <Modal>
        <div className="bg-card min-h-full flex items-center justify-center p-12 text-center">
            <div>
                <h2 className="text-2xl font-bold text-heading mb-2">Publicación no encontrada</h2>
                <p className="text-hint">Parece que esta publicación ha sido eliminada o ya no está disponible.</p>
            </div>
        </div>
      </Modal>
    );
  }

  const commentsResult = await getComments(postId);
  const initialComments = commentsResult.success ? commentsResult.comments : [];
  
  const roleResult = await getUserRole(communityId);

  return (
    <Modal>
      <div className="bg-card min-h-full">
         <PostDetailClient post={result.post} initialComments={initialComments} currentUserRole={roleResult.role} isModal />
      </div>
    </Modal>
  );
}
