// src/pages/MarquerPresences.jsx
import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Alert } from 'react-bootstrap';
import api from '../services/api';

function MarquerPresences() {
  const [apprenants, setApprenants] = useState([]);
  const [seance, setSeance] = useState({
    date: new Date().toISOString().split('T')[0],
    uea_id: ''
  });
  const [presences, setPresences] = useState({});
  const [ueas, setUeas] = useState([]);

  // Charger les apprenants et les UEAs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resApprenants = await api.get('/api/apprenants');
        setApprenants(resApprenants.data);

        const resUeas = await api.get('/api/ueas');
        setUeas(resUeas.data);

        // Initialiser toutes les présences à "present"
        const init = {};
        resApprenants.data.forEach(a => init[a.id] = 'present');
        setPresences(init);
      } catch (err) {
        console.error("Erreur chargement données");
      }
    };
    fetchData();
  }, []);

  const handleChange = (id, statut) => {
    setPresences({ ...presences, [id]: statut });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.keys(presences).map(id => ({
      apprenant_id: id,
      statut: presences[id],
      date: seance.date,
      uea_id: seance.uea_id
    }));

    try {
      await api.post('/api/presences/multiple', data);
      alert('✅ Présences enregistrées avec succès !');
    } catch (err) {
      alert('❌ Erreur lors de l’enregistrement des présences');
    }
  };

  return (
    <Container className="mt-4">
      <h3>Marquer les Présences</h3>

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Date</Form.Label>
          <Form.Control
            type="date"
            value={seance.date}
            onChange={(e) => setSeance({ ...seance, date: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>UEA</Form.Label>
          <Form.Select
            value={seance.uea_id}
            onChange={(e) => setSeance({ ...seance, uea_id: e.target.value })}
            required
          >
            <option value="">Choisir une UEA</option>
            {ueas.map(uea => (
              <option key={uea.id} value={uea.id}>{uea.nom}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {apprenants.length === 0 ? (
          <Alert variant="warning">Aucun apprenant trouvé.</Alert>
        ) : (
          <Table striped hover responsive>
            <thead>
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

        <Button type="submit" variant="success">
          Enregistrer les présences
        </Button>
      </Form>
    </Container>
  );
}

export default MarquerPresences;