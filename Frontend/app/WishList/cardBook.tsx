"use client"
import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

interface BookCardProps {
  idLibro: string;
  titulo: string;
  editorial: string;
  descripcion: string;
  sinopsis: string;
  autor: string;
  calificacion: number;
  intercambios: number;
  disponible: boolean;
  userNombre: string;
  codigoUsuario: string;
  imagen: string;
  fetchWishList?: () => void;
      isDarkMode: boolean;

}

const BookCard: React.FC<BookCardProps> = ({
  idLibro,
  titulo,
  editorial,
  descripcion,
  sinopsis,
  autor,
  calificacion,
  intercambios,
  disponible,
  userNombre,
  codigoUsuario,
  imagen,
  fetchWishList,
      isDarkMode,
}) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const usuarioCodigo =
    typeof window !== "undefined"
      ? localStorage.getItem("codigoUsuario")
      : null;

  const handleCardClick = () => {
    router.push(`/DetallesLibro?idLibro=${idLibro}`);
  };

  const handleUserClick = () => {
    router.push(`/Perfil?codigoUsuario=${codigoUsuario}`);
  };

  const handleRemoveFromWishList = async () => {
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`/api/wishlist/borrarLibro`, {
        data: {
          idLibro,
          codigo: usuarioCodigo,
        },
      });
      try {
        await axios.post(`/api/notificaciones/agregarPara`, {
          codigoUsuario: usuarioCodigo,
          mensaje: `Se eliminó el libro '${titulo}' de tu lista de deseos`,
          roomId:"1"
        });
      } catch (error) {
        console.error("Error mandando la notificacion", error);
      }

      window.location.reload();
    } catch (error) {
      console.error("Error eliminando libro de la lista de deseos:", error);
    }
  };

  const handleCancelDelete = () => {
    setShowModal(false);
  };

  return (
    
    <div className={`shadow-md rounded-md p-4 flex flex-col h-full ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-cbookC-100'}`}>
      <img
        loading="lazy"
        src={imagen}
        alt={titulo}
        className="w-full max-h-64 object-cover rounded-md"
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      />
      <h2
        style={{ cursor: "pointer" }}
        onClick={handleCardClick}
        className="text-lg font-bold font-cbookF"
      >
        {titulo}
      </h2>
      <p
        style={{ cursor: "pointer" }}
        onClick={handleCardClick}
          className={`text-gray-600 font-cbookF ${isDarkMode ? 'text-white' : ''}`}
      >
        {autor}
      </p>
      <p onClick={handleCardClick} className={`text-gray-600 font-cbookF ${isDarkMode ? 'text-white' : ''}`}>
        Estado: {disponible ? "🟢" : "🔴"}
      </p>
      <p className={`text-gray-600 font-cbookF ${isDarkMode ? 'text-white' : ''}`}>
        Publicado por:{" "}
        <span
          onClick={handleUserClick}
            className={`text-cbookC-600 cursor-pointer ${isDarkMode ? 'text-gray-400' : ''}`}
        >
          {userNombre}
        </span>
      </p>

      <button
        onClick={handleRemoveFromWishList}
        className="mt-2 bg-red-600 text-white py-1 px-4 rounded"
      >
        Eliminar
      </button>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
            <div className={`${isDarkMode ? "bg-gray-600 text-white" : "bg-white"} p-4 rounded-lg`}>
            <p>¿Estás seguro de que deseas eliminar este libro?</p>
            <div className="flex justify-between mt-4">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;