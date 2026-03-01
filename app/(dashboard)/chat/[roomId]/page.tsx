"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { ChatWindow, ChatRoomList } from "@/components/chat";

export default function ChatRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // No mostrar loading global - ChatWindow tiene su propio skeleton
    if (!session && status !== "loading") {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - visible solo en desktop y NO se recarga con roomId */}
            <div className="hidden lg:block w-96 bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-light-purple to-dark-purple">
                    <h1 className="text-2xl font-bold text-white">Mensajes</h1>
                    <p className="text-white/80 text-sm mt-1">Tus conversaciones</p>
                </div>
                <ChatRoomList />
            </div>

            {/* Ventana de chat - se actualiza cuando cambia roomId */}
            <div className="flex-1">
                <ChatWindow key={roomId} roomId={roomId} />
            </div>
        </div>
    );
}
