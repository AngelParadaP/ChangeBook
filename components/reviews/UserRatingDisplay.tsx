"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { getUserReviews, UserRatingData, ReviewItem } from "@/server/actions/reviews";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Star, MessageSquare, BookOpen, X } from "lucide-react";

interface UserRatingDisplayProps {
    userId: string;
    className?: string;
}

export function UserRatingDisplay({ userId, className = "" }: UserRatingDisplayProps) {
    const [data, setData] = useState<UserRatingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadReviews();
    }, [userId]);

    const loadReviews = async () => {
        setLoading(true);
        const result = await getUserReviews(userId);
        if (result.success && result.data) {
            setData(result.data);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className={`inline-flex items-center gap-1.5 ${className}`}>
                <div className="w-20 h-4 bg-dim rounded-full animate-pulse" />
            </div>
        );
    }

    if (!data || data.totalReviews === 0) {
        return (
            <div className={`inline-flex items-center gap-1.5 text-xs text-hint ${className}`}>
                <Star size={14} className="text-gray-300 dark:text-gray-600" />
                <span>Sin calificaciones</span>
            </div>
        );
    }

    return (
        <>
            {/* Rating chip — clickable to open reviews modal */}
            <button
                onClick={() => setShowModal(true)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all group ${className}`}
            >
                <StarRating rating={data.averageRating} size={14} />
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {data.averageRating}
                </span>
                <span className="text-xs text-hint">
                    ({data.totalReviews} {data.totalReviews === 1 ? "reseña" : "reseñas"})
                </span>
            </button>

            {/* Reviews modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-card-border relative animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1 z-10"
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="p-6 pb-4 text-center border-b border-card-border shrink-0">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Star size={24} className="text-amber-500 fill-amber-500" />
                            </div>
                            <h3 className="text-xl font-bold text-heading mb-2">Reseñas</h3>
                            <div className="flex items-center justify-center gap-2">
                                <StarRating rating={data.averageRating} size={20} />
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    {data.averageRating}
                                </span>
                            </div>
                            <p className="text-xs text-hint mt-1">
                                {data.totalReviews} {data.totalReviews === 1 ? "reseña" : "reseñas"} en total
                            </p>
                        </div>

                        {/* Reviews list — scrollable */}
                        <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                            {data.reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ReviewCard({ review }: { review: ReviewItem }) {
    return (
        <div className="p-3 bg-subtle/70 border border-card-border/50 rounded-xl">
            <div className="flex items-start gap-2.5">
                <UserAvatar
                    imageURL={review.reviewerImageURL}
                    name={review.reviewerName}
                    size="sm"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-heading truncate block">
                                {review.reviewerName}
                            </span>
                            <span className="text-[11px] text-hint">@{review.reviewerUsername}</span>
                        </div>
                        <StarRating rating={review.rating} size={12} />
                    </div>

                    {/* Book reference */}
                    <div className="flex items-center gap-1 mt-1.5">
                        <BookOpen size={10} className="text-hint flex-shrink-0" />
                        <span className="text-[11px] text-hint truncate">
                            Intercambio de &quot;{review.bookTitle}&quot;
                        </span>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                        <div className="mt-2 flex gap-1.5">
                            <MessageSquare size={11} className="text-hint flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-body leading-relaxed italic">
                                &quot;{review.comment}&quot;
                            </p>
                        </div>
                    )}

                    {/* Date */}
                    <p className="text-[10px] text-hint mt-1.5">
                        {new Date(review.createdAt).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>
        </div>
    );
}
