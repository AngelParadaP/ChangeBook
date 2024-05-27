import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/libro';

export const IdBooks = async (query: string | null) => {
  try {
    const response = await axios.get(`api/books/byId/${query}`);
    return response.data.map((book: any) => ({
      ...book,
      userNombre: book.user.nombre,
      codigoUsuario: book.user.codigo,
      imagenPerfil: book.user.imagenPerfil,
      imagen: book.imagen, // Añadir esta propiedad
    }));
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};
