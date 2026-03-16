"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseBookCardMessage } from "@/lib/utils/bookCardMessage";
import { BookOpen, CheckCheck, Check } from "lucide-react";

interface ChatBubbleProps {
    content: string;
    senderId: string;
    currentUserId: string;
    createdAt: Date;
    isRead: boolean;
}

function BookCardEmbed({ bookId, title, author, imageUrl, isSender }: {
    bookId: string;
    title: string;
    author: string;
    imageUrl: string;
    isSender: boolean;
}) {
    const [imgError, setImgError] = useState(false);

    const isValidImage = (() => {
        try {
            const u = new URL(imageUrl);
            return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
        } catch {
            return false;
        }
    })();

    const showImage = isValidImage && !imgError;

    return (
        <Link
            href={`/books/${bookId}`}
            onClick={(e) => e.stopPropagation()}
            className={`block rounded-xl overflow-hidden border transition-all hover:shadow-md mb-2 ${isSender
                ? "bg-white/10 border-white/20 hover:bg-white/15"
                : "bg-card border-card-border hover:bg-soft"
                }`}
        >
            <div className="flex gap-3 p-2.5">
                {/* Book cover */}
                <div className="w-12 h-[68px] rounded-lg overflow-hidden bg-gradient-to-br from-primary-light/40 to-primary/30 dark:from-primary-dark/40 dark:to-primary/30 relative flex-shrink-0">
                    {showImage ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen size={18} className={isSender ? "text-white/50" : "text-primary/50"} />
                        </div>
                    )}
                </div>

                {/* Book info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className={`text-xs font-bold leading-tight line-clamp-2 ${isSender ? "text-white" : "text-heading"}`}>
                        {title}
                    </p>
                    <p className={`text-[11px] mt-0.5 line-clamp-1 ${isSender ? "text-white/70" : "text-caption"}`}>
                        {author}
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${isSender ? "text-white/50" : "text-primary"}`}>
                        Ver libro →
                    </p>
                </div>
            </div>
        </Link>
    );
}

export function ChatBubble({
    content,
    senderId,
    currentUserId,
    createdAt,
    isRead
}: ChatBubbleProps) {
    const isSender = senderId === currentUserId;
    const { hasBookCard, bookCard, textMessage } = parseBookCardMessage(content);

    const timeStr = new Date(createdAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className={`flex flex-col py-0.5 ${isSender ? "items-end" : "items-start"}`}>
            <div
                className={`max-w-[72%] px-4 py-2.5 rounded-2xl break-words shadow-sm ${isSender
                    // My messages: vivid primary gradient, white text
                    ? "bg-gradient-to-br from-primary to-primary-dark text-white rounded-br-sm"
                    // Other's messages: white/light card, dark text — high contrast
                    : "bg-white dark:bg-[#1e2d3d] text-heading rounded-bl-sm border border-card-border/40"
                    }`}
            >
                {hasBookCard && bookCard && (
                    <BookCardEmbed
                        bookId={bookCard.bookId}
                        title={bookCard.title}
                        author={bookCard.author}
                        imageUrl={bookCard.imageUrl}
                        isSender={isSender}
                    />
                )}

                {textMessage && (
                    <p className="text-sm leading-relaxed">{textMessage}</p>
                )}
            </div>

            {/* Timestamp + read receipt */}
            <div className={`flex items-center gap-1 mt-0.5 px-1 ${isSender ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-[10px] text-hint">
                    {timeStr}
                </span>
                {isSender && (
                    isRead
                        ? <CheckCheck size={12} className="text-primary" />
                        : <Check size={12} className="text-hint" />
                )}
            </div>
        </div>
    );
}
