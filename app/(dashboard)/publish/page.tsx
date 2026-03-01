"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Toast } from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
import { fileToDataUrl, blobToFile } from "@/lib/imageUtils";
import { createBookAction } from "@/server/actions/books/createBook";
import { BOOK_GENRES } from "@/lib/constants/genres";

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setToast({
        message: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.",
        type: "error",
      });
      return;
    }

    // Open cropper instead of just previewing
    const dataUrl = await fileToDataUrl(file);
    setCropperSrc(dataUrl);
    setShowCropper(true);
  };

  const handleCropComplete = (blob: Blob, previewUrl: string) => {
    setImagePreview(previewUrl);
    setCroppedFile(blobToFile(blob, "book-cover"));
    setFormData({ ...formData, imageUrl: "pending" });
    setShowCropper(false);
    setCropperSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use the cropped file instead of raw file input
      if (!croppedFile) {
        setToast({ message: "Por favor selecciona una imagen", type: "error" });
        setIsSubmitting(false);
        return;
      }

      // Create FormData for the action
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("author", formData.author);
      submitData.append("publisher", formData.publisher);
      submitData.append("year", formData.year);
      submitData.append("image", croppedFile);
      submitData.append("description", formData.description);
      submitData.append("genres", formData.genres.join(","));

      const result = await createBookAction(submitData);

      if (result.success) {
        setToast({ message: "¡Libro publicado exitosamente!", type: "success" });
        // Reset form
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
        // Redirect after delay
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

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Publicar un libro
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Comparte tu libro con la comunidad de Kyboo
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Portada del libro <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 items-start">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-48 flex-shrink-0 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 rounded-xl overflow-hidden relative cursor-pointer hover:opacity-80 transition-all border-2 border-dashed border-light-purple dark:border-dark-purple"
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
                    <span className="text-4xl mb-2">📷</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
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
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Sube una imagen de la portada del libro
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <li>• Formatos: JPG, PNG, WebP</li>
                  <li>• Tamaño máximo: 5MB</li>
                  <li>• Recomendado: 400x600px</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
              placeholder="Ej: El Principito"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Autor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
              className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
              placeholder="Ej: Antoine de Saint-Exupéry"
            />
          </div>

          {/* Publisher and Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Editorial
              </label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                placeholder="Ej: Penguin Random House"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Año de publicación
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                min="1000"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                placeholder="Ej: 1943"
              />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Géneros <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Selecciona uno o más géneros ({formData.genres.length} seleccionados)
            </p>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              {BOOK_GENRES.map((genre) => {
                const isSelected = formData.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-light-purple text-white"
                        : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                    } cursor-pointer hover:scale-105`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200 resize-none"
              placeholder="Describe el libro, su condición y cualquier detalle relevante..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !imagePreview || formData.genres.length === 0}
              className="flex-1 px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
