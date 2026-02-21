"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { PostCard } from "@/components/community/PostCard";
import { getCommunityPosts } from "@/server/actions/communities/getCommunityPosts";
import { joinCommunity } from "@/server/actions/communities/actions";
import { createPostAction } from "@/server/actions/communities/createPostAction";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/GlobalToast";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { X, Image as ImageIcon, Upload } from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount: number;
  isMember?: boolean;
  role?: "admin" | "moderator" | "member" | null;
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
    hasLiked?: boolean; // Added optional property
}

interface CommunityDetailClientProps {
  community: Community;
  initialPosts: Post[];
  initialHasMore: boolean;
}

export default function CommunityDetailClient({ community, initialPosts, initialHasMore }: CommunityDetailClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [joined, setJoined] = useState(!!community.isMember);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJoin = async () => {
    const result = await joinCommunity(community.id);
    if (result.success) {
      setJoined(true);
      toast("Te has unido a la comunidad!", "success");
    } else {
      toast(result.error || "Error al unirse", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 4 * 1024 * 1024) {
              toast("La imagen es demasiado grande (Máx 4MB)", "error");
              return;
          }
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const removeImage = () => {
      setImageFile(null);
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    
    const formData = new FormData();
    formData.append("communityId", community.id);
    formData.append("content", postContent);
    if (imageFile) {
        formData.append("image", imageFile);
    }

    const result = await createPostAction(formData);
    setPosting(false);

    if (result.success && result.post) {
      toast("Publicación creada", "success");
      closeModal();
      
      // We can't easily optimistic update with the real image URL immediately unless we use the returned post
      // The server action returns the post with imageUrl from DB
      if (session?.user) {
          const newPost = {
              ...result.post, // contains id, content, imageUrl, etc
              createdAt: new Date(),
              username: session.user.username || session.user.name || "Usuario",
              userImage: session.user.image || null,
              communityName: community.name,
              communityImage: community.imageUrl,
              likes: 0,
              hasLiked: false
          } as Post;
          
          setPosts([newPost, ...posts]);
      } else {
          window.location.reload();
      }
    } else {
      toast(result.error || "Error al publicar", "error");
    }
  };

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  const loadMorePosts = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const result = await getCommunityPosts({ communityId: community.id, page: nextPage, limit: 10 });
    
    if (result.success && result.posts) {
        setPosts(prev => [...prev, ...result.posts as Post[]]);
        setPage(nextPage);
        setHasMore(result.hasMore || false);
    }
    setLoading(false);
  };

  const closeModal = () => {
    setShowPostModal(false);
    setPostContent("");
    removeImage();
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
       {/* Cover/Header */}
       <div className="relative h-48 bg-gray-200 dark:bg-zinc-800">
          {community.imageUrl && (
              <Image src={community.imageUrl} alt={community.name} fill className="object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
              <div className="flex items-center gap-4 text-white">
                  <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg">
                      {community.imageUrl ? (
                          <Image src={community.imageUrl} alt={community.name} fill className="object-cover rounded-xl" />
                      ) : (
                          <span>👥</span>
                      )}
                  </div>
                  <div>
                      <h1 className="text-3xl font-bold">{community.name}</h1>
                      <p className="opacity-90">{community.memberCount} miembros</p>
                      {joined && <span className="text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full mt-1">Miembro</span>}
                  </div>
              </div>
          </div>
       </div>

       {/* Actions Bar */}
       <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
           <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-sm">
               {community.description || "Sin descripción"}
           </p>
           <div className="flex gap-2">
               <button 
                  onClick={() => setShowPostModal(true)}
                  className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
               >
                   + Crear Publicación
               </button>
               {!joined && (
                   <button 
                      onClick={handleJoin}
                      className="px-6 py-2 bg-light-purple hover:bg-dark-purple text-white rounded-lg text-sm font-medium transition-colors"
                   >
                       Unirse
                   </button>
               )}
               {joined && (
                   <button 
                      disabled
                      className="px-6 py-2 bg-green-500/10 text-green-600 border border-green-200 rounded-lg text-sm font-medium transition-colors cursor-default"
                   >
                       Eres miembro
                   </button>
               )}
           </div>
       </div>

       {/* Posts Feed */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-zinc-950">
           {posts.length === 0 ? (
               <div className="text-center py-12 text-gray-500">
                   Aún no hay publicaciones en esta comunidad. ¡Sé el primero!
               </div>
           ) : (
               <div className="max-w-2xl mx-auto space-y-4">
                   {posts.map(post => (
                       <PostCard key={post.id} post={post} />
                   ))}
               </div>
           )}
           
           <div ref={loaderRef} className="py-8 text-center">
               {loading && <div className="inline-block animate-spin text-2xl">📚</div>}
           </div>
       </div>

       {/* Create Post Modal */}
       {showPostModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
               <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                   <div className="flex justify-between items-center mb-4">
                       <h2 className="text-xl font-bold">Crear Publicación</h2>
                       <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
                           <X size={20} />
                       </button>
                   </div>
                   
                   <div className="mb-4">
                       <RichTextEditor 
                           content={postContent} 
                           onChange={setPostContent} 
                           placeholder="¿Qué quieres compartir con la comunidad?"
                           className="min-h-[200px]"
                       />
                   </div>

                   {previewUrl ? (
                       <div className="relative w-full h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden mb-4 group border border-gray-200 dark:border-zinc-700">
                           <Image src={previewUrl} alt="Upload preview" fill className="object-contain" />
                           <button 
                               onClick={removeImage}
                               className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-opacity"
                           >
                               <X size={16} />
                           </button>
                       </div>
                   ) : (
                       <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="mb-4 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                       >
                            <div className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                <Upload size={24} className="text-gray-400 group-hover:text-light-purple" />
                            </div>
                            <span className="text-sm font-medium">Click para subir una imagen</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (Máx 4MB)</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp" 
                            />
                       </div>
                   )}

                   <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                       <button onClick={closeModal} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
                       <button 
                          onClick={handleCreatePost}
                          disabled={posting || !postContent.trim()} 
                          className="px-6 py-2 bg-light-purple hover:bg-dark-purple text-white rounded-lg disabled:opacity-50 transition-colors"
                       >
                           {posting ? "Publicando..." : "Publicar"}
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}
