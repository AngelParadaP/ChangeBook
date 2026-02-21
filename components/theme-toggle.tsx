"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  inline?: boolean;
}

export function ThemeToggle({ inline = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!mounted) {
    if (inline) return <div className="p-3" />;
    return <div className="fixed bottom-4 right-4 p-5" />;
  }

  if (inline) {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
        aria-label="Cambiar tema"
      >
        <span className="text-2xl">{theme === "dark" ? "🌙" : "☀️"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg 
                 bg-white dark:bg-slate-800 
                 text-slate-900 dark:text-yellow-400 
                 border border-slate-200 dark:border-slate-700
                 hover:scale-110 transition-all z-50"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
