// TEMPLATE FOR NEW DASHBOARD PAGES
// Copy this file to create new pages like profile, search, etc.

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

function YourPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellowed-white dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📚</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      {/* YOUR CONTENT GOES HERE */}
      
      {/* Example: Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Your Page Title
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your page description
        </p>
      </div>

      {/* Example: Content Section */}
      <div className="space-y-6">
        {/* Add your components here */}
        <p className="text-gray-800 dark:text-gray-200">
          This container will automatically have:
          - Sidebar on the left (toggleable)
          - Navbar at the top
          - Custom pink scrollbar
          - Correct spacing and layout
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function YourPage() {
  return (
    <SidebarProvider>
      <YourPageContent />
    </SidebarProvider>
  );
}
