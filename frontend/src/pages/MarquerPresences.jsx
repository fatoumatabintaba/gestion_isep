import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Users, BookOpen, Plus } from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import axios from 'axios';

function MarquerPresences() {
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔒 Vérification au chargement du composant
  useEffect(() => {
    if (!user || user.role !== 'enseignant') {
      alert('❌ Accès réservé aux enseignants.');
      window.location.href = '/login';
      return;
    }
    console.log('✅ Utilisateur authentifié:', user);
  }, [user]);

  const [metiers] = useState([
    { id: 1, nom: 'RT - Réseau Télécommunication', logo: 'RT' },
    { id: 2, nom: 'ASRI - Administration Systèmes & Réseaux', logo: 'ASRI' },
    { id: 3, nom: 'DWM - Développement Web & Mobile', logo: 'DWM' }
  ]);

  const [apprenants, setApprenants] = useState([]);
  const [selected, setSelected] = useState({
    nom_seance: '',
    metier_id: '',
    uea_nom: '', // ✅ CHANGÉ : uea_nom au lieu de uea_id
    date: new Date().toISOString().split('T')[0],
    annee: '',
    heure_debut: '08:00',
    heure_fin: '10:00',
    salle: 'A101',
    type: 'presentiel',
    duree: '4h'
  });
  const [presences, setPresences] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingSeance, setCreatingSeance] = useState(false);

  const getLogoColors = (logo) => {
    switch (logo) {
      case 'RT': return 'from-blue-600 to-blue-700';
      case 'ASRI': return 'from-orange-500 to-orange-600';
      case 'DWM': return 'from-indigo-600 to-indigo-700';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'present': return 'bg-green-500 border-green-600';
      case 'absent': return 'bg-red-500 border-red-600';
      case 'retard': return 'bg-orange-500 border-orange-600';
      case 'demi': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-gray-300 border-gray-400';
    }
  };

  // ✅ Charger les apprenants
  const chargerApprenants = async (metierId, annee) => {
    if (!metierId) {
      setApprenants([]);
      setPresences({});
      return;
    }

    setLoading(true);
    try {
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

      const token = localStorage.getItem('token');
      
      let url = `http://localhost:8000/api/apprenants?metier_id=${metierId}`;
      if (annee) {
        url += `&annee=${annee}`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      const apprenantsList = res.data.apprenants || res.data || [];
      setApprenants(apprenantsList);

      // Initialiser toutes les présences à "présent" par défaut
      const initPresences = {};
      apprenantsList.forEach(a => {
        initPresences[a.id] = 'present';
      });
      setPresences(initPresences);
    } catch (err) {
      console.error('Erreur lors du chargement des apprenants:', err.response?.data || err);
      setApprenants([]);
      setPresences({});
      alert('❌ Impossible de charger les apprenants.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Gestion des changements
  const handleMetierChange = (metierId) => {
    setSelected(prev => ({ 
      ...prev, 
      metier_id: metierId
    }));
    chargerApprenants(metierId, selected.annee);
  };

  const handleAnneeChange = (e) => {
    const anneeValue = e.target.value;
    setSelected(prev => ({ ...prev, annee: anneeValue }));
    chargerApprenants(selected.metier_id, anneeValue);
  };

  // ✅ CHANGÉ : Saisie manuelle de l'UEA
  const handleUeaChange = (e) => {
    setSelected(prev => ({ ...prev, uea_nom: e.target.value }));
  };

  const handleDateChange = (e) => {
    setSelected(prev => ({ ...prev, date: e.target.value }));
  };

  const handleSeanceNameChange = (e) => {
    setSelected(prev => ({ ...prev, nom_seance: e.target.value }));
  };

  const handleHeureDebutChange = (e) => {
    setSelected(prev => ({ ...prev, heure_debut: e.target.value }));
  };

  const handleHeureFinChange = (e) => {
    setSelected(prev => ({ ...prev, heure_fin: e.target.value }));
  };

  const handleSalleChange = (e) => {
    setSelected(prev => ({ ...prev, salle: e.target.value }));
  };

  const handleTypeChange = (e) => {
    setSelected(prev => ({ ...prev, type: e.target.value }));
  };

  const handleDureeChange = (e) => {
    setSelected(prev => ({ ...prev, duree: e.target.value }));
  };

  const handleChangePresence = (id, statut) => {
    setPresences(prev => ({ ...prev, [id]: statut }));
  };

  // ✅✅✅ FONCTION SIMPLIFIÉE - UEA SAISIE MANUELLEMENT
  const creerSeance = async () => {
    if (!selected.nom_seance || !selected.metier_id || !selected.uea_nom) {
      alert('Veuillez remplir le nom de séance, le métier et le nom de l\'UEA.');
      return null;
    }

    try {
      setCreatingSeance(true);
      
      console.log('🟡 Début de la création de séance...');
      
      // Récupérer le cookie CSRF
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { 
        withCredentials: true 
      });
      console.log('✅ Cookie CSRF récupéré');

      const token = localStorage.getItem('token');
      
      // ✅ STRUCTURE SIMPLIFIÉE - UEA en texte
      const seanceData = {
        nom: selected.nom_seance,
        uea_nom: selected.uea_nom, // ✅ Texte libre au lieu de ID
        enseignant_id: user.id,
        salle: selected.salle,
        date: selected.date,
        heure_debut: selected.heure_debut,
        heure_fin: selected.heure_fin,
        duree: selected.duree,
        type: selected.type,
        statut: 'programmee',
        metier_id: selected.metier_id, // ✅ Ajout du métier pour faciliter
        annee: selected.annee || '2'   // ✅ Ajout de l'année
      };

      console.log('📤 Envoi des données de séance (simplifié):', seanceData);

      // Création de la séance
      const response = await axios.post(
        'http://localhost:8000/api/seances', 
        seanceData, 
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ Séance créée:', response.data);
      return response.data.seance;

    } catch (err) {
      console.error('❌ Erreur lors de la création de la séance:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        let errorMessage = 'Erreurs de validation:\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `- ${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.message === 'Network Error') {
        alert('❌ Erreur réseau. Vérifiez que le serveur Laravel est démarré (php artisan serve)');
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Erreur inconnue';
        alert(`❌ ${errorMessage}`);
      }
      return null;
    } finally {
      setCreatingSeance(false);
    }
  };

  // ✅✅✅ FONCTION PRINCIPALE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selected.nom_seance) {
      alert('Veuillez saisir un nom pour la séance.');
      return;
    }

    if (!selected.metier_id || !selected.uea_nom) {
      alert('Veuillez sélectionner un métier et saisir le nom de l\'UEA.');
      return;
    }

    if (apprenants.length === 0) {
      alert('Aucun apprenant à enregistrer pour cette sélection.');
      return;
    }

    try {
      // 1. Créer la séance d'abord
      const nouvelleSeance = await creerSeance();
      
      if (!nouvelleSeance || !nouvelleSeance.id) {
        console.error('❌ Impossible de créer la séance ou ID manquant');
        return;
      }

      const seanceId = nouvelleSeance.id;
      console.log('🎯 Séance créée avec ID:', seanceId);

      // 2. Enregistrer les présences avec l'ID de la séance créée
      const token = localStorage.getItem('token');
      
      const requestData = {
        date: selected.date,
        presences: Object.keys(presences).map(id => ({
          apprenant_id: parseInt(id),
          statut: presences[id],
          commentaire: ''
        }))
      };

      console.log('📤 Enregistrement des présences pour séance:', seanceId);

      const response = await axios.post(
        `http://localhost:8000/api/seances/${seanceId}/presences/multiple`, 
        requestData, 
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ Réponse du serveur:', response.data);
      setSuccess("✅ Séance créée et présences enregistrées avec succès !");
      setTimeout(() => setSuccess(''), 5000);
      
      // Réinitialiser le formulaire après succès
      setSelected(prev => ({
        ...prev,
        nom_seance: '',
        uea_nom: ''
      }));
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'enregistrement:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'enregistrement des présences.';
      alert(`❌ ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Users className="text-indigo-900" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Gestion des Présences</h1>
                <p className="text-indigo-200 text-sm">Département EIT - Enseignant</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {metiers.map((m) => (
                <div
                  key={m.id}
                  className={`bg-gradient-to-br ${getLogoColors(m.logo)} rounded-xl px-6 py-3 shadow-lg border-2 border-white/30 hover:scale-105 transition-transform`}
                >
                  <div className="text-white font-bold text-xl tracking-wider">
                    {m.logo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/40">
                <Plus className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Créer une séance et enregistrer les présences</h2>
                <p className="text-indigo-100 text-sm">Saisissez les détails de la séance et marquez les présences</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-6 gap-4 mb-8 p-6">
              {/* Nom de la séance */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Nom de la séance *</span>
                </label>
                <input
                  type="text"
                  value={selected.nom_seance}
                  onChange={handleSeanceNameChange}
                  placeholder="Ex: Cours Programmation Web"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
              </div>

              {/* Métier */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Métier *</span>
                </label>
                <select
                  value={selected.metier_id}
                  onChange={(e) => handleMetierChange(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <option value="">Sélectionner</option>
                  {metiers.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </div>

              {/* ✅ CHANGÉ : UEA en saisie manuelle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Nom de l'UEA *</span>
                </label>
                <input
                  type="text"
                  value={selected.uea_nom}
                  onChange={handleUeaChange}
                  placeholder="Ex: Programmation Web Avancée"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              {/* Année */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Année</span>
                </label>
                <select
                  value={selected.annee}
                  onChange={handleAnneeChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  <option value="">Toutes</option>
                  <option value="1">1ère année</option>
                  <option value="2">2ème année</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Date *</span>
                </label>
                <input
                  type="date"
                  value={selected.date}
                  onChange={handleDateChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                />
              </div>

              {/* Salle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Salle *</span>
                </label>
                <input
                  type="text"
                  value={selected.salle}
                  onChange={handleSalleChange}
                  placeholder="Ex: A101"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                />
              </div>

              {/* Heures et Type */}
              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span>Heure début *</span>
                  </label>
                  <input
                    type="time"
                    value={selected.heure_debut}
                    onChange={handleHeureDebutChange}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span>Heure fin *</span>
                  </label>
                  <input
                    type="time"
                    value={selected.heure_fin}
                    onChange={handleHeureFinChange}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Type *</span>
                </label>
                <select
                  value={selected.type}
                  onChange={handleTypeChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  <option value="presentiel">Présentiel</option>
                  <option value="en_ligne">En ligne</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <span>Durée *</span>
                </label>
                <select
                  value={selected.duree}
                  onChange={handleDureeChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  <option value="4h">4 heures</option>
                  <option value="8h">8 heures</option>
                </select>
              </div>
            </div>

            {success && (
              <div className="mb-6 mx-6 px-4 py-3 rounded-xl bg-green-100 text-green-800 border border-green-200">
                {success}
              </div>
            )}

            {/* Le reste du code pour les présences reste identique */}
            {loading ? (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-12 text-center mx-6 mb-6">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement des apprenants...</p>
              </div>
            ) : apprenants.length === 0 && selected.metier_id ? (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-12 text-center mx-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Users className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun apprenant trouvé</h3>
                <p className="text-gray-600">
                  {selected.annee 
                    ? `Aucun apprenant en ${selected.annee} pour ce métier`
                    : 'Aucun apprenant pour ce métier'
                  }
                </p>
              </div>
            ) : apprenants.length === 0 ? (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-12 text-center mx-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Users className="text-white" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Sélectionnez un métier
                </h3>
                <p className="text-gray-600">
                  Veuillez choisir un métier pour afficher les apprenants
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6 mx-6 border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      {apprenants.length} apprenant(s) trouvé(s)
                      {selected.annee && ` en ${selected.annee}`}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-600"></div>
                        <span className="font-medium text-gray-700">Présent</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600"></div>
                        <span className="font-medium text-gray-700">Absent</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-orange-600"></div>
                        <span className="font-medium text-gray-700">Retard</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-yellow-600"></div>
                        <span className="font-medium text-gray-700">Demi-journée</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border-2 border-gray-200 mx-6 mb-6">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                        <th className="px-6 py-4 text-left font-semibold">Nom de l'apprenant</th>
                        <th className="px-6 py-4 text-center font-semibold">Présent</th>
                        <th className="px-6 py-4 text-center font-semibold">Absent</th>
                        <th className="px-6 py-4 text-center font-semibold">Retard</th>
                        <th className="px-6 py-4 text-center font-semibold">Demi-journée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apprenants.map((a, index) => (
                        <tr 
                          key={a.id} 
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors border-b border-gray-200`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                {(a.prenom?.charAt(0) || a.nom?.charAt(0) || 'A').toUpperCase()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 block">
                                  {a.prenom} {a.nom}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {a.annee} • {a.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          {['present', 'absent', 'retard', 'demi'].map((statut) => (
                            <td key={statut} className="px-6 py-4 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`presence-${a.id}`}
                                  checked={presences[a.id] === statut}
                                  onChange={() => handleChangePresence(a.id, statut)}
                                  className="sr-only"
                                />
                                <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all group-hover:scale-110 ${
                                  presences[a.id] === statut 
                                    ? `${getStatutStyle(statut)} shadow-lg` 
                                    : 'bg-gray-200 border-gray-300 hover:bg-gray-300'
                                }`}>
                                  {presences[a.id] === statut && (
                                    <CheckCircle className="text-white" size={20} />
                                  )}
                                </div>
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex justify-end mx-6 mb-6">
                  <button
                    type="submit"
                    disabled={!selected.nom_seance || !selected.metier_id || !selected.uea_nom || apprenants.length === 0 || creatingSeance}
                    className="flex items-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingSeance ? (
                      <>
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={24} />
                        <span>Créer la séance et enregistrer</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <LogoutButton />
      </div>
    </div>
  );
}

export default MarquerPresences;