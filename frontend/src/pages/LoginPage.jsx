// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Récupérer le CSRF token
      await api.get('/sanctum/csrf-cookie');

      // 2. Envoyer les identifiants
      const response = await api.post('/login', formData);

      // 3. Sauvegarder le token et l'utilisateur
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const user = response.data.user;

      // 4. 🔑 REDIRECTION SELON LE RÔLE
      if (user.role === 'enseignant') {
        window.location.href = '/dashboard/enseignant';
      } else if (user.role === 'apprenant') {
        window.location.href = '/dashboard/apprenant';
      } else if (user.role === 'coordinateur') {
        window.location.href = '/dashboard/coordinateur';
      } else {
        // Autre rôle ou erreur
        window.location.href = '/';
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Erreur de connexion. Vérifiez vos identifiants.'
      );
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '400px' }}>
      <h2 className="mb-4 text-center">Connexion</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
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

        <Button variant="primary" type="submit" className="w-100">
          Se connecter
        </Button>
      </Form>
    </Container>
  );
}

export default LoginPage;