"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { searchBooks } from "@/server/actions/books/searchBooks";
import { searchUsers } from "@/server/actions/user/searchUsers";

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

// Helper component for safe image rendering
const ThumbnailImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);
  const isInvalid = !src || src.includes("placeholder.example.com");

  if (isInvalid || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs bg-gray-200 dark:bg-zinc-700">
        📚
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

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [notifications] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const { toggle } = useSidebar();
  const { data: session } = useSession();
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  // Debounced search – searches both books and users simultaneously
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowResults(true);

        const [booksResult, usersResult] = await Promise.all([
          searchBooks(searchQuery, 4),
          searchUsers(searchQuery, 4),
        ]);

        if (booksResult.success && booksResult.books) {
          setBookResults(booksResult.books as BookResult[]);
        }
        if (usersResult.success && usersResult.users) {
          setUserResults(usersResult.users as UserResult[]);
        }

        setIsSearching(false);
      } else {
        setBookResults([]);
        setUserResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  /* ── Click fuera cierra menús (lógica original intacta) ── */
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

  /* Iniciales del usuario para el avatar */
  const initials = session?.user?.name
    ? session.user.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
    : "?";

  const hasBooks = bookResults.length > 0;
  const hasUsers = userResults.length > 0;
  const hasAnyResults = hasBooks || hasUsers;

  return (
    <nav className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm relative z-40">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* ── Izquierda: toggle + tema ── */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all group"
              aria-label="Toggle sidebar"
            >
              <SvgIcon
                src="/icons/menu.svg"
                className="w-5 h-5 bg-gray-500 dark:bg-gray-400 group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
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
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-400 dark:bg-gray-500 pointer-events-none"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-2 focus:ring-light-purple/40 dark:focus:ring-dark-pink/40 focus:bg-white dark:focus:bg-zinc-900 transition-all text-sm text-gray-800 dark:text-gray-200 font-medium"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-light-purple dark:border-dark-pink border-t-transparent rounded-full" />
                )}
              </div>
            </form>

            {/* Resultados de búsqueda */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden max-h-[450px] overflow-y-auto z-50">
                {hasAnyResults ? (
                  <>
                    {/* Book Results Section */}
                    {hasBooks && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 flex items-center gap-1.5">
                          <span>📚</span> LIBROS
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {bookResults.map((book) => (
                            <Link
                              key={book.id}
                              href={`/books/${book.id}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-zinc-700">
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
                                      className="w-5 h-5 bg-gray-400"
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                  {book.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 flex items-center gap-1.5">
                          <span>👤</span> USUARIOS
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {userResults.map((user) => (
                            <Link
                              key={user.id}
                              href={`/user/${user.username}`}
                              onClick={() => setShowResults(false)}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <div className="w-10 h-10 relative flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800">
                                {user.imageURL ? (
                                  <Image
                                    src={user.imageURL}
                                    alt={user.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">
                                    👤
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{user.username}
                                </p>
                              </div>
                              <span className="text-[11px] bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap font-mono">
                                {user.studentCode}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Link to full search page */}
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setShowResults(false)}
                      className="block px-4 py-3 text-center text-sm font-medium text-light-purple dark:text-dark-purple hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors border-t border-gray-100 dark:border-zinc-800"
                    >
                      Ver todos los resultados →
                    </Link>
                  </>
                ) : (
                  !isSearching && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
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
            <button
              className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all group"
              aria-label="Notificaciones"
            >
              <SvgIcon
                src="/icons/bell.svg"
                className="w-5 h-5 bg-gray-500 dark:bg-gray-400 group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
              />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 w-2 h-2 rounded-full" />
              )}
            </button>

            {/* Menú de perfil */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full transition-all hover:ring-2 hover:ring-light-purple/30 dark:hover:ring-dark-pink/30"
                aria-label="Menú de usuario"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #26658C, #54ACBF)" }}
                >
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold tracking-wide">
                      {initials}
                    </span>
                  )}
                </div>
              </button>

              {/* Dropdown */}
              {isProfileMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div
                    className="px-4 py-3 border-b border-gray-100 dark:border-zinc-700"
                    style={{ background: "linear-gradient(135deg, rgba(38,101,140,0.08), rgba(84,172,191,0.08))" }}
                  >
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {session?.user?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      @{session?.user?.username || "username"}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-left group"
                    >
                      <SvgIcon
                        src="/icons/user.svg"
                        className="w-4 h-4 bg-gray-400 group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
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
