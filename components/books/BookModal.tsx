"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { addFavorite, removeFavorite, isFavorite as checkIsFavorite } from "@/server/actions/favorites";
import { getOrCreateRoom } from "@/server/actions/chat/getOrCreateRoom";
import { sendMessage } from "@/server/actions/chat/sendMessage";
import { encodeBookCardMessage } from "@/lib/utils/bookCardMessage";
import { deleteBook } from "@/server/actions/books/deleteBook";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Search, X, Trash2, Edit2, MessageSquare, ExternalLink, BookOpen, CircleCheck, CirclePause, CircleX, CheckCircle2 } from "lucide-react";

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
  onDeleteBook?: (bookId: string) => void;
}

export function BookModal({
  book,
  isOpen,
  onClose,
  isOwner,
  currentUserId,
  onRequestBook,
  onUpdateBook,
  onDeleteBook,
}: BookModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Exchange modal state
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeToast, setExchangeToast] = useState<string | null>(null);

  // Favorite state
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [favAnimating, setFavAnimating] = useState(false);

  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    publisher: book.publisher || "",
    year: book.year?.toString() || "",
    description: book.description,
    genres: book.genres,
  });

  // Genre search
  const [genreSearch, setGenreSearch] = useState("");

  const filteredGenres = useMemo(() => {
    if (!genreSearch.trim()) return [...BOOK_GENRES];
    const q = genreSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return BOOK_GENRES.filter((g) => {
      const normalized = g.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return normalized.includes(q);
    });
  }, [genreSearch]);

  // Reset form and load favorite status when book changes
  useEffect(() => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || "",
      year: book.year?.toString() || "",
      description: book.description,
      genres: book.genres,
    });
    setIsEditing(false);
    setImageError(false);
    setExchangeToast(null);
    setGenreSearch("");
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    // Load favorite status
    if (!isOwner && book.id) {
      checkIsFavorite(book.id).then((res) => {
        if (res.success) setIsFav(res.isFavorite);
      });
    }
  }, [book, isOwner, isOpen]);

  const handleToggleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);
    setFavAnimating(true);
    if (isFav) {
      const result = await removeFavorite(book.id);
      if (result.success) setIsFav(false);
    } else {
      const result = await addFavorite(book.id);
      if (result.success) setIsFav(true);
    }
    setFavLoading(false);
    setTimeout(() => setFavAnimating(false), 400);
  };

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
    });

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteBook(book.id);

    if (result.success) {
      if (onDeleteBook) {
        onDeleteBook(book.id);
      }
      handleClose();
    } else {
      alert(result.error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || "",
      year: book.year?.toString() || "",
      description: book.description,
      genres: book.genres,
    });
    setGenreSearch("");
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
        className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-card-border flex flex-col"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(20px)",
          transition: "all 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-card-border bg-subtle">
          <h2 className="text-xl sm:text-2xl font-bold text-heading">
            {isEditing ? "Editar Libro" : "Detalles del Libro"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-2 text-hint hover:text-body hover:bg-dim dark:hover:text-dim dark:hover:bg-dim rounded-xl transition-all cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Image */}
            <div className="flex flex-col items-center sm:items-start md:items-center md:sticky md:top-0 self-start">
              <div className="w-48 md:w-full max-w-[280px] aspect-[2/3] bg-gradient-to-br from-primary-light/40 to-primary-muted/30 dark:from-primary-dark/40 dark:to-primary-muted/20 rounded-xl overflow-hidden relative shadow-md">
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
                    <BookOpen size={64} className="text-primary-muted dark:text-primary-dark" />
                  </div>
                )}
              </div>

              {/* Status Badge + Favorite Heart */}
              <div className="mt-5 flex items-center justify-center gap-4 w-full max-w-[280px]">
                {/* Animated Heart Favorite Button */}
                {!isOwner && (
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favLoading}
                    className="group/fav relative p-2.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                    aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className={`w-7 h-7 transition-all duration-300 ${favAnimating ? "scale-125" : "scale-100"
                        } ${isFav
                          ? "fill-red-500 stroke-red-500"
                          : "fill-transparent stroke-gray-400 dark:stroke-gray-500 group-hover/fav:stroke-red-400"
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
            </div>

            {/* Right Column - Details */}
            <div className="space-y-5">

              {/* Status indicator inline */}
              <div className="inline-flex">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${book.status === "disponible"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-600/20"
                    : book.status === "ocupado"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-600/20"
                      : "bg-soft text-body ring-1 ring-card-border"
                    }`}
                >
                  {book.status === "disponible" ? <><CircleCheck size={14} className="inline mr-1" /> Disponible</> : book.status === "ocupado" ? <><CirclePause size={14} className="inline mr-1" /> Ocupado</> : <><CircleX size={14} className="inline mr-1" /> Intercambiado</>}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-hint mb-1.5">
                  Título
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading transition-all font-medium"
                  />
                ) : (
                  <p className="text-xl font-bold text-heading">
                    {book.title}
                  </p>
                )}
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-hint mb-1.5">
                  Autor
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-2.5 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading transition-all font-medium"
                  />
                ) : (
                  <p className="text-lg text-body font-medium">{book.author}</p>
                )}
              </div>

              {/* Owner Username */}
              {book.ownerUsername && !isEditing && (
                <div>
                  <label className="block text-sm font-medium text-hint mb-1.5">
                    Publicado por
                  </label>
                  <Link
                    href={`/user/${book.ownerUsername}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-soft text-primary dark:text-primary-light hover:bg-primary/20 dark:hover:bg-primary-dark/30 rounded-lg font-semibold transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{book.ownerUsername}
                  </Link>
                </div>
              )}

              {/* Publisher & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-hint mb-1.5">
                    Editorial
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full px-4 py-2.5 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading transition-all"
                    />
                  ) : (
                    <p className="text-heading font-medium">
                      {book.publisher || "No especificada"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-hint mb-1.5">
                    Año
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      min="1000"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-2.5 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading transition-all"
                    />
                  ) : (
                    <p className="text-heading font-medium">
                      {book.year || "No especificado"}
                    </p>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-hint mb-1.5">
                  Géneros
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Genre search */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint">
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        placeholder="Buscar género..."
                        className="w-full pl-10 pr-8 py-2 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading text-sm"
                      />
                      {genreSearch && (
                        <button
                          type="button"
                          onClick={() => setGenreSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Selected genres */}
                    {formData.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.genres.map((genre) => (
                          <button
                            key={`selected-${genre}`}
                            type="button"
                            onClick={() => toggleGenre(genre)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group"
                          >
                            {genre}
                            <X size={12} className="opacity-70 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Genre grid */}
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-subtle/60 rounded-xl border border-card-border/50">
                      {filteredGenres.length === 0 ? (
                        <p className="text-sm text-hint py-2 w-full text-center">
                          No se encontraron géneros
                        </p>
                      ) : (
                        filteredGenres.map((genre) => {
                          const isSelected = formData.genres.includes(genre);
                          return (
                            <button
                              key={genre}
                              type="button"
                              onClick={() => toggleGenre(genre)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected
                                ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border-primary/30 dark:border-primary-muted/30 ring-1 ring-primary/20 shadow-sm"
                                : "bg-card text-caption border-card-border hover:border-primary/40 dark:hover:border-primary-muted/40 hover:bg-primary-soft hover:text-primary dark:hover:text-primary-light"
                                }`}
                            >
                              {isSelected && <span className="mr-1">✓</span>}
                              {genre}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {book.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary/10 dark:bg-primary-muted/10 text-primary-dark dark:text-primary-light rounded-full text-xs font-semibold ring-1 ring-primary/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-hint mb-1.5">
                  Descripción
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading resize-none transition-all font-medium"
                  />
                ) : (
                  <p className="text-heading text-sm leading-relaxed p-4 bg-subtle/30 rounded-xl border border-card-border/50">
                    {book.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Centered */}
        <div className="border-t border-card-border p-4 sm:p-5 bg-subtle">
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {isOwner ? (
              // Owner actions
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-card hover:bg-soft border border-card-border text-heading font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || formData.genres.length === 0}
                      className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm shadow-primary/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm shadow-primary/30 cursor-pointer"
                    >
                      <Edit2 size={16} /> Editar Libro
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} /> Eliminar Libro
                    </button>
                  </>
                )}
              </>
            ) : (
              // Non-owner actions
              <>
                {exchangeToast && (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium mr-2"><CheckCircle2 size={16} className="inline mr-1" /> {exchangeToast}</span>
                )}

                {(book.status === "disponible" || book.status === "ocupado") && (
                  <button
                    onClick={() => setShowExchangeModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all shadow-sm shadow-primary/30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <BookOpenIcon /> Solicitar Intercambio
                  </button>
                )}

                <button
                  onClick={async () => {
                    const result = await getOrCreateRoom(book.ownerId);
                    if (result.success && result.roomId) {
                      const bookCardMsg = encodeBookCardMessage({
                        bookId: book.id,
                        title: book.title,
                        author: book.author,
                        imageUrl: book.imageUrl,
                      });

                      // En lugar de enviar el mensaje, redirigimos al chat pasando el "draft"
                      const params = new URLSearchParams({ draft: bookCardMsg });
                      router.push(`/chat/${result.roomId}?${params.toString()}`);
                    }
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-card text-body font-semibold rounded-xl transition-all hover:bg-soft border border-card-border shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  <MessageSquare size={16} /> Enviar Mensaje
                </button>
              </>
            )}

            {/* "Open Page" functionality moved to footer for everyone */}
            <Link
              href={`/books/${book.id}`}
              onClick={handleClose}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-card text-body font-semibold rounded-xl transition-all hover:bg-soft border border-card-border shadow-sm"
            >
              <ExternalLink size={16} /> Abrir página
            </Link>
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      {!isOwner && (
        <ExchangeRequestModal
          isOpen={showExchangeModal}
          onClose={() => setShowExchangeModal(false)}
          bookId={book.id}
          bookTitle={book.title}
          ownerName={book.ownerUsername || "Usuario"}
          onSuccess={() => {
            setShowExchangeModal(false);
            setExchangeToast("¡Solicitud de intercambio enviada!");
            setTimeout(() => setExchangeToast(null), 4000);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Libro"
        message={
          <p>
            ¿Estás seguro de que deseas eliminar “<strong>{book.title}</strong>”? Esta acción no se puede deshacer.
          </p>
        }
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

// Simple icon component to avoid passing the lucide one if not imported correctly
function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}
