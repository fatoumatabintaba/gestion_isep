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
  Alert
} from 'react-bootstrap';
import api from '../services/api';

function DashboardEnseignant() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [ueas, setUeas] = useState([]);
  const [soumissions, setSoumissions] = useState([]);

  // Nouveau devoir
  const [newDevoir, setNewDevoir] = useState({
    titre: '',
    description: '',
    uea_id: '',
    date_limite: '',
    coefficient: 1
  });

  // === Charger utilisateur + données ===
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await api.get('/user');
        const userData = res.data;
        if (userData.role !== 'enseignant') {
          alert("Accès refusé");
          window.location.href = '/';
        }
        setUser(userData);
      } catch (err) {
        console.error("Erreur chargement utilisateur");
      }
    };

    const fetchDevoirs = async () => {
      try {
        const res = await api.get('/api/devoirs?enseignant=me');
        setDevoirs(res.data);
      } catch (err) {
        console.error("Impossible de charger les devoirs");
      }
    };

    const fetchUeas = async () => {
      try {
        const res = await api.get('/api/ueas');
        setUeas(res.data);
      } catch (err) {
        console.error("Impossible de charger les UEAs");
      }
    };

    fetchUserData();
    fetchDevoirs();
    fetchUeas();
  }, []);

  // === Créer un devoir ===
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    setNewDevoir({ ...newDevoir, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/devoirs', newDevoir);
      alert('✅ Devoir créé ! Les apprenants ont été notifiés.');
      setNewDevoir({ titre: '', description: '', uea_id: '', date_limite: '', coefficient: 1 });
      setShowModal(false);
      const res = await api.get('/api/devoirs?enseignant=me');
      setDevoirs(res.data);
    } catch (err) {
      alert('❌ Erreur lors de la création du devoir');
    }
  };

  // === Déconnexion ===
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow-sm">
        <Container>
          <Navbar.Brand>📚 Dashboard Enseignant</Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            <span className="text-white me-3">👤 {user?.name}</span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col md={3} className="px-3">
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="text-primary">Menu</h5>
                <ul className="nav flex-column">
                  <li className="nav-item"><a href="#devoirs" className="nav-link">Mes Devoirs</a></li>
                  <li className="nav-item"><a href="#creer" className="nav-link">Créer Devoir</a></li>
                  <li className="nav-item">
                    <a href="/marquer-presences" className="nav-link">Marquer Présences</a>
                  </li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          {/* Contenu principal */}
          <Col md={9}>
            {/* Section : Mes Devoirs */}
            <Row id="devoirs" className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5>Mes Devoirs</h5>
                    <Button size="sm" variant="light" onClick={() => setShowModal(true)}>
                      + Nouveau
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    {devoirs.length === 0 ? (
                      <Alert variant="info">Aucun devoir publié.</Alert>
                    ) : (
                      <Table striped hover responsive>
                        <thead>
                          <tr>
                            <th>Titre</th>
                            <th>UEA</th>
                            <th>Date limite</th>
                            <th>Coefficient</th>
                            <th>Soumissions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map(d => (
                            <tr key={d.id}>
                              <td>{d.titre}</td>
                              <td>{d.uea?.nom || 'N/A'}</td>
                              <td>{new Date(d.date_limite).toLocaleDateString()}</td>
                              <td>{d.coefficient}</td>
                              <td>
                                <Button size="sm" variant="outline-primary">
                                  Voir ({d.soumissions_count || 0})
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
          </Col>
        </Row>
      </Container>

      {/* Modal : Créer un devoir */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📝 Créer un nouveau devoir</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                name="titre"
                value={newDevoir.titre}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newDevoir.description}
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>UEA</Form.Label>
              <Form.Select
                name="uea_id"
                value={newDevoir.uea_id}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionner une UEA</option>
                {ueas.map(uea => (
                  <option key={uea.id} value={uea.id}>{uea.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date limite</Form.Label>
              <Form.Control
                type="datetime-local"
                name="date_limite"
                value={newDevoir.date_limite}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Coefficient</Form.Label>
              <Form.Control
                type="number"
                name="coefficient"
                min="1"
                max="10"
                value={newDevoir.coefficient}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button variant="primary" type="submit">Créer</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default DashboardEnseignant;