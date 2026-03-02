"use client";

import { useEffect, useState } from "react";
import { getNotifications, markAllNotificationsAsRead, deleteNotification, deleteAllNotifications, NotificationItem } from "@/server/actions/notifications";
import { acceptFriendRequest, declineFriendRequest } from "@/server/actions/friends";
import { getFriendUsernameFromRequest } from "@/server/actions/friends/getFriendUsernameFromRequest";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Loader2, BellOff, Check, XCircle, Trash2, Pin, UserPlus, UserCheck, UserMinus, Rocket, PartyPopper, Ban, Mailbox, RefreshCw, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications(50);
            if (res.success && res.notifications) {
                setNotifications(res.notifications);
                await markAllNotificationsAsRead();
            }
        } catch (error) {
            setToast({ message: "Error al cargar notificaciones", type: "error" });
        } finally {
            setLoading(false);
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
                        return; // do nothing if we can't find the user
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

    const notificationConfig: Record<string, { icon: React.ReactNode; color: string }> = {
        exchange_requested: { icon: <Mailbox size={20} />, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
        exchange_accepted: { icon: <CheckCircle2 size={20} />, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
        exchange_rejected: { icon: <XCircle size={20} />, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
        exchange_auto_rejected: { icon: <RefreshCw size={20} />, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
        exchange_started: { icon: <Rocket size={20} />, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
        exchange_completed: { icon: <PartyPopper size={20} />, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
        exchange_cancelled: { icon: <Ban size={20} />, color: "bg-soft text-caption" },
        friend_request: { icon: <UserPlus size={20} />, color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
        friend_accepted: { icon: <UserCheck size={20} />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
        friend_declined: { icon: <UserMinus size={20} />, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-heading">Notificaciones</h1>
                {notifications.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        className="px-4 py-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Borrar todas
                    </button>
                )}
            </div>

            <div className="bg-card shadow-md rounded-2xl overflow-hidden border border-card-border">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-hint">
                        <BellOff size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-xl">No tienes notificaciones</p>
                    </div>
                ) : (
                    <div className="divide-y divide-card-border dark:divide-zinc-800">
                        {notifications.map((notif) => {
                            const config = notificationConfig[notif.type] || { icon: <Pin size={20} />, color: "bg-soft text-caption" };
                            const isActioning = actionLoading === notif.id;

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-6 flex flex-col sm:flex-row gap-4 hover:bg-subtle transition-colors items-center cursor-pointer ${notif.isRead === 0 ? "bg-primary-soft/30 dark:bg-primary-dark/10" : ""}`}
                                >
                                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-lg text-heading font-medium leading-tight">
                                            {notif.message}
                                        </p>
                                        <p className="text-sm text-hint mt-1">
                                            {new Date(notif.createdAt).toLocaleDateString()} a las {new Date(notif.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-3">
                                        {notif.type === "friend_request" && notif.friendRequestId && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleAcceptFriend(notif.id, notif.friendRequestId as string); }}
                                                    disabled={isActioning}
                                                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={18} />
                                                    {isActioning ? "..." : "Aceptar"}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeclineFriend(notif.id, notif.friendRequestId as string); }}
                                                    disabled={isActioning}
                                                    className="bg-danger hover:bg-danger-dark text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle size={18} />
                                                    {isActioning ? "..." : "Rechazar"}
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(e, notif.id)}
                                            className="text-hint hover:text-danger p-2 rounded-full hover:bg-danger/10 transition-colors"
                                            title="Eliminar notificación"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
