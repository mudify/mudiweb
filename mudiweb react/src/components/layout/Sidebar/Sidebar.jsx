import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({
  activeTab,
  onSelectTab,
  planName = 'Plan Fletero Pro',
  daysRemaining = 60,
  vehicleCount = 1,
  maxVehicles = 1,
  isEmpresa = false,
  profile = null
}) {
  const navItems = [
    { id: 'torre', label: 'Torre de Control', icon: 'monitoring' },
    { id: 'agenda', label: 'Despacho & Agenda', icon: 'calendar_month' },
    { id: 'flota', label: isEmpresa ? 'Flota de Vehículos' : 'Mi Vehículo & Flota', icon: 'directions_bus' },
    { id: 'personal', label: 'Nómina de Personal', icon: 'badge' },
    { id: 'tarifas', label: 'Servicios & Tarifas', icon: 'payments' },
    { id: 'facturacion', label: 'Facturación & Finanzas', icon: 'account_balance_wallet' },
    { id: 'configuracion', label: 'Configuración de Cuenta', icon: 'manage_accounts' }
  ];

  return (
    <aside className="panel-sidebar">
      <div className="sidebar-top">
        {/* Brand */}
        <Link to="/" className="sidebar-brand">
          <div className="sidebar-brand__icon">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div className="sidebar-brand__text">
            <span className="brand-title">Mudify <span className="brand-badge">PRO</span></span>
            <span className="brand-subtitle">{isEmpresa ? 'Empresa de Mudanzas' : 'Conductor Independiente'}</span>
          </div>
        </Link>

        {/* Account Type Chip — deriva el rol directamente del profile de Firestore */}
        {(() => {
          const esEmpresa = isEmpresa || profile?.role === 'empresa' || profile?.isEmpresa === true;
          return (
            <div className={`sidebar-account-chip ${esEmpresa ? 'sidebar-account-chip--empresa' : 'sidebar-account-chip--conductor'}`}>
              <span className="material-symbols-outlined sidebar-account-chip__icon">
                {esEmpresa ? 'domain' : 'local_shipping'}
              </span>
              <div className="sidebar-account-chip__text">
                <span className="sidebar-account-chip__type">
                  {esEmpresa ? 'Empresa de Mudanzas' : 'Conductor Independiente'}
                </span>
                <span className="sidebar-account-chip__name">
                  {profile?.name || (esEmpresa ? 'Cuenta Corporativa' : 'Cuenta Personal')}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Live Status Badge */}
        <div className="sidebar-status-box">
          <div className="status-live">
            <span className="pulse-dot"></span>
            <span>Estado Operativo</span>
          </div>
          <span className="status-pill">100% En Línea</span>
        </div>

        {/* Subscription / Quota Card */}
        <div className="sidebar-sub-card">
          <div className="sub-top">
            <span className="sub-plan-badge">{planName}</span>
            <span className="sub-grace-badge">{daysRemaining}d Bonificados</span>
          </div>
          <div className="sub-quota-row">
            <span className="quota-label">Cupo de Flota:</span>
            <span className="quota-value">
              {vehicleCount} / {maxVehicles === Infinity ? '∞' : maxVehicles} {maxVehicles === 1 ? 'Vehículo' : 'Vehículos'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav__item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="material-symbols-outlined nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Support Footer */}
      <div className="sidebar-footer">
        <div className="support-info">
          <span className="support-title">Soporte Central 24/7</span>
          <span className="support-sub">Canal de Enlace</span>
        </div>
        <a
          href="https://wa.me/5491100000000?text=Hola%20Mudify%20Soporte%20PRO"
          target="_blank"
          rel="noopener noreferrer"
          className="support-btn"
          title="Abrir canal de soporte prioritario"
        >
          <span className="material-symbols-outlined">headset_mic</span>
        </a>
      </div>
    </aside>
  );
}
