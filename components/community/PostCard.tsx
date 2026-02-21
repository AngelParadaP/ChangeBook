"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, MessageSquare } from "lucide-react";
import { togglePostLike } from "@/server/actions/communities/togglePostLike";

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
  };
}

export function PostCard({ post }: PostCardProps) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(post.hasLiked ?? false);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;
      setLoading(true);
      
      const previousLiked = liked;
      const previousLikes = likes;
      
      const newLiked = !liked;
      setLiked(newLiked);
      setLikes(prev => newLiked ? prev + 1 : prev - 1);
      
      const result = await togglePostLike(post.id);
      
      if (!result.success) {
          // Revert
          setLiked(previousLiked);
          setLikes(previousLikes);
      }
      setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors shadow-sm mb-4">
      {/* Community Context - Top Bar */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
         <Link href={`/communities/${post.communityId}`} className="font-bold text-gray-900 dark:text-gray-100 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
             {post.communityImage && <Image src={post.communityImage} alt="" width={16} height={16} className="rounded-full" />}
             c/{post.communityName}
         </Link>
         <span>•</span>
         <span className="text-gray-400">Publicado por u/{post.username}</span>
         <span>•</span>
         <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</span>
      </div>

      <Link href={`/communities/${post.communityId}/posts/${post.id}`} className="block group">
          <div className="mb-3">
             <div 
               className="text-gray-800 dark:text-gray-200 text-sm line-clamp-4 prose dark:prose-invert max-w-none group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
               dangerouslySetInnerHTML={{ __html: post.content }}
             />
          </div>

          {post.imageUrl && (
            <div className="mb-3 relative w-full h-80 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
              <Image src={post.imageUrl} alt="Post content" fill className="object-contain" />
            </div>
          )}
      </Link>

      <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-100 dark:border-zinc-800/50 pt-3">
        <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${liked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span>{likes}</span>
        </button>
        <Link href={`/communities/${post.communityId}/posts/${post.id}`} className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 px-2 py-1 rounded-lg transition-colors">
          <MessageSquare size={18} />
          <span>Comentarios</span>
        </Link>
      </div>
    </div>
  );
}
