import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  isbn: string;
  ano_de_publicacion: string;
  userNombre: string;
  codigoUsuario: string;
  imagenPerfil: string;
  imagen: string;
  isDarkMode:boolean;
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
  isbn,
  ano_de_publicacion,
  disponible,
  userNombre,
  codigoUsuario,
  imagenPerfil,
  imagen,
  isDarkMode,
}) => {
  const usuarioCodigo = localStorage.getItem("codigoUsuario");
  const router = useRouter();

  const handleWishListClick = async () => {
    try {
      await axios.post(`/api/wishlist/anadirLibro`, {
        idLibro,
        codigo: usuarioCodigo,
      });

      await axios.post(`/api/notificaciones/agregarPara`, {
        codigoUsuario: usuarioCodigo,
        mensaje: `Agregaste el libro '${titulo}' a tu lista de deseos`,
        roomId:"1"
      });

       toast.success("Libro añadido a la lista de deseos.", {
        autoClose: 1000  // Duración de 1000 ms (1 segundo)
                                   ,hideProgressBar: true,
        position: "top-center",
      });
    } catch (error) {
       toast.info("El libro ya se encuentra lista de deseos.", {
        autoClose: 1000  // Duración de 1000 ms (1 segundo)
                                   ,hideProgressBar: true,
        position: "top-center",
      });
    }
  };


return (
<div className={`rounded-md p-2 flex items-center ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`}>
    <img
      loading="lazy"
      src={imagen}
      alt={titulo}
      className="object-cover w-24 h-32 rounded-md mr-2"
    />
    <div className="flex flex-col">
      <h2 className={`text-lg font-semibold font-cbookF ${isDarkMode ? "text-white" : "text-black"}`}>{titulo}</h2>
      <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"} font-cbookF`}>{autor}</p>
    </div>
  </div>
);

};

export default BookCard;