import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'apprenant',
    metier_id: '',
    annee: '', // Nouveau champ année
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register', formData);
      alert('✅ Inscription réussie ! Vous pouvez maintenant vous connecter.');
      window.location.href = '/login';
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur lors de l’inscription.'
      );
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4 text-center">Inscription</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nom complet</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Confirmer le mot de passe</Form.Label>
          <Form.Control
            type="password"
            name="password_confirmation"
            value={formData.password_confirmation}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Sélection du métier */}
        <Form.Group className="mb-3">
          <Form.Label>Votre Métier</Form.Label>
          <Form.Select
            name="metier_id"
            value={formData.metier_id}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un métier</option>
            <option value="1">Développement Web & Mobile</option>
            <option value="2">Réseaux & Télécom</option>
            <option value="3">Administration Système & Réseau</option>
          </Form.Select>
        </Form.Group>

        {/* Sélection de l'année */}
        <Form.Group className="mb-3">
          <Form.Label>Année</Form.Label>
          <Form.Select
            name="annee"
            value={formData.annee}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner une année</option>
            <option value="1">1ère année</option>
            <option value="2">2ème année</option>
          </Form.Select>
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          S'inscrire
        </Button>
      </Form>
    </Container>
  );
}

export default RegisterPage;
