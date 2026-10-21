import React, { useState, useEffect, useMemo } from 'react';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './FacturacionRemitos.css';

export default function FacturacionRemitos({ user, profile, isEmpresa, onShowToast }) {
  // Pestaña activa interna: 'balance' | 'remitos' | 'gastos' | 'cobros'
  const [activeSubTab, setActiveSubTab] = useState('balance');

  // Estados de datos en tiempo real desde Cloud Firestore
  const [completedTrips, setCompletedTrips] = useState([]);
  const [manualInvoices, setManualInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datos bancarios / cobro del chofer o empresa
  const [paymentData, setPaymentData] = useState({
    alias: '',
    cvu: '',
    banco: '',
    titular: '',
    cuit: '',
    tipoCuenta: 'Caja de Ahorro en Pesos'
  });
  const [editingPayment, setEditingPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Modales
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [remitoModalOpen, setRemitoModalOpen] = useState(false);
  const [selectedRemito, setSelectedRemito] = useState(null);

  // Formularios
  const [expenseForm, setExpenseForm] = useState({
    tipo: 'combustible',
    concepto: '',
    monto: '',
    vehiculoPatente: '',
    comprobanteNumero: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [payoutForm, setPayoutForm] = useState({
    staffId: '',
    monto: '',
    concepto: 'Jornal de Traslado / Estiba',
    metodo: 'Transferencia CBU / CVU',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [invoiceForm, setInvoiceForm] = useState({
    tipoComprobante: 'remito_r',
    numeroComprobante: `R-0001-${Math.floor(100000 + Math.random() * 900000)}`,
    cliente: '',
    cuitCuilCliente: '',
    clienteTelefono: '',
    origen: '',
    destino: '',
    monto: '',
    vehiculoPatente: '',
    metodoPago: 'Transferencia Directa CVU',
    estadoCobro: 'cobrado',
    concepto: 'Servicio de Mudanza y Traslado Integral',
    bultosDescripcion: 'Muebles, cajas numeradas y enseres personales'
  });

  // Filtro de búsqueda en remitos
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilterType, setInvoiceFilterType] = useState('todos');

  // 1. Sincronización en tiempo real con Cloud Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Cargar datos de pago
    fleetService.getDriverPaymentInfo(user.uid).then((info) => {
      setPaymentData({
        alias: info.alias || 'mudify.recaudacion.mp',
        cvu: info.cvu || '0000003100084920194821',
        banco: info.banco || 'Mercado Pago / Banco',
        titular: info.titular || profile?.name || user.displayName || 'Titular de Cuenta',
        cuit: info.cuit || profile?.cuit || '20-33550978-9',
        tipoCuenta: info.tipoCuenta || 'Caja de Ahorro en Pesos'
      });
    }).catch(console.warn);

    // Suscribir a viajes completados en Firestore
    const unsubTrips = fleetService.subscribeCompletedTrips(user.uid, (trips) => {
      setCompletedTrips(trips);
    });

    // Suscribir a comprobantes/remitos manuales en drivers/{uid}/invoices
    const unsubInvoices = fleetService.subscribeInvoices(user.uid, (invs) => {
      setManualInvoices(invs);
    });

    // Suscribir a gastos operativos en drivers/{uid}/expenses
    const unsubExpenses = fleetService.subscribeExpenses(user.uid, (exps) => {
      setExpenses(exps);
      setLoading(false);
    });

    // Suscribir a vehículos para asociar gastos a móviles reales
    const unsubVehicles = fleetService.subscribeVehicles(user.uid, (vehs) => {
      setVehicles(vehs);
      if (vehs.length > 0 && !expenseForm.vehiculoPatente) {
        setExpenseForm((prev) => ({ ...prev, vehiculoPatente: vehs[0].patente }));
        setInvoiceForm((prev) => ({ ...prev, vehiculoPatente: vehs[0].patente }));
      }
    });

    // Suscribir a personal para liquidación de nómina
    const unsubStaff = fleetService.subscribeStaff(user.uid, (staff) => {
      setStaffList(staff);
    });

    return () => {
      unsubTrips && unsubTrips();
      unsubInvoices && unsubInvoices();
      unsubExpenses && unsubExpenses();
      unsubVehicles && unsubVehicles();
      unsubStaff && unsubStaff();
    };
  }, [user?.uid]);

  // Lista combinada de comprobantes (Viajes de app + comprobantes manuales de Firestore)
  const allInvoices = useMemo(() => {
    const combined = [...manualInvoices];
    // Añadir viajes completados si no están ya registrados como comprobantes
    completedTrips.forEach((trip) => {
      const alreadyHas = combined.some((inv) => inv.tripId === trip.id || inv.numeroComprobante === trip.code);
      if (!alreadyHas) {
        combined.push({
          id: trip.id,
          tripId: trip.id,
          tipoComprobante: 'remito_r',
          numeroComprobante: trip.code || `R-0001-${trip.id.slice(-6).toUpperCase()}`,
          cliente: trip.cliente,
          clienteTelefono: trip.clienteTelefono,
          origen: trip.origen,
          destino: trip.destino,
          monto: trip.monto,
          fechaStr: trip.fecha,
          rawDate: trip.rawDate,
          estadoCobro: trip.estado === 'Cobrado' ? 'cobrado' : 'pendiente',
          metodoPago: trip.metodo,
          concepto: trip.concepto,
          bultosDescripcion: trip.cargoDescription || 'Mobiliario general y cajas rotuladas',
          vehiculoPatente: trip.patente || (vehicles[0]?.patente || 'FIU001'),
          esViajeApp: true
        });
      }
    });

    return combined.sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [manualInvoices, completedTrips, vehicles]);

  // Cálculos Financieros Globales
  const totalIncome = useMemo(() => {
    return allInvoices.reduce((acc, inv) => acc + (Number(inv.monto) || 0), 0);
  }, [allInvoices]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, exp) => acc + (Number(exp.monto) || 0), 0);
  }, [expenses]);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // Gastos agrupados por categoría
  const expensesByCategory = useMemo(() => {
    const map = {
      combustible: 0,
      liquidacion_personal: 0,
      peajes: 0,
      mantenimiento: 0,
      otros: 0
    };
    expenses.forEach((e) => {
      const key = map[e.tipo] !== undefined ? e.tipo : 'otros';
      map[key] += Number(e.monto || 0);
    });
    return map;
  }, [expenses]);

  // Guardar datos de cobro en Firestore
  const handleSavePaymentData = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await fleetService.saveDriverPaymentInfo(user.uid, paymentData);
      setEditingPayment(false);
      if (onShowToast) {
        onShowToast('Datos de recaudación bancaria y CVU guardados en Cloud Firestore', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error guardando datos: ${err.message}`, 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  // Crear Gasto Operativo en Firestore
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.concepto || !expenseForm.monto) return;
    try {
      await fleetService.addExpense(user.uid, {
        ...expenseForm,
        monto: Number(expenseForm.monto)
      });
      setExpenseModalOpen(false);
      setExpenseForm({
        tipo: 'combustible',
        concepto: '',
        monto: '',
        vehiculoPatente: vehicles[0]?.patente || '',
        comprobanteNumero: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      if (onShowToast) onShowToast('Gasto operativo registrado y sincronizado en Firestore', 'success');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error guardando gasto: ${err.message}`, 'error');
    }
  };

  // Liquidar Pago a Cuadrilla en Firestore
  const handleSavePayout = async (e) => {
    e.preventDefault();
    if (!payoutForm.staffId || !payoutForm.monto) return;
    const worker = staffList.find((s) => s.id === payoutForm.staffId);
    try {
      const expenseItem = {
        tipo: 'liquidacion_personal',
        concepto: `Liquidación a ${worker?.nombre || 'Personal'}: ${payoutForm.concepto}`,
        monto: Number(payoutForm.monto),
        staffId: payoutForm.staffId,
        staffNombre: worker?.nombre || '',
        staffRol: worker?.rolLabel || worker?.rol || '',
        comprobanteNumero: `LIQ-${Math.floor(1000 + Math.random() * 9000)}`,
        metodo: payoutForm.metodo,
        fecha: payoutForm.fecha
      };
      await fleetService.addExpense(user.uid, expenseItem);
      setPayoutModalOpen(false);
      setPayoutForm({
        staffId: '',
        monto: '',
        concepto: 'Jornal de Traslado / Estiba',
        metodo: 'Transferencia CBU / CVU',
        fecha: new Date().toISOString().split('T')[0]
      });
      if (onShowToast) {
        onShowToast(`Pago de $${Number(payoutForm.monto).toLocaleString('es-AR')} liquidado a ${worker?.nombre} y registrado en Finanzas`, 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error registrando liquidación: ${err.message}`, 'error');
    }
  };

  // Crear Factura / Remito Manual en Firestore
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceForm.cliente || !invoiceForm.monto) return;
    try {
      await fleetService.createInvoice(user.uid, {
        ...invoiceForm,
        monto: Number(invoiceForm.monto)
      });
      setInvoiceModalOpen(false);
      setInvoiceForm({
        tipoComprobante: 'remito_r',
        numeroComprobante: `R-0001-${Math.floor(100000 + Math.random() * 900000)}`,
        cliente: '',
        cuitCuilCliente: '',
        clienteTelefono: '',
        origen: '',
        destino: '',
        monto: '',
        vehiculoPatente: vehicles[0]?.patente || '',
        metodoPago: 'Transferencia Directa CVU',
        estadoCobro: 'cobrado',
        concepto: 'Servicio de Mudanza y Traslado Integral',
        bultosDescripcion: 'Muebles, cajas numeradas y enseres personales'
      });
      if (onShowToast) onShowToast('Comprobante oficial emitido y sincronizado en Firestore', 'success');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error emitiendo comprobante: ${err.message}`, 'error');
    }
  };

  // Eliminar un gasto de Firestore
  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Deseás anular este registro de gasto?')) return;
    try {
      await fleetService.deleteExpense(user.uid, id);
      if (onShowToast) onShowToast('Registro de gasto eliminado', 'info');
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error eliminando gasto: ${err.message}`, 'error');
    }
  };

  // Cambiar estado de cobro de un remito
  const handleToggleInvoiceStatus = async (inv) => {
    if (!inv.id || inv.esViajeApp) return;
    const newStatus = inv.estadoCobro === 'cobrado' ? 'pendiente' : 'cobrado';
    try {
      await fleetService.updateInvoiceStatus(user.uid, inv.id, newStatus);
      if (onShowToast) onShowToast(`Estado actualizado a: ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      console.error(err);
    }
  };

  // Ver Remito Digital Oficial en modal
  const handleOpenRemito = (inv) => {
    setSelectedRemito(inv);
    setRemitoModalOpen(true);
  };

  // Imprimir Remito
  const handlePrintRemito = () => {
    window.print();
  };

  // Compartir por WhatsApp
  const handleShareWhatsApp = (inv) => {
    const text = encodeURIComponent(
      `¡Hola ${inv.cliente}! Te compartimos el Remito Oficial de Traslado #${inv.numeroComprobante} emitido por Mudify PRO.\n` +
      `📦 Servicio: ${inv.concepto}\n` +
      `📍 Origen: ${inv.origen}\n` +
      `🏁 Destino: ${inv.destino}\n` +
      `💵 Monto: $${Number(inv.monto).toLocaleString('es-AR')} ARS (${inv.estadoCobro === 'cobrado' ? 'Abonado ✓' : 'Pendiente'})\n` +
      `🚛 Móvil: ${inv.vehiculoPatente || 'Flota Oficial'}\n` +
      `¡Gracias por confiar en nuestro servicio de mudanzas!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Generar datos de prueba iniciales en Firestore si la cuenta está en cero
  const handleSeedDemoFinance = async () => {
    try {
      const activePatente = vehicles[0]?.patente || 'FIU001';
      // Cargar 2 viajes completados en trips
      await fleetService.createTrip({
        driverId: user.uid,
        clientName: 'Estudio Jurídico Alvear & Asoc.',
        cliente: 'Estudio Jurídico Alvear & Asoc.',
        clientPhone: '11-4822-9011',
        originAddress: 'Av. Corrientes 1450, San Nicolás (CABA)',
        destinationAddress: 'Av. del Libertador 4400, Palermo (CABA)',
        distance: '6.4 km',
        estimatedPrice: 95000,
        monto: 95000,
        vehicleTypeRequired: 'Furgón Mediano',
        patente: activePatente,
        status: 'completed',
        paymentMethod: 'Transferencia Directa CVU',
        cargoDescription: '12 cajas de archivos judiciales, 4 escritorios gerenciales desarmados',
        type: 'immediate'
      });

      await fleetService.createTrip({
        driverId: user.uid,
        clientName: 'Mariana Zavaleta',
        cliente: 'Mariana Zavaleta',
        clientPhone: '11-5409-1234',
        originAddress: 'Juramento 2100, Belgrano (CABA)',
        destinationAddress: 'Av. Santa Fe 3200, Recoleta (CABA)',
        distance: '4.8 km',
        estimatedPrice: 72000,
        monto: 72000,
        vehicleTypeRequired: 'Flete Mediano',
        patente: activePatente,
        status: 'completed',
        paymentMethod: 'Mercado Pago QR',
        cargoDescription: 'Sommier 2 plazas, heladera no frost, 8 cajas de vajilla y ropa',
        type: 'immediate'
      });

      // Cargar 2 gastos operativos en Firestore
      await fleetService.addExpense(user.uid, {
        tipo: 'combustible',
        concepto: 'Carga Combustible YPF Infinia Diesel',
        monto: 38500,
        vehiculoPatente: activePatente,
        comprobanteNumero: 'Ticket B-0044-019284',
        fecha: new Date().toISOString().split('T')[0]
      });

      await fleetService.addExpense(user.uid, {
        tipo: 'peajes',
        concepto: 'Telepase AUSA Au. 25 de Mayo & Illia',
        monto: 4800,
        vehiculoPatente: activePatente,
        comprobanteNumero: 'Debito Automático',
        fecha: new Date().toISOString().split('T')[0]
      });

      if (onShowToast) {
        onShowToast('¡Datos iniciales de traslados y gastos creados y sincronizados en Cloud Firestore!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (onShowToast) onShowToast(`Error: ${err.message}`, 'error');
    }
  };

  // Filtrado de remitos
  const filteredInvoices = allInvoices.filter((inv) => {
    const matchQuery =
      (inv.cliente || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.numeroComprobante || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.origen || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      (inv.destino || '').toLowerCase().includes(invoiceSearch.toLowerCase());

    if (!matchQuery) return false;
    if (invoiceFilterType === 'cobrado') return inv.estadoCobro === 'cobrado';
    if (invoiceFilterType === 'pendiente') return inv.estadoCobro === 'pendiente';
    return true;
  });

  return (
    <div className="facturacion-panel">
      {/* ── HEADER PRINCIPAL ── */}
      <div className="facturacion-header">
        <div>
          <div className="facturacion-badge">
            <span className="pulse-dot"></span>
            <span>GESTIÓN FINANCIERA INTEGRAL · CLOUD FIRESTORE · 0% COMISIÓN</span>
          </div>
          <h1 className="facturacion-title">Facturación &amp; Finanzas Operativas</h1>
          <p className="facturacion-subtitle">
            Flujo de caja en vivo, emisión de remitos oficiales (R), control de gastos de combustible y liquidaciones de nómina.
          </p>
        </div>

        <div className="facturacion-header-actions">
          {allInvoices.length === 0 && expenses.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<span className="material-symbols-outlined">auto_fix_high</span>}
              onClick={handleSeedDemoFinance}
              title="Carga en Firestore viajes y gastos para explorar el tablero completo"
            >
              Cargar Datos Demo
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={<span className="material-symbols-outlined">receipt</span>}
            onClick={() => setInvoiceModalOpen(true)}
          >
            + Emitir Remito / Factura
          </Button>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS INTERNAS (SUB-MÓDULOS) ── */}
      <div className="fin-tabs-bar">
        <button
          type="button"
          className={`fin-tab-btn ${activeSubTab === 'balance' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('balance')}
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>1. Balance &amp; Flujo de Caja</span>
        </button>

        <button
          type="button"
          className={`fin-tab-btn ${activeSubTab === 'remitos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('remitos')}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span>2. Remitos &amp; Facturas</span>
          {allInvoices.length > 0 && <span className="tab-pill">{allInvoices.length}</span>}
        </button>

        <button
          type="button"
          className={`fin-tab-btn ${activeSubTab === 'gastos' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('gastos')}
        >
          <span className="material-symbols-outlined">local_gas_station</span>
          <span>3. Gastos &amp; Liquidaciones</span>
          {expenses.length > 0 && <span className="tab-pill tab-pill--warn">{expenses.length}</span>}
        </button>

        <button
          type="button"
          className={`fin-tab-btn ${activeSubTab === 'cobros' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cobros')}
        >
          <span className="material-symbols-outlined">qr_code_2</span>
          <span>4. Cuentas &amp; Cobro QR</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          PESTAÑA 1: BALANCE & FLUJO DE CAJA (FINANZAS)
         ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'balance' && (
        <div className="tab-pane-content">
          {/* 4 KPIs de Alto Impacto Financiero */}
          <div className="fin-kpi-grid">
            <div className="fin-kpi-card fin-kpi-card--income">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Ingresos Totales Brutos</span>
                <span className="material-symbols-outlined kpi-icon text-success">trending_up</span>
              </div>
              <div className="fin-kpi-val">${totalIncome.toLocaleString('es-AR')}</div>
              <div className="fin-kpi-sub">
                <span>{allInvoices.length} mudanzas liquidadas</span>
                <span className="badge-tag badge-tag--green">100% Cobrado</span>
              </div>
            </div>

            <div className="fin-kpi-card fin-kpi-card--expense">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Gastos Operativos Reales</span>
                <span className="material-symbols-outlined kpi-icon text-danger">trending_down</span>
              </div>
              <div className="fin-kpi-val">${totalExpenses.toLocaleString('es-AR')}</div>
              <div className="fin-kpi-sub">
                <span>Combustible, peajes y cuadrilla</span>
                <span className="badge-tag badge-tag--red">{expenses.length} registros</span>
              </div>
            </div>

            <div className="fin-kpi-card fin-kpi-card--profit">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Ganancia Neta en Mano</span>
                <span className="material-symbols-outlined kpi-icon text-primary">account_balance</span>
              </div>
              <div className="fin-kpi-val" style={{ color: netProfit >= 0 ? '#15803d' : '#b91c1c' }}>
                ${netProfit.toLocaleString('es-AR')}
              </div>
              <div className="fin-kpi-sub">
                <span>Margen Operativo Neto</span>
                <span className={`badge-tag ${profitMargin >= 40 ? 'badge-tag--green' : 'badge-tag--amber'}`}>
                  {profitMargin}% de rentabilidad
                </span>
              </div>
            </div>

            <div className="fin-kpi-card fin-kpi-card--comision">
              <div className="fin-kpi-top">
                <span className="fin-kpi-label">Comisión Mudify Retenida</span>
                <span className="material-symbols-outlined kpi-icon text-tertiary">verified</span>
              </div>
              <div className="fin-kpi-val fin-kpi-val--zero">$0 ARS</div>
              <div className="fin-kpi-sub">
                <span>0% comisión de plataforma</span>
                <span className="badge-tag badge-tag--blue">60 Días Gratis</span>
              </div>
            </div>
          </div>

          {/* Gráfico y Distribución de Costos */}
          <div className="fin-split-layout">
            {/* Visual de Desglose de Gastos */}
            <div className="fin-card-box">
              <div className="box-header">
                <div>
                  <h3>Estructura de Costos Operativos</h3>
                  <p>Distribución de salidas según categoría registrada en Cloud Firestore.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<span className="material-symbols-outlined">add</span>}
                  onClick={() => setExpenseModalOpen(true)}
                >
                  + Cargar Gasto
                </Button>
              </div>

              {totalExpenses === 0 ? (
                <div className="empty-chart-state">
                  <span className="material-symbols-outlined">savings</span>
                  <p>Aún no tenés egresos registrados. Podés cargar tickets de combustible o peajes.</p>
                </div>
              ) : (
                <div className="cost-breakdown-list">
                  <div className="cost-item">
                    <div className="cost-item-header">
                      <span className="cost-cat"><span className="cat-dot cat-dot--fuel"></span> Combustible YPF / Shell</span>
                      <strong className="cost-val">${expensesByCategory.combustible.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill progress-fill--fuel"
                        style={{ width: `${Math.round((expensesByCategory.combustible / totalExpenses) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="cost-percent">{Math.round((expensesByCategory.combustible / totalExpenses) * 100)}% del total</span>
                  </div>

                  <div className="cost-item">
                    <div className="cost-item-header">
                      <span className="cost-cat"><span className="cat-dot cat-dot--crew"></span> Liquidaciones a Cuadrilla / Peones</span>
                      <strong className="cost-val">${expensesByCategory.liquidacion_personal.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill progress-fill--crew"
                        style={{ width: `${Math.round((expensesByCategory.liquidacion_personal / totalExpenses) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="cost-percent">{Math.round((expensesByCategory.liquidacion_personal / totalExpenses) * 100)}% del total</span>
                  </div>

                  <div className="cost-item">
                    <div className="cost-item-header">
                      <span className="cost-cat"><span className="cat-dot cat-dot--toll"></span> Peajes (Telepase AUSA / Ausol)</span>
                      <strong className="cost-val">${expensesByCategory.peajes.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill progress-fill--toll"
                        style={{ width: `${Math.round((expensesByCategory.peajes / totalExpenses) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="cost-percent">{Math.round((expensesByCategory.peajes / totalExpenses) * 100)}% del total</span>
                  </div>

                  <div className="cost-item">
                    <div className="cost-item-header">
                      <span className="cost-cat"><span className="cat-dot cat-dot--repair"></span> Mantenimiento de Flota &amp; Mecánica</span>
                      <strong className="cost-val">${expensesByCategory.mantenimiento.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill progress-fill--repair"
                        style={{ width: `${Math.round((expensesByCategory.mantenimiento / totalExpenses) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="cost-percent">{Math.round((expensesByCategory.mantenimiento / totalExpenses) * 100)}% del total</span>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen por Unidad / Camión */}
            <div className="fin-card-box">
              <div className="box-header">
                <div>
                  <h3>Rendimiento por Unidad Activa</h3>
                  <p>Móviles con recaudación y asignación de viajes.</p>
                </div>
              </div>

              <div className="fleet-finance-list">
                {vehicles.length === 0 ? (
                  <div className="empty-chart-state">
                    <span className="material-symbols-outlined">local_shipping</span>
                    <p>Registrá tus furgones o camiones en la pestaña "Mi Vehículo & Flota".</p>
                  </div>
                ) : (
                  vehicles.map((veh) => {
                    const vehTrips = allInvoices.filter((i) => i.vehiculoPatente === veh.patente);
                    const vehIncome = vehTrips.reduce((acc, t) => acc + (Number(t.monto) || 0), 0);
                    const vehExpenses = expenses
                      .filter((e) => e.vehiculoPatente === veh.patente)
                      .reduce((acc, e) => acc + (Number(e.monto) || 0), 0);
                    const vehNet = vehIncome - vehExpenses;

                    return (
                      <div key={veh.id || veh.patente} className="fleet-fin-item">
                        <div className="fleet-fin-top">
                          <div className="fleet-fin-meta">
                            <span className="patente-chip font-mono">{veh.patente}</span>
                            <strong>{veh.marca} {veh.modelo}</strong>
                            <span className="cat-chip">{veh.categoria || 'Flete'}</span>
                          </div>
                          <span className="trip-count-badge">{vehTrips.length} viajes</span>
                        </div>

                        <div className="fleet-fin-stats">
                          <div className="f-stat">
                            <span>Ingresos:</span>
                            <strong className="text-success">${vehIncome.toLocaleString('es-AR')}</strong>
                          </div>
                          <div className="f-stat">
                            <span>Gastos:</span>
                            <strong className="text-danger">${vehExpenses.toLocaleString('es-AR')}</strong>
                          </div>
                          <div className="f-stat">
                            <span>Resultado Neto:</span>
                            <strong style={{ color: vehNet >= 0 ? '#15803d' : '#b91c1c' }}>
                              ${vehNet.toLocaleString('es-AR')}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PESTAÑA 2: REMITOS DIGITALES OFICIALES & FACTURACIÓN
         ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'remitos' && (
        <div className="tab-pane-content">
          <div className="invoices-filter-bar">
            <div className="search-input-wrap">
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Buscar por cliente, nro de remito R, origen o destino..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
            </div>

            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${invoiceFilterType === 'todos' ? 'active' : ''}`}
                onClick={() => setInvoiceFilterType('todos')}
              >
                Todos ({allInvoices.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${invoiceFilterType === 'cobrado' ? 'active' : ''}`}
                onClick={() => setInvoiceFilterType('cobrado')}
              >
                Cobrados
              </button>
              <button
                type="button"
                className={`filter-pill ${invoiceFilterType === 'pendiente' ? 'active' : ''}`}
                onClick={() => setInvoiceFilterType('pendiente')}
              >
                Pendientes
              </button>
            </div>
          </div>

          <div className="invoices-table-card">
            {filteredInvoices.length === 0 ? (
              <div className="empty-invoices-box">
                <span className="material-symbols-outlined">receipt_long</span>
                <h3>No hay comprobantes que coincidan con la búsqueda</h3>
                <p>Al finalizar viajes en la Torre de Control o emitir remitos manuales se mostrarán aquí en tiempo real.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setInvoiceModalOpen(true)}
                >
                  + Emitir Remito Manual
                </Button>
              </div>
            ) : (
              <div className="invoices-list-table">
                <div className="invoices-thead">
                  <span>Comprobante</span>
                  <span>Cliente / Trayecto</span>
                  <span>Móvil / Patente</span>
                  <span>Monto</span>
                  <span>Estado</span>
                  <span style={{ textAlign: 'right' }}>Acciones</span>
                </div>

                {filteredInvoices.map((inv) => (
                  <div key={inv.id || inv.numeroComprobante} className="invoice-row-item">
                    <div className="inv-code-col">
                      <span className="remito-tag">{inv.tipoComprobante === 'remito_r' ? 'REMITO R' : 'FACTURA'}</span>
                      <strong className="font-mono inv-num">{inv.numeroComprobante}</strong>
                      <span className="inv-date">{inv.fechaStr}</span>
                    </div>

                    <div className="inv-client-col">
                      <strong className="client-title">{inv.cliente}</strong>
                      <p className="route-desc">
                        <span>{inv.origen}</span> ➔ <span>{inv.destino}</span>
                      </p>
                      {inv.bultosDescripcion && (
                        <small className="cargo-hint">📦 {inv.bultosDescripcion}</small>
                      )}
                    </div>

                    <div className="inv-veh-col">
                      <span className="patente-chip font-mono">{inv.vehiculoPatente || 'FIU001'}</span>
                      <span className="method-hint">{inv.metodoPago}</span>
                    </div>

                    <div className="inv-amount-col">
                      <strong className="amount-val">${Number(inv.monto).toLocaleString('es-AR')}</strong>
                    </div>

                    <div className="inv-status-col">
                      <button
                        type="button"
                        className={`status-btn-pill ${inv.estadoCobro === 'cobrado' ? 'status-btn-pill--paid' : 'status-btn-pill--pending'}`}
                        onClick={() => handleToggleInvoiceStatus(inv)}
                        title="Hacé clic para alternar entre Cobrado y Pendiente"
                      >
                        {inv.estadoCobro === 'cobrado' ? '✓ Cobrado' : '⏳ Pendiente'}
                      </button>
                    </div>

                    <div className="inv-actions-col">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>}
                        onClick={() => handleOpenRemito(inv)}
                      >
                        Ver Remito
                      </Button>
                      <button
                        type="button"
                        className="btn-icon-share"
                        onClick={() => handleShareWhatsApp(inv)}
                        title="Enviar remito oficial por WhatsApp"
                      >
                        <span className="material-symbols-outlined">share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PESTAÑA 3: CONTROL DE GASTOS & LIQUIDACIONES A CUADRILLA
         ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'gastos' && (
        <div className="tab-pane-content">
          <div className="expenses-top-actions">
            <div className="expenses-meta-summary">
              <h3>Egresos Operativos Registrados: <strong>${totalExpenses.toLocaleString('es-AR')}</strong></h3>
              <p>Control de tickets de combustible, peajes y jornales liquidados a la cuadrilla.</p>
            </div>

            <div className="actions-button-row">
              {staffList.length > 0 && (
                <Button
                  variant="outline"
                  size="md"
                  icon={<span className="material-symbols-outlined">payments</span>}
                  onClick={() => setPayoutModalOpen(true)}
                >
                  💸 Liquidar Jornal a Cuadrilla
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                icon={<span className="material-symbols-outlined">add_circle</span>}
                onClick={() => setExpenseModalOpen(true)}
              >
                + Registrar Gasto Operativo
              </Button>
            </div>
          </div>

          <div className="expenses-table-card">
            {expenses.length === 0 ? (
              <div className="empty-invoices-box">
                <span className="material-symbols-outlined">local_gas_station</span>
                <h3>Sin gastos registrados todavía</h3>
                <p>Registrá tus gastos de combustible, peajes o pagos de jornales para calcular tu margen neto real.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setExpenseModalOpen(true)}
                >
                  + Cargar Primer Gasto
                </Button>
              </div>
            ) : (
              <div className="expenses-list">
                <div className="expenses-thead">
                  <span>Fecha</span>
                  <span>Categoría</span>
                  <span>Concepto / Destino</span>
                  <span>Móvil / Beneficiario</span>
                  <span>Monto</span>
                  <span style={{ textAlign: 'right' }}>Eliminar</span>
                </div>

                {expenses.map((exp) => (
                  <div key={exp.id} className="expense-row-item">
                    <span className="exp-date">{exp.fechaStr}</span>

                    <div>
                      <span className={`exp-type-tag exp-type-tag--${exp.tipo}`}>
                        {exp.tipo === 'combustible' ? '⛽ Combustible' :
                         exp.tipo === 'peajes' ? '🛣️ Peajes' :
                         exp.tipo === 'liquidacion_personal' ? '👷 Cuadrilla' :
                         exp.tipo === 'mantenimiento' ? '🔧 Taller / Gomería' : '📑 Operativo'}
                      </span>
                    </div>

                    <div className="exp-concept-col">
                      <strong>{exp.concepto}</strong>
                      {exp.comprobanteNumero && (
                        <small className="ticket-num font-mono">Comprobante: {exp.comprobanteNumero}</small>
                      )}
                    </div>

                    <div className="exp-target-col">
                      {exp.vehiculoPatente ? (
                        <span className="patente-chip font-mono">{exp.vehiculoPatente}</span>
                      ) : exp.staffNombre ? (
                        <span className="staff-pill">👤 {exp.staffNombre}</span>
                      ) : (
                        <span className="text-muted">General Base</span>
                      )}
                    </div>

                    <div className="exp-amount-col">
                      <strong className="text-danger">-${Number(exp.monto).toLocaleString('es-AR')}</strong>
                    </div>

                    <div className="exp-del-col">
                      <button
                        type="button"
                        className="btn-del-exp"
                        onClick={() => handleDeleteExpense(exp.id)}
                        title="Eliminar gasto de Firestore"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          PESTAÑA 4: CUENTAS DE COBRO & GENERADOR QR
         ══════════════════════════════════════════════════════════ */}
      {activeSubTab === 'cobros' && (
        <div className="tab-pane-content">
          <div className="cobros-grid-layout">
            {/* Formulario de Cuentas */}
            <div className="cobros-card">
              <div className="box-header">
                <div>
                  <h3>Cuenta de Cobro Bancaria / Mercado Pago</h3>
                  <p>Datos reales que se le proveen al cliente al momento de abonar el servicio.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPayment(!editingPayment)}
                >
                  {editingPayment ? 'Cancelar' : 'Editar Datos'}
                </Button>
              </div>

              {editingPayment ? (
                <form onSubmit={handleSavePaymentData} className="payment-edit-form">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label htmlFor="pay-alias">Alias de Mercado Pago / Banco *</label>
                      <input
                        id="pay-alias"
                        type="text"
                        value={paymentData.alias}
                        onChange={(e) => setPaymentData({ ...paymentData, alias: e.target.value })}
                        required
                        placeholder="Ej: tuempresa.mudify.mp"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pay-cvu">CBU / CVU (22 dígitos) *</label>
                      <input
                        id="pay-cvu"
                        type="text"
                        value={paymentData.cvu}
                        onChange={(e) => setPaymentData({ ...paymentData, cvu: e.target.value })}
                        required
                        placeholder="00000031000..."
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pay-banco">Entidad Bancaria / Billetera</label>
                      <input
                        id="pay-banco"
                        type="text"
                        value={paymentData.banco}
                        onChange={(e) => setPaymentData({ ...paymentData, banco: e.target.value })}
                        placeholder="Ej: Mercado Pago / Banco Santander"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pay-titular">Titular de la Cuenta</label>
                      <input
                        id="pay-titular"
                        type="text"
                        value={paymentData.titular}
                        onChange={(e) => setPaymentData({ ...paymentData, titular: e.target.value })}
                        placeholder="Ej: Jose Alfredo ALLIANA"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pay-cuit">CUIT / CUIL del Titular</label>
                      <input
                        id="pay-cuit"
                        type="text"
                        value={paymentData.cuit}
                        onChange={(e) => setPaymentData({ ...paymentData, cuit: e.target.value })}
                        placeholder="Ej: 20-33550978-9"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pay-tipo">Tipo de Cuenta</label>
                      <select
                        id="pay-tipo"
                        value={paymentData.tipoCuenta}
                        onChange={(e) => setPaymentData({ ...paymentData, tipoCuenta: e.target.value })}
                      >
                        <option value="Caja de Ahorro en Pesos">Caja de Ahorro en Pesos</option>
                        <option value="Cuenta Corriente">Cuenta Corriente en Pesos</option>
                        <option value="Cuenta Digital CVU">Cuenta Digital Mercado Pago (CVU)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-submit-row">
                    <Button variant="primary" size="md" type="submit" disabled={savingPayment}>
                      {savingPayment ? 'Guardando en Firestore...' : 'Guardar Datos en Cloud Firestore'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="payment-view-box">
                  <div className="pay-row">
                    <span className="pay-label">Alias Oficial:</span>
                    <strong className="pay-val font-mono">{paymentData.alias}</strong>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.alias);
                        onShowToast && onShowToast('¡Alias copiado al portapapeles!', 'info');
                      }}
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="pay-row">
                    <span className="pay-label">CBU / CVU:</span>
                    <strong className="pay-val font-mono">{paymentData.cvu}</strong>
                    <button
                      type="button"
                      className="btn-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(paymentData.cvu);
                        onShowToast && onShowToast('¡CBU/CVU copiado al portapapeles!', 'info');
                      }}
                    >
                      Copiar
                    </button>
                  </div>

                  <div className="pay-grid-sub">
                    <div>
                      <span className="pay-label">Titular:</span>
                      <strong>{paymentData.titular}</strong>
                    </div>
                    <div>
                      <span className="pay-label">CUIT/CUIL:</span>
                      <strong>{paymentData.cuit}</strong>
                    </div>
                    <div>
                      <span className="pay-label">Entidad:</span>
                      <strong>{paymentData.banco}</strong>
                    </div>
                    <div>
                      <span className="pay-label">Modalidad:</span>
                      <strong className="text-success">0% Comisión Retenida</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QR Dinámico de Cobro Instantáneo */}
            <div className="cobros-card qr-card-center">
              <div className="qr-badge">
                <span className="material-symbols-outlined">qr_code_scanner</span>
                <span>QR DINÁMICO DE TRANSFERENCIA DIRECTA</span>
              </div>
              <h3>Cobro Rápido en Destino</h3>
              <p>Mostrá este código al cliente al finalizar la descarga para que transfiera desde su app bancaria o billetera.</p>

              <div className="qr-canvas-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `TRANSFERENCIA MUDIFY | Alias: ${paymentData.alias} | CBU: ${paymentData.cvu} | Titular: ${paymentData.titular}`
                  )}`}
                  alt="QR de Cobro Bancario"
                  className="qr-img"
                />
                <span className="qr-alias-tag font-mono">{paymentData.alias}</span>
              </div>

              <div className="qr-features">
                <div className="feat-chip">✓ Acreditación inmediata</div>
                <div className="feat-chip">✓ Sin posnet requerido</div>
                <div className="feat-chip">✓ Sin comisiones</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL 1: REGISTRAR GASTO OPERATIVO
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Registrar Gasto Operativo"
        subtitle="Ingresá los comprobantes de combustible, peajes o mantenimiento de flota para tu balance."
        maxWidth="640px"
      >
        <form onSubmit={handleSaveExpense} className="modal-finance-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="exp-tipo">Tipo de Egresos *</label>
              <select
                id="exp-tipo"
                value={expenseForm.tipo}
                onChange={(e) => setExpenseForm({ ...expenseForm, tipo: e.target.value })}
              >
                <option value="combustible">⛽ Combustible (Nafta / Gasoil)</option>
                <option value="peajes">🛣️ Peajes (Telepase / Manual)</option>
                <option value="mantenimiento">🔧 Taller / Gomería / Service</option>
                <option value="viaticos">🍔 Viáticos / Desayuno Cuadrilla</option>
                <option value="seguro">🛡️ Seguro Técnico / Póliza</option>
                <option value="otro">📑 Otro Gasto Operativo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exp-monto">Monto del Gasto (ARS) *</label>
              <div className="currency-input-wrap">
                <span className="curr-sym">$</span>
                <input
                  id="exp-monto"
                  type="number"
                  required
                  min="1"
                  step="50"
                  placeholder="Ej: 35000"
                  value={expenseForm.monto}
                  onChange={(e) => setExpenseForm({ ...expenseForm, monto: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="exp-concepto">Detalle / Concepto del Gasto *</label>
              <input
                id="exp-concepto"
                type="text"
                required
                placeholder="Ej: Carga YPF Infinia Diesel 40Lts en Panamericana"
                value={expenseForm.concepto}
                onChange={(e) => setExpenseForm({ ...expenseForm, concepto: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exp-veh">Móvil de Flota Afectado</label>
              <select
                id="exp-veh"
                value={expenseForm.vehiculoPatente}
                onChange={(e) => setExpenseForm({ ...expenseForm, vehiculoPatente: e.target.value })}
              >
                <option value="">Gasto General / Base</option>
                {vehicles.map((v) => (
                  <option key={v.id || v.patente} value={v.patente}>
                    Móvil {v.patente} ({v.marca} {v.modelo})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exp-ticket">Nº Ticket / Factura (Opcional)</label>
              <input
                id="exp-ticket"
                type="text"
                placeholder="Ej: T-0045-001928"
                value={expenseForm.comprobanteNumero}
                onChange={(e) => setExpenseForm({ ...expenseForm, comprobanteNumero: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exp-date">Fecha del Gasto</label>
              <input
                id="exp-date"
                type="date"
                value={expenseForm.fecha}
                onChange={(e) => setExpenseForm({ ...expenseForm, fecha: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-finance-actions">
            <Button variant="outline" size="md" onClick={() => setExpenseModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Guardar Gasto en Firestore
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL 2: LIQUIDAR PAGO A PERSONAL DE NÓMINA
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Liquidar Jornal a Personal de Nómina"
        subtitle="Registrá el desembolso por mudanza a tus choferes, estibadores o embaladores."
        maxWidth="640px"
      >
        <form onSubmit={handleSavePayout} className="modal-finance-form">
          <div className="form-grid-2">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="pay-staff">Seleccionar Operario de Nómina *</label>
              <select
                id="pay-staff"
                required
                value={payoutForm.staffId}
                onChange={(e) => {
                  const sId = e.target.value;
                  const st = staffList.find((s) => s.id === sId);
                  setPayoutForm({
                    ...payoutForm,
                    staffId: sId,
                    monto: st?.remuneracion?.monto || st?.remuneracionMonto || ''
                  });
                }}
              >
                <option value="">Seleccionar operario...</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.rolLabel || s.rol}) — {s.dni || 'DNI'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pay-amount">Monto a Liquidar (ARS) *</label>
              <div className="currency-input-wrap">
                <span className="curr-sym">$</span>
                <input
                  id="pay-amount"
                  type="number"
                  required
                  min="1"
                  step="500"
                  placeholder="Ej: 35000"
                  value={payoutForm.monto}
                  onChange={(e) => setPayoutForm({ ...payoutForm, monto: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pay-method">Medio de Pago</label>
              <select
                id="pay-method"
                value={payoutForm.metodo}
                onChange={(e) => setPayoutForm({ ...payoutForm, metodo: e.target.value })}
              >
                <option value="Transferencia CBU / CVU">Transferencia Bancaria CBU / CVU</option>
                <option value="Efectivo en Mano">Efectivo en Mano al Finalizar</option>
                <option value="Mercado Pago Envío">Mercado Pago Envío de Dinero</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="pay-concept">Concepto de la Liquidación</label>
              <input
                id="pay-concept"
                type="text"
                value={payoutForm.concepto}
                onChange={(e) => setPayoutForm({ ...payoutForm, concepto: e.target.value })}
                placeholder="Ej: Jornal de Mudanza 2 ambientes Almagro a Belgrano"
              />
            </div>
          </div>

          <div className="modal-finance-actions">
            <Button variant="outline" size="md" onClick={() => setPayoutModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Confirmar Liquidación &amp; Registrar Egreso
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL 3: EMITIR REMITO / FACTURA MANUAL
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Emitir Comprobante / Remito Oficial"
        subtitle="Generá un remito de carga o comprobante para clientes particulares o corporativos."
        maxWidth="740px"
      >
        <form onSubmit={handleSaveInvoice} className="modal-finance-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="inv-tipo">Tipo de Documento *</label>
              <select
                id="inv-tipo"
                value={invoiceForm.tipoComprobante}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, tipoComprobante: e.target.value })}
              >
                <option value="remito_r">Remito Oficial de Traslado (Formulario R)</option>
                <option value="factura_c">Factura C (Monotributo / Consumidor Final)</option>
                <option value="factura_a">Factura A (Responsable Inscripto / Empresas)</option>
                <option value="recibo_x">Recibo Provisorio X</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="inv-num">Número de Comprobante</label>
              <input
                id="inv-num"
                type="text"
                readOnly
                className="font-mono bg-light"
                value={invoiceForm.numeroComprobante}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-client">Nombre del Cliente / Empresa *</label>
              <input
                id="inv-client"
                type="text"
                required
                placeholder="Ej: Consorcio Torre Libertador"
                value={invoiceForm.cliente}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, cliente: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-cuit">CUIT / DNI del Cliente</label>
              <input
                id="inv-cuit"
                type="text"
                placeholder="Ej: 30-71928410-4"
                value={invoiceForm.cuitCuilCliente}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, cuitCuilCliente: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-orig">Domicilio de Origen *</label>
              <input
                id="inv-orig"
                type="text"
                required
                placeholder="Ej: Av. Callao 1250, Recoleta (CABA)"
                value={invoiceForm.origen}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, origen: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-dest">Domicilio de Destino *</label>
              <input
                id="inv-dest"
                type="text"
                required
                placeholder="Ej: Av. Libertador 2400, Olivos"
                value={invoiceForm.destino}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, destino: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inv-monto">Monto Total del Servicio (ARS) *</label>
              <div className="currency-input-wrap">
                <span className="curr-sym">$</span>
                <input
                  id="inv-monto"
                  type="number"
                  required
                  min="1"
                  step="500"
                  placeholder="Ej: 85000"
                  value={invoiceForm.monto}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, monto: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inv-veh">Móvil Asignado</label>
              <select
                id="inv-veh"
                value={invoiceForm.vehiculoPatente}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, vehiculoPatente: e.target.value })}
              >
                {vehicles.map((v) => (
                  <option key={v.id || v.patente} value={v.patente}>
                    {v.patente} — {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="inv-bultos">Declaración de Carga &amp; Bultos</label>
              <textarea
                id="inv-bultos"
                rows="2"
                placeholder="Detalle de enseres, muebles y cajas transportadas..."
                value={invoiceForm.bultosDescripcion}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, bultosDescripcion: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-finance-actions">
            <Button variant="outline" size="md" onClick={() => setInvoiceModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit">
              Emitir Comprobante en Cloud Firestore
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL 4: VISTA PREVIA IMPRIMIBLE DEL REMITO OFICIAL (R)
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={remitoModalOpen}
        onClose={() => setRemitoModalOpen(false)}
        title={`Remito Oficial de Traslado #${selectedRemito?.numeroComprobante || ''}`}
        subtitle="Documento válido para control policial, gendarmería y seguridad de consorcios."
        maxWidth="820px"
      >
        {selectedRemito && (
          <div className="printable-remito-container" id="printable-remito">
            {/* Header del Remito con membrete */}
            <div className="remito-doc-header">
              <div className="remito-brand-col">
                <div className="remito-logo">
                  <span className="material-symbols-outlined">local_shipping</span>
                  <h2>MUDIFY <span>PRO</span></h2>
                </div>
                <p className="remito-company-name">
                  {profile?.name || (isEmpresa ? 'Empresa de Transporte & Mudanzas' : 'Transportista Habilitado Mudify')}
                </p>
                <p className="remito-tax-info">
                  CUIT: {paymentData.cuit || '20-33550978-9'} · Ingresos Brutos: 33550978 · IVA: Responsable / Monotributo
                </p>
              </div>

              <div className="remito-doc-badge">
                <div className="doc-letter">R</div>
                <div className="doc-legal-type">REMITO DE CARGA</div>
                <div className="doc-legal-num font-mono">{selectedRemito.numeroComprobante}</div>
                <div className="doc-legal-date">Fecha: {selectedRemito.fechaStr}</div>
              </div>
            </div>

            {/* Trayecto y Cliente */}
            <div className="remito-section-box">
              <div className="remito-grid-2">
                <div>
                  <span className="box-section-label">DATOS DEL DESTINATARIO / CLIENTE</span>
                  <p><strong>Cliente:</strong> {selectedRemito.cliente}</p>
                  {selectedRemito.clienteTelefono && (
                    <p><strong>Teléfono:</strong> {selectedRemito.clienteTelefono}</p>
                  )}
                  <p><strong>Condición de Pago:</strong> {selectedRemito.metodoPago || 'Transferencia Directa'}</p>
                </div>

                <div>
                  <span className="box-section-label">UNIDAD DE TRANSPORTE &amp; HABILITACIÓN</span>
                  <p><strong>Móvil Patente:</strong> <span className="font-mono">{selectedRemito.vehiculoPatente || 'FIU001'}</span></p>
                  <p><strong>Chofer Titular:</strong> {profile?.name || user.displayName || 'Jose Alfredo ALLIANA'}</p>
                  <p><strong>Póliza de Carga:</strong> Cobertura Integral en Tránsito</p>
                </div>
              </div>
            </div>

            {/* Itinerario Origen -> Destino */}
            <div className="remito-route-box">
              <div className="route-step">
                <span className="point-dot point-dot--origin"></span>
                <div>
                  <span className="route-sub-label">ORIGEN DE CARGA:</span>
                  <strong>{selectedRemito.origen}</strong>
                </div>
              </div>

              <div className="route-step" style={{ marginTop: '12px' }}>
                <span className="point-dot point-dot--dest"></span>
                <div>
                  <span className="route-sub-label">DESTINO DE DESCARGA:</span>
                  <strong>{selectedRemito.destino}</strong>
                </div>
              </div>
            </div>

            {/* Declaración de Carga & Bultos */}
            <div className="remito-section-box">
              <span className="box-section-label">DECLARACIÓN DE CONTENIDO &amp; BULTOS</span>
              <p className="cargo-text-declaration">
                {selectedRemito.bultosDescripcion || 'Mobiliario de hogar, cajas de enseres personales embaladas y artículos varios de mudanza.'}
              </p>
              <div className="remito-disclaimer">
                El presente documento certifica el transporte legal de las pertenencias detalladas por cuenta y orden del titular contratante, amparado bajo póliza de carga y habilitación de transporte automotor vigente.
              </div>
            </div>

            {/* Totales y QR */}
            <div className="remito-footer-split">
              <div className="remito-qr-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                    `REMITO MUDIFY: ${selectedRemito.numeroComprobante} | Cliente: ${selectedRemito.cliente} | Patente: ${selectedRemito.vehiculoPatente} | Origen: ${selectedRemito.origen}`
                  )}`}
                  alt="QR Verificación"
                  className="remito-qr-img"
                />
                <div className="qr-meta-text">
                  <span>Código de Verificación Satelital</span>
                  <small>Válido para fuerzas de seguridad y CNRT</small>
                </div>
              </div>

              <div className="remito-total-col">
                <span className="total-title">VALOR TOTAL DEL TRASLADO</span>
                <span className="total-val">${Number(selectedRemito.monto).toLocaleString('es-AR')}</span>
                <span className={`paid-tag ${selectedRemito.estadoCobro === 'cobrado' ? 'paid-tag--ok' : 'paid-tag--pending'}`}>
                  {selectedRemito.estadoCobro === 'cobrado' ? 'ABONADO EN DESTINO ✓' : 'COBRO PENDIENTE DE PAGO'}
                </span>
              </div>
            </div>

            {/* Firmas de Conformidad */}
            <div className="remito-signatures-row">
              <div className="sig-line">
                <span>Firma Transportista / Chofer</span>
              </div>
              <div className="sig-line">
                <span>Firma y Aclaración del Cliente</span>
              </div>
            </div>

            {/* Botones de Acción del Remito */}
            <div className="remito-modal-actions no-print">
              <Button
                variant="outline"
                size="md"
                icon={<span className="material-symbols-outlined">print</span>}
                onClick={handlePrintRemito}
              >
                Imprimir Remito / Guardar PDF
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<span className="material-symbols-outlined">share</span>}
                onClick={() => handleShareWhatsApp(selectedRemito)}
              >
                Compartir por WhatsApp
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
