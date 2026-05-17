"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { ChatSkeleton } from "@/components/ui/skeletons";
import { getMessages, sendMessage, markAsRead, editMessage, getRoomInfo } from "@/server/actions/chat";
import type { Message } from "@/server/actions/chat/getMessages";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { User, ExternalLink, MessageSquare, ArrowLeft } from "lucide-react";

interface ChatWindowProps {
    roomId: string;
    otherUser?: {
        name: string;
        username: string;
        imageURL: string | null;
    };
}

/** Formats a date into a human-readable label for the date separator */
function formatDateLabel(date: Date): string {
    const now = new Date();
    const d = new Date(date);

    const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Hoy";
    if (isYesterday) return "Ayer";

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) {
        return d.toLocaleDateString("es-MX", { weekday: "long" });
    }

    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    }

    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

/** Returns a "YYYY-MM-DD" string to group messages by day */
function dateKey(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Returns a key for minute-grouping: sender + minute */
function minuteGroupKey(msg: Message): string {
    const d = new Date(msg.createdAt);
    return `${msg.senderId}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

export function ChatWindow({ roomId, otherUser: initialOtherUser }: ChatWindowProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [msgs, setMsgs] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState(initialOtherUser);
    const otherUserReady = !!otherUser;
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const shouldScrollRef = useRef(true);

    // ── Fetch room info if not provided ─────────────────────
    useEffect(() => {
        if (!initialOtherUser && roomId) {
            const fetchRoomInfo = async () => {
                const result = await getRoomInfo(roomId);
                if (result.success && result.otherUser) {
                    setOtherUser(result.otherUser);
                } else {
                    router.push("/chat");
                }
            };
            fetchRoomInfo();
        }
    }, [roomId, initialOtherUser, router]);

    // ── Load messages + Pusher subscription ──────────────────
    // Depends on roomId + otherUserReady (boolean, not object reference)
    useEffect(() => {
        if (!otherUserReady) return;

        loadMessages(false);

        const channelName = `room-${roomId}`;
        let pusherClient: any;

        import("@/lib/pusher-client").then((mod) => {
            pusherClient = mod.pusherClient;
            const channel = pusherClient.subscribe(channelName);

            channel.bind("new-message", (newMessage: any) => {
                setMsgs((prev) => {
                    const existsByRealId = prev.some((m) => m.id === newMessage.id);
                    if (existsByRealId) return prev;

                    if (newMessage.senderId === session?.user?.id) {
                        const tempIdx = prev.findIndex((m) => m.id.startsWith("temp-") && m.senderId === newMessage.senderId);
                        if (tempIdx !== -1) {
                            const updated = [...prev];
                            updated[tempIdx] = {
                                ...newMessage,
                                createdAt: new Date(newMessage.createdAt),
                            };
                            return updated;
                        }
                    }

                    return [...prev, {
                        ...newMessage,
                        createdAt: new Date(newMessage.createdAt),
                    }];
                });

                if (!document.hidden && newMessage.senderId !== session?.user?.id) {
                    markAsRead(roomId);
                }
            });

            channel.bind("message-edited", (data: { id: string; content: string; isEdited: boolean }) => {
                setMsgs((prev) =>
                    prev.map((m) =>
                        m.id === data.id ? { ...m, content: data.content, isEdited: true } : m
                    )
                );
            });

            channel.bind("messages-read", () => {
                setMsgs((prev) =>
                    prev.map((m) => (m.senderId === session?.user?.id ? { ...m, isRead: 1 } : m))
                );
            });
        });

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadMessages(true);
                markAsRead(roomId);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (pusherClient) {
                pusherClient.unsubscribe(channelName);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, otherUserReady]);

    // ── Auto-scroll on new messages ─────────────────────────
    useEffect(() => {
        if (chatContainerRef.current && shouldScrollRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [msgs]);

    // markAsRead is already handled by getMessages (autoMarkAsRead: true)

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);
        const result = await getMessages(roomId);
        if (result.success && result.messages) setMsgs(result.messages);
        if (!silent) setLoading(false);
    };

    // ── Optimistic send ─────────────────────────────────────
    const handleSendMessage = useCallback(async (content: string, imageUrl?: string) => {
        if (!session?.user?.id) return;

        // Optimistic insert
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            content: content || (imageUrl ? "📷 Imagen" : ""),
            imageUrl: imageUrl || null,
            senderId: session.user.id,
            isRead: 0,
            isEdited: false,
            createdAt: new Date(),
        };
        setMsgs((prev) => [...prev, optimisticMsg]);
        shouldScrollRef.current = true;

        setSending(true);
        const result = await sendMessage(roomId, content, imageUrl);

        if (result.success && result.messageId) {
            // Replace temp message with real ID, but only if Pusher hasn't already replaced it
            setMsgs((prev) => {
                const tempExists = prev.some((m) => m.id === tempId);
                if (!tempExists) return prev; // Pusher already replaced it
                return prev.map((m) => m.id === tempId ? { ...m, id: result.messageId! } : m);
            });
        } else if (!result.success) {
            // Remove optimistic message on failure
            setMsgs((prev) => prev.filter((m) => m.id !== tempId));
        }
        setSending(false);
    }, [roomId, session?.user?.id]);

    // ── Edit message handler ────────────────────────────────
    const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
        // Optimistic update
        setMsgs((prev) =>
            prev.map((m) =>
                m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
            )
        );

        const result = await editMessage(messageId, newContent);
        if (!result.success) {
            // Revert on failure
            loadMessages(true);
        }
    }, []);

    // ── Loading skeleton ───────────────────────────────────────────────
    if (loading || !otherUser) {
        return (
            <div className="flex flex-col h-full bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-dark to-primary text-white">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                        <User size={20} className="text-white/60" />
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-white/20 rounded w-32 mb-2 animate-pulse" />
                        <div className="h-3 bg-white/20 rounded w-20 animate-pulse" />
                    </div>
                </div>
                <ChatSkeleton count={6} />
                <div className="p-4 border-t border-card-border">
                    <div className="h-12 bg-dim rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    // ── Build items with date separators + minute grouping ──
    type RenderedItem =
        | { type: "separator"; key: string; label: string }
        | { type: "message"; key: string; message: Message; showTimestamp: boolean; isGroupTail: boolean };

    const items: RenderedItem[] = [];
    let lastDateKey = "";

    for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        const dKey = dateKey(new Date(msg.createdAt));
        if (dKey !== lastDateKey) {
            lastDateKey = dKey;
            items.push({ type: "separator", key: `sep-${dKey}`, label: formatDateLabel(new Date(msg.createdAt)) });
        }

        const nextMsg = msgs[i + 1];
        const thisGroupKey = minuteGroupKey(msg);
        const nextGroupKey = nextMsg ? minuteGroupKey(nextMsg) : "";
        const isGroupTail = thisGroupKey !== nextGroupKey;
        // Show timestamp only on the last message of each minute group
        const showTimestamp = isGroupTail;

        items.push({ type: "message", key: msg.id, message: msg, showTimestamp, isGroupTail });
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl shadow-sm overflow-hidden">

            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary-dark to-primary text-white shadow-md flex-shrink-0">
                <button
                    onClick={() => router.push("/chat")}
                    className="lg:hidden p-1.5 -ml-2 rounded-full hover:bg-white/20 transition-colors"
                    title="Volver a los chats"
                >
                    <ArrowLeft size={20} />
                </button>
                <Link
                    href={`/user/${otherUser.username}`}
                    className="flex items-center gap-3 flex-1 group min-w-0"
                    title={`Ver perfil de ${otherUser.name}`}
                >
                    <div className="flex-shrink-0 ring-2 ring-white/30 group-hover:ring-white/60 rounded-full transition-all">
                        <UserAvatar
                            imageURL={otherUser.imageURL}
                            name={otherUser.name}
                            size="sm"
                            useNextImage={false}
                        />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-base leading-tight group-hover:underline truncate flex items-center gap-1.5">
                            {otherUser.name}
                            <ExternalLink size={13} className="opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0" />
                        </h2>
                        <p className="text-xs text-white/75 truncate">@{otherUser.username}</p>
                    </div>
                </Link>
            </div>

            {/* ── Messages Container — with patterned background ──── */}
            <div className="relative flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "var(--color-chat-bg, var(--color-subtle))" }}>
                {/* ── Subtle WhatsApp-style doodle background ── */}
                <div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: "var(--chat-pattern-url)",
                        backgroundSize: "300px",
                        backgroundRepeat: "repeat",
                        opacity: "var(--chat-pattern-opacity)",
                        filter: "var(--chat-pattern-filter)",
                    }}
                />

                <div
                    ref={chatContainerRef}
                    className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
                    style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "var(--color-dim) transparent",
                    }}
                >
                    {msgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                                <MessageSquare size={28} className="text-primary/80" />
                            </div>
                            <p className="text-sm text-hint bg-card/70 backdrop-blur-sm px-4 py-2 rounded-full">
                                No hay mensajes aún. ¡Envía el primero!
                            </p>
                        </div>
                    ) : (
                        items.map((item) => {
                            if (item.type === "separator") {
                                return (
                                    <div key={item.key} className="flex items-center justify-center py-3">
                                        <span className="bg-card/80 backdrop-blur-sm text-hint text-[11px] font-medium px-3 py-1 rounded-full shadow-sm border border-card-border/30 select-none">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            }
                            const msg = item.message;
                            return (
                                <ChatBubble
                                    key={msg.id}
                                    id={msg.id}
                                    content={msg.content}
                                    imageUrl={msg.imageUrl}
                                    senderId={msg.senderId}
                                    currentUserId={session?.user?.id || ""}
                                    createdAt={new Date(msg.createdAt)}
                                    isRead={msg.isRead === 1}
                                    isEdited={msg.isEdited}
                                    showTimestamp={item.showTimestamp}
                                    isGroupTail={item.isGroupTail}
                                    onEdit={handleEditMessage}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Input ─────────────────────────────────────────────── */}
            <ChatInput onSend={handleSendMessage} disabled={sending} />
        </div>
    );
}
