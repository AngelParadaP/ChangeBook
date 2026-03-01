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
import { Search, X } from "lucide-react";

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
  const [genreSearch, setGenreSearch] = useState("");

  // Book search & pagination
  const [bookSearch, setBookSearch] = useState("");
  const [booksToShow, setBooksToShow] = useState(10);

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

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((book) => book.id !== bookId));
    setToast({ message: "Libro eliminado exitosamente", type: "success" });
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-primary dark:text-primary-light mx-auto mb-4" />
          <p className="text-caption text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // We can assume session user id is same as profile id in this context
  const isOwner = true;

  const filteredGenres = BOOK_GENRES.filter((genre) =>
    genre.toLowerCase().includes(genreSearch.toLowerCase())
  );

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
            {isOwner ? "Mi Perfil" : `Perfil de ${profile.username}`}
          </h1>
          <p className="text-caption mb-6">
            {isOwner ? "Administra tu información y preferencias" : "Información del usuario"}
          </p>

          <div className="space-y-6">
            <div className="bg-subtle rounded-2xl p-6 border-2 border-primary/30 dark:border-primary-dark/50 shadow-inner">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex flex-col items-center gap-4">
                  <div
                    onClick={() => isEditing && isOwner && fileInputRef.current?.click()}
                    className={`w-44 h-44 rounded-full p-[6px] bg-gradient-to-br from-primary-light/80 to-primary-muted dark:from-primary-dark dark:to-primary flex items-center justify-center relative shadow-xl shadow-primary/20 ${isEditing && isOwner ? "cursor-pointer hover:scale-105 transition-transform" : ""
                      }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
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
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-semibold">Cambiar foto</span>
                        </div>
                      )}
                    </div>
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
                      <p className="text-xs text-hint text-center max-w-[160px]">
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
                          className="text-xs text-primary hover:text-primary-dark dark:text-primary-light font-medium flex items-center gap-1 transition-colors"
                        >
                          <Undo2 size={12} className="inline mr-0.5" /> Restaurar foto
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-body mb-2">Nombre</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-heading"
                      />
                    ) : (
                      <p className="text-lg text-heading">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-body mb-2">Nombre de usuario</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-4 py-3 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-heading"
                      />
                    ) : (
                      <p className="text-lg text-heading">@{profile.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-body mb-2">Código de alumno</label>
                    <p className="text-lg text-heading">{profile.studentCode}</p>
                  </div>

                  {isOwner && (
                    <div className="flex gap-3 pt-4">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                          >
                            {saving ? "Guardando..." : "Guardar cambios"}
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="px-6 py-3 bg-dim text-heading font-semibold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all"
                        >
                          Editar perfil
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="my-8 border-card-border" />

              <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-heading">Preferencias de lectura</h2>
                {isOwner && !isEditing && (
                  <span className="text-sm text-hint">{formData.preferences.length} géneros</span>
                )}
              </div>
              <p className="text-caption mb-6">
                {isOwner ? "Selecciona tus géneros favoritos" : "Géneros favoritos de este usuario"}
              </p>

              {isOwner && isEditing ? (
                <div className="space-y-4">
                  {/* Genre search */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hint">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      placeholder="Buscar género..."
                      className="w-full pl-10 pr-8 py-3 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark text-heading text-sm"
                    />
                    {genreSearch && (
                      <button
                        type="button"
                        onClick={() => setGenreSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Selected genres visualization */}
                  {formData.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.preferences.map((genre) => (
                        <button
                          key={`selected-${genre}`}
                          type="button"
                          onClick={() => togglePreference(genre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group cursor-pointer"
                        >
                          {genre}
                          <X size={12} className="opacity-70 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Available genres scrollable grid */}
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 bg-card/50 rounded-xl border border-card-border/50">
                    {filteredGenres.length === 0 ? (
                      <p className="text-sm text-hint py-4 w-full text-center">
                        No se encontraron géneros
                      </p>
                    ) : (
                      filteredGenres.map((genre) => {
                        const isSelected = formData.preferences.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => togglePreference(genre)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${isSelected
                              ? "bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light border-primary/30 dark:border-primary-dark/30 ring-1 ring-primary/20 shadow-sm"
                              : "bg-soft text-caption border-card-border hover:border-primary/40 dark:hover:border-primary-dark/40 hover:bg-primary hover:bg-opacity-10 hover:text-primary dark:hover:text-primary-light"
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
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.preferences.length > 0 ? (
                    formData.preferences.map((genre) => (
                      <span
                        key={genre}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light ring-1 ring-primary/20 shadow-sm"
                      >
                        {genre}
                      </span>
                    ))
                  ) : (
                    <p className="text-hint text-sm italic">
                      No hay preferencias seleccionadas.
                    </p>
                  )}
                </div>
              )}

              {isOwner && formData.preferences.length === 0 && (
                <p className="text-yellow-600 dark:text-yellow-400 mt-6 text-sm font-medium flex gap-2">
                  <span>⚠️</span> Selecciona al menos un género para recibir recomendaciones personalizadas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Right Column - Published Books */}
        <div className="bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-y-auto custom-scrollbar flex flex-col">
          <h2 className="text-2xl font-bold text-heading mb-4">
            {isOwner ? "Mis libros publicados" : "Libros publicados"}
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
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-primary dark:text-primary-light mx-auto mb-2" />
              <p className="text-hint">Cargando libros...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-hint text-lg">
                {isOwner ? "No has publicado ningún libro aún" : "Este usuario no ha publicado libros"}
              </p>
              {isOwner && (
                <button
                  onClick={() => router.push("/publish")}
                  className="mt-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all"
                >
                  Publicar un libro
                </button>
              )}
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
          isOwner={selectedBook.ownerId === session?.user?.id}
          currentUserId={session?.user?.id}
          onUpdateBook={handleUpdateBook}
          onDeleteBook={handleDeleteBook}
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
