"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";
import { getBookById } from "@/server/actions/books/getBookById";
import { updateBook } from "@/server/actions/books";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { addFavorite, removeFavorite, isFavorite as checkIsFavorite } from "@/server/actions/favorites";
import { getOrCreateRoom } from "@/server/actions/chat/getOrCreateRoom";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BookOpen, CircleCheck, CirclePause, CircleX, ArrowLeft, Pencil, Save, Mailbox, CalendarDays, MessageSquare, Heart } from "lucide-react";
import { BookDetailSkeleton } from "@/components/ui/skeletons";

interface BookDetail {
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
    ownerUsername: string | null;
    ownerName: string | null;
    ownerImageURL: string | null;
}

export default function BookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const bookId = params.id as string;

    const [book, setBook] = useState<BookDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [ownerImgError, setOwnerImgError] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        author: "",
        publisher: "",
        year: "",
        description: "",
        genres: [] as string[],
        status: "disponible",
    });

    // Exchange modal & Favorites
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        if (bookId) {
            loadBook(bookId);
            loadFavoriteStatus(bookId);
        }
    }, [bookId]);

    const loadFavoriteStatus = async (id: string) => {
        const result = await checkIsFavorite(id);
        if (result.success) {
            setIsFav(result.isFavorite);
        }
    };

    const handleToggleFavorite = async () => {
        if (!book || favLoading) return;
        setFavLoading(true);
        if (isFav) {
            const result = await removeFavorite(book.id);
            if (result.success) {
                setIsFav(false);
                setToast({ message: "Removido de favoritos", type: "success" });
            }
        } else {
            const result = await addFavorite(book.id);
            if (result.success) {
                setIsFav(true);
                setToast({ message: "¡Agregado a favoritos!", type: "success" });
            }
        }
        setFavLoading(false);
    };

    const loadBook = async (id: string) => {
        setLoading(true);
        try {
            const result = await getBookById(id);
            if (result.success && result.book) {
                setBook(result.book as BookDetail);
                setFormData({
                    title: result.book.title,
                    author: result.book.author,
                    publisher: result.book.publisher || "",
                    year: result.book.year?.toString() || "",
                    description: result.book.description,
                    genres: result.book.genres,
                    status: result.book.status || "disponible",
                });
            } else {
                setToast({ message: result.error || "Libro no encontrado", type: "error" });
                setTimeout(() => router.push("/home"), 2000);
            }
        } catch {
            setToast({ message: "Error al cargar libro", type: "error" });
            setTimeout(() => router.push("/home"), 2000);
        } finally {
            setLoading(false);
        }
    };

    const isOwner = session?.user?.id === book?.ownerId;

    const toggleGenre = (genre: string) => {
        setFormData((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }));
    };

    const handleSave = async () => {
        if (!book) return;
        setIsSaving(true);

        const updateData: {
            title?: string;
            author?: string;
            publisher?: string | null;
            year?: number | null;
            description?: string;
            genres?: string[];
            status?: "disponible" | "ocupado" | "intercambiado";
        } = {
            title: formData.title,
            author: formData.author,
            publisher: formData.publisher || null,
            year: formData.year ? parseInt(formData.year) : null,
            description: formData.description,
            genres: formData.genres,
            status: formData.status === "disponible" || formData.status === "ocupado" || formData.status === "intercambiado" ? formData.status : undefined,
        };

        const result = await updateBook(book.id, updateData);

        if (result.success) {
            setToast({ message: result.message || "Libro actualizado exitosamente", type: "success" });
            setBook({ ...book, ...updateData } as BookDetail);
            setIsEditing(false);
        } else {
            setToast({ message: result.error || "Error al actualizar libro", type: "error" });
        }

        setIsSaving(false);
    };

    const handleCancel = () => {
        if (book) {
            setFormData({
                title: book.title,
                author: book.author,
                publisher: book.publisher || "",
                year: book.year?.toString() || "",
                description: book.description,
                genres: book.genres,
                status: book.status || "disponible",
            });
        }
        setIsEditing(false);
    };

    // ─── Loading skeleton ──────────────────────────────────────────────────────

    if (loading) {
        return <BookDetailSkeleton />;
    }

    if (!book) return null;

    const validImage = isValidImageUrl(book.imageUrl) && !imageError;
    const validOwnerImage = book.ownerImageURL && isValidImageUrl(book.ownerImageURL) && !ownerImgError;
    const publishedDate = book.createdAt
        ? new Date(book.createdAt).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : null;

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
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 text-caption hover:text-heading hover:bg-soft rounded-xl transition-all mb-6 text-sm font-medium"
                >
                    <ArrowLeft size={18} /> Volver
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ─── Left Column: Image ────────────────────────────────────── */}
                    <div>
                        <div className="aspect-[2/3] max-h-[500px] bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-2xl overflow-hidden relative shadow-lg">
                            {validImage ? (
                                <Image
                                    src={book.imageUrl}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    onError={() => setImageError(true)}
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen size={80} className="text-purple-300 dark:text-purple-600" />
                                </div>
                            )}
                        </div>

                        {/* Status badge */}
                        <div className="mt-4 flex items-center gap-3">
                            <span
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${book.status === "disponible"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                    : book.status === "ocupado"
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                    }`}
                            >
                                <span className="inline-flex items-center gap-1">{book.status === "disponible" ? <><CircleCheck size={14} /> Disponible</> : book.status === "ocupado" ? <><CirclePause size={14} /> Ocupado</> : <><CircleX size={14} /> Intercambiado</>}</span>
                            </span>
                            {publishedDate && (
                                <span className="text-xs text-hint">
                                    Publicado el {publishedDate}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ─── Right Column: Details ─────────────────────────────────── */}
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-1">
                                Título
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading"
                                />
                            ) : (
                                <h1 className="text-2xl font-bold text-heading">
                                    {book.title}
                                </h1>
                            )}
                        </div>

                        {/* Author */}
                        <div>
                            <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-1">
                                Autor
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading"
                                />
                            ) : (
                                <p className="text-lg text-body">{book.author}</p>
                            )}
                        </div>

                        {/* Publisher & Year */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-1">
                                    Editorial
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.publisher}
                                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                        className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading"
                                    />
                                ) : (
                                    <p className="text-body">
                                        {book.publisher || "No especificada"}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-1">
                                    Año
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        min="1000"
                                        max={new Date().getFullYear() + 1}
                                        className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading"
                                    />
                                ) : (
                                    <p className="text-body">
                                        {book.year || "No especificado"}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Genres */}
                        <div>
                            <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-2">
                                Géneros
                            </label>
                            {isEditing ? (
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-subtle rounded-xl">
                                    {BOOK_GENRES.map((genre) => {
                                        const isSelected = formData.genres.includes(genre);
                                        return (
                                            <button
                                                key={genre}
                                                type="button"
                                                onClick={() => toggleGenre(genre)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${isSelected
                                                    ? "bg-light-purple text-white"
                                                    : "bg-dim text-body"
                                                    } cursor-pointer hover:scale-105`}
                                            >
                                                {genre}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {book.genres.length > 0 ? (
                                        book.genres.map((genre, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 bg-light-purple/20 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink rounded-full text-xs font-medium"
                                            >
                                                {genre}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-hint">Sin géneros</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-2">
                                Descripción
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading resize-none"
                                />
                            ) : (
                                <p className="text-body text-sm leading-relaxed">
                                    {book.description}
                                </p>
                            )}
                        </div>

                        {/* Status (edit mode) */}
                        {isEditing && (
                            <div>
                                <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-1">
                                    Estado
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-heading"
                                    disabled={book?.status === "ocupado"}
                                >
                                    <option value="disponible">Disponible</option>
                                    <option value="ocupado">Ocupado</option>
                                    <option value="intercambiado">Intercambiado</option>
                                </select>
                            </div>
                        )}

                        {/* ─── Owner Card ──────────────────────────────────────────── */}
                        <div className="bg-subtle rounded-2xl p-4 border border-card-border">
                            <label className="block text-xs font-semibold text-hint uppercase tracking-wide mb-3">
                                Publicado por
                            </label>
                            <Link
                                href={`/user/${book.ownerUsername}`}
                                className="flex items-center gap-3 group"
                            >
                                <UserAvatar
                                    imageURL={book.ownerImageURL}
                                    name={book.ownerName || "Usuario"}
                                    size="md"
                                    className="group-hover:ring-2 group-hover:ring-light-purple dark:group-hover:ring-dark-purple transition-all"
                                />
                                <div>
                                    <p className="font-semibold text-heading group-hover:text-light-purple dark:group-hover:text-light-pink transition-colors">
                                        {book.ownerName || "Usuario"}
                                    </p>
                                    <p className="text-sm text-light-purple dark:text-light-pink">
                                        @{book.ownerUsername}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* ─── Action Buttons ──────────────────────────────────────── */}
                        <div className="flex gap-3 pt-2">
                            {isOwner ? (
                                isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            disabled={isSaving}
                                            className="flex-1 px-6 py-3 bg-dim text-heading font-semibold rounded-xl transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/25"
                                        >
                                            {isSaving ? "Guardando..." : <><Save size={16} className="inline mr-1" /> Guardar Cambios</>}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25"
                                    >
                                        <Pencil size={16} className="inline mr-1" /> Editar Libro
                                    </button>
                                )
                            ) : (
                                <div className="flex flex-col gap-2 w-full">
                                    {/* Solicitar intercambio — disponible para disponible y ocupado (calendario filtra fechas) */}
                                    {(book.status === "disponible" || book.status === "ocupado") && (
                                        <button
                                            onClick={() => setShowExchangeModal(true)}
                                            className="w-full px-6 py-3 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25"
                                        >
                                            <Mailbox size={16} className="inline mr-1" /> Solicitar Intercambio
                                        </button>
                                    )}
                                    {book.status === "ocupado" && (
                                        <p className="text-xs text-center text-amber-600 dark:text-amber-400">
                                            <CalendarDays size={14} className="inline mr-1" /> Este libro tiene fechas ocupadas. En el calendario podrás ver los días disponibles.
                                        </p>
                                    )}
                                    {/* Botón de mensaje */}
                                    <button
                                        onClick={async () => {
                                            const result = await getOrCreateRoom(book.ownerId);
                                            if (result.success && result.roomId) {
                                                router.push(`/chat/${result.roomId}`);
                                            }
                                        }}
                                        className="w-full px-6 py-2.5 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 bg-soft text-body hover:bg-dim border border-card-border"
                                    >
                                        <MessageSquare size={16} className="inline mr-1" /> Enviar Mensaje al Dueño
                                    </button>
                                    {/* Botón de favorito */}
                                    <button
                                        onClick={handleToggleFavorite}
                                        disabled={favLoading}
                                        className={`w-full px-6 py-2.5 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${isFav
                                            ? "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/30"
                                            : "bg-soft text-caption hover:bg-dim border border-card-border"
                                            }`}
                                    >
                                        {favLoading ? "..." : isFav ? <><Heart size={14} className="inline mr-1 fill-current" /> En favoritos</> : <><Heart size={14} className="inline mr-1" /> Agregar a favoritos</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Exchange Request Modal */}
            {book && !isOwner && (
                <ExchangeRequestModal
                    isOpen={showExchangeModal}
                    onClose={() => setShowExchangeModal(false)}
                    bookId={book.id}
                    bookTitle={book.title}
                    ownerName={book.ownerName || "Usuario"}
                    onSuccess={() => {
                        loadBook(bookId);
                        setShowExchangeModal(false);
                        setToast({ message: "¡Solicitud de intercambio enviada!", type: "success" });
                    }}
                />
            )}


        </>
    );
}
