"use client";

import { useState, useRef, useEffect } from "react";
import { sendTicketMessage, closeTicket, getTicketMessages } from "@/server/actions/support/supportActions";
import { Toast } from "@/components/ui/Toast";
import { Send, Image as ImageIcon, CheckCircle, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";

export default function TicketChatClient({ ticket, initialMessages, currentUserId, currentUserRole }: { ticket: any, initialMessages: any[], currentUserId: string, currentUserRole: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(ticket.status);
  
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time con Pusher en lugar de Polling
  useEffect(() => {
    if (ticketStatus === "closed") return;

    let pusherClient: any;
    let channel: any;
    const channelName = `ticket-${ticket.id}`;

    import("@/lib/pusher").then((mod) => {
      pusherClient = mod.pusherClient;
      channel = pusherClient.subscribe(channelName);
      
      channel.bind("new-ticket-message", async () => {
        // Cuando llegue un nuevo mensaje, recargamos la lista
        try {
          const res = await getTicketMessages(ticket.id);
          if (res.success && res.messages) {
            setMessages(res.messages);
          }
        } catch (err) {}
      });
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [ticket.id, ticketStatus]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!content.trim() && !imageUrl) || ticketStatus === "closed") return;

    setIsSubmitting(true);
    try {
      const res = await sendTicketMessage(ticket.id, content, imageUrl);
      if (res.success) {
        {/* Optimistic UI update uses the original role array structure */}
        const newMessage = {
          id: Math.random().toString(),
          content,
          imageUrl,
          createdAt: new Date(),
          senderId: currentUserId,
          senderRole: currentUserRole,
          senderUsername: "Tú",
        };
        setMessages((prev) => [...prev, newMessage]);
        setContent("");
        setImageUrl(null);
      } else {
        setToast({ message: res.error || "Algo falló", type: "error" });
      }
    } catch {
      setToast({ message: "Error al enviar", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    const res = await closeTicket(ticket.id);
    if (res.success) {
      setTicketStatus("closed");
      setToast({ message: "Ticket cerrado exitosamente", type: "success" });
    } else {
      setToast({ message: res.error || "Error", type: "error" });
    }
  };

  const isClosed = ticketStatus === "closed";

  return (
    <div className="flex flex-col h-full bg-subtle">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="bg-card px-4 py-3 sm:px-6 sm:py-4 border-b border-card-border flex items-center justify-between shadow-sm z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-heading px-2 py-1 bg-subtle rounded-full border border-card-border uppercase">
              {ticket.type}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${ticketStatus === 'open' ? 'bg-primary/20 text-primary' : ticketStatus === 'closed' ? 'bg-hint/20 text-hint' : 'bg-orange-500/20 text-orange-500'}`}>
              {ticketStatus.toUpperCase()}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-heading leading-tight truncate max-w-[200px] sm:max-w-md">
            {ticket.title}
          </h1>
        </div>

        {/* Cierre de ticket, solo botón si es admin, el usuario solo lo usa / lo mira si está abierto o cerrado (visual gap) */}
        {!isClosed && currentUserRole === "admin" && (
          <button 
            onClick={handleCloseTicket}
            className="bg-card hover:bg-subtle text-hint hover:text-danger text-xs sm:text-sm font-bold border border-card-border px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <CheckCircle size={16} />
            <span className="hidden sm:inline">Cerrar Ticket</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === currentUserId;
          const isAdmin = msg.senderRole === "admin";
          
          return (
            <div key={msg.id || index} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                {isAdmin && !isMine && <ShieldCheck size={14} className="text-primary" />}
                <span className={`text-xs ${isAdmin ? "font-bold text-primary" : "text-hint"}`}>
                  {isMine ? "Tú" : (isAdmin && currentUserRole !== "admin") ? "Soporte Técnico" : `@${msg.senderUsername || 'Usuario'}`}
                </span>
                <span className="text-[10px] text-caption" suppressHydrationWarning>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                isMine 
                  ? "bg-primary text-white rounded-br-none" 
                  : isAdmin 
                    ? "bg-card border-l-4 border-primary text-heading rounded-bl-none"
                    : "bg-card border border-card-border text-heading rounded-bl-none"
              }`}>
                {(() => {
                  let text = msg.content || "";
                  let strikeCard: any = null;
                  
                  const strikeMatch = text.match(/^::STRIKE_CARD::(\{.*?\})(?:\n\n|\n)?([\s\S]*)$/);
                  if (strikeMatch) {
                    try {
                      strikeCard = JSON.parse(strikeMatch[1]);
                      text = strikeMatch[2];
                    } catch (e) {}
                  }

                  return (
                    <div className="space-y-2">
                      {strikeCard && (
                        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-danger mb-2">
                          <p className="font-bold text-xs uppercase mb-1 flex items-center gap-1">
                            <ShieldCheck size={14} /> Apelación a Sanción
                          </p>
                          <p className="text-xs opacity-90 mb-1" suppressHydrationWarning>Fecha del Reporte: {new Date(strikeCard.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm italic border-l-2 border-danger/40 pl-2 opacity-90 text-wrap break-words">
                            "{strikeCard.reason}"
                          </p>
                        </div>
                      )}
                      
                      {text && <p className="text-sm whitespace-pre-wrap break-words">{text}</p>}
                    </div>
                  );
                })()}
                
                {msg.imageUrl && (
                   <div className="mt-2 relative w-[240px] sm:w-[320px] max-w-full h-40 sm:h-64 rounded-xl overflow-hidden border border-white/20 shrink-0">
                     <Image src={msg.imageUrl} alt="Adjunto" fill className="object-cover" />
                   </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isClosed ? (
        <div className="p-4 bg-card border-t border-card-border text-center shrink-0">
          <p className="text-hint text-sm font-bold flex items-center justify-center gap-2">
            <CheckCircle size={16} />
            Este ticket ha sido cerrado
          </p>
        </div>
      ) : (
        <div className="p-3 sm:p-4 bg-card border-t border-card-border shrink-0">
          {imageUrl && (
            <div className="mb-2 relative w-24 h-24 rounded-lg overflow-hidden border border-card-border inline-block shadow-sm">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" />
              <button 
                onClick={() => setImageUrl(null)} 
                type="button"
                className="absolute top-1 right-1 bg-danger/80 backdrop-blur-sm text-white rounded-full p-1 border border-white/20 hover:bg-danger transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            
            <label className={`relative shrink-0 flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer border shadow-sm active:scale-95 ${
              isUploading 
                ? "bg-dim border-card-border pointer-events-none" 
                : "bg-subtle hover:bg-soft border-card-border text-hint hover:text-heading"
            }`}>
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon size={20} />
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={isUploading || isSubmitting}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsUploading(true);
                  const { uploadFiles } = await import("@/lib/uploadthing");
                  try {
                    const res = await uploadFiles("imageUploader", { files: [file] });
                    if (res && res[0]) {
                      setImageUrl((res[0] as any).ufsUrl || res[0].url);
                    }
                  } catch (err) {
                    setToast({ message: "Error al subir la imagen", type: "error" });
                  } finally {
                    setIsUploading(false);
                  }
                }}
              />
            </label>
            
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe un mensaje de soporte..."
              disabled={isSubmitting || isUploading}
              className="flex-1 bg-subtle border border-card-border rounded-xl px-4 py-2.5 sm:py-3 text-sm text-heading outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
            />
            
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !imageUrl) || isUploading}
              className="bg-gradient-to-r from-light-purple to-dark-purple hover:shadow-lg hover:shadow-purple-500/25 text-white p-2.5 sm:p-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
