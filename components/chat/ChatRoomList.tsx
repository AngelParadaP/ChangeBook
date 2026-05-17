"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useChatRooms } from "@/contexts/ChatContext";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { MessageSquare, Loader2, Search, Inbox, Mail, X, Users, EyeOff, Eye } from "lucide-react";
import { hideChat, unhideChat, getChatRooms } from "@/server/actions/chat";
import type { ChatRoom } from "@/contexts/ChatContext";

type FilterTab = "all" | "unread" | "friends" | "hidden";

export function ChatRoomList() {
    const router = useRouter();
    const params = useParams();
    const activeRoomId = params?.roomId as string | undefined;
    const { rooms, loading, friends, friendsLoading, refreshRooms } = useChatRooms();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get("tab") as FilterTab | null;
    const [filterTab, setFilterTab] = useState<FilterTab>(tabFromUrl && ["all", "unread", "friends", "hidden"].includes(tabFromUrl) ? tabFromUrl : "all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [optionsRoom, setOptionsRoom] = useState<{ id: string; name: string } | null>(null);
    const [hiddenRooms, setHiddenRooms] = useState<ChatRoom[]>([]);
    const [hiddenLoading, setHiddenLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Focus input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Load hidden rooms when tab switches to "hidden"
    useEffect(() => {
        if (filterTab === "hidden") {
            loadHiddenRooms();
        }
    }, [filterTab]);

    const loadHiddenRooms = async () => {
        setHiddenLoading(true);
        const result = await getChatRooms(true);
        if (result.success && result.rooms) {
            setHiddenRooms(result.rooms);
        }
        setHiddenLoading(false);
    };

    const handleToggleSearch = () => {
        if (searchOpen) {
            setSearchQuery("");
            setSearchOpen(false);
        } else {
            setSearchOpen(true);
        }
    };

    const handleHideChat = async (roomId: string) => {
        setActionLoading(true);
        const result = await hideChat(roomId);
        if (result.success) {
            await refreshRooms();
        }
        setOptionsRoom(null);
        setActionLoading(false);
    };

    const handleUnhideChat = async (roomId: string) => {
        setActionLoading(true);
        const result = await unhideChat(roomId);
        if (result.success) {
            await refreshRooms();
            await loadHiddenRooms();
        }
        setOptionsRoom(null);
        setActionLoading(false);
    };

    const filteredRooms = useMemo(() => {
        let filtered = filterTab === "hidden" ? hiddenRooms : rooms;

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
    }, [rooms, hiddenRooms, filterTab, searchQuery, friends]);

    const unreadCount = useMemo(
        () => rooms.filter((r) => r.unreadCount > 0 && r.id !== activeRoomId).length,
        [rooms, activeRoomId]
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
    if ((loading || friendsLoading) && rooms.length === 0) {
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
    if (rooms.length === 0 && filterTab !== "hidden") {
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

    const isHiddenTab = filterTab === "hidden";
    const displayRooms = filteredRooms;

    const changeTab = (tab: FilterTab) => {
        setFilterTab(tab);
        router.replace(activeRoomId ? `/chat/${activeRoomId}?tab=${tab}` : `/chat?tab=${tab}`, { scroll: false });
    };

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
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
                <button
                    onClick={() => changeTab("all")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterTab === "all"
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
                    onClick={() => changeTab("unread")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterTab === "unread"
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
                    onClick={() => changeTab("friends")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterTab === "friends"
                        ? "bg-primary text-white shadow-sm"
                        : "text-hint hover:bg-soft hover:text-heading"
                        }`}
                >
                    <Users size={14} />
                    Amigos
                </button>
                <button
                    onClick={() => changeTab("hidden")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${filterTab === "hidden"
                        ? "bg-primary text-white shadow-sm"
                        : "text-hint hover:bg-soft hover:text-heading"
                        }`}
                >
                    <EyeOff size={14} />
                    Ocultos
                </button>
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(isHiddenTab && hiddenLoading) ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={24} className="animate-spin text-hint" />
                    </div>
                ) : displayRooms.length === 0 ? (
                    <div className="flex items-center justify-center py-12 px-4">
                        <div className="text-center">
                            {isHiddenTab ? (
                                <>
                                    <EyeOff size={32} className="text-hint mx-auto mb-2" />
                                    <p className="text-sm text-hint">No tienes chats ocultos</p>
                                </>
                            ) : filterTab === "unread" && !searchQuery ? (
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
                        {displayRooms.map((room, index) => {
                            const isActive = activeRoomId === room.id;
                            // If this room is currently open, visually treat as read (no refetch needed)
                            const hasUnread = room.unreadCount > 0 && !isActive;
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
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setOptionsRoom({ id: room.id, name: room.otherUser.name });
                                        }}
                                        onClick={() => router.push(`/chat/${room.id}?tab=${filterTab}`)}
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
                                    {index < displayRooms.length - 1 && (
                                        <div className="mx-4 border-b border-card-border/60" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Options Modal */}
            {optionsRoom && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
                    onClick={() => setOptionsRoom(null)}
                >
                    <div
                        className="bg-card w-full sm:w-96 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-card-border/60">
                            <h3 className="font-bold text-heading text-center">Opciones del chat</h3>
                            <p className="text-xs text-caption text-center mt-0.5">{optionsRoom.name}</p>
                        </div>
                        <div className="p-2 flex flex-col">
                            {isHiddenTab ? (
                                <button
                                    onClick={() => handleUnhideChat(optionsRoom.id)}
                                    disabled={actionLoading}
                                    className="flex items-center gap-3 w-full p-3 hover:bg-soft text-heading rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-soft flex items-center justify-center">
                                        <Eye size={16} className="text-hint" />
                                    </div>
                                    {actionLoading ? "Mostrando..." : "Mostrar chat"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleHideChat(optionsRoom.id)}
                                    disabled={actionLoading}
                                    className="flex items-center gap-3 w-full p-3 hover:bg-soft text-heading rounded-xl transition-colors font-medium text-sm disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-soft flex items-center justify-center">
                                        <EyeOff size={16} className="text-hint" />
                                    </div>
                                    {actionLoading ? "Ocultando..." : "Ocultar chat"}
                                </button>
                            )}
                        </div>
                        <div className="p-2 border-t border-card-border/60">
                            <button
                                onClick={() => setOptionsRoom(null)}
                                className="w-full py-2.5 font-bold text-heading hover:bg-soft rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
