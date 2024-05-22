"use client";
import { FunctionComponent, useState, useEffect } from "react";
import React from "react";
import Link from "@/node_modules/next/link";
import Image from "@/node_modules/next/image";
import "./InicioDeSesin.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { setCookie } from "nookies";
import { FontAwesomeIcon } from "@/node_modules/@fortawesome/react-fontawesome/index";
import {
  faEye,
  faEyeSlash,
} from "@/node_modules/@fortawesome/free-solid-svg-icons/index";

const InicioDeSesin: FunctionComponent = () => {
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para mostrar la contraseña

    useEffect(() => {
    const hasReloaded = localStorage.getItem('hasReloaded');

    if (!hasReloaded) {
      localStorage.setItem('hasReloaded', 'true');
      window.location.reload();
    }
  }, []);

   const handleClearLocalStorage = () => {
    localStorage.removeItem("hasReloaded");
  };


  const handleAuth = async () => {
    try {
      const response = await axios.post("/api/auth/login", {
        codigo,
        password,
      });
      const { access_token } = response.data;

      setCookie(null, "token", access_token, {
        maxAge: 60,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      localStorage.setItem("codigoUsuario", codigo);
    } catch (error) {
      console.log("Error en la autenticacion:", error);
    }
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!codigo || !password) {
      alert("Por favor, complete todos los campos");
      return;
    }

    try {
      const response = await fetch(`/api/credenciales/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codigo, password }),
      });
      const data = await response.json();

      if (data.success) {
        handleAuth();
        codigo === '000000000' ? router.push("/AdminDashboard/Admit") : router.push("/Home");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la solicitud");
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container">
      {/*Panel izquierdo*/}
      <div className="left-panel">
        <h2 className="title">Inicio de Sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              id="codigo"
              name="codigo"
              placeholder="Código"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <div className="form-group">
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Contraseña"
                value={password}
                onChange={handlePasswordChange}
              />
              <button type="button" onClick={toggleShowPassword}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn">
            Acceder
          </button>
        </form>
        <p className="register-text">
          ¿No tienes una cuenta? <Link onClick={handleClearLocalStorage} href={"../Registro"}>Regístrate</Link>{" "}
        </p>
      </div>

      {/*Panel derecho*/}
      <div className="right-panel">
        <h2 id="textobienvenido">¡Bienvenido!</h2>
        <Image
          src="/logo_completo_blanco.png"
          alt="Logo"
          width={350}
          height={10}
          id="Imagen"
        />
      </div>
    </div>
  );
};

export default InicioDeSesin;
