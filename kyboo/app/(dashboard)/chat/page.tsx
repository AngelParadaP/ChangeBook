"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatRoomList } from "@/components/chat";

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">💬</div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - columna izquierda */}
            <div className="w-full lg:w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-light-purple to-dark-purple">
                    <h1 className="text-2xl font-bold text-white">Mensajes</h1>
                    <p className="text-white/80 text-sm mt-1">Tus conversaciones</p>
                </div>
                <ChatRoomList />
            </div>

            {/* Mensaje de bienvenida - área derecha en desktop */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                <div className="text-center p-8">
                    <div className="text-8xl mb-4">💬</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Tus mensajes
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Selecciona una conversación para comenzar a chatear
                    </p>
                </div>
            </div>
        </div>
    );
}
