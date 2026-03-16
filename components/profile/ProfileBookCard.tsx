"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";

interface ProfileBookCardProps {
  title: string;
  author: string;
  publisher?: string | null;
  year?: number | null;
  imageUrl: string;
  description: string;
  genres: string[];
  status: string | null;
}

// Check if URL is valid and fetchable
const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const invalidDomains = [
      'ejemplo.jpg',
      'placeholder.example.com',
      'example.com',
      'example.jpg',
      'localhost',
    ];
    const isInvalidDomain = invalidDomains.some(domain =>
      parsedUrl.hostname === domain ||
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      parsedUrl.hostname.includes(".") &&
      !parsedUrl.hostname.endsWith(".jpg") &&
      !isInvalidDomain
    );
  } catch {
    return false;
  }
};

export function ProfileBookCard({
  title,
  author,
  publisher,
  year,
  imageUrl,
  description,
  genres,
  status,
}: ProfileBookCardProps) {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = isValidImageUrl(imageUrl) && !imageError;

  return (
    <div className="bg-subtle rounded-2xl border border-card-border hover:border-primary/40 dark:hover:border-primary-dark/40 p-3 sm:p-4 flex gap-3 sm:gap-4 transition-all hover:shadow-sm">
      {/* Book Cover */}
      <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 bg-gradient-to-br from-primary-light/30 to-primary-muted/30 dark:from-primary-dark/40 dark:to-primary/30 rounded-xl overflow-hidden relative">
        {shouldShowImage ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="96px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={28} className="text-primary/40 dark:text-primary-light/40" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-heading text-base leading-snug line-clamp-2">
            {title}
          </h3>
          {status && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full flex-shrink-0 font-medium ${
                status === "disponible"
                  ? "bg-success/15 dark:bg-success/20 text-success"
                  : "bg-soft text-body"
              }`}
            >
              {status === "disponible" ? "Disponible" : "Intercambiado"}
            </span>
          )}
        </div>

        <p className="text-xs text-caption mb-1.5">
          {author}
          {publisher && ` · ${publisher}`}
          {year && ` · ${year}`}
        </p>

        <p className="text-xs text-body line-clamp-2 mb-2 flex-1">
          {description}
        </p>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {genres.slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full"
              >
                {genre}
              </span>
            ))}
            {genres.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-soft text-hint rounded-full">
                +{genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
