// src/pages/AdminPanel.jsx
import React from 'react';

function AdminPanel() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>🔐 Espace Administrateur</h2>
      <p>Ceci est le panneau admin Filament.</p>
      <iframe
        src="http://localhost:8000/admin"
        title="Admin Panel"
        style={{ width: '100%', height: '800px', border: 'none' }}
      />
    </div>
  );
}

export default AdminPanel;