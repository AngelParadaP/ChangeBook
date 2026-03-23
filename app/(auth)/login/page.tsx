"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { resendVerificationEmailAction } from "@/server/actions/auth/resendVerificationEmailAction";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ codigo: "", nip: "" });
  const [status, setStatus] = useState<{
    type: "error" | "success" | "idle";
    msg: string;
  }>({
    type: "idle",
    msg: "",
  });
  const [isResending, setIsResending] = useState(false);

  // Support modal state
  const [showSupport, setShowSupport] = useState(false);
  const [supportType, setSupportType] = useState<"issue" | "appeal" | "other">("issue");
  const [supportCode, setSupportCode] = useState("");
  const [supportTitle, setSupportTitle] = useState("");
  const [supportDesc, setSupportDesc] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportFeedback, setSupportFeedback] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const handleSupportSubmit = async () => {
    if (!supportCode.trim()) {
      setSupportFeedback({ type: "error", msg: "Ingresa tu código de alumno para que podamos identificar tu caso." });
      return;
    }
    if (!supportTitle.trim() || !supportDesc.trim()) {
      setSupportFeedback({ type: "error", msg: "Por favor completa el asunto y la descripción." });
      return;
    }
    setSupportSending(true);
    setSupportFeedback(null);
    try {
      const res = await fetch("/api/support/guest-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode: supportCode,
          title: supportTitle,
          description: supportDesc,
          type: supportType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupportFeedback({ type: "success", msg: "Ticket enviado. El equipo de Kyboo revisará tu caso y dara solucion o rechazara la peticion en los proximos 2 dias habiles." });
        setSupportCode("");
        setSupportTitle("");
        setSupportDesc("");
        setSupportType("issue");
      } else {
        setSupportFeedback({ type: "error", msg: data.error || "Error al enviar el ticket." });
      }
    } catch {
      setSupportFeedback({ type: "error", msg: "Error inesperado. Intenta más tarde." });
    } finally {
      setSupportSending(false);
    }
  };

  const handleResend = async () => {
    if (!form.codigo) {
      setStatus({ type: "error", msg: "Primero ingresa tu código de alumno arriba para reenviar el correo." });
      return;
    }
    setIsResending(true);
    const result = await resendVerificationEmailAction(form.codigo);
    setIsResending(false);

    if (result.error) {
      setStatus({ type: "error", msg: result.error });
    } else if (result.success) {
      setStatus({ type: "success", msg: result.message ?? "Correo reenviado exitosamente." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "idle", msg: "Iniciando sesión..." });

    const result = await signIn("credentials", {
      redirect: false,
      codigo: form.codigo,
      nip: form.nip,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        setStatus({ type: "error", msg: "Código o contraseña incorrectos" });
      } else {
        setStatus({ type: "error", msg: result.error });
      }
    } else if (result?.ok) {
      setStatus({ type: "success", msg: "Acceso concedido." });
      setTimeout(() => router.push("/home"), 1000);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative font-nunito font-semibold tracking-normal overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--auth-gradient-1) 0%, var(--auth-gradient-2) 40%, var(--auth-gradient-3) 70%, var(--auth-gradient-4) 100%)",
      }}
    >
      {/* Decorative blurred circles */}
      <div
        className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--color-primary-light, #A7EBF2)" }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "var(--color-primary-muted, #54ACBF)" }}
      />

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl p-8 md:p-10 flex flex-col items-center
        backdrop-blur-xl bg-white/10 dark:bg-white/8
        border border-white/20 dark:border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out"
      >
        {/* Logo */}
        <div className="mb-10 flex items-center">
          <Image
            src="/images/logo_kyboo.png"
            alt="Kyboo Logo"
            width={70}
            height={70}
            className="drop-shadow-lg -mr-1"
            priority
          />
          <span className="text-6xl font-bold text-color-light-purple tracking-tight">
            yboo
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white/90 mb-1 tracking-tight">
          Bienvenido de vuelta
        </h2>
        <p className="text-sm text-white/50 mb-8">
          Inicia sesión en tu cuenta
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Código de alumno */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <div
                className="w-5 h-5 bg-white/40"
                style={{
                  maskImage: "url(/icons/id.svg)",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: "url(/icons/id.svg)",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </span>
            <input
              type="text"
              placeholder="Código de alumno"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl
                bg-white/10 dark:bg-white/5
                border border-white/15 dark:border-white/10
                text-white placeholder-white/40
                outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
                transition-all duration-300 text-sm"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="relative flex items-center">
            <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
              <div
                className="w-5 h-5 bg-white/40"
                style={{
                  maskImage: "url(/icons/key.svg)",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: "url(/icons/key.svg)",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </span>

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full pl-12 pr-14 py-3.5 rounded-xl
                bg-white/10 dark:bg-white/5
                border border-white/15 dark:border-white/10
                text-white placeholder-white/40
                outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
                transition-all duration-300 text-sm font-nunito leading-normal"
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
            >
              <div
                className={`w-5 h-5 bg-white/40 group-hover/eye:bg-light-pink transition-all
                  ${!showPassword ? "translate-y-0.5" : ""}`}
                style={{
                  maskImage: `url(/icons/${showPassword ? "eye_open.svg" : "eye_close.svg"})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: `url(/icons/${showPassword ? "eye_open.svg" : "eye_close.svg"})`,
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2
              bg-light-pink/90 hover:bg-light-pink
              text-dark-purple font-bold text-base rounded-xl
              shadow-lg shadow-white/10
              transition-all duration-300 active:scale-[0.98] tracking-normal"
          >
            Acceder
          </button>
        </form>

        <div className="mt-4 w-full text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-white/40 hover:text-light-pink transition-colors duration-300"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="mt-8 flex justify-between items-center w-full text-sm">
          <span className="text-white/40">¿No tienes una cuenta?</span>
          <Link
            href="/register"
            className="text-light-pink font-bold hover:text-white transition-colors duration-300"
          >
            Registrarse
          </Link>
        </div>

        {/* Support button */}
        <div className="mt-6 w-full flex justify-center">
          <button
            type="button"
            onClick={() => { setShowSupport(true); setSupportFeedback(null); }}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors duration-300 group"
          >
            <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
            </svg>
            ¿Necesitas ayuda o quieres apelar una sanción?
          </button>
        </div>

        {status.msg && (
          <div
            className={`mt-5 w-full p-3 rounded-xl text-center text-sm font-bold border transition-all ${status.type === "error"
              ? "bg-red-500/10 border-red-400/30 text-red-300"
              : status.type === "success"
                ? "bg-green-500/10 border-green-400/30 text-green-300"
                : "bg-yellow-500/10 border-yellow-400/30 text-yellow-200"
              }`}
          >
            <div>{status.msg}</div>

            {status.msg.includes("Cuenta no verificada") && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold underline text-xs disabled:opacity-50 hover:opacity-80 transition-opacity"
                >
                  {isResending ? "Reenviando correo..." : "¿No recibiste tu correo? Reenviar enlace"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Support Modal */}
      {showSupport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1E1E2E] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-light-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
                </svg>
                <h3 className="text-lg font-bold text-white">Centro de Soporte</h3>
              </div>
              <button onClick={() => setShowSupport(false)} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              <p className="text-xs text-white/50 leading-relaxed">
                ¿Tienes un problema o deseas apelar una sanción/ban? Ingresa tu <strong className="text-white/70">código de alumno</strong> para que podamos seguimiento a tu caso, aunque no tengas sesión activa.
              </p>

              {/* Student code */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1.5">
                  Código de alumno <span className="text-light-pink">*</span>
                </label>
                <input
                  type="text"
                  value={supportCode}
                  onChange={(e) => setSupportCode(e.target.value)}
                  placeholder="Ej: 215757910"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-light-pink focus:border-light-pink"
                />
                <p className="text-[10px] text-white/30 mt-1">Necesario para identificar tu caso y darte seguimiento.</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1.5">Tipo de solicitud</label>
                <select
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value as "issue" | "appeal" | "other")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 focus:ring-light-pink focus:border-light-pink"
                >
                  <option value="issue">Problema técnico / Bug</option>
                  <option value="appeal">Apelar sanción o ban</option>
                  <option value="other">Otro asunto</option>
                </select>
              </div>


              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1.5">Asunto</label>
                <input
                  type="text"
                  value={supportTitle}
                  onChange={(e) => setSupportTitle(e.target.value)}
                  placeholder="Ej: No puedo acceder a mi cuenta"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-light-pink focus:border-light-pink"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-white/60 mb-1.5">Descripción</label>
                <textarea
                  value={supportDesc}
                  onChange={(e) => setSupportDesc(e.target.value)}
                  placeholder="Describe detalladamente tu situación..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-light-pink focus:border-light-pink resize-none"
                />
              </div>

              {/* Feedback */}
              {supportFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold border ${supportFeedback.type === "error"
                  ? "bg-red-500/10 border-red-400/30 text-red-300"
                  : "bg-green-500/10 border-green-400/30 text-green-300"
                  }`}>
                  {supportFeedback.msg}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/5">
              <button
                type="button"
                onClick={() => setShowSupport(false)}
                disabled={supportSending}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-semibold border border-white/10 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSupportSubmit}
                disabled={supportSending}
                className="px-5 py-2.5 bg-light-pink text-dark-purple rounded-xl hover:opacity-90 transition-colors font-bold shadow-lg shadow-light-pink/20 text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {supportSending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
