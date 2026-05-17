"use client";

import { useState } from "react";
import { dismissReportAction, applyStrikeAction } from "@/server/actions/admin/adminActions";
import { Toast } from "@/components/ui/Toast";
import { ShieldCheck, UserX, AlertTriangle, Loader2, Headphones } from "lucide-react";
import Image from "next/image";

import Link from "next/link";

export default function AdminDashboardClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports);
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // reportId
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleDismiss = async (reportId: string) => {
    setLoadingAction(reportId);
    try {
      const res = await dismissReportAction(reportId);
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setToast({ message: "Reporte descartado", type: "success" });
      } else {
        setToast({ message: res.error || "A ocurrido un error", type: "error" });
      }
    } catch (e) {
      setToast({ message: "Error inesperado", type: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApplyStrike = async (reportId: string, reportedId: string) => {
    setLoadingAction(reportId);
    try {
      const res = await applyStrikeAction(reportId, reportedId);
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setToast({ message: res.message || "Strike aplicado", type: "success" });
      } else {
        setToast({ message: res.error || "A ocurrido un error", type: "error" });
      }
    } catch (e) {
      setToast({ message: "Error inesperado", type: "error" });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 sm:p-6 pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-card rounded-2xl shadow-md overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-heading flex items-center gap-2">
              <ShieldCheck className="text-danger shrink-0" size={26} />
              Panel de Administración
            </h1>
            <p className="text-sm text-hint mt-1">
              Revisa los reportes y modera a tus usuarios responsablemente.
            </p>
          </div>

          {/* Derecha: logo arriba, botón soporte abajo en móvil; en fila en desktop */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
            <Image
              src="/images/logo_kyboo.png"
              alt="Kyboo"
              width={46}
              height={46}
              className="drop-shadow-lg opacity-80 mix-blend-screen"
            />
            <Link
              href="/admin/support"
              title="Ir a Soporte"
              className="group flex items-center gap-2 bg-card/80 hover:bg-card border border-card-border hover:border-indigo-400/60 text-hint hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl px-3 py-2 sm:py-2.5 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Headphones size={16} className="transition-transform group-hover:scale-110" />
              <span className="text-xs font-semibold">Soporte</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2">
          Reportes Pendientes
          <span className="bg-danger/10 text-danger text-xs px-2 py-1 rounded-full font-bold">
            {reports.length}
          </span>
        </h2>

        {reports.length === 0 ? (
          <div className="text-center py-16">
            <ShieldCheck size={48} className="mx-auto text-success/50 mb-3" />
            <p className="text-body font-medium">Todo está en orden</p>
            <p className="text-sm text-hint">No hay reportes pendientes por revisar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-subtle border border-card-border rounded-xl p-4 sm:p-5 flex flex-col md:flex-row justify-between gap-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-body bg-card px-2 py-1 rounded shadow-sm border border-card-border">
                      Reporta: @{report.reporterUsername}
                    </span>
                    <span className="text-xs text-hint">→</span>
                    <span className="text-xs font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-1 rounded shadow-sm">
                      Denunciado: @{report.reportedUsername}
                    </span>
                  </div>
                  <h3 className="font-semibold text-heading mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    Motivo:
                  </h3>
                  <p className="text-sm text-body bg-card p-3 rounded-lg border border-card-border border-l-orange-400 border-l-2">
                    {report.reason}
                  </p>

                  {report.imageUrl && (
                    <div className="mt-3 relative w-full max-w-sm h-48 rounded-lg overflow-hidden border border-card-border shadow-sm">
                      <Image src={report.imageUrl} alt="Evidencia de reporte" fill className="object-cover" />
                    </div>
                  )}
                  
                  <div className="mt-3 flex gap-4 text-xs font-medium bg-card-border/30 p-2 rounded-lg inline-flex">
                    <p className="text-hint">Historial del usuario denunciado:</p>
                    <p className="text-danger flex items-center gap-1">
                      ⚠ {report.reportedStrikes} Strikes
                    </p>
                    {report.reportedSuspendedUntil && new Date(report.reportedSuspendedUntil) > new Date() && (
                      <p className="text-orange-400">Suspendido hasta {new Date(report.reportedSuspendedUntil).toLocaleDateString()}</p>
                    )}
                    {report.reportedBanned && (
                      <p className="text-danger font-bold">Cuenta ya Baneada</p>
                    )}
                  </div>
                </div>

                <div className="flex w-full md:w-auto md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-card-border pt-4 md:pt-0 md:pl-4">
                  <button
                    onClick={() => handleApplyStrike(report.id, report.reportedId)}
                    disabled={loadingAction === report.id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-danger hover:bg-danger-dark text-white rounded-xl py-3 px-4 text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    {loadingAction === report.id ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                    Aplicar Strike (+1)
                  </button>
                  <button
                    onClick={() => handleDismiss(report.id)}
                    disabled={loadingAction === report.id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card hover:bg-subtle text-hint hover:text-body border border-card-border rounded-xl py-3 px-4 text-sm font-bold transition-all disabled:opacity-60"
                  >
                    Descartar Reporte
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
