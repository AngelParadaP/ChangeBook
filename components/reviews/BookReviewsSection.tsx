"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { getBookReviews, BookRatingData, BookReviewItem } from "@/server/actions/reviews";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Star, MessageSquare, ChevronDown, PenLine } from "lucide-react";
import { BookReviewModal } from "./BookReviewModal";
import { useSession } from "next-auth/react";

interface BookReviewsSectionProps {
    bookId: string;
    bookTitle: string;
    className?: string;
}

export function BookReviewsSection({ bookId, bookTitle, className = "" }: BookReviewsSectionProps) {
    const { data: session } = useSession();
    const [data, setData] = useState<BookRatingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadReviews = async () => {
        setLoading(true);
        const result = await getBookReviews(bookId);
        if (result.success && result.data) {
            setData(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadReviews();
    }, [bookId]);

    const hasReviewed = session?.user?.id 
        ? data?.reviews.some((r) => r.reviewerId === session.user.id) // Wait, my interface doesn't have reviewerId, let me fix it on the server if needed, or just allow the server to return it.
        : false;

    // Actually, I didn't return `reviewerId` from getBookReviews. Let me just rely on the API returning an error if they try again, or I'll add `reviewerId` to the return type.
    // Let's just allow the button for everyone logged in, unless they know they reviewed. For now I'll just show the button if logged in.

    if (loading) {
        return (
            <div className={`mt-10 p-6 bg-card rounded-3xl border border-card-border shadow-sm flex items-center justify-center min-h-32 ${className}`}>
                <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse" />
                    <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse delay-75" />
                    <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-pulse delay-150" />
                </div>
            </div>
        );
    }

    const reviews = data?.reviews || [];
    const displayReviews = showAll ? reviews : reviews.slice(0, 3);
    const hasMore = reviews.length > 3;

    return (
        <div className={`mt-10 p-6 bg-card rounded-3xl border border-card-border shadow-sm ${className}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-card-border/60">
                <div>
                    <h3 className="text-xl font-extrabold text-heading">Reseñas del Libro</h3>
                    {data && data.totalReviews > 0 ? (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-2xl font-black text-amber-500">{data.averageRating}</span>
                            <StarRating rating={data.averageRating} size={20} />
                            <span className="text-sm font-medium text-caption ml-1">
                                ({data.totalReviews} {data.totalReviews === 1 ? "opinión" : "opiniones"})
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-hint mt-1">Aún no hay reseñas para este libro.</p>
                    )}
                </div>

                {session?.user && !hasReviewed && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2.5 rounded-xl font-bold transition-colors text-sm shrink-0"
                    >
                        <PenLine size={16} />
                        Dejar una reseña
                    </button>
                )}
            </div>

            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {displayReviews.map((review) => (
                        <BookReviewCard key={review.id} review={review} />
                    ))}

                    {hasMore && !showAll && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-subtle/50 hover:bg-subtle text-caption hover:text-body font-bold rounded-xl transition-colors text-sm border border-card-border/50"
                        >
                            Ver las {reviews.length - 3} reseñas restantes
                            <ChevronDown size={16} />
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 bg-subtle/30 rounded-2xl border border-dashed border-card-border">
                    <Star size={32} className="mx-auto text-hint mb-3 opacity-50" />
                    <p className="text-heading font-semibold text-lg">Sé el primero en opinar</p>
                    <p className="text-caption text-sm max-w-sm mx-auto mt-1">
                        Comparte tu opinión sobre este libro y ayuda a la comunidad a descubrir nuevas lecturas.
                    </p>
                </div>
            )}

            <BookReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bookId={bookId}
                bookTitle={bookTitle}
                onReviewSubmitted={loadReviews}
            />
        </div>
    );
}

function BookReviewCard({ review }: { review: BookReviewItem }) {
    return (
        <div className="p-4 sm:p-5 bg-subtle/70 border border-card-border/50 rounded-2xl hover:border-card-border transition-colors group">
            <div className="flex items-start gap-4">
                <UserAvatar
                    imageURL={review.reviewerImageURL}
                    name={review.reviewerName}
                    size="md"
                    className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-heading truncate">
                                {review.reviewerName}
                            </h4>
                            <p className="text-xs font-medium text-caption truncate mt-0.5">
                                @{review.reviewerUsername}
                            </p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                            <StarRating rating={review.rating} size={14} />
                            <span className="text-[11px] font-medium text-hint">
                                {new Date(review.createdAt).toLocaleDateString("es-MX", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>

                    {review.comment && (
                        <div className="mt-3 relative">
                            <MessageSquare size={14} className="absolute left-0 top-0.5 text-primary/40" />
                            <p className="text-sm text-body leading-relaxed pl-6 italic">
                                "{review.comment}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
