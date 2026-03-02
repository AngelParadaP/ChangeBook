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

    if (!session && status !== "loading") {
        return null;
    }

    return (
        <div className="h-full flex gap-4">
            {/* Lista de chats - visible solo en desktop */}
            <div className="hidden lg:flex lg:flex-col w-96 bg-card rounded-2xl shadow-sm overflow-hidden">
                <ChatRoomList />
            </div>

            {/* Ventana de chat */}
            <div className="flex-1">
                <ChatWindow key={roomId} roomId={roomId} />
            </div>
        </div>
    );
}
