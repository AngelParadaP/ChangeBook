import React from "react";
import { deleteBook, updateBookAvailability } from "./libro.service";
import { useRouter } from "next/navigation";
import "./styles.css";

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
  onDelete: (idLibro: string) => void;
  onUpdateAvailability: (idLibro: string, disponible: boolean) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const handleDelete = async () => {
    const confirmDelete = window.confirm("¿Deseas eliminar este libro?");
    if (confirmDelete) {
      try {
        await deleteBook(book.idLibro, book.titulo);
        onDelete(book.idLibro);
      } catch (error) {
        console.error("Error deleting book:", error);
      }
    }
  };
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/DetallesLibro?idLibro=${book.idLibro}`);
  };

  const handleUpdateAvailability = async () => {
    try {
      const newAvailability = !book.disponible;
      await updateBookAvailability(book.idLibro, newAvailability);
      updateBookAvailability(book.idLibro, newAvailability);
      window.location.reload();
    } catch (error) {
      console.error("Error updating book availability:", error);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md flex w-full"
      style={{ cursor: "pointer" }}
    >
      {/* Sección de la imagen */}
      <img
        src={book.imagen}
        alt={book.titulo}
        className="w-44 h-72 object-cover p-2"
      />
      {/* Sección de la información */}
      <div className="flex flex-col justify-between p-4 w-auto">
        {/* Información del libro */}
        <div>
          <h2 className="font-cbookF font-bold text-xl mb-2">{book.titulo}</h2>
          <p className="font-cbookF text-sm text-cbookC-800 font-bold mb-2">
            by {book.autor}
          </p>
          <p className="font-cbookF text-sm text-gray-600 mb-2 text-justify">
            {book.sinopsis}
          </p>
          <p className="font-cbookF text-gray-600">
            Estado: {book.disponible ? "🟢" : "🔴"}
          </p>
        </div>
        {/* Botones de acciones */}
        <div className="flex flex-row-reverse mt-4 w-full justify-start">
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-400 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-2"
          >
            Eliminar
          </button>
          <button
            onClick={handleCardClick}
            className="bg-cbookC-500 hover:bg-cbookC-400 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-2"
          >
            Ver detalles del libro
          </button>
          <button
            onClick={handleUpdateAvailability}
            className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-"
          >
            Cambiar Disponibilidad
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
