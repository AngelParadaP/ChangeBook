"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ProfileBookCard } from "@/components/profile/ProfileBookCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { getUserProfileByUsername } from "@/server/actions/user/getUserProfileByUsername";
import { getUserBooks } from "@/server/actions/user/getUserBooks";
import { BOOK_GENRES } from "@/lib/constants/genres";

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

    // Book modal state
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">📚</div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando perfil...</p>
                </div>
            </div>
        );
    }



    if (!profile) {
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
                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border-2 border-light-purple dark:border-dark-purple">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center relative">
                                        {profile.imageURL ? (
                                            <Image src={profile.imageURL} alt={profile.name} fill className="object-cover" />
                                        ) : (
                                            <span className="text-5xl">👤</span>
                                        )}
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
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border-2 border-light-purple dark:border-dark-purple">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Preferencias de lectura</h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{profile.preferences.length} géneros</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Géneros favoritos de este usuario
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {BOOK_GENRES.map((genre) => {
                                    const isSelected = profile.preferences.includes(genre);
                                    return (
                                        <div
                                            key={genre}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? "bg-light-purple text-white" : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                                                } cursor-default`}
                                        >
                                            {genre}
                                        </div>
                                    );
                                })}
                            </div>

                            {profile.preferences.length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm text-center">
                                    Este usuario no ha seleccionado preferencias aún
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Published Books */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Libros publicados
                    </h2>

                    {loadingBooks ? (
                        <div className="text-center py-8">
                            <div className="animate-spin text-4xl mb-2">📚</div>
                            <p className="text-gray-500 dark:text-gray-400">Cargando libros...</p>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                Este usuario no ha publicado libros aún
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {books.map((book) => (
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
