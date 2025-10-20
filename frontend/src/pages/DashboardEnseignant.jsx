// src/pages/DashboardEnseignant.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Navbar,
  Nav,
  Alert,
  Offcanvas
} from 'react-bootstrap';
import api from '../services/api';
import LogoutButton from '../components/LogoutButton';
import { Link } from 'react-router-dom';

function DashboardEnseignant() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [selectedDevoir, setSelectedDevoir] = useState(null);
  const [feedbacks, setFeedbacks] = useState({});
  const [showSoumissions, setShowSoumissions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDevoirs, setShowDevoirs] = useState(false);

  const [newDevoir, setNewDevoir] = useState({
    titre: '',
    description: '',
    uea_nom: '',
    date_limite: '',
    coefficient: 1,
    fichier_sujet: null,
    type_sujet: 'texte',
    metier: '', // Nouveau champ : métier concerné
    annee: ''   // Nouveau champ : année concernée
  });

  // Liste des métiers et années disponibles
  const metiers = [
    { value: 'DWM', label: 'DWM - Développement Web & Mobile' },
    { value: 'RT', label: 'RT - Réseaux & Télécom' },
    { value: 'ASRI', label: 'ASRI - Administration Système & Réseau' }
  ];

  const annees = [
    { value: '1', label: 'Première année' },
    { value: '2', label: 'Deuxième année' }
  ];

  // === Charger utilisateur + données ===
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      window.location.href = '/login';
      return;
    }

    try {
      const userData = JSON.parse(userStr);

      if (userData.role !== 'enseignant') {
        alert("Accès refusé : vous n'êtes pas un enseignant");
        if (userData.role === 'apprenant') {
          const metierSlug = slugify(userData.metier);
          window.location.href = `/dashboard/apprenant/${metierSlug}/annee-${userData.annee}`;
        } else if (userData.role === 'chef_departement') {
          window.location.href = '/dashboard/chef';
        } else {
          window.location.href = '/';
        }
        return;
      }

      setUser(userData);
    } catch (err) {
      console.error("Erreur parsing user data", err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
  }, []);

  // Fonction pour charger les devoirs
  const fetchDevoirs = async () => {
    try {
      const res = await api.get('/api/enseignant/devoirs');
      setDevoirs(res.data);
    } catch (err) {
      console.error('Erreur:', err.response?.data);
    }
  };

  const slugify = (text) => {
    return text
      ?.toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  };

  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    setNewDevoir({ ...newDevoir, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
      ];
      
      const maxSize = 50 * 1024 * 1024;

      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.zip')) {
        alert('❌ Format de fichier non supporté. Utilisez PDF ou ZIP.');
        e.target.value = '';
        return;
      }

      if (file.size > maxSize) {
        alert('❌ Fichier trop volumineux. Taille max: 50MB');
        e.target.value = '';
        return;
      }

      setNewDevoir({ ...newDevoir, fichier_sujet: file });
    }
  };

  const handleTypeSujetChange = (type) => {
    setNewDevoir({ 
      ...newDevoir, 
      type_sujet: type,
      fichier_sujet: type === 'texte' ? null : newDevoir.fichier_sujet
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // Validation des champs métier et année
    if (!newDevoir.metier || !newDevoir.annee) {
      alert('❌ Veuillez sélectionner le métier et l\'année concernés.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      formData.append('titre', newDevoir.titre);
      formData.append('description', newDevoir.description);
      formData.append('uea_nom', newDevoir.uea_nom);
      formData.append('date_limite', newDevoir.date_limite);
      formData.append('coefficient', newDevoir.coefficient);
      formData.append('type_sujet', newDevoir.type_sujet);
      formData.append('metier', newDevoir.metier); // Ajout du métier
      formData.append('annee', newDevoir.annee);   // Ajout de l'année

      if (newDevoir.type_sujet === 'fichier' && newDevoir.fichier_sujet) {
        formData.append('fichier_sujet', newDevoir.fichier_sujet);
      }

      await api.post('/api/devoirs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(`✅ Devoir créé pour les ${newDevoir.metier} - Année ${newDevoir.annee} ! Les apprenants ont été notifiés.`);
      setNewDevoir({ 
        titre: '', 
        description: '', 
        uea_nom: '', 
        date_limite: '', 
        coefficient: 1,
        fichier_sujet: null,
        type_sujet: 'texte',
        metier: '',
        annee: ''
      });
      setShowModal(false);
      
      await fetchDevoirs();
    } catch (err) {
      console.error('Erreur création devoir:', err.response?.data);
      alert('❌ Erreur lors de la création du devoir');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleVoirMesDevoirs = async () => {
    setActiveSection('devoirs');
    setShowDevoirs(true);
    await fetchDevoirs();
    setShowSidebar(false);
  };

  const handleFermerDevoirs = () => {
    setShowDevoirs(false);
    setActiveSection('accueil');
  };

  const handleVoirSoumissions = async (devoir) => {
    setSelectedDevoir(devoir);
    setShowSoumissions(true);
    setActiveSection('soumissions');
    try {
      const res = await api.get(`/api/devoirs/${devoir.id}/soumissions`);
      setSoumissions(res.data);
    } catch (err) {
      console.error('Erreur soumissions:', err.response?.data);
      alert('Erreur lors du chargement des soumissions');
    }
  };

  const handleFeedbackChange = (soumissionId, value) => {
    setFeedbacks({ ...feedbacks, [soumissionId]: value });
  };

  const handleEnvoyerFeedback = async (soumissionId) => {
    try {
      await api.post(`/api/soumissions/${soumissionId}/feedback`, {
        feedback: feedbacks[soumissionId] || ''
      });
      alert('Feedback envoyé !');
      handleVoirSoumissions(selectedDevoir);
    } catch (err) {
      console.error('Erreur feedback:', err.response?.data);
      alert('Erreur lors de l\'envoi du feedback');
    }
  };

  const handleNavigation = (section) => {
    setActiveSection(section);
    setShowSidebar(false);
  };

  // Styles CSS pour les effets de survol en bleu
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
                    Gérez facilement vos cours, devoirs et présences
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
                          <h5 className="text-primary">Gérer mes Devoirs</h5>
                          <p className="text-muted small flex-grow-1">
                            Créer de nouveaux devoirs ou consulter ceux existants avec leurs soumissions
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={handleVoirMesDevoirs}
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
                            ✅
                          </div>
                          <h5 className="text-primary">Marquer Présences</h5>
                          <p className="text-muted small flex-grow-1">
                            Gérer les présences de vos apprenants et suivre leur assiduité
                          </p>
                          <Link to="/marquer-presences" className="mt-auto">
                            <Button 
                              variant="primary" 
                              className="w-100"
                              style={{
                                borderRadius: '25px',
                                padding: '10px 20px'
                              }}
                            >
                              Accéder
                            </Button>
                          </Link>
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
                            ➕
                          </div>
                          <h5 className="text-primary">Créer un Devoir</h5>
                          <p className="text-muted small flex-grow-1">
                            Publier un nouveau devoir pour vos apprenants avec fichiers ou texte
                          </p>
                          <Button 
                            variant="primary" 
                            className="mt-auto"
                            onClick={() => setShowModal(true)}
                            style={{
                              borderRadius: '25px',
                              padding: '10px 20px'
                            }}
                          >
                            Créer maintenant
                          </Button>
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
          showDevoirs && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0 bg-white">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">📚 Mes Devoirs</h5>
                    <div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        className="me-2"
                        onClick={() => setShowSidebar(true)}
                      >
                        ☰ Menu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline-light" 
                        className="me-2"
                        onClick={() => setShowModal(true)}
                      >
                        + Nouveau
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={handleFermerDevoirs}
                      >
                        ✕ Fermer
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {devoirs.length === 0 ? (
                      <Alert variant="primary" className="text-center py-4 bg-light border-0">
                        <h6 className="mb-3 text-primary">Aucun devoir publié</h6>
                        <p className="mb-0 text-muted">
                          Commencez par créer votre premier devoir en cliquant sur "Nouveau Devoir".
                        </p>
                      </Alert>
                    ) : (
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Titre</th>
                            <th>UEA</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th>Type</th>
                            <th>Date limite</th>
                            <th>Coefficient</th>
                            <th>Soumissions</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map(d => (
                            <tr key={d.id}>
                              <td>
                                <strong className="text-primary">{d.titre}</strong>
                                {d.fichier_sujet && <span className="ms-1">📎</span>}
                              </td>
                              <td className="text-muted">{d.uea_nom || d.uea?.nom || 'N/A'}</td>
                              <td>
                                <span className="badge bg-info">{d.metier || 'Non spécifié'}</span>
                              </td>
                              <td>
                                <span className="badge bg-secondary">Année {d.annee || '?'}</span>
                              </td>
                              <td>
                                <span className={`badge ${d.fichier_sujet ? 'bg-primary' : 'bg-secondary'}`}>
                                  {d.fichier_sujet ? 'Fichier' : 'Texte'}
                                </span>
                              </td>
                              <td className="text-muted">{new Date(d.date_limite).toLocaleDateString()}</td>
                              <td>
                                <span className="badge bg-primary">{d.coefficient}</span>
                              </td>
                              <td>
                                <span className={`badge ${d.soumissions_count > 0 ? "bg-primary" : "bg-secondary"}`}>
                                  {d.soumissions_count || 0}
                                </span>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => handleVoirSoumissions(d)}
                                  disabled={!d.soumissions_count}
                                >
                                  Voir
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        );

      case 'soumissions':
        return (
          showSoumissions && selectedDevoir && (
            <Row className="mb-4">
              <Col>
                <Card className="shadow-sm border-0 bg-white">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                    <h5 className="mb-0">📨 Soumissions pour : {selectedDevoir.titre}</h5>
                    <div>
                      <Button 
                        size="sm" 
                        variant="light" 
                        className="me-2"
                        onClick={() => setShowSidebar(true)}
                      >
                        ☰ Menu
                      </Button>
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={() => {
                          setShowSoumissions(false);
                          setActiveSection('devoirs');
                        }}
                      >
                        ← Retour
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {soumissions.length === 0 ? (
                      <Alert variant="primary" className="text-center py-4 bg-light border-0">
                        Aucune soumission pour ce devoir.
                      </Alert>
                    ) : (
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Apprenant</th>
                            <th>Fichier</th>
                            <th>Feedback</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soumissions.map(s => (
                            <tr key={s.id}>
                              <td className="text-primary">{s.apprenant_nom || s.apprenant?.name || 'N/A'}</td>
                              <td>
                                {s.fichier ?
                                  <a href={s.fichier} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                    📎 Voir
                                  </a>
                                  : <span className="text-muted">Aucun</span>}
                              </td>
                              <td>
                                {s.feedback ? (
                                  <span className="text-primary fw-bold">{s.feedback}</span>
                                ) : (
                                  <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={feedbacks[s.id] || ''}
                                    onChange={e => handleFeedbackChange(s.id, e.target.value)}
                                    placeholder="Entrer un feedback..."
                                  />
                                )}
                              </td>
                              <td>
                                {!s.feedback && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleEnvoyerFeedback(s.id)}
                                    disabled={!feedbacks[s.id]}
                                  >
                                    Envoyer
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )
        );

      case 'presences':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">✅ Marquer les Présences</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body className="text-center py-5">
                  <div className="mb-4 text-primary" style={{ fontSize: '4rem' }}>✅</div>
                  <h4 className="text-primary mb-3">Gestion des présences</h4>
                  <p className="lead text-muted mb-4">
                    Accédez à l'interface complète de gestion des présences de vos apprenants
                  </p>
                  <Link to="/marquer-presences">
                    <Button 
                      variant="primary" 
                      size="lg"
                      style={{
                        borderRadius: '25px',
                        padding: '12px 30px',
                        fontSize: '1.1rem'
                      }}
                    >
                      Accéder au Module de Présence
                    </Button>
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );

      default:
        return renderMainContent('accueil');
    }
  };

  return (
    <div className="dashboard-container d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold">📚 Dashboard Enseignant</Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            <Button 
              variant="outline-light" 
              className="me-3"
              onClick={() => setShowSidebar(true)}
            >
              ☰ Menu
            </Button>
            <span className="text-white me-3">👤 {user?.name}</span>
            <LogoutButton onLogout={handleLogout} />
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 py-4 bg-light">
        <Row>
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
                  onClick={handleVoirMesDevoirs}
                >
                  <span className="me-2">📚</span>
                  Mes Devoirs
                  {devoirs.length > 0 && (
                    <span className="badge bg-primary ms-auto">{devoirs.length}</span>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'presences' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => handleNavigation('presences')}
                >
                  <span className="me-2">✅</span>
                  Marquer Présences
                </button>
                
                <button
                  className="list-group-item list-group-item-action d-flex align-items-center"
                  onClick={() => {
                    setShowModal(true);
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">➕</span>
                  Créer un Devoir
                </button>
              </div>
              
              <div className="p-3 border-top bg-light">
                <small className="text-muted">
                  <strong>📈 Statistiques :</strong><br />
                  • Devoirs créés: <span className="fw-bold text-primary">{devoirs.length}</span><br />
                  • Soumissions totales: <span className="fw-bold text-primary">
                    {devoirs.reduce((acc, d) => acc + (d.soumissions_count || 0), 0)}
                  </span>
                </small>
              </div>
            </Offcanvas.Body>
          </Offcanvas>

          <Col xs={12}>
            {renderMainContent()}
          </Col>
        </Row>
      </Container>

      {/* Footer bleu et blanc */}
      <footer className="bg-primary text-white mt-auto">
        <Container className="py-4">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-2">📚 Plateforme Éducative</h6>
              <p className="mb-0 text-light">
                Système de gestion des devoirs et présences - Enseignant
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end justify-content-start flex-wrap gap-3">
                <small className="text-light">
                  👤 Connecté en tant que: <span className="fw-bold">{user?.name}</span>
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
                Développé avec ❤️ pour une meilleure expérience éducative
              </small>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Modal de création de devoir - MODIFIÉ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>📝 Créer un nouveau devoir</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Titre</Form.Label>
              <Form.Control
                type="text"
                name="titre"
                value={newDevoir.titre}
                onChange={handleChange}
                placeholder="Ex: TP1 - Algorithmique"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newDevoir.description}
                onChange={handleChange}
                placeholder="Décrivez le devoir en détail..."
              />
            </Form.Group>

            {/* NOUVEAU : Sélection du métier */}
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Métier concerné</Form.Label>
              <Form.Select
                name="metier"
                value={newDevoir.metier}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un métier</option>
                {metiers.map(metier => (
                  <option key={metier.value} value={metier.value}>
                    {metier.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* NOUVEAU : Sélection de l'année */}
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Année concernée</Form.Label>
              <Form.Select
                name="annee"
                value={newDevoir.annee}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez une année</option>
                {annees.map(annee => (
                  <option key={annee.value} value={annee.value}>
                    {annee.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">Type de sujet</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Sujet en texte"
                  name="type_sujet"
                  value="texte"
                  checked={newDevoir.type_sujet === 'texte'}
                  onChange={() => handleTypeSujetChange('texte')}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Fichier (PDF/ZIP)"
                  name="type_sujet"
                  value="fichier"
                  checked={newDevoir.type_sujet === 'fichier'}
                  onChange={() => handleTypeSujetChange('fichier')}
                />
              </div>
            </Form.Group>

            {newDevoir.type_sujet === 'fichier' && (
              <Form.Group className="mb-3">
                <Form.Label className="text-primary">📎 Fichier du sujet (PDF ou dossier ZIP)</Form.Label>
                <Form.Control
                  type="file"
                  accept=".pdf,.zip"
                  onChange={handleFileChange}
                  required={newDevoir.type_sujet === 'fichier'}
                />
                <Form.Text className="text-muted">
                  Formats acceptés: PDF ou ZIP (max 50MB)
                </Form.Text>
                {newDevoir.fichier_sujet && (
                  <Alert variant="primary" className="mt-2 small bg-light border-0">
                    📄 Fichier sélectionné: {newDevoir.fichier_sujet.name} 
                    ({(newDevoir.fichier_sujet.size / 1024 / 1024).toFixed(2)} MB)
                  </Alert>
                )}
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label className="text-primary">UEA</Form.Label>
              <Form.Control
                type="text"
                name="uea_nom"
                value={newDevoir.uea_nom}
                onChange={handleChange}
                placeholder="Ex: Algorithmique, Réseaux Informatiques..."
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Date limite</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="date_limite"
                    value={newDevoir.date_limite}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-primary">Coefficient</Form.Label>
                  <Form.Control
                    type="number"
                    name="coefficient"
                    min="1"
                    max="10"
                    value={newDevoir.coefficient}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-primary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? 'Création en cours...' : 'Créer le devoir'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default DashboardEnseignant;