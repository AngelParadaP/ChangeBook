"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { StarRating } from "./StarRating";
import { createBookReview } from "@/server/actions/reviews";
import { X, BookOpen } from "lucide-react";

interface BookReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: string;
    bookTitle: string;
    onReviewSubmitted: () => void;
}

export function BookReviewModal({
    isOpen,
    onClose,
    bookId,
    bookTitle,
    onReviewSubmitted,
}: BookReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Por favor, selecciona una calificación.");
            return;
        }

        setIsSubmitting(true);
        const result = await createBookReview(bookId, rating, comment);

        if (result.success) {
            onReviewSubmitted();
            onClose();
        } else {
            setError(result.error || "Ocurrió un error al enviar la reseña.");
        }
        setIsSubmitting(false);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-card-border relative z-[101]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-card-border bg-subtle">
                    <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                        <BookOpen className="text-primary" size={24} />
                        Calificar Libro
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-hint hover:text-danger hover:bg-danger/10 p-1.5 rounded-xl transition-colors"
                        disabled={isSubmitting}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">
                    {/* Instrucciones */}
                    <div className="text-center">
                        <p className="text-body text-sm mb-1">
                            ¿Qué te pareció el libro?
                        </p>
                        <p className="font-bold text-heading text-lg">
                            "{bookTitle}"
                        </p>
                    </div>

                    {/* Calificación */}
                    <div className="flex flex-col items-center gap-3">
                        <label className="text-sm font-semibold text-caption uppercase tracking-wider">
                            Tu Calificación
                        </label>
                        <StarRating
                            rating={rating}
                            size={40}
                            interactive={true}
                            onChange={(val) => {
                                setRating(val);
                                setError("");
                            }}
                        />
                    </div>

                    {/* Comentario */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-caption uppercase tracking-wider flex justify-between">
                            Reseña (Opcional)
                            <span className="text-xs font-normal opacity-70">
                                {comment.length}/300
                            </span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 300))}
                            placeholder="Comparte tu opinión sobre el contenido del libro..."
                            className="w-full px-4 py-3 bg-subtle/50 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-28 text-body text-sm placeholder:text-hint transition-all"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <p className="text-sm text-status-danger text-center bg-status-danger/10 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 font-medium animate-in slide-in-from-top-1">
                            <span>⚠️</span> {error}
                        </p>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-subtle text-caption font-bold rounded-xl hover:bg-dim hover:text-body transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center"
                            disabled={isSubmitting || rating === 0}
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Publicar"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
