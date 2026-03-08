"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { searchBooks } from "@/server/actions/books/searchBooks";
import { searchBooksByGenres } from "@/server/actions/books/searchBooksByGenres";
import { searchUsers } from "@/server/actions/user/searchUsers";
import { getCommunities } from "@/server/actions/communities/getCommunities";
import { updateBook } from "@/server/actions/books";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Users, BookOpen, User, Building2, Search, Loader2, X, Filter, Tag, Sparkles, RefreshCw } from "lucide-react";
import { addFavorite, removeFavorite, getMyFavoriteIds } from "@/server/actions/favorites";
import { BookCardSkeleton, UserCardSkeleton, CommunityCardSkeleton } from "@/components/ui/skeletons";
import { BOOK_GENRES } from "@/lib/constants/genres";

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchTab = "books" | "users" | "communities" | "genres";

interface BookResult {
    id: string;
    title: string;
    author: string;
    publisher: string | null;
    imageUrl: string;
    year: number | null;
    description: string;
    genres: string[];
    status: string | null;
    createdAt: Date | null;
    ownerId: string;
    ownerUsername: string | null;
}

interface GenreBookResult extends BookResult {
    matchCount: number;
}

interface UserResult {
    id: string;
    name: string;
    username: string;
    studentCode: string;
    imageURL: string | null;
    preferences: string[];
    createdAt: Date | null;
}

interface CommunityResult {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    memberCount: number;
    isMember: boolean;
}

const TABS: { key: SearchTab; label: string; icon: React.ReactNode }[] = [
    { key: "books", label: "Libros", icon: <BookOpen size={16} /> },
    { key: "users", label: "Usuarios", icon: <User size={16} /> },
    { key: "communities", label: "Comunidades", icon: <Building2 size={16} /> },
    { key: "genres", label: "Géneros", icon: <Tag size={16} /> },
];



// ─── Book Search Card (grid version) ─────────────────────────────────────────

function SearchBookCard({ book, onClick, matchCount, selectedGenres, isFavorite: initialFav }: { book: BookResult; onClick: () => void; matchCount?: number; selectedGenres?: string[]; isFavorite?: boolean }) {
    const [imgError, setImgError] = useState(false);

    // Favorite state
    const showHeart = initialFav !== undefined;
    const [isFav, setIsFav] = useState(initialFav ?? false);
    const [favLoading, setFavLoading] = useState(false);
    const [favAnimating, setFavAnimating] = useState(false);

    const handleFavToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const isValidImage = (() => {
        try {
            const u = new URL(book.imageUrl);
            return (
                (u.protocol === "http:" || u.protocol === "https:") &&
                u.hostname.includes(".") &&
                !u.hostname.endsWith(".jpg")
            );
        } catch {
            return false;
        }
    })();

    const showImage = isValidImage && !imgError;

    return (
        <div
            onClick={onClick}
            className="bg-card rounded-2xl border-2 border-primary/30 dark:border-primary-dark/50 p-4 hover:shadow-xl hover:shadow-primary-glow hover:border-primary/60 hover:scale-[1.03] transition-all duration-300 cursor-pointer group"
        >
            {/* Cover */}
            <div className="aspect-[2/3] bg-gradient-to-br from-primary-light to-primary-muted dark:from-primary-dark/40 dark:to-primary-dark/20 rounded-xl mb-3 overflow-hidden relative">
                {showImage ? (
                    <Image
                        src={book.imageUrl}
                        alt={book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={48} className="text-purple-300 dark:text-purple-600" />
                    </div>
                )}
                {/* Status badge */}
                {book.status && (
                    <div className="absolute top-2 right-2">
                        <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm ${book.status === "disponible"
                                ? "bg-green-500/90 text-white"
                                : "bg-yellow-500/90 text-white"
                                }`}
                        >
                            {book.status === "disponible" ? "Disponible" : "Intercambiado"}
                        </span>
                    </div>
                )}
                {/* Match count badge */}
                {matchCount !== undefined && matchCount > 0 && selectedGenres && selectedGenres.length > 1 && (
                    <div className="absolute top-2 left-2">
                        <span className="text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm bg-amber-500/90 text-white flex items-center gap-1">
                            <Sparkles size={10} />
                            {matchCount}/{selectedGenres.length}
                        </span>
                    </div>
                )}

                {/* Favorite heart */}
                {showHeart && (
                    <button
                        onClick={handleFavToggle}
                        disabled={favLoading}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-all disabled:opacity-50 z-10"
                        aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                        style={matchCount !== undefined && matchCount > 0 && selectedGenres && selectedGenres.length > 1 ? { top: "2.25rem" } : {}}
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

            {/* Info */}
            <div className="space-y-1">
                <h3 className="font-semibold text-heading line-clamp-2 text-sm">
                    {book.title}
                </h3>
                <p className="text-xs text-caption line-clamp-1">
                    {book.author}
                    {book.year ? ` • ${book.year}` : ""}
                </p>
                {book.ownerUsername && (
                    <p className="text-xs text-primary dark:text-primary-light">
                        @{book.ownerUsername}
                    </p>
                )}
                {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {book.genres.slice(0, 2).map((genre, idx) => {
                            const isMatched = selectedGenres?.includes(genre);
                            return (
                                <span
                                    key={idx}
                                    className={`text-xs px-2 py-0.5 rounded-full ${isMatched
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold"
                                        : "bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light"
                                        }`}
                                >
                                    {genre}
                                </span>
                            );
                        })}
                        {book.genres.length > 2 && (
                            <span className="text-xs px-2 py-0.5 text-hint">
                                +{book.genres.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── User Search Card ────────────────────────────────────────────────────────

function SearchUserCard({ user }: { user: UserResult }) {
    const [imgError, setImgError] = useState(false);
    const showImage = user.imageURL && !imgError;

    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("es-MX", {
            month: "short",
            year: "numeric",
        })
        : null;

    return (
        <Link
            href={`/user/${user.username}`}
            className="bg-card rounded-2xl border-2 border-primary/30 dark:border-primary-dark/50 p-5 hover:shadow-xl hover:shadow-primary-glow hover:border-primary/60 hover:scale-[1.02] transition-all duration-300 cursor-pointer group block"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <UserAvatar
                    imageURL={user.imageURL}
                    name={user.name}
                    size="lg"
                    className="group-hover:ring-2 group-hover:ring-primary dark:group-hover:ring-primary-muted transition-all"
                />

                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-heading truncate text-base">
                        {user.name}
                    </h3>
                    <p className="text-sm text-primary dark:text-primary-light truncate">
                        @{user.username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-soft text-caption px-2 py-0.5 rounded-full font-mono">
                            {user.studentCode}
                        </span>
                        {memberSince && (
                            <span className="text-xs text-hint">
                                Desde {memberSince}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Preferences */}
            {user.preferences.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {user.preferences.slice(0, 4).map((pref, idx) => (
                        <span
                            key={idx}
                            className="text-xs px-2.5 py-1 bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full"
                        >
                            {pref}
                        </span>
                    ))}
                    {user.preferences.length > 4 && (
                        <span className="text-xs px-2.5 py-1 text-hint">
                            +{user.preferences.length - 4}
                        </span>
                    )}
                </div>
            )}
        </Link>
    );
}

// ─── Community Search Card ───────────────────────────────────────────────────

function SearchCommunityCard({ community }: { community: CommunityResult }) {
    const [imgError, setImgError] = useState(false);
    const showImage = community.imageUrl && !imgError;

    return (
        <Link
            href={`/communities/${community.id}`}
            className="bg-card rounded-2xl border-2 border-primary/30 dark:border-primary-dark/40 p-5 hover:shadow-xl hover:shadow-primary-glow hover:scale-[1.02] hover:border-primary/60 dark:hover:border-primary-muted/60 transition-all duration-300 cursor-pointer group block"
        >
            <div className="flex items-start gap-4 mb-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary-light to-primary-muted dark:from-primary-dark/40 dark:to-primary-dark/20 flex-shrink-0 relative group-hover:ring-2 group-hover:ring-primary/50 dark:group-hover:ring-primary-muted/50 transition-all">
                    {showImage ? (
                        <Image
                            src={community.imageUrl!}
                            alt={community.name}
                            fill
                            className="object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                            <Users size={24} className="text-purple-300 dark:text-purple-600" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-heading truncate text-base">
                        {community.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-hint">
                            <Users size={12} />
                            {community.memberCount} {community.memberCount === 1 ? "miembro" : "miembros"}
                        </span>
                        {community.isMember && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                Miembro
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <p className="text-caption text-sm line-clamp-2">
                {community.description || "Sin descripción"}
            </p>
        </Link>
    );
}

// ─── Main Search Page Content ────────────────────────────────────────────────

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status } = useSession();

    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<SearchTab>("books");
    const [bookResults, setBookResults] = useState<BookResult[]>([]);
    const [userResults, setUserResults] = useState<UserResult[]>([]);
    const [communityResults, setCommunityResults] = useState<CommunityResult[]>([]);
    const [genreBookResults, setGenreBookResults] = useState<GenreBookResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Favorite IDs for heart toggles
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadFavIds = async () => {
            const result = await getMyFavoriteIds();
            if (result.success) {
                setFavoriteIds(new Set(result.ids));
            }
        };
        loadFavIds();
    }, []);

    // Genre filter state (for books/communities tabs)
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [genreSearch, setGenreSearch] = useState("");

    // Genre tab state (separate from the filter)
    const [genreTabGenres, setGenreTabGenres] = useState<string[]>([]);
    const [genreTabSearch, setGenreTabSearch] = useState("");
    const [genreTabLoading, setGenreTabLoading] = useState(false);

    const allGenresSelected = selectedGenres.length === BOOK_GENRES.length;

    const filteredGenres = useMemo(() => {
        if (!genreSearch.trim()) return [...BOOK_GENRES];
        const q = genreSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return BOOK_GENRES.filter((g) => {
            const normalized = g.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalized.includes(q);
        });
    }, [genreSearch]);

    const filteredGenreTabGenres = useMemo(() => {
        if (!genreTabSearch.trim()) return [...BOOK_GENRES];
        const q = genreTabSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return BOOK_GENRES.filter((g) => {
            const normalized = g.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalized.includes(q);
        });
    }, [genreTabSearch]);

    const toggleGenre = (genre: string) => {
        setSelectedGenres((prev) =>
            prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
        );
    };

    const toggleAllGenres = () => {
        if (allGenresSelected) {
            setSelectedGenres([]);
        } else {
            setSelectedGenres([...BOOK_GENRES]);
        }
    };

    const toggleGenreTab = (genre: string) => {
        setGenreTabGenres((prev) =>
            prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
        );
    };

    // Modal state
    const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const handleBookClick = (book: BookResult) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleRequestBook = async (bookId: string) => {
        setToast({ message: "Funcionalidad de solicitud próximamente", type: "success" });
        console.log("Request book:", bookId);
        setIsModalOpen(false);
    };

    const handleUpdateBook = async (bookId: string, data: Partial<BookResult>) => {
        const updateData: {
            title?: string;
            author?: string;
            publisher?: string | null;
            year?: number | null;
            description?: string;
            genres?: string[];
            status?: "disponible" | "intercambiado";
        } = {
            ...data,
            status: data.status === "disponible" || data.status === "intercambiado" ? data.status : undefined,
        };

        const result = await updateBook(bookId, updateData);

        if (result.success) {
            setToast({ message: result.message || "Libro actualizado exitosamente", type: "success" });
            setBookResults((prev) =>
                prev.map((b) => (b.id === bookId ? { ...b, ...data } : b))
            );
            setGenreBookResults((prev) =>
                prev.map((b) => (b.id === bookId ? { ...b, ...data } : b))
            );
            if (selectedBook?.id === bookId) {
                setSelectedBook({ ...selectedBook, ...data } as BookResult);
            }
            setIsModalOpen(false);
        } else {
            setToast({ message: result.error || "Error al actualizar libro", type: "error" });
        }
    };

    const handleDeleteBook = (bookId: string) => {
        setBookResults((prev) => prev.filter((b) => b.id !== bookId));
        setGenreBookResults((prev) => prev.filter((b) => b.id !== bookId));
        setToast({ message: "Libro eliminado exitosamente", type: "success" });
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Run search when query or tab changes (for text-based tabs)
    const executeSearch = useCallback(
        async (q: string, tab: SearchTab, genres: string[]) => {
            if (tab === "genres") return; // Genres tab has its own search

            if (q.length < 2) {
                setBookResults([]);
                setUserResults([]);
                setCommunityResults([]);
                setHasSearched(false);
                return;
            }

            setLoading(true);
            setHasSearched(true);

            try {
                if (tab === "books") {
                    // If all genres selected or none selected, don't filter by genre
                    const genreFilter = genres.length > 0 && genres.length < BOOK_GENRES.length ? genres : undefined;
                    const result = await searchBooks(q, 20, genreFilter);
                    if (result.success && result.books) {
                        setBookResults(result.books as BookResult[]);
                    }
                } else if (tab === "users") {
                    const result = await searchUsers(q, 20);
                    if (result.success && result.users) {
                        setUserResults(result.users as UserResult[]);
                    }
                } else if (tab === "communities") {
                    // If all genres selected or none selected, don't filter by genre
                    const genreFilter = genres.length > 0 && genres.length < BOOK_GENRES.length ? genres : undefined;
                    const result = await getCommunities({ query: q, limit: 20, genres: genreFilter });
                    if (result.success && result.communities) {
                        setCommunityResults(result.communities as CommunityResult[]);
                    }
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Genre tab search
    const executeGenreSearch = useCallback(async (genres: string[]) => {
        if (genres.length === 0) {
            setGenreBookResults([]);
            return;
        }

        setGenreTabLoading(true);
        try {
            const result = await searchBooksByGenres(genres, 40);
            if (result.success && result.books) {
                setGenreBookResults(result.books as GenreBookResult[]);
            }
        } catch (error) {
            console.error("Genre search error:", error);
        } finally {
            setGenreTabLoading(false);
        }
    }, []);

    // Debounced search for text tabs
    useEffect(() => {
        if (activeTab === "genres") return;
        const timer = setTimeout(() => {
            executeSearch(query, activeTab, selectedGenres);
        }, 400);

        return () => clearTimeout(timer);
    }, [query, activeTab, selectedGenres, executeSearch]);

    // Genre tab: search when genres change
    useEffect(() => {
        if (activeTab !== "genres") return;
        const timer = setTimeout(() => {
            executeGenreSearch(genreTabGenres);
        }, 300);
        return () => clearTimeout(timer);
    }, [genreTabGenres, activeTab, executeGenreSearch]);

    // Sync URL query param on initial load
    useEffect(() => {
        const q = searchParams.get("q");
        if (q && q !== query) {
            setQuery(q);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleTabChange = (tab: SearchTab) => {
        setActiveTab(tab);
        setBookResults([]);
        setUserResults([]);
        setCommunityResults([]);
        setHasSearched(false);
        // Reset genre filter when switching tabs
        setSelectedGenres([]);
        setGenreSearch("");
    };

    const handleRefreshGenres = () => {
        if (genreTabGenres.length > 0) {
            executeGenreSearch(genreTabGenres);
        }
    };

    const currentResults =
        activeTab === "books"
            ? bookResults
            : activeTab === "users"
                ? userResults
                : activeTab === "communities"
                    ? communityResults
                    : genreBookResults;

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
                    <h1 className="text-3xl font-bold text-heading mb-2 flex items-center gap-3">
                        <div className="p-2 sm:p-2.5 bg-primary-soft rounded-xl">
                            <Search size={24} className="text-primary" />
                        </div>
                        Buscar
                    </h1>
                    <p className="text-caption">
                        Encuentra libros, usuarios o comunidades
                    </p>
                </div>

                {/* Search Input (hidden for genres tab) */}
                {activeTab !== "genres" && (
                    <div className="mb-6">
                        <div className="relative max-w-2xl">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-hint" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={
                                    activeTab === "books"
                                        ? "Buscar por título o autor..."
                                        : activeTab === "users"
                                            ? "Buscar por nombre, usuario o código..."
                                            : "Buscar comunidades por nombre..."
                                }
                                className="w-full pl-12 pr-4 py-4 bg-soft border-2 border-card-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted focus:border-primary dark:focus:border-primary-muted focus:bg-card transition-all text-heading text-lg"
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 border-b border-card-border pb-4 overflow-x-auto">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === tab.key
                                ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary-glow"
                                : "text-hint hover:bg-soft hover:text-heading"
                                }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── Genre Filter (for books and communities tabs) ──────────────────────── */}
                {(activeTab === "books" || activeTab === "communities") && (
                    <div className="mb-6 bg-soft/50 rounded-2xl border border-card-border/50 p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-primary" />
                                <span className="text-sm font-semibold text-heading">Filtrar por género</span>
                                {selectedGenres.length > 0 && !allGenresSelected && (
                                    <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                                        {selectedGenres.length} seleccionado{selectedGenres.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={toggleAllGenres}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ${allGenresSelected
                                    ? "bg-primary text-white shadow-sm shadow-primary-glow hover:bg-primary-dark"
                                    : "bg-card border border-card-border text-caption hover:border-primary/40 hover:text-primary"
                                    }`}
                            >
                                {allGenresSelected ? "✓ Todos" : "Seleccionar todos"}
                            </button>
                        </div>

                        {/* Genre search input */}
                        <div className="relative mb-3">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
                            <input
                                type="text"
                                value={genreSearch}
                                onChange={(e) => setGenreSearch(e.target.value)}
                                placeholder="Buscar género..."
                                className="w-full pl-9 pr-8 py-2 bg-card border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading text-sm transition-all"
                            />
                            {genreSearch && (
                                <button
                                    onClick={() => setGenreSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Selected genres (pills) */}
                        {selectedGenres.length > 0 && !allGenresSelected && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {selectedGenres.map((genre) => (
                                    <button
                                        key={`selected-${genre}`}
                                        onClick={() => toggleGenre(genre)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group"
                                    >
                                        {genre}
                                        <X size={12} className="opacity-70 group-hover:opacity-100" />
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedGenres([])}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                                >
                                    Limpiar
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {/* Genre bubbles grid */}
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-card/50 rounded-xl border border-card-border/30">
                            {filteredGenres.length === 0 ? (
                                <p className="text-sm text-hint py-2 w-full text-center">
                                    No se encontraron géneros para &quot;{genreSearch}&quot;
                                </p>
                            ) : (
                                filteredGenres.map((genre) => {
                                    const isSelected = selectedGenres.includes(genre);
                                    return (
                                        <button
                                            key={genre}
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
                )}

                {/* ─── Genres Tab Content ──────────────────────────────────────────── */}
                {activeTab === "genres" && (
                    <div className="mb-6">
                        {/* Genre selector with nice UI */}
                        <div className="bg-gradient-to-br from-primary-soft/30 to-primary-soft/10 dark:from-primary-dark/10 dark:to-primary-dark/5 rounded-2xl border border-primary/20 dark:border-primary-muted/20 p-4 sm:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Tag size={16} className="text-primary" />
                                    <span className="text-sm font-bold text-heading">Selecciona géneros</span>
                                    {genreTabGenres.length > 0 && (
                                        <span className="text-xs font-bold text-white bg-primary px-2.5 py-0.5 rounded-full">
                                            {genreTabGenres.length}
                                        </span>
                                    )}
                                </div>
                                {genreBookResults.length > 0 && (
                                    <button
                                        onClick={handleRefreshGenres}
                                        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-card-border text-caption hover:border-primary/40 hover:text-primary transition-all flex items-center gap-1.5"
                                        title="Mezclar resultados"
                                    >
                                        <RefreshCw size={12} />
                                        Mezclar
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-hint mb-3">
                                Los libros con más géneros en común aparecerán primero
                            </p>

                            {/* Genre search */}
                            <div className="relative mb-3">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
                                <input
                                    type="text"
                                    value={genreTabSearch}
                                    onChange={(e) => setGenreTabSearch(e.target.value)}
                                    placeholder="Buscar género..."
                                    className="w-full pl-9 pr-8 py-2 bg-card border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-heading text-sm transition-all"
                                />
                                {genreTabSearch && (
                                    <button
                                        onClick={() => setGenreTabSearch("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Selected pills */}
                            {genreTabGenres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {genreTabGenres.map((genre) => (
                                        <button
                                            key={`gt-selected-${genre}`}
                                            onClick={() => toggleGenreTab(genre)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group"
                                        >
                                            {genre}
                                            <X size={12} className="opacity-70 group-hover:opacity-100" />
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setGenreTabGenres([])}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                                    >
                                        Limpiar
                                        <X size={12} />
                                    </button>
                                </div>
                            )}

                            {/* Genre grid */}
                            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto custom-scrollbar p-2 bg-card/50 rounded-xl border border-card-border/30">
                                {filteredGenreTabGenres.length === 0 ? (
                                    <p className="text-sm text-hint py-2 w-full text-center">
                                        No se encontraron géneros para &quot;{genreTabSearch}&quot;
                                    </p>
                                ) : (
                                    filteredGenreTabGenres.map((genre) => {
                                        const isSelected = genreTabGenres.includes(genre);
                                        return (
                                            <button
                                                key={`gt-${genre}`}
                                                onClick={() => toggleGenreTab(genre)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected
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

                        {/* Genre results */}
                        {genreTabLoading && (
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <BookCardSkeleton key={i} />
                                ))}
                            </div>
                        )}

                        {!genreTabLoading && genreBookResults.length > 0 && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-hint">
                                        {genreBookResults.length} {genreBookResults.length === 1 ? "libro encontrado" : "libros encontrados"}
                                    </p>
                                    {genreTabGenres.length > 1 && (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                            <Sparkles size={12} />
                                            <span className="font-medium">Ordenados por relevancia</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {genreBookResults.map((book) => (
                                        <SearchBookCard
                                            key={book.id}
                                            book={book}
                                            onClick={() => handleBookClick(book)}
                                            matchCount={book.matchCount}
                                            selectedGenres={genreTabGenres}
                                            isFavorite={favoriteIds.has(book.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!genreTabLoading && genreTabGenres.length > 0 && genreBookResults.length === 0 && (
                            <div className="text-center py-16 mt-6">
                                <div className="mb-4 flex justify-center">
                                    <BookOpen size={56} className="text-hint" />
                                </div>
                                <h3 className="text-xl font-semibold text-body mb-2">
                                    Sin resultados
                                </h3>
                                <p className="text-hint max-w-sm mx-auto">
                                    No se encontraron libros con los géneros seleccionados. Intenta con otros géneros.
                                </p>
                            </div>
                        )}

                        {!genreTabLoading && genreTabGenres.length === 0 && (
                            <div className="text-center py-16 mt-6">
                                <div className="mb-6 flex justify-center">
                                    <Tag size={64} className="text-hint" />
                                </div>
                                <h3 className="text-xl font-semibold text-body mb-2">
                                    Explora por género
                                </h3>
                                <p className="text-hint max-w-sm mx-auto">
                                    Selecciona uno o más géneros arriba para descubrir libros. Los que coincidan con más géneros aparecerán primero.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Content (for non-genre tabs) ────────────────────────────────── */}

                {/* Loading Skeletons */}
                {loading && activeTab === "books" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <BookCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {loading && activeTab === "users" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <UserCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {loading && activeTab === "communities" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CommunityCardSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* Results – Books */}
                {!loading && activeTab === "books" && bookResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-hint">
                                {bookResults.length} {bookResults.length === 1 ? "resultado" : "resultados"} encontrados
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {bookResults.map((book) => (
                                <SearchBookCard key={book.id} book={book} onClick={() => handleBookClick(book)} isFavorite={favoriteIds.has(book.id)} />
                            ))}
                        </div>
                    </>
                )}

                {/* Results – Users */}
                {!loading && activeTab === "users" && userResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-hint">
                                {userResults.length} {userResults.length === 1 ? "resultado" : "resultados"} encontrados
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userResults.map((user) => (
                                <SearchUserCard key={user.id} user={user} />
                            ))}
                        </div>
                    </>
                )}

                {/* Results – Communities */}
                {!loading && activeTab === "communities" && communityResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-hint">
                                {communityResults.length} {communityResults.length === 1 ? "resultado" : "resultados"} encontrados
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {communityResults.map((community) => (
                                <SearchCommunityCard key={community.id} community={community} />
                            ))}
                        </div>
                    </>
                )}

                {/* Empty states (text-based tabs only) */}
                {!loading &&
                    activeTab !== "genres" &&
                    hasSearched &&
                    currentResults.length === 0 && (
                        <div className="text-center py-16">
                            <div className="mb-4 flex justify-center">
                                {activeTab === "books" ? <BookOpen size={56} className="text-hint" /> : activeTab === "users" ? <Users size={56} className="text-hint" /> : <Building2 size={56} className="text-hint" />}
                            </div>
                            <h3 className="text-xl font-semibold text-body mb-2">
                                Sin resultados
                            </h3>
                            <p className="text-hint max-w-sm mx-auto">
                                No se encontraron {activeTab === "books" ? "libros" : activeTab === "users" ? "usuarios" : "comunidades"} para
                                &quot;{query}&quot;. Intenta con otra búsqueda.
                            </p>
                        </div>
                    )}

                {/* Initial state – no search entered yet (text-based tabs only) */}
                {!loading && !hasSearched && activeTab !== "genres" && (
                    <div className="text-center py-16">
                        <div className="mb-6 flex justify-center"><Search size={64} className="text-hint" /></div>
                        <h3 className="text-xl font-semibold text-body mb-2">
                            {activeTab === "books"
                                ? "Busca libros por título o autor"
                                : activeTab === "users"
                                    ? "Busca usuarios por nombre, usuario o código"
                                    : "Busca comunidades por nombre"}
                        </h3>
                        <p className="text-hint max-w-sm mx-auto">
                            Escribe al menos 2 caracteres para comenzar a buscar
                        </p>
                    </div>
                )}
            </div>

            {/* Book Modal */}
            {selectedBook && (
                <BookModal
                    book={{
                        ...selectedBook,
                        ownerUsername: selectedBook.ownerUsername ?? undefined,
                    }}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    isOwner={selectedBook.ownerId === session?.user?.id}
                    currentUserId={session?.user?.id}
                    onRequestBook={handleRequestBook}
                    onUpdateBook={handleUpdateBook}
                    onDeleteBook={handleDeleteBook}
                />
            )}
        </>
    );
}

// ─── Page wrapper with Suspense (for useSearchParams) ────────────────────────

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="bg-card rounded-2xl shadow-sm p-6 h-full flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={48} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-4" />
                        <p className="text-caption text-lg">Cargando búsqueda...</p>
                    </div>
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}
