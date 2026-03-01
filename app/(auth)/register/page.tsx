"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerAction } from "@/app/api/auth/registerAuth";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validations/user";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [showNip, setShowNip] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    code: "",
    nip: "",
    username: "",
    password: "",
  });

  const [status, setStatus] = useState<{
    type: "error" | "success" | "idle";
    msg: string;
  }>({ type: "idle", msg: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validacion del input en el cliente para respuesta rapida
    const validation = registerSchema.safeParse(form);
    if (!validation.success) {
      const zodError = validation.error.flatten();

      // Extrae todos los mensajes de error y los une con saltos de línea
      const errorMessage = Object.values(zodError.fieldErrors)
        .flat()
        .join(", \n");

      setStatus({ type: "error", msg: errorMessage });
      return;
    }

    setStatus({ type: "idle", msg: "Validando con SIIAU y creando cuenta..." });

    // Validacion del input y de la conexion a SIIAU
    const result = await registerAction(form);
    if (result.success) {
      setStatus({ type: "success", msg: "Cuenta creada. Entrando..." });

      // Iniciamos sesión con las credenciales recién creadas
      const loginResult = await signIn("credentials", {
        redirect: false,
        codigo: form.code,
        nip: form.password, // La contraseña que el usuario eligió para Kyboo
      });

      if (loginResult?.ok) {
        router.push("/home");
      } else {
        setStatus({ type: "error", msg: "Error al iniciar sesión automática" });
      }
    } else {
      setStatus({ type: "error", msg: result.error || "Error al registrarse" });
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
        className="absolute top-[-80px] right-[-80px] w-[350px] h-[350px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--color-primary-light, #A7EBF2)" }}
      />
      <div
        className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
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
        <div className="mb-2">
          <Image
            src="/images/logo_kyboo.png"
            alt="Kyboo Logo"
            width={80}
            height={80}
            className="drop-shadow-lg"
            priority
          />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white/90 mb-1 tracking-tight">
          Únete a Kyboo
        </h2>
        <p className="text-sm text-white/50 mb-6">
          Crea tu cuenta en segundos
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Código de Estudiante */}
          <div className="relative flex items-center">
            <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
              <div
                className="w-5 h-5 bg-white/40"
                style={{
                  maskImage: "url(/icons/id.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
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
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>

          {/* NIP de SIIAU */}
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
              type={showNip ? "text" : "password"}
              placeholder="NIP de SIIAU"
              className="w-full pl-12 pr-14 py-3.5 rounded-xl
                bg-white/10 dark:bg-white/5
                border border-white/15 dark:border-white/10
                text-white placeholder-white/40
                outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
                transition-all duration-300 text-sm"
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowNip(!showNip)}
              className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
            >
              <div
                className={`w-5 h-5 bg-white/40 group-hover/eye:bg-light-pink transition-all ${!showNip ? "translate-y-0.5" : ""}`}
                style={{
                  maskImage: `url(/icons/${showNip ? "eye_open.svg" : "eye_close.svg"})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskImage: `url(/icons/${showNip ? "eye_open.svg" : "eye_close.svg"})`,
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="grow h-px bg-white/15"></div>
            <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
              Datos de la App
            </span>
            <div className="grow h-px bg-white/15"></div>
          </div>

          {/* Username de la App */}
          <div className="relative flex items-center">
            <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
              <div
                className="w-5 h-5 bg-white/40"
                style={{
                  maskImage: "url(/icons/id.svg)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskImage: "url(/icons/id.svg)",
                  WebkitMaskRepeat: "no-repeat",
                }}
              />
            </span>
            <input
              type="text"
              placeholder="Nombre de usuario"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl
                bg-white/10 dark:bg-white/5
                border border-white/15 dark:border-white/10
                text-white placeholder-white/40
                outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
                transition-all duration-300 text-sm"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          {/* Nueva Password */}
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
              placeholder="Nueva contraseña Kyboo"
              className="w-full pl-12 pr-14 py-3.5 rounded-xl
                bg-white/10 dark:bg-white/5
                border border-white/15 dark:border-white/10
                text-white placeholder-white/40
                outline-none focus:border-light-pink focus:ring-1 focus:ring-light-pink/50
                transition-all duration-300 text-sm"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
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

          <button
            type="submit"
            className="w-full py-3.5 mt-2
              bg-light-pink/90 hover:bg-light-pink
              text-dark-purple font-bold text-base rounded-xl
              shadow-lg shadow-black/20
              transition-all duration-300 active:scale-[0.98] tracking-normal"
          >
            Registrarme
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center w-full text-sm">
          <span className="text-white/40">¿Ya tienes cuenta?</span>
          <Link
            href="/login"
            className="text-light-pink font-bold hover:text-white transition-colors duration-300"
          >
            Inicia sesión
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
