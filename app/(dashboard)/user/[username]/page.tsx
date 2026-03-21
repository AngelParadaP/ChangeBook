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
import {
  getFriendStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "@/server/actions/friends";
import {
  Search, X, MessageSquare, UserPlus, UserCheck, Clock,
  UserMinus, Check, XCircle, BookMarked, Heart, Users,
  BookOpen, Calendar, Hash, ChevronDown, ChevronUp, Flag, AlertTriangle
} from "lucide-react";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { reportUserAction } from "@/server/actions/user/reportUserAction";
import { UploadButton } from "@/lib/uploadthing";

interface UserProfile {
  id: string;
  studentCode: string;
  name: string;
  username: string;
  imageURL: string | null;
  preferences: string[];
  createdAt: Date | null;
  banned?: boolean;
  suspendedUntil?: Date | null;
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

type TabKey = "books" | "preferences";

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

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [friendStatus, setFriendStatus] = useState<string>("none");
  const [friendRequestId, setFriendRequestId] = useState<string | null>(null);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [isRemoveFriendModalOpen, setIsRemoveFriendModalOpen] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  const [bookSearch, setBookSearch] = useState("");
  const [booksToShow, setBooksToShow] = useState(10);

  const [activeTab, setActiveTab] = useState<TabKey>("books");

  useEffect(() => {
    if (username) loadProfile(username);
  }, [username]);

  useEffect(() => {
    if (profile?.id) loadBooks(profile.id);
  }, [profile]);

  const isOwner = session?.user?.id === profile?.id;

  useEffect(() => {
    if (isOwner) router.push("/profile");
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
        router.push(`/chat/${result.roomId}`);
      } else {
        setToast({ message: result.error || "Error al crear chat", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Error al iniciar chat", type: "error" });
    } finally {
      setStartingChat(false);
    }
  };

  const handleReportUser = async () => {
    if (!profile?.id) return;
    if (reportReason.trim().length === 0) {
      setToast({ message: "Por favor escribe un motivo claro.", type: "error" });
      return;
    }
    setSubmittingReport(true);
    try {
      const result = await reportUserAction(profile.id, reportReason, reportImageUrl);
      if (result.success) {
        setToast({ message: result.message || "Reporte emitido.", type: "success" });
        setIsReportModalOpen(false);
        setReportReason("");
        setReportImageUrl(null);
      } else {
        setToast({ message: result.error || "Algo salió mal.", type: "error" });
      }
    } catch {
      setToast({ message: "Ocurrió un error.", type: "error" });
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile || isOwner) return null;

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

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "books", label: "Libros", icon: <BookMarked size={16} />, count: books.length },
    { key: "preferences", label: "Preferencias", icon: <Heart size={16} />, count: profile.preferences.length },
  ];

  const isSuspended = profile.suspendedUntil && new Date(profile.suspendedUntil) > new Date();
  const isBanned = profile.banned;

  if (isBanned) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <XCircle size={64} className="text-danger mb-4 mx-auto" />
        <h1 className="text-2xl font-bold text-heading mb-2">Cuenta Baneada Permanentemente</h1>
        <p className="text-body text-sm max-w-md mx-auto bg-subtle border border-card-border p-4 rounded-xl">
          El usuario <strong>@{profile.username}</strong> ha infringido las reglas de la comunidad y su cuenta fue deshabilitada indefinidamente. Sus libros y perfil ya no están disponibles.
        </p>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="h-full overflow-y-auto custom-scrollbar pb-8">

        {/* ── Profile Card ───────────────────────────────────── */}
        <div className="bg-card rounded-2xl shadow-md overflow-hidden">

          {/* Banner */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-r from-primary-dark via-primary to-primary-muted">
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
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-card bg-gradient-to-br from-primary-light/80 to-primary-muted dark:from-primary-dark dark:to-primary flex-shrink-0 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <UserAvatar
                      imageURL={profile.imageURL}
                      name={profile.name}
                      size="2xl"
                      className="w-full h-full"
                    />
                  </div>
                  {/* Friend badge */}
                  {friendStatus === "friends" && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-success rounded-full flex items-center justify-center ring-2 ring-card shadow">
                      <UserCheck size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Name + username — centered on mobile */}
                <div className="text-center sm:text-left sm:pb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-heading leading-tight">{profile.name}</h1>
                  <p className="text-sm text-hint">@{profile.username}</p>
                </div>
              </div>

              {isSuspended ? (
                <div className="mt-4 sm:mt-0 w-full sm:w-auto bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-xl text-xs font-bold text-center">
                  ⚠ Cuenta suspendida temporalmente
                </div>
              ) : (
                <>
                  {/* Action buttons — desktop only in this position */}
                  <div className="hidden sm:flex flex-wrap items-center gap-2 sm:pb-2">
                    {/* Friend button */}
                    {friendStatus === "none" && (
                      <button
                        onClick={handleSendFriendRequest}
                        disabled={loadingFriend}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
                      >
                        {loadingFriend ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                        {loadingFriend ? "Enviando..." : "Añadir amigo"}
                      </button>
                    )}
                    {friendStatus === "request_sent" && (
                      <span className="flex items-center gap-1.5 px-4 py-2 bg-hint/10 text-hint font-semibold rounded-xl text-sm cursor-not-allowed border border-hint/20">
                        <Clock size={15} />
                        Solicitud enviada
                      </span>
                    )}
                    {friendStatus === "request_received" && (
                      <button
                        onClick={() => setIsFriendModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-success/20 text-success hover:bg-success/30 font-semibold rounded-xl text-sm transition-all"
                      >
                        <UserCheck size={15} />
                        Responder solicitud
                      </button>
                    )}
                    {friendStatus === "friends" && (
                      <button
                        onClick={() => setIsRemoveFriendModalOpen(true)}
                        disabled={loadingFriend}
                        className="flex items-center gap-1.5 px-4 py-2 bg-soft hover:bg-danger/10 hover:text-danger text-body font-semibold rounded-xl text-sm transition-all border border-card-border hover:border-danger/30 disabled:opacity-60"
                      >
                        <UserMinus size={15} />
                        Amigos
                      </button>
                    )}

                    {/* Chat button */}
                    <button
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="flex items-center gap-1.5 px-4 py-2 font-semibold rounded-xl text-sm transition-all bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-md shadow-primary/20"
                      title="Enviar un mensaje"
                    >
                      {startingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
                      {startingChat ? "Abriendo..." : "Mensaje"}
                    </button>
                    
                    {/* Report button */}
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="flex items-center justify-center p-2 text-hint hover:text-danger hover:bg-danger/10 rounded-xl transition-all border border-transparent hover:border-danger/30 ml-2"
                      title="Reportar usuario"
                    >
                      <Flag size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile-only action buttons — centered below avatar */}
            {!isSuspended && (
              <div className="sm:hidden flex flex-wrap justify-center gap-2 mt-1">
                {friendStatus === "none" && (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={loadingFriend}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-60"
                  >
                    {loadingFriend ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    {loadingFriend ? "Enviando..." : "Añadir amigo"}
                  </button>
                )}
                {friendStatus === "request_sent" && (
                  <span className="flex items-center gap-1.5 px-4 py-2 bg-hint/10 text-hint font-semibold rounded-xl text-sm cursor-not-allowed border border-hint/20">
                    <Clock size={15} />
                    Solicitud enviada
                  </span>
                )}
                {friendStatus === "request_received" && (
                  <button
                    onClick={() => setIsFriendModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-success/20 text-success hover:bg-success/30 font-semibold rounded-xl text-sm transition-all"
                  >
                    <UserCheck size={15} />
                    Responder solicitud
                  </button>
                )}
                {friendStatus === "friends" && (
                  <button
                    onClick={() => setIsRemoveFriendModalOpen(true)}
                    disabled={loadingFriend}
                    className="flex items-center gap-1.5 px-4 py-2 bg-soft hover:bg-danger/10 hover:text-danger text-body font-semibold rounded-xl text-sm transition-all border border-card-border hover:border-danger/30 disabled:opacity-60"
                  >
                    <UserMinus size={15} />
                    Amigos
                  </button>
                )}
                <button
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="flex items-center gap-1.5 px-4 py-2 font-semibold rounded-xl text-sm transition-all bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90 shadow-md shadow-primary/20"
                  title="Enviar un mensaje"
                >
                  {startingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
                    {startingChat ? "Abriendo..." : "Mensaje"}
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="flex items-center justify-center p-2 text-hint hover:text-danger hover:bg-danger/10 rounded-xl transition-all border border-transparent hover:border-danger/30"
                  title="Reportar usuario"
                >
                  <Flag size={20} />
                </button>
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
              <h2 className="text-lg font-bold text-heading flex items-center gap-2 mb-4">
                <BookMarked size={18} className="text-primary" />
                Libros publicados
              </h2>

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
                  <p className="text-body font-medium mb-1">Este usuario no ha publicado libros</p>
                  <p className="text-hint text-sm">Aún no hay libros disponibles en este perfil</p>
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

          {/* ── PREFERENCES TAB ── */}
          {activeTab === "preferences" && (
            <div className="bg-card rounded-2xl shadow-md p-4 sm:p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-heading flex items-center gap-2">
                  <Heart size={18} className="text-primary" />
                  Preferencias de lectura
                </h2>
                <span className="text-xs text-hint bg-subtle border border-card-border px-2.5 py-1 rounded-full">
                  {profile.preferences.length} géneros
                </span>
              </div>
              <p className="text-caption text-sm mb-5">Géneros literarios favoritos de este usuario</p>

              {profile.preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.preferences.map((genre) => (
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
                  <p className="text-body font-medium mb-1">Sin preferencias</p>
                  <p className="text-hint text-sm">Este usuario aún no ha seleccionado géneros favoritos</p>
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
          isOwner={false}
          currentUserId={session?.user?.id}
        />
      )}

      {/* Accept/Decline Friend Request Modal */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 border border-card-border relative">
            <button
              onClick={() => setIsFriendModalOpen(false)}
              className="absolute top-4 right-4 text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck size={22} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-heading">Solicitud de amistad</h2>
              <p className="text-body text-sm">
                <b>{profile.name}</b> te ha enviado una solicitud de amistad. ¿Deseas aceptarla?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeclineFriendRequest}
                disabled={loadingFriend}
                className="flex-1 bg-soft hover:bg-danger/10 hover:text-danger text-body font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <XCircle size={16} />
                Rechazar
              </button>
              <button
                onClick={handleAcceptFriendRequest}
                disabled={loadingFriend}
                className="flex-1 bg-primary text-white hover:bg-primary-dark font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loadingFriend ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {isRemoveFriendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 border border-card-border relative">
            <button
              onClick={() => setIsRemoveFriendModalOpen(false)}
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
                ¿Estás seguro de que deseas eliminar a <b>{profile.name}</b> de tu lista de amigos?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsRemoveFriendModalOpen(false)}
                disabled={loadingFriend}
                className="flex-1 bg-soft hover:bg-dim text-body font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveFriend}
                disabled={loadingFriend}
                className="flex-1 bg-danger text-white hover:bg-danger-dark font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {loadingFriend ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl p-6 border border-card-border relative">
            <button
              onClick={() => {
                setIsReportModalOpen(false);
                setReportReason("");
                setReportImageUrl(null);
              }}
              className="absolute top-4 right-4 text-hint hover:text-danger transition-colors bg-subtle hover:bg-card-border rounded-full p-1"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col text-center gap-3 mb-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center">
                <AlertTriangle size={22} className="text-danger" />
              </div>
              <h2 className="text-xl font-bold text-heading">Reportar usuario</h2>
              <p className="text-body text-sm font-normal text-left">
                Ayúdanos a mantener Kyboo como un lugar seguro. Tu reporte será enviado directamente a la administración.
              </p>
            </div>
            
            <textarea
              className="w-full bg-subtle border border-card-border focus:border-danger focus:ring-1 focus:ring-danger rounded-xl p-3 text-sm text-heading mb-4 outline-none resize-none"
              rows={3}
              placeholder="Ej: Este usuario tiene libros falsos, spam, acoso, etc..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              disabled={submittingReport}
            ></textarea>

            {reportImageUrl ? (
              <div className="relative w-full h-32 bg-subtle rounded-xl flex items-center justify-center overflow-hidden border border-card-border mb-5">
                <Image src={reportImageUrl} alt="Evidencia" fill className="object-cover" />
                <button 
                  onClick={() => setReportImageUrl(null)} 
                  className="absolute top-2 right-2 bg-danger/90 hover:bg-danger text-white rounded-full p-1 shadow transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-xs text-hint mb-2">Adjuntar evidencia (Opcional):</p>
                <UploadButton
                  endpoint="imageUploader"
                  onUploadBegin={() => setIsUploadingImage(true)}
                  onClientUploadComplete={(res) => {
                    if (res?.[0]) setReportImageUrl(res[0].url);
                    setIsUploadingImage(false);
                    setToast({ message: "Evidencia subida", type: "success" });
                  }}
                  onUploadError={(error: Error) => {
                    setIsUploadingImage(false);
                    setToast({ message: "Error al subir imagen", type: "error" });
                  }}
                  appearance={{
                    button: "bg-subtle hover:bg-card-border !text-body text-xs font-semibold rounded-xl w-full flex items-center justify-center p-3 border border-card-border transition-colors",
                    allowedContent: "hidden"
                  }}
                  content={{ button: "📸 Subir captura/foto" }}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  setReportReason("");
                  setReportImageUrl(null);
                }}
                disabled={submittingReport || isUploadingImage}
                className="flex-1 bg-soft hover:bg-dim text-body font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleReportUser}
                disabled={submittingReport || isUploadingImage}
                className="flex-1 bg-danger text-white hover:bg-danger-dark font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {submittingReport ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
                Enviar Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
