// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Nav,
  Navbar,
  Button,
  Card,
  Dropdown
} from 'react-bootstrap';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';

// ⭐ IMPORT DE VOTRE IMAGE - CHEMIN CORRECT
import heroImage from '../assets/images/hero-image.jpg';

// === 🌟 ANIMATIONS ===
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-10px) rotate(2deg); }
  66% { transform: translateY(5px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// === 🎨 STYLED COMPONENTS ===
const HeroSection = styled.section`
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4a90e2 100%);
  background-size: 300% 300%;
  animation: ${gradientShift} 8s ease infinite;
  padding: 120px 0 100px;
  position: relative;
  min-height: 100vh;
  color: #fff;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(30, 60, 114, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(74, 144, 226, 0.2) 0%, transparent 50%);
    pointer-events: none;
  }

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1));
  }
`;

const StyledNavbar = styled(Navbar)`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .navbar-brand {
    font-weight: 800;
    font-size: 1.5rem;
    background: linear-gradient(135deg, #1e3c72, #2a5298);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const Title = styled.h1`
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  color: #fff;
  margin-bottom: 20px;
  text-align: left;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: ${slideInLeft} 1.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.1;

  .highlight {
    background: linear-gradient(135deg, #FFD700, #4a90e2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
  }
`;

const Subtitle = styled.p`
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 25px;
  text-align: left;
  animation: ${slideInLeft} 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both;
  font-weight: 300;
  line-height: 1.5;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  margin-bottom: 40px;
  max-width: 600px;
  line-height: 1.8;
  animation: ${slideInLeft} 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both;
  font-size: 1rem;

  .specialty {
    color: #4a90e2;
    font-weight: 600;
    text-shadow: 0 2px 10px rgba(74, 144, 226, 0.3);
  }
`;

const ImageContainer = styled.div`
  position: relative;
  animation: ${slideInRight} 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both;

  .main-image {
    width: 100%;
    max-width: 500px;
    height: 400px;
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.2),
      0 15px 30px rgba(0, 0, 0, 0.1);
    border: 3px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    animation: ${float} 6s ease-in-out infinite;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: scale(1.05) translateY(-10px);
      box-shadow: 
        0 35px 70px rgba(0, 0, 0, 0.3),
        0 20px 40px rgba(0, 0, 0, 0.15);
    }

    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(30, 60, 114, 0.1), rgba(42, 82, 152, 0.1));
      z-index: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    &:hover img {
      transform: scale(1.1);
    }
  }

  .floating-elements {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
    border-radius: 50%;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    animation: ${float} 4s ease-in-out infinite reverse;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #4a90e2;
    text-shadow: 0 2px 10px rgba(74, 144, 226, 0.5);
  }

  .floating-elements:nth-child(3) {
    top: auto;
    bottom: -20px;
    left: -20px;
    right: auto;
    width: 80px;
    height: 80px;
    animation-delay: -2s;
    font-size: 1.5rem;
  }
`;

const MetierCard = styled(Card)`
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.1),
    0 1px 8px rgba(0, 0, 0, 0.06);
  overflow: visible !important;
  position: relative;
  animation: ${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #1e3c72, #2a5298, #4a90e2);
    transform: scaleX(0);
    transition: transform 0.3s ease;
    transform-origin: left;
  }

  &:hover {
    transform: translateY(-15px) scale(1.02);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.15),
      0 15px 30px rgba(0, 0, 0, 0.1);
    z-index: 10;

    &:before {
      transform: scaleX(1);
    }
  }

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }

  .dropdown.show {
    z-index: 9999 !important;
  }
`;

const IconWrapper = styled.div`
  font-size: 3.5rem;
  margin-bottom: 20px;
  position: relative;
  display: inline-block;

  i {
    transition: all 0.3s ease;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  ${MetierCard}:hover & i {
    transform: scale(1.1) rotate(5deg);
    animation: ${pulse} 1s ease-in-out infinite;
  }
`;

const StyledDropdown = styled(Dropdown)`
  position: relative;
  
  .dropdown-toggle {
    border-radius: 25px !important;
    padding: 12px 25px !important;
    font-weight: 600 !important;
    border: none !important;
    background: linear-gradient(135deg, #1e3c72, #2a5298) !important;
    box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3) !important;
    transition: all 0.3s ease !important;
    color: white !important;

    &:hover, &:focus, &:active {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(30, 60, 114, 0.4) !important;
      background: linear-gradient(135deg, #1e3c72, #2a5298) !important;
      border: none !important;
      color: white !important;
    }

    &:focus {
      box-shadow: 0 6px 20px rgba(30, 60, 114, 0.4) !important;
    }

    &::after {
      margin-left: 8px;
    }
  }

  .dropdown-menu {
    border: none !important;
    border-radius: 15px !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2) !important;
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.98) !important;
    padding: 15px !important;
    min-width: 220px !important;
    margin-top: 8px !important;
    z-index: 9999 !important;
    
    &.show {
      display: block !important;
      opacity: 1;
      transform: translateY(0);
      animation: dropdownSlide 0.3s ease-out;
    }

    .dropdown-item {
      border-radius: 10px !important;
      padding: 12px 20px !important;
      margin-bottom: 8px !important;
      transition: all 0.2s ease !important;
      font-weight: 500 !important;
      color: #2d3748 !important;
      border: none !important;
      display: flex !important;
      align-items: center !important;
      white-space: nowrap !important;

      &:hover, &:focus {
        background: linear-gradient(135deg, #1e3c72, #2a5298) !important;
        color: white !important;
        transform: translateX(5px) !important;
        border: none !important;
      }

      &:last-child {
        margin-bottom: 0 !important;
      }
    }
  }

  @keyframes dropdownSlide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const GlobalAccessCard = styled(Card)`
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
  backdrop-filter: blur(20px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  animation: ${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(30, 60, 114, 0.05), rgba(42, 82, 152, 0.05));
    z-index: 1;
  }

  .card-body {
    position: relative;
    z-index: 2;
    padding: 40px;
  }

  h5 {
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 15px;
  }

  .btn {
    border-radius: 20px;
    padding: 12px 30px;
    font-weight: 600;
    margin: 0 8px;
    transition: all 0.3s ease;
    border: none;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
  }
`;

const Footer = styled.footer`
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
  padding: 60px 0 30px;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .social-icons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #1e3c72, #2a5298);
      border-radius: 50%;
      color: white;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(30, 60, 114, 0.3);

      &:hover {
        transform: translateY(-5px) scale(1.1);
        box-shadow: 0 8px 25px rgba(30, 60, 114, 0.4);
      }

      i {
        font-size: 1.2rem;
      }
    }
  }

  .footer-text {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
`;

// === 🏠 COMPOSANT PRINCIPAL ===
function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const redirectToLogin = (metierId, metierNom, role) => {
    localStorage.setItem('redirectAfterLogin', `/dashboard/${role}`);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userMetier', metierNom);
    localStorage.setItem('userMetierId', metierId);
    window.location.href = '/login';
  };

  return (
    <>
      {/* === NAVBAR === */}
      <StyledNavbar
        bg={scrolled ? 'white' : 'transparent'}
        variant="light"
        expand="lg"
        fixed="top"
        className={scrolled ? 'shadow-sm' : ''}
      >
        <Container>
          <Navbar.Brand href="/">
            <i className="fas fa-graduation-cap me-2"></i>
            ISEP Academy
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-3">
              <Nav.Link
                href="/login"
                style={{
                  color: scrolled ? '#2d3748' : 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  fontSize: '1rem'
                }}
              >
                Connexion
              </Nav.Link>
              <Button
                href="/register"
                style={{
                  borderRadius: '25px',
                  padding: '10px 25px',
                  fontWeight: 600,
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
                  boxShadow: '0 4px 15px rgba(30, 60, 114, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(30, 60, 114, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(30, 60, 114, 0.3)';
                }}
              >
                Inscription
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </StyledNavbar>

      {/* === HERO SECTION === */}
      <HeroSection>
        <Container>
          <Row className="align-items-center min-vh-100">
            {/* Texte gauche */}
            <Col lg={6} className="pe-lg-5">
              <Title>
                Where The <span className="highlight">Future</span> Starts!
              </Title>
              <Subtitle>
                Découvrez l'excellence académique dans un environnement d'apprentissage innovant et stimulant.
              </Subtitle>
              <Description>
                Nos programmes d'études offrent différents niveaux de spécialisation :
                <br /><br />
                {/* <span className="specialty">
                  💻 Système d'Information • 🧪 Génie Chimique • 🏥 Sciences Infirmières<br />
                  🔬 Technologie Médicale • 💊 Pharmacologie • ✈️ Technologie Aéronautique
                </span> */}
                <br /><br />
                Et bien plus encore pour façonner votre avenir...
              </Description>
            </Col>

            {/* ⭐ IMAGE À DROITE - AVEC VOTRE IMAGE LOCALE */}
            <Col lg={6} className="d-flex justify-content-center position-relative">
              <ImageContainer>
                <div className="main-image">
                  <img
                    src={heroImage} // VOTRE IMAGE hero-image.jpg
                    alt="Étudiants collaborant dans un environnement moderne"
                    onError={(e) => {
                      // Fallback si l'image ne charge pas
                      e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                      console.warn("Image locale non trouvée, utilisation du fallback");
                    }}
                  />
                </div>
                <div className="floating-elements">
                  🎓
                </div>
                <div className="floating-elements">
                  ⚡
                </div>
              </ImageContainer>
            </Col>
          </Row>

          {/* === BOUTONS DES MÉTIERS AVEC RÔLES === */}
          <Container className="pb-5">
            <Row className="justify-content-center mb-5">
              <Col lg={8} className="text-center">
                <h2 className="text-white mb-4" style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                  Choisissez votre parcours
                </h2>
                <p className="text-white-50 mb-5">
                  Sélectionnez votre domaine d'expertise et votre rôle pour accéder à votre espace personnalisé
                </p>
              </Col>
            </Row>

            <Row className="justify-content-center g-4">
              {/* Informatique */}
              <Col lg={4} md={6}>
                <MetierCard>
                  <Card.Body className="text-center p-4">
                    <IconWrapper>
                      <i className="fas fa-laptop text-primary"></i>
                    </IconWrapper>
                    <Card.Title className="h4 mb-3" style={{ fontWeight: '700', color: '#2d3748' }}>
                      Informatique
                    </Card.Title>
                    <Card.Text className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
                      Programmation, développement web, intelligence artificielle, bases de données
                    </Card.Text>
                    <StyledDropdown drop="down">
                      <Dropdown.Toggle 
                        variant="primary" 
                        id="dropdown-informatique"
                        style={{ width: '100%' }}
                      >
                        Je suis...
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="center" style={{ width: '100%' }}>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(1, 'Informatique', 'apprenant')}
                          href="#"
                        >
                          👨‍🎓 Apprenant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(1, 'Informatique', 'enseignant')}
                          href="#"
                        >
                          👨‍🏫 Enseignant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(1, 'Informatique', 'responsable-metier')}
                          href="#"
                        >
                          👨‍💼 Responsable Métier
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </StyledDropdown>
                  </Card.Body>
                </MetierCard>
              </Col>

              {/* Réseau & Télécom */}
              <Col lg={4} md={6}>
                <MetierCard>
                  <Card.Body className="text-center p-4">
                    <IconWrapper>
                      <i className="fas fa-network-wired text-success"></i>
                    </IconWrapper>
                    <Card.Title className="h4 mb-3" style={{ fontWeight: '700', color: '#2d3748' }}>
                      Réseau & Télécom
                    </Card.Title>
                    <Card.Text className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
                      Infrastructure réseau, télécommunications, sécurité informatique
                    </Card.Text>
                    <StyledDropdown drop="down">
                      <Dropdown.Toggle 
                        variant="success" 
                        id="dropdown-reseau"
                        style={{ width: '100%' }}
                      >
                        Je suis...
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="center" style={{ width: '100%' }}>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(2, 'Réseau & Télécom', 'apprenant')}
                          href="#"
                        >
                          👨‍🎓 Apprenant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(2, 'Réseau & Télécom', 'enseignant')}
                          href="#"
                        >
                          👨‍🏫 Enseignant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(2, 'Réseau & Télécom', 'responsable-metier')}
                          href="#"
                        >
                          👨‍💼 Responsable Métier
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </StyledDropdown>
                  </Card.Body>
                </MetierCard>
              </Col>

              {/* Admin Réseau */}
              <Col lg={4} md={6}>
                <MetierCard>
                  <Card.Body className="text-center p-4">
                    <IconWrapper>
                      <i className="fas fa-shield-alt text-danger"></i>
                    </IconWrapper>
                    <Card.Title className="h4 mb-3" style={{ fontWeight: '700', color: '#2d3748' }}>
                      Admin. Réseau
                    </Card.Title>
                    <Card.Text className="text-muted mb-4" style={{ lineHeight: '1.6' }}>
                      Administration serveurs, maintenance système, supervision réseau
                    </Card.Text>
                    <StyledDropdown drop="down">
                      <Dropdown.Toggle 
                        variant="danger" 
                        id="dropdown-admin"
                        style={{ width: '100%' }}
                      >
                        Je suis...
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="center" style={{ width: '100%' }}>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(3, 'Administrateur de Réseau', 'apprenant')}
                          href="#"
                        >
                          👨‍🎓 Apprenant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(3, 'Administrateur de Réseau', 'enseignant')}
                          href="#"
                        >
                          👨‍🏫 Enseignant
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => redirectToLogin(3, 'Administrateur de Réseau', 'responsable-metier')}
                          href="#"
                        >
                          👨‍💼 Responsable Métier
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </StyledDropdown>
                  </Card.Body>
                </MetierCard>
              </Col>
            </Row>

            {/* === ACCÈS GLOBAL === */}
            <Row className="justify-content-center mt-5">
              <Col lg={8}>
                <GlobalAccessCard>
                  <Card.Body>
                    <div className="text-center">
                      <h5 style={{ fontSize: '1.5rem' }}>
                        <i className="fas fa-crown me-3" style={{ color: '#4a90e2' }}></i>
                        Accès Administratif
                      </h5>
                      <p className="text-muted mb-4">
                        Gestion complète de tous les métiers et départements
                      </p>
                      <div>
                        <Button
                          style={{
                            background: 'linear-gradient(135deg, #1e3c72, #4a90e2)',
                            border: 'none'
                          }}
                          onClick={() => redirectToLogin(null, 'Tous', 'coordinateur')}
                          className="me-3"
                        >
                          👨‍💻 Coordinateur
                        </Button>
                        <Button
                          style={{
                            background: 'linear-gradient(135deg, #2d3748, #1a202c)',
                            border: 'none'
                          }}
                          onClick={() => redirectToLogin(null, 'Tous', 'chef-departement')}
                        >
                          👨‍💼 Chef de Département
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </GlobalAccessCard>
              </Col>
            </Row>
          </Container>
        </Container>
      </HeroSection>

      {/* === FOOTER === */}
      <Footer>
        <Container>
          <div className="social-icons">
            <a href="#" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" aria-label="Facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
          <div className="footer-text">
            © 2024 ISEP Academy. Tous droits réservés. | Façonner l'avenir, une innovation à la fois.
          </div>
        </Container>
      </Footer>
    </>
  );
}

export default LandingPage;