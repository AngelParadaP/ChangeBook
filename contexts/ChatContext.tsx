import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getChatRooms } from "@/server/actions/chat";
import { getFriends, FriendProfile } from "@/server/actions/friends/getFriends";

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
    friends: FriendProfile[];
    friendsLoading: boolean;
    refreshRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [friendsLoading, setFriendsLoading] = useState(true);

    // Cargar chats inicialmente
    useEffect(() => {
        loadRooms();
        loadFriends();
    }, []);

    // Pusher optimizado en lugar de Polling
    useEffect(() => {
        const fetchCurrentUserId = async () => {
            try {
                // Hacemos un pequeñisimo fetch interno del usuario logueado en la sesión
                const res = await fetch('/api/auth/session');
                const session = await res.json();
                const userId = session?.user?.id;
                
                if (userId) {
                    import("@/lib/pusher").then((mod) => {
                        const { pusherClient } = mod;
                        const channelName = `user-${userId}`;
                        const channel = pusherClient.subscribe(channelName);
                        
                        channel.bind("new-message", () => loadRooms(true));
                        channel.bind("messages-read", () => loadRooms(true));
                    });
                }
            } catch (err) {}
        };
        fetchCurrentUserId();

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Actualizar inmediatamente cuando vuelve a estar visible
                loadRooms(true); // true = silencioso
            }
        };

        // Escuchar cambios de visibilidad
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            // Opcional: hacer fetch('/api/auth/session') para desenganchar, aunque al desmontarse el app provider muere el context.
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

    const loadFriends = async () => {
        setFriendsLoading(true);
        const res = await getFriends();
        if (res.success && res.friends) {
            setFriends(res.friends);
        }
        setFriendsLoading(false);
    };

    return (
        <ChatContext.Provider value={{ rooms, loading, friends, friendsLoading, refreshRooms: () => loadRooms(true) }}>
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
