// src/pages/MetierPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Alert } from 'react-bootstrap';
import api from '../services/api';

function MetierPage({ metierId, metierNom }) {
  const [apprenants, setApprenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprenants = async () => {
      try {
        const res = await api.get(`/api/apprenants?metier_id=${metierId}`);
        setApprenants(res.data);
      } catch (err) {
        console.error("Impossible de charger les apprenants");
      } finally {
        setLoading(false);
      }
    };
    fetchApprenants();
  }, [metierId]);

  return (
    <Container className="mt-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-info text-white">
          <h4>{metierNom}</h4>
        </Card.Header>
        <Card.Body>
          <h5>Liste des apprenants</h5>
          {loading ? (
            <p>Chargement...</p>
          ) : apprenants.length === 0 ? (
            <Alert variant="info">Aucun apprenant inscrit dans ce métier.</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Matricule</th>
                </tr>
              </thead>
              <tbody>
                {apprenants.map(a => (
                  <tr key={a.id}>
                    <td>{a.user?.name}</td>
                    <td>{a.user?.email}</td>
                    <td>{a.matricule}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default MetierPage;