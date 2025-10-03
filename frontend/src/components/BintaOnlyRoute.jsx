// src/components/BintaOnlyRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

function BintaOnlyRoute() {
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔐 Seul Binta peut accéder à /admin
  if (!user || user.name !== 'binta') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>🔐 Accès interdit</h3>
        <p>
          Ce panneau est réservé à l’administratrice <strong>Binta</strong>.
        </p>
        <a href="/login" style={{ color: '#007bff' }}>← Retour à la connexion</a>
      </div>
    );
  }

  return (
    <iframe
      src="http://localhost:8000/admin"
      title="Panel Administrateur"
      style={{ width: '100%', height: '100vh', border: 'none' }}
    />
  );
}

export default BintaOnlyRoute;