// src/components/BookCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

// Definición de tipos basada en el esquema de Drizzle
type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  year: number | null;
  imageUrl: string;
  description: string;
  genres: string[];
  status: string;
  // username: string; // Comentado por ahora ya que no está en el tipo original pero podría necesitarse
};

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const [imgError, setImgError] = useState(false);
  
  // Detectar URLs inválidas conocidas antes de intentar cargarlas
  const isInvalidUrl = !book.imageUrl || book.imageUrl.includes('placeholder.example.com');
  const showFallback = isInvalidUrl || imgError;

  return (
    // Requerimiento: "Cards Presionables".
    // Envolvemos todo en un Link para mejorar la UX (Fitts's Law).
    <Link 
      href={`/books/${book.id}`}
      className="group block h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 focus:ring-2 focus:ring-blue-500"
    >
      <div className="flex flex-col h-full">
        {/* Contenedor de Imagen con Aspect Ratio controlado */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
          {showFallback ? (
            <div className="flex flex-col items-center justify-center p-4 text-center text-gray-400 w-full h-full bg-gray-50">
              <svg
                className="h-12 w-12 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="text-xs font-medium opacity-70">No Cover Available</span>
            </div>
          ) : (
            <Image
              src={book.imageUrl}
              alt={`Portada del libro ${book.title}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              // Optimización de imágenes para Core Web Vitals (LCP)
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          )}
          
          {/* Badge de estado superpuesto */}
          <div className="absolute top-2 right-2 z-10">
            <span className={`px-2 py-1 text-xs font-bold rounded-full backdrop-blur-md ${
              book.status === 'disponible' 
               ? 'bg-green-100/90 text-green-800' 
                : 'bg-gray-100/90 text-gray-800'
            }`}>
              {book.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Cuerpo de la tarjeta */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-1 text-lg font-bold text-gray-900 line-clamp-1" title={book.title}>
            {book.title}
          </h3>
          <p className="text-sm font-medium text-gray-600 mb-3">{book.author}</p>
          
          {/* Lista de géneros (Tags) */}
          <div className="mb-4 flex flex-wrap gap-1">
            {book.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">
                {genre}
              </span>
            ))}
            {book.genres.length > 3 && (
              <span className="text-[10px] text-gray-400 self-center">+{book.genres.length - 3}</span>
            )}
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-grow">
            {book.description}
          </p>

          <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <span>{book.publisher || 'N/A'}</span>
            <span>{book.year || 'N/A'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}