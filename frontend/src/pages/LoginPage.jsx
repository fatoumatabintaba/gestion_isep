// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Ajouter cette importation
import axios from 'axios';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ✅ Ajouter le hook navigate

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Fonction pour convertir metier_id en nom de métier
  const getMetierName = (metierId) => {
    const metiers = {
      1: 'dwm',    // ← DWM
      2: 'rt',     // ← RT  
      3: 'asri',   // ← ASRI
      // Ajoutez ici tous vos métiers avec leurs IDs
    };
    return metiers[metierId] || 'informatique'; // Fallback si ID non trouvé
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. CSRF
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

      // 2. Login
      const res = await axios.post('http://localhost:8000/api/login', formData, { withCredentials: true });
      const { user, token } = res.data;

      // 3. Vérifications strictes
      if (!token || !user || !user.role) {
        throw new Error("Données d'authentification manquantes ou invalides");
      }

      // ✅ CORRECTION : Vérifier metier_id au lieu de metier
      if (user.role === 'apprenant' && (!user.metier_id || !user.annee)) {
        throw new Error("Données utilisateur incomplètes : métier ou année manquant");
      }

      // 4. Sauvegarde
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // 5. Redirection sécurisée - ✅ CORRECTION ICI
      let redirectPath = '/';

      if (user.role === 'apprenant') {
        // ✅ CORRECTION : Utiliser metier_id pour obtenir le nom du métier
        const metierName = getMetierName(user.metier_id);
        const metierSlug = metierName.toLowerCase().replace(/\s+/g, '-');
        
        if (!metierSlug) throw new Error("Métier invalide");
        redirectPath = `/dashboard/apprenant/${metierSlug}/annee-${user.annee}`;
        // redirectPath = `/dashboard/apprenant/${metierSlug}/annee-${user.annee}?metier_id=${user.metier_id}&annee=${user.annee}`;
      } else if (user.role === 'enseignant') {
        redirectPath = '/dashboard/enseignant';
      } else if (user.role === 'coordinateur') {
        redirectPath = '/dashboard/coordinateur';
      } else if (user.role === 'chef_departement') {
        redirectPath = '/dashboard/chef';
      } else if (user.role === 'admin') {
        redirectPath = '/admin';
      }

      console.log('Redirection vers:', redirectPath); // Pour debug
      
      // ✅ CORRECTION : Utiliser navigate au lieu de window.location.href
      navigate(redirectPath, { replace: true });

    } catch (err) {
      console.error("Erreur de connexion détaillée:", err);
      
      // Gestion d'erreur améliorée
      if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (err.response?.status === 403) {
        setError("Compte en attente de validation par l'administrateur");
      } else {
        setError(err.message || "Identifiants incorrects");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
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

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🔐 Connexion</h2>

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

      <form onSubmit={handleSubmit}>
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          disabled={loading} 
          style={inputStyle} 
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Mot de passe" 
          value={formData.password} 
          onChange={handleChange} 
          required 
          disabled={loading} 
          style={inputStyle} 
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;