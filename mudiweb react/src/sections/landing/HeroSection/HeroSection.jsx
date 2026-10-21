import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button/Button';
import './HeroSection.css';

export default function HeroSection({ onOpenQuote }) {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero__bg" style={{ backgroundImage: "url('/assets/images/hero_v2.webp')" }}></div>
      <div className="hero__overlay"></div>

      <div className="hero__content">
        <h1 className="hero__title">
          Mudáte sin complicaciones.<br />
          <span className="hero__title-accent">De punto A a punto B.</span>
        </h1>
        <p className="hero__subtitle">
          La primera plataforma on-demand de mudanzas y fletes de Argentina. Conductores verificados,
          seguimiento en vivo y trato directo sin intermediarios ni comisiones abusivas.
        </p>

        <div className="hero__cta-row">
          <Button
            variant="primary"
            size="lg"
            onClick={onOpenQuote}
            className="hero__btn-primary"
          >
            Cotizar Mudanza o Flete 🚀
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/panel')}
            className="hero__btn-secondary"
          >
            🚚 Panel Pro Conductores
          </Button>
        </div>

        <div className="hero__trust-row">
          <div className="hero__trust-item">
            <strong>+50.000</strong>
            <span>mudanzas realizadas</span>
          </div>
          <div className="hero__trust-divider"></div>
          <div className="hero__trust-item">
            <strong>★ 4.9</strong>
            <span>calificación promedio</span>
          </div>
          <div className="hero__trust-divider"></div>
          <div className="hero__trust-item">
            <strong>+3.000</strong>
            <span>conductores activos</span>
          </div>
        </div>
      </div>
    </section>
  );
}
