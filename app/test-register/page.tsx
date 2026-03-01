"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { simpleRegister } from "@/server/actions/test/simpleRegister";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, AlertTriangle } from "lucide-react";

export default function TestRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    studentCode: "",
    name: "",
    username: "",
    password: "",
  });
  const [status, setStatus] = useState<{
    type: "error" | "success" | "idle";
    msg: string;
  }>({
    type: "idle",
    msg: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "idle", msg: "Registrando..." });

    const formData = new FormData();
    formData.append("studentCode", form.studentCode);
    formData.append("name", form.name);
    formData.append("username", form.username);
    formData.append("password", form.password);

    const result = await simpleRegister(formData);

    if (result.success) {
      setStatus({ type: "success", msg: result.message || "Usuario registrado exitosamente" });
      // Clear form
      setForm({
        studentCode: "",
        name: "",
        username: "",
        password: "",
      });
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setStatus({ type: "error", msg: result.error || "Error al registrar usuario" });
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="min-h-screen bg-yellowed-white dark:bg-zinc-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center"><BookOpen size={48} className="text-light-purple dark:text-light-pink" /></div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Registro de Prueba
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Solo para testing - No requiere SIIAU
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg p-8 border-2 border-light-purple dark:border-dark-purple">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código de Estudiante
                </label>
                <input
                  type="text"
                  value={form.studentCode}
                  onChange={(e) => setForm({ ...form, studentCode: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  placeholder="Ej: 123456789"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  placeholder="Ej: juanperez"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sin espacios, mínimo 3 caracteres
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-light-purple dark:focus:ring-dark-purple text-gray-800 dark:text-gray-200"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {/* Status Message */}
              {status.msg && (
                <div
                  className={`p-4 rounded-xl text-sm ${status.type === "error"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      : status.type === "success"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    }`}
                >
                  {status.msg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-light-purple hover:bg-dark-purple text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Registrando..." : "Registrar Usuario"}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-light-purple hover:text-dark-purple font-semibold"
                >
                  Inicia sesión
                </button>
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                <AlertTriangle size={14} className="inline mr-1" /> Solo para testing - Los usuarios creados aquí no están validados con SIIAU
              </p>
            </div>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </>
  );
}
