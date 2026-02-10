"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { isValidImageUrl } from "@/lib/utils/imageValidation";

interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  year: number | null;
  imageUrl: string;
  description: string;
  genres: string[];
  status: string | null;
  createdAt: Date | null;
  ownerId: string;
  ownerUsername?: string;
}

interface BookModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  currentUserId?: string;
  onRequestBook?: (bookId: string) => void;
  onUpdateBook?: (bookId: string, data: Partial<Book>) => void;
}

export function BookModal({
  book,
  isOpen,
  onClose,
  isOwner,
  currentUserId,
  onRequestBook,
  onUpdateBook,
}: BookModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    publisher: book.publisher || "",
    year: book.year?.toString() || "",
    description: book.description,
    genres: book.genres,
    status: book.status || "disponible",
  });

  // Reset form when book changes
  useEffect(() => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || "",
      year: book.year?.toString() || "",
      description: book.description,
      genres: book.genres,
      status: book.status || "disponible",
    });
    setIsEditing(false);
    setImageError(false);
  }, [book]);

  // Animation on open
  useEffect(() => {
    if (isOpen) {
      // Use a small delay to ensure the DOM is ready
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSave = async () => {
    if (!onUpdateBook) return;
    setIsSaving(true);

    await onUpdateBook(book.id, {
      title: formData.title,
      author: formData.author,
      publisher: formData.publisher || null,
      year: formData.year ? parseInt(formData.year) : null,
      description: formData.description,
      genres: formData.genres,
      status: formData.status,
    });

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || "",
      year: book.year?.toString() || "",
      description: book.description,
      genres: book.genres,
      status: book.status || "disponible",
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  const validImageUrl = isValidImageUrl(book.imageUrl);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isAnimating
        ? "opacity-100"
        : "opacity-0"
        }`}
      onClick={handleBackdropClick}
      style={{
        backgroundColor: isAnimating ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isAnimating ? "blur(4px)" : "blur(0px)",
        transition: "all 0.3s ease-out",
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-light-purple dark:border-dark-purple"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(20px)",
          transition: "all 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {isEditing ? "Editar Libro" : "Detalles del Libro"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all hover:rotate-90"
            aria-label="Cerrar"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar max-h-[calc(90vh-180px)] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Image */}
            <div>
              <div className="aspect-[2/3] bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-xl overflow-hidden relative">
                {validImageUrl && !imageError ? (
                  <Image
                    src={book.imageUrl}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">📖</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${book.status === "disponible"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                    }`}
                >
                  {book.status === "disponible" ? "📗 Disponible" : "📕 Intercambiado"}
                </span>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {book.title}
                  </p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Autor
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">{book.author}</p>
                )}
              </div>

              {/* Owner Username */}
              {book.ownerUsername && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Publicado por
                  </label>
                  <a
                    href={`/user/${book.ownerUsername}`}
                    className="text-light-purple dark:text-light-pink hover:underline font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{book.ownerUsername}
                  </a>
                </div>
              )}

              {/* Publisher & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Editorial
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">
                      {book.publisher || "No especificada"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Año
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      min="1000"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">
                      {book.year || "No especificado"}
                    </p>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Géneros
                </label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    {BOOK_GENRES.map((genre) => {
                      const isSelected = formData.genres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isSelected
                            ? "bg-light-purple text-white"
                            : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                            } cursor-pointer hover:scale-105`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {book.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-light-purple/20 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink rounded-full text-xs font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200 resize-none"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {book.description}
                  </p>
                )}
              </div>

              {/* Status (only in edit mode for owner) */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="intercambiado">Intercambiado</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
          {isOwner ? (
            // Owner actions
            <div className="flex gap-3 justify-end">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all"
                >
                  ✏️ Editar Libro
                </button>
              )}
            </div>
          ) : (
            // Non-owner actions
            <div className="flex gap-3 justify-end">
              {book.status === "disponible" && onRequestBook && (
                <button
                  onClick={() => onRequestBook(book.id)}
                  className="px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all"
                >
                  📬 Solicitar Libro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes modalSlideOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-yellowed-white);
          border-radius: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-dark-pink);
          border-radius: 12px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-pink);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #3f3f46;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-dark-pink);
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-pink);
        }
      `}</style>
    </div>
  );
}
