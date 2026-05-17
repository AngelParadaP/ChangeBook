"use client";
import { useState } from "react";
import { forgotPasswordAction } from "@/server/actions/auth/passwordReset";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
    const [codigo, setCodigo] = useState("");
    const [status, setStatus] = useState<{
        type: "error" | "success" | "idle";
        msg: string;
    }>({ type: "idle", msg: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!codigo.trim()) {
            setStatus({ type: "error", msg: "Ingresa tu código de alumno" });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "idle", msg: "Buscando tu cuenta..." });

        const result = await forgotPasswordAction(codigo.trim());

        setIsLoading(false);

        if (result.error) {
            setStatus({ type: "error", msg: result.error });
        } else {
            setStatus({ type: "success", msg: result.message || "Correo enviado" });
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
                {/* Icon */}
                <div className="mb-6 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-light-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white/90 mb-1 tracking-tight">
                    ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-sm text-white/50 mb-8 text-center leading-relaxed">
                    Ingresa tu código de alumno y te enviaremos un correo a tu email institucional para restablecer tu contraseña.
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
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 mt-2
              bg-light-pink/90 hover:bg-light-pink
              text-primary-dark font-bold text-base rounded-xl
              shadow-lg shadow-white/10
              transition-all duration-300 active:scale-[0.98] tracking-normal
              disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Enviando..." : "Enviar correo de recuperación"}
                    </button>
                </form>

                <div className="mt-8 flex justify-between items-center w-full text-sm">
                    <Link
                        href="/login"
                        className="text-white/40 hover:text-white/60 transition-colors duration-300 flex items-center gap-1.5"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Volver al login
                    </Link>
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
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
}
