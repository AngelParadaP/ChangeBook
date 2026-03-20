"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmailAction } from "@/server/actions/auth/verifyEmailAction";
import Link from "next/link";
import Image from "next/image";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando tu cuenta...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Enlace inválido. No se encontró el token de verificación.");
      return;
    }

    verifyEmailAction(token)
      .then((res) => {
        if (res.error) {
          setStatus("error");
          setMessage(res.error);
        } else {
          setStatus("success");
          setMessage("¡Tu cuenta ha sido verificada exitosamente!");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Ocurrió un error al verificar tu cuenta.");
      });
  }, [token]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative font-nunito font-semibold tracking-normal overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--auth-gradient-1) 0%, var(--auth-gradient-2) 40%, var(--auth-gradient-3) 70%, var(--auth-gradient-4) 100%)",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 md:p-10 flex flex-col items-center
        backdrop-blur-xl bg-white/10 dark:bg-white/8
        border border-white/20 dark:border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-center"
      >
        <div className="mb-6">
          <Image
            src="/images/logo_kyboo.png"
            alt="Kyboo Logo"
            width={70}
            height={70}
            className="drop-shadow-lg"
            priority
          />
        </div>

        <h2 className="text-2xl font-bold text-white/90 mb-4 tracking-tight">
          Verificación de Cuenta
        </h2>

        {status === "loading" && (
          <div className="text-white/70 animate-pulse">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-400/30 text-red-300 p-4 rounded-xl mb-4 text-sm font-bold w-full">
            {message}
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-500/10 border border-green-400/30 text-green-300 p-4 rounded-xl mb-4 text-sm font-bold w-full">
            {message}
          </div>
        )}

        {(status === "success" || status === "error") && (
          <Link
            href="/login"
            className="w-full py-3.5 mt-4
              bg-light-pink/90 hover:bg-light-pink
              text-dark-purple font-bold text-base rounded-xl
              shadow-lg shadow-white/10
              transition-all duration-300 active:scale-[0.98] tracking-normal inline-block"
          >
            Ir a Iniciar Sesión
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
