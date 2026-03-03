interface ChatSkeletonProps {
    count?: number;
}

export function ChatSkeleton({ count = 5 }: ChatSkeletonProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-subtle">
            {Array.from({ length: count }).map((_, i) => {
                const isOwnMessage = i % 3 === 0;

                return (
                    <div
                        key={i}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-pulse`}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div
                            className={`max-w-[70%] rounded-2xl p-4 space-y-2 ${isOwnMessage
                                    ? "bg-purple-200 dark:bg-purple-900/30"
                                    : "bg-dim"
                                }`}
                        >
                            <div className="h-3 bg-dim rounded w-full" />
                            {i % 2 === 0 && <div className="h-3 bg-dim rounded w-3/4" />}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
