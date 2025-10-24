// src/pages/DashboardApprenant.jsx - AJOUT GESTION JUSTIFICATIFS
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Card, 
  Button, 
  Alert, 
  Badge, 
  Table,
  Modal,
  Form,
  Spinner,
  Row,
  Col,
  Navbar,
  Nav,
  Offcanvas
} from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
 import LogoutButton from '../components/LogoutButton';

import api from '../services/api';

// Import des icônes React Icons
import { 
  FiHome, 
  FiBook, 
  FiFileText, 
  FiVideo, 
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiMenu,
  FiClipboard,
  FiUpload,
  FiCopy,
  FiExternalLink,
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiLink,
  FiMail,
  FiBell,
  FiDownload,
  FiTrash2,
  FiEye
} from 'react-icons/fi';
import { 
  FaGoogle, 
  FaVideo,
  FaMicrosoft,
  FaChalkboardTeacher,
  FaGraduationCap
} from 'react-icons/fa';

function DashboardApprenant() {
  const { metierSlug, annee } = useParams(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [metierNom, setMetierNom] = useState('');
  const [loading, setLoading] = useState(true);
  const [devoirs, setDevoirs] = useState([]);
  const [soumissions, setSoumissions] = useState({});
  const [seances, setSeances] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [coursEnLigne, setCoursEnLigne] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  
  // Modals
  const [showSoumissionModal, setShowSoumissionModal] = useState(false);
  const [showJustificatifModal, setShowJustificatifModal] = useState(false);
  const [showMesJustificatifsModal, setShowMesJustificatifsModal] = useState(false);
  const [showCoursModal, setShowCoursModal] = useState(false);
  
  const [selectedDevoir, setSelectedDevoir] = useState(null);
  const [selectedSeance, setSelectedSeance] = useState(null);
  const [selectedCours, setSelectedCours] = useState(null);
  const [fichierSoumission, setFichierSoumission] = useState(null);
  const [fichierJustificatif, setFichierJustificatif] = useState(null);
  const [motifJustificatif, setMotifJustificatif] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Couleurs personnalisées pour un thème moderne
  const themeColors = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    dark: '#1f2937',
    light: '#f8fafc'
  };

  // Styles CSS intégrés (inchangé)
  const styles = `
    /* Votre CSS reste le même */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes shine {
      0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
      }
      100% {
        transform: translateX(100%) translateY(100%) rotate(45deg);
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dashboard-card {
      animation: fadeInUp 0.6s ease-out;
    }

    .pulse-hover:hover {
      animation: pulse 0.3s ease-in-out;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, #5b5feb 0%, #7c4df5 100%);
    }

    .glass-effect {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
    }

    .btn-modern {
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .btn-modern::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transition: left 0.5s;
    }

    .btn-modern:hover::before {
      left: 100%;
    }

    .card-modern {
      box-shadow: 
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    }

    .badge-shine {
      position: relative;
      overflow: hidden;
    }

    .badge-shine::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg);
      animation: shine 3s infinite;
    }

    .spinner-modern {
      border: 3px solid #f3f4f6;
      border-top: 3px solid #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .table-modern tbody tr {
      transition: all 0.2s ease;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-modern tbody tr:hover {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .table-modern thead th {
      border: none;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-weight: 600;
      color: #374151;
      padding: 12px 16px;
    }

    .table-modern tbody td {
      border: none;
      padding: 16px;
      vertical-align: middle;
    }

    .card-gradient-primary {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }

    .card-gradient-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .card-gradient-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .icon-hover {
      transition: all 0.3s ease;
    }

    .icon-hover:hover {
      transform: scale(1.1) rotate(5deg);
    }

    .sidebar-item {
      transition: all 0.3s ease;
      border-radius: 8px;
      margin: 4px 8px;
    }

    .sidebar-item:hover {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white !important;
      transform: translateX(8px);
    }

    .sidebar-item.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white !important;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn-rounded {
      border-radius: 12px !important;
    }

    .btn-pill {
      border-radius: 50px !important;
    }

    .form-control-modern:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      transform: translateY(-2px);
    }

    .alert-modern {
      border: none;
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    @media (max-width: 768px) {
      .dashboard-card {
        margin-bottom: 1rem;
      }
      
      .table-responsive {
        font-size: 0.875rem;
      }
      
      .btn-group-vertical {
        width: 100%;
      }

      .mobile-stack {
        flex-direction: column;
      }

      .mobile-text-center {
        text-align: center;
      }
    }

    .shadow-elegant {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `;

  // Injection du CSS dans le head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // NOUVEAU useEffect avec la logique de vérification des rôles
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(userStr);

      // 🔴 Vérification IMMÉDIATE du rôle
      if (userData.role !== 'apprenant') {
        alert("Accès interdit : vous devez être un apprenant.");
        // Rediriger selon le rôle
        if (userData.role === 'enseignant' || userData.role === 'responsable_metier') {
          navigate('/dashboard/enseignant', { replace: true });
        } else if (userData.role === 'chef_departement') {
          navigate('/dashboard/chef', { replace: true });
        } else if (userData.role === 'coordinateur') {
          navigate('/dashboard/coordinateur', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        return;
      }

      // ✅ Seulement si c'est un apprenant
      setUser(userData);

      // Déterminer le nom du métier
      const slug = metierSlug?.toLowerCase().trim();
      const metiersMap = {
        'dwm': 'DWM - Développement Web & Mobile',
        'rt': 'RT - Réseaux & Télécom',
        'asri': 'ASRI - Administration Système & Réseau'
      };
      const nom = metiersMap[slug] || userData.metier;
      setMetierNom(nom);

      // ✅ Charger les données SEULEMENT après validation
      const loadData = async () => {
        try {
          await Promise.all([
            loadDevoirs(),
            loadSeances(),
            loadJustificatifs(),
            loadCoursEnLigne()
          ]);
        } catch (err) {
          console.error('❌ Erreur lors du chargement:', err);
          setError('Erreur lors du chargement des données: ' + (err.message || 'inconnue'));
        } finally {
          setLoading(false);
        }
      };

      loadData();
    } catch (parseError) {
      console.error('❌ Erreur parsing user:', parseError);
      setError('Données utilisateur invalides.');
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }, [metierSlug, annee, navigate]);

  const loadDevoirs = async () => {
    try {
      const response = await api.get('/api/apprenant/devoirs');
      setDevoirs(response.data);
      await loadSoumissions(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement devoirs:', error);
      setError('Erreur lors du chargement des devoirs');
    }
  };

  const loadSoumissions = async (devoirsList) => {
    try {
      const soumissionsData = {};
      
      for (const devoir of devoirsList) {
        try {
          const response = await api.get(`/api/devoirs/${devoir.id}/ma-soumission`);
          soumissionsData[devoir.id] = response.data;
        } catch (error) {
          // Ignorer les 404 (pas de soumission)
        }
      }
      
      setSoumissions(soumissionsData);
    } catch (error) {
      console.error('❌ Erreur chargement soumissions:', error);
    }
  };

  const loadSeances = async () => {
    try {
      const response = await api.get('/api/apprenant/seances');
      setSeances(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement séances:', error);
    }
  };

  const loadJustificatifs = async () => {
    try {
      const response = await api.get('/api/justificatifs/mes-justificatifs');
      setJustificatifs(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement justificatifs:', error);
    }
  };

  const loadCoursEnLigne = async () => {
    try {
      const response = await api.get('/api/apprenant/cours-en-ligne');
      setCoursEnLigne(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement cours en ligne:', error);
    }
  };

  // ✅ NOUVELLE FONCTION : Télécharger un justificatif
  const handleDownloadJustificatif = async (justificatifId) => {
    try {
      const response = await api.get(`/api/justificatifs/${justificatifId}/download`, {
        responseType: 'blob'
      });
      
      // Créer un URL pour le blob et déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `justificatif-${justificatifId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setError('✅ Justificatif téléchargé avec succès !');
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setError('❌ Erreur lors du téléchargement du justificatif');
    }
  };

  // ✅ NOUVELLE FONCTION : Supprimer un justificatif en attente
  const handleDeleteJustificatif = async (justificatifId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce justificatif ?')) {
      return;
    }

    try {
      await api.delete(`/api/justificatifs/${justificatifId}`);
      setError('✅ Justificatif supprimé avec succès !');
      await loadJustificatifs(); // Recharger la liste
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      setError('❌ Erreur lors de la suppression du justificatif');
    }
  };

  const handleRejoindreCours = (cours) => {
    setSelectedCours(cours);
    setShowCoursModal(true);
  };

  const handleCopierLien = (lien) => {
    navigator.clipboard.writeText(lien);
    setError('');
    setTimeout(() => {
      setError('✅ Lien copié dans le presse-papier !');
    }, 100);
  };

  const getPlatformIcon = (plateforme) => {
    const icons = {
      'google_meet': <FaGoogle className="text-danger icon-hover" />,
      'zoom': <FaVideo className="text-primary icon-hover" />,
      'teams': <FaMicrosoft className="text-info icon-hover" />,
      'autre': <FiLink className="text-secondary icon-hover" />
    };
    return icons[plateforme] || <FiLink className="text-secondary icon-hover" />;
  };

  const getPlatformName = (plateforme) => {
    const names = {
      'google_meet': 'Google Meet',
      'zoom': 'Zoom',
      'teams': 'Microsoft Teams',
      'autre': 'Autre plateforme'
    };
    return names[plateforme] || plateforme;
  };

  // Gestion des soumissions de devoirs
  const handleSoumettreDevoir = (devoir) => {
    setSelectedDevoir(devoir);
    setShowSoumissionModal(true);
    setFichierSoumission(null);
  };

  const handleSubmitSoumission = async (e) => {
    e.preventDefault();
    if (!fichierSoumission) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('fichier', fichierSoumission);

      await api.post(`/api/devoirs/${selectedDevoir.id}/soumission`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setError('✅ Devoir soumis avec succès !');
      setShowSoumissionModal(false);
      await loadDevoirs();
    } catch (error) {
      setError('❌ Erreur lors de la soumission: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  // Gestion des justificatifs
  const handleDeposerJustificatif = (seance) => {
    setSelectedSeance(seance);
    setShowJustificatifModal(true);
    setFichierJustificatif(null);
    setMotifJustificatif('');
  };

  const handleSubmitJustificatif = async (e) => {
    e.preventDefault();
    if (!fichierJustificatif || !motifJustificatif) {
      setError('❌ Veuillez sélectionner un fichier et indiquer un motif');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('fichier', fichierJustificatif);
      formData.append('motif', motifJustificatif);
      formData.append('seance_id', selectedSeance.id);

      await api.post('/api/justificatifs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setError('✅ Justificatif déposé avec succès !');
      setShowJustificatifModal(false);
      await loadJustificatifs();
    } catch (error) {
      setError('❌ Erreur lors du dépôt: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/zip',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    const maxSize = type === 'soumission' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && 
        !file.name.toLowerCase().match(/\.(pdf|zip|jpg|jpeg|png)$/)) {
      setError('❌ Format non supporté. Utilisez PDF, ZIP, JPG, PNG.');
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      setError(`❌ Fichier trop volumineux. Taille max: ${maxSize / 1024 / 1024}MB`);
      e.target.value = '';
      return;
    }

    if (type === 'soumission') {
      setFichierSoumission(file);
    } else {
      setFichierJustificatif(file);
    }
  };

  const getStatutSoumission = (devoirId) => {
    const soumission = soumissions[devoirId];
    if (!soumission) return { status: 'non_soumis', text: 'Non soumis', variant: 'secondary', icon: <FiClock className="me-1" /> };
    
    if (soumission.feedback) {
      return { status: 'corrige', text: 'Corrigé', variant: 'success', icon: <FiCheckCircle className="me-1" /> };
    } else {
      return { status: 'soumis', text: 'Soumis', variant: 'primary', icon: <FiUpload className="me-1" /> };
    }
  };

  const getStatutJustificatif = (statut) => {
    const statusMap = {
      'en_attente': { text: 'En attente', variant: 'warning', icon: <FiClock className="me-1" /> },
      'valide': { text: 'Validé', variant: 'success', icon: <FiCheckCircle className="me-1" /> },
      'refuse': { text: 'Refusé', variant: 'danger', icon: <FiXCircle className="me-1" /> }
    };
    return statusMap[statut] || { text: 'Inconnu', variant: 'secondary', icon: <FiAlertCircle className="me-1" /> };
  };

  const isDateDepassee = (dateLimite) => {
    return new Date(dateLimite) < new Date();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setShowSidebar(false);
  }; 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // ✅ NOUVELLE FONCTION : Obtenir les statistiques des justificatifs
  const getJustificatifsStats = () => {
    const total = justificatifs.length;
    const enAttente = justificatifs.filter(j => j.statut === 'en_attente').length;
    const valides = justificatifs.filter(j => j.statut === 'valide').length;
    const refuses = justificatifs.filter(j => j.statut === 'refuse').length;

    return { total, enAttente, valides, refuses };
  };

  // Styles CSS modernes
  const modernCardStyle = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };

  const modernCardHover = {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)'
  };

  const gradientBadge = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '0.75rem',
    fontWeight: '600'
  };

  const iconWrapperStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: 'white',
    fontSize: '2rem'
  };

  // Composant de carte moderne réutilisable
  const ModernCard = ({ icon, title, description, buttonText, onClick, count, color = themeColors.primary }) => (
    <Card 
      className="h-100 border-0 dashboard-card pulse-hover"
      style={modernCardStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, modernCardHover);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, modernCardStyle);
      }}
    >
      <Card.Body className="d-flex flex-column p-4 text-center">
        <div style={{...iconWrapperStyle, background: `linear-gradient(135deg, ${color} 0%, ${themeColors.secondary} 100%)`}}>
          {icon}
        </div>
        <h5 className="fw-bold mb-2" style={{ color: themeColors.dark }}>{title}</h5>
        <p className="text-muted small flex-grow-1 mb-3">{description}</p>
        <div className="d-flex justify-content-between align-items-center">
          <Button 
            variant="primary" 
            className="fw-semibold btn-modern btn-pill"
            onClick={onClick}
            style={{
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${color} 0%, ${themeColors.secondary} 100%)`,
              border: 'none',
              flex: 1,
              marginRight: '8px'
            }}
          >
            {buttonText}
          </Button>
          {count !== undefined && (
            <Badge 
              className="ms-2 badge-shine"
              style={gradientBadge}
            >
              {count}
            </Badge>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  // ✅ NOUVEAU : Rendu de la section Justificatifs
  const renderJustificatifsSection = () => {
    const stats = getJustificatifsStats();

    return (
      <Row className="mb-4">
        <Col>
          {/* Cartes de statistiques */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="border-0 text-center card-gradient-primary text-white">
                <Card.Body className="py-4">
                  <FiFileText size={32} className="mb-2" />
                  <h4 className="fw-bold">{stats.total}</h4>
                  <p className="mb-0">Total Justificatifs</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="border-0 text-center card-gradient-warning text-white">
                <Card.Body className="py-4">
                  <FiClock size={32} className="mb-2" />
                  <h4 className="fw-bold">{stats.enAttente}</h4>
                  <p className="mb-0">En Attente</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="border-0 text-center card-gradient-success text-white">
                <Card.Body className="py-4">
                  <FiCheckCircle size={32} className="mb-2" />
                  <h4 className="fw-bold">{stats.valides}</h4>
                  <p className="mb-0">Validés</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="border-0 text-center" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                <Card.Body className="py-4">
                  <FiXCircle size={32} className="mb-2" />
                  <h4 className="fw-bold">{stats.refuses}</h4>
                  <p className="mb-0">Refusés</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-elegant">
            <Card.Header className="border-0 py-3 card-gradient-info">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FiFileText size={24} className="text-white me-2 icon-hover" />
                  <h5 className="mb-0 text-white fw-bold">Mes Justificatifs</h5>
                </div>
                <div>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowMesJustificatifsModal(true)}
                    className="btn-pill me-2"
                  >
                    <FiEye size={16} className="me-1" />
                    Voir mes justificatifs
                  </Button>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                    className="btn-pill"
                  >
                    <FiMenu size={16} />
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {justificatifs.length === 0 ? (
                <div className="text-center py-5">
                  <FiFileText size={64} className="text-muted mb-3 icon-hover" />
                  <h6 className="text-muted">Aucun justificatif déposé</h6>
                  <p className="text-muted mb-0">
                    Vos justificatifs apparaîtront ici lorsque vous en déposerez.
                  </p>
                </div>
              ) : (
                <div className="table-responsive custom-scrollbar">
                  <Table hover className="mb-0 table-modern">
                    <thead>
                      <tr>
                        <th className="border-0 ps-4">Séance</th>
                        <th className="border-0">Matière</th>
                        <th className="border-0">Date de dépôt</th>
                        <th className="border-0">Motif</th>
                        <th className="border-0">Statut</th>
                        <th className="border-0 pe-4 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {justificatifs.slice(0, 5).map(justificatif => {
                        const statut = getStatutJustificatif(justificatif.statut);
                        
                        return (
                          <tr key={justificatif.id} className="border-bottom">
                            <td className="ps-4">
                              <strong className="text-dark">
                                {justificatif.seance?.nom || 'Séance inconnue'}
                              </strong>
                            </td>
                            <td className="text-muted">
                              {justificatif.seance?.matiere || 'N/A'}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiCalendar size={14} className="text-muted me-1" />
                                {formatDate(justificatif.created_at)}
                              </div>
                            </td>
                            <td>
                              <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                                {justificatif.motif}
                              </span>
                            </td>
                            <td>
                              <Badge 
                                bg={statut.variant} 
                                className="d-flex align-items-center badge-shine"
                                style={{ borderRadius: '20px', padding: '6px 12px' }}
                              >
                                {statut.icon}
                                {statut.text}
                              </Badge>
                            </td>
                            <td className="pe-4 text-end">
                              <div className="d-flex gap-1 justify-content-end">
                                {justificatif.fichier && (
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleDownloadJustificatif(justificatif.id)}
                                    className="btn-pill btn-modern"
                                  >
                                    <FiDownload size={14} />
                                  </Button>
                                )}
                                {justificatif.statut === 'en_attente' && (
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleDeleteJustificatif(justificatif.id)}
                                    className="btn-pill btn-modern"
                                  >
                                    <FiTrash2 size={14} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Section pour déposer un nouveau justificatif */}
          <Card className="border-0 shadow-elegant mt-4">
            <Card.Header className="border-0 py-3" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FiUpload size={24} className="text-white me-2 icon-hover" />
                  <h5 className="mb-0 text-white fw-bold">Déposer un nouveau justificatif</h5>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {seances.length === 0 ? (
                <div className="text-center py-4">
                  <FiCalendar size={48} className="text-muted mb-3 icon-hover" />
                  <h6 className="text-muted">Aucune séance disponible</h6>
                  <p className="text-muted mb-0">
                    Les séances pour déposer des justificatifs apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="table-responsive custom-scrollbar">
                  <Table hover className="mb-0 table-modern">
                    <thead>
                      <tr>
                        <th className="border-0 ps-4">Séance</th>
                        <th className="border-0">Matière</th>
                        <th className="border-0">Date</th>
                        <th className="border-0">Heure</th>
                        <th className="border-0 pe-4 text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seances.map(seance => (
                        <tr key={seance.id} className="border-bottom">
                          <td className="ps-4">
                            <strong className="text-dark">{seance.nom}</strong>
                          </td>
                          <td className="text-muted">{seance.matiere}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FiCalendar size={14} className="text-muted me-1" />
                              {new Date(seance.date).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="text-muted">
                            {seance.heure_debut} - {seance.heure_fin}
                          </td>
                          <td className="pe-4 text-end">
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleDeposerJustificatif(seance)}
                              className="btn-pill btn-modern"
                              style={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                border: 'none'
                              }}
                            >
                              <FiUpload size={14} className="me-1" />
                              Déposer justificatif
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  };

  // ✅ CORRECTION : Fonction pour le contenu par défaut
  const renderDefaultContent = () => (
    <Row className="mb-4">
      <Col>
        <Card className="shadow-sm text-center border-0 bg-white">
          <Card.Body className="py-5">
            <h2 className="mb-3 text-primary">👋 Bienvenue, {user?.name}</h2>
            <p className="lead mb-5 text-muted">
              Votre espace personnel - {metierNom} • Année {annee}
            </p>
            
            <div className="row justify-content-center g-4">
              <div className="col-md-3 col-sm-6">
                <ModernCard
                  icon={<FiBook size={32} />}
                  title="Mes Devoirs"
                  description="Consultez vos devoirs assignés et soumettez vos travaux"
                  buttonText="Voir mes Devoirs"
                  onClick={() => setActiveSection('devoirs')}
                  count={devoirs.length}
                  color={themeColors.primary}
                />
              </div>
              
              <div className="col-md-3 col-sm-6">
                <ModernCard
                  icon={<FiFileText size={32} />}
                  title="Justificatifs"
                  description="Déposez des justificatifs pour vos absences"
                  buttonText="Gérer"
                  onClick={() => setActiveSection('justificatifs')}
                  count={justificatifs.length}
                  color={themeColors.info}
                />
              </div>

              <div className="col-md-3 col-sm-6">
                <ModernCard
                  icon={<FiVideo size={32} />}
                  title="Cours en ligne"
                  description="Accédez à vos cours via Google Meet, Zoom, etc."
                  buttonText="Voir les cours"
                  onClick={() => setActiveSection('cours_en_ligne')}
                  count={coursEnLigne.length}
                  color={themeColors.success}
                />
              </div>
              
              <div className="col-md-3 col-sm-6">
                <ModernCard
                  icon={<FiBarChart2 size={32} />}
                  title="Statistiques"
                  description="Consultez vos statistiques de présence et travaux"
                  buttonText="Voir stats"
                  onClick={() => setActiveSection('statistiques')}
                  color={themeColors.warning}
                />
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // ✅ CORRECTION : Fonction pour rendre le contenu principal
  const renderMainContent = () => {
    switch (activeSection) {
      case 'accueil':
        return renderDefaultContent();

      case 'devoirs':
        // ... (le code existant pour les devoirs)

      case 'justificatifs':
        return renderJustificatifsSection();

      case 'cours_en_ligne':
        // ... (le code existant pour les cours en ligne)

      default:
        return renderDefaultContent();
    }
  };

  // Le reste du code reste inchangé...
  // (les modals, le rendu principal, etc.)

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8fafc' }}>
      {/* Navbar moderne */}
      <Navbar expand="lg" className="shadow-elegant" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
        <Container>
          <Navbar.Brand className="fw-bold text-white d-flex align-items-center">
            <FaGraduationCap size={24} className="me-2 icon-hover" />
            Dashboard Apprenant
          </Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            <Button 
              variant="outline-light" 
              className="me-3 btn-pill btn-modern"
              onClick={() => setShowSidebar(true)}
            >
              <FiMenu size={16} className="me-1" />
              Menu
            </Button>
            <div className="text-white d-flex align-items-center me-3">
              <FiUser size={16} className="me-2" />
              {user?.name}
            </div>
            {/* <LogoutButton onLogout={handleLogout} /> */}
            <LogoutButton />
            
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 py-4">
        <Row>
          {/* Sidebar moderne */}
          <Offcanvas 
            show={showSidebar} 
            onHide={() => setShowSidebar(false)}
            placement="start"
            style={{ width: '300px' }}
            className="shadow-elegant"
          >
            <Offcanvas.Header closeButton className="card-gradient-primary">
              <Offcanvas.Title className="text-white d-flex align-items-center">
                <FiMenu size={20} className="me-2" />
                Navigation
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0 bg-white">
              <div className="list-group list-group-flush">
                {[
                  { section: 'accueil', icon: <FiHome size={18} />, text: 'Accueil' },
                  { section: 'devoirs', icon: <FiBook size={18} />, text: 'Mes Devoirs', count: devoirs.length },
                  { section: 'justificatifs', icon: <FiFileText size={18} />, text: 'Justificatifs', count: justificatifs.length },
                  { section: 'cours_en_ligne', icon: <FiVideo size={18} />, text: 'Cours en ligne', count: coursEnLigne.length }
                ].map(item => (
                  <button
                    key={item.section}
                    className={`list-group-item list-group-item-action border-0 d-flex align-items-center py-3 sidebar-item ${
                      activeSection === item.section ? 'active' : ''
                    }`}
                    onClick={() => handleNavigation(item.section)}
                  >
                    {item.icon}
                    <span className="ms-3 fw-semibold">{item.text}</span>
                    {item.count !== undefined && (
                      <Badge 
                        className="ms-auto badge-shine"
                        style={gradientBadge}
                      >
                        {item.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Informations apprenant */}
              <div className="p-4 border-top bg-light">
                <div className="d-flex align-items-center mb-3">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    <FiUser size={20} />
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-0 fw-bold">{user?.name}</h6>
                    <small className="text-muted">{metierNom}</small>
                  </div>
                </div>
                <div className="row text-center">
                  <div className="col-4">
                    <div className="text-primary fw-bold">{devoirs.length}</div>
                    <small className="text-muted">Devoirs</small>
                  </div>
                  <div className="col-4">
                    <div className="text-info fw-bold">{justificatifs.length}</div>
                    <small className="text-muted">Justificatifs</small>
                  </div>
                  <div className="col-4">
                    <div className="text-success fw-bold">{coursEnLigne.length}</div>
                    <small className="text-muted">Cours</small>
                  </div>
                </div>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          {/* Contenu principal */}
          <Col xs={12}>
            {renderMainContent()}
          </Col>
        </Row>
      </Container>

      {/* Modal pour déposer un justificatif */}
      <Modal show={showJustificatifModal} onHide={() => setShowJustificatifModal(false)} centered className="shadow-elegant">
        <Modal.Header closeButton className="card-gradient-info border-0">
          <Modal.Title className="text-white d-flex align-items-center">
            <FiUpload className="me-2" />
            Déposer un justificatif
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedSeance && (
            <>
              <div className="text-center mb-4">
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  <FiFileText size={32} />
                </div>
                <h4 className="fw-bold gradient-text">Justificatif d'absence</h4>
                <p className="text-muted">
                  Pour la séance: <strong>{selectedSeance.nom}</strong>
                </p>
              </div>

              <Form onSubmit={handleSubmitJustificatif}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Motif de l'absence *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={motifJustificatif}
                    onChange={(e) => setMotifJustificatif(e.target.value)}
                    placeholder="Décrivez le motif de votre absence..."
                    className="form-control-modern"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Fichier justificatif *</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => handleFileChange(e, 'justificatif')}
                    accept=".pdf,.jpg,.jpeg,.png,.zip"
                    className="form-control-modern"
                    required
                  />
                  <Form.Text className="text-muted">
                    Formats acceptés: PDF, JPG, PNG, ZIP (max 10MB)
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={uploading || !fichierJustificatif || !motifJustificatif}
                    className="btn-pill btn-modern"
                    style={{
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                      border: 'none',
                      padding: '12px'
                    }}
                  >
                    {uploading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Déposition en cours...
                      </>
                    ) : (
                      <>
                        <FiUpload size={18} className="me-2" />
                        Déposer le justificatif
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal pour voir tous les justificatifs */}
      <Modal show={showMesJustificatifsModal} onHide={() => setShowMesJustificatifsModal(false)} size="lg" centered className="shadow-elegant">
        <Modal.Header closeButton className="card-gradient-info border-0">
          <Modal.Title className="text-white d-flex align-items-center">
            <FiFileText className="me-2" />
            Tous mes justificatifs
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="table-responsive custom-scrollbar" style={{ maxHeight: '60vh' }}>
            <Table hover className="mb-0 table-modern">
              <thead>
                <tr>
                  <th className="border-0 ps-4">Séance</th>
                  <th className="border-0">Date de dépôt</th>
                  <th className="border-0">Motif</th>
                  <th className="border-0">Statut</th>
                  <th className="border-0 pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {justificatifs.map(justificatif => {
                  const statut = getStatutJustificatif(justificatif.statut);
                  
                  return (
                    <tr key={justificatif.id} className="border-bottom">
                      <td className="ps-4">
                        <strong className="text-dark">
                          {justificatif.seance?.nom || 'Séance inconnue'}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {justificatif.seance?.matiere || 'N/A'}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FiCalendar size={14} className="text-muted me-1" />
                          {formatDate(justificatif.created_at)}
                        </div>
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{maxWidth: '200px'}}>
                          {justificatif.motif}
                        </span>
                      </td>
                      <td>
                        <Badge 
                          bg={statut.variant} 
                          className="d-flex align-items-center badge-shine"
                          style={{ borderRadius: '20px', padding: '6px 12px' }}
                        >
                          {statut.icon}
                          {statut.text}
                        </Badge>
                      </td>
                      <td className="pe-4">
                        <div className="d-flex gap-1">
                          {justificatif.fichier && (
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleDownloadJustificatif(justificatif.id)}
                              className="btn-pill btn-modern"
                            >
                              <FiDownload size={14} />
                            </Button>
                          )}
                          {justificatif.statut === 'en_attente' && (
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteJustificatif(justificatif.id)}
                              className="btn-pill btn-modern"
                            >
                              <FiTrash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>

      {/* Footer et autres modals restent inchangés */}
      {/* ... */}

    </div>
  );
}

export default DashboardApprenant;