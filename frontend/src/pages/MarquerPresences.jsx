// src/pages/MarquerPresences.jsx
import React, { useState, useEffect } from 'react';
import { Container, Form, Table, Button, Alert, Card } from 'react-bootstrap';
import api from '../services/api';

function MarquerPresences() {
  const [metiers, setMetiers] = useState([]);
  const [ueas, setUeas] = useState([]);
  const [apprenants, setApprenants] = useState([]);

  const [selected, setSelected] = useState({
    metier_id: '',
    uea_id: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [presences, setPresences] = useState({});

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resMetiers = await api.get('/api/metiers');
        const resUeas = await api.get('/api/ueas');
        setMetiers(resMetiers.data);
        setUeas(resUeas.data);
      } catch (err) {
        console.error("Erreur chargement");
      }
    };
    fetchData();
  }, []);

  // Charger les apprenants du métier sélectionné
  const handleMetierChange = async (metierId) => {
    setSelected({ ...selected, metier_id: metierId });
    try {
      const res = await api.get(`/api/apprenants?metier_id=${metierId}`);
      setApprenants(res.data);

      const init = {};
      res.data.forEach(a => init[a.id] = 'present');
      setPresences(init);
    } catch (err) {
      alert("Impossible de charger les apprenants");
    }
  };

  const handleChange = (id, statut) => {
    setPresences({ ...presences, [id]: statut });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.keys(presences).map(id => ({
      apprenant_id: id,
      statut: presences[id],
      date: selected.date,
      uea_id: selected.uea_id
    }));

    try {
      await api.post('/api/presences/multiple', data);
      alert('✅ Présences enregistrées pour tous les apprenants.');
    } catch (err) {
      alert('❌ Erreur lors de l’enregistrement.');
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h5>Marquer les Présences</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Sélection du métier */}
            <Form.Group className="mb-3">
              <Form.Label>Métier</Form.Label>
              <Form.Select
                value={selected.metier_id}
                onChange={(e) => handleMetierChange(e.target.value)}
                required
              >
                <option value="">Sélectionner un métier</option>
                {metiers.map(m => (
                  <option key={m.id} value={m.id}>{m.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Sélection de la UEA */}
            <Form.Group className="mb-3">
              <Form.Label>UEA</Form.Label>
              <Form.Select
                value={selected.uea_id}
                onChange={(e) => setSelected({ ...selected, uea_id: e.target.value })}
                required
              >
                <option value="">Choisir une UEA</option>
                {ueas.map(u => (
                  <option key={u.id} value={u.id}>{u.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Date */}
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={selected.date}
                onChange={(e) => setSelected({ ...selected, date: e.target.value })}
                required
              />
            </Form.Group>

            {/* Liste des apprenants */}
            {apprenants.length === 0 ? (
              <Alert variant="secondary">Sélectionnez un métier pour voir les apprenants.</Alert>
            ) : (
              <Table striped hover responsive className="mt-4">
                <thead className="bg-light">
                  <tr>
                    <th>Nom</th>
                    <th>Présent</th>
                    <th>Absent</th>
                    <th>Retard</th>
                    <th>Demi-journée</th>
                  </tr>
                </thead>
                <tbody>
                  {apprenants.map(a => (
                    <tr key={a.id}>
                      <td>{a.user?.name}</td>
                      <td>
                        <Form.Check
                          type="radio"
                          checked={presences[a.id] === 'present'}
                          onChange={() => handleChange(a.id, 'present')}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="radio"
                          checked={presences[a.id] === 'absent'}
                          onChange={() => handleChange(a.id, 'absent')}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="radio"
                          checked={presences[a.id] === 'retard'}
                          onChange={() => handleChange(a.id, 'retard')}
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="radio"
                          checked={presences[a.id] === 'demi'}
                          onChange={() => handleChange(a.id, 'demi')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}

            <Button type="submit" variant="success" disabled={!selected.metier_id || !selected.uea_id}>
              Enregistrer les présences
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default MarquerPresences;