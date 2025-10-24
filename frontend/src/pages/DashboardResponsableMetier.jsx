// src/pages/DashboardResponsableMetier.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Navbar,
  Nav,
  Form,
  Alert,
  Badge,
  Modal,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LogoutButton from '../components/LogoutButton';

function DashboardResponsableMetier() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [apprenants, setApprenants] = useState([]);
  const [metierUtilisateur, setMetierUtilisateur] = useState(null);
  const [anneeUtilisateur, setAnneeUtilisateur] = useState(null);
  const [ueaList, setUeaList] = useState([]);
  const [selectedUea, setSelectedUea] = useState('');
  const [periode, setPeriode] = useState({ start: '', end: '' });
  const [stats, setStats] = useState(null);
  const [justificatifs, setJustificatifs] = useState([]);
  const [activeSection, setActiveSection] = useState('tableaux');
  const [showJustificatifModal, setShowJustificatifModal] = useState(false);
  const [selectedJustificatif, setSelectedJustificatif] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anneeFiltre, setAnneeFiltre] = useState('toutes');
  const [rapportEnvoye, setRapportEnvoye] = useState(false);

  // ✅ DÉTECTION MÉTIER ET ANNÉE
  const determinerMetierEtAnneeUtilisateur = (user) => {
    if (!user) return { metier: null, annee: null };
    
    let metierDetecte = null;
    let anneeDetectee = null;

    if (user.metier_id) {
      const metiersMapping = {
        1: { id: 1, nom: 'DWM - Développement Web & Mobile', code: 'DWM' },
        2: { id: 2, nom: 'RT - Réseaux & Télécom', code: 'RT' },
        3: { id: 3, nom: 'ASRI - Administration Système & Réseau', code: 'ASRI' }
      };
      metierDetecte = metiersMapping[user.metier_id];
    }

    if (user.annee) {
      const anneeMapping = {
        '1': '1ère Année',
        '2': '2ème Année', 
        '1ere': '1ère Année',
        '2eme': '2ème Année'
      };
      const anneeCle = user.annee.toString().toLowerCase();
      anneeDetectee = anneeMapping[anneeCle] || `Année ${user.annee}`;
    }
    
    return { metier: metierDetecte, annee: anneeDetectee };
  };

  // ✅ CHARGEMENT UTILISATEUR
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      window.location.href = '/login';
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      
      const isResponsable = (user) => {
        return user.role === 'responsable_metier' || user.role?.includes('responsable_metier');
      };

      if (!isResponsable(userData)) {
        alert("Accès réservé aux responsables métier");
        window.location.href = '/dashboard/enseignant';
        return;
      }
      
      const { metier, annee } = determinerMetierEtAnneeUtilisateur(userData);
      
      if (!metier) {
        const metierChoix = window.prompt(
          "Impossible de détecter votre métier automatiquement.\n\n" +
          "Veuillez sélectionner votre métier :\n" +
          "1 - DWM (Développement Web & Mobile)\n" +
          "2 - RT (Réseaux & Télécom)\n" +
          "3 - ASRI (Administration Système & Réseau)\n\n" +
          "Entrez 1, 2 ou 3:"
        );
        
        let metierSelectionne = null;
        if (metierChoix === '1') {
          metierSelectionne = { id: 1, nom: 'DWM - Développement Web & Mobile', code: 'DWM' };
        } else if (metierChoix === '2') {
          metierSelectionne = { id: 2, nom: 'RT - Réseaux & Télécom', code: 'RT' };
        } else if (metierChoix === '3') {
          metierSelectionne = { id: 3, nom: 'ASRI - Administration Système & Réseau', code: 'ASRI' };
        } else {
          alert("Métier non reconnu. Redirection...");
          window.location.href = '/dashboard/enseignant';
          return;
        }
        
        setMetierUtilisateur(metierSelectionne);
      } else {
        setMetierUtilisateur(metier);
      }

      setAnneeUtilisateur(annee);
      setUser(userData);
      
    } catch (err) {
      console.error("Erreur:", err);
      window.location.href = '/login';
    }
  }, []);

  // ✅ CHARGEMENT DES DONNÉES - VERSION CORRIGÉE AVEC ROUTES EXISTANTES
  const fetchDataReelles = async () => {
    if (!metierUtilisateur || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 Chargement des données pour métier:", metierUtilisateur.id);
      
      // 🎯 UTILISATION DES ROUTES QUI EXISTENT DANS VOTRE API
      const [apprenantsRes, ueaRes, justificatifsRes] = await Promise.all([
        api.get(`/api/apprenants/metier/${metierUtilisateur.id}`),
        api.get(`/api/uea/metier/${metierUtilisateur.id}`),
        api.get(`/api/justificatifs/en-attente?metier_id=${metierUtilisateur.id}`)
      ]);

      // Extraction des données
      const apprenantsData = apprenantsRes.data?.data || apprenantsRes.data || [];
      const ueaData = ueaRes.data?.data || ueaRes.data || [];
      const justificatifsData = justificatifsRes.data?.data || justificatifsRes.data || [];

      console.log("✅ Données chargées avec routes existantes:", {
        apprenants: apprenantsData.length,
        uea: ueaData.length,
        justificatifs: justificatifsData.length
      });

      setApprenants(apprenantsData);
      setUeaList(ueaData);
      setJustificatifs(justificatifsData);
      
      // ✅ CALCUL DES STATS AMÉLIORÉ
      const totalApprenants = apprenantsData.length;
      const totalAbsences = apprenantsData.reduce((sum, app) => sum + (app.nb_absences || 0), 0);
      const apprenantsAvecAbsences = apprenantsData.filter(app => (app.nb_absences || 0) > 0).length;
      const tauxMoyen = totalApprenants > 0 ? Math.round((totalAbsences / totalApprenants) * 100) / 100 : 0;

      // Répartition par année
      const apprenantsAnnee1 = apprenantsData.filter(app => app.annee == '1');
      const apprenantsAnnee2 = apprenantsData.filter(app => app.annee == '2');

      setStats({
        taux_absence_moyen: tauxMoyen,
        total_absences: totalAbsences,
        apprenants_concernes: apprenantsAvecAbsences,
        justificatifs_en_attente: justificatifsData.length,
        total_apprenants: totalApprenants,
        total_uea: ueaData.length,
        
        // Nouvelles stats
        apprenants_annee1: apprenantsAnnee1.length,
        apprenants_annee2: apprenantsAnnee2.length,
        absences_annee1: apprenantsAnnee1.reduce((sum, app) => sum + (app.nb_absences || 0), 0),
        absences_annee2: apprenantsAnnee2.reduce((sum, app) => sum + (app.nb_absences || 0), 0),
        
        // Taux
        taux_absences_annee1: apprenantsAnnee1.length > 0 
          ? Math.round((apprenantsAnnee1.filter(app => (app.nb_absences || 0) > 0).length / apprenantsAnnee1.length) * 100)
          : 0,
        taux_absences_annee2: apprenantsAnnee2.length > 0 
          ? Math.round((apprenantsAnnee2.filter(app => (app.nb_absences || 0) > 0).length / apprenantsAnnee2.length) * 100)
          : 0,
      });
      
    } catch (err) {
      console.error("❌ Erreur chargement données:", err);
      
      if (err.response?.status === 404) {
        setError(`Route API introuvable. Vérifiez que les contrôleurs existent. Détails: ${err.config?.url}`);
      } else if (err.response?.status === 500) {
        setError(`Erreur serveur Laravel: ${err.response?.data?.message || err.response?.data?.error || 'Erreur interne'}`);
      } else if (err.code === 'ERR_NETWORK') {
        setError("Impossible de se connecter au serveur. Vérifiez que Laravel tourne sur le port 8000.");
      } else {
        setError(`Erreur: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataReelles();
  }, [metierUtilisateur, user, anneeFiltre]);

  // ✅ FILTRES PAR ANNÉE
  const getApprenantsFiltres = () => {
    if (anneeFiltre === 'toutes') return apprenants;
    return apprenants.filter(app => app.annee == anneeFiltre);
  };

  const getJustificatifsFiltres = () => {
    if (anneeFiltre === 'toutes') return justificatifs;
    return justificatifs.filter(j => {
      const apprenant = apprenants.find(app => app.id === j.apprenant_id);
      return apprenant && apprenant.annee == anneeFiltre;
    });
  };

  // ✅ ACTIONS
  const handleFiltre = async () => {
    try {
      setActionLoading(true);
      
      const params = {
        metier_id: metierUtilisateur.id,
        uea_id: selectedUea || undefined,
        periode_start: periode.start || undefined,
        periode_end: periode.end || undefined,
        annee: anneeFiltre !== 'toutes' ? anneeFiltre : undefined
      };

      const [apprenantsResponse] = await Promise.all([
        api.get('/api/apprenants', { params })
      ]);

      const tousApprenants = apprenantsResponse.data?.data || apprenantsResponse.data || [];
      const apprenantsMetier = tousApprenants.filter(app => app.metier_id == metierUtilisateur.id);
      
      setApprenants(apprenantsMetier);
      console.log("✅ Filtres appliqués");
      
    } catch (err) {
      console.error("Erreur filtre:", err);
      alert("Erreur lors de l'application du filtre");
    } finally {
      setActionLoading(false);
    }
  };

  // ✅ FONCTION POUR MODIFIER LE STATUT
  const handleModifierStatut = async (justificatifId, nouveauStatut) => {
    try {
      setActionLoading(true);
      await api.put(`/api/justificatifs/${justificatifId}/statut`, {
        statut: nouveauStatut
      });
      
      // Mettre à jour l'état local
      setJustificatifs(prev => prev.map(j => 
        j.id === justificatifId ? { ...j, statut: nouveauStatut } : j
      ));
      
      alert(`Justificatif ${nouveauStatut === 'en_attente' ? 'remis en attente' : nouveauStatut} avec succès!`);
    } catch (err) {
      console.error("Erreur modification statut:", err);
      alert("Erreur lors de la modification du statut");
    } finally {
      setActionLoading(false);
    }
  };

  const handleValiderJustificatif = async (justificatifId) => {
    try {
      setActionLoading(true);
      await api.put(`/api/justificatifs/${justificatifId}/valider`);
      
      // ✅ CORRECTION : Mettre à jour le statut au lieu de supprimer
      setJustificatifs(prev => prev.map(j => 
        j.id === justificatifId ? { ...j, statut: 'valide' } : j
      ));
      
      alert("Justificatif validé avec succès!");
    } catch (err) {
      console.error("Erreur validation:", err);
      alert("Erreur lors de la validation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeterJustificatif = async (justificatifId) => {
    try {
      setActionLoading(true);
      await api.put(`/api/justificatifs/${justificatifId}/rejeter`);
      
      // ✅ CORRECTION : Mettre à jour le statut au lieu de supprimer
      setJustificatifs(prev => prev.map(j => 
        j.id === justificatifId ? { ...j, statut: 'rejete' } : j
      ));
      
      alert("Justificatif rejeté!");
    } catch (err) {
      console.error("Erreur rejet:", err);
      alert("Erreur lors du rejet");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoirJustificatif = async (justificatif) => {
    try {
      setSelectedJustificatif(justificatif);
      const response = await api.get(`/api/justificatifs/${justificatif.id}`);
      setSelectedJustificatif(response.data?.data || response.data);
      setShowJustificatifModal(true);
    } catch (err) {
      console.error("Erreur chargement détail:", err);
      setShowJustificatifModal(true);
    }
  };

  // ✅ NOUVELLE FONCTION : Envoyer le rapport au Chef de Département
  const handleEnvoyerRapportChefDepartement = async () => {
    try {
      setActionLoading(true);

      // Préparer les données du rapport
      const rapportData = {
        metier: metierUtilisateur.nom,
        code_metier: metierUtilisateur.code,
        coordinateur: user?.name || 'Coordinateur Métier',
        date_soumission: new Date().toLocaleDateString(),
        periode: periode.start && periode.end ? `${periode.start} à ${periode.end}` : 'Période non spécifiée',
        statistiques: {
          total_apprenants: stats?.total_apprenants || 0,
          taux_absence_moyen: stats?.taux_absence_moyen || 0,
          total_absences: stats?.total_absences || 0,
          apprenants_avec_absences: stats?.apprenants_concernes || 0,
          justificatifs_en_attente: stats?.justificatifs_en_attente || 0,
          uea_actives: stats?.total_uea || 0,
          repartition_annee: {
            annee1: stats?.apprenants_annee1 || 0,
            annee2: stats?.apprenants_annee2 || 0
          }
        },
        justificatifs_traites: justificatifs.filter(j => j.statut !== 'en_attente').length,
        filtres_appliques: {
          annee: anneeFiltre,
          uea: selectedUea,
          periode: periode
        }
      };

      // Envoyer le rapport à l'API
      const response = await api.post('/api/rapports/chef-departement', rapportData);
      
      if (response.status === 200 || response.status === 201) {
        setRapportEnvoye(true);
        alert(`✅ Rapport envoyé au Chef de Département avec succès !\n\n` +
              `📊 Métier: ${metierUtilisateur.nom}\n` +
              `👥 Apprenants: ${rapportData.statistiques.total_apprenants}\n` +
              `📈 Taux d'absence: ${rapportData.statistiques.taux_absence_moyen}%\n` +
              `📋 Justificatifs traités: ${rapportData.justificatifs_traites}`);
      }
      
    } catch (err) {
      console.error("❌ Erreur envoi rapport:", err);
      alert("Erreur lors de l'envoi du rapport au Chef de Département");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackToEnseignant = () => {
    navigate('/dashboard/enseignant');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-primary">Chargement des données {metierUtilisateur?.code}...</p>
        </div>
      </div>
    );
  }

  if (!metierUtilisateur) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Alert variant="danger">
          <h4>❌ Impossible de déterminer votre métier</h4>
          <Button onClick={handleBackToEnseignant}>Retour au Dashboard Enseignant</Button>
        </Alert>
      </div>
    );
  }

  // ✅ CALCULS
  const apprenantsFiltres = getApprenantsFiltres();
  const justificatifsFiltres = getJustificatifsFiltres();
  const totalApprenants = apprenantsFiltres.length;
  const totalJustificatifs = justificatifsFiltres.length;
  const tauxAbsenceMoyen = stats?.taux_absence_moyen || 0;
  const totalUEA = ueaList.length;
  const totalApprenantsGlobal = stats?.total_apprenants || totalApprenants;

  return (
    <div style={{ backgroundColor: '#f8fbff', minHeight: '100vh' }}>
      {/* NAVIGATION */}
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand className="fw-bold">
            🎯 Dashboard {metierUtilisateur.nom}
            {anneeUtilisateur && <Badge bg="light" text="dark" className="ms-2">{anneeUtilisateur}</Badge>}
            {rapportEnvoye && <Badge bg="success" className="ms-2">📊 Rapport Envoyé</Badge>}
          </Navbar.Brand>
          <Nav className="ms-auto">
            <Button variant="outline-light" className="me-2" onClick={handleBackToEnseignant}>
              📚 Retour Enseignant
            </Button>
            <span className="text-white me-3">👤 {user?.name}</span>
            <LogoutButton />
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        {error && (
          <Alert variant="danger">
            <strong>❌ Erreur API</strong>
            <br />
            {error}
            <br />
            <small className="text-muted">
              Routes appelées: 
              <br />- /api/apprenants/metier/{metierUtilisateur.id}
              <br />- /api/uea/metier/{metierUtilisateur.id}
              <br />- /api/justificatifs/en-attente?metier_id={metierUtilisateur.id}
            </small>
          </Alert>
        )}

        <Row>
          {/* SIDEBAR */}
          <Col lg={3} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header><h5 className="text-primary mb-0">📊 Navigation</h5></Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {['tableaux', 'statistiques', 'justificatifs', 'rapports'].map((section) => (
                    <button
                      key={section}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${
                        activeSection === section ? 'active bg-primary text-white' : ''
                      }`}
                      onClick={() => setActiveSection(section)}
                    >
                      <span className="me-3">
                        {section === 'tableaux' && '📈'}
                        {section === 'statistiques' && '📊'}
                        {section === 'justificatifs' && '📋'}
                        {section === 'rapports' && '📨'}
                      </span>
                      {section === 'tableaux' && 'Tableau de Bord'}
                      {section === 'statistiques' && 'Statistiques'}
                      {section === 'justificatifs' && 'Justificatifs'}
                      {section === 'rapports' && 'Rapports'}
                      {section === 'justificatifs' && totalJustificatifs > 0 && (
                        <Badge bg="danger" className="ms-auto">
                          {totalJustificatifs}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>

            {/* FILTRES */}
            <Card className="shadow-sm mt-4">
              <Card.Header><h6 className="text-primary mb-0">🔍 Filtres</h6></Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Année</Form.Label>
                  <Form.Select value={anneeFiltre} onChange={(e) => setAnneeFiltre(e.target.value)}>
                    <option value="toutes">Toutes les années</option>
                    <option value="1">1ère Année</option>
                    <option value="2">2ème Année</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>UEA</Form.Label>
                  <Form.Select value={selectedUea} onChange={(e) => setSelectedUea(e.target.value)}>
                    <option value="">Toutes les UEA</option>
                    {ueaList.map(uea => (
                      <option key={uea.id} value={uea.id}>{uea.nom}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Période début</Form.Label>
                  <Form.Control
                    type="date"
                    value={periode.start}
                    onChange={(e) => setPeriode(prev => ({ ...prev, start: e.target.value }))}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Période fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={periode.end}
                    onChange={(e) => setPeriode(prev => ({ ...prev, end: e.target.value }))}
                  />
                </Form.Group>

                <Button variant="primary" onClick={handleFiltre} disabled={actionLoading} className="w-100">
                  {actionLoading ? 'Application...' : '🔍 Appliquer Filtres'}
                </Button>
              </Card.Body>
            </Card>

            {/* BOUTON ENVOYER RAPPORT */}
            <Card className="shadow-sm mt-4 border-success">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">📤 Envoyer Rapport</h6>
              </Card.Header>
              <Card.Body>
                <p className="small text-muted mb-3">
                  Envoyez les statistiques consolidées au Chef de Département
                </p>
                <Button 
                  variant={rapportEnvoye ? "outline-success" : "success"}
                  onClick={handleEnvoyerRapportChefDepartement}
                  disabled={actionLoading || rapportEnvoye}
                  className="w-100"
                >
                  {actionLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Envoi en cours...
                    </>
                  ) : rapportEnvoye ? (
                    <>✅ Rapport Envoyé</>
                  ) : (
                    <>📊 Envoyer au Chef Département</>
                  )}
                </Button>
                {rapportEnvoye && (
                  <div className="mt-2 text-center">
                    <small className="text-success">
                      ✔️ Rapport envoyé le {new Date().toLocaleDateString()}
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* CONTENU PRINCIPAL */}
          <Col lg={9}>
            {/* SECTION TABLEAU DE BORD */}
            {activeSection === 'tableaux' && (
              <Row className="g-4">
                <Col md={12}>
                  <Card className="shadow-sm">
                    <Card.Body className="text-center p-5">
                      <h3 className="text-primary mb-3">
                        Bienvenue Responsable {metierUtilisateur.code}
                      </h3>
                      <p className="text-muted">
                        Gestion du métier <strong>{metierUtilisateur.nom}</strong>
                        {anneeFiltre !== 'toutes' && ` - ${anneeFiltre}ère Année`}
                      </p>
                      
                      <Row className="g-3 mt-4">
                        <Col md={3}>
                          <Card className="border-0 bg-primary text-white">
                            <Card.Body>
                              <h4>{totalApprenantsGlobal}</h4>
                              <small>Total Apprenants</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="border-0 bg-success text-white">
                            <Card.Body>
                              <h4>{totalUEA}</h4>
                              <small>UEA Actives</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="border-0 bg-warning text-white">
                            <Card.Body>
                              <h4>{tauxAbsenceMoyen}%</h4>
                              <small>Taux Absence</small>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="border-0 bg-info text-white">
                            <Card.Body>
                              <h4>{totalJustificatifs}</h4>
                              <small>Justificatifs en Attente</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* BOUTON RAPPORT EN HAUT */}
                      {!rapportEnvoye && (
                        <div className="mt-4">
                          <Button 
                            variant="success" 
                            size="lg"
                            onClick={handleEnvoyerRapportChefDepartement}
                            disabled={actionLoading}
                          >
                            📤 Envoyer Rapport au Chef Département
                          </Button>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* LISTE DES APPRENANTS */}
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="text-primary mb-0">👥 Apprenants ({totalApprenants})</h5>
                    </Card.Header>
                    <Card.Body>
                      {apprenantsFiltres.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <Table responsive hover>
                            <thead>
                              <tr>
                                <th>Nom</th>
                                <th>Email</th>
                                <th>Année</th>
                                <th>Statut</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apprenantsFiltres.map(apprenant => (
                                <tr key={apprenant.id}>
                                  <td>{apprenant.name}</td>
                                  <td><small>{apprenant.email}</small></td>
                                  <td>
                                    <Badge bg={apprenant.annee == '1' ? 'primary' : 'success'}>
                                      {apprenant.annee}ère Année
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={apprenant.statut === 'actif' ? 'success' : 'secondary'}>
                                      {apprenant.statut || 'actif'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <p>Aucun apprenant trouvé pour ce métier</p>
                          <small>Vérifiez que les apprenants ont bien un metier_id={metierUtilisateur.id}</small>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* JUSTIFICATIFS */}
                <Col md={6}>
                  <Card className="shadow-sm">
                    <Card.Header>
                      <h5 className="text-primary mb-0">
                        📋 Justificatifs en Attente ({totalJustificatifs})
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {justificatifsFiltres.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          {justificatifsFiltres.map(justificatif => (
                            <Card key={justificatif.id} className="mb-3">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6>{justificatif.apprenant_nom || 'Apprenant'}</h6>
                                    <p className="text-muted small mb-1">
                                      {justificatif.date_absence} • {justificatif.type}
                                    </p>
                                    <p className="small mb-2">{justificatif.motif}</p>
                                    <Button 
                                      variant="link" 
                                      size="sm" 
                                      className="p-0"
                                      onClick={() => handleVoirJustificatif(justificatif)}
                                    >
                                      📄 Voir détails
                                    </Button>
                                  </div>
                                  <div className="d-flex gap-1">
                                    <Button 
                                      size="sm" 
                                      variant="success" 
                                      onClick={() => handleValiderJustificatif(justificatif.id)}
                                      disabled={actionLoading}
                                    >
                                      ✅
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="danger" 
                                      onClick={() => handleRejeterJustificatif(justificatif.id)}
                                      disabled={actionLoading}
                                    >
                                      ❌
                                    </Button>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted py-4">
                          <p>Aucun justificatif en attente</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* SECTION RAPPORTS */}
            {activeSection === 'rapports' && (
              <Row className="g-4">
                <Col md={12}>
                  <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">📨 Rapport pour le Chef de Département</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-4">
                        <Col md={8}>
                          <Card className="border-0 bg-light">
                            <Card.Body>
                              <h6 className="text-primary mb-4">📊 Synthèse du Métier</h6>
                              
                              <Row className="g-3">
                                <Col md={6}>
                                  <div className="bg-white rounded p-3 border">
                                    <strong>👥 Effectif Total</strong>
                                    <p className="h4 text-primary mb-0">{stats?.total_apprenants || 0}</p>
                                    <small className="text-muted">Apprenants</small>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="bg-white rounded p-3 border">
                                    <strong>📈 Taux d'Absence</strong>
                                    <p className="h4 text-warning mb-0">{stats?.taux_absence_moyen || 0}%</p>
                                    <small className="text-muted">Moyenne</small>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="bg-white rounded p-3 border">
                                    <strong>📚 UEA Actives</strong>
                                    <p className="h4 text-success mb-0">{stats?.total_uea || 0}</p>
                                    <small className="text-muted">Unités d'enseignement</small>
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="bg-white rounded p-3 border">
                                    <strong>📋 Justificatifs</strong>
                                    <p className="h4 text-info mb-0">{stats?.justificatifs_en_attente || 0}</p>
                                    <small className="text-muted">En attente</small>
                                  </div>
                                </Col>
                              </Row>

                              {/* DÉTAILS DU RAPPORT */}
                              <div className="mt-4">
                                <h6 className="text-primary mb-3">📋 Détails du Rapport</h6>
                                <Table bordered>
                                  <tbody>
                                    <tr>
                                      <td><strong>Métier</strong></td>
                                      <td>{metierUtilisateur.nom}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Coordinateur</strong></td>
                                      <td>{user?.name}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Date de génération</strong></td>
                                      <td>{new Date().toLocaleDateString()}</td>
                                    </tr>
                                    <tr>
                                      <td><strong>Période analysée</strong></td>
                                      <td>
                                        {periode.start && periode.end 
                                          ? `${periode.start} à ${periode.end}`
                                          : 'Toute période'
                                        }
                                      </td>
                                    </tr>
                                    <tr>
                                      <td><strong>Filtre année</strong></td>
                                      <td>
                                        {anneeFiltre === 'toutes' 
                                          ? 'Toutes années' 
                                          : `${anneeFiltre}ère année`
                                        }
                                      </td>
                                    </tr>
                                  </tbody>
                                </Table>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>

                        <Col md={4}>
                          <Card className="border-0 bg-success text-white">
                            <Card.Body className="text-center">
                              <div className="display-1 mb-3">📤</div>
                              <h5>Envoyer le Rapport</h5>
                              <p className="small mb-4">
                                Transmettez ces statistiques consolidées au Chef de Département
                              </p>

                              <Button 
                                variant="light" 
                                size="lg"
                                onClick={handleEnvoyerRapportChefDepartement}
                                disabled={actionLoading || rapportEnvoye}
                                className="w-100 mb-3"
                              >
                                {actionLoading ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Envoi...
                                  </>
                                ) : rapportEnvoye ? (
                                  <>✅ Rapport Envoyé</>
                                ) : (
                                  <>📊 Envoyer Rapport</>
                                )}
                              </Button>

                              {rapportEnvoye ? (
                                <div className="alert alert-light mt-3">
                                  <strong>✔️ Succès</strong>
                                  <p className="mb-0 small">
                                    Rapport envoyé au Chef de Département
                                  </p>
                                </div>
                              ) : (
                                <div className="alert alert-warning mt-3">
                                  <strong>💡 Information</strong>
                                  <p className="mb-0 small">
                                    Le rapport inclura toutes les statistiques actuelles avec les filtres appliqués
                                  </p>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Les autres sections (statistiques, justificatifs) restent inchangées */}
            {/* ... */}
          </Col>
        </Row>
      </Container>

      {/* MODAL POUR VOIR UN JUSTIFICATIF */}
      <Modal show={showJustificatifModal} onHide={() => setShowJustificatifModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📄 Détail du Justificatif</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJustificatif && (
            <div>
              <p><strong>Apprenant:</strong> {selectedJustificatif.apprenant_nom || 'N/A'}</p>
              <p><strong>Date d'absence:</strong> {selectedJustificatif.date_absence}</p>
              <p><strong>Type:</strong> {selectedJustificatif.type}</p>
              <p><strong>Motif:</strong> {selectedJustificatif.motif}</p>
              {selectedJustificatif.fichier_url && (
                <p>
                  <strong>Fichier:</strong>{' '}
                  <a href={selectedJustificatif.fichier_url} target="_blank" rel="noopener noreferrer">
                    📎 Voir le justificatif
                  </a>
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJustificatifModal(false)}>
            Fermer
          </Button>
          <Button 
            variant="success"
            onClick={() => {
              handleValiderJustificatif(selectedJustificatif.id);
              setShowJustificatifModal(false);
            }}
            disabled={actionLoading}
          >
            ✅ Valider
          </Button>
          <Button 
            variant="danger"
            onClick={() => {
              handleRejeterJustificatif(selectedJustificatif.id);
              setShowJustificatifModal(false);
            }}
            disabled={actionLoading}
          >
            ❌ Rejeter
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DashboardResponsableMetier;