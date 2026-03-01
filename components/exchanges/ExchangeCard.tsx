"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExchangeWithDetails } from "@/server/actions/exchanges/getExchanges";
import { updateExchangeStatus } from "@/server/actions/exchanges/updateExchange";
import { isValidImageUrl } from "@/lib/utils/imageValidation";

interface ExchangeCardProps {
    exchange: ExchangeWithDetails;
    currentUserId: string;
    onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pendiente: {
        label: "Pendiente",
        color: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
        icon: "⏳",
    },
    aceptado: {
        label: "Aceptado",
        color: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
        icon: "✅",
    },
    rechazado: {
        label: "Rechazado",
        color: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
        icon: "❌",
    },
    en_curso: {
        label: "En curso",
        color: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
        icon: "📖",
    },
    completado: {
        label: "Completado",
        color: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
        icon: "🎉",
    },
    cancelado: {
        label: "Cancelado",
        color: "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400",
        icon: "🚫",
    },
};

/* ─── Confirmation Modal ─────────────────────────────────────────────────────── */
function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    loading,
    icon,
    title,
    description,
    confirmLabel,
    confirmColor,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    icon: string;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: string;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-5">
                    <div className="text-4xl mb-3">{icon}</div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {description}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors text-gray-700 dark:text-gray-200 text-sm"
                    >
                        Volver
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors text-sm disabled:opacity-50 ${confirmColor}`}
                    >
                        {loading ? "Procesando..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ExchangeCard({ exchange, currentUserId, onUpdate }: ExchangeCardProps) {
    const [loading, setLoading] = useState(false);
    const [showNote, setShowNote] = useState(false);
    const [ownerNote, setOwnerNote] = useState("");
    const [imgError, setImgError] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Confirmation modal states
    const [confirmModal, setConfirmModal] = useState<{
        action: "en_curso" | "completado" | "cancelado";
        icon: string;
        title: string;
        description: string;
        confirmLabel: string;
        confirmColor: string;
    } | null>(null);

    const isOwner = exchange.ownerId === currentUserId;
    const isRequester = exchange.requesterId === currentUserId;
    const config = statusConfig[exchange.status] || statusConfig.pendiente;

    const otherUser = isOwner
        ? { name: exchange.requesterName, username: exchange.requesterUsername, imageURL: exchange.requesterImageURL }
        : { name: exchange.ownerName, username: exchange.ownerUsername, imageURL: exchange.ownerImageURL };

    const validBookImage = exchange.bookImageUrl && isValidImageUrl(exchange.bookImageUrl) && !imgError;

    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

    const handleAction = async (action: "aceptado" | "rechazado" | "en_curso" | "completado" | "cancelado") => {
        setLoading(true);
        setActionError(null);
        const result = await updateExchangeStatus(exchange.id, action, ownerNote || undefined);
        if (result.success) {
            setConfirmModal(null);
            onUpdate();
        } else {
            setActionError(result.error || "Error al actualizar el intercambio");
            setConfirmModal(null);
            setTimeout(() => setActionError(null), 5000);
        }
        setLoading(false);
    };

    const openConfirm = (
        action: "en_curso" | "completado" | "cancelado",
        icon: string,
        title: string,
        description: string,
        confirmLabel: string,
        confirmColor: string
    ) => {
        setConfirmModal({ action, icon, title, description, confirmLabel, confirmColor });
    };

    // Calcular días restantes
    const now = new Date();
    const endDate = new Date(exchange.endDate);
    const startDate = new Date(exchange.startDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <>
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/50 p-4 hover:shadow-md transition-all duration-300 group">
                <div className="flex gap-4">
                    {/* Book Image */}
                    <Link href={`/books/${exchange.bookId}`} className="flex-shrink-0">
                        <div className="w-16 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-900 dark:to-purple-800 relative shadow-sm group-hover:shadow-md transition-shadow">
                            {validBookImage ? (
                                <Image
                                    src={exchange.bookImageUrl}
                                    alt={exchange.bookTitle}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                            )}
                        </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <Link
                                    href={`/books/${exchange.bookId}`}
                                    className="font-bold text-gray-800 dark:text-gray-100 hover:text-light-purple dark:hover:text-light-pink transition-colors truncate block text-sm"
                                >
                                    {exchange.bookTitle}
                                </Link>
                                <p className="text-xs text-gray-400 dark:text-gray-500">{exchange.bookAuthor}</p>
                            </div>

                            {/* Status Badge */}
                            <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${config.color}`}>
                                {config.icon} {config.label}
                            </span>
                        </div>

                        {/* Other user */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {isOwner ? "Solicitado por" : "Dueño"}: {" "}
                                <Link
                                    href={`/user/${otherUser.username}`}
                                    className="font-semibold text-light-purple dark:text-light-pink hover:underline"
                                >
                                    @{otherUser.username}
                                </Link>
                            </div>
                        </div>

                        {/* Dates & Location */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[10px] bg-gray-50 dark:bg-zinc-700/50 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                                📅 {formatDate(exchange.startDate)} → {formatDate(exchange.endDate)}
                            </span>
                            <span className="text-[10px] bg-gray-50 dark:bg-zinc-700/50 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                                📍 {exchange.meetingLocation}
                            </span>
                            {(exchange.status === "en_curso" || exchange.status === "aceptado") && (
                                <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${daysLeft <= 2
                                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                    : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                    }`}>
                                    ⏰ {daysLeft > 0 ? `${daysLeft} días restantes` : "¡Vence hoy!"}
                                </span>
                            )}
                        </div>

                        {/* Notes */}
                        {exchange.requesterNote && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                                💬 &ldquo;{exchange.requesterNote}&rdquo;
                            </p>
                        )}
                        {exchange.ownerNote && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">
                                💬 Respuesta: &ldquo;{exchange.ownerNote}&rdquo;
                            </p>
                        )}

                        {/* Progress bar for active exchanges */}
                        {(exchange.status === "en_curso" || exchange.status === "aceptado") && (
                            <div className="mt-3">
                                <div className="h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-light-purple to-dark-purple rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(100, Math.max(5, ((totalDays - daysLeft) / totalDays) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {/* Owner actions for pending exchanges */}
                            {isOwner && exchange.status === "pendiente" && (
                                <>
                                    <button
                                        onClick={() => setShowNote(!showNote)}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                                    >
                                        💬 Nota
                                    </button>
                                    <button
                                        onClick={() => handleAction("aceptado")}
                                        disabled={loading}
                                        className="px-3 py-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        ✅ Aceptar
                                    </button>
                                    <button
                                        onClick={() => handleAction("rechazado")}
                                        disabled={loading}
                                        className="px-3 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        ❌ Rechazar
                                    </button>
                                </>
                            )}

                            {/* Mark as in-progress (owner only) — with confirmation */}
                            {isOwner && exchange.status === "aceptado" && (
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            "en_curso",
                                            "🚀",
                                            "¿Iniciar intercambio?",
                                            `Se marcará como "en curso" el intercambio de "${exchange.bookTitle}" con @${otherUser.username}. Esto significa que el libro ya fue entregado.`,
                                            "Sí, iniciar",
                                            "bg-blue-500 hover:bg-blue-600"
                                        )
                                    }
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    🚀 Iniciar Intercambio
                                </button>
                            )}

                            {/* Complete exchange (owner only) — with confirmation */}
                            {isOwner && exchange.status === "en_curso" && (
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            "completado",
                                            "🎉",
                                            "¿Completar intercambio?",
                                            `Se marcará como completado el intercambio de "${exchange.bookTitle}". Confirma que el libro ha sido devuelto exitosamente.`,
                                            "Sí, completar",
                                            "bg-gradient-to-r from-light-purple to-dark-purple hover:shadow-md"
                                        )
                                    }
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-light-purple to-dark-purple text-white rounded-lg transition-all hover:shadow-md disabled:opacity-50"
                                >
                                    🎉 Completar
                                </button>
                            )}

                            {/* Cancel for pendiente — no confirmation needed */}
                            {exchange.status === "pendiente" && (
                                <button
                                    onClick={() => handleAction("cancelado")}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            )}

                            {/* Cancel for aceptado — with confirmation */}
                            {exchange.status === "aceptado" && (
                                <button
                                    onClick={() =>
                                        openConfirm(
                                            "cancelado",
                                            "⚠️",
                                            "¿Cancelar intercambio aceptado?",
                                            `Este intercambio de "${exchange.bookTitle}" ya fue aceptado. Al cancelarlo, la otra persona será notificada y las fechas se liberarán. ¿Estás seguro?`,
                                            "Sí, cancelar",
                                            "bg-red-500 hover:bg-red-600"
                                        )
                                    }
                                    disabled={loading}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>

                        {/* Owner note input */}
                        {showNote && (
                            <div className="mt-2">
                                <textarea
                                    value={ownerNote}
                                    onChange={(e) => setOwnerNote(e.target.value)}
                                    placeholder="Escribe una nota de respuesta..."
                                    rows={2}
                                    maxLength={200}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple resize-none"
                                />
                            </div>
                        )}

                        {/* Error message */}
                        {actionError && (
                            <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    ⚠️ {actionError}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal !== null}
                onClose={() => setConfirmModal(null)}
                onConfirm={() => confirmModal && handleAction(confirmModal.action)}
                loading={loading}
                icon={confirmModal?.icon || ""}
                title={confirmModal?.title || ""}
                description={confirmModal?.description || ""}
                confirmLabel={confirmModal?.confirmLabel || ""}
                confirmColor={confirmModal?.confirmColor || ""}
            />
        </>
    );
}
