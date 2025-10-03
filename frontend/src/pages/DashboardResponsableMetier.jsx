// src/pages/DashboardResponsableMetier.jsx
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
  Form,
  Alert
} from 'react-bootstrap';
import api from '../services/api';

function DashboardResponsableMetier() {
  const [user, setUser] = useState(null);
  const [apprenants, setApprenants] = useState([]);
  const [metierId, setMetierId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return (window.location.href = '/login');

    const fetchUserData = async () => {
      try {
        const res = await api.get('/user');
        if (res.data.role !== 'responsable_metier') {
          alert("Accès refusé");
          return (window.location.href = '/');
        }
        setUser(res.data);
        setMetierId(res.data.metier_id); // Supposons que l'utilisateur a un champ metier_id
      } catch (err) {
        console.error("Erreur");
      }
    };

    const fetchApprenants = async () => {
      if (!metierId) return;
      try {
        const res = await api.get(`/api/apprenants?metier_id=${metierId}`);
        setApprenants(res.data);
      } catch (err) {
        console.error("Impossible de charger les apprenants");
      }
    };

    fetchUserData();
    fetchApprenants();
  }, [metierId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ backgroundColor: '#f0f7ff', minHeight: '100vh' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>🎓 Dashboard Responsable Métier</Navbar.Brand>
          <Nav className="ms-auto">
            <span className="text-white me-3">👤 {user?.name}</span>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          <Col md={3}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="text-primary">Actions</h5>
                <ul className="nav flex-column">
                  <li className="nav-item"><a href="#liste" className="nav-link">Liste Apprenants</a></li>
                  <li className="nav-item"><a href="#suivi" className="nav-link">Suivi Assiduité</a></li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Row id="liste" className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-info text-white">
                    <h5>Liste des Apprenants ({apprenants.length})</h5>
                  </Card.Header>
                  <Card.Body>
                    {apprenants.length === 0 ? (
                      <Alert variant="secondary">Aucun apprenant inscrit dans ce métier.</Alert>
                    ) : (
                      <Table striped hover responsive>
                        <thead>
                          <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Matricule</th>
                            <th>Présences</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apprenants.map(a => (
                            <tr key={a.id}>
                              <td>{a.user?.name}</td>
                              <td>{a.user?.email}</td>
                              <td>{a.matricule}</td>
                              <td>
                                <Button size="sm" variant="outline-primary">Voir</Button>
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
    </div>
  );
}

export default DashboardResponsableMetier;