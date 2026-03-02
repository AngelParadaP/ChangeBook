"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { searchBooks } from "@/server/actions/books/searchBooks";
import { searchUsers } from "@/server/actions/user/searchUsers";
import { searchCommunities } from "@/server/actions/communities/searchCommunities";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  NotificationItem,
} from "@/server/actions/notifications";
import { getFriendUsernameFromRequest } from "@/server/actions/friends/getFriendUsernameFromRequest";
import { Mailbox, CheckCircle2, XCircle, RefreshCw, Rocket, PartyPopper, Ban, BookOpen, User, Users, Bell, BellOff, Pin, Trash2, X, UserPlus, UserCheck, UserMinus } from "lucide-react";

interface BookResult {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  year: number | null;
  status: string | null;
}

/* ─── helper: ícono SVG via máscara CSS ─── */
function SvgIcon({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  studentCode: string;
  imageURL: string | null;
}

interface CommunityResult {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  memberCount: number;
}

// Helper component for safe image rendering
const ThumbnailImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const isInvalid = !src || src.includes("placeholder.example.com");

  if (isInvalid || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs bg-dim">
        <BookOpen size={14} className="text-hint" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
};

// Configuración de iconos y colores por tipo de notificación
const notificationConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  exchange_requested: { icon: <Mailbox size={14} />, color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" },
  exchange_accepted: { icon: <CheckCircle2 size={14} />, color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  exchange_rejected: { icon: <XCircle size={14} />, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
  exchange_auto_rejected: { icon: <RefreshCw size={14} />, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" },
  exchange_started: { icon: <Rocket size={14} />, color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  exchange_completed: { icon: <PartyPopper size={14} />, color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  exchange_cancelled: { icon: <Ban size={14} />, color: "bg-soft text-caption" },
  friend_request: { icon: <UserPlus size={14} />, color: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" },
  friend_accepted: { icon: <UserCheck size={14} />, color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
  friend_declined: { icon: <UserMinus size={14} />, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [communityResults, setCommunityResults] = useState<CommunityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { toggle } = useSidebar();
  const { data: session } = useSession();
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifButtonRef = useRef<HTMLButtonElement>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Cargar conteo de notificaciones no leídas
  const loadUnreadCount = useCallback(async () => {
    const result = await getUnreadNotificationCount();
    if (result.success && result.count !== undefined) {
      setUnreadCount(result.count);
    }
  }, []);

  // Polling para notificaciones no leídas
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Cargar lista de notificaciones al abrir el panel
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    const result = await getNotifications(20);
    if (result.success && result.notifications) {
      setNotificationsList(result.notifications);
    }
    setLoadingNotifications(false);
  };

  const handleToggleNotifications = async () => {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);
    setIsProfileMenuOpen(false);
    if (willOpen) {
      await loadNotifications();
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    await markNotificationAsRead(notifId);
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: 1 } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.isRead === 0) {
      await handleMarkAsRead(notif.id);
    }

    // Determinar a qué ruta navegar
    let targetPath = `/exchanges?tab=activos`;
    switch (notif.type) {
      case "exchange_requested":
        targetPath = `/exchanges?tab=recibidos`;
        break;
      case "exchange_rejected":
      case "exchange_auto_rejected":
      case "exchange_completed":
      case "exchange_cancelled":
        targetPath = `/exchanges?tab=historial`;
        break;
      case "exchange_accepted":
      case "exchange_started":
        targetPath = `/exchanges?tab=activos`;
        break;
      case "friend_request":
      case "friend_accepted":
      case "friend_declined":
        if (notif.friendRequestId) {
          const result = await getFriendUsernameFromRequest(notif.friendRequestId, notif.message);
          if (result.success && result.username) {
            targetPath = `/user/${result.username}`;
          } else {
            targetPath = `/notifications`;
          }
        } else {
          targetPath = `/notifications`;
        }
        break;
      default:
        targetPath = `/exchanges?tab=activos`;
    }

    router.push(targetPath);
    setIsNotificationsOpen(false);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string, wasUnread: boolean) => {
    e.stopPropagation();
    await deleteNotification(notifId);
    setNotificationsList((prev) => prev.filter((n) => n.id !== notifId));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    setNotificationsList([]);
    setUnreadCount(0);
  };

  // Debounced search – searches both books and users simultaneously
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowResults(true);

        const [booksResult, usersResult, communitiesResult] = await Promise.all([
          searchBooks(searchQuery, 4),
          searchUsers(searchQuery, 4),
          searchCommunities(searchQuery, 4),
        ]);

        if (booksResult.success && booksResult.books) {
          setBookResults(booksResult.books as BookResult[]);
        }
        if (usersResult.success && usersResult.users) {
          setUserResults(usersResult.users as UserResult[]);
        }
        if (communitiesResult.success && communitiesResult.communities) {
          setCommunityResults(communitiesResult.communities as CommunityResult[]);
        }

        setIsSearching(false);
      } else {
        setBookResults([]);
        setUserResults([]);
        setCommunityResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  /* ── Click fuera cierra menús ── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }

      if (
        notifRef.current &&
        notifButtonRef.current &&
        !notifRef.current.contains(event.target as Node) &&
        !notifButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  /* Nombre del usuario para el avatar */
  const userName = session?.user?.name || "Usuario";

  const hasBooks = bookResults.length > 0;
  const hasUsers = userResults.length > 0;
  const hasCommunities = communityResults.length > 0;
  const hasAnyResults = hasBooks || hasUsers || hasCommunities;

  return (
    <nav className="bg-card border border-card-border rounded-2xl shadow-sm relative z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* ── Izquierda: toggle + tema ── */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2.5 hover:bg-soft rounded-xl transition-all group"
              aria-label="Toggle sidebar"
            >
              <SvgIcon
                src="/icons/menu.svg"
                className="w-5 h-5 bg-caption group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
              />
            </button>
            <ThemeToggle inline />
          </div>

          {/* ── Centro: buscador ── */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <SvgIcon
                  src="/icons/search.svg"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-hint pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) setShowResults(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.length >= 2) setShowResults(true);
                  }}
                  placeholder="Buscar libros, usuarios, autores..."
                  className="w-full pl-10 pr-4 py-2.5 bg-subtle border border-card-border rounded-full focus:outline-none focus:ring-2 focus:ring-light-purple/40 dark:focus:ring-dark-pink/40 focus:bg-card transition-all text-sm text-heading font-medium"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-light-purple dark:border-dark-pink border-t-transparent rounded-full" />
                )}
              </div>
            </form>

            {/* Resultados de búsqueda */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden max-h-[450px] overflow-y-auto z-50">
                {hasAnyResults ? (
                  <>
                    {/* Book Results Section */}
                    {hasBooks && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-hint bg-subtle flex items-center gap-1.5">
                          <BookOpen size={14} /> LIBROS
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {bookResults.map((book) => (
                            <Link
                              key={book.id}
                              href={`/books/${book.id}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-subtle transition-colors"
                            >
                              <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden bg-dim">
                                {book.imageUrl ? (
                                  <Image
                                    src={book.imageUrl}
                                    alt={book.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <SvgIcon
                                      src="/icons/book-open.svg"
                                      className="w-5 h-5 bg-hint"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-heading truncate">
                                  {book.title}
                                </p>
                                <p className="text-xs text-hint truncate">
                                  {book.author} • {book.year || "N/A"}
                                </p>
                              </div>
                              {book.status === "intercambiado" && (
                                <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  Intercambiado
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Results Section */}
                    {hasUsers && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-hint bg-subtle flex items-center gap-1.5">
                          <User size={14} /> USUARIOS
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {userResults.map((user) => (
                            <Link
                              key={user.id}
                              href={`/user/${user.username}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-subtle transition-colors"
                            >
                              <UserAvatar
                                imageURL={user.imageURL}
                                name={user.name}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-heading truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-hint truncate">
                                  @{user.username}
                                </p>
                              </div>
                              <span className="text-[11px] bg-soft text-caption px-2 py-0.5 rounded-full whitespace-nowrap font-mono">
                                {user.studentCode}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Community Results Section */}
                    {hasCommunities && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-hint bg-subtle flex items-center gap-1.5">
                          <Users size={14} /> COMUNIDADES
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {communityResults.map((community) => (
                            <Link
                              key={community.id}
                              href={`/communities/${community.id}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-subtle transition-colors"
                            >
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex-shrink-0 relative">
                                {community.imageUrl ? (
                                  <Image
                                    src={community.imageUrl}
                                    alt={community.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">
                                    <Users size={16} className="text-purple-300 dark:text-purple-600" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-heading truncate">
                                  {community.name}
                                </p>
                                <p className="text-xs text-hint truncate">
                                  {community.memberCount} miembro{community.memberCount !== 1 ? "s" : ""}
                                  {community.description ? ` · ${community.description}` : ""}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Link to full search page */}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setShowResults(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-light-purple dark:text-dark-purple hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors border-t border-card-border"
                    >
                      Ver todos los resultados →
                    </Link>
                  </>
                ) : (
                  !isSearching && (
                    <div className="p-4 text-center text-hint text-sm">
                      No se encontraron resultados para &quot;{searchQuery}&quot;
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* ── Derecha: notificaciones + perfil ── */}
          <div className="flex items-center gap-2">
            {/* Botón notificaciones */}
            <div className="relative">
              <button
                ref={notifButtonRef}
                onClick={handleToggleNotifications}
                className="relative p-2.5 hover:bg-soft rounded-full transition-all group"
                aria-label="Notificaciones"
              >
                <SvgIcon
                  src="/icons/bell.svg"
                  className="w-5 h-5 bg-caption group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
                />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              {isNotificationsOpen && (
                <div
                  ref={notifRef}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {/* Header del panel */}
                  <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-caption" />
                      <h3 className="font-bold text-sm text-heading">
                        Notificaciones
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-medium text-light-purple dark:text-light-pink hover:underline"
                      >
                        Marcar todo como leído
                      </button>
                    )}
                  </div>

                  {/* Lista de notificaciones */}
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-light-purple dark:border-light-pink border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div className="py-10 text-center">
                        <BellOff size={28} className="text-hint mx-auto mb-2" />
                        <p className="text-sm text-hint">
                          No tienes notificaciones
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                        {notificationsList.map((notif) => {
                          const config = notificationConfig[notif.type] || {
                            icon: <Pin size={14} />,
                            color: "bg-soft text-caption",
                          };
                          return (
                            <div
                              key={notif.id}
                              className={`relative group w-full text-left px-4 py-3 hover:bg-subtle transition-colors flex items-start gap-3 cursor-pointer ${notif.isRead === 0
                                ? "bg-purple-50/50 dark:bg-purple-900/5"
                                : ""
                                }`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              {/* Icono */}
                              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${config.color}`}>
                                {config.icon}
                              </span>

                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${notif.isRead === 0
                                  ? "text-heading font-medium"
                                  : "text-caption"
                                  }`}>
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-hint mt-1">
                                  {formatTimeAgo(notif.createdAt)}
                                </p>
                              </div>

                              {/* Indicador no leído o botón eliminar */}
                              <div className="flex-shrink-0 flex items-center gap-1 mt-1">
                                {notif.isRead === 0 && (
                                  <span className="w-2 h-2 rounded-full bg-light-purple dark:bg-light-pink group-hover:hidden" />
                                )}
                                <button
                                  onClick={(e) => handleDeleteNotification(e, notif.id, notif.isRead === 0)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-hint hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all ${notif.isRead === 0 ? 'hidden group-hover:flex' : 'opacity-0 group-hover:opacity-100'}`}
                                  title="Eliminar notificación"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notificationsList.length > 0 && (
                    <div className="border-t border-card-border flex justify-between items-center">
                      <Link
                        href="/notifications"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="px-4 py-2.5 text-center text-xs font-medium text-light-purple dark:text-light-pink hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                      >
                        Ver todas
                      </Link>
                      <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2.5 text-xs font-medium text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <Trash2 size={12} className="inline mr-0.5" /> Borrar todas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menú de perfil */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full transition-all hover:ring-2 hover:ring-light-purple/30 dark:hover:ring-dark-pink/30"
                aria-label="Menú de usuario"
              >
                <UserAvatar
                  imageURL={session?.user?.image}
                  name={userName}
                  size="xs"
                />
              </button>

              {/* Dropdown */}
              {isProfileMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-60 bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div
                    className="px-4 py-3 border-b border-card-border"
                    style={{ background: "linear-gradient(135deg, rgba(38,101,140,0.08), rgba(84,172,191,0.08))" }}
                  >
                    <p className="font-semibold text-sm text-heading truncate">
                      {session?.user?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-hint truncate mt-0.5">
                      @{session?.user?.username || "username"}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-subtle transition-colors text-left group"
                    >
                      <SvgIcon
                        src="/icons/user.svg"
                        className="w-4 h-4 bg-hint group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors"
                      />
                      <span className="text-sm text-body font-medium">
                        Mi Perfil
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                    >
                      <SvgIcon
                        src="/icons/log-out.svg"
                        className="w-4 h-4 bg-red-400 group-hover:bg-red-500 transition-colors"
                      />
                      <span className="text-sm text-red-500 dark:text-red-400 font-medium">
                        Cerrar Sesión
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
