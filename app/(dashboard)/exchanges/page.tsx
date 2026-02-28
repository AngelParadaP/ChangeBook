"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getMyExchanges, ExchangeWithDetails } from "@/server/actions/exchanges/getExchanges";
import { searchAvailableBooks, getChatContacts } from "@/server/actions/exchanges/searchExchange";
import { ExchangeCard } from "@/components/exchanges/ExchangeCard";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { getOrCreateRoom } from "@/server/actions/chat/getOrCreateRoom";
import { useRouter, useSearchParams } from "next/navigation";

type TabType = "activos" | "enviados" | "recibidos" | "historial" | "buscar";

interface AvailableBook {
    id: string;
    title: string;
    author: string;
    imageUrl: string;
    status: string;
    genres: string[];
    ownerId: string;
    ownerName: string | null;
    ownerUsername: string | null;
    ownerImageURL: string | null;
}

interface ChatContact {
    id: string;
    name: string;
    username: string;
    imageURL: string | null;
}

export default function ExchangesPage() {
    return (
        <Suspense fallback={
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-light-purple dark:border-light-pink border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ExchangesPageContent />
        </Suspense>
    );
}

function ExchangesPageContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Leer tab de la URL si existe (ej: /exchanges?tab=recibidos)
    const tabFromUrl = searchParams.get("tab") as TabType | null;
    const validTabs: TabType[] = ["activos", "enviados", "recibidos", "historial", "buscar"];
    const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "activos";

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [exchanges, setExchanges] = useState<ExchangeWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    // Sincronizar tab cuando cambian los search params (navegación desde notificaciones)
    useEffect(() => {
        const newTab = searchParams.get("tab") as TabType | null;
        if (newTab && validTabs.includes(newTab) && newTab !== activeTab) {
            setActiveTab(newTab);
        }
    }, [searchParams]);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMode, setSearchMode] = useState<"books" | "contacts">("books");
    const [searchResults, setSearchResults] = useState<AvailableBook[]>([]);
    const [chatContacts, setChatContacts] = useState<ChatContact[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [contactBooks, setContactBooks] = useState<AvailableBook[]>([]);
    const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<{
        id: string;
        title: string;
        ownerName: string;
    } | null>(null);

    const [allExchanges, setAllExchanges] = useState<ExchangeWithDetails[]>([]);

    const currentUserId = session?.user?.id || "";

    // Load ALL exchanges for stats (independent of tabs)
    const loadAllExchanges = useCallback(async () => {
        const result = await getMyExchanges("all");
        if (result.success && result.exchanges) {
            setAllExchanges(result.exchanges);
        }
    }, []);

    const loadExchanges = useCallback(async () => {
        setLoading(true);
        let filter: "all" | "sent" | "received" | "active" = "all";
        if (activeTab === "activos") filter = "active";
        else if (activeTab === "enviados") filter = "sent";
        else if (activeTab === "recibidos") filter = "received";
        else if (activeTab === "historial") filter = "all";

        const result = await getMyExchanges(filter);
        if (result.success && result.exchanges) {
            if (activeTab === "historial") {
                setExchanges(
                    result.exchanges.filter((e) =>
                        ["completado", "cancelado", "rechazado"].includes(e.status)
                    )
                );
            } else if (activeTab === "enviados" || activeTab === "recibidos") {
                // Exclude completed/cancelled/rejected from these tabs
                setExchanges(
                    result.exchanges.filter((e) =>
                        !["completado", "cancelado", "rechazado"].includes(e.status)
                    )
                );
            } else {
                setExchanges(result.exchanges);
            }
        }
        setLoading(false);
    }, [activeTab]);

    // On mount: trigger cron to auto-start/complete exchanges, then load data
    useEffect(() => {
        const init = async () => {
            // Poke the cron to auto-transition exchanges whose dates have arrived
            try {
                await fetch("/api/cron/exchanges");
            } catch {
                // Silently fail — not critical
            }
            loadAllExchanges();
        };
        init();
    }, [loadAllExchanges]);

    useEffect(() => {
        if (activeTab !== "buscar") {
            loadExchanges();
        }
    }, [activeTab, loadExchanges]);

    // Search logic
    useEffect(() => {
        if (activeTab === "buscar" && searchMode === "contacts") {
            loadContacts();
        }
    }, [activeTab, searchMode]);

    const loadContacts = async () => {
        const result = await getChatContacts();
        if (result.success && result.contacts) {
            setChatContacts(result.contacts);
        }
    };

    useEffect(() => {
        if (activeTab !== "buscar" || searchMode !== "books") return;

        const timer = setTimeout(async () => {
            setSearchLoading(true);
            const result = await searchAvailableBooks(searchQuery, 20);
            if (result.success && result.books) {
                setSearchResults(result.books as AvailableBook[]);
            }
            setSearchLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchMode]);

    const loadContactBooks = async (contact: ChatContact) => {
        setSelectedContact(contact);
        setSearchLoading(true);
        const { getUserAvailableBooks } = await import("@/server/actions/exchanges/searchExchange");
        const result = await getUserAvailableBooks(contact.id);
        if (result.success && result.books) {
            setContactBooks(result.books as AvailableBook[]);
        }
        setSearchLoading(false);
    };

    const openExchangeModal = (book: AvailableBook) => {
        setSelectedBook({
            id: book.id,
            title: book.title,
            ownerName: book.ownerName || "Usuario",
        });
        setModalOpen(true);
    };

    const handleMessageOwner = async (ownerId: string) => {
        const result = await getOrCreateRoom(ownerId);
        if (result.success && result.roomId) {
            router.push(`/chat/${result.roomId}`);
        }
    };

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: "activos", label: "Activos", icon: "📖" },
        { id: "recibidos", label: "Recibidos", icon: "📥" },
        { id: "enviados", label: "Enviados", icon: "📤" },
        { id: "historial", label: "Historial", icon: "📋" },
        { id: "buscar", label: "Buscar", icon: "🔍" },
    ];

    const emptyMessages: Record<TabType, { icon: string; title: string; subtitle: string }> = {
        activos: {
            icon: "📚",
            title: "Sin intercambios activos",
            subtitle: "Busca un libro y solicita tu primer intercambio",
        },
        enviados: {
            icon: "📤",
            title: "No has enviado solicitudes",
            subtitle: "Busca libros que te interesen y solicita un intercambio",
        },
        recibidos: {
            icon: "📥",
            title: "Sin solicitudes recibidas",
            subtitle: "Cuando alguien quiera un libro tuyo, aparecerá aquí",
        },
        historial: {
            icon: "📋",
            title: "Sin historial",
            subtitle: "Los intercambios completados y cancelados aparecerán aquí",
        },
        buscar: {
            icon: "🔍",
            title: "Busca libros para intercambiar",
            subtitle: "Usa la barra de búsqueda o explora tus contactos",
        },
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    🔄 Intercambios
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    Gestiona tus intercambios de libros con la comunidad
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        label: "Activos",
                        icon: "📖",
                        value: allExchanges.filter((e) => ["aceptado", "en_curso"].includes(e.status)).length,
                        color: "from-green-400 to-emerald-500",
                    },
                    {
                        label: "Pendientes",
                        icon: "⏳",
                        value: allExchanges.filter((e) => e.status === "pendiente" && e.ownerId === currentUserId).length,
                        color: "from-amber-400 to-orange-500",
                    },
                    {
                        label: "Mis solicitudes",
                        icon: "📤",
                        value: allExchanges.filter((e) => e.status === "pendiente" && e.requesterId === currentUserId).length,
                        color: "from-blue-400 to-indigo-500",
                    },
                    {
                        label: "Completados",
                        icon: "🎉",
                        value: allExchanges.filter((e) => e.status === "completado").length,
                        color: "from-purple-400 to-pink-500",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="relative rounded-xl p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 overflow-hidden group hover:shadow-sm transition-shadow"
                    >
                        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${stat.color}`} />
                        <div className="relative">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.icon} {stat.label}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-800 rounded-xl p-1 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? "bg-white dark:bg-zinc-700 text-gray-800 dark:text-gray-100 shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Search Tab Content */}
            {activeTab === "buscar" && (
                <div className="space-y-4">
                    {/* Search Mode Toggle */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setSearchMode("books"); setSelectedContact(null); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${searchMode === "books"
                                ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-md"
                                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                }`}
                        >
                            📚 Buscar por libro
                        </button>
                        <button
                            onClick={() => { setSearchMode("contacts"); setSelectedContact(null); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${searchMode === "contacts"
                                ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-md"
                                : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                                }`}
                        >
                            💬 Buscar en mis chats
                        </button>
                    </div>

                    {searchMode === "books" ? (
                        <>
                            {/* Search Input */}
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por título, autor o usuario..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-700 dark:text-gray-300 text-sm"
                                />
                            </div>

                            {/* Search Results */}
                            <div className="space-y-2">
                                {searchLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                                <div className="w-12 h-18 bg-gray-200 dark:bg-zinc-700 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
                                                    <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">📚</div>
                                        <p className="text-gray-400 text-sm">
                                            {searchQuery.length >= 2
                                                ? "No se encontraron libros"
                                                : "Libros disponibles aparecerán aquí"}
                                        </p>
                                    </div>
                                ) : (
                                    searchResults.map((book) => (
                                        <BookSearchResult
                                            key={book.id}
                                            book={book}
                                            onExchange={() => openExchangeModal(book)}
                                            onMessage={() => handleMessageOwner(book.ownerId)}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Contact list or contact books */}
                            {selectedContact ? (
                                <div>
                                    <button
                                        onClick={() => { setSelectedContact(null); setContactBooks([]); }}
                                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
                                    >
                                        ← Volver a contactos
                                    </button>
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 overflow-hidden relative">
                                            {selectedContact.imageURL && isValidImageUrl(selectedContact.imageURL) ? (
                                                <Image src={selectedContact.imageURL} alt={selectedContact.name} fill className="object-cover" sizes="40px" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">{selectedContact.name}</p>
                                            <p className="text-xs text-light-purple dark:text-light-pink">@{selectedContact.username}</p>
                                        </div>
                                    </div>

                                    {/* Contact's books */}
                                    {searchLoading ? (
                                        <div className="text-center py-8 text-gray-400">Cargando libros...</div>
                                    ) : contactBooks.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">📭</div>
                                            <p className="text-gray-400 text-sm">Este usuario no tiene libros publicados</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {contactBooks.map((book) => (
                                                <BookSearchResult
                                                    key={book.id}
                                                    book={{ ...book, ownerName: selectedContact.name, ownerUsername: selectedContact.username, ownerImageURL: selectedContact.imageURL }}
                                                    onExchange={() =>
                                                        openExchangeModal({
                                                            ...book,
                                                            ownerName: selectedContact.name,
                                                            ownerUsername: selectedContact.username,
                                                            ownerImageURL: selectedContact.imageURL,
                                                        })
                                                    }
                                                    onMessage={() => handleMessageOwner(book.ownerId)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {chatContacts.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-4xl mb-2">💬</div>
                                            <p className="text-gray-400 dark:text-gray-500 text-sm">No tienes chats activos</p>
                                            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Inicia una conversación para ver contactos aquí</p>
                                        </div>
                                    ) : (
                                        chatContacts.map((contact) => (
                                            <button
                                                key={contact.id}
                                                onClick={() => loadContactBooks(contact)}
                                                className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 overflow-hidden relative flex-shrink-0">
                                                    {contact.imageURL && isValidImageUrl(contact.imageURL) ? (
                                                        <Image src={contact.imageURL} alt={contact.name} fill className="object-cover" sizes="40px" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 truncate">{contact.name}</p>
                                                    <p className="text-xs text-light-purple dark:text-light-pink">@{contact.username}</p>
                                                </div>
                                                <span className="text-gray-400 text-sm">→</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Exchange List for non-search tabs */}
            {activeTab !== "buscar" && (
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-24 bg-gray-200 dark:bg-zinc-700 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4" />
                                            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/2" />
                                            <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : exchanges.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4">{emptyMessages[activeTab].icon}</div>
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                {emptyMessages[activeTab].title}
                            </h3>
                            <p className="text-gray-400 dark:text-gray-500 text-sm">
                                {emptyMessages[activeTab].subtitle}
                            </p>
                            {(activeTab === "activos" || activeTab === "enviados") && (
                                <button
                                    onClick={() => setActiveTab("buscar")}
                                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 text-sm"
                                >
                                    🔍 Buscar libros
                                </button>
                            )}
                        </div>
                    ) : (
                        exchanges.map((exchange) => (
                            <ExchangeCard
                                key={exchange.id}
                                exchange={exchange}
                                currentUserId={currentUserId}
                                onUpdate={() => { loadExchanges(); loadAllExchanges(); }}
                            />
                        ))
                    )}
                </div>
            )}

            {/* Exchange Request Modal */}
            {selectedBook && (
                <ExchangeRequestModal
                    isOpen={modalOpen}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedBook(null);
                    }}
                    bookId={selectedBook.id}
                    bookTitle={selectedBook.title}
                    ownerName={selectedBook.ownerName}
                    onSuccess={() => {
                        loadExchanges();
                        loadAllExchanges();
                        setActiveTab("enviados");
                    }}
                />
            )}
        </div>
    );
}

// Book Search Result Item
function BookSearchResult({
    book,
    onExchange,
    onMessage,
}: {
    book: AvailableBook;
    onExchange: () => void;
    onMessage: () => void;
}) {
    const [imgError, setImgError] = useState(false);
    const validImage = book.imageUrl && isValidImageUrl(book.imageUrl) && !imgError;

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/50 transition-colors group">
            {/* Book Image */}
            <Link href={`/books/${book.id}`} className="flex-shrink-0">
                <div className="w-12 h-[72px] rounded-lg overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 relative shadow-sm">
                    {validImage ? (
                        <Image
                            src={book.imageUrl}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📖</div>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/books/${book.id}`}
                    className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-light-purple dark:hover:text-light-pink transition-colors truncate block"
                >
                    {book.title}
                </Link>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{book.author}</p>
                {book.ownerUsername && (
                    <p className="text-[10px] text-light-purple dark:text-light-pink mt-0.5">
                        @{book.ownerUsername}
                    </p>
                )}
            </div>

            {/* Status & Action */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
                <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${book.status === "disponible"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        }`}
                >
                    {book.status === "disponible" ? "Disponible" : "Ocupado"}
                </span>
                <button
                    onClick={onMessage}
                    className="px-2.5 py-1.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                    title="Enviar mensaje"
                >
                    💬
                </button>
                {(book.status === "disponible" || book.status === "ocupado") && (
                    <button
                        onClick={onExchange}
                        className="px-3 py-1.5 bg-gradient-to-r from-light-purple to-dark-purple text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
                    >
                        📬 Solicitar
                    </button>
                )}
            </div>
        </div>
    );
}
