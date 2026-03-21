"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { joinCommunity } from "@/server/actions/communities/actions";
import { createCommunity } from "@/server/actions/communities/createCommunity";
import { getCommunities } from "@/server/actions/communities/getCommunities";
import { getRecommendedCommunities } from "@/server/actions/communities/getRecommendedCommunities";
import { toast } from "@/components/ui/GlobalToast";
import { Search, Plus, Users, Compass, PartyPopper, Hand, Sparkles, Crown } from "lucide-react";
import { BOOK_GENRES } from "@/lib/constants/genres";

interface Community {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  genres?: string[];
  memberCount: number;
  isMember: boolean;
  similarityScore?: number | null;
  role?: string | null;
}



type TabKey = "discover" | "mine";

interface CommunitiesClientProps {
  initialDiscoverCommunities: Community[];
  initialMyCommunities: Community[];
}

export default function CommunitiesClient({ initialDiscoverCommunities, initialMyCommunities }: CommunitiesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("discover");
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>(initialDiscoverCommunities);
  const [myCommunities, setMyCommunities] = useState<Community[]>(initialMyCommunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [newCommunityGenres, setNewCommunityGenres] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      if (activeTab === "discover") {
        if (searchQuery.trim()) {
          // Search falls back to generic getCommunities
          const result = await getCommunities({ query: searchQuery, filter: "discover" });
          if (result.success && result.communities) {
            setDiscoverCommunities(result.communities);
          }
        } else {
          // Empty search → reload recommended
          const result = await getRecommendedCommunities({ limit: 30 });
          if (result.success && result.communities) {
            setDiscoverCommunities(result.communities.map(c => ({
              ...c,
              imageUrl: (c as any).imageUrl || null,
              isMember: false,
            })));
          }
        }
      } else {
        const result = await getCommunities({ query: searchQuery, filter: "mine" });
        if (result.success && result.communities) {
          setMyCommunities(result.communities);
        }
      }
    } finally {
      setSearching(false);
    }
  };

  const handleTabChange = async (tab: TabKey) => {
    setActiveTab(tab);
    setSearchQuery("");
    setSearching(true);
    try {
      if (tab === "discover") {
        const result = await getRecommendedCommunities({ limit: 30 });
        if (result.success && result.communities) {
          setDiscoverCommunities(result.communities.map(c => ({
            ...c,
            imageUrl: (c as any).imageUrl || null,
            isMember: false,
          })));
        }
      } else {
        const result = await getCommunities({ filter: "mine" });
        if (result.success && result.communities) {
          setMyCommunities(result.communities);
        }
      }
    } finally {
      setSearching(false);
    }
  };

  const handleJoin = async (communityId: string) => {
    const result = await joinCommunity(communityId);
    if (result.success) {
      toast("Te has unido a la comunidad!", "success");
      // Move community from discover to mine
      const joined = discoverCommunities.find(c => c.id === communityId);
      if (joined) {
        setDiscoverCommunities(prev => prev.filter(c => c.id !== communityId));
        setMyCommunities(prev => [{
          ...joined,
          memberCount: joined.memberCount + 1,
          isMember: true
        }, ...prev]);
      }
    } else {
      toast(result.error || "Error al unirse", "error");
    }
  };

  const handleCreate = async () => {
    if (!newCommunityName.trim()) return;
    setCreating(true);
    const result = await createCommunity({ name: newCommunityName, description: newCommunityDesc, genres: newCommunityGenres });
    setCreating(false);

    if (result.success && result.community) {
      toast("Comunidad creada exitosamente", "success");
      setShowCreateModal(false);
      setNewCommunityName("");
      setNewCommunityDesc("");
      setNewCommunityGenres([]);
      // Add to my communities (creator is auto-joined as admin)
      const newComm: Community = {
        id: result.community.id,
        name: result.community.name,
        description: result.community.description,
        imageUrl: result.community.imageUrl,
        genres: result.community.genres || [],
        memberCount: 1,
        isMember: true
      };
      setMyCommunities(prev => [newComm, ...prev]);
    } else {
      toast(result.error || "Error al crear la comunidad", "error");
    }
  };

  const currentCommunities = activeTab === "discover" ? discoverCommunities : myCommunities;

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "discover", label: "Descubrir", icon: <Compass size={18} /> },
    { key: "mine", label: "Mis Comunidades", icon: <Users size={18} /> },
  ];

  return (
    <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-heading flex items-center gap-3">
          <div className="p-2 sm:p-2.5 bg-primary-soft rounded-xl">
            <Users size={24} className="text-primary" />
          </div>
          Comunidades
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={18} />
          Crear Comunidad
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-card-border pb-2 sm:pb-4 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-300 relative rounded-xl sm:rounded-none sm:rounded-t-xl cursor-pointer whitespace-nowrap ${activeTab === tab.key
              ? "text-primary dark:text-primary-light bg-primary/10 dark:bg-primary-dark/30 sm:bg-transparent sm:dark:bg-transparent"
              : "text-hint hover:text-heading hover:bg-subtle"
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "mine" && myCommunities.length > 0 && (
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full ml-1 ${activeTab === "mine"
                ? "bg-primary/20 text-primary dark:bg-primary/30 sm:bg-white/20 sm:text-white"
                : "bg-dim text-caption"
                }`}>
                {myCommunities.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
        <div className="relative max-w-2xl">
          <span className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-hint">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={activeTab === "discover" ? "Buscar comunidades..." : "Buscar en tus comunidades..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-20 py-3 sm:py-3.5 bg-soft border-2 border-card-border rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-muted focus:border-primary dark:focus:border-primary-muted focus:bg-card transition-all text-heading text-sm sm:text-base placeholder:text-sm sm:placeholder:text-base"
          />
          <button disabled={searching} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 bg-dim rounded-lg sm:rounded-xl hover:bg-dim transition-colors text-xs sm:text-sm font-medium text-body cursor-pointer">
            {searching ? "..." : "Buscar"}
          </button>
        </div>
      </form>

      {/* Grid */}
      {searching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-card-border rounded-xl p-4 animate-pulse">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-16 h-16 rounded-lg bg-dim" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-dim rounded-full w-3/4" />
                  <div className="h-3 bg-dim rounded-full w-1/2" />
                </div>
              </div>
              <div className="h-10 bg-dim rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCommunities.map((community) => (
            <div key={community.id} className="border border-card-border rounded-xl p-4 hover:shadow-md hover:border-primary/50 dark:hover:border-primary-muted/50 transition-all duration-200 flex flex-col justify-between group">
              <div>
                <div className="flex items-start gap-3 sm:gap-4 mb-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-dim overflow-hidden relative flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/30 transition-all">
                    {community.imageUrl ? (
                      <Image src={community.imageUrl} alt={community.name} fill className="object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full"><Users size={20} className="text-hint" /></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-heading line-clamp-1">{community.name}</h3>
                    <p className="text-xs sm:text-sm text-hint mb-1">{community.memberCount} miembro{community.memberCount !== 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {community.isMember && <span className="text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">Miembro</span>}
                      {activeTab === "mine" && community.role === "admin" && (
                        <span className="text-[10px] sm:text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                          <Crown size={10} /> Creador
                        </span>
                      )}
                      {activeTab === "discover" && !community.isMember && community.similarityScore != null && community.similarityScore > 0.1 && (
                        <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                          <Sparkles size={10} /> Para ti
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-caption text-xs sm:text-sm mb-4 line-clamp-2 h-8 sm:h-10">
                  {community.description || "Sin descripción"}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => router.push(`/communities/${community.id}`)}
                  className="flex-1 py-2 px-3 bg-soft rounded-lg text-sm font-medium hover:bg-dim transition-colors cursor-pointer"
                >
                  Ver
                </button>
                {activeTab === "discover" && !community.isMember && (
                  <button
                    onClick={() => handleJoin(community.id)}
                    className="flex-1 py-2 px-3 bg-primary-soft text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    Unirse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && currentCommunities.length === 0 && (
        <div className="text-center py-12">
          {activeTab === "discover" ? (
            <>
              <div className="mb-4 flex justify-center"><PartyPopper size={48} className="text-hint" /></div>
              <h3 className="text-xl font-semibold text-body mb-2">
                ¡Ya estás en todas las comunidades!
              </h3>
              <p className="text-hint max-w-sm mx-auto">
                No hay nuevas comunidades por descubrir. ¡Crea una nueva para que otros se unan!
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center"><Hand size={48} className="text-hint" /></div>
              <h3 className="text-xl font-semibold text-body mb-2">
                No te has unido a ninguna comunidad
              </h3>
              <p className="text-hint max-w-sm mx-auto">
                Explora la pestaña &quot;Descubrir&quot; para encontrar comunidades interesantes.
              </p>
            </>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-xl border border-card-border max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold mb-4 text-heading">Crear Nueva Comunidad</h2>
            <input
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-card dark:border-card-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nombre de la comunidad"
              value={newCommunityName}
              onChange={e => setNewCommunityName(e.target.value)}
            />
            <textarea
              className="w-full mb-3 px-4 py-2 border rounded-lg dark:bg-card dark:border-card-border focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descripción"
              rows={3}
              value={newCommunityDesc}
              onChange={e => setNewCommunityDesc(e.target.value)}
            />

            {/* Genre Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-body mb-1.5">
                Géneros literarios
              </label>
              <p className="text-xs text-hint mb-2">
                Solo se podrán recomendar libros que coincidan con estos géneros
              </p>
              {/* Search */}
              <input
                type="text"
                value={genreSearch}
                onChange={(e) => setGenreSearch(e.target.value)}
                placeholder="Buscar género..."
                className="w-full mb-2 px-3 py-1.5 text-sm border border-card-border rounded-lg bg-subtle text-heading placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {/* Selected genres */}
              {newCommunityGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newCommunityGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setNewCommunityGenres((prev) => prev.filter((g) => g !== genre))}
                      className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary text-white shadow-sm flex items-center gap-1 hover:bg-primary-dark transition-colors"
                    >
                      {genre}
                      <span className="text-primary-light">×</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Available genres */}
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                {BOOK_GENRES
                  .filter((genre) => !newCommunityGenres.includes(genre))
                  .filter((genre) => genre.toLowerCase().includes(genreSearch.toLowerCase()))
                  .map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setNewCommunityGenres((prev) => [...prev, genre])}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all bg-soft text-caption hover:bg-dim"
                    >
                      {genre}
                    </button>
                  ))
                }
              </div>
              {newCommunityGenres.length > 0 && (
                <p className="text-xs text-primary mt-2">{newCommunityGenres.length} género(s) seleccionado(s)</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-hint hover:text-body transition-colors">Cancelar</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newCommunityName}
                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-dark transition-colors"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
