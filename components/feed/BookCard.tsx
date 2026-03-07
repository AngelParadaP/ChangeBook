"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { addFavorite, removeFavorite } from "@/server/actions/favorites";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  genres: string[];
  ownerUsername?: string;
  /** Initial favorite state — pass undefined to hide the heart */
  isFavorite?: boolean;
  onClick?: () => void;
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

export function BookCard({ id, title, author, imageUrl, genres, ownerUsername, isFavorite: initialFav, onClick }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = isValidImageUrl(imageUrl) && !imageError;

  // Favorite state
  const showHeart = initialFav !== undefined;
  const [isFav, setIsFav] = useState(initialFav ?? false);
  const [favLoading, setFavLoading] = useState(false);
  const [favAnimating, setFavAnimating] = useState(false);

  // Sync when prop changes (e.g. after favoriteIds loads async)
  useEffect(() => {
    if (initialFav !== undefined) {
      setIsFav(initialFav);
    }
  }, [initialFav]);

  const handleFavToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
    setFavLoading(true);
    setFavAnimating(true);
    if (isFav) {
      const result = await removeFavorite(id);
      if (result.success) setIsFav(false);
    } else {
      const result = await addFavorite(id);
      if (result.success) setIsFav(true);
    }
    setFavLoading(false);
    setTimeout(() => setFavAnimating(false), 400);
  };

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl border-2 border-primary/30 p-3 sm:p-4 hover:shadow-xl hover:border-primary/60 hover:scale-105 transition-all duration-300 cursor-pointer group"
    >
      {/* Book Cover */}
      <div className="aspect-[2/3] bg-dim rounded-xl mb-3 overflow-hidden relative">
        {shouldShowImage ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={48} className="text-primary/40" />
          </div>
        )}

        {/* Favorite heart button */}
        {showHeart && (
          <button
            onClick={handleFavToggle}
            disabled={favLoading}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-50 z-10"
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`w-4 h-4 transition-all duration-300 ${favAnimating ? "scale-125" : "scale-100"
                } ${isFav
                  ? "fill-red-500 stroke-red-500"
                  : "fill-transparent stroke-white/80 hover:stroke-red-400"
                }`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        )}
      </div>

      {/* Book Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-heading line-clamp-2 text-sm">
          {title}
        </h3>
        <p className="text-xs text-caption line-clamp-1">
          {author}
        </p>
        {ownerUsername && (
          <a
            href={`/user/${ownerUsername}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline block"
          >
            @{ownerUsername}
          </a>
        )}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.slice(0, 2).map((genre, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-primary-soft text-primary rounded-full"
              >
                {genre}
              </span>
            ))}
            {genres.length > 2 && (
              <span className="text-xs px-2 py-1 text-hint">
                +{genres.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
