import React, { useState, useEffect } from "react";
import axios from "axios";
import BookCard from "./cardBook";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IdBooks } from "./libro.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface BookDetails {
  idLibro: string;
  titulo: string;
  isbn: string;
  ano_de_publicacion: string;
  editorial: string;
  autor: string;
  sinopsis: string;
  imagen: string;
  calificacion: number;
  intercambios: number;
  disponible: boolean;
}

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
  isbn: string;
  ano_de_publicacion: string;
  userNombre: string;
  codigoUsuario: string;
  imagenPerfil: string;
  imagen: string;
}

interface Exchange {
  id: string;
  tituloLibro: string;
  aceptado: boolean;
  usuarioReceptor: string;
  usuarioSolicitante: string;
  fechaDevolucion: Date | null;
  fechaEntrega: Date | null;
  lugar: string | null;
}

const IntercambiosActivos: React.FC<{ closeModal: () => void }> = ({ closeModal }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [usuarioReceptor, setUsuarioReceptor] = useState<string>("");

  useEffect(() => {
    const usuarioReceptor = localStorage.getItem("codigoUsuario");
    if (usuarioReceptor) {
      setUsuarioReceptor(usuarioReceptor);
      axios
        .get(`/api/exchange/active/${usuarioReceptor}`)
        .then((response) => {
          setExchanges(response.data);
        })
        .catch((error) => {
          console.error("Error fetching active exchanges:", error);
        });
    }
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const bookIds = exchanges.map((exchange) => exchange.id.split('_').pop());
        const bookPromises = bookIds.map((idLibro) => IdBooks(idLibro));
        const bookResults = await Promise.all(bookPromises);
        const books = bookResults.flat(); // Flatten the array of arrays into a single array
        setBooks(books);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };

    if (exchanges.length > 0) {
      fetchBooks();
    }
  }, [exchanges]);

  const formatDateTime = (dateString: Date | null) => {
    if (!dateString) return "No especificado";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">Intercambios Activos</h2>
         <button
        className="absolute top-0 right-0 p-2"
        onClick={closeModal}
      >
        <FontAwesomeIcon
          icon={faTimes}
          className="text-cbookC-700 w-8 h-8"
        ></FontAwesomeIcon>
      </button>
      <div className="overflow-y-auto max-h-96">
        {books.map((book) => (
          <BookCard key={book.idLibro} {...book} exchanges={exchanges} />
        ))}
      </div>
    </div>
  );
};

export default IntercambiosActivos;
