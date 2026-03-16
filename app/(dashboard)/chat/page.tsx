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
            <div className="hidden lg:flex flex-1 relative items-center justify-center rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: "var(--color-chat-bg, var(--color-subtle))" }}>
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
                <div className="text-center p-10 relative z-10 bg-card/70 backdrop-blur-md rounded-3xl border border-card-border/60 shadow-md">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
                        <MessageSquare size={44} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-heading mb-2">
                        Tus mensajes
                    </h2>
                    <p className="text-caption max-w-sm">
                        Selecciona o inicia una conversación para empezar a intercambiar libros e ideas
                    </p>
                </div>
            </div>
        </div>
    );
}
