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
  Alert,
  Spinner,
  Offcanvas,
  Badge,
  Modal,
  Form,
  ButtonGroup,
  Dropdown
} from 'react-bootstrap';
import api from '../services/api';
import LogoutButton from '../components/LogoutButton';
import { 
  Filter, 
  Users, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Home,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Mail,
  Phone,
  Menu,
  ChevronDown,
  Search,
  RefreshCw
} from 'lucide-react';

function DashboardCoordinateur() {
  const [user, setUser] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [seances, setSeances] = useState([]);
  const [justificatifs, setJustificatifs] = useState([]);
  const [presences, setPresences] = useState([]);
  const [presencesFiltrees, setPresencesFiltrees] = useState([]);
  const [stats, setStats] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');

  const [selectedMetier, setSelectedMetier] = useState(null);
  const [selectedAnnee, setSelectedAnnee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [lastUpdate, setLastUpdate] = useState(null);

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedJustificatif, setSelectedJustificatif] = useState(null);
  const [validationMotif, setValidationMotif] = useState('');

  const [statsDetails, setStatsDetails] = useState({
    tauxPresence: 0,
    tauxAbsence: 0,
    justificatifsEnAttente: 0,
    seancesAujourdhui: 0
  });

  const metiers = [
    { 
      id: 1, 
      code: 'DWM', 
      nom: 'Développement Web & Mobile',
      couleur: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
      couleurSecondaire: '#1976d2',
      icon: '💻',
      effectif: 45
    },
    { 
      id: 2, 
      code: 'RT', 
      nom: 'Réseaux & Télécommunication',
      couleur: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
      couleurSecondaire: '#1565c0',
      icon: '📡',
      effectif: 32
    },
    { 
      id: 3, 
      code: 'ASRI', 
      nom: 'Administration Systèmes & Réseaux',
      couleur: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
      couleurSecondaire: '#0d47a1',
      icon: '🔧',
      effectif: 28
    }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      window.location.href = '/login';
      return;
    }

    const currentUser = JSON.parse(storedUser);

    if (currentUser.role !== 'coordinateur' && currentUser.role !== 'admin') {
      alert("Accès interdit : Rôle non autorisé.");
      window.location.href = '/';
      return;
    }

    setUser(currentUser);
    loadDashboardData();
  }, []);

  useEffect(() => {
    filtrerPresences();
  }, [selectedMetier, selectedAnnee, presences, searchTerm, dateRange]);

  useEffect(() => {
    if (presences.length > 0) {
      const totalPresences = presences.length;
      const presents = presences.filter(p => p.statut === 'present').length;
      const absents = presences.filter(p => p.statut === 'absent').length;
      
      setStatsDetails({
        tauxPresence: totalPresences > 0 ? (presents / totalPresences) * 100 : 0,
        tauxAbsence: totalPresences > 0 ? (absents / totalPresences) * 100 : 0,
        justificatifsEnAttente: justificatifs.length,
        seancesAujourdhui: seances.filter(s => 
          new Date(s.date).toDateString() === new Date().toDateString()
        ).length
      });
    }
  }, [presences, justificatifs, seances]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        presencesRes, 
        absencesRes, 
        seancesRes, 
        justificatifsRes
      ] = await Promise.all([
        api.get('/api/presences').catch(err => {
          console.error('Erreur présences:', err);
          return { data: [] };
        }),
        api.get('/api/absences').catch(err => {
          console.error('Erreur absences:', err);
          return { data: [] };
        }),
        api.get('/api/seances').catch(err => {
          console.error('Erreur séances:', err);
          return { data: [] };
        }),
        api.get('/api/justificatifs/en-attente').catch(err => {
          console.error('Erreur justificatifs:', err);
          return { data: [] };
        })
      ]);

      const presencesFormatees = Array.isArray(presencesRes.data) ? presencesRes.data.map(presence => ({
        id: presence.id,
        statut: presence.statut || presence.status,
        date: presence.date || presence.created_at,
        commentaire: presence.commentaire || '',
        
        apprenant: presence.apprenant || {
          id: presence.apprenant_id,
          prenom: presence.prenom || presence.apprenant_prenom,
          nom: presence.nom || presence.apprenant_nom,
          email: presence.email || presence.apprenant_email,
          nom_complet: presence.nom_complet || `${presence.prenom || ''} ${presence.nom || ''}`.trim(),
          metier: presence.metier || {
            id: presence.metier_id,
            nom: presence.metier_nom || presence.nom_metier,
            code: presence.metier_code
          },
          annee: presence.annee || presence.apprenant_annee,
          annee_label: presence.annee_label || (presence.annee ? `Année ${presence.annee}` : 'Non spécifié')
        },
        
        seance: presence.seance || {
          id: presence.seance_id,
          nom: presence.nom_seance || presence.seance_nom || presence.nom,
          matiere: presence.matiere,
          uea_nom: presence.uea_nom || presence.nom_uea,
          date: presence.date_seance || presence.seance_date || presence.date,
          heure_debut: presence.heure_debut,
          heure_fin: presence.heure_fin,
          salle: presence.salle,
          metier: presence.metier_seance || {
            id: presence.metier_id,
            nom: presence.metier_nom || presence.nom_metier,
            code: presence.metier_code
          },
          enseignant: presence.enseignant || {
            id: presence.enseignant_id,
            nom_complet: presence.enseignant_nom || presence.nom_enseignant || 'Enseignant'
          }
        }
      })) : [];

      setPresences(presencesFormatees);
      setAbsences(absencesRes.data || []);
      setSeances(seancesRes.data || []);
      setJustificatifs(justificatifsRes.data || []);

      setLastUpdate(new Date());

    } catch (err) {
      console.error("Erreur lors du chargement :", err);
      
      if (err.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError(`Erreur de chargement: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtrerPresences = () => {
    let filtered = [...presences];

    if (selectedMetier && selectedMetier.code) {
      filtered = filtered.filter(p => {
        const metierApprenant = p.apprenant?.metier;
        const metierSeance = p.seance?.metier;

        const metierApprenantStr = typeof metierApprenant === 'string' ? metierApprenant : 
                                  metierApprenant?.code || metierApprenant?.nom || '';
        
        const metierSeanceStr = typeof metierSeance === 'string' ? metierSeance : 
                               metierSeance?.code || metierSeance?.nom || '';

        return metierApprenantStr === selectedMetier.code || 
               metierSeanceStr === selectedMetier.code;
      });
    }

    if (selectedAnnee) {
      filtered = filtered.filter(p => {
        const annee = p.apprenant?.annee;
        
        let anneeNumerique = null;
        
        if (typeof annee === 'string') {
          const match = annee.match(/(\d+)/);
          anneeNumerique = match ? parseInt(match[1]) : null;
        } else if (typeof annee === 'number') {
          anneeNumerique = annee;
        }
        
        return anneeNumerique === selectedAnnee;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(p => {
        const nomComplet = `${p.apprenant?.prenom || ''} ${p.apprenant?.nom || ''}`.toLowerCase();
        const email = p.apprenant?.email?.toLowerCase() || '';
        const nomSeance = p.seance?.nom?.toLowerCase() || '';
        const ueaNom = p.seance?.uea_nom?.toLowerCase() || '';
        
        return nomComplet.includes(searchTerm.toLowerCase()) || 
               email.includes(searchTerm.toLowerCase()) ||
               nomSeance.includes(searchTerm.toLowerCase()) ||
               ueaNom.includes(searchTerm.toLowerCase());
      });
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(p => {
        const datePresence = new Date(p.seance?.date || p.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return datePresence >= startDate && datePresence <= endDate;
      });
    }

    setPresencesFiltrees(filtered);
  };

  const resetFiltres = () => {
    setSelectedMetier(null);
    setSelectedAnnee(null);
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  const genererRapport = () => {
    const data = {
      titre: `Rapport des Présences - ${selectedMetier?.code || 'Tous Métiers'}`,
      periode: dateRange.start && dateRange.end 
        ? `Du ${formatDate(dateRange.start)} au ${formatDate(dateRange.end)}`
        : 'Période complète',
      metier: selectedMetier ? `${selectedMetier.code} - ${selectedMetier.nom}` : 'Tous métiers',
      annee: selectedAnnee ? `Année ${selectedAnnee}` : 'Toutes années',
      totalPresences: presencesFiltrees.length,
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      
      statistiques: {
        presents: presencesFiltrees.filter(p => p.statut === 'present').length,
        absents: presencesFiltrees.filter(p => p.statut === 'absent').length,
        retards: presencesFiltrees.filter(p => p.statut === 'retard').length,
        tauxPresence: presencesFiltrees.length > 0 ? 
          (presencesFiltrees.filter(p => p.statut === 'present').length / presencesFiltrees.length) * 100 : 0
      },
      
      details: presencesFiltrees.map(p => ({
        apprenant: `${p.apprenant?.prenom} ${p.apprenant?.nom}`,
        email: p.apprenant?.email,
        metier: getMetierNom(p.apprenant?.metier || p.seance?.metier),
        annee: p.apprenant?.annee,
        seance: p.seance?.nom,
        uea: p.seance?.uea_nom,
        date: formatDate(p.seance?.date),
        heure: p.seance?.heure_debut ? `${p.seance.heure_debut} - ${p.seance.heure_fin}` : 'N/A',
        enseignant: getEnseignantNom(p.seance?.enseignant),
        statut: p.statut,
        salle: p.seance?.salle
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${selectedMetier?.code || 'tous-metiers'}-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`📊 Rapport ${selectedMetier?.code || 'général'} généré avec succès !`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleValiderJustificatif = async (statut) => {
    if (!selectedJustificatif) return;

    try {
      await api.put(`/api/justificatifs/${selectedJustificatif.id}/statut`, {
        statut: statut,
        motif: validationMotif
      });

      alert(`Justificatif ${statut === 'valide' ? 'validé' : 'refusé'} avec succès !`);
      setShowValidationModal(false);
      setSelectedJustificatif(null);
      setValidationMotif('');

      const justificatifsRes = await api.get('/api/justificatifs/en-attente');
      setJustificatifs(justificatifsRes.data);
    } catch (err) {
      console.error('Erreur validation justificatif:', err);
      alert('Erreur lors de la validation du justificatif');
    }
  };

  const handleOpenValidationModal = (justificatif) => {
    setSelectedJustificatif(justificatif);
    setValidationMotif('');
    setShowValidationModal(true);
  };

  const getMetierNom = (metier) => {
    if (!metier) return 'Non spécifié';
    if (typeof metier === 'string') return metier;
    if (typeof metier === 'object') return metier.nom || 'Non spécifié';
    return 'Non spécifié';
  };

  const getEnseignantNom = (enseignant) => {
    if (!enseignant) return 'Enseignant';
    if (typeof enseignant === 'string') return enseignant;
    if (typeof enseignant === 'object') return enseignant.nom_complet || enseignant.name || 'Enseignant';
    return 'Enseignant';
  };

  const getApprenantNomComplet = (apprenant) => {
    if (!apprenant) return 'Inconnu';
    if (typeof apprenant === 'string') return apprenant;
    if (apprenant.nom_complet) return apprenant.nom_complet;
    if (apprenant.prenom && apprenant.nom) return `${apprenant.prenom} ${apprenant.nom}`;
    if (apprenant.name) return apprenant.name;
    return 'Inconnu';
  };

  const getStatutPresenceBadge = (statut) => {
    switch (statut) {
      case 'present':
        return <Badge bg="success" className="px-3 py-2 d-flex align-items-center gap-1">
          <CheckCircle size={14} /> Présent
        </Badge>;
      case 'absent':
        return <Badge bg="danger" className="px-3 py-2 d-flex align-items-center gap-1">
          <XCircle size={14} /> Absent
        </Badge>;
      case 'retard':
        return <Badge bg="warning" text="dark" className="px-3 py-2 d-flex align-items-center gap-1">
          <Clock size={14} /> Retard
        </Badge>;
      case 'demi':
        return <Badge bg="info" className="px-3 py-2 d-flex align-items-center gap-1">
          <Clock size={14} /> Demi-journée
        </Badge>;
      default:
        return <Badge bg="secondary" className="px-3 py-2">{statut || 'Non défini'}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatHeure = (heureString) => {
    if (!heureString) return '';
    return heureString;
  };

  const cardStyle = {
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden'
  };

  const cardHoverStyle = {
    transform: 'translateY(-5px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)'
  };

  const LoadingSpinner = () => (
    <div 
      className="d-flex flex-column align-items-center justify-content-center" 
      style={{ minHeight: '50vh' }}
    >
      <Spinner 
        animation="border" 
        style={{ width: '60px', height: '60px', color: '#1976d2', borderWidth: '4px' }}
      />
      <p className="mt-4 text-muted fs-5 fw-semibold">Chargement des données...</p>
    </div>
  );

  const StatsMetier = ({ metier }) => {
    const presencesMetier = presences.filter(p => {
      const metierApprenant = p.apprenant?.metier;
      const metierSeance = p.seance?.metier;

      const metierApprenantStr = typeof metierApprenant === 'string' ? metierApprenant : 
                                metierApprenant?.code || metierApprenant?.nom || '';
      
      const metierSeanceStr = typeof metierSeance === 'string' ? metierSeance : 
                             metierSeance?.code || metierSeance?.nom || '';

      return metierApprenantStr === metier.code || 
             metierSeanceStr === metier.code;
    });
    
    const stats = {
      total: presencesMetier.length,
      presents: presencesMetier.filter(p => p.statut === 'present').length,
      absents: presencesMetier.filter(p => p.statut === 'absent').length,
      tauxPresence: presencesMetier.length > 0 ? 
        (presencesMetier.filter(p => p.statut === 'present').length / presencesMetier.length) * 100 : 0
    };

    return (
      <Card 
        style={{ 
          ...cardStyle,
          background: metier.couleur, 
          color: 'white'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = cardStyle.boxShadow;
        }}
      >
        <Card.Body className="text-center p-4">
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>
            {metier.icon}
          </div>
          <h5 className="fw-bold">{metier.code}</h5>
          <p className="small opacity-90 mb-3">{metier.nom}</p>
          
          <div className="row text-center">
            <div className="col-6">
              <div className="fw-bold fs-4">{stats.total}</div>
              <small>Total</small>
            </div>
            <div className="col-6">
              <div className="fw-bold fs-4">{stats.tauxPresence.toFixed(1)}%</div>
              <small>Présence</small>
            </div>
          </div>
          
          <Button
            variant="light"
            size="sm"
            className="mt-3 w-100 fw-bold"
            onClick={() => setSelectedMetier(metier)}
            style={{ borderRadius: '10px' }}
          >
            Voir les présences
          </Button>
        </Card.Body>
      </Card>
    );
  };

  const renderAccueil = () => (
    <>
      <div 
        style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          borderRadius: '25px',
          padding: '60px 40px',
          marginBottom: '30px',
          color: 'white',
          boxShadow: '0 20px 60px rgba(25, 118, 210, 0.3)'
        }}
      >
        <Row className="align-items-center">
          <Col md={8}>
            <h2 className="display-5 fw-bold mb-3">
              👋 Bonjour, {user?.name || 'Coordinateur'}
            </h2>
            <p className="lead mb-4 opacity-90">
              Tableau de bord coordinateur - Supervision des activités académiques
            </p>
            <div className="d-flex gap-3 flex-wrap">
              <Button 
                variant="light" 
                size="lg"
                onClick={loadDashboardData}
                className="d-flex align-items-center gap-2"
                style={{ borderRadius: '15px', fontWeight: '600' }}
              >
                <BarChart3 size={20} />
                Actualiser les données
              </Button>
              <Button 
                variant="outline-light" 
                size="lg"
                onClick={() => setActiveSection('presences')}
                className="d-flex align-items-center gap-2"
                style={{ borderRadius: '15px', fontWeight: '600' }}
              >
                <Filter size={20} />
                Voir les présences
              </Button>
            </div>
          </Col>
          <Col md={4} className="text-center">
            <div style={{ fontSize: '6rem' }}>📊</div>
            {lastUpdate && (
              <small className="opacity-80">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
              </small>
            )}
          </Col>
        </Row>
      </div>

      <Row className="g-4 mb-4">
        {[
          { 
            title: 'Total Présences', 
            value: presences.length, 
            icon: <CheckCircle size={24} />, 
            color: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            description: `${presences.filter(p => p.statut === 'present').length} présences validées`
          },
          { 
            title: 'Absences Signalées', 
            value: absences.length, 
            icon: <AlertTriangle size={24} />, 
            color: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
            description: 'Nécessitent un suivi'
          },
          { 
            title: 'Taux de Présence', 
            value: `${statsDetails.tauxPresence.toFixed(1)}%`, 
            icon: <BarChart3 size={24} />, 
            color: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
            description: 'Moyenne générale'
          },
          { 
            title: 'Séances Programmes', 
            value: seances.length, 
            icon: <Calendar size={24} />, 
            color: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            description: 'Séances enregistrées'
          }
        ].map((stat, idx) => (
          <Col key={idx} md={3} sm={6}>
            <Card 
              style={{
                ...cardStyle,
                background: stat.color,
                color: 'white',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = cardHoverStyle.transform;
                e.currentTarget.style.boxShadow = cardHoverStyle.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = cardStyle.boxShadow;
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {stat.icon}
                  </div>
                </div>
                <h2 className="display-4 fw-bold mb-2">{stat.value}</h2>
                <h5 className="mb-2">{stat.title}</h5>
                <p className="mb-0 opacity-90 small">{stat.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col md={8}>
          <Card style={cardStyle}>
            <Card.Body className="p-4">
              <h4 className="mb-4 fw-bold d-flex align-items-center gap-2">
                <Users size={24} />
                Vue par Métier
              </h4>
              <Row className="g-3">
                {metiers.map(metier => (
                  <Col key={metier.id} md={4}>
                    <StatsMetier metier={metier} />
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card style={cardStyle}>
            <Card.Body className="p-4">
              <h4 className="mb-4 fw-bold d-flex align-items-center gap-2">
                <BarChart3 size={24} />
                Actions Rapides
              </h4>
              <div className="d-grid gap-3">
                {[
                  { label: '📊 Voir les présences', section: 'presences', color: '#1976d2' },
                  { label: '🚨 Absences fréquentes', section: 'absences', color: '#1565c0' },
                  { label: '📅 Séances programmées', section: 'seances', color: '#0d47a1' },
                  { label: '📋 Justificatifs en attente', section: 'justificatifs', color: '#1976d2' }
                ].map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline-primary"
                    className="py-3 text-start d-flex align-items-center gap-3"
                    style={{
                      borderRadius: '15px',
                      fontWeight: '600',
                      borderColor: action.color,
                      color: action.color,
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setActiveSection(action.section)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = action.color;
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'translateX(5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = action.color;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>
                      {action.label.split(' ')[0]}
                    </div>
                    <span>{action.label.split(' ').slice(1).join(' ')}</span>
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );

  const renderPresences = () => {
    const presencesAffichees = selectedMetier || selectedAnnee || searchTerm || dateRange.start ? presencesFiltrees : presences;
    
    return (
      <Card style={cardStyle}>
        <div 
          style={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            padding: '30px',
            color: 'white'
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="mb-2 fw-bold d-flex align-items-center gap-2">
                <BarChart3 size={28} />
                Présences des Apprenants
              </h3>
              <p className="mb-0 opacity-90">
                {presencesAffichees.length} présence(s) enregistrée(s)
                {selectedMetier && ` • ${selectedMetier.code}`}
                {selectedAnnee && ` • Année ${selectedAnnee}`}
                {lastUpdate && ` • Dernière MAJ: ${lastUpdate.toLocaleTimeString()}`}
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Button 
                variant="light"
                onClick={loadDashboardData}
                className="d-flex align-items-center gap-2"
                style={{ borderRadius: '12px', fontWeight: '600' }}
              >
                <RefreshCw size={16} />
                Actualiser
              </Button>
              <Button 
                variant="outline-light"
                onClick={genererRapport}
                className="d-flex align-items-center gap-2"
                style={{ borderRadius: '12px', fontWeight: '600' }}
              >
                <Download size={16} />
                Rapport
              </Button>
              {(selectedMetier || selectedAnnee || searchTerm || dateRange.start) && (
                <Button 
                  variant="outline-light"
                  onClick={resetFiltres}
                  className="d-flex align-items-center gap-2"
                  style={{ borderRadius: '12px', fontWeight: '600' }}
                >
                  <XCircle size={16} />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        </div>

        <Card.Body className="p-4">
          <div className="d-flex gap-2 mb-3 flex-wrap">
            {selectedMetier && (
              <Badge bg="primary" className="px-3 py-2 d-flex align-items-center gap-2">
                {selectedMetier.icon} {selectedMetier.code}
                <XCircle 
                  size={14} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedMetier(null)}
                />
              </Badge>
            )}
            {selectedAnnee && (
              <Badge bg="secondary" className="px-3 py-2 d-flex align-items-center gap-2">
                Année {selectedAnnee}
                <XCircle 
                  size={14} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedAnnee(null)}
                />
              </Badge>
            )}
          </div>

          {selectedMetier && (
            <div className="d-flex justify-content-between align-items-center mb-4 p-3" 
                 style={{
                   background: selectedMetier.couleur,
                   borderRadius: '15px',
                   color: 'white'
                 }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ fontSize: '2.5rem' }}>
                  {selectedMetier.icon}
                </div>
                <div>
                  <h4 className="mb-1 fw-bold">{selectedMetier.code} - {selectedMetier.nom}</h4>
                  <p className="mb-0 opacity-90">
                    {presencesFiltrees.length} présence(s) • Année {selectedAnnee || 'Toutes'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline-light"
                onClick={() => {
                  setSelectedMetier(null);
                  setSelectedAnnee(null);
                }}
                className="d-flex align-items-center gap-2"
              >
                <XCircle size={16} />
                Changer de métier
              </Button>
            </div>
          )}

          {(!selectedMetier || !selectedAnnee) && (
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold">
                    <Search size={16} className="me-2" />
                    Rechercher (nom, prénom, séance, UEA...)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nom, prénom, séance, UEA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '12px', padding: '12px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date de début</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    style={{ borderRadius: '12px', padding: '12px' }}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold">Date de fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    style={{ borderRadius: '12px', padding: '12px' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          <div className="mb-4">
            {!selectedMetier ? (
              <div>
                <h5 className="mb-3 fw-bold d-flex align-items-center gap-2">
                  <Users size={20} />
                  Sélectionnez un métier pour voir les présences
                </h5>
                <Row className="g-3">
                  {metiers.map(metier => (
                    <Col key={metier.id} md={4}>
                      <StatsMetier metier={metier} />
                    </Col>
                  ))}
                </Row>
              </div>
            ) : !selectedAnnee ? (
              <div>
                <Button
                  variant="outline-secondary"
                  onClick={() => setSelectedMetier(null)}
                  className="mb-3 d-flex align-items-center gap-2"
                  style={{ borderRadius: '10px' }}
                >
                  <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                  Retour aux métiers
                </Button>
                <h5 className="mb-3 fw-bold d-flex align-items-center gap-2">
                  <Users size={20} />
                  {selectedMetier.icon} {selectedMetier.code} - Sélectionnez une année
                </h5>
                <Row className="g-3">
                  {[1, 2].map(annee => (
                    <Col key={annee} md={6}>
                      <Card
                        style={{
                          ...cardStyle,
                          background: `linear-gradient(135deg, ${selectedMetier.couleurSecondaire} 0%, ${selectedMetier.couleurSecondaire}dd 100%)`,
                          color: 'white',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedAnnee(annee)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = cardStyle.boxShadow;
                        }}
                      >
                        <Card.Body className="text-center p-5">
                          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                            {annee === 1 ? '1️⃣' : '2️⃣'}
                          </div>
                          <h3 className="fw-bold mb-3">
                            {annee === 1 ? 'Première' : 'Deuxième'} Année
                          </h3>
                          <Badge bg="light" text="dark" className="px-4 py-2" style={{ fontSize: '1.1rem' }}>
                            {presences.filter(p => {
                              const metierApprenant = p.apprenant?.metier;
                              const metierSeance = p.seance?.metier;

                              const metierApprenantStr = typeof metierApprenant === 'string' ? metierApprenant : 
                                                        metierApprenant?.code || metierApprenant?.nom || '';
                              
                              const metierSeanceStr = typeof metierSeance === 'string' ? metierSeance : 
                                                     metierSeance?.code || metierSeance?.nom || '';

                              let anneeNumerique = null;
                              const anneePresence = p.apprenant?.annee;
                              if (typeof anneePresence === 'string') {
                                const match = anneePresence.match(/(\d+)/);
                                anneeNumerique = match ? parseInt(match[1]) : null;
                              } else if (typeof anneePresence === 'number') {
                                anneeNumerique = anneePresence;
                              }

                              const metierMatch = metierApprenantStr === selectedMetier.code || 
                                                 metierSeanceStr === selectedMetier.code;

                              return anneeNumerique === annee && metierMatch;
                            }).length} présences
                          </Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ) : (
              <>
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSelectedAnnee(null)}
                      className="d-flex align-items-center gap-2"
                      style={{ borderRadius: '10px' }}
                    >
                      <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                      Retour aux années
                    </Button>
                    <Badge 
                      bg="primary" 
                      className="px-3 py-2 d-flex align-items-center gap-2"
                      style={{ 
                        background: selectedMetier.couleur,
                        border: 'none',
                        fontSize: '1rem'
                      }}
                    >
                      {selectedMetier.icon} {selectedMetier.code} - Année {selectedAnnee}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      {presencesAffichees.length} résultat(s)
                    </Badge>
                    <Dropdown>
                      <Dropdown.Toggle 
                        variant="outline-primary" 
                        id="dropdown-actions"
                        className="d-flex align-items-center gap-2"
                        style={{ borderRadius: '10px' }}
                      >
                        <Download size={16} />
                        Exporter
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={genererRapport}>
                          📊 Rapport PDF
                        </Dropdown.Item>
                        <Dropdown.Item onClick={genererRapport}>
                          📝 Rapport Excel
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {presencesAffichees.length === 0 ? (
                  <Alert 
                    variant="info" 
                    className="text-center py-5"
                    style={{ 
                      borderRadius: '20px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
                    }}
                  >
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                    <h4 className="fw-bold mb-3">Aucune présence trouvée</h4>
                    <p className="mb-3">
                      Aucune présence pour {selectedMetier.code} - Année {selectedAnnee}
                      {(searchTerm || dateRange.start) && ' avec les filtres actuels'}
                    </p>
                    <Button 
                      variant="primary"
                      onClick={resetFiltres}
                      style={{ borderRadius: '12px' }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Alert>
                ) : (
                  <div style={{ 
                    maxHeight: '600px', 
                    overflowY: 'auto',
                    borderRadius: '15px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Table hover responsive className="mb-0">
                      <thead 
                        style={{ 
                          background: selectedMetier.couleur,
                          color: 'white',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}
                      >
                        <tr>
                          <th className="py-3">Apprenant</th>
                          <th className="py-3">Métier</th>
                          <th className="py-3">Année</th>
                          <th className="py-3">Séance</th>
                          <th className="py-3">UEA</th>
                          <th className="py-3">Date</th>
                          <th className="py-3">Heure</th>
                          <th className="py-3">Salle</th>
                          <th className="py-3">Enseignant</th>
                          <th className="py-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {presencesAffichees.map((presence, index) => (
                          <tr 
                            key={presence.id || index}
                            style={{
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8f9fa';
                              e.currentTarget.style.transform = 'scale(1.01)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <td className="py-3">
                              <div className="d-flex align-items-center">
                                <div 
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: selectedMetier.couleur,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    marginRight: '12px',
                                    fontSize: '1.2rem'
                                  }}
                                >
                                  {(getApprenantNomComplet(presence.apprenant).charAt(0) || 'A').toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold" style={{ color: '#333' }}>
                                    {getApprenantNomComplet(presence.apprenant)}
                                  </div>
                                  <small className="text-muted">
                                    {presence.apprenant?.email}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <Badge bg="info" className="px-2 py-1">
                                {getMetierNom(presence.apprenant?.metier || presence.seance?.metier)}
                              </Badge>
                            </td>
                            <td className="py-3">
                              <Badge bg="secondary" className="px-2 py-1">
                                {presence.apprenant?.annee_label || 
                                 (presence.apprenant?.annee ? `Année ${presence.apprenant.annee}` : 'Non spécifié')}
                              </Badge>
                            </td>
                            <td className="py-3">{presence.seance?.nom || 'N/A'}</td>
                            <td className="py-3">
                              <Badge bg="light" text="dark" className="px-2 py-1">
                                {presence.seance?.uea_nom || 'Non spécifié'}
                              </Badge>
                            </td>
                            <td className="py-3">{formatDate(presence.seance?.date || presence.date)}</td>
                            <td className="py-3">
                              {presence.seance?.heure_debut && presence.seance?.heure_fin 
                                ? `${formatHeure(presence.seance.heure_debut)} - ${formatHeure(presence.seance.heure_fin)}`
                                : 'N/A'
                              }
                            </td>
                            <td className="py-3">{presence.seance?.salle || 'N/A'}</td>
                            <td className="py-3">{getEnseignantNom(presence.seance?.enseignant)}</td>
                            <td className="py-3 text-center">
                              {getStatutPresenceBadge(presence.statut)}
                              {presence.commentaire && (
                                <div>
                                  <small className="text-muted" title={presence.commentaire}>
                                    💬
                                  </small>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderMainContent = () => {
    if (loading) return <LoadingSpinner />;

    switch (activeSection) {
      case 'accueil':
        return renderAccueil();
      case 'presences':
        return renderPresences();
      case 'absences':
        return (
          <Card style={cardStyle}>
            <div 
              style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                padding: '30px',
                color: 'white'
              }}
            >
              <h3 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <AlertTriangle size={28} />
                Absences Fréquentes
              </h3>
            </div>
            <Card.Body className="p-4">
              <Alert variant="info" className="text-center">
                Section en cours de développement...
              </Alert>
            </Card.Body>
          </Card>
        );
      case 'seances':
        return (
          <Card style={cardStyle}>
            <div 
              style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                padding: '30px',
                color: 'white'
              }}
            >
              <h3 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <Calendar size={28} />
                Séances Programmées
              </h3>
            </div>
            <Card.Body className="p-4">
              <Alert variant="info" className="text-center">
                Section en cours de développement...
              </Alert>
            </Card.Body>
          </Card>
        );
      case 'justificatifs':
        return (
          <Card style={cardStyle}>
            <div 
              style={{
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                padding: '30px',
                color: 'white'
              }}
            >
              <h3 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <FileText size={28} />
                Justificatifs en Attente
              </h3>
            </div>
            <Card.Body className="p-4">
              <Alert variant="info" className="text-center">
                Section en cours de développement...
              </Alert>
            </Card.Body>
          </Card>
        );
      default:
        return renderAccueil();
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar 
        style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          boxShadow: '0 10px 30px rgba(25, 118, 210, 0.3)'
        }}
        variant="dark" 
        expand="lg" 
        sticky="top"
      >
        <Container fluid>
          <Navbar.Brand className="fw-bold fs-4 d-flex align-items-center gap-2">
            <BarChart3 size={28} />
            Dashboard Coordinateur
          </Navbar.Brand>
          
          <Nav className="ms-auto d-flex align-items-center gap-3">
            <div className="text-white d-none d-md-block">
              <div className="fw-semibold">{user?.name || 'Coordinateur'}</div>
              <small className="opacity-90">Coordinateur pédagogique</small>
            </div>
            
            <Button 
              variant="outline-light" 
              onClick={() => setShowSidebar(true)}
              className="d-flex align-items-center gap-2"
              style={{ borderRadius: '12px', fontWeight: '600' }}
            >
              <Menu size={20} />
              Menu
            </Button>
            <LogoutButton onLogout={handleLogout} />
          </Nav>
        </Container>
      </Navbar>

      <Offcanvas 
        show={showSidebar} 
        onHide={() => setShowSidebar(false)}
        placement="start"
        style={{ borderRadius: '0 25px 25px 0' }}
      >
        <Offcanvas.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white'
          }}
        >
          <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2">
            <Menu size={24} />
            Navigation
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Nav className="flex-column">
            {[
              { section: 'accueil', label: 'Accueil', icon: <Home size={20} /> },
              { section: 'presences', label: 'Présences', icon: <BarChart3 size={20} /> },
              { section: 'absences', label: 'Absences', icon: <AlertTriangle size={20} /> },
              { section: 'seances', label: 'Séances', icon: <Calendar size={20} /> },
              { section: 'justificatifs', label: 'Justificatifs', icon: <FileText size={20} /> }
            ].map((item) => (
              <Nav.Link
                key={item.section}
                onClick={() => {
                  setActiveSection(item.section);
                  setShowSidebar(false);
                }}
                className={`p-4 border-bottom d-flex align-items-center gap-3 ${
                  activeSection === item.section ? 'active' : ''
                }`}
                style={{
                  background: activeSection === item.section ? 
                    'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' : 'transparent',
                  color: activeSection === item.section ? 'white' : '#333',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  borderRadius: '0'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== item.section) {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.color = '#1976d2';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.section) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#333';
                  }
                }}
              >
                {item.icon}
                <span style={{ fontSize: '1.1rem' }}>
                  {item.label}
                </span>
                {item.section === 'presences' && presences.length > 0 && (
                  <Badge bg="success" className="ms-auto">
                    {presences.length}
                  </Badge>
                )}
              </Nav.Link>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      <Container fluid className="flex-grow-1 py-4 px-4">
        {error && (
          <Alert 
            variant="danger" 
            dismissible 
            onClose={() => setError('')}
            style={{
              borderRadius: '15px',
              border: 'none',
              background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(211, 47, 47, 0.3)'
            }}
          >
            <div className="d-flex align-items-center">
              <AlertTriangle size={24} className="me-2" />
              <div>
                <strong>Erreur :</strong> {error}
              </div>
            </div>
          </Alert>
        )}

        {renderMainContent()}
      </Container>

      <footer 
        style={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          padding: '20px 0',
          marginTop: 'auto'
        }}
      >
        <Container>
          <Row>
            <Col className="text-center">
              <p className="mb-1 fw-semibold">
                © 2024 Dashboard Coordinateur - Système de Gestion Académique
              </p>
              <small className="opacity-90">
                Développé avec React & Bootstrap • 
                {lastUpdate && ` Dernière mise à jour : ${lastUpdate.toLocaleString('fr-FR')}`}
              </small>
            </Col>
          </Row>
        </Container>
      </footer>

      <Modal 
        show={showValidationModal} 
        onHide={() => setShowValidationModal(false)}
        centered
        size="lg"
      >
        <Modal.Header 
          closeButton
          style={{
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            border: 'none'
          }}
        >
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <FileText size={24} />
            Validation du Justificatif
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-4">
          {selectedJustificatif && (
            <>
              <div className="mb-4">
                <h6 className="fw-bold mb-3">Informations du justificatif :</h6>
                <Card style={{ border: '2px solid #e9ecef', borderRadius: '12px' }}>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <strong>👤 Apprenant :</strong><br />
                        {selectedJustificatif.apprenant?.user?.name || 'Inconnu'}
                      </Col>
                      <Col md={6}>
                        <strong>🎓 Métier :</strong><br />
                        {getMetierNom(selectedJustificatif.apprenant?.metier)}
                      </Col>
                    </Row>
                    <Row className="mt-2">
                      <Col md={6}>
                        <strong>📅 Date :</strong><br />
                        {formatDate(selectedJustificatif.created_at)}
                      </Col>
                      <Col md={6}>
                        <strong>📝 Motif :</strong><br />
                        {selectedJustificatif.motif || 'Non spécifié'}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>

              <Form.Group className="mb-4">
                <Form.Label className="fw-bold d-flex align-items-center gap-2">
                  <FileText size={18} />
                  Commentaire (optionnel)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Ajoutez un commentaire pour la validation..."
                  value={validationMotif}
                  onChange={(e) => setValidationMotif(e.target.value)}
                  style={{ 
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    resize: 'none'
                  }}
                />
              </Form.Group>

              <div className="text-center">
                <p className="text-muted mb-3">
                  Choisissez une action pour ce justificatif :
                </p>
                <ButtonGroup className="w-100">
                  <Button
                    variant="success"
                    onClick={() => handleValiderJustificatif('valide')}
                    className="d-flex align-items-center justify-content-center gap-2 py-3"
                    style={{ borderRadius: '12px 0 0 12px', fontWeight: '600' }}
                  >
                    <CheckCircle size={20} />
                    Valider le justificatif
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleValiderJustificatif('refuse')}
                    className="d-flex align-items-center justify-content-center gap-2 py-3"
                    style={{ borderRadius: '0 12px 12px 0', fontWeight: '600' }}
                  >
                    <XCircle size={20} />
                    Refuser le justificatif
                  </Button>
                </ButtonGroup>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default DashboardCoordinateur;