import React, { useState, useEffect, useMemo } from 'react';
import fleetService from '../../../services/fleetService';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './NominaPersonal.css';

// ── ROLES DEFINIDOS PARA EL PERSONAL DE MUDANZAS ──
export const STAFF_ROLES = [
  {
    id: 'chofer',
    label: 'Chofer Profesional LINTI',
    shortLabel: 'Chofer',
    icon: 'local_shipping',
    color: 'blue',
    desc: 'Conducción de camiones/utilitarios y estiba pesada'
  },
  {
    id: 'peon',
    label: 'Peón de Carga & Estiba',
    shortLabel: 'Peón de Carga',
    icon: 'fitness_center',
    color: 'amber',
    desc: 'Carga, descarga y acarreo por pasillo o escalera'
  },
  {
    id: 'armador',
    label: 'Armador de Muebles & Carpintero',
    shortLabel: 'Armador',
    icon: 'handyman',
    color: 'purple',
    desc: 'Desarme y armado de placards, sommiers y modulares'
  },
  {
    id: 'embalador',
    label: 'Especialista en Embalaje Fino',
    shortLabel: 'Embalador',
    icon: 'shield',
    color: 'green',
    desc: 'Empaque de vajilla, cristalería, obras de arte y filmado'
  },
  {
    id: 'capataz',
    label: 'Capataz & Coordinador',
    shortLabel: 'Capataz',
    icon: 'supervisor_account',
    color: 'indigo',
    desc: 'Coordinación de cuadrilla, remito y trato con cliente'
  },
  {
    id: 'tecnico',
    label: 'Técnico de Instalaciones',
    shortLabel: 'Técnico',
    icon: 'build',
    color: 'teal',
    desc: 'Desconexión de split, lavarropas, luminarias y TV'
  },
  {
    id: 'balconero',
    label: 'Operario de Altura / Balconero',
    shortLabel: 'Balconero',
    icon: 'vertical_align_top',
    color: 'red',
    desc: 'Izado por balcón o soga de muebles que no entran por ascensor'
  }
];

export const ART_COMPANIES = [
  'Prevención ART',
  'La Segunda ART',
  'Federación Patronal ART',
  'Galeno ART',
  'SMG ART',
  'Asociart ART',
  'Provincia ART',
  'Experta ART',
  'Berkley ART'
];

export default function NominaPersonal({ user, profile, isEmpresa, onShowToast }) {
  const [staffList, setStaffList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'

  // Modales
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null = nuevo
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Modal de Certificado para Consorcios / Edificios
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certDestination, setCertDestination] = useState('');
  const [certDate, setCertDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [certSelectedStaffIds, setCertSelectedStaffIds] = useState([]);

  // Modal y estado de Credencial Móvil para Choferes (App Android)
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [selectedDriverForCred, setSelectedDriverForCred] = useState(null);
  const [provisioningId, setProvisioningId] = useState(null);

  // Estado del Formulario de Alta / Edición
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    rol: 'chofer',
    telefono: '',
    email: '',
    estado: 'disponible',
    tipoContrato: 'efectivo',
    antiguedad: '',
    vehiculoAsignadoId: 'sin_asignar',
    vehiculoPatente: 'Sin Asignar',
    artProveedor: 'Prevención ART',
    artPoliza: 'ART-992014-X',
    artClausulaNoRepeticion: true,
    artVencimiento: '2027-12-31',
    licenciaNumero: '',
    licenciaCategoria: 'C2 / LINTI Cargas Generales',
    licenciaVencimiento: '2028-06-15',
    remuneracionModalidad: 'fijo_mensual',
    remuneracionMonto: 950000,
    remuneracionAlias: '',
    observaciones: ''
  });

  // 1. Escuchar nómina de personal en Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = fleetService.subscribeStaff(user.uid, (list) => {
      setStaffList(list || []);
      setLoading(false);
    });

    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  // 2. Escuchar vehículos de la empresa para asignaciones
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = fleetService.subscribeVehicles(user.uid, (vList) => {
      setVehicles(vList || []);
    });
    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  // ── MANEJO DEL MODAL DE ALTA / EDICIÓN ──
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      nombre: '',
      dni: '',
      rol: 'chofer',
      telefono: '',
      email: '',
      estado: 'disponible',
      tipoContrato: 'efectivo',
      antiguedad: 'Reciente',
      vehiculoAsignadoId: vehicles[0]?.id || 'sin_asignar',
      vehiculoPatente: vehicles[0]?.patente || 'Sin Asignar',
      artProveedor: 'Prevención ART',
      artPoliza: 'ART-992014-X',
      artClausulaNoRepeticion: true,
      artVencimiento: '2027-12-31',
      licenciaNumero: '',
      licenciaCategoria: 'C2 / LINTI Cargas Generales',
      licenciaVencimiento: '2028-06-15',
      remuneracionModalidad: 'jornal_diario',
      remuneracionMonto: 35000,
      remuneracionAlias: '',
      observaciones: ''
    });
    setEditModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setFormData({
      nombre: member.nombre || '',
      dni: member.dni || '',
      rol: member.rol || 'peon',
      telefono: member.telefono || '',
      email: member.email || '',
      estado: member.estado || 'disponible',
      tipoContrato: member.tipoContrato || 'efectivo',
      antiguedad: member.antiguedad || '',
      vehiculoAsignadoId: member.vehiculoAsignadoId || 'sin_asignar',
      vehiculoPatente: member.vehiculoPatente || 'Sin Asignar',
      artProveedor: member.art?.proveedor || 'Prevención ART',
      artPoliza: member.art?.numeroPoliza || 'ART-992014-X',
      artClausulaNoRepeticion: member.art?.clausulaNoRepeticion !== false,
      artVencimiento: member.art?.vencimientoCertificado || '2027-12-31',
      licenciaNumero: member.licencia?.numero || '',
      licenciaCategoria: member.licencia?.categoria || 'C2 / LINTI Cargas Generales',
      licenciaVencimiento: member.licencia?.vencimiento || '',
      remuneracionModalidad: member.remuneracion?.modalidad || 'jornal_diario',
      remuneracionMonto: member.remuneracion?.monto || 0,
      remuneracionAlias: member.remuneracion?.aliasCbu || '',
      observaciones: member.observaciones || ''
    });
    setEditModalOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Si cambia el vehículo asignado, mapear su patente
      if (field === 'vehiculoAsignadoId') {
        if (value === 'sin_asignar') {
          updated.vehiculoPatente = 'Cuadrilla General';
        } else {
          const foundVeh = vehicles.find(v => v.id === value);
          updated.vehiculoPatente = foundVeh ? `${foundVeh.patente} (${foundVeh.marca || foundVeh.modelo || 'Móvil'})` : 'Móvil Asignado';
        }
      }
      return updated;
    });
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.dni.trim()) {
      onShowToast?.('Por favor completá el nombre y el DNI del operario.', 'error');
      return;
    }

    setSaving(true);
    try {
      const roleObj = STAFF_ROLES.find(r => r.id === formData.rol);

      const memberPayload = {
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        rol: formData.rol,
        rolLabel: roleObj ? roleObj.label : formData.rol,
        telefono: formData.telefono.trim(),
        email: formData.email.trim().toLowerCase(),
        estado: formData.estado,
        tipoContrato: formData.tipoContrato,
        antiguedad: formData.antiguedad.trim(),
        vehiculoAsignadoId: formData.vehiculoAsignadoId,
        vehiculoPatente: formData.vehiculoPatente,
        art: {
          proveedor: formData.artProveedor,
          numeroPoliza: formData.artPoliza.trim(),
          clausulaNoRepeticion: Boolean(formData.artClausulaNoRepeticion),
          vencimientoCertificado: formData.artVencimiento,
          vigente: true
        },
        licencia: formData.rol === 'chofer' ? {
          numero: formData.licenciaNumero.trim(),
          categoria: formData.licenciaCategoria,
          vencimiento: formData.licenciaVencimiento
        } : null,
        remuneracion: {
          modalidad: formData.remuneracionModalidad,
          monto: Number(formData.remuneracionMonto || 0),
          aliasCbu: formData.remuneracionAlias.trim()
        },
        observaciones: formData.observaciones.trim()
      };

      if (editingMember) {
        await fleetService.updateStaffMember(user.uid, editingMember.id, memberPayload);
        onShowToast?.(`Legajo de ${memberPayload.nombre} actualizado correctamente.`, 'success');
      } else {
        await fleetService.addStaffMember(user.uid, memberPayload);
        onShowToast?.(`Operario ${memberPayload.nombre} registrado en la nómina.`, 'success');
      }

      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast?.(`Error guardando integrante: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id, nombre) => {
    try {
      await fleetService.deleteStaffMember(user.uid, id);
      onShowToast?.(`Operario ${nombre} dado de baja de la nómina.`, 'info');
      setDeleteConfirmId(null);
    } catch (err) {
      onShowToast?.(`Error al eliminar: ${err.message}`, 'error');
    }
  };

  const handleQuickStatusChange = async (member, newStatus) => {
    try {
      await fleetService.updateStaffMember(user.uid, member.id, { estado: newStatus });
      onShowToast?.(`Estado de ${member.nombre} cambiado a: ${newStatus.toUpperCase()}`, 'info');
    } catch (err) {
      onShowToast?.(`Error actualizando estado: ${err.message}`, 'error');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await fleetService.seedDefaultStaff(user.uid, vehicles);
      onShowToast?.('Cuadrilla tipo cargada exitosamente en Cloud Firestore', 'success');
    } catch (err) {
      onShowToast?.(`Error cargando plantilla: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── APROVISIONAMIENTO Y VINCULACIÓN DE CHOFER MÓVIL ANDROID ──
  const handleProvisionDriver = async (member) => {
    if (!member.email) {
      onShowToast?.(`El chofer ${member.nombre} debe tener un email registrado para vincular su App. Editá su legajo y agregale su correo de Google.`, 'error');
      return;
    }

    setProvisioningId(member.id);
    try {
      const assignedVeh = vehicles.find(v => v.id === member.vehiculoAsignadoId);
      await fleetService.provisionDependentDriver(user.uid, profile, member, assignedVeh);
      onShowToast?.(`✅ Chofer ${member.nombre} habilitado en Mudify Conductor Android. Móvil (${assignedVeh?.patente || 'Flota'}) y pólizas inyectadas con éxito.`, 'success');
    } catch (err) {
      onShowToast?.(`Error aprovisionando chofer: ${err.message}`, 'error');
    } finally {
      setProvisioningId(null);
    }
  };

  const handleOpenDriverCred = (member) => {
    setSelectedDriverForCred(member);
    setCredModalOpen(true);
  };

  // ── CERTIFICADO PARA CONSORCIOS / EDIFICIOS ──
  const handleOpenCertModal = () => {
    // Por defecto seleccionar a los operarios disponibles
    const availableIds = staffList.filter(s => s.estado === 'disponible').map(s => s.id);
    setCertSelectedStaffIds(availableIds.length > 0 ? availableIds : staffList.map(s => s.id));
    setCertDestination('');
    setCertModalOpen(true);
  };

  const toggleStaffInCert = (id) => {
    setCertSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleCopyCertWhatsApp = () => {
    const selectedMembers = staffList.filter(s => certSelectedStaffIds.includes(s.id));
    const compName = profile?.name || user?.displayName || 'Empresa de Mudanzas Oficial Mudify';

    let text = `*CONSTANCIA DE CUADRILLA Y PÓLIZA DE ART*\n`;
    text += `*Empresa:* ${compName}\n`;
    text += `*Destino / Consorcio:* ${certDestination || 'A designar'}\n`;
    text += `*Fecha de Operación:* ${certDate}\n\n`;
    text += `*NÓMINA DE PERSONAL AFECTADO AL SERVICIO:*\n`;

    selectedMembers.forEach((m, idx) => {
      text += `${idx + 1}. *${m.nombre}* - DNI ${m.dni} (${m.rolLabel || m.rol.toUpperCase()})\n`;
      text += `   • ART: ${m.art?.proveedor || 'Prevención ART'} (Póliza Nº ${m.art?.numeroPoliza || 'Vigente'})\n`;
      text += `   • Cláusula de No Repetición: SÍ, a favor del Consorcio/Propietario\n`;
    });

    text += `\n_Emitido automáticamente vía Mudify PRO Enterprise_`;

    navigator.clipboard?.writeText(text);
    onShowToast?.('Texto copiado al portapapeles. Listo para pegar en WhatsApp del cliente o administración.', 'success');
  };

  // ── CÁLCULO DE KPIS Y FILTRADO ──
  const stats = useMemo(() => {
    let choferes = 0;
    let ayudantes = 0;
    let disponibles = 0;
    let enServicio = 0;
    let francos = 0;
    let artOk = 0;

    staffList.forEach(m => {
      if (m.rol === 'chofer') choferes++;
      else ayudantes++;

      if (m.estado === 'disponible') disponibles++;
      else if (m.estado === 'en_servicio') enServicio++;
      else francos++;

      if (m.art?.clausulaNoRepeticion && m.art?.vigente !== false) artOk++;
    });

    const artPct = staffList.length > 0 ? Math.round((artOk / staffList.length) * 100) : 100;

    return {
      total: staffList.length,
      choferes,
      ayudantes,
      disponibles,
      enServicio,
      francos,
      artPct
    };
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(m => {
      if (selectedRoleFilter !== 'todos' && m.rol !== selectedRoleFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'todos' && m.estado !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (m.nombre || '').toLowerCase().includes(q);
        const matchesDni = (m.dni || '').toLowerCase().includes(q);
        const matchesPhone = (m.telefono || '').toLowerCase().includes(q);
        const matchesVeh = (m.vehiculoPatente || '').toLowerCase().includes(q);
        return matchesName || matchesDni || matchesPhone || matchesVeh;
      }
      return true;
    });
  }, [staffList, selectedRoleFilter, selectedStatusFilter, searchQuery]);

  return (
    <div className="nomina-personal-panel">
      {/* ── HEADER ── */}
      <div className="nomina-header">
        <div className="nomina-header-left">
          <div className="nomina-header-tag">
            <span className="material-symbols-outlined header-tag-icon">badge</span>
            <span>Recursos Humanos & Operaciones</span>
          </div>
          <h1 className="nomina-title">Nómina de Personal & Cuadrillas</h1>
          <p className="nomina-subtitle">
            Gestión de choferes, peones de estiba, armadores y embaladores. Control de legajos, coberturas de ART con cláusula de no repetición y asignación a móviles de tu flota.
          </p>
        </div>

        <div className="nomina-header-actions">
          <button
            type="button"
            className="btn-cert-consorcio"
            onClick={handleOpenCertModal}
            title="Generar planilla de cuadrilla con ART para administraciones de edificios y countries"
          >
            <span className="material-symbols-outlined">domain_verification</span>
            <span>Certificado Consorcio / ART</span>
          </button>

          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="btn-alta-personal"
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>Alta de Personal</span>
          </Button>
        </div>
      </div>

      {/* ── KPI METRICS BAR ── */}
      <div className="nomina-kpis-grid">
        {/* KPI 1: Total Nómina */}
        <div className="nomina-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--blue">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Total en Nómina</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{stats.total}</strong>
              <span className="kpi-badge kpi-badge--neutral">Legajos</span>
            </div>
            <span className="kpi-sub">
              {stats.choferes} {stats.choferes === 1 ? 'Chofer' : 'Choferes'} · {stats.ayudantes} Operarios
            </span>
          </div>
        </div>

        {/* KPI 2: Disponibles */}
        <div className="nomina-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--green">
            <span className="material-symbols-outlined">how_to_reg</span>
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Disponibles para Despacho</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{stats.disponibles}</strong>
              <span className="kpi-badge kpi-badge--green">
                <span className="pulse-dot"></span> Listos
              </span>
            </div>
            <span className="kpi-sub">Capacidad operativa inmediata</span>
          </div>
        </div>

        {/* KPI 3: En Servicio */}
        <div className="nomina-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--amber">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">En Mudanza / Ruta</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{stats.enServicio}</strong>
              <span className="kpi-badge kpi-badge--amber">En Viaje</span>
            </div>
            <span className="kpi-sub">{stats.francos} de franco / descanso</span>
          </div>
        </div>

        {/* KPI 4: Cobertura ART */}
        <div className="nomina-kpi-card">
          <div className="kpi-icon-wrap kpi-icon-wrap--shield">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div className="kpi-meta">
            <span className="kpi-label">Cobertura ART al Día</span>
            <div className="kpi-val-row">
              <strong className="kpi-value">{stats.artPct}%</strong>
              <span className="kpi-badge kpi-badge--shield">100% Protegidos</span>
            </div>
            <span className="kpi-sub">Cláusula No Repetición activa</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR DE BÚSQUEDA Y FILTROS ── */}
      <div className="nomina-toolbar">
        {/* Buscador */}
        <div className="nomina-search-wrap">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="nomina-search-input"
            placeholder="Buscar por nombre, DNI, teléfono o móvil asignado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Filtros de Estado */}
        <div className="status-filter-pills">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'disponible', label: 'Disponibles' },
            { id: 'en_servicio', label: 'En Ruta' },
            { id: 'franco', label: 'Francos' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`status-pill-tab ${selectedStatusFilter === f.id ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Selector de Vista (Grid vs Tabla) */}
        <div className="view-mode-toggle">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Vista de Tarjetas"
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Vista de Tabla / Planilla"
          >
            <span className="material-symbols-outlined">table_chart</span>
          </button>
        </div>
      </div>

      {/* ── FILTRO RÁPIDO DE ROLES ── */}
      <div className="roles-filter-bar">
        <button
          type="button"
          className={`role-tab-btn ${selectedRoleFilter === 'todos' ? 'active' : ''}`}
          onClick={() => setSelectedRoleFilter('todos')}
        >
          <span className="material-symbols-outlined">apps</span>
          <span>Todos los Puestos ({staffList.length})</span>
        </button>

        {STAFF_ROLES.map(r => {
          const count = staffList.filter(s => s.rol === r.id).length;
          return (
            <button
              key={r.id}
              type="button"
              className={`role-tab-btn role-tab-btn--${r.color} ${selectedRoleFilter === r.id ? 'active' : ''}`}
              onClick={() => setSelectedRoleFilter(r.id)}
            >
              <span className="material-symbols-outlined">{r.icon}</span>
              <span>{r.shortLabel}</span>
              <span className="role-count-pill">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── CONTENIDO PRINCIPAL: LISTADO O EMPTY STATE ── */}
      {loading ? (
        <div className="nomina-loading-box">
          <span className="material-symbols-outlined spin-icon">sync</span>
          <p>Cargando nómina de personal desde Cloud Firestore...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="nomina-empty-card">
          <div className="empty-icon-wrap">
            <span className="material-symbols-outlined">badge</span>
          </div>
          <h3>Aún no tenés personal registrado en la nómina</h3>
          <p>
            Comenzá dando de alta a tus choferes, peones y armadores para asignarles vehículos, controlar pólizas de ART y emitir certificados para edificios.
          </p>
          <div className="empty-actions-row">
            <Button variant="primary" onClick={handleOpenAdd}>
              <span className="material-symbols-outlined">person_add</span>
              <span>Dar de Alta Primer Operario</span>
            </Button>
            <button type="button" className="btn-seed-defaults" onClick={handleSeedDefaults}>
              <span className="material-symbols-outlined">auto_fix_high</span>
              <span>Cargar Cuadrilla Sugerida (Demo)</span>
            </button>
          </div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="nomina-empty-search">
          <span className="material-symbols-outlined">search_off</span>
          <h4>No se encontraron operarios con los filtros seleccionados</h4>
          <p>Probá cambiando los términos de búsqueda o el filtro de rol.</p>
          <button
            type="button"
            className="btn-reset-filters"
            onClick={() => {
              setSearchQuery('');
              setSelectedRoleFilter('todos');
              setSelectedStatusFilter('todos');
            }}
          >
            Limpiar Filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ══════════════════════════════════════════════════════════
           VISTA 1: GRID DE TARJETAS DE INTEGRANTES
           ══════════════════════════════════════════════════════════ */
        <div className="staff-cards-grid">
          {filteredStaff.map((member) => {
            const roleMeta = STAFF_ROLES.find(r => r.id === member.rol) || STAFF_ROLES[1];
            const cleanPhone = (member.telefono || '').replace(/\D/g, '');
            const waUrl = cleanPhone ? `https://wa.me/549${cleanPhone}?text=${encodeURIComponent(`Hola ${member.nombre}, te contacto desde la coordinación de Mudify para coordinar un servicio de mudanza.`)}` : null;

            return (
              <div
                key={member.id}
                className={`staff-card staff-card--status-${member.estado}`}
              >
                {/* Header de la tarjeta */}
                <div className="staff-card-header">
                  <div className="staff-avatar-col">
                    <div className={`staff-avatar staff-avatar--${roleMeta.color}`}>
                      <span className="avatar-initials">
                        {member.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span className={`staff-status-dot dot--${member.estado}`} title={`Estado: ${member.estado}`}></span>
                    </div>
                  </div>

                  <div className="staff-info-col">
                    <div className="staff-name-row">
                      <h3 className="staff-name">{member.nombre}</h3>
                      <div className="staff-quick-actions">
                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => handleOpenEdit(member)}
                          title="Editar Legajo Completo"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon btn-action-icon--danger"
                          onClick={() => setDeleteConfirmId(member.id)}
                          title="Dar de baja de la nómina"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="staff-role-pill-wrap">
                      <span className={`role-badge role-badge--${roleMeta.color}`}>
                        <span className="material-symbols-outlined">{roleMeta.icon}</span>
                        <span>{roleMeta.shortLabel}</span>
                      </span>
                      <span className={`contract-badge contract-badge--${member.tipoContrato || 'efectivo'}`}>
                        {member.tipoContrato === 'efectivo' ? 'Efectivo' : member.tipoContrato === 'monotributo' ? 'Monotributo' : 'Eventual'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cuerpo de datos operativos */}
                <div className="staff-card-body">
                  {/* Fila DNI y Teléfono */}
                  <div className="staff-meta-row">
                    <div className="meta-item">
                      <span className="meta-label">DNI / Legajo</span>
                      <strong className="meta-value">{member.dni || 'Sin DNI'}</strong>
                    </div>

                    <div className="meta-item">
                      <span className="meta-label">Contacto</span>
                      <div className="phone-contact-wrap">
                        <strong className="meta-value">{member.telefono || 'Sin teléfono'}</strong>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="wa-link-btn"
                            title="Abrir chat de WhatsApp"
                          >
                            <span className="material-symbols-outlined">chat</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Móvil Asignado */}
                  <div className="staff-vehicle-badge">
                    <span className="material-symbols-outlined veh-icon">directions_bus</span>
                    <div className="veh-text">
                      <span className="veh-label">Móvil Asignado:</span>
                      <strong className="veh-plate">{member.vehiculoPatente || 'Cuadrilla General'}</strong>
                    </div>
                  </div>

                  {/* Cobertura de ART */}
                  <div className="staff-art-badge">
                    <div className="art-left">
                      <span className="material-symbols-outlined art-icon">verified_user</span>
                      <div className="art-info">
                        <strong>{member.art?.proveedor || 'Prevención ART'}</strong>
                        <span>Póliza: {member.art?.numeroPoliza || 'Vigente'}</span>
                      </div>
                    </div>
                    {member.art?.clausulaNoRepeticion && (
                      <span className="clausula-chip" title="Cláusula de no repetición a favor de consorcios y countries">
                        No Repetición ✓
                      </span>
                    )}
                  </div>

                  {/* Habilitación LINTI si es Chofer */}
                  {member.rol === 'chofer' && member.licencia && (
                    <div className="staff-license-row">
                      <span className="material-symbols-outlined">badge</span>
                      <span>Licencia: <strong>{member.licencia.numero || member.dni}</strong> ({member.licencia.categoria || 'Cat. Cargas'})</span>
                    </div>
                  )}

                  {/* Módulo de Conexión a App Móvil Android (Solo Choferes) */}
                  {member.rol === 'chofer' && (
                    <div className={`driver-app-status-box ${member.appLinked ? 'driver-app-status-box--linked' : 'driver-app-status-box--pending'}`}>
                      <div className="driver-app-meta">
                        <div className="app-status-indicator">
                          <span className={`status-led ${member.appLinked ? 'status-led--on' : 'status-led--off'}`}></span>
                          <strong>App Android Mudancero:</strong>
                        </div>
                        <span className={`app-badge-pill ${member.appLinked ? 'app-badge-pill--linked' : 'app-badge-pill--pending'}`}>
                          {member.appLinked ? '✓ Habilitado & Móvil OK' : '🟡 Pendiente de Vinculación'}
                        </span>
                      </div>

                      <div className="driver-app-actions-row">
                        <button
                          type="button"
                          className="btn-app-action btn-app-action--sync"
                          onClick={() => handleProvisionDriver(member)}
                          disabled={provisioningId === member.id}
                          title="Inyectar móvil de flota, seguro de carga y habilitación inmediata en Firestore para la app Android"
                        >
                          <span className={`material-symbols-outlined ${provisioningId === member.id ? 'spin-icon' : ''}`}>
                            {provisioningId === member.id ? 'sync' : 'cloud_sync'}
                          </span>
                          <span>{provisioningId === member.id ? 'Sincronizando...' : (member.appLinked ? 'Actualizar Móvil' : 'Habilitar en App')}</span>
                        </button>

                        <button
                          type="button"
                          className="btn-app-action btn-app-action--cred"
                          onClick={() => handleOpenDriverCred(member)}
                          title="Ver credenciales de acceso y enviar invitación por WhatsApp"
                        >
                          <span className="material-symbols-outlined">send_to_mobile</span>
                          <span>Credencial & WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Remuneración y Modalidad */}
                  {member.remuneracion && (
                    <div className="staff-salary-row">
                      <span className="salary-label">
                        {member.remuneracion.modalidad === 'fijo_mensual'
                          ? 'Sueldo Fijo'
                          : member.remuneracion.modalidad === 'jornal_diario'
                          ? 'Por Jornal'
                          : member.remuneracion.modalidad === 'por_hora'
                          ? 'Por Hora'
                          : 'Por Viaje'}:
                      </span>
                      <strong className="salary-amount">
                        ${Number(member.remuneracion.monto || 0).toLocaleString('es-AR')} ARS
                      </strong>
                    </div>
                  )}
                </div>

                {/* Footer de Estado Rápido */}
                <div className="staff-card-footer">
                  <div className="status-dropdown-wrap">
                    <label className="status-label">Estado:</label>
                    <select
                      className={`status-select status-select--${member.estado}`}
                      value={member.estado}
                      onChange={(e) => handleQuickStatusChange(member, e.target.value)}
                    >
                      <option value="disponible">✓ Disponible</option>
                      <option value="en_servicio">🚚 En Servicio</option>
                      <option value="franco">🏖️ De Franco</option>
                      <option value="licencia">📋 Licencia</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-edit-link"
                    onClick={() => handleOpenEdit(member)}
                  >
                    <span>Ver Legajo</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
           VISTA 2: TABLA MODERNA DE PLANILLA
           ══════════════════════════════════════════════════════════ */
        <div className="staff-table-card">
          <div className="table-responsive">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Operario / Legajo</th>
                  <th>Puesto & Rol</th>
                  <th>Contacto & WhatsApp</th>
                  <th>Estado</th>
                  <th>Móvil Asignado</th>
                  <th>Póliza ART</th>
                  <th>App Android</th>
                  <th>Remuneración</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => {
                  const roleMeta = STAFF_ROLES.find(r => r.id === member.rol) || STAFF_ROLES[1];
                  const cleanPhone = (member.telefono || '').replace(/\D/g, '');
                  const waUrl = cleanPhone ? `https://wa.me/549${cleanPhone}` : null;

                  return (
                    <tr key={member.id}>
                      {/* Operario */}
                      <td>
                        <div className="table-staff-cell">
                          <div className={`table-avatar table-avatar--${roleMeta.color}`}>
                            {member.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <div className="table-staff-meta">
                            <strong>{member.nombre}</strong>
                            <span>DNI {member.dni}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td>
                        <span className={`role-badge role-badge--${roleMeta.color}`}>
                          <span className="material-symbols-outlined">{roleMeta.icon}</span>
                          <span>{roleMeta.shortLabel}</span>
                        </span>
                      </td>

                      {/* Contacto */}
                      <td>
                        <div className="table-phone-cell">
                          <span>{member.telefono || '-'}</span>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-wa-icon"
                              title="Chatear por WhatsApp"
                            >
                              <span className="material-symbols-outlined">chat</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td>
                        <select
                          className={`status-select-sm status-select--${member.estado}`}
                          value={member.estado}
                          onChange={(e) => handleQuickStatusChange(member, e.target.value)}
                        >
                          <option value="disponible">Disponible</option>
                          <option value="en_servicio">En Servicio</option>
                          <option value="franco">Franco</option>
                          <option value="licencia">Licencia</option>
                        </select>
                      </td>

                      {/* Móvil */}
                      <td>
                        <span className="table-veh-tag">
                          {member.vehiculoPatente || 'Sin Asignar'}
                        </span>
                      </td>

                      {/* ART */}
                      <td>
                        <div className="table-art-cell">
                          <strong>{member.art?.proveedor || 'ART'}</strong>
                          <span className="table-art-sub">
                            {member.art?.clausulaNoRepeticion ? 'Cláusula OK' : 'Estándar'}
                          </span>
                        </div>
                      </td>

                      {/* App Android */}
                      <td>
                        {member.rol === 'chofer' ? (
                          <div className="table-app-status-cell">
                            <span className={`table-app-tag ${member.appLinked ? 'table-app-tag--linked' : 'table-app-tag--pending'}`}>
                              {member.appLinked ? '✓ Habilitada' : '🟡 Pendiente'}
                            </span>
                            <button
                              type="button"
                              className="table-btn-cred"
                              onClick={() => handleOpenDriverCred(member)}
                              title="Credencial y Acceso"
                            >
                              <span className="material-symbols-outlined">send_to_mobile</span>
                            </button>
                          </div>
                        ) : (
                          <span className="table-app-tag--na">No aplica</span>
                        )}
                      </td>

                      {/* Remuneración */}
                      <td>
                        <strong>${Number(member.remuneracion?.monto || 0).toLocaleString('es-AR')}</strong>
                        <span className="table-rem-sub">
                          {member.remuneracion?.modalidad === 'fijo_mensual' ? '/ mes' : '/ jornal'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="btn-table-action"
                            onClick={() => handleOpenEdit(member)}
                            title="Editar Legajo"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn-table-action btn-table-action--danger"
                            onClick={() => setDeleteConfirmId(member.id)}
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: ALTA / EDICIÓN DE LEGAJO DE OPERARIO
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={editingMember ? `Editar Legajo: ${editingMember.nombre}` : 'Alta de Nuevo Integrante de Nómina'}
        subtitle="Completá la información personal, asignación de puesto, vehículo de flota y cobertura de ART."
        maxWidth="780px"
      >
        <form onSubmit={handleSaveMember} className="member-form">
          {/* Bloque 1: Datos Personales */}
          <div className="form-section-card">
            <div className="form-section-title">
              <span className="material-symbols-outlined">person</span>
              <span>1. Datos Personales & Contacto</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="mem-name">Nombre y Apellido *</label>
                <input
                  id="mem-name"
                  type="text"
                  placeholder="Ej: Carlos Mendoza"
                  value={formData.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-dni">DNI / CUIL *</label>
                <input
                  id="mem-dni"
                  type="text"
                  placeholder="Ej: 34.892.110"
                  value={formData.dni}
                  onChange={(e) => handleFormChange('dni', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-phone">Teléfono / WhatsApp *</label>
                <input
                  id="mem-phone"
                  type="tel"
                  placeholder="Ej: 11-4509-8812"
                  value={formData.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-email">Correo Electrónico (Opcional)</label>
                <input
                  id="mem-email"
                  type="email"
                  placeholder="Ej: operario@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Puesto, Operatoria y Móvil */}
          <div className="form-section-card">
            <div className="form-section-title">
              <span className="material-symbols-outlined">work</span>
              <span>2. Puesto, Operatoria & Móvil Asignado</span>
            </div>

            <div className="form-grid-2">
              {/* Rol */}
              <div className="form-group">
                <label htmlFor="mem-role">Puesto / Especialidad *</label>
                <select
                  id="mem-role"
                  value={formData.rol}
                  onChange={(e) => handleFormChange('rol', e.target.value)}
                >
                  {STAFF_ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Contratación */}
              <div className="form-group">
                <label htmlFor="mem-contract">Modalidad de Contratación *</label>
                <select
                  id="mem-contract"
                  value={formData.tipoContrato}
                  onChange={(e) => handleFormChange('tipoContrato', e.target.value)}
                >
                  <option value="efectivo">Relación de Dependencia (Efectivo)</option>
                  <option value="monotributo">Monotributista / Factura Propia</option>
                  <option value="eventual">Eventual por Jornal / Mudanza</option>
                </select>
              </div>

              {/* Estado Inicial */}
              <div className="form-group">
                <label htmlFor="mem-status">Estado Operativo Inicial</label>
                <select
                  id="mem-status"
                  value={formData.estado}
                  onChange={(e) => handleFormChange('estado', e.target.value)}
                >
                  <option value="disponible">Disponible para Despacho</option>
                  <option value="en_servicio">En Mudanza / En Ruta</option>
                  <option value="franco">De Franco / Descanso</option>
                  <option value="licencia">Licencia Médica / Ausente</option>
                </select>
              </div>

              {/* Asignación a Móvil */}
              <div className="form-group">
                <label htmlFor="mem-veh">Móvil de Flota Asignado</label>
                <select
                  id="mem-veh"
                  value={formData.vehiculoAsignadoId}
                  onChange={(e) => handleFormChange('vehiculoAsignadoId', e.target.value)}
                >
                  <option value="sin_asignar">Sin Asignación Fija (Cuadrilla / Base)</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      Móvil {v.patente} — {v.marca || ''} {v.modelo || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <small className="field-hint" style={{ marginTop: '8px', display: 'block' }}>
              Asocia este operario al cronograma y salidas del móvil seleccionado.
            </small>
          </div>

          {/* Bloque 3: ART & Seguridad Laboral (Exigido en Edificios) */}
          <div className="form-section-card">
            <div className="form-section-title">
              <span className="material-symbols-outlined">shield</span>
              <span>3. Cobertura de ART & Cláusula de No Repetición</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="mem-art-prov">Compañía de ART *</label>
                <input
                  id="mem-art-prov"
                  type="text"
                  list="art-list"
                  placeholder="Ej: Prevención ART"
                  value={formData.artProveedor}
                  onChange={(e) => handleFormChange('artProveedor', e.target.value)}
                  required
                />
                <datalist id="art-list">
                  {ART_COMPANIES.map(comp => (
                    <option key={comp} value={comp} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label htmlFor="mem-art-pol">Nº de Póliza de ART *</label>
                <input
                  id="mem-art-pol"
                  type="text"
                  placeholder="Ej: ART-992014-X"
                  value={formData.artPoliza}
                  onChange={(e) => handleFormChange('artPoliza', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mem-art-venc">Vencimiento Cobertura</label>
                <input
                  id="mem-art-venc"
                  type="date"
                  value={formData.artVencimiento}
                  onChange={(e) => handleFormChange('artVencimiento', e.target.value)}
                />
              </div>
            </div>

            {/* Switch de Cláusula de No Repetición */}
            <div className="art-switch-box">
              <div className="art-switch-meta">
                <strong>Cláusula de No Repetición Habilitada</strong>
                <span>
                  Indispensable para autorizar el ingreso de cuadrillas a edificios de propiedad horizontal, countries y barrios cerrados.
                </span>
              </div>
              <label className="modern-switch-wrapper">
                <div
                  className={`modern-switch ${formData.artClausulaNoRepeticion ? 'modern-switch--on' : ''}`}
                  onClick={() => handleFormChange('artClausulaNoRepeticion', !formData.artClausulaNoRepeticion)}
                >
                  <span className="switch-thumb"></span>
                </div>
                <span className={`switch-state-text ${formData.artClausulaNoRepeticion ? 'text-active' : ''}`}>
                  {formData.artClausulaNoRepeticion ? 'Habilitada ✓' : 'Inactiva'}
                </span>
              </label>
            </div>
          </div>

          {/* Bloque 4: Datos de Licencia LINTI (Solo si es Chofer) */}
          {formData.rol === 'chofer' && (
            <div className="form-section-card form-section-card--driver">
              <div className="form-section-title">
                <span className="material-symbols-outlined">local_shipping</span>
                <span>4. Habilitación de Conducir & LINTI (Chofer)</span>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="mem-lic-num">Nº Registro de Conducir</label>
                  <input
                    id="mem-lic-num"
                    type="text"
                    placeholder="Ej: BA-34892110"
                    value={formData.licenciaNumero}
                    onChange={(e) => handleFormChange('licenciaNumero', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mem-lic-cat">Categoría Habilitada</label>
                  <select
                    id="mem-lic-cat"
                    value={formData.licenciaCategoria}
                    onChange={(e) => handleFormChange('licenciaCategoria', e.target.value)}
                  >
                    <option value="B1 / Utilitarios hasta 3500kg">B1 / Utilitarios hasta 3500kg</option>
                    <option value="C1 / Camión sin acoplado hasta 12000kg">C1 / Camión hasta 12000kg</option>
                    <option value="C2 / LINTI Cargas Generales">C2 / LINTI Cargas Generales</option>
                    <option value="E1 / Camión con Remolque">E1 / Camión con Remolque</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="mem-lic-venc">Vencimiento Licencia / LINTI</label>
                  <input
                    id="mem-lic-venc"
                    type="date"
                    value={formData.licenciaVencimiento}
                    onChange={(e) => handleFormChange('licenciaVencimiento', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bloque 5: Remuneración y Pagos */}
          <div className="form-section-card">
            <div className="form-section-title">
              <span className="material-symbols-outlined">payments</span>
              <span>5. Remuneración & Datos Bancarios</span>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="mem-rem-mod">Esquema de Pago</label>
                <select
                  id="mem-rem-mod"
                  value={formData.remuneracionModalidad}
                  onChange={(e) => handleFormChange('remuneracionModalidad', e.target.value)}
                >
                  <option value="fijo_mensual">Sueldo Fijo Mensual</option>
                  <option value="jornal_diario">Por Jornal Diario</option>
                  <option value="por_viaje">Por Viaje Realizado</option>
                  <option value="por_hora">Por Hora de Estiba</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="mem-rem-val">Monto Acordado (ARS) *</label>
                <div className="currency-field-wrap">
                  <span className="curr-sym">$</span>
                  <input
                    id="mem-rem-val"
                    type="number"
                    min="0"
                    step="500"
                    value={formData.remuneracionMonto}
                    onChange={(e) => handleFormChange('remuneracionMonto', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mem-rem-alias">Alias CBU / CVU MercadoPago</label>
                <input
                  id="mem-rem-alias"
                  type="text"
                  placeholder="Ej: nombre.apellido.mp"
                  value={formData.remuneracionAlias}
                  onChange={(e) => handleFormChange('remuneracionAlias', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label htmlFor="mem-obs">Notas Internas & Observaciones</label>
              <textarea
                id="mem-obs"
                rows="2"
                placeholder="Observaciones de estiba, manejo de herramientas, disponibilidad horaria..."
                value={formData.observaciones}
                onChange={(e) => handleFormChange('observaciones', e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción del Modal */}
          <div className="modal-actions-bar">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setEditModalOpen(false)}
            >
              Cancelar
            </button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              <span className="material-symbols-outlined">save</span>
              <span>{saving ? 'Guardando en Firestore...' : (editingMember ? 'Actualizar Legajo' : 'Registrar Operario')}</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL: CERTIFICADO DE CUADRILLA PARA CONSORCIOS / EDIFICIOS
         ══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title="Certificado de Cuadrilla y ART para Consorcios & Countries"
        subtitle="Generá la nómina oficial con membrete y cláusula de no repetición requerida para el ingreso a edificios."
        maxWidth="840px"
      >
        <div className="cert-modal-body">
          {/* Configuración del Servicio */}
          <div className="cert-config-box">
            <div className="cert-input-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="cert-dest">Edificio / Consorcio / Domicilio de Destino *</label>
                <input
                  id="cert-dest"
                  type="text"
                  placeholder="Ej: Av. del Libertador 2450, Piso 8, CABA — Consorcio Edificio Torre"
                  value={certDestination}
                  onChange={(e) => setCertDestination(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="cert-date">Fecha de la Mudanza</label>
                <input
                  id="cert-date"
                  type="date"
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                />
              </div>
            </div>

            {/* Selector de Operarios que van a este viaje */}
            <div className="cert-staff-selection">
              <span className="selection-label">Seleccioná los integrantes de la cuadrilla asignada:</span>
              <div className="cert-staff-chips">
                {staffList.map(member => {
                  const isSelected = certSelectedStaffIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`cert-staff-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleStaffInCert(member.id)}
                    >
                      <span className="material-symbols-outlined">
                        {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <strong>{member.nombre}</strong>
                      <span className="chip-role">({member.rolLabel || member.rol})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* VISTA PREVIA IMPRIMIBLE DEL CERTIFICADO CON MEMBRETE */}
          <div className="cert-printable-document" id="printable-crew-sheet">
            {/* Membrete Oficial */}
            <div className="doc-header">
              <div className="doc-brand">
                <div className="doc-brand-icon">
                  <span className="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <h2 className="doc-company-name">
                    {profile?.name || user?.displayName || 'Empresa de Mudanzas Oficial'}
                  </h2>
                  <span className="doc-sub">
                    Mudify PRO Enterprise · Red Certificada de Transporte de Cargas
                  </span>
                </div>
              </div>
              <div className="doc-seal">
                <span className="material-symbols-outlined">verified</span>
                <span>Póliza ART Verificada</span>
              </div>
            </div>

            <div className="doc-divider"></div>

            <h3 className="doc-title">
              CONSTANCIA DE COBERTURA DE PERSONAL Y CLÁUSULA DE NO REPETICIÓN
            </h3>

            <p className="doc-intro">
              Por la presente se certifica que la cuadrilla de operarios abajo individualizada se encuentra formalmente registrada y amparada por las pólizas de <strong>Seguro de Accidentes de Trabajo (ART)</strong> y Responsabilidad Civil, contando con <strong>Cláusula de No Repetición</strong> expresa a favor del consorcio, administración o propietarios del inmueble sito en:
            </p>

            <div className="doc-destination-box">
              <span className="material-symbols-outlined">location_on</span>
              <div>
                <strong>Destino de la Operación:</strong>
                <p>{certDestination || 'Consorcio / Domicilio a designar'}</p>
                <small>Fecha autorizada: {certDate}</small>
              </div>
            </div>

            {/* Tabla de Integrantes */}
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Nombre y Apellido</th>
                  <th>DNI / Legajo</th>
                  <th>Puesto / Función</th>
                  <th>Aseguradora de ART</th>
                  <th>Nº de Póliza</th>
                  <th>Cláusula No Repetición</th>
                </tr>
              </thead>
              <tbody>
                {staffList.filter(s => certSelectedStaffIds.includes(s.id)).map((m, idx) => (
                  <tr key={m.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{m.nombre}</strong></td>
                    <td>{m.dni}</td>
                    <td>{m.rolLabel || m.rol}</td>
                    <td>{m.art?.proveedor || 'Prevención ART'}</td>
                    <td>{m.art?.numeroPoliza || 'ART-992014-X'}</td>
                    <td>
                      <span className="doc-check-tag">HABILITADA ✓</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="doc-legal-footer">
              <p>
                Se deja expresa constancia de que los dependientes y contratistas detallados cuentan con los exámenes médicos periódicos y aptitud física vigente conforme a la Ley Nacional 24.557 de Riesgos del Trabajo.
              </p>
              <div className="doc-signatures">
                <div className="signature-box">
                  <div className="sig-line"></div>
                  <span>Firma & Sello de la Empresa</span>
                  <small>{profile?.name || user?.displayName || 'Titular / Apoderado'}</small>
                </div>
                <div className="signature-box">
                  <div className="sig-line"></div>
                  <span>Recepción Administración / Seguridad</span>
                  <small>Día y hora de ingreso</small>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones del Certificado */}
          <div className="cert-modal-actions">
            <button
              type="button"
              className="btn-cert-action btn-cert-action--wa"
              onClick={handleCopyCertWhatsApp}
            >
              <span className="material-symbols-outlined">chat</span>
              <span>Copiar Texto para WhatsApp</span>
            </button>

            <button
              type="button"
              className="btn-cert-action btn-cert-action--print"
              onClick={handlePrintCertificate}
            >
              <span className="material-symbols-outlined">print</span>
              <span>Imprimir / Exportar PDF</span>
            </button>

            <button
              type="button"
              className="btn-cert-close"
              onClick={() => setCertModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════════
          MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
         ══════════════════════════════════════════════════════════ */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Confirmar Baja de Personal"
          maxWidth="460px"
        >
          <div className="confirm-delete-box">
            <span className="material-symbols-outlined delete-warning-icon">warning</span>
            <p>
              ¿Estás seguro de que deseás dar de baja este integrante de tu nómina? Se eliminará su legajo y asignación a móviles de tu flota.
            </p>
            <div className="confirm-delete-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
              <Button
                variant="primary"
                onClick={() => {
                  const m = staffList.find(s => s.id === deleteConfirmId);
                  if (m) handleDeleteMember(m.id, m.nombre);
                }}
                style={{ background: '#e11d48', borderColor: '#be123c' }}
              >
                Dar de Baja Definitiva
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL: CREDENCIAL Y ACCESO APP ANDROID PARA CHOFER
         ══════════════════════════════════════════════════════════ */}
      {selectedDriverForCred && (
        <Modal
          isOpen={credModalOpen}
          onClose={() => setCredModalOpen(false)}
          title={`Credencial Móvil: ${selectedDriverForCred.nombre}`}
          subtitle="Aprovisioná la cuenta en Firestore para la app Android y compartí las instrucciones de acceso al chofer."
          maxWidth="640px"
        >
          <div className="cred-modal-body">
            {/* Tarjeta de Resumen de Credencial */}
            <div className="driver-cred-card">
              <div className="cred-card-header">
                <div className="cred-brand-icon">
                  <span className="material-symbols-outlined">directions_bus</span>
                </div>
                <div>
                  <h4 className="cred-driver-name">{selectedDriverForCred.nombre}</h4>
                  <span className="cred-driver-role">Chofer Oficial de Flota · {profile?.name || user?.displayName || 'Empresa de Mudanzas'}</span>
                </div>
                <div className={`cred-status-pill ${selectedDriverForCred.appLinked ? 'cred-status-pill--linked' : 'cred-status-pill--pending'}`}>
                  {selectedDriverForCred.appLinked ? '✓ Habilitado' : '🟡 Pendiente'}
                </div>
              </div>

              <div className="cred-grid-details">
                <div className="cred-detail-item">
                  <span className="cred-label">Email de Acceso (Google):</span>
                  <strong className="cred-val">{selectedDriverForCred.email || '⚠️ Sin email registrado'}</strong>
                </div>

                <div className="cred-detail-item">
                  <span className="cred-label">Móvil de Flota Asignado:</span>
                  <strong className="cred-val">{selectedDriverForCred.vehiculoPatente || 'Móvil de Flota Central'}</strong>
                </div>

                <div className="cred-detail-item">
                  <span className="cred-label">Póliza de ART:</span>
                  <strong className="cred-val">{selectedDriverForCred.art?.proveedor || 'Prevención ART'} (Póliza Nº {selectedDriverForCred.art?.numeroPoliza || 'Vigente'})</strong>
                </div>

                <div className="cred-detail-item">
                  <span className="cred-label">Gestión de Tarifas:</span>
                  <strong className="cred-val text-green">🔒 Bloqueadas (Gestionadas por la Empresa)</strong>
                </div>
              </div>
            </div>

            {/* Mensaje listo para WhatsApp */}
            <div className="cred-whatsapp-box">
              <div className="wa-box-header">
                <span className="material-symbols-outlined wa-header-icon">chat</span>
                <strong>Mensaje de Invitación & Credenciales listo para WhatsApp:</strong>
              </div>
              <pre className="wa-text-preview">
{`🚚 *MUDIFY CONDUCCIÓN - CREDENCIAL DE ACCESO*
Hola *${selectedDriverForCred.nombre}*, fuiste dado de alta como Chofer Oficial en la flota de *${profile?.name || user?.displayName || 'Mudanzas Oficial'}*.

📲 *Descargá la App Android Mudify Conductor:*
https://play.google.com/store/apps/details?id=com.mudify.mudancero

🔑 *Acceso directo:*
Ingresá con tu cuenta de Google: *${selectedDriverForCred.email || 'tu cuenta de Gmail'}*

🚛 *Móvil de Flota Asignado:*
*${selectedDriverForCred.vehiculoPatente || 'Móvil Asignado'}*
• Seguro de Carga y ART: Habilitados
• Tarifas: Administradas centralmente por la empresa (sin cobros a tu cargo)

Tus viajes y mudanzas te llegarán automáticamente a la pantalla de la app con mapa y navegación.`}
              </pre>
            </div>

            {/* Acciones */}
            <div className="cred-modal-actions">
              <Button
                variant="primary"
                onClick={() => handleProvisionDriver(selectedDriverForCred)}
                disabled={provisioningId === selectedDriverForCred.id}
                style={{ background: '#2563eb' }}
              >
                <span className={`material-symbols-outlined ${provisioningId === selectedDriverForCred.id ? 'spin-icon' : ''}`}>
                  {provisioningId === selectedDriverForCred.id ? 'sync' : 'cloud_sync'}
                </span>
                <span>{selectedDriverForCred.appLinked ? 'Re-sincronizar en Firestore' : 'Habilitar Chofer en Firestore'}</span>
              </Button>

              <button
                type="button"
                className="btn-open-wa"
                onClick={() => {
                  const cleanPhone = (selectedDriverForCred.telefono || '').replace(/\D/g, '');
                  const text = `🚚 *MUDIFY CONDUCCIÓN - CREDENCIAL DE ACCESO*\nHola *${selectedDriverForCred.nombre}*, fuiste dado de alta como Chofer Oficial en la flota de *${profile?.name || user?.displayName || 'Mudanzas Oficial'}*.\n\n📲 *Descargá la App Android Mudify Conductor:*\nhttps://play.google.com/store/apps/details?id=com.mudify.mudancero\n\n🔑 *Acceso directo:*\nIngresá con tu cuenta de Google: *${selectedDriverForCred.email || 'tu cuenta de Gmail'}*\n\n🚛 *Móvil de Flota Asignado:*\n*${selectedDriverForCred.vehiculoPatente || 'Móvil Asignado'}*\n• Seguro de Carga y ART: Habilitados\n• Tarifas: Administradas centralmente por la empresa\n\nTus viajes te llegarán automáticamente a la app.`;
                  if (cleanPhone) {
                    window.open(`https://wa.me/549${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                  } else {
                    navigator.clipboard?.writeText(text);
                    onShowToast?.('Texto copiado al portapapeles. Listo para enviar por WhatsApp.', 'success');
                  }
                }}
              >
                <span className="material-symbols-outlined">chat</span>
                <span>Enviar por WhatsApp</span>
              </button>

              <button
                type="button"
                className="btn-copy-wa"
                onClick={() => {
                  const text = `🚚 *MUDIFY CONDUCCIÓN - CREDENCIAL DE ACCESO*\nHola *${selectedDriverForCred.nombre}*, fuiste dado de alta como Chofer Oficial en la flota de *${profile?.name || user?.displayName || 'Mudanzas Oficial'}*.\n\n📲 *Descargá la App Android Mudify Conductor:*\nhttps://play.google.com/store/apps/details?id=com.mudify.mudancero\n\n🔑 *Acceso directo:*\nIngresá con tu cuenta de Google: *${selectedDriverForCred.email || 'tu cuenta de Gmail'}*\n\n🚛 *Móvil de Flota Asignado:*\n*${selectedDriverForCred.vehiculoPatente || 'Móvil Asignado'}*\n• Seguro de Carga y ART: Habilitados\n• Tarifas: Administradas centralmente por la empresa\n\nTus viajes te llegarán automáticamente a la app.`;
                  navigator.clipboard?.writeText(text);
                  onShowToast?.('Invitación copiada al portapapeles.', 'success');
                }}
              >
                <span className="material-symbols-outlined">content_copy</span>
                <span>Copiar</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
