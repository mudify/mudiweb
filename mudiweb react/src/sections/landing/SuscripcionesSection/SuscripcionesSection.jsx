import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button/Button';
import './SuscripcionesSection.css';

export default function SuscripcionesSection() {
  const [filter, setFilter] = useState('todos'); // 'todos' | 'fletero' | 'flota' | 'enterprise'
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = async (planKey) => {
    if (!user) {
      await signInWithGoogle();
    }
    navigate('/panel');
  };

  return (
    <section className="pricing-section" id="suscripciones">
      <div className="section-container">
        <div className="pricing-header">
          <div className="pricing-badge-promo">
            <span className="pulse-dot"></span>
            <span>🎉 LANZAMIENTO EXCLUSIVO · PERÍODO DE GRACIA DE 60 DÍAS</span>
          </div>
          <h2>Comenzá a operar con 60 días 100% bonificados</h2>
          <p>
            Sumate a la red de mudanzas y fletes más moderna de Argentina. Fleteros independientes y empresas
            operan con costo $0 durante los primeros 2 meses.
          </p>

          <div className="client-exemption-pill">
            <span className="exemption-icon">📦</span>
            <span>
              <strong>¿Sos Cliente particular o comercio?</strong> Para pedir mudanzas y fletes no pagás suscripción.
              Es <strong>100% GRATIS</strong>; le abonás el valor acordado directamente a tu transportista, sin comisiones para Mudify.
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pricing-toggle-wrap">
          <div className="pricing-toggle">
            <button
              type="button"
              className={`pricing-toggle-btn ${filter === 'todos' ? 'active' : ''}`}
              onClick={() => setFilter('todos')}
            >
              ✨ Ver los 3 Planes
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${filter === 'fletero' ? 'active' : ''}`}
              onClick={() => setFilter('fletero')}
            >
              🚛 Fletero (1 Vehículo)
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${filter === 'flota' ? 'active' : ''}`}
              onClick={() => setFilter('flota')}
            >
              🚚 Flota por Vehículos (2-10)
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${filter === 'enterprise' ? 'active' : ''}`}
              onClick={() => setFilter('enterprise')}
            >
              🏢 Dashboard Completo
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="pricing-cards-grid">
          {/* PLAN 1: FLETERO PRO (1 VEHICULO) */}
          {(filter === 'todos' || filter === 'fletero') && (
            <div className="pricing-card">
              <div className="pricing-card__ribbon">60 DÍAS BONIFICADOS</div>
              <div className="pricing-card__header">
                <div className="plan-icon-wrap">🚛</div>
                <div>
                  <h3 className="plan-title">Plan Fletero Pro</h3>
                  <p className="plan-subtitle">Para fleteros y conductores con 1 vehículo propio.</p>
                </div>
              </div>

              <div className="pricing-card__price-box">
                <div className="price-main">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/ 60 días</span>
                </div>
                <div className="price-sub">
                  <span className="strike">$14.999 ARS/mes</span>
                  <span className="badge-discount">100% BONIFICADO</span>
                </div>
              </div>

              <div className="pricing-card__features">
                <p className="features-label">Condiciones del plan:</p>
                <ul>
                  <li><span className="check-icon">✓</span> <strong>1 solo vehículo activo:</strong> Furgón, pick-up o utilitario.</li>
                  <li><span className="check-icon">✓</span> <strong>60 días completos de gracia:</strong> Sin cuota de alta ni costos fijos.</li>
                  <li><span className="check-icon">✓</span> <strong>Fletes y viajes en tiempo real:</strong> Solicitudes en tu radio.</li>
                  <li><span className="check-icon">✓</span> <strong>Cobro 100% directo:</strong> 0% comisión por viaje para Mudify.</li>
                  <li><span className="check-icon">✓</span> <strong>Registro de números y viajes:</strong> Historial y estadísticas.</li>
                  <li><span className="check-icon">✓</span> <strong>Soporte prioritario:</strong> Vía WhatsApp oficial.</li>
                </ul>
              </div>

              <div className="pricing-card__cta">
                <Button
                  variant="primary"
                  size="lg"
                  className="btn-full"
                  onClick={() => handleSelectPlan('fletero_pro')}
                >
                  Activar Fletero 60 Días Gratis 🚀
                </Button>
                <span className="cta-microcopy">🔒 Sin tarjeta requerida. Activación en 1 clic.</span>
              </div>
            </div>
          )}

          {/* PLAN 2: FLOTA POR VEHICULOS (2-10) */}
          {(filter === 'todos' || filter === 'flota') && (
            <div className="pricing-card">
              <div className="pricing-card__ribbon pricing-card__ribbon--blue">FLOTA MULTI-VEHÍCULO</div>
              <div className="pricing-card__header">
                <div className="plan-icon-wrap plan-icon-wrap--blue">🚚</div>
                <div>
                  <h3 className="plan-title">Plan Flota por Vehículos</h3>
                  <p className="plan-subtitle">Para empresas y pymes con flota de 2 a 10 unidades.</p>
                </div>
              </div>

              <div className="pricing-card__price-box">
                <div className="price-main">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/ 60 días</span>
                </div>
                <div className="price-sub">
                  <span className="strike">$29.999 ARS/mes</span>
                  <span className="badge-discount">100% BONIFICADO</span>
                </div>
              </div>

              <div className="pricing-card__features">
                <p className="features-label">Escalabilidad de flota:</p>
                <ul>
                  <li><span className="check-icon">✓</span> <strong>De 2 a 10 vehículos activos:</strong> Capacidad escalable.</li>
                  <li><span className="check-icon">✓</span> <strong>Perfiles individuales por chofer:</strong> Vinculados a tu empresa.</li>
                  <li><span className="check-icon">✓</span> <strong>Asignación según capacidad:</strong> Utilitarios, furgones y camiones.</li>
                  <li><span className="check-icon">✓</span> <strong>Cobro directo sin comisiones:</strong> Facturación a tu cuenta bancaria.</li>
                  <li><span className="check-icon">✓</span> <strong>Consola centralizada:</strong> Métricas de volumen y kilómetros.</li>
                  <li><span className="check-icon">✓</span> <strong>Control documental:</strong> VTV, seguros y registro centralizados.</li>
                </ul>
              </div>

              <div className="pricing-card__cta">
                <Button
                  variant="primary"
                  size="lg"
                  className="btn-full"
                  onClick={() => handleSelectPlan('flota_vehiculos')}
                >
                  Activar Flota 60 Días Gratis 🚚
                </Button>
                <span className="cta-microcopy">🔒 Sin tarjeta requerida. Activá con tu cuenta Google.</span>
              </div>
            </div>
          )}

          {/* PLAN 3: DASHBOARD COMPLETO / ENTERPRISE */}
          {(filter === 'todos' || filter === 'enterprise') && (
            <div className="pricing-card pricing-card--featured">
              <div className="pricing-card__ribbon pricing-card__ribbon--gold">DASHBOARD COMPLETO</div>
              <div className="plan-featured-badge">⭐ MÁS COMPLETO PARA EMPRESAS</div>
              <div className="pricing-card__header">
                <div className="plan-icon-wrap plan-icon-wrap--gold">🏢</div>
                <div>
                  <h3 className="plan-title">Plan Flota Enterprise</h3>
                  <p className="plan-subtitle">Dashboard centralizado completo y telemetría avanzada.</p>
                </div>
              </div>

              <div className="pricing-card__price-box">
                <div className="price-main">
                  <span className="currency">$</span>
                  <span className="amount">0</span>
                  <span className="period">/ 60 días</span>
                </div>
                <div className="price-sub">
                  <span className="strike">$59.999 ARS/mes</span>
                  <span className="badge-discount">100% BONIFICADO</span>
                </div>
              </div>

              <div className="pricing-card__features">
                <p className="features-label">Control total y despacho avanzado:</p>
                <ul>
                  <li><span className="check-icon">✓</span> <strong>Dashboard Web Ilimitado:</strong> Torre de control y monitoreo en vivo.</li>
                  <li><span className="check-icon">✓</span> <strong>Telemetría GPS en tiempo real:</strong> Seguimiento satelital simultáneo.</li>
                  <li><span className="check-icon">✓</span> <strong>Gestión de Cuadrillas de Peones:</strong> Asignación de estiba por viaje.</li>
                  <li><span className="check-icon">✓</span> <strong>Despacho prioritario de mudanzas:</strong> Casas, deptos grandes y oficinas.</li>
                  <li><span className="check-icon">✓</span> <strong>Métricas de flota en tiempo real:</strong> Informes de rendimiento.</li>
                  <li><span className="check-icon">✓</span> <strong>Ejecutivo corporativo 24/7:</strong> Atención VIP y canal de enlace.</li>
                </ul>
              </div>

              <div className="pricing-card__cta">
                <Button
                  variant="secondary"
                  size="lg"
                  className="btn-full"
                  onClick={() => handleSelectPlan('dashboard_completo')}
                >
                  Activar Dashboard Enterprise 🏢
                </Button>
                <span className="cta-microcopy">🔒 Acceso corporativo instantáneo con Google.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
