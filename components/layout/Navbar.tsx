"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSidebar } from "./SidebarContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { searchBooks } from "@/server/actions/books/searchBooks";

interface SearchResult {
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

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
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

  /* ── Búsqueda con debounce (lógica original intacta) ── */
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        setShowResults(true);
        const result = await searchBooks(searchQuery);
        if (result.success && result.books) {
          setSearchResults(result.books as SearchResult[]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
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
      console.log("Full search for:", searchQuery);
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
                  placeholder="Buscar libros o autores..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-2 focus:ring-light-purple/40 dark:focus:ring-dark-pink/40 focus:bg-white dark:focus:bg-zinc-900 transition-all text-sm text-gray-800 dark:text-gray-200 font-medium"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-light-purple dark:border-dark-pink border-t-transparent rounded-full" />
                )}
              </div>
            </form>

            {/* Resultados de búsqueda */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-zinc-800/50 tracking-widest">
                      RESULTADOS
                    </div>
                    {searchResults.map((book) => (
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
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
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
                ) : (
                  !isSearching && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      Sin resultados para &ldquo;{searchQuery}&rdquo;
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
