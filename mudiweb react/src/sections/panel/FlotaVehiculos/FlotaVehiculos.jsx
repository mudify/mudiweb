import React, { useState, useEffect } from 'react';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './FlotaVehiculos.css';

export default function FlotaVehiculos({ user, isEmpresa, onShowToast }) {
  const planKey = isEmpresa ? 'flota_vehiculos' : 'fletero_pro';
  const maxLimit = fleetService.getMaxVehiclesAllowed(planKey);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Form fields
  const [formPlate, setFormPlate] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCategory, setFormCategory] = useState('Furgón Mediano');
  const [formCapacity, setFormCapacity] = useState('10 m³');
  const [formDriver, setFormDriver] = useState('');

  // Sincronizar en tiempo real con Cloud Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = fleetService.subscribeVehicles(user.uid, (list) => {
      setVehicles(list);
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  const handleOpenAdd = () => {
    const quotaCheck = fleetService.canAddVehicle(vehicles.length, planKey);
    if (!quotaCheck.allowed) {
      setUpgradeModalOpen(true);
    } else {
      setAddModalOpen(true);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formPlate || !formBrand) return;

    const newVehicle = {
      patente: formPlate.toUpperCase().trim(),
      marca: formBrand.trim(),
      modelo: formModel.trim(),
      categoria: formCategory,
      capacidad: formCapacity,
      chofer: formDriver.trim() || user?.displayName || 'Chofer Principal',
      estado: 'disponible',
      vtv: 'Vigente (Vence en 12 meses)',
      seguro: 'Póliza de Carga Activa'
    };

    try {
      if (user?.uid) {
        await fleetService.addVehicle(user.uid, newVehicle);
      } else {
        setVehicles(prev => [...prev, { id: Date.now(), ...newVehicle }]);
      }

      setAddModalOpen(false);
      setFormPlate('');
      setFormBrand('');
      setFormModel('');
      setFormDriver('');

      if (onShowToast) {
        onShowToast(`Vehículo ${newVehicle.patente} registrado y sincronizado en Cloud Firestore`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Error registrando vehículo: ${err.message}`, 'error');
      }
    }
  };

  const handleDeleteVehicle = async (vehId) => {
    if (!confirm('¿Seguro que deseás dar de baja este vehículo de tu flota?')) return;
    try {
      if (user?.uid) {
        await fleetService.deleteVehicle(user.uid, vehId);
      } else {
        setVehicles(vehicles.filter(v => v.id !== vehId));
      }
      if (onShowToast) {
        onShowToast('Vehículo retirado de tu flota correctamente', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flota-panel">
      {/* Header */}
      <div className="flota-header">
        <div>
          <div className="flota-badge">
            <span className="pulse-dot"></span>
            <span>UNIDADES REGISTRADAS EN CLOUD FIRESTORE</span>
          </div>
          <h1 className="flota-title">Gestión de Flota &amp; Unidades</h1>
          <p className="flota-subtitle">
            Habilitá vehículos, asigná choferes y controlá documentación técnica (VTV, Seguro, Cédula).
          </p>
        </div>

        <div className="flota-header__actions">
          <div className="quota-pill">
            <span>Cupo de Flota:</span>
            <strong>{vehicles.length} / {maxLimit === Infinity ? '∞' : maxLimit}</strong>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<span className="material-symbols-outlined">add_circle</span>}
            onClick={handleOpenAdd}
          >
            + Agregar Unidad
          </Button>
        </div>
      </div>

      {/* Grid de Vehículos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
          Cargando vehículos desde base de datos...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="veh-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚛</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            No tenés vehículos dados de alta en tu flota
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Registrá la patente de tu furgón, pick-up o camión mudancero para comenzar a operar y recibir viajes en la Torre de Control.
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<span className="material-symbols-outlined">add_circle</span>}
            onClick={handleOpenAdd}
          >
            + Dar de Alta Primer Vehículo
          </Button>
        </div>
      ) : (
        <div className="flota-grid">
          {vehicles.map((veh) => (
            <div key={veh.id} className="veh-card">
              <div className="veh-card-top">
                <div className="veh-brand-wrap">
                  <div className="veh-icon-box">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h3 className="veh-model">{veh.marca} {veh.modelo}</h3>
                    <span className="veh-category-tag">{veh.categoria}</span>
                  </div>
                </div>

                <div className="veh-plate-box">
                  <span className="plate-flag">ARG</span>
                  <span className="plate-text">{veh.patente}</span>
                </div>
              </div>

              <div className="veh-specs-row">
                <div className="spec-item">
                  <span className="spec-label">Capacidad</span>
                  <strong className="spec-val">{veh.capacidad || '10 m³'}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Chofer Asignado</span>
                  <strong className="spec-val">{veh.chofer || 'Titular'}</strong>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Estado Operativo</span>
                  <strong className={`status-badge ${veh.estado || 'disponible'}`}>
                    {veh.estado === 'en_ruta' ? '● En Ruta' : '● Disponible'}
                  </strong>
                </div>
              </div>

              <div className="veh-docs-row">
                <div className="doc-pill">
                  <span className="check">✓</span>
                  <span>VTV: {veh.vtv || 'Vigente'}</span>
                </div>
                <div className="doc-pill">
                  <span className="check">✓</span>
                  <span>Seguro: {veh.seguro || 'Póliza Activa'}</span>
                </div>
              </div>

              <div className="veh-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowToast && onShowToast(`Inspección de telemetría de ${veh.patente}`, 'info')}
                >
                  Ver Telemetría
                </Button>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '6px 12px'
                  }}
                  onClick={() => handleDeleteVehicle(veh.id)}
                >
                  Dar de Baja
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: AGREGAR VEHÍCULO */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Dar de Alta Nueva Unidad en la Flota"
        size="md"
      >
        <form onSubmit={handleSubmitAdd} className="form-add-veh">
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="veh-plate">Patente / Dominio *</label>
              <input
                id="veh-plate"
                type="text"
                required
                placeholder="Ej: AE 892 CD"
                value={formPlate}
                onChange={(e) => setFormPlate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="veh-brand">Marca *</label>
              <input
                id="veh-brand"
                type="text"
                required
                placeholder="Ej: Mercedes-Benz"
                value={formBrand}
                onChange={(e) => setFormBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="veh-model">Modelo</label>
              <input
                id="veh-model"
                type="text"
                placeholder="Ej: Sprinter 311 CDI"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="veh-category">Categoría *</label>
              <select
                id="veh-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                <option value="Utilitario Chico">Utilitario Chico (hasta 600 kg / 4 m³)</option>
                <option value="Pick-up con Lona">Pick-up con Lona / Cúpula (1 Tn)</option>
                <option value="Furgón Mediano">Furgón Mediano (1.5 Tn / 10 m³)</option>
                <option value="Furgón Grande">Furgón Grande (2 Tn / 14 m³)</option>
                <option value="Camión Mudancero">Camión Mudancero (hasta 5 Tn / 25 m³)</option>
              </select>
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="veh-cap">Capacidad Estimada</label>
              <input
                id="veh-cap"
                type="text"
                placeholder="10 m³ / 1.5 Tn"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="veh-driver">Chofer Asignado</label>
              <input
                id="veh-driver"
                type="text"
                placeholder="Nombre del chofer"
                value={formDriver}
                onChange={(e) => setFormDriver(e.target.value)}
              />
            </div>
          </div>

          <div className="form-veh-actions">
            <Button variant="outline" size="md" onClick={() => setAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Guardar en Cloud Firestore 🚀
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPGRADE PLAN LIMIT REACHED */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Límite de Vehículos Alcanzado"
        size="md"
      >
        <div className="upgrade-modal-content">
          <div className="upgrade-icon-wrap">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <h3>Límite de 1 Vehículo del Plan Fletero Pro</h3>
          <p>
            Tu <strong>Plan Fletero Pro</strong> autoriza únicamente <strong>1 vehículo activo</strong> en la plataforma.
            Para incorporar más furgones, camiones, choferes o cuadrillas completas, actualizá tu suscripción
            al <strong>Plan Flota por Vehículos</strong> (2 a 10 unidades) o <strong>Plan Enterprise</strong>.
          </p>

          <div className="upgrade-actions">
            <a
              href="/#suscripciones"
              className="btn btn--primary btn--lg btn-full"
              onClick={() => setUpgradeModalOpen(false)}
            >
              Ver Planes y Ampliar Flota (60 Días Gratis) 🚀
            </a>
            <Button
              variant="outline"
              size="md"
              className="btn-full"
              onClick={() => setUpgradeModalOpen(false)}
            >
              Entendido, continuar con 1 vehículo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
