"use client";

import Image from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  genres: string[];
  ownerUsername?: string;
  onClick?: () => void;
}

// Check if URL is valid and fetchable
const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    // List of invalid/placeholder domains to exclude
    const invalidDomains = [
      'ejemplo.jpg',
      'placeholder.example.com',
      'example.com',
      'example.jpg',
      'localhost',
    ];

    // Check if hostname is in the invalid list or ends with invalid extensions
    const isInvalidDomain = invalidDomains.some(domain =>
      parsedUrl.hostname === domain ||
      parsedUrl.hostname.endsWith(`.${domain}`)
    );

    // Check if it's a proper http/https URL with a valid domain
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

export function BookCard({ title, author, imageUrl, genres, ownerUsername, onClick }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = isValidImageUrl(imageUrl) && !imageError;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl border-2 border-primary/30 p-4 hover:shadow-xl hover:border-primary/60 hover:scale-105 transition-all duration-300 cursor-pointer"
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


