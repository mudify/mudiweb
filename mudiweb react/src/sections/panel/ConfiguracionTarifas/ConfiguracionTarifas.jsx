import React, { useState, useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import empresaService from '../../../services/empresaService';
import Button from '../../../components/ui/Button/Button';
import './ConfiguracionTarifas.css';

const PROVINCIAS_AR = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
];

export default function ConfiguracionTarifas({ user, profile, isEmpresa, onShowToast }) {
  const { updateUserData } = useAuth();

  // ── Datos del Titular de la Cuenta ─────────────────────────────────────────
  const [titularNombre, setTitularNombre] = useState(
    user?.displayName || user?.name || profile?.name || ''
  );
  const [titularFoto, setTitularFoto] = useState(
    user?.photoURL || user?.avatarUrl || profile?.photoUrl || ''
  );
  const [showFotoInput, setShowFotoInput] = useState(false);
  const [savingTitular, setSavingTitular] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sincronizar estado cuando se cargan el usuario o el perfil
  useEffect(() => {
    const currentName = user?.displayName || user?.name || profile?.name;
    const currentPhoto = user?.photoURL || user?.avatarUrl || profile?.photoUrl;
    if (currentName) setTitularNombre(currentName);
    if (currentPhoto) {
      setTitularFoto(currentPhoto);
      setImgError(false);
    }
  }, [user, profile]);

  const handleCopyUid = () => {
    const uid = user?.uid || profile?.uid;
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSaveTitular = async (e) => {
    e.preventDefault();
    if (!titularNombre.trim()) {
      onShowToast?.('Por favor ingresá el nombre y apellido del titular.', 'error');
      return;
    }
    setSavingTitular(true);
    try {
      if (updateUserData) {
        await updateUserData({
          name: titularNombre.trim(),
          photoUrl: titularFoto.trim()
        });
      }
      onShowToast?.('✅ Datos del titular actualizados en Firestore', 'success');
    } catch (err) {
      onShowToast?.(`Error al actualizar datos del titular: ${err.message}`, 'error');
    } finally {
      setSavingTitular(false);
    }
  };

  // ── Perfil de Empresa ─────────────────────────────────────────────────────
  const [empresa, setEmpresa] = useState({
    razonSocial: '',
    nombreComercial: '',
    cuit: '',
    telefono: '',
    direccion: '',
    localidad: '',
    provincia: '',
    sitioWeb: '',
    descripcion: ''
  });
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  const [perfilCompleto, setPerfilCompleto] = useState(false);

  // ── Cargar perfil de empresa ──────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || !isEmpresa) { setLoadingPerfil(false); return; }
    empresaService.getEmpresa(user.uid)
      .then(data => {
        if (data) {
          setEmpresa({
            razonSocial: data.razonSocial || '',
            nombreComercial: data.nombreComercial || '',
            cuit: data.cuit || '',
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            localidad: data.localidad || '',
            provincia: data.provincia || '',
            sitioWeb: data.sitioWeb || '',
            descripcion: data.descripcion || ''
          });
          setPerfilCompleto(data.perfilCompleto || false);
        }
      })
      .catch(e => console.warn('empresa perfil:', e))
      .finally(() => setLoadingPerfil(false));
  }, [user?.uid, isEmpresa]);

  // ── Guardar perfil empresa ────────────────────────────────────────────────
  const handleSavePerfil = async (e) => {
    e.preventDefault();
    setSavingPerfil(true);
    try {
      const completo = await empresaService.updateEmpresa(user.uid, empresa);
      setPerfilCompleto(completo);
      onShowToast?.(
        completo
          ? '✅ Perfil de empresa guardado y completado en Firestore'
          : 'Perfil de empresa actualizado. Completá razón social, CUIT, teléfono y localidad para finalizar.',
        completo ? 'success' : 'info'
      );
    } catch (err) {
      onShowToast?.(`Error al guardar perfil: ${err.message}`, 'error');
    } finally {
      setSavingPerfil(false);
    }
  };

  const handleEmpresaChange = (field, value) =>
    setEmpresa(prev => ({ ...prev, [field]: value }));

  return (
    <div className="config-panel">
      <div className="config-header">
        <div>
          <h1 className="config-title">Configuración de Cuenta</h1>
          <p className="config-subtitle">
            {isEmpresa
              ? 'Datos del titular registrado, perfil comercial de tu empresa y esquema tarifario.'
              : 'Datos del titular de la cuenta y esquema tarifario operativo.'}
          </p>
        </div>
      </div>

      {/* ── SECCIÓN 1: DATOS DEL TITULAR Y CUENTA REGISTRADA ── */}
      <div className="config-card titular-card">
        <div className="form-section-title titular-header-title">
          <div className="titular-title-left">
            <span className="material-symbols-outlined titular-header-icon">badge</span>
            <div>
              <h3>Datos de la Cuenta y Titular Registrado</h3>
              <p className="titular-subtitle">
                Información personal del titular y credenciales de acceso vinculadas al sistema Mudify.
              </p>
            </div>
          </div>
          <div className="titular-badges-wrap">
            <span className="google-verified-badge" title="Identidad autenticada con Google OAuth 2.0">
              <svg className="google-icon" viewBox="0 0 24 24" width="14" height="14">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google OAuth 2.0 Verificado</span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTitular} className="config-form">
          <div className="titular-profile-layout">
            {/* Avatar Column */}
            <div className="titular-avatar-block">
              <div className="titular-avatar-wrapper">
                {titularFoto && !imgError ? (
                  <img
                    src={titularFoto}
                    alt={titularNombre || 'Titular'}
                    className="titular-avatar-image"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="titular-avatar-fallback">
                    {(titularNombre || user?.displayName || 'M').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="titular-status-dot" title="Sesión activa y sincronizada"></span>
              </div>
              <button
                type="button"
                className="btn-toggle-photo"
                onClick={() => setShowFotoInput(prev => !prev)}
                title="Personalizar imagen de perfil"
              >
                <span className="material-symbols-outlined">photo_camera</span>
                <span>{showFotoInput ? 'Cerrar URL' : 'Cambiar Foto'}</span>
              </button>
            </div>

            {/* Fields Column */}
            <div className="titular-fields-grid">
              <div className="input-group">
                <label htmlFor="titular-nombre">Nombre y Apellido del Titular *</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    id="titular-nombre"
                    type="text"
                    placeholder="Ej: José Alliana"
                    value={titularNombre}
                    onChange={e => setTitularNombre(e.target.value)}
                    required
                  />
                </div>
                <small className="input-hint">Nombre del titular registrado responsable de la cuenta.</small>
              </div>

              <div className="input-group">
                <label htmlFor="titular-email">Correo Electrónico Vinculado</label>
                <div className="input-with-icon input-locked">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    id="titular-email"
                    type="email"
                    value={user?.email || profile?.email || 'email@google.com'}
                    readOnly
                    disabled
                  />
                  <span className="material-symbols-outlined lock-icon" title="Email vinculado a Google OAuth">lock</span>
                </div>
                <small className="input-hint">Email verificado usado para iniciar sesión y recibir notificaciones.</small>
              </div>

              <div className="input-group">
                <label htmlFor="titular-rol">Tipo de Cuenta / Rol Activo</label>
                <div className="account-role-badge-box">
                  <span className="material-symbols-outlined role-icon">
                    {isEmpresa ? 'domain' : 'local_shipping'}
                  </span>
                  <div className="account-role-text">
                    <strong>{isEmpresa ? 'Empresa de Mudanzas' : 'Conductor Independiente'}</strong>
                    <span>{isEmpresa ? 'Gestión multi-vehículo y nómina de choferes' : 'Operación directa de transporte'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const nextRole = isEmpresa ? 'conductor' : 'empresa';
                      try {
                        if (updateUserData) {
                          await updateUserData({ role: nextRole });
                        }
                        onShowToast?.(
                          nextRole === 'empresa'
                            ? '🏢 ¡Cuenta actualizada a Empresa de Mudanzas! Módulos de Flota y Nómina activados.'
                            : '🚛 Cuenta cambiada a Conductor Independiente.',
                          'success'
                        );
                      } catch (err) {
                        onShowToast?.(`Error al cambiar rol: ${err.message}`, 'error');
                      }
                    }}
                    className="btn-switch-role"
                    style={{
                      marginLeft: 'auto',
                      padding: '6px 12px',
                      background: '#ffffff',
                      border: '1.5px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--color-primary)',
                      fontFamily: 'inherit'
                    }}
                    title={isEmpresa ? 'Cambiar a perfil Fletero Pro' : 'Activar perfil Empresa de Mudanzas'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_horiz</span>
                    <span>{isEmpresa ? 'Cambiar a Fletero' : 'Cambiar a Empresa'}</span>
                  </button>
                </div>
                <small className="input-hint">Rol verificado en el sistema Firestore. Podés alternar para acceder a la gestión corporativa.</small>
              </div>

              <div className="input-group">
                <label htmlFor="titular-uid">ID Único de Cuenta (UID)</label>
                <div className="uid-copy-wrap">
                  <code className="uid-code">{user?.uid || profile?.uid || '---'}</code>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="btn-copy-uid"
                    title="Copiar ID de cuenta"
                  >
                    <span className="material-symbols-outlined">
                      {copiedUid ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedUid ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <small className="input-hint">Identificador único de cuenta en la base de datos Mudify.</small>
              </div>
            </div>
          </div>

          {showFotoInput && (
            <div className="input-group photo-url-group">
              <label htmlFor="titular-foto-url">URL de Imagen de Perfil Personalizada</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">link</span>
                <input
                  id="titular-foto-url"
                  type="url"
                  placeholder="https://ejemplo.com/tu-foto.jpg"
                  value={titularFoto}
                  onChange={e => {
                    setTitularFoto(e.target.value);
                    setImgError(false);
                  }}
                />
              </div>
              <small className="input-hint">Ingresá el enlace directo a tu foto o logo (JPG, PNG, WebP) para actualizar tu avatar.</small>
            </div>
          )}

          <div className="config-actions">
            <Button variant="primary" size="md" type="submit" disabled={savingTitular}>
              {savingTitular ? 'Guardando en Firestore...' : 'Guardar Datos del Titular 💾'}
            </Button>
          </div>
        </form>
      </div>

      {/* ── SECCIÓN PERFIL EMPRESA (solo para empresas) ── */}
      {isEmpresa && (
        <div className="config-card">
          <div className="form-section-title">
            <span className="material-symbols-outlined">domain</span>
            <div>
              <h3>Perfil de Empresa</h3>
              {!perfilCompleto && (
                <span className="perfil-incompleto-badge">
                  ⚠ Completá tu perfil para aparecer en el directorio Mudify
                </span>
              )}
              {perfilCompleto && (
                <span className="perfil-completo-badge">
                  ✓ Perfil completo — visible en el directorio
                </span>
              )}
            </div>
          </div>

          {loadingPerfil ? (
            <p className="loading-text">Cargando perfil desde Firestore...</p>
          ) : (
            <form onSubmit={handleSavePerfil} className="config-form">
              <div className="config-inputs-grid config-inputs-grid--3">
                <div className="input-group">
                  <label htmlFor="emp-razon">Razón Social *</label>
                  <input
                    id="emp-razon"
                    type="text"
                    placeholder="Nombre legal de la empresa"
                    value={empresa.razonSocial}
                    onChange={e => handleEmpresaChange('razonSocial', e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-comercial">Nombre Comercial</label>
                  <input
                    id="emp-comercial"
                    type="text"
                    placeholder="Nombre visible al público"
                    value={empresa.nombreComercial}
                    onChange={e => handleEmpresaChange('nombreComercial', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-cuit">CUIT / CUIL *</label>
                  <input
                    id="emp-cuit"
                    type="text"
                    placeholder="30-12345678-9"
                    value={empresa.cuit}
                    onChange={e => handleEmpresaChange('cuit', e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-tel">Teléfono de Contacto *</label>
                  <input
                    id="emp-tel"
                    type="tel"
                    placeholder="+54 11 1234-5678"
                    value={empresa.telefono}
                    onChange={e => handleEmpresaChange('telefono', e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-direccion">Dirección</label>
                  <input
                    id="emp-direccion"
                    type="text"
                    placeholder="Av. Corrientes 1234"
                    value={empresa.direccion}
                    onChange={e => handleEmpresaChange('direccion', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-localidad">Localidad *</label>
                  <input
                    id="emp-localidad"
                    type="text"
                    placeholder="Buenos Aires"
                    value={empresa.localidad}
                    onChange={e => handleEmpresaChange('localidad', e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emp-provincia">Provincia</label>
                  <select
                    id="emp-provincia"
                    value={empresa.provincia}
                    onChange={e => handleEmpresaChange('provincia', e.target.value)}
                    className="select-field"
                  >
                    <option value="">Seleccionar provincia</option>
                    {PROVINCIAS_AR.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="emp-web">Sitio Web</label>
                  <input
                    id="emp-web"
                    type="url"
                    placeholder="https://miempresa.com"
                    value={empresa.sitioWeb}
                    onChange={e => handleEmpresaChange('sitioWeb', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="emp-desc">Descripción de la Empresa</label>
                <textarea
                  id="emp-desc"
                  rows={3}
                  placeholder="Contá brevemente sobre tu empresa: especialidades, años de experiencia, zonas de cobertura..."
                  value={empresa.descripcion}
                  onChange={e => handleEmpresaChange('descripcion', e.target.value)}
                  className="textarea-field"
                />
              </div>

              <div className="config-actions">
                <Button variant="primary" size="md" type="submit" disabled={savingPerfil}>
                  {savingPerfil ? 'Guardando...' : 'Guardar Perfil de Empresa 🏢'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
