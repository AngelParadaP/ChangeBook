"use client";

import { useState, useEffect, useMemo } from "react";
import { createExchange } from "@/server/actions/exchanges/createExchange";
import { getBlockedDates } from "@/server/actions/exchanges/getBlockedDates";
import { Mailbox, CalendarDays, MapPin, MessageSquare, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";

interface BlockedRange {
    start: Date;
    end: Date;
    status: string;
}

interface ExchangeRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: string;
    bookTitle: string;
    ownerName: string;
    onSuccess?: () => void;
}

// Ubicaciones dentro de CUCEI
const CUCEI_LOCATIONS = [
    "Biblioteca CUCEI",
    "Edificio A - Planta baja",
    "Edificio B - Planta baja",
    "Edificio C - Planta baja",
    "Edificio D - Planta baja",
    "Edificio E - Planta baja",
    "Módulo de Matemáticas",
    "Módulo de Computación",
    "Módulo de Química",
    "Cafetería Central",
    "Explanada Principal",
    "Auditorio A",
    "Laboratorio de Cómputo",
    "Estacionamiento Principal",
    "Entrada Principal CUCEI",
];

export function ExchangeRequestModal({
    isOpen,
    onClose,
    bookId,
    bookTitle,
    ownerName,
    onSuccess,
}: ExchangeRequestModalProps) {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [meetingLocation, setMeetingLocation] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingEnd, setSelectingEnd] = useState(false);

    useEffect(() => {
        if (isOpen && bookId) {
            loadBlockedDates();
            // Reset form
            setStartDate(null);
            setEndDate(null);
            setMeetingLocation("");
            setNote("");
            setError("");
            setSuccess("");
            setSelectingEnd(false);
        }
    }, [isOpen, bookId]);

    const loadBlockedDates = async () => {
        const result = await getBlockedDates(bookId);
        if (result.success && result.blockedRanges) {
            setBlockedRanges(
                result.blockedRanges.map((r) => ({
                    start: new Date(r.start),
                    end: new Date(r.end),
                    status: r.status,
                }))
            );
        }
    };

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Verificar si una fecha está bloqueada
    const isDateBlocked = (date: Date): boolean => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return blockedRanges.some((range) => {
            const start = new Date(range.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(range.end);
            end.setHours(0, 0, 0, 0);
            return d >= start && d <= end;
        });
    };

    // Verificar si un rango chocaría con fechas bloqueadas
    const wouldRangeConflict = (start: Date, end: Date): boolean => {
        return blockedRanges.some((range) => {
            const rStart = new Date(range.start);
            rStart.setHours(0, 0, 0, 0);
            const rEnd = new Date(range.end);
            rEnd.setHours(0, 0, 0, 0);
            const s = new Date(start);
            s.setHours(0, 0, 0, 0);
            const e = new Date(end);
            e.setHours(0, 0, 0, 0);
            return s <= rEnd && e >= rStart;
        });
    };

    const handleDateClick = (date: Date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        if (d < today || isDateBlocked(d)) return;

        // Clear any previous error when user clicks a new date
        setError("");

        if (!selectingEnd || !startDate) {
            // Seleccionando fecha de inicio
            setStartDate(d);
            setEndDate(null);
            setSelectingEnd(true);
        } else {
            // Seleccionando fecha de fin
            if (d <= startDate) {
                // Si selecciona una fecha antes del inicio, reiniciar con esta como nuevo inicio
                setStartDate(d);
                setEndDate(null);
                setSelectingEnd(true);
                return;
            }

            // Verificar que el rango no choque con fechas bloqueadas
            if (wouldRangeConflict(startDate, d)) {
                setError("El rango seleccionado choca con otro intercambio existente. Selecciona otras fechas.");
                // Reset selection so user can re-pick
                setStartDate(null);
                setEndDate(null);
                setSelectingEnd(false);
                return;
            }

            // Máximo 30 días
            const diffDays = Math.ceil((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 30) {
                setError("El préstamo no puede ser mayor a 30 días. Selecciona otras fechas.");
                // Reset selection so user can re-pick
                setStartDate(null);
                setEndDate(null);
                setSelectingEnd(false);
                return;
            }

            setEndDate(d);
            setSelectingEnd(false);
            setError("");
        }
    };

    const isInRange = (date: Date): boolean => {
        if (!startDate || !endDate) return false;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d >= startDate && d <= endDate;
    };

    const isStartDate = (date: Date): boolean => {
        if (!startDate) return false;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === startDate.getTime();
    };

    const isEndDate = (date: Date): boolean => {
        if (!endDate) return false;
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === endDate.getTime();
    };

    // Generar días del calendario
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay(); // 0 = Domingo

        const days: (Date | null)[] = [];

        // Días vacíos al inicio
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Días del mes
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [currentMonth]);

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

    const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

    const handleSubmit = async () => {
        if (!startDate || !endDate) {
            setError("Debes seleccionar las fechas de entrega y devolución");
            return;
        }
        if (!meetingLocation) {
            setError("Debes seleccionar un lugar de entrega");
            return;
        }

        setLoading(true);
        setError("");

        const result = await createExchange({
            bookId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            meetingLocation,
            note: note || undefined,
        });

        if (result.success) {
            setSuccess(result.message || "¡Solicitud enviada!");
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } else {
            setError(result.error || "Error al enviar solicitud");
        }

        setLoading(false);
    };

    if (!isOpen) return null;

    const formatDate = (date: Date) =>
        date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 pb-4 border-b border-gray-100 dark:border-zinc-800 rounded-t-3xl z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                <Mailbox size={20} className="inline mr-1" /> Solicitar Intercambio
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium text-light-purple dark:text-light-pink">{bookTitle}</span>
                                {" · "}de {ownerName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Calendar */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                            <CalendarDays size={14} className="inline mr-1" /> Selecciona las fechas
                        </label>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                            {selectingEnd && startDate
                                ? `Inicio: ${formatDate(startDate)} — Ahora selecciona la fecha de devolución`
                                : "Haz clic en la fecha de inicio del préstamo"}
                        </p>

                        {/* Calendar Navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={prevMonth}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </span>
                            <button
                                onClick={nextMonth}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-600 dark:text-gray-400"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Day names */}
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {dayNames.map((day) => (
                                <div key={day} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((date, idx) => {
                                if (!date) {
                                    return <div key={`empty-${idx}`} className="h-9" />;
                                }

                                const d = new Date(date);
                                d.setHours(0, 0, 0, 0);
                                const isPast = d < today;
                                const blocked = isDateBlocked(d);
                                const inRange = isInRange(d);
                                const isStart = isStartDate(d);
                                const isEnd = isEndDate(d);
                                const disabled = isPast || blocked;

                                let className = "h-9 flex items-center justify-center text-sm rounded-lg transition-all ";

                                if (disabled) {
                                    className += blocked
                                        ? "bg-red-100 dark:bg-red-900/20 text-red-300 dark:text-red-700 cursor-not-allowed line-through"
                                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed";
                                } else if (isStart || isEnd) {
                                    className += "bg-gradient-to-r from-light-purple to-dark-purple text-white font-bold shadow-md";
                                } else if (inRange) {
                                    className += "bg-light-purple/20 dark:bg-dark-purple/20 text-light-purple dark:text-light-pink font-medium";
                                } else {
                                    className += "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300 cursor-pointer";
                                }

                                return (
                                    <button
                                        key={d.toISOString()}
                                        onClick={() => handleDateClick(d)}
                                        disabled={disabled}
                                        className={className}
                                        title={blocked ? "Fecha no disponible" : undefined}
                                    >
                                        {d.getDate()}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Date legend */}
                        <div className="flex gap-4 mt-3 text-[10px] text-gray-400 dark:text-gray-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
                                Ocupado
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded bg-gradient-to-r from-light-purple to-dark-purple" />
                                Tu selección
                            </div>
                        </div>
                    </div>

                    {/* Selected dates summary */}
                    {startDate && endDate && (
                        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800/30">
                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Desde:</span>{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(startDate)}</span>
                                </div>
                                <span className="text-light-purple dark:text-light-pink">→</span>
                                <div>
                                    <span className="text-gray-500 dark:text-gray-400">Hasta:</span>{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{formatDate(endDate)}</span>
                                </div>
                            </div>
                            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-1">
                                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} días de préstamo
                            </p>
                        </div>
                    )}

                    {/* Meeting Location */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            <MapPin size={14} className="inline mr-1" /> Lugar de entrega en CUCEI
                        </label>
                        <select
                            value={meetingLocation}
                            onChange={(e) => setMeetingLocation(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-700 dark:text-gray-300 text-sm"
                        >
                            <option value="">Selecciona un lugar...</option>
                            {CUCEI_LOCATIONS.map((loc) => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            <MessageSquare size={14} className="inline mr-1" /> Nota (opcional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ej. ¿Podemos vernos a las 2pm?"
                            rows={2}
                            maxLength={200}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-700 dark:text-gray-300 text-sm resize-none"
                        />
                        <p className="text-right text-[10px] text-gray-400 mt-1">{note.length}/200</p>
                    </div>

                    {/* Error/Success messages */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 border border-red-100 dark:border-red-800/30">
                            <AlertTriangle size={14} className="inline mr-1" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl p-3 border border-green-100 dark:border-green-800/30">
                            <CheckCircle2 size={14} className="inline mr-1" /> {success}
                        </div>
                    )}

                    {/* Submit button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !startDate || !endDate || !meetingLocation}
                        className="w-full py-3.5 bg-gradient-to-r from-light-purple to-dark-purple text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <><Mailbox size={16} className="inline mr-1" /> Enviar Solicitud</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
