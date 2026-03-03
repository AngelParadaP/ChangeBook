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
import { getFriendStatus, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from "@/server/actions/friends";
import { Search, X, MessageSquare, UserPlus, UserCheck, Clock, UserMinus, Check, XCircle } from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/skeletons";

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

    // Friend states
    const [friendStatus, setFriendStatus] = useState<string>("none");
    const [friendRequestId, setFriendRequestId] = useState<string | null>(null);
    const [loadingFriend, setLoadingFriend] = useState(false);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [isRemoveFriendModalOpen, setIsRemoveFriendModalOpen] = useState(false);

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
                loadFriendStatus(result.user.id);
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

    const loadFriendStatus = async (userId: string) => {
        try {
            const res = await getFriendStatus(userId);
            if (res.success) {
                setFriendStatus(res.status || "none");
                setFriendRequestId(res.request?.id || null);
            }
        } catch (err) {
            console.error("Error loading friend status", err);
        }
    };

    const handleSendFriendRequest = async () => {
        if (!profile?.id) return;
        setLoadingFriend(true);
        try {
            const res = await sendFriendRequest(profile.id);
            if (res.success) {
                setToast({ message: "Solicitud de amistad enviada", type: "success" });
                setFriendStatus("request_sent");
            } else {
                setToast({ message: res.error || "Error al enviar solicitud", type: "error" });
            }
        } catch (err) {
            setToast({ message: "Error de servidor", type: "error" });
        } finally {
            setLoadingFriend(false);
        }
    };

    const handleAcceptFriendRequest = async () => {
        if (!friendRequestId) return;
        setLoadingFriend(true);
        try {
            const res = await acceptFriendRequest(friendRequestId);
            if (res.success) {
                setToast({ message: "Solicitud aceptada", type: "success" });
                setFriendStatus("friends");
                setIsFriendModalOpen(false);
            } else {
                setToast({ message: res.error || "Error al aceptar solicitud", type: "error" });
            }
        } catch (err) {
            setToast({ message: "Error de servidor", type: "error" });
        } finally {
            setLoadingFriend(false);
        }
    };

    const handleDeclineFriendRequest = async () => {
        if (!friendRequestId) return;
        setLoadingFriend(true);
        try {
            const res = await declineFriendRequest(friendRequestId);
            if (res.success) {
                setToast({ message: "Solicitud declinada", type: "success" });
                setFriendStatus("none");
                setIsFriendModalOpen(false);
            } else {
                setToast({ message: res.error || "Error al declinar solicitud", type: "error" });
            }
        } catch (err) {
            setToast({ message: "Error de servidor", type: "error" });
        } finally {
            setLoadingFriend(false);
        }
    };

    const handleRemoveFriend = async () => {
        if (!friendRequestId) return;
        setLoadingFriend(true);
        try {
            const res = await removeFriend(friendRequestId);
            if (res.success) {
                setToast({ message: "Amigo eliminado", type: "success" });
                setFriendStatus("none");
                setFriendRequestId(null);
                setIsRemoveFriendModalOpen(false);
            } else {
                setToast({ message: res.error || "Error al eliminar amigo", type: "error" });
            }
        } catch (err) {
            setToast({ message: "Error de servidor", type: "error" });
        } finally {
            setLoadingFriend(false);
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
        return <ProfileSkeleton />;
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
                <div className="bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-y-auto custom-scrollbar">
                    <h1 className="text-3xl font-bold text-heading mb-2">
                        Perfil de @{profile.username}
                    </h1>
                    <p className="text-caption mb-6">
                        Información del usuario
                    </p>

                    <div className="space-y-6">
                        <div className="bg-subtle rounded-2xl p-6 border-2 border-primary/30 dark:border-primary-dark/50 shadow-inner">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-44 h-44 rounded-full p-[6px] bg-gradient-to-br from-primary-light/80 to-primary-muted dark:from-primary-dark dark:to-primary flex items-center justify-center relative shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                                        <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
                                            <UserAvatar
                                                imageURL={profile.imageURL}
                                                name={profile.name}
                                                size="2xl"
                                                className="w-full h-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-body mb-2">Nombre</label>
                                        <p className="text-lg text-heading">{profile.name}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-body mb-2">Nombre de usuario</label>
                                        <p className="text-lg text-heading">@{profile.username}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-body mb-2">Código de alumno</label>
                                        <p className="text-lg text-heading">{profile.studentCode}</p>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="pt-4 flex flex-col gap-3">
                                        {friendStatus === "none" && (
                                            <button
                                                onClick={handleSendFriendRequest}
                                                disabled={loadingFriend}
                                                className="w-full bg-soft text-body hover:bg-dim font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <UserPlus size={20} />
                                                {loadingFriend ? "Enviando..." : "Añadir amigo"}
                                            </button>
                                        )}
                                        {friendStatus === "request_sent" && (
                                            <button
                                                disabled
                                                className="w-full bg-hint/20 text-hint font-bold py-3 px-6 rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <Clock size={20} />
                                                Solicitud enviada
                                            </button>
                                        )}
                                        {friendStatus === "request_received" && (
                                            <button
                                                onClick={() => setIsFriendModalOpen(true)}
                                                className="w-full bg-success/20 text-success hover:bg-success/30 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                <UserCheck size={20} />
                                                Responder solicitud
                                            </button>
                                        )}
                                        {friendStatus === "friends" && (
                                            <button
                                                onClick={() => setIsRemoveFriendModalOpen(true)}
                                                disabled={loadingFriend}
                                                className="w-full bg-danger/10 text-danger hover:bg-danger/20 font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <UserMinus size={20} />
                                                Eliminar amigo
                                            </button>
                                        )}

                                        <button
                                            onClick={handleStartChat}
                                            disabled={startingChat || friendStatus !== "friends"}
                                            className={`w-full font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-opacity ${friendStatus === "friends" ? "bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-primary/20" : "bg-hint/20 text-hint cursor-not-allowed"}`}
                                            title={friendStatus !== "friends" ? "Debes ser amigo para enviar mensajes" : ""}
                                        >
                                            <MessageSquare size={20} />
                                            {startingChat ? "Abriendo chat..." : "Enviar mensaje"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-8 border-card-border" />

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-heading">Preferencias de lectura</h2>
                                    <span className="text-sm text-hint">{profile.preferences.length} géneros</span>
                                </div>
                                <p className="text-caption mb-6">
                                    Géneros favoritos de este usuario
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {profile.preferences.length > 0 ? (
                                        profile.preferences.map((genre) => (
                                            <span
                                                key={genre}
                                                className="px-4 py-2 rounded-full text-sm font-medium bg-primary-soft dark:bg-primary-dark/20 text-primary dark:text-primary-light ring-1 ring-primary/20 shadow-sm"
                                            >
                                                {genre}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-hint text-sm italic py-2 w-full text-center">
                                            Este usuario no ha seleccionado preferencias aún
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Published Books */}
                <div className="bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                    <h2 className="text-2xl font-bold text-heading mb-4">
                        Libros publicados
                    </h2>

                    {/* Book Search Bar */}
                    {books.length > 0 && (
                        <div className="relative mb-6">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint">
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
                                className="w-full pl-10 pr-10 py-3 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-heading transition-all font-medium"
                            />
                            {bookSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBookSearch("");
                                        setBooksToShow(10);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {loadingBooks ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex gap-4 p-3 bg-subtle rounded-2xl border border-card-border/30 animate-pulse">
                                    <div className="w-14 h-20 rounded-xl bg-dim flex-shrink-0" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-dim rounded-full w-3/4" />
                                        <div className="h-3 bg-dim rounded-full w-1/2" />
                                        <div className="flex gap-1 mt-3">
                                            <div className="h-5 bg-dim rounded-full w-16" />
                                            <div className="h-5 bg-dim rounded-full w-14" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-hint text-lg">
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
                                            <p className="text-hint text-lg">
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
                                                    className="px-6 py-2.5 bg-soft hover:bg-dim text-body font-semibold rounded-xl transition-all"
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
            {/* Modal para responder solicitud de amistad */}
            {isFriendModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-6 border border-card-border overflow-hidden relative">
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setIsFriendModalOpen(false)}
                                className="text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-4 text-center">Solicitud de amistad</h2>
                        <p className="text-body text-center mb-8">
                            <b>{profile.name}</b> te ha enviado una solicitud de amistad. ¿Deseas aceptarla?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleDeclineFriendRequest}
                                disabled={loadingFriend}
                                className="flex-1 bg-soft hover:bg-danger/20 text-body hover:text-danger font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle size={20} />
                                Rechazar
                            </button>
                            <button
                                onClick={handleAcceptFriendRequest}
                                disabled={loadingFriend}
                                className="flex-1 bg-primary text-white hover:bg-primary-dark font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={20} />
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación para eliminar amigo */}
            {isRemoveFriendModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-6 border border-card-border overflow-hidden relative">
                        <div className="absolute top-4 right-4">
                            <button
                                onClick={() => setIsRemoveFriendModalOpen(false)}
                                className="text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-4 text-center">Eliminar amigo</h2>
                        <p className="text-body text-center mb-8">
                            ¿Estás seguro de que deseas eliminar a <b>{profile.name}</b> de tu lista de amigos?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsRemoveFriendModalOpen(false)}
                                disabled={loadingFriend}
                                className="flex-1 bg-soft hover:bg-dim text-body font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRemoveFriend}
                                disabled={loadingFriend}
                                className="flex-1 bg-danger text-white hover:bg-danger-dark font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <UserMinus size={20} />
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
