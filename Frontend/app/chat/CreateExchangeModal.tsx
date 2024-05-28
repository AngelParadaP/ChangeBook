import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Book {
  idLibro: string;
  titulo: string;
    disponible: boolean; // Agregar la propiedad disponible al libro
}

interface CreateExchangeModalProps {
  closeModal: () => void;
  otherUserCodigo: string;
  myUserCodigo: string | null;
  roomId:string | null;
  username:string;
}


const CreateExchangeModal: React.FC<CreateExchangeModalProps> = ({ closeModal, otherUserCodigo, roomId,username,myUserCodigo}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [devolucionDateTime, setDevolucionDateTime] = useState<string>('');
  const [entregaDateTime, setEntregaDateTime] = useState<string>('');
  const [lugar, setLugar] = useState<string>('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(`/api/books/for/${otherUserCodigo}`);
        setBooks(response.data);
        console.log('Fetched Books:', response.data); // Depuración adicional
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, [otherUserCodigo]);
    const availableBooks = books.filter(book => book.disponible); // Filtrar los libros disponibles


  const handleCreateExchange = async () => {
  // Verificar si se ha seleccionado un libro
if (!selectedBook) {
    toast.info("Debes seleccionar un libro.",{autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",});
    return;
  }

  // Verificar si la fecha y hora de entrega están completas
  if (!entregaDateTime) {
    toast.info("Debes ingresar la fecha y hora de entrega.",{autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",});
    return;
  }

  // Verificar si la fecha y hora de devolución están completas
  if (!devolucionDateTime) {
    toast.info("Debes ingresar la fecha y hora de devolución.",{autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",});
    return;
  }

  // Verificar si se ha ingresado el lugar
  if (!lugar) {
    toast.info("Debes ingresar el lugar.",{autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",});
    return;
  }

  // Crear el objeto de intercambio
  const exchange = {
    id: `${otherUserCodigo}_${selectedBook}`,
    usuarioReceptor: otherUserCodigo,
    usuarioSolicitante:myUserCodigo,
    tituloLibro: selectedBook,
    aceptado: false,
    fechaDevolucion: new Date(devolucionDateTime),
      fechaEntrega: new Date(entregaDateTime),
    lugar: lugar // Agregar lugar
  };

  try {
    // Postear el intercambio al backend
    await axios.post('/api/exchange', exchange);
    axios.post("/api/notificaciones/agregarPara", {
              codigoUsuario: otherUserCodigo,
              mensaje: `Tienes una solicitud de intercambio de ${username}`,
              roomId: roomId,
            });
        toast.success("Solicitud enviada", {
        autoClose: 1000 , // Duración de 1000 ms (1 segundo)
        hideProgressBar: true,
        position: "top-center",
      });
      setTimeout(() => {
    closeModal();
      }, 1500);
  } catch (error) {
    console.error('Error creando el intercambio:', error);
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <ToastContainer/>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-md h-5/6 flex flex-col">
        <h2 className="text-center font-cbookF font-bold text-3xl justify-center text-cbookC-700 mt-3 mb-5">Crear Intercambio</h2>
        <div className="flex flex-col space-y-4">
          <label htmlFor="libro" className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Seleccionar Libro:</label>
          <select
            id="libro"
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="rounded-lg p-2 w-full bg-gray-100 text-gray-600 font-cbookF focus:outline-none"
          >
            <option value="">Seleccione un libro</option>
            {availableBooks.map((book) => (
              <option key={book.idLibro} value={book.idLibro}>{book.titulo}</option>
            ))}
          </select>
          <label htmlFor="fechaEntrega" className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Fecha y Hora de Entrega:</label>
          <input
            type="datetime-local"
            id="fechaEntrega"
            value={entregaDateTime}
            onChange={(e) => setEntregaDateTime(e.target.value)}
          className="rounded-lg p-2 w-full bg-gray-100 text-gray-600 font-cbookF focus:outline-none"

/>
          <label htmlFor="fechaDevolucion" className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Fecha y Hora de Devolución:</label>
          <input
            type="datetime-local"
            id="fechaDevolucion"
            value={devolucionDateTime}
            onChange={(e) => setDevolucionDateTime(e.target.value)}
          className="rounded-lg p-2 w-full bg-gray-100 text-gray-600 font-cbookF focus:outline-none"
          />

          <label htmlFor="lugar" className="font-cbookF block text-gray-600 font-bold mb-0 mt-1">Lugar:</label>
          <input
            type="text"
            id="lugar"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
          className="rounded-lg p-2 w-full bg-gray-100 text-gray-600 font-cbookF focus:outline-none"
          />
                <div className="flex justify-center space-x-4 mt-8">

          <button onClick={handleCreateExchange}           className="bg-cbookC-700 hover:bg-cbookC-600 text-white font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline mt-4"
>
            Crear Intercambio
          </button>
                <button
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-cbookC-700 font-cbookF font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
onClick={closeModal}        >
          Cancelar
        </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExchangeModal;