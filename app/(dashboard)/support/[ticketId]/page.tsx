import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTicketDetails } from "@/server/actions/support/supportActions";
import TicketChatClient from "./TicketChatClient";

export default async function TicketChatPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = await params;
  
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);

  const result = await getTicketDetails(resolvedParams.ticketId);

  if (!result.success || !result.ticket) {
    return (
      <div className="p-6 text-center text-danger font-bold mt-10">
        {result.error || "Ticket no encontrado"}
      </div>
    );
  }

  return (
    <TicketChatClient
      ticket={result.ticket}
      initialMessages={result.messages || []}
      currentUserId={result.currentUserId!}
      currentUserRole={currentUser?.role || "user"}
    />
  );
}
