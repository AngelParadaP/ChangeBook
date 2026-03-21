"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, MessageSquare, Trash2 } from "lucide-react";
import { togglePostLike } from "@/server/actions/communities/togglePostLike";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    likes: number;
    userId: string;
    username: string;
    userImage: string | null;
    communityId: string;
    communityName: string;
    communityImage: string | null;
    hasLiked?: boolean;
    commentsCount?: number;
  };
  currentUserId?: string;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [animating, setAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ref to track the "true" server state (debounce rapid clicks)
  const pendingRef = useRef(false);
  const serverLikedRef = useRef(post.hasLiked ?? false);
  const serverLikesRef = useRef(post.likes);

  const isOwner = currentUserId === post.userId;

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update — instant UI response
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;
    setLiked(newLiked);
    setLikes(newLikes);

    // Trigger pop animation
    if (newLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 300);
    }

    // Avoid duplicate in-flight requests
    if (pendingRef.current) return;
    pendingRef.current = true;

    try {
      const result = await togglePostLike(post.id);

      if (result.success) {
        // Server confirmed — update our "source of truth" refs
        serverLikedRef.current = result.liked!;
        serverLikesRef.current = newLikes;
      } else {
        // Server failed — roll back to last known server state
        setLiked(serverLikedRef.current);
        setLikes(serverLikesRef.current);
      }
    } catch {
      // Network error — roll back
      setLiked(serverLikedRef.current);
      setLikes(serverLikesRef.current);
    } finally {
      pendingRef.current = false;
    }
  }, [liked, likes, post.id]);

  return (
    <>
      <div className="bg-card border border-card-border rounded-xl p-4 hover:border-card-border transition-colors shadow-sm mb-4 relative group/card">
        {/* Delete button for post owner */}
        {isOwner && onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-card border border-card-border text-hint hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover/card:opacity-100 transition-all z-10 cursor-pointer"
            title="Eliminar publicación"
          >
            <Trash2 size={15} />
          </button>
        )}

        {/* Community Context - Top Bar */}
        <div className="flex items-center gap-2 mb-3 text-xs text-hint">
           <Link href={`/communities/${post.communityId}`} className="font-bold text-heading hover:underline flex items-center gap-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
               {post.communityImage && <Image src={post.communityImage} alt="" width={16} height={16} className="rounded-full" />}
               c/{post.communityName}
           </Link>
           <span>•</span>
           <span className="text-hint">Publicado por <Link href={`/user/${post.username}`} className="hover:underline hover:text-caption transition-colors cursor-pointer" onClick={(e) => e.stopPropagation()}>u/{post.username}</Link></span>
           <span>•</span>
           <span suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</span>
        </div>

        <Link href={`/communities/${post.communityId}/posts/${post.id}`} className="block group cursor-pointer">
            <div className="mb-3">
               <div 
                 className="text-heading text-sm line-clamp-4 prose dark:prose-invert max-w-none group-hover:text-caption transition-colors"
                 suppressHydrationWarning
                 dangerouslySetInnerHTML={{ __html: post.content }}
               />
            </div>

            {post.imageUrl && (
              <div className="mb-3 relative w-full h-80 rounded-lg overflow-hidden bg-soft border border-card-border">
                <Image src={post.imageUrl} alt="Post content" fill className="object-contain" />
              </div>
            )}
        </Link>

        <div className="flex items-center gap-4 text-hint text-sm border-t border-card-border/50 pt-3">
          <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all active:scale-95 select-none cursor-pointer ${
                liked 
                  ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' 
                  : 'hover:bg-soft'
              }`}
          >
            <Heart 
              size={18} 
              fill={liked ? "currentColor" : "none"} 
              className={`transition-transform duration-200 ${animating ? "scale-125" : "scale-100"}`}
            />
            <span className="tabular-nums">{likes}</span>
          </button>
          <Link href={`/communities/${post.communityId}/posts/${post.id}`} className="flex items-center gap-1.5 hover:bg-soft px-2 py-1 rounded-lg transition-colors cursor-pointer">
            <MessageSquare size={18} />
            <span>{post.commentsCount ?? 0} Comentarios</span>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          if (onDelete) onDelete(post.id);
        }}
        title="Eliminar Publicación"
        message={<p>¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p>}
        confirmLabel="Eliminar"
      />
    </>
  );
}

