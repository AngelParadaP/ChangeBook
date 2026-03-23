"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
import {
  Loader2, Trash2, Undo2, UserCircle, Users, UserMinus,
  Search, X, BookOpen, Heart, Edit3, Check, Save, BookMarked,
  Calendar, Hash, ChevronDown, ChevronUp
} from "lucide-react";
import { getFriends, FriendProfile } from "@/server/actions/friends/getFriends";
import { removeFriend } from "@/server/actions/friends";
import { ProfileSkeleton } from "@/components/ui/skeletons";

export interface UserProfile {
  id: string;
  studentCode: string;
  name: string;
  username: string;
  imageURL: string | null;
  preferences: string[];
  createdAt: Date | null;
  strikes?: number;
  suspendedUntil?: Date | null;
  banned?: boolean;
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

type TabKey = "books" | "friends" | "preferences";

export default function ProfileClient({ initialProfile, initialBooks }: ProfileClientProps) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [books, setBooks] = useState<Book[]>(initialBooks);
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

  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isRemoveFriendModalOpen, setIsRemoveFriendModalOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<FriendProfile | null>(null);
  const [showAllFriends, setShowAllFriends] = useState(false);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");

  const [bookSearch, setBookSearch] = useState("");
  const [booksToShow, setBooksToShow] = useState(10);

  const [activeTab, setActiveTab] = useState<TabKey>("books");

  const [formData, setFormData] = useState({
    name: initialProfile?.name || "",
    username: initialProfile?.username || "",
    preferences: initialProfile?.preferences || [],
  });

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await getFriends();
      if (res.success && res.friends) {
        setFriends(res.friends);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFriends(false);
    }
  };

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
      setToast({ message: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.", type: "error" });
      return;
    }

    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({ message: "El archivo es demasiado grande. Tamaño máximo: 4MB.", type: "error" });
      return;
    }

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
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("username", formData.username);
      submitData.append("preferences", formData.preferences.join(","));

      if (croppedFile) {
        submitData.append("image", croppedFile);
      } else if (wantsRemoveImage) {
        submitData.append("removeImage", "true");
      }

      const result = await updateUserProfile(submitData);
      if (result.success) {
        setToast({ message: "Perfil actualizado exitosamente", type: "success" });
        setIsEditing(false);
        setImagePreview(null);
        setCroppedFile(null);
        setWantsRemoveImage(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await updateSession();
        if (session?.user?.id) await loadProfile(session.user.id);
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
      setFormData({ name: profile.name, username: profile.username, preferences: profile.preferences || [] });
    }
    setImagePreview(null);
    setCroppedFile(null);
    setWantsRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleRemoveFriend = async () => {
    if (!friendToRemove) return;
    setLoadingFriends(true);
    try {
      const res = await removeFriend(friendToRemove.friendshipId);
      if (res.success) {
        setToast({ message: "Amigo eliminado", type: "success" });
        setFriends((prev) => prev.filter((f) => f.friendshipId !== friendToRemove.friendshipId));
        setIsRemoveFriendModalOpen(false);
        setFriendToRemove(null);
      } else {
        setToast({ message: res.error || "Error al eliminar amigo", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error de servidor al eliminar amigo", type: "error" });
    } finally {
      setLoadingFriends(false);
    }
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
      setBooks((prev) => prev.map((book) => (book.id === bookId ? { ...book, ...data } : book)));
      if (selectedBook?.id === bookId) setSelectedBook({ ...selectedBook, ...data });
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

  if (loading) return <ProfileSkeleton />;
  if (!profile) return null;

  const isOwner = true;

  const filteredGenres = BOOK_GENRES.filter((genre) =>
    genre.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "books", label: "Libros", icon: <BookMarked size={16} />, count: books.length },
    { key: "friends", label: "Amigos", icon: <Users size={16} />, count: friends.length },
    { key: "preferences", label: "Preferencias", icon: <Heart size={16} />, count: formData.preferences.length },
  ];

  const filteredBooks = books.filter((book) => {
    const s = bookSearch.toLowerCase();
    return (
      book.title.toLowerCase().includes(s) ||
      book.author.toLowerCase().includes(s) ||
      book.genres.some((g) => g.toLowerCase().includes(s))
    );
  });

  const visibleBooks = filteredBooks.slice(0, booksToShow);
  const hasMoreBooks = filteredBooks.length > booksToShow;

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Page wrapper */}
      <div className="h-full overflow-y-auto custom-scrollbar pb-8">

        {/* ── Profile Card ───────────────────────────────────── */}
        <div className="bg-card rounded-2xl shadow-md overflow-hidden">

          {/* Banner */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-r from-primary-dark via-primary to-primary-muted">
            {/* subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Avatar + actions row */}
          <div className="px-4 sm:px-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">

              {/* Avatar + name — centered on mobile, left-aligned on sm+ */}
              <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-16">
                <div
                  onClick={() => isEditing && fileInputRef.current?.click()}
                  className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-card bg-gradient-to-br from-primary-light/80 to-primary-muted dark:from-primary-dark dark:to-primary flex-shrink-0 shadow-xl ${isEditing ? "cursor-pointer" : ""}`}
                >
                  <div className="relative w-full h-full rounded-full overflow-hidden">
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
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Edit3 size={20} className="text-white" />
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

                {/* Name + username stacked — centered on mobile */}
                <div className="text-center sm:text-left sm:pb-2">
                  {isEditing ? (
                    <div className="space-y-1 flex flex-col items-center sm:items-start">
                      <p className="text-xs text-hint">{profile.name}</p>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.includes(" ")) {
                            setToast({ message: "El nombre de usuario no puede contener espacios", type: "error" });
                          } else {
                            setFormData({ ...formData, username: val });
                          }
                        }}
                        className="px-3 py-1.5 bg-soft border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-heading text-sm w-40 sm:w-52"
                        placeholder="Nombre de usuario"
                      />
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-heading leading-tight">{profile.name}</h1>
                      <p className="text-sm text-hint">@{profile.username}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons — hidden on mobile in the top row, shown below avatar on mobile */}
              <div className="hidden sm:flex items-center gap-2 sm:pb-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 bg-soft hover:bg-dim text-body font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5"
                    >
                      <X size={15} />
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5"
                  >
                    <Edit3 size={15} />
                    Editar perfil
                  </button>
                )}
              </div>
            </div>

            {/* Mobile-only action buttons (below avatar, centered) */}
            <div className="sm:hidden flex justify-center gap-2 mt-1">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-soft hover:bg-dim text-body font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5"
                >
                  <Edit3 size={15} />
                  Editar perfil
                </button>
              )}
            </div>

            {/* Avatar image controls when editing */}
            {isEditing && (
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <p className="text-xs text-hint">
                  Toca la foto para cambiarla (JPG, PNG, WebP · máx 4 MB)
                </p>
                {(profile.imageURL || imagePreview) && !wantsRemoveImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setWantsRemoveImage(true);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-danger hover:text-danger/80 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={12} /> Quitar foto
                  </button>
                )}
                {wantsRemoveImage && (
                  <button
                    type="button"
                    onClick={() => setWantsRemoveImage(false)}
                    className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors"
                  >
                    <Undo2 size={12} /> Restaurar foto
                  </button>
                )}
              </div>
            )}

            {/* Info chips — centered on mobile, left on sm+ */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs text-caption bg-subtle border border-card-border rounded-full px-3 py-1">
                <Hash size={12} className="text-hint" />
                {profile.studentCode}
              </span>
              {profile.createdAt && (
                <span className="inline-flex items-center gap-1.5 text-xs text-caption bg-subtle border border-card-border rounded-full px-3 py-1">
                  <Calendar size={12} className="text-hint" />
                  Desde {new Date(profile.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long" })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-caption bg-subtle border border-card-border rounded-full px-3 py-1">
                <BookOpen size={12} className="text-hint" />
                {books.length} {books.length === 1 ? "libro" : "libros"}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-caption bg-subtle border border-card-border rounded-full px-3 py-1">
                <Users size={12} className="text-hint" />
                {friends.length} {friends.length === 1 ? "amigo" : "amigos"}
              </span>
              {(profile.strikes && profile.strikes > 0) ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 ml-auto">
                  ⚠ {profile.strikes} {profile.strikes === 1 ? "Strike" : "Strikes"}
                </span>
              ) : null}
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="border-t border-card-border px-4 sm:px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === tab.key
                      ? "border-primary text-primary dark:text-primary-light"
                      : "border-transparent text-hint hover:text-body"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        activeTab === tab.key
                          ? "bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light"
                          : "bg-soft text-hint"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Content ─────────────────────────────────────── */}
        <div className="mt-4">

          {/* ── BOOKS TAB ── */}
          {activeTab === "books" && (
            <div className="bg-card rounded-2xl shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                  <BookMarked size={18} className="text-primary" />
                  Mis libros publicados
                </h2>
                <button
                  onClick={() => router.push("/publish")}
                  className="text-xs px-3 py-1.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all"
                >
                  + Publicar
                </button>
              </div>

              {/* Search */}
              {books.length > 0 && (
                <div className="relative mb-5">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => { setBookSearch(e.target.value); setBooksToShow(10); }}
                    placeholder="Buscar por título, autor o género..."
                    className="w-full pl-9 pr-9 py-2.5 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-heading text-sm transition-all"
                  />
                  {bookSearch && (
                    <button
                      onClick={() => { setBookSearch(""); setBooksToShow(10); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {loadingBooks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen size={48} className="text-dim mb-3" />
                  <p className="text-body font-medium mb-1">Aún no has publicado libros</p>
                  <p className="text-hint text-sm mb-4">Comparte tus libros con la comunidad</p>
                  <button
                    onClick={() => router.push("/publish")}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all text-sm"
                  >
                    Publicar mi primer libro
                  </button>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-hint">No se encontraron libros con esa búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleBooks.map((book) => (
                    <div key={book.id} onClick={() => handleBookClick(book)} className="cursor-pointer hover:scale-[1.01] transition-transform">
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
                  {hasMoreBooks && (
                    <div className="pt-2 text-center">
                      <button
                        onClick={() => setBooksToShow((prev) => prev + 10)}
                        className="px-5 py-2 bg-soft hover:bg-dim text-body font-semibold rounded-xl transition-all text-sm"
                      >
                        Cargar 10 más
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FRIENDS TAB ── */}
          {activeTab === "friends" && (
            <div className="bg-card rounded-2xl shadow-md p-4 sm:p-6">
              <h2 className="text-lg font-bold text-heading flex items-center gap-2 mb-4">
                <Users size={18} className="text-primary" />
                Mis amigos
                <span className="text-sm font-normal text-hint ml-1">({friends.length})</span>
              </h2>

              {loadingFriends ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users size={48} className="text-dim mb-3" />
                  <p className="text-body font-medium mb-1">Aún no tienes amigos</p>
                  <p className="text-hint text-sm">Explora perfiles y añade amigos para intercambiar libros</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.slice(0, showAllFriends ? friends.length : 6).map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => router.push(`/user/${friend.username}`)}
                      className="flex items-center justify-between p-3 bg-subtle border border-card-border rounded-xl hover:bg-card hover:border-primary/40 dark:hover:border-primary-dark/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar imageURL={friend.imageURL} name={friend.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-body font-semibold leading-tight group-hover:text-primary transition-colors truncate">{friend.name}</p>
                          <p className="text-xs text-hint truncate">@{friend.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFriendToRemove(friend);
                          setIsRemoveFriendModalOpen(true);
                        }}
                        className="p-2 text-hint hover:text-danger hover:bg-danger/10 rounded-full transition-colors flex-shrink-0"
                        title="Eliminar amigo"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {friends.length > 6 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllFriends(!showAllFriends)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark dark:text-primary-light transition-all"
                  >
                    {showAllFriends ? (
                      <><ChevronUp size={16} /> Mostrar menos</>
                    ) : (
                      <><ChevronDown size={16} /> Ver todos ({friends.length})</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PREFERENCES TAB ── */}
          {activeTab === "preferences" && (
            <div className="bg-card rounded-2xl shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                  <Heart size={18} className="text-primary" />
                  Preferencias de lectura
                </h2>
                <span className="text-xs text-hint bg-subtle border border-card-border px-2.5 py-1 rounded-full">
                  {formData.preferences.length} géneros
                </span>
              </div>
              <p className="text-caption text-sm mb-5">
                {isEditing
                  ? "Selecciona tus géneros literarios favoritos"
                  : "Géneros literarios que más te gustan"}
              </p>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Search genres */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-hint" />
                    <input
                      type="text"
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      placeholder="Buscar género..."
                      className="w-full pl-9 pr-8 py-2.5 bg-soft border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-heading text-sm"
                    />
                    {genreSearch && (
                      <button
                        type="button"
                        onClick={() => setGenreSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-hint hover:text-caption"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Selected tags */}
                  {formData.preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formData.preferences.map((genre) => (
                        <button
                          key={`sel-${genre}`}
                          type="button"
                          onClick={() => togglePreference(genre)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary-dark transition-all group cursor-pointer"
                        >
                          {genre}
                          <X size={11} className="opacity-70 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* All genres scrollable */}
                  <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto custom-scrollbar p-3 bg-subtle rounded-xl border border-card-border/50">
                    {filteredGenres.length === 0 ? (
                      <p className="text-sm text-hint py-4 w-full text-center">No se encontraron géneros</p>
                    ) : (
                      filteredGenres.map((genre) => {
                        const isSelected = formData.preferences.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => togglePreference(genre)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${
                              isSelected
                                ? "bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light border-primary/30 dark:border-primary-dark/30 ring-1 ring-primary/20 shadow-sm"
                                : "bg-soft text-caption border-card-border hover:border-primary/40 dark:hover:border-primary-dark/40 hover:text-primary dark:hover:text-primary-light"
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {genre}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {formData.preferences.length === 0 && (
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs font-medium flex gap-1.5 items-center">
                      <span>⚠️</span> Selecciona al menos un género para recibir recomendaciones personalizadas.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {formData.preferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.preferences.map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-light ring-1 ring-primary/20 shadow-sm"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Heart size={48} className="text-dim mb-3" />
                      <p className="text-body font-medium mb-1">Sin preferencias seleccionadas</p>
                      <p className="text-hint text-sm mb-4">Añade géneros para personalizar tus recomendaciones</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all"
                      >
                        Seleccionar géneros
                      </button>
                    </div>
                  )}
                </div>
              )}
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

      {/* Remove Friend Confirmation Modal */}
      {isRemoveFriendModalOpen && friendToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 border border-card-border relative">
            <button
              onClick={() => { setIsRemoveFriendModalOpen(false); setFriendToRemove(null); }}
              className="absolute top-4 right-4 text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <UserMinus size={22} className="text-danger" />
              </div>
              <h2 className="text-xl font-bold text-heading">Eliminar amigo</h2>
              <p className="text-body text-sm">
                ¿Estás seguro de que deseas eliminar a <b>{friendToRemove.name}</b> de tu lista de amigos?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsRemoveFriendModalOpen(false); setFriendToRemove(null); }}
                disabled={loadingFriends}
                className="flex-1 bg-soft hover:bg-dim text-body font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveFriend}
                disabled={loadingFriends}
                className="flex-1 bg-danger text-white hover:bg-danger-dark font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loadingFriends ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
