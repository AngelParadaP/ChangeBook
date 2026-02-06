"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getChatRooms } from "@/server/actions/chat";

interface ChatRoom {
    id: string;
    otherUser: {
        id: string;
        username: string;
        name: string;
        imageURL: string | null;
    };
    lastMessage: {
        content: string;
        createdAt: Date;
    } | null;
    unreadCount: number;
}

export function ChatRoomList() {
    const router = useRouter();
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRooms();
    }, []);

    // Polling para actualizar la lista cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            loadRooms(true);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadRooms = async (silent = false) => {
        if (!silent) setLoading(true);

        const result = await getChatRooms();

        if (result.success && result.rooms) {
            setRooms(result.rooms);
        }

        if (!silent) setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin text-4xl mb-2">💬</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando chats...</p>
                </div>
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                    <div className="text-6xl mb-3">💭</div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No tienes conversaciones aún
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                        Visita el perfil de un usuario para iniciar un chat
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-4 overflow-y-auto h-full">
            {rooms.map((room) => (
                <button
                    key={room.id}
                    onClick={() => router.push(`/chat/${room.id}`)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                    {/* Avatar */}
                    {room.otherUser.imageURL ? (
                        <img
                            src={room.otherUser.imageURL}
                            alt={room.otherUser.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-light-purple/20 flex items-center justify-center text-2xl flex-shrink-0">
                            👤
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                {room.otherUser.name}
                            </h3>
                            {room.lastMessage && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                    {new Date(room.lastMessage.createdAt).toLocaleDateString('es-MX', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            @{room.otherUser.username}
                        </p>
                        {room.lastMessage && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 truncate mt-1">
                                {room.lastMessage.content}
                            </p>
                        )}
                    </div>

                    {/* Unread Badge */}
                    {room.unreadCount > 0 && (
                        <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {room.unreadCount > 9 ? "9+" : room.unreadCount}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
