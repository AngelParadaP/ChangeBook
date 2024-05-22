import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/libro';

export const fetchBooks = async (query: string) => { // Añade el parámetro 'query'
  try {
    const response = await axios.get(`api/libro/buscar/${query}`); // Utiliza el término de búsqueda en la URL
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};
