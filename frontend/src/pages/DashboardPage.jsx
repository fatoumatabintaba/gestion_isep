// src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import api from '../services/api';

function DashboardPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/user'); // Tu dois créer cet endpoint
                setUser(res.data);
            } catch (err) {
                console.error("Impossible de charger l'utilisateur");
            }
        };
        fetchUser();
    }, []);

    if (!user) return <p>Chargement...</p>;

    return (
        <div>
            <h1>Bienvenue, {user.name}</h1>
            <p>Rôle : {user.role}</p>
            <button onClick={() => {
                api.post('/logout');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }}>
                Déconnexion
            </button>
        </div>
    );
}

export default DashboardPage;