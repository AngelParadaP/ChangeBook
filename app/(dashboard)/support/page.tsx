import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMyTickets, getMyStrikes } from "@/server/actions/support/supportActions";
import SupportClient from "./SupportClient";
import { Suspense } from "react";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const result = await getMyTickets();
  const initialTickets = result.tickets || [];
  
  const strikesResult = await getMyStrikes();
  const initialStrikes = strikesResult.strikes || [];

  return (
    <Suspense fallback={<div className="p-10 flex items-center justify-center text-hint">Cargando soporte...</div>}>
      <SupportClient initialTickets={initialTickets} initialStrikes={initialStrikes} />
    </Suspense>
  );
}
