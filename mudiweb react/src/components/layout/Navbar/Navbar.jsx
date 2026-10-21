import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import Button from '../../ui/Button/Button';
import './Navbar.css';

export default function Navbar({ onOpenAuthModal }) {
  const { user, profile, isAuthenticated, signInWithGoogle, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePanelClick = () => {
    navigate('/panel');
  };

  return (
    <header className="navbar-header" id="header">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo" aria-label="Mudify, inicio">
            <img
              src="/assets/images/logo.png"
              alt="Mudify Logo - Mudanzas y Fletes en Argentina"
              className="navbar-logo__image"
            />
            <span className="navbar-logo__text">Mudify</span>
          </Link>

          <nav className={`navbar-nav ${mobileMenuOpen ? 'navbar-nav--open' : ''}`}>
            <a href="#viajar" onClick={() => setMobileMenuOpen(false)}>Para Clientes</a>
            <a href="#conducir" onClick={() => setMobileMenuOpen(false)}>Para Conductores</a>
            <a href="#empresas" onClick={() => setMobileMenuOpen(false)}>Para Empresas</a>
            <a href="#suscripciones" onClick={() => setMobileMenuOpen(false)}>Suscripciones</a>
            <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>Ayuda</a>
          </nav>
        </div>

        <div className="navbar-right">
          {!isAuthenticated ? (
            <div className="navbar-auth-guest">
              <Button
                variant="text"
                size="md"
                onClick={signInWithGoogle}
              >
                Iniciar sesión
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={signInWithGoogle}
              >
                Registrarse
              </Button>
            </div>
          ) : (
            <div className="navbar-auth-user" ref={dropdownRef}>
              <button
                type="button"
                className="user-chip-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Menú de perfil"
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
                  className={`user-chip-arrow ${dropdownOpen ? 'user-chip-arrow--open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-card">
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
                    <button
                      className="dropdown-link dropdown-link--highlight"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/panel');
                      }}
                    >
                      <span className="dropdown-link-icon">🚚</span>
                      <span className="dropdown-link-text">
                        <strong>Torre de Control PRO</strong>
                        <small>Panel de despacho y gestión web</small>
                      </span>
                    </button>

                    <a
                      href="#suscripciones"
                      className="dropdown-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="dropdown-link-icon">🎁</span>
                      <span className="dropdown-link-text">
                        <strong>Mi Suscripción</strong>
                        <small>{profile?.subscription?.planName || 'Plan Fletero Pro'} (Activo)</small>
                      </span>
                    </a>

                    <a
                      href="#faq"
                      className="dropdown-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span className="dropdown-link-icon">💬</span>
                      <span className="dropdown-link-text">
                        <strong>Soporte Mudify</strong>
                        <small>Atención al usuario y reclamos</small>
                      </span>
                    </a>
                  </div>

                  <div className="user-dropdown-footer">
                    <button
                      className="btn-logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            className="navbar-toggle"
            aria-label="Abrir menú"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="navbar-toggle__bar"></span>
            <span className="navbar-toggle__bar"></span>
            <span className="navbar-toggle__bar"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
