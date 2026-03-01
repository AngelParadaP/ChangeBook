interface ChatBubbleProps {
    content: string;
    senderId: string;
    currentUserId: string;
    createdAt: Date;
    isRead: boolean;
}

export function ChatBubble({
    content,
    senderId,
    currentUserId,
    createdAt,
    isRead
}: ChatBubbleProps) {
    const isSender = senderId === currentUserId;

    return (
        <div className={`flex flex-col py-1 ${isSender ? "items-end" : "items-start"}`}>
            <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl break-words ${isSender
                        ? "bg-light-purple dark:bg-dark-purple text-white rounded-br-sm"
                        : "bg-dim text-heading rounded-bl-sm"
                    }`}
            >
                <p className="text-sm leading-relaxed">{content}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 px-2">
                <span className="text-xs text-hint">
                    {createdAt.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
                {isSender && (
                    <span className="text-xs text-hint">
                        {isRead ? "✓✓" : "✓"}
                    </span>
                )}
            </div>
        </div>
    );
}
