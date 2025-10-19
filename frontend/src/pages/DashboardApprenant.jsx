// src/pages/DashboardApprenant.jsx - VERSION CORRIGÉE
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
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'; // ✅ useSearchParams ajouté
import LogoutButton from '../components/LogoutButton';
import api from '../services/api';

function DashboardApprenant() {
  const { metierSlug, annee } = useParams(); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ Remplacé useQuery()
  const metier_id = searchParams.get('metier_id');
  
  console.log('🔍 Debug Dashboard:', { metierSlug, annee, metier_id });

  const [user, setUser] = useState(null);
  const [metierNom, setMetierNom] = useState('');
  const [loading, setLoading] = useState(true);
  const [devoirs, setDevoirs] = useState([]);
  const [soumissions, setSoumissions] = useState({});
  const [seances, setSeances] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  
  // Modals
  const [showSoumissionModal, setShowSoumissionModal] = useState(false);
  const [showJustificatifModal, setShowJustificatifModal] = useState(false);
  const [showMesJustificatifsModal, setShowMesJustificatifsModal] = useState(false);
  
  const [selectedDevoir, setSelectedDevoir] = useState(null);
  const [fichierSoumission, setFichierSoumission] = useState(null);
  const [fichierJustificatif, setFichierJustificatif] = useState(null);
  const [motifJustificatif, setMotifJustificatif] = useState('');
  const [selectedSeance, setSelectedSeance] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);

      if (userData.role !== 'apprenant') {
        alert("Accès interdit : Rôle non autorisé.");
        navigate('/', { replace: true });
        return;
      }

      // Déterminer le nom du métier
      const slug = metierSlug?.toLowerCase().trim();
      const metiersMap = {
        'dwm': 'DWM - Développement Web & Mobile',
        'rt': 'RT - Réseaux & Télécom',
        'asri': 'ASRI - Administration Système & Réseau'
      };

      let nom = metiersMap[slug] || userData.metier;
      setMetierNom(nom);

      // Charger les données
      const loadData = async () => {
        try {
          await Promise.all([
            loadDevoirs(),
            loadSeances(),
            loadJustificatifs()
          ]);
        } catch (err) {
          console.error('❌ Erreur lors du chargement:', err);
          setError('Erreur lors du chargement des données: ' + err.message);
        } finally {
          setLoading(false);
        }
      };

      loadData();

    } catch (parseError) {
      console.error('❌ Erreur parsing user:', parseError);
      setError('Erreur lors de la lecture des données utilisateur');
      setLoading(false);
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

      alert('✅ Devoir soumis avec succès !');
      setShowSoumissionModal(false);
      await loadDevoirs();
    } catch (error) {
      alert('❌ Erreur lors de la soumission: ' + (error.response?.data?.message || error.message));
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
      alert('Veuillez sélectionner un fichier et indiquer un motif');
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

      alert('✅ Justificatif déposé avec succès !');
      setShowJustificatifModal(false);
      await loadJustificatifs();
    } catch (error) {
      alert('❌ Erreur lors du dépôt: ' + (error.response?.data?.message || error.message));
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
      alert('❌ Format non supporté. Utilisez PDF, ZIP, JPG, PNG.');
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      alert(`❌ Fichier trop volumineux. Taille max: ${maxSize / 1024 / 1024}MB`);
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
    if (!soumission) return { status: 'non_soumis', text: 'Non soumis', variant: 'secondary' };
    
    if (soumission.feedback) {
      return { status: 'corrige', text: 'Corrigé', variant: 'success' };
    } else {
      return { status: 'soumis', text: 'Soumis', variant: 'primary' };
    }
  };

  const getStatutJustificatif = (statut) => {
    const statusMap = {
      'en_attente': { text: 'En attente', variant: 'warning' },
      'valide': { text: 'Validé', variant: 'success' },
      'refuse': { text: 'Refusé', variant: 'danger' }
    };
    return statusMap[statut] || { text: 'Inconnu', variant: 'secondary' };
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

  // Styles pour les effets de survol
  const cardHoverStyle = {
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    border: '1px solid #e9ecef'
  };

  const cardHoverEffect = {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 123, 255, 0.15)',
    borderColor: '#007bff'
  };

  // Fonction pour rendre le contenu principal
  const renderMainContent = () => {
    switch (activeSection) {
      case 'accueil':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm text-center border-0 bg-white">
                <Card.Body className="py-5">
                  <h2 className="mb-3 text-primary">👋 Bienvenue, {user?.name}</h2>
                  <p className="lead mb-5 text-muted">
                    Votre espace personnel - {metierNom} • Année {annee}
                  </p>
                  
                  <div className="row justify-content-center g-4">
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📚
                          </div>
                          <h5 className="text-primary">Mes Devoirs</h5>
                          <p className="text-muted small flex-grow-1">
                            Consultez vos devoirs assignés et soumettez vos travaux
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setActiveSection('devoirs')}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Voir mes Devoirs
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📝
                          </div>
                          <h5 className="text-primary">Justificatifs</h5>
                          <p className="text-muted small flex-grow-1">
                            Déposez des justificatifs pour vos absences
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setActiveSection('justificatifs')}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Gérer les justificatifs
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📊
                          </div>
                          <h5 className="text-primary">Statistiques</h5>
                          <p className="text-muted small flex-grow-1">
                            Consultez vos statistiques de présence et de travaux
                          </p>
                          <div className="mt-2">
                            <Badge bg="primary" className="me-2">Devoirs: {devoirs.length}</Badge>
                            <Badge bg="info">Justificatifs: {justificatifs.length}</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );

      case 'devoirs':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">📚 Mes Devoirs</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body>
                  {devoirs.length === 0 ? (
                    <Alert variant="primary" className="text-center py-4 bg-light border-0">
                      <h6 className="mb-3 text-primary">Aucun devoir assigné</h6>
                      <p className="mb-0 text-muted">
                        Vos devoirs apparaîtront ici lorsqu'ils seront créés par vos enseignants.
                      </p>
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Titre</th>
                            <th>UEA</th>
                            <th>Date limite</th>
                            <th>Coefficient</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map(devoir => {
                            const statut = getStatutSoumission(devoir.id);
                            const estDepasse = isDateDepassee(devoir.date_limite);
                            
                            return (
                              <tr key={devoir.id}>
                                <td>
                                  <strong className="text-primary">{devoir.titre}</strong>
                                  {devoir.fichier_sujet && (
                                    <Button 
                                      variant="link" 
                                      size="sm" 
                                      href={devoir.fichier_sujet}
                                      target="_blank"
                                      className="p-0 ms-1"
                                    >
                                      📎
                                    </Button>
                                  )}
                                </td>
                                <td className="text-muted">{devoir.uea_nom}</td>
                                <td>
                                  <span className={estDepasse ? 'text-danger' : ''}>
                                    {formatDate(devoir.date_limite)}
                                  </span>
                                  {estDepasse && <Badge bg="danger" className="ms-1">Dépassé</Badge>}
                                </td>
                                <td>
                                  <Badge bg="info">{devoir.coefficient}</Badge>
                                </td>
                                <td>
                                  <Badge bg={statut.variant}>
                                    {statut.text}
                                  </Badge>
                                  {soumissions[devoir.id]?.feedback && (
                                    <div className="mt-1">
                                      <small>
                                        <strong>Feedback:</strong> {soumissions[devoir.id].feedback}
                                      </small>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  {statut.status === 'non_soumis' && !estDepasse && (
                                    <Button 
                                      variant="primary" 
                                      size="sm"
                                      onClick={() => handleSoumettreDevoir(devoir)}
                                    >
                                      Soumettre
                                    </Button>
                                  )}
                                  {statut.status === 'non_soumis' && estDepasse && (
                                    <Button variant="secondary" size="sm" disabled>
                                      Temps écoulé
                                    </Button>
                                  )}
                                  {statut.status !== 'non_soumis' && (
                                    <Button 
                                      variant="outline-primary" 
                                      size="sm"
                                      onClick={() => handleSoumettreDevoir(devoir)}
                                      disabled={estDepasse}
                                    >
                                      {estDepasse ? 'Modifier (dépassé)' : 'Modifier'}
                                    </Button>
                                  )}
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
            </Col>
          </Row>
        );

      case 'justificatifs':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">📝 Justificatifs d'absence</h5>
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline-light" 
                      className="me-2"
                      onClick={() => setShowMesJustificatifsModal(true)}
                    >
                      Mes justificatifs ({justificatifs.length})
                    </Button>
                    <Button 
                      size="sm" 
                      variant="light"
                      onClick={() => setShowSidebar(true)}
                    >
                      ☰ Menu
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {seances.length === 0 ? (
                    <Alert variant="primary" className="text-center py-4 bg-light border-0">
                      <h6 className="mb-3 text-primary">Aucune séance trouvée</h6>
                      <p className="mb-0 text-muted">Vos séances apparaîtront ici.</p>
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive>
                        <thead className="table-primary">
                          <tr>
                            <th>Date</th>
                            <th>UEA</th>
                            <th>Matière</th>
                            <th>Salle</th>
                            <th>Statut présence</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seances.map(seance => (
                            <tr key={seance.id}>
                              <td>
                                <strong>{formatDate(seance.date_seance)}</strong>
                                <br />
                                <small className="text-muted">
                                  {seance.heure_debut} - {seance.heure_fin}
                                </small>
                              </td>
                              <td className="text-muted">{seance.uea_nom}</td>
                              <td className="text-muted">{seance.matiere}</td>
                              <td className="text-muted">{seance.salle}</td>
                              <td>
                                <Badge bg={
                                  seance.presence_statut === 'present' ? 'success' :
                                  seance.presence_statut === 'absent' ? 'danger' :
                                  seance.presence_statut === 'retard' ? 'warning' : 'secondary'
                                }>
                                  {seance.presence_statut || 'Non pointé'}
                                </Badge>
                              </td>
                              <td>
                                {seance.presence_statut === 'absent' && (
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => handleDeposerJustificatif(seance)}
                                  >
                                    📎 Déposer justificatif
                                  </Button>
                                )}
                                {seance.presence_statut !== 'absent' && (
                                  <Button variant="outline-secondary" size="sm" disabled>
                                    Justificatif non requis
                                  </Button>
                                )}
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

      default:
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm text-center border-0 bg-white">
                <Card.Body className="py-5">
                  <h2 className="mb-3 text-primary">👋 Bienvenue, {user?.name}</h2>
                  <p className="lead mb-5 text-muted">
                    Votre espace personnel - {metierNom} • Année {annee}
                  </p>
                  
                  <div className="row justify-content-center g-4">
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📚
                          </div>
                          <h5 className="text-primary">Mes Devoirs</h5>
                          <p className="text-muted small flex-grow-1">
                            Consultez vos devoirs assignés et soumettez vos travaux
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setActiveSection('devoirs')}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Voir mes Devoirs
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📝
                          </div>
                          <h5 className="text-primary">Justificatifs</h5>
                          <p className="text-muted small flex-grow-1">
                            Déposez des justificatifs pour vos absences
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setActiveSection('justificatifs')}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Gérer les justificatifs
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                    
                    <div className="col-md-4 col-sm-6">
                      <Card 
                        className="h-100 border-0 shadow-sm bg-white"
                        style={cardHoverStyle}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = cardHoverEffect.transform;
                          e.currentTarget.style.boxShadow = cardHoverEffect.boxShadow;
                          e.currentTarget.style.borderColor = cardHoverEffect.borderColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                          e.currentTarget.style.borderColor = '#e9ecef';
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="mb-3 text-primary" style={{ fontSize: '3rem' }}>
                            📊
                          </div>
                          <h5 className="text-primary">Statistiques</h5>
                          <p className="text-muted small flex-grow-1">
                            Consultez vos statistiques de présence et de travaux
                          </p>
                          <div className="mt-2">
                            <Badge bg="primary" className="me-2">Devoirs: {devoirs.length}</Badge>
                            <Badge bg="info">Justificatifs: {justificatifs.length}</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" className="mb-3" />
        <h4 className="text-primary">Chargement de votre dashboard...</h4>
      </Container>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold">👨‍🎓 Dashboard Apprenant</Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            <Button 
              variant="outline-light" 
              className="me-3"
              onClick={() => setShowSidebar(true)}
            >
              ☰ Menu
            </Button>
            <span className="text-white me-3">{user?.name}</span>
            <LogoutButton onLogout={handleLogout} />
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 py-4 bg-light">
        <Row>
          {/* Sidebar Offcanvas */}
          <Offcanvas 
            show={showSidebar} 
            onHide={() => setShowSidebar(false)}
            placement="start"
            style={{ width: '280px' }}
          >
            <Offcanvas.Header closeButton className="bg-primary text-white">
              <Offcanvas.Title>📊 Navigation</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0 bg-white">
              <div className="list-group list-group-flush">
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'accueil' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('accueil')}
                >
                  <span className="me-2">🏠</span>
                  Accueil
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'devoirs' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('devoirs')}
                >
                  <span className="me-2">📚</span>
                  Mes Devoirs
                  {devoirs.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{devoirs.length}</Badge>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'justificatifs' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('justificatifs')}
                >
                  <span className="me-2">📝</span>
                  Justificatifs
                  {justificatifs.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{justificatifs.length}</Badge>
                  )}
                </button>
              </div>
              
              {/* Informations apprenant */}
              <div className="p-3 border-top bg-light">
                <small className="text-muted">
                  <strong>👤 Votre profil :</strong><br />
                  • {metierNom}<br />
                  • Année {annee}<br />
                  • Devoirs: <span className="fw-bold text-primary">{devoirs.length}</span>
                </small>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          {/* Contenu principal */}
          <Col xs={12}>
            {renderMainContent()}
          </Col>
        </Row>
      </Container>

      {/* Modal Dépôt Justificatif */}
      <Modal show={showJustificatifModal} onHide={() => setShowJustificatifModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📎 Déposer un justificatif</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitJustificatif}>
          <Modal.Body>
            {selectedSeance && (
              <>
                <Alert variant="primary" className="bg-light border-0">
                  <strong>Séance:</strong> {selectedSeance.matiere}<br/>
                  <strong>Date:</strong> {formatDate(selectedSeance.date_seance)}<br/>
                  <strong>UEA:</strong> {selectedSeance.uea_nom}
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">📄 Fichier justificatif *</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'justificatif')}
                    required
                  />
                  <Form.Text className="text-muted">
                    Formats: PDF, ZIP, JPG, PNG (max 10MB)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">📝 Motif d'absence *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={motifJustificatif}
                    onChange={(e) => setMotifJustificatif(e.target.value)}
                    placeholder="Expliquez brièvement la raison de votre absence..."
                    required
                  />
                </Form.Group>

                {fichierJustificatif && (
                  <Alert variant="primary" className="small bg-light border-0">
                    📄 Fichier sélectionné: {fichierJustificatif.name} 
                    ({(fichierJustificatif.size / 1024 / 1024).toFixed(2)} MB)
                  </Alert>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShowJustificatifModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!fichierJustificatif || !motifJustificatif || uploading}
            >
              {uploading ? 'Envoi en cours...' : '📎 Déposer le justificatif'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Mes Justificatifs */}
      <Modal show={showMesJustificatifsModal} onHide={() => setShowMesJustificatifsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📋 Mes justificatifs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {justificatifs.length === 0 ? (
            <Alert variant="primary" className="text-center py-4 bg-light border-0">
              <h6 className="mb-3 text-primary">Aucun justificatif déposé</h6>
              <p className="mb-0 text-muted">Vos justificatifs apparaîtront ici après dépôt.</p>
            </Alert>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Table striped hover responsive>
                <thead className="table-primary">
                  <tr>
                    <th>Date séance</th>
                    <th>Matière</th>
                    <th>Motif</th>
                    <th>Fichier</th>
                    <th>Statut</th>
                    <th>Date dépôt</th>
                  </tr>
                </thead>
                <tbody>
                  {justificatifs.map(justificatif => {
                    const statut = getStatutJustificatif(justificatif.statut);
                    return (
                      <tr key={justificatif.id}>
                        <td>{formatDate(justificatif.seance_date)}</td>
                        <td className="text-muted">{justificatif.seance_matiere}</td>
                        <td className="text-muted">
                          <small>{justificatif.motif}</small>
                        </td>
                        <td>
                          {justificatif.fichier && (
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              href={justificatif.fichier}
                              target="_blank"
                            >
                              📎 Voir
                            </Button>
                          )}
                        </td>
                        <td>
                          <Badge bg={statut.variant}>
                            {statut.text}
                          </Badge>
                        </td>
                        <td className="text-muted">
                          <small>{formatDate(justificatif.created_at)}</small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowMesJustificatifsModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Soumission Devoir */}
      <Modal show={showSoumissionModal} onHide={() => setShowSoumissionModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📤 Soumettre le devoir : {selectedDevoir?.titre}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitSoumission}>
          <Modal.Body>
            {selectedDevoir && (
              <>
                <Alert variant="primary" className="bg-light border-0">
                  <strong>UEA:</strong> {selectedDevoir.uea_nom}<br/>
                  <strong>Date limite:</strong> {formatDate(selectedDevoir.date_limite)}<br/>
                  <strong>Description:</strong> {selectedDevoir.description}
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">📎 Fichier de soumission</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.zip,.rar,.txt,.doc,.docx"
                    onChange={(e) => handleFileChange(e, 'soumission')}
                    required
                  />
                  <Form.Text className="text-muted">
                    Formats acceptés: PDF, ZIP, RAR, DOC, DOCX, TXT (max 50MB)
                  </Form.Text>
                </Form.Group>

                {fichierSoumission && (
                  <Alert variant="primary" className="small bg-light border-0">
                    📄 Fichier sélectionné: {fichierSoumission.name} 
                    ({(fichierSoumission.size / 1024 / 1024).toFixed(2)} MB)
                  </Alert>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShowSoumissionModal(false)}>
              Annuler
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!fichierSoumission || uploading}
            >
              {uploading ? 'Envoi en cours...' : 'Soumettre le devoir'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Footer */}
      <footer className="bg-primary text-white mt-auto">
        <Container className="py-4">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-2">👨‍🎓 Dashboard Apprenant</h6>
              <p className="mb-0 text-light">
                {metierNom} • Année {annee}
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end justify-content-start flex-wrap gap-3">
                <small className="text-light">
                  Apprenant: <span className="fw-bold">{user?.name}</span>
                </small>
                <small className="text-light">
                  🏫 <span className="fw-bold">ISEP</span>
                </small>
                <small className="text-light">
                  📅 {new Date().getFullYear()} © Tous droits réservés
                </small>
              </div>
            </Col>
          </Row>
          <hr className="my-3 border-light" />
          <Row>
            <Col className="text-center">
              <small className="text-light">
                Plateforme d'apprentissage - Développé avec React & Bootstrap
              </small>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Affichage des erreurs */}
      {error && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setError('')}
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 1050, minWidth: '300px' }}
        >
          <Alert.Heading>❌ Erreur</Alert.Heading>
          <p className="mb-0">{error}</p>
        </Alert>
      )}
    </div>
  );
}

export default DashboardApprenant;