// middleware/authMiddleware.js
"use client";
import { parseCookies } from "nookies";
import { useRouter } from "next/navigation"; // Utiliza next/navigation en lugar de next/router
import axios from "axios";

export default function authMiddleware(handler) {
  return async (ctx) => {
    const router = useRouter(); // Usa useRouter para obtener el enrutador

    const cookies = parseCookies(ctx);
    const token = cookies.token;

    if (!token) {
      if (ctx.res) {
        ctx.res.writeHead(302, { Location: "/login" });
        ctx.res.end();
      } else {
        router.push("/InicioSesion");
      }
      return {};
    }

    try {
      // Verificar el token JWT haciendo una solicitud HTTP
      await axios.post("/api/auth/verifyToken", { token });
      // Si la verificación es exitosa, continuar con el manejo de la solicitud
      return handler(ctx);
    } catch (error) {
      console.error("Error de autenticación:", error);
      // Si la verificación del token falla, redirigir al usuario a la página de inicio de sesión
      if (ctx.res) {
        ctx.res.writeHead(302, { Location: "/login" });
        ctx.res.end();
      } else {
        router.push("/InicioSesion");
      }
      return {};
    }
  };
}
