"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: number;
    interactive?: boolean;
    onChange?: (rating: number) => void;
    onClick?: () => void;
    className?: string;
}

export function StarRating({
    rating,
    maxStars = 5,
    size = 18,
    interactive = false,
    onChange,
    onClick,
    className = "",
}: StarRatingProps) {
    const [hovered, setHovered] = useState<number>(0);

    const displayRating = interactive && hovered > 0 ? hovered : rating;

    return (
        <div
            className={`inline-flex items-center gap-0.5 ${onClick ? "cursor-pointer" : ""} ${className}`}
            onClick={onClick}
            onMouseLeave={() => interactive && setHovered(0)}
        >
            {Array.from({ length: maxStars }, (_, i) => {
                const starValue = i + 1;
                const filled = starValue <= Math.floor(displayRating);
                const halfFilled = !filled && starValue - 0.5 <= displayRating;

                const starIcon = (
                    <Star
                        size={size}
                        className={`transition-colors duration-150 ${
                            filled
                                ? "fill-amber-400 text-amber-400"
                                : halfFilled
                                ? "fill-amber-400/50 text-amber-400"
                                : interactive && hovered >= starValue
                                ? "fill-amber-300/50 text-amber-300"
                                : "fill-transparent text-gray-300 dark:text-gray-600"
                        }`}
                    />
                );

                // Display-only mode: render as span (safe inside buttons)
                if (!interactive) {
                    return (
                        <span
                            key={i}
                            className="p-0 inline-flex cursor-default"
                            style={{ lineHeight: 0 }}
                        >
                            {starIcon}
                        </span>
                    );
                }

                // Interactive mode: render as button for accessibility
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onChange) onChange(starValue);
                        }}
                        onMouseEnter={() => setHovered(starValue)}
                        className="p-0 border-none bg-transparent transition-all duration-150 cursor-pointer hover:scale-110"
                        style={{ lineHeight: 0 }}
                    >
                        {starIcon}
                    </button>
                );
            })}
        </div>
    );
}
