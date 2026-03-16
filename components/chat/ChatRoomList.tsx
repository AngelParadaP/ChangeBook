"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatRooms } from "@/contexts/ChatContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MessageSquare, Loader2, Search, Inbox, Mail, X, Users } from "lucide-react";
import { getFriends, FriendProfile } from "@/server/actions/friends/getFriends";

type FilterTab = "all" | "unread" | "friends";

export function ChatRoomList() {
    const router = useRouter();
    const params = useParams();
    const activeRoomId = params?.roomId as string | undefined;
    const { rooms, loading } = useChatRooms();
    const [filterTab, setFilterTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [friends, setFriends] = useState<FriendProfile[]>([]);

    useEffect(() => {
        const loadFriends = async () => {
            try {
                const res = await getFriends();
                if (res.success && res.friends) {
                    setFriends(res.friends);
                }
            } catch (error) {
                console.error("Error loading friends in chat", error);
            }
        };
        loadFriends();
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    const handleToggleSearch = () => {
        if (searchOpen) {
            setSearchQuery("");
            setSearchOpen(false);
        } else {
            setSearchOpen(true);
        }
    };

    const filteredRooms = useMemo(() => {
        let filtered = rooms;

        // Filter by tab
        if (filterTab === "unread") {
            filtered = filtered.filter((room) => room.unreadCount > 0);
        } else if (filterTab === "friends") {
            const friendMap = new Set(friends.map((f) => f.username));
            filtered = filtered.filter((room) => friendMap.has(room.otherUser.username));
        }

        // Filter by person name/username only
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (room) =>
                    room.otherUser.name.toLowerCase().includes(query) ||
                    room.otherUser.username.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [rooms, filterTab, searchQuery]);

    const unreadCount = useMemo(
        () => rooms.filter((r) => r.unreadCount > 0).length,
        [rooms]
    );

    const formatTime = (date: Date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diffMs = now.getTime() - msgDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "ahora";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return msgDate.toLocaleDateString("es-MX", {
            month: "short",
            day: "numeric",
        });
    };

    // Highlight matching text in search results
    const highlightMatch = (text: string, query: string) => {
        if (!query.trim()) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="bg-primary/20 text-primary dark:text-primary-light rounded-sm px-0.5">
                    {text.slice(idx, idx + query.length)}
                </span>
                {text.slice(idx + query.length)}
            </>
        );
    };

    // Loading state
    if (loading && rooms.length === 0) {
        return (
            <div className="flex flex-col h-full">
                {/* Header skeleton */}
                <div className="flex items-center justify-between p-5">
                    <div className="space-y-1.5">
                        <div className="h-6 bg-dim rounded-full w-28 animate-pulse" />
                        <div className="h-3 bg-dim rounded-full w-36 animate-pulse" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-dim animate-pulse" />
                </div>
                {/* Skeleton tabs */}
                <div className="flex gap-1 px-4 pb-3">
                    <div className="h-8 bg-dim rounded-lg w-20 animate-pulse" />
                    <div className="h-8 bg-dim rounded-lg w-24 animate-pulse" />
                </div>
                {/* Skeleton items */}
                <div className="flex-1 overflow-y-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>
                            <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-dim flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-dim rounded-full w-28" />
                                    <div className="h-3 bg-dim rounded-full w-40" />
                                </div>
                                <div className="h-3 bg-dim rounded-full w-8" />
                            </div>
                            {i < 4 && <div className="mx-4 border-b border-card-border/60" />}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (rooms.length === 0) {
        return (
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-5">
                    <h1 className="text-2xl font-bold text-heading">Mensajes</h1>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={36} className="text-primary" />
                        </div>
                        <h3 className="font-semibold text-heading mb-1">No tienes conversaciones</h3>
                        <p className="text-hint text-sm max-w-[220px] mx-auto">
                            Visita el perfil de un usuario para iniciar un chat
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with search toggle */}
            <div className="p-5 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-heading">Mensajes</h1>
                    </div>
                    <button
                        onClick={handleToggleSearch}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${searchOpen
                            ? "bg-primary text-white shadow-sm"
                            : "bg-soft text-hint hover:bg-dim hover:text-heading"
                            }`}
                        title="Buscar"
                    >
                        {searchOpen ? <X size={16} /> : <Search size={16} />}
                    </button>
                </div>

                {/* Expandable search input */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${searchOpen ? "max-h-14 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
                        }`}
                >
                    <div className="relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar una conversación ..."
                            className="w-full pl-9 pr-8 py-2.5 bg-soft border border-card-border rounded-xl text-sm text-heading placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-4 pb-3">
                <button
                    onClick={() => setFilterTab("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterTab === "all"
                        ? "bg-primary text-white shadow-sm"
                        : "text-hint hover:bg-soft hover:text-heading"
                        }`}
                >
                    <Inbox size={14} />
                    Todos
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === "all"
                        ? "bg-white/20"
                        : "bg-dim"
                        }`}>
                        {rooms.length}
                    </span>
                </button>
                <button
                    onClick={() => setFilterTab("unread")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterTab === "unread"
                        ? "bg-primary text-white shadow-sm"
                        : "text-hint hover:bg-soft hover:text-heading"
                        }`}
                >
                    <Mail size={14} />
                    No leídos
                    {unreadCount > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterTab === "unread"
                            ? "bg-white/20"
                            : "bg-danger text-white"
                            }`}>
                            {unreadCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setFilterTab("friends")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${filterTab === "friends"
                        ? "bg-primary text-white shadow-sm"
                        : "text-hint hover:bg-soft hover:text-heading"
                        }`}
                >
                    <Users size={14} />
                    Amigos
                </button>
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredRooms.length === 0 ? (
                    <div className="flex items-center justify-center py-12 px-4">
                        <div className="text-center">
                            {filterTab === "unread" && !searchQuery ? (
                                <>
                                    <Mail size={32} className="text-hint mx-auto mb-2" />
                                    <p className="text-sm text-hint">No tienes mensajes sin leer</p>
                                </>
                            ) : filterTab === "friends" && !searchQuery ? (
                                <>
                                    <Users size={32} className="text-hint mx-auto mb-2" />
                                    <p className="text-sm text-hint">No tienes conversaciones con tus amigos</p>
                                </>
                            ) : (
                                <>
                                    <Search size={32} className="text-hint mx-auto mb-2" />
                                    <p className="text-sm text-hint">
                                        No se encontraron resultados para &quot;{searchQuery}&quot;
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-1">
                        {filteredRooms.map((room, index) => {
                            const isActive = activeRoomId === room.id;
                            const hasUnread = room.unreadCount > 0;
                            const query = searchQuery.trim().toLowerCase();

                            // Determine if this is a message-only match (for visual indicator)
                            const isMessageMatch =
                                query.length > 0 &&
                                !room.otherUser.name.toLowerCase().includes(query) &&
                                !room.otherUser.username.toLowerCase().includes(query) &&
                                (room.lastMessage?.content?.toLowerCase().includes(query) ?? false);

                            return (
                                <div key={room.id}>
                                    <button
                                        onClick={() => router.push(`/chat/${room.id}`)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 text-left cursor-pointer relative group ${isActive
                                            ? "bg-primary/8 dark:bg-primary-dark/15 border-l-[3px] border-primary"
                                            : "hover:bg-soft border-l-[3px] border-transparent"
                                            }`}
                                    >
                                        {/* Avatar with unread indicator */}
                                        <div className="relative flex-shrink-0">
                                            <UserAvatar
                                                imageURL={room.otherUser.imageURL}
                                                name={room.otherUser.name}
                                                size="md"
                                                useNextImage={false}
                                            />
                                            {hasUnread && (
                                                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-danger rounded-full border-2 border-card" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`truncate text-sm ${hasUnread
                                                    ? "font-bold text-heading"
                                                    : "font-semibold text-heading"
                                                    }`}>
                                                    {query && !isMessageMatch
                                                        ? highlightMatch(room.otherUser.name, query)
                                                        : room.otherUser.name}
                                                </h3>
                                                {room.lastMessage && (
                                                    <span className={`text-[11px] flex-shrink-0 ${hasUnread
                                                        ? "text-primary font-semibold"
                                                        : "text-hint"
                                                        }`}>
                                                        {formatTime(room.lastMessage.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-caption truncate mb-0.5">
                                                {query && !isMessageMatch
                                                    ? highlightMatch(`@${room.otherUser.username}`, query)
                                                    : `@${room.otherUser.username}`}
                                            </p>
                                            {room.lastMessage && (
                                                <p className={`text-xs truncate ${hasUnread
                                                    ? "text-body font-medium"
                                                    : "text-hint"
                                                    }`}>
                                                    {isMessageMatch
                                                        ? highlightMatch(room.lastMessage.content, query)
                                                        : room.lastMessage.content}
                                                </p>
                                            )}
                                        </div>

                                        {/* Unread badge */}
                                        {hasUnread && (
                                            <div className="flex-shrink-0 min-w-[22px] h-[22px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                                                {room.unreadCount > 9 ? "9+" : room.unreadCount}
                                            </div>
                                        )}
                                    </button>

                                    {/* Divider between items */}
                                    {index < filteredRooms.length - 1 && (
                                        <div className="mx-4 border-b border-card-border/60" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
