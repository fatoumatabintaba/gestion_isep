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
import LogoutButton from '../components/LogoutButton';

function DashboardResponsableMetier() {
  const [user, setUser] = useState(null);
  const [apprenants, setApprenants] = useState([]);
  const [metierId, setMetierId] = useState('');
  const [ueaList, setUeaList] = useState([]);
  const [selectedUea, setSelectedUea] = useState('');
  const [periode, setPeriode] = useState({ start: '', end: '' });
  const [stats, setStats] = useState(null);
  const [justificatifs, setJustificatifs] = useState([]);
  const [seances, setSeances] = useState([]);

  // Charger les données utilisateur et métiers
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
        setMetierId(res.data.metier_id); // On suppose que l'utilisateur a metier_id
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur");
      }
    };

    fetchUserData();
  }, []);

  // Charger la liste des UEA
  useEffect(() => {
    const fetchUea = async () => {
      try {
        const res = await api.get(`/api/uea?metier_id=${metierId}`);
        setUeaList(res.data);
      } catch (err) {
        console.error("Impossible de charger les UEA");
      }
    };
    if (metierId) fetchUea();
  }, [metierId]);

  // Charger les séances
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      window.location.href = '/login';
      return;
    }
    const fetchData = async () => {
      try {
        const res = await api.get('/api/seances/metier');
        setSeances(res.data);
      } catch (err) {
        // gestion erreur
      }
    };
    fetchData();
  }, []);

  // Fonction pour filtrer les apprenants, statistiques et justificatifs
  const handleFiltre = async () => {
    try {
      // Apprenants filtrés
      const res = await api.get(`/api/apprenants?metier_id=${metierId}&uea_id=${selectedUea}&start=${periode.start}&end=${periode.end}`);
      setApprenants(res.data);

      // Statistiques d'absentéisme
      const statRes = await api.get(`/api/statistiques_absences?metier_id=${metierId}&uea_id=${selectedUea}&start=${periode.start}&end=${periode.end}`);
      setStats(statRes.data);

      // Justificatifs
      const justRes = await api.get(`/api/justificatifs?metier_id=${metierId}&uea_id=${selectedUea}`);
      setJustificatifs(justRes.data);

    } catch (err) {
      console.error("Erreur lors du filtrage");
    }
  };

  // Notifier le chef de département
  const handleNotifierChef = async (justificatif) => {
    try {
      await api.post('/api/notifier_chef', { justificatif_id: justificatif.id });
      alert("Chef de département notifié");
    } catch (err) {
      console.error(err);
    }
  };

  // Envoyer un email
  const handleEnvoyerEmail = async (justificatif) => {
    try {
      await api.post('/api/envoyer_email', { justificatif_id: justificatif.id });
      alert("Email envoyé");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f7ff', minHeight: '100vh' }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>🎓 Dashboard Responsable Métier</Navbar.Brand>
          <Nav className="ms-auto">
            <span className="text-white me-3">👤 {user?.name}</span>
            <LogoutButton />
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Row>
          {/* Sidebar */}
          <Col md={3}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="text-primary">Actions</h5>
                <ul className="nav flex-column">
                  <li className="nav-item"><a href="#liste" className="nav-link">Liste Apprenants</a></li>
                  <li className="nav-item"><a href="#suivi" className="nav-link">Suivi Assiduité</a></li>
                  <li className="nav-item"><a href="#justificatifs" className="nav-link">Justificatifs</a></li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          {/* Contenu principal */}
          <Col md={9}>
            {/* Filtre */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-warning text-white">Filtres</Card.Header>
              <Card.Body>
                <Form className="d-flex gap-2 flex-wrap">
                  <Form.Select value={selectedUea} onChange={e => setSelectedUea(e.target.value)}>
                    <option value="">-- Choisir UEA --</option>
                    {ueaList.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                  </Form.Select>
                  <Form.Control 
                    type="date" 
                    value={periode.start} 
                    onChange={e => setPeriode({ ...periode, start: e.target.value })} 
                  />
                  <Form.Control 
                    type="date" 
                    value={periode.end} 
                    onChange={e => setPeriode({ ...periode, end: e.target.value })} 
                  />
                  <Button variant="primary" onClick={handleFiltre}>Filtrer</Button>
                </Form>
              </Card.Body>
            </Card>

            {/* Liste des apprenants */}
            <Row id="liste" className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Header className="bg-info text-white">
                    <h5>Liste des Apprenants ({apprenants.length})</h5>
                  </Card.Header>
                  <Card.Body>
                    {apprenants.length === 0 ? (
                      <Alert variant="secondary">Aucun apprenant trouvé.</Alert>
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

            {/* Statistiques */}
            {stats && (
              <Card className="mb-4 shadow-sm" id="suivi">
                <Card.Header className="bg-success text-white">Statistiques d’Absentéisme</Card.Header>
                <Card.Body>
                  <p>Total absences: {stats.total}</p>
                  <p>Taux moyen: {stats.taux}%</p>
                </Card.Body>
              </Card>
            )}

            {/* Justificatifs */}
            {justificatifs.length > 0 && (
              <Card className="mb-4 shadow-sm" id="justificatifs">
                <Card.Header className="bg-secondary text-white">Justificatifs</Card.Header>
                <Card.Body>
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Apprenant</th>
                        <th>Fichier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {justificatifs.map(j => (
                        <tr key={j.id}>
                          <td>{j.apprenant_name}</td>
                          <td><a href={j.url} target="_blank" rel="noreferrer">Télécharger</a></td>
                          <td>
                            <Button size="sm" variant="info" onClick={() => handleNotifierChef(j)}>Notifier Chef</Button>{' '}
                            <Button size="sm" variant="primary" onClick={() => handleEnvoyerEmail(j)}>Envoyer Email</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}

            {/* Séances */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-light text-dark">Séances Planifiées</Card.Header>
              <Card.Body>
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>UEA</th>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Enseignant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seances.map(s => (
                      <tr key={s.id}>
                        <td>{s.nom}</td>
                        <td>{s.uea_nom}</td>
                        <td>{s.date}</td>
                        <td>{s.heure_debut} - {s.heure_fin}</td>
                        <td>{s.enseignant?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default DashboardResponsableMetier;
