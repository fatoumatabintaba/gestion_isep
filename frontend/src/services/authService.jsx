import api from './api'; // Ton instance Axios
import axios from 'axios';

const handleLogin = async (credentials) => {
  try {
    await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    const res = await axios.post('http://localhost:8000/api/login', credentials, { withCredentials: true });
    
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    
    // 🔥 Redirection intelligente
    window.location.href = res.data.redirect;
  } catch (err) {
    console.error('Erreur de connexion:', err.response?.data?.message || err.message);
    throw new Error('Échec de connexion');
  }
};

export { handleLogin };