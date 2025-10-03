import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  // Fonction pour transformer le nom métier en slug URL-friendly
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')                   // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '')   // Enlève les accents
      .replace(/\s+/g, '-')              // Remplace espaces par tirets
      .replace(/[^\w\-]+/g, '')          // Enlève caractères non alphanumériques
      .replace(/\-\-+/g, '-')            // Remplace tirets multiples par un seul
      .replace(/^-+/, '')                // Enlève tirets au début
      .replace(/-+$/, '');               // Enlève tirets à la fin
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Obtenir le token CSRF si nécessaire (Laravel Sanctum)
      await api.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

      // Envoyer la requête login
      const response = await api.post('/login', formData, { withCredentials: true });

      const { user, token } = response.data;

      // Sauvegarder token et utilisateur
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'apprenant') {
        // Normaliser le nom du métier pour la route
        const metierSlug = slugify(user.metier || '');

        // Redirection dynamique selon métier et année
        window.location.href = `/dashboard/apprenant/${metierSlug}/annee-${user.annee}`;
      } else {
        // Redirection pour autres rôles (à adapter)
        const fallback = {
          enseignant: '/dashboard/enseignant',
          coordinateur: '/dashboard/coordinateur',
          assistant: '/dashboard/assistant',
          chef_departement: '/dashboard/chef', //
          admin: '/dashboard/admin',
        };
        window.location.href = fallback[user.role] || '/';
      }

    } catch (err) {
      setError('Erreur de connexion. Vérifiez vos identifiants.');
      console.error(err.response ? err.response.data : err);
    }
  };

  return (
    <Container
      className="mt-5 p-4"
      style={{
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        borderRadius: '10px',
        backgroundColor: '#fff',
      }}
    >
      <h2 className="mb-4 text-center" style={{ fontWeight: '700', color: '#007bff' }}>
        Connexion
      </h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit} noValidate>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            placeholder="Entrez votre email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="username"
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="formPassword">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100"
          style={{
            padding: '10px',
            fontWeight: '600',
            fontSize: '1.1rem',
            transition: 'background-color 0.3s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#007bff'}
        >
          Se connecter
        </Button>
      </Form>
    </Container>
  );
}

export default LoginPage;
