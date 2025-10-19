// src/pages/DashboardCoordinateur.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Navbar,
  Nav,
  Alert,
  Spinner,
  Offcanvas,
  Badge,
  Modal,
  Form
} from 'react-bootstrap';
import api from '../services/api';
import LogoutButton from '../components/LogoutButton';

function DashboardCoordinateur() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [seances, setSeances] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState('absences');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedJustificatif, setSelectedJustificatif] = useState(null);
  const [validationMotif, setValidationMotif] = useState('');

  // Vérifie le token et charge les données
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      window.location.href = '/login';
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (currentUser.role !== 'coordinateur') {
      alert("Accès interdit : Rôle non autorisé.");
      window.location.href = '/';
      return;
    }

    setUser(currentUser);

    const fetchData = async () => {
      try {
        const userRes = await api.get('/api/user');
        const backendUser = userRes.data;
        
        if (backendUser.role !== 'coordinateur' && backendUser.role !== 'admin') {
          throw new Error("Rôle invalide");
        }

        const [devoirsRes, absencesRes, seancesRes, justificatifsRes] = await Promise.all([
          api.get('/api/coordinateur/devoirs'),
          api.get('/api/absences'),
          api.get('/api/seances'),
          api.get('/api/justificatifs/en-attente')
        ]);

        setDevoirs(devoirsRes.data);
        setAbsences(absencesRes.data);
        setSeances(seancesRes.data);
        setJustificatifs(justificatifsRes.data);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
        
        if (err.response?.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          setError("Impossible de charger les données. Vérifiez votre connexion.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Fonction pour valider/refuser un justificatif
  const handleValiderJustificatif = async (statut) => {
    if (!selectedJustificatif) return;

    try {
      await api.put(`/api/justificatifs/${selectedJustificatif.id}/statut`, {
        statut: statut,
        motif: validationMotif
      });

      alert(`Justificatif ${statut === 'valide' ? 'validé' : 'refusé'} avec succès !`);
      setShowValidationModal(false);
      setSelectedJustificatif(null);
      setValidationMotif('');

      // Recharger les justificatifs
      const justificatifsRes = await api.get('/api/justificatifs/en-attente');
      setJustificatifs(justificatifsRes.data);
    } catch (err) {
      console.error('Erreur validation justificatif:', err);
      alert('Erreur lors de la validation du justificatif');
    }
  };

  const handleOpenValidationModal = (justificatif, action) => {
    setSelectedJustificatif(justificatif);
    setValidationMotif('');
    setShowValidationModal(true);
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
      case 'absences':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">🚨 Absences fréquentes</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body>
                  {error && <Alert variant="primary" className="bg-light border-0">{error}</Alert>}

                  {absences.length === 0 ? (
                    <Alert variant="primary" className="text-center py-4 bg-light border-0">
                      ✅ Aucune absence critique détectée.
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Apprenant</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th className="text-center">Nb Absences</th>
                            <th className="text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {absences.map((a) => (
                            <tr key={a.id}>
                              <td className="text-primary">{a.apprenant?.user?.name || 'Inconnu'}</td>
                              <td className="text-muted">
                                <Badge bg="info">{a.apprenant?.metier || 'Non défini'}</Badge>
                              </td>
                              <td className="text-muted">
                                <Badge bg="secondary">Année {a.apprenant?.annee || '?'}</Badge>
                              </td>
                              <td className="text-center">
                                <Badge bg="primary">{a.nb_absences}</Badge>
                              </td>
                              <td className="text-center">
                                <Button size="sm" variant="outline-primary">
                                  📞 Contacter
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

      case 'devoirs':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">✅ Validation des Devoirs</h5>
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
                      🎉 Tous les devoirs sont validés.
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Titre</th>
                            <th>Apprenant</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th>Date Soumission</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map((d) => (
                            <tr key={d.id}>
                              <td className="text-primary">{d.titre}</td>
                              <td className="text-muted">{d.apprenant?.user?.name}</td>
                              <td className="text-muted">
                                <Badge bg="info">{d.apprenant?.metier || d.metier || 'Non spécifié'}</Badge>
                              </td>
                              <td className="text-muted">
                                <Badge bg="secondary">Année {d.apprenant?.annee || d.annee || '?'}</Badge>
                              </td>
                              <td className="text-muted">{new Date(d.created_at).toLocaleDateString()}</td>
                              <td className="text-center">
                                <Button size="sm" variant="primary" className="me-2">Valider</Button>
                                <Button size="sm" variant="outline-danger">Rejeter</Button>
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

      case 'seances':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">📅 Séances récentes</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body>
                  {seances.length === 0 ? (
                    <Alert variant="primary" className="text-center py-4 bg-light border-0">
                      Aucune séance enregistrée.
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Matière</th>
                            <th>UEA</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th>Date</th>
                            <th>Heure</th>
                            <th>Enseignant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seances.map((s) => (
                            <tr key={s.id}>
                              <td className="text-primary">{s.matiere || s.nom}</td>
                              <td className="text-muted">{s.uea_nom}</td>
                              <td className="text-muted">
                                <Badge bg="info">{s.metier?.nom || s.uea?.metier || 'Non spécifié'}</Badge>
                              </td>
                              <td className="text-muted">
                                <Badge bg="secondary">Année {s.uea?.annee || '?'}</Badge>
                              </td>
                              <td className="text-muted">{s.date || s.date_seance}</td>
                              <td className="text-muted">{s.heure_debut} - {s.heure_fin}</td>
                              <td className="text-muted">{s.enseignant?.name}</td>
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

      case 'justificatifs':
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white">
                <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="mb-0">📋 Justificatifs en attente</h5>
                  <Button 
                    size="sm" 
                    variant="light"
                    onClick={() => setShowSidebar(true)}
                  >
                    ☰ Menu
                  </Button>
                </Card.Header>
                <Card.Body>
                  {justificatifs.length === 0 ? (
                    <Alert variant="primary" className="text-center py-4 bg-light border-0">
                      ✅ Aucun justificatif en attente.
                    </Alert>
                  ) : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table striped hover responsive className="mt-3">
                        <thead className="table-primary">
                          <tr>
                            <th>Apprenant</th>
                            <th>Métier</th>
                            <th>Année</th>
                            <th>Séance</th>
                            <th>Date Séance</th>
                            <th>Motif</th>
                            <th>Fichier</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {justificatifs.map((j) => (
                            <tr key={j.id}>
                              <td className="text-primary">{j.apprenant?.user?.name}</td>
                              <td>
                                <Badge bg="info">{j.apprenant?.metier || 'Non spécifié'}</Badge>
                              </td>
                              <td>
                                <Badge bg="secondary">Année {j.apprenant?.annee || '?'}</Badge>
                              </td>
                              <td className="text-muted">{j.seance?.matiere}</td>
                              <td className="text-muted">{new Date(j.seance?.date_seance).toLocaleDateString()}</td>
                              <td className="text-muted">
                                <small>{j.motif}</small>
                              </td>
                              <td>
                                {j.fichier ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline-primary"
                                    href={j.fichier}
                                    target="_blank"
                                  >
                                    📎 Voir
                                  </Button>
                                ) : (
                                  <span className="text-muted small">Aucun</span>
                                )}
                              </td>
                              <td className="text-center">
                                <Button 
                                  size="sm" 
                                  variant="primary" 
                                  className="me-2"
                                  onClick={() => handleOpenValidationModal(j, 'valide')}
                                >
                                  Valider
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline-danger"
                                  onClick={() => handleOpenValidationModal(j, 'refuse')}
                                >
                                  Refuser
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

      default:
        return (
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm border-0 bg-white text-center">
                <Card.Body className="py-5">
                  <h4 className="text-primary mb-3">👋 Bienvenue, {user?.name}</h4>
                  <p className="text-muted lead">
                    Sélectionnez une section dans le menu pour commencer
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-primary">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ffffff' }}>
      {/* Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand className="fw-bold">📋 Dashboard Coordinateur</Navbar.Brand>
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
                    activeSection === 'absences' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => {
                    setActiveSection('absences');
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">🚨</span>
                  Absences fréquentes
                  {absences.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{absences.length}</Badge>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'devoirs' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => {
                    setActiveSection('devoirs');
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">✅</span>
                  Validation Devoirs
                  {devoirs.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{devoirs.length}</Badge>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'seances' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => {
                    setActiveSection('seances');
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">📅</span>
                  Séances récentes
                  {seances.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{seances.length}</Badge>
                  )}
                </button>
                
                <button
                  className={`list-group-item list-group-item-action d-flex align-items-center ${
                    activeSection === 'justificatifs' ? 'active bg-primary text-white' : ''
                  }`}
                  onClick={() => {
                    setActiveSection('justificatifs');
                    setShowSidebar(false);
                  }}
                >
                  <span className="me-2">📋</span>
                  Justificatifs
                  {justificatifs.length > 0 && (
                    <Badge bg="primary" className="ms-auto">{justificatifs.length}</Badge>
                  )}
                </button>
              </div>
              
              {/* Statistiques */}
              <div className="p-3 border-top bg-light">
                <small className="text-muted">
                  <strong>📈 Aperçu :</strong><br />
                  • Absences: <span className="fw-bold text-primary">{absences.length}</span><br />
                  • Devoirs: <span className="fw-bold text-primary">{devoirs.length}</span><br />
                  • Justificatifs: <span className="fw-bold text-primary">{justificatifs.length}</span>
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

      {/* Modal de validation des justificatifs */}
      <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)} centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {selectedJustificatif ? `Validation du justificatif - ${selectedJustificatif.apprenant?.user?.name}` : 'Validation'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJustificatif && (
            <>
              <Alert variant="info">
                <strong>Apprenant:</strong> {selectedJustificatif.apprenant?.user?.name}<br />
                <strong>Métier:</strong> {selectedJustificatif.apprenant?.metier}<br />
                <strong>Année:</strong> {selectedJustificatif.apprenant?.annee}<br />
                <strong>Séance:</strong> {selectedJustificatif.seance?.matiere}<br />
                <strong>Date séance:</strong> {new Date(selectedJustificatif.seance?.date_seance).toLocaleDateString()}<br />
                <strong>Motif apprenant:</strong> {selectedJustificatif.motif}
              </Alert>
              
              <Form.Group className="mb-3">
                <Form.Label>Commentaire (optionnel)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={validationMotif}
                  onChange={(e) => setValidationMotif(e.target.value)}
                  placeholder="Ajoutez un commentaire pour la validation/refus..."
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowValidationModal(false)}>
            Annuler
          </Button>
          <Button variant="outline-danger" onClick={() => handleValiderJustificatif('refuse')}>
            Refuser
          </Button>
          <Button variant="primary" onClick={() => handleValiderJustificatif('valide')}>
            Valider
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Footer */}
      <footer className="bg-primary text-white mt-auto">
        <Container className="py-4">
          <Row className="align-items-center">
            <Col md={6}>
              <h6 className="mb-2">📋 Dashboard Coordinateur</h6>
              <p className="mb-0 text-light">
                Supervision des activités académiques
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <div className="d-flex justify-content-md-end justify-content-start flex-wrap gap-3">
                <small className="text-light">
                  👤 Coordinateur: <span className="fw-bold">{user?.name}</span>
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
                Système de gestion académique - Version Coordinateur
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}

export default DashboardCoordinateur;