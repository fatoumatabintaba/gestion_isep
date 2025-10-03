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
  Alert
} from 'react-bootstrap';
import api from '../services/api';

function DashboardCoordinateur() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [absences, setAbsences] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return (window.location.href = '/login');

    const fetchUserData = async () => {
      try {
        const res = await api.get('/user');
        if (res.data.role !== 'coordinateur') {
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
        const res = await api.get('/api/devoirs?valide=non');
        setDevoirs(res.data);
      } catch (err) {
        console.error("Échec chargement devoirs");
      }
    };

    const fetchAbsences = async () => {
      try {
        const res = await api.get('/api/absences?alerte=frequence');
        setAbsences(res.data);
      } catch (err) {
        console.error("Échec chargement absences");
      }
    };

    fetchUserData();
    fetchDevoirs();
    fetchAbsences();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>📋 Dashboard Coordinateur</Navbar.Brand>
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
                  <li className="nav-item"><a href="#validation" className="nav-link">Valider Devoirs</a></li>
                  <li className="nav-item"><a href="#absences" className="nav-link">Suivi Absences</a></li>
                  <li className="nav-item"><a href="#rapports" className="nav-link">Rapports</a></li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Row id="absences" className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-danger text-white">
                    <h5>Absences fréquentes</h5>
                  </Card.Header>
                  <Card.Body>
                    {absences.length === 0 ? (
                      <Alert variant="info">Aucune absence critique.</Alert>
                    ) : (
                      <Table striped hover responsive>
                        <thead>
                          <tr>
                            <th>Apprenant</th>
                            <th>Métier</th>
                            <th>Nb Absences</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {absences.map(a => (
                            <tr key={a.id}>
                              <td>{a.apprenant?.user?.name}</td>
                              <td>{a.apprenant?.metier?.nom}</td>
                              <td>{a.nb_absences}</td>
                              <td>
                                <Button size="sm" variant="warning">Contacter</Button>
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

export default DashboardCoordinateur;