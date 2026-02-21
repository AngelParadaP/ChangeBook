"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { toast } from "@/components/ui/GlobalToast";
import { createComment } from "@/server/actions/communities/comments";
import { deletePost, deleteComment, banUser } from "@/server/actions/communities/moderation";
import { togglePostLike } from "@/server/actions/communities/togglePostLike";
import { CornerDownRight, MessageSquare, Trash2, Shield, ShieldCheck, Slash, Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    likes: number;
    userId: string;
    username: string;
    userImage: string | null;
    role: "admin" | "moderator" | "member" | null;
    replies: Comment[];
}

interface Post {
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
}

interface CommentItemProps {
    comment: Comment;
    depth?: number;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    onSubmit: (parentId: string) => void;
    submitting: boolean;
    currentUserRole?: string | null;
    onDelete: (id: string) => void;
    onBan: (userId: string) => void;
}

const CommentItem = ({ comment, depth = 0, replyingTo, setReplyingTo, replyContent, setReplyContent, onSubmit, submitting, currentUserRole, onDelete, onBan }: CommentItemProps) => {
    const isReplying = replyingTo === comment.id;
    const canModerate = currentUserRole === "admin" || currentUserRole === "moderator";
    
    return (
        <div className={`mt-4 ${depth > 0 ? "ml-4 pl-4 border-l-2 border-gray-100 dark:border-zinc-800" : ""}`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden relative">
                        {comment.userImage ? (
                            <Image src={comment.userImage} alt={comment.username} fill className="object-cover" />
                        ) : (
                            <span className="flex items-center justify-center h-full text-xs">👤</span>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{comment.username}</span>
                        {comment.role === 'admin' && <ShieldCheck size={14} className="text-blue-500" />}
                        {comment.role === 'moderator' && <Shield size={14} className="text-green-500" />}
                        <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                        </span>
                    </div>
                    
                    <div 
                        className="text-gray-700 dark:text-gray-300 text-sm prose dark:prose-invert max-w-none mb-2"
                        dangerouslySetInnerHTML={{ __html: comment.content }} 
                    />

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        >
                            <MessageSquare size={14} />
                            Responder
                        </button>
                        
                        {canModerate && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => {
                                        if (confirm("¿Eliminar comentario?")) onDelete(comment.id);
                                    }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                                    title="Eliminar comentario"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm(`¿Banear a ${comment.username}?`)) onBan(comment.userId);
                                    }}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                                    title="Banear usuario"
                                >
                                    <Slash size={14} />
                                </button>
                            </div>
                         )}
                    </div>

                    {isReplying && (
                        <div className="mt-4">
                            <RichTextEditor 
                                content={replyContent} 
                                onChange={setReplyContent} 
                                placeholder={`Respondiendo a ${comment.username}...`}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => setReplyingTo(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={() => onSubmit(comment.id)}
                                    disabled={submitting}
                                    className="px-3 py-1.5 text-xs font-medium bg-light-purple text-white rounded-lg disabled:opacity-50"
                                >
                                    Responder
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Recursive Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            depth={depth + 1}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            replyContent={replyContent}
                            setReplyContent={setReplyContent}
                            onSubmit={onSubmit}
                            submitting={submitting}
                            currentUserRole={currentUserRole}
                            onDelete={onDelete}
                            onBan={onBan}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface PostDetailClientProps {
    post: Post;
    initialComments: Comment[];
    currentUserRole?: string | null;
}

export default function PostDetailClient({ post, initialComments, currentUserRole }: PostDetailClientProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>(initialComments);

    useEffect(() => {
        setComments(initialComments);
    }, [initialComments]);

    const [replyContent, setReplyContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null); // commentId
    const [submitting, setSubmitting] = useState(false);
    
    // Post local state
    const [postLikes, setPostLikes] = useState(post.likes);
    const [postLiked, setPostLiked] = useState(post.hasLiked ?? false);

    const [showCommentBox, setShowCommentBox] = useState(false);

    const handleSubmitComment = async (parentId?: string) => {
        if (!replyContent.trim()) return;
        setSubmitting(true);
        
        const result = await createComment({ 
            postId: post.id, 
            content: replyContent, 
            parentId 
        });

        if (result.success && result.comment) {
            toast("Comentario publicado", "success");
            setReplyContent("");
            setReplyingTo(null);
            setShowCommentBox(false);
            router.refresh(); 
        } else {
            toast(result.error || "Error al comentar", "error");
        }
        setSubmitting(false);
    };

    const handleDeletePost = async () => {
        if (!confirm("¿Estás seguro de eliminar esta publicación permanently?")) return;
        const result = await deletePost(post.id);
        if (result.success) {
            toast("Publicación eliminada", "success");
            router.push(`/communities/${post.communityId}`);
        } else {
            toast(result.error || "Error al eliminar", "error");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const result = await deleteComment(commentId);
        if (result.success) {
            toast("Comentario eliminado", "success");
            router.refresh();
        } else {
            toast(result.error || "Error al eliminar", "error");
        }
    };

    const handleBanUser = async (userId: string) => {
        const result = await banUser(post.communityId, userId);
        if (result.success) {
            toast("Usuario baneado", "success");
        } else {
            toast(result.error || "Error al banear", "error");
        }
    };

    const handlePostLike = async () => {
        const newLiked = !postLiked;
        setPostLiked(newLiked);
        setPostLikes(prev => newLiked ? prev + 1 : prev - 1);
        
        const result = await togglePostLike(post.id);
        if (!result.success) {
            setPostLiked(!newLiked);
            setPostLikes(prev => !newLiked ? prev + 1 : prev - 1);
        }
    };

    const canModerate = currentUserRole === "admin" || currentUserRole === "moderator";

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden mb-6">
                 {/* Post Header */}
                 <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                     <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-zinc-800 overflow-hidden relative">
                                 {post.communityImage ? (
                                     <Image src={post.communityImage} alt={post.communityName} fill className="object-cover" />
                                 ) : (
                                     <span className="flex items-center justify-center h-full">👥</span>
                                 )}
                             </div>
                             <div>
                                 <h2 className="font-bold text-gray-900 dark:text-white">c/{post.communityName}</h2>
                                 <div className="flex items-center gap-2 text-xs text-gray-500">
                                     <span>Publicado por u/{post.username}</span>
                                     <span>•</span>
                                     <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</span>
                                 </div>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-2">
                             {canModerate && (
                                 <div className="flex items-center gap-2 mr-2 border-r border-gray-100 dark:border-zinc-800 pr-2">
                                    <button 
                                        onClick={handleDeletePost}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-lg transition-colors"
                                        title="Eliminar publicación permanentemente"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (confirm(`¿Banear a u/${post.username}?`)) handleBanUser(post.userId);
                                        }}
                                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-lg transition-colors"
                                        title={`Banear al usuario u/${post.username}`}
                                    >
                                        <Slash size={18} />
                                    </button>
                                 </div>
                             )}
                         </div>
                     </div>
                     
                     <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 mb-4">
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                     </div>
                     
                     {post.imageUrl && (
                         <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-zinc-800">
                             <Image src={post.imageUrl} alt="Post image" fill className="object-contain" />
                         </div>
                     )}

                     <div className="flex items-center gap-4 text-gray-500 text-sm font-medium pt-2 border-t border-gray-50 dark:border-zinc-800/50">
                        <button 
                            onClick={handlePostLike}
                            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${postLiked ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                            title={postLiked ? "Ya no me gusta" : "Me gusta"}
                        >
                            <Heart size={18} fill={postLiked ? "currentColor" : "none"} />
                            <span>{postLikes}</span>
                        </button>
                        <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 px-2 py-1 rounded-lg transition-colors">
                            <CornerDownRight size={18} />
                            <span>{comments.length} Comentarios</span>
                        </button>
                     </div>
                 </div>

                 {/* Comment Input (Top Level) */}
                 <div className="p-6 bg-gray-50 dark:bg-zinc-950/50">
                     {!showCommentBox ? (
                         <button 
                             onClick={() => setShowCommentBox(true)}
                             className="w-full text-left p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-500 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors flex items-center gap-2 shadow-sm"
                         >
                             <MessageSquare size={18} />
                             <span>Escribir un comentario...</span>
                         </button>
                     ) : (
                         <div className="animate-in fade-in zoom-in-95 duration-200">
                             <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Dejar un comentario</p>
                             <RichTextEditor 
                                 content={replyContent} 
                                 onChange={(c) => setReplyContent(c)} 
                                 placeholder="¿Qué opinas?"
                             />
                             <div className="flex justify-end gap-2 mt-2">
                                 <button 
                                     onClick={() => setShowCommentBox(false)}
                                     className="px-3 py-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-sm transition-colors"
                                 >
                                     Cancelar
                                 </button>
                                 <button 
                                     onClick={() => handleSubmitComment()}
                                     disabled={submitting || !replyContent.trim()}
                                     className="px-4 py-2 bg-light-purple hover:bg-dark-purple text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                                 >
                                     {submitting ? "Publicando..." : "Comentar"}
                                 </button>
                             </div>
                         </div>
                     )}
                 </div>
            </div>

            {/* Comments List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-lg mb-6">Comentarios</h3>
                {comments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay comentarios aún. ¡Sé el primero!</p>
                ) : (
                    <div className="space-y-6">
                        {comments.map(comment => (
                            <CommentItem 
                                key={comment.id} 
                                comment={comment}
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                replyContent={replyContent}
                                setReplyContent={setReplyContent}
                                onSubmit={handleSubmitComment}
                                submitting={submitting}
                                currentUserRole={currentUserRole}
                                onDelete={handleDeleteComment}
                                onBan={handleBanUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
