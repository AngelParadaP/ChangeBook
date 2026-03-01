"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { ChatSkeleton } from "./ChatSkeleton";
import { getMessages, sendMessage, markAsRead, getChatRooms } from "@/server/actions/chat";
import { UserAvatar } from "@/components/ui/UserAvatar";

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

export function ChatWindow({ roomId, otherUser: initialOtherUser }: ChatWindowProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState(initialOtherUser);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Obtener información del otro usuario si no se proporciona
    useEffect(() => {
        if (!initialOtherUser && roomId) {
            const fetchRoomInfo = async () => {
                const result = await getChatRooms();

                if (result.success && result.rooms) {
                    const room = result.rooms.find((r) => r.id === roomId);

                    if (room) {
                        setOtherUser(room.otherUser);
                    } else {
                        // Si no se encuentra la sala, redirigir
                        router.push("/chat");
                    }
                }
            };

            fetchRoomInfo();
        }
    }, [roomId, initialOtherUser, router]);

    // Cargar mensajes iniciales
    useEffect(() => {
        if (otherUser) {
            loadMessages();
        }
    }, [roomId, otherUser]);

    // Polling optimizado para nuevos mensajes
    useEffect(() => {
        if (!otherUser) return; // No hacer polling hasta tener la info del usuario

        let interval: NodeJS.Timeout;

        // Solo hacer polling si la pestaña está activa
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Pausar polling cuando la pestaña no está visible
                if (interval) clearInterval(interval);
            } else {
                // Reanudar polling y actualizar inmediatamente cuando vuelve a estar visible
                loadMessages(true);
                interval = setInterval(() => {
                    loadMessages(true);
                }, 10000); // Aumentado a 10 segundos para reducir carga
            }
        };

        // Iniciar polling
        interval = setInterval(() => {
            loadMessages(true);
        }, 10000);

        // Escuchar cambios de visibilidad
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomId, otherUser]);

    // Auto-scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Marcar como leídos cuando se abre el chat (solo una vez)
    useEffect(() => {
        markAsRead(roomId);
    }, [roomId]);

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);

        const result = await getMessages(roomId);

        if (result.success && result.messages) {
            setMessages(result.messages);
        }

        if (!silent) setLoading(false);
    };

    const handleSendMessage = async (content: string) => {
        if (!session?.user?.id) return;

        setSending(true);

        const result = await sendMessage(roomId, content);

        if (result.success) {
            await loadMessages(true);
        }

        setSending(false);
    };

    if (loading || !otherUser) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                {/* Header con información del usuario */}
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-light-purple to-dark-purple text-white">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                        👤
                    </div>
                    <div className="flex-1">
                        <div className="h-5 bg-white/20 rounded w-32 mb-2 animate-pulse" />
                        <div className="h-3 bg-white/20 rounded w-20 animate-pulse" />
                    </div>
                </div>

                {/* Skeleton de mensajes */}
                <ChatSkeleton count={6} />

                {/* Input placeholder */}
                <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
                    <div className="h-12 bg-gray-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-light-purple to-dark-purple text-white">
                <UserAvatar
                    imageURL={otherUser.imageURL}
                    name={otherUser.name}
                    size="sm"
                    useNextImage={false}
                />
                <div>
                    <h2 className="font-bold text-lg">{otherUser.name}</h2>
                    <p className="text-sm text-white/80">@{otherUser.username}</p>
                </div>
            </div>

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-zinc-800"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#a87bc7 #f3f4f6",
                }}
            >
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                            No hay mensajes aún. ¡Envía el primero!
                        </p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            content={message.content}
                            senderId={message.senderId}
                            currentUserId={session?.user?.id || ""}
                            createdAt={new Date(message.createdAt)}
                            isRead={message.isRead === 1}
                        />
                    ))
                )}
            </div>

            {/* Input */}
            <ChatInput onSend={handleSendMessage} disabled={sending} />
        </div>
    );
}
