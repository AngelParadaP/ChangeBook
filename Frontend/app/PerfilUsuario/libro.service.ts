import axios from "axios";

const API_BASE_URL = "http://localhost:3000/libro";

export const fetchBooks = async () => {
  try {
    const codigoUsuario = localStorage.getItem("codigoUsuario");
    const response = await axios.get(`/api/books/for/${codigoUsuario}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

export const deleteBook = async (idLibro: string, tituloLibro: string) => {
  try {
    const response = await axios.delete(`/api/books/${idLibro}`);
    const codigoUsuario = localStorage.getItem("codigoUsuario");
    await axios.post(`/api/notificaciones/agregarPara`, {
      codigoUsuario,
      mensaje: `Borraste el libro '${tituloLibro}'`,
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting book:", error);
    throw error;
  }
};

export const updateBookAvailability = async (
  idLibro: string,
  disponible: boolean
) => {
  try {
    const response = await axios.patch(`/api/books/${idLibro}`, { disponible });
    return response.data;
  } catch (error) {
    console.error("Error updating book availability:", error);
    throw error;
  }
};
