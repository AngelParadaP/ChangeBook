import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseBookCardMessage } from "@/lib/utils/bookCardMessage";
import { BookOpen, CheckCheck, Check, Edit2, Pencil } from "lucide-react";
import { useLongPress } from "@/lib/hooks/useLongPress";

interface ChatBubbleProps {
    id: string;
    content: string;
    imageUrl?: string | null;
    senderId: string;
    currentUserId: string;
    createdAt: Date;
    isRead: boolean;
    isEdited?: boolean;
    /** Whether to show the timestamp (used for minute-grouping) */
    showTimestamp?: boolean;
    /** Whether this is the last bubble in a consecutive group from same sender */
    isGroupTail?: boolean;
    onEdit?: (messageId: string, newContent: string) => void;
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
    id,
    content,
    imageUrl,
    senderId,
    currentUserId,
    createdAt,
    isRead,
    isEdited = false,
    showTimestamp = true,
    isGroupTail = true,
    onEdit,
}: ChatBubbleProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(content);
    const isSender = senderId === currentUserId;
    const { hasBookCard, bookCard, textMessage } = parseBookCardMessage(content);

    const longPressHandlers = useLongPress({
        onLongPress: useCallback(() => {
            if (isSender && onEdit) setShowOptions(true);
        }, [isSender, onEdit]),
    });

    const timeStr = new Date(createdAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const handleStartEdit = () => {
        setEditText(content);
        setIsEditing(true);
        setShowOptions(false);
    };

    const handleConfirmEdit = () => {
        if (editText.trim() && editText.trim() !== content && onEdit) {
            onEdit(id, editText.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(content);
        setIsEditing(false);
    };

    // Determine rounding based on group position
    const senderRounding = isGroupTail ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-br-md";
    const receiverRounding = isGroupTail ? "rounded-2xl rounded-bl-sm" : "rounded-2xl rounded-bl-md";

    return (
        <div className={`flex flex-col ${isGroupTail ? "py-0.5" : "py-[1px]"} relative ${isSender ? "items-end" : "items-start"}`}>
            {/* Edit inline mode */}
            {isEditing ? (
                <div className="max-w-[72%] w-full flex flex-col gap-1.5">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-primary bg-card text-heading resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                        rows={2}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleConfirmEdit();
                            }
                            if (e.key === "Escape") handleCancelEdit();
                        }}
                    />
                    <div className="flex gap-1.5 justify-end">
                        <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-xs text-caption hover:text-heading bg-soft rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmEdit}
                            disabled={!editText.trim() || editText.trim() === content}
                            className="px-3 py-1 text-xs text-white bg-primary rounded-lg disabled:opacity-50 transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div
                        {...longPressHandlers}
                        className={`max-w-[72%] px-4 py-2.5 break-words shadow-sm select-none ${isSender
                            ? `bg-gradient-to-br from-primary to-primary-dark text-white ${senderRounding}`
                            : `bg-white dark:bg-[#1e2d3d] text-heading ${receiverRounding} border border-card-border/40`
                            }`}
                    >
                        {/* Image attachment */}
                        {imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden relative w-full max-w-[240px]">
                                <Image
                                    src={imageUrl}
                                    alt="Imagen adjunta"
                                    width={240}
                                    height={240}
                                    className="object-cover rounded-lg w-full h-auto max-h-[240px]"
                                />
                            </div>
                        )}

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

                        {/* Edited indicator — inside bubble */}
                        {isEdited && (
                            <span className={`text-[9px] italic mt-1 block ${isSender ? "text-white/50" : "text-hint"}`}>
                                <Pencil size={8} className="inline mr-0.5 -mt-0.5" />editado
                            </span>
                        )}
                    </div>

                    {/* Timestamp + read receipt — only on group tail */}
                    {showTimestamp && (
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
                    )}
                </>
            )}

            {/* Options Modal for Messages */}
            {showOptions && (
                <div
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => { e.stopPropagation(); setShowOptions(false); }}
                    style={{ animation: 'fadeIn 150ms ease-out' }}
                >
                    <div
                        className="bg-card/95 backdrop-blur-xl w-full sm:w-80 rounded-2xl shadow-2xl overflow-hidden border border-card-border/30"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'slideUp 200ms ease-out' }}
                    >
                        {/* Message preview */}
                        <div className="px-4 pt-4 pb-3">
                            <p className="text-[10px] uppercase tracking-wider text-hint font-semibold mb-2">Tu mensaje</p>
                            <div className="bg-gradient-to-br from-primary/10 to-primary-dark/10 rounded-xl px-3 py-2 border border-primary/15">
                                <p className="text-xs text-body line-clamp-2 leading-relaxed">{content}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-2 pb-2">
                            <button
                                onClick={handleStartEdit}
                                className="flex items-center gap-3 w-full px-3 py-3 hover:bg-primary/8 active:bg-primary/12 text-heading rounded-xl transition-all font-medium text-sm group"
                            >
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                    <Edit2 size={16} className="text-primary" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span>Editar mensaje</span>
                                    <span className="text-[10px] text-hint font-normal">Modifica el contenido</span>
                                </div>
                            </button>
                        </div>

                        {/* Cancel */}
                        <div className="px-2 pb-2 pt-0">
                            <button
                                onClick={() => setShowOptions(false)}
                                className="w-full py-2.5 font-semibold text-hint hover:text-heading hover:bg-soft/60 rounded-xl transition-all text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
