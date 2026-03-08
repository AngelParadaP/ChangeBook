"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { parseBookCardMessage, encodeBookCardMessage, BookCardData } from "@/lib/utils/bookCardMessage";
import { BookOpen, X } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [message, setMessage] = useState("");
    const [bookCard, setBookCard] = useState<BookCardData | null>(null);

    // Initial load from draft query param
    useEffect(() => {
        const draft = searchParams.get("draft");
        if (draft) {
            const { hasBookCard, bookCard: parsedCard, textMessage } = parseBookCardMessage(draft);
            if (hasBookCard && parsedCard) {
                setBookCard(parsedCard);
                // Si textMessage está vacío después de extraer el card, usamos un mensaje predeterminado
                // pero como encodeBookCardMessage ya lo pone, textMessage no estará vacío.
                setMessage(textMessage);
            } else {
                setMessage(draft);
            }

            // Remove draft from URL without refreshing the page
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete("draft");
            const newUrl = newSearchParams.toString() ? `${pathname}?${newSearchParams.toString()}` : pathname;
            router.replace(newUrl, { scroll: false });
        }
    }, [searchParams, pathname, router]);

    const handleSend = () => {
        if ((message.trim() || bookCard) && !disabled) {
            if (bookCard) {
                const finalMessage = encodeBookCardMessage(bookCard, message);
                onSend(finalMessage);
            } else {
                onSend(message.trim());
            }
            setMessage("");
            setBookCard(null);

            // Reset textarea height
            const target = document.getElementById('chat-input-textarea') as HTMLTextAreaElement;
            if (target) {
                target.style.height = "40px";
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col bg-card border-t border-card-border dark:border-card-border">
            {/* Book Card Preview */}
            {bookCard && (
                <div className="px-4 py-3 bg-subtle border-b border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-3 relative max-w-sm w-full bg-card p-2 rounded-xl border border-card-border shadow-sm">
                        <div className="w-10 h-14 bg-dim rounded overflow-hidden flex-shrink-0 relative">
                            {bookCard.imageUrl ? (
                                <Image
                                    src={bookCard.imageUrl}
                                    alt={bookCard.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen size={16} className="text-hint" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 pr-4">
                            <span className="text-xs font-bold text-heading truncate">{bookCard.title}</span>
                            <span className="text-[10px] text-caption truncate">{bookCard.author}</span>
                            <span className="text-[10px] text-primary mt-0.5">Adjuntado para enviar</span>
                        </div>
                        <button
                            onClick={() => setBookCard(null)}
                            className="absolute -top-2 -right-2 bg-card w-6 h-6 rounded-full flex items-center justify-center text-hint hover:text-body hover:bg-dim transition-colors shadow-sm border border-card-border"
                            title="Quitar libro"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-2 p-4">
                <textarea
                    id="chat-input-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 px-4 py-2 rounded-xl border border-card-border dark:border-card-border bg-subtle text-heading focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        minHeight: "40px",
                        maxHeight: "128px",
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "40px";
                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={(!message.trim() && !bookCard) || disabled}
                    className="px-6 py-2 bg-light-purple dark:bg-dark-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
}
