import React from "react";
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
  userNombre: string;
  codigoUsuario: string;
  imagen: string;
  inWishList?: boolean;
  refreshWishList?: () => void;
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
  inWishList = false,
  refreshWishList,
    isDarkMode,

}) => {
  const router = useRouter();
  const usuarioCodigo = localStorage.getItem("codigoUsuario");

  const handleCardClick = () => {
    router.push(`/DetallesLibro?idLibro=${idLibro}`);
  };

  const handleUserClick = () => {
    router.push(`/Perfil?codigoUsuario=${codigoUsuario}`);
  };

const handleWishListClick = async () => {
  try {
    await axios.post(`/api/wishlist/anadirLibro`, {
      idLibro,
      codigo: usuarioCodigo,
    });
    await axios.post(`/api/notificaciones/agregarPara`, {
      codigoUsuario: usuarioCodigo,
      mensaje: `Agregaste el libro '${titulo}' a tu lista de deseos`,
      roomId: '1'
    
    });
    toast.success("Libro añadido a la lista de deseos.", {
      
      autoClose: 1000,
      hideProgressBar: true,
      position: "top-center",
              theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

    });
  } catch (error) {
    console.error("Error añadiendo libro a la lista de deseos:", error);
        toast.info("El libro ya se encuentra en la lista de deseos.", {
      autoClose: 1000,
      hideProgressBar: true,
      position: "top-center",
              theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

    });
  }
};


  const handleRemoveFromWishList = async () => {
    try {
      await axios.delete(`/api/wishlist/borrarLibro`, {
        data: {
          idLibro,
          codigo: usuarioCodigo,
        },
      });
      alert("Libro eliminado de la lista de deseos.");
      if (refreshWishList) {
        refreshWishList();
      }
    } catch (error) {
      console.error("Error eliminando libro de la lista de deseos:", error);
    }
  };

  return (
    <div className={`shadow-md rounded-md p-4 flex flex-col h-full ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-cbookC-100'}`}>
      <ToastContainer />
      <div className="flex-grow">
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
      </div>
      <div className="mt-2 flex justify-center">
        {!inWishList ? (
          <button
            onClick={handleWishListClick}
            className="bg-cbookC-600 text-white py-1 px-4 rounded w-auto"
          >
            Añadir a WishList
          </button>
        ) : (
          <button
            onClick={handleRemoveFromWishList}
            className="bg-red-600 text-white py-1 px-4 rounded w-full"
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
};

export default BookCard;