import React from 'react';

function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <button onClick={handleLogout} style={{
      background: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: 4,
      padding: '8px 16px',
      cursor: 'pointer'
    }}>
      Déconnexion
    </button>
  );
}

export default LogoutButton;