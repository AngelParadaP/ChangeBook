
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
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 h-full overflow-y-auto custom-scrollbar">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden mb-6 p-12 text-center">
            <h2 className="text-2xl font-bold text-heading mb-2">Publicación no encontrada</h2>
            <p className="text-hint">Parece que esta publicación ha sido eliminada o ya no está disponible.</p>
        </div>
      </div>
    );
  }

  const commentsResult = await getComments(postId);
  const initialComments = commentsResult.success ? commentsResult.comments : [];
  
  const roleResult = await getUserRole(communityId);

  return <PostDetailClient post={result.post} initialComments={initialComments} currentUserRole={roleResult.role} />;
}
