"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { ChatSkeleton } from "@/components/ui/skeletons";
import { getMessages, sendMessage, markAsRead, getChatRooms } from "@/server/actions/chat";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { User, ExternalLink, MessageSquare } from "lucide-react";

interface Message {
    id: string;
    content: string;
    senderId: string;
    isRead: number;
    createdAt: Date;
}

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

export function ChatWindow({ roomId, otherUser: initialOtherUser }: ChatWindowProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState(initialOtherUser);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!initialOtherUser && roomId) {
            const fetchRoomInfo = async () => {
                const result = await getChatRooms();
                if (result.success && result.rooms) {
                    const room = result.rooms.find((r) => r.id === roomId);
                    if (room) {
                        setOtherUser(room.otherUser);
                    } else {
                        router.push("/chat");
                    }
                }
            };
            fetchRoomInfo();
        }
    }, [roomId, initialOtherUser, router]);

    useEffect(() => {
        if (!otherUser) return;

        // Carga inicial
        loadMessages(false);

        // Suscribirse al canal específico del cuarto con Pusher
        const channelName = `room-${roomId}`;

        let pusherClient: any;

        // Lo importamos dinámicamente para evitar problemas de SSR si fuera el caso
        import("@/lib/pusher-client").then((mod) => {
            pusherClient = mod.pusherClient;

            const channel = pusherClient.subscribe(channelName);
            channel.bind("new-message", (newMessage: Message) => {
                // Al recibir mensaje en tiempo real, lo agregamos al arreglo
                setMessages((prev) => {
                    // Evitar duplicados por si el poll o el insert ocurrieron al mismo tiempo
                    const exists = prev.some((msg) => msg.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, {
                        ...newMessage,
                        // Pusher transfiere fechas como Strings ISO, parsearlo
                        createdAt: new Date(newMessage.createdAt)
                    }];
                });

                // Si la ventana está visible y el mensaje NO es tuyo, marcamos todo como leído
                if (!document.hidden && newMessage.senderId !== session?.user?.id) {
                    markAsRead(roomId);
                }
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
    }, [roomId, otherUser]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        markAsRead(roomId);
    }, [roomId]);

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);
        const result = await getMessages(roomId);
        if (result.success && result.messages) setMessages(result.messages);
        if (!silent) setLoading(false);
    };

    const handleSendMessage = async (content: string) => {
        if (!session?.user?.id) return;
        setSending(true);
        const result = await sendMessage(roomId, content);
        if (result.success) await loadMessages(true);
        setSending(false);
    };

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

    // ── Build message groups with date separators ──────────────────────
    type RenderedItem =
        | { type: "separator"; key: string; label: string }
        | { type: "message"; key: string; message: Message };

    const items: RenderedItem[] = [];
    let lastKey = "";
    for (const msg of messages) {
        const key = dateKey(new Date(msg.createdAt));
        if (key !== lastKey) {
            lastKey = key;
            items.push({ type: "separator", key: `sep-${key}`, label: formatDateLabel(new Date(msg.createdAt)) });
        }
        items.push({ type: "message", key: msg.id, message: msg });
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl shadow-sm overflow-hidden">

            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary-dark to-primary text-white shadow-md flex-shrink-0">
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
                    {messages.length === 0 ? (
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
                                    content={msg.content}
                                    senderId={msg.senderId}
                                    currentUserId={session?.user?.id || ""}
                                    createdAt={new Date(msg.createdAt)}
                                    isRead={msg.isRead === 1}
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
