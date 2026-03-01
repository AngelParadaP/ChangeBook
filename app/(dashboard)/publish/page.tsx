"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Search, X, BookOpen, Upload, Loader2 } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
import { fileToDataUrl, blobToFile } from "@/lib/imageUtils";
import { createBookAction } from "@/server/actions/books/createBook";
import { BOOK_GENRES } from "@/lib/constants/genres";

// ── Validation helpers ─────────────────────────────────────────────────────────

/** Allow letters (including accented), digits, spaces, and common punctuation */
const TEXT_RE = /^[\p{L}\p{N}\s.,;:!?'"¿¡—–\-()[\]{}&@#%/\\+*=_~`^$€£¥°©®™…·«»""'']+$/u;

function isValidText(value: string): boolean {
    return value.length === 0 || TEXT_RE.test(value);
}

function isValidYear(value: string): boolean {
    if (value === "") return true;
    const num = Number(value);
    return Number.isInteger(num) && num >= 1000 && num <= new Date().getFullYear() + 1;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PublishBookPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        author: "",
        publisher: "",
        year: "",
        imageUrl: "",
        description: "",
        genres: [] as string[],
    });

    // Validation error messages
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [croppedFile, setCroppedFile] = useState<File | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);

    // Genre search
    const [genreSearch, setGenreSearch] = useState("");

    const filteredGenres = useMemo(() => {
        if (!genreSearch.trim()) return [...BOOK_GENRES];
        const q = genreSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return BOOK_GENRES.filter((g) => {
            const normalized = g.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normalized.includes(q);
        });
    }, [genreSearch]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    if (status === "loading") {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // ── Field handlers with live validation ──────────────────────────────────

    const handleTextField = (field: "title" | "author" | "publisher", value: string) => {
        if (!isValidText(value)) {
            setErrors((prev) => ({ ...prev, [field]: "Contiene caracteres no permitidos" }));
        } else {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleYearChange = (value: string) => {
        // Only allow digits
        const sanitized = value.replace(/\D/g, "").slice(0, 4);

        if (sanitized.length === 4 && !isValidYear(sanitized)) {
            setErrors((prev) => ({ ...prev, year: `Año debe estar entre 1000 y ${new Date().getFullYear() + 1}` }));
        } else {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.year;
                return next;
            });
        }
        setFormData((prev) => ({ ...prev, year: sanitized }));
    };

    const handleDescriptionChange = (value: string) => {
        setFormData((prev) => ({ ...prev, description: value }));
    };

    // ── Image handling ───────────────────────────────────────────────────────

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setToast({
                message: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.",
                type: "error",
            });
            return;
        }

        const dataUrl = await fileToDataUrl(file);
        setCropperSrc(dataUrl);
        setShowCropper(true);
    };

    const handleCropComplete = (blob: Blob, previewUrl: string) => {
        setImagePreview(previewUrl);
        setCroppedFile(blobToFile(blob, "book-cover"));
        setFormData((prev) => ({ ...prev, imageUrl: "pending" }));
        setShowCropper(false);
        setCropperSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setCropperSrc(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Genres ────────────────────────────────────────────────────────────────

    const toggleGenre = (genre: string) => {
        setFormData((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }));
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Final validation
        if (!isValidText(formData.title) || !isValidText(formData.author) || !isValidText(formData.publisher)) {
            setToast({ message: "Algunos campos contienen caracteres no válidos", type: "error" });
            return;
        }

        if (formData.year && !isValidYear(formData.year)) {
            setToast({ message: `El año debe estar entre 1000 y ${new Date().getFullYear() + 1}`, type: "error" });
            return;
        }

        setIsSubmitting(true);

        try {
            if (!croppedFile) {
                setToast({ message: "Por favor selecciona una imagen", type: "error" });
                setIsSubmitting(false);
                return;
            }

            const submitData = new FormData();
            submitData.append("title", formData.title.trim());
            submitData.append("author", formData.author.trim());
            submitData.append("publisher", formData.publisher.trim());
            submitData.append("year", formData.year);
            submitData.append("image", croppedFile);
            submitData.append("description", formData.description.trim());
            submitData.append("genres", formData.genres.join(","));

            const result = await createBookAction(submitData);

            if (result.success) {
                setToast({ message: "¡Libro publicado exitosamente!", type: "success" });
                setFormData({
                    title: "",
                    author: "",
                    publisher: "",
                    year: "",
                    imageUrl: "",
                    description: "",
                    genres: [],
                });
                setImagePreview(null);
                setCroppedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setTimeout(() => {
                    router.push("/home");
                }, 2000);
            } else {
                setToast({ message: result.error || "Error al publicar libro", type: "error" });
            }
        } catch (error) {
            setToast({
                message: error instanceof Error ? error.message : "Error desconocido",
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <>
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 sm:p-2.5 bg-primary-soft rounded-xl">
                        <BookOpen size={24} className="text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                        Publicar un libro
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 ml-[44px] sm:ml-[52px] text-sm sm:text-base">
                    Comparte tu libro con la comunidad de Kyboo
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Top section: Image + Book info side by side on lg ────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Portada del libro <span className="text-red-500">*</span>
                            </label>
                            <div className="flex sm:flex-row flex-col items-center sm:items-start gap-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-36 h-52 sm:w-40 sm:h-60 flex-shrink-0 bg-gradient-to-br from-primary-light/40 to-primary-muted/30 dark:from-primary-dark/40 dark:to-primary-muted/20 rounded-xl overflow-hidden relative cursor-pointer hover:opacity-80 transition-all border-2 border-dashed border-primary/40 dark:border-primary-muted/40 hover:border-primary dark:hover:border-primary-muted group"
                                >
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                            <div className="p-2.5 bg-primary-soft rounded-full mb-2 group-hover:scale-110 transition-transform">
                                                <Upload size={22} className="text-primary" />
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                Click para subir
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <div className="text-center sm:text-left">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Sube una imagen de la portada
                                    </p>
                                    <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                                        <li>• Formatos: JPG, PNG, WebP</li>
                                        <li>• Se recortará a proporción 2:3</li>
                                        <li>• Recomendado: 400×600px o mayor</li>
                                    </ul>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setCroppedFile(null);
                                                setFormData((prev) => ({ ...prev, imageUrl: "" }));
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 mx-auto sm:mx-0"
                                        >
                                            <X size={12} /> Quitar imagen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Book info fields */}
                        <div className="space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Título <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleTextField("title", e.target.value)}
                                    required
                                    maxLength={200}
                                    className={`w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 dark:text-gray-200 transition-all ${errors.title
                                        ? "border-red-400 focus:ring-red-400"
                                        : "border-gray-200 dark:border-zinc-700 focus:ring-primary dark:focus:ring-primary-muted"
                                        }`}
                                    placeholder="Ej: El Principito"
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                                )}
                            </div>

                            {/* Author */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Autor <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={(e) => handleTextField("author", e.target.value)}
                                    required
                                    maxLength={150}
                                    className={`w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 dark:text-gray-200 transition-all ${errors.author
                                        ? "border-red-400 focus:ring-red-400"
                                        : "border-gray-200 dark:border-zinc-700 focus:ring-primary dark:focus:ring-primary-muted"
                                        }`}
                                    placeholder="Ej: Antoine de Saint-Exupéry"
                                />
                                {errors.author && (
                                    <p className="text-xs text-red-500 mt-1">{errors.author}</p>
                                )}
                            </div>

                            {/* Publisher and Year */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Editorial
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.publisher}
                                        onChange={(e) => handleTextField("publisher", e.target.value)}
                                        maxLength={150}
                                        className={`w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 dark:text-gray-200 transition-all ${errors.publisher
                                            ? "border-red-400 focus:ring-red-400"
                                            : "border-gray-200 dark:border-zinc-700 focus:ring-primary dark:focus:ring-primary-muted"
                                            }`}
                                        placeholder="Ej: Penguin Random House"
                                    />
                                    {errors.publisher && (
                                        <p className="text-xs text-red-500 mt-1">{errors.publisher}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Año de publicación
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.year}
                                        onChange={(e) => handleYearChange(e.target.value)}
                                        maxLength={4}
                                        className={`w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 dark:text-gray-200 transition-all ${errors.year
                                            ? "border-red-400 focus:ring-red-400"
                                            : "border-gray-200 dark:border-zinc-700 focus:ring-primary dark:focus:ring-primary-muted"
                                            }`}
                                        placeholder="Ej: 1943"
                                    />
                                    {errors.year && (
                                        <p className="text-xs text-red-500 mt-1">{errors.year}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Full-width sections below ────────────────────────────── */}

                    {/* Genres */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Géneros <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Selecciona uno o más géneros
                            {formData.genres.length > 0 && (
                                <span className="ml-1.5 text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                                    {formData.genres.length} seleccionado{formData.genres.length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </p>

                        {/* Genre search */}
                        <div className="relative mb-3">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search size={16} />
                            </span>
                            <input
                                type="text"
                                value={genreSearch}
                                onChange={(e) => setGenreSearch(e.target.value)}
                                placeholder="Buscar género..."
                                className="w-full pl-10 pr-8 py-2.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-gray-800 dark:text-gray-200 text-sm"
                            />
                            {genreSearch && (
                                <button
                                    type="button"
                                    onClick={() => setGenreSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Selected genres (pills at the top) */}
                        {formData.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.genres.map((genre) => (
                                    <button
                                        key={`selected-${genre}`}
                                        type="button"
                                        onClick={() => toggleGenre(genre)}
                                        className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group"
                                    >
                                        {genre}
                                        <X size={13} className="opacity-70 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Genre grid */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-52 overflow-y-auto custom-scrollbar p-2.5 sm:p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl border border-gray-100 dark:border-zinc-700/50">
                            {filteredGenres.length === 0 ? (
                                <p className="text-sm text-gray-400 dark:text-gray-500 py-2 w-full text-center">
                                    No se encontraron géneros para &quot;{genreSearch}&quot;
                                </p>
                            ) : (
                                filteredGenres.map((genre) => {
                                    const isSelected = formData.genres.includes(genre);
                                    return (
                                        <button
                                            key={genre}
                                            type="button"
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer border ${isSelected
                                                ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light border-primary/30 dark:border-primary-muted/30 ring-1 ring-primary/20 shadow-sm"
                                                : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-600 hover:border-primary/40 dark:hover:border-primary-muted/40 hover:bg-primary-soft hover:text-primary dark:hover:text-primary-light"
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

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            required
                            rows={5}
                            maxLength={2000}
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted text-gray-800 dark:text-gray-200 resize-none transition-all"
                            placeholder="Describe el libro, su condición y cualquier detalle relevante..."
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                            {formData.description.length}/2000
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !imagePreview || formData.genres.length === 0 || hasErrors}
                            className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                            {isSubmitting ? "Publicando..." : "Publicar libro"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/home")}
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>

            {/* Image Cropper Modal */}
            {showCropper && cropperSrc && (
                <ImageCropper
                    imageSrc={cropperSrc}
                    aspectRatio={2 / 3}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                    quality={0.85}
                />
            )}
        </>
    );
}
