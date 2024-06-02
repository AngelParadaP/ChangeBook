import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
interface Book {
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
  imagen: string; // Añadir esta propiedad
}

interface BookCardProps {
  book: Book;
      isDarkMode: boolean;

}


const BookCard: React.FC<BookCardProps> = ({ book,isDarkMode }) => {
    const router = useRouter();
    const usuarioCodigo = localStorage.getItem("codigoUsuario");

    const handleWishListClick = async () => {

    try {
      await axios.post(`/api/wishlist/anadirLibro`, {
        idLibro: book.idLibro,
        codigo: usuarioCodigo,
      });
          await axios.post(`/api/notificaciones/agregarPara`, {
      codigoUsuario: usuarioCodigo,
      mensaje: `Agregaste el libro '${book.titulo}' a tu lista de deseos`,
      roomId: '1'
          });
      
       toast.success("Libro añadido a la lista de deseos.", {
                 theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

      autoClose: 1000,
      hideProgressBar: true,
      position: "top-center",
    });  } catch (error) {
      console.error("Error añadiendo libro a la lista de deseos:", error);
         toast.info("El libro ya se encuentra en tu lista de deseos.", {
                   theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

        autoClose: 1500, // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",
      });  
    }
  };

    const handleCardClick = () => {
    router.push(`/DetallesLibro?idLibro=${book.idLibro}`);
  };

  

return (
  <div className={`rounded-lg shadow-md overflow-hidden ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"}`} style={{ cursor: 'pointer' }}>
    <ToastContainer />
    <div className="p-4">
      <img onClick={handleCardClick} src={book.imagen} alt={book.titulo} className="w-full h-48 object-cover rounded-md" />
      <h2 onClick={handleCardClick} className="font-bold text-lg">{book.titulo}</h2>
      <p onClick={handleCardClick} className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>by {book.autor}</p>
      <p onClick={handleCardClick} className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Estado: {book.disponible ? "🟢" : "🔴"}</p>
      <button
        onClick={handleWishListClick}
        className="mt-2 bg-cbookC-600 text-white py-1 px-4 rounded"
      >
        Añadir a WishList
      </button>
    </div>
  </div>
);

};

export default BookCard;
