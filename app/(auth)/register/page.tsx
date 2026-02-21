"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerAction } from "@/app/api/auth/registerAuth";
import { useRouter } from "next/navigation";
import { registerSchema } from "@/lib/validations/user";
import Link from "next/link";

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
      setStatus({ type: "success", msg: "✅ Cuenta creada. Entrando..." });

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
      className="min-h-screen w-full flex items-center justify-center p-4 relative font-nunito font-semibold tracking-normal
      bg-[linear-gradient(to_bottom,var(--background)_50%,#734a91_50%)]"
    >
      <div
        className="flex w-full max-w-4xl min-h-[650px] bg-white dark:bg-[#0f0f10] rounded-[2.5rem] overflow-hidden 
        border border-light-purple
        shadow-[0_10px_25px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.15),0_40px_80px_rgba(0,0,0,0.25)] 
        dark:shadow-[0_10px_25px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5),0_40px_80px_rgba(0,0,0,0.7)]
        animate-in fade-in slide-in-from-bottom-16 duration-1000 ease-out transition-colors"
      >
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray dark:text-gray-300 text-center mb-8">
            Únete a Kyboo
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Código de Estudiante */}
            <div className="relative flex items-center">
              <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
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
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base"
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>

            {/* NIP de SIIAU */}
            <div className="relative flex items-center">
              <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
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
                className="w-full pl-12 pr-14 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base"
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowNip(!showNip)}
                className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
              >
                <div
                  className={`w-6 h-6 bg-gray group-hover/eye:bg-dark-purple transition-all ${!showNip ? "translate-y-1" : ""}`}
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

            <div className="flex items-center gap-2 py-2">
              <div className="grow h-px bg-gray/20"></div>
              <span className="text-[10px] uppercase tracking-widest text-gray/50 font-bold">
                Datos de la App
              </span>
              <div className="grow h-px bg-gray/20"></div>
            </div>

            {/* Username de la App */}
            <div className="relative flex items-center">
              <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
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
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            {/* Nueva Password */}
            <div className="relative flex items-center">
              <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
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
                className="w-full pl-12 pr-14 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
              >
                <div
                  className={`w-6 h-6 bg-gray group-hover/eye:bg-dark-purple transition-all ${!showPassword ? "translate-y-1" : ""}`}
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
              className="w-full py-4 mt-4 bg-light-purple hover:bg-dark-purple text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all active:scale-95"
            >
              Registrarme
            </button>
          </form>

          <div className="mt-8 flex justify-between items-center text-sm font-semibold">
            <span className="text-gray/70">¿Ya tienes cuenta?</span>
            <Link
              href="/login"
              className="text-dark-purple dark:text-light-pink font-black hover:underline"
            >
              Inicia sesión
            </Link>
          </div>

          {status.msg && (
            <div
              className={`mt-6 p-3 rounded-xl text-center text-sm font-bold border transition-all ${
                status.type === "error"
                  ? "bg-red-50/50 border-red-200 text-red-500"
                  : status.type === "success"
                    ? "bg-green-50/50 border-green-200 text-green-500"
                    : "bg-yellow-50/50 border-yellow-200 text-yellow-600"
              }`}
            >
              {status.msg}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Banner */}
        <div className="hidden md:flex md:w-1/2 bg-light-purple p-12 flex-col items-center justify-center text-white relative">
          <h2 className="text-5xl font-black mb-12 drop-shadow-2xl tracking-tight text-center">
            ¡Únete a la Red!
          </h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 border-[5px] border-white rounded-3xl flex items-center justify-center shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M8 7h6" />
                <path d="M8 11h8" />
              </svg>
            </div>
            <div className="text-4xl font-black leading-[0.8] tracking-tighter italic">
              KYBOO
            </div>
          </div>
          <p className="text-center font-bold opacity-90 max-w-[250px] leading-tight">
            Intercambia, lee y crece con tu comunidad universitaria.
          </p>
        </div>
      </div>
    </div>
  );
}
