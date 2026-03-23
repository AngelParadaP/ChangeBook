import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/support/guest-ticket
 * Permite crear un ticket de soporte sin sesión activa.
 * Se usa desde la página de login para usuarios suspendidos/baneados.
 * El ticket se crea asociado al admin del sistema ya que userId es NOT NULL,
 * pero el código del estudiante queda registrado en el título y descripción.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentCode, title, description, type } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "El asunto y la descripción son obligatorios." }, { status: 400 });
    }

    if (!studentCode?.trim()) {
      return NextResponse.json({ error: "Tu código de alumno es necesario para identificar tu caso." }, { status: 400 });
    }

    const validType = ["appeal", "issue", "other"].includes(type) ? type : "other";

    // Buscamos un admin en la DB para usarlo como userId (workaround sin migración)
    const [admin] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    if (!admin) {
      return NextResponse.json({ error: "No hay administradores disponibles. Intenta más tarde." }, { status: 500 });
    }

    // Prefijamos el título con el código para que el admin lo identifique
    const prefixedTitle = `[INVITADO: ${studentCode.trim()}] ${title.trim()}`;
    const fullDescription = `**Código de alumno del solicitante:** ${studentCode.trim()}\n\n${description.trim()}`;

    await db.insert(supportTickets).values({
      userId: admin.id,
      title: prefixedTitle,
      description: fullDescription,
      type: validType as "appeal" | "issue" | "other",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating guest ticket:", error);
    return NextResponse.json({ error: "Error inesperado al crear el ticket." }, { status: 500 });
  }
}
