// src/components/LogoutButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Assure-toi que ce chemin est correct

const LogoutButton = ({ 
  variant = 'danger', 
  size = 'md',
  className = '',
  style = {}
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Optionnel : appeler l'API pour invalider le token côté serveur
      await api.post('/api/logout');
    } catch (error) {
      console.warn('⚠️ Erreur API lors de la déconnexion (peut être ignorée):', error);
    } finally {
      // Supprimer les données d'authentification
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Afficher le message de succès
      alert('✅ Déconnexion réussie !');

      // Rediriger vers la page d'accueil (LandingPage)
      navigate('/', { replace: true });
    }
  };

  // Styles par défaut (tu peux les modifier selon ton design)
  const baseStyle = {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: size === 'sm' ? '4px 8px' : size === 'lg' ? '12px 24px' : '8px 16px',
    cursor: 'pointer',
    fontWeight: '500',
    ...style
  };

  return (
    <button 
      onClick={handleLogout} 
      className={className}
      style={baseStyle}
    >
      Déconnexion
    </button>
  );
};

export default LogoutButton;