"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getMyFavorites, removeFavorite } from "@/server/actions/favorites";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { Heart, BookOpenCheck, Home, BookOpen, CircleCheck, CirclePause, CircleX, Mailbox, CalendarDays, Trash2 } from "lucide-react";

interface FavoriteBook {
    id: string;
    bookId: string;
    bookTitle: string | null;
    bookAuthor: string | null;
    bookImageUrl: string | null;
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
    const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<{
        id: string;
        title: string;
        ownerName: string;
    } | null>(null);

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

    const handleRemove = async (bookId: string) => {
        setRemovingId(bookId);
        const result = await removeFavorite(bookId);
        if (result.success) {
            setFavorites((prev) => prev.filter((f) => f.bookId !== bookId));
        }
        setRemovingId(null);
    };

    const openExchangeModal = (fav: FavoriteBook) => {
        setSelectedBook({
            id: fav.bookId,
            title: fav.bookTitle || "Libro",
            ownerName: fav.ownerName || "Usuario",
        });
        setModalOpen(true);
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-heading flex items-center gap-3">
                    <Heart size={24} className="text-red-500 fill-red-500" /> Mis Favoritos
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
                    <p className="text-xs text-hint">Disponibles</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {favorites.filter((f) => f.bookStatus === "disponible").length}
                    </p>
                </div>
                <div className="border-l border-card-border pl-4">
                    <p className="text-xs text-hint">Ocupados</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {favorites.filter((f) => f.bookStatus === "ocupado").length}
                    </p>
                </div>
            </div>

            {/* Favorites List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-subtle rounded-2xl">
                            <div className="w-14 h-20 bg-dim rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-dim rounded w-3/4" />
                                <div className="h-3 bg-dim rounded w-1/2" />
                                <div className="h-3 bg-dim rounded w-1/3" />
                            </div>
                        </div>
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
                <div className="space-y-3">
                    {favorites.map((fav) => (
                        <FavoriteCard
                            key={fav.id}
                            favorite={fav}
                            currentUserId={session?.user?.id || ""}
                            onRemove={() => handleRemove(fav.bookId)}
                            onExchange={() => openExchangeModal(fav)}
                            isRemoving={removingId === fav.bookId}
                        />
                    ))}
                </div>
            )}

            {/* Exchange Request Modal */}
            {selectedBook && (
                <ExchangeRequestModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedBook(null);
                    }}
                    bookId={selectedBook.id}
                    bookTitle={selectedBook.title}
                    ownerName={selectedBook.ownerName}
                    onSuccess={() => {
                        loadFavorites();
                    }}
                />
            )}
        </div>
    );
}

// Favorite Card Component
function FavoriteCard({
    favorite,
    currentUserId,
    onRemove,
    onExchange,
    isRemoving,
}: {
    favorite: FavoriteBook;
    currentUserId: string;
    onRemove: () => void;
    onExchange: () => void;
    isRemoving: boolean;
}) {
    const [imgError, setImgError] = useState(false);
    const validImage = favorite.bookImageUrl && isValidImageUrl(favorite.bookImageUrl) && !imgError;
    const isOwn = favorite.ownerId === currentUserId;
    const canExchange = !isOwn && (favorite.bookStatus === "disponible" || favorite.bookStatus === "ocupado");

    const addedDate = new Date(favorite.createdAt).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
    });

    return (
        <div className="flex items-center gap-4 p-4 bg-subtle rounded-2xl border border-card-border/50 hover:shadow-md transition-all duration-300 group">
            {/* Book Image */}
            <Link href={`/books/${favorite.bookId}`} className="flex-shrink-0">
                <div className="w-14 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 relative shadow-sm group-hover:shadow-md transition-shadow">
                    {validImage ? (
                        <Image
                            src={favorite.bookImageUrl!}
                            alt={favorite.bookTitle || ""}
                            fill
                            className="object-cover"
                            sizes="56px"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><BookOpen size={22} className="text-purple-400" /></div>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <Link
                            href={`/books/${favorite.bookId}`}
                            className="font-bold text-sm text-heading hover:text-light-purple dark:hover:text-light-pink transition-colors truncate block"
                        >
                            {favorite.bookTitle}
                        </Link>
                        <p className="text-xs text-hint">{favorite.bookAuthor}</p>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${favorite.bookStatus === "disponible"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : favorite.bookStatus === "ocupado"
                                ? "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                                : "bg-soft text-hint"
                            }`}
                    >
                        <span className="inline-flex items-center gap-1">
                            {favorite.bookStatus === "disponible"
                                ? <><CircleCheck size={10} /> Disponible</>
                                : favorite.bookStatus === "ocupado"
                                    ? <><CirclePause size={10} /> Ocupado</>
                                    : <><CircleX size={10} /> Intercambiado</>}
                        </span>
                    </span>
                </div>

                {/* Owner info */}
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-hint">
                        {isOwn ? "Tu libro" : (
                            <>
                                De{" "}
                                <Link
                                    href={`/user/${favorite.ownerUsername}`}
                                    className="text-light-purple dark:text-light-pink hover:underline font-semibold"
                                >
                                    @{favorite.ownerUsername}
                                </Link>
                            </>
                        )}
                        {" · "}Guardado el {addedDate}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                    {canExchange && (
                        <button
                            onClick={onExchange}
                            className="px-3 py-1.5 bg-gradient-to-r from-light-purple to-dark-purple text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
                        >
                            <Mailbox size={14} className="inline mr-0.5" /> Solicitar intercambio
                        </button>
                    )}
                    {favorite.bookStatus === "ocupado" && !isOwn && (
                        <span className="text-[10px] text-amber-500 dark:text-amber-400 self-center">
                            <CalendarDays size={10} className="inline mr-0.5" /> Puedes reservar en fechas disponibles
                        </span>
                    )}
                    <button
                        onClick={onRemove}
                        disabled={isRemoving}
                        className="ml-auto px-3 py-1.5 text-xs text-hint hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                        {isRemoving ? "..." : <><Trash2 size={12} className="inline mr-0.5" /> Quitar</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
