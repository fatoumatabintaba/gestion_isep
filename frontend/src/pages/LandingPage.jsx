// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Nav, Navbar, Button } from 'react-bootstrap';
import styled, { keyframes } from 'styled-components';

// === 🌟 ANIMATIONS ===
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

// === 🎨 STYLED COMPONENTS ===
const HeroSection = styled.section`
  background-color: #FFC107; /* Jaune vif en fond */
  padding: 80px 0;
  position: relative;
  min-height: 100vh;
  color: #212121;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.4), transparent 70%);
    pointer-events: none;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  color: #fff;
  margin-bottom: 10px;
  text-align: left;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.6);
  animation: ${fadeInUp} 1s ease-out;
  font-weight: 700;
  letter-spacing: 1px;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 20px;
  text-align: left;
  animations: ${fadeInUp} 1s ease-out 0.3s both;
`;

const Description = styled.p`
  color: #fff;
  text-align: left;
  margin-bottom: 30px;
  max-width: 600px;
  line-height: 1.7;
  animations: ${fadeInUp} 1s ease-out 0.6s both;
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  margin-top: 30px;
  animation: ${fadeInUp} 1s ease-out 0.9s both;
`;

const ReadMoreButton = styled(Button)`
  background-color: #FF9800 !important;
  color: white !important;
  border: none;
  padding: 12px 30px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease !important;

  &:hover {
    background-color: #F57C00 !important;
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const JoinNowButton = styled(Button)`
  background-color: #212121 !important;
  color: white !important;
  border: none;
  padding: 12px 30px;
  border-radius: 50px;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease !important;

  &:hover {
    background-color: #1a1a1a !important;
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(1px);
  }
`;

// === 🖼 IMAGE CENTRALE AVEC SURVOL ===
const ImageContainer = styled.div`
  position: relative;
  width: 400px;
  height: 350px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  border: 5px solid #fff;
  transition: transform 0.4s ease, box-shadow 0.4s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }
`;

const FloatingImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;

  ${ImageContainer}:hover & {
    transform: scale(1.05);
  }
`;

// === 🏠 COMPOSANT PRINCIPAL ===
function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  // Gérer la transparence de la navbar au scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* === NAVBAR === */}
      <Navbar
        bg={scrolled ? 'light' : 'transparent'}
        variant="light"
        expand="lg"
        fixed="top"
        className={`shadow-sm ${scrolled ? 'bg-light' : ''}`}
      >
        <Container>
          <Navbar.Brand
            href="/"
            style={{
              fontWeight: 'bold',
              fontSize: '1.4rem',
              color: scrolled ? '#212121' : '#212121',
              transition: 'color 0.3s ease'
            }}
          >
            ISEP Academy
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-3">
              <Nav.Link
                href="/login"
                style={{
                  color: scrolled ? '#212121' : '#212121',
                  fontWeight: 500,
                  transition: 'all 0.3s ease',
                  fontSize: '1.05rem'
                }}
              >
                Connexion
              </Nav.Link>
              <Button
                variant="dark"
                href="/register"
                size="sm"
                style={{ borderRadius: '30px', padding: '8px 20px' }}
              >
                Inscription
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* === HERO SECTION === */}
      <HeroSection>
        <Container>
          <Row className="align-items-center">
            {/* Texte gauche */}
            <Col lg={6}>
              <Title>Where The Future Starts!</Title>
              <Subtitle>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Subtitle>
              <Description>
                Different levels of the study
                <br />
                <span style={{ color: '#FF9800' }}>
                  Computer Information System | Chemical Engineering | Nursing<br />
                  Medical Technology | Pharmacology | Aviation Technology
                </span>
                <br />
                And many more...
              </Description>
              <ButtonGroup>
                <ReadMoreButton>Learn More</ReadMoreButton>
                <JoinNowButton>Join Now</JoinNowButton>
              </ButtonGroup>
            </Col>

            {/* Image centrale */}
            <Col lg={6} className="d-flex justify-content-center">
              <ImageContainer>
                <FloatingImage
                  src="/curriculum-team.jpg"
                  alt="Team of students and teacher"
                />
              </ImageContainer>
            </Col>
          </Row>
        </Container>
      </HeroSection>

      {/* === FOOTER === */}
      <footer className="bg-dark text-white py-4 text-center">
        <div className="social-icons">
          <a href="#"><i className="fab fa-instagram"></i></a>
          <a href="#"><i className="fab fa-facebook"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-linkedin"></i></a>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;