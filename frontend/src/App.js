// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// ✅ Importe tes pages ici
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EnseignantDashboard from './pages/DashbordEnseignant'; // ✅ Cette ligne était manquante
import MarquerPresences from './pages/MarquerPresences';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard/enseignant" element={<EnseignantDashboard />} />
          <Route path="/marquer-presences" element={<MarquerPresences />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;