import api from './api'; // Ton instance Axios

const handleLogin = async (credentials) => {
  try {
    const res = await api.post('/login', credentials); // ou '/api/login' selon ton backend
    
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