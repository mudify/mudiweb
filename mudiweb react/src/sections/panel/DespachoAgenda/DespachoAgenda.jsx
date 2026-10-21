import React, { useState, useEffect } from 'react';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './DespachoAgenda.css';

export default function DespachoAgenda({ user, isEmpresa, onShowToast }) {
  const [timeframe, setTimeframe] = useState('hoy');
  const [scheduledMoves, setScheduledMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [clientName, setClientName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [price, setPrice] = useState('');
  const [vehicleType, setVehicleType] = useState('Furgón Mediano');

  // Enterprise staff & fleet assignment
  const [staffList, setStaffList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [assignedVehiclePlate, setAssignedVehiclePlate] = useState('');

  // Cargar viajes programados en tiempo real desde Firestore
  useEffect(() => {
    const unsubscribe = fleetService.subscribeScheduledTrips(user?.uid, (list) => {
      setScheduledMoves(list);
      setLoading(false);
    });

    let unsubscribeStaff = null;
    let unsubscribeVehicles = null;
    if (isEmpresa && user?.uid) {
      unsubscribeStaff = fleetService.subscribeStaff(user.uid, (list) => {
        setStaffList(list);
      });
      unsubscribeVehicles = fleetService.subscribeVehicles(user.uid, (list) => {
        setVehicles(list);
      });
    }

    return () => {
      unsubscribe && unsubscribe();
      unsubscribeStaff && unsubscribeStaff();
      unsubscribeVehicles && unsubscribeVehicles();
    };
  }, [user?.uid, isEmpresa]);

  const staffDrivers = staffList.filter((s) => s.rol === 'conductor' || s.rol === 'chofer');

  const handleCreateScheduled = async (e) => {
    e.preventDefault();
    if (!clientName || !origin || !destination) return;

    const selectedDriver = staffDrivers.find((d) => d.id === assignedDriverId);
    const selectedVeh = vehicles.find((v) => v.patente === assignedVehiclePlate);

    try {
      await fleetService.createScheduledTrip(user?.uid, {
        clientName,
        cliente: clientName,
        origen: origin,
        destino: destination,
        ruta: `${origin} ➔ ${destination}`,
        horario: scheduledTime || '14:00 hs',
        scheduledTime: scheduledTime || '14:00 hs',
        monto: Number(price) || 45000,
        estimatedPrice: Number(price) || 45000,
        porte: vehicleType,
        vehicleTypeRequired: vehicleType,
        status: 'confirmado',
        assignedDriverId: selectedDriver?.driverUid || selectedDriver?.id || null,
        driverName: selectedDriver?.nombre || null,
        patente: selectedVeh?.patente || selectedDriver?.vehiculoPatente || null,
        assignedByEmpresa: !!isEmpresa
      });

      setModalOpen(false);
      setClientName('');
      setOrigin('');
      setDestination('');
      setScheduledTime('');
      setPrice('');
      setAssignedDriverId('');
      setAssignedVehiclePlate('');

      if (onShowToast) {
        onShowToast('Reserva programada guardada y sincronizada en Cloud Firestore', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Error al guardar: ${err.message}`, 'error');
      }
    }
  };

  return (
    <div className="agenda-panel">
      <div className="agenda-header">
        <div>
          <h1 className="agenda-title">Despacho &amp; Agenda Operativa</h1>
          <p className="agenda-subtitle">Cronograma diario de turnos, rutas programadas y franjas horarias en Firestore.</p>
        </div>

        <div className="agenda-actions">
          <div className="timeframe-switch">
            <button
              className={`time-btn ${timeframe === 'hoy' ? 'active' : ''}`}
              onClick={() => setTimeframe('hoy')}
            >
              Hoy
            </button>
            <button
              className={`time-btn ${timeframe === 'semana' ? 'active' : ''}`}
              onClick={() => setTimeframe('semana')}
            >
              Semana
            </button>
            <button
              className={`time-btn ${timeframe === 'mes' ? 'active' : ''}`}
              onClick={() => setTimeframe('mes')}
            >
              Mes
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={<span className="material-symbols-outlined">add_circle</span>}
            onClick={() => setModalOpen(true)}
          >
            + Programar Mudanza Manual
          </Button>
        </div>
      </div>

      {/* Gantt Timeline Strip */}
      <div className="timeline-card">
        <div className="timeline-header">
          <span className="timeline-header-title">Cronograma de Ocupación Hoy (07:00 a 19:00)</span>
          <div className="timeline-legend">
            <span className="legend-item"><span className="dot dot-completed"></span>Completado</span>
            <span className="legend-item"><span className="dot dot-progress"></span>En Curso</span>
            <span className="legend-item"><span className="dot dot-scheduled"></span>Programado</span>
          </div>
        </div>

        <div className="hours-strip">
          <span>07:00</span>
          <span>09:00</span>
          <span>11:00</span>
          <span>13:00</span>
          <span>15:00</span>
          <span>17:00</span>
          <span>19:00</span>
        </div>

        <div className="timeline-track">
          {scheduledMoves.length > 0 ? (
            scheduledMoves.slice(0, 3).map((move, idx) => (
              <div
                key={move.id}
                className={`track-block ${idx === 0 ? 'track-block--active' : 'track-block--scheduled'}`}
                style={{ left: `${20 + idx * 28}%`, width: '22%' }}
              >
                <span>{move.cliente} ({move.horario})</span>
              </div>
            ))
          ) : (
            <div className="track-block track-block--scheduled" style={{ left: '35%', width: '30%', opacity: 0.6 }}>
              <span>Sin turnos ocupados en la franja</span>
            </div>
          )}
        </div>
      </div>

      {/* Agenda list desde Firestore */}
      <div className="scheduled-list-card">
        <h3>Próximos Traslados Programados</h3>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)', padding: '16px 0' }}>Cargando agenda desde Firestore...</p>
        ) : scheduledMoves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <span style={{ fontSize: '32px' }}>📅</span>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              No tenés mudanzas programadas pendientes. Creá una reserva manual o esperá solicitudes de clientes.
            </p>
          </div>
        ) : (
          <div className="scheduled-items">
            {scheduledMoves.map((item) => (
              <div key={item.id} className="scheduled-item">
                <div className="sched-left">
                  <span className="sched-time">{item.horario}</span>
                  <div>
                    <strong className="sched-route">{item.ruta}</strong>
                    <span className="sched-client">
                      Cliente: {item.cliente} · {item.porte}
                      {item.driverName && (
                        <span className="sched-driver-tag" style={{ marginLeft: '6px', color: 'var(--color-primary)', fontWeight: 700 }}>
                          · 🚛 Chofer: {item.driverName} ({item.patente || 'Flota'})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="sched-right">
                  <strong className="sched-price">${item.monto ? item.monto.toLocaleString('es-AR') : '0'}</strong>
                  <span className="sched-status">{item.estado || 'Confirmado'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Programar Mudanza Manual */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Programar Traslado o Mudanza Manual"
        size="md"
      >
        <form onSubmit={handleCreateScheduled} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Mariano Casares"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Dirección de Origen *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Belgrano (CABA)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Dirección de Destino *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: San Isidro (GBA)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Franja Horaria *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 14:30 hs"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                Valor Acordado (ARS) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="Ej: 55000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
              Tipo de Porte Requerido
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px' }}
            >
              <option value="Utilitario Chico (Kangoo)">Utilitario Chico (Kangoo / Partner)</option>
              <option value="Furgón Mediano (Sprinter)">Furgón Mediano (Sprinter / Master)</option>
              <option value="Camión Mudancero Grande">Camión Mudancero Grande</option>
            </select>
          </div>

          {isEmpresa && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  Chofer Asignado (Nómina)
                </label>
                <select
                  value={assignedDriverId}
                  onChange={(e) => {
                    const dId = e.target.value;
                    setAssignedDriverId(dId);
                    const found = staffDrivers.find((d) => d.id === dId);
                    if (found?.vehiculoPatente) setAssignedVehiclePlate(found.vehiculoPatente);
                  }}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="">-- Sin chofer asignado aún --</option>
                  {staffDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.appLinked ? '🟢' : '🟡'} {d.nombre} ({d.appLinked ? 'App Vinculada' : 'Sin app'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  Vehículo de Flota
                </label>
                <select
                  value={assignedVehiclePlate}
                  onChange={(e) => setAssignedVehiclePlate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }}
                >
                  <option value="">-- Asignación general --</option>
                  {vehicles.map((v) => (
                    <option key={v.id || v.patente} value={v.patente}>
                      🚛 {v.marca} {v.modelo} ({v.patente})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" size="md" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Guardar en Firestore 📅
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
