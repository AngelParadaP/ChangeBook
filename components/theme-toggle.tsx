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

  const iconSrc = theme === "dark" ? "/icons/moon.svg" : "/icons/sun.svg";

  if (!mounted) {
    return (
      <button
        className={`${inline
            ? "p-2.5 rounded-xl"
            : "fixed bottom-4 right-4 p-3 rounded-full shadow-lg border border-card-border bg-card"
          } opacity-0`}
        aria-hidden="true"
      >
        <div className={inline ? "w-5 h-5" : "w-6 h-6"} />
      </button>
    );
  }

  if (inline) {
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2.5 hover:bg-soft rounded-xl transition-all group"
        aria-label="Cambiar tema"
      >
        <div
          className="w-5 h-5 bg-caption group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
          style={{
            maskImage: `url(${iconSrc})`,
            maskRepeat: "no-repeat",
            maskPosition: "center",
            maskSize: "contain",
            WebkitMaskImage: `url(${iconSrc})`,
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            WebkitMaskSize: "contain",
          }}
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="fixed bottom-4 right-4 p-3 rounded-full shadow-lg 
                 bg-card 
                 text-heading
                 border border-card-border
                 hover:scale-110 transition-all z-50 group"
      aria-label="Cambiar tema"
    >
      <div
        className="w-6 h-6 bg-body group-hover:bg-dark-purple dark:group-hover:bg-light-pink transition-colors duration-200"
        style={{
          maskImage: `url(${iconSrc})`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
          WebkitMaskImage: `url(${iconSrc})`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
        }}
      />
    </button>
  );
}
