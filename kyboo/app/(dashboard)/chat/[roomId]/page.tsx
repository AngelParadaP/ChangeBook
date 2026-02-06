"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChatWindow, ChatRoomList } from "@/components/chat";
import { getChatRooms } from "@/server/actions/chat";

export default function ChatRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;

    const [otherUser, setOtherUser] = useState<{
        name: string;
        username: string;
        imageURL: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (!roomId) return;

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

            setLoading(false);
        };

        fetchRoomInfo();
    }, [roomId, router]);

    if (status === "loading" || loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">💬</div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session || !otherUser) {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - visible solo en desktop */}
            <div className="hidden lg:block w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-light-purple to-dark-purple">
                    <h1 className="text-2xl font-bold text-white">Mensajes</h1>
                    <p className="text-white/80 text-sm mt-1">Tus conversaciones</p>
                </div>
                <ChatRoomList />
            </div>

            {/* Ventana de chat */}
            <div className="flex-1">
                <ChatWindow roomId={roomId} otherUser={otherUser} />
            </div>
        </div>
    );
}
