// src/pages/DashboardApprenant.jsx
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
  Badge,
  Alert
} from 'react-bootstrap';
import api from '../services/api';

function DashboardApprenant() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [absences, setAbsences] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return (window.location.href = '/login');

    const fetchUserData = async () => {
      try {
        const res = await api.get('/user');
        if (res.data.role !== 'apprenant') {
          alert("Accès refusé");
          return (window.location.href = '/');
        }
        setUser(res.data);
      } catch (err) {
        console.error("Erreur");
      }
    };

    const fetchDevoirs = async () => {
      try {
        const res = await api.get('/api/devoirs?ouverte=oui');
        setDevoirs(res.data);
      } catch (err) {
        console.error("Impossible de charger les devoirs");
      }
    };

    const fetchSoumissions = async () => {
      try {
        const res = await api.get('/api/soumissions?apprenant=moi');
        setSoumissions(res.data);
      } catch (err) {
        console.error("Impossible de charger les soumissions");
      }
    };

    const fetchAbsences = async () => {
      try {
        const res = await api.get('/api/absences?apprenant=moi');
        setAbsences(res.data);
      } catch (err) {
        console.error("Impossible de charger les absences");
      }
    };

    fetchUserData();
    fetchDevoirs();
    fetchSoumissions();
    fetchAbsences();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>📚 Mon Espace Apprenant</Navbar.Brand>
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
                <h5 className="text-primary">Menu</h5>
                <ul className="nav flex-column">
                  <li className="nav-item"><a href="#devoirs" className="nav-link">Mes Devoirs</a></li>
                  <li className="nav-item"><a href="#soumissions" className="nav-link">Mes Soumissions</a></li>
                  <li className="nav-item"><a href="#absences" className="nav-link">Mes Absences</a></li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Row id="devoirs" className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-success text-white">
                    <h5>Devoirs à rendre</h5>
                  </Card.Header>
                  <Card.Body>
                    {devoirs.length === 0 ? (
                      <Alert variant="info">Aucun devoir ouvert.</Alert>
                    ) : (
                      <Table striped hover responsive>
                        <thead>
                          <tr>
                            <th>Titre</th>
                            <th>UEA</th>
                            <th>Date limite</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devoirs.map(d => (
                            <tr key={d.id}>
                              <td>{d.titre}</td>
                              <td>{d.uea?.nom || 'N/A'}</td>
                              <td>{new Date(d.date_limite).toLocaleDateString()}</td>
                              <td>
                                <Button size="sm" variant="primary">Soumettre</Button>
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

export default DashboardApprenant;