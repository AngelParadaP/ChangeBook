import React from "react";
import { useState } from "react";
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
  isDarkMode : boolean;

}

const BookCard: React.FC<BookCardProps> = ({ book, onDelete,isDarkMode }) => {

  const handleDelete = async () => {

      try {
        await deleteBook(book.idLibro, book.titulo);
        onDelete(book.idLibro);
      } catch (error) {
        console.error("Error deleting book:", error);
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

    const [showModal, setShowModal] = useState(false);


  const handleRemoveFromUser = async () => {
    setShowModal(true);
  };


  const handleCancelDelete = () => {
    setShowModal(false);
  };

  return (
  <div
    className={`rounded-lg shadow-md flex w-full ${isDarkMode ? "bg-gray-700 text-white" : "bg-white"}`}
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
        <h2 className={`font-cbookF font-bold text-xl mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>{book.titulo}</h2>
        <p className={`font-cbookF text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          by {book.autor}
        </p>
        <p className={`font-cbookF text-sm mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"} text-justify`}>
          {book.sinopsis}
        </p>
        <p className={`font-cbookF mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
          Estado: {book.disponible ? "🟢" : "🔴"}
        </p>
      </div>
      {/* Botones de acciones */}
      <div className="flex flex-row-reverse mt-4 w-full justify-start">
        <button
          onClick={handleRemoveFromUser}
          className={`bg-red-500 hover:bg-red-400 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-2 ${isDarkMode ? "bg-red-700 hover:bg-red-600" : ""}`}
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
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleCardClick}
          className={`bg-cbookC-500 hover:bg-cbookC-400 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-2 ${isDarkMode ? "bg-cbookC-700 hover:bg-cbookC-600" : ""}`}
        >
          Ver detalles del libro
        </button>
        <button
          onClick={handleUpdateAvailability}
          className={`bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline ml-2 ${isDarkMode ? "bg-cbookC-900 hover:bg-cbookC-800" : ""}`}
        >
          Cambiar Disponibilidad
        </button>
      </div>
    </div>
  </div>
);
};

export default BookCard;
