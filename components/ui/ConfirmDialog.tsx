"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    variant?: "danger" | "warning";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Eliminar",
    cancelLabel = "Cancelar",
    isLoading = false,
    variant = "danger",
}: ConfirmDialogProps) {
    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const confirmColors =
        variant === "danger"
            ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
            : "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500";

    const iconColors =
        variant === "danger"
            ? "text-red-500 bg-red-50 dark:bg-red-900/20"
            : "text-amber-500 bg-amber-50 dark:bg-amber-900/20";

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) onClose();
            }}
        >
            <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full p-6 border border-card-border pointer-events-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4 mb-4">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconColors}`}>
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-heading mb-1">{title}</h3>
                        <div className="text-caption text-sm">{message}</div>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 bg-soft hover:bg-dim text-heading font-semibold rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 font-semibold rounded-xl transition-all focus:ring-2 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${confirmColors}`}
                    >
                        {isLoading ? "Eliminando..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
