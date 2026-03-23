"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import { createReview } from "@/server/actions/reviews";
import { X, Send, Loader2, Star } from "lucide-react";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    exchangeId: string;
    reviewedUserId: string;
    reviewedUserName: string;
    bookTitle: string;
    onReviewSubmitted?: () => void;
}

export function ReviewModal({
    isOpen,
    onClose,
    exchangeId,
    reviewedUserId,
    reviewedUserName,
    bookTitle,
    onReviewSubmitted,
}: ReviewModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Selecciona al menos 1 estrella");
            return;
        }

        setLoading(true);
        setError(null);

        const result = await createReview(exchangeId, reviewedUserId, rating, comment || undefined);

        if (result.success) {
            setSuccess(true);
            onReviewSubmitted?.();
            setTimeout(() => {
                setSuccess(false);
                setRating(0);
                setComment("");
                onClose();
            }, 1500);
        } else {
            setError(result.error || "Error al enviar la reseña");
        }

        setLoading(false);
    };

    const handleClose = () => {
        if (!loading) {
            setRating(0);
            setComment("");
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    const ratingLabels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleClose}>
            <div
                className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-card-border relative animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    disabled={loading}
                    className="absolute top-4 right-4 text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1 z-10"
                >
                    <X size={18} />
                </button>

                {success ? (
                    /* Success state */
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Star size={28} className="text-amber-400 fill-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-heading mb-1">¡Reseña enviada!</h3>
                        <p className="text-sm text-hint">Gracias por tu calificación</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 pb-4 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Star size={24} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-heading mb-1">Califica tu experiencia</h3>
                            <p className="text-sm text-hint">
                                ¿Cómo fue tu intercambio de <span className="font-semibold text-body">"{bookTitle}"</span> con{" "}
                                <span className="font-semibold text-body">{reviewedUserName}</span>?
                            </p>
                        </div>

                        {/* Rating */}
                        <div className="px-6 pb-4 flex flex-col items-center gap-2">
                            <StarRating
                                rating={rating}
                                interactive
                                onChange={setRating}
                                size={36}
                            />
                            <span className={`text-sm font-medium transition-all duration-200 ${rating > 0 ? "text-amber-500" : "text-hint"}`}>
                                {rating > 0 ? ratingLabels[rating] : "Toca una estrella"}
                            </span>
                        </div>

                        {/* Comment */}
                        <div className="px-6 pb-4">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un comentario (opcional)..."
                                rows={3}
                                maxLength={300}
                                disabled={loading}
                                className="w-full bg-subtle border border-card-border rounded-xl p-3 text-sm text-heading focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none transition-all"
                            />
                            <p className="text-[11px] text-hint text-right mt-1">
                                {comment.length}/300
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="px-6 pb-3">
                                <p className="text-xs text-danger font-medium bg-danger/10 px-3 py-2 rounded-lg">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-soft hover:bg-dim text-body font-semibold rounded-xl text-sm transition-colors"
                            >
                                Omitir
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || rating === 0}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-400/20"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                                {loading ? "Enviando..." : "Enviar"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
