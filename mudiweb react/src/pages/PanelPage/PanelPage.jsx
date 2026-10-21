import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useGeolocation from '../../hooks/useGeolocation';
import fleetService from '../../services/fleetService';
import Sidebar from '../../components/layout/Sidebar/Sidebar';
import Topbar from '../../components/layout/Topbar/Topbar';
import TorreControl from '../../sections/panel/TorreControl/TorreControl';
import FlotaVehiculos from '../../sections/panel/FlotaVehiculos/FlotaVehiculos';
import DespachoAgenda from '../../sections/panel/DespachoAgenda/DespachoAgenda';
import FacturacionRemitos from '../../sections/panel/FacturacionRemitos/FacturacionRemitos';
import NominaPersonal from '../../sections/panel/NominaPersonal/NominaPersonal';
import ServiciosTarifas from '../../sections/panel/ServiciosTarifas/ServiciosTarifas';
import ConfiguracionTarifas from '../../sections/panel/ConfiguracionTarifas/ConfiguracionTarifas';
import Toast from '../../components/common/Toast/Toast';
import Button from '../../components/ui/Button/Button';
import './PanelPage.css';

export default function PanelPage() {
  const { user, profile, loading, isAuthenticated, signInWithGoogle } = useAuth();
  const { coords, error: gpsError } = useGeolocation(user?.uid);

  const [panelAuthError, setPanelAuthError] = useState(null);
  const [panelAuthLoading, setPanelAuthLoading] = useState(false);

  const handlePanelLogin = async () => {
    setPanelAuthError(null);
    setPanelAuthLoading(true);
    try {
      await signInWithGoogle('conductor', false);
    } catch (err) {
      if (err.code === 'USER_NOT_REGISTERED') {
        setPanelAuthError('Esta cuenta de Google no está registrada en Mudify. Por favor, registrate primero para acceder.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // Usuario cerró el popup de Google
      } else {
        setPanelAuthError('Ocurrió un error al conectar con Google. Por favor, intentá nuevamente.');
      }
    } finally {
      setPanelAuthLoading(false);
    }
  };

  // REGLA: El rol se deriva SIEMPRE del perfil de Firestore (sin estado local),
  // para evitar condiciones de carrera entre el render inicial y la carga asíncrona.
  const isRegisteredEmpresa = profile?.role === 'empresa';

  // isEmpresa refleja el modo de visualización actual (para conductores puede alternarse)
  const [manualMode, setManualMode] = useState(null); // null = seguir al perfil

  // El modo efectivo: si hay un override manual (solo para conductores), usarlo;
  // de lo contrario, seguir al perfil de la DB.
  const isEmpresa = isRegisteredEmpresa
    ? true
    : (manualMode !== null ? manualMode : false);

  const [activeTab, setActiveTab] = useState('torre');
  const [activeHub, setActiveHub] = useState('caba');
  const [toast, setToast] = useState(null);
  const [vehicleCount, setVehicleCount] = useState(1);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Bloqueo de cambio de modo para cuentas Empresa
  const handleToggleMode = (newMode) => {
    if (isRegisteredEmpresa && !newMode) {
      showToast(
        'Acceso Restringido: Tu cuenta está registrada como Empresa de Mudanzas. Por política de seguridad, no podés operar como conductor independiente.',
        'error'
      );
      return;
    }
    setManualMode(newMode);
  };

  // Escuchar cantidad real de vehículos en Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = fleetService.subscribeVehicles(user.uid, (list) => {
      setVehicleCount(list.length || 1);
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  // Guard: mientras Firestore no respondió, no renderizar el panel
  // para evitar mostrar el rol incorrecto (profile = null → isEmpresa = false)
  if (loading) {
    return (
      <div className="panel-auth-lock">
        <div className="auth-lock-card">
          <div className="lock-icon-wrap" style={{ animation: 'pulse 1.5s infinite' }}>
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <h2>Cargando Panel...</h2>
          <p>Sincronizando tu perfil con Firestore</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="panel-auth-lock">
        <div className="auth-lock-card">
          <div className="lock-icon-wrap">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <h2>Mudify PRO Enterprise</h2>
          <p>
            Torre de control y gestión operativa. Acceso seguro exclusivo para transportistas
            y empresas registradas con cuenta de Google.
          </p>

          {panelAuthError && (
            <div className="auth-error-box" style={{ margin: '0 0 20px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{panelAuthError}</p>
              <Link
                to="/?auth=register&role=conductor"
                style={{ color: '#be123c', fontWeight: 700, textDecoration: 'underline', fontSize: '13px', display: 'inline-block' }}
              >
                Crear cuenta / Registrarse en Mudify →
              </Link>
            </div>
          )}

          <button
            type="button"
            className="btn-google-panel"
            onClick={handlePanelLogin}
            disabled={panelAuthLoading}
          >
            {panelAuthLoading ? (
              <span>Verificando credenciales...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Acceder con Cuenta de Google</span>
              </>
            )}
          </button>

          <div className="lock-security-tag">
            <span className="material-symbols-outlined">lock</span>
            <span>Google OAuth 2.0 · Cifrado de Extremo a Extremo</span>
          </div>

          <div style={{ marginTop: '18px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              <span>Volver a la página de inicio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = profile?.subscription?.daysRemaining || 60;
  const isEffectiveEmpresa = isEmpresa; // ya incluye isRegisteredEmpresa
  const planName = isEffectiveEmpresa
    ? 'Plan Flota por Vehículos (Empresa)'
    : (profile?.subscription?.planName || 'Plan Fletero Pro (1 Móvil)');

  return (
    <div className="panel-layout">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        planName={planName}
        daysRemaining={daysRemaining}
        vehicleCount={vehicleCount}
        maxVehicles={isEffectiveEmpresa ? 10 : 1}
        isEmpresa={isEffectiveEmpresa}
        profile={profile}
      />

      {/* Main Content Area */}
      <div className="panel-main-content">
        <Topbar
          activeHub={activeHub}
          onChangeHub={setActiveHub}
          isEmpresa={isEffectiveEmpresa}
          onToggleMode={handleToggleMode}
          coords={coords}
          gpsError={gpsError}
        />

        <main className="panel-body">
          {activeTab === 'torre' && (
            <TorreControl
              user={user}
              profile={profile}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'agenda' && (
            <DespachoAgenda
              user={user}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'flota' && (
            <FlotaVehiculos
              user={user}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'personal' && (
            <NominaPersonal
              user={user}
              profile={profile}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'tarifas' && (
            <ServiciosTarifas
              user={user}
              profile={profile}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'facturacion' && (
            <FacturacionRemitos
              user={user}
              profile={profile}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'configuracion' && (
            <ConfiguracionTarifas
              user={user}
              profile={profile}
              isEmpresa={isEffectiveEmpresa}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Floating Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
