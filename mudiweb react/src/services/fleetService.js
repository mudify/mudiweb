import {
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from './firebase';

export const SUBSCRIPTION_PLANS = {
  FLETERO_PRO: {
    id: 'fletero_pro',
    name: 'Plan Fletero Pro',
    price: 0,
    maxVehicles: 1,
    description: '1 vehículo autorizado en la red. 60 días bonificados. Cobro directo sin comisiones.',
    target: 'conductor'
  },
  FLOTA_VEHICULOS: {
    id: 'flota_vehiculos',
    name: 'Plan Flota por Vehículos',
    price: 0,
    maxVehicles: 10,
    description: 'De 2 a 10 unidades activas. Monitoreo por unidad y asignación de choferes.',
    target: 'empresa'
  },
  FLOTA_ENTERPRISE: {
    id: 'dashboard_completo',
    name: 'Plan Flota Enterprise',
    price: 0,
    maxVehicles: Infinity,
    description: 'Flotas ilimitadas. Torre de control centralizada, multi-sede y asignación automática.',
    target: 'empresa'
  }
};

export const getMaxVehiclesAllowed = (planKey) => {
  if (planKey === 'fletero_pro' || planKey === 'conductor') return 1;
  if (planKey === 'dashboard_completo' || planKey === 'flota_enterprise') return Infinity;
  return 10;
};

export const canAddVehicle = (currentCount, planKey) => {
  const max = getMaxVehiclesAllowed(planKey);
  return {
    allowed: currentCount < max,
    currentCount,
    maxAllowed: max
  };
};

// ========================================================
// 1. TARIFAS Y DATOS BANCARIOS (Firestore: drivers/{uid})
// ========================================================

const getDefaultRates = () => ({
  baseRate: 22000,
  kmRate: 1400,
  minTripRate: 25000,
  // Mano de obra
  peonHourRate: 14000,
  helperRate: 14000,
  costoPeon: 14000,
  stairCharge: 5000,
  stairFloorRate: 5000,
  costoEscalera: 5000,
  assemblyRate: 12000,
  costoArmado: 12000,
  balconyHoistRate: 20000,
  costoElevacion: 20000,
  // Cajas y canastos
  boxPrice: 2500,
  costoCaja: 2500,
  wardrobeBoxPrice: 6500,
  costoCajaRopero: 6500,
  basketPrice: 1800,
  costoCanasto: 1800,
  mattressCoverPrice: 4500,
  costoFundaColchon: 4500,
  // Embalaje y protección
  packingRate: 18000,
  costoEmbalaje: 18000,
  furnitureProtectionRate: 9500,
  costoProteccion: 9500,
  bubbleWrapPrice: 7000,
  costoBurbujas: 7000,
  tapePrice: 2000,
  costoCinta: 2000,
  // Tarifas específicas por vehículo
  vehicleRates: {},
  // Seguro de traslado / Póliza de carga
  seguroCarga: {
    activo: true,
    bonificado: true,
    aseguradora: 'La Segunda Seguros',
    numeroPoliza: 'POL-8849201-B',
    sumaAsegurada: 15000000,
    modalidad: 'fijo',
    costoFijo: 25000,
    tasaPorcentual: 1.2,
    coberturas: [
      'Choque, colisión o vuelco del camión de transporte',
      'Incendio, rayo o explosión durante el viaje',
      'Robo total o asalto a mano armada (piratería del asfalto)',
      'Caída accidental de bultos durante el tránsito vehicular'
    ]
  },
  insuranceConfig: null,
  cvuMercadoPago: '',
  aliasMercadoPago: '',
  earnings: 0
});

export const getDriverRates = async (uid) => {
  if (!uid) return getDefaultRates();
  try {
    const snap = await getDoc(doc(db, 'drivers', uid));
    if (snap.exists()) {
      const data = snap.data();
      const def = getDefaultRates();
      return {
        ...def,
        ...data,
        baseRate: data.baseRate ?? def.baseRate,
        kmRate: data.kmRate ?? def.kmRate,
        minTripRate: data.minTripRate ?? def.minTripRate,
        peonHourRate: data.peonHourRate ?? data.helperRate ?? data.costoPeon ?? def.peonHourRate,
        helperRate: data.helperRate ?? data.peonHourRate ?? def.helperRate,
        costoPeon: data.costoPeon ?? data.helperRate ?? def.costoPeon,
        stairCharge: data.stairCharge ?? data.stairFloorRate ?? data.costoEscalera ?? def.stairCharge,
        stairFloorRate: data.stairFloorRate ?? data.stairCharge ?? def.stairFloorRate,
        costoEscalera: data.costoEscalera ?? data.stairCharge ?? def.costoEscalera,
        assemblyRate: data.assemblyRate ?? data.costoArmado ?? def.assemblyRate,
        costoArmado: data.costoArmado ?? data.assemblyRate ?? def.costoArmado,
        balconyHoistRate: data.balconyHoistRate ?? data.costoElevacion ?? def.balconyHoistRate,
        costoElevacion: data.costoElevacion ?? data.balconyHoistRate ?? def.costoElevacion,
        boxPrice: data.boxPrice ?? data.costoCaja ?? def.boxPrice,
        costoCaja: data.costoCaja ?? data.boxPrice ?? def.costoCaja,
        wardrobeBoxPrice: data.wardrobeBoxPrice ?? data.costoCajaRopero ?? def.wardrobeBoxPrice,
        costoCajaRopero: data.costoCajaRopero ?? data.wardrobeBoxPrice ?? def.costoCajaRopero,
        basketPrice: data.basketPrice ?? data.costoCanasto ?? def.basketPrice,
        costoCanasto: data.costoCanasto ?? data.basketPrice ?? def.costoCanasto,
        mattressCoverPrice: data.mattressCoverPrice ?? data.costoFundaColchon ?? def.mattressCoverPrice,
        costoFundaColchon: data.costoFundaColchon ?? data.mattressCoverPrice ?? def.costoFundaColchon,
        packingRate: data.packingRate ?? data.costoEmbalaje ?? def.packingRate,
        costoEmbalaje: data.costoEmbalaje ?? data.packingRate ?? def.costoEmbalaje,
        furnitureProtectionRate: data.furnitureProtectionRate ?? data.costoProteccion ?? def.furnitureProtectionRate,
        costoProteccion: data.costoProteccion ?? data.furnitureProtectionRate ?? def.costoProteccion,
        bubbleWrapPrice: data.bubbleWrapPrice ?? data.costoBurbujas ?? def.bubbleWrapPrice,
        costoBurbujas: data.costoBurbujas ?? data.bubbleWrapPrice ?? def.costoBurbujas,
        tapePrice: data.tapePrice ?? data.costoCinta ?? def.tapePrice,
        costoCinta: data.costoCinta ?? data.tapePrice ?? def.costoCinta,
        vehicleRates: data.vehicleRates || {},
        serviciosDetallados: data.serviciosDetallados || {},
        serviciosBonificados: data.serviciosBonificados || [],
        serviciosOfrecidos: data.serviciosOfrecidos || [],
        seguroCarga: (typeof data.seguroCargaDetalle === 'object' && data.seguroCargaDetalle)
          || (typeof data.seguroCarga === 'object' && data.seguroCarga)
          || (typeof data.insuranceConfig === 'object' && data.insuranceConfig)
          || {
            activo: data.seguroCarga === true,
            bonificado: true,
            aseguradora: 'La Segunda Seguros',
            numeroPoliza: 'POL-8849201-B',
            sumaAsegurada: 15000000,
            modalidad: 'fijo',
            costoFijo: 25000,
            tasaPorcentual: 1.2,
            coberturas: [
              'Choque, colisión o vuelco del camión de transporte',
              'Incendio, rayo o explosión durante el viaje',
              'Robo total o asalto a mano armada (piratería del asfalto)',
              'Caída accidental de bultos durante el tránsito vehicular'
            ]
          },
        cvuMercadoPago: data.cvuMercadoPago || '',
        aliasMercadoPago: data.aliasMercadoPago || '',
        earnings: data.earnings || 0
      };
    }
  } catch (err) {
    console.warn('Aviso al leer tarifas de Firestore:', err);
  }
  return getDefaultRates();
};

export const saveDriverRates = async (uid, rates, vehicleId = null) => {
  if (!uid) throw new Error('Usuario no autenticado.');

  const isSeguroActivo = typeof rates.seguroCarga === 'object'
    ? Boolean(rates.seguroCarga?.activo)
    : Boolean(rates.seguroCarga);

  const updatePayload = {
    ...rates,
    // Booleano seguroCarga para compatibilidad directa con app cliente Flutter y radar de búsqueda
    seguroCarga: isSeguroActivo,
    seguroCargaDetalle: typeof rates.seguroCarga === 'object' ? rates.seguroCarga : rates.insuranceConfig,
    insuranceConfig: typeof rates.insuranceConfig === 'object' ? rates.insuranceConfig : rates.seguroCarga,
    lastActive: serverTimestamp()
  };

  // Si se pasa un vehículo específico, actualizar también dentro de vehicleRates
  if (vehicleId && rates.vehicleRates) {
    updatePayload[`vehicleRates.${vehicleId}`] = rates.vehicleRates[vehicleId];
  }

  await setDoc(doc(db, 'drivers', uid), updatePayload, { merge: true });

  // Si hay un vehicleId, actualizar directamente el documento del vehículo en la subcolección
  if (vehicleId) {
    try {
      const vehRef = doc(db, 'drivers', uid, 'vehicles', vehicleId);
      const vehSnap = await getDoc(vehRef);
      if (vehSnap.exists()) {
        const vRates = rates.vehicleRates?.[vehicleId] || {};
        await setDoc(vehRef, {
          baseRate: Number(vRates.baseRate ?? rates.baseRate),
          kmRate: Number(vRates.kmRate ?? rates.kmRate),
          minTripRate: Number(vRates.minTripRate ?? rates.minTripRate),
          seguroCarga: isSeguroActivo,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('Aviso actualizando tarifas en subcolección de vehículo:', e);
    }
  } else {
    // Si se guarda la tarifa general de la empresa, sincronizar seguroCarga en todos los vehículos de la flota
    try {
      const vehCol = collection(db, 'drivers', uid, 'vehicles');
      const vehSnaps = await getDocs(vehCol);
      const batchUpdates = vehSnaps.docs.map(d =>
        setDoc(doc(db, 'drivers', uid, 'vehicles', d.id), {
          seguroCarga: isSeguroActivo,
          updatedAt: serverTimestamp()
        }, { merge: true })
      );
      await Promise.all(batchUpdates);
    } catch (e) {
      console.warn('Aviso sincronizando seguroCarga en vehículos de la flota:', e);
    }
  }

  // Sincronizar también con empresas/{uid} si es empresa
  try {
    const empRef = doc(db, 'empresas', uid);
    const empSnap = await getDoc(empRef);
    if (empSnap.exists()) {
      await setDoc(empRef, {
        tarifas: rates,
        seguroCarga: isSeguroActivo,
        seguroCargaDetalle: typeof rates.seguroCarga === 'object' ? rates.seguroCarga : rates.insuranceConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (e) {
    // Silencioso
  }

  return { success: true };
};

export const updateDriverRates = saveDriverRates;

export const getDriverPaymentInfo = async (uid) => {
  if (!uid) return { cvu: '', alias: '', banco: '', titular: '', cuit: '', tipoCuenta: '' };
  try {
    const snap = await getDoc(doc(db, 'drivers', uid));
    if (snap.exists()) {
      const data = snap.data();
      const p = data.paymentInfo || {};
      return {
        cvu: p.cvu || data.cvuMercadoPago || '',
        alias: p.alias || data.aliasMercadoPago || '',
        banco: p.banco || data.bancoNombre || 'Mercado Pago / Banco',
        titular: p.titular || data.titularCuenta || data.name || '',
        cuit: p.cuit || data.cuitCuil || data.documents?.dni || '',
        tipoCuenta: p.tipoCuenta || 'Caja de Ahorro en Pesos'
      };
    }
  } catch (err) {
    console.warn('Aviso al leer datos de cobro de Firestore:', err);
  }
  return { cvu: '', alias: '', banco: '', titular: '', cuit: '', tipoCuenta: '' };
};

export const saveDriverPaymentInfo = async (uid, paymentData) => {
  if (!uid) throw new Error('Usuario no autenticado.');
  const data = typeof paymentData === 'object' ? paymentData : {};
  await setDoc(doc(db, 'drivers', uid), {
    paymentInfo: data,
    cvuMercadoPago: data.cvu || '',
    aliasMercadoPago: data.alias || '',
    bancoNombre: data.banco || '',
    titularCuenta: data.titular || '',
    cuitCuil: data.cuit || '',
    lastActive: serverTimestamp()
  }, { merge: true });
  return { success: true };
};

// ========================================================
// 2. FLOTA DE VEHÍCULOS (Firestore: drivers/{uid}/vehicles)
// ========================================================

export const subscribeVehicles = (uid, onUpdate) => {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  let subcollectionVehicles = [];
  let driverVehicle = null;
  let driverName = '';

  const emit = () => {
    const list = [...subcollectionVehicles];

    // Si el chofer tiene un vehículo registrado en su perfil (App Android Mudancero)
    if (driverVehicle && (driverVehicle.plate || driverVehicle.patente)) {
      const plateNorm = String(driverVehicle.plate || driverVehicle.patente || '').toUpperCase().trim();
      const existsInSub = list.some(
        (v) => String(v.patente || v.plate || '').toUpperCase().trim() === plateNorm
      );

      if (!existsInSub && plateNorm) {
        list.unshift({
          id: 'driver_primary',
          patente: plateNorm,
          marca: driverVehicle.brand || driverVehicle.marca || '',
          modelo: driverVehicle.model || driverVehicle.modelo || '',
          categoria: driverVehicle.type || driverVehicle.categoria || 'Flete Mediano',
          capacidad: driverVehicle.capacity || '10 m³',
          chofer: driverName || 'Titular',
          estado: 'disponible',
          vtv: driverVehicle.vtv || 'Vigente en Servicio',
          seguro: driverVehicle.seguro || 'Póliza Activa',
          isPrimary: true
        });
      }
    }

    onUpdate(list);
  };

  const vehiclesCol = collection(db, 'drivers', uid, 'vehicles');
  const q = query(vehiclesCol, orderBy('createdAt', 'desc'));

  const unsubSubcollection = onSnapshot(
    q,
    (snapshot) => {
      subcollectionVehicles = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      emit();
    },
    (err) => {
      console.warn('Error escuchando vehículos en Firestore:', err);
      emit();
    }
  );

  const unsubDriverDoc = onSnapshot(
    doc(db, 'drivers', uid),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        driverVehicle = data.vehicle || null;
        driverName = data.name || data.displayName || '';
      } else {
        driverVehicle = null;
      }
      emit();
    },
    (err) => {
      console.warn('Error escuchando driver doc en subscribeVehicles:', err);
      emit();
    }
  );

  return () => {
    unsubSubcollection();
    unsubDriverDoc();
  };
};

export const addVehicle = async (uid, vehicleData) => {
  if (!uid) throw new Error('Usuario no autenticado.');
  const vehiclesCol = collection(db, 'drivers', uid, 'vehicles');
  const docRef = await addDoc(vehiclesCol, {
    ...vehicleData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Actualizar también en el documento principal del chofer
  await setDoc(doc(db, 'drivers', uid), {
    vehicle: {
      patente: vehicleData.patente,
      marca: vehicleData.marca,
      modelo: vehicleData.modelo,
      categoria: vehicleData.categoria
    },
    lastActive: serverTimestamp()
  }, { merge: true });

  return { id: docRef.id, ...vehicleData };
};

export const deleteVehicle = async (uid, vehicleId) => {
  if (!uid || !vehicleId) throw new Error('Parámetros faltantes.');
  if (vehicleId === 'driver_primary') {
    await setDoc(doc(db, 'drivers', uid), {
      vehicle: null
    }, { merge: true });
    return { success: true };
  }
  const vehRef = doc(db, 'drivers', uid, 'vehicles', vehicleId);
  await deleteDoc(vehRef);
  return { success: true };
};

// ========================================================
// 2.B. NÓMINA DE PERSONAL Y CUADRILLAS (Firestore: drivers/{uid}/staff)
// ========================================================

export const subscribeStaff = (uid, onUpdate) => {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }

  const staffCol = collection(db, 'drivers', uid, 'staff');
  const q = query(staffCol, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    onUpdate(list);
  }, (err) => {
    console.warn('Error escuchando nómina de personal en Firestore:', err);
  });
};

export const addStaffMember = async (uid, memberData) => {
  if (!uid) throw new Error('Usuario no autenticado.');
  const staffCol = collection(db, 'drivers', uid, 'staff');
  const docRef = await addDoc(staffCol, {
    ...memberData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Espejar opcionalmente en empresas/{uid}/staff si existe
  try {
    const empStaffCol = collection(db, 'empresas', uid, 'staff');
    await setDoc(doc(empStaffCol, docRef.id), {
      ...memberData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    // Silencioso
  }

  return { id: docRef.id, ...memberData };
};

export const updateStaffMember = async (uid, memberId, memberData) => {
  if (!uid || !memberId) throw new Error('Parámetros inválidos.');
  const memberRef = doc(db, 'drivers', uid, 'staff', memberId);
  await updateDoc(memberRef, {
    ...memberData,
    updatedAt: serverTimestamp()
  });

  try {
    const empMemberRef = doc(db, 'empresas', uid, 'staff', memberId);
    await updateDoc(empMemberRef, {
      ...memberData,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    // Silencioso
  }

  return { success: true };
};

export const deleteStaffMember = async (uid, memberId) => {
  if (!uid || !memberId) throw new Error('Parámetros inválidos.');
  const memberRef = doc(db, 'drivers', uid, 'staff', memberId);
  await deleteDoc(memberRef);

  try {
    const empMemberRef = doc(db, 'empresas', uid, 'staff', memberId);
    await deleteDoc(empMemberRef);
  } catch (e) {
    // Silencioso
  }

  return { success: true };
};

export const seedDefaultStaff = async (uid, vehicleList = []) => {
  if (!uid) throw new Error('Usuario no autenticado.');

  const sampleVehId = vehicleList[0]?.id || 'general';
  const sampleVehPlate = vehicleList[0]?.patente || 'Flota Central';

  const defaultSquad = [
    {
      nombre: 'Carlos Mendoza',
      dni: '34.892.110',
      rol: 'chofer',
      rolLabel: 'Chofer Profesional LINTI',
      telefono: '11-4509-8812',
      email: 'carlos.mendoza@mudify.ar',
      estado: 'disponible',
      tipoContrato: 'efectivo',
      antiguedad: '3 años',
      vehiculoAsignadoId: sampleVehId,
      vehiculoPatente: sampleVehPlate,
      art: {
        proveedor: 'Prevención ART',
        numeroPoliza: 'ART-992014-X',
        clausulaNoRepeticion: true,
        vencimientoCertificado: '2027-12-31',
        vigente: true
      },
      licencia: {
        numero: 'BA-34892110',
        categoria: 'C2 / LINTI Cargas Generales',
        vencimiento: '2028-06-15'
      },
      remuneracion: {
        modalidad: 'fijo_mensual',
        monto: 950000,
        aliasCbu: 'carlos.mendoza.mp'
      },
      observaciones: 'Chofer titular capacitado en estiba y amarre de cargas pesadas.'
    },
    {
      nombre: 'Lucas Benítez',
      dni: '38.411.092',
      rol: 'peon',
      rolLabel: 'Peón de Carga & Estiba',
      telefono: '11-6288-1934',
      email: 'lucas.benitez@gmail.com',
      estado: 'disponible',
      tipoContrato: 'efectivo',
      antiguedad: '1 año y medio',
      vehiculoAsignadoId: sampleVehId,
      vehiculoPatente: sampleVehPlate,
      art: {
        proveedor: 'Prevención ART',
        numeroPoliza: 'ART-992014-X',
        clausulaNoRepeticion: true,
        vencimientoCertificado: '2027-12-31',
        vigente: true
      },
      licencia: null,
      remuneracion: {
        modalidad: 'jornal_diario',
        monto: 35000,
        aliasCbu: 'lucas.benitez.cbu'
      },
      observaciones: 'Excelente condición física. Apto médico al día.'
    },
    {
      nombre: 'Matías Rossi',
      dni: '36.104.550',
      rol: 'armador',
      rolLabel: 'Armador de Muebles & Carpintero',
      telefono: '11-5120-7733',
      email: 'matias.rossi@outlook.com',
      estado: 'disponible',
      tipoContrato: 'monotributo',
      antiguedad: '2 años',
      vehiculoAsignadoId: 'sin_asignar',
      vehiculoPatente: 'Cuadrilla General',
      art: {
        proveedor: 'Federación Patronal ART',
        numeroPoliza: 'FP-884102-M',
        clausulaNoRepeticion: true,
        vencimientoCertificado: '2027-11-20',
        vigente: true
      },
      licencia: null,
      remuneracion: {
        modalidad: 'por_viaje',
        monto: 18000,
        aliasCbu: 'rossi.carpinteria.mp'
      },
      observaciones: 'Cuenta con atornilladoras de impacto y kit de llaves Allen/Torx.'
    },
    {
      nombre: 'Diego Romero',
      dni: '39.882.341',
      rol: 'embalador',
      rolLabel: 'Especialista en Embalaje Fino',
      telefono: '11-3991-0422',
      email: 'diego.embalajes@gmail.com',
      estado: 'en_servicio',
      tipoContrato: 'eventual',
      antiguedad: '8 meses',
      vehiculoAsignadoId: sampleVehId,
      vehiculoPatente: sampleVehPlate,
      art: {
        proveedor: 'Prevención ART',
        numeroPoliza: 'ART-992014-X',
        clausulaNoRepeticion: true,
        vencimientoCertificado: '2027-12-31',
        vigente: true
      },
      licencia: null,
      remuneracion: {
        modalidad: 'por_hora',
        monto: 5500,
        aliasCbu: 'diego.romero.uala'
      },
      observaciones: 'Especialista en empaque de cristalería, vajilla fina y obras de arte.'
    },
    {
      nombre: 'Mariano Silva',
      dni: '31.705.819',
      rol: 'capataz',
      rolLabel: 'Capataz & Coordinador de Cuadrilla',
      telefono: '11-6902-3341',
      email: 'mariano.silva@mudify.ar',
      estado: 'disponible',
      tipoContrato: 'efectivo',
      antiguedad: '5 años',
      vehiculoAsignadoId: sampleVehId,
      vehiculoPatente: sampleVehPlate,
      art: {
        proveedor: 'Prevención ART',
        numeroPoliza: 'ART-992014-X',
        clausulaNoRepeticion: true,
        vencimientoCertificado: '2027-12-31',
        vigente: true
      },
      licencia: {
        numero: 'BA-31705819',
        categoria: 'B2 / Particular & Utilitario',
        vencimiento: '2029-01-10'
      },
      remuneracion: {
        modalidad: 'fijo_mensual',
        monto: 1100000,
        aliasCbu: 'mariano.silva.galicia'
      },
      observaciones: 'Coordinador general de operaciones en domicilio y control de remitos.'
    }
  ];

  const results = [];
  for (const m of defaultSquad) {
    const res = await addStaffMember(uid, m);
    results.push(res);
  }
  return results;
};

// ========================================================
// 2.C. APROVISIONAMIENTO Y VINCULACIÓN DE CHOFERES DEPENDIENTES (APP ANDROID)
// ========================================================

export const provisionDependentDriver = async (empresaUid, empresaData, staffMember, vehicleData = null) => {
  if (!empresaUid || !staffMember) throw new Error('Parámetros de empresa y chofer requeridos.');
  if (!staffMember.email) throw new Error('El chofer debe tener un correo electrónico de Google para vincular su app.');

  const cleanEmail = staffMember.email.trim().toLowerCase();
  let targetDriverUid = staffMember.driverUid || null;

  // 1. Buscar si ya existe un usuario o conductor con este email en Firestore
  if (!targetDriverUid) {
    try {
      const driversCol = collection(db, 'drivers');
      const q = query(driversCol, where('email', '==', cleanEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetDriverUid = snap.docs[0].id;
      }
    } catch (e) {
      console.warn('Aviso buscando chofer por email en Firestore:', e);
    }
  }

  // Si aún no tiene UID, generamos un identificador único determinista
  if (!targetDriverUid) {
    targetDriverUid = `driver_${staffMember.id || Date.now()}`;
  }

  const vehPayload = vehicleData ? {
    patente: vehicleData.patente || staffMember.vehiculoPatente || 'Flota Oficial',
    marca: vehicleData.marca || 'Furgón',
    modelo: vehicleData.modelo || '',
    categoria: vehicleData.categoria || 'Furgón Mediano',
    capacidad: vehicleData.capacidad || '10 m³',
    seguroCarga: true,
    vtv: 'Vigente'
  } : {
    patente: staffMember.vehiculoPatente || 'Flota Oficial',
    marca: 'Furgón de Flota',
    modelo: 'Asignado por Empresa',
    categoria: 'Furgón Mediano',
    capacidad: '10 m³',
    seguroCarga: true,
    vtv: 'Vigente'
  };

  const driverProfilePayload = {
    uid: targetDriverUid,
    name: staffMember.nombre,
    email: cleanEmail,
    phone: staffMember.telefono || '',
    role: 'conductor',
    tipoConductor: 'dependiente', // Chofer dependiente de empresa
    empresaId: empresaUid,
    empresaNombre: empresaData?.name || empresaData?.displayName || 'Empresa de Mudanzas',
    empresaTelefono: empresaData?.phone || '',
    status: 'approved', // Habilitado de inmediato por la empresa (sin esperas de onboarding)
    isOnline: true,
    tripStatus: 'searching',
    vehicle: vehPayload,
    documents: {
      license: staffMember.licencia?.numero || staffMember.dni,
      licenseCategory: staffMember.licencia?.categoria || 'C2',
      licenseExpiry: staffMember.licencia?.vencimiento || '2028-06-15',
      artProvider: staffMember.art?.proveedor || 'Prevención ART',
      artPolicy: staffMember.art?.numeroPoliza || 'ART-992014-X',
      artClausulaNoRepeticion: staffMember.art?.clausulaNoRepeticion !== false
    },
    // Bloqueo de tarifas (las gestiona la empresa)
    lockTarifas: true,
    tarifasGestionadasPorEmpresa: true,
    lastActive: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Escribir perfil en drivers/{targetDriverUid}
  await setDoc(doc(db, 'drivers', targetDriverUid), driverProfilePayload, { merge: true });

  // Asegurar registro en users/{targetDriverUid}
  try {
    await setDoc(doc(db, 'users', targetDriverUid), {
      uid: targetDriverUid,
      email: cleanEmail,
      displayName: staffMember.nombre,
      role: 'conductor',
      tipoConductor: 'dependiente',
      empresaId: empresaUid,
      status: 'approved',
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    // Silencioso
  }

  // Actualizar legajo del staff en drivers/{empresaUid}/staff/{staffMember.id}
  await updateStaffMember(empresaUid, staffMember.id, {
    appLinked: true,
    driverUid: targetDriverUid,
    linkedAt: serverTimestamp(),
    linkedVehiclePlate: vehPayload.patente
  });

  return { success: true, driverUid: targetDriverUid };
};

export const assignTripToStaffDriver = async (tripId, empresaUid, empresaName, staffMember, vehicleData = null, helpers = []) => {
  if (!tripId || !staffMember) throw new Error('ID de viaje y chofer requeridos.');

  const tripRef = doc(db, 'trips', tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists()) throw new Error('El viaje no existe o fue cancelado.');

  const tripData = tripSnap.data();
  const validOtp = tripData.otpCode || String(Math.floor(1000 + Math.random() * 9000));
  const targetDriverUid = staffMember.driverUid || staffMember.id;

  const updatePayload = {
    driverId: targetDriverUid,
    assignedDriverId: targetDriverUid,
    driverName: staffMember.nombre,
    driverPhone: staffMember.telefono || '',
    empresaId: empresaUid,
    empresaNombre: empresaName || 'Empresa de Mudanzas',
    assignedByEmpresa: true,
    assignedVehiclePlate: vehicleData?.patente || staffMember.vehiculoPatente || 'Flota Central',
    assignedVehicleCategory: vehicleData?.categoria || 'Furgón Mediano',
    cuadrillaAsignada: helpers.length > 0 ? helpers : [staffMember.nombre],
    status: 'asignado',
    otpCode: validOtp,
    assignedAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  };

  await updateDoc(tripRef, updatePayload);

  // Despertar también el estado del chofer en drivers/{targetDriverUid}
  try {
    await updateDoc(doc(db, 'drivers', targetDriverUid), {
      tripStatus: 'assigned',
      currentTripId: tripId,
      isOnline: true,
      lastActive: serverTimestamp()
    });
  } catch (e) {
    // Silencioso
  }

  return { success: true, tripId, driverUid: targetDriverUid };
};

// ========================================================
// 3. VIAJES ACTIVOS Y TELEMETRÍA (Firestore: trips)
// ========================================================

export const subscribeActiveTrip = (uid, onUpdate) => {
  if (!uid) {
    onUpdate(null);
    return () => {};
  }

  // 1. Buscar viaje en curso asignado a este conductor
  const tripsCol = collection(db, 'trips');
  const activeStatusList = ['asignado', 'en_camino', 'en_origen', 'en_transito', 'en_destino', 'accepted', 'in_progress'];
  const qActive = query(
    tripsCol,
    where('driverId', '==', uid),
    where('status', 'in', activeStatusList),
    limit(1)
  );

  return onSnapshot(qActive, (snap) => {
    if (!snap.empty) {
      const d = snap.docs[0];
      const data = d.data();
      onUpdate({
        id: d.id,
        cliente: data.clientName || data.cliente || 'Cliente Mudify',
        origen: data.origin?.address || data.origen || 'CABA',
        destino: data.destination?.address || data.destino || 'GBA',
        vehiculo: data.vehicleTypeRequired || data.vehiculo || 'Furgón Mediano',
        patente: data.patente || 'En ruta',
        monto: Number(data.estimatedPrice || data.monto || 0),
        estado: normalizeTripStatus(data.status),
        otpCode: String(data.otpCode || data.verificationCode || '4819'),
        horaInicio: data.horaInicio || '10:30 hs'
      });
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.warn('Error escuchando viaje activo en Firestore:', err);
  });
};

const normalizeTripStatus = (status) => {
  if (status === 'accepted') return 'asignado';
  if (status === 'in_progress') return 'en_transito';
  return status || 'asignado';
};

export const advanceTripStep = async (tripId, nextStatus, driverUid) => {
  if (!tripId) throw new Error('ID de viaje requerido.');
  try {
    await updateDoc(doc(db, 'trips', tripId), {
      status: nextStatus,
      lastUpdated: serverTimestamp()
    });

    if (driverUid) {
      await updateDoc(doc(db, 'drivers', driverUid), {
        tripStatus: nextStatus,
        lastActive: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Error actualizando estado en Firestore:', err);
  }
  return { success: true, nextStatus };
};

export const completeTripWithOTP = async (tripId, otpCode, driverUid, amount = 0) => {
  if (!tripId || !otpCode) throw new Error('Viaje y código OTP son requeridos.');

  const tripRef = doc(db, 'trips', tripId);
  const tripSnap = await getDoc(tripRef);

  if (tripSnap.exists()) {
    const tripData = tripSnap.data();
    const validOtp = tripData.otpCode || tripData.verificationCode || '4819';

    if (String(otpCode).trim() !== String(validOtp).trim()) {
      throw new Error('Código OTP incorrecto. Solicitá al cliente su código de 4 dígitos.');
    }

    await updateDoc(tripRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      paymentStatus: 'accredited'
    });
  }

  // Acreditar ganancias al conductor en Firestore
  if (driverUid) {
    try {
      const driverRef = doc(db, 'drivers', driverUid);
      const driverSnap = await getDoc(driverRef);
      const currentEarnings = driverSnap.exists() ? (driverSnap.data().earnings || 0) : 0;
      await updateDoc(driverRef, {
        earnings: currentEarnings + Number(amount || 0),
        tripStatus: 'searching',
        lastActive: serverTimestamp()
      });
    } catch (e) {
      console.warn('Aviso acreditando ganancias:', e);
    }
  }

  return { success: true };
};

// Crear viaje en tiempo real en la base de datos
export const createTrip = async (tripData) => {
  const tripsCol = collection(db, 'trips');
  const otpCode = String(Math.floor(1000 + Math.random() * 9000));
  const docRef = await addDoc(tripsCol, {
    ...tripData,
    otpCode,
    status: tripData.status || 'asignado',
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  });
  return { id: docRef.id, ...tripData, otpCode };
};

// ========================================================
// 4. DESPACHO & AGENDA (Firestore: trips con type: scheduled)
// ========================================================

export const subscribeScheduledTrips = (uid, onUpdate) => {
  const tripsCol = collection(db, 'trips');
  const q = query(
    tripsCol,
    where('type', '==', 'scheduled'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        cliente: data.clientName || data.cliente || 'Reserva Programada',
        horario: data.scheduledTime || data.horario || 'Horario a confirmar',
        fecha: data.scheduledDate || data.fecha || 'Fecha programada',
        ruta: data.ruta || `${data.origin?.address || 'Origen'} ➔ ${data.destination?.address || 'Destino'}`,
        porte: data.vehicleTypeRequired || data.porte || 'Furgón Mediano',
        estado: data.status || 'programado',
        monto: Number(data.estimatedPrice || data.monto || 0)
      };
    });
    onUpdate(list);
  }, (err) => {
    console.warn('Error escuchando agenda programada en Firestore:', err);
  });
};

export const createScheduledTrip = async (uid, tripData) => {
  const tripsCol = collection(db, 'trips');
  const docRef = await addDoc(tripsCol, {
    ...tripData,
    driverId: uid || null,
    type: 'scheduled',
    status: 'programado',
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...tripData };
};

// ========================================================
// 5. FACTURACIÓN Y HISTORIAL (Firestore: trips completados)
// ========================================================

export const subscribeCompletedTrips = (uid, onUpdate) => {
  const tripsCol = collection(db, 'trips');
  let q;
  if (uid) {
    q = query(tripsCol, where('driverId', '==', uid));
  } else {
    q = query(tripsCol, limit(50));
  }

  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map(d => {
        const data = d.data();
        const dateStr = data.completedAt?.toDate
          ? data.completedAt.toDate().toLocaleDateString('es-AR')
          : data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleDateString('es-AR')
          : 'Reciente';
        const rawDate = data.completedAt?.toDate
          ? data.completedAt.toDate()
          : data.createdAt?.toDate
          ? data.createdAt.toDate()
          : new Date();
        return {
          id: d.id,
          code: `REM-${d.id.slice(-6).toUpperCase()}`,
          cliente: data.clientName || data.cliente || 'Cliente Mudify',
          clienteTelefono: data.clientPhone || '',
          origen: data.originAddress || data.origen || 'Origen CABA',
          destino: data.destinationAddress || data.destino || 'Destino AMBA',
          distancia: data.distance || '',
          vehiculo: data.vehicleTypeRequired || data.vehiculo || 'Flete Mediano',
          patente: data.patente || data.assignedVehiclePlate || '',
          fecha: dateStr,
          rawDate,
          concepto: `Servicio de mudanza y traslado (${data.vehicleTypeRequired || data.vehiculo || 'Flete'})`,
          monto: Number(data.price || data.estimatedPrice || data.monto || 0),
          metodo: data.paymentMethod || 'Transferencia Directa CVU',
          estado: data.status === 'completed' ? 'Cobrado' : (data.status || 'Completado'),
          status: data.status,
          cargoDescription: data.cargoDescription || '',
          inventarioItems: data.inventarioItems || []
        };
      })
      .filter(t => t.status === 'completed' || t.status === 'finalizado')
      .sort((a, b) => b.rawDate - a.rawDate);

    onUpdate(list);
  }, (err) => {
    console.warn('Error escuchando facturación en Firestore:', err);
    onUpdate([]);
  });
};

// ========================================================
// 5.B. GESTIÓN FINANCIERA & GASTOS OPERATIVOS (Firestore: drivers/{uid}/expenses)
// ========================================================

export const subscribeExpenses = (uid, onUpdate) => {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }
  const expensesCol = collection(db, 'drivers', uid, 'expenses');
  const q = query(expensesCol);

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => {
      const data = d.data();
      const rawDate = data.fecha?.toDate
        ? data.fecha.toDate()
        : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.fecha || Date.now()));
      const fechaStr = rawDate.toLocaleDateString('es-AR');
      return {
        id: d.id,
        ...data,
        rawDate,
        fechaStr
      };
    }).sort((a, b) => b.rawDate - a.rawDate);

    onUpdate(list);
  }, (err) => {
    console.warn('Error escuchando gastos en Firestore:', err);
    onUpdate([]);
  });
};

export const addExpense = async (uid, expenseData) => {
  if (!uid) throw new Error('Usuario no autenticado.');
  const expensesCol = collection(db, 'drivers', uid, 'expenses');
  const docRef = await addDoc(expensesCol, {
    ...expenseData,
    monto: Number(expenseData.monto || 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: docRef.id, ...expenseData };
};

export const deleteExpense = async (uid, expenseId) => {
  if (!uid || !expenseId) throw new Error('Parámetros faltantes.');
  const expRef = doc(db, 'drivers', uid, 'expenses', expenseId);
  await deleteDoc(expRef);
  return { success: true };
};

// ========================================================
// 5.C. REMITOS Y FACTURAS OFICIALES (Firestore: drivers/{uid}/invoices)
// ========================================================

export const subscribeInvoices = (uid, onUpdate) => {
  if (!uid) {
    onUpdate([]);
    return () => {};
  }
  const invoicesCol = collection(db, 'drivers', uid, 'invoices');
  const q = query(invoicesCol);

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => {
      const data = d.data();
      const rawDate = data.fechaEmision?.toDate
        ? data.fechaEmision.toDate()
        : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date());
      const fechaStr = rawDate.toLocaleDateString('es-AR');
      return {
        id: d.id,
        ...data,
        rawDate,
        fechaStr
      };
    }).sort((a, b) => b.rawDate - a.rawDate);

    onUpdate(list);
  }, (err) => {
    console.warn('Error escuchando facturas/remitos en Firestore:', err);
    onUpdate([]);
  });
};

export const createInvoice = async (uid, invoiceData) => {
  if (!uid) throw new Error('Usuario no autenticado.');
  const invoicesCol = collection(db, 'drivers', uid, 'invoices');
  const docRef = await addDoc(invoicesCol, {
    ...invoiceData,
    monto: Number(invoiceData.monto || 0),
    fechaEmision: serverTimestamp(),
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...invoiceData };
};

export const updateInvoiceStatus = async (uid, invoiceId, status) => {
  if (!uid || !invoiceId) throw new Error('Parámetros faltantes.');
  const invRef = doc(db, 'drivers', uid, 'invoices', invoiceId);
  await updateDoc(invRef, {
    estadoCobro: status,
    updatedAt: serverTimestamp()
  });
  return { success: true };
};

export const deleteInvoice = async (uid, invoiceId) => {
  if (!uid || !invoiceId) throw new Error('Parámetros faltantes.');
  const invRef = doc(db, 'drivers', uid, 'invoices', invoiceId);
  await deleteDoc(invRef);
  return { success: true };
};

// ========================================================
// 6. GEOLOCALIZACIÓN SATELITAL DEL CHOFER (Firestore: drivers/{uid})
// ========================================================

export const updateDriverLiveLocation = async (uid, coords) => {
  if (!uid || !coords) return;
  try {
    await setDoc(doc(db, 'drivers', uid), {
      currentLocation: {
        latitude: coords.lat || coords.latitude,
        longitude: coords.lng || coords.longitude,
        accuracy: coords.accuracy || 10,
        heading: coords.heading || 0,
        speed: coords.speed || 0,
        updatedAt: serverTimestamp()
      },
      isOnline: true,
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Error sincronizando GPS a Firestore:', e);
  }
};

// ========================================================
// 5. SOLICITUDES DE MUDANZAS EN TIEMPO REAL (Firestore: trips con status searching/pending)
// ========================================================

export const subscribeMovingRequests = (userUid, isEmpresa, onUpdate) => {
  const tripsCol = collection(db, 'trips');
  // Escuchar todas las solicitudes con status 'searching' o 'pending'
  const q = query(
    tripsCol,
    where('status', 'in', ['searching', 'pending'])
  );

  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => {
      const data = d.data();
      const isDirect = Boolean(
        (data.assignedDriverId && data.assignedDriverId === userUid) ||
        (data.driverId && data.driverId === userUid)
      );

      return {
        id: d.id,
        clientName: data.clientName || data.cliente || 'Cliente Mudify',
        clientPhone: data.clientPhone || '',
        clientPhoto: data.clientPhoto || '',
        clientUid: data.clientUid || '',
        originAddress: data.originAddress || data.origin?.address || data.origen || 'Origen sin especificar',
        destinationAddress: data.destinationAddress || data.destination?.address || data.destino || 'Destino sin especificar',
        originFloor: data.originFloor || '',
        floorDestination: data.floorDestination || '',
        hasElevatorOrigin: Boolean(data.hasElevatorOrigin),
        hasElevatorDestination: Boolean(data.hasElevatorDestination),
        price: Number(data.price || data.estimatedPrice || data.monto || 0),
        proposedPrice: data.proposedPrice != null ? Number(data.proposedPrice) : null,
        proposedBy: data.proposedBy || null,
        distance: data.distance || '',
        duration: data.duration || '',
        cargoDescription: data.cargoDescription || 'Mudanza general',
        requiredVehicleType: data.requiredVehicleType || data.vehicleTypeRequired || data.vehiculo || 'Flete Mediano',
        helpersNeeded: Number(data.helpersNeeded || 0),
        requiresPackaging: Boolean(data.requiresPackaging),
        requiresAssembly: Boolean(data.requiresAssembly),
        requiresBalconyElevation: Boolean(data.requiresBalconyElevation),
        inventarioItems: Array.isArray(data.inventarioItems) ? data.inventarioItems : [],
        type: data.type || 'immediate',
        scheduledDate: data.scheduledDate || null,
        status: data.status || 'searching',
        assignedDriverId: data.assignedDriverId || null,
        specialInstructions: data.specialInstructions || '',
        otpCode: String(data.otpCode || '0000'),
        isDirect,
        createdAt: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : new Date()
      };
    });

    // Ordenar: primero las directas para este usuario, luego por fecha más reciente
    requests.sort((a, b) => {
      if (a.isDirect && !b.isDirect) return -1;
      if (!a.isDirect && b.isDirect) return 1;
      return b.createdAt - a.createdAt;
    });

    onUpdate(requests);
  }, (err) => {
    console.warn('Error escuchando solicitudes de mudanza en Firestore:', err);
    onUpdate([]);
  });
};

export const acceptMovingRequest = async (tripId, driverUid, driverName, isEmpresa) => {
  if (!tripId || !driverUid) throw new Error('ID de viaje y de transportista requeridos.');
  
  const tripRef = doc(db, 'trips', tripId);
  const tripSnap = await getDoc(tripRef);
  if (!tripSnap.exists()) throw new Error('La solicitud ya no existe o fue cancelada.');

  const tripData = tripSnap.data();
  const validOtp = tripData.otpCode || String(Math.floor(1000 + Math.random() * 9000));

  await updateDoc(tripRef, {
    status: 'accepted',
    driverId: driverUid,
    assignedDriverId: driverUid,
    driverName: driverName || (isEmpresa ? 'Empresa de Mudanzas' : 'Conductor Independiente'),
    otpCode: validOtp,
    acceptedAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  });

  try {
    await updateDoc(doc(db, 'drivers', driverUid), {
      tripStatus: 'accepted',
      lastActive: serverTimestamp()
    });
  } catch (e) {
    // Si aún no está creado el doc en drivers, no interrumpir
  }

  return { success: true, tripId };
};

export const proposeTripOffer = async (tripId, driverUid, driverName, offerPrice) => {
  if (!tripId || !driverUid) throw new Error('Parámetros faltantes.');
  const tripRef = doc(db, 'trips', tripId);
  
  await updateDoc(tripRef, {
    proposedPrice: Number(offerPrice),
    proposedBy: 'driver',
    lastUpdated: serverTimestamp()
  });

  return { success: true };
};

export const createSimulatedMovingRequest = async (userUid, isDirect = false) => {
  const tripsCol = collection(db, 'trips');
  const sampleClients = [
    { name: 'Valentina Morales', phone: '11-4589-2234', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
    { name: 'Lucas Benítez', phone: '11-6321-9981', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
    { name: 'Camila Rossi', phone: '11-5412-7788', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }
  ];
  const client = sampleClients[Math.floor(Math.random() * sampleClients.length)];

  const routes = [
    {
      origin: 'Av. Cabildo 2400, Belgrano (CABA)',
      destination: 'Av. Santa Fe 3200, Palermo (CABA)',
      dist: '4.8 km',
      dur: '14 min',
      price: 68500,
      floorO: '4° piso (con ascensor)',
      floorD: 'PB',
      cargo: '1 cama matrimonial, 1 heladera, 1 sillón 3 cuerpos, 8 cajas grandes',
      helpers: 2,
      items: [
        { nombre: 'Cama Matrimonial con Sommier', cantidad: 1, categoria: 'Muebles' },
        { nombre: 'Heladera No Frost con Freezer', cantidad: 1, categoria: 'Electrodomésticos' },
        { nombre: 'Sillón Chenille 3 Cuerpos', cantidad: 1, categoria: 'Living' },
        { nombre: 'Cajas Estándar Embalaje', cantidad: 8, categoria: 'Cajas' }
      ]
    },
    {
      origin: 'Av. Maipú 1800, Vicente López (PBA)',
      destination: 'Juramento 1500, Belgrano (CABA)',
      dist: '6.2 km',
      dur: '18 min',
      price: 84000,
      floorO: '2° piso (por escalera)',
      floorD: '3° piso (con ascensor)',
      cargo: 'Mudanza completa 2 ambientes: mesa, 4 sillas, sommier, lavarropas, 15 cajas',
      helpers: 2,
      items: [
        { nombre: 'Mesa de Comedor Madera Maciza', cantidad: 1, categoria: 'Muebles' },
        { nombre: 'Sillas de Comedor Tapizadas', cantidad: 4, categoria: 'Muebles' },
        { nombre: 'Sommier 2 Plazas 140x190', cantidad: 1, categoria: 'Dormitorio' },
        { nombre: 'Lavarropas Automático Carga Frontal', cantidad: 1, categoria: 'Electro' },
        { nombre: 'Cajas de Mudanza Rotuladas', cantidad: 15, categoria: 'Cajas' }
      ]
    },
    {
      origin: 'Av. Rivadavia 6200, Flores (CABA)',
      destination: 'Av. Corrientes 4800, Villa Crespo (CABA)',
      dist: '5.1 km',
      dur: '16 min',
      price: 59000,
      floorO: '1° piso',
      floorD: 'PB',
      cargo: 'Cama 1 plaza, escritorio gamer, silla ergonómica, TV 55", 6 cajas',
      helpers: 1,
      items: [
        { nombre: 'Cama 1 Plaza con Colchón', cantidad: 1, categoria: 'Dormitorio' },
        { nombre: 'Escritorio de Trabajo / Gaming', cantidad: 1, categoria: 'Oficina' },
        { nombre: 'Silla Ergonómica Regulable', cantidad: 1, categoria: 'Oficina' },
        { nombre: 'Smart TV 55 Pulgadas (Embalado)', cantidad: 1, categoria: 'Electrónica' },
        { nombre: 'Cajas con Ropa y Libros', cantidad: 6, categoria: 'Cajas' }
      ]
    }
  ];
  const route = routes[Math.floor(Math.random() * routes.length)];
  const otpCode = String(Math.floor(1000 + Math.random() * 9000));

  const tripData = {
    clientName: client.name,
    clientPhone: client.phone,
    clientPhoto: client.photo,
    clientUid: 'cliente_simulado_' + Date.now(),
    originAddress: route.origin,
    destinationAddress: route.destination,
    originFloor: route.floorO,
    floorDestination: route.floorD,
    hasElevatorOrigin: route.floorO.includes('ascensor'),
    hasElevatorDestination: route.floorD.includes('ascensor'),
    distance: route.dist,
    duration: route.dur,
    price: route.price,
    estimatedPrice: route.price,
    cargoDescription: route.cargo,
    inventarioItems: route.items,
    requiredVehicleType: 'Furgón Mediano',
    helpersNeeded: route.helpers,
    requiresPackaging: true,
    requiresAssembly: false,
    requiresBalconyElevation: false,
    type: Math.random() > 0.5 ? 'immediate' : 'scheduled',
    scheduledDate: Math.random() > 0.5 ? 'Hoy 16:30 hs' : 'Mañana 10:00 hs',
    status: 'searching',
    assignedDriverId: isDirect ? userUid : null,
    specialInstructions: isDirect ? 'Solicitud directa enviada por el cliente desde la app Android' : 'Bolsa general de mudanzas',
    otpCode,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  };

  const docRef = await addDoc(tripsCol, tripData);
  return { id: docRef.id, ...tripData };
};

const fleetService = {
  SUBSCRIPTION_PLANS,
  getMaxVehiclesAllowed,
  canAddVehicle,
  getDriverRates,
  saveDriverRates,
  updateDriverRates,
  getDriverPaymentInfo,
  saveDriverPaymentInfo,
  subscribeVehicles,
  addVehicle,
  deleteVehicle,
  subscribeStaff,
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  seedDefaultStaff,
  provisionDependentDriver,
  assignTripToStaffDriver,
  subscribeActiveTrip,
  advanceTripStep,
  completeTripWithOTP,
  createTrip,
  subscribeScheduledTrips,
  createScheduledTrip,
  subscribeCompletedTrips,
  subscribeExpenses,
  addExpense,
  deleteExpense,
  subscribeInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  updateDriverLiveLocation,
  subscribeMovingRequests,
  acceptMovingRequest,
  proposeTripOffer,
  createSimulatedMovingRequest
};

export default fleetService;
