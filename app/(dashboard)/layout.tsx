"use client";

import { SidebarProvider } from "@/components/layout/SidebarContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/components/layout/SidebarContext";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="h-screen bg-yellowed-white dark:bg-zinc-800 overflow-hidden">
      <Sidebar />

      <div
        className={`transition-all duration-300 h-screen flex flex-col ${
          isOpen ? "ml-65" : "ml-0"
        } p-3`}
      >
        <div className="mb-3 flex-shrink-0">
          <Navbar />
        </div>

        {/* Content area with custom scrollbar */}
        <div className="flex-1 overflow-hidden">
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
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: #d4a5f0;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #3f3f46;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-dark-pink);
          border-color: #3f3f46;
        }

        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-light-pink);
        }

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
