import React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
}


const BookCard: React.FC<BookCardProps> = ({ book }) => {
    const router = useRouter();
    const usuarioCodigo = localStorage.getItem("codigoUsuario");

    const handleWishListClick = async () => {

    try {
      await axios.post(`/api/wishlist/anadirLibro`, {
        idLibro: book.idLibro,
        codigo: usuarioCodigo,
      });
      alert("Libro añadido a la lista de deseos.");
    } catch (error) {
      console.error("Error añadiendo libro a la lista de deseos:", error);
    }
  };

    const handleCardClick = () => {
    router.push(`/DetallesLibro?idLibro=${book.idLibro}`);
  };

  

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden" onClick={handleCardClick}  style={{ cursor: 'pointer' }} >
      <div className="p-4">
        <img src={book.imagen} alt={book.titulo} className="w-full h-48 object-cover rounded-md" />
        <h2 className="font-bold text-lg">{book.titulo}</h2>
        <p className="text-sm text-gray-600">by {book.autor}</p>
        <p className="text-gray-600">Estado: {book.disponible ? "🟢" : "🔴"}</p>
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
