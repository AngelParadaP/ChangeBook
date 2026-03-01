"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Generates a deterministic gradient based on the user's name.
 * This ensures the same user always gets the same color combination.
 */
function getGradientForName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const gradients = [
        "linear-gradient(135deg, #26658C, #54ACBF)",
        "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "linear-gradient(135deg, #ec4899, #f43f5e)",
        "linear-gradient(135deg, #14b8a6, #06b6d4)",
        "linear-gradient(135deg, #f59e0b, #ef4444)",
        "linear-gradient(135deg, #8b5cf6, #ec4899)",
        "linear-gradient(135deg, #06b6d4, #3b82f6)",
        "linear-gradient(135deg, #10b981, #059669)",
        "linear-gradient(135deg, #f97316, #eab308)",
        "linear-gradient(135deg, #a855f7, #6366f1)",
    ];

    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

/**
 * Extracts initials from a name (up to 2 characters).
 */
function getInitials(name: string): string {
    if (!name) return "?";
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface UserAvatarProps {
    /** User's profile image URL */
    imageURL?: string | null;
    /** User's display name (used for initials fallback) */
    name: string;
    /** Avatar size preset */
    size?: AvatarSize;
    /** Additional CSS classes */
    className?: string;
    /** Whether to use Next.js Image (true) or native img tag (false).
     *  Use `false` for external images that aren't in next.config domains. */
    useNextImage?: boolean;
}

const sizeConfig: Record<AvatarSize, { container: string; text: string; imgSizes: string }> = {
    xs: { container: "w-8 h-8", text: "text-[10px]", imgSizes: "32px" },
    sm: { container: "w-10 h-10", text: "text-xs", imgSizes: "40px" },
    md: { container: "w-12 h-12", text: "text-sm", imgSizes: "48px" },
    lg: { container: "w-16 h-16", text: "text-lg", imgSizes: "64px" },
    xl: { container: "w-32 h-32", text: "text-4xl", imgSizes: "128px" },
    "2xl": { container: "w-40 h-40", text: "text-5xl", imgSizes: "160px" },
};

export function UserAvatar({
    imageURL,
    name,
    size = "md",
    className = "",
    useNextImage = true,
}: UserAvatarProps) {
    const [imgError, setImgError] = useState(false);
    const config = sizeConfig[size];
    const initials = getInitials(name);
    const gradient = getGradientForName(name);
    const hasValidImage = imageURL && !imgError;

    return (
        <div
            className={`${config.container} rounded-full overflow-hidden flex-shrink-0 relative flex items-center justify-center ${className}`}
            style={!hasValidImage ? { background: gradient } : undefined}
        >
            {hasValidImage ? (
                useNextImage ? (
                    <Image
                        src={imageURL}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes={config.imgSizes}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <img
                        src={imageURL}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                )
            ) : (
                <span className={`text-white font-bold tracking-wide select-none ${config.text}`}>
                    {initials}
                </span>
            )}
        </div>
    );
}
