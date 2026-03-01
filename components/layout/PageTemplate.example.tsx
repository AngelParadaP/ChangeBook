// TEMPLATE FOR NEW DASHBOARD PAGES
// Copy this file to create new pages like profile, search, etc.

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-yellowed-white dark:bg-background">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-light-purple dark:text-light-pink mx-auto mb-4" />
          <p className="text-caption text-lg">Cargando...</p>
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
        <h1 className="text-3xl font-bold text-heading mb-2">
          Your Page Title
        </h1>
        <p className="text-caption">
          Your page description
        </p>
      </div>

      {/* Example: Content Section */}
      <div className="space-y-6">
        {/* Add your components here */}
        <p className="text-heading">
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
