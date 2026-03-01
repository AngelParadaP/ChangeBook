"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, X, Plus, Loader2, ChevronDown } from "lucide-react";
import { toast } from "@/components/ui/GlobalToast";
import {
  getCommunityBookRecommendations,
  getFollowedCommunitiesBookRecommendations,
  recommendBook,
  removeBookRecommendation,
} from "@/server/actions/communities/bookRecommendations";
import { getUserBooks } from "@/server/actions/user/getUserBooks";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface BookRecommendation {
  id: string;
  message: string | null;
  createdAt: Date;
  userId: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookImageUrl: string;
  bookGenres: string[];
  bookStatus: string | null;
  username: string;
  userImage: string | null;
  communityId?: string;
  communityName?: string;
}

interface UserBook {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  genres: string[];
}

interface BookRecommendationSidebarProps {
  communityId?: string;
  aggregated?: boolean;
  currentUserId?: string;
  isMember?: boolean;
  communityGenres?: string[];
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function RecommendationSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-12 h-16 rounded-lg bg-dim flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="h-3 bg-dim rounded-full w-3/4" />
        <div className="h-2.5 bg-dim rounded-full w-1/2" />
        <div className="h-2 bg-dim rounded-full w-2/3" />
      </div>
    </div>
  );
}

// ─── Book Selection Modal ──────────────────────────────────────────────────────

function BookSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentUserId,
  communityGenres = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (bookId: string, message?: string) => void;
  currentUserId: string;
  communityGenres?: string[];
}) {
  const [myBooks, setMyBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      const result = await getUserBooks(currentUserId);
      if (result.success && result.books) {
        let bookList = result.books.map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          imageUrl: b.imageUrl,
          genres: (b as any).genres || [],
        }));

        // Filter by community genres if set
        if (communityGenres.length > 0) {
          const lowerCommunityGenres = communityGenres.map((g) =>
            g.toLowerCase()
          );
          bookList = bookList.filter((book) =>
            (book.genres || []).some((g: string) =>
              lowerCommunityGenres.includes(g.toLowerCase())
            )
          );
        }

        setMyBooks(bookList);
      }
      setLoading(false);
    };
    load();
  }, [isOpen, currentUserId, communityGenres]);

  const handleSubmit = async () => {
    if (!selectedBookId) return;
    setSubmitting(true);
    await onSelect(selectedBookId, message || undefined);
    setSubmitting(false);
    setSelectedBookId(null);
    setMessage("");
  };

  if (!isOpen) return null;

  const hasGenreFilter = communityGenres.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-card-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <h3 className="font-bold text-lg text-heading flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Recomendar un libro
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-soft rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : myBooks.length === 0 ? (
            <div className="text-center py-8 text-hint">
              <BookOpen
                size={40}
                className="mx-auto mb-3 text-hint dark:text-zinc-600"
              />
              <p className="font-medium">
                {hasGenreFilter
                  ? "No tienes libros con géneros compatibles"
                  : "No tienes libros publicados"}
              </p>
              <p className="text-sm mt-1">
                {hasGenreFilter
                  ? `Esta comunidad acepta: ${communityGenres.join(", ")}`
                  : "Publica un libro primero para recomendarlo"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-hint mb-3">
                {hasGenreFilter
                  ? `Libros compatibles con los géneros de la comunidad:`
                  : "Elige uno de tus libros para compartir con la comunidad:"}
              </p>
              <div className="space-y-2">
                {myBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => setSelectedBookId(book.id)}
                    className={`w-full flex gap-3 p-3 rounded-xl border-2 text-left transition-all ${selectedBookId === book.id
                        ? "border-primary bg-primary-soft dark:bg-primary-dark/20"
                        : "border-card-border hover:border-card-border"
                      }`}
                  >
                    <div className="w-10 h-14 rounded-lg bg-dim overflow-hidden relative flex-shrink-0">
                      <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-heading truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-hint truncate">
                        {book.author}
                      </p>
                      {book.genres && book.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {book.genres.slice(0, 3).map((g) => (
                            <span
                              key={g}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-light dark:bg-primary-dark/30 text-primary dark:text-primary-muted"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedBookId === book.id && (
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedBookId && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-body mb-1">
                    Mensaje (opcional)
                  </label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="¿Por qué recomiendas este libro?"
                    maxLength={150}
                    className="w-full px-3 py-2 text-sm border border-card-border rounded-lg bg-subtle text-heading placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {myBooks.length > 0 && (
          <div className="p-4 border-t border-card-border flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-caption hover:bg-soft rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedBookId || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <BookOpen size={14} />
              )}
              Recomendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ────────────────────────────────────────────────────

export default function BookRecommendationSidebar({
  communityId,
  aggregated = false,
  currentUserId,
  isMember = false,
  communityGenres = [],
}: BookRecommendationSidebarProps) {
  const [recommendations, setRecommendations] = useState<BookRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 5;

  const loadRecs = async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    const currentOffset = reset ? 0 : offset;

    try {
      if (aggregated) {
        const result = await getFollowedCommunitiesBookRecommendations(
          currentOffset,
          PAGE_SIZE
        );
        if (result.success) {
          const newRecs = result.recommendations as BookRecommendation[];
          if (reset) {
            setRecommendations(newRecs);
          } else {
            setRecommendations((prev) => [...prev, ...newRecs]);
          }
          setHasMore(result.hasMore ?? false);
          setOffset(currentOffset + newRecs.length);
        }
      } else if (communityId) {
        const result = await getCommunityBookRecommendations(
          communityId,
          currentOffset,
          PAGE_SIZE
        );
        if (result.success) {
          const newRecs = result.recommendations as BookRecommendation[];
          if (reset) {
            setRecommendations(newRecs);
          } else {
            setRecommendations((prev) => [...prev, ...newRecs]);
          }
          setHasMore(result.hasMore ?? false);
          setOffset(currentOffset + newRecs.length);
        }
      }
    } catch {
      // silently fail
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadRecs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, aggregated]);

  const handleRecommend = async (bookId: string, message?: string) => {
    if (!communityId) return;
    const result = await recommendBook(communityId, bookId, message);
    if (result.success) {
      toast("¡Libro recomendado!", "success");
      setShowModal(false);
      loadRecs(true);
    } else {
      toast(result.error || "Error al recomendar", "error");
    }
  };

  const handleRemove = async (recId: string) => {
    if (!confirm("¿Quitar esta recomendación?")) return;
    const result = await removeBookRecommendation(recId);
    if (result.success) {
      toast("Recomendación eliminada", "success");
      setRecommendations((prev) => prev.filter((r) => r.id !== recId));
    } else {
      toast(result.error || "Error", "error");
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-card-border overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary to-primary-dark flex-shrink-0">
        <h3 className="font-bold text-white flex items-center gap-2">
          <BookOpen size={18} />
          {aggregated ? "Libros recomendados" : "Libros para prestar"}
        </h3>
        {aggregated && (
          <p className="text-primary-light text-xs mt-1">De tus comunidades</p>
        )}
      </div>

      {/* Content — scrollable area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <RecommendationSkeleton key={i} />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-4">
            <BookOpen
              size={32}
              className="mx-auto mb-2 text-hint dark:text-zinc-600"
            />
            <p className="text-sm text-hint">
              {aggregated
                ? "Aún no hay recomendaciones"
                : "Nadie ha recomendado libros aún"}
            </p>
            {!aggregated && isMember && (
              <p className="text-xs text-hint mt-1">
                ¡Sé el primero en compartir un libro!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <Link
                key={rec.id}
                href={`/books/${rec.bookId}`}
                className="group relative block rounded-xl p-2.5 -mx-1 hover:bg-subtle transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  {/* Book cover */}
                  <div className="w-12 h-16 rounded-lg bg-dim overflow-hidden relative flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <Image
                      src={rec.bookImageUrl}
                      alt={rec.bookTitle}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Book info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-heading leading-tight truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                      {rec.bookTitle}
                    </p>
                    <p className="text-xs text-hint truncate">
                      {rec.bookAuthor}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/user/${rec.username}`;
                        }}
                        className="text-xs text-primary dark:text-primary-light hover:underline truncate cursor-pointer"
                      >
                        u/{rec.username}
                      </span>
                      {aggregated && rec.communityName && (
                        <>
                          <span className="text-hint dark:text-zinc-600">
                            •
                          </span>
                          <span className="text-xs text-hint truncate">
                            c/{rec.communityName}
                          </span>
                        </>
                      )}
                    </div>
                    {rec.message && (
                      <p className="text-xs text-hint mt-1 italic line-clamp-2">
                        &quot;{rec.message}&quot;
                      </p>
                    )}
                    <span
                      className="text-[10px] text-hint mt-0.5 block"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNow(new Date(rec.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>

                {/* Remove button (owner only) */}
                {currentUserId === rec.userId && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(rec.id);
                    }}
                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-lg transition-all"
                    title="Quitar recomendación"
                  >
                    <X size={14} />
                  </button>
                )}

                {/* Status badge */}
                {rec.bookStatus && (
                  <div className="absolute bottom-1 right-1">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${rec.bookStatus === "disponible"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                    >
                      {rec.bookStatus === "disponible"
                        ? "Disponible"
                        : rec.bookStatus === "intercambiado"
                          ? "Prestado"
                          : "No disponible"}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Load More button */}
        {hasMore && !loading && (
          <button
            onClick={() => loadRecs(false)}
            disabled={loadingMore}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-primary dark:text-primary-light hover:bg-primary-soft dark:hover:bg-primary-dark/10 rounded-xl transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ChevronDown size={14} />
            )}
            {loadingMore ? "Cargando..." : "Ver más recomendaciones"}
          </button>
        )}

        {/* Recommend button (community page, members only) */}
        {!aggregated && isMember && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-sm font-medium text-primary dark:text-primary-light border-2 border-dashed border-primary/30 dark:border-primary-dark/50 rounded-xl hover:bg-primary-soft dark:hover:bg-primary-dark/10 transition-colors"
          >
            <Plus size={16} />
            Recomendar libro
          </button>
        )}
      </div>

      {/* Book Selection Modal */}
      {showModal && currentUserId && (
        <BookSelectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSelect={handleRecommend}
          currentUserId={currentUserId}
          communityGenres={communityGenres}
        />
      )}
    </div>
  );
}
