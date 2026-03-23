"use client";

import { useEffect, useState } from "react";
import { StarRating } from "./StarRating";
import { getBookReviews, BookRatingData } from "@/server/actions/reviews";
import { Star } from "lucide-react";

interface BookRatingDisplayProps {
    bookId: string;
    className?: string;
}

export function BookRatingDisplay({ bookId, className = "" }: BookRatingDisplayProps) {
    const [data, setData] = useState<BookRatingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, [bookId]);

    const loadReviews = async () => {
        setLoading(true);
        const result = await getBookReviews(bookId);
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
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 ${className}`}>
            <StarRating rating={data.averageRating} size={14} />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {data.averageRating}
            </span>
            <span className="text-xs text-hint">
                ({data.totalReviews} {data.totalReviews === 1 ? "reseña" : "reseñas"})
            </span>
        </div>
    );
}
