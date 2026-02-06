"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { getMessages, sendMessage, markAsRead } from "@/server/actions/chat";

interface Message {
    id: string;
    content: string;
    senderId: string;
    isRead: number;
    createdAt: Date;
}

interface ChatWindowProps {
    roomId: string;
    otherUser: {
        name: string;
        username: string;
        imageURL: string | null;
    };
}

export function ChatWindow({ roomId, otherUser }: ChatWindowProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Cargar mensajes iniciales
    useEffect(() => {
        loadMessages();
    }, [roomId]);

    // Polling para nuevos mensajes cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            loadMessages(true);
        }, 3000);

        return () => clearInterval(interval);
    }, [roomId]);

    // Auto-scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Marcar como leídos cuando se abre el chat
    useEffect(() => {
        markAsRead(roomId);
    }, [roomId]);

    const loadMessages = async (silent = false) => {
        if (!silent) setLoading(true);

        const result = await getMessages(roomId);

        if (result.success && result.messages) {
            setMessages(result.messages);

            // Marcar como leídos automáticamente durante polling
            // para que los mensajes nuevos se marquen como leídos en tiempo real
            if (silent) {
                await markAsRead(roomId);
            }
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

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="animate-spin text-4xl mb-2">💬</div>
                        <p className="text-gray-600 dark:text-gray-400">Cargando chat...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-light-purple to-dark-purple text-white">
                {otherUser.imageURL ? (
                    <img
                        src={otherUser.imageURL}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                        👤
                    </div>
                )}
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
