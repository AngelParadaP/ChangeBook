"use client";

import { createContext, useContext, useState, ReactNode } from "react";

/**
 * SIDEBAR WIDTH CONFIGURATION
 * 
 * To change the sidebar width, update BOTH values below:
 * - SIDEBAR_WIDTH: The width class (e.g., w-52, w-60, w-64, w-72)
 * - SIDEBAR_WIDTH_ML: The corresponding margin-left (e.g., ml-52, ml-60, ml-64, ml-72)
 * 
 * All components will automatically adapt to the new width!
 */
const SIDEBAR_WIDTH = "w-65"; // Current: 240px (15rem)
const SIDEBAR_WIDTH_ML = "ml-65"; // Must match SIDEBAR_WIDTH

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  sidebarWidth: string;
  sidebarMargin: string;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider 
      value={{ 
        isOpen, 
        toggle, 
        sidebarWidth: SIDEBAR_WIDTH,
        sidebarMargin: SIDEBAR_WIDTH_ML 
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

