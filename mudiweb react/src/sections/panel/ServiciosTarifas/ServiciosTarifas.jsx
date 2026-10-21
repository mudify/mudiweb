import React, { useState, useEffect, useMemo } from 'react';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import './ServiciosTarifas.css';

// ── CATÁLOGO MAESTRO DE SERVICIOS Y MATERIALES DE MUDANZAS ──
export const SERVICES_CATALOG = [
  // ── 1. Mano de Obra y Estiba
  {
    key: 'helperRate',
    category: 'mano_obra',
    name: 'Ayudantes de Carga / Peón',
    desc: 'Operario especializado en carga, estiba en camión y descarga',
    unit: '/ hora',
    defaultPrice: 14000,
    icon: 'groups',
    defaultOfrece: true
  },
  {
    key: 'stairFloorRate',
    category: 'mano_obra',
    name: 'Piso por Escalera',
    desc: 'Adicional por piso subido o bajado sin ascensor habilitado',
    unit: '/ piso',
    defaultPrice: 5000,
    icon: 'stairs',
    defaultOfrece: true
  },
  {
    key: 'assemblyRate',
    category: 'mano_obra',
    name: 'Desarme y Armado de Muebles',
    desc: 'Desarmado y rearmado de camas, mesas, modulares y placards',
    unit: '/ mueble',
    defaultPrice: 12000,
    icon: 'handyman',
    defaultOfrece: true
  },
  {
    key: 'balconyHoistRate',
    category: 'mano_obra',
    name: 'Elevación por Balcón / Soga',
    desc: 'Maniobra de altura exterior para muebles que no entran por escalera',
    unit: '/ bulto',
    defaultPrice: 20000,
    icon: 'vertical_align_top',
    defaultOfrece: true
  },

  // ── 2. Instalaciones y Handyman en Destino
  {
    key: 'airConditionerRate',
    category: 'handyman',
    name: 'Desinstalación / Instalación de Aire Split',
    desc: 'Desconexión en origen y montaje con técnico en destino',
    unit: '/ equipo',
    defaultPrice: 45000,
    icon: 'mode_fan',
    defaultOfrece: true
  },
  {
    key: 'tvMountRate',
    category: 'handyman',
    name: 'Instalación de Soportes de TV y Cuadros',
    desc: 'Agujereado, tarugado y nivelación de pantallas Smart TV y cuadros',
    unit: '/ unidad',
    defaultPrice: 15000,
    icon: 'tv',
    defaultOfrece: true
  },
  {
    key: 'applianceConnectRate',
    category: 'handyman',
    name: 'Conexión de Electrodomésticos',
    desc: 'Conexión de lavarropas, heladeras, lavavajillas y desagües de agua',
    unit: '/ equipo',
    defaultPrice: 12000,
    icon: 'kitchen',
    defaultOfrece: true
  },
  {
    key: 'lightingInstallRate',
    category: 'handyman',
    name: 'Colocación de Luminarias y Barrales',
    desc: 'Instalación de lámparas de techo, plafones y barrales de cortinas',
    unit: '/ punto',
    defaultPrice: 9000,
    icon: 'lightbulb',
    defaultOfrece: true
  },

  // ── 3. Cajas, Canastos y Contenedores
  {
    key: 'boxPrice',
    category: 'cajas',
    name: 'Cajas de Cartón Estándar',
    desc: 'Cajas de cartón corrugado reforzado medianas (40x40x50 cm)',
    unit: '/ unid.',
    defaultPrice: 2500,
    icon: 'package_2',
    defaultOfrece: true
  },
  {
    key: 'wardrobeBoxPrice',
    category: 'cajas',
    name: 'Cajas Ropero con Barral',
    desc: 'Caja alta con barral metálico para colgar trajes y vestidos sin arrugar',
    unit: '/ unid.',
    defaultPrice: 6500,
    icon: 'checkroom',
    defaultOfrece: true
  },
  {
    key: 'basketPrice',
    category: 'cajas',
    name: 'Canastos Plásticos de Mudanza',
    desc: 'Alquiler de canastos rígidos apilables de alta durabilidad',
    unit: '/ unid.',
    defaultPrice: 1800,
    icon: 'shopping_basket',
    defaultOfrece: true
  },
  {
    key: 'mattressCoverPrice',
    category: 'cajas',
    name: 'Fundas Protectoras para Colchón',
    desc: 'Fundas plásticas impermeables higiénicas de 1 o 2 plazas',
    unit: '/ unid.',
    defaultPrice: 4500,
    icon: 'bed',
    defaultOfrece: true
  },

  // ── 4. Embalaje y Protección de Muebles
  {
    key: 'packingRate',
    category: 'embalaje',
    name: 'Servicio de Embalaje Integral',
    desc: 'Empaque profesional de vajilla, cristalería, libros y enseres frágiles',
    unit: '/ serv.',
    defaultPrice: 18000,
    icon: 'shield',
    defaultOfrece: true
  },
  {
    key: 'furnitureProtectionRate',
    category: 'embalaje',
    name: 'Protección con Film Stretch y Mantas',
    desc: 'Enmantado y filmado anti-rayaduras de electrodomésticos y madera',
    unit: '/ serv.',
    defaultPrice: 9500,
    icon: 'layers',
    defaultOfrece: true
  },
  {
    key: 'bubbleWrapPrice',
    category: 'embalaje',
    name: 'Rollo de Plástico de Burbujas',
    desc: 'Rollo de plástico de burbujas antichoque de 50 metros',
    unit: '/ rollo',
    defaultPrice: 7000,
    icon: 'blur_on',
    defaultOfrece: true
  },
  {
    key: 'tapePrice',
    category: 'embalaje',
    name: 'Cinta de Embalar de Alta Resistencia',
    desc: 'Cinta adhesiva reforzada de 48mm x 100m para sellado de cajas',
    unit: '/ rollo',
    defaultPrice: 2000,
    icon: 'tape',
    defaultOfrece: true
  },

  // ── 5. Guardamuebles y Depósito Temporal
  {
    key: 'storageRate',
    category: 'guardamuebles',
    name: 'Guardamuebles Temporal',
    desc: 'Custodia segura en depósito cerrado por mes o fracción',
    unit: '/ mes',
    defaultPrice: 85000,
    icon: 'warehouse',
    defaultOfrece: false
  },
  {
    key: 'storageLockerRate',
    category: 'guardamuebles',
    name: 'Alquiler de Baulera Privada',
    desc: 'Espacio cerrado con llave y vigilancia permanente por m³ mensual',
    unit: '/ m³ mes',
    defaultPrice: 35000,
    icon: 'inventory',
    defaultOfrece: false
  },

  // ── 6. Traslados Especiales de Cargas Pesadas y Delicadas
  {
    key: 'pianoMoveRate',
    category: 'pesadas',
    name: 'Traslado Especializado de Pianos',
    desc: 'Traslado con cuadrilla de expertos para pianos verticales o de cola',
    unit: '/ serv.',
    defaultPrice: 95000,
    icon: 'piano',
    defaultOfrece: false
  },
  {
    key: 'safeBoxRate',
    category: 'pesadas',
    name: 'Traslado de Cajas Fuertes y Armeros',
    desc: 'Transporte de cofres blindados y estructuras de seguridad pesadas',
    unit: '/ serv.',
    defaultPrice: 75000,
    icon: 'lock',
    defaultOfrece: false
  },
  {
    key: 'artCrateRate',
    category: 'pesadas',
    name: 'Obras de Arte y Esculturas',
    desc: 'Confección de cajones de madera a medida y embalaje de museo',
    unit: '/ pieza',
    defaultPrice: 60000,
    icon: 'palette',
    defaultOfrece: false
  },
  {
    key: 'itServerRate',
    category: 'pesadas',
    name: 'Servidores y Equipamiento IT',
    desc: 'Transporte de racks de telecomunicaciones con embalaje antiestático',
    unit: '/ rack',
    defaultPrice: 80000,
    icon: 'dns',
    defaultOfrece: false
  },

  // ── 7. Limpieza y Vaciado de Inmuebles
  {
    key: 'moveOutCleaningRate',
    category: 'limpieza',
    name: 'Limpieza Post-Mudanza (Entrega Llave)',
    desc: 'Limpieza profunda del departamento anterior para devolución de depósito',
    unit: '/ serv.',
    defaultPrice: 38000,
    icon: 'cleaning_services',
    defaultOfrece: false
  },
  {
    key: 'moveInCleaningRate',
    category: 'limpieza',
    name: 'Limpieza Previa y Desinfección en Destino',
    desc: 'Higienización profunda de cocina, baños y pisos antes de meter muebles',
    unit: '/ serv.',
    defaultPrice: 38000,
    icon: 'sanitizer',
    defaultOfrece: false
  },
  {
    key: 'junkRemovalRate',
    category: 'limpieza',
    name: 'Vaciado y Retiro de Muebles en Desuso',
    desc: 'Retiro y descarte de muebles viejos hacia centros de reciclaje',
    unit: '/ viaje',
    defaultPrice: 28000,
    icon: 'delete_sweep',
    defaultOfrece: true
  },

  // ── 8. Modalidades de Transporte y Trámites
  {
    key: 'longDistanceRate',
    category: 'transporte',
    name: 'Mudanzas de Larga Distancia (Interior)',
    desc: 'Tarifa interurbana punto a punto hacia provincias del interior',
    unit: '/ km ruta',
    defaultPrice: 1800,
    icon: 'distance',
    defaultOfrece: true
  },
  {
    key: 'sharedLoadRate',
    category: 'transporte',
    name: 'Carga Compartida / Consolidada (Grupaje)',
    desc: 'Tarifa reducida por m³ compartiendo camión en la misma ruta',
    unit: '/ m³',
    defaultPrice: 45000,
    icon: 'alt_route',
    defaultOfrece: true
  },
  {
    key: 'vehicleTransportRate',
    category: 'transporte',
    name: 'Traslado de Vehículos (Auto / Moto)',
    desc: 'Traslado en trailer o batea remolcada junto con la mudanza',
    unit: '/ vehíc.',
    defaultPrice: 90000,
    icon: 'car_repair',
    defaultOfrece: false
  },
  {
    key: 'insuranceRate',
    category: 'transporte',
    name: 'Póliza de Seguro Todo Riesgo',
    desc: 'Cobertura integral contra rotura, robo o siniestro de mercadería',
    unit: '/ póliza',
    defaultPrice: 25000,
    icon: 'verified_user',
    defaultOfrece: true
  },
  {
    key: 'municipalPermitRate',
    category: 'transporte',
    name: 'Gestión de Permiso Municipal de Estacionamiento',
    desc: 'Trámite de reserva de espacio exclusivo frente al edificio en calles transitadas',
    unit: '/ trámite',
    defaultPrice: 18000,
    icon: 'local_police',
    defaultOfrece: false
  },
  {
    key: 'petMoveRate',
    category: 'transporte',
    name: 'Mudanza Pet-Friendly (Mascotas)',
    desc: 'Transporte seguro de perros y gatos en caniles climatizados',
    unit: '/ mascota',
    defaultPrice: 16000,
    icon: 'pets',
    defaultOfrece: false
  }
];

export const CATEGORIES_META = {
  mano_obra: { label: 'Mano de Obra y Estiba', icon: 'groups', color: 'blue' },
  handyman: { label: 'Instalaciones & Handyman', icon: 'handyman', color: 'purple' },
  cajas: { label: 'Cajas & Contenedores', icon: 'package_2', color: 'orange' },
  embalaje: { label: 'Embalaje & Protección', icon: 'shield', color: 'green' },
  guardamuebles: { label: 'Guardamuebles & Depósito', icon: 'warehouse', color: 'amber' },
  pesadas: { label: 'Cargas Pesadas & Especiales', icon: 'piano', color: 'red' },
  limpieza: { label: 'Limpieza & Vaciado', icon: 'cleaning_services', color: 'teal' },
  transporte: { label: 'Transporte & Trámites', icon: 'distance', color: 'indigo' }
};

export default function ServiciosTarifas({ user, profile, isEmpresa, onShowToast }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lista de vehículos de la empresa
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('general');

  // Tarifas vehiculares activas
  const [vehicleRates, setVehicleRates] = useState({
    baseRate: 22000,
    kmRate: 1400,
    minTripRate: 25000,
    capacidad: '10 m³'
  });

  // Mapa de tarifas específicas por vehículo { [vehicleId]: { baseRate, kmRate, minTripRate } }
  const [allVehicleRates, setAllVehicleRates] = useState({});

  // ── ESTADO DEL SEGURO DE TRASLADO / PÓLIZA DE CARGA ──
  const [insurance, setInsurance] = useState({
    activo: true,
    bonificado: true,
    aseguradora: 'La Segunda Seguros',
    numeroPoliza: 'POL-8849201-B',
    sumaAsegurada: 15000000,
    modalidad: 'fijo', // 'fijo' o 'porcentual'
    costoFijo: 25000,
    tasaPorcentual: 1.2,
    coberturas: [
      'Choque, colisión o vuelco del camión de transporte',
      'Incendio, rayo o explosión durante el viaje',
      'Robo total o asalto a mano armada (piratería del asfalto)',
      'Caída accidental de bultos durante el tránsito vehicular'
    ]
  });

  // Estado unificado de los 28 servicios: { [key]: { precio: number, ofrece: boolean, bonificado: boolean } }
  const [servicesState, setServicesState] = useState(() => {
    const initial = {};
    SERVICES_CATALOG.forEach(item => {
      initial[item.key] = {
        precio: item.defaultPrice,
        ofrece: item.defaultOfrece,
        bonificado: false
      };
    });
    return initial;
  });

  // Filtros de visualización
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todas');
  const [filterState, setFilterState] = useState('todos'); // 'todos', 'ofrecidos', 'bonificados'

  // 1. Cargar vehículos reales desde Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const unsubscribe = fleetService.subscribeVehicles(user.uid, (list) => {
      setVehicles(list || []);
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  // 2. Cargar tarifas generales, por vehículo, servicios y seguro desde Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    fleetService.getDriverRates(user.uid)
      .then((data) => {
        if (data) {
          setVehicleRates({
            baseRate: data.baseRate ?? 22000,
            kmRate: data.kmRate ?? 1400,
            minTripRate: data.minTripRate ?? 25000,
            capacidad: '10 m³'
          });

          setAllVehicleRates(data.vehicleRates || {});

          // Cargar configuración del seguro
          if (data.seguroCarga || data.insuranceConfig) {
            const ins = data.seguroCarga || data.insuranceConfig;
            setInsurance({
              activo: ins.activo !== undefined ? ins.activo : true,
              bonificado: ins.bonificado !== undefined ? ins.bonificado : true,
              aseguradora: ins.aseguradora || 'La Segunda Seguros',
              numeroPoliza: ins.numeroPoliza || 'POL-8849201-B',
              sumaAsegurada: Number(ins.sumaAsegurada || 15000000),
              modalidad: ins.modalidad || 'fijo',
              costoFijo: Number(ins.costoFijo || 25000),
              tasaPorcentual: Number(ins.tasaPorcentual || 1.2),
              coberturas: Array.isArray(ins.coberturas) ? ins.coberturas : [
                'Choque, colisión o vuelco del camión de transporte',
                'Incendio, rayo o explosión durante el viaje',
                'Robo total o asalto a mano armada (piratería del asfalto)',
                'Caída accidental de bultos durante el tránsito vehicular'
              ]
            });
          }

          const detailed = data.serviciosDetallados || {};
          const bonificadosList = Array.isArray(data.serviciosBonificados) ? data.serviciosBonificados : [];
          const ofrecidosList = Array.isArray(data.serviciosOfrecidos) ? data.serviciosOfrecidos : null;

          setServicesState(prev => {
            const next = { ...prev };
            SERVICES_CATALOG.forEach(item => {
              const saved = detailed[item.key];
              const isBonif = bonificadosList.includes(item.key) || (saved && saved.bonificado === true);
              const isOfrece = ofrecidosList ? ofrecidosList.includes(item.key) : (saved?.ofrece !== undefined ? saved.ofrece : item.defaultOfrece);
              const savedPrice = saved?.precio ?? data[item.key] ?? item.defaultPrice;

              next[item.key] = {
                precio: Number(savedPrice > 0 ? savedPrice : item.defaultPrice),
                ofrece: Boolean(isOfrece),
                bonificado: Boolean(isBonif)
              };
            });
            return next;
          });
        }
      })
      .catch((err) => {
        console.warn('Error cargando tarifas en ServiciosTarifas:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.uid]);

  // Selección de vehículo
  const handleSelectVehicle = (vehId) => {
    setSelectedVehicleId(vehId);
    if (vehId === 'general') {
      fleetService.getDriverRates(user?.uid).then((data) => {
        if (data) {
          setVehicleRates({
            baseRate: data.baseRate ?? 22000,
            kmRate: data.kmRate ?? 1400,
            minTripRate: data.minTripRate ?? 25000,
            capacidad: 'General'
          });
        }
      });
    } else {
      const v = vehicles.find((x) => x.id === vehId);
      const customRates = allVehicleRates[vehId];
      setVehicleRates({
        baseRate: customRates?.baseRate ?? v?.baseRate ?? vehicleRates.baseRate,
        kmRate: customRates?.kmRate ?? v?.kmRate ?? vehicleRates.kmRate,
        minTripRate: customRates?.minTripRate ?? v?.minTripRate ?? vehicleRates.minTripRate,
        capacidad: v?.capacidad || '10 m³'
      });
    }
  };

  const handleVehicleRateChange = (field, value) => {
    const num = Number(value);
    setVehicleRates((prev) => ({ ...prev, [field]: num }));

    if (selectedVehicleId !== 'general') {
      setAllVehicleRates((prev) => ({
        ...prev,
        [selectedVehicleId]: {
          ...(prev[selectedVehicleId] || {}),
          [field]: num
        }
      }));
    }
  };

  // Toggle "Ofrece servicio"
  const handleToggleOfrece = (key) => {
    setServicesState(prev => {
      const current = prev[key] || { precio: 0, ofrece: false, bonificado: false };
      const nextOfrece = !current.ofrece;
      return {
        ...prev,
        [key]: {
          ...current,
          ofrece: nextOfrece,
          bonificado: nextOfrece ? current.bonificado : false
        }
      };
    });
  };

  // Toggle "Bonificar al cliente (Gratis)"
  const handleToggleBonificado = (key) => {
    setServicesState(prev => {
      const current = prev[key] || { precio: 0, ofrece: true, bonificado: false };
      return {
        ...prev,
        [key]: {
          ...current,
          bonificado: current.ofrece ? !current.bonificado : false
        }
      };
    });
  };

  // Cambio de precio unitario
  const handlePriceChange = (key, value) => {
    setServicesState(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { ofrece: true, bonificado: false }),
        precio: Number(value)
      }
    }));
  };

  // Guardar en Firestore
  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSaving(true);
    try {
      const bonificadosList = [];
      const ofrecidosList = [];
      const legacyPrices = {};

      SERVICES_CATALOG.forEach(item => {
        const conf = servicesState[item.key] || { precio: item.defaultPrice, ofrece: item.defaultOfrece, bonificado: false };
        if (conf.bonificado) bonificadosList.push(item.key);
        if (conf.ofrece) ofrecidosList.push(item.key);

        const effectivePrice = conf.bonificado ? 0 : conf.precio;
        legacyPrices[item.key] = effectivePrice;
      });

      // Mapeos adicionales de nombres legacy usados en Flutter
      legacyPrices.peonHourRate = legacyPrices.helperRate;
      legacyPrices.costoPeon = legacyPrices.helperRate;
      legacyPrices.stairCharge = legacyPrices.stairFloorRate;
      legacyPrices.costoEscalera = legacyPrices.stairFloorRate;
      legacyPrices.costoArmado = legacyPrices.assemblyRate;
      legacyPrices.costoElevacion = legacyPrices.balconyHoistRate;
      legacyPrices.costoCaja = legacyPrices.boxPrice;
      legacyPrices.costoCajaRopero = legacyPrices.wardrobeBoxPrice;
      legacyPrices.costoCanasto = legacyPrices.basketPrice;
      legacyPrices.costoFundaColchon = legacyPrices.mattressCoverPrice;
      legacyPrices.costoEmbalaje = legacyPrices.packingRate;
      legacyPrices.costoProteccion = legacyPrices.furnitureProtectionRate;
      legacyPrices.costoBurbujas = legacyPrices.bubbleWrapPrice;
      legacyPrices.costoCinta = legacyPrices.tapePrice;

      const payload = {
        baseRate: Number(vehicleRates.baseRate),
        kmRate: Number(vehicleRates.kmRate),
        minTripRate: Number(vehicleRates.minTripRate),
        ...legacyPrices,
        serviciosDetallados: servicesState,
        serviciosBonificados: bonificadosList,
        serviciosOfrecidos: ofrecidosList,
        seguroCarga: insurance,
        insuranceConfig: insurance,
        vehicleRates: allVehicleRates
      };

      const vehIdToPass = selectedVehicleId === 'general' ? null : selectedVehicleId;
      await fleetService.saveDriverRates(user.uid, payload, vehIdToPass);

      onShowToast?.(
        selectedVehicleId === 'general'
          ? '✅ Póliza de seguro, servicios y tarifas sincronizados en Cloud Firestore'
          : `✅ Tarifas del móvil (${vehicles.find(v => v.id === selectedVehicleId)?.patente || 'seleccionado'}), seguro y servicios guardados`,
        'success'
      );
    } catch (err) {
      onShowToast?.(`Error al guardar tarifas: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Contadores en vivo
  const { totalOfrecidos, totalBonificados, totalNoOfrecidos } = useMemo(() => {
    let ofrecidos = 0;
    let bonificados = 0;
    let noOfrecidos = 0;
    SERVICES_CATALOG.forEach(item => {
      const conf = servicesState[item.key];
      if (conf?.ofrece) ofrecidos++;
      else noOfrecidos++;
      if (conf?.bonificado) bonificados++;
    });
    return { totalOfrecidos: ofrecidos, totalBonificados: bonificados, totalNoOfrecidos: noOfrecidos };
  }, [servicesState]);

  // Filtrado de servicios para la visualización
  const filteredServices = useMemo(() => {
    return SERVICES_CATALOG.filter(item => {
      const conf = servicesState[item.key] || {};
      if (activeCategory !== 'todas' && item.category !== activeCategory) {
        return false;
      }
      if (filterState === 'ofrecidos' && !conf.ofrece) return false;
      if (filterState === 'bonificados' && (!conf.ofrece || !conf.bonificado)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [servicesState, activeCategory, filterState, searchQuery]);

  const activeVehicleObj = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="servicios-tarifas-panel">
      {/* ── HEADER ── */}
      <div className="tarifas-header">
        <div>
          <h1 className="tarifas-title">Servicios y Tarifas Operativas</h1>
          <p className="tarifas-subtitle">
            {isEmpresa
              ? 'Configurá los precios individuales por vehículo de tu flota, gestioná la póliza de seguro de carga y definí las bonificaciones para clientes.'
              : 'Configurá las tarifas por kilómetro de tu vehículo, seguro de traslado y el tarifario de tus servicios y materiales.'}
          </p>
        </div>

        {/* Resumen de contadores en vivo */}
        <div className="tarifas-live-counters">
          <div className="counter-pill counter-pill--green" title="Servicios que tu empresa brinda a los clientes">
            <span className="counter-dot"></span>
            <strong>{totalOfrecidos}</strong>
            <span>Ofrecidos</span>
          </div>
          <div className="counter-pill counter-pill--gift" title="Servicios bonificados (gratis) como beneficio promocional">
            <span className="material-symbols-outlined gift-icon">redeem</span>
            <strong>{totalBonificados}</strong>
            <span>Bonificados 🎁</span>
          </div>
          <div className="counter-pill counter-pill--shield" title="Estado de la póliza de mercadería">
            <span className="material-symbols-outlined shield-icon-sm">verified_user</span>
            <span>{insurance.activo ? (insurance.bonificado ? 'Seguro Bonificado' : 'Seguro Activo') : 'Sin Seguro'}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="tarifas-loading-card">
          <span className="material-symbols-outlined spin-icon">sync</span>
          <p>Cargando catálogo de tarifas, seguro y vehículos desde Firestore...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveAll} className="tarifas-main-form">
          {/* ══════════════════════════════════════════════════════════
              SECCIÓN 1: SELECCIÓN DE VEHÍCULO Y TARIFAS VEHICULARES
             ══════════════════════════════════════════════════════════ */}
          <div className="tarifas-card vehicle-selection-card">
            <div className="tarifas-card-header">
              <div className="card-header-left">
                <span className="material-symbols-outlined card-header-icon">directions_bus</span>
                <div>
                  <h3>1. Tarifas por Vehículo de la Flota</h3>
                  <p className="card-header-sub">
                    Seleccioná cada uno de los móviles que posee tu empresa para configurarle su tarifa base y costo por kilómetro.
                  </p>
                </div>
              </div>
              <div className="vehicle-count-badge">
                {vehicles.length} {vehicles.length === 1 ? 'Móvil Registrado' : 'Móviles en Flota'}
              </div>
            </div>

            {/* BARRA DE SELECCIÓN DE VEHÍCULOS */}
            <div className="vehicle-selector-bar">
              <button
                type="button"
                className={`vehicle-pill-tab ${selectedVehicleId === 'general' ? 'active' : ''}`}
                onClick={() => handleSelectVehicle('general')}
              >
                <span className="material-symbols-outlined pill-icon">tune</span>
                <div className="pill-text">
                  <strong>Tarifa Base Flota</strong>
                  <span>Valor predeterminado</span>
                </div>
              </button>

              {vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`vehicle-pill-tab ${selectedVehicleId === v.id ? 'active' : ''}`}
                  onClick={() => handleSelectVehicle(v.id)}
                >
                  <span className="material-symbols-outlined pill-icon">local_shipping</span>
                  <div className="pill-text">
                    <strong>{v.patente || 'Móvil'}</strong>
                    <span>{v.categoria || v.modelo || 'Furgón'}</span>
                  </div>
                </button>
              ))}

              {vehicles.length === 0 && (
                <div className="empty-vehicles-hint">
                  <span>💡 Podés agregar los móviles de tu empresa en la pestaña <strong>Flota de Vehículos</strong>.</span>
                </div>
              )}
            </div>

            {/* INFO BANNER DEL VEHÍCULO SELECCIONADO */}
            <div className="active-vehicle-banner">
              <div className="active-vehicle-info">
                <span className="material-symbols-outlined banner-vehicle-icon">
                  {selectedVehicleId === 'general' ? 'warehouse' : 'local_shipping'}
                </span>
                <div>
                  <h4>
                    {selectedVehicleId === 'general'
                      ? 'Configurando: Esquema General de la Empresa'
                      : `Configurando: ${activeVehicleObj?.marca || ''} ${activeVehicleObj?.modelo || ''} (${activeVehicleObj?.patente || ''})`}
                  </h4>
                  <p>
                    {selectedVehicleId === 'general'
                      ? 'Tarifa que aplica por defecto a todos los viajes o cuando no se especifica un móvil puntual.'
                      : `Categoría: ${activeVehicleObj?.categoria || 'Furgón'} · Chofer: ${activeVehicleObj?.chofer || 'Principal'} · Capacidad: ${activeVehicleObj?.capacidad || '10 m³'}`}
                  </p>
                </div>
              </div>
              <span className="active-vehicle-tag">
                {selectedVehicleId === 'general' ? 'Base General' : `Patente: ${activeVehicleObj?.patente}`}
              </span>
            </div>

            {/* INPUTS TARIFARIOS DEL VEHÍCULO SELECCIONADO */}
            <div className="rates-inputs-grid">
              <div className="tarifas-input-group">
                <label htmlFor="veh-base-rate">Bajada de Bandera / Tarifa Base (ARS) *</label>
                <div className="currency-field-wrap">
                  <span className="curr-sym">$</span>
                  <input
                    id="veh-base-rate"
                    type="number"
                    min="0"
                    step="500"
                    value={vehicleRates.baseRate}
                    onChange={(e) => handleVehicleRateChange('baseRate', e.target.value)}
                    required
                  />
                </div>
                <small className="field-hint">Costo fijo mínimo por inicio de servicio.</small>
              </div>

              <div className="tarifas-input-group">
                <label htmlFor="veh-km-rate">Precio por Kilómetro Recorrido (ARS) *</label>
                <div className="currency-field-wrap">
                  <span className="curr-sym">$</span>
                  <input
                    id="veh-km-rate"
                    type="number"
                    min="0"
                    step="100"
                    value={vehicleRates.kmRate}
                    onChange={(e) => handleVehicleRateChange('kmRate', e.target.value)}
                    required
                  />
                </div>
                <small className="field-hint">Calculado vía Google Maps en cada cotización del cliente.</small>
              </div>

              <div className="tarifas-input-group">
                <label htmlFor="veh-min-rate">Tarifa Mínima Garantizada por Viaje (ARS) *</label>
                <div className="currency-field-wrap">
                  <span className="curr-sym">$</span>
                  <input
                    id="veh-min-rate"
                    type="number"
                    min="0"
                    step="500"
                    value={vehicleRates.minTripRate}
                    onChange={(e) => handleVehicleRateChange('minTripRate', e.target.value)}
                    required
                  />
                </div>
                <small className="field-hint">Monto mínimo total a facturar independientemente de la distancia.</small>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              SECCIÓN 2: PÓLIZA Y SEGURO DE TRASLADO DE CARGA
             ══════════════════════════════════════════════════════════ */}
          <div className={`tarifas-card insurance-card ${!insurance.activo ? 'insurance-card--disabled' : ''} ${insurance.bonificado && insurance.activo ? 'insurance-card--gift' : ''}`}>
            <div className="tarifas-card-header">
              <div className="card-header-left">
                <span className="material-symbols-outlined card-header-icon card-header-icon--shield">
                  verified_user
                </span>
                <div>
                  <div className="insurance-title-row">
                    <h3>2. Póliza y Seguro de Traslado de Carga (Mercadería en Tránsito)</h3>
                    <div className="insurance-header-badges">
                      {insurance.activo ? (
                        <span className="insurance-status-badge insurance-status-badge--active">
                          ✓ Póliza Activa
                        </span>
                      ) : (
                        <span className="insurance-status-badge insurance-status-badge--inactive">
                          ✕ Sin Seguro de Carga
                        </span>
                      )}
                      {insurance.activo && insurance.bonificado && (
                        <span className="insurance-status-badge insurance-status-badge--gift">
                          🎁 100% Bonificado al Cliente
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="card-header-sub">
                    Protección de muebles y bienes transportados: configurá tu aseguradora, número de póliza, suma asegurada y modalidad de cobro o bonificación.
                  </p>
                </div>
              </div>
            </div>

            {/* Fila de Interruptores de Seguro */}
            <div className="insurance-switches-bar">
              {/* Switch 1: Ofrece Seguro */}
              <div className="insurance-switch-box">
                <div className="insurance-switch-meta">
                  <span className="switch-box-title">¿Ofrece Seguro de Carga?</span>
                  <span className="switch-box-desc">
                    {insurance.activo
                      ? 'Tu empresa asegura los muebles transportados contra rotura, robo y siniestros.'
                      : 'La empresa no cuenta con seguro de mercadería (solo seguro automotor obligatorio).'}
                  </span>
                </div>
                <label className="modern-switch-wrapper" title="Activar póliza de carga">
                  <div
                    className={`modern-switch ${insurance.activo ? 'modern-switch--on' : ''}`}
                    onClick={() => setInsurance(prev => ({ ...prev, activo: !prev.activo, bonificado: !prev.activo ? prev.bonificado : false }))}
                  >
                    <span className="switch-thumb"></span>
                  </div>
                  <span className={`switch-state-text ${insurance.activo ? 'text-active' : 'text-inactive'}`}>
                    {insurance.activo ? 'Asegurado' : 'Inactivo'}
                  </span>
                </label>
              </div>

              {/* Switch 2: Bonificar al cliente */}
              <div className={`insurance-switch-box ${!insurance.activo ? 'group-disabled' : ''}`}>
                <div className="insurance-switch-meta">
                  <span className="switch-box-title">¿Bonificar Seguro al Cliente? (Gratis)</span>
                  <span className="switch-box-desc">
                    {insurance.bonificado
                      ? 'Beneficio Comercial: El cliente tiene su mudanza 100% asegurada sin costo adicional.'
                      : 'Se cobra un adicional en el presupuesto según la suma declarada o tarifa fija.'}
                  </span>
                </div>
                <label className="modern-switch-wrapper" title="Bonificar seguro al cliente sin cargo">
                  <div
                    className={`modern-switch modern-switch--gift ${insurance.bonificado ? 'modern-switch--gift-on' : ''}`}
                    onClick={() => insurance.activo && setInsurance(prev => ({ ...prev, bonificado: !prev.bonificado }))}
                  >
                    <span className="switch-thumb"></span>
                  </div>
                  <span className={`switch-state-text ${insurance.bonificado ? 'text-gift-active' : ''}`}>
                    {insurance.bonificado ? '🎁 Bonificado ($0)' : 'Con cargo'}
                  </span>
                </label>
              </div>
            </div>

            {insurance.activo && (
              <div className="insurance-body-section">
                {/* Grid de Configuración de la Póliza */}
                <div className="insurance-grid-inputs">
                  {/* Aseguradora */}
                  <div className="tarifas-input-group">
                    <label htmlFor="ins-company">Compañía Aseguradora *</label>
                    <div className="input-with-symbol-wrap">
                      <span className="material-symbols-outlined input-side-icon">apartment</span>
                      <input
                        id="ins-company"
                        type="text"
                        list="aseguradoras-list"
                        placeholder="Ej: La Segunda Seguros"
                        value={insurance.aseguradora}
                        onChange={e => setInsurance(prev => ({ ...prev, aseguradora: e.target.value }))}
                        required
                      />
                      <datalist id="aseguradoras-list">
                        <option value="La Segunda Seguros" />
                        <option value="Sancor Seguros" />
                        <option value="Federación Patronal" />
                        <option value="Rivadavia Seguros" />
                        <option value="Allianz Argentina" />
                        <option value="Zurich Seguros" />
                        <option value="Mercantil Andina" />
                        <option value="SMG Seguros" />
                      </datalist>
                    </div>
                    <small className="field-hint">Aseguradora con la que tenés contratada la póliza flotante.</small>
                  </div>

                  {/* Número de Póliza */}
                  <div className="tarifas-input-group">
                    <label htmlFor="ins-poliza">Número de Póliza Vigente *</label>
                    <div className="input-with-symbol-wrap">
                      <span className="material-symbols-outlined input-side-icon">description</span>
                      <input
                        id="ins-poliza"
                        type="text"
                        placeholder="Ej: POL-8849201-B"
                        value={insurance.numeroPoliza}
                        onChange={e => setInsurance(prev => ({ ...prev, numeroPoliza: e.target.value }))}
                        required
                      />
                    </div>
                    <small className="field-hint">Identificador verificable de la póliza de transporte.</small>
                  </div>

                  {/* Suma Máxima Asegurada */}
                  <div className="tarifas-input-group">
                    <label htmlFor="ins-suma">Suma Máxima Asegurada por Viaje (ARS) *</label>
                    <div className="currency-field-wrap">
                      <span className="curr-sym">$</span>
                      <input
                        id="ins-suma"
                        type="number"
                        min="500000"
                        step="500000"
                        value={insurance.sumaAsegurada}
                        onChange={e => setInsurance(prev => ({ ...prev, sumaAsegurada: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <small className="field-hint">Monto tope de indemnización económica por siniestro.</small>
                  </div>
                </div>

                {/* Si NO está bonificado, configurar modalidad de cobro */}
                {!insurance.bonificado && (
                  <div className="insurance-pricing-block">
                    <div className="pricing-mode-selector">
                      <span className="mode-label">Modalidad de cobro del seguro al cliente:</span>
                      <div className="mode-options-row">
                        <label className="radio-pill-label">
                          <input
                            type="radio"
                            name="ins-mode"
                            checked={insurance.modalidad === 'fijo'}
                            onChange={() => setInsurance(prev => ({ ...prev, modalidad: 'fijo' }))}
                          />
                          <span>Tarifa Fija por Viaje</span>
                        </label>
                        <label className="radio-pill-label">
                          <input
                            type="radio"
                            name="ins-mode"
                            checked={insurance.modalidad === 'porcentual'}
                            onChange={() => setInsurance(prev => ({ ...prev, modalidad: 'porcentual' }))}
                          />
                          <span>Porcentaje sobre Valor Declarado (%)</span>
                        </label>
                      </div>
                    </div>

                    <div className="pricing-mode-input-row">
                      {insurance.modalidad === 'fijo' ? (
                        <div className="tarifas-input-group" style={{ maxWidth: '340px' }}>
                          <label htmlFor="ins-fijo">Costo Fijo del Seguro por Viaje (ARS) *</label>
                          <div className="currency-field-wrap">
                            <span className="curr-sym">$</span>
                            <input
                              id="ins-fijo"
                              type="number"
                              min="0"
                              step="1000"
                              value={insurance.costoFijo}
                              onChange={e => setInsurance(prev => ({ ...prev, costoFijo: Number(e.target.value) }))}
                              required
                            />
                          </div>
                          <small className="field-hint">Monto fijo que se suma a la cotización final del viaje.</small>
                        </div>
                      ) : (
                        <div className="tarifas-input-group" style={{ maxWidth: '340px' }}>
                          <label htmlFor="ins-porcentual">Tasa Porcentual sobre Valor Declarado (%) *</label>
                          <div className="currency-field-wrap">
                            <span className="curr-sym">%</span>
                            <input
                              id="ins-porcentual"
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={insurance.tasaPorcentual}
                              onChange={e => setInsurance(prev => ({ ...prev, tasaPorcentual: Number(e.target.value) }))}
                              required
                            />
                          </div>
                          <small className="field-hint">Ej: para 1.2%, si declara $5.000.000 se cobran $60.000 de seguro.</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Coberturas incluidas (Checkboxes interactivos) */}
                <div className="insurance-coverages-box">
                  <span className="coverages-title">Riesgos cubiertos por tu póliza (visibles para el cliente):</span>
                  <div className="coverages-checklist">
                    {[
                      'Choque, colisión o vuelco del camión de transporte',
                      'Incendio, rayo o explosión durante el viaje',
                      'Robo total o asalto a mano armada (piratería del asfalto)',
                      'Caída accidental de bultos durante el tránsito vehicular',
                      'Daños ocasionados durante operaciones de carga y descarga (estiba)'
                    ].map(cov => {
                      const isChecked = insurance.coberturas.includes(cov);
                      return (
                        <label key={cov} className="coverage-check-item">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setInsurance(prev => ({
                                ...prev,
                                coberturas: isChecked
                                  ? prev.coberturas.filter(c => c !== cov)
                                  : [...prev.coberturas, cov]
                              }));
                            }}
                          />
                          <span>{cov}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Vista previa en vivo del sello que ve el cliente */}
                <div className="client-badge-preview-wrap">
                  <div className="preview-label-tag">
                    <span className="material-symbols-outlined">visibility</span>
                    <span>Así verá el cliente la garantía en la aplicación móvil:</span>
                  </div>
                  <div className="client-insurance-card-mockup">
                    <div className="mockup-shield-col">
                      <span className="material-symbols-outlined shield-icon-big">security</span>
                    </div>
                    <div className="mockup-info-col">
                      <div className="mockup-header-row">
                        <span className="mockup-title">VIAJE CON COBERTURA DE TRASLADO ASEGURADA</span>
                        <span className="mockup-guarantee-pill">Garantía Verificada</span>
                      </div>
                      <p className="mockup-sub">
                        Carga protegida por <strong>{insurance.aseguradora || 'Aseguradora Oficial'}</strong> (Póliza Nº {insurance.numeroPoliza || 'Vigente'})
                      </p>
                      <div className="mockup-details-row">
                        <span className="mockup-amount">
                          Suma Asegurada: <strong>${Number(insurance.sumaAsegurada || 0).toLocaleString('es-AR')} ARS</strong>
                        </span>
                        <span className="mockup-cost-badge">
                          {insurance.bonificado
                            ? '🎁 Beneficio Bonificado ($0 para el cliente)'
                            : insurance.modalidad === 'fijo'
                            ? `Costo adicional: $${Number(insurance.costoFijo || 0).toLocaleString('es-AR')} ARS`
                            : `Costo: ${insurance.tasaPorcentual}% sobre valor declarado`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              SECCIÓN 3: CATÁLOGO COMPLETO DE SERVICIOS (CON INTERRUPTORES)
             ══════════════════════════════════════════════════════════ */}
          <div className="services-catalog-container">
            {/* Header del catálogo con búsqueda y filtros */}
            <div className="catalog-toolbar">
              <div className="catalog-main-header">
                <span className="material-symbols-outlined catalog-main-icon">inventory_2</span>
                <div>
                  <h2>3. Catálogo Completo de Servicios y Materiales</h2>
                  <p>
                    Activá si tu empresa ofrece cada servicio, definí si se lo bonificás sin costo al cliente (🎁) y establecé su valor unitario.
                  </p>
                </div>
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="catalog-filter-row">
                {/* Buscador */}
                <div className="catalog-search-box">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="text"
                    placeholder="Buscar servicio o material (ej. aire, piano, cajas, peón)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={() => setSearchQuery('')}
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  )}
                </div>

                {/* Filtros rápidos de estado */}
                <div className="status-filter-pills">
                  <button
                    type="button"
                    className={`filter-btn ${filterState === 'todos' ? 'active' : ''}`}
                    onClick={() => setFilterState('todos')}
                  >
                    Todos ({SERVICES_CATALOG.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${filterState === 'ofrecidos' ? 'active' : ''}`}
                    onClick={() => setFilterState('ofrecidos')}
                  >
                    ✓ Ofrecidos ({totalOfrecidos})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn filter-btn--gift ${filterState === 'bonificados' ? 'active' : ''}`}
                    onClick={() => setFilterState('bonificados')}
                  >
                    🎁 Bonificados ({totalBonificados})
                  </button>
                </div>
              </div>

              {/* Tabs de Categorías */}
              <div className="category-tabs-bar">
                <button
                  type="button"
                  className={`cat-tab ${activeCategory === 'todas' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('todas')}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                  <span>Todas las Categorías</span>
                </button>
                {Object.entries(CATEGORIES_META).map(([catKey, meta]) => (
                  <button
                    key={catKey}
                    type="button"
                    className={`cat-tab ${activeCategory === catKey ? 'active' : ''}`}
                    onClick={() => setActiveCategory(catKey)}
                  >
                    <span className="material-symbols-outlined">{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* LISTA DINÁMICA DE TARJETAS DE SERVICIOS */}
            <div className="services-master-grid">
              {filteredServices.length === 0 ? (
                <div className="no-services-found">
                  <span className="material-symbols-outlined">search_off</span>
                  <h4>No se encontraron servicios</h4>
                  <p>Intentá cambiando el término de búsqueda o seleccionando otra categoría.</p>
                  <Button variant="secondary" size="sm" onClick={() => { setSearchQuery(''); setActiveCategory('todas'); setFilterState('todos'); }}>
                    Restablecer Filtros
                  </Button>
                </div>
              ) : (
                filteredServices.map((item) => {
                  const conf = servicesState[item.key] || {
                    precio: item.defaultPrice,
                    ofrece: item.defaultOfrece,
                    bonificado: false
                  };
                  const catMeta = CATEGORIES_META[item.category] || { label: 'General', color: 'blue' };

                  return (
                    <div
                      key={item.key}
                      className={`service-card-item ${!conf.ofrece ? 'service-card-item--disabled' : ''} ${conf.bonificado ? 'service-card-item--gift' : ''}`}
                    >
                      {/* Cabecera del servicio */}
                      <div className="service-card-top">
                        <div className="service-card-header-left">
                          <span className={`material-symbols-outlined service-icon cat-bg--${catMeta.color}`}>
                            {item.icon}
                          </span>
                          <div className="service-meta-text">
                            <div className="service-title-row">
                              <h4 className="service-name">{item.name}</h4>
                              <span className="category-micro-badge">{catMeta.label}</span>
                            </div>
                            <p className="service-description">{item.desc}</p>
                          </div>
                        </div>
                      </div>

                      {/* Fila de Interruptores y Control de Precios */}
                      <div className="service-card-controls">
                        {/* ── INTERRUPTOR 1: ¿OFRECE EL SERVICIO? ── */}
                        <div className="toggle-switch-group">
                          <span className="toggle-label">¿Ofrece la empresa?</span>
                          <label
                            className="modern-switch-wrapper"
                            title={conf.ofrece ? 'Servicio activo para los clientes' : 'Servicio inactivo'}
                          >
                            <div
                              className={`modern-switch ${conf.ofrece ? 'modern-switch--on' : ''}`}
                              onClick={() => handleToggleOfrece(item.key)}
                            >
                              <span className="switch-thumb"></span>
                            </div>
                            <span className={`switch-state-text ${conf.ofrece ? 'text-active' : 'text-inactive'}`}>
                              {conf.ofrece ? 'Ofrecido' : 'No disponible'}
                            </span>
                          </label>
                        </div>

                        {/* ── INTERRUPTOR 2: ¿BONIFICAR AL CLIENTE? ── */}
                        <div className={`toggle-switch-group ${!conf.ofrece ? 'group-disabled' : ''}`}>
                          <span className="toggle-label">¿Bonificar al cliente?</span>
                          <label
                            className="modern-switch-wrapper"
                            title={conf.bonificado ? 'Servicio 100% bonificado (gratis) para el cliente' : 'Se cobra la tarifa establecida'}
                          >
                            <div
                              className={`modern-switch modern-switch--gift ${conf.bonificado ? 'modern-switch--gift-on' : ''}`}
                              onClick={() => handleToggleBonificado(item.key)}
                            >
                              <span className="switch-thumb"></span>
                            </div>
                            <span className={`switch-state-text ${conf.bonificado ? 'text-gift-active' : ''}`}>
                              {conf.bonificado ? '🎁 Bonificado ($0)' : 'Con cargo'}
                            </span>
                          </label>
                        </div>

                        {/* ── CAMPO DE PRECIO / VALOR ── */}
                        <div className="service-price-input-box">
                          <label htmlFor={`price-${item.key}`} className="price-label">
                            {conf.bonificado ? 'Valor de Referencia' : 'Precio del Servicio'}
                          </label>
                          <div className={`price-input-inner ${!conf.ofrece ? 'price-input--disabled' : ''} ${conf.bonificado ? 'price-input--gift' : ''}`}>
                            <span className="curr-sym">$</span>
                            <input
                              id={`price-${item.key}`}
                              type="number"
                              min="0"
                              step="100"
                              value={conf.precio}
                              onChange={(e) => handlePriceChange(item.key, e.target.value)}
                              disabled={!conf.ofrece}
                            />
                            <span className="price-unit-tag">{item.unit}</span>
                          </div>

                          {/* Badge de estado del precio */}
                          {conf.bonificado && conf.ofrece && (
                            <span className="gift-feedback-badge">
                              🎁 El cliente ve este servicio como $0 (Bonificado)
                            </span>
                          )}
                          {!conf.ofrece && (
                            <span className="disabled-feedback-badge">
                              ✕ No visible en cotizaciones
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              BARRA DE ACCIONES / GUARDADO FIJO
             ══════════════════════════════════════════════════════════ */}
          <div className="tarifas-bottom-actions">
            <div className="save-summary-text">
              <span className="material-symbols-outlined">verified</span>
              <div>
                <strong>Sincronización en Tiempo Real con Firebase</strong>
                <span>
                  Los servicios y la póliza de seguro se sincronizan de inmediato para cotizaciones y presupuestos en la app de los clientes.
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={saving}
              className="btn-save-tarifas"
            >
              <span className="material-symbols-outlined">rocket_launch</span>
              <span>{saving ? 'Guardando en Firestore...' : 'Guardar Esquema de Tarifas y Seguro 🚀'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
