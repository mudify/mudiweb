import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import '../../styles/landing.css';
import './LandingPage.css';

export default function LandingPage() {
  const { user, profile, isAuthenticated, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation & Dropdown state
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('cliente'); // 'cliente' | 'conductor' | 'empresa'
  const [authError, setAuthError] = useState(null); // mensaje de error del proceso de auth
  const [authLoading, setAuthLoading] = useState(false);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);
  const [b2bSubmitted, setB2bSubmitted] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);

  // Business industry tabs state
  const [businessTab, setBusinessTab] = useState('flotas');

  // Pricing tabs filter
  const [pricingFilter, setPricingFilter] = useState('todos');

  // FAQ Accordion state
  const [faqOpen, setFaqOpen] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('#userChipBtn') && !e.target.closest('#userDropdownCard')) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Open auth modal if URL has ?auth=register or ?auth=login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authAction = params.get('auth');
    const roleParam = params.get('role') || 'conductor';
    if (authAction === 'register' || authAction === 'login') {
      openAuth(authAction, roleParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const openAuth = (tab = 'login', role = 'cliente') => {
    setAuthTab(tab);
    setAuthRole(role);
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await signInWithGoogle(authRole, authTab === 'register');
      setAuthModalOpen(false);
      const effectiveRole = res?.role || authRole;
      if (effectiveRole === 'conductor' || effectiveRole === 'empresa') {
        navigate('/panel');
      }
    } catch (err) {
      if (err.code === 'USER_NOT_REGISTERED') {
        // Cambiar al tab de registro y mostrar mensaje claro
        setAuthTab('register');
        setAuthError('⚠ Esta cuenta de Google no está registrada en Mudify. Elegí tu tipo de cuenta y registrate.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // El usuario cerró el popup — no es un error real
      } else {
        setAuthError('Ocurrió un error al conectar con Google. Intentá de nuevo.');
        console.error('Auth error:', err);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleB2bSubmit = (e) => {
    e.preventDefault();
    setB2bSubmitted(true);
  };

  const toggleFaq = (idx) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="landing-wrapper">
      {/* ======================================================== */}
      {/* 1. HEADER                                                */}
      {/* ======================================================== */}
      <header className="header" id="header">
        <div className="header__container">
          <div className="header__left">
            <Link to="/" className="logo" aria-label="Mudify, inicio">
              <img
                src="/assets/images/logo.png"
                alt="Mudify Logo - Mudanzas y Fletes en Argentina"
                className="logo__image"
              />
              <span>Mudify</span>
            </Link>
            <nav className={`nav-links ${mobileMenuOpen ? 'nav-links--open' : ''}`}>
              <a href="#viajar" onClick={() => setMobileMenuOpen(false)}>Para Clientes</a>
              <a href="#conducir" onClick={() => setMobileMenuOpen(false)}>Para Conductores</a>
              <a href="#empresas" onClick={() => setMobileMenuOpen(false)}>Para Empresas</a>
              <a href="#suscripciones" onClick={() => setMobileMenuOpen(false)}>Suscripciones</a>
              <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>Ayuda</a>
            </nav>
          </div>

          <div className="header__right">
            {/* Estado Visitante (Sin sesión) */}
            {!isAuthenticated ? (
              <div className="header__auth-guest" id="headerAuthGuest">
                <button
                  type="button"
                  className="btn btn--text"
                  id="headerLoginBtn"
                  onClick={() => openAuth('login')}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  id="headerRegisterBtn"
                  onClick={() => openAuth('register')}
                >
                  Registrarse
                </button>
              </div>
            ) : (
              /* Estado Autenticado */
              <div className="header__auth-user" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="user-chip-btn"
                  id="userChipBtn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                >
                  <img
                    src={user?.photoURL || '/assets/images/logo.png'}
                    alt="Avatar"
                    className="user-chip-avatar"
                  />
                  <div className="user-chip-meta">
                    <span className="user-chip-name">{user?.displayName || 'Usuario'}</span>
                    <span className="user-chip-role">
                      {profile?.role === 'empresa'
                        ? 'Empresa'
                        : (profile?.role === 'conductor'
                            ? 'Conductor Independiente'
                            : (profile?.role === 'cliente' ? 'Cliente' : 'Conductor Independiente'))}
                    </span>
                  </div>
                  <svg
                    className="user-chip-arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ transform: userDropdownOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Perfil */}
                {userDropdownOpen && (
                  <div className="user-dropdown-card" id="userDropdownCard" style={{ display: 'block' }}>
                    <div className="user-dropdown-header">
                      <img
                        src={user?.photoURL || '/assets/images/logo.png'}
                        alt="Avatar"
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-user-details">
                        <span className="dropdown-user-name">{user?.displayName || 'Usuario'}</span>
                        <span className="dropdown-user-email">{user?.email}</span>
                        <span className="dropdown-provider-tag">
                          <svg viewBox="0 0 24 24" width="12" height="12">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          Cuenta Google verificada
                        </span>
                      </div>
                    </div>
                    <div className="user-dropdown-divider"></div>
                    <div className="user-dropdown-links">
                      <Link
                        to="/panel"
                        className="dropdown-link"
                        style={{ background: '#eef2ff' }}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="dropdown-link-icon">🚚</span>
                        <span className="dropdown-link-text">
                          <strong style={{ color: '#0052cc' }}>Torre de Control PRO</strong>
                          <small>Panel de despacho y gestión web</small>
                        </span>
                      </Link>
                      <button
                        type="button"
                        className="dropdown-link"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setSubModalOpen(true);
                        }}
                      >
                        <span className="dropdown-link-icon">🎁</span>
                        <span className="dropdown-link-text">
                          <strong>Mi Suscripción</strong>
                          <small>60 días de gracia activos ($0)</small>
                        </span>
                      </button>
                      <a
                        href="#como-funciona"
                        className="dropdown-link"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="dropdown-link-icon">📍</span>
                        <span className="dropdown-link-text">
                          <strong>Seguimiento en Vivo</strong>
                          <small>Monitoreo por mapa en tiempo real</small>
                        </span>
                      </a>
                      <a
                        href="#faq"
                        className="dropdown-link"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <span className="dropdown-link-icon">💬</span>
                        <span className="dropdown-link-text">
                          <strong>Soporte Mudify</strong>
                          <small>Atención al usuario y reclamos</small>
                        </span>
                      </a>
                    </div>
                    <div className="user-dropdown-divider"></div>
                    <button
                      type="button"
                      className="dropdown-logout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              aria-label="Abrir menú"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ======================================================== */}
        {/* 2. HERO SECTION                                          */}
        {/* ======================================================== */}
        <section className="hero">
          <div className="hero__bg" style={{ backgroundImage: "url('/assets/images/hero_v2.webp')" }}></div>
          <div className="hero__overlay"></div>
          <div className="hero__content">
            <h1 className="hero__title">
              Mudáte sin complicaciones.<br />
              <span className="accent">De punto A a <br /> punto B.</span>
            </h1>
            <p className="hero__subtitle">
              La primera plataforma on-demand de mudanzas y fletes de Argentina. Conductores
              verificados, seguimiento en vivo y trato directo sin intermediarios.
            </p>
            <div className="hero__cta-row">
              <a href="#descargar-app" className="btn btn--hero-primary">Cotizar en la app</a>
              <a href="#conducir" className="btn btn--hero-ghost">Quiero conducir</a>
            </div>

            <div className="hero__trust-row">
              <div className="trust-item">
                <strong>+50.000</strong>
                <span>mudanzas realizadas</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <strong>★ 4.9</strong>
                <span>calificación promedio</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <strong>+3.000</strong>
                <span>conductores activos</span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. STATS BAND                                            */}
        {/* ======================================================== */}
        <section className="stats-band" id="estadisticas">
          <div className="stats-band__inner">
            <div className="stat-item">
              <span className="stat-item__number">50.000</span>
              <span className="stat-item__suffix">+</span>
              <p>Mudanzas realizadas</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-item__number">4.9</span>
              <p>Calificación promedio</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-item__number">3.000</span>
              <span className="stat-item__suffix">+</span>
              <p>Conductores activos</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-item__number">24</span>
              <p>Provincias cubiertas</p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. FEATURES (PARA CLIENTES)                              */}
        {/* ======================================================== */}
        <section className="features" id="viajar">
          <div className="section-container">
            <div className="section-header">
              <h2>Una nueva forma de mudarse</h2>
              <p>Diseñada desde cero para que el proceso más estresante del año se convierta en algo simple.</p>
            </div>
            <div className="features__grid">
              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#0052cc' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3>Precio fijo antes de salir</h3>
                <p>Cotizás antes de confirmar. Sin sorpresas ni negociaciones. El precio que ves es el que pagás.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#6d28d9' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>Trato y pago directo</h3>
                <p>Abonás el traslado directamente al fletero o empresa (efectivo o transferencia). Sin intermediación de fondos ni comisiones para Mudify.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#059669' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h3>Conductores verificados</h3>
                <p>Cada transportista pasa por verificación de identidad, antecedentes y revisión del vehículo.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#dc2626' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h3>Seguimiento en vivo</h3>
                <p>Seguí la ubicación exacta de tu flete en tiempo real desde tu celular. Como un GPS para tus cosas.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#ea580c' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3>Chat integrado</h3>
                <p>Coordiná detalles con el conductor sin dar tu número personal, todo desde la app.</p>
              </div>

              <div className="feature-card">
                <div className="feature-card__icon-wrap" style={{ '--icon-color': '#0891b2' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.94-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <h3>Soporte 24/7</h3>
                <p>Nuestro equipo disponible todos los días a toda hora. Siempre hay alguien del otro lado.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. HOW IT WORKS                                          */}
        {/* ======================================================== */}
        <section className="how-it-works" id="como-funciona">
          <div className="section-container">
            <div className="section-header section-header--light">
              <h2>Tu mudanza en 3 pasos</h2>
              <p>Sin llamadas, sin visitas previas, sin papeles. Solo tu teléfono.</p>
            </div>
            <div className="steps-timeline">
              <div className="step-card">
                <div className="step-card__num">01</div>
                <div className="step-card__body">
                  <h3>Publicá tu viaje</h3>
                  <p>Ingresá el origen, destino, fecha y qué tamaño de vehículo necesitás. Tardás menos de 2 minutos.</p>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className="step-card">
                <div className="step-card__num">02</div>
                <div className="step-card__body">
                  <h3>Elegí al conductor</h3>
                  <p>Recibís múltiples ofertas con precio y reputación del conductor. Vos elegís con quién ir.</p>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className="step-card">
                <div className="step-card__num">03</div>
                <div className="step-card__body">
                  <h3>Seguí el viaje en vivo</h3>
                  <p>Seguís la ruta en tiempo real y pagás recién cuando todo llega a destino en perfectas condiciones.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 6. FLEET SHOWCASE                                        */}
        {/* ======================================================== */}
        <section className="fleet">
          <div className="section-container">
            <div className="section-header">
              <h2>El vehículo exacto para cada mudanza</h2>
              <p>
                6 categorías de vehículos verificados. Desde una caja suelta hasta una mudanza interprovincial
                completa. Vos elegís cuál necesitás.
              </p>
            </div>

            <div className="fleet-showcase">
              {/* 1. Utilitario chico */}
              <div className="veh-card">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_utilitario.webp" alt="Utilitario chico Renault Kangoo" loading="lazy" />
                  <span className="veh-tag">Carga ligera</span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num">01</p>
                      <h3>Utilitario Chico</h3>
                      <p className="veh-models">Fiat Fiorino · Renault Kangoo · Peugeot Partner</p>
                    </div>
                    <div className="veh-capacity">
                      <span>600–800 kg</span>
                      <small>carga útil</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    La opción perfecta para cajas sueltas, valijas, electrodomésticos individuales como un lavarropas
                    o envíos de e-commerce. Chico, ágil y muy económico para trayectos cortos en ciudad.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">📦 Cajas sueltas</span>
                    <span className="veh-pill">🛒 E-commerce</span>
                    <span className="veh-pill">🏠 Encomiendas</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>

              {/* 2. Pick-up */}
              <div className="veh-card">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_pickup.webp" alt="Pick-up Toyota Hilux" loading="lazy" />
                  <span className="veh-tag">Carga abierta</span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num">02</p>
                      <h3>Pick-up con Lona o Cúpula</h3>
                      <p className="veh-models">Toyota Hilux · Ford Ranger · VW Amarok</p>
                    </div>
                    <div className="veh-capacity">
                      <span>~1 Tn</span>
                      <small>carga útil</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    Ideal para traslados rápidos que no requieren un furgón cerrado: colchones, muebles de jardín,
                    materiales de construcción livianos o equipos voluminosos. Resistente y versátil.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">🛏️ Colchones</span>
                    <span className="veh-pill">🌿 Muebles jardín</span>
                    <span className="veh-pill">🧱 Materiales</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>

              {/* 3. Furgón Mediano */}
              <div className="veh-card veh-card--highlight">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_furgon_mediano.webp" alt="Furgón Mediano Mercedes Sprinter" loading="lazy" />
                  <span className="veh-tag veh-tag--white" style={{ background: '#0052cc', color: 'white' }}>
                    ⭐ Más elegido
                  </span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num veh-num--blue">03</p>
                      <h3>Furgón Mediano</h3>
                      <p className="veh-models">Mercedes Sprinter Corto · Renault Master · Peugeot Expert</p>
                    </div>
                    <div className="veh-capacity veh-capacity--blue">
                      <span>1.2–1.5 Tn</span>
                      <small>8 a 11 m³</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    Nuestra unidad estrella para monoambientes y departamentos chicos. Caben sillones cortos,
                    heladeras verticales, mesas medianas y gran cantidad de cajas. Conductores con experiencia en mudanzas.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">🛋️ Monoambiente</span>
                    <span className="veh-pill">❄️ Heladera</span>
                    <span className="veh-pill">📦 +50 cajas</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>

              {/* 4. Furgón Grande */}
              <div className="veh-card">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_furgon_grande.webp" alt="Furgón Grande Maxicarga Iveco Daily" loading="lazy" />
                  <span className="veh-tag">Alta capacidad</span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num">04</p>
                      <h3>Furgón Grande / Maxicarga</h3>
                      <p className="veh-models">Iveco Daily Furgón · Sprinter Larga · Ford Transit Grande</p>
                    </div>
                    <div className="veh-capacity">
                      <span>Hasta 2 Tn</span>
                      <small>13 a 15 m³</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    Para mudanzas completas de departamentos de 1 o 2 ambientes. Permite llevar muebles altos parados y
                    enorme cantidad de cajas. La mejor relación capacidad/espacio para mudanzas medianas.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">🏠 1–2 ambientes</span>
                    <span className="veh-pill">🪑 Muebles altos</span>
                    <span className="veh-pill">📦 Gran volumen</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>

              {/* 5. Camión liviano */}
              <div className="veh-card">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_camion_liviano.webp" alt="Camión Liviano Caja Mudancera" loading="lazy" />
                  <span className="veh-tag">Casa completa</span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num">05</p>
                      <h3>Camión Liviano (Caja Mudancera)</h3>
                      <p className="veh-models">Mercedes Accelo · Iveco Daily Chasis · Hyundai HD78</p>
                    </div>
                    <div className="veh-capacity">
                      <span>3.5–5 Tn</span>
                      <small>carga útil</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    La caja mudancera aprovecha al máximo la altura y el ancho permitido, ideal para casas familiares o
                    departamentos de 3 ambientes. Puede solicitar 1 o 2 ayudantes adicionales desde la app.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">🏡 Casa familiar</span>
                    <span className="veh-pill">🛋️ 3 ambientes</span>
                    <span className="veh-pill">👷 Ayudantes extra</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>

              {/* 6. Camión pesado */}
              <div className="veh-card">
                <div className="veh-card__media veh-card__media--photo">
                  <img src="/assets/images/fleet_camion_pesado.webp" alt="Camión Mediano Pesado Larga Distancia" loading="lazy" />
                  <span className="veh-tag">Larga distancia</span>
                </div>
                <div className="veh-card__body">
                  <div className="veh-card__top">
                    <div>
                      <p className="veh-num">06</p>
                      <h3>Camión Mediano / Pesado</h3>
                      <p className="veh-models">Mercedes Atego · VW Constellation · Scania (rígidos)</p>
                    </div>
                    <div className="veh-capacity">
                      <span>+7 Tn</span>
                      <small>larga distancia</small>
                    </div>
                  </div>
                  <p className="veh-desc">
                    Para grandes residencias, traslados corporativos de oficinas enteras o fletes interprovinciales de
                    larga distancia. La solución definitiva cuando el volumen es máximo o el destino está lejos.
                  </p>
                  <div className="veh-tags-row">
                    <span className="veh-pill">🏢 Corporativo</span>
                    <span className="veh-pill">🗺️ Interprovincial</span>
                    <span className="veh-pill">📦 Máx. volumen</span>
                  </div>
                  <div className="veh-card__footer">
                    <a href="#descargar-app" className="btn btn--primary btn--sm">Pedir en la App 📲</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 7. DRIVER SPLIT SECTION                                  */}
        {/* ======================================================== */}
        <section className="split-section" id="conducir">
          <div className="split-section__image">
            <img src="/assets/images/driver.webp" alt="Conductor profesional en su furgoneta" loading="lazy" />
          </div>
          <div className="split-section__content">
            <h2 className="section-title">Generá ingresos con tu vehículo</h2>
            <p className="section-desc">
              Registrate gratis, recibí solicitudes de mudanzas en tu zona y manejá tu tiempo como quieras.
              Sin jefes, sin horarios fijos.
            </p>
            <ul className="benefit-list">
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Comisión 0% en tus viajes (ganancia 100% tuya)
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Cobro directo acordado con el cliente
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Elegís qué viajes aceptar y cuándo trabajar
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Soporte dedicado 24/7 para conductores
              </li>
            </ul>
            <a href="#descargar-app" className="btn btn--primary">Descargar App Conductor (APK)</a>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 8. MUDIFY BUSINESS (EMPRESAS)                            */}
        {/* ======================================================== */}
        <section className="b2b-section" id="empresas">
          <div className="b2b-glow b2b-glow--1"></div>
          <div className="b2b-glow b2b-glow--2"></div>
          <div className="b2b-grid-pattern"></div>

          <div className="section-container b2b-section__container">
            <div className="section-header section-header--light">
              <h2 className="b2b-title">
                Multiplicá la rentabilidad de tu flota.<br />
                <span className="accent-b2b">Más mudanzas, cero viajes vacíos.</span>
              </h2>
              <p className="b2b-subtitle">
                Si ya tenés camiones, utilitarios o personal de carga, sumate a la red Mudify Business. Recibí cientos
                de solicitudes de mudanzas verificadas, administrá a tus choferes desde un panel centralizado y cobrá
                directo a tus clientes sin intermediarios.
              </p>
            </div>

            {/* Industry Selector Tabs */}
            <div className="b2b-tabs-wrapper">
              <div className="b2b-tabs" role="tablist">
                <button
                  type="button"
                  className={`b2b-tab ${businessTab === 'flotas' ? 'active' : ''}`}
                  onClick={() => setBusinessTab('flotas')}
                >
                  <span className="tab-icon">🚛</span> Flotas de Mudanzas
                </button>
                <button
                  type="button"
                  className={`b2b-tab ${businessTab === 'larga-distancia' ? 'active' : ''}`}
                  onClick={() => setBusinessTab('larga-distancia')}
                >
                  <span className="tab-icon">🗺️</span> Larga Distancia y Retornos
                </button>
                <button
                  type="button"
                  className={`b2b-tab ${businessTab === 'residenciales' ? 'active' : ''}`}
                  onClick={() => setBusinessTab('residenciales')}
                >
                  <span className="tab-icon">🏠</span> Mudanzas con Peones
                </button>
                <button
                  type="button"
                  className={`b2b-tab ${businessTab === 'agencias' ? 'active' : ''}`}
                  onClick={() => setBusinessTab('agencias')}
                >
                  <span className="tab-icon">🤝</span> Agencias y Cooperativas
                </button>
              </div>

              {/* Dynamic Industry Panels */}
              {businessTab === 'flotas' && (
                <div className="b2b-tab-content active" id="tab-flotas">
                  <div className="industry-banner">
                    <div className="industry-banner__text">
                      <h3>Mantené tus camiones operando todos los días sin parar</h3>
                      <p>
                        No dependas únicamente del boca en boca ni gastes en publicidad que no rinde. Mudify te envía
                        clientes que ya cotizaron y están listos para contratar mudanzas completas o fletes de mediano y gran porte.
                      </p>
                      <div className="industry-stats">
                        <div className="ind-stat"><strong>+35%</strong><span>ocupación mensual de flota</span></div>
                        <div className="ind-stat"><strong>0%</strong><span>comisión de viaje para Mudify</span></div>
                        <div className="ind-stat"><strong>0 costo</strong><span>por publicar tu empresa</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {businessTab === 'larga-distancia' && (
                <div className="b2b-tab-content active" id="tab-larga-distancia">
                  <div className="industry-banner">
                    <div className="industry-banner__text">
                      <h3>Eliminá los kilómetros muertos: llená tus camiones de regreso</h3>
                      <p>
                        ¿Hacés viajes a Rosario, Córdoba, Mar del Plata, Mendoza o el interior? Nuestro sistema te conecta
                        con mudanzas y encomiendas en tu punto de destino para que nunca vuelvas con la caja vacía.
                      </p>
                      <div className="industry-stats">
                        <div className="ind-stat"><strong>$0</strong><span>combustible desperdiciado</span></div>
                        <div className="ind-stat"><strong>Retornos</strong><span>programados con anticipación</span></div>
                        <div className="ind-stat"><strong>Todo el país</strong><span>cobertura nacional</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {businessTab === 'residenciales' && (
                <div className="b2b-tab-content active" id="tab-residenciales">
                  <div className="industry-banner">
                    <div className="industry-banner__text">
                      <h3>Valorizamos tu equipo de carga, embalaje y desarme</h3>
                      <p>
                        Nuestros usuarios solicitan mudanzas con 1, 2 o más ayudantes para subir muebles por escalera o desarme
                        de placares. Cobrá tarifas premium por brindar el servicio integral de carga y descarga.
                      </p>
                      <div className="industry-stats">
                        <div className="ind-stat"><strong>Tarifa extra</strong><span>por peón y escalera</span></div>
                        <div className="ind-stat"><strong>Inventario</strong><span>detallado antes de salir</span></div>
                        <div className="ind-stat"><strong>Seguro</strong><span>cobertura opcional en viaje</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {businessTab === 'agencias' && (
                <div className="b2b-tab-content active" id="tab-agencias">
                  <div className="industry-banner">
                    <div className="industry-banner__text">
                      <h3>Tecnología de despacho para coordinar a todos tus choferes</h3>
                      <p>
                        Centralizá tus operaciones: asigná viajes a tus choferes según su ubicación GPS y disponibilidad.
                        Monitoreá el volumen de servicios, kilómetros y registro de números de tu operación desde una sola cuenta.
                      </p>
                      <div className="industry-stats">
                        <div className="ind-stat"><strong>Multi-chofer</strong><span>gestión de flota unificada</span></div>
                        <div className="ind-stat"><strong>Telemetría</strong><span>GPS en tiempo real</span></div>
                        <div className="ind-stat"><strong>Métricas</strong><span>registro de números y viajes</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2-Column Showcase */}
            <div className="b2b-showcase">
              <div className="b2b-features-grid">
                <div className="b2b-feature-card">
                  <div className="b2b-feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4>Demanda Constante de Mudanzas</h4>
                    <p>Accedé a miles de familias y oficinas cotizando traslados residenciales y cargas voluminosas todos los días en tu zona.</p>
                  </div>
                </div>

                <div className="b2b-feature-card">
                  <div className="b2b-feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                      <line x1="6" y1="15" x2="10" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <h4>Cobro Directo y 0% Comisión</h4>
                    <p>El cliente te paga directamente a vos (efectivo, transferencia o el medio que acuerden). Mudify no retiene fondos de los traslados ni cobra comisión por flete.</p>
                  </div>
                </div>

                <div className="b2b-feature-card">
                  <div className="b2b-feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <rect x="1" y="3" width="15" height="13" />
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 16 8" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </div>
                  <div>
                    <h4>Panel de Control de Flota</h4>
                    <p>Cargá tus camiones y utilitarios, organizá a tu personal de peones y asigná servicios a tus choferes con un solo clic.</p>
                  </div>
                </div>

                <div className="b2b-feature-card">
                  <div className="b2b-feature-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <h4>Soporte &amp; Asesor de Alianzas</h4>
                    <p>Un ejecutivo dedicado para ayudarte a configurar tu flota, optimizar tarifas y resolver contingencias en ruta 24/7.</p>
                  </div>
                </div>
              </div>

              {/* Console Mockup */}
              <div className="b2b-console-card">
                <div className="console-header">
                  <div className="console-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="console-title">panel.mudify.com.ar/flota</span>
                  <span className="console-badge">Empresa Partner</span>
                </div>
                <div className="console-body">
                  <div className="console-metric-row">
                    <div className="console-metric">
                      <small>Camiones activos</small>
                      <strong>8 en ruta</strong>
                    </div>
                    <div className="console-metric">
                      <small>Viajes este mes</small>
                      <strong className="text-blue">148 viajes</strong>
                    </div>
                    <div className="console-metric">
                      <small>Facturación semanal</small>
                      <strong className="text-green">$5.420.000</strong>
                    </div>
                  </div>

                  <div className="console-trip-card">
                    <div className="trip-top">
                      <span className="trip-status-pulse">🟢 En servicio</span>
                      <span className="trip-id">Viaje #MDZ-4819</span>
                    </div>
                    <p className="trip-route"><strong>Recoleta (CABA)</strong> → <strong>Nordelta (Tigre)</strong></p>
                    <div className="trip-driver">
                      <span>🚛 Camión #03 (Iveco Daily Mudancero) · Chofer: Miguel R. + 2 Ayudantes</span>
                    </div>
                    <div className="trip-progress-bar">
                      <div className="trip-progress-fill" style={{ width: '80%' }}></div>
                    </div>
                    <div className="trip-meta-row">
                      <small>Carga completada · En viaje a destino</small>
                      <small>Valor pactado: $185.000 (Cobro directo)</small>
                    </div>
                  </div>

                  <div className="console-cta-row">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm b2b-open-modal"
                      onClick={() => {
                        setB2bSubmitted(false);
                        setB2bModalOpen(true);
                      }}
                    >
                      Registrar Empresa de Mudanzas
                    </button>
                    <a
                      href="https://wa.me/5491100000000?text=Hola%20Mudify%2C%20tengo%20una%20empresa%20de%20mudanzas%20y%20quiero%20sumar%20mi%20flota"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--ghost-white btn--sm"
                    >
                      💬 WhatsApp Comercial
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Banner */}
            <div className="b2b-action-banner">
              <div className="b2b-action-text">
                <h3>¿Tenés una empresa de mudanzas o fletes y querés sumar tu flota?</h3>
                <p>Validamos tu documentación en 24hs para que tus choferes comiencen a recibir pedidos de inmediato.</p>
              </div>
              <div className="b2b-action-buttons">
                <button
                  type="button"
                  className="btn btn--secondary btn--large b2b-open-modal"
                  onClick={() => {
                    setB2bSubmitted(false);
                    setB2bModalOpen(true);
                  }}
                >
                  Asociar mi empresa de mudanzas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 9. SUSCRIPCIONES & PERÍODO DE GRACIA (60 DÍAS)           */}
        {/* ======================================================== */}
        <section className="pricing-section" id="suscripciones">
          <div className="section-container">
            <div className="section-header text-center">
              <div className="pricing-badge-promo">
                <span className="pulse-dot"></span>
                <span>🎉 LANZAMIENTO EXCLUSIVO · PERÍODO DE GRACIA DE 60 DÍAS</span>
              </div>
              <h2 className="section-title">Comenzá a operar con 60 días 100% bonificados</h2>
              <p className="section-desc" style={{ margin: '0 auto 1.5rem' }}>
                Sumate a la plataforma de mudanzas y fletes más moderna del país. Fleteros independientes y empresas
                de mudanzas operan con costo $0 durante los primeros 2 meses para probar y hacer crecer la red.
              </p>

              <div className="client-exemption-pill">
                <span className="exemption-icon">📦</span>
                <span>
                  <strong>¿Sos Cliente particular o comercio?</strong> Para pedir mudanzas y fletes no pagás suscripción.
                  Es <strong>100% GRATIS</strong>; le abonás el valor del traslado directamente a tu chofer o empresa acordada,
                  sin comisiones para Mudify.
                </span>
              </div>
            </div>

            {/* Pricing Toggle */}
            <div className="pricing-toggle-wrap">
              <div className="pricing-toggle" role="tablist">
                <button
                  type="button"
                  className={`pricing-toggle-btn ${pricingFilter === 'todos' ? 'active' : ''}`}
                  onClick={() => setPricingFilter('todos')}
                >
                  <span>✨ Ver los 3 Planes</span>
                </button>
                <button
                  type="button"
                  className={`pricing-toggle-btn ${pricingFilter === 'planFleteros' ? 'active' : ''}`}
                  onClick={() => setPricingFilter('planFleteros')}
                >
                  <span>🚛 Fletero (1 Vehículo)</span>
                </button>
                <button
                  type="button"
                  className={`pricing-toggle-btn ${pricingFilter === 'planFlotaVehiculos' ? 'active' : ''}`}
                  onClick={() => setPricingFilter('planFlotaVehiculos')}
                >
                  <span>🚚 Flota por Vehículos</span>
                </button>
                <button
                  type="button"
                  className={`pricing-toggle-btn ${pricingFilter === 'planDashboardCompleto' ? 'active' : ''}`}
                  onClick={() => setPricingFilter('planDashboardCompleto')}
                >
                  <span>🏢 Dashboard Completo</span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="pricing-cards-container">
              {/* PLAN 1: FLETERO INDEPENDIENTE */}
              {(pricingFilter === 'todos' || pricingFilter === 'planFleteros') && (
                <div className="pricing-card active" id="planFleteros">
                  <div className="pricing-card__ribbon">60 DÍAS BONIFICADOS</div>
                  <div className="pricing-card__header">
                    <div className="plan-icon-wrap">🚛</div>
                    <div className="plan-title-wrap">
                      <h3>Plan Fletero Pro</h3>
                      <p>Para fleteros y conductores con 1 vehículo (furgón, pick-up o utilitario).</p>
                    </div>
                  </div>

                  <div className="pricing-card__price-box">
                    <div className="price-main">
                      <span className="currency">$</span>
                      <span className="amount">0</span>
                      <span className="period">/ por 60 días</span>
                    </div>
                    <div className="price-sub">
                      <span className="strike">$14.999 ARS/mes</span>
                      <span className="badge-discount">100% OFF primer bimestre</span>
                    </div>
                  </div>

                  <div className="pricing-card__divider"></div>

                  <div className="pricing-card__features">
                    <p className="features-label">Todo incluido para operar:</p>
                    <ul>
                      <li><span className="check-icon">✓</span> <span><strong>1 vehículo activo:</strong> Furgón, utilitario, flete o pick-up.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>60 días completos de gracia:</strong> Sin cuota de alta ni costos fijos.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Viajes y fletes en tiempo real:</strong> Solicitudes en tu radio de trabajo.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Cobro 100% directo con el cliente:</strong> Abonás o cobrás sin intermediarios. 0% comisión para Mudify.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Registro de números y viajes:</strong> Historial y estadísticas de tus traslados completados.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Retornos de viaje con carga:</strong> Aprovechá el regreso en tu zona.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Soporte operativo prioritario:</strong> Asistencia directa por WhatsApp.</span></li>
                    </ul>
                  </div>

                  <div className="pricing-card__cta">
                    <button
                      type="button"
                      className="btn btn--primary btn--full btn--large btn-activate-trial"
                      onClick={() => openAuth('register', 'conductor')}
                    >
                      Activar Fletero 60 Días Gratis 🚀
                    </button>
                    <span className="cta-microcopy">🔒 Sin tarjeta requerida. Activá en 1 clic con Google.</span>
                  </div>
                </div>
              )}

              {/* PLAN 2: FLOTA POR VEHICULOS */}
              {(pricingFilter === 'todos' || pricingFilter === 'planFlotaVehiculos') && (
                <div className="pricing-card active" id="planFlotaVehiculos">
                  <div className="pricing-card__ribbon pricing-card__ribbon--blue">FLOTA MULTI-VEHÍCULO · 60 DÍAS</div>
                  <div className="pricing-card__header">
                    <div className="plan-icon-wrap plan-icon-wrap--blue">🚚</div>
                    <div className="plan-title-wrap">
                      <h3>Plan Flota por Vehículos</h3>
                      <p>Para empresas y transportistas con flota de 2 a 10 camiones o utilitarios.</p>
                    </div>
                  </div>

                  <div className="pricing-card__price-box">
                    <div className="price-main">
                      <span className="currency">$</span>
                      <span className="amount">0</span>
                      <span className="period">/ por 60 días</span>
                    </div>
                    <div className="price-sub">
                      <span className="strike">$29.999 ARS/mes</span>
                      <span className="badge-discount">100% BONIFICADO 2 meses</span>
                    </div>
                  </div>

                  <div className="pricing-card__divider"></div>

                  <div className="pricing-card__features">
                    <p className="features-label">Escalabilidad para tu flota:</p>
                    <ul>
                      <li><span className="check-icon">✓</span> <span><strong>Suscripción por cantidad de vehículos:</strong> De 2 a 10 unidades activas.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Perfiles individuales por chofer:</strong> Vinculados a tu cuenta empresarial.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Asignación según capacidad:</strong> Utilitarios, furgones y camiones con caja.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Cobro directo a tu empresa:</strong> Pago directo a tus choferes sin intermediación de fondos.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Registro centralizado de números:</strong> Métricas de volumen, km y estadísticas.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Retornos interprovinciales:</strong> Cargas coordinadas para todos tus choferes.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Control documental de flota:</strong> VTV, seguros y registro centralizados.</span></li>
                    </ul>
                  </div>

                  <div className="pricing-card__cta">
                    <button
                      type="button"
                      className="btn btn--primary btn--full btn--large btn-activate-trial"
                      onClick={() => openAuth('register', 'empresa')}
                    >
                      Activar Flota 60 Días Gratis 🚚
                    </button>
                    <span className="cta-microcopy">🔒 Sin tarjeta requerida. Activá con tu cuenta de Google.</span>
                  </div>
                </div>
              )}

              {/* PLAN 3: DASHBOARD COMPLETO / ENTERPRISE */}
              {(pricingFilter === 'todos' || pricingFilter === 'planDashboardCompleto') && (
                <div className="pricing-card pricing-card--featured active" id="planDashboardCompleto">
                  <div className="pricing-card__ribbon pricing-card__ribbon--gold">DASHBOARD COMPLETO · 60 DÍAS</div>
                  <div className="plan-featured-badge">⭐ MÁS COMPLETO PARA EMPRESAS</div>
                  <div className="pricing-card__header">
                    <div className="plan-icon-wrap plan-icon-wrap--gold">🏢</div>
                    <div className="plan-title-wrap">
                      <h3>Plan Flota Enterprise</h3>
                      <p>Dashboard centralizado completo para empresas de mudanzas y logística pesada.</p>
                    </div>
                  </div>

                  <div className="pricing-card__price-box">
                    <div className="price-main">
                      <span className="currency">$</span>
                      <span className="amount">0</span>
                      <span className="period">/ por 60 días</span>
                    </div>
                    <div className="price-sub">
                      <span className="strike">$59.999 ARS/mes</span>
                      <span className="badge-discount">100% BONIFICADO 2 meses</span>
                    </div>
                  </div>

                  <div className="pricing-card__divider"></div>

                  <div className="pricing-card__features">
                    <p className="features-label">Control total y despacho avanzado:</p>
                    <ul>
                      <li><span className="check-icon">✓</span> <span><strong>Dashboard Web Centralizado Full:</strong> Torre de control y monitoreo en vivo.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Telemetría GPS en tiempo real:</strong> Seguimiento satelital simultáneo de la flota.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Gestión de Cuadrillas de Peones:</strong> Asignación de estibaje y carga por viaje.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Despacho prioritario de mudanzas:</strong> Casas, deptos grandes y oficinas.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Consola de Registro de Números y Métricas:</strong> Informes de rendimiento en vivo.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Cobro directo sin comisiones:</strong> 100% del valor va íntegro a tu empresa.</span></li>
                      <li><span className="check-icon">✓</span> <span><strong>Ejecutivo corporativo dedicado 24/7:</strong> Atención VIP y soporte preferencial.</span></li>
                    </ul>
                  </div>

                  <div className="pricing-card__cta">
                    <button
                      type="button"
                      className="btn btn--primary btn--full btn--large btn-activate-trial"
                      onClick={() => openAuth('register', 'empresa')}
                    >
                      Activar Dashboard 60 Días 🏢
                    </button>
                    <span className="cta-microcopy">🔒 Sin tarjeta requerida. Activá con tu cuenta de Google.</span>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Banner */}
            <div className="pricing-faq-banner">
              <div className="pricing-faq-banner__icon">💡</div>
              <div className="pricing-faq-banner__text">
                <h4>¿Qué ocurre al cumplirse los 60 días de gracia?</h4>
                <p>Te notificaremos con 7 días de anticipación para que elijas continuar con tu suscripción mensual fija o dar de baja el servicio sin costo alguno ni penalizaciones.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 10. TESTIMONIALS                                         */}
        {/* ======================================================== */}
        <section className="testimonials">
          <div className="section-container">
            <div className="section-header">
              <h2>Lo que dicen nuestros usuarios</h2>
              <p>Miles de personas y empresas confían en Mudify para sus traslados día a día.</p>
            </div>
            <div className="testimonials__grid">
              <div className="testimonial-card">
                <div className="testimonial-card__stars">★★★★★</div>
                <p className="testimonial-card__quote">
                  "Excelente servicio. El chofer llegó puntual con la Fiorino y me ayudó a cargar todo el monoambiente. Súper recomendable!"
                </p>
                <div className="testimonial-card__author">
                  <div className="avatar-circle" style={{ background: '#e0f2fe' }}>👩</div>
                  <div>
                    <strong>Valeria M.</strong>
                    <span>Palermo, CABA</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-card__stars">★★★★★</div>
                <p className="testimonial-card__quote">
                  "Mudify me cambió la vida. Sin buscar clientes, la app me manda los pedidos y cobro directo. No hay vuelta atrás."
                </p>
                <div className="testimonial-card__author">
                  <div className="avatar-circle" style={{ background: '#dcfce7' }}>🧔</div>
                  <div>
                    <strong>Carlos D.</strong>
                    <span>Transportista — GBA Norte</span>
                  </div>
                </div>
              </div>

              <div className="testimonial-card">
                <div className="testimonial-card__stars">★★★★★</div>
                <p className="testimonial-card__quote">
                  "Que pueda ver en el mapa a dónde están mis cosas en tiempo real fue lo que más me tranquilizó. Acordar el pago directo con el chofer sin comisiones es un golazo."
                </p>
                <div className="testimonial-card__author">
                  <div className="avatar-circle" style={{ background: '#fef3c7' }}>👨‍💻</div>
                  <div>
                    <strong>Martín P.</strong>
                    <span>San Isidro, GBA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 11. APP DOWNLOAD                                         */}
        {/* ======================================================== */}
        <section className="app-download" id="descargar-app">
          <div className="app-download__glow-bg"></div>
          <div className="app-download__container">
            <div className="app-download__content">
              <h2 className="app-download__title">Llevá Mudify en tu bolsillo</h2>
              <p className="app-download__desc">
                La experiencia completa de mudanza: cotizá en segundos, elegí a tu conductor, seguí el viaje en vivo
                por GPS y pagá sin efectivo.
              </p>

              <div className="app-features-grid">
                <div className="app-feature-item">
                  <div className="app-feature-icon">📍</div>
                  <div>
                    <h4>GPS en tiempo real</h4>
                    <p>Seguimiento en mapa segundo a segundo.</p>
                  </div>
                </div>
                <div className="app-feature-item">
                  <div className="app-feature-icon">⚡</div>
                  <div>
                    <h4>Cotización al instante</h4>
                    <p>Precios claros antes de confirmar.</p>
                  </div>
                </div>
                <div className="app-feature-item">
                  <div className="app-feature-icon">👨‍✈️</div>
                  <div>
                    <h4>Choferes verificados</h4>
                    <p>Identidad y vehículos 100% auditados.</p>
                  </div>
                </div>
                <div className="app-feature-item">
                  <div className="app-feature-icon">💬</div>
                  <div>
                    <h4>Chat seguro</h4>
                    <p>Comunicación sin revelar tu teléfono.</p>
                  </div>
                </div>
              </div>

              <div className="download-box">
                <h4 className="download-box__title">Descargá la app para usuarios o conductores:</h4>
                <div className="app-stores-v2">
                  <a href="#descargar-app" className="store-badge-v2 store-badge-v2--apple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.31c.64-.78 1.08-1.85.96-2.93-.93.04-2.07.62-2.74 1.4-.59.68-1.11 1.77-.97 2.83 1.05.08 2.11-.52 2.75-1.3" />
                    </svg>
                    <div>
                      <small>Consíguelo en el</small>
                      <strong>App Store</strong>
                    </div>
                  </a>

                  <a href="#descargar-app" className="store-badge-v2 store-badge-v2--play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.6 2.25c-.2 0-.4.07-.55.23-.23.23-.23.61 0 .84l9.16 9.16L3.05 21.64c-.23.23-.23.61 0 .84.15.16.35.23.55.23.2 0 .4-.07.55-.23l9.58-9.58 3.51 3.51-12.09 6.8c-.57.32-1.25-.09-1.25-.74V2.99c0-.65.68-1.06 1.25-.74l12.09 6.8-3.51 3.51L4.15 2.48c-.15-.16-.35-.23-.55-.23z" />
                    </svg>
                    <div>
                      <small>Disponible en</small>
                      <strong>Google Play</strong>
                    </div>
                  </a>

                  <a href="#descargar-app" className="store-badge-v2 store-badge-v2--apk">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <div>
                      <small>Descarga Directa</small>
                      <strong>Archivo APK (v2.4)</strong>
                    </div>
                  </a>
                </div>

                <div className="qr-scanner-card">
                  <div className="qr-code-box">
                    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#0052cc" strokeWidth="1.8">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="3" height="3" fill="#0052cc" />
                      <rect x="14" y="7" width="3" height="3" fill="#0052cc" />
                      <rect x="7" y="14" width="3" height="3" fill="#0052cc" />
                      <rect x="14" y="14" width="3" height="3" fill="#0052cc" />
                    </svg>
                  </div>
                  <div className="qr-text">
                    <strong>Escaneá con tu celular</strong>
                    <p>Apuntá la cámara de tu teléfono para instalar la app o el APK al instante.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-download__mockup">
              <div className="mockup-wrapper">
                <div className="mockup-widget widget-top">
                  <span className="widget-status">🟢 En Camino</span>
                  <p>Renault Kangoo · AB 123 CD</p>
                  <small>Llegada estimada: 4 min</small>
                </div>

                <div className="mockup-widget widget-bottom">
                  <span className="star-icon">⭐ 4.9 / 5.0</span>
                  <small>+12.000 opiniones reales</small>
                </div>

                <div className="phone-frame">
                  <img src="/assets/images/app_mockup.webp" alt="App móvil de Mudify" className="app-image" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 12. FAQ                                                  */}
        {/* ======================================================== */}
        <section className="faq-section" id="faq">
          <div className="section-container section-container--narrow">
            <div className="section-header">
              <h2>¿Tenés alguna duda?</h2>
            </div>
            <div className="faq-accordion">
              <div className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(0)}
                >
                  ¿Cómo se calcula el precio del viaje? <span className="icon">{faqOpen === 0 ? '−' : '+'}</span>
                </button>
                {faqOpen === 0 && (
                  <div className="faq-answer" style={{ display: 'block' }}>
                    <p>
                      El precio se calcula directamente en la app según la distancia, el tipo de vehículo y los
                      ayudantes solicitados. Ves el monto transparente antes de confirmar.
                    </p>
                  </div>
                )}
              </div>

              <div className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(1)}
                >
                  ¿Cómo me registro como conductor? <span className="icon">{faqOpen === 1 ? '−' : '+'}</span>
                </button>
                {faqOpen === 1 && (
                  <div className="faq-answer" style={{ display: 'block' }}>
                    <p>
                      Descargá la app de conductores o hacé clic en "Quiero conducir", completá el formulario
                      con tus datos y documentación del vehículo. Validamos todo en 24hs.
                    </p>
                  </div>
                )}
              </div>

              <div className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(2)}
                >
                  ¿Cómo se realiza el pago del viaje o mudanza? <span className="icon">{faqOpen === 2 ? '−' : '+'}</span>
                </button>
                {faqOpen === 2 && (
                  <div className="faq-answer" style={{ display: 'block' }}>
                    <p>
                      El pago del flete o mudanza se efectúa directamente entre vos y el conductor o empresa (efectivo,
                      transferencia o el medio acordado). Mudify funciona bajo un modelo de suscripción mensual para conductores
                      y empresas; no administra fondos de traslados ni descuenta comisiones por viaje.
                    </p>
                  </div>
                )}
              </div>

              <div className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(3)}
                >
                  ¿En qué ciudades opera Mudify? <span className="icon">{faqOpen === 3 ? '−' : '+'}</span>
                </button>
                {faqOpen === 3 && (
                  <div className="faq-answer" style={{ display: 'block' }}>
                    <p>
                      Operamos en Buenos Aires (CABA y GBA), Rosario, Córdoba, La Plata y Mendoza, con expansión a nuevas
                      ciudades cada mes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 13. FINAL CTA                                            */}
        {/* ======================================================== */}
        <section className="final-cta" style={{ backgroundImage: "url('/assets/images/cta_bg.webp')" }}>
          <div className="final-cta__overlay"></div>
          <div className="final-cta__container">
            <h2>¿Listo para tu próxima mudanza?</h2>
            <p>Descargá la app y cotizá en minutos. Miles de conductores verificados esperando tu pedido.</p>
            <div className="final-cta__actions">
              <a href="#descargar-app" className="btn btn--hero-primary">Descargar la App / APK 📲</a>
              <a href="#conducir" className="btn btn--hero-ghost">Quiero conducir</a>
            </div>
          </div>
        </section>
      </main>

      {/* ======================================================== */}
      {/* 14. FOOTER                                               */}
      {/* ======================================================== */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__brand">
            <Link to="/" className="logo logo--white" aria-label="Mudify, inicio">
              <img src="/assets/images/logo.png" alt="" className="logo__image" />
              <span>Mudify</span>
            </Link>
            <p>Tu mudanza, más simple.</p>
          </div>
          <div className="footer__links">
            <div className="link-group">
              <h4>Plataforma</h4>
              <a href="#viajar">Clientes</a>
              <a href="#conducir">Conductores</a>
              <a href="#empresas">Empresas</a>
            </div>
            <div className="link-group">
              <h4>Acerca de</h4>
              <a href="#como-funciona">Cómo Funciona</a>
              <a href="#suscripciones">Suscripciones</a>
              <Link to="/panel">Torre de Control PRO</Link>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <Link to="/terminos">Términos y condiciones</Link>
              <Link to="/privacidad">Privacidad</Link>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 Mudify. Hecho 100% en Argentina. Por Argentinos.</p>
          <div className="socials">
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 15. MODALS                                               */}
      {/* ======================================================== */}

      {/* B2B MODAL DIALOG */}
      {b2bModalOpen && (
        <div
          className="b2b-modal-overlay open"
          style={{ display: 'flex', opacity: 1, visibility: 'visible', zIndex: 99999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setB2bModalOpen(false);
          }}
        >
          <div className="b2b-modal-window">
            <button
              type="button"
              className="b2b-modal-close"
              onClick={() => setB2bModalOpen(false)}
              aria-label="Cerrar modal"
            >
              &times;
            </button>
            <div className="b2b-modal-header">
              <h3>Asociá tu Empresa de Mudanzas</h3>
              <p>Completá los datos de tu empresa o flota. Un asesor de operaciones te contactará para habilitar a tus vehículos y comenzar a recibir viajes calificados.</p>
            </div>

            {!b2bSubmitted ? (
              <form className="b2b-modal-form" onSubmit={handleB2bSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="empresaNombre">Nombre de la Empresa de Mudanzas *</label>
                    <input type="text" id="empresaNombre" required placeholder="Ej: Transportes & Mudanzas del Sur" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="empresaFlota">Tamaño de Flota *</label>
                    <select id="empresaFlota" required defaultValue="">
                      <option value="" disabled>Seleccioná cantidad de unidades</option>
                      <option value="1-2">1 a 2 vehículos (utilitarios / furgón)</option>
                      <option value="3-5">3 a 5 camiones / furgones</option>
                      <option value="6-10">6 a 10 camiones mudanceros</option>
                      <option value="+10">Más de 10 camiones (Gran flota)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="empresaPeones">¿Contás con personal de carga (peones)? *</label>
                    <select id="empresaPeones" required defaultValue="si">
                      <option value="si">Sí, contamos con peones propios</option>
                      <option value="chofer-ayudante">Chofer + 1 ayudante</option>
                      <option value="solo-chofer">Solo chofer (sin peones)</option>
                      <option value="segun-viaje">A demanda según el servicio</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="empresaZona">Zona de cobertura principal *</label>
                    <select id="empresaZona" required defaultValue="caba-gba">
                      <option value="caba-gba">CABA y GBA</option>
                      <option value="interior-bsas">Provincia de Buenos Aires</option>
                      <option value="nacional">Larga Distancia / Todo el País</option>
                      <option value="interior">Córdoba / Rosario / Mendoza</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="empresaContacto">Persona de Contacto *</label>
                    <input type="text" id="empresaContacto" required placeholder="Nombre y Apellido" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="empresaTelefono">WhatsApp / Teléfono *</label>
                    <input type="tel" id="empresaTelefono" required placeholder="+54 9 11 1234-5678" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="empresaEmail">Email de contacto *</label>
                  <input type="email" id="empresaEmail" required placeholder="contacto@tuempresa.com" />
                </div>

                <button type="submit" className="btn btn--primary btn--full">
                  Solicitar Alta de Empresa de Mudanzas 🚀
                </button>
                <p className="form-disclaimer">
                  ¿Querés comunicarte de inmediato?{' '}
                  <a
                    href="https://wa.me/5491100000000?text=Hola%20Mudify%2C%20tengo%20una%20empresa%20de%20mudanzas%20y%20quiero%20asociar%20mi%20flota"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escribinos directo a WhatsApp Comercial
                  </a>.
                </p>
              </form>
            ) : (
              <div className="b2b-form-success" style={{ display: 'block' }}>
                <div className="success-icon">✅</div>
                <h4>¡Solicitud recibida correctamente!</h4>
                <p>Un ejecutivo de cuentas corporativo se comunicará por WhatsApp o email en menos de 2 horas hábiles.</p>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setB2bModalOpen(false)}
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTH MODAL DIALOG */}
      {authModalOpen && (
        <div
          className="auth-modal-overlay open"
          id="authModal"
          style={{ display: 'flex', opacity: 1, visibility: 'visible', zIndex: 99999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthModalOpen(false);
          }}
        >
          <div className="auth-modal-window">
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setAuthModalOpen(false)}
              aria-label="Cerrar ventana"
            >
              &times;
            </button>

            <div className="auth-modal-header">
              <div className="auth-modal-brand">
                <img src="/assets/images/logo.png" alt="Mudify Logo" className="auth-modal-logo" />
                <span>Mudify</span>
              </div>
              <h3>{authTab === 'register' ? 'Creá tu cuenta en Mudify' : 'Accedé a Mudify'}</h3>
              <p>
                {authTab === 'register'
                  ? 'Elegí tu perfil y vinculá tu cuenta de Google en 1 clic.'
                  : 'Iniciá sesión de forma rápida y segura con tu cuenta de Google.'}
              </p>
            </div>

            <div className="auth-modal-tabs" role="tablist">
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthTab('register'); setAuthError(null); }}
              >
                Registrarse
              </button>
            </div>

            {/* Error de autenticación */}
            {authError && (
              <div className="auth-error-box">
                <span>{authError}</span>
              </div>
            )}

            <div className="auth-modal-body">
              {/* Role selector (only for register) */}
              {authTab === 'register' && (
                <div className="auth-role-section" style={{ display: 'block' }}>
                  <span className="auth-role-label">1. ¿Qué tipo de cuenta querés crear?</span>
                  <div className="auth-role-grid">
                    <label
                      className={`auth-role-card ${authRole === 'cliente' ? 'active' : ''}`}
                      onClick={() => setAuthRole('cliente')}
                    >
                      <input type="radio" name="authRole" value="cliente" checked={authRole === 'cliente'} readOnly className="auth-role-radio" />
                      <span className="auth-role-badge">📦 Cliente</span>
                      <span className="auth-role-desc">Quiero mudarme, pedir fletes o envíos</span>
                    </label>
                    <label
                      className={`auth-role-card ${authRole === 'conductor' ? 'active' : ''}`}
                      onClick={() => setAuthRole('conductor')}
                    >
                      <input type="radio" name="authRole" value="conductor" checked={authRole === 'conductor'} readOnly className="auth-role-radio" />
                      <span className="auth-role-badge">🚛 Conductor</span>
                      <span className="auth-role-desc">Tengo vehículo propio y busco viajes</span>
                    </label>
                    <label
                      className={`auth-role-card ${authRole === 'empresa' ? 'active' : ''}`}
                      onClick={() => setAuthRole('empresa')}
                    >
                      <input type="radio" name="authRole" value="empresa" checked={authRole === 'empresa'} readOnly className="auth-role-radio" />
                      <span className="auth-role-badge">🏢 Empresa</span>
                      <span className="auth-role-desc">Flota con camiones y peones</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Botón Principal Google Sign-in */}
              <div className="auth-google-cta">
                <span className="auth-google-prompt">
                  {authTab === 'register' ? '2. Registro instantáneo con Google:' : 'Acceso oficial con Google:'}
                </span>
                <button
                  type="button"
                  className="btn--google"
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{authTab === 'register' ? 'Registrarme con Google' : 'Continuar con Google'}</span>
                </button>
                <div className="google-trust-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Autenticación oficial y segura vía Google OAuth 2.0</span>
                </div>
              </div>

              <div className="auth-google-benefits">
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check">✓</span>
                  <span>Acceso instantáneo en 1 clic sin contraseñas que recordar</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check">✓</span>
                  <span>Identidad verificada y protección antifraude con Google</span>
                </div>
                <div className="auth-benefit-item">
                  <span className="auth-benefit-check">✓</span>
                  <span>Seguimiento y cotizaciones sincronizados en tiempo real</span>
                </div>
              </div>
            </div>

            <div className="auth-modal-footer">
              <p>
                Al continuar, confirmás que aceptás nuestros{' '}
                <Link to="/terminos" target="_blank">Términos y Condiciones</Link> y la{' '}
                <Link to="/privacidad" target="_blank">Política de Privacidad</Link> de Mudify.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION STATUS MODAL */}
      {subModalOpen && (
        <div
          className="auth-modal-overlay open"
          style={{ display: 'flex', opacity: 1, visibility: 'visible', zIndex: 99999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSubModalOpen(false);
          }}
        >
          <div className="auth-modal-window subscription-modal-window">
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setSubModalOpen(false)}
              aria-label="Cerrar ventana"
            >
              &times;
            </button>

            <div className="sub-modal-header">
              <div className="sub-badge-active">
                <span className="pulse-dot"></span>
                <span>PERÍODO DE GRACIA ACTIVO</span>
              </div>
              <h3>Tu Plan en Mudify</h3>
              <p>Plan Fletero Pro</p>
            </div>

            <div className="sub-modal-body">
              <div className="grace-period-card">
                <div className="grace-period-top">
                  <div className="grace-days-left">
                    <strong>60</strong>
                    <span>días restantes bonificados</span>
                  </div>
                  <div className="grace-cost-badge">
                    <span>Costo actual:</span>
                    <strong>$0 ARS</strong>
                  </div>
                </div>
                <div className="grace-progress-bar">
                  <div className="grace-progress-fill" style={{ width: '100%' }}></div>
                </div>
                <div className="grace-period-dates">
                  <span>Activado: <strong>Hoy</strong></span>
                  <span>Fin de gracia: <strong>En 60 días</strong></span>
                </div>
              </div>

              <div className="sub-benefits-list">
                <h4>Beneficios de tu cuenta:</h4>
                <ul>
                  <li><span className="check">✓</span> 0% de costo de suscripción durante los primeros 60 días</li>
                  <li><span className="check">✓</span> Notificaciones y cotizaciones de viajes en tiempo real</li>
                  <li><span className="check">✓</span> Cobro 100% directo con el cliente (0% comisión por viaje)</li>
                  <li><span className="check">✓</span> Registro de números y estadísticas operativas de fletes</li>
                  <li><span className="check">✓</span> Asistencia y soporte preferencial por WhatsApp</li>
                </ul>
              </div>

              <div className="sub-info-notice">
                <span className="info-icon">💡</span>
                <p>Estás disfrutando de la bonificación de lanzamiento de Mudify. Podés realizar viajes y generar ingresos sin costo fijo durante todo el período de prueba.</p>
              </div>
            </div>

            <div className="auth-modal-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/panel"
                className="btn btn--primary btn--full"
                style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => setSubModalOpen(false)}
              >
                <span>Ir a la Torre de Control / Panel Web ➔</span>
              </Link>
              <button
                type="button"
                className="btn btn--secondary btn--full"
                onClick={() => setSubModalOpen(false)}
              >
                Continuar en la Web
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
