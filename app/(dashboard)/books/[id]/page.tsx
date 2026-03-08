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
import { sendMessage } from "@/server/actions/chat/sendMessage";
import { encodeBookCardMessage } from "@/lib/utils/bookCardMessage";
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

    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [favLoading, setFavLoading] = useState(false);
    const [genreSearch, setGenreSearch] = useState("");

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

        if (!formData.title.trim()) {
            setToast({ message: "El título es obligatorio.", type: "error" });
            return;
        }

        if (!formData.author.trim()) {
            setToast({ message: "El autor es obligatorio.", type: "error" });
            return;
        }

        if (formData.genres.length === 0) {
            setToast({ message: "Debes elegir al menos 1 género.", type: "error" });
            return;
        }

        if (formData.genres.length > 5) {
            setToast({ message: "No puedes seleccionar más de 5 géneros.", type: "error" });
            return;
        }

        if (formData.year) {
            const yearNum = parseInt(formData.year, 10);
            if (isNaN(yearNum) || yearNum < 1000 || yearNum > new Date().getFullYear() + 1) {
                setToast({ message: "El año no es válido.", type: "error" });
                return;
            }
        }

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

            <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-sm border border-card-border p-5 md:p-8 overflow-y-auto custom-scrollbar h-full relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-muted/10 blur-[120px] rounded-full pointer-events-none" />

                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="relative z-10 flex items-center gap-2 px-4 py-2 text-hint hover:text-primary hover:bg-primary-soft rounded-2xl transition-all duration-300 mb-6 text-sm font-semibold w-fit"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Volver
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
                    {/* ─── Left Column: Image ────────────────────────────────────── */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                        <div className="aspect-[2/3] w-full max-w-sm mx-auto lg:max-w-none bg-gradient-to-br from-dim to-subtle rounded-3xl overflow-hidden relative shadow-2xl ring-1 ring-card-border group">
                            {validImage ? (
                                <Image
                                    src={book.imageUrl}
                                    alt={book.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    onError={() => setImageError(true)}
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary-soft/50">
                                    <BookOpen size={80} className="text-primary/40 drop-shadow-sm" />
                                </div>
                            )}
                            {/* Inner glass reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
                        </div>

                        {/* Status badge & Date */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-subtle p-4 rounded-2xl border border-card-border/60">
                            <span
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${book.status === "disponible"
                                    ? "bg-status-success/10 text-status-success-dark dark:text-status-success"
                                    : book.status === "ocupado"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        : "bg-status-danger/10 text-status-danger-dark dark:text-status-danger"
                                    }`}
                            >
                                {book.status === "disponible" ? <><CircleCheck size={16} /> Disponible</> :
                                    book.status === "ocupado" ? <><CirclePause size={16} /> Ocupado</> :
                                        <><CircleX size={16} /> Intercambiado</>}
                            </span>
                            {publishedDate && (
                                <span className="text-xs font-medium text-caption flex items-center gap-1.5">
                                    <CalendarDays size={14} className="opacity-70" />
                                    {publishedDate}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ─── Right Column: Details ─────────────────────────────────── */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
                        <div className="flex-1 space-y-6">
                            {/* Title & Author Header */}
                            <div className="space-y-3">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5 ml-1">Título</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-input border-2 border-input-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-heading font-semibold text-lg transition-all"
                                                placeholder="Título del libro"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5 ml-1">Autor</label>
                                            <input
                                                type="text"
                                                value={formData.author}
                                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-input border-2 border-input-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-heading font-medium transition-all"
                                                placeholder="Nombre del autor"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-heading tracking-tight leading-tight">
                                            {book.title}
                                        </h1>
                                        <p className="text-xl sm:text-2xl text-primary font-semibold">
                                            {book.author}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Genres */}
                            <div>
                                {isEditing ? (
                                    <>
                                        <label className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-2 ml-1">Géneros</label>
                                        <input
                                            type="text"
                                            placeholder="Buscar géneros..."
                                            value={genreSearch}
                                            onChange={(e) => setGenreSearch(e.target.value)}
                                            className="w-full px-4 py-2 mb-3 bg-input border-2 border-input-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-heading transition-all"
                                        />
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 bg-subtle/50 backdrop-blur-sm rounded-2xl border border-card-border">
                                            {BOOK_GENRES.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase())).map((genre) => {
                                                const isSelected = formData.genres.includes(genre);
                                                return (
                                                    <button
                                                        key={genre}
                                                        type="button"
                                                        onClick={() => toggleGenre(genre)}
                                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isSelected
                                                            ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                                                            : "bg-card text-caption hover:bg-dim border border-card-border"
                                                            }`}
                                                    >
                                                        {genre}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {book.genres.length > 0 ? (
                                            book.genres.map((genre, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-4 py-1.5 bg-primary-soft text-primary rounded-full text-xs font-bold tracking-wide shadow-sm border border-primary/10"
                                                >
                                                    {genre}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm font-medium text-hint italic">Sin géneros definidos</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info Cards (Publisher & Year) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-subtle p-4 rounded-2xl border border-card-border/50">
                                    <label className="block text-[10px] sm:text-xs font-bold text-caption uppercase tracking-wider mb-1">
                                        Editorial
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.publisher}
                                            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                            className="w-full px-3 py-2 bg-input border-2 border-input-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-heading text-sm"
                                        />
                                    ) : (
                                        <p className="text-body font-semibold truncate">
                                            {book.publisher || "No especificada"}
                                        </p>
                                    )}
                                </div>
                                <div className="bg-subtle p-4 rounded-2xl border border-card-border/50">
                                    <label className="block text-[10px] sm:text-xs font-bold text-caption uppercase tracking-wider mb-1">
                                        Año
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            min="1000"
                                            max={new Date().getFullYear() + 1}
                                            className="w-full px-3 py-2 bg-input border-2 border-input-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-heading text-sm"
                                        />
                                    ) : (
                                        <p className="text-body font-semibold">
                                            {book.year || "No especificado"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-card p-5 rounded-3xl border border-card-border shadow-sm">
                                <label className="block text-[11px] font-bold text-primary uppercase tracking-wider mb-3">
                                    Sinopsis / Descripción
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-input border-2 border-input-border rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-heading resize-none leading-relaxed transition-all"
                                    />
                                ) : (
                                    <p className="text-body/90 text-[15px] leading-relaxed whitespace-pre-line">
                                        {book.description || <span className="italic text-hint">No hay descripción disponible.</span>}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ─── Footer Action Area ───────────────────────────────────── */}
                        <div className="mt-8 space-y-5">
                            {!isOwner && (
                                <div className="flex flex-col sm:flex-row items-center justify-between bg-primary-soft/30 p-3 pr-4 rounded-2xl border border-primary/10 gap-4">
                                    <div className="flex items-center gap-3 w-full sm:w-auto ml-1">
                                        <UserAvatar
                                            imageURL={book.ownerImageURL}
                                            name={book.ownerName || "Usuario"}
                                            size="md"
                                            className="ring-2 ring-background shadow-md"
                                        />
                                        <div>
                                            <p className="text-[10px] font-bold text-caption uppercase tracking-wider">Dueño del Libro</p>
                                            <Link href={`/user/${book.ownerUsername}`} className="font-bold text-heading hover:text-primary transition-colors block leading-tight">
                                                {book.ownerName || "Usuario"}
                                            </Link>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            const result = await getOrCreateRoom(book.ownerId);
                                            if (result.success && result.roomId) {
                                                const bookCardMsg = encodeBookCardMessage({
                                                    bookId: book.id,
                                                    title: book.title,
                                                    author: book.author,
                                                    imageUrl: book.imageUrl,
                                                });
                                                // En lugar de enviar el mensaje, redirigimos al chat pasando el "draft"
                                                const params = new URLSearchParams({ draft: bookCardMsg });
                                                router.push(`/chat/${result.roomId}?${params.toString()}`);
                                            }
                                        }}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-card border border-card-border text-primary font-bold rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <MessageSquare size={16} /> Contactar
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {isOwner ? (
                                    isEditing ? (
                                        <>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isSaving}
                                                className="w-full sm:w-1/3 px-6 py-4 bg-dim text-body font-bold rounded-2xl transition-all hover:bg-dim/80 active:scale-95 disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="w-full sm:w-2/3 px-6 py-4 bg-primary text-white font-bold rounded-2xl transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? (
                                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                                                ) : (
                                                    <><Save size={20} /> Guardar Cambios</>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="w-full px-6 py-4 bg-primary text-white font-bold rounded-2xl transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Pencil size={20} /> Editar Información del Libro
                                        </button>
                                    )
                                ) : (
                                    <>
                                        {(book.status === "disponible" || book.status === "ocupado") && (
                                            <button
                                                onClick={() => setShowExchangeModal(true)}
                                                className="flex-1 px-6 py-4 bg-primary text-white font-bold rounded-2xl transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 active:scale-95 flex items-center justify-center gap-2 text-lg"
                                            >
                                                <Mailbox size={22} className="opacity-90" />
                                                Pedir Intercambio
                                            </button>
                                        )}
                                        <button
                                            onClick={handleToggleFavorite}
                                            disabled={favLoading}
                                            className={`sm:w-auto flex-shrink-0 px-6 py-4 font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 ${isFav
                                                ? "bg-status-danger/10 text-status-danger border-2 border-status-danger/20 hover:bg-status-danger/20"
                                                : "bg-subtle text-caption border-2 border-transparent hover:bg-dim hover:text-body"
                                                }`}
                                            title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                                        >
                                            {favLoading ? (
                                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Heart size={24} className={isFav ? "fill-current scale-110 transition-transform" : "scale-100 transition-transform hover:scale-110"} />
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {!isOwner && book.status === "ocupado" && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 rounded-2xl flex items-start gap-3">
                                    <CalendarDays className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Este libro se encuentra prestado actualmente. Aún puedes enviar una solicitud y en el calendario podrás sugerir fechas futuras cuando esté libre.
                                    </p>
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
