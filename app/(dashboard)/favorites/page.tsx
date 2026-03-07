"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMyFavorites, removeFavorite } from "@/server/actions/favorites";
import { getOrCreateRoom } from "@/server/actions/chat/getOrCreateRoom";
import { sendMessage } from "@/server/actions/chat/sendMessage";
import { encodeBookCardMessage } from "@/lib/utils/bookCardMessage";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import {
    Heart,
    BookOpenCheck,
    Home,
    BookOpen,
    CircleCheck,
    CirclePause,
    CircleX,
    Mailbox,
    CalendarDays,
    MessageSquare,
} from "lucide-react";
import { BookCardSkeleton } from "@/components/ui/skeletons";

interface FavoriteBook {
    id: string;
    bookId: string;
    bookTitle: string | null;
    bookAuthor: string | null;
    bookImageUrl: string | null;
    bookDescription: string | null;
    bookPublisher: string | null;
    bookYear: number | null;
    bookStatus: string | null;
    bookGenres: string[] | null;
    ownerId: string | null;
    ownerName: string | null;
    ownerUsername: string | null;
    ownerImageURL: string | null;
    createdAt: Date;
}

export default function FavoritesPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Exchange modal state
    const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
    const [selectedExchangeBook, setSelectedExchangeBook] = useState<{
        id: string;
        title: string;
        ownerName: string;
    } | null>(null);

    // Book detail modal state
    const [selectedBook, setSelectedBook] = useState<FavoriteBook | null>(null);
    const [bookModalOpen, setBookModalOpen] = useState(false);

    const loadFavorites = async () => {
        setLoading(true);
        const result = await getMyFavorites();
        if (result.success && result.favorites) {
            setFavorites(result.favorites as FavoriteBook[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFavorites();
    }, []);

    const handleRemoveFavorite = async (bookId: string) => {
        const result = await removeFavorite(bookId);
        if (result.success) {
            setFavorites((prev) => prev.filter((f) => f.bookId !== bookId));
            setToast({ message: "Removido de favoritos", type: "success" });
        }
    };

    const handleMessage = async (fav: FavoriteBook) => {
        if (!fav.ownerId) return;
        const result = await getOrCreateRoom(fav.ownerId);
        if (result.success && result.roomId) {
            const bookCardMsg = encodeBookCardMessage({
                bookId: fav.bookId,
                title: fav.bookTitle || "Libro",
                author: fav.bookAuthor || "Autor desconocido",
                imageUrl: fav.bookImageUrl || "",
            });
            await sendMessage(result.roomId, bookCardMsg);
            router.push(`/chat/${result.roomId}`);
        }
    };

    const openExchangeModal = (fav: FavoriteBook) => {
        setSelectedExchangeBook({
            id: fav.bookId,
            title: fav.bookTitle || "Libro",
            ownerName: fav.ownerName || "Usuario",
        });
        setExchangeModalOpen(true);
    };

    const handleBookClick = (fav: FavoriteBook) => {
        setSelectedBook(fav);
        setBookModalOpen(true);
    };

    const currentUserId = session?.user?.id || "";

    const availableCount = favorites.filter((f) => f.bookStatus === "disponible").length;
    const occupiedCount = favorites.filter((f) => f.bookStatus === "ocupado").length;

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="bg-card rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-heading flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-primary-soft rounded-xl">
                            <Heart size={24} className="text-primary" />
                        </div>
                        Mis Favoritos
                    </h1>
                    <p className="text-hint text-sm mt-1">
                        Libros que te interesan para intercambiar
                    </p>
                </div>

                {/* Stats bar */}
                <div className="flex gap-4 mb-6 p-4 bg-subtle rounded-xl border border-card-border/50">
                    <div>
                        <p className="text-xs text-hint">Total</p>
                        <p className="text-xl font-bold text-heading">{favorites.length}</p>
                    </div>
                    <div className="border-l border-card-border pl-4">
                        <p className="text-xs text-hint flex items-center gap-1"><CircleCheck size={10} className="text-green-500" /> Disponibles</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {availableCount}
                        </p>
                    </div>
                    <div className="border-l border-card-border pl-4">
                        <p className="text-xs text-hint flex items-center gap-1"><CirclePause size={10} className="text-amber-500" /> Ocupados</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {occupiedCount}
                        </p>
                    </div>
                </div>

                {/* Favorites Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <BookCardSkeleton key={i} />
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="mb-4 flex justify-center"><BookOpenCheck size={56} className="text-hint" /></div>
                        <h3 className="text-lg font-semibold text-body mb-2">
                            No tienes favoritos aún
                        </h3>
                        <p className="text-hint text-sm mb-4">
                            Explora libros y agrega los que te interesen a tus favoritos
                        </p>
                        <Link
                            href="/home"
                            className="inline-flex px-6 py-2.5 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 text-sm"
                        >
                            <Home size={16} className="inline mr-1" /> Explorar libros
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {favorites.map((fav) => (
                            <FavoriteBookCard
                                key={fav.id}
                                favorite={fav}
                                currentUserId={currentUserId}
                                onRemoveFavorite={() => handleRemoveFavorite(fav.bookId)}
                                onMessage={() => handleMessage(fav)}
                                onExchange={() => openExchangeModal(fav)}
                                onClick={() => handleBookClick(fav)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Exchange Request Modal */}
            {selectedExchangeBook && (
                <ExchangeRequestModal
                    isOpen={exchangeModalOpen}
                    onClose={() => {
                        setExchangeModalOpen(false);
                        setSelectedExchangeBook(null);
                    }}
                    bookId={selectedExchangeBook.id}
                    bookTitle={selectedExchangeBook.title}
                    ownerName={selectedExchangeBook.ownerName}
                    onSuccess={() => {
                        loadFavorites();
                        setToast({ message: "¡Solicitud de intercambio enviada!", type: "success" });
                    }}
                />
            )}

            {/* Book Detail Modal */}
            {selectedBook && (
                <BookModal
                    book={{
                        id: selectedBook.bookId,
                        title: selectedBook.bookTitle || "Sin título",
                        author: selectedBook.bookAuthor || "Autor desconocido",
                        publisher: selectedBook.bookPublisher || null,
                        year: selectedBook.bookYear || null,
                        imageUrl: selectedBook.bookImageUrl || "",
                        description: selectedBook.bookDescription || "Sin descripción",
                        genres: selectedBook.bookGenres || [],
                        status: selectedBook.bookStatus,
                        createdAt: selectedBook.createdAt,
                        ownerId: selectedBook.ownerId || "",
                        ownerUsername: selectedBook.ownerUsername || undefined,
                    }}
                    isOpen={bookModalOpen}
                    onClose={() => setBookModalOpen(false)}
                    isOwner={selectedBook.ownerId === currentUserId}
                    currentUserId={currentUserId}
                    onDeleteBook={() => {
                        setBookModalOpen(false);
                        loadFavorites();
                    }}
                />
            )}
        </>
    );
}

// ─── Favorite Book Card (Grid Style) ──────────────────────────────────────────

function FavoriteBookCard({
    favorite,
    currentUserId,
    onRemoveFavorite,
    onMessage,
    onExchange,
    onClick,
}: {
    favorite: FavoriteBook;
    currentUserId: string;
    onRemoveFavorite: () => void;
    onMessage: () => void;
    onExchange: () => void;
    onClick: () => void;
}) {
    const [imgError, setImgError] = useState(false);
    const [favAnimating, setFavAnimating] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const validImage = favorite.bookImageUrl && isValidImageUrl(favorite.bookImageUrl) && !imgError;
    const isOwn = favorite.ownerId === currentUserId;
    const canExchange = !isOwn && (favorite.bookStatus === "disponible" || favorite.bookStatus === "ocupado");

    const handleFavToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isRemoving) return;
        setIsRemoving(true);
        setFavAnimating(true);
        await onRemoveFavorite();
        setFavAnimating(false);
        setIsRemoving(false);
    };

    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMessage();
    };

    const handleExchangeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExchange();
    };

    return (
        <div
            onClick={onClick}
            className="bg-card rounded-2xl border-2 border-primary/30 dark:border-primary-dark/50 p-3 sm:p-4 hover:shadow-xl hover:shadow-primary-glow hover:border-primary/60 hover:scale-[1.03] transition-all duration-300 cursor-pointer group flex flex-col"
        >
            {/* Cover */}
            <div className="aspect-[2/3] bg-gradient-to-br from-primary-light to-primary-muted dark:from-primary-dark/40 dark:to-primary-dark/20 rounded-xl mb-3 overflow-hidden relative">
                {validImage ? (
                    <Image
                        src={favorite.bookImageUrl!}
                        alt={favorite.bookTitle || ""}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={48} className="text-purple-300 dark:text-purple-600" />
                    </div>
                )}

                {/* Status badge */}
                <div className="absolute top-2 right-2">
                    <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm inline-flex items-center gap-1 ${favorite.bookStatus === "disponible"
                            ? "bg-green-500/90 text-white"
                            : favorite.bookStatus === "ocupado"
                                ? "bg-amber-500/90 text-white"
                                : "bg-gray-500/90 text-white"
                            }`}
                    >
                        {favorite.bookStatus === "disponible" ? (
                            <><CircleCheck size={10} /> Disponible</>
                        ) : favorite.bookStatus === "ocupado" ? (
                            <><CirclePause size={10} /> Ocupado</>
                        ) : (
                            <><CircleX size={10} /> Intercambiado</>
                        )}
                    </span>
                </div>

                {/* Favorite heart button */}
                <button
                    onClick={handleFavToggle}
                    disabled={isRemoving}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-50"
                    aria-label="Quitar de favoritos"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={`w-5 h-5 transition-all duration-300 fill-red-500 stroke-red-500 ${favAnimating ? "scale-125" : "scale-100"
                            }`}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>

            {/* Info */}
            <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-heading line-clamp-2 text-sm">
                    {favorite.bookTitle}
                </h3>
                <p className="text-xs text-caption line-clamp-1">
                    {favorite.bookAuthor}
                </p>
                {favorite.ownerUsername && !isOwn && (
                    <Link
                        href={`/user/${favorite.ownerUsername}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary dark:text-primary-light hover:underline block"
                    >
                        @{favorite.ownerUsername}
                    </Link>
                )}
                {isOwn && (
                    <span className="text-xs text-hint block">Tu libro</span>
                )}
                {favorite.bookGenres && favorite.bookGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {favorite.bookGenres.slice(0, 2).map((genre, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full"
                            >
                                {genre}
                            </span>
                        ))}
                        {favorite.bookGenres.length > 2 && (
                            <span className="text-xs px-2 py-0.5 text-hint">
                                +{favorite.bookGenres.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            {!isOwn && (
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-card-border/40">
                    {/* Message button */}
                    <button
                        onClick={handleMessageClick}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-soft text-caption text-xs font-medium rounded-lg hover:bg-dim transition-colors"
                        title="Enviar mensaje"
                    >
                        <MessageSquare size={12} />
                        <span className="hidden sm:inline">Mensaje</span>
                    </button>

                    {/* Exchange button */}
                    {canExchange && (
                        <button
                            onClick={handleExchangeClick}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-light-purple to-dark-purple text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
                        >
                            <Mailbox size={12} />
                            <span className="hidden sm:inline">Solicitar</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
