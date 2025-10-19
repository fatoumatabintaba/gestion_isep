import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Users, 
  BarChart3,
  Award,
  TrendingUp,
  Calendar,
  Clock,
  Send,
  UserCheck,
  BookOpen,
  UserCog
} from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

function DashboardChefDepartement() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'Dr. Diallo', role: 'chef_departement' });
  const [activeSection, setActiveSection] = useState('affecter-uea');
  
  // Données des enseignants (existent en base)
  const [enseignants, setEnseignants] = useState([
    { 
      id: 1, 
      nom: "Prof. Sow", 
      specialite: "Informatique", 
      disponibilite: "Disponible", 
      ueas: ["Algorithmique", "Base de données"],
      ueasDisponibles: ["Programmation Web", "Sécurité informatique"]
    },
    { 
      id: 2, 
      nom: "Prof. Ndiaye", 
      specialite: "Télécommunications", 
      disponibilite: "Occupé", 
      ueas: ["Réseaux"],
      ueasDisponibles: ["Réseaux avancés", "Télécoms"]
    },
    { 
      id: 3, 
      nom: "Prof. Ba", 
      specialite: "Électronique", 
      disponibilite: "Disponible", 
      ueas: ["Électronique Analogique"],
      ueasDisponibles: ["Électronique numérique", "Systèmes embarqués"]
    }
  ]);

  // Rapports vides au départ - seront remplis quand les coordinateurs enverront
  const [rapports, setRapports] = useState([]);

  // UEAs existantes en base
  const [ueas, setUeas] = useState([
    { id: 1, nom: "Algorithmique", specialite: "Informatique", enseignant: "Prof. Sow", statut: "Affectée" },
    { id: 2, nom: "Réseaux Informatiques", specialite: "Télécommunications", enseignant: "Prof. Ndiaye", statut: "Affectée" },
    { id: 3, nom: "Base de données", specialite: "Informatique", enseignant: "Prof. Sow", statut: "Affectée" },
    { id: 4, nom: "Électronique Analogique", specialite: "Électronique", enseignant: "Prof. Ba", statut: "Affectée" },
    { id: 5, nom: "Programmation Web", specialite: "Informatique", enseignant: "À affecter", statut: "Non affectée" },
    { id: 6, nom: "Sécurité informatique", specialite: "Informatique", enseignant: "À affecter", statut: "Non affectée" }
  ]);

  const handleAffecterUEA = (enseignantId, ueaNom) => {
    const enseignant = enseignants.find(e => e.id === enseignantId);
    alert(`UEA "${ueaNom}" affectée à ${enseignant?.nom}`);
    // Logique de mise à jour en base
  };

  const handleValiderRapport = (id) => {
    alert(`Rapport ${id} validé avec succès!`);
    setRapports(rapports.map(r => r.id === id ? { ...r, statut: "Validé" } : r));
  };

  const handleRejeterRapport = (id) => {
    alert(`Rapport ${id} rejeté.`);
    setRapports(rapports.map(r => r.id === id ? { ...r, statut: "Rejeté" } : r));
  };

  const handleEnvoyerAdministration = () => {
    const rapportsValides = rapports.filter(r => r.statut === "Validé");
    if (rapportsValides.length === 0) {
      alert('Veuillez valider au moins un rapport avant d\'envoyer à l\'administration.');
      return;
    }
    alert('Rapport pédagogique envoyé à l\'administration avec succès!');
  };

  const handleGenererRapportPDF = () => {
    alert('Rapport PDF généré avec succès!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-300 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-all"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-full p-3 shadow-2xl border-4 border-white/50">
                  <div className="w-14 h-14 flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full border-[3px] border-blue-800 flex items-center justify-center bg-gradient-to-br from-blue-100 to-white shadow-inner relative">
                      <span className="text-blue-900 font-bold text-2xl" style={{fontFamily: 'Georgia, serif'}}>E</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                  Département <span className="text-blue-200">EIT</span>
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <p className="text-blue-100 text-sm font-medium tracking-wide">
                    Électronique • Informatique • Télécommunication
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.open('http://localhost:8000/binta/responsable-metiers', '_blank')}
                className="relative z-10 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <Users size={20} />
                <span className="hidden lg:inline">Responsables Métier</span>
                <span className="lg:hidden">RM</span>
              </button>
              
              <div className="hidden md:flex items-center space-x-3 bg-white/20 backdrop-blur-md rounded-xl px-5 py-3 border border-white/30 shadow-lg">
                <div className="w-11 h-11 bg-gradient-to-br from-white to-blue-50 rounded-full flex items-center justify-center shadow-md border-2 border-white/50">
                  <span className="text-blue-800 font-bold text-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-white">
                  <p className="font-bold text-sm">{user?.name}</p>
                  <p className="text-xs text-blue-100 flex items-center space-x-1">
                    <Award size={12} />
                    <span>Chef de Département</span>
                  </p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation vers les métiers */}
      <div className="d-flex justify-content-center gap-3 mb-4 mt-4">
        <Button
          variant="primary"
          onClick={() => navigate("/metier/informatique")}
        >
          Développement Web & Mobile
        </Button>
        <Button
          variant="success"
          onClick={() => navigate("/metier/admin-reseau")}
        >
          Administration Système & Réseau
        </Button>
        <Button
          variant="info"
          onClick={() => navigate("/metier/reseau-telecom")}
        >
          Réseau & Télécom
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-blue-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rapports.length}</p>
                <p className="text-xs text-gray-600">Rapports reçus</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <UserCog className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{enseignants.length}</p>
                <p className="text-xs text-gray-600">Enseignants</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{ueas.length}</p>
                <p className="text-xs text-gray-600">UEAs</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">-</p>
                <p className="text-xs text-gray-600">Moyenne générale</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-white font-bold text-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                  <span>Navigation</span>
                </h2>
              </div>
              <nav className="p-3 space-y-1">
                {[
                  { id: 'affecter-uea', icon: UserCheck, label: 'Affecter UEA' },
                  { id: 'consulter-disponibilite', icon: Calendar, label: 'Disponibilité' },
                  { id: 'recevoir-rapport', icon: FileText, label: 'Rapports Reçus' },
                  { id: 'envoyer-rapport', icon: Send, label: 'Envoyer Rapport' }
                ].map((item) => {
                  const Icon = item.icon;
                  const pendingCount = item.id === 'recevoir-rapport' 
                    ? rapports.filter(r => r.statut === "En attente de validation").length 
                    : 0;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-[1.02]'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                      {pendingCount > 0 && (
                        <span className={`ml-auto ${
                          activeSection === item.id ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
                        } text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow`}>
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-4">
                <Award className="text-blue-200" size={24} />
                <h3 className="text-sm font-bold uppercase tracking-wide">Aperçu</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-blue-100 text-sm mb-1">UEAs à affecter</p>
                  <p className="text-4xl font-bold">{ueas.filter(u => u.enseignant === "À affecter").length}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-blue-100 text-xs mb-1">Enseignants</p>
                    <p className="text-2xl font-bold">{enseignants.length}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <p className="text-blue-100 text-xs mb-1">Rapports</p>
                    <p className="text-2xl font-bold">{rapports.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Section 1: Affecter les enseignants aux UEAs */}
            {activeSection === 'affecter-uea' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <UserCheck className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Affecter les Enseignants aux UEAs</h2>
                      <p className="text-blue-100 text-sm">Gestion des attributions pédagogiques</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {enseignants.map((enseignant) => (
                      <div key={enseignant.id} className="border-2 border-blue-200 rounded-2xl p-6 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-lg">{enseignant.nom.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{enseignant.nom}</h3>
                              <p className="text-sm text-gray-600">{enseignant.specialite}</p>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                                enseignant.disponibilite === 'Disponible' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {enseignant.disponibilite}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-2">UEAs Actuelles</h4>
                            <div className="space-y-2">
                              {enseignant.ueas.map((uea, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                                  <span className="text-sm font-medium text-gray-700">{uea}</span>
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                    Affectée
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="font-semibold text-blue-800 mb-2">UEAs Disponibles</h4>
                            <div className="space-y-2">
                              {enseignant.ueasDisponibles.map((uea, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                                  <span className="text-sm font-medium text-gray-700">{uea}</span>
                                  <button
                                    onClick={() => handleAffecterUEA(enseignant.id, uea)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                  >
                                    Affecter
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: Consulter disponibilité */}
            {activeSection === 'consulter-disponibilite' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <Calendar className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Disponibilité des Enseignants</h2>
                      <p className="text-blue-100 text-sm">Consultez les emplois du temps et disponibilités</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {enseignants.map((ens) => (
                      <div key={ens.id} className="border-2 border-blue-200 rounded-2xl p-6 bg-white">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">{ens.nom.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{ens.nom}</h3>
                            <p className="text-sm text-gray-600">{ens.specialite}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                ens.disponibilite === 'Disponible' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {ens.disponibilite}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
                          <h4 className="font-semibold text-blue-800 mb-3">Planning Hebdomadaire</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Lundi</span>
                              <span className="font-medium text-gray-800">08:00 - 12:00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Mercredi</span>
                              <span className="font-medium text-gray-800">14:00 - 18:00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Vendredi</span>
                              <span className="font-medium text-gray-800">10:00 - 16:00</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105">
                            Voir Détails
                          </button>
                          <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105">
                            Contacter
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Recevoir le rapport pédagogique via le coordinateur */}
            {activeSection === 'recevoir-rapport' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <FileText className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Rapports Pédagogiques Reçus</h2>
                      <p className="text-blue-100 text-sm">Rapports transmis par les coordinateurs de métier</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {rapports.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <FileText className="text-white" size={48} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Aucun rapport reçu</h3>
                      <p className="text-gray-600 text-lg">Les rapports des coordinateurs apparaîtront ici lorsqu'ils seront envoyés.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rapports.map((rapport) => (
                        <div key={rapport.id} className="border-2 border-blue-200 rounded-2xl p-6 bg-white">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-xl text-gray-900">{rapport.metier}</h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  rapport.statut === "Validé" 
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : rapport.statut === "Rejeté"
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                }`}>
                                  {rapport.statut}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                  <Users className="text-blue-600" size={16} />
                                  <div>
                                    <p className="text-xs text-blue-700 font-semibold">Coordinateur</p>
                                    <p className="text-gray-800 font-medium">{rapport.coordinateur}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                                  <Clock className="text-blue-600" size={16} />
                                  <div>
                                    <p className="text-xs text-blue-700 font-semibold">Date réception</p>
                                    <p className="text-gray-800 font-medium">{rapport.dateSoumission}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {rapport.statut === "En attente de validation" && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleValiderRapport(rapport.id)}
                                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                                >
                                  <CheckCircle size={16} />
                                  <span>Valider</span>
                                </button>
                                <button
                                  onClick={() => handleRejeterRapport(rapport.id)}
                                  className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                                >
                                  <XCircle size={16} />
                                  <span>Rejeter</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 4: Envoyer le rapport pédagogique aux administrations */}
            {activeSection === 'envoyer-rapport' && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/50">
                      <Send className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-white font-bold text-2xl">Envoyer le Rapport Pédagogique</h2>
                      <p className="text-blue-100 text-sm">Transmission du rapport consolidé à l'administration</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {/* État des rapports */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                        <BarChart3 className="text-blue-600" size={20} />
                        <span>État des Rapports</span>
                      </h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                          <p className="text-blue-700 text-sm font-semibold mb-1">Rapports reçus</p>
                          <p className="text-3xl font-bold text-gray-900">{rapports.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                          <p className="text-blue-700 text-sm font-semibold mb-1">Validés</p>
                          <p className="text-3xl font-bold text-gray-900">{rapports.filter(r => r.statut === "Validé").length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
                          <p className="text-blue-700 text-sm font-semibold mb-1">En attente</p>
                          <p className="text-3xl font-bold text-gray-900">{rapports.filter(r => r.statut === "En attente de validation").length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">Actions</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          onClick={handleGenererRapportPDF}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <FileText size={20} />
                          <span>Générer le Rapport PDF</span>
                        </button>
                        <button
                          onClick={handleEnvoyerAdministration}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <Send size={20} />
                          <span>Envoyer à l'Administration</span>
                        </button>
                      </div>
                    </div>
                  </div>
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