import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/user';

export const fetchUser = async (codigo: string) => {
  try {
    const response = await axios.get(`/api/user/get/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};
