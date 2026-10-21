import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="Mudify, inicio">
            <img src="/assets/images/logo.png" alt="Mudify Logo" className="footer__logo-img" />
            <span>Mudify</span>
          </Link>
          <p className="footer__tagline">Tu mudanza, más simple.</p>
        </div>
        <div className="footer__links">
          <div className="link-group">
            <h4>Plataforma</h4>
            <a href="#viajar">Clientes</a>
            <a href="#conducir">Conductores</a>
            <a href="#empresas">Empresas</a>
            <Link to="/panel">Torre de Control Pro</Link>
          </div>
          <div className="link-group">
            <h4>Acerca de</h4>
            <a href="#como-funciona">Cómo Funciona</a>
            <a href="#suscripciones">Suscripciones</a>
            <a href="#faq">Preguntas Frecuentes</a>
          </div>
          <div className="link-group">
            <h4>Legal</h4>
            <Link to="/terminos">Términos y condiciones</Link>
            <Link to="/privacidad">Política de Privacidad</Link>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© 2026 Mudify. Hecho 100% en Argentina. Por Argentinos.</p>
        <div className="footer__socials">
          <a href="#" aria-label="Twitter">Twitter</a>
          <a href="#" aria-label="Instagram">Instagram</a>
          <a href="#" aria-label="LinkedIn">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
