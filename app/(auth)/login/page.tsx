"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: "idle", msg: "Iniciando sesión..." });

    const result = await signIn("credentials", {
      redirect: false,
      codigo: form.codigo,
      nip: form.nip,
    });

    if (result?.error) {
      setStatus({ type: "error", msg: "Código o contraseña incorrectos" });
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
