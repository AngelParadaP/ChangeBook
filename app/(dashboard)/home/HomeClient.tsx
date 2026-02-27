"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BookCard } from "@/components/feed/BookCard";
import { PostCard } from "@/components/community/PostCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { getPersonalizedFeed } from "@/server/actions/feed/getPersonalizedFeed";
import { getCommunityFeed } from "@/server/actions/communities/getCommunityFeed";
import BookRecommendationSidebar from "@/components/community/BookRecommendationSidebar";
import { updateBook } from "@/server/actions/books";

// ─── Skeleton Components ─────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 p-4 animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 dark:bg-zinc-700 rounded-xl mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-16" />
          <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 shadow-sm mb-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-28" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-3" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-36" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-3" />
        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-20" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-full" />
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-5/6" />
        <div className="h-3.5 bg-gray-200 dark:bg-zinc-700 rounded-full w-2/3" />
      </div>
      <div className="flex items-center gap-4 border-t border-gray-100 dark:border-zinc-800/50 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-[18px] h-[18px] rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-6" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[18px] h-[18px] rounded bg-gray-200 dark:bg-zinc-700" />
          <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
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

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: Date;
  likes: number;
  userId: string;
  username: string;
  userImage: string | null;
  communityId: string;
  communityName: string;
  communityImage: string | null;
  hasLiked?: boolean; // Add hasLiked here for typing safely if passed
}

interface HomeClientProps {
  initialBooks: Book[];
  initialHasMore: boolean;
}

export default function HomeClient({ initialBooks, initialHasMore }: HomeClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialTab = searchParams.get('tab') === 'communities' ? 'communities' : 'books';
  const [activeTab, setActiveTab] = useState<'books' | 'communities'>(initialTab);

  const handleTabChange = (tab: 'books' | 'communities') => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Books State
  const [books, setBooks] = useState<Book[]>(initialBooks);
  // ... (rest of states remain same, just ensure to not overwrite them by partial replace or be careful)
  // I will replace loosely to avoid rewriting all 300 lines if possible, but the `activeTab` logic is at the top.
  // The structure is simple enough to replace entire function if I copy it all, but previous attempt failed due to mismatch.
  // I'll try to match the top part clearly.

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Communities State
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsInitialized, setPostsInitialized] = useState(false);
  const [postsMessage, setPostsMessage] = useState<string | null>(null);

  // Modal state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load community posts when tab changes
  useEffect(() => {
    if (activeTab === 'communities' && !postsInitialized) {
      loadCommunityPosts(0);
    }
  }, [activeTab]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    
    // Determine which state to check based on active tab
    const isLoading = activeTab === 'books' ? loading : postsLoading;
    const hasMoreItems = activeTab === 'books' ? hasMore : postsHasMore;

    if (isLoading || !hasMoreItems) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
            if (activeTab === 'books') {
                loadNextBookPage();
            } else {
                loadNextPostPage();
            }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [activeTab, page, hasMore, loading, postsPage, postsHasMore, postsLoading]);

  const loadNextBookPage = async () => {
    setLoading(true);
    const nextPage = page + 1;
    try {
      const result = await getPersonalizedFeed({ page: nextPage, limit: 10 });

      if (result.success && result.books) {
        setBooks((prev) => [...prev, ...(result.books as Book[])]);
        setPage(nextPage);
        setHasMore(result.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityPosts = async (pageNum: number) => {
    setPostsLoading(true);
    try {
      const result = await getCommunityFeed({ page: pageNum, limit: 10 });
      if (result.success && result.posts) {
        if (pageNum === 0) {
            setPosts(result.posts as any[]); 
            setPostsInitialized(true);
        } else {
            setPosts((prev) => [...prev, ...(result.posts as any[])]);
        }
        setPostsPage(pageNum);
        setPostsHasMore(result.hasMore || false);
        if (result.message) {
            setPostsMessage(result.message);
        }
      } 
    } catch (error) {
        console.error("Error loading community feed:", error);
    } finally {
        setPostsLoading(false);
    }
  };

  const loadNextPostPage = () => {
      loadCommunityPosts(postsPage + 1);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleRequestBook = async (bookId: string) => {
    setToast({ message: "Funcionalidad de solicitud próximamente", type: "success" });
    setIsModalOpen(false);
  };

  const handleUpdateBook = async (bookId: string, data: Partial<Book>) => {
    const updateData: any = {
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

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
        {/* Header with Tabs */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Inicio
          </h1>
          <div className="flex gap-4 border-b border-gray-200 dark:border-zinc-700 mt-4">
               <button
                  onClick={() => handleTabChange('books')}
                  className={`pb-2 px-1 text-lg font-medium transition-colors relative ${
                      activeTab === 'books' 
                      ? 'text-light-purple dark:text-light-purple border-b-2 border-light-purple' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
               >
                   Libros para ti
               </button>
               <button
                  onClick={() => handleTabChange('communities')}
                  className={`pb-2 px-1 text-lg font-medium transition-colors relative ${
                      activeTab === 'communities' 
                      ? 'text-light-purple dark:text-light-purple border-b-2 border-light-purple' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
               >
                   Comunidades
               </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'books' ? (
            // Books Grid
            <>
                {books.length === 0 && !loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No hay libros disponibles en este momento.
                    </p>
                </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {books.map((book) => (
                    <BookCard
                        key={book.id}
                        id={book.id}
                        title={book.title}
                        author={book.author}
                        imageUrl={book.imageUrl}
                        genres={book.genres}
                        ownerUsername={book.ownerUsername}
                        onClick={() => handleBookClick(book)}
                    />
                    ))}
                </div>
                )}
            </>
        ) : (
            // Communities Feed
            <div className="flex justify-center gap-6">
              {/* Main Posts Column */}
              <div className="w-full max-w-2xl">
                {postsLoading && posts.length === 0 && (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <PostCardSkeleton key={`skeleton-${i}`} />
                      ))}
                    </div>
                )}
                
                {posts.length === 0 && !postsLoading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            {postsMessage || "No hay publicaciones recientes de tus comunidades."}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                             ¡Únete a más comunidades para ver contenido aquí!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
              </div>

              {/* Book Recommendations Sidebar */}
              <div className="hidden xl:block w-80 flex-shrink-0">
                <div className="sticky top-6">
                  <BookRecommendationSidebar
                    aggregated={true}
                    currentUserId={session?.user?.id}
                  />
                </div>
              </div>
            </div>
        )}

        <div ref={loaderRef} className="py-4">
            {activeTab === 'books' && loading && books.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <BookCardSkeleton key={`load-book-${i}`} />
                ))}
              </div>
            )}
            {activeTab === 'communities' && postsLoading && posts.length > 0 && (
              <div className="max-w-2xl mx-auto space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={`load-post-${i}`} />
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
          onRequestBook={handleRequestBook}
          onUpdateBook={handleUpdateBook}
        />
      )}
    </>
  );
}
