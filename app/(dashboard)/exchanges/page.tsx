"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getMyExchanges, ExchangeWithDetails } from "@/server/actions/exchanges/getExchanges";
import { searchAvailableBooks, getChatContacts } from "@/server/actions/exchanges/searchExchange";
import { ExchangeCard } from "@/components/exchanges/ExchangeCard";
import { ExchangeRequestModal } from "@/components/exchanges/ExchangeRequestModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { isValidImageUrl } from "@/lib/utils/imageValidation";
import { getOrCreateRoom } from "@/server/actions/chat/getOrCreateRoom";
import { sendMessage } from "@/server/actions/chat/sendMessage";
import { encodeBookCardMessage } from "@/lib/utils/bookCardMessage";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Inbox, Send, ClipboardList, Search, RefreshCw, Clock, PartyPopper, BookOpenCheck, MessageSquare, ArrowLeft, ChevronRight, Mailbox, BookMarked, Trash2, ArrowLeftRight, Users } from "lucide-react";
import { getFriends, FriendProfile } from "@/server/actions/friends/getFriends";

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
            <div className="bg-card rounded-2xl shadow-sm p-6 h-full flex items-center justify-center">
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
    const [searchMode, setSearchMode] = useState<"books" | "contacts" | "friends">("books");
    const [searchResults, setSearchResults] = useState<AvailableBook[]>([]);
    const [chatContacts, setChatContacts] = useState<ChatContact[]>([]);
    const [friends, setFriends] = useState<FriendProfile[]>([]);
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
        if (activeTab === "buscar") {
            if (searchMode === "contacts") {
                loadContacts();
            } else if (searchMode === "friends") {
                loadFriends();
            }
        }
    }, [activeTab, searchMode]);

    const loadContacts = async () => {
        const result = await getChatContacts();
        if (result.success && result.contacts) {
            setChatContacts(result.contacts);
        }
    };

    const loadFriends = async () => {
        const result = await getFriends();
        if (result.success && result.friends) {
            setFriends(result.friends);
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

    const loadContactBooks = async (contact: ChatContact | FriendProfile) => {
        setSelectedContact({ id: contact.id, name: contact.name, username: contact.username, imageURL: contact.imageURL });
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

    const handleMessageOwner = async (book: AvailableBook) => {
        const result = await getOrCreateRoom(book.ownerId);
        if (result.success && result.roomId) {
            const bookCardMsg = encodeBookCardMessage({
                bookId: book.id,
                title: book.title,
                author: book.author,
                imageUrl: book.imageUrl,
            });
            await sendMessage(result.roomId, bookCardMsg);
            router.push(`/chat/${result.roomId}`);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: "activos", label: "Activos", icon: <BookOpen size={16} /> },
        { id: "recibidos", label: "Recibidos", icon: <Inbox size={16} /> },
        { id: "enviados", label: "Enviados", icon: <Send size={16} /> },
        { id: "historial", label: "Historial", icon: <ClipboardList size={16} /> },
        { id: "buscar", label: "Buscar", icon: <Search size={16} /> },
    ];

    const emptyMessages: Record<TabType, { icon: React.ReactNode; title: string; subtitle: string }> = {
        activos: {
            icon: <BookOpenCheck size={48} className="text-hint" />,
            title: "Sin intercambios activos",
            subtitle: "Busca un libro y solicita tu primer intercambio",
        },
        enviados: {
            icon: <Send size={48} className="text-hint" />,
            title: "No has enviado solicitudes",
            subtitle: "Busca libros que te interesen y solicita un intercambio",
        },
        recibidos: {
            icon: <Inbox size={48} className="text-hint" />,
            title: "Sin solicitudes recibidas",
            subtitle: "Cuando alguien quiera un libro tuyo, aparecerá aquí",
        },
        historial: {
            icon: <ClipboardList size={48} className="text-hint" />,
            title: "Sin historial",
            subtitle: "Los intercambios completados y cancelados aparecerán aquí",
        },
        buscar: {
            icon: <Search size={48} className="text-hint" />,
            title: "Busca libros para intercambiar",
            subtitle: "Usa la barra de búsqueda o explora tus contactos",
        },
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-heading flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-primary-soft rounded-xl">
                        <ArrowLeftRight size={24} className="text-primary" />
                    </div>
                    Intercambios
                </h1>
                <p className="text-hint text-sm mt-1">
                    Gestiona tus intercambios de libros con la comunidad
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    {
                        label: "Activos",
                        icon: <BookOpen size={14} />,
                        value: allExchanges.filter((e) => ["aceptado", "en_curso"].includes(e.status)).length,
                        color: "from-green-400 to-emerald-500",
                    },
                    {
                        label: "Pendientes",
                        icon: <Clock size={14} />,
                        value: allExchanges.filter((e) => e.status === "pendiente" && e.ownerId === currentUserId).length,
                        color: "from-amber-400 to-orange-500",
                    },
                    {
                        label: "Mis solicitudes",
                        icon: <Send size={14} />,
                        value: allExchanges.filter((e) => e.status === "pendiente" && e.requesterId === currentUserId).length,
                        color: "from-blue-400 to-indigo-500",
                    },
                    {
                        label: "Completados",
                        icon: <PartyPopper size={14} />,
                        value: allExchanges.filter((e) => e.status === "completado").length,
                        color: "from-purple-400 to-pink-500",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="relative rounded-xl p-3 bg-subtle border border-card-border/50 overflow-hidden group hover:shadow-sm transition-shadow"
                    >
                        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${stat.color}`} />
                        <div className="relative">
                            <p className="text-xs text-hint flex items-center gap-1">{stat.icon} {stat.label}</p>
                            <p className="text-xl font-bold text-heading mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-soft rounded-xl p-1 mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                            ? "bg-card text-heading shadow-sm"
                            : "text-hint hover:text-body"
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Search Tab Content */}
            {
                activeTab === "buscar" && (
                    <div className="space-y-4">
                        {/* Search Mode Toggle */}
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                            <button
                                onClick={() => { setSearchMode("books"); setSelectedContact(null); }}
                                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${searchMode === "books"
                                    ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-md"
                                    : "bg-soft text-caption hover:bg-dim"
                                    }`}
                            >
                                <BookMarked size={16} className="inline mr-1" /> <span className="hidden sm:inline">Buscar por </span>libro
                            </button>
                            <button
                                onClick={() => { setSearchMode("friends"); setSelectedContact(null); }}
                                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${searchMode === "friends"
                                    ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-md"
                                    : "bg-soft text-caption hover:bg-dim"
                                    }`}
                            >
                                <Users size={16} className="inline mr-1" /> Mis amigos
                            </button>
                            <button
                                onClick={() => { setSearchMode("contacts"); setSelectedContact(null); }}
                                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium transition-all ${searchMode === "contacts"
                                    ? "bg-gradient-to-r from-light-purple to-dark-purple text-white shadow-md"
                                    : "bg-soft text-caption hover:bg-dim"
                                    }`}
                            >
                                <MessageSquare size={16} className="inline mr-1" /> Mis chats
                            </button>
                        </div>

                        {searchMode === "books" ? (
                            <>
                                {/* Search Input */}
                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-hint" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por título, autor o usuario..."
                                        className="w-full pl-11 pr-4 py-3 bg-subtle border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-body text-sm"
                                    />
                                </div>

                                {/* Search Results */}
                                <div className="space-y-2">
                                    {searchLoading ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="animate-pulse flex items-center gap-4 p-3 bg-subtle rounded-xl">
                                                    <div className="w-12 h-18 bg-dim rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-dim rounded w-3/4" />
                                                        <div className="h-2 bg-dim rounded w-1/2" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="mb-2"><BookOpenCheck size={40} className="mx-auto text-hint" /></div>
                                            <p className="text-hint text-sm">
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
                                                onMessage={() => handleMessageOwner(book)}
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
                                            className="flex items-center gap-2 text-sm text-hint hover:text-heading mb-4 transition-colors"
                                        >
                                            <ArrowLeft size={14} /> Volver a contactos
                                        </button>
                                        <div className="flex items-center gap-3 mb-4 p-3 bg-subtle rounded-xl">
                                            <div className="w-10 h-10">
                                                <UserAvatar
                                                    imageURL={selectedContact.imageURL}
                                                    name={selectedContact.name}
                                                    size="sm"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-body">{selectedContact.name}</p>
                                                <p className="text-xs text-light-purple dark:text-light-pink">@{selectedContact.username}</p>
                                            </div>
                                        </div>

                                        {/* Contact's books */}
                                        {searchLoading ? (
                                            <div className="text-center py-8 text-hint">Cargando libros...</div>
                                        ) : contactBooks.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="mb-2"><Mailbox size={40} className="mx-auto text-hint" /></div>
                                                <p className="text-hint text-sm">Este usuario no tiene libros publicados</p>
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
                                                        onMessage={() => handleMessageOwner({
                                                            ...book,
                                                            ownerName: selectedContact.name,
                                                            ownerUsername: selectedContact.username,
                                                            ownerImageURL: selectedContact.imageURL,
                                                        })}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {(searchMode === "contacts" ? chatContacts : friends).length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="mb-2"><MessageSquare size={40} className="mx-auto text-hint" /></div>
                                                <p className="text-hint text-sm">
                                                    {searchMode === "contacts" ? "No tienes chats activos" : "No tienes amigos añadidos"}
                                                </p>
                                                <p className="text-hint text-xs mt-1">
                                                    {searchMode === "contacts" ? "Inicia una conversación para ver contactos aquí" : "Añade amigos para buscarlos aquí"}
                                                </p>
                                            </div>
                                        ) : (
                                            (searchMode === "contacts" ? chatContacts : friends).map((person) => (
                                                <button
                                                    key={person.id}
                                                    onClick={() => loadContactBooks(person)}
                                                    className="w-full flex items-center gap-3 p-3 bg-subtle rounded-xl hover:bg-soft/50 transition-colors text-left"
                                                >
                                                    <UserAvatar
                                                        imageURL={person.imageURL}
                                                        name={person.name}
                                                        size="sm"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-body truncate">{person.name}</p>
                                                        <p className="text-xs text-light-purple dark:text-light-pink">@{person.username}</p>
                                                    </div>
                                                    <ChevronRight size={16} className="text-hint" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )
            }

            {/* Exchange List for non-search tabs */}
            {
                activeTab !== "buscar" && (
                    <div className="space-y-3">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="animate-pulse bg-subtle rounded-2xl p-4">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-24 bg-dim rounded-xl" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-dim rounded w-3/4" />
                                                <div className="h-3 bg-dim rounded w-1/2" />
                                                <div className="h-3 bg-dim rounded w-1/3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : exchanges.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mb-4 flex justify-center">{emptyMessages[activeTab].icon}</div>
                                <h3 className="text-lg font-semibold text-body mb-1">
                                    {emptyMessages[activeTab].title}
                                </h3>
                                <p className="text-hint text-sm">
                                    {emptyMessages[activeTab].subtitle}
                                </p>
                                {(activeTab === "activos" || activeTab === "enviados") && (
                                    <button
                                        onClick={() => setActiveTab("buscar")}
                                        className="mt-4 px-6 py-2.5 bg-gradient-to-r from-light-purple to-dark-purple text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 text-sm"
                                    >
                                        <Search size={16} className="inline mr-1" /> Buscar libros
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
                )
            }

            {/* Exchange Request Modal */}
            {
                selectedBook && (
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
                )
            }
        </div >
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
        <div className="flex items-center gap-3 p-3 bg-subtle rounded-xl hover:bg-soft/50 transition-colors group">
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
                        <div className="w-full h-full flex items-center justify-center"><BookOpen size={20} className="text-purple-400" /></div>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link
                    href={`/books/${book.id}`}
                    className="font-semibold text-sm text-heading hover:text-light-purple dark:hover:text-light-pink transition-colors truncate block"
                >
                    {book.title}
                </Link>
                <p className="text-xs text-hint truncate">{book.author}</p>
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
                    className="px-2.5 py-1.5 bg-soft text-caption text-xs font-medium rounded-lg hover:bg-dim transition-colors"
                    title="Enviar mensaje"
                >
                    <MessageSquare size={14} />
                </button>
                {(book.status === "disponible" || book.status === "ocupado") && (
                    <button
                        onClick={onExchange}
                        className="px-3 py-1.5 bg-gradient-to-r from-light-purple to-dark-purple text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
                    >
                        <Mailbox size={14} className="inline mr-0.5" /> Solicitar
                    </button>
                )}
            </div>
        </div>
    );
}
