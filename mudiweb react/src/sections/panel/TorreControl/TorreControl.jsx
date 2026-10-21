import React, { useEffect, useRef, useState } from 'react';
import { db, doc, onSnapshot } from '../../../services/firebase';
import useGeolocation from '../../../hooks/useGeolocation';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './TorreControl.css';

export default function TorreControl({ user, profile, isEmpresa, onShowToast }) {
  const { coords, error: gpsError } = useGeolocation(user?.uid);
  const mapRef = useRef(null);
  const googleMapInstance = useRef(null);
  const phoneMarkerRef = useRef(null);

  // Active Trip State from Firestore
  const [activeTrip, setActiveTrip] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [completedTripsCount, setCompletedTripsCount] = useState(0);
  const [totalEarningsToday, setTotalEarningsToday] = useState(0);

  // Solicitudes de Mudanzas en Tiempo Real (App Android Clientes)
  const [movingRequests, setMovingRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState('todas'); // 'todas' | 'directas' | 'bolsa'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [acceptingTripId, setAcceptingTripId] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Nómina de Personal & Despacho a Chofer Dependiente (App Android)
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffDriverId, setSelectedStaffDriverId] = useState('');
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('');
  const [selectedHelperIds, setSelectedHelperIds] = useState([]);

  // Datos reales del chofer y póliza de seguro desde Firestore
  const [driverDocData, setDriverDocData] = useState(null);
  const [insuranceConfig, setInsuranceConfig] = useState(null);

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [creatingTrip, setCreatingTrip] = useState(false);

  const TRIP_STAGES = [
    { key: 'asignado', label: 'Asignado' },
    { key: 'en_camino', label: 'En Camino' },
    { key: 'en_origen', label: 'En Origen / Cargando' },
    { key: 'en_transito', label: 'En Tránsito' },
    { key: 'en_destino', label: 'En Destino / Descarga' }
  ];

  // 1. Escuchar Viajes y Solicitudes en tiempo real desde Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribeTrip = fleetService.subscribeActiveTrip(user.uid, (trip) => {
      setActiveTrip(trip);
    });

    const unsubscribeVehicles = fleetService.subscribeVehicles(user.uid, (vehs) => {
      setVehicles(vehs);
    });

    const unsubscribeCompleted = fleetService.subscribeCompletedTrips(user.uid, (trips) => {
      setCompletedTripsCount(trips.length);
      const total = trips.reduce((acc, t) => acc + (t.monto || 0), 0);
      setTotalEarningsToday(total);
    });

    const unsubscribeRequests = fleetService.subscribeMovingRequests(user.uid, isEmpresa, (reqs) => {
      setMovingRequests(reqs);
    });

    let unsubscribeStaff = null;
    if (isEmpresa) {
      unsubscribeStaff = fleetService.subscribeStaff(user.uid, (list) => {
        setStaffList(list);
      });
    }

    let unsubscribeDriver = null;
    if (user.uid) {
      unsubscribeDriver = onSnapshot(doc(db, 'drivers', user.uid), (snap) => {
        if (snap.exists()) {
          setDriverDocData(snap.data());
        }
      }, (err) => console.warn('Aviso leyendo driver en TorreControl:', err));

      fleetService.getDriverRates(user.uid).then((r) => {
        if (r?.seguroCarga) setInsuranceConfig(r.seguroCarga);
      }).catch(() => {});
    }

    return () => {
      unsubscribeTrip && unsubscribeTrip();
      unsubscribeVehicles && unsubscribeVehicles();
      unsubscribeCompleted && unsubscribeCompleted();
      unsubscribeRequests && unsubscribeRequests();
      unsubscribeStaff && unsubscribeStaff();
      unsubscribeDriver && unsubscribeDriver();
    };
  }, [user?.uid, isEmpresa]);

  // 2. Inicializar Google Maps
  useEffect(() => {
    if (!mapRef.current || !window.google || !window.google.maps) return;

    const defaultCenter = coords
      ? { lat: coords.latitude, lng: coords.longitude }
      : { lat: -34.6037, lng: -58.3816 }; // Buenos Aires CABA

    if (!googleMapInstance.current) {
      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0b1c30' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1c30' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#1d3557' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#2563eb' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#2563eb' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#051329' }]
          }
        ]
      });
    }

    // Actualizar o crear marcador de GPS del chofer
    if (coords && googleMapInstance.current) {
      const pos = { lat: coords.latitude, lng: coords.longitude };

      if (!phoneMarkerRef.current) {
        phoneMarkerRef.current = new window.google.maps.Marker({
          position: pos,
          map: googleMapInstance.current,
          title: 'Tu Teléfono en Tiempo Real',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        });
      } else {
        phoneMarkerRef.current.setPosition(pos);
      }
    }
  }, [coords]);

  const handleCenterMap = () => {
    if (coords && googleMapInstance.current) {
      googleMapInstance.current.panTo({
        lat: coords.latitude,
        lng: coords.longitude
      });
      googleMapInstance.current.setZoom(16);
    }
  };

  const advanceTripStage = async () => {
    if (!activeTrip) return;
    const stageKeys = TRIP_STAGES.map((s) => s.key);
    const currIdx = stageKeys.indexOf(activeTrip.estado);

    if (currIdx < stageKeys.length - 1) {
      const nextStage = stageKeys[currIdx + 1];
      try {
        await fleetService.advanceTripStep(activeTrip.id, nextStage, user?.uid);
        setActiveTrip({ ...activeTrip, estado: nextStage });
        if (onShowToast) {
          onShowToast(`Estado del viaje actualizado en Firestore: ${TRIP_STAGES[currIdx + 1].label}`, 'success');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Trigger OTP Modal for final completion
      setOtpModalOpen(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (inputOtp.trim() !== activeTrip.otpCode) {
      setOtpError('Código OTP incorrecto. Solicitá el PIN de 4 dígitos al cliente.');
      return;
    }

    try {
      await fleetService.completeTripWithOTP(activeTrip.id, inputOtp, user?.uid, activeTrip.monto);
      setActiveTrip(null);
      setOtpModalOpen(false);
      setInputOtp('');
      if (onShowToast) {
        onShowToast(`¡Viaje #${activeTrip.id} finalizado y cobrado exitosamente!`, 'success');
      }
    } catch (err) {
      setOtpError(err.message);
    }
  };

  const handleCreateNewTrip = async () => {
    setCreatingTrip(true);
    try {
      const activeVeh = vehicles[0] || driverDocData?.vehicle || profile?.vehicle;
      if (!activeVeh) {
        if (onShowToast) {
          onShowToast('Por favor registrá primero un vehículo en tu flota antes de iniciar un despacho en vivo.', 'warning');
        }
        setCreatingTrip(false);
        return;
      }

      const vehiculoName = activeVeh.marca ? `${activeVeh.marca} ${activeVeh.modelo || ''}`.trim() : (activeVeh.categoria || 'Furgón Mediano');
      const patenteName = activeVeh.patente || 'A Asignar';

      const sampleTrip = {
        driverId: user?.uid,
        driverName: user?.displayName || 'Conductor Mudify',
        clientName: 'Lucía Santillán',
        cliente: 'Lucía Santillán',
        origen: 'Av. Corrientes 4500, Almagro (CABA)',
        destino: 'Av. Libertador 2200, Olivos (Vicente López)',
        vehicleTypeRequired: activeVeh.categoria || 'Furgón Mediano',
        vehiculo: vehiculoName,
        patente: patenteName,
        estimatedPrice: 75000,
        monto: 75000,
        status: 'asignado',
        type: 'immediate',
        horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      };
      const created = await fleetService.createTrip(sampleTrip);
      setActiveTrip({
        id: created.id,
        ...sampleTrip,
        estado: 'asignado',
        otpCode: created.otpCode
      });
      if (onShowToast) {
        onShowToast('¡Nuevo despacho en vivo creado y sincronizado en Cloud Firestore!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Error creando viaje: ${err.message}`, 'error');
      }
    } finally {
      setCreatingTrip(false);
    }
  };

  // Choferes y Ayudantes de Nómina (Empresa)
  const staffDrivers = staffList.filter((s) => s.rol === 'conductor' || s.rol === 'chofer');
  const staffHelpers = staffList.filter((s) => s.rol !== 'conductor' && s.rol !== 'chofer');

  // Abrir modal de detalle y preseleccionar chofer/móvil
  const handleOpenDetailModal = (req) => {
    setSelectedRequest(req);
    if (staffDrivers.length > 0) {
      const defaultDriver = staffDrivers.find((d) => d.estado === 'disponible') || staffDrivers[0];
      setSelectedStaffDriverId(defaultDriver.id);
      setSelectedVehiclePlate(defaultDriver.vehiculoPatente || vehicles[0]?.patente || '');
    } else if (vehicles.length > 0) {
      setSelectedVehiclePlate(vehicles[0].patente);
    }
    setSelectedHelperIds([]);
    setDetailModalOpen(true);
  };

  // Aceptar solicitud de mudanza (Despacho a Chofer Dependiente o Asignación Titular)
  const handleAcceptRequest = async (request) => {
    setAcceptingTripId(request.id);
    try {
      if (isEmpresa && selectedStaffDriverId) {
        const selectedStaff = staffDrivers.find((d) => d.id === selectedStaffDriverId);
        const selectedVeh = vehicles.find((v) => v.patente === selectedVehiclePlate) || vehicles[0] || null;
        const assignedHelpers = staffHelpers
          .filter((h) => selectedHelperIds.includes(h.id))
          .map((h) => `${h.nombre} (${h.rolLabel || h.rol})`);

        await fleetService.assignTripToStaffDriver(
          request.id,
          user.uid,
          user.displayName || 'Empresa Mudify',
          selectedStaff,
          selectedVeh,
          assignedHelpers
        );

        if (onShowToast) {
          onShowToast(
            `¡Mudanza asignada a ${selectedStaff.nombre} (${selectedVeh?.patente || 'Flota'}) y enviada a su App Android Mudancero!`,
            'success'
          );
        }
      } else {
        await fleetService.acceptMovingRequest(request.id, user.uid, user.displayName, isEmpresa);
        if (onShowToast) {
          onShowToast(`¡Mudanza de ${request.clientName} aceptada! Asignada a tu radar de despacho.`, 'success');
        }
      }
      if (detailModalOpen) setDetailModalOpen(false);
    } catch (err) {
      console.error(err);
      if (onShowToast) {
        onShowToast(`Error aceptando solicitud: ${err.message}`, 'error');
      }
    } finally {
      setAcceptingTripId(null);
    }
  };

  // Simular solicitud de cliente desde la App Android
  const handleSimulateRequest = async (isDirect = false) => {
    setSimulating(true);
    try {
      const created = await fleetService.createSimulatedMovingRequest(user?.uid, isDirect);
      if (onShowToast) {
        onShowToast(
          isDirect
            ? `⚡ ¡Solicitud directa de ${created.clientName} recibida en tiempo real desde Firestore!`
            : `📦 ¡Nueva solicitud en bolsa de mudanzas creada (${created.clientName})!`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error: ${err.message}`, 'error');
    } finally {
      setSimulating(false);
    }
  };

  // Enviar contraoferta / cotización al cliente
  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !offerPrice) return;
    try {
      await fleetService.proposeTripOffer(selectedRequest.id, user.uid, user.displayName, Number(offerPrice));
      if (onShowToast) {
        onShowToast(`Contraoferta de $${Number(offerPrice).toLocaleString('es-AR')} ARS enviada a ${selectedRequest.clientName}.`, 'success');
      }
      setOfferModalOpen(false);
      setOfferPrice('');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error enviando cotización: ${err.message}`, 'error');
    }
  };

  // Filtros de solicitudes
  const directRequests = movingRequests.filter((r) => r.isDirect);
  const openRequests = movingRequests.filter((r) => !r.isDirect);

  const filteredRequests = movingRequests.filter((r) => {
    if (requestFilter === 'directas') return r.isDirect;
    if (requestFilter === 'bolsa') return !r.isDirect;
    return true;
  });

  // Determinar vehículo activo de telemetría (100% dinámico desde Firestore)
  // 1) Si hay un viaje activo en curso, usar el vehículo de dicho viaje
  // 2) Si hay vehículos en la flota registrados en Firestore, usar el primero
  // 3) Si el chofer tiene un vehículo registrado en su documento de conductor (App Android o perfil)
  // 4) Si no tiene ningún vehículo registrado en la base de datos, null
  const activeTripVehicle = activeTrip ? {
    marca: activeTrip.vehiculo || activeTrip.vehicleTypeRequired || 'Unidad en Ruta',
    modelo: '',
    categoria: activeTrip.vehicleTypeRequired || activeTrip.porte || 'Furgón',
    patente: (activeTrip.patente || activeTrip.assignedVehiclePlate || '').toUpperCase(),
    vtv: 'Vigente en Servicio',
    seguro: 'Póliza de Carga en Viaje'
  } : null;

  const rawVeh = vehicles.length > 0 ? vehicles[0] : (driverDocData?.vehicle || profile?.vehicle || null);

  const registeredVehicle = rawVeh ? {
    marca: rawVeh.marca || rawVeh.brand || '',
    modelo: rawVeh.modelo || rawVeh.model || '',
    categoria: rawVeh.categoria || rawVeh.type || '',
    patente: (rawVeh.patente || rawVeh.plate || '').toUpperCase(),
    vtv: rawVeh.vtv || '',
    seguro: rawVeh.seguro || ''
  } : null;

  const currentVehicle = activeTripVehicle || registeredVehicle || null;
  const hasVehicle = Boolean(currentVehicle && (currentVehicle.marca || currentVehicle.patente || currentVehicle.categoria));

  // Velocidad Real (Calculada desde Geolocation coords.speed en m/s a km/h)
  // NUNCA hardcodear valores falsos. Si coords.speed no está disponible o es 0, mostrar el estado real.
  const realSpeedKmH = (coords && typeof coords.speed === 'number' && coords.speed > 0)
    ? Math.round(coords.speed * 3.6)
    : 0;

  const speedDisplay = realSpeedKmH > 0
    ? `${realSpeedKmH} km/h`
    : activeTrip && activeTrip.estado === 'en_transito'
    ? '0 km/h (Detenido en semáforo / tránsito)'
    : coords
    ? '0 km/h (Vehículo detenido / En base)'
    : '0 km/h (GPS sin movimiento)';

  // Estado de Transmisión del Móvil
  const transmissionStatus = activeTrip
    ? { label: `● En Ruta · Misión #${String(activeTrip.id || '').slice(-4).toUpperCase()}`, className: 'badge-live-pulse badge-live-pulse--active' }
    : coords && hasVehicle
    ? { label: '● GPS En Línea · Disponible', className: 'badge-live-pulse' }
    : hasVehicle
    ? { label: '○ En Espera · Sin viaje activo', className: 'badge-live-pulse badge-live-pulse--idle' }
    : { label: '⚠️ Sin Vehículo en Flota', className: 'badge-live-pulse badge-live-pulse--warning' };

  // Precisión GPS Real
  const gpsPrecisionDisplay = coords?.accuracy
    ? `±${Math.round(coords.accuracy)} metros (${coords.accuracy <= 20 ? 'Excelente' : coords.accuracy <= 50 ? 'Buena' : 'Aproximada'})`
    : gpsError
    ? `GPS inactivo (${gpsError})`
    : 'Buscando satélites...';

  // Cumplimiento Legal & Pólizas
  const vtvText = currentVehicle?.vtv
    ? currentVehicle.vtv
    : hasVehicle
    ? 'VTV: Pendiente de carga en Flota'
    : 'VTV: Requiere registrar vehículo';
  const vtvOk = Boolean(currentVehicle?.vtv && !currentVehicle.vtv.toLowerCase().includes('vencid'));

  const rawSeguro = currentVehicle?.seguro
    || (insuranceConfig?.activo ? `${insuranceConfig.aseguradora || 'La Segunda Seguros'} (${insuranceConfig.numeroPoliza || 'Póliza Activa'})` : null)
    || (driverDocData?.seguroCarga ? 'Póliza de Carga Activa' : null);

  const seguroText = rawSeguro
    ? `Seguro: ${rawSeguro}`
    : 'Seguro de Carga: Sin póliza activa';
  const seguroOk = Boolean(rawSeguro);

  let choferStatusText = '';
  let choferOk = false;
  if (activeTrip?.driverName) {
    choferStatusText = `Chofer en Ruta: ${activeTrip.driverName}`;
    choferOk = true;
  } else if (isEmpresa && staffDrivers.length > 0) {
    const d = staffDrivers[0];
    choferStatusText = `Chofer Titular: ${d.nombre} (${d.licencia?.categoria || 'LINTI Cargas Generales'})`;
    choferOk = true;
  } else if (driverDocData?.documents?.license || profile?.license) {
    const lic = driverDocData?.documents?.license || profile?.license;
    choferStatusText = `Chofer Habilitado: LINTI ${lic}`;
    choferOk = true;
  } else if (user?.displayName) {
    choferStatusText = `Chofer: ${user.displayName} (Habilitación en verificación)`;
    choferOk = true;
  } else {
    choferStatusText = 'Chofer: Pendiente de asignación';
    choferOk = false;
  }

  return (
    <div className="torre-control">
      {/* Subheader */}
      <div className="torre-header">
        <div>
          <div className="telemetry-badge">
            <span className="pulse-dot"></span>
            <span>TELEMETRÍA SATELITAL · FEED EN TIEMPO REAL FIRESTORE</span>
            <span className="hub-tag">Hub AMBA Activo</span>
          </div>
          <h1 className="torre-title">Torre de Control Operativo</h1>
        </div>

        <div className="torre-header__actions">
          {!activeTrip ? (
            <Button
              variant="primary"
              size="md"
              icon={<span className="material-symbols-outlined">add_circle</span>}
              onClick={handleCreateNewTrip}
              disabled={creatingTrip}
            >
              {creatingTrip ? 'Generando...' : '+ Tomar / Iniciar Despacho en Vivo'}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="md"
              icon={<span className="material-symbols-outlined">sim_card_download</span>}
              onClick={() => onShowToast && onShowToast('Exportando manifiesto de carga del viaje activo...', 'info')}
            >
              Exportar Manifiesto
            </Button>
          )}
        </div>
      </div>

      {/* 5 KPIs Grid desde Base de Datos */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Viajes en Curso</span>
            <span className="material-symbols-outlined kpi-icon text-primary">local_shipping</span>
          </div>
          <div className="kpi-value">{activeTrip ? '1' : '0'}</div>
          <span className="kpi-sub text-success">
            {activeTrip ? '● Misión activa en ruta' : '○ Esperando nueva asignación'}
          </span>
        </div>

        <div className="kpi-card" style={{ borderLeft: directRequests.length > 0 ? '3px solid #f59e0b' : '1px solid var(--color-border)' }}>
          <div className="kpi-top">
            <span className="kpi-label">Solicitudes Entrantes</span>
            <span className="material-symbols-outlined kpi-icon" style={{ color: directRequests.length > 0 ? '#f59e0b' : 'var(--color-primary)' }}>
              mark_chat_unread
            </span>
          </div>
          <div className="kpi-value" style={{ color: directRequests.length > 0 ? '#b45309' : 'var(--color-text-primary)' }}>
            {movingRequests.length}
          </div>
          <span className="kpi-sub" style={{ color: directRequests.length > 0 ? '#b45309' : 'var(--color-text-secondary)', fontWeight: directRequests.length > 0 ? 700 : 400 }}>
            {directRequests.length > 0 ? `⚡ ${directRequests.length} directa${directRequests.length > 1 ? 's' : ''} para vos` : 'Bolsa y app en vivo'}
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Facturación Acumulada</span>
            <span className="material-symbols-outlined kpi-icon text-secondary">payments</span>
          </div>
          <div className="kpi-value">
            ${((activeTrip ? activeTrip.monto : 0) + totalEarningsToday).toLocaleString('es-AR')}
          </div>
          <span className="kpi-sub text-success">Cobro directo 0% comisión</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Viajes Finalizados</span>
            <span className="material-symbols-outlined kpi-icon text-tertiary">task_alt</span>
          </div>
          <div className="kpi-value">{completedTripsCount}</div>
          <span className="kpi-sub text-success">Registrados en Firestore</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Móviles en Flota</span>
            <span className="material-symbols-outlined kpi-icon text-primary">directions_bus</span>
          </div>
          <div className="kpi-value">{vehicles.length} / {isEmpresa ? '10' : '1'}</div>
          <span className="kpi-sub">{isEmpresa ? 'Flota multi-unidad' : 'Plan Fletero Pro (1 móvil)'}</span>
        </div>
      </div>

      {/* 1. SECCIÓN DE VIAJE ACTIVO CON STEPPER (Si hay misión en curso) */}
      {activeTrip && (
        <div className="active-trip-card">
          <div className="trip-card-header">
            <div className="trip-badge-live">
              <span className="pulse-dot"></span>
              <strong>MISIÓN EN TIEMPO REAL #{activeTrip.id.slice(-6).toUpperCase()}</strong>
            </div>
            <div className="trip-price-tag">
              Valor acordado: <strong>${activeTrip.monto.toLocaleString('es-AR')} ARS</strong>
            </div>
          </div>

          <div className="trip-route-info">
            <div className="route-point">
              <span className="point-icon origin">●</span>
              <div>
                <span className="point-label">Origen (Cliente: {activeTrip.cliente})</span>
                <p className="point-address">{activeTrip.origen}</p>
              </div>
            </div>
            <div className="route-arrow">➔</div>
            <div className="route-point">
              <span className="point-icon destination">●</span>
              <div>
                <span className="point-label">Destino</span>
                <p className="point-address">{activeTrip.destino}</p>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="trip-stepper">
            {TRIP_STAGES.map((stage, idx) => {
              const stageKeys = TRIP_STAGES.map((s) => s.key);
              const currentIdx = stageKeys.indexOf(activeTrip.estado);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div
                  key={stage.key}
                  className={`step-item ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  <div className="step-circle">{isPast ? '✓' : idx + 1}</div>
                  <span className="step-title">{stage.label}</span>
                </div>
              );
            })}
          </div>

          {/* Stepper Actions */}
          <div className="trip-actions">
            <Button variant="primary" size="md" onClick={advanceTripStage}>
              {activeTrip.estado === 'en_destino'
                ? 'Validar Entrega con OTP 🔐'
                : 'Avanzar Siguiente Estado ➔'}
            </Button>
            <span className="trip-otp-hint">
              Código PIN de entrega del cliente: <strong>{activeTrip.otpCode}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 2. SECCIÓN PRINCIPAL: BANDEJA DE SOLICITUDES DE MUDANZAS EN VIVO */}
      <div className="solicitudes-section">
        <div className="solicitudes-header">
          <div className="solicitudes-header__title">
            <div className="live-feed-badge">
              <span className="pulse-dot-green"></span>
              <span>FEED EN VIVO · APP ANDROID CLIENTES &amp; BOLSA DE CARGA</span>
            </div>
            <h2 className="solicitudes-title">Solicitudes de Mudanzas Recibidas</h2>
            <p className="solicitudes-sub">
              En las apps Android los clientes eligen si desean contratar a un conductor independiente o a una empresa. Aquí podés revisar sus solicitudes en tiempo real, ver inventario y aceptarlas o cotizar.
            </p>
          </div>

          <div className="solicitudes-header__actions">
            <Button
              variant="outline"
              size="sm"
              icon={<span className="material-symbols-outlined">bolt</span>}
              onClick={() => handleSimulateRequest(true)}
              disabled={simulating}
              title="Crea una solicitud directa enviada a tu cuenta por un cliente de la app"
            >
              {simulating ? 'Enviando...' : '+ Simular Solicitud Directa'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<span className="material-symbols-outlined">public</span>}
              onClick={() => handleSimulateRequest(false)}
              disabled={simulating}
              title="Crea una solicitud abierta en la bolsa de mudanzas"
            >
              {simulating ? 'Enviando...' : '+ Simular Bolsa Abierta'}
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="solicitudes-tabs">
          <button
            className={`sol-tab ${requestFilter === 'todas' ? 'active' : ''}`}
            onClick={() => setRequestFilter('todas')}
          >
            Todas las Solicitudes ({movingRequests.length})
          </button>
          <button
            className={`sol-tab sol-tab--direct ${requestFilter === 'directas' ? 'active' : ''}`}
            onClick={() => setRequestFilter('directas')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
            <span>Directas para {isEmpresa ? 'tu Empresa' : 'Vos'}</span>
            <span className="sol-tab-count">{directRequests.length}</span>
          </button>
          <button
            className={`sol-tab ${requestFilter === 'bolsa' ? 'active' : ''}`}
            onClick={() => setRequestFilter('bolsa')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>work</span>
            <span>Bolsa Abierta de Cargas</span>
            <span className="sol-tab-count">{openRequests.length}</span>
          </button>
        </div>

        {/* List of Requests */}
        {filteredRequests.length > 0 ? (
          <div className="solicitudes-grid">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className={`sol-card ${req.isDirect ? 'sol-card--direct' : ''}`}
              >
                {/* Card Top: Badges & Price */}
                <div className="sol-card-top">
                  <div className="sol-badges">
                    {req.isDirect ? (
                      <span className="sol-badge sol-badge--direct">
                        ⚡ Solicitud Directa a {isEmpresa ? 'tu Empresa' : 'tu Perfil'}
                      </span>
                    ) : (
                      <span className="sol-badge sol-badge--open">
                        🌐 Bolsa Abierta
                      </span>
                    )}

                    {req.type === 'immediate' ? (
                      <span className="sol-badge sol-badge--immediate">
                        🔴 Inmediata
                      </span>
                    ) : (
                      <span className="sol-badge sol-badge--scheduled">
                        📅 {req.scheduledDate || 'Programada'}
                      </span>
                    )}
                  </div>

                  <div className="sol-price-block">
                    <span className="sol-price-amount">
                      ${req.price ? req.price.toLocaleString('es-AR') : 'A convenir'}
                    </span>
                    <span className="sol-price-curr">ARS</span>
                  </div>
                </div>

                {/* Client Row */}
                <div className="sol-client-row">
                  <img
                    src={req.clientPhoto || '/assets/images/logo.png'}
                    alt={req.clientName}
                    className="sol-avatar"
                  />
                  <div className="sol-client-meta">
                    <span className="sol-client-name">{req.clientName}</span>
                    <span className="sol-client-req">
                      Vehículo: <strong>{req.requiredVehicleType}</strong>
                      {req.helpersNeeded > 0 && ` · ${req.helpersNeeded} ayudante${req.helpersNeeded > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                {/* Route Box */}
                <div className="sol-route-wrap">
                  <div className="sol-route-row">
                    <span className="sol-dot sol-dot--origin"></span>
                    <div className="sol-route-text">
                      <p className="sol-addr">{req.originAddress}</p>
                      <div className="sol-sub-tags">
                        {req.originFloor && <span>Piso {req.originFloor}</span>}
                        <span>{req.hasElevatorOrigin ? '🛗 Ascensor' : '🪜 Escalera'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sol-route-row">
                    <span className="sol-dot sol-dot--dest"></span>
                    <div className="sol-route-text">
                      <p className="sol-addr">{req.destinationAddress}</p>
                      <div className="sol-sub-tags">
                        {req.floorDestination && <span>Piso {req.floorDestination}</span>}
                        <span>{req.hasElevatorDestination ? '🛗 Ascensor' : '🪜 Escalera'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sol-route-meta">
                    <span>{req.distance || '~'}</span>
                    <span>·</span>
                    <span>{req.duration || 'Ruta AMBA'}</span>
                  </div>
                </div>

                {/* Cargo & Specs */}
                <div className="sol-cargo-box">
                  <p className="sol-cargo-desc">
                    <strong>Carga:</strong> {req.cargoDescription}
                  </p>
                  <div className="sol-specs-tags">
                    {req.requiresPackaging && <span className="chip-spec">Embalaje</span>}
                    {req.requiresAssembly && <span className="chip-spec">Desarme</span>}
                    {req.requiresBalconyElevation && <span className="chip-spec">Subida Balcón</span>}
                    {req.inventarioItems && req.inventarioItems.length > 0 && (
                      <span className="chip-spec chip-spec--inv">
                        📋 {req.inventarioItems.length} ítems inventario
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="sol-card-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>}
                    onClick={() => {
                      if (isEmpresa) {
                        handleOpenDetailModal(req);
                      } else {
                        handleAcceptRequest(req);
                      }
                    }}
                    disabled={acceptingTripId === req.id}
                  >
                    {acceptingTripId === req.id
                      ? 'Asignando...'
                      : isEmpresa
                      ? 'Despachar Chofer'
                      : 'Aceptar Mudanza'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetailModal(req)}
                  >
                    Ver Detalle
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(req);
                      setOfferPrice(req.price || '');
                      setOfferModalOpen(true);
                    }}
                  >
                    Cotizar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sol-empty-state">
            <span className="material-symbols-outlined sol-radar-icon">radar</span>
            <h3 className="sol-empty-title">
              {requestFilter === 'directas'
                ? `No tenés solicitudes directas pendientes en este momento`
                : 'No hay solicitudes de mudanzas disponibles en este momento'}
            </h3>
            <p className="sol-empty-desc">
              Tu GPS y estado operativo están activos en la app Android de los clientes. Cuando un cliente cree una solicitud de mudanza (seleccionando tu perfil o publicando a la bolsa general), aparecerá aquí instantáneamente.
            </p>
            <div className="sol-empty-actions">
              <Button
                variant="primary"
                size="md"
                icon={<span className="material-symbols-outlined">bolt</span>}
                onClick={() => handleSimulateRequest(true)}
                disabled={simulating}
              >
                {simulating ? 'Generando...' : '+ Crear Solicitud Directa de Prueba'}
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<span className="material-symbols-outlined">public</span>}
                onClick={() => handleSimulateRequest(false)}
                disabled={simulating}
              >
                {simulating ? 'Generando...' : '+ Crear Solicitud en Bolsa Abierta'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split: Radar Google Maps + Vehicle Telemetry */}
      <div className="torre-main-split">
        {/* Radar Map Canvas */}
        <div className="map-container">
          <div className="map-toolbar">
            <div className="map-toolbar__title">
              <span className="pulse-ping"></span>
              <h3>Radar Satelital GPS · Monitoreo en Vivo</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<span className="material-symbols-outlined">my_location</span>}
              onClick={handleCenterMap}
            >
              Centrar en Mi Teléfono
            </Button>
          </div>

          <div className="map-canvas-wrap">
            <div ref={mapRef} className="google-map-canvas" />
            <div className="radar-ambient-overlay">
              <span className="radar-coords-label">
                {coords
                  ? `Lat: ${coords.latitude.toFixed(5)} | Lng: ${coords.longitude.toFixed(5)}`
                  : 'Sincronizando constelación GPS en tu teléfono...'}
              </span>
            </div>
          </div>
        </div>

        {/* Real Vehicle Telemetry Info */}
        <div className="vehicle-telemetry-sidebar">
          <div className="telemetry-box">
            <div className="telemetry-box-header">
              <h4>Móvil Activo en Ruta</h4>
              <span className={transmissionStatus.className}>{transmissionStatus.label}</span>
            </div>

            <div className="veh-detail-row">
              <span className="label">Unidad:</span>
              <strong className="value">
                {hasVehicle
                  ? `${currentVehicle.marca || ''} ${currentVehicle.modelo || ''} ${currentVehicle.categoria ? `(${currentVehicle.categoria})` : ''}`.trim()
                  : 'Sin vehículo registrado'}
              </strong>
            </div>
            <div className="veh-detail-row">
              <span className="label">Patente:</span>
              <strong className="value font-mono">
                {hasVehicle && currentVehicle.patente ? currentVehicle.patente : '---'}
              </strong>
            </div>
            <div className="veh-detail-row">
              <span className="label">Velocidad Actual:</span>
              <strong className="value">
                {speedDisplay}
              </strong>
            </div>
            <div className="veh-detail-row">
              <span className="label">Precisión GPS:</span>
              <strong className="value">
                {gpsPrecisionDisplay}
              </strong>
            </div>

            {!hasVehicle && (
              <div className="telemetry-no-veh-alert">
                <span className="material-symbols-outlined">info</span>
                <span>Registrá una unidad en la pestaña "Flota de Vehículos" para ver la telemetría oficial de tu móvil.</span>
              </div>
            )}
          </div>

          <div className="legal-compliance-box">
            <div className="legal-header">
              <span className="material-symbols-outlined text-tertiary">verified_user</span>
              <h4>Cumplimiento Legal &amp; Pólizas</h4>
            </div>
            <ul className="legal-list">
              <li>
                <span className={vtvOk ? 'check' : 'check-warn'}>{vtvOk ? '✓' : '⚠️'}</span>
                <span>{vtvText}</span>
              </li>
              <li>
                <span className={seguroOk ? 'check' : 'check-warn'}>{seguroOk ? '✓' : '⚠️'}</span>
                <span>{seguroText}</span>
              </li>
              <li>
                <span className={choferOk ? 'check' : 'check-warn'}>{choferOk ? '✓' : '⚠️'}</span>
                <span>{choferStatusText}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      <Modal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Validación de Entrega con Código OTP"
        size="md"
      >
        <form onSubmit={handleVerifyOtp} className="otp-modal-form">
          <p className="otp-modal-desc">
            Solicitá al cliente el <strong>Código de Seguridad de 4 dígitos</strong> que figura en su app o comprobante
            para garantizar que las pertenencias fueron entregadas y descargadas en conformidad.
          </p>

          <div className="otp-input-wrap">
            <label htmlFor="otp-input">PIN de Entrega (4 dígitos) *</label>
            <input
              id="otp-input"
              type="text"
              maxLength={4}
              required
              placeholder="Ej: 4819"
              value={inputOtp}
              onChange={(e) => setInputOtp(e.target.value)}
              className="otp-digit-input"
              autoFocus
            />
          </div>

          {otpError && <p className="otp-error-msg">{otpError}</p>}

          <div className="otp-modal-actions">
            <Button variant="outline" size="md" onClick={() => setOtpModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirmar Entrega y Cobro ➔
            </Button>
          </div>
        </form>
      </Modal>

      {/* Moving Request Detail & Inventory Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedRequest ? `Detalle de Mudanza · ${selectedRequest.clientName}` : 'Detalle de Solicitud'}
        maxWidth="680px"
      >
        {selectedRequest && (
          <div className="req-detail-modal">
            {/* Direct / Open Banner */}
            <div className={`detail-banner ${selectedRequest.isDirect ? 'detail-banner--direct' : 'detail-banner--open'}`}>
              <span className="material-symbols-outlined">
                {selectedRequest.isDirect ? 'bolt' : 'public'}
              </span>
              <div>
                <strong>
                  {selectedRequest.isDirect
                    ? `⚡ Solicitud Directa: El cliente eligió específicamente ${isEmpresa ? 'tu Empresa' : 'tu Perfil'}`
                    : '🌐 Solicitud en Bolsa Abierta: Disponible para tomar o cotizar'}
                </strong>
                <p>
                  {selectedRequest.type === 'immediate'
                    ? 'Modalidad: Inmediata (Requiere disponibilidad en el momento)'
                    : `Modalidad: Programada (${selectedRequest.scheduledDate || 'A convenir'})`}
                </p>
              </div>
            </div>

            {/* Client & Pricing Header */}
            <div className="detail-client-row">
              <div className="detail-client-info">
                <img
                  src={selectedRequest.clientPhoto || '/assets/images/logo.png'}
                  alt={selectedRequest.clientName}
                  className="detail-avatar"
                />
                <div>
                  <h4>{selectedRequest.clientName}</h4>
                  <p className="detail-client-sub">Cliente registrado en App Mudify</p>
                  {selectedRequest.clientPhone && (
                    <a
                      href={`https://wa.me/549${selectedRequest.clientPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-whatsapp-btn"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chat</span>
                      <span>WhatsApp: {selectedRequest.clientPhone}</span>
                    </a>
                  )}
                </div>
              </div>
              <div className="detail-price-box">
                <span className="detail-price-label">Presupuesto Estimado</span>
                <span className="detail-price-val">
                  ${selectedRequest.price ? selectedRequest.price.toLocaleString('es-AR') : 'A convenir'}
                </span>
                <span className="detail-price-sub">ARS · Cobro directo 0% comisión</span>
              </div>
            </div>

            {/* Route Box */}
            <div className="detail-route-card">
              <div className="detail-route-stop">
                <span className="route-dot route-dot--origin"></span>
                <div className="stop-text">
                  <span className="stop-label">PUNTO DE ORIGEN</span>
                  <p className="stop-address">{selectedRequest.originAddress}</p>
                  <div className="stop-features">
                    {selectedRequest.originFloor && <span>Piso {selectedRequest.originFloor}</span>}
                    <span>{selectedRequest.hasElevatorOrigin ? '🛗 Con ascensor' : '🪜 Por escalera'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-route-divider">
                <span className="route-line"></span>
                <span className="route-dist-chip">{selectedRequest.distance || '~'} · {selectedRequest.duration || 'En ruta'}</span>
              </div>

              <div className="detail-route-stop">
                <span className="route-dot route-dot--destination"></span>
                <div className="stop-text">
                  <span className="stop-label">PUNTO DE DESTINO</span>
                  <p className="stop-address">{selectedRequest.destinationAddress}</p>
                  <div className="stop-features">
                    {selectedRequest.floorDestination && <span>Piso {selectedRequest.floorDestination}</span>}
                    <span>{selectedRequest.hasElevatorDestination ? '🛗 Con ascensor' : '🪜 Por escalera'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Requirements */}
            <div className="detail-specs-grid">
              <div className="detail-spec-box">
                <span className="material-symbols-outlined">local_shipping</span>
                <div>
                  <span className="spec-label">Vehículo Recomendado</span>
                  <strong>{selectedRequest.requiredVehicleType}</strong>
                </div>
              </div>
              <div className="detail-spec-box">
                <span className="material-symbols-outlined">group</span>
                <div>
                  <span className="spec-label">Ayudantes Solicitados</span>
                  <strong>{selectedRequest.helpersNeeded > 0 ? `${selectedRequest.helpersNeeded} peones` : 'Solo conductor'}</strong>
                </div>
              </div>
              <div className="detail-spec-box">
                <span className="material-symbols-outlined">inventory_2</span>
                <div>
                  <span className="spec-label">Servicios Adicionales</span>
                  <div className="detail-chips-row">
                    {selectedRequest.requiresPackaging && <span className="chip-svc">Embalaje</span>}
                    {selectedRequest.requiresAssembly && <span className="chip-svc">Desarme</span>}
                    {selectedRequest.requiresBalconyElevation && <span className="chip-svc">Balcón</span>}
                    {!selectedRequest.requiresPackaging && !selectedRequest.requiresAssembly && !selectedRequest.requiresBalconyElevation && (
                      <span className="chip-svc chip-svc--none">Estándar</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo & Itemized Inventory */}
            <div className="detail-cargo-box">
              <h5>Descripción General de Carga</h5>
              <p>{selectedRequest.cargoDescription || 'Sin descripción detallada'}</p>

              {selectedRequest.inventarioItems && selectedRequest.inventarioItems.length > 0 && (
                <div className="detail-inventory-wrap">
                  <h5 style={{ marginTop: '12px', marginBottom: '8px' }}>
                    Inventario Declarado por el Cliente ({selectedRequest.inventarioItems.length} ítems)
                  </h5>
                  <div className="inventory-table-wrap">
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Artículo / Mueble</th>
                          <th>Categoría</th>
                          <th style={{ textAlign: 'center' }}>Cant.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequest.inventarioItems.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.nombre || item.name || item.articulo}</strong></td>
                            <td>{item.categoria || item.category || 'Muebles'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="inv-badge">{item.cantidad || item.qty || 1}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedRequest.specialInstructions && (
                <div className="detail-instructions" style={{ marginTop: '12px' }}>
                  <strong>Indicaciones especiales del cliente:</strong>
                  <p style={{ margin: '4px 0 0' }}>{selectedRequest.specialInstructions}</p>
                </div>
              )}
            </div>

            {/* Asignación Operativa para Empresas (Chofer Dependiente Android + Vehículo + Peones) */}
            {isEmpresa && (
              <div className="detail-enterprise-dispatch">
                <div className="dispatch-section-header">
                  <span className="material-symbols-outlined">badge</span>
                  <div>
                    <h5>Asignación Operativa de Cuadrilla &amp; Móvil Android</h5>
                    <p>Seleccioná el chofer dependiente de tu nómina que ejecutará este traslado en su app</p>
                  </div>
                </div>

                <div className="dispatch-grid">
                  {/* Chofer selector */}
                  <div className="dispatch-field">
                    <label>Chofer Asignado (Nómina) *</label>
                    {staffDrivers.length > 0 ? (
                      <select
                        value={selectedStaffDriverId}
                        onChange={(e) => {
                          const dId = e.target.value;
                          setSelectedStaffDriverId(dId);
                          const found = staffDrivers.find((d) => d.id === dId);
                          if (found?.vehiculoPatente) setSelectedVehiclePlate(found.vehiculoPatente);
                        }}
                        className="dispatch-select"
                      >
                        {staffDrivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.appLinked ? '🟢' : '🟡'} {d.nombre} — {d.licencia?.categoria || 'Licencia B/C'} ({d.appLinked ? 'App Vinculada' : 'Sin vincular'})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="dispatch-no-drivers">
                        <span>⚠️ No tenés choferes en nómina. Agregalos en "Nómina de Personal".</span>
                      </div>
                    )}
                  </div>

                  {/* Vehículo selector */}
                  <div className="dispatch-field">
                    <label>Vehículo de Flota Asignado *</label>
                    {vehicles.length > 0 ? (
                      <select
                        value={selectedVehiclePlate}
                        onChange={(e) => setSelectedVehiclePlate(e.target.value)}
                        className="dispatch-select"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id || v.patente} value={v.patente}>
                            🚛 {v.marca} {v.modelo} ({v.patente}) — {v.categoria}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="dispatch-no-drivers">
                        <span>⚠️ Sin vehículos en flota registrados.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ayudantes multi-select */}
                {staffHelpers.length > 0 && (
                  <div className="dispatch-helpers-wrap">
                    <label>
                      Ayudantes / Peones de Cuadrilla ({selectedHelperIds.length} seleccionados)
                      {selectedRequest.helpersNeeded > 0 && (
                        <span className="req-helpers-hint"> (El cliente solicitó {selectedRequest.helpersNeeded} peones)</span>
                      )}
                    </label>
                    <div className="helpers-pills">
                      {staffHelpers.map((h) => {
                        const isSelected = selectedHelperIds.includes(h.id);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            className={`helper-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedHelperIds((prev) =>
                                isSelected ? prev.filter((id) => id !== h.id) : [...prev, h.id]
                              );
                            }}
                          >
                            <span className="material-symbols-outlined">{isSelected ? 'check_circle' : 'person_add'}</span>
                            <span>{h.nombre} ({h.rolLabel || h.rol})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="dispatch-notice-box">
                  <span className="material-symbols-outlined">lock</span>
                  <p>
                    <strong>Seguridad Operativa:</strong> Al despachar, el chofer recibirá la orden en su app móvil <strong>Mudancero</strong> con navegación GPS e inventario. Sus módulos de facturación y edición de tarifas se mantendrán bloqueados por la empresa.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="detail-modal-actions">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setDetailModalOpen(false);
                  setOfferPrice(selectedRequest.price || '');
                  setOfferModalOpen(true);
                }}
              >
                Proponer Contraoferta / Cotizar
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<span className="material-symbols-outlined">check_circle</span>}
                onClick={() => handleAcceptRequest(selectedRequest)}
                disabled={acceptingTripId === selectedRequest.id}
              >
                {acceptingTripId === selectedRequest.id
                  ? 'Asignando...'
                  : isEmpresa && selectedStaffDriverId
                  ? 'Despachar a Chofer en App Android ➔'
                  : 'Aceptar Mudanza y Salir a Ruta ➔'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Counter-Offer Modal */}
      <Modal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        title="Proponer Tarifa / Contraoferta"
        subtitle={selectedRequest ? `Cliente: ${selectedRequest.clientName} · ${selectedRequest.distance}` : ''}
        maxWidth="480px"
      >
        {selectedRequest && (
          <form onSubmit={handleSendOffer} className="offer-modal-form">
            <p className="offer-modal-desc">
              El cliente presupuestó <strong>${selectedRequest.price ? selectedRequest.price.toLocaleString('es-AR') : '0'} ARS</strong>. Podés enviar una tarifa ajustada según tus peones, combustible o complejidad.
            </p>

            <div className="offer-input-wrap">
              <label htmlFor="offer-input">Tu Tarifa Propuesta ($ ARS) *</label>
              <input
                id="offer-input"
                type="number"
                required
                min={1000}
                step={500}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="offer-num-input"
                placeholder="Ej: 75000"
                autoFocus
              />
            </div>

            <div className="offer-presets">
              <button
                type="button"
                className="preset-btn"
                onClick={() => setOfferPrice(Math.round(selectedRequest.price * 1.1))}
              >
                +10% (${Math.round(selectedRequest.price * 1.1).toLocaleString('es-AR')})
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setOfferPrice(Math.round(selectedRequest.price * 1.2))}
              >
                +20% (${Math.round(selectedRequest.price * 1.2).toLocaleString('es-AR')})
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => setOfferPrice(selectedRequest.price)}
              >
                Original (${selectedRequest.price.toLocaleString('es-AR')})
              </button>
            </div>

            <div className="offer-modal-actions">
              <Button variant="outline" size="md" onClick={() => setOfferModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="md" type="submit">
                Enviar Propuesta a la App ➔
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
