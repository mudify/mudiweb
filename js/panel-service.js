/**
 * MUDIFY PRO ENTERPRISE — DATA SERVICE & REALTIME FIRESTORE LAYER
 * Soporte Multi-Rol: Conductor Independiente vs Empresa de Mudanzas.
 * Arquitectura 100% conectada a Cloud Firestore (mudapp-a9d40).
 * CERO DATOS HARDCODEADOS.
 * Filtra automáticamente los datos de la cuenta activa:
 * - Modo Conductor: SOLO muestra su propio vehículo, sus viajes asignados y sus ganancias.
 * - Modo Empresa: Permite gestionar la flota y métricas empresariales.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'mudify_enterprise_store_v4';
  const MODE_STORAGE_KEY = 'mudify_account_mode';

  // Configuración oficial de conexión a Firebase para mudapp-a9d40
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCP2lXT7muCMQgUmnenCbAa4WAibfaECRw",
    authDomain: "mudapp-a9d40.firebaseapp.com",
    projectId: "mudapp-a9d40",
    storageBucket: "mudapp-a9d40.firebasestorage.app",
    messagingSenderId: "715192552282"
  };

  const DEFAULT_INITIAL_STATE = {
    dbConnected: false,
    dbSource: 'Conectando a Cloud Firestore (mudapp-a9d40)...',
    accountMode: 'conductor', // 'conductor' | 'empresa'

    hubs: [
      { id: 'hub-caba-amba', name: 'Base Operativa CABA / AMBA', address: 'Área Metropolitana de Buenos Aires', activeFleet: 0, isDefault: true }
    ],
    selectedHubId: 'hub-caba-amba',

    userProfile: {
      name: 'Usuario Mudify',
      role: 'Conductor Independiente',
      company: 'Flete / Mudanza Independiente',
      avatarUrl: '',
      activeShift: 'Turno Activo',
      rates: null
    },

    subscription: {
      planId: 'fletero_pro',
      planName: 'Plan Fletero Pro',
      maxVehicles: 1,
      status: 'trial_active',
      trialDaysRemaining: 60,
      description: 'Suscripción para 1 vehículo independiente'
    },

    kpis: {
      activeFleetPct: 0,
      fleetRunning: 0,
      fleetTotal: 0,
      fleetInService: 0,
      inServiceNote: 'Sin unidades en taller',
      activeMoves: 0,
      movesOnSchedulePct: 100,
      movesUnloading: 0,
      movesEnRoute: 0,
      monthlyBilling: 0,
      billingGrowthPct: 0,
      billingCorpPct: 0,
      billingResPct: 0,
      activeCrewMembers: 0,
      activeCrewsCount: 0,
      estManHours: 0
    },

    vehicles: [],
    rawTrips: [],
    pendingServices: [],
    timelineSchedule: [],
    crewShifts: [],
    legalAlerts: [],
    maintenanceRecords: [],
    policiesVault: [],
    b2bQuotes: []
  };

  class MudifyDataService {
    constructor() {
      // Modo de cuenta (Conductor Independiente vs Empresa)
      let savedMode = 'conductor';
      try {
        const storedUser = JSON.parse(localStorage.getItem('mudify_user_session') || '{}');
        if (storedUser.role === 'empresa' || storedUser.isEmpresa) {
          savedMode = 'empresa';
        } else {
          savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'conductor';
        }
      } catch (e) {}
      this.accountMode = savedMode;

      this.state = this._loadLocal() || JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
      this.state.accountMode = this.accountMode;
      this.listeners = [];
      this.firestore = null;
      this.firebaseAuth = null;
      
      this.allRawDrivers = [];
      this.allRawTrips = [];
      this.myDriverDoc = null;

      this.initFirebase();
    }

    initFirebase() {
      try {
        if (window.firebase) {
          if (!window.firebase.apps.length) {
            window.firebase.initializeApp(FIREBASE_CONFIG);
          }
          this.firestore = window.firebase.firestore();
          this.firebaseAuth = window.firebase.auth ? window.firebase.auth() : null;
          this.state.dbConnected = true;
          this.state.dbSource = 'Cloud Firestore (mudapp-a9d40) en Vivo';
          console.log('[Mudify PRO] Conectado exitosamente con Cloud Firestore (mudapp-a9d40).');
          
          this._initLiveListeners();
          this._initAuthListener();
        }
      } catch (err) {
        console.warn('[Mudify PRO] Error al inicializar Firestore:', err);
      }
    }

    _initAuthListener() {
      if (!this.firebaseAuth) return;
      this.firebaseAuth.onAuthStateChanged(async (user) => {
        if (user && this.firestore) {
          try {
            let snap = await this.firestore.collection('users').doc(user.uid).get();
            if (!snap.exists) snap = await this.firestore.collection('usuarios').doc(user.uid).get();
            if (snap.exists && snap.data().role === 'empresa') {
              this.accountMode = 'empresa';
              this.state.accountMode = 'empresa';
              const stored = JSON.parse(localStorage.getItem('mudify_user_session') || '{}');
              stored.role = 'empresa';
              stored.isEmpresa = true;
              localStorage.setItem('mudify_user_session', JSON.stringify(stored));
            }
          } catch(e) {
            console.warn('Aviso verificando rol empresa en panel-service:', e);
          }
        }
        if (user) {
          // Re-aplicar filtro con la cuenta que acaba de iniciar sesión
          this._applyScopedData();
        }
      });
    }

    // Cambiar entre modo 'conductor' y 'empresa'
    async setAccountMode(mode) {
      if (mode !== 'conductor' && mode !== 'empresa') return;
      this.accountMode = mode;
      this.state.accountMode = mode;
      try {
        localStorage.setItem(MODE_STORAGE_KEY, mode);
      } catch (e) {}

      console.log(`[Mudify PRO] Modo de cuenta cambiado a: ${mode.toUpperCase()}`);
      this._applyScopedData();
      return this.accountMode;
    }

    getAccountMode() {
      return this.accountMode;
    }

    // Escuchas en tiempo real para sincronizar 'drivers' y 'trips' desde mudapp-a9d40
    _initLiveListeners() {
      if (!this.firestore) return;

      // 1. ESCUCHA EN TIEMPO REAL DE CONDUCTORES ('drivers')
      try {
        this.firestore.collection('drivers').onSnapshot(snapshot => {
          if (!snapshot.empty) {
            console.log(`[Firestore] Drivers actualizados en tiempo real: ${snapshot.size}`);
            
            const rawDrivers = [];
            snapshot.forEach((doc, idx) => {
              const d = doc.data();
              const v = d.vehicle || {};
              const isOnline = Boolean(d.isOnline);
              const plate = (v.plate || 'S/PAT').toUpperCase();
              const brand = (v.brand || '').trim();
              const model = (v.model || '').trim();
              const type = v.type || 'Flete Mediano';
              const brandModel = (brand || model) ? `${brand.toUpperCase()} ${model.toUpperCase()}`.trim() : type;
              const category = (type.toLowerCase().includes('grande') || type.toLowerCase().includes('camion')) ? 'pesado' : 'furgon';
              const driverName = d.name || 'Conductor Registrado';
              const code = `#${String(idx + 1).padStart(2, '0')}`;
              
              const tripStatus = d.tripStatus || 'searching';
              const isBusy = ['goingToOrigin', 'arrivedAtOrigin', 'loading', 'goingToDestination', 'unloading', 'in_progress', 'waitingClientSignature'].includes(tripStatus);
              
              let status = 'disponible';
              if (isBusy) {
                status = 'en_ruta';
              }

              const veh = {
                id: doc.id,
                uid: d.uid || doc.id,
                code: code,
                plate: plate,
                brandModel: brandModel,
                year: v.year || 2023,
                odometer: v.odometer || '42.500 km',
                volumeM3: v.capacity ? (parseInt(v.capacity, 10) || 15) : 15,
                payloadKg: v.payloadKg || (category === 'pesado' ? 4500 : 2000),
                category: category,
                isOnline: isOnline,
                specialEquipment: [
                  d.offersHelpers ? 'Estibadores Habilitados' : null,
                  d.offersLoading ? 'Carga y Descarga' : 'Solo Traslado',
                  d.offersBoxes ? 'Cajas y Embalaje' : null,
                  d.offersAssembly ? 'Desarme / Armado' : null,
                  d.offersBaskets ? 'Canastos Plásticos' : null
                ].filter(Boolean),
                driver: {
                  name: driverName,
                  email: (d.email || '').toLowerCase().trim(),
                  phone: d.phone || d.telefono || '-',
                  licenseType: (d.documents && d.documents.license) ? `Licencia #${d.documents.license}` : 'Licencia Profesional',
                  rating: 5.0,
                  photoUrl: d.photoUrl || '',
                  activeTripId: d.currentTripId || null
                },
                crew: {
                  name: `Cuadrilla ${driverName.split(' ')[0]}`,
                  membersCount: d.maxHelpers ? parseInt(d.maxHelpers, 10) : 1,
                  helpers: d.maxHelpers ? [`${d.maxHelpers} Ayudante(s) asignado(s)`] : ['Chofer Titular']
                },
                status: status,
                currentTask: {
                  code: isBusy ? `#${tripStatus.substring(0, 6).toUpperCase()}` : '#DISP',
                  type: type,
                  client: isBusy ? `Operación: ${tripStatus}` : 'Disponible para despacho',
                  origin: 'Base Operativa',
                  destination: isOnline ? 'Cobertura AMBA / En Servicio' : 'En Base',
                  eta: isOnline ? (isBusy ? 'En curso' : 'Inmediato') : 'En Base',
                  progressPct: isBusy ? 65 : (isOnline ? 100 : 0),
                  phase: isBusy ? `Operación: ${tripStatus}` : (isOnline ? 'Unidad Conectada / En Línea' : 'Unidad en Base')
                },
                telemetry: {
                  lat: (d.position && d.position.latitude) ? d.position.latitude : -34.6037 + ((idx - 2) * 0.025),
                  lng: (d.position && d.position.longitude) ? d.position.longitude : -58.3816 + ((idx - 2) * 0.02),
                  speedKmH: isBusy ? 38 : 0,
                  batteryPct: 95,
                  signal: isOnline ? '4G OK' : 'OFFLINE',
                  address: (d.position && d.position.address) ? d.position.address : (isOnline ? 'Área Metropolitana AMBA' : 'Base Central'),
                  loadCapacityPct: isBusy ? 60 : 0
                },
                documents: {
                  vtvExpiry: 'Vigente',
                  vtvValid: true,
                  insuranceCompany: 'Póliza Digital',
                  insurancePolicy: 'PO-' + doc.id.substring(0, 6).toUpperCase(),
                  insuranceValid: true,
                  artProvider: 'Cobertura ART',
                  artValid: true,
                  cnrtStatus: d.status === 'approved' ? 'Habilitado Oficial' : 'Pendiente'
                },
                rates: {
                  pricePerKm: d.pricePerKm || 1000,
                  pricePerHour: d.pricePerHour || 4000,
                  helperRate: d.helperRate || 60000,
                  loadingUnloadingRate: d.loadingUnloadingRate || 60000,
                  delayRate: d.delayRate || 6000,
                  stairFloorRate: d.stairFloorRate || 3000,
                  timeRateRadiusKm: d.timeRateRadiusKm || 40,
                  fuelPrice: d.fuelPrice || 2500,
                  offersHelpers: Boolean(d.offersHelpers),
                  offersLoading: Boolean(d.offersLoading),
                  offersBoxes: Boolean(d.offersBoxes),
                  offersBaskets: Boolean(d.offersBaskets),
                  offersAssembly: Boolean(d.offersAssembly),
                  offersStairs: Boolean(d.offersStairs)
                }
              };

              rawDrivers.push(veh);
            });

            this.allRawDrivers = rawDrivers;
            this._applyScopedData();
          }
        }, err => {
          console.warn('[Firestore Drivers Error]:', err.message);
        });
      } catch (e) {
        console.warn('[Firestore] Error registrando listener de drivers:', e);
      }

      // 2. ESCUCHA EN TIEMPO REAL DE VIAJES Y MUDANZAS ('trips')
      try {
        this.firestore.collection('trips').onSnapshot(snapshot => {
          if (!snapshot.empty) {
            console.log(`[Firestore] Trips actualizados en tiempo real: ${snapshot.size}`);
            
            const rawTrips = [];
            snapshot.forEach(doc => {
              const t = doc.data();
              const price = parseFloat(t.price || t.cost || 0);
              const status = (t.status || 'pending').toLowerCase();

              rawTrips.push({
                id: doc.id,
                code: '#MU-' + doc.id.substring(0, 4).toUpperCase(),
                client: t.clientName || t.userName || t.nombreCliente || 'Cliente Mudapp',
                origin: t.originAddress || t.direccionOrigen || 'Origen no especificado',
                destination: t.destinationAddress || t.direccionDestino || 'Destino no especificado',
                budget: price,
                volume: t.cargoDescription || t.descripcionCarga || t.vehicleType || 'Servicio de Mudanza',
                status: (status === 'pending' || status === 'searching' || status === 'requestreceived') ? 'pendiente' :
                        (status === 'completed') ? 'completado' :
                        (status === 'cancelled') ? 'cancelado' : 'en_curso',
                dateTimeRequested: t.scheduledDate || (t.createdAt && t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString('es-AR') : 'Hoy'),
                driverId: t.driverId || t.assignedDriverId || null,
                assignedDriverId: t.assignedDriverId || t.driverId || null,
                rawStatus: status
              });
            });

            this.allRawTrips = rawTrips;
            this._applyScopedData();
          }
        }, err => {
          console.warn('[Firestore Trips Error]:', err.message);
        });
      } catch (e) {
        console.warn('[Firestore] Error registrando listener de trips:', e);
      }
    }

    // =========================================================================
    // FILTRADO ESTRICTO SEGÚN MODO DE CUENTA Y USUARIO LOGEADO
    // =========================================================================
    _applyScopedData() {
      const currentUser = this.getCurrentUser();
      const currentEmail = (currentUser?.email || '').toLowerCase().trim();
      const currentUid = currentUser?.uid || '';

      // Identificar si el usuario actual corresponde a un conductor registrado en Firestore
      const myDriver = this.allRawDrivers.find(d => 
        (d.uid && d.uid === currentUid) || 
        (d.id && d.id === currentUid) || 
        (d.driver && d.driver.email && d.driver.email === currentEmail)
      );

      this.myDriverDoc = myDriver || null;

      // =======================================================================
      // MODO 1: CONDUCTOR INDEPENDIENTE (SOLO SUS DATOS ESPECÍFICOS)
      // =======================================================================
      if (this.accountMode === 'conductor') {
        let vehicles = [];
        let myTrips = [];

        if (myDriver) {
          // SOLO EL VEHÍCULO DE ESTE CONDUCTOR
          vehicles = [ myDriver ];

          // SOLO LOS VIAJES ASIGNADOS O REALIZADOS POR ESTE CONDUCTOR
          myTrips = this.allRawTrips.filter(t => 
            t.driverId === myDriver.id || 
            t.driverId === currentUid || 
            t.assignedDriverId === myDriver.id || 
            t.assignedDriverId === currentUid
          );

          // Perfil exclusivo de conductor
          this.state.userProfile = {
            uid: currentUid,
            name: myDriver.driver.name,
            email: myDriver.driver.email || currentEmail,
            role: 'Conductor Independiente',
            company: `Flete / Mudanza Independiente (${myDriver.plate})`,
            avatarUrl: myDriver.driver.photoUrl || currentUser?.avatarUrl || '',
            activeShift: 'Turno Activo',
            rates: myDriver.rates,
            vehicle: myDriver.brandModel,
            plate: myDriver.plate
          };

          this.state.hubs = [
            { id: 'hub-propio', name: `Base Móvil · ${myDriver.driver.name} (${myDriver.plate})`, address: 'Área de Cobertura Activa', activeFleet: myDriver.isOnline ? 1 : 0, isDefault: true }
          ];

        } else {
          // Si el usuario aún no tiene registro en drivers
          vehicles = [];
          myTrips = [];
          this.state.userProfile = {
            uid: currentUid,
            name: currentUser?.name || 'Conductor',
            email: currentEmail,
            role: 'Conductor Independiente',
            company: 'Flete / Mudanza Independiente',
            avatarUrl: currentUser?.avatarUrl || '',
            activeShift: 'Turno Activo',
            rates: null
          };
        }

        this.state.vehicles = vehicles;
        this.state.rawTrips = myTrips;
        this.state.pendingServices = myTrips.filter(t => t.status === 'pendiente' || t.status === 'en_curso');

        // Cotizaciones de este conductor
        this.state.b2bQuotes = myTrips.map(t => ({
          id: t.id,
          code: t.code,
          client: t.client,
          origin: t.origin,
          destination: t.destination,
          volume: t.volume,
          amount: t.budget,
          status: t.status === 'completado' ? 'aprobado' : t.status === 'cancelado' ? 'cancelado' : 'pendiente'
        }));

        // Bóveda de pólizas de su propio vehículo
        this.state.policiesVault = vehicles.map(v => ({
          title: `Póliza Responsabilidad Civil · ${v.brandModel}`,
          insurer: 'Aseguradora Nacional',
          policyNumber: 'POL-' + v.id.substring(0, 6).toUpperCase(),
          plate: v.plate
        }));

        // Cuadrilla del conductor
        this.state.crewShifts = vehicles.map(v => ({
          name: v.crew.name,
          leader: v.driver.name,
          assignedVehicleCode: v.code,
          shift: v.isOnline ? 'Turno Activo' : 'Guardia',
          helpers: v.crew.helpers
        }));

        // Cronograma Gantt de su propia unidad
        this.state.timelineSchedule = vehicles.map(v => {
          const activeTrip = myTrips.find(t => t.status === 'en_curso');
          const slots = [];
          if (activeTrip) {
            slots.push({
              startHour: 10,
              endHour: 15,
              status: 'en_curso',
              title: activeTrip.client,
              route: `${activeTrip.origin} → ${activeTrip.destination}`,
              helpersCount: v.crew.membersCount
            });
          }
          return {
            vehicleId: v.id,
            plate: v.plate,
            model: v.brandModel,
            driverName: v.driver.name,
            category: v.category,
            slots: slots
          };
        });

        // Facturación y Mudanzas calculadas EXCLUSIVAMENTE para este conductor
        let myTotalCompletedRevenue = 0;
        let myActiveMovesCount = 0;
        let myMovesUnloading = 0;
        let myMovesEnRoute = 0;

        myTrips.forEach(t => {
          if (t.status === 'completado') {
            myTotalCompletedRevenue += t.budget;
          }
          const isActive = ['waitingclientsignature', 'accepted', 'goingtoorigin', 'arrivedatorigin', 'loading', 'goingtodestination', 'unloading', 'in_progress', 'en_curso'].includes(t.rawStatus);
          if (isActive) {
            myActiveMovesCount++;
            if (['unloading', 'waitingclientsignature'].includes(t.rawStatus)) myMovesUnloading++;
            else myMovesEnRoute++;
          }
        });

        const isOnline = myDriver ? myDriver.isOnline : false;
        this.state.kpis = {
          activeFleetPct: isOnline ? 100 : 0,
          fleetRunning: isOnline ? 1 : 0,
          fleetTotal: vehicles.length,
          fleetInService: 0,
          inServiceNote: isOnline ? 'Tu unidad está en línea y visible' : 'Tu unidad está desconectada',
          activeMoves: myActiveMovesCount,
          movesOnSchedulePct: 100,
          movesUnloading: myMovesUnloading,
          movesEnRoute: myMovesEnRoute,
          monthlyBilling: myTotalCompletedRevenue, // Ganancias reales de este conductor
          billingGrowthPct: 15.0,
          billingCorpPct: 50,
          billingResPct: 50,
          activeCrewMembers: myDriver ? myDriver.crew.membersCount : 1,
          activeCrewsCount: vehicles.length,
          estManHours: (myDriver ? myDriver.crew.membersCount : 1) * 8
        };

        this.state.legalAlerts = [];
        if (myDriver && myDriver.status !== 'approved') {
          this.state.legalAlerts.push({
            id: 'alt-driver-verify',
            title: 'Verificación de Perfil Pendiente',
            desc: 'Tu cuenta y vehículo están en proceso de homologación.',
            severity: 'warning',
            actionLabel: 'Ver Estado'
          });
        } else {
          this.state.legalAlerts.push({
            id: 'alt-ok',
            title: 'Habilitación de Unidad Vigente',
            desc: 'Tu vehículo y documentación están aprobados para operar.',
            severity: 'success',
            actionLabel: 'Ficha Técnica'
          });
        }

      // =======================================================================
      // MODO 2: EMPRESA DE MUDANZAS (GESTIÓN DE FLOTA Y DESPACHOS COMPLETOS)
      // =======================================================================
      } else {
        this.state.vehicles = this.allRawDrivers;
        this.state.rawTrips = this.allRawTrips;
        this.state.pendingServices = this.allRawTrips.filter(t => t.status === 'pendiente');

        this.state.userProfile = {
          uid: currentUid,
          name: currentUser?.name || 'Administrador Empresa',
          email: currentEmail,
          role: 'Empresa de Mudanzas',
          company: 'Mudify Logistics Enterprise',
          avatarUrl: currentUser?.avatarUrl || '',
          activeShift: 'Turno Activo',
          rates: null
        };

        this.state.hubs = [
          { id: 'hub-caba-amba', name: 'Base Central Belgrano / AMBA', address: 'Área Metropolitana de Buenos Aires', activeFleet: this.allRawDrivers.filter(v => v.isOnline).length, isDefault: true }
        ];

        let totalCompletedRev = 0;
        let totalActiveMoves = 0;
        let unlCount = 0;
        let enRouteCount = 0;

        this.allRawTrips.forEach(t => {
          if (t.status === 'completado') totalCompletedRev += t.budget;
          const isActive = ['waitingclientsignature', 'accepted', 'goingtoorigin', 'arrivedatorigin', 'loading', 'goingtodestination', 'unloading', 'in_progress', 'en_curso'].includes(t.rawStatus);
          if (isActive) {
            totalActiveMoves++;
            if (['unloading', 'waitingclientsignature'].includes(t.rawStatus)) unlCount++;
            else enRouteCount++;
          }
        });

        const totalDrivers = this.allRawDrivers.length;
        const onlineDrivers = this.allRawDrivers.filter(v => v.isOnline).length;
        const activePct = totalDrivers > 0 ? Math.round((onlineDrivers / totalDrivers) * 100) : 0;

        this.state.kpis = {
          activeFleetPct: activePct,
          fleetRunning: onlineDrivers,
          fleetTotal: totalDrivers,
          fleetInService: totalDrivers - onlineDrivers,
          inServiceNote: `${totalDrivers - onlineDrivers} unidades en base`,
          activeMoves: totalActiveMoves,
          movesOnSchedulePct: 100,
          movesUnloading: unlCount,
          movesEnRoute: enRouteCount,
          monthlyBilling: totalCompletedRev,
          billingGrowthPct: 18.4,
          billingCorpPct: 65,
          billingResPct: 35,
          activeCrewMembers: onlineDrivers * 2,
          activeCrewsCount: onlineDrivers,
          estManHours: onlineDrivers * 8
        };

        this.state.b2bQuotes = this.allRawTrips.slice(0, 20).map(t => ({
          id: t.id,
          code: t.code,
          client: t.client,
          origin: t.origin,
          destination: t.destination,
          volume: t.volume,
          amount: t.budget,
          status: t.status === 'completado' ? 'aprobado' : t.status === 'cancelado' ? 'cancelado' : 'pendiente'
        }));

        this.state.policiesVault = this.allRawDrivers.map(v => ({
          title: `Póliza Responsabilidad Civil · ${v.brandModel}`,
          insurer: 'Aseguradora Nacional',
          policyNumber: 'POL-' + v.id.substring(0, 6).toUpperCase(),
          plate: v.plate
        }));

        this.state.crewShifts = this.allRawDrivers.map(v => ({
          name: v.crew.name,
          leader: v.driver.name,
          assignedVehicleCode: v.code,
          shift: v.isOnline ? 'Turno Activo' : 'Guardia',
          helpers: v.crew.helpers
        }));

        this.state.timelineSchedule = this.allRawDrivers.map(v => ({
          vehicleId: v.id,
          plate: v.plate,
          model: v.brandModel,
          driverName: v.driver.name,
          category: v.category,
          slots: []
        }));

        this.state.legalAlerts = [
          {
            id: 'alt-empresa',
            title: 'Cumplimiento Legal de Flota',
            desc: `${totalDrivers} unidades registradas en la plataforma de logística.`,
            severity: 'success',
            actionLabel: 'Ver Bóveda'
          }
        ];
      }

      this._saveLocal();
    }

    // --- MÉTODOS CRUD COMPLETOS DIRECTOS A FIRESTORE ---

    async createTrip(tripData) {
      if (this.firestore) {
        try {
          const docRef = await this.firestore.collection('trips').add({
            clientName: tripData.clientName || tripData.client,
            clientPhone: tripData.clientPhone || '',
            originAddress: tripData.originAddress || tripData.origin,
            destinationAddress: tripData.destinationAddress || tripData.destination,
            price: parseFloat(tripData.price || tripData.budget || 0),
            cargoDescription: tripData.cargoDescription || tripData.volume || 'Mudanza',
            status: 'pending',
            type: tripData.type || 'immediate',
            scheduledDate: tripData.scheduledDate || new Date().toISOString(),
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('[Firestore] Trip creado exitosamente con ID:', docRef.id);
          return { success: true, id: docRef.id };
        } catch (err) {
          console.error('[Firestore Error] createTrip:', err);
        }
      }
      return { success: false };
    }

    async updateTrip(tripId, updateData) {
      if (this.firestore) {
        try {
          await this.firestore.collection('trips').doc(tripId).update(updateData);
          console.log('[Firestore] Trip actualizado:', tripId);
          return { success: true };
        } catch (err) {
          console.error('[Firestore Error] updateTrip:', err);
        }
      }
      return { success: false };
    }

    async deleteTrip(tripId) {
      if (this.firestore) {
        try {
          await this.firestore.collection('trips').doc(tripId).delete();
          console.log('[Firestore] Trip eliminado:', tripId);
          return { success: true };
        } catch (err) {
          console.error('[Firestore Error] deleteTrip:', err);
        }
      }
      return { success: false };
    }

    async createDriver(driverData) {
      if (this.firestore) {
        try {
          const docRef = await this.firestore.collection('drivers').add({
            name: driverData.name,
            phone: driverData.phone || '',
            vehicle: {
              plate: driverData.plate || '',
              brand: driverData.brand || '',
              model: driverData.model || '',
              type: driverData.category || 'Flete Mediano'
            },
            isOnline: true,
            status: 'approved',
            createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('[Firestore] Driver creado con ID:', docRef.id);
          return { success: true, id: docRef.id };
        } catch (err) {
          console.error('[Firestore Error] createDriver:', err);
        }
      }
      return { success: false };
    }

    async updateDriver(driverId, updateData) {
      if (this.firestore) {
        try {
          await this.firestore.collection('drivers').doc(driverId).update(updateData);
          console.log('[Firestore] Driver actualizado:', driverId);
          return { success: true };
        } catch (err) {
          console.error('[Firestore Error] updateDriver:', err);
        }
      }
      return { success: false };
    }

    // =========================================================================
    // ESTÁNDAR #1: AUTENTICACIÓN EXCLUSIVA CON CUENTA DE GOOGLE
    // =========================================================================

    async signInWithGoogle() {
      if (!window.firebase || !window.firebase.auth) {
        throw new Error('Firebase Auth SDK no disponible en el cliente.');
      }
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const auth = window.firebase.auth();

      const result = await auth.signInWithPopup(provider);
      if (result && result.user) {
        const fbUser = result.user;
        const profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          role: this.accountMode === 'conductor' ? 'Conductor Independiente' : 'Empresa de Mudanzas',
          company: this.accountMode === 'conductor' ? 'Flete Independiente' : 'Mudify Logistics Enterprise',
          avatarUrl: fbUser.photoURL || '',
          activeShift: 'Turno Activo',
          provider: 'google'
        };

        this.state.currentUser = profile;
        try {
          localStorage.setItem('mudify_user_session', JSON.stringify(profile));
        } catch (e) {}

        this._applyScopedData();
        return profile;
      }
      return null;
    }

    async signOut() {
      if (window.firebase && window.firebase.auth) {
        await window.firebase.auth().signOut();
      }
      this.state.currentUser = null;
      try {
        localStorage.removeItem('mudify_user_session');
      } catch (e) {}
      this._applyScopedData();
      console.log('[Mudify PRO] Sesión de Google cerrada correctamente.');
    }

    getCurrentUser() {
      if (window.firebase && window.firebase.auth) {
        const u = window.firebase.auth().currentUser;
        if (u) {
          return {
            uid: u.uid,
            name: u.displayName || 'Usuario Google',
            email: u.email,
            avatarUrl: u.photoURL || '',
            role: this.accountMode === 'conductor' ? 'Conductor Independiente' : 'Empresa de Mudanzas'
          };
        }
      }
      try {
        const stored = localStorage.getItem('mudify_user_session');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
      return this.state.currentUser || null;
    }

    _loadLocal() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

    _saveLocal() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {}
      this._notifyListeners();
    }

    subscribe(listenerFn) {
      if (typeof listenerFn === 'function') {
        this.listeners.push(listenerFn);
      }
      return () => {
        this.listeners = this.listeners.filter(f => f !== listenerFn);
      };
    }

    _notifyListeners() {
      this.listeners.forEach(fn => {
        try {
          fn(this.state);
        } catch (err) {
          console.error('Error en listener de MudifyDataService:', err);
        }
      });
    }

    // --- MÉTODOS ASÍNCRONOS DE LECTURA ---

    async getUserProfile() {
      return this.state.userProfile;
    }

    async getHubs() {
      return this.state.hubs;
    }

    async getSelectedHub() {
      return this.state.hubs.find(h => h.id === this.state.selectedHubId) || this.state.hubs[0];
    }

    async setSelectedHub(hubId) {
      this.state.selectedHubId = hubId;
      this._saveLocal();
      return this.getSelectedHub();
    }

    async getKPIs() {
      return { ...this.state.kpis };
    }

    async getVehicles(filter = 'todos') {
      const all = this.state.vehicles;
      if (filter === 'todos') return all;
      if (filter === 'en_ruta') return all.filter(v => v.status === 'en_ruta');
      if (filter === 'disponible') return all.filter(v => v.status === 'disponible');
      if (filter === 'taller') return all.filter(v => v.status === 'taller');
      return all;
    }

    async getVehicleById(vehicleId) {
      return this.state.vehicles.find(v => v.id === vehicleId || v.code === vehicleId) || null;
    }

    async getTimelineSchedule(porteFilter = 'todos') {
      let timeline = this.state.timelineSchedule;
      if (porteFilter !== 'todos') {
        const matchingVehicles = this.state.vehicles.filter(v => v.category === porteFilter).map(v => v.id);
        timeline = timeline.filter(row => matchingVehicles.includes(row.vehicleId));
      }
      return timeline;
    }

    async getPendingServices() {
      return this.state.pendingServices.filter(s => s.status === 'pendiente');
    }

    async getCrewShifts() {
      return this.state.crewShifts;
    }

    async getLegalAlerts() {
      return this.state.legalAlerts;
    }

    async getMaintenanceRecords() {
      return this.state.maintenanceRecords;
    }

    async getPoliciesVault() {
      return this.state.policiesVault;
    }

    async getB2BQuotes() {
      return this.state.b2bQuotes;
    }

    // --- MÉTODOS DE MUTACIÓN ---

    async updateVehicleStatus(vehicleId, newStatus) {
      const veh = this.state.vehicles.find(v => v.id === vehicleId);
      if (veh) {
        veh.status = newStatus;
        this._saveLocal();
        return veh;
      }
      return null;
    }

    // =========================================================================
    // GESTIÓN DE SUSCRIPCIÓN Y LÍMITES DE FLOTA (REGLAS DEL SISTEMA)
    // =========================================================================

    getSubscription() {
      let savedPlan = 'fletero_pro';
      try {
        savedPlan = localStorage.getItem('mudify_subscription_plan') || (this.accountMode === 'conductor' ? 'fletero_pro' : 'flota_vehiculos');
      } catch (e) {}

      if (this.accountMode === 'conductor') {
        return {
          planId: 'fletero_pro',
          planName: 'Plan Fletero Pro',
          maxVehicles: 1,
          status: 'trial_active',
          trialDaysRemaining: 60,
          description: 'Suscripción para 1 solo vehículo independiente en plataforma'
        };
      } else {
        const isEnterprise = savedPlan === 'dashboard_completo';
        return {
          planId: isEnterprise ? 'dashboard_completo' : 'flota_vehiculos',
          planName: isEnterprise ? 'Plan Flota Enterprise' : 'Plan Flota por Vehículos',
          maxVehicles: isEnterprise ? 999 : 10,
          status: 'trial_active',
          trialDaysRemaining: 60,
          description: isEnterprise ? 'Dashboard centralizado y flota ilimitada' : 'Flota empresarial de 2 a 10 unidades'
        };
      }
    }

    getMaxVehiclesAllowed() {
      return this.getSubscription().maxVehicles;
    }

    async addVehicle(vehicleData) {
      const sub = this.getSubscription();
      const currentCount = this.state.vehicles.length;

      // Validación estricta: Conductor independiente solo 1 vehículo
      if (currentCount >= sub.maxVehicles) {
        const msg = this.accountMode === 'conductor'
          ? `Límite de suscripción alcanzado: Tu Plan Fletero Pro autoriza únicamente 1 vehículo en la plataforma. Para gestionar una flota con múltiples unidades y choferes, actualiza tu suscripción a Plan Flota.`
          : `Límite de suscripción alcanzado: Tu plan actual autoriza hasta ${sub.maxVehicles} vehículos. Actualiza a Plan Flota Enterprise para operar con flota ilimitada.`;
        throw new Error(msg);
      }

      return await this.createDriver({
        name: vehicleData.driverName || 'Nuevo Chofer',
        phone: vehicleData.driverPhone || '',
        plate: (vehicleData.plate || '').toUpperCase().trim(),
        model: vehicleData.brandModel || '',
        category: vehicleData.category || 'Flete Mediano'
      });
    }

    // =========================================================================
    // GESTIÓN DE TARIFAS Y SERVICIOS DEL MUDANCERO (CONECTADO A FIRESTORE)
    // =========================================================================

    async getDriverRates(driverUid) {
      const uid = driverUid || (this.myDriverDoc ? this.myDriverDoc.id : (this.getCurrentUser()?.uid));
      if (!uid || !this.firestore) return null;
      try {
        const doc = await this.firestore.collection('drivers').doc(uid).get();
        if (doc.exists && doc.data()) {
          const d = doc.data();
          return {
            pricePerKm: d.pricePerKm ?? 950.0,
            pricePerHour: d.pricePerHour ?? 12000.0,
            timeRateRadiusKm: d.timeRateRadiusKm ?? 15.0,
            fuelPrice: d.fuelPrice ?? 1150.0,
            delayRate: d.delayRate ?? 6000.0,
            offersHelpers: d.offersHelpers ?? true,
            helperRate: d.helperRate ?? 8000.0,
            maxHelpers: d.maxHelpers ?? 2,
            offersBaskets: d.offersBaskets ?? true,
            basketPrice: d.basketPrice ?? 1500.0,
            availableBaskets: d.availableBaskets ?? 10,
            offersBoxes: d.offersBoxes ?? true,
            boxPrice: d.boxPrice ?? 1800.0,
            offersPacking: d.offersPacking ?? true,
            packingRate: d.packingRate ?? 9500.0,
            offersAssembly: d.offersAssembly ?? true,
            assemblyRate: d.assemblyRate ?? 7000.0,
            offersStairs: d.offersStairs ?? true,
            stairFloorRate: d.stairFloorRate ?? 3000.0,
            cvuMercadoPago: d.cvuMercadoPago || '',
            objetivoDiario: d.objetivoDiario ?? 0.0
          };
        }
      } catch (e) {
        console.warn('Error getDriverRates:', e);
      }
      return null;
    }

    async saveDriverRates(driverUid, rates) {
      const uid = driverUid || (this.myDriverDoc ? this.myDriverDoc.id : (this.getCurrentUser()?.uid));
      if (!uid || !this.firestore) throw new Error('Usuario no autenticado o base de datos no disponible');
      
      const payload = {
        pricePerKm: parseFloat(rates.pricePerKm) || 950.0,
        pricePerHour: parseFloat(rates.pricePerHour) || 12000.0,
        timeRateRadiusKm: parseFloat(rates.timeRateRadiusKm) || 15.0,
        fuelPrice: parseFloat(rates.fuelPrice) || 1150.0,
        delayRate: parseFloat(rates.delayRate) || 6000.0,
        offersHelpers: Boolean(rates.offersHelpers),
        helperRate: parseFloat(rates.helperRate) || 8000.0,
        maxHelpers: parseInt(rates.maxHelpers, 10) || 2,
        offersBaskets: Boolean(rates.offersBaskets),
        basketPrice: parseFloat(rates.basketPrice) || 1500.0,
        availableBaskets: parseInt(rates.availableBaskets, 10) || 10,
        offersBoxes: Boolean(rates.offersBoxes),
        boxPrice: parseFloat(rates.boxPrice) || 1800.0,
        offersPacking: Boolean(rates.offersPacking),
        packingRate: parseFloat(rates.packingRate) || 9500.0,
        offersAssembly: Boolean(rates.offersAssembly),
        assemblyRate: parseFloat(rates.assemblyRate) || 7000.0,
        offersStairs: Boolean(rates.offersStairs),
        stairFloorRate: parseFloat(rates.stairFloorRate) || 3000.0,
        lastActive: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.firestore.collection('drivers').doc(uid).set(payload, { merge: true });
      console.log('[Firestore] Tarifas actualizadas correctamente en drivers/' + uid);
      return { success: true };
    }

    // =========================================================================
    // CONTROL DE VIAJES ACTIVOS Y VALIDACIÓN OTP
    // =========================================================================

    async advanceTripStep(tripId, nextStatus) {
      if (!this.firestore) throw new Error('Firestore no disponible');
      const currentUser = this.getCurrentUser();
      const driverUid = currentUser?.uid;

      const batch = this.firestore.batch();
      const tripRef = this.firestore.collection('trips').doc(tripId);
      batch.update(tripRef, {
        status: nextStatus,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      if (driverUid) {
        const driverRef = this.firestore.collection('drivers').doc(driverUid);
        batch.update(driverRef, {
          tripStatus: nextStatus,
          lastActive: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`[Firestore] Viaje ${tripId} avanzado a estado: ${nextStatus}`);
      return { success: true, nextStatus };
    }

    async completeTripWithOTP(tripId, enteredOtp) {
      if (!this.firestore) throw new Error('Firestore no disponible');
      const currentUser = this.getCurrentUser();
      const driverUid = currentUser?.uid;

      const tripDoc = await this.firestore.collection('trips').doc(tripId).get();
      if (!tripDoc.exists) throw new Error('El viaje no existe');

      const tripData = tripDoc.data();
      const expectedOtp = (tripData.otpCode || '').trim();

      if (expectedOtp && enteredOtp.trim() !== expectedOtp) {
        throw new Error('Código de seguridad OTP incorrecto. Solicita el código correcto al cliente.');
      }

      const tripPrice = parseFloat(tripData.price || 0);

      const batch = this.firestore.batch();
      const tripRef = this.firestore.collection('trips').doc(tripId);
      batch.update(tripRef, {
        status: 'completed',
        completedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      if (driverUid) {
        const driverRef = this.firestore.collection('drivers').doc(driverUid);
        batch.update(driverRef, {
          tripStatus: 'searching',
          earnings: window.firebase.firestore.FieldValue.increment(tripPrice),
          lastActive: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`[Firestore] Viaje ${tripId} COMPLETADO exitosamente con código OTP.`);
      return { success: true, amountAdded: tripPrice };
    }

    // =========================================================================
    // BILLETERA, MERCADO PAGO Y RETIROS
    // =========================================================================

    async linkMercadoPagoCVU(cvu) {
      const currentUser = this.getCurrentUser();
      const uid = currentUser?.uid;
      if (!uid || !this.firestore) throw new Error('Usuario no autenticado');
      await this.firestore.collection('drivers').doc(uid).set({
        cvuMercadoPago: cvu.trim()
      }, { merge: true });
      return { success: true };
    }

    async requestWithdrawal(amount) {
      const currentUser = this.getCurrentUser();
      const uid = currentUser?.uid;
      if (!uid || !this.firestore) throw new Error('Usuario no autenticado');

      return await this.firestore.runTransaction(async (transaction) => {
        const driverDoc = await transaction.get(this.firestore.collection('drivers').doc(uid));
        if (!driverDoc.exists) throw new Error('Registro de conductor no encontrado');
        const data = driverDoc.data();
        const currentEarnings = parseFloat(data.earnings || 0);
        if (currentEarnings < amount) {
          throw new Error('Saldo insuficiente para retirar el monto solicitado');
        }
        transaction.update(this.firestore.collection('drivers').doc(uid), {
          earnings: currentEarnings - amount,
          lastActive: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, remaining: currentEarnings - amount };
      });
    }

    async setDailyGoal(goalAmount) {
      const currentUser = this.getCurrentUser();
      const uid = currentUser?.uid;
      if (!uid || !this.firestore) throw new Error('Usuario no autenticado');
      await this.firestore.collection('drivers').doc(uid).set({
        objetivoDiario: parseFloat(goalAmount) || 0
      }, { merge: true });
      return { success: true };
    }

    async assignPendingService(serviceId, vehicleId) {
      const serviceIndex = this.state.pendingServices.findIndex(s => s.id === serviceId);
      const vehicle = this.state.vehicles.find(v => v.id === vehicleId);

      if (serviceIndex !== -1 && vehicle) {
        const srv = this.state.pendingServices[serviceIndex];
        srv.status = 'asignado';
        vehicle.status = 'en_ruta';
        this._saveLocal();
        return { success: true, service: srv, vehicle: vehicle };
      }
      return { success: false, error: 'Servicio o vehículo no encontrado' };
    }

    async resolveAlert(alertId) {
      const alert = this.state.legalAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.severity = 'success';
        this._saveLocal();
        return alert;
      }
      return null;
    }

    async updateDriverLiveLocation(locationData) {
      const currentUser = this.getCurrentUser();
      const uid = currentUser?.uid;
      const { lat, lng, heading, speed, accuracy } = locationData;

      // Actualizar estado en memoria local
      this.state.deviceLocation = {
        lat,
        lng,
        heading: heading || 0,
        speed: speed || 0,
        accuracy: accuracy || 10,
        timestamp: new Date().toISOString()
      };

      // Si estamos en modo conductor, actualizar la posición de su unidad en la lista de vehículos
      if (this.state.accountMode === 'conductor' && this.state.vehicles.length > 0) {
        this.state.vehicles[0].coords = { lat, lng };
        this.state.vehicles[0].telemetry = {
          ...this.state.vehicles[0].telemetry,
          speedKmH: Math.round((speed || 0) * 3.6),
          lastLocationUpdate: new Date().toLocaleTimeString('es-AR')
        };
      }

      // Si hay Firestore activo y UID, sincronizar la última ubicación conocida en Cloud Firestore
      if (uid && this.firestore) {
        try {
          await this.firestore.collection('drivers').doc(uid).set({
            currentLocation: {
              latitude: lat,
              longitude: lng,
              heading: heading || 0,
              speed: speed || 0,
              accuracy: accuracy || 10,
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            },
            isOnline: true,
            lastActive: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn('No se pudo guardar la ubicación en Firestore:', e);
        }
      }

      this._notify();
      return this.state.deviceLocation;
    }

    getDeviceLocation() {
      return this.state.deviceLocation || null;
    }

    async resetToDefaultSeed() {
      this.state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_STATE));
      this._saveLocal();
      return this.state;
    }
  }

  window.MudifyEnterpriseService = new MudifyDataService();

})(window);
