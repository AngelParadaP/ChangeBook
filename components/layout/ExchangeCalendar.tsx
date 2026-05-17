"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Loader2,
  CalendarDays,
  ArrowUpRight,
  X,
} from "lucide-react";
import { getCalendarExchanges, type CalendarExchange } from "@/server/actions/exchanges/getCalendarExchanges";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(date: Date, start: Date, end: Date) {
  const d = date.getTime();
  return d >= new Date(start).setHours(0, 0, 0, 0) && d <= new Date(end).setHours(23, 59, 59, 999);
}

/* ─── Status helpers ───────────────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  pendiente: {
    label: "Pendiente",
    dot: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  aceptado: {
    label: "Aceptado",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  en_curso: {
    label: "En curso",
    dot: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  completado: {
    label: "Completado",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  rechazado: {
    label: "Rechazado",
    dot: "bg-red-400",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  cancelado: {
    label: "Cancelado",
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

function getDotColor(status: string) {
  return STATUS_META[status]?.dot ?? "bg-zinc-400";
}

function getEventBarColor(status: string): string {
  const map: Record<string, string> = {
    pendiente: "bg-amber-400/80",
    aceptado: "bg-blue-500/80",
    en_curso: "bg-indigo-500/80",
    completado: "bg-emerald-500/80",
    rechazado: "bg-red-400/50",
    cancelado: "bg-zinc-400/40",
  };
  return map[status] ?? "bg-zinc-400/50";
}

/* ─── Component ────────────────────────────────────────────────────────────── */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

export function ExchangeCalendar({ isOpen, onClose, panelRef }: Props) {
  const router = useRouter();
  const today = new Date();

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [exchanges, setExchanges] = useState<CalendarExchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all");
  // Mobile: expand inline list instead of navigating
  const [showAllMobile, setShowAllMobile] = useState(false);

  // Load exchanges when panel opens
  useEffect(() => {
    if (isOpen && !loaded) {
      setLoading(true);
      getCalendarExchanges().then((result) => {
        if (result.success && result.exchanges) {
          setExchanges(result.exchanges);
        }
        setLoading(false);
        setLoaded(true);
      });
    }
  }, [isOpen, loaded]);

  // Reset mobile list toggle when day changes
  useEffect(() => {
    setShowAllMobile(false);
  }, [selectedDay]);

  /* ─── Calendar grid ── */
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  /* ─── Filter exchanges ── */
  const filteredExchanges = exchanges.filter((ex) => {
    if (activeFilter === "active") return ["pendiente", "aceptado", "en_curso"].includes(ex.status);
    if (activeFilter === "completed") return ["completado", "rechazado", "cancelado"].includes(ex.status);
    return true;
  });

  const dayExchanges = selectedDay
    ? filteredExchanges.filter((ex) => isInRange(selectedDay, ex.startDate, ex.endDate))
    : [];

  function getExchangesForDay(day: Date) {
    return filteredExchanges.filter((ex) => isInRange(day, ex.startDate, ex.endDate));
  }

  /* ─── Navigation ── */
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  /* ─── Exchange card ── */
  function ExchangeCard({ ex }: { ex: CalendarExchange }) {
    const meta = STATUS_META[ex.status] ?? { label: ex.status, badge: "bg-soft text-caption" };
    const startFmt = new Date(ex.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    const endFmt = new Date(ex.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

    return (
      <button
        onClick={() => {
          const tab =
            ex.status === "completado" || ex.status === "rechazado" || ex.status === "cancelado"
              ? "historial"
              : ex.status === "pendiente"
              ? ex.role === "owner" ? "recibidos" : "enviados"
              : "activos";
          router.push(`/exchanges?tab=${tab}`);
          onClose();
        }}
        className="w-full text-left"
      >
        <div className="flex gap-2.5 p-2.5 rounded-xl hover:bg-subtle transition-colors group border border-transparent hover:border-card-border">
          <div className={`w-1 rounded-full flex-shrink-0 ${getEventBarColor(ex.status)}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-heading truncate leading-tight">{ex.bookTitle}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${meta.badge}`}>
                {meta.label}
              </span>
            </div>
            <p className="text-[10px] text-hint truncate mt-0.5">
              {ex.bookAuthor}
              {ex.otherUserName && ` · ${ex.role === "owner" ? "Solicitado por" : "De"} ${ex.otherUserName}`}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {ex.meetingTime && (
                <span className="flex items-center gap-0.5 text-[9px] text-caption">
                  <Clock size={9} /> {ex.meetingTime}
                </span>
              )}
              <span className="flex items-center gap-0.5 text-[9px] text-caption">
                <Clock size={9} /> {startFmt} – {endFmt}
              </span>
              {ex.meetingLocation && (
                <span className="flex items-center gap-0.5 text-[9px] text-caption truncate">
                  <MapPin size={9} /> {ex.meetingLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={[
        // ── Mobile: fixed, centered, respects viewport
        "fixed left-1/2 -translate-x-1/2 top-[76px]",
        "w-[calc(100vw-24px)]",
        // ── Desktop (sm+): absolute anchored right, fixed width
        "sm:absolute sm:left-auto sm:translate-x-0 sm:top-auto sm:right-0 sm:mt-2 sm:w-[420px]",
        // ── Shared
        "bg-card border border-card-border rounded-2xl shadow-2xl overflow-hidden z-50",
        "animate-in fade-in slide-in-from-top-2 duration-200",
      ].join(" ")}
      style={{ maxHeight: "calc(100dvh - 96px)", overflowY: "auto" }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 pt-4 pb-3 border-b border-card-border"
        style={{ background: "linear-gradient(135deg, rgba(38,101,140,0.08), rgba(84,172,191,0.08))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary dark:text-light-pink" />
            <h3 className="font-bold text-sm text-heading">Calendario de Intercambios</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-soft transition-colors text-hint">
            <X size={14} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                activeFilter === f
                  ? "bg-primary dark:bg-light-pink text-white"
                  : "bg-soft text-caption hover:text-heading"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : "Completados"}
            </button>
          ))}
          <button
            onClick={goToday}
            className="ml-auto text-[11px] px-2.5 py-1 rounded-full font-medium bg-soft text-caption hover:text-heading transition-all"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* ── Month navigation ── */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-soft transition-colors text-caption hover:text-heading">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-heading capitalize">
          {MONTHS_ES[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-soft transition-colors text-caption hover:text-heading">
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Days of week header ── */}
      <div className="grid grid-cols-7 px-3 mb-1">
        {DAYS_ES.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-hint py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="grid grid-cols-7 px-3 gap-y-0.5 pb-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="h-12" />;

          const isToday = isSameDay(day, today);
          const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
          const dayExs = getExchangesForDay(day);
          const hasEvents = dayExs.length > 0;

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`relative h-12 flex flex-col items-center justify-start pt-1 rounded-xl transition-all text-xs font-medium group
                ${isSelected
                  ? "bg-primary dark:bg-light-pink text-white shadow-sm"
                  : isToday
                  ? "bg-primary/10 dark:bg-light-pink/10 text-primary dark:text-light-pink font-bold"
                  : "hover:bg-soft text-body"
                }
              `}
            >
              <span className="leading-none">{day.getDate()}</span>
              {hasEvents && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-[36px]">
                  {dayExs.slice(0, 3).map((ex) => (
                    <span
                      key={ex.id}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/80" : getDotColor(ex.status)}`}
                    />
                  ))}
                  {dayExs.length > 3 && (
                    <span className={`text-[8px] leading-none ${isSelected ? "text-white/70" : "text-hint"}`}>
                      +{dayExs.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-card-border" />

      {/* ── Day detail panel ── */}
      <div className="p-4">
        {selectedDay && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-heading">
                {DAYS_ES[selectedDay.getDay()]},{" "}
                {selectedDay.getDate()} de {MONTHS_ES[selectedDay.getMonth()]}
              </p>
              <p className="text-[10px] text-hint">
                {dayExchanges.length === 0
                  ? "Sin intercambios"
                  : `${dayExchanges.length} intercambio${dayExchanges.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {dayExchanges.length > 0 && (
              <>
                {/* Mobile: toggle para mostrar/ocultar lista inline */}
                <button
                  onClick={() => setShowAllMobile((prev) => !prev)}
                  className="sm:hidden flex items-center gap-1 text-[11px] text-primary dark:text-light-pink font-medium"
                >
                  {showAllMobile ? "Ocultar" : "Ver todos"}
                  <ArrowUpRight
                    size={11}
                    className={`transition-transform duration-200 ${showAllMobile ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Desktop: navegar a intercambios */}
                <button
                  onClick={() => { router.push("/exchanges"); onClose(); }}
                  className="hidden sm:flex items-center gap-1 text-[11px] text-primary dark:text-light-pink hover:underline font-medium"
                >
                  Ver todos <ArrowUpRight size={11} />
                </button>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-primary dark:text-light-pink" />
          </div>
        ) : dayExchanges.length === 0 ? (
          <div className="py-6 flex flex-col items-center gap-2 text-center">
            <CalendarDays size={28} className="text-hint" />
            <p className="text-xs text-hint">
              {selectedDay ? "No hay intercambios en este día" : "Selecciona un día"}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile: muestra preview (primeros 2) o lista expandida */}
            <div className="sm:hidden space-y-2">
              {(showAllMobile ? dayExchanges : dayExchanges.slice(0, 2)).map((ex) => (
                <ExchangeCard key={ex.id} ex={ex} />
              ))}
              {!showAllMobile && dayExchanges.length > 2 && (
                <button
                  onClick={() => setShowAllMobile(true)}
                  className="w-full text-center text-[11px] text-primary dark:text-light-pink font-medium py-1.5 rounded-lg hover:bg-soft transition-colors"
                >
                  +{dayExchanges.length - 2} más
                </button>
              )}
            </div>

            {/* Desktop: lista scrollable completa */}
            <div className="hidden sm:block space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-0.5">
              {dayExchanges.map((ex) => (
                <ExchangeCard key={ex.id} ex={ex} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-card-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-hint">
          {Object.entries(STATUS_META)
            .filter(([k]) => ["pendiente", "en_curso", "completado"].includes(k))
            .map(([k, v]) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                {v.label}
              </span>
            ))}
        </div>
        <button
          onClick={() => { router.push("/exchanges"); onClose(); }}
          className="text-[10px] font-medium text-primary dark:text-light-pink hover:underline"
        >
          Ir a intercambios →
        </button>
      </div>
    </div>
  );
}
