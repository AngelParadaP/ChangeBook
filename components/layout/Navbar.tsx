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

interface UserResult {
  id: string;
  name: string;
  username: string;
  studentCode: string;
  imageURL: string | null;
}

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

  // Click outside listener for both menus
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  const hasBooks = bookResults.length > 0;
  const hasUsers = userResults.length > 0;
  const hasAnyResults = hasBooks || hasUsers;

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm relative z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Toggle and Theme Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
              aria-label="Toggle sidebar"
            >
              <span className="text-2xl">☰</span>
            </button>
            <ThemeToggle inline />
          </div>

          {/* Search Bar Container */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  🔍
                </span>
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
                  placeholder="Buscar libros, usuarios, código de alumno..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple focus:bg-white dark:focus:bg-zinc-900 transition-all text-gray-800 dark:text-gray-200"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
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
                                  <div className="w-full h-full flex items-center justify-center text-xs">
                                    📚
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

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              className="relative p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all group"
              aria-label="Notificaciones"
            >
              <span className="text-2xl">🔔</span>
              {notifications > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications > 9 ? "9+" : notifications}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                aria-label="Menú de usuario"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center relative">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <div className="px-4 py-3 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 border-b border-gray-200 dark:border-zinc-700">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {session?.user?.name || "Usuario"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      @{session?.user?.username || "username"}
                    </p>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        router.push("/profile");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left"
                    >
                      <span className="text-lg">👤</span>
                      <span className="text-gray-700 dark:text-gray-200 font-medium">
                        Mi Perfil
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
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
