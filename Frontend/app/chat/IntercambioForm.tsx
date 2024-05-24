// Componente en tu frontend donde se muestra el chat y se manejan las solicitudes de intercambio

import { useState } from "react";
import axios from "axios";

const Chat = () => {
  // Estado para los detalles del intercambio
  const [intercambioData, setIntercambioData] = useState({
    fechaEntrega: "",
    fechaDevolucion: "",
    lugar: "",
    tituloLibro: "", // Aquí puedes agregar otros campos según sea necesario
  });

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setIntercambioData({
      ...intercambioData,
      [e.target.name]: e.target.value,
    });
  };

  // Enviar la solicitud de intercambio al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("api/intercambio", intercambioData);
      console.log(response.data); // Maneja la respuesta del backend según sea necesario
    } catch (error) {
      console.error("Error al enviar la solicitud de intercambio:", error);
    }
  };

  return (
    <div>
      {/* Aquí va tu interfaz de chat */}

      {/* Formulario para solicitar intercambio */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fechaEntrega"
          value={intercambioData.fechaEntrega}
          onChange={handleChange}
          placeholder="Fecha de entrega"
        />
        <input
          type="text"
          name="fechaDevolucion"
          value={intercambioData.fechaDevolucion}
          onChange={handleChange}
          placeholder="Fecha de devolución"
        />
        <input
          type="text"
          name="lugar"
          value={intercambioData.lugar}
          onChange={handleChange}
          placeholder="Lugar"
        />
        <input
          type="text"
          name="tituloLibro"
          value={intercambioData.tituloLibro}
          onChange={handleChange}
          placeholder="Título del libro"
        />
        {/* Puedes agregar más campos según sea necesario */}
        <button type="submit">Enviar solicitud de intercambio</button>
      </form>
    </div>
  );
};

export default Chat;
