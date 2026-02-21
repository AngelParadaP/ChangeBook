"use client"

import { useSession } from "next-auth/react";
import { db } from "@/db";

export default function MiBoton() {
  const { data: session } = useSession();
  
  // Aquí también está disponible
  const userId = session?.user?.id; 
  
  
}