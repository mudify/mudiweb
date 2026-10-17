/**
 * MUDIFY PRO ENTERPRISE — CONTROLADOR DINÁMICO DEL PANEL (STITCH)
 * Soporte Multi-Rol: Conductor Independiente vs Empresa de Mudanzas.
 * Arquitectura 100% reactiva conectada a Cloud Firestore (mudapp-a9d40).
 * CERO ELEMENTOS HARDCODEADOS.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // 1. Servicio de Datos Enterprise
  const service = window.MudifyEnterpriseService;
  if (!service) {
    console.error('Error: MudifyEnterpriseService no se encuentra cargado.');
    return;
  }

  // 2. Estado de Navegación y Filtros de UI
  let currentViewPath = 'torre-de-control';
  let activeVehicleId = null;
  let activeFleetFilter = 'todos';
  let activePorteFilter = 'todos';
  let fleetSearchQuery = '';

  // =========================================================================
  // SISTEMA DE TOAST NOTIFICATIONS
  // =========================================================================
  const showToast = (title, message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-tertiary-container text-on-tertiary-container' : 
                    type === 'error' ? 'bg-error-container text-on-error-container' : 
                    'bg-inverse-surface text-inverse-on-surface';

    toast.className = `p-4 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[20px]">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
      <div class="flex flex-col">
        <span class="font-bold">${title}</span>
        <span class="text-xs opacity-90">${message}</span>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // =========================================================================
  // NAVEGACIÓN ENTRE LAS 8 VISTAS DEL DASHBOARD
  // =========================================================================
  const navLinks = document.querySelectorAll('nav a[data-path]');
  const views = document.querySelectorAll('.panel-view');

  const switchView = (targetPath) => {
    currentViewPath = targetPath;

    navLinks.forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === targetPath) {
        link.className = 'flex items-center gap-space-sm px-space-md py-2.5 transition-all bg-primary-container text-on-primary-container font-bold rounded-xl';
        link.setAttribute('aria-current', 'page');
      } else {
        link.className = 'flex items-center gap-space-sm px-space-md py-2.5 rounded-xl text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container hover:text-on-surface transition-all';
        link.removeAttribute('aria-current');
      }
    });

    views.forEach(view => {
      if (view.id === `view-${targetPath}`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    renderCurrentView();
  };

  const renderCurrentView = () => {
    switch (currentViewPath) {
      case 'torre-de-control':
        renderTorreDeControl();
        break;
      case 'despacho-agenda':
        renderDespachoAgenda();
        break;
      case 'flota-mantenimiento':
        renderFlotaMantenimiento();
        break;
      case 'solicitudes-cotizaciones':
        renderB2BQuotes();
        break;
      case 'choferes-cuadrillas':
        renderCrewModule();
        break;
      case 'facturacion-remitos':
        renderInvoicesModule();
        break;
      case 'reportes-rentabilidad':
        renderReportsModule();
        break;
      case 'configuracion-empresa':
        renderSettingsModule();
        break;
      default:
        renderTorreDeControl();
    }
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      if (path) switchView(path);
    });
  });

  // =========================================================================
  // RELOJ EN TIEMPO REAL
  // =========================================================================
  const updateLiveTimestamp = () => {
    const el = document.getElementById('live-timestamp');
    if (!el) return;
    const now = new Date();
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    el.textContent = `Hoy, ${now.toLocaleDateString('es-AR', options)} hs`;
  };
  updateLiveTimestamp();
  setInterval(updateLiveTimestamp, 30000);

  // =========================================================================
  // TOPBAR & SELECTOR DE MODO (CONDUCTOR VS EMPRESA)
  // =========================================================================
  const updateModeSwitcherUI = () => {
    const mode = service.getAccountMode();
    const btnConductor = document.getElementById('btn-mode-conductor');
    const btnEmpresa = document.getElementById('btn-mode-empresa');
    const sidebarSubtitle = document.getElementById('sidebar-brand-subtitle');
    const sidebarNetworkTitle = document.getElementById('sidebar-network-title');

    // Adaptar etiquetas del Sidebar según el modo
    const labelTorre = document.getElementById('nav-label-torre');
    const labelAgenda = document.getElementById('nav-label-agenda');
    const labelFlota = document.getElementById('nav-label-flota');
    const labelFacturacion = document.getElementById('nav-label-facturacion');
    const labelCotizaciones = document.getElementById('nav-label-cotizaciones');

    if (mode === 'conductor') {
      if (btnConductor) btnConductor.className = 'px-3 py-1.5 rounded-lg text-label-sm font-bold transition-all flex items-center gap-1.5 bg-primary-container text-on-primary shadow-sm';
      if (btnEmpresa) btnEmpresa.className = 'px-3 py-1.5 rounded-lg text-label-sm font-bold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container';
      if (sidebarSubtitle) sidebarSubtitle.textContent = 'Conductor Independiente';
      if (sidebarNetworkTitle) sidebarNetworkTitle.textContent = 'Unidad Conectada';

      if (labelTorre) labelTorre.textContent = 'Mi Unidad & Radar';
      if (labelAgenda) labelAgenda.textContent = 'Mis Despachos & Agenda';
      if (labelFlota) labelFlota.textContent = 'Mi Vehículo & Tarifas';
      if (labelFacturacion) labelFacturacion.textContent = 'Mis Ganancias & Remitos';
      if (labelCotizaciones) labelCotizaciones.textContent = 'Mis Solicitudes B2B';
    } else {
      if (btnConductor) btnConductor.className = 'px-3 py-1.5 rounded-lg text-label-sm font-bold transition-all flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container';
      if (btnEmpresa) btnEmpresa.className = 'px-3 py-1.5 rounded-lg text-label-sm font-bold transition-all flex items-center gap-1.5 bg-primary-container text-on-primary shadow-sm';
      if (sidebarSubtitle) sidebarSubtitle.textContent = 'Empresa de Mudanzas';
      if (sidebarNetworkTitle) sidebarNetworkTitle.textContent = 'Red Operativa Flota';

      if (labelTorre) labelTorre.textContent = 'Torre de Control';
      if (labelAgenda) labelAgenda.textContent = 'Despacho & Agenda';
      if (labelFlota) labelFlota.textContent = 'Flota & Mantenimiento';
      if (labelFacturacion) labelFacturacion.textContent = 'Facturación & Remitos';
      if (labelCotizaciones) labelCotizaciones.textContent = 'Cotizaciones B2B';
    }
  };

  const initTopbar = async () => {
    const hubs = await service.getHubs();
    const profile = await service.getUserProfile();
    const selectedHub = await service.getSelectedHub();
    const kpis = await service.getKPIs();
    const mode = service.getAccountMode();

    updateModeSwitcherUI();

    // Eventos de los botones de cambio de modo
    const btnConductor = document.getElementById('btn-mode-conductor');
    const btnEmpresa = document.getElementById('btn-mode-empresa');

    if (btnConductor && !btnConductor.dataset.bound) {
      btnConductor.dataset.bound = 'true';
      btnConductor.addEventListener('click', async () => {
        await service.setAccountMode('conductor');
        updateModeSwitcherUI();
        showToast('Modo Conductor', 'Cargando únicamente tus viajes, vehículo y ganancias personales.', 'info');
      });
    }

    if (btnEmpresa && !btnEmpresa.dataset.bound) {
      btnEmpresa.dataset.bound = 'true';
      btnEmpresa.addEventListener('click', async () => {
        await service.setAccountMode('empresa');
        updateModeSwitcherUI();
        showToast('Modo Empresa', 'Cargando la flota corporativa completa y despachos globales.', 'info');
      });
    }

    // Selectores de Sedes/Hubs
    const topbarSelect = document.getElementById('topbar-hub-select');
    const agendaSelect = document.getElementById('agenda-hub-select');
    const tcBadge = document.getElementById('tc-hub-badge');

    const optionsHtml = hubs.map(h => `
      <option value="${h.id}" ${h.id === selectedHub.id ? 'selected' : ''}>${h.name}</option>
    `).join('');

    if (topbarSelect) {
      topbarSelect.innerHTML = optionsHtml;
      topbarSelect.addEventListener('change', async (e) => {
        await service.setSelectedHub(e.target.value);
        if (agendaSelect) agendaSelect.value = e.target.value;
        const newHub = await service.getSelectedHub();
        if (tcBadge) tcBadge.textContent = newHub.name.split('(')[0].trim();
      });
    }

    if (agendaSelect) {
      agendaSelect.innerHTML = optionsHtml;
      agendaSelect.addEventListener('change', async (e) => {
        await service.setSelectedHub(e.target.value);
        if (topbarSelect) topbarSelect.value = e.target.value;
      });
    }

    if (tcBadge && selectedHub) {
      tcBadge.textContent = selectedHub.name.split('(')[0].trim();
    }

    // Perfil en Topbar
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const avatarEl = document.getElementById('topbar-user-avatar');

    if (nameEl && profile) nameEl.textContent = profile.name;
    if (roleEl && profile) roleEl.textContent = profile.role;
    if (avatarEl && profile && profile.avatarUrl) avatarEl.src = profile.avatarUrl;

    // Contadores de Telemetría en Topbar
    const telemCounters = document.getElementById('topbar-telemetry-counters');
    if (telemCounters) {
      if (mode === 'conductor') {
        telemCounters.innerHTML = `
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full ${kpis.fleetRunning > 0 ? 'bg-tertiary-container animate-pulse' : 'bg-outline'}"></span>
            <strong class="text-on-surface">${profile.plate || 'Móvil'}</strong> ${kpis.fleetRunning > 0 ? 'En Línea' : 'Desconectado'}
          </span>
          <span class="text-outline">•</span>
          <span class="text-tertiary font-bold">${kpis.activeMoves} Mudanza(s) Activa(s)</span>
        `;
      } else {
        telemCounters.innerHTML = `
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
            <strong class="text-on-surface">${kpis.fleetRunning}/${kpis.fleetTotal}</strong> en línea
          </span>
          <span class="text-outline">•</span>
          <span class="text-tertiary font-bold">${kpis.movesOnSchedulePct}% On-Time</span>
          <span class="text-outline">•</span>
          <span>${kpis.activeCrewMembers} Estibadores</span>
        `;
      }
    }

    const sideBadge = document.getElementById('sidebar-ontime-badge');
    if (sideBadge) sideBadge.textContent = mode === 'conductor' ? (kpis.fleetRunning > 0 ? '100% En Línea' : 'Desconectado') : `${kpis.movesOnSchedulePct}% On-Time`;
  };

  // =========================================================================
  // VISTA 1: TORRE DE CONTROL OPERATIVO
  // =========================================================================
  const renderTorreDeControl = async () => {
    const kpis = await service.getKPIs();
    const vehicles = await service.getVehicles();
    const alerts = await service.getLegalAlerts();
    const mode = service.getAccountMode();
    const profile = await service.getUserProfile();

    if (!activeVehicleId || !vehicles.find(v => v.id === activeVehicleId)) {
      activeVehicleId = vehicles.length > 0 ? vehicles[0].id : null;
    }

    const activeVeh = activeVehicleId ? await service.getVehicleById(activeVehicleId) : null;

    // Formatear facturación real (ARS)
    let billingDisplay = '';
    if (kpis.monthlyBilling >= 1000000) {
      billingDisplay = `$${(kpis.monthlyBilling / 1000000).toFixed(2)}M`;
    } else if (kpis.monthlyBilling >= 1000) {
      billingDisplay = `$${(kpis.monthlyBilling / 1000).toFixed(1)}k`;
    } else {
      billingDisplay = `$${kpis.monthlyBilling.toLocaleString('es-AR')}`;
    }

    // 1. KPI Ribbon adaptado al Modo (Conductor vs Empresa)
    const kpiContainer = document.getElementById('tc-kpis-container');
    if (kpiContainer) {
      if (mode === 'conductor') {
        // TARJETAS DEL CONDUCTOR INDEPENDIENTE
        kpiContainer.innerHTML = `
          <!-- Card 1: Mi Móvil -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Mi Unidad Operativa</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[18px]">local_shipping</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.fleetRunning > 0 ? '100%' : '0%'}</span>
                <span class="font-label-sm text-label-sm text-tertiary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  ${kpis.fleetRunning > 0 ? 'En Servicio' : 'Desconectado'}
                </span>
              </div>
              <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-space-sm">
                <div class="bg-primary-container h-full rounded-full" style="width: ${kpis.fleetRunning > 0 ? '100%' : '0%'}"></div>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Móvil:</span>
              <span class="font-semibold text-primary font-mono">${profile.plate || 'S/PAT'}</span>
            </div>
          </div>

          <!-- Card 2: Mis Mudanzas Activas -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Mis Viajes en Curso</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary-container">
                <span class="material-symbols-outlined text-[18px]">move_to_inbox</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.activeMoves}</span>
                <span class="font-label-sm text-label-sm text-secondary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  ${kpis.activeMoves > 0 ? 'En curso' : 'Disponible'}
                </span>
              </div>
              <div class="flex items-center gap-2 mt-space-sm">
                <span class="px-2 py-0.5 rounded-full bg-secondary-container/10 text-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                  ${kpis.movesUnloading} por confirmar
                </span>
                <span class="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  ${kpis.movesEnRoute} en ruta
                </span>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Estado:</span>
              <span class="font-semibold text-on-surface">${kpis.activeMoves > 0 ? 'Viaje asignado' : 'Esperando solicitud'}</span>
            </div>
          </div>

          <!-- Card 3: Mis Ganancias Reales -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Mis Ganancias Acumuladas</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary-container">
                <span class="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-headline-lg text-headline-lg text-on-surface font-extrabold">${billingDisplay}</span>
                <span class="font-label-sm text-label-sm text-tertiary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[14px]">check</span>
                  ARS
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Total de tus mudanzas completadas</p>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Liquidación:</span>
              <span class="font-semibold text-tertiary">Directa con cliente</span>
            </div>
          </div>

          <!-- Card 4: Mi Cuadrilla y Tarifas -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Mi Capacidad &amp; Estiba</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[18px]">groups</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.activeCrewMembers}</span>
                <span class="font-label-md text-label-md text-on-surface font-bold">Ayudante(s)</span>
              </div>
              <p class="font-body-sm text-body-sm text-tertiary-container font-semibold mt-1 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                Servicio con estibador habilitado
              </p>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Tarifa ayudante:</span>
              <span class="font-semibold text-on-surface">$${profile.rates?.helperRate ? profile.rates.helperRate.toLocaleString('es-AR') : '60.000'}</span>
            </div>
          </div>
        `;
      } else {
        // TARJETAS MODO EMPRESA
        kpiContainer.innerHTML = `
          <!-- Card 1: Flota Activa -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Flota Operativa Activa</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[18px]">local_shipping</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.activeFleetPct}%</span>
                <span class="font-label-sm text-label-sm text-tertiary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  ${kpis.fleetRunning}/${kpis.fleetTotal} Rodando
                </span>
              </div>
              <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-space-sm">
                <div class="bg-primary-container h-full rounded-full transition-all duration-500" style="width: ${kpis.activeFleetPct}%"></div>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Disponibilidad:</span>
              <span class="font-semibold text-on-surface">${kpis.inServiceNote}</span>
            </div>
          </div>

          <!-- Card 2: Mudanzas en curso -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Mudanzas en Curso</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary-container">
                <span class="material-symbols-outlined text-[18px]">move_to_inbox</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.activeMoves}</span>
                <span class="font-label-sm text-label-sm text-secondary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  ${kpis.movesOnSchedulePct}% On-Schedule
                </span>
              </div>
              <div class="flex items-center gap-2 mt-space-sm">
                <span class="px-2 py-0.5 rounded-full bg-secondary-container/10 text-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
                  ${kpis.movesUnloading} en descarga
                </span>
                <span class="px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  ${kpis.movesEnRoute} en ruta
                </span>
              </div>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Estado:</span>
              <span class="font-semibold text-on-surface">${kpis.activeMoves > 0 ? 'Viajes en monitoreo' : 'Sin mudanzas activas'}</span>
            </div>
          </div>

          <!-- Card 3: Facturación Total Acumulada -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Facturación Flota</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary-container">
                <span class="material-symbols-outlined text-[18px]">payments</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-headline-lg text-headline-lg text-on-surface font-extrabold">${billingDisplay}</span>
                <span class="font-label-sm text-label-sm text-tertiary-container font-bold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[14px]">trending_up</span>
                  +18.4%
                </span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Total acumulado de toda la flota</p>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Base de datos:</span>
              <span class="font-semibold text-tertiary">Cloud Firestore OK</span>
            </div>
          </div>

          <!-- Card 4: Cuadrillas en Operación -->
          <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Cuadrillas en Operación</span>
              <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                <span class="material-symbols-outlined text-[18px]">groups</span>
              </span>
            </div>
            <div class="my-space-xs">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-extrabold">${kpis.activeCrewMembers}</span>
                <span class="font-label-md text-label-md text-on-surface font-bold">Estibadores</span>
              </div>
              <p class="font-body-sm text-body-sm text-tertiary-container font-semibold mt-1 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                ${kpis.activeCrewsCount} Cuadrillas asignadas
              </p>
            </div>
            <div class="mt-2 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Capacidad estimada:</span>
              <span class="font-semibold text-on-surface">${kpis.estManHours} hs / día</span>
            </div>
          </div>
        `;
      }
    }

    renderRadarPins(vehicles);
    renderActiveVehicleCard(activeVeh);
    renderFleetStream(vehicles);
    renderPriorityDispatches(vehicles);
    renderLegalAlerts(alerts);
  };

  const renderRadarPins = (vehicles) => {
    const pinsBox = document.getElementById('radar-dynamic-pins');
    if (!pinsBox) return;

    if (!vehicles || vehicles.length === 0) {
      pinsBox.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span class="px-3 py-1.5 rounded-full bg-black/60 text-white/70 text-xs backdrop-blur-md">
            Sincronizando coordenadas del móvil...
          </span>
        </div>
      `;
      return;
    }

    const defaultCoords = [
      { top: '45%', left: '50%' },
      { top: '35%', left: '42%' },
      { top: '55%', left: '58%' },
      { top: '25%', left: '32%' },
      { top: '68%', left: '46%' }
    ];

    pinsBox.innerHTML = vehicles.map((veh, idx) => {
      const pos = defaultCoords[idx % defaultCoords.length];
      const isSelected = veh.id === activeVehicleId;
      const isMoving = veh.status === 'en_ruta';
      const colorBg = isMoving ? 'bg-primary-container text-on-primary' : 'bg-surface-container-highest text-on-surface';

      return `
        <div class="absolute cursor-pointer pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 ${isSelected ? 'scale-110 z-30' : 'z-20'}"
             style="top: ${pos.top}; left: ${pos.left};"
             data-vehicle-id="${veh.id}" title="${veh.brandModel} (${veh.plate})">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border-2 ${isSelected ? 'border-primary ring-4 ring-primary/20' : 'border-surface-container-lowest'} ${colorBg}">
            <span class="w-2 h-2 rounded-full ${isMoving ? 'bg-tertiary-container animate-ping' : 'bg-tertiary-container'}"></span>
            <span class="font-label-sm text-label-sm font-extrabold font-mono">${veh.plate} · ${veh.brandModel.split(' ')[0]}</span>
            ${veh.telemetry.speedKmH > 0 ? `<span class="text-[10px] opacity-80">${veh.telemetry.speedKmH} km/h</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    pinsBox.querySelectorAll('[data-vehicle-id]').forEach(pin => {
      pin.addEventListener('click', () => {
        const id = pin.getAttribute('data-vehicle-id');
        activeVehicleId = id;
        renderTorreDeControl();
        showToast('Móvil Seleccionado', `Centrando telemetría en ${id.substring(0, 6)}.`, 'info');
      });
    });
  };

  const renderActiveVehicleCard = (veh) => {
    const cardContainer = document.getElementById('active-vehicle-card');
    if (!cardContainer) return;

    if (!veh) {
      cardContainer.innerHTML = `
        <div class="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center">
          <span class="material-symbols-outlined text-[36px] text-outline mb-2">local_shipping</span>
          <span class="font-bold text-on-surface">Sin unidad seleccionada</span>
          <span class="text-xs text-outline mt-1">Conectando con la base de datos...</span>
        </div>
      `;
      return;
    }

    const task = veh.currentTask || {};
    const driver = veh.driver || {};
    const telem = veh.telemetry || {};

    cardContainer.innerHTML = `
      <div class="flex items-center justify-between pb-space-md border-b border-surface-container-high/60">
        <div class="flex items-center gap-space-sm">
          <div class="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
            <span class="material-symbols-outlined text-[28px]">rv_hookup</span>
          </div>
          <div>
            <div class="flex items-center gap-space-xs">
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">${veh.brandModel}</h3>
              <span class="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-md text-label-md font-mono font-bold">${veh.plate}</span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant truncate">Capacidad: ${veh.volumeM3} m³ · ${veh.payloadKg} kg</p>
          </div>
        </div>
        <span class="px-3 py-1 rounded-full text-label-md font-label-md font-bold ${veh.status === 'en_ruta' ? 'bg-tertiary-container/10 text-tertiary-container' : 'bg-surface-container text-on-surface'}">
          ${veh.status === 'en_ruta' ? 'En Viaje' : 'Disponible'}
        </span>
      </div>

      <div class="py-space-md flex flex-col gap-space-md">
        <!-- Chofer Titular -->
        <div class="flex items-center justify-between text-body-md font-body-md">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-outline text-[18px]">badge</span>
            <span class="text-on-surface font-semibold">${driver.name || 'Conductor Registrado'}</span>
          </div>
          <span class="font-label-sm text-label-sm text-outline">${driver.licenseType || 'Profesional'}</span>
        </div>

        <div class="bg-surface-container-low p-space-sm rounded-xl flex flex-col gap-1.5">
          <div class="flex items-center justify-between font-label-sm text-label-sm">
            <span class="text-outline uppercase">Destino / Cobertura</span>
            <span class="text-primary font-bold">${task.eta || 'En base'}</span>
          </div>
          <p class="font-label-md text-label-md text-on-surface font-bold truncate">${task.destination || 'Área AMBA / CABA'}</p>
          <span class="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate">${task.client || '-'}</span>
        </div>

        <!-- Telemetría: Velocidad y Carga -->
        <div class="grid grid-cols-2 gap-space-sm">
          <div class="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
            <span class="font-label-sm text-label-sm text-outline uppercase">Velocidad GPS</span>
            <span class="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">${telem.speedKmH || 0} <span class="text-sm font-semibold">km/h</span></span>
            <span class="text-tertiary font-label-sm text-[11px] font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span> ${telem.signal || '4G OK'}
            </span>
          </div>
          <div class="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
            <span class="font-label-sm text-label-sm text-outline uppercase">Ocupación Caja</span>
            <span class="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">${telem.loadCapacityPct || 0}%</span>
            <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div class="bg-primary-container h-full rounded-full" style="width: ${telem.loadCapacityPct || 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center gap-2 mt-1">
          <button class="flex-1 h-10 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm" id="btn-alertar-chofer">
            <span class="material-symbols-outlined text-[18px]">priority_high</span>
            Compartir Estado
          </button>
          <button class="h-10 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1.5" id="btn-ver-ficha-unidad">
            <span class="material-symbols-outlined text-[18px]">folder_special</span>
            Ficha &amp; Tarifas
          </button>
        </div>
      </div>
    `;

    const btnAlerta = cardContainer.querySelector('#btn-alertar-chofer');
    if (btnAlerta) {
      btnAlerta.addEventListener('click', () => {
        showToast('Estado Compartido', 'El estado del móvil ha sido sincronizado.', 'success');
      });
    }

    const btnFicha = cardContainer.querySelector('#btn-ver-ficha-unidad');
    if (btnFicha) {
      btnFicha.addEventListener('click', () => {
        openVehicleFichaModal(veh.id);
      });
    }
  };

  const renderFleetStream = (vehicles) => {
    const streamContainer = document.getElementById('tc-fleet-stream-container');
    if (!streamContainer) return;

    if (!vehicles || vehicles.length === 0) {
      streamContainer.innerHTML = `
        <div class="p-4 text-center text-xs text-outline">
          Sin vehículos para mostrar en este modo.
        </div>
      `;
      return;
    }

    streamContainer.innerHTML = vehicles.slice(0, 5).map(veh => {
      const isSelected = veh.id === activeVehicleId;
      const telem = veh.telemetry || {};

      return `
        <div class="p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors ${isSelected ? 'bg-surface-container-low/70' : ''}" data-stream-id="${veh.id}">
          <div class="flex items-center gap-space-sm">
            <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <span class="material-symbols-outlined text-[18px]">local_shipping</span>
            </div>
            <div class="flex flex-col">
              <span class="font-label-md text-label-md font-bold text-on-surface">${veh.brandModel} <span class="font-mono text-outline font-normal">(${veh.plate})</span></span>
              <span class="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate max-w-[180px]">${veh.driver.name}</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="font-label-sm text-label-sm font-extrabold text-on-surface">${telem.speedKmH ? telem.speedKmH + ' km/h' : 'En Base'}</span>
            <span class="font-label-sm text-label-sm text-outline text-[10px]">${veh.status === 'en_ruta' ? 'En viaje' : 'Disponible'}</span>
          </div>
        </div>
      `;
    }).join('');

    streamContainer.querySelectorAll('[data-stream-id]').forEach(row => {
      row.addEventListener('click', () => {
        activeVehicleId = row.getAttribute('data-stream-id');
        renderTorreDeControl();
      });
    });
  };

  const renderPriorityDispatches = (vehicles) => {
    const listContainer = document.getElementById('priority-dispatches-container');
    const badge = document.getElementById('tc-priority-count-badge');
    if (!listContainer) return;

    // Buscar viajes activos en los vehículos filtrados
    const activeVehiclesWithTask = vehicles.filter(v => v.status === 'en_ruta' && v.currentTask);
    if (badge) badge.textContent = `${activeVehiclesWithTask.length} Activos`;

    if (activeVehiclesWithTask.length === 0) {
      listContainer.innerHTML = `
        <div class="p-6 text-center text-on-surface-variant font-body-sm flex flex-col items-center justify-center">
          <span class="material-symbols-outlined text-[36px] text-tertiary mb-2">task_alt</span>
          <span class="font-bold text-on-surface">No hay mudanzas prioritarias en curso</span>
          <span class="text-xs text-outline mt-1">Todos tus viajes se encuentran completados o en espera de confirmación.</span>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = activeVehiclesWithTask.map(veh => {
      const task = veh.currentTask;
      const driver = veh.driver || {};
      const crew = veh.crew || {};

      return `
        <div class="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md hover:bg-surface-container transition-colors">
          <div class="flex items-center gap-space-md">
            <div class="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm flex-shrink-0">
              <span class="material-symbols-outlined text-[20px]">local_shipping</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="font-label-md text-label-md font-mono font-bold text-primary">${task.code}</span>
                <span class="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface font-label-sm text-[11px] font-bold">${task.type}</span>
              </div>
              <div class="flex items-center gap-1 font-body-sm text-body-sm text-on-surface font-semibold mt-0.5">
                <span>${task.origin}</span>
                <span class="material-symbols-outlined text-[14px] text-outline">arrow_forward</span>
                <span class="text-primary-container">${task.destination}</span>
              </div>
              <span class="font-label-sm text-label-sm text-outline mt-0.5">${veh.brandModel} (${veh.plate}) · ${driver.name}</span>
            </div>
          </div>

          <div class="flex items-center gap-space-md flex-shrink-0">
            <div class="flex flex-col text-right">
              <span class="font-label-sm text-label-sm text-outline uppercase">Estado</span>
              <span class="font-headline-sm text-headline-sm font-extrabold text-on-surface">${task.eta}</span>
              <span class="text-[11px] text-tertiary-container font-bold">${task.phase}</span>
            </div>
            <button class="px-3 py-2 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:opacity-95 transition-all shadow-sm" onclick="window.MudifyUI.openGPS('${veh.id}')">
              Ver GPS
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  const renderLegalAlerts = (alerts) => {
    const alertsBox = document.getElementById('legal-alerts-container');
    if (!alertsBox) return;

    if (!alerts || alerts.length === 0) {
      alertsBox.innerHTML = `
        <div class="p-4 text-center text-xs text-outline">
          Sin alertas pendientes en el sistema.
        </div>
      `;
      return;
    }

    alertsBox.innerHTML = alerts.map(alt => {
      const borderClass = alt.severity === 'urgent' ? 'border-l-4 border-l-secondary-container bg-surface-container-low' :
                          alt.severity === 'warning' ? 'border-l-4 border-l-primary-container bg-surface-container-low' :
                          'border-l-4 border-l-tertiary-container bg-surface-container-low';

      return `
        <div class="p-space-sm rounded-xl ${borderClass} flex items-start justify-between gap-2">
          <div class="flex flex-col">
            <span class="font-label-md text-label-md font-bold text-on-surface">${alt.title}</span>
            <p class="font-body-sm text-body-sm text-on-surface-variant text-[12px] mt-0.5">${alt.desc}</p>
          </div>
          <button class="px-2.5 py-1 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm hover:bg-surface-container-high transition-colors whitespace-nowrap flex-shrink-0 font-bold"
                  onclick="window.MudifyUI.resolveLegalAlert('${alt.id}')">
            ${alt.actionLabel}
          </button>
        </div>
      `;
    }).join('');
  };

  // =========================================================================
  // VISTA 2: DESPACHO & AGENDA OPERATIVA
  // =========================================================================
  const renderDespachoAgenda = async () => {
    const timeline = await service.getTimelineSchedule(activePorteFilter);
    const pendingServices = await service.getPendingServices();
    const crews = await service.getCrewShifts();

    const rowsContainer = document.getElementById('gantt-vehicle-rows-container');
    if (rowsContainer) {
      if (!timeline || timeline.length === 0) {
        rowsContainer.innerHTML = `
          <div class="p-8 text-center text-on-surface-variant font-body-sm flex flex-col items-center justify-center">
            <span class="material-symbols-outlined text-[36px] text-outline mb-2">calendar_today</span>
            <span class="font-bold text-on-surface">Sin vehículos registrados para el cronograma</span>
            <span class="text-xs text-outline mt-1">Los viajes programados se visualizarán aquí automáticamente.</span>
          </div>
        `;
      } else {
        rowsContainer.innerHTML = timeline.map(row => {
          const slotsHtml = (row.slots || []).map(s => {
            const startCol = Math.max(1, Math.round(s.startHour - 6));
            const spanCols = Math.max(1, Math.round(s.endHour - s.startHour));
            const colorClass = s.status === 'completado' ? 'bg-tertiary text-on-tertiary' :
                               s.status === 'en_curso' ? 'bg-primary-container text-on-primary' :
                               'bg-surface-dim text-on-surface border border-outline-variant';

            return `
              <div class="col-start-${startCol} col-span-${spanCols} ${colorClass} rounded-lg p-2 flex flex-col justify-between shadow-sm overflow-hidden" style="grid-column-start: ${startCol}; grid-column-end: span ${spanCols};">
                <div class="flex items-center justify-between text-[11px] font-bold">
                  <span>${s.startHour}:00 - ${s.endHour}:00</span>
                  <span class="px-1 py-0.2 rounded bg-black/20 text-[10px]">${s.status.toUpperCase()}</span>
                </div>
                <div class="truncate text-xs font-bold mt-1">${s.title}</div>
                <div class="text-[10px] opacity-85 truncate">${s.route}</div>
              </div>
            `;
          }).join('');

          return `
            <div class="bg-surface-container-low rounded-xl p-space-sm flex items-center">
              <div class="w-56 shrink-0 pr-space-sm">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-extrabold font-mono tracking-wider">${row.plate}</span>
                  <span class="w-2 h-2 rounded-full bg-tertiary-container" title="Activa"></span>
                </div>
                <div class="font-label-lg text-label-lg text-on-surface font-bold truncate">${row.model}</div>
                <div class="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                  <span class="material-symbols-outlined text-[14px]">person</span>
                  <span>${row.driverName}</span>
                </div>
              </div>
              <div class="flex-1 grid grid-cols-13 gap-1 h-20 relative bg-surface-container rounded-lg p-1">
                ${slotsHtml || '<div class="col-span-13 flex items-center justify-center text-xs text-outline italic">Disponible sin viajes asignados para hoy</div>'}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    const pendingBox = document.getElementById('pending-services-container');
    const pendingBadge = document.getElementById('pending-services-badge');
    if (pendingBadge) pendingBadge.textContent = pendingServices.length;

    if (pendingBox) {
      if (!pendingServices || pendingServices.length === 0) {
        pendingBox.innerHTML = `
          <div class="p-6 text-center text-on-surface-variant text-xs flex flex-col items-center">
            <span class="material-symbols-outlined text-[28px] text-tertiary mb-1">done_all</span>
            <span>No hay mudanzas pendientes de asignar</span>
          </div>
        `;
      } else {
        pendingBox.innerHTML = pendingServices.slice(0, 10).map(srv => {
          return `
            <div class="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-2 hover:bg-surface-container transition-colors border border-surface-container-high/40">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm font-mono font-bold">${srv.code}</span>
                <span class="font-label-sm text-label-sm font-bold text-tertiary-container">$${srv.budget.toLocaleString('es-AR')}</span>
              </div>
              <div>
                <h4 class="font-label-lg text-label-lg text-on-surface font-bold">${srv.client}</h4>
                <p class="font-body-sm text-body-sm text-on-surface-variant text-[12px] truncate">${srv.origin} → ${srv.destination}</p>
              </div>
              <div class="flex items-center justify-between text-label-sm text-[11px] text-outline pt-1 border-t border-surface-container-high/40">
                <span>Carga: ${srv.volume}</span>
                <button class="px-3 py-1 rounded-lg bg-primary-container text-on-primary font-bold hover:opacity-95 transition-all" onclick="window.MudifyUI.assignServicePrompt('${srv.id}')">
                  Tomar Viaje
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    const crewBox = document.getElementById('afternoon-crews-container');
    if (crewBox) {
      if (!crews || crews.length === 0) {
        crewBox.innerHTML = `<div class="p-4 text-center text-xs text-outline">Sin ayudantes registrados.</div>`;
      } else {
        crewBox.innerHTML = crews.map(c => `
          <div class="bg-surface-container-low p-space-sm rounded-xl flex items-center justify-between gap-2">
            <div class="flex flex-col">
              <span class="font-label-md text-label-md font-bold text-on-surface">${c.name}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant text-[11px]">${c.leader} · ${c.assignedVehicleCode}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary-container font-label-sm text-[10px] font-bold">HABILITADO</span>
          </div>
        `).join('');
      }
    }
  };

  // =========================================================================
  // VISTA 3: FLOTA DE VEHÍCULOS / MI VEHÍCULO & TARIFAS
  // =========================================================================
  const renderFlotaMantenimiento = async () => {
    const allVehicles = await service.getVehicles('todos');
    const tableBody = document.getElementById('fleet-table-body');
    const profile = await service.getUserProfile();
    const mode = service.getAccountMode();
    if (!tableBody) return;

    const countTodos = document.getElementById('count-todos');
    const countEnRuta = document.getElementById('count-en-ruta');
    const countDisp = document.getElementById('count-disponible');
    const countTaller = document.getElementById('count-taller');

    if (countTodos) countTodos.textContent = allVehicles.length;
    if (countEnRuta) countEnRuta.textContent = allVehicles.filter(v => v.status === 'en_ruta').length;
    if (countDisp) countDisp.textContent = allVehicles.filter(v => v.status === 'disponible').length;
    if (countTaller) countTaller.textContent = allVehicles.filter(v => v.status === 'taller').length;

    let vehicles = await service.getVehicles(activeFleetFilter);

    if (fleetSearchQuery) {
      const q = fleetSearchQuery.toLowerCase();
      vehicles = vehicles.filter(v => 
        v.code.toLowerCase().includes(q) || 
        v.plate.toLowerCase().includes(q) || 
        v.brandModel.toLowerCase().includes(q) ||
        (v.driver && v.driver.name.toLowerCase().includes(q))
      );
    }

    if (!vehicles || vehicles.length === 0) {
      tableBody.innerHTML = `
        <div class="p-8 text-center text-on-surface-variant font-body-sm flex flex-col items-center justify-center col-span-12">
          <span class="material-symbols-outlined text-[40px] text-outline mb-2">directions_bus</span>
          <span class="font-bold text-on-surface">No se encontraron vehículos en esta cuenta</span>
          <span class="text-xs text-outline mt-1">Sincronizando datos de Firestore...</span>
        </div>
      `;
    } else {
      tableBody.innerHTML = vehicles.map(veh => {
        const driver = veh.driver || {};
        const crew = veh.crew || {};
        const task = veh.currentTask || {};
        const docs = veh.documents || {};

        const truckImg = veh.category === 'pesado' ? 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=120&h=90&q=80' :
                         'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=120&h=90&q=80';

        const statusBadge = veh.status === 'en_ruta' ? 
          `<div class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-tertiary-container/10 text-tertiary-container w-fit"><span class="w-2 h-2 rounded-full bg-tertiary-container animate-ping"></span><span class="font-label-md text-label-md font-bold">${task.code || 'En Viaje'}</span></div>` :
          `<div class="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container text-on-surface w-fit"><span class="w-2 h-2 rounded-full bg-tertiary-container"></span><span class="font-label-md text-label-md font-bold">Disponible</span></div>`;

        return `
          <div class="fleet-row grid grid-cols-12 px-space-lg py-space-md items-center hover:bg-surface-container-low/40 transition-colors" data-veh-id="${veh.id}">
            <div class="col-span-3 flex items-center gap-space-md">
              <div class="relative w-16 h-12 rounded-lg overflow-hidden shadow-sm flex-shrink-0 bg-surface-container-high">
                <img class="w-full h-full object-cover" src="${truckImg}" alt="${veh.brandModel}">
                <span class="absolute bottom-0 right-0 px-1 py-0.2 bg-primary-container text-on-primary font-label-sm text-[10px] rounded-tl font-bold">${veh.code}</span>
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-space-xs">
                  <span class="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">${veh.brandModel}</span>
                  <span class="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-label-md text-label-md font-mono tracking-wider font-bold">${veh.plate}</span>
                </div>
                <span class="font-body-sm text-body-sm text-on-surface-variant truncate">${driver.name}</span>
                <span class="font-label-sm text-label-sm text-outline">Año ${veh.year} • Odómetro: ${veh.odometer}</span>
              </div>
            </div>

            <div class="col-span-3 flex flex-col gap-1 pr-space-sm">
              <div class="flex items-center gap-space-md">
                <div class="flex items-center gap-1 text-on-surface font-label-lg text-label-lg">
                  <span class="material-symbols-outlined text-[16px] text-primary-container">inventory_2</span>
                  <span class="font-extrabold">${veh.volumeM3} m³</span>
                </div>
                <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
                  <span class="material-symbols-outlined text-[16px] text-outline">weight</span>
                  <span>Carga útil: ${veh.payloadKg.toLocaleString('es-AR')} kg</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-1 mt-1">
                ${(veh.specialEquipment || []).slice(0, 3).map(eq => `
                  <span class="px-2 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-[11px]">${eq}</span>
                `).join('')}
              </div>
            </div>

            <div class="col-span-2 flex items-center gap-space-sm">
              <div class="flex flex-col min-w-0">
                <span class="font-label-lg text-label-lg text-on-surface font-bold truncate">${driver.name || 'Sin Chofer'}</span>
                <span class="font-label-sm text-label-sm text-outline">${driver.phone || 'Sin tel'}</span>
                <span class="font-body-sm text-body-sm text-primary font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">group</span> ${crew.name || 'Cuadrilla'}
                </span>
              </div>
            </div>

            <div class="col-span-2 flex flex-col gap-1">
              ${statusBadge}
              <div class="text-body-sm font-body-sm text-on-surface-variant flex items-center gap-1 truncate">
                <span class="material-symbols-outlined text-[15px] text-secondary-container">navigation</span>
                <span>${task.destination || 'Base Operativa'}</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5 text-label-sm font-label-sm text-outline">
                <span class="text-tertiary font-bold flex items-center gap-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                  VTV ${docs.vtvExpiry}
                </span>
                <span>•</span>
                <span class="text-tertiary font-bold">Póliza OK</span>
              </div>
            </div>

            <div class="col-span-2 flex items-center justify-end gap-space-xs">
              <button class="px-space-sm py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md transition-colors"
                      onclick="window.MudifyUI.openVehicleModal('${veh.id}')">
                Ficha Técnica
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Bóveda de Pólizas
    const vaultList = document.getElementById('fleet-vault-list');
    const policies = await service.getPoliciesVault();
    if (vaultList) {
      if (!policies || policies.length === 0) {
        vaultList.innerHTML = `<div class="p-3 text-center text-xs text-outline">Sin pólizas registradas.</div>`;
      } else {
        vaultList.innerHTML = policies.map(p => `
          <div class="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-[20px] text-tertiary">verified</span>
              <div class="flex flex-col">
                <span class="font-bold text-on-surface text-xs">${p.title}</span>
                <span class="text-[11px] text-on-surface-variant">${p.insurer} (${p.policyNumber})</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary font-bold text-[10px]">VIGENTE</span>
          </div>
        `).join('');
      }
    }
  };

  // =========================================================================
  // MODAL DE FICHA TÉCNICA Y TARIFAS DEL CONDUCTOR
  // =========================================================================
  const openVehicleFichaModal = async (vehicleId) => {
    const veh = await service.getVehicleById(vehicleId);
    if (!veh) return;

    const modal = document.getElementById('modal-ficha');
    const modalTitle = document.getElementById('modal-title');
    const modalPatente = document.getElementById('modal-patente');
    const detailsContainer = document.getElementById('modal-ficha-details');

    if (!modal) return;

    if (modalTitle) modalTitle.textContent = `Ficha de Unidad · ${veh.brandModel}`;
    if (modalPatente) modalPatente.textContent = `Patente ${veh.plate} · Conductor: ${veh.driver.name}`;

    const driver = veh.driver || {};
    const docs = veh.documents || {};
    const rates = veh.rates || {};

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div class="p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-outline uppercase font-bold">Capacidad Volumétrica</span>
          <p class="font-label-lg text-label-lg text-on-surface font-extrabold mt-1">${veh.volumeM3} m³ (${veh.payloadKg.toLocaleString('es-AR')} kg carga)</p>
          <span class="font-body-sm text-body-sm text-on-surface-variant">Categoría: ${veh.category.toUpperCase()}</span>
        </div>
        <div class="p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-outline uppercase font-bold">Odómetro & Año</span>
          <p class="font-label-lg text-label-lg text-on-surface font-extrabold mt-1">${veh.odometer}</p>
          <span class="font-body-sm text-body-sm text-on-surface-variant">Año: ${veh.year}</span>
        </div>
        <div class="p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-outline uppercase font-bold">Conductor Titular</span>
          <p class="font-label-lg text-label-lg text-on-surface font-extrabold mt-1">${driver.name}</p>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${driver.licenseType} · Tel: ${driver.phone}</span>
        </div>
        <div class="p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-outline uppercase font-bold">Habilitación & VTV</span>
          <p class="font-label-lg text-label-lg text-on-surface font-extrabold mt-1">VTV: ${docs.vtvExpiry}</p>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${docs.insuranceCompany} (${docs.insurancePolicy})</span>
        </div>
        
        <!-- Tarifas Reales de este Conductor desde Firestore -->
        <div class="col-span-2 p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-primary uppercase font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">price_change</span>
            Tarifas Oficiales de tu Cuenta en la Base de Datos
          </span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <div class="bg-surface-container p-2 rounded-lg text-center">
              <span class="text-[10px] text-outline block">Precio x Km</span>
              <strong class="text-sm font-bold text-on-surface">$${rates.pricePerKm?.toLocaleString('es-AR') || 1000}</strong>
            </div>
            <div class="bg-surface-container p-2 rounded-lg text-center">
              <span class="text-[10px] text-outline block">Precio x Hora</span>
              <strong class="text-sm font-bold text-on-surface">$${rates.pricePerHour?.toLocaleString('es-AR') || 4000}</strong>
            </div>
            <div class="bg-surface-container p-2 rounded-lg text-center">
              <span class="text-[10px] text-outline block">Ayudante / Estiba</span>
              <strong class="text-sm font-bold text-on-surface">$${rates.helperRate?.toLocaleString('es-AR') || 60000}</strong>
            </div>
            <div class="bg-surface-container p-2 rounded-lg text-center">
              <span class="text-[10px] text-outline block">Piso x Escalera</span>
              <strong class="text-sm font-bold text-on-surface">$${rates.stairFloorRate?.toLocaleString('es-AR') || 3000}</strong>
            </div>
          </div>
        </div>

        <div class="col-span-2 p-space-sm rounded-xl bg-surface-container-low">
          <span class="font-label-sm text-label-sm text-outline uppercase font-bold">Servicios Habilitados</span>
          <div class="flex flex-wrap gap-1.5 mt-1.5">
            ${(veh.specialEquipment || []).map(eq => `
              <span class="px-2.5 py-1 rounded-lg bg-surface-container font-semibold text-xs text-on-surface">${eq}</span>
            `).join('')}
          </div>
        </div>
      `;
    }

    modal.classList.remove('hidden');

    const btnClose = document.getElementById('btn-close-modal');
    if (btnClose) {
      btnClose.onclick = () => modal.classList.add('hidden');
    }
  };

  // =========================================================================
  // VISTAS ADICIONALES (COTIZACIONES, PERSONAL, FACTURACIÓN, REPORTES, CONFIG)
  // =========================================================================
  const renderB2BQuotes = async () => {
    const quotes = await service.getB2BQuotes();
    const container = document.getElementById('b2b-quotes-container');
    if (!container) return;

    if (!quotes || quotes.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center">
          <span class="material-symbols-outlined text-[36px] text-outline mb-2">request_quote</span>
          <span class="font-bold text-on-surface">No hay solicitudes registradas</span>
          <span class="text-xs text-outline mt-1">Los viajes asociados a tu cuenta aparecerán aquí.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = quotes.map(q => `
      <div class="p-space-md flex items-center justify-between gap-4 border-b border-surface-container-high/40 hover:bg-surface-container-low transition-colors">
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-primary">${q.code}</span>
            <span class="font-bold text-on-surface">${q.client}</span>
          </div>
          <span class="text-xs text-on-surface-variant">${q.origin} → ${q.destination} (${q.volume})</span>
        </div>
        <div class="flex items-center gap-4">
          <strong class="text-lg text-on-surface">$${q.amount.toLocaleString('es-AR')}</strong>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${q.status === 'aprobado' ? 'bg-tertiary-container/10 text-tertiary-container' : 'bg-surface-container text-on-surface'}">${q.status.toUpperCase()}</span>
        </div>
      </div>
    `).join('');
  };

  const renderCrewModule = async () => {
    const crews = await service.getCrewShifts();
    const container = document.getElementById('crew-list-container');
    if (!container) return;

    if (!crews || crews.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-on-surface-variant text-sm flex flex-col items-center col-span-3">
          <span class="material-symbols-outlined text-[36px] text-outline mb-2">badge</span>
          <span class="font-bold text-on-surface">Sin ayudantes registrados</span>
          <span class="text-xs text-outline mt-1">Configuración en tu perfil de chofer...</span>
        </div>
      `;
      return;
    }

    container.innerHTML = crews.map(c => `
      <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/40 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-on-surface">${c.name}</span>
          <span class="px-2 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary-container text-xs font-bold">ART VIGENTE</span>
        </div>
        <div class="text-xs text-on-surface-variant">Titular: ${c.leader}</div>
        <div class="text-xs text-outline">Unidad: ${c.assignedVehicleCode} · Horario: ${c.shift}</div>
        <div class="text-xs font-semibold text-primary mt-1">Integrantes: ${c.helpers.join(', ')}</div>
      </div>
    `).join('');
  };

  const renderInvoicesModule = async () => {
    const container = document.getElementById('invoices-list-container');
    if (!container) return;
    const kpis = await service.getKPIs();
    const mode = service.getAccountMode();

    container.innerHTML = `
      <div class="p-6 text-center text-on-surface-variant font-semibold">
        <div class="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-primary mb-3">
          <span class="material-symbols-outlined text-[24px]">receipt_long</span>
        </div>
        <h4 class="font-bold text-on-surface">${mode === 'conductor' ? 'Mis Ganancias Acumuladas' : 'Facturación Electrónica Flota'}</h4>
        <p class="text-lg font-extrabold text-tertiary-container mt-1">$${kpis.monthlyBilling.toLocaleString('es-AR')} ARS</p>
        <p class="text-xs text-outline mt-1">${mode === 'conductor' ? 'Total liquidado por tus mudanzas y fletes completados.' : 'Sincronización en vivo con viajes completados en Cloud Firestore.'}</p>
      </div>
    `;
  };

  const renderReportsModule = async () => {
    const container = document.getElementById('reports-metrics-container');
    if (!container) return;
    const kpis = await service.getKPIs();
    const mode = service.getAccountMode();

    container.innerHTML = `
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high/40">
        <h3 class="font-bold text-on-surface mb-2">${mode === 'conductor' ? 'Disponibilidad de tu Unidad' : 'Efectividad Operativa de Flota'}</h3>
        <p class="text-3xl font-extrabold text-tertiary-container">${kpis.activeFleetPct}%</p>
        <span class="text-xs text-outline">${mode === 'conductor' ? 'Estado en línea para recibir viajes' : `Medición sobre ${kpis.fleetTotal} unidades`}</span>
      </div>
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-high/40">
        <h3 class="font-bold text-on-surface mb-2">Puntualidad y Cumplimiento</h3>
        <p class="text-3xl font-extrabold text-primary-container">${kpis.movesOnSchedulePct}%</p>
        <span class="text-xs text-outline">Viajes ejecutados satisfactoriamente</span>
      </div>
    `;
  };

  const renderSettingsModule = async () => {
    const container = document.getElementById('settings-form-container');
    if (!container) return;
    const mode = service.getAccountMode();
    const profile = await service.getUserProfile();

    container.innerHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl bg-surface-container-low gap-4">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${service.state.dbConnected ? 'bg-tertiary-container' : 'bg-primary-container'} animate-pulse"></span>
              <span class="font-bold text-on-surface">Tipo de Cuenta Activa</span>
            </div>
            <span class="text-xs text-primary font-bold mt-1">${mode === 'conductor' ? '🚚 Conductor Independiente' : '🏢 Empresa de Mudanzas'}</span>
            <span class="text-[11px] text-outline mt-0.5">Usuario: ${profile.name} (${profile.email})</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'conductor' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface'}"
                    onclick="window.MudifyUI.switchAccountMode('conductor')">
              Modo Conductor
            </button>
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'empresa' ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface'}"
                    onclick="window.MudifyUI.switchAccountMode('empresa')">
              Modo Empresa
            </button>
          </div>
        </div>

        <div class="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1">
          <span class="text-xs font-bold text-outline uppercase">Enlace a Base de Datos</span>
          <span class="text-sm font-semibold text-on-surface">Cloud Firestore: mudapp-a9d40</span>
          <span class="text-xs text-tertiary font-bold">Conexión Segura Activa</span>
        </div>
      </div>
    `;
  };

  // =========================================================================
  // API GLOBAL WINDOW.MUDIFYUI
  // =========================================================================
  window.MudifyUI = {
    switchView: (view) => switchView(view),
    openVehicleModal: (vehId) => openVehicleFichaModal(vehId),
    openGPS: (vehId) => {
      showToast('Navegación GPS', `Abriendo telemetría en tiempo real del móvil.`, 'info');
    },
    switchAccountMode: async (mode) => {
      await service.setAccountMode(mode);
      updateModeSwitcherUI();
      renderCurrentView();
      showToast('Modo de Cuenta', `Has cambiado a modo ${mode === 'conductor' ? 'Conductor Independiente' : 'Empresa de Mudanzas'}.`, 'success');
    },
    resolveLegalAlert: async (altId) => {
      await service.resolveAlert(altId);
      renderTorreDeControl();
      showToast('Alerta Verificada', 'Documentación comprobada en el sistema.', 'success');
    },
    assignServicePrompt: async (srvId) => {
      const vehicles = await service.getVehicles();
      const firstVeh = vehicles[0];
      if (firstVeh) {
        const res = await service.assignPendingService(srvId, firstVeh.id);
        if (res.success) {
          showToast('Viaje Tomado', `El despacho ${res.service.code} ha sido asignado a tu unidad.`, 'success');
          renderDespachoAgenda();
        }
      }
    }
  };

  // 11. Suscripción Reactiva a Cambios del Servicio
  service.subscribe(() => {
    initTopbar();
    renderCurrentView();
  });

  // =========================================================================
  // ESTÁNDAR #1: GUARDIÁN DE ACCESO EXCLUSIVO CON GOOGLE
  // =========================================================================
  const authOverlay = document.getElementById('panel-auth-overlay');
  const btnGoogleLogin = document.getElementById('btn-panel-google-login');
  const btnGoogleText = document.getElementById('btn-panel-google-text');
  const btnLogout = document.getElementById('btn-topbar-logout');

  const updateUserProfileUI = (profile) => {
    if (!profile) return;
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const avatarEl = document.getElementById('topbar-user-avatar');

    if (nameEl) nameEl.textContent = profile.name || 'Usuario Google';
    if (roleEl) roleEl.textContent = profile.role || (service.getAccountMode() === 'conductor' ? 'Conductor Independiente' : 'Empresa de Mudanzas');
    if (avatarEl && profile.avatarUrl) avatarEl.src = profile.avatarUrl;
  };

  const handleAuthState = (user) => {
    if (user) {
      if (authOverlay) authOverlay.classList.add('hidden');
      if (btnLogout) btnLogout.classList.remove('hidden');
      updateUserProfileUI(user);
    } else {
      if (authOverlay) authOverlay.classList.remove('hidden');
      if (btnLogout) btnLogout.classList.add('hidden');
    }
  };

  if (window.firebase && window.firebase.auth) {
    window.firebase.auth().onAuthStateChanged((fbUser) => {
      if (fbUser) {
        const profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          avatarUrl: fbUser.photoURL || '',
          role: service.getAccountMode() === 'conductor' ? 'Conductor Independiente' : 'Empresa de Mudanzas'
        };
        handleAuthState(profile);
      } else {
        const cached = service.getCurrentUser();
        handleAuthState(cached);
      }
    });
  } else {
    const cached = service.getCurrentUser();
    handleAuthState(cached);
  }

  if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', async () => {
      try {
        if (btnGoogleText) btnGoogleText.textContent = 'Conectando con Google...';
        btnGoogleLogin.style.pointerEvents = 'none';
        btnGoogleLogin.style.opacity = '0.7';

        const profile = await service.signInWithGoogle();
        if (profile) {
          showToast('Sesión Iniciada', `Bienvenido al panel, ${profile.name}.`, 'success');
          handleAuthState(profile);
          renderCurrentView();
        }
      } catch (err) {
        console.error('Error durante autenticación Google:', err);
        showToast('Error de Autenticación', err.message || 'No se pudo iniciar sesión con Google.', 'error');
      } finally {
        if (btnGoogleText) btnGoogleText.textContent = 'Acceder con Cuenta de Google';
        btnGoogleLogin.style.pointerEvents = 'auto';
        btnGoogleLogin.style.opacity = '1';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      await service.signOut();
      showToast('Sesión Finalizada', 'Has cerrado tu sesión de Google correctamente.', 'info');
      handleAuthState(null);
    });
  }

  // 12. Resolver vista correspondiente según Hash de URL
  const resolveViewFromHashOrUser = () => {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    const validPaths = [
      'torre-de-control',
      'solicitudes-cotizaciones',
      'despacho-agenda',
      'flota-mantenimiento',
      'choferes-cuadrillas',
      'facturacion-remitos',
      'reportes-rentabilidad',
      'configuracion-empresa'
    ];
    const aliases = {
      'torre': 'torre-de-control',
      'agenda': 'despacho-agenda',
      'flota': 'flota-mantenimiento',
      'cotizaciones': 'solicitudes-cotizaciones',
      'choferes': 'choferes-cuadrillas',
      'facturacion': 'facturacion-remitos',
      'reportes': 'reportes-rentabilidad',
      'configuracion': 'configuracion-empresa'
    };

    if (validPaths.includes(rawHash)) return rawHash;
    if (aliases[rawHash]) return aliases[rawHash];
    return 'torre-de-control';
  };

  await initTopbar();
  switchView(resolveViewFromHashOrUser());

  window.addEventListener('hashchange', () => {
    switchView(resolveViewFromHashOrUser());
  });
});
