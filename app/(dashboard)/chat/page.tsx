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

    if (!session && status !== "loading") {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - columna izquierda */}
            <div className="w-full lg:w-96 bg-card rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <ChatRoomList />
            </div>

            {/* Mensaje de bienvenida - área derecha en desktop */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-card rounded-2xl shadow-sm">
                <div className="text-center p-8">
                    <div className="w-24 h-24 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-5">
                        <MessageSquare size={44} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-2">
                        Tus mensajes
                    </h2>
                    <p className="text-caption max-w-sm">
                        Selecciona una conversación para comenzar a chatear
                    </p>
                </div>
            </div>
        </div>
    );
}
