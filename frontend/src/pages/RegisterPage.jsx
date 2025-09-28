// src/pages/RegisterPage.js
import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/register', formData);
            alert('Inscription réussie ! Connectez-vous.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur réseau');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Inscription</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input placeholder="Nom" name="name" onChange={handleChange} required /><br/>
                <input placeholder="Email" name="email" type="email" onChange={handleChange} required /><br/>
                <input placeholder="Mot de passe" name="password" type="password" onChange={handleChange} required /><br/>
                <input placeholder="Confirmer mot de passe" name="password_confirmation" type="password" onChange={handleChange} required /><br/>
                <select name="role" onChange={handleChange} required>
                    <option value="">Choisir un rôle</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="apprenant">Apprenant</option>
                </select><br/><br/>
                <button type="submit">S'inscrire</button>
            </form>
            <p>Déjà inscrit ? <a href="/login">Se connecter</a></p>
        </div>
    );
}

export default RegisterPage;