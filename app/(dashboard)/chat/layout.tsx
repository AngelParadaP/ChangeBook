"use client";

import { ChatProvider } from "@/contexts/ChatContext";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return <ChatProvider>{children}</ChatProvider>;
}
