"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      setStatus({ type: "success", msg: "✅ Acceso concedido." });
      setTimeout(() => router.push("/home"), 1000);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative font-nunito font-semibold tracking-widest 
      /* Fondo dividido usando las variables de estado */
      bg-[linear-gradient(to_bottom,var(--background)_50%,#734a91_50%)]"
    >
      {/* Tarjeta con animación, borde morado y sombra pesada */}
      <div
        className="flex w-full max-w-4xl min-h-[550px] bg-white dark:bg-[#0f0f10] rounded-[2.5rem] overflow-hidden 
        border border-light-purple
        shadow-[0_10px_25px_rgba(0,0,0,0.1),0_20px_48px_rgba(0,0,0,0.15),0_40px_80px_rgba(0,0,0,0.25)] 
        dark:shadow-[0_10px_25px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5),0_40px_80px_rgba(0,0,0,0.7)]
        animate-in fade-in slide-in-from-bottom-16 duration-1000 ease-out transition-colors"
      >
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray dark:text-gray-300 text-center mb-10 tracking-normal">
            Iniciar Sesion
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
                  style={{
                    maskImage: "url(/icons/id.svg)",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    maskSize: "contain",
                    WebkitMaskImage: "url(/icons/id.svg)", // Soporte para Safari/Chrome
                    WebkitMaskRepeat: "no-repeat",
                  }}
                />
              </span>
              <input
                type="text"
                placeholder="Código de alumno"
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                required
              />
            </div>

            <div className="relative group flex items-center">
              {/* Icono de Llave (key.svg) */}
              <span className="absolute left-4 h-full flex items-center justify-center pointer-events-none">
                <div
                  className="w-5 h-5 bg-gray dark:bg-zinc-400"
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
                className="w-full pl-12 pr-14 py-4 rounded-xl bg-yellowed-white dark:bg-zinc-900 border-none outline-none focus:ring-2 focus:ring-light-purple transition-all text-base font-nunito leading-normal"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                required
              />

              {/* Botón de Ojo con SVGs (eye_open.svg / eye_close.svg) */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 h-full flex items-center justify-center group/eye transition-all active:scale-90"
              >
                <div
                  className={`w-6 h-6 bg-gray group-hover/eye:bg-dark-purple dark:group-hover/eye:bg-light-pink transition-all
      ${!showPassword ? "translate-y-1" : ""} /* Bajamos el icono solo cuando está cerrado */
    `}
                  style={{
                    // showPassword (true) -> eye_open | !showPassword (false) -> eye_close
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
              className="w-full py-4 mt-4 bg-light-purple hover:bg-dark-purple text-white font-extrabold text-xl rounded-2xl shadow-lg transition-all active:scale-95 tracking-normal"
            >
              Acceder
            </button>
          </form>

          <div className="mt-16 flex justify-between items-center text-sm font-semibold">
            <span className="text-gray/70">¿No tienes una cuenta?</span>
            <Link
              href="/register"
              className="text-dark-purple dark:text-light-pink font-black hover:underline tracking-normal"
            >
              Registrarse
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

        {/* COLUMNA DERECHA: Banner Morado */}
        <div className="hidden md:flex md:w-1/2 bg-light-purple p-12 flex-col items-center justify-center text-white relative">
          <h2 className="text-5xl font-black mb-12 drop-shadow-2xl tracking-tight">
            ¡Bienvenido!
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
          <div className="w-44 h-2.5 bg-white rounded-full opacity-80 shadow-md"></div>
        </div>
      </div>
    </div>
  );
}
