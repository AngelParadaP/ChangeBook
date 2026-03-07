"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "./SidebarContext";
import { useEffect, useRef, useState } from "react";
import { getUnreadCount } from "@/server/actions/chat";
import { getPendingExchangeCount } from "@/server/actions/exchanges";

/* ─── helper: ícono SVG via máscara CSS (igual que en login/register) ─── */
function SvgIcon({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

// navItems moved inside component to access dynamic values

export function Sidebar() {
  const { isOpen, toggle, sidebarWidth } = useSidebar();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [exchangeCount, setExchangeCount] = useState(0);
  const isMobileRef = useRef(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth < 1024; };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Polling de mensajes no leídos (lógica original intacta) ── */
  useEffect(() => {
    loadUnreadCount();
    loadExchangeCount();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
      } else {
        loadUnreadCount();
        interval = setInterval(loadUnreadCount, 20000);
      }
    };

    interval = setInterval(() => {
      loadUnreadCount();
      loadExchangeCount();
    }, 20000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const loadUnreadCount = async () => {
    const result = await getUnreadCount();
    if (result.success && result.count !== undefined) {
      setUnreadCount(result.count);
    }
  };

  const loadExchangeCount = async () => {
    const result = await getPendingExchangeCount();
    if (result.success && result.count !== undefined) {
      setExchangeCount(result.count);
    }
  };

  const navItems = [
    { name: "Inicio", href: "/home", icon: "/icons/home.svg" },
    { name: "Chats", href: "/chat", icon: "/icons/chat.svg", badge: unreadCount },
    { name: "Publicar", href: "/publish", icon: "/icons/book-open.svg" },
    { name: "Intercambios", href: "/exchanges", icon: "/icons/exchange.svg", badge: exchangeCount },
    { name: "Favoritos", href: "/favorites", icon: "/icons/favoritos.svg" },
    { name: "Comunidades", href: "/communities", icon: "/icons/comunities.svg" },
    { name: "Mi Perfil", href: "/profile", icon: "/icons/user.svg" },
    { name: "Buscar", href: "/search", icon: "/icons/search.svg" },
  ];
  return (
    <>
      <aside
        className={`fixed left-0 top-0 bottom-0 z-[60] flex flex-col transition-all duration-300 rounded-r-3xl overflow-hidden shadow-2xl ${isOpen ? sidebarWidth : "w-0"
          }`}
        style={{
          background: "linear-gradient(160deg, var(--sidebar-gradient-start) 0%, var(--sidebar-gradient-mid) 50%, var(--sidebar-gradient-end) 100%)",
        }}
      >
        {/* Decorative blurred circle — top */}
        <div
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none opacity-10 blur-3xl"
          style={{ background: "var(--sidebar-text)" }}
        />
        {/* Decorative blurred circle — bottom */}
        <div
          className="absolute -bottom-16 -right-8 w-40 h-40 rounded-full pointer-events-none opacity-10 blur-3xl"
          style={{ background: "var(--sidebar-accent)" }}
        />

        {/* ── Logo ── */}
        <div className="px-5 pt-7 pb-5 border-b border-white/10 flex items-center gap-0.5">
          <Image
            src="/images/logo_kyboo.png"
            alt="Kyboo Logo"
            width={44}
            height={44}
            className="drop-shadow-lg -mr-0.5"
            priority
          />
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--sidebar-text)" }}
          >
            yboo
          </span>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isChatWithBadge =
              item.href === "/chat" && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar automatically on mobile after navigation
                  if (isMobileRef.current && isOpen) toggle();
                }}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                  ? "bg-white/15 border-l-2 border-light-pink"
                  : "hover:bg-white/8 border-l-2 border-transparent"
                  }`}
              >
                <SvgIcon
                  src={item.icon}
                  className={`w-5 h-5 transition-colors duration-200 ${isActive
                    ? "bg-light-pink"
                    : "bg-white/60 group-hover:bg-white/90"
                    }`}
                />
                <span
                  className={`font-semibold text-sm tracking-wide transition-colors duration-200 ${isActive ? "text-light-pink" : "text-white/75 group-hover:text-white"
                    }`}
                >
                  {item.name}
                </span>

                {/* Badge de notificaciones (chats/intercambios) */}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-light-pink animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Sign Out ── */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all duration-200 group hover:bg-red-500/15 border-l-2 border-transparent hover:border-red-400/50"
          >
            <SvgIcon
              src="/icons/log-out.svg"
              className="w-5 h-5 bg-white/50 group-hover:bg-red-400 transition-colors duration-200"
            />
            <span className="text-sm font-semibold text-white/60 group-hover:text-red-300 transition-colors duration-200">
              Salir
            </span>
          </button>
        </div>
      </aside>

      {/* Overlay móvil — cierra sidebar al tocar fuera */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={toggle}
        />
      )}
    </>
  );
}
