import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Users, 
  BarChart3,
  LogOut,
  Award,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';

function DashboardChefDepartement() {
  const [user, setUser] = useState({ name: 'Dr. Diallo', role: 'chef_departement' });
  const [devoirs, setDevoirs] = useState([
    {
      id: 1,
      titre: "Examen Algorithmique",
      uea: { nom: "Informatique Fondamentale" },
      enseignant: { user: { name: "Prof. Sow" } },
      date: "2025-09-28",
      type: "Examen"
    },
    {
      id: 2,
      titre: "TP Réseaux",
      uea: { nom: "Télécommunications" },
      enseignant: { user: { name: "Prof. Ndiaye" } },
      date: "2025-09-27",
      type: "TP"
    },
    {
      id: 3,
      titre: "Projet Électronique",
      uea: { nom: "Électronique Analogique" },
      enseignant: { user: { name: "Prof. Ba" } },
      date: "2025-09-26",
      type: "Projet"
    }
  ]);
  const [activeSection, setActiveSection] = useState('validation');

  const handleApprove = (id) => {
    alert(`Devoir ${id} approuvé avec succès!`);
    setDevoirs(devoirs.filter(d => d.id !== id));
  };

  const handleReject = (id) => {
    alert(`Devoir ${id} rejeté.`);
    setDevoirs(devoirs.filter(d => d.id !== id));
  };

  const handleLogout = () => {
    alert('Déconnexion...');
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Examen': return 'bg-red-100 text-red-700 border-red-200';
      case 'TP': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Projet': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Header Premium avec Logo */}
      <header className="relative bg-gradient-to-r from-amber-800 via-yellow-700 to-amber-800 shadow-2xl overflow-hidden">
        {/* Effet de texture métallique */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <button
  onClick={() => window.open('http://localhost:8000/binta/responsable-metiers', '_blank')}
  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg"
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
  <span>Gérer les Responsables Métier</span>
</button>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            {/* Logo et Titre */}
            <div className="flex items-center space-x-5">
              {/* Logo EIT Stylisé */}
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-all"></div>
                <div className="relative bg-gradient-to-br from-amber-50 to-yellow-100 rounded-full p-3 shadow-2xl border-4 border-white/50">
                  <div className="w-14 h-14 flex items-center justify-center relative">
                    {/* Circle avec E */}
                    <div className="w-12 h-12 rounded-full border-[3px] border-amber-800 flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-50 shadow-inner relative">
                      <span className="text-amber-900 font-bold text-2xl" style={{fontFamily: 'Georgia, serif'}}>E</span>
                      {/* Points décoratifs */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full shadow-md"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full shadow-md"></div>
                    </div>
                    {/* Petit accent orbital */}
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Texte du département */}
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
                  Département <span className="text-yellow-200">EIT</span>
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <p className="text-amber-100 text-sm font-medium tracking-wide">
                    Électronique • Informatique • Télécommunication
                  </p>
                </div>
              </div>
            </div>
            
            {/* User Info et Déconnexion */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border border-white/30 shadow-lg">
                <div className="w-11 h-11 bg-gradient-to-br from-white to-amber-50 rounded-full flex items-center justify-center shadow-md border-2 border-white/50">
                  <span className="text-amber-800 font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-white">
                  <p className="font-bold text-sm">{user?.name}</p>
                  <p className="text-xs text-amber-100 flex items-center space-x-1">
                    <Award size={12} />
                    <span>Chef de Département</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-xl transition-all border border-white/30 hover:scale-105 shadow-lg"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <Bell className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{devoirs.length}</p>
                <p className="text-xs text-gray-600">En attente</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <CheckCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-600">Validés</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="text-xs text-gray-600">Apprenants</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">8.5</p>
                <p className="text-xs text-gray-600">Moyenne</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 px-6 py-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10"></div>
                <h2 className="relative text-white font-bold text-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                  <span>Navigation</span>
                </h2>
              </div>
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => setActiveSection('validation')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                    activeSection === 'validation'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Bell size={20} />
                  <span>Validations</span>
                  {devoirs.length > 0 && (
                    <span className={`ml-auto ${activeSection === 'validation' ? 'bg-white text-amber-700' : 'bg-red-500 text-white'} text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow`}>
                      {devoirs.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveSection('coefficients')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                    activeSection === 'coefficients'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={20} />
                  <span>Coefficients</span>
                </button>
                <button
                  onClick={() => setActiveSection('bilan')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                    activeSection === 'bilan'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 size={20} />
                  <span>Bilan</span>
                </button>
                <button
                  onClick={() => setActiveSection('apprenants')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                    activeSection === 'apprenants'
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg scale-[1.02]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={20} />
                  <span>Apprenants</span>
                </button>
              </nav>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-4">
                  <Award className="text-yellow-200" size={24} />
                  <h3 className="text-sm font-bold uppercase tracking-wide">Aperçu</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <p className="text-yellow-100 text-sm mb-1">Actions requises</p>
                    <p className="text-4xl font-bold">{devoirs.length}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-yellow-100 text-xs mb-1">Ce mois</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-yellow-100 text-xs mb-1">Total</p>
                      <p className="text-2xl font-bold">47</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeSection === 'validation' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-6 py-5 flex items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <Bell className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Demandes de validation</h2>
                      <p className="text-amber-100 text-sm">Gérez les devoirs en attente d'approbation</p>
                    </div>
                  </div>
                  {devoirs.length > 0 && (
                    <span className="relative bg-white text-amber-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {devoirs.length} en attente
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {devoirs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <CheckCircle className="text-white" size={48} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Excellent travail !</h3>
                      <p className="text-gray-600 text-lg">Toutes les demandes ont été traitées.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {devoirs.map((d) => (
                        <div
                          key={d.id}
                          className="group border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all bg-gradient-to-br from-white to-gray-50 hover:border-amber-300"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-amber-700 transition-colors">
                                    {d.titre}
                                  </h3>
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(d.type)}`}>
                                    {d.type}
                                  </span>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center space-x-2 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                                  <FileText className="text-amber-600" size={16} />
                                  <div>
                                    <p className="text-xs text-amber-700 font-semibold">UEA</p>
                                    <p className="text-gray-800 font-medium">{d.uea?.nom || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                  <Users className="text-blue-600" size={16} />
                                  <div>
                                    <p className="text-xs text-blue-700 font-semibold">Enseignant</p>
                                    <p className="text-gray-800 font-medium">{d.enseignant?.user?.name}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-3 text-gray-500">
                                <Clock size={14} />
                                <p className="text-xs">Soumis le {d.date}</p>
                              </div>
                            </div>
                            <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                              <button
                                onClick={() => handleApprove(d.id)}
                                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-3 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                              >
                                <CheckCircle size={20} />
                                <span>Approuver</span>
                              </button>
                              <button
                                onClick={() => handleReject(d.id)}
                                className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl hover:scale-105"
                              >
                                <XCircle size={20} />
                                <span>Rejeter</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'coefficients' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <FileText className="text-white" size={24} />
                    </div>
                    <h2 className="text-white font-bold text-2xl">Gestion des Coefficients</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Configuration des coefficients par UEA...</p>
                </div>
              </div>
            )}

            {activeSection === 'bilan' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <BarChart3 className="text-white" size={24} />
                    </div>
                    <h2 className="text-white font-bold text-2xl">Bilan Semestriel</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Rapport et statistiques du semestre...</p>
                </div>
              </div>
            )}

            {activeSection === 'apprenants' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10"></div>
                  <div className="relative flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <Users className="text-white" size={24} />
                    </div>
                    <h2 className="text-white font-bold text-2xl">Liste des Apprenants</h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Gestion des apprenants du département...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardChefDepartement;