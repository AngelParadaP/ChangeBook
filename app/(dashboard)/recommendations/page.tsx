"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getRecommendationLog } from "@/server/actions/feed/getRecommendationLog";
import { getCommunityRecommendationLog } from "@/server/actions/feed/getCommunityRecommendationLog";
import { getGenreAffinity } from "@/server/actions/feed/getGenreAffinity";
import {
  BarChart3, Brain, BookOpen, Clock, ArrowLeft, RefreshCw, Sparkles,
  TrendingUp, Users, Heart, ArrowLeftRight, MessageSquare, Star, ChevronDown
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface BookEntry {
  bookId: string;
  title: string;
  author: string;
  genres: string[];
  ownerUsername: string;
  similarityScore: number | null;
  matchScore: number;
  strategy: "vector" | "genre" | "recent";
}

interface BookLogData {
  userId: string;
  username: string;
  strategy: string;
  entries: BookEntry[];
  preferences: string[];
  hasVector: boolean;
}

interface CommunityEntry {
  communityId: string;
  name: string;
  description: string | null;
  genres: string[];
  ownerUsername: string;
  memberCount: number;
  similarityScore: number | null;
  matchScore: number;
  strategy: "vector" | "genre" | "popular";
}

interface CommunityLogData {
  entries: CommunityEntry[];
  hasVector: boolean;
  totalCommunities: number;
}

interface GenreAffinity {
  genre: string;
  score: number;
  sources: string[];
  breakdown: Record<string, { weight: number; count: number }>;
}

// ─── Source label / icons ────────────────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; color: string }> = {
  preferencias: { label: "Preferencias", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  favoritos:    { label: "Favoritos",    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
  intercambios: { label: "Intercambios", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  comunidades:  { label: "Comunidades",  color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  miembro:      { label: "Miembro",      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  actividad:    { label: "Actividad",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

// ─── Affinity Chart Component ────────────────────────────────────────────────
function AffinityChart({ affinities, label }: { affinities: GenreAffinity[]; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);

  if (!affinities || affinities.length === 0) return null;

  const totalPossibleScore = affinities.reduce((sum, a) => sum + a.score, 0);
  // Show top 5 or all if expanded
  const displayAffinities = expanded ? affinities : affinities.slice(0, 5);

  return (
    <div className="mb-6 bg-soft/50 rounded-xl border border-card-border/50 p-4">
      <h3 className="text-sm font-semibold text-heading mb-1 flex items-center gap-2">
        <TrendingUp size={14} className="text-primary" />
        {label}
      </h3>
      <p className="text-[11px] text-hint mb-3">
        Géneros con los que más interactúas, según tus favoritos, intercambios, comunidades y preferencias.
      </p>
      <div className="space-y-2">
        {displayAffinities.map((a) => {
          const pct = Math.round((a.score / totalPossibleScore) * 100);
          const isGenreExpanded = expandedGenre === a.genre;

          return (
            <div key={a.genre} className="group rounded-lg transition-colors p-1 -mx-1 hover:bg-soft/70 cursor-pointer" onClick={() => setExpandedGenre(isGenreExpanded ? null : a.genre)}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-caption w-36 truncate">{a.genre}</span>
                <div className="flex-1 bg-card rounded-full h-5 overflow-hidden border border-card-border/30">
                  <div
                    className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(pct, 8)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{pct}%</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-1 ml-[156px]">
                {a.sources.map(s => {
                  const meta = SOURCE_META[s];
                  if (!meta) return null;
                  return (
                    <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  );
                })}
              </div>

              {/* Breakdown Details */}
              {isGenreExpanded && (
                <div className="mt-2 ml-[156px] text-[11px] text-hint bg-card rounded-lg border border-card-border/50 p-2 space-y-1">
                  <p className="font-semibold text-caption mb-1">Desglose de interacciones:</p>
                  {Object.entries(a.breakdown).map(([source, data]) => {
                    const meta = SOURCE_META[source];
                    return (
                      <div key={source} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full inline-block ${meta?.color.split(' ')[0] || 'bg-gray-400'}`}></span>
                          {meta?.label || source}
                          {data.count > 0 && <span className="text-hint opacity-70 ml-0.5">({data.count})</span>}
                        </span>
                        <span className="font-medium text-caption">{data.weight} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {affinities.length > 5 && (
        <button 
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs w-full py-1.5 flex items-center justify-center text-primary/80 hover:text-primary transition-colors font-semibold"
        >
          {expanded ? "Ver menos" : `Ver todos (${affinities.length - 5} más)`}
        </button>
      )}
    </div>
  );
}

// ─── Score Badge ─────────────────────────────────────────────────────────────
function ScoreBadge({ entry }: { entry: { similarityScore: number | null; matchScore: number; strategy: string } }) {
  if (entry.strategy === "vector" && entry.similarityScore !== null) {
    return (
      <div>
        <p className="text-base font-bold text-primary dark:text-primary-muted">
          {(entry.similarityScore * 100).toFixed(1)}%
        </p>
        <p className="text-[10px] text-hint">similitud</p>
      </div>
    );
  }
  if (entry.strategy === "genre") {
    return (
      <div>
        <p className="text-base font-bold text-blue-600 dark:text-blue-400">{entry.matchScore}</p>
        <p className="text-[10px] text-hint">géneros</p>
      </div>
    );
  }
  return <p className="text-xs text-hint">Sin score</p>;
}

// ─── Background bar color ────────────────────────────────────────────────────
function barBg(strategy: string) {
  if (strategy === "vector") return "linear-gradient(90deg, #8b5cf6, #6366f1)";
  if (strategy === "genre") return "linear-gradient(90deg, #3b82f6, #06b6d4)";
  return "linear-gradient(90deg, #6b7280, #9ca3af)";
}

// ─── Strategy explanation for community entries ──────────────────────────────
function StrategyExplanation({ entry, userPrefs }: { entry: CommunityEntry; userPrefs: string[] }) {
  const matchingGenres = entry.genres.filter(g => userPrefs.includes(g));

  const isVectorHigh = entry.strategy === "vector" && entry.similarityScore !== null && entry.similarityScore >= 0.5;

  if (isVectorHigh) {
    return (
      <p className="text-[11px] text-primary dark:text-primary-muted mt-1 flex items-center gap-1">
        <Brain size={10} />
        Usuarios con gustos similares interactúan con esta comunidad
        {matchingGenres.length > 0 && (
          <span className="text-hint"> · Coincide: {matchingGenres.join(", ")}</span>
        )}
      </p>
    );
  }
  if (matchingGenres.length > 0) {
    return (
      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
        <BookOpen size={10} />
        Coincide con tus preferencias: {matchingGenres.join(", ")}
      </p>
    );
  }
  if (entry.strategy === "popular") {
    return (
      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
        <Users size={10} />
        Comunidad popular · {entry.memberCount} miembros
      </p>
    );
  }
  return null;
}

// ─── Strategy explanation for book entries ───────────────────────────────────
function BookStrategyExplanation({ entry, userPrefs }: { entry: BookEntry; userPrefs: string[] }) {
  const matchingGenres = entry.genres.filter(g => userPrefs.includes(g));

  const isVectorHigh = entry.strategy === "vector" && entry.similarityScore !== null && entry.similarityScore >= 0.5;

  if (isVectorHigh) {
    return (
      <p className="text-[11px] text-primary dark:text-primary-muted mt-1 flex items-center gap-1">
        <Brain size={10} />
        Usuarios con gustos similares leen este libro
        {matchingGenres.length > 0 && (
          <span className="text-hint"> · Coincide: {matchingGenres.join(", ")}</span>
        )}
      </p>
    );
  }
  if (matchingGenres.length > 0) {
    return (
      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
        <BookOpen size={10} />
        Coincide con tus preferencias: {matchingGenres.join(", ")}
      </p>
    );
  }
  if (entry.strategy === "recent") {
    return (
      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
        <Clock size={10} />
        Añadido recientemente al catálogo
      </p>
    );
  }
  return null;
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function RecommendationLogPage() {
  const { status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"books" | "communities">("books");
  const [bookData, setBookData] = useState<BookLogData | null>(null);
  const [communityData, setCommunityData] = useState<CommunityLogData | null>(null);
  const [bookAffinities, setBookAffinities] = useState<GenreAffinity[]>([]);
  const [communityAffinities, setCommunityAffinities] = useState<GenreAffinity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booksLimit, setBooksLimit] = useState(10);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookRes, commRes, affinityRes] = await Promise.all([
        getRecommendationLog(),
        getCommunityRecommendationLog(),
        getGenreAffinity(),
      ]);
      if (bookRes.success) setBookData(bookRes as unknown as BookLogData);
      if (commRes.success) setCommunityData(commRes as unknown as CommunityLogData);
      if (affinityRes.success) {
        setBookAffinities(affinityRes.bookAffinities || []);
        setCommunityAffinities(affinityRes.communityAffinities || []);
      }
      if (!bookRes.success && !commRes.success) setError(bookRes.error || "Error");
    } catch {
      setError("Error al cargar el log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") loadAll();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-6 h-full flex items-center justify-center">
        <div className="animate-spin"><RefreshCw size={32} className="text-primary" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-2xl shadow-sm p-6 h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const strategyLabel: Record<string, string> = {
    vector: "Similitud Vectorial (SVD)",
    genre: "Coincidencia de Géneros",
    recent: "Libros Recientes",
    popular: "Popularidad",
  };
  const strategyColor: Record<string, string> = {
    vector: "text-primary-soft0 bg-primary-soft dark:bg-primary-dark/20 border-primary-light dark:border-primary-dark",
    genre: "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    recent: "text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
    popular: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  };

  const currentStrategy = activeTab === "books"
    ? (bookData?.strategy || "recent")
    : (communityData?.hasVector ? "vector" : (bookData?.preferences?.length ? "genre" : "popular"));

  return (
    <div className="bg-card rounded-2xl shadow-sm p-6 overflow-y-auto custom-scrollbar h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.push("/home")} className="p-2 hover:bg-soft rounded-xl transition-all text-hint hover:text-heading">
            <ArrowLeft size={20} />
          </button>
          <div className="p-2.5 bg-gradient-to-br from-primary-soft to-blue-100 dark:from-primary-dark/30 dark:to-blue-900/30 rounded-xl">
            <BarChart3 size={24} className="text-primary dark:text-primary-muted" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-heading">Log de Recomendaciones</h1>
            {bookData && <p className="text-sm text-hint">@{bookData.username}</p>}
          </div>
          <button onClick={loadAll} className="ml-auto p-2.5 hover:bg-soft rounded-xl transition-all text-hint hover:text-heading" title="Recargar">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-soft/50 rounded-xl p-1 border border-card-border/30">
        <button
          onClick={() => setActiveTab("books")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "books" ? "bg-card text-heading shadow-sm" : "text-hint hover:text-caption"
          }`}
        >
          <BookOpen size={16} /> Libros
        </button>
        <button
          onClick={() => setActiveTab("communities")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "communities" ? "bg-card text-heading shadow-sm" : "text-hint hover:text-caption"
          }`}
        >
          <Users size={16} /> Comunidades
        </button>
      </div>

      {/* Strategy Card */}
      <div className={`rounded-xl border p-4 mb-6 ${strategyColor[currentStrategy] || strategyColor.recent}`}>
        <div className="flex items-center gap-3">
          <Brain size={20} />
          <div>
            <p className="font-semibold text-sm">Estrategia activa — {activeTab === "books" ? "Libros" : "Comunidades"}</p>
            <p className="text-lg font-bold">{strategyLabel[currentStrategy]}</p>
          </div>
          {(activeTab === "books" ? bookData?.hasVector : communityData?.hasVector) && (
            <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-primary-soft dark:bg-primary-dark/40 text-primary-dark dark:text-primary-light rounded-full text-xs font-semibold">
              <Sparkles size={12} /> Vector activo
            </span>
          )}
        </div>
      </div>

      {/* Preferences */}
      {bookData && bookData.preferences.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-hint mb-2">Tus preferencias de género</h3>
          <div className="flex flex-wrap gap-1.5">
            {bookData.preferences.map(pref => (
              <span key={pref} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold ring-1 ring-primary/20">
                {pref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ BOOKS TAB ═══════════ */}
      {activeTab === "books" && bookData && (
        <>
          <AffinityChart affinities={bookAffinities} label="Tu afinidad por géneros (libros)" />
          
          {/* Explanation box for books */}
          <div className="mb-6 bg-primary-soft dark:bg-primary-dark/10 rounded-xl border border-primary-light dark:border-primary-dark/30 p-4">
            <h4 className="text-sm font-semibold text-primary-dark dark:text-primary-muted mb-2 flex items-center gap-2">
              <Sparkles size={14} /> Criterios de Recomendación
            </h4>
            <ul className="text-xs text-primary dark:text-primary-light space-y-2 leading-relaxed list-none">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary-dark dark:text-primary-muted min-w-[70px]">1. Similitud:</span> 
                Se usa SVD (vectores) basándose en qué libros leen o intercambian usuarios con tus mismos gustos. A mayor porcentaje, mayor probabilidad te guste.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 dark:text-blue-400 min-w-[70px]">2. Géneros:</span> 
                Suma +1 punto por cada etiqueta del libro que coincide con tus "preferencias de género" agregadas a tu perfil. 
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-gray-500 dark:text-gray-400 min-w-[70px]">3. Recencia:</span> 
                Si apenas vas entrando o un usuario acaba de añadir libros pero no tenemos datos de él, te mostramos lo más novedoso orgánicamente.
              </li>
            </ul>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-heading mb-3">
              Ranking de libros recomendados ({bookData.entries.length})
            </h3>
          </div>
          <div className="space-y-2">
            {bookData.entries.slice(0, booksLimit).map((entry, idx) => {
              const maxScore = bookData.strategy === "vector"
                ? Math.max(...bookData.entries.filter(e => e.similarityScore !== null).map(e => Math.abs(e.similarityScore!)), 0.001)
                : Math.max(...bookData.entries.map(e => e.matchScore), 1);
              const barW = entry.strategy === "vector" && entry.similarityScore !== null
                ? (Math.abs(entry.similarityScore) / maxScore) * 100
                : (entry.matchScore / maxScore) * 100;
              return (
                <div key={entry.bookId} className="relative bg-soft/30 hover:bg-soft/60 rounded-xl border border-card-border/30 p-3 transition-all">
                  <div className="absolute inset-0 rounded-xl opacity-10" style={{ width: `${Math.max(barW, 2)}%`, background: barBg(entry.strategy) }} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-lg font-bold text-hint w-8 text-center shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading text-sm truncate">{entry.title}</p>
                      <p className="text-xs text-hint truncate">{entry.author} · @{entry.ownerUsername}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.genres.slice(0, 3).map(g => (
                          <span key={g} className="px-1.5 py-0.5 bg-card text-caption rounded text-[10px] font-medium ring-1 ring-card-border/30">{g}</span>
                        ))}
                        {entry.genres.length > 3 && <span className="text-[10px] text-hint">+{entry.genres.length - 3}</span>}
                      </div>
                      <BookStrategyExplanation entry={entry} userPrefs={bookData.preferences || []} />
                    </div>
                    <div className="text-right shrink-0"><ScoreBadge entry={entry} /></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button for Books */}
          {bookData.entries.length > booksLimit && (
            <button
               onClick={() => setBooksLimit((prev) => prev + 10)}
               className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-xs font-medium text-primary dark:text-primary-light hover:bg-primary-soft dark:hover:bg-primary-dark/10 rounded-xl transition-colors"
            >
               <ChevronDown size={16} />
               Cargar más libros ({bookData.entries.length - booksLimit} restantes)
            </button>
          )}

          {bookData.entries.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto text-hint mb-4" />
              <p className="text-hint">No hay libros para recomendar.</p>
            </div>
          )}
        </>
      )}

      {/* ═══════════ COMMUNITIES TAB ═══════════ */}
      {activeTab === "communities" && communityData && (
        <>
          <AffinityChart affinities={communityAffinities} label="Tu afinidad por géneros (comunidades)" />

          {/* Explanation box */}
          <div className="mb-6 bg-primary-soft dark:bg-primary-dark/10 rounded-xl border border-primary-light dark:border-primary-dark/30 p-4">
            <h4 className="text-sm font-semibold text-primary-dark dark:text-primary-muted mb-1 flex items-center gap-2">
              <Brain size={14} /> ¿Cómo se recomiendan las comunidades?
            </h4>
            <p className="text-xs text-primary dark:text-primary-light leading-relaxed">
              El sistema analiza comunidades donde usuarios con gustos similares a los tuyos participan.
              Se usa <strong>SVD (Descomposición en Valores Singulares)</strong> sobre una matriz de interacciones
              usuario-comunidad, generando vectores de embedding. Las comunidades más cercanas a tu vector
              se muestran primero. Si no hay vector, se usa coincidencia de géneros con tus preferencias.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-heading mb-3">
              Ranking de comunidades recomendadas ({communityData.entries.length} de {communityData.totalCommunities})
            </h3>
          </div>
          <div className="space-y-2">
            {communityData.entries.map((entry, idx) => {
              const maxScore = communityData.entries.some(e => e.similarityScore !== null)
                ? Math.max(...communityData.entries.filter(e => e.similarityScore !== null).map(e => Math.abs(e.similarityScore!)), 0.001)
                : Math.max(...communityData.entries.map(e => e.matchScore), 1);
              const barW = entry.strategy === "vector" && entry.similarityScore !== null
                ? (Math.abs(entry.similarityScore) / maxScore) * 100
                : (entry.matchScore / maxScore) * 100;
              return (
                <div key={entry.communityId} className="relative bg-soft/30 hover:bg-soft/60 rounded-xl border border-card-border/30 p-3 transition-all">
                  <div className="absolute inset-0 rounded-xl opacity-10" style={{ width: `${Math.max(barW, 2)}%`, background: barBg(entry.strategy) }} />
                  <div className="relative flex items-center gap-3">
                    <span className="text-lg font-bold text-hint w-8 text-center shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-heading text-sm truncate">{entry.name}</p>
                      <p className="text-xs text-hint truncate">@{entry.ownerUsername} · {entry.memberCount} miembros</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.genres.slice(0, 3).map(g => (
                          <span key={g} className="px-1.5 py-0.5 bg-card text-caption rounded text-[10px] font-medium ring-1 ring-card-border/30">{g}</span>
                        ))}
                        {entry.genres.length > 3 && <span className="text-[10px] text-hint">+{entry.genres.length - 3}</span>}
                      </div>
                      {/* Per-entry explanation */}
                      <StrategyExplanation entry={entry} userPrefs={bookData?.preferences || []} />
                    </div>
                    <div className="text-right shrink-0"><ScoreBadge entry={entry} /></div>
                  </div>
                </div>
              );
            })}
          </div>
          {communityData.entries.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-hint mb-4" />
              <p className="text-hint">No hay comunidades para recomendar.</p>
              <p className="text-xs text-hint mt-1">Ya eres miembro de todas las comunidades disponibles.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
