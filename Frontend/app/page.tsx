"use client";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import InicioDeSesion from "./InicioSesion/page";
import Home from "./Home/page";
import ResultadoBusqueda from "./ResultadoBusqueda/page";
import Perfil from "./PerfilUsuario/page";
import PerfilUsuario from "./Perfil/page";
import AdmitUser from "./AdminDashboard/Admit/page";
import "./InicioSesion/InicioDeSesin.css";
import "./InicioSesion/global.css";
import "./Registro/Registro.css"; 
import Registro from "./Registro/page";


function App({  }) {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InicioDeSesion />} />
        <Route path="/InicioSesion" element={<InicioDeSesion />} />
        <Route path="/PerfilUsuario" element={<Perfil />} />
        <Route path="/Perfil" element={<PerfilUsuario />} />
        <Route path="/ResultadoBusqueda" element={<ResultadoBusqueda />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/AdminDashboard/Admit" element={<AdmitUser />} />
      </Routes>
    </Router>
  );
}

export default App;
