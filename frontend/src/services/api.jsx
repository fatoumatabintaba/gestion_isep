// src/services/api.js
import axios from 'axios';

// 1. Créer l'instance Axios pour les routes API
const api = axios.create({
  baseURL: 'http://localhost:8000', // ✅ Enlève le / final
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// 2. Intercepteur : Ajoute automatiquement le Bearer Token si disponible
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Intercepteur de réponse : Gestion globale des erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne redirige pas si la requête est pour le CSRF cookie
    if (
      error.response?.status === 401 &&
      !error.config.url.includes('/sanctum/csrf-cookie')
    ) {
      console.warn("Non authentifié - Déconnexion");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ❌ SUPPRIME l'appel ici → on le fait dans Register/Login

export default api;