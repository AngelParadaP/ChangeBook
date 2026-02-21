"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useSidebar } from "./SidebarContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isOpen, sidebarMargin } = useSidebar();

  return (
    <div className="h-screen bg-yellowed-white dark:bg-zinc-800 overflow-hidden">
      <Sidebar />

      <div
        className={`transition-all duration-300 h-screen flex flex-col ${
          isOpen ? sidebarMargin : "ml-0"
        } p-3`}
      >
        {/* Navbar - Fixed height */}
        <div className="mb-3 flex-shrink-0">
          <Navbar />
        </div>

        {/* Content Container - Scrollable with custom scrollbar */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 18px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-yellowed-white);
          border-radius: 12px;
          margin: 8px 0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-dark-pink);
          border-radius: 12px;
          border: 3px solid var(--color-yellowed-white);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-pink);
          border-color: var(--color-yellowed-white);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #d4a5f0;
        }

        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #3f3f46;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-dark-pink);
          border-color: #3f3f46;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-pink);
          border-color: #3f3f46;
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: auto;
          scrollbar-color: var(--color-dark-pink) var(--color-yellowed-white);
        }

        .dark .custom-scrollbar {
          scrollbar-color: var(--color-dark-pink) #3f3f46;
        }
      `}</style>
    </div>
  );
}

