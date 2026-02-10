"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { BookCard } from "@/components/feed/BookCard";
import { BookModal } from "@/components/books";
import { Toast } from "@/components/ui/Toast";
import { getPersonalizedFeed } from "@/server/actions/feed/getPersonalizedFeed";
import { updateBook } from "@/server/actions/books";

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

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Modal state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load initial feed
  useEffect(() => {
    if (status === "authenticated") {
      loadFeed(0);
    }
  }, [status]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadFeed(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  const loadFeed = async (pageNum: number) => {
    setLoading(true);
    try {
      const result = await getPersonalizedFeed({ page: pageNum, limit: 10 });

      if (result.success && result.books) {
        if (pageNum === 0) {
          setBooks(result.books as Book[]);
        } else {
          setBooks((prev) => [...prev, ...(result.books as Book[])]);
        }
        setPage(pageNum);
        setHasMore(result.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleRequestBook = async (bookId: string) => {
    // TODO: Implement book request functionality
    setToast({ message: "Funcionalidad de solicitud próximamente", type: "success" });
    console.log("Request book:", bookId);
    setIsModalOpen(false);
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

  if (status === "loading") {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Basados en tus gustos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Descubre libros personalizados para ti
          </p>
        </div>

        {/* Feed Grid */}
        {books.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No hay libros disponibles en este momento.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Actualiza tus preferencias para ver recomendaciones personalizadas.
            </p>
          </div>
        ) : (
          <>
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

            {/* Loading indicator */}
            <div ref={loaderRef} className="py-8 text-center">
              {loading && (
                <div className="inline-block animate-spin text-4xl">📚</div>
              )}
              {!hasMore && books.length > 0 && (
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  No hay más libros para mostrar
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Book Modal */}
      {selectedBook && (
        <BookModal
          book={selectedBook}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isOwner={selectedBook.ownerId === session.user?.id}
          currentUserId={session.user?.id}
          onRequestBook={handleRequestBook}
          onUpdateBook={handleUpdateBook}
        />
      )}
    </>
  );
}
