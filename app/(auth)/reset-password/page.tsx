"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordAction } from "@/server/actions/auth/passwordReset";
import Link from "next/link";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<{
        type: "error" | "success" | "idle";
        msg: string;
    }>({ type: "idle", msg: "" });
    const [isLoading, setIsLoading] = useState(false);

    // Si no hay token, mostrar error
    if (!token) {
        return (
            <div className="w-full text-center">
                <div className="mb-6 w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white/90 mb-2">Enlace inválido</h2>
                <p className="text-sm text-white/50 mb-6">
                    Este enlace no es válido. Solicita uno nuevo desde la página de recuperación.
                </p>
                <Link
                    href="/forgot-password"
                    className="text-light-pink font-bold hover:text-white transition-colors duration-300"
                >
                    Solicitar nuevo enlace
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8) {
            setStatus({ type: "error", msg: "La contraseña debe tener al menos 8 caracteres" });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({ type: "error", msg: "Las contraseñas no coinciden" });
            return;
        }

        setIsLoading(true);
        setStatus({ type: "idle", msg: "Actualizando contraseña..." });

        const result = await resetPasswordAction(token, password);

        setIsLoading(false);

        if (result.error) {
            setStatus({ type: "error", msg: result.error });
        } else {
            setStatus({ type: "success", msg: "¡Contraseña actualizada! Redirigiendo al login..." });
            setTimeout(() => router.push("/login"), 2000);
        }
    };

    return (
        <>
            {/* Icon */}
            <div className="mb-6 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-light-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white/90 mb-1 tracking-tight">
                Nueva contraseña
            </h2>
            <p className="text-sm text-white/50 mb-8 text-center">
                Ingresa tu nueva contraseña para Kyboo
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Nueva contraseña */}
                <div className="relative flex items-center">
                    <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                        <div
                            className="w-5 h-5 bg-white/40"
                            style={{
                                maskImage: "url(/icons/key.svg)",
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                WebkitMaskImage: "url(/icons/key.svg)",
                                WebkitMaskRepeat: "no-repeat",
                            }}
                        />
                    </span>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Nueva contraseña"
                        className="w-full pl-12 pr-14 py-3.5 rounded-xl
              bg-white/10 dark:bg-white/5
              border border-white/15 dark:border-white/10
              text-white placeholder-white/40
              outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
              transition-all duration-300 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
                    >
                        <div
                            className={`w-5 h-5 bg-white/40 group-hover/eye:bg-light-pink transition-all ${!showPassword ? "translate-y-0.5" : ""}`}
                            style={{
                                maskImage: `url(/icons/${showPassword ? "eye_open.svg" : "eye_close.svg"})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                WebkitMaskImage: `url(/icons/${showPassword ? "eye_open.svg" : "eye_close.svg"})`,
                                WebkitMaskRepeat: "no-repeat",
                            }}
                        />
                    </button>
                </div>

                {/* Confirmar contraseña */}
                <div className="relative flex items-center">
                    <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                        <div
                            className="w-5 h-5 bg-white/40"
                            style={{
                                maskImage: "url(/icons/key.svg)",
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                WebkitMaskImage: "url(/icons/key.svg)",
                                WebkitMaskRepeat: "no-repeat",
                            }}
                        />
                    </span>
                    <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirmar contraseña"
                        className="w-full pl-12 pr-14 py-3.5 rounded-xl
              bg-white/10 dark:bg-white/5
              border border-white/15 dark:border-white/10
              text-white placeholder-white/40
              outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
              transition-all duration-300 text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
                    >
                        <div
                            className={`w-5 h-5 bg-white/40 group-hover/eye:bg-light-pink transition-all ${!showConfirm ? "translate-y-0.5" : ""}`}
                            style={{
                                maskImage: `url(/icons/${showConfirm ? "eye_open.svg" : "eye_close.svg"})`,
                                maskSize: "contain",
                                maskRepeat: "no-repeat",
                                WebkitMaskImage: `url(/icons/${showConfirm ? "eye_open.svg" : "eye_close.svg"})`,
                                WebkitMaskRepeat: "no-repeat",
                            }}
                        />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 mt-2
            bg-light-pink/90 hover:bg-light-pink
            text-dark-purple font-bold text-base rounded-xl
            shadow-lg shadow-white/10
            transition-all duration-300 active:scale-[0.98] tracking-normal
            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
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
        </>
    );
}

export default function ResetPasswordPage() {
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
                className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: "var(--color-primary-light, #A7EBF2)" }}
            />
            <div
                className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full opacity-15 blur-3xl pointer-events-none"
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
                <Suspense
                    fallback={
                        <div className="text-white/50 text-sm">Cargando...</div>
                    }
                >
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
