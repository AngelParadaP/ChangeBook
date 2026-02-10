"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ProfileBookCard } from "@/components/profile/ProfileBookCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { getUserProfile } from "@/server/actions/user/getUserProfile";
import { updateUserProfile } from "@/server/actions/user/updateUserProfile";
import { getUserBooks } from "@/server/actions/user/getUserBooks";
import { updateBook } from "@/server/actions/books";
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
  ownerUsername?: string;
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Book modal state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    preferences: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      loadProfile(session.user.id);
      loadBooks(session.user.id);
    }
  }, [status, session]);

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
      } else {
        setToast({ message: result.error || "Error al cargar perfil", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error al cargar perfil", type: "error" });
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Validate file size
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      setToast({
        message: "El archivo es demasiado grande. Tamaño máximo: 4MB.",
        type: "error",
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get image file if selected
      const imageFile = fileInputRef.current?.files?.[0];
      
      // Create FormData
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("username", formData.username);
      submitData.append("preferences", formData.preferences.join(","));
      
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const result = await updateUserProfile(submitData);
      if (result.success) {
        setToast({ message: "Perfil actualizado exitosamente", type: "success" });
        setIsEditing(false);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Refresh the session to update navbar and other components
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
    // Cast status to the correct type
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

      // Update the book in the local state
      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId ? { ...book, ...data } : book
        )
      );

      // Update selected book
      if (selectedBook?.id === bookId) {
        setSelectedBook({ ...selectedBook, ...data });
      }

      setIsModalOpen(false);
    } else {
      setToast({ message: result.error || "Error al actualizar libro", type: "error" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  const isOwner = session.user?.id === profile.id;

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
                    className={`w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center relative ${
                      isEditing && isOwner ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                    }`}
                  >
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : profile.imageURL ? (
                      <Image src={profile.imageURL} alt={profile.name} fill className="object-cover" />
                    ) : (
                      <span className="text-6xl">👤</span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[160px]">
                      Click en la imagen para cambiar (JPG, PNG, WebP - max 4MB)
                    </p>
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
                  ⚠️ Selecciona al menos un género para recibir recomendaciones personalizadas.
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
              <div className="animate-spin text-4xl mb-2">📚</div>
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
    </>
  );
}
