import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminTickets } from "@/server/actions/support/supportActions";
import AdminSupportClient from "./AdminSupportClient";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminSupportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user?.role !== "admin") {
    redirect("/home"); // No es admin
  }

  const result = await getAdminTickets();
  const initialTickets = (result.success && result.tickets) ? result.tickets : [];

  return <AdminSupportClient initialTickets={initialTickets} />;
}
