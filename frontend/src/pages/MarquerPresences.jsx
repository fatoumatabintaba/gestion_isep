import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Users, BookOpen, Plus, Search, Mail } from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import axios from 'axios';

function MarquerPresences() {
  const user = JSON.parse(localStorage.getItem('user'));

  // 🔒 Vérification au chargement du composant - CORRIGÉ
  useEffect(() => {
    // ✅ CORRECTION : Autoriser enseignants ET responsables métier
    const rolesAutorises = ['enseignant', 'responsable_metier'];
    
    if (!user || !rolesAutorises.includes(user.role)) {
      alert('❌ Accès réservé aux enseignants et responsables métier.');
      window.location.href = '/login';
      return;
    }
    console.log('✅ Utilisateur authentifié:', user);
  }, [user]);

  const [metiers] = useState([
    { id: 1, nom: 'DWM - Développement Web & Mobile', logo: 'DWM' },
    { id: 2, nom: 'RT - Réseau Télécommunication', logo: 'RT' },
    { id: 3, nom: 'ASRI - Administration Systèmes & Réseaux', logo: 'ASRI' }
  ]);

  const [apprenants, setApprenants] = useState([]);
  const [selected, setSelected] = useState({
    nom_seance: '',
    metier_id: '',
    uea_nom: '',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

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

  // ✅ Fonction pour normaliser les données des apprenants
  const normaliserApprenant = (apprenant) => {
    console.log('🔍 Données brutes apprenant:', apprenant);
    
    // Gestion des différents formats possibles
    let nom = '';
    let prenom = '';
    let email = '';
    let annee = '';
    let id = apprenant.id;

    // Essayer différents formats de nom
    if (apprenant.nom && apprenant.prenom) {
      nom = apprenant.nom;
      prenom = apprenant.prenom;
    } else if (apprenant.name) {
      // Si le backend envoie un champ "name" unique
      const nameParts = apprenant.name.split(' ');
      if (nameParts.length >= 2) {
        prenom = nameParts[0];
        nom = nameParts.slice(1).join(' ');
      } else {
        nom = apprenant.name;
      }
    } else if (apprenant.nom_complet) {
      const nameParts = apprenant.nom_complet.split(' ');
      if (nameParts.length >= 2) {
        prenom = nameParts[0];
        nom = nameParts.slice(1).join(' ');
      } else {
        nom = apprenant.nom_complet;
      }
    } else if (apprenant.full_name) {
      const nameParts = apprenant.full_name.split(' ');
      if (nameParts.length >= 2) {
        prenom = nameParts[0];
        nom = nameParts.slice(1).join(' ');
      } else {
        nom = apprenant.full_name;
      }
    }

    // Email
    email = apprenant.email || apprenant.mail || '';

    // Année
    annee = apprenant.annee || apprenant.year || apprenant.promotion || '';

    const apprenantNormalise = {
      id: id,
      nom: nom,
      prenom: prenom,
      email: email,
      annee: annee,
      // Garder les données originales pour debug
      _raw: apprenant
    };

    console.log('✅ Apprenant normalisé:', apprenantNormalise);
    return apprenantNormalise;
  };

  // ✅ Fonction pour envoyer les emails d'absence
  const envoyerEmailsAbsence = async (seanceId, absents) => {
    if (absents.length === 0) return;

    try {
      setSendingEmails(true);
      console.log('📧 Début envoi emails absence:', {
        seanceId,
        absents: absents.map(a => ({ id: a.apprenant_id, nom: a.nom }))
      });

      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:8000/api/seances/${seanceId}/notifier-absences`,
        {
          absents: absents
        },
        {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('✅ Emails envoyés avec succès:', response.data);
      return response.data;

    } catch (err) {
      console.error('❌ Erreur envoi emails:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      // Ne pas bloquer le processus principal si l'envoi d'emails échoue
      console.warn('⚠️ Échec envoi emails, mais processus principal continue');
      return null;
    } finally {
      setSendingEmails(false);
    }
  };

  // ✅ Charger les apprenants
  const chargerApprenants = async (metierId, annee, searchTerm = '') => {
    if (!metierId) {
      setApprenants([]);
      setPresences({});
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 CHARGEMENT APPRENANTS - Paramètres:', {
        metierId,
        metierNom: metiers.find(m => m.id == metierId)?.nom,
        annee,
        searchTerm
      });

      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

      const token = localStorage.getItem('token');
      
      let url = `http://localhost:8000/api/apprenants?metier_id=${metierId}`;
      if (annee) {
        url += `&annee=${annee}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      console.log('🔍 URL complète:', url);

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      });

      console.log('🔍 RÉPONSE BACKEND BRUTE:', res.data);

      const apprenantsList = res.data.apprenants || res.data || [];

      if (!Array.isArray(apprenantsList)) {
        console.error('❌ Format de réponse invalide:', res.data);
        setApprenants([]);
        setPresences({});
        return;
      }

      // ✅ NORMALISER LES DONNÉES
      const apprenantsNormalises = apprenantsList.map(normaliserApprenant);
      
      console.log('✅ Apprenants normalisés:', apprenantsNormalises);
      
      setApprenants(apprenantsNormalises);

      const initPresences = {};
      apprenantsNormalises.forEach(a => {
        if (a.id) {
          initPresences[a.id] = 'present';
        }
      });
      setPresences(initPresences);

    } catch (err) {
      console.error('❌ ERREUR DÉTAILLÉE:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url
      });
      setApprenants([]);
      setPresences({});
      alert('❌ Impossible de charger les apprenants.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Gestion des changements
  const handleMetierChange = (metierId) => {
    console.log('🎯 Métier sélectionné:', {
      id: metierId,
      nom: metiers.find(m => m.id == metierId)?.nom
    });
    
    setSelected(prev => ({ 
      ...prev, 
      metier_id: metierId
    }));
    chargerApprenants(metierId, selected.annee, searchTerm);
  };

  const handleAnneeChange = (e) => {
    const anneeValue = e.target.value;
    setSelected(prev => ({ ...prev, annee: anneeValue }));
    chargerApprenants(selected.metier_id, anneeValue, searchTerm);
  };

  // ✅ Gestion de la recherche
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce pour éviter trop de requêtes
    if (selected.metier_id) {
      chargerApprenants(selected.metier_id, selected.annee, value);
    }
  };

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

  const creerSeance = async () => {
    if (!selected.nom_seance || !selected.metier_id || !selected.uea_nom) {
      alert('Veuillez remplir le nom de séance, le métier et le nom de l\'UEA.');
      return null;
    }

    try {
      setCreatingSeance(true);
      
      console.log('🟡 Début de la création de séance...');
      console.log('📋 Détails de la séance:', {
        nom: selected.nom_seance,
        metier_id: selected.metier_id,
        metier_nom: metiers.find(m => m.id == selected.metier_id)?.nom,
        uea_nom: selected.uea_nom
      });
      
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { 
        withCredentials: true 
      });

      const token = localStorage.getItem('token');

      const seanceData = {
        nom: selected.nom_seance,
        uea_nom: selected.uea_nom,
        enseignant_id: user.id,
        salle: selected.salle,
        date: selected.date,
        heure_debut: selected.heure_debut,
        heure_fin: selected.heure_fin,
        duree: selected.duree,
        type: selected.type,
        statut: 'programmee',
        metier_id: selected.metier_id,
        annee: selected.annee || '2'
      };

      console.log('📤 Envoi des données de séance:', seanceData);

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
      
      if (response.data && (response.data.seance || response.data.id)) {
        return response.data.seance || response.data;
      } else {
        console.error('❌ Format de réponse inattendu:', response.data);
        return null;
      }

    } catch (err) {
      console.error('❌ Erreur lors de la création de la séance:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.status === 500) {
        console.error('🔍 Détails erreur 500:', err.response.data);
        alert('❌ Erreur serveur (500). Vérifiez que l\'UEA existe dans la base de données.');
      } else if (err.response?.data?.errors) {
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
      const nouvelleSeance = await creerSeance();
      
      if (!nouvelleSeance || (!nouvelleSeance.id && !nouvelleSeance.seance?.id)) {
        console.error('❌ Impossible de créer la séance ou ID manquant. Réponse:', nouvelleSeance);
        alert('❌ Impossible de créer la séance. Vérifiez que l\'UEA existe dans la base de données.');
        return;
      }

      const seanceId = nouvelleSeance.id || nouvelleSeance.seance?.id;
      console.log('🎯 Séance créée avec ID:', seanceId);

      if (!seanceId) {
        console.error('❌ ID de séance manquant dans la réponse:', nouvelleSeance);
        alert('❌ ID de séance manquant. Impossible d\'enregistrer les présences.');
        return;
      }

      const token = localStorage.getItem('token');
      const apprenantIdsValides = apprenants.map(a => a.id);
      
      console.log('🔍 VÉRIFICATION AVANT ENVOI:', {
        'Métier': metiers.find(m => m.id == selected.metier_id)?.nom,
        'Apprenants chargés': apprenants.map(a => ({ id: a.id, nom: `${a.prenom} ${a.nom}` })),
        'IDs valides': apprenantIdsValides,
        'State presences': presences
      });

      // ✅ Préparer les données des présences et identifier les absents
      const presencesAEnvoyer = [];
      const absents = [];

      Object.keys(presences)
        .map(id => parseInt(id))
        .filter(id => apprenantIdsValides.includes(id))
        .forEach(id => {
          const statut = presences[id];
          const apprenant = apprenants.find(a => a.id === id);
          
          presencesAEnvoyer.push({
            apprenant_id: id,
            statut: statut,
            commentaire: ''
          });

          // ✅ Identifier les absents pour envoi d'email
          if (statut === 'absent' && apprenant && apprenant.email) {
            absents.push({
              apprenant_id: id,
              nom: `${apprenant.prenom} ${apprenant.nom}`,
              email: apprenant.email,
              seance_nom: selected.nom_seance,
              date: selected.date,
              uea_nom: selected.uea_nom,
              enseignant: user.name
            });
          }
        });

      console.log('📋 RÉSULTAT FILTRAGE:', {
        'Avant filtrage': Object.keys(presences).map(id => parseInt(id)),
        'Après filtrage': presencesAEnvoyer.map(p => p.apprenant_id),
        'Absents identifiés': absents
      });

      if (presencesAEnvoyer.length === 0) {
        alert('❌ Aucun apprenant valide à enregistrer. Vérifiez la sélection.');
        return;
      }

      const requestData = {
        date: selected.date,
        presences: presencesAEnvoyer
      };

      console.log('📤 DONNEES ENVOYEES (filtrées):', {
        seanceId: seanceId,
        data: requestData,
        nombrePresences: requestData.presences.length,
        absents: absents.length
      });

      // ✅ Étape 1: Enregistrer les présences
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

      console.log('✅ RÉPONSE DU SERVEUR:', response.data);

      // ✅ Étape 2: Envoyer les emails aux absents (si nécessaire)
      if (absents.length > 0) {
        console.log(`📧 Envoi de ${absents.length} email(s) d'absence...`);
        
        const emailResult = await envoyerEmailsAbsence(seanceId, absents);
        
        if (emailResult) {
          setSuccess(`✅ Séance créée et présences enregistrées ! ${absents.length} email(s) d'absence envoyé(s).`);
        } else {
          setSuccess(`✅ Séance créée et présences enregistrées ! ⚠️ Les emails d'absence n'ont pas pu être envoyés.`);
        }
      } else {
        setSuccess("✅ Séance créée et présences enregistrées avec succès !");
      }

      setTimeout(() => setSuccess(''), 5000);
      
      // ✅ Réinitialiser le formulaire
      setSelected(prev => ({
        ...prev,
        nom_seance: '',
        uea_nom: ''
      }));
      setSearchTerm('');
      
    } catch (err) {
      console.error('❌ ERREUR DETAILLEE:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        let errorMessage = 'Erreurs de validation:\n\n';
        Object.keys(errors).forEach(key => {
          errorMessage += `• ${key}: ${errors[key].join(', ')}\n`;
        });
        alert(errorMessage);
      } else if (err.response?.data?.message) {
        alert(`❌ Erreur: ${err.response.data.message}`);
      } else {
        alert('❌ Erreur lors de l\'enregistrement des présences.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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

            {/* ✅ Barre de recherche */}
            {selected.metier_id && (
              <div className="px-6 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Search size={18} className="text-purple-600" />
                    <span>Rechercher un apprenant (nom ou prénom)</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tapez un nom ou prénom pour filtrer la liste..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                />
                {searchTerm && (
                  <p className="text-sm text-gray-600 mt-2">
                    🔍 Recherche active : "{searchTerm}" • {apprenants.length} résultat(s)
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="mb-6 mx-6 px-4 py-3 rounded-xl bg-green-100 text-green-800 border border-green-200">
                <div className="flex items-center space-x-2">
                  {sendingEmails ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"></div>
                      <span>Envoi des emails en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      <span>{success}</span>
                    </>
                  )}
                </div>
              </div>
            )}

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
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : selected.annee 
                      ? `Aucun apprenant en année ${selected.annee} pour ce métier`
                      : 'Aucun apprenant pour ce métier'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Métier: {metiers.find(m => m.id == selected.metier_id)?.nom}
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
                      {selected.annee && ` en année ${selected.annee}`}
                      {searchTerm && ` pour "${searchTerm}"`}
                      <span className="ml-2 text-indigo-600 font-bold">
                        ({metiers.find(m => m.id == selected.metier_id)?.nom})
                      </span>
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
                        <th className="px-6py-4 text-center font-semibold">Demi-journée</th>
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
                                {/* ✅ AFFICHAGE SIMPLIFIÉ : seulement nom, prénom et année */}
                                <span className="font-medium text-gray-900 block">
                                  {a.prenom} {a.nom}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Année {a.annee}
                                </span>
                                {/* ❌ SUPPRIMÉ : Affichage de l'email et des données de debug */}
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

                <div className="mt-8 flex flex-col items-end mx-6 mb-6 space-y-4">
                  {/* Message d'état */}
                  {!selected.nom_seance?.trim() && (
                    <p className="text-red-600 text-sm">⚠️ Le nom de la séance est requis</p>
                  )}
                  {!selected.metier_id && (
                    <p className="text-red-600 text-sm">⚠️ Veuillez sélectionner un métier</p>
                  )}
                  {!selected.uea_nom?.trim() && (
                    <p className="text-red-600 text-sm">⚠️ Le nom de l'UEA est requis</p>
                  )}
                  {apprenants.length === 0 && selected.metier_id && (
                    <p className="text-red-600 text-sm">⚠️ Aucun apprenant trouvé pour ce métier</p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      !selected.nom_seance?.trim() || 
                      !selected.metier_id || 
                      !selected.uea_nom?.trim() || 
                      apprenants.length === 0 || 
                      creatingSeance ||
                      sendingEmails
                    }
                    className="flex items-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {(creatingSeance || sendingEmails) ? (
                      <>
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>
                          {creatingSeance ? 'Création en cours...' : 'Envoi des emails...'}
                        </span>
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