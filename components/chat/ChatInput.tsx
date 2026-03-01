"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-end gap-2 p-4 bg-card border-t border-card-border dark:border-card-border">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                disabled={disabled}
                rows={1}
                className="flex-1 px-4 py-2 rounded-xl border border-card-border dark:border-card-border bg-card text-heading focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple resize-none max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    minHeight: "40px",
                    maxHeight: "128px",
                }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "40px";
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                }}
            />
            <button
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className="px-6 py-2 bg-light-purple dark:bg-dark-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Enviar
            </button>
        </div>
    );
}
