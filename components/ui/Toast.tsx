"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className={`px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 min-w-[300px] ${
          type === "success"
            ? "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700"
            : "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700"
        }`}
      >
        <span className="text-2xl">
          {type === "success" ? "✅" : "❌"}
        </span>
        <p
          className={`font-semibold ${
            type === "success"
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className={`ml-auto text-xl ${
            type === "success"
              ? "text-green-700 dark:text-green-400"
              : "text-red-700 dark:text-red-400"
          } hover:opacity-70`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
