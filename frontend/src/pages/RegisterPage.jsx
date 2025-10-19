// src/pages/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    prenom: '',
    email: '',
    password: '',
    password_confirmation: '',
    metier_id: '',
    annee: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // 🔍 Nettoie les champs sensibles
    const trimmedEmail = form.email.trim();

    // 🚫 Validation côté client
    if (!form.name || !form.prenom || !trimmedEmail || !form.metier_id || !form.annee) {
      setError("Veuillez remplir tous les champs.");
      setLoading(false);
      return;
    }

    if (form.password !== form.password_confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setLoading(false);
      return;
    }

    try {
      // 🔐 Nettoie le localStorage
      localStorage.clear();

      // 🍪 1. Récupère le cookie CSRF
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', {
        withCredentials: true,
      });

      console.log('✅ Cookie CSRF récupéré');

      // 📤 2. Envoie la requête avec le rôle fixe (pas dans le state)
      const payload = {
        ...form,
        email: trimmedEmail,
        role: 'apprenant', // ✅ Forcé ici, pas exposé à l’utilisateur
      };

      const res = await axios.post('http://localhost:8000/api/register', payload, {
        withCredentials: true,
      });

      const { user, token } = res.data;

      if (!token || !user) {
        throw new Error("Données manquantes : token ou utilisateur non reçu");
      }

      // 💾 Sauvegarde
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // ✅ Succès
      setSuccess(`✅ Bienvenue, ${user.name} !`);

      // 🔁 Redirige vers login après 1.5s
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);

    } catch (err) {
      console.error("Erreur d'inscription :", err);

      // Gestion fine des erreurs
      const message =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})
          .flat()
          .join(', ') ||
        'Erreur réseau. Vérifiez votre connexion.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📝 Inscription Apprenant</h2>

      {error && (
        <div style={{
          color: '#721c24',
          backgroundColor: '#f8d7da',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          color: '#155724',
          backgroundColor: '#d4edda',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #c3e6cb',
          marginBottom: '15px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nom complet"
          value={form.name}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        />

        <input
          name="prenom"
          placeholder="Prénom"
          value={form.prenom}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        />

        <input
          name="password"
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        />

        <input
          name="password_confirmation"
          type="password"
          placeholder="Confirmer mot de passe"
          value={form.password_confirmation}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        />

        <select
          name="metier_id"
          value={form.metier_id}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        >
          <option value="">Sélectionner un métier</option>
          <option value="1">Développement Web & Mobile</option>
          <option value="2">Réseaux & Télécom</option>
          <option value="3">Administration Système & Réseau</option>
        </select>

        <select
          name="annee"
          value={form.annee}
          onChange={handleChange}
          required
          disabled={loading}
          style={inputStyle}
        >
          <option value="">Sélectionner une année</option>
          <option value="1">1ère année</option>
          <option value="2">2ème année</option>
        </select>

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>
      </form>
    </div>
  );
}

// Styles
const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  margin: '10px 0',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
  backgroundColor: 'white'
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '16px',
  cursor: 'pointer',
  marginTop: '15px',
  fontWeight: '600'
};

export default RegisterPage;