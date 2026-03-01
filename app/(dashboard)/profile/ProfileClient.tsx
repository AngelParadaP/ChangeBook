"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import { ProfileBookCard } from "@/components/profile/ProfileBookCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import ImageCropper from "@/components/ui/ImageCropper";
import { fileToDataUrl, blobToFile } from "@/lib/imageUtils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { updateUserProfile } from "@/server/actions/user/updateUserProfile";
import { getUserBooks } from "@/server/actions/user/getUserBooks";
import { getUserProfile } from "@/server/actions/user/getUserProfile";
import { updateBook } from "@/server/actions/books";
import { BOOK_GENRES } from "@/lib/constants/genres";
import { Loader2, Trash2, Undo2, AlertTriangle } from "lucide-react";

export interface UserProfile {
  id: string;
  studentCode: string;
  name: string;
  username: string;
  imageURL: string | null;
  preferences: string[];
  createdAt: Date | null;
}

export interface Book {
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
  ownerUsername?: string;
}

interface ProfileClientProps {
  initialProfile: UserProfile | null;
  initialBooks: Book[];
}

export default function ProfileClient({ initialProfile, initialBooks }: ProfileClientProps) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  // Loading states initialized to false because we have data
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [wantsRemoveImage, setWantsRemoveImage] = useState(false);

  // Book modal state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: initialProfile?.name || "",
    username: initialProfile?.username || "",
    preferences: initialProfile?.preferences || [],
  });

  const loadProfile = async (userId: string) => {
    setLoading(true);
    try {
      const result = await getUserProfile(userId);
      if (result.success && result.user) {
        setProfile(result.user as UserProfile);
        setFormData({
          name: result.user.name,
          username: result.user.username,
          preferences: result.user.preferences || [],
        });
      }
    } catch (err) {
      setToast({ message: "Error al cargar perfil", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Keep loadBooks for potential re-fetching, though typical app flow might just use server data
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

    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      setToast({
        message: "El archivo es demasiado grande. Tamaño máximo: 4MB.",
        type: "error",
      });
      return;
    }

    // No size limit check here - the cropper will compress it
    const dataUrl = await fileToDataUrl(file);
    setCropperSrc(dataUrl);
    setShowCropper(true);
  };

  const handleCropComplete = (blob: Blob, previewUrl: string) => {
    setImagePreview(previewUrl);
    setCroppedFile(blobToFile(blob, "profile-image"));
    setShowCropper(false);
    setCropperSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const imageFile = fileInputRef.current?.files?.[0];

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("username", formData.username);
      submitData.append("preferences", formData.preferences.join(","));

      // Use the cropped file instead of the raw file input
      if (croppedFile) {
        submitData.append("image", croppedFile);
      } else if (wantsRemoveImage) {
        submitData.append("removeImage", "true");
      } else if (imageFile) {
        submitData.append("image", imageFile);
      }

      const result = await updateUserProfile(submitData);
      if (result.success) {
        setToast({ message: "Perfil actualizado exitosamente", type: "success" });
        setIsEditing(false);
        setImagePreview(null);
        setCroppedFile(null);
        setWantsRemoveImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        await updateSession();

        if (session?.user?.id) {
          await loadProfile(session.user.id);
        }
      } else {
        setToast({ message: result.error || "Error al actualizar perfil", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error al actualizar perfil", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        username: profile.username,
        preferences: profile.preferences || [],
      });
    }
    setImagePreview(null);
    setCroppedFile(null);
    setWantsRemoveImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsEditing(false);
  };

  const togglePreference = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      preferences: prev.preferences.includes(genre)
        ? prev.preferences.filter((p) => p !== genre)
        : [...prev.preferences, genre],
    }));
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleUpdateBook = async (bookId: string, data: Partial<Book>) => {
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

      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId ? { ...book, ...data } : book
        )
      );

      if (selectedBook?.id === bookId) {
        setSelectedBook({ ...selectedBook, ...data });
      }

      setIsModalOpen(false);
    } else {
      setToast({ message: result.error || "Error al actualizar libro", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // We can assume session user id is same as profile id in this context
  const isOwner = true;

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
            {isOwner ? "Mi Perfil" : `Perfil de ${profile.username}`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isOwner ? "Administra tu información y preferencias" : "Información del usuario"}
          </p>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border-2 border-light-purple dark:border-dark-purple">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex flex-col items-center gap-4">
                  <div
                    onClick={() => isEditing && isOwner && fileInputRef.current?.click()}
                    className={`w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center relative ${isEditing && isOwner ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                      }`}
                  >
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <UserAvatar
                        imageURL={wantsRemoveImage ? null : profile.imageURL}
                        name={profile.name}
                        size="2xl"
                        className="w-full h-full"
                      />
                    )}
                    {isEditing && isOwner && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-semibold">Cambiar foto</span>
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
                  {isEditing && isOwner && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[160px]">
                        Click en la imagen para cambiar (JPG, PNG, WebP - max 4MB)
                      </p>
                      {(profile.imageURL || imagePreview) && !wantsRemoveImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setWantsRemoveImage(true);
                            setImagePreview(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={12} className="inline mr-0.5" /> Quitar foto de perfil
                        </button>
                      )}
                      {wantsRemoveImage && (
                        <button
                          type="button"
                          onClick={() => setWantsRemoveImage(false)}
                          className="text-xs text-light-purple hover:text-dark-purple dark:text-light-pink font-medium flex items-center gap-1 transition-colors"
                        >
                          <Undo2 size={12} className="inline mr-0.5" /> Restaurar foto
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                      />
                    ) : (
                      <p className="text-lg text-gray-800 dark:text-gray-100">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de usuario</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                      />
                    ) : (
                      <p className="text-lg text-gray-800 dark:text-gray-100">@{profile.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de alumno</label>
                    <p className="text-lg text-gray-800 dark:text-gray-100">{profile.studentCode}</p>
                  </div>

                  {isOwner && (
                    <div className="flex gap-3 pt-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                          >
                            {saving ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all"
                        >
                          Editar perfil
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border-2 border-light-purple dark:border-dark-purple">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Preferencias de lectura</h2>
                {isOwner && !isEditing && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">{formData.preferences.length} géneros</span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isOwner ? "Selecciona tus géneros favoritos" : "Géneros favoritos de este usuario"}
              </p>

              <div className="flex flex-wrap gap-2">
                {BOOK_GENRES.map((genre) => {
                  const isSelected = formData.preferences.includes(genre);
                  const canEdit = isOwner && isEditing;
                  return (
                    <button
                      key={genre}
                      onClick={() => canEdit && togglePreference(genre)}
                      disabled={!canEdit}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? "bg-light-purple text-white" : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300"
                        } ${canEdit ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>

              {isOwner && formData.preferences.length === 0 && (
                <p className="text-yellow-600 dark:text-yellow-400 mt-4 text-sm">
                  <AlertTriangle size={14} className="inline mr-1" /> Selecciona al menos un género para recibir recomendaciones personalizadas.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Published Books */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {isOwner ? "Mis libros publicados" : "Libros publicados"}
          </h2>

          {loadingBooks ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Cargando libros...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {isOwner ? "No has publicado ningún libro aún" : "Este usuario no ha publicado libros"}
              </p>
              {isOwner && (
                <button
                  onClick={() => router.push("/publish")}
                  className="mt-4 px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all"
                >
                  Publicar un libro
                </button>
              )}
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
          isOwner={selectedBook.ownerId === session?.user?.id}
          currentUserId={session?.user?.id}
          onUpdateBook={handleUpdateBook}
        />
      )}

      {/* Image Cropper Modal */}
      {showCropper && cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          aspectRatio={1}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          quality={0.85}
        />
      )}
    </>
  );
}
