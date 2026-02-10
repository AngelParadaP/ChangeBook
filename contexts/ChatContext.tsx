import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getChatRooms } from "@/server/actions/chat";

export interface ChatRoom {
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

interface ChatContextType {
    rooms: ChatRoom[];
    loading: boolean;
    refreshRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);

    // Cargar chats inicialmente
    useEffect(() => {
        loadRooms();
    }, []);

    // Polling optimizado con Page Visibility API
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Pausar polling cuando la pestaña no está visible
                if (interval) clearInterval(interval);
            } else {
                // Reanudar y actualizar inmediatamente cuando vuelve a estar visible
                loadRooms(true); // true = silencioso
                interval = setInterval(() => loadRooms(true), 15000);
            }
        };

        // Iniciar polling silencioso
        interval = setInterval(() => loadRooms(true), 15000);

        // Escuchar cambios de visibilidad
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const loadRooms = async (silent = false) => {
        if (!silent) setLoading(true);

        const result = await getChatRooms();

        if (result.success && result.rooms) {
            setRooms(result.rooms);
        }

        if (!silent) setLoading(false);
    };

    return (
        <ChatContext.Provider value={{ rooms, loading, refreshRooms: () => loadRooms(true) }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatRooms() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChatRooms must be used within a ChatProvider");
    }
    return context;
}
