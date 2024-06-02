import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateBookAvailability } from "../PerfilUsuario/libro.service";

interface BookCardProps {
  idLibro: string;
  titulo: string;
  editorial: string;
  descripcion: string;
  sinopsis: string;
  autor: string;
  calificacion: number;
  intercambios: number;
  isbn: string;
  ano_de_publicacion: string;
  disponible: boolean;
  userNombre: string;
  codigoUsuario: string;
  imagenPerfil: string;
  imagen: string;
  lugar: string | null;
  fechaEntrega: Date | null;
  fechaDevolucion: Date | null;
  exchanges: Exchange[];
    isDarkMode: boolean;

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
  lugar,
  fechaEntrega,
  fechaDevolucion,
  exchanges,
  isDarkMode,
}) => {
  const [solicitanteNombres, setSolicitanteNombres] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    const fetchSolicitanteNombres = async () => {
      const nombres: { [key: string]: string } = {};
      for (const exchange of exchanges) {
        try {
          const response = await axios.get(`api/user/get/${exchange.usuarioSolicitante}`);
          nombres[exchange.usuarioSolicitante] = response.data.nombre; // Assuming the response from the API contains a "nombre" field
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setSolicitanteNombres(nombres);
    };
    fetchSolicitanteNombres();
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

  const filteredExchanges = exchanges.filter(exchange => {
    const exchangeIdLibro = exchange.id.split('_').pop();
    return exchangeIdLibro === idLibro;
  });

  const handleDeleteExchange = async (id: string) => {
    try {
      await axios.delete(`/api/exchange/${id}`);
        await updateBookAvailability(idLibro , true);

      // You may want to update the state or trigger a re-fetch of exchanges after deletion
      toast.success("Intercambio eliminado correctamente", {
                theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

        autoClose: 1000, // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error deleting exchange:", error);
      toast.error("Error al eliminar el intercambio", {
                theme: isDarkMode ? "dark" : "light", // Aquí se define el tema del toast

        autoClose: 1000, // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",
      });
    }
  };

  return (
    <div className={`rounded-md p-2 flex flex-col items-start overflow-y-auto max-h-90 ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-white'}`}>
      <ToastContainer/>
      {filteredExchanges.map((exchange) => (
        <div key={exchange.id} className={`rounded p-5 mb-1 ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-black'}`}>
          <div className="flex items-center ">
            <img
              loading="lazy"
              src={imagen}
              alt={titulo}
              className="object-cover w-24 h-32 rounded-md mr-2"
            />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold font-cbookF">{titulo}</h2>
              <p className={`text-sm font-cbookF ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{autor}</p>
            </div>
          </div>
          <p className={`font-cbookF block font-bold mb-0 mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Solicitante:</strong> {solicitanteNombres[exchange.usuarioSolicitante] || exchange.usuarioSolicitante}
          </p>
          <p className={`font-cbookF block font-bold mb-0 mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Lugar:</strong> {exchange.lugar || "No especificado"}
          </p>
          <p className={`font-cbookF block font-bold mb-0 mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Fecha y hora de entrega:</strong> {formatDateTime(exchange.fechaEntrega)}
          </p>
          <p className={`font-cbookF block font-bold mb-0 mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <strong>Fecha y hora de devolución:</strong> {formatDateTime(exchange.fechaDevolucion)}
          </p>
          <div className="flex justify-around mt-4">
            <button className="bg-red-500 text-white p-2 rounded" onClick={() => handleDeleteExchange(exchange.id)}>
              Borrar intercambio
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookCard;