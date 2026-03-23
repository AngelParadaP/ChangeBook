"use client";

import { useEffect, useState } from "react";
import { getNotifications, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications, NotificationItem } from "@/server/actions/notifications";
import { acceptFriendRequest, declineFriendRequest } from "@/server/actions/friends";
import { getFriendUsernameFromRequest } from "@/server/actions/friends/getFriendUsernameFromRequest";
import { getReviewContext } from "@/server/actions/reviews";
import { ReviewModal } from "@/components/reviews";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import {
    Loader2, BellOff, Check, XCircle, Trash2, Pin,
    UserPlus, UserCheck, UserMinus, Rocket, PartyPopper,
    Ban, Mailbox, RefreshCw, CheckCircle2, Bell, Calendar, Clock, MessageCircle, Star
} from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const router = useRouter();

    // Review modal state
    const [reviewModal, setReviewModal] = useState<{
        exchangeId: string;
        reviewedUserId: string;
        reviewedUserName: string;
        bookTitle: string;
        notificationId: string;
    } | null>(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications(50);
            if (res.success && res.notifications) {
                setNotifications(res.notifications);
            }
        } catch (error) {
            setToast({ message: "Error al cargar notificaciones", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
            setToast({ message: "Todas las notificaciones marcadas como leídas", type: "success" });
        } catch (error) {
            setToast({ message: "Error al marcar como leídas", type: "error" });
        }
    };

    const handleAcceptFriend = async (notifId: string, requestId: string) => {
        setActionLoading(notifId);
        try {
            const res = await acceptFriendRequest(requestId);
            if (res.success) {
                setToast({ message: "Solicitud aceptada", type: "success" });
                setNotifications((prev) => prev.filter((n) => n.id !== notifId));
                await deleteNotification(notifId);
            } else {
                setToast({ message: res.error || "Error", type: "error" });
            }
        } catch (error) {
            setToast({ message: "Error", type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineFriend = async (notifId: string, requestId: string) => {
        setActionLoading(notifId);
        try {
            const res = await declineFriendRequest(requestId);
            if (res.success) {
                setToast({ message: "Solicitud rechazada", type: "success" });
                setNotifications((prev) => prev.filter((n) => n.id !== notifId));
                await deleteNotification(notifId);
            } else {
                setToast({ message: res.error || "Error", type: "error" });
            }
        } catch (error) {
            setToast({ message: "Error", type: "error" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleDeleteAll = async () => {
        await deleteAllNotifications();
        setNotifications([]);
        setToast({ message: "Notificaciones eliminadas", type: "success" });
    };

    const handleNotificationClick = async (notif: NotificationItem) => {
        // Si es una notificación de review_request, abrir el modal de reseña
        if (notif.type === "review_request" && notif.exchangeId) {
            const result = await getReviewContext(notif.exchangeId);
            if (result.success && result.data) {
                if (result.data.alreadyReviewed) {
                    // Ya calificó: eliminar la notificación
                    await deleteNotification(notif.id);
                    setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                    setToast({ message: "Ya calificaste este intercambio", type: "success" });
                    return;
                }
                setReviewModal({ ...result.data, notificationId: notif.id });
            } else {
                setToast({ message: result.error || "Error al cargar datos de la reseña", type: "error" });
            }
            return;
        }

        let targetPath = `/exchanges?tab=activos`;
        switch (notif.type) {
            case "exchange_requested":
                targetPath = `/exchanges?tab=recibidos`;
                break;
            case "exchange_rejected":
            case "exchange_auto_rejected":
            case "exchange_completed":
            case "exchange_cancelled":
                targetPath = `/exchanges?tab=historial`;
                break;
            case "exchange_accepted":
            case "exchange_started":
            case "exchange_reminder_tomorrow":
            case "exchange_reminder_today":
                targetPath = `/exchanges?tab=activos`;
                break;
            case "friend_request":
            case "friend_accepted":
            case "friend_declined":
                if (notif.friendRequestId) {
                    const result = await getFriendUsernameFromRequest(notif.friendRequestId, notif.message);
                    if (result.success && result.username) {
                        targetPath = `/user/${result.username}`;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
                break;
            default:
                targetPath = `/exchanges?tab=activos`;
        }

        router.push(targetPath);
    };

    const notificationConfig: Record<string, { icon: React.ReactNode; color: string; gradient?: string }> = {
        exchange_requested: {
            icon: <Mailbox size={18} />,
            color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
        },
        exchange_accepted: {
            icon: <CheckCircle2 size={18} />,
            color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        },
        exchange_rejected: {
            icon: <XCircle size={18} />,
            color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        },
        exchange_auto_rejected: {
            icon: <RefreshCw size={18} />,
            color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        },
        exchange_started: {
            icon: <Rocket size={18} />,
            color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        },
        exchange_completed: {
            icon: <PartyPopper size={18} />,
            color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        },
        exchange_cancelled: {
            icon: <Ban size={18} />,
            color: "bg-soft text-caption",
        },
        exchange_reminder_tomorrow: {
            icon: <Calendar size={18} />,
            color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        },
        exchange_reminder_today: {
            icon: <Clock size={18} />,
            color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
            gradient: "from-red-500/5 to-orange-500/5 dark:from-red-500/10 dark:to-orange-500/10",
        },
        friend_request: {
            icon: <UserPlus size={18} />,
            color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
        },
        friend_accepted: {
            icon: <UserCheck size={18} />,
            color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        },
        friend_declined: {
            icon: <UserMinus size={18} />,
            color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        },
        strike_received: {
            icon: <XCircle size={18} />,
            color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        },
        review_request: {
            icon: <Star size={18} />,
            color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        },
    };

    const unreadCount = notifications.filter((n) => n.isRead === 0).length;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header – sticky on mobile */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-card-border/50">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bell size={20} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-heading truncate">Notificaciones</h1>
                            {notifications.length > 0 && (
                                <p className="text-xs text-hint">
                                    {unreadCount > 0
                                        ? `${unreadCount} sin leer · ${notifications.length} total`
                                        : `${notifications.length} notificaciones`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                                    title="Marcar todas como leídas"
                                >
                                    <CheckCircle2 size={14} />
                                    <span className="hidden sm:inline">Marcar leídas</span>
                                </button>
                            )}
                            <button
                                onClick={handleDeleteAll}
                                className="px-3 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                                title="Borrar todas"
                            >
                                <Trash2 size={14} />
                                <span className="hidden sm:inline">Borrar todas</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications list – scrollable */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-full bg-soft flex items-center justify-center mb-4">
                            <BellOff size={36} className="text-hint opacity-50" />
                        </div>
                        <p className="text-lg font-semibold text-heading">No tienes notificaciones</p>
                        <p className="text-sm text-hint mt-1">Cuando tengas actividad nueva, aparecerá aquí</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const config = notificationConfig[notif.type] || { icon: <Pin size={18} />, color: "bg-soft text-caption" };
                        const isActioning = actionLoading === notif.id;
                        const isUnread = notif.isRead === 0;
                        const isReminder = notif.type === "exchange_reminder_tomorrow" || notif.type === "exchange_reminder_today";

                        return (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`
                                    relative rounded-2xl border transition-all duration-200 cursor-pointer
                                    hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                                    ${isUnread
                                        ? "bg-primary-soft/20 border-primary/20 dark:bg-primary-dark/10 dark:border-primary/15"
                                        : "bg-card/60 border-card-border/50 hover:bg-card"
                                    }
                                    ${config.gradient ? `bg-gradient-to-r ${config.gradient}` : ""}
                                `}
                            >
                                {/* Unread indicator dot */}
                                {isUnread && (
                                    <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                )}

                                <div className="p-3 sm:p-4 flex gap-3 items-start">
                                    {/* Icon */}
                                    <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${config.color}`}>
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm sm:text-[15px] leading-relaxed ${isUnread ? "text-heading font-semibold" : "text-body"}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[11px] text-hint mt-1.5">
                                            {new Date(notif.createdAt).toLocaleDateString("es-MX", {
                                                day: "numeric",
                                                month: "short",
                                            })}{" "}
                                            a las{" "}
                                            {new Date(notif.createdAt).toLocaleTimeString("es-MX", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>

                                        {/* Reminder UX hint */}
                                        {isReminder && (
                                            <div className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 inline-block">
                                                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                                    <MessageCircle size={12} className="flex-shrink-0" /> Pónganse de acuerdo para la hora y lugar de recogida
                                                </p>
                                            </div>
                                        )}

                                        {/* Friend request actions */}
                                        {notif.type === "friend_request" && notif.friendRequestId && (
                                            <div className="flex items-center gap-2 mt-2.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAcceptFriend(notif.id, notif.friendRequestId as string); }}
                                                    disabled={isActioning}
                                                    className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={14} />
                                                    {isActioning ? "..." : "Aceptar"}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeclineFriend(notif.id, notif.friendRequestId as string); }}
                                                    disabled={isActioning}
                                                    className="bg-danger hover:bg-danger-dark text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={14} />
                                                    {isActioning ? "..." : "Rechazar"}
                                                </button>
                                            </div>
                                        )}

                                        {/* Review request action */}
                                        {notif.type === "review_request" && notif.exchangeId && (
                                            <div className="mt-2.5">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const result = await getReviewContext(notif.exchangeId!);
                                                        if (result.success && result.data) {
                                                            if (result.data.alreadyReviewed) {
                                                                await deleteNotification(notif.id);
                                                                setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
                                                                setToast({ message: "Ya calificaste este intercambio", type: "success" });
                                                                return;
                                                            }
                                                            setReviewModal({ ...result.data, notificationId: notif.id });
                                                        } else {
                                                            setToast({ message: result.error || "Error al cargar datos", type: "error" });
                                                        }
                                                    }}
                                                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-400/20"
                                                >
                                                    <Star size={14} />
                                                    Calificar experiencia
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDelete(e, notif.id)}
                                        className="shrink-0 text-hint hover:text-danger p-1.5 rounded-full hover:bg-danger/10 transition-colors mt-0.5"
                                        title="Eliminar notificación"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Review Modal — opened from review_request notifications */}
            {reviewModal && (
                <ReviewModal
                    isOpen={true}
                    onClose={() => setReviewModal(null)}
                    exchangeId={reviewModal.exchangeId}
                    reviewedUserId={reviewModal.reviewedUserId}
                    reviewedUserName={reviewModal.reviewedUserName}
                    bookTitle={reviewModal.bookTitle}
                    onReviewSubmitted={async () => {
                        // Auto-eliminar la notificación después de calificar
                        await deleteNotification(reviewModal.notificationId);
                        setNotifications((prev) => prev.filter((n) => n.id !== reviewModal.notificationId));
                        loadNotifications();
                    }}
                />
            )}
        </div>
    );
}
