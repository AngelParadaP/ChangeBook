"use client";

import Image from "next/image";
import { useState } from "react";

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
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-light-purple dark:border-dark-purple p-4 flex gap-4">
      {/* Book Cover */}
      <div className="w-24 h-36 flex-shrink-0 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-xl overflow-hidden relative">
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
            <span className="text-5xl">📖</span>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg line-clamp-2">
            {title}
          </h3>
          {status && (
            <span
              className={`text-xs px-3 py-1 rounded-full flex-shrink-0 ${
                status === "disponible"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
              }`}
            >
              {status === "disponible" ? "Disponible" : "Intercambiado"}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {author}
          {publisher && ` • ${publisher}`}
          {year && ` • ${year}`}
        </p>

        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
          {description}
        </p>

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {genres.map((genre, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-light-purple/20 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


