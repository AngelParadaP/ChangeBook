"use client";

import { useEffect, useState } from "react";
import { Toast } from "./Toast";

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

let listeners: ((toast: ToastState) => void)[] = [];

export function toast(message: string, type: ToastType = "success") {
  const newToast = { message, type, id: Date.now() };
  listeners.forEach((listener) => listener(newToast));
}

export function GlobalToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    const handleNewToast = (toast: ToastState) => {
      setToasts((prev) => [...prev, toast]);
    };

    listeners.push(handleNewToast);
    return () => {
      listeners = listeners.filter((l) => l !== handleNewToast);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
             <Toast
               message={t.message}
               type={t.type}
               onClose={() => removeToast(t.id)}
             />
        </div>
      ))}
    </div>
  );
}
