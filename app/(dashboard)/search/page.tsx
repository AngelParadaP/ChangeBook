"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { searchBooks } from "@/server/actions/books/searchBooks";
import { searchUsers } from "@/server/actions/user/searchUsers";
import { getCommunities } from "@/server/actions/communities/getCommunities";
import { updateBook } from "@/server/actions/books";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Users, BookOpen, User, Building2, Search, Loader2 } from "lucide-react";

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

function CommunityCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 p-5 animate-pulse">
            <div className="flex items-start gap-4 mb-3">
                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-zinc-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-24" />
                    <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full w-16" />
                </div>
            </div>
            <div className="space-y-1.5 mb-4">
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-full" />
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-2/3" />
            </div>
            <div className="h-9 bg-gray-200 dark:bg-zinc-700 rounded-lg" />
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
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-primary/30 dark:border-primary-dark/50 p-4 hover:shadow-xl hover:shadow-primary-glow hover:border-primary/60 hover:scale-[1.03] transition-all duration-300 cursor-pointer group"
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
                    <p className="text-xs text-primary dark:text-primary-light">
                        @{book.ownerUsername}
                    </p>
                )}
                {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {book.genres.slice(0, 2).map((genre, idx) => (
                            <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full"
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
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-primary/30 dark:border-primary-dark/50 p-5 hover:shadow-xl hover:shadow-primary-glow hover:border-primary/60 hover:scale-[1.02] transition-all duration-300 cursor-pointer group block"
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
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">
                        {user.name}
                    </h3>
                    <p className="text-sm text-primary dark:text-primary-light truncate">
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
                            className="text-xs px-2.5 py-1 bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light rounded-full"
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

// ─── Community Search Card ───────────────────────────────────────────────────

function SearchCommunityCard({ community }: { community: CommunityResult }) {
    const [imgError, setImgError] = useState(false);
    const showImage = community.imageUrl && !imgError;

    return (
        <Link
            href={`/communities/${community.id}`}
            className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-primary/30 dark:border-primary-dark/40 p-5 hover:shadow-xl hover:shadow-primary-glow hover:scale-[1.02] hover:border-primary/60 dark:hover:border-primary-muted/60 transition-all duration-300 cursor-pointer group block"
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
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base">
                        {community.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
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
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
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
                setCommunityResults([]);
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
                } else if (tab === "communities") {
                    const result = await getCommunities({ query: q, limit: 20 });
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

    // Debounced search
    useEffect(() => {
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
        setCommunityResults([]);
        setHasSearched(false);
    };

    const currentResults =
        activeTab === "books"
            ? bookResults
            : activeTab === "users"
                ? userResults
                : communityResults;

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
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-zinc-800 border-2 border-gray-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted focus:border-primary dark:focus:border-primary-muted focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-800 dark:text-gray-200 text-lg"
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
                                ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary-glow"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="text-base">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── Content ─────────────────────────────────────────────────── */}

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

                {/* Results – Communities */}
                {!loading && activeTab === "communities" && communityResults.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
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

                {/* Empty states */}
                {!loading &&
                    hasSearched &&
                    currentResults.length === 0 && (
                        <div className="text-center py-16">
                            <div className="mb-4 flex justify-center">
                                {activeTab === "books" ? <BookOpen size={56} className="text-gray-300 dark:text-gray-600" /> : activeTab === "users" ? <Users size={56} className="text-gray-300 dark:text-gray-600" /> : <Building2 size={56} className="text-gray-300 dark:text-gray-600" />}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Sin resultados
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                No se encontraron {activeTab === "books" ? "libros" : activeTab === "users" ? "usuarios" : "comunidades"} para
                                &quot;{query}&quot;. Intenta con otra búsqueda.
                            </p>
                        </div>
                    )}

                {/* Initial state – no search entered yet */}
                {!loading && !hasSearched && (
                    <div className="text-center py-16">
                        <div className="mb-6 flex justify-center"><Search size={64} className="text-gray-300 dark:text-gray-600" /></div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            {activeTab === "books"
                                ? "Busca libros por título o autor"
                                : activeTab === "users"
                                    ? "Busca usuarios por nombre, usuario o código"
                                    : "Busca comunidades por nombre"}
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
                        <Loader2 size={48} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando búsqueda...</p>
                    </div>
                </div>
            }
        >
            <SearchPageContent />
        </Suspense>
    );
}
