import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import './Topbar.css';

export default function Topbar({
  activeHub,
  onChangeHub,
  isEmpresa,
  onToggleMode,
  coords,
  gpsError
}) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  };

  return (
    <header className="panel-topbar">
      <div className="topbar-left">
        {/* Hub Selector */}
        <div className="topbar-hub">
          <span className="material-symbols-outlined hub-icon">warehouse</span>
          <select
            aria-label="Seleccionar base operativa"
            value={activeHub}
            onChange={(e) => onChangeHub(e.target.value)}
            className="hub-select"
          >
            <option value="caba">Hub CABA Central (AMBA)</option>
            <option value="norte">Base Norte (San Isidro / Tigre)</option>
            <option value="sur">Base Sur (Avellaneda / Quilmes)</option>
            <option value="oeste">Base Oeste (Morón / Castelar)</option>
          </select>
        </div>

        {/* Telemetry live status */}
        <div className="topbar-gps-badge">
          <span className="pulse-dot"></span>
          <span>
            {coords
              ? `GPS Teléfono: ${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}° (±${Math.round(coords.accuracy)}m)`
              : gpsError
              ? `GPS: ${gpsError}`
              : 'Sincronizando GPS de teléfono...'}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Indicador de rol con toggle interactivo */}
        {(() => {
          const esEmpresa = isEmpresa || profile?.role === 'empresa' || profile?.isEmpresa === true;
          return (
            <div
              className={`role-indicator ${onToggleMode ? 'role-indicator--clickable' : ''}`}
              aria-label="Tipo de cuenta"
              onClick={() => onToggleMode && onToggleMode(!esEmpresa)}
              title={onToggleMode ? 'Click para alternar entre Modo Empresa y Conductor Independiente' : undefined}
              style={{ cursor: onToggleMode ? 'pointer' : 'default', userSelect: 'none' }}
            >
              <span className="material-symbols-outlined role-indicator__icon">
                {esEmpresa ? 'domain' : 'local_shipping'}
              </span>
              <div className="role-indicator__meta">
                <span className="role-indicator__label">
                  {esEmpresa ? 'Empresa de Mudanzas' : 'Conductor Independiente'}
                </span>
                <span className="role-indicator__sub">
                  {onToggleMode ? 'Click para alternar ⇄' : 'Tipo de cuenta'}
                </span>
              </div>
            </div>
          );
        })()}

        <div className="topbar-divider"></div>

        {/* User Profile */}
        <div className="topbar-user">
          <div className="user-details">
            <span className="user-name">{user?.displayName || 'Usuario'}</span>
            <span className="user-role">
              {(profile?.isEmpresa || profile?.role === 'empresa') ? 'Empresa de Mudanzas' : 'Conductor Independiente'}
            </span>
          </div>
          <img
            src={user?.photoURL || '/assets/images/logo.png'}
            alt="Profile"
            className="user-avatar"
          />
          <button
            type="button"
            onClick={handleLogout}
            className="btn-topbar-logout"
            title="Cerrar sesión de Google"
            aria-label="Cerrar sesión"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
