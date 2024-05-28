import { useState, useEffect } from "react";
import axios from "axios";
import BookCard from "./cardBook";
import { IdBooks } from "./libro.service";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateBookAvailability } from "../PerfilUsuario/libro.service";

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

const AcceptExchangeModal = ({ exchangeId, closeModal, myusername, otherusername, roomId , OtherUserCodigo, myusercodigo}: {myusername:string; otherusername:string; roomId:string | null; OtherUserCodigo:string; myusercodigo:string; exchangeId: string; closeModal: () => void } ) => {
  const [exchangeDetails, setExchangeDetails] = useState(null);
const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
    const idLibro = exchangeId.split('_').pop(); // Adjusted to match the expected format

  useEffect(() => {

    IdBooks(idLibro)
      .then((IdBooks) => {
        setBooks(IdBooks);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });
  }, [idLibro]);
  
  useEffect(() => {
    const fetchExchangeDetails = async () => {
      try {
        const response = await axios.get(`/api/exchange/${exchangeId}`);
        setExchangeDetails(response.data);

        // Extract the book ID from the exchangeId
        const bookId = exchangeId.split('_').pop(); // Adjusted to match the expected format
        console.log("Book ID extracted:", bookId);

        // Fetch book details using the extracted book ID
        const bookResponse = await axios.get(`/api/books/byId/${bookId}`);
        setBookDetails(bookResponse.data);
      } catch (error) {
        console.error("Error fetching exchange details:", error);
      }
    };

    if (exchangeId) {
      fetchExchangeDetails();
    }
  }, [exchangeId]);


const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
};

  const handleAccept = async () => {
    try {
      await axios.patch(`/api/exchange/${exchangeId}`, { aceptado: true });
      await updateBookAvailability(idLibro , false);
      axios.post(`api/books/sumarIntercambio/${idLibro}`)
          axios.post("/api/notificaciones/agregarPara", {
              codigoUsuario: myusercodigo,
              mensaje: `Tienes un intercambio pendiente con ${otherusername} el dia ${formatTime(exchangeDetails.fechaEntrega)}`,
              roomId: roomId,
            });
                axios.post("/api/notificaciones/agregarPara", {
              codigoUsuario: OtherUserCodigo,
              mensaje: `${myusername} acepto tu solicitud de intercambio para el dia ${formatTime(exchangeDetails.fechaEntrega)}`,
              roomId: roomId,
            });
              toast.info("Recuerda llegar el dia y hora acordado", {
        autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",
      });
      setTimeout(() => {
    closeModal();
      }, 1500);
    } catch (error) {
      console.error("Error accepting exchange:", error);
    }
  };

  const handleDecline = async () => {
    try {
      await axios.delete(`/api/exchange/${exchangeId}`);
      axios.post("/api/notificaciones/agregarPara", {
              codigoUsuario: OtherUserCodigo,
              mensaje: `${myusername} rechazo tu solicitud de intercambio`,
              roomId: roomId,
            });
      closeModal();
    } catch (error) {
      console.error("Error declining exchange:", error);
    }
  };

if (!exchangeDetails || !bookDetails) {
  console.log("Datos de exchangeDetails:", exchangeDetails);
  console.log("Datos de bookDetails:", bookDetails);
  return <div>Cargando...</div>;
}

// Antes de renderizar el componente
console.log("Datos de bookDetails antes de renderizar el componente:", bookDetails);






  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <ToastContainer/>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-md">
        <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">
          Aceptar Intercambio
        </h2>
        <div className="ml-4 mr-4 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          {books.map((book) => (
            <BookCard key={book.idLibro} {...book} />
          ))}
        </div>
        <div className="text-left ml-4">
          <p><span className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Lugar:</span> {exchangeDetails.lugar}</p>
          <p><span className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Fecha y hora de Entrega :</span> {formatTime(exchangeDetails.fechaEntrega)}</p>
          <p><span className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Fecha y hora de Devolución :</span> {formatTime(exchangeDetails.fechaDevolucion)}</p>
        </div>
        <div className="flex justify-around mt-4">
          <button
            className="bg-green-500 text-white p-2 rounded"
            onClick={handleAccept}
          >
            Aceptar
          </button>
          <button
            className="bg-red-500 text-white p-2 rounded"
            onClick={handleDecline}
          >
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcceptExchangeModal;