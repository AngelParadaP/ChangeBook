"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import { getUnreadCount } from "@/server/actions/chat";

export function Sidebar() {
  const { isOpen, sidebarWidth } = useSidebar();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar conteo de mensajes no leídos
  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Polling optimizado con Page Visibility API
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
      } else {
        loadUnreadCount();
        interval = setInterval(loadUnreadCount, 20000); // 20 segundos para badge
      }
    };

    interval = setInterval(loadUnreadCount, 20000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadUnreadCount = async () => {
    const result = await getUnreadCount();
    if (result.success && result.count !== undefined) {
      setUnreadCount(result.count);
    }
  };

  const navItems = [
    { name: "Inicio", href: "/home", icon: "🏠" },
    { name: "Chats", href: "/chat", icon: "💬", badge: unreadCount },
    { name: "Publicar", href: "/publish", icon: "📚" },
    { name: "Lista de espera", href: "/waitlist", icon: "🕐" },
    { name: "Comunidades", href: "/communities", icon: "👥" },
    { name: "Mi Perfil", href: "/profile", icon: "👤" },
    { name: "Buscar", href: "/search", icon: "🔍" },
  ];

  return (
    <>
      {/* Sidebar - Flush left with rounded right corners */}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-light-purple dark:bg-dark-purple text-white transition-all duration-300 z-40 flex flex-col rounded-r-[2rem] shadow-lg ${isOpen ? sidebarWidth : "w-0"
          } overflow-hidden`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 justify-center items-center">
            <div className="text-5xl">📖</div>
            <div className="flex flex-col justify-center items-center">
              <span className="text-xl font-bold tracking-wide">KYBOO</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                  ? "bg-white/20 shadow-lg"
                  : "hover:bg-white/10 hover:translate-x-1"
                  }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-lg">{item.name}</span>

                {/* Indicador de notificación - simple punto rojo */}
                {item.badge !== undefined && item.badge > 0 && (
                  <div className="absolute top-1 right-2 bg-red-500 rounded-full w-3 h-3 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
          >
            <span className="text-2xl">🚪</span>
            <span className="font-medium text-lg">Salir</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when open */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => { }}
        />
      )}
    </>
  );
}
