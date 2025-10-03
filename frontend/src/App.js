// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import api from './services/api';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InformatiquePage from './pages/InformatiquePage';
import ReseauTelecomPage from './pages/ReseauTelecomPage';
import AdminReseauPage from './pages/AdminReseauPage';
import DashboardChefDepartement from './pages/DashboardChefDepartement';
import DashboardCoordinateur from './pages/DashboardCoordinateur';
import DashboardResponsableMetier from './pages/DashboardResponsableMetier';
import DashboardApprenant from './pages/DashboardApprenant';

// Composant sécurisé
import BintaOnlyRoute from './components/BintaOnlyRoute'; // ✅ Nouveau composant

function App() {
  useEffect(() => {
    const fetchData = async () => {
      await api.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    };
    fetchData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/metier/informatique" element={<InformatiquePage />} />
        <Route path="/metier/reseau-telecom" element={<ReseauTelecomPage />} />
        <Route path="/metier/admin-reseau" element={<AdminReseauPage />} />
        <Route path="/dashboard/chef" element={<DashboardChefDepartement />} />
        <Route path="/dashboard/coordinateur" element={<DashboardCoordinateur />} />
        <Route path="/dashboard/responsable-metier" element={<DashboardResponsableMetier />} />
        <Route path="/dashboard/apprenant" element={<DashboardApprenant />} />

        {/* 🔐 Seul Binta peut accéder à Filament */}
        <Route path="/admin/*" element={<BintaOnlyRoute />} />
      </Routes>
    </Router>
  );
}

export default App;