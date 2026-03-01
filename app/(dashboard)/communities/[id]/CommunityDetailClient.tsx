"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { PostCard } from "@/components/community/PostCard";
import { getCommunityPosts } from "@/server/actions/communities/getCommunityPosts";
import { getCommunityMembers } from "@/server/actions/communities/getCommunityMembers";
import { joinCommunity, leaveCommunity } from "@/server/actions/communities/actions";
import { createPostAction } from "@/server/actions/communities/createPostAction";
import { updateCommunity, deleteCommunity } from "@/server/actions/communities/manageCommunity";
import { banUser } from "@/server/actions/communities/moderation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/GlobalToast";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { UserAvatar } from "@/components/ui/UserAvatar";
import BookRecommendationSidebar from "@/components/community/BookRecommendationSidebar";
import { X, Upload, Users, MessageSquare, Search, Settings, Trash2, Camera, LogOut, ChevronUp, Slash } from "lucide-react";
import ImageCropper, { type AspectRatioOption } from "@/components/ui/ImageCropper";
import { fileToDataUrl, blobToFile } from "@/lib/imageUtils";

const POST_ASPECT_RATIOS: AspectRatioOption[] = [
    { label: "1:1", value: 1, icon: "square" },
    { label: "4:3", value: 4 / 3, icon: "landscape" },
    { label: "3:2", value: 3 / 2, icon: "landscape" },
    { label: "16:9", value: 16 / 9, icon: "landscape" },
    { label: "2:3", value: 2 / 3, icon: "portrait" },
];

// ─── Skeleton Components ─────────────────────────────────────────────────────

function PostCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm mb-4 animate-pulse">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-28" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-3" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-36" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-3" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-20" />
            </div>
            {/* Content */}
            <div className="space-y-2 mb-3">
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-full" />
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-5/6" />
                <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-2/3" />
            </div>
            {/* Actions */}
            <div className="flex items-center gap-4 border-t border-gray-100 dark:border-zinc-800/50 pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-[18px] h-[18px] rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-6" />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-[18px] h-[18px] rounded bg-gray-200 dark:bg-zinc-700" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-20" />
                </div>
            </div>
        </div>
    );
}

interface Community {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    genres: string[];
    ownerId: string;
    memberCount: number;
    isMember?: boolean;
    role?: "admin" | "moderator" | "member" | null;
}

const LITERARY_GENRES = ["Ficción", "No ficción", "Ciencia ficción", "Fantasía", "Terror", "Misterio", "Romance", "Thriller", "Aventura", "Drama", "Poesía", "Biografía", "Historia", "Filosofía", "Ciencia", "Autoayuda", "Negocios", "Infantil", "Juvenil", "Manga", "Cómic", "Arte", "Cocina", "Viajes", "Religión", "Política", "Psicología", "Educación", "Tecnología", "Deportes"];

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

interface Member {
    id: string;
    name: string;
    username: string;
    imageURL: string | null;
    role: string;
    joinedAt: Date;
}

type DetailTab = "posts" | "members";

interface CommunityDetailClientProps {
    community: Community;
    initialPosts: Post[];
    initialHasMore: boolean;
}

export default function CommunityDetailClient({ community: initialCommunity, initialPosts, initialHasMore }: CommunityDetailClientProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [community, setCommunity] = useState<Community>(initialCommunity);
    const [activeTab, setActiveTab] = useState<DetailTab>("posts");
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [joined, setJoined] = useState(!!initialCommunity.isMember);
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [posting, setPosting] = useState(false);

    // Members state
    const [members, setMembers] = useState<Member[]>([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersLoaded, setMembersLoaded] = useState(false);

    // Edit/Delete state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editName, setEditName] = useState(community.name);
    const [editDescription, setEditDescription] = useState(community.description || "");
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Cropper state for community edit image
    const [showEditCropper, setShowEditCropper] = useState(false);
    const [editCropperSrc, setEditCropperSrc] = useState<string | null>(null);

    // Cropper state for post images
    const [showPostCropper, setShowPostCropper] = useState(false);
    const [postCropperSrc, setPostCropperSrc] = useState<string | null>(null);

    const isAdmin = community.role === "admin";
    const isOwner = session?.user?.id === community.ownerId;
    const [leaving, setLeaving] = useState(false);

    // Scroll-collapse header
    const [headerCollapsed, setHeaderCollapsed] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current) return;
        const scrollTop = scrollContainerRef.current.scrollTop;
        setHeaderCollapsed(scrollTop > 120);
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };

    const loaderRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editImageInputRef = useRef<HTMLInputElement>(null);

    const handleJoin = async () => {
        const result = await joinCommunity(community.id);
        if (result.success) {
            setJoined(true);
            setCommunity(prev => ({ ...prev, memberCount: prev.memberCount + 1 }));
            toast("Te has unido a la comunidad!", "success");
        } else {
            toast(result.error || "Error al unirse", "error");
        }
    };

    const handleLeave = async () => {
        if (isOwner) {
            toast("No puedes abandonar una comunidad que creaste", "error");
            return;
        }
        if (!confirm("¿Estás seguro de que quieres abandonar esta comunidad?")) return;
        setLeaving(true);
        const result = await leaveCommunity(community.id);
        setLeaving(false);
        if (result.success) {
            setJoined(false);
            setCommunity(prev => ({ ...prev, memberCount: Math.max(0, prev.memberCount - 1) }));
            toast("Has abandonado la comunidad", "success");
        } else {
            toast(result.error || "Error al abandonar", "error");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!validTypes.includes(file.type)) {
                toast("Tipo de archivo no válido. Solo JPG, PNG y WebP.", "error");
                return;
            }
            // Open cropper for post images
            const dataUrl = await fileToDataUrl(file);
            setPostCropperSrc(dataUrl);
            setShowPostCropper(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handlePostCropComplete = (blob: Blob, preview: string) => {
        setImageFile(blobToFile(blob, "post-image"));
        setPreviewUrl(preview);
        setShowPostCropper(false);
        setPostCropperSrc(null);
    };

    const handlePostCropCancel = () => {
        setShowPostCropper(false);
        setPostCropperSrc(null);
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
            closePostModal();

            if (session?.user) {
                const newPost = {
                    ...result.post,
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
        if (!loaderRef.current || !hasMore || loading || activeTab !== "posts") return;

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
    }, [page, hasMore, loading, activeTab]);

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

    // Load members when switching to members tab
    const loadMembers = async (query = "") => {
        setMembersLoading(true);
        try {
            const result = await getCommunityMembers({ communityId: community.id, query, limit: 50 });
            if (result.success && result.members) {
                setMembers(result.members as Member[]);
                setMembersLoaded(true);
            }
        } finally {
            setMembersLoading(false);
        }
    };

    const handleTabChange = (tab: DetailTab) => {
        setActiveTab(tab);
        if (tab === "members" && !membersLoaded) {
            loadMembers();
        }
    };

    const handleMemberSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        await loadMembers(memberSearch);
    };

    // Debounced member search
    useEffect(() => {
        if (activeTab !== "members" || !membersLoaded) return;
        const timer = setTimeout(() => {
            loadMembers(memberSearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [memberSearch]);

    const closePostModal = () => {
        setShowPostModal(false);
        setPostContent("");
        removeImage();
    }

    // ─── Edit/Delete Handlers ──────────────────────────────────────────────────────

    const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!validTypes.includes(file.type)) {
                toast("Tipo de archivo no válido. Solo JPG, PNG y WebP.", "error");
                return;
            }
            // Open cropper instead of directly setting
            const dataUrl = await fileToDataUrl(file);
            setEditCropperSrc(dataUrl);
            setShowEditCropper(true);
            if (editImageInputRef.current) editImageInputRef.current.value = "";
        }
    };

    const handleEditCropComplete = (blob: Blob, previewUrl: string) => {
        setEditImageFile(blobToFile(blob, "community-image"));
        setEditImagePreview(previewUrl);
        setShowEditCropper(false);
        setEditCropperSrc(null);
    };

    const handleEditCropCancel = () => {
        setShowEditCropper(false);
        setEditCropperSrc(null);
    };

    const removeEditImage = () => {
        setEditImageFile(null);
        if (editImagePreview) {
            URL.revokeObjectURL(editImagePreview);
            setEditImagePreview(null);
        }
        if (editImageInputRef.current) editImageInputRef.current.value = "";
    };

    const openEditModal = () => {
        setEditName(community.name);
        setEditDescription(community.description || "");
        setEditImageFile(null);
        setEditImagePreview(null);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        removeEditImage();
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) {
            toast("El nombre es requerido", "error");
            return;
        }
        setSaving(true);

        const formData = new FormData();
        formData.append("communityId", community.id);
        formData.append("name", editName);
        formData.append("description", editDescription);
        if (editImageFile) {
            formData.append("image", editImageFile);
        }

        const result = await updateCommunity(formData);
        setSaving(false);

        if (result.success && result.community) {
            toast("Comunidad actualizada exitosamente", "success");
            setCommunity(prev => ({
                ...prev,
                name: result.community!.name,
                description: result.community!.description,
                imageUrl: result.community!.imageUrl,
                genres: result.community!.genres || [],
            }));
            closeEditModal();
        } else {
            toast(result.error || "Error al actualizar", "error");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        const result = await deleteCommunity(community.id);
        setDeleting(false);

        if (result.success) {
            toast("Comunidad eliminada exitosamente", "success");
            router.push("/communities");
        } else {
            toast(result.error || "Error al eliminar", "error");
            setShowDeleteConfirm(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-semibold">Admin</span>;
            case "moderator":
                return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold">Mod</span>;
            default:
                return null;
        }
    };

    const DETAIL_TABS: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
        { key: "posts", label: "Publicaciones", icon: <MessageSquare size={16} /> },
        { key: "members", label: "Miembros", icon: <Users size={16} /> },
    ];

    return (
        <>
            <div ref={scrollContainerRef} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm h-full overflow-y-auto custom-scrollbar relative">
                {/* Compact Sticky Header (appears on scroll) */}
                <div className={`sticky top-0 z-30 transition-all duration-300 overflow-hidden ${headerCollapsed ? "max-h-16 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 overflow-hidden relative flex-shrink-0">
                            {community.imageUrl ? (
                                <Image src={community.imageUrl} alt={community.name} fill className="object-cover" />
                            ) : (
                                <span className="flex items-center justify-center w-full h-full text-sm">👥</span>
                            )}
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white text-sm truncate flex-1">{community.name}</h2>
                        <div className="flex items-center gap-1.5">
                            {DETAIL_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.key
                                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-sm"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={scrollToTop} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-400 transition-colors" title="Volver arriba">
                            <ChevronUp size={16} />
                        </button>
                    </div>
                </div>

                {/* Cover/Header */}
                <div ref={headerRef} className="relative h-48 bg-gray-200 dark:bg-zinc-800">
                    {community.imageUrl && (
                        <Image src={community.imageUrl} alt={community.name} fill className="object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                        <div className="flex items-center gap-4 text-white flex-1">
                            <div className="w-20 h-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg relative overflow-hidden">
                                {community.imageUrl ? (
                                    <Image src={community.imageUrl} alt={community.name} fill className="object-cover rounded-xl" />
                                ) : (
                                    <span>👥</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold">{community.name}</h1>
                                <p className="opacity-90">{community.memberCount} miembros</p>
                                {joined && <span className="text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full mt-1">Miembro</span>}
                            </div>
                            {/* Admin Actions */}
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={openEditModal}
                                        className="p-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-colors"
                                        title="Editar comunidad"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="p-2.5 bg-red-500/30 backdrop-blur-sm hover:bg-red-500/50 rounded-xl transition-colors"
                                        title="Eliminar comunidad"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start bg-gray-50 dark:bg-zinc-800/50">
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-sm">
                            {community.description || "Sin descripción"}
                        </p>
                        {community.genres && community.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {community.genres.map((genre: string) => (
                                    <span key={genre} className="text-xs px-2 py-0.5 rounded-full bg-primary-light dark:bg-primary-dark/30 text-primary dark:text-primary-muted font-medium">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {joined && (
                            <button
                                onClick={() => setShowPostModal(true)}
                                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                + Crear Publicación
                            </button>
                        )}
                        {!joined && (
                            <button
                                onClick={handleJoin}
                                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Unirse
                            </button>
                        )}
                        {joined && isOwner && (
                            <button
                                disabled
                                className="px-6 py-2 bg-yellow-500/10 text-yellow-600 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm font-medium cursor-default flex items-center gap-1.5"
                                title="Eres el creador de esta comunidad"
                            >
                                👑 Creador
                            </button>
                        )}
                        {joined && !isOwner && (
                            <button
                                onClick={handleLeave}
                                disabled={leaving}
                                className="group px-6 py-2 bg-green-500/10 text-green-600 border border-green-200 dark:border-green-800 hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                            >
                                <span className="group-hover:hidden">{leaving ? "Saliendo..." : "✓ Miembro"}</span>
                                <span className="hidden group-hover:inline-flex items-center gap-1.5"><LogOut size={14} /> Abandonar</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Detail Tabs */}
                <div className="flex items-center gap-2 px-6 pt-4 pb-3 border-b border-gray-100 dark:border-zinc-800">
                    {DETAIL_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.key
                                ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary-glow"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-gray-50 dark:bg-zinc-950">
                    {/* Posts Tab */}
                    {activeTab === "posts" && (
                        <div className="p-6">
                            <div className="flex justify-center gap-6">
                                {/* Main Posts Column */}
                                <div className="w-full max-w-2xl">
                                    {posts.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            Aún no hay publicaciones en esta comunidad. ¡Sé el primero!
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {posts.map(post => (
                                                <PostCard key={post.id} post={post} />
                                            ))}
                                        </div>
                                    )}

                                    <div ref={loaderRef} className="py-4">
                                        {loading && (
                                            <div className="space-y-4">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <PostCardSkeleton key={`loading-${i}`} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Book Recommendations Sidebar */}
                                <div className="hidden xl:block w-80 flex-shrink-0">
                                    <div className="sticky top-6">
                                        <BookRecommendationSidebar
                                            communityId={community.id}
                                            currentUserId={session?.user?.id}
                                            isMember={joined}
                                            communityGenres={community.genres || []}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Tab */}
                    {activeTab === "members" && (
                        <div className="p-6">
                            {/* Member Search */}
                            <div className="mb-6 max-w-2xl mx-auto">
                                <form onSubmit={handleMemberSearch}>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                                            <Search size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            placeholder="Buscar miembros por nombre o usuario..."
                                            className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted focus:border-primary dark:focus:border-primary-muted focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-800 dark:text-gray-200 text-lg"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Members Count */}
                            {!membersLoading && members.length > 0 && (
                                <div className="max-w-2xl mx-auto mb-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {members.length} {members.length === 1 ? "miembro encontrado" : "miembros encontrados"}
                                    </p>
                                </div>
                            )}

                            {/* Members Loading */}
                            {membersLoading && (
                                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 p-5 animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-zinc-700" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full w-32" />
                                                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-24" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Members Grid */}
                            {!membersLoading && members.length > 0 && (
                                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {members.map((member) => (
                                        <MemberCard key={member.id} member={member} getRoleBadge={getRoleBadge} canModerate={community.role === "admin" || community.role === "moderator"} currentUserId={session?.user?.id} communityId={community.id} onBanned={(memberId) => { setMembers(prev => prev.filter(m => m.id !== memberId)); }} />
                                    ))}
                                </div>
                            )}

                            {/* No members found */}
                            {!membersLoading && membersLoaded && members.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">👥</div>
                                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                        {memberSearch ? "Sin resultados" : "No hay miembros"}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                        {memberSearch
                                            ? `No se encontraron miembros para "${memberSearch}". Intenta con otra búsqueda.`
                                            : "Esta comunidad aún no tiene miembros."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════════════════ */}
                {/* MODALS                                                            */}
                {/* ═══════════════════════════════════════════════════════════════════ */}

                {/* Create Post Modal */}
                {showPostModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-zinc-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Crear Publicación</h2>
                                <button onClick={closePostModal} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full">
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
                                        <Upload size={24} className="text-gray-400 group-hover:text-primary" />
                                    </div>
                                    <span className="text-sm font-medium">Click para subir una imagen</span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — se recortará</span>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                    />
                                </div>
                            )}
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
                                        <Upload size={24} className="text-gray-400 group-hover:text-primary" />
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
                                <button onClick={closePostModal} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancelar</button>
                                <button
                                    onClick={handleCreatePost}
                                    disabled={posting || !postContent.trim()}
                                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50 transition-colors"
                                >
                                    {posting ? "Publicando..." : "Publicar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Community Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-200 dark:border-zinc-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Comunidad</h2>
                                <button onClick={closeEditModal} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Community Image Upload */}
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Imagen de la comunidad
                                </label>
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => editImageInputRef.current?.click()}
                                        className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-300 dark:border-zinc-600 overflow-hidden relative flex-shrink-0 cursor-pointer group hover:border-primary dark:hover:border-primary-muted transition-colors"
                                    >
                                        {editImagePreview ? (
                                            <>
                                                <Image src={editImagePreview} alt="Preview" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera size={20} className="text-white" />
                                                </div>
                                            </>
                                        ) : community.imageUrl ? (
                                            <>
                                                <Image src={community.imageUrl} alt={community.name} fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera size={20} className="text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                                                <Camera size={24} />
                                                <span className="text-xs mt-1">Subir</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Haz clic en la imagen para cambiarla
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            JPG, PNG o WebP. Máximo 4MB.
                                        </p>
                                        {editImageFile && (
                                            <button
                                                onClick={removeEditImage}
                                                className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1"
                                            >
                                                <X size={12} />
                                                Quitar nueva imagen
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={editImageInputRef}
                                        onChange={handleEditImageChange}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                    />
                                </div>
                            </div>

                            {/* Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    placeholder="Nombre de la comunidad"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    className="w-full px-4 py-2.5 border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                                    placeholder="Descripción de la comunidad"
                                    rows={3}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                />
                            </div>

                            {/* Genres (read-only) */}
                            {community.genres && community.genres.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Géneros literarios
                                    </label>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                        Los géneros se definen al crear la comunidad y no pueden modificarse
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {community.genres.map((genre: string) => (
                                            <span key={genre} className="text-xs px-3 py-1.5 rounded-full font-medium bg-primary-light dark:bg-primary-dark/30 text-primary dark:text-primary-muted">
                                                {genre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                <button
                                    onClick={closeEditModal}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving || !editName.trim()}
                                    className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50 transition-colors font-medium"
                                >
                                    {saving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-200 dark:border-zinc-700">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={28} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                    ¿Eliminar comunidad?
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
                                    Esta acción eliminará permanentemente la comunidad <strong className="text-gray-700 dark:text-gray-200">&quot;{community.name}&quot;</strong>,
                                    {" "}incluyendo todas sus publicaciones, comentarios y miembros. Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors text-gray-700 dark:text-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {deleting ? "Eliminando..." : "Sí, Eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Cropper Modal for community edit */}
            {showEditCropper && editCropperSrc && (
                <ImageCropper
                    imageSrc={editCropperSrc!}
                    aspectRatio={1}
                    onCropComplete={handleEditCropComplete}
                    onCancel={handleEditCropCancel}
                    quality={0.85}
                />
            )}

            {/* Image Cropper Modal for post images */}
            {showPostCropper && postCropperSrc && (
                <ImageCropper
                    imageSrc={postCropperSrc!}
                    aspectRatio={1}
                    onCropComplete={handlePostCropComplete}
                    onCancel={handlePostCropCancel}
                    quality={0.85}
                    aspectRatios={POST_ASPECT_RATIOS}
                />
            )}
        </>
    );
}

// ─── Member Card Component ─────────────────────────────────────────────────────

function MemberCard({
    member,
    getRoleBadge,
    canModerate,
    currentUserId,
    communityId,
    onBanned,
}: {
    member: Member;
    getRoleBadge: (role: string) => React.ReactNode;
    canModerate?: boolean;
    currentUserId?: string;
    communityId: string;
    onBanned?: (memberId: string) => void;
}) {
    const [imgError, setImgError] = useState(false);
    const [banning, setBanning] = useState(false);
    const showImage = member.imageURL && !imgError;

    const joinedDate = new Date(member.joinedAt).toLocaleDateString("es-MX", {
        month: "short",
        year: "numeric",
    });

    const isCurrentUser = currentUserId === member.id;
    const isAdmin = member.role === "admin";
    const showBanButton = canModerate && !isCurrentUser && !isAdmin;

    const handleBan = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`¿Estás seguro de banear a @${member.username}? Sus comentarios serán eliminados y sus libros recomendados removidos.`)) return;
        setBanning(true);
        try {
            const result = await banUser(communityId, member.id);
            if (result.success) {
                toast("Usuario baneado exitosamente", "success");
                onBanned?.(member.id);
            } else {
                toast(result.error || "Error al banear", "error");
            }
        } catch {
            toast("Error al banear usuario", "error");
        } finally {
            setBanning(false);
        }
    };

    return (
        <Link
            href={`/user/${member.username}`}
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-primary/30 dark:border-primary-dark/30 p-5 hover:shadow-xl hover:shadow-primary-glow hover:scale-[1.02] hover:border-primary dark:hover:border-primary-muted transition-all duration-300 cursor-pointer group block relative"
        >
            <div className="flex items-center gap-4">
                <UserAvatar
                    imageURL={member.imageURL}
                    name={member.name}
                    size="lg"
                    className="group-hover:ring-2 group-hover:ring-primary dark:group-hover:ring-primary-muted transition-all"
                />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-sm">
                            {member.name}
                        </h3>
                        {getRoleBadge(member.role)}
                    </div>
                    <p className="text-sm text-primary dark:text-primary-light truncate">
                        @{member.username}
                    </p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                        Desde {joinedDate}
                    </span>
                </div>

                {showBanButton && (
                    <button
                        onClick={handleBan}
                        disabled={banning}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 flex-shrink-0"
                        title={`Banear a @${member.username}`}
                    >
                        {banning ? (
                            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Slash size={16} />
                        )}
                    </button>
                )}
            </div>
        </Link>
    );
}
