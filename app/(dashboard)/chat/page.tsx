"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatRoomList } from "@/components/chat";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // No mostrar loading global - ChatRoomList tiene su propio loading inicial
    if (!session && status !== "loading") {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - columna izquierda */}
            <div className="w-full lg:w-96 bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-light-purple to-dark-purple">
                    <h1 className="text-2xl font-bold text-white">Mensajes</h1>
                    <p className="text-white/80 text-sm mt-1">Tus conversaciones</p>
                </div>
                <ChatRoomList />
            </div>

            {/* Mensaje de bienvenida - área derecha en desktop */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-card rounded-2xl shadow-sm">
                <div className="text-center p-8">
                    <div className="mb-4 flex justify-center"><MessageSquare size={64} className="text-hint" /></div>
                    <h2 className="text-2xl font-bold text-heading mb-2">
                        Tus mensajes
                    </h2>
                    <p className="text-caption">
                        Selecciona una conversación para comenzar a chatear
                    </p>
                </div>
            </div>
        </div>
    );
}
