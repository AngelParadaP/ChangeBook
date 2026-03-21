"use client";

import { useState } from "react";
import { createTicket } from "@/server/actions/support/supportActions";
import { Toast } from "@/components/ui/Toast";
import { Plus, LifeBuoy, AlertCircle, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SupportClient({ initialTickets }: { initialTickets: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState(initialTickets);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"issue" | "appeal" | "other">("issue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("openModal") === "true") {
      setIsModalOpen(true);
      const queryType = searchParams.get("type");
      if (queryType === "appeal" || queryType === "issue" || queryType === "other") {
        setType(queryType);
      }
      const queryTitle = searchParams.get("title");
      if (queryTitle) {
        setTitle(decodeURIComponent(queryTitle));
      }
      // Remove query params from url after processing
      router.replace("/support", { scroll: false });
    }
  }, [searchParams, router]);

  const handleCreateTicket = async () => {
    if (!title.trim() || !description.trim()) {
      setToast({ message: "Por favor llena los campos", type: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createTicket(title, description, type);
      if (result.success && result.ticket) {
        setToast({ message: "Ticket creado exitosamente", type: "success" });
        setTickets([result.ticket, ...tickets]);
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setType("issue");
        router.push(`/support/${result.ticket.id}`);
      } else {
        setToast({ message: result.error || "Algo falló", type: "error" });
      }
    } catch {
      setToast({ message: "Error", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

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
      case "issue": return "Problema Técnico";
      default: return "Otro";
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-card rounded-2xl shadow-md overflow-hidden mb-6 p-6 flex items-center justify-between border border-card-border">
        <div>
          <h1 className="text-2xl font-bold text-heading flex items-center gap-2">
            <LifeBuoy className="text-primary" size={28} />
            Centro de Soporte
          </h1>
          <p className="text-sm text-hint mt-1 max-w-md">
            Crea un ticket si tuviste un problema, un bug con la plataforma, o deseas apelar una penalización injusta de la administración.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-dark text-white font-bold rounded-xl px-5 py-3 transition-colors shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nuevo Ticket</span>
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-md p-6 border border-card-border">
        <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2">
          Mis Tickets
        </h2>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare size={48} className="mx-auto text-hint/50 mb-3" />
            <p className="text-body font-medium">No has creado ningún ticket de soporte</p>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl p-6 border border-card-border relative">
            <h2 className="text-xl font-bold text-heading mb-4">Abrir Ticket</h2>
            
            <label className="block text-sm font-bold text-heading mb-1">Motivo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "issue" | "appeal" | "other")}
              className="w-full bg-subtle border border-card-border rounded-xl p-3 mb-4 text-sm text-heading outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="issue">Tengo un problema con la App (Bug / Falla)</option>
              <option value="appeal">Deseo apelar una Sanción / Ban (Revisión)</option>
              <option value="other">Otro asunto de Administración</option>
            </select>

            <label className="block text-sm font-bold text-heading mb-1">Asunto</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-subtle border border-card-border rounded-xl p-3 mb-4 text-sm text-heading outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Ej: Problemas enviando mensajes"
            />

            <label className="block text-sm font-bold text-heading mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-subtle border border-card-border rounded-xl p-3 mb-5 text-sm text-heading outline-none focus:ring-1 focus:ring-primary focus:border-primary h-24 resize-none"
              placeholder="Describe detalladamente qué sucedió..."
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="flex-[0.5] bg-soft hover:bg-dim text-body font-bold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white hover:bg-primary-dark font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                Crear Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
