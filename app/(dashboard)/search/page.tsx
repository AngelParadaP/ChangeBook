"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { searchBooks } from "@/server/actions/books/searchBooks";
import { searchUsers } from "@/server/actions/user/searchUsers";
import { updateBook } from "@/server/actions/books";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";

// ─── Types ───────────────────────────────────────────────────────────────────

type SearchTab = "books" | "users" | "communities";

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

interface UserResult {
    id: string;
    name: string;
    username: string;
    studentCode: string;
    imageURL: string | null;
    preferences: string[];
    createdAt: Date | null;
}

const TABS: { key: SearchTab; label: string; icon: string }[] = [
    { key: "books", label: "Libros", icon: "📚" },
    { key: "users", label: "Usuarios", icon: "👤" },
    { key: "communities", label: "Comunidades", icon: "🏘️" },
];

// ─── Skeleton Components ─────────────────────────────────────────────────────

function BookCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 p-4 animate-pulse">
            <div className="aspect-[2/3] bg-gray-200 dark:bg-zinc-700 rounded-xl mb-3" />
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-1/2" />
                <div className="flex gap-1 mt-2">
                    <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-16" />
                    <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-12" />
                </div>
            </div>
        </div>
    );
}

function UserCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-700" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full w-32" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-24" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-28" />
                </div>
            </div>
            <div className="flex gap-1">
                <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-16" />
                <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-20" />
                <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-14" />
            </div>
        </div>
    );
}

// ─── Book Search Card (grid version) ─────────────────────────────────────────

function SearchBookCard({ book, onClick }: { book: BookResult; onClick: () => void }) {
    const [imgError, setImgError] = useState(false);

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
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-light-purple dark:border-dark-purple p-4 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer group"
        >
            {/* Cover */}
            <div className="aspect-[2/3] bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-xl mb-3 overflow-hidden relative">
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
                        <span className="text-6xl">📖</span>
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
            </div>

            {/* Info */}
            <div className="space-y-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 text-sm">
                    {book.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {book.author}
                    {book.year ? ` • ${book.year}` : ""}
                </p>
                {book.ownerUsername && (
                    <p className="text-xs text-light-purple dark:text-light-pink">
                        @{book.ownerUsername}
                    </p>
                )}
                {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {book.genres.slice(0, 2).map((genre, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-light-purple/20 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink rounded-full"
                            >
                                {genre}
                            </span>
                        ))}
                        {book.genres.length > 2 && (
                            <span className="text-xs px-2 py-0.5 text-gray-500 dark:text-gray-400">
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
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-light-purple dark:border-dark-purple p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group block"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex-shrink-0 relative group-hover:ring-2 group-hover:ring-light-purple dark:group-hover:ring-dark-purple transition-all">
                    {showImage ? (
                        <Image
                            src={user.imageURL!}
                            alt={user.name}
                            fill
                            className="object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                            👤
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">
                        {user.name}
                    </h3>
                    <p className="text-sm text-light-purple dark:text-light-pink truncate">
                        @{user.username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-mono">
                            {user.studentCode}
                        </span>
                        {memberSince && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
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
                            className="text-xs px-2.5 py-1 bg-light-purple/15 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink rounded-full"
                        >
                            {pref}
                        </span>
                    ))}
                    {user.preferences.length > 4 && (
                        <span className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400">
                            +{user.preferences.length - 4}
                        </span>
                    )}
                </div>
            )}
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
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

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
            if (selectedBook?.id === bookId) {
                setSelectedBook({ ...selectedBook, ...data } as BookResult);
            }
            setIsModalOpen(false);
        } else {
            setToast({ message: result.error || "Error al actualizar libro", type: "error" });
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Run search when query or tab changes
    const executeSearch = useCallback(
        async (q: string, tab: SearchTab) => {
            if (q.length < 2) {
                setBookResults([]);
                setUserResults([]);
                setHasSearched(false);
                return;
            }

            setLoading(true);
            setHasSearched(true);

            try {
                if (tab === "books") {
                    const result = await searchBooks(q, 20);
                    if (result.success && result.books) {
                        setBookResults(result.books as BookResult[]);
                    }
                } else if (tab === "users") {
                    const result = await searchUsers(q, 20);
                    if (result.success && result.users) {
                        setUserResults(result.users as UserResult[]);
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

    // Debounced search
    useEffect(() => {
        if (activeTab === "communities") return;

        const timer = setTimeout(() => {
            executeSearch(query, activeTab);
        }, 400);

        return () => clearTimeout(timer);
    }, [query, activeTab, executeSearch]);

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
        setHasSearched(false);
    };

    const currentResults =
        activeTab === "books" ? bookResults : activeTab === "users" ? userResults : [];

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Buscar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Encuentra libros, usuarios o comunidades
                    </p>
                </div>

                {/* Search Input */}
                <div className="mb-6">
                    <div className="relative max-w-2xl">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-lg">
                            🔍
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                activeTab === "books"
                                    ? "Buscar por título o autor..."
                                    : activeTab === "users"
                                        ? "Buscar por nombre, usuario o código..."
                                        : "Buscar comunidades..."
                            }
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple focus:border-light-purple dark:focus:border-dark-purple focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-800 dark:text-gray-200 text-lg"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 border-b border-gray-200 dark:border-zinc-700 pb-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab.key
                                ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-lg shadow-purple-500/25"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── Content ─────────────────────────────────────────────────── */}

                {/* Communities placeholder */}
                {activeTab === "communities" && (
                    <div className="text-center py-20">
                        <div className="text-7xl mb-6 animate-bounce">🏘️</div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Comunidades — Próximamente
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                            Estamos trabajando en un sistema de comunidades donde podrás unirte a
                            grupos de lectura, compartir opiniones y descubrir nuevos libros con
                            personas que comparten tus intereses.
                        </p>
                        <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-purple-100 dark:bg-purple-900/30 text-light-purple dark:text-purple-300 rounded-full text-sm font-medium">
                            <span className="inline-block w-2 h-2 bg-light-purple rounded-full animate-pulse" />
                            En desarrollo
                        </div>
                    </div>
                )}

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

                {/* Results – Books */}
                {!loading && activeTab === "books" && bookResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {bookResults.length} {bookResults.length === 1 ? "resultado" : "resultados"} encontrados
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {bookResults.map((book) => (
                                <SearchBookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                            ))}
                        </div>
                    </>
                )}

                {/* Results – Users */}
                {!loading && activeTab === "users" && userResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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

                {/* Empty states */}
                {!loading &&
                    hasSearched &&
                    activeTab !== "communities" &&
                    currentResults.length === 0 && (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">
                                {activeTab === "books" ? "📖" : "👥"}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Sin resultados
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                No se encontraron {activeTab === "books" ? "libros" : "usuarios"} para
                                &quot;{query}&quot;. Intenta con otra búsqueda.
                            </p>
                        </div>
                    )}

                {/* Initial state – no search entered yet */}
                {!loading && !hasSearched && activeTab !== "communities" && (
                    <div className="text-center py-16">
                        <div className="text-7xl mb-6">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {activeTab === "books"
                                ? "Busca libros por título o autor"
                                : "Busca usuarios por nombre, usuario o código"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
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
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando búsqueda...</p>
                    </div>
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}
