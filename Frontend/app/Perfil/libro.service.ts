import axios from 'axios';

export const fetchBooksByUser = async (codigoUsuario: string) => {
  try {
    const response = await axios.get(`/api/books/for/${codigoUsuario}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};
