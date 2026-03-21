"use client";

import { useState } from "react";
import { ShieldCheck, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AdminSupportClient({ initialTickets }: { initialTickets: any[] }) {
  const [tickets] = useState(initialTickets);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-primary/20 text-primary";
      case "in_progress": return "bg-orange-500/20 text-orange-500";
      case "resolved": return "bg-success/20 text-success";
      case "closed": return "bg-hint/20 text-hint";
      default: return "bg-hint/20 text-hint";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "appeal": return "Apelación";
      case "issue": return "Bug";
      default: return "Otro";
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 pb-24">
      
      <div className="bg-card rounded-2xl shadow-md overflow-hidden mb-6 flex items-center justify-between p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
        <div>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
            <ShieldCheck className="text-primary" size={28} />
            Mesa de Ayuda (Tickets)
          </h1>
          <p className="text-sm text-hint mt-1 max-w-md">
            Gestiona los reportes técnicos y apelaciones enviadas por los usuarios.
          </p>
        </div>
        <Image src="/images/logo_kyboo.png" alt="Kyboo" width={50} height={50} className="drop-shadow-lg opacity-80 mix-blend-screen" />
      </div>

      <div className="bg-card rounded-2xl shadow-md p-6 border border-card-border">
        <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2">
          Tickets Totales
          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-bold">
            {tickets.length}
          </span>
        </h2>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="mx-auto text-hint/50 mb-3" />
            <p className="text-body font-medium">Bandeja Vacía</p>
            <p className="text-xs text-hint">No se han emitido tickets de soporte todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link href={`/support/${ticket.id}`} key={ticket.id}>
                <div className="bg-subtle hover:bg-card-border border border-card-border rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm cursor-pointer mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-hint bg-card px-2 py-1 rounded-full shadow-sm">
                        {getTypeLabel(ticket.type)}
                      </span>
                      <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded">
                        @{ticket.username || "Usuario"}
                      </span>
                    </div>
                    <h3 className="font-bold text-heading">{ticket.title}</h3>
                    <p className="text-xs text-hint" suppressHydrationWarning>Creado: {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <ArrowRight size={20} className="text-hint shrink-0 ml-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
