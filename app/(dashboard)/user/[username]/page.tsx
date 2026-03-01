"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ProfileBookCard } from "@/components/profile/ProfileBookCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getUserProfileByUsername } from "@/server/actions/user/getUserProfileByUsername";
import { getUserBooks } from "@/server/actions/user/getUserBooks";
import { getOrCreateRoom } from "@/server/actions/chat";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { Loader2 } from "lucide-react";
import { Search, X } from "lucide-react";

interface UserProfile {
    id: string;
    studentCode: string;
    name: string;
    username: string;
    imageURL: string | null;
    preferences: string[];
    createdAt: Date | null;
}

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
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const username = params.username as string;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingBooks, setLoadingBooks] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [startingChat, setStartingChat] = useState(false);

    // Book modal state
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Book search & pagination
    const [bookSearch, setBookSearch] = useState("");
    const [booksToShow, setBooksToShow] = useState(10);

    useEffect(() => {
        if (username) {
            loadProfile(username);
        }
    }, [username]);

    useEffect(() => {
        if (profile?.id) {
            loadBooks(profile.id);
        }
    }, [profile]);

    const isOwner = session?.user?.id === profile?.id;

    useEffect(() => {
        if (isOwner) {
            router.push("/profile");
        }
    }, [isOwner, router]);



    const loadProfile = async (username: string) => {
        setLoading(true);
        try {
            const result = await getUserProfileByUsername(username);
            if (result.success && result.user) {
                setProfile(result.user as UserProfile);
            } else {
                setToast({ message: result.error || "Usuario no encontrado", type: "error" });
                // Redirect to home after a delay if user not found
                setTimeout(() => router.push("/home"), 2000);
            }
        } catch (err) {
            setToast({ message: "Error al cargar perfil", type: "error" });
            setTimeout(() => router.push("/home"), 2000);
        } finally {
            setLoading(false);
        }
    };

    const loadBooks = async (userId: string) => {
        setLoadingBooks(true);
        try {
            const result = await getUserBooks(userId);
            if (result.success && result.books) {
                setBooks(result.books as Book[]);
            }
        } catch (err) {
            console.error("Error loading books:", err);
        } finally {
            setLoadingBooks(false);
        }
    };

    const handleBookClick = (book: Book) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleStartChat = async () => {
        if (!profile?.id) return;

        setStartingChat(true);
        try {
            const result = await getOrCreateRoom(profile.id);

            if (result.success && result.roomId) {
                // Redirigir a la sala de chat
                router.push(`/chat/${result.roomId}`);
            } else {
                setToast({
                    message: result.error || "Error al crear chat",
                    type: "error"
                });
            }
        } catch (err) {
            setToast({
                message: "Error al iniciar chat",
                type: "error"
            });
        } finally {
            setStartingChat(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando perfil...</p>
                </div>
            </div>
        );
    }



    if (!profile) {
        return null;
    }

    if (isOwner) {
        return null;
    }
    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-hidden">
                {/* Left Column - User Info & Preferences */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Perfil de @{profile.username}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Información del usuario
                    </p>

                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border-2 border-primary/30 dark:border-primary-dark/50">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center relative">
                                        <UserAvatar
                                            imageURL={profile.imageURL}
                                            name={profile.name}
                                            size="2xl"
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                                        <p className="text-lg text-gray-800 dark:text-gray-100">{profile.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de usuario</label>
                                        <p className="text-lg text-gray-800 dark:text-gray-100">@{profile.username}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de alumno</label>
                                        <p className="text-lg text-gray-800 dark:text-gray-100">{profile.studentCode}</p>
                                    </div>

                                    {/* Botón para enviar mensaje */}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleStartChat}
                                            disabled={startingChat}
                                            className="w-full bg-gradient-to-r from-light-purple to-dark-purple text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-light-purple/20"
                                        >
                                            <span className="text-xl">💬</span>
                                            {startingChat ? "Abriendo chat..." : "Enviar mensaje"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-8 border-gray-200 dark:border-zinc-700" />

                            <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Preferencias de lectura</h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{profile.preferences.length} géneros</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Géneros favoritos de este usuario
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {profile.preferences.length > 0 ? (
                                    profile.preferences.map((genre) => (
                                        <span
                                            key={genre}
                                            className="px-4 py-2 rounded-full text-sm font-medium bg-light-purple/10 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink ring-1 ring-light-purple/20 shadow-sm"
                                        >
                                            {genre}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm italic py-2 w-full text-center">
                                        Este usuario no ha seleccionado preferencias aún
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                {/* Right Column - Published Books */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar flex flex-col">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Libros publicados
                    </h2>

                    {/* Book Search Bar */}
                    {books.length > 0 && (
                        <div className="relative mb-6">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                value={bookSearch}
                                onChange={(e) => {
                                    setBookSearch(e.target.value);
                                    setBooksToShow(10); // Reset pagination when searching
                                }}
                                placeholder="Buscar por título, autor o género..."
                                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200 transition-all font-medium"
                            />
                            {bookSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBookSearch("");
                                        setBooksToShow(10);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {loadingBooks ? (
                        <div className="text-center py-8">
                            <Loader2 size={32} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">Cargando libros...</p>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Este usuario no ha publicado libros aún
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1">
                            {(() => {
                                const filteredBooks = books.filter((book) => {
                                    const searchStr = bookSearch.toLowerCase();
                                    return (
                                        book.title.toLowerCase().includes(searchStr) ||
                                        book.author.toLowerCase().includes(searchStr) ||
                                        book.genres.some((g) => g.toLowerCase().includes(searchStr))
                                    );
                                });

                                if (filteredBooks.length === 0) {
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                                No se encontraron libros que coincidan con tu búsqueda.
                                            </p>
                                        </div>
                                    );
                                }

                                const visibleBooks = filteredBooks.slice(0, booksToShow);
                                const hasMore = filteredBooks.length > booksToShow;

                                return (
                                    <>
                                        <div className="space-y-4">
                                            {visibleBooks.map((book) => (
                                                <div key={book.id} onClick={() => handleBookClick(book)} className="cursor-pointer">
                                                    <ProfileBookCard
                                                        title={book.title}
                                                        author={book.author}
                                                        publisher={book.publisher}
                                                        year={book.year}
                                                        imageUrl={book.imageUrl}
                                                        description={book.description}
                                                        genres={book.genres}
                                                        status={book.status}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {hasMore && (
                                            <div className="pt-6 pb-2 text-center">
                                                <button
                                                    onClick={() => setBooksToShow((prev) => prev + 10)}
                                                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all"
                                                >
                                                    Cargar 10 más
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Book Modal */}
            {selectedBook && (
                <BookModal
                    book={selectedBook}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    isOwner={false}
                    currentUserId={session?.user?.id}
                />
            )}
        </>
    );
}
