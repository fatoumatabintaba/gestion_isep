// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true // 🔥 Obligatoire pour les cookies (CSRF, session)
});

// Intercepteur : récupère le CSRF avant chaque requête POST/PUT/DELETE
api.interceptors.request.use(async (config) => {
    if (['post', 'put', 'delete', 'patch'].includes(config.method)) {
        await fetch('http://localhost:8000/sanctum/csrf-cookie', {
            credentials: 'include'
        });
    }
    return config;
});

export default api;