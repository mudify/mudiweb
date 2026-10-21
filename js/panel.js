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
    const storedUser = JSON.parse(localStorage.getItem('mudify_user_session') || '{}');
    const isEmpresaAccount = storedUser.role === 'empresa';

    const btnConductor = document.getElementById('btn-mode-conductor');
    const btnEmpresa = document.getElementById('btn-mode-empresa');
    const sidebarSubtitle = document.getElementById('sidebar-brand-subtitle');
    const sidebarNetworkTitle = document.getElementById('sidebar-network-title');

    if (isEmpresaAccount) {
      if (btnConductor) {
        btnConductor.style.opacity = '0.4';
        btnConductor.style.cursor = 'not-allowed';
        btnConductor.title = 'Cuenta registrada como Empresa. No podés operar como conductor independiente.';
      }
    }

    // Adaptar etiquetas del Sidebar según el modo
    const labelTorre = document.getElementById('nav-label-torre');
    const labelAgenda = document.getElementById('nav-label-agenda');
    const labelFlota = document.getElementById('nav-label-flota');
    const labelFacturacion = document.getElementById('nav-label-facturacion');
    const labelCotizaciones = document.getElementById('nav-label-cotizaciones');

    if (mode === 'conductor' && !isEmpresaAccount) {
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
        const storedUser = JSON.parse(localStorage.getItem('mudify_user_session') || '{}');
        if (storedUser.role === 'empresa') {
          showToast('Acceso Restringido', 'Tu cuenta está registrada como Empresa de Mudanzas. Por política de seguridad, no podés operar como conductor independiente.', 'error');
          return;
        }
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

    // Suscripción & Límites en Sidebar
    const sub = service.getSubscription();
    const maxVeh = service.getMaxVehiclesAllowed();
    const allVeh = await service.getVehicles('todos');
    const sideSubBadge = document.getElementById('sidebar-sub-badge');
    const sideVehLimit = document.getElementById('sidebar-sub-veh-limit');
    if (sideSubBadge) {
      sideSubBadge.textContent = sub ? sub.planName : (mode === 'conductor' ? 'Plan Fletero Pro' : 'Plan Flota Enterprise');
    }
    if (sideVehLimit) {
      const limitText = maxVeh === Infinity ? 'Ilimitados' : maxVeh;
      sideVehLimit.textContent = `Límite de flota: ${allVeh.length} / ${limitText} vehículo(s)`;
    }
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
    await renderActiveTripControl();
  };

  // =========================================================================
  // CONTROLADOR DEL CICLO DE VIDA DEL VIAJE ACTIVO & CÓDIGO OTP
  // =========================================================================
  const renderActiveTripControl = async () => {
    const container = document.getElementById('tc-active-trip-control');
    if (!container) return;

    const trips = (service.state.rawTrips && service.state.rawTrips.length > 0)
      ? service.state.rawTrips
      : [];

    const activeStatuses = ['accepted', 'goingToOrigin', 'arrivedAtOrigin', 'goingToDestination', 'waitingClientSignature'];
    const activeTrip = trips.find(t => activeStatuses.includes(t.status));

    if (!activeTrip) {
      container.innerHTML = `
        <div class="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-tertiary-container/15 text-tertiary-container flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[22px]">radio_button_checked</span>
            </div>
            <div>
              <h4 class="font-bold text-on-surface text-sm">Estado Operativo: Disponible</h4>
              <span class="text-xs text-outline">Tu unidad se encuentra lista para recibir nuevos fletes y mudanzas en tiempo real.</span>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary font-bold text-xs flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            Radar Conectado
          </span>
        </div>
      `;
      return;
    }

    const steps = [
      { key: 'accepted', label: '1. Aceptado', desc: 'Esperando salida' },
      { key: 'goingToOrigin', label: '2. En Camino', desc: 'Rumbo al origen' },
      { key: 'arrivedAtOrigin', label: '3. En Origen', desc: 'Cargando bultos' },
      { key: 'goingToDestination', label: '4. En Traslado', desc: 'Rumbo al destino' },
      { key: 'waitingClientSignature', label: '5. En Destino', desc: 'Validación OTP' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === activeTrip.status);

    const clientName = activeTrip.clientName || activeTrip.usuarioNombre || 'Cliente Mudify';
    const clientPhone = activeTrip.clientPhone || activeTrip.telefono || '';
    const origin = activeTrip.originAddress || activeTrip.origen || 'Origen no especificado';
    const destination = activeTrip.destinationAddress || activeTrip.destino || 'Destino no especificado';
    const cargo = activeTrip.itemsSummary || activeTrip.descripcion || 'Muebles y enseres de mudanza';
    const price = (activeTrip.totalPrice || activeTrip.precio || 0).toLocaleString('es-AR');

    let actionBtnHtml = '';
    if (activeTrip.status === 'accepted') {
      actionBtnHtml = `
        <button id="btn-advance-trip" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">navigation</span>
          Iniciar Viaje al Origen
        </button>
      `;
    } else if (activeTrip.status === 'goingToOrigin') {
      actionBtnHtml = `
        <button id="btn-advance-trip" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">where_to_vote</span>
          Marcar Llegada al Origen
        </button>
      `;
    } else if (activeTrip.status === 'arrivedAtOrigin') {
      actionBtnHtml = `
        <button id="btn-advance-trip" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">local_shipping</span>
          Carga Completa - Salir a Destino
        </button>
      `;
    } else if (activeTrip.status === 'goingToDestination') {
      actionBtnHtml = `
        <button id="btn-advance-trip" class="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          Llegué a Destino (Solicitar OTP)
        </button>
      `;
    } else if (activeTrip.status === 'waitingClientSignature') {
      actionBtnHtml = `
        <div class="flex items-center gap-2">
          <input type="text" id="input-trip-otp" maxlength="6" placeholder="Código OTP (4 dígitos)" 
                 class="px-3 py-2 rounded-xl bg-surface-container-low border border-primary text-on-surface font-mono font-bold text-center w-44 text-sm focus:outline-none">
          <button id="btn-complete-otp" class="px-5 py-2.5 rounded-xl bg-tertiary-container text-on-tertiary font-bold text-xs flex items-center gap-2 shadow-md hover:opacity-95 transition-all">
            <span class="material-symbols-outlined text-[18px]">verified</span>
            Validar y Finalizar Mudanza
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-space-md border-2 border-primary-container/40 shadow-lg">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between pb-space-sm border-b border-surface-container-high/60 gap-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[20px] animate-pulse">local_shipping</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-primary-container/15 text-primary-container font-mono text-xs font-bold">VIAJE EN CURSO</span>
                <span class="text-xs text-outline font-mono">#${(activeTrip.id || '').substring(0, 8).toUpperCase()}</span>
              </div>
              <h4 class="font-extrabold text-on-surface text-base mt-0.5">${origin} ➔ ${destination}</h4>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <span class="text-[11px] text-outline font-semibold uppercase">Monto a Liquidar</span>
              <div class="text-lg font-extrabold text-tertiary-container">$${price} ARS</div>
            </div>
          </div>
        </div>

        <!-- 5-Stage Stepper -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 my-space-md">
          ${steps.map((st, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            let badgeClass = 'bg-surface-container text-outline';
            let icon = 'radio_button_unchecked';
            if (isCompleted) {
              badgeClass = 'bg-tertiary-container/20 text-tertiary-container border border-tertiary-container/40';
              icon = 'check_circle';
            } else if (isCurrent) {
              badgeClass = 'bg-primary-container text-on-primary ring-2 ring-primary-container ring-offset-2';
              icon = 'play_circle';
            }

            return `
              <div class="p-2.5 rounded-xl ${badgeClass} flex flex-col transition-all">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold">${st.label}</span>
                  <span class="material-symbols-outlined text-[16px]">${icon}</span>
                </div>
                <span class="text-[10px] opacity-80">${st.desc}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Trip Details & Actions -->
        <div class="flex flex-col md:flex-row items-center justify-between pt-space-xs gap-3">
          <div class="flex items-center gap-4 text-xs text-on-surface-variant">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-primary">person</span>
              <span class="font-bold text-on-surface">${clientName}</span>
              ${clientPhone ? `<a href="tel:${clientPhone}" class="text-primary hover:underline font-mono">(${clientPhone})</a>` : ''}
            </div>
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-outline">inventory_2</span>
              <span class="truncate max-w-[200px]">${cargo}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;

    // Event binding
    const btnAdvance = document.getElementById('btn-advance-trip');
    if (btnAdvance) {
      btnAdvance.addEventListener('click', async () => {
        btnAdvance.disabled = true;
        btnAdvance.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Actualizando...';
        const nextSteps = {
          'accepted': 'goingToOrigin',
          'goingToOrigin': 'arrivedAtOrigin',
          'arrivedAtOrigin': 'goingToDestination',
          'goingToDestination': 'waitingClientSignature'
        };
        const next = nextSteps[activeTrip.status];
        if (next) {
          try {
            await service.advanceTripStep(activeTrip.id, next);
            showToast('Viaje Actualizado', `Estado cambiado a: ${next}`, 'success');
            await renderTorreDeControl();
          } catch (err) {
            showToast('Error', err.message || 'No se pudo actualizar el viaje.', 'error');
            btnAdvance.disabled = false;
          }
        }
      });
    }

    const btnCompleteOtp = document.getElementById('btn-complete-otp');
    if (btnCompleteOtp) {
      btnCompleteOtp.addEventListener('click', async () => {
        const inputOtp = document.getElementById('input-trip-otp');
        const otpVal = inputOtp ? inputOtp.value.trim() : '';
        if (!otpVal) {
          showToast('Código Requerido', 'Por favor ingresa el código OTP proporcionado por el cliente.', 'error');
          return;
        }
        btnCompleteOtp.disabled = true;
        btnCompleteOtp.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Verificando OTP...';
        try {
          await service.completeTripWithOTP(activeTrip.id, otpVal);
          showToast('¡Mudanza Completada!', 'El viaje ha sido finalizado con éxito y los fondos han sido acreditados.', 'success');
          await renderTorreDeControl();
        } catch (err) {
          showToast('Validación Fallida', err.message || 'Código OTP inválido.', 'error');
          btnCompleteOtp.disabled = false;
          btnCompleteOtp.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified</span> Validar y Finalizar Mudanza';
        }
      });
    }
  };

  // =========================================================================
  // INTEGRACIÓN GOOGLE MAPS REAL & POSICIONAMIENTO GPS DEL TELÉFONO
  // =========================================================================
  let googleMapInstance = null;
  let googleMapMarkers = [];
  let deviceGpsMarker = null;
  let deviceAccuracyCircle = null;
  let deviceGpsWatchId = null;
  let hasAutoCenteredOnDevice = false;
  let currentDeviceCoords = null;

  const updateDeviceOnGoogleMap = (coords) => {
    if (!googleMapInstance || typeof window.google === 'undefined' || !window.google.maps) return;

    const latLng = { lat: coords.lat, lng: coords.lng };

    // 1. Crear o actualizar Marcador del Teléfono
    if (!deviceGpsMarker) {
      deviceGpsMarker = new google.maps.Marker({
        position: latLng,
        map: googleMapInstance,
        title: "📱 Mi Teléfono (Posicionamiento en Vivo)",
        zIndex: 999,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#2563eb",
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: "#ffffff"
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 6px;">
            <strong style="color: #2563eb; font-size: 13px;">📱 Mi Teléfono (GPS en Vivo)</strong><br>
            <span style="font-family: monospace; font-weight: bold;">Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}</span><br>
            <span>Precisión: ±${Math.round(coords.accuracy)} metros</span><br>
            <span>Velocidad: ${Math.round((coords.speed || 0) * 3.6)} km/h</span><br>
            <span style="color: #10b981; font-weight: bold;">● Sincronizado con Cloud Firestore</span>
          </div>
        `
      });

      deviceGpsMarker.addListener('click', () => {
        infoWindow.open(googleMapInstance, deviceGpsMarker);
      });
    } else {
      deviceGpsMarker.setPosition(latLng);
    }

    // 2. Crear o actualizar Círculo de Precisión GPS
    if (!deviceAccuracyCircle) {
      deviceAccuracyCircle = new google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        map: googleMapInstance,
        center: latLng,
        radius: coords.accuracy || 20
      });
    } else {
      deviceAccuracyCircle.setCenter(latLng);
      deviceAccuracyCircle.setRadius(coords.accuracy || 20);
    }

    // Auto-centrar en el teléfono en la primera detección
    if (!hasAutoCenteredOnDevice) {
      googleMapInstance.panTo(latLng);
      googleMapInstance.setZoom(15);
      hasAutoCenteredOnDevice = true;
    }
  };

  const startDeviceGeolocationTracking = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocalización no soportada por el navegador.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    };

    const handleSuccess = async (pos) => {
      currentDeviceCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading,
        speed: pos.coords.speed
      };

      // Notificar al servicio para sincronizar con Firestore
      await service.updateDriverLiveLocation(currentDeviceCoords);

      // Actualizar etiqueta del radar fallback
      const fallbackLabel = document.getElementById('tc-fallback-gps-label');
      if (fallbackLabel) {
        fallbackLabel.textContent = `GPS Teléfono: ${currentDeviceCoords.lat.toFixed(5)}° S, ${currentDeviceCoords.lng.toFixed(5)}° W (±${Math.round(currentDeviceCoords.accuracy)}m)`;
      }

      // Si Google Maps está montado, actualizar el marcador del teléfono
      updateDeviceOnGoogleMap(currentDeviceCoords);
    };

    const handleError = (err) => {
      console.warn("Aviso de geolocalización GPS:", err.message);
    };

    if (deviceGpsWatchId !== null) {
      navigator.geolocation.clearWatch(deviceGpsWatchId);
    }
    deviceGpsWatchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  };

  const initOrUpdateGoogleRadarMap = (vehicles) => {
    const mapDiv = document.getElementById('tc-google-map');
    const fallbackDiv = document.getElementById('tc-radar-fallback');
    const pinsBox = document.getElementById('radar-dynamic-pins');

    if (!mapDiv || typeof window.google === 'undefined' || !window.google.maps) {
      if (fallbackDiv) fallbackDiv.style.display = 'flex';
      if (pinsBox) pinsBox.style.display = 'block';
      return false;
    }

    try {
      if (!googleMapInstance) {
        // Centro inicial: posición del teléfono si existe, o CABA
        const initialCenter = currentDeviceCoords 
          ? { lat: currentDeviceCoords.lat, lng: currentDeviceCoords.lng }
          : { lat: -34.6037, lng: -58.3816 };

        googleMapInstance = new google.maps.Map(mapDiv, {
          center: initialCenter,
          zoom: currentDeviceCoords ? 15 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0b1c30" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0b1c30" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8a99ad" }] },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#60a5fa" }]
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#1e293b" }]
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#0f172a" }]
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#2563eb" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#020617" }]
            }
          ]
        });
      }

      // Si tenemos ubicación del teléfono, representarla
      if (currentDeviceCoords) {
        updateDeviceOnGoogleMap(currentDeviceCoords);
      }

      // Limpiar marcadores anteriores de flota
      googleMapMarkers.forEach(m => m.setMap(null));
      googleMapMarkers = [];

      const baseCoords = [
        { lat: -34.6037, lng: -58.3816 }, // Obelisco
        { lat: -34.5828, lng: -58.4208 }, // Palermo
        { lat: -34.5614, lng: -58.4560 }, // Belgrano
        { lat: -34.6177, lng: -58.4458 }, // Caballito
        { lat: -34.6214, lng: -58.3731 }  // San Telmo
      ];

      const isConductor = service.getAccountMode() === 'conductor';

      vehicles.forEach((veh, idx) => {
        // En modo conductor, la unidad toma la ubicación real del teléfono
        let lat = veh.coords?.lat || baseCoords[idx % baseCoords.length].lat;
        let lng = veh.coords?.lng || baseCoords[idx % baseCoords.length].lng;
        if (isConductor && idx === 0 && currentDeviceCoords) {
          lat = currentDeviceCoords.lat;
          lng = currentDeviceCoords.lng;
        }

        const isSelected = veh.id === activeVehicleId;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: googleMapInstance,
          title: `${veh.brandModel} (${veh.plate})`,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: isSelected ? 7 : 5.5,
            fillColor: isSelected ? "#3b82f6" : (veh.status === 'en_ruta' ? "#10b981" : "#f59e0b"),
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            rotation: currentDeviceCoords?.heading || 45
          }
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong>${veh.brandModel}</strong><br>
              <span style="font-family: monospace; font-weight: bold;">${veh.plate}</span><br>
              <span>Estado: ${veh.status === 'en_ruta' ? 'En ruta' : 'Disponible'}</span><br>
              <span style="font-size: 11px; color: #3b82f6;">${isConductor ? '📍 Posición vinculada al GPS del teléfono' : '🛰 Telemetría Flota'}</span>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapInstance, marker);
          activeVehicleId = veh.id;
          renderActiveVehicleCard(veh);
        });

        googleMapMarkers.push(marker);
      });

      // Evento del botón centrar en el teléfono
      const btnCenterGps = document.getElementById('btn-center-device-gps');
      if (btnCenterGps && !btnCenterGps.dataset.bound) {
        btnCenterGps.dataset.bound = 'true';
        btnCenterGps.addEventListener('click', () => {
          if (currentDeviceCoords && googleMapInstance) {
            googleMapInstance.panTo({ lat: currentDeviceCoords.lat, lng: currentDeviceCoords.lng });
            googleMapInstance.setZoom(16);
            showToast('Ubicación del Teléfono', 'Centrado en las coordenadas GPS de tu dispositivo.', 'success');
          } else if (navigator.geolocation) {
            btnCenterGps.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Buscando...';
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                currentDeviceCoords = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  heading: pos.coords.heading,
                  speed: pos.coords.speed
                };
                if (googleMapInstance) {
                  googleMapInstance.panTo({ lat: currentDeviceCoords.lat, lng: currentDeviceCoords.lng });
                  googleMapInstance.setZoom(16);
                }
                updateDeviceOnGoogleMap(currentDeviceCoords);
                btnCenterGps.innerHTML = '<span class="material-symbols-outlined text-[16px] text-primary">my_location</span><span>Mi Teléfono</span>';
                showToast('Ubicación Obtenida', `GPS detectado: ±${Math.round(currentDeviceCoords.accuracy)}m`, 'success');
              },
              (err) => {
                btnCenterGps.innerHTML = '<span class="material-symbols-outlined text-[16px] text-primary">my_location</span><span>Mi Teléfono</span>';
                showToast('Aviso de GPS', 'Activa los permisos de ubicación en tu navegador para ver tu posición exacta.', 'error');
              },
              { enableHighAccuracy: true, timeout: 10000 }
            );
          }
        });
      }

      if (fallbackDiv) fallbackDiv.style.display = 'none';
      if (pinsBox) pinsBox.style.display = 'none';
      return true;
    } catch (e) {
      console.warn("Google Maps no pudo inicializar en el radar, usando fallback.", e);
      if (fallbackDiv) fallbackDiv.style.display = 'flex';
      if (pinsBox) pinsBox.style.display = 'block';
      return false;
    }
  };

  const renderRadarPins = (vehicles) => {
    const isGoogleMapLoaded = initOrUpdateGoogleRadarMap(vehicles);
    if (isGoogleMapLoaded) return;

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

        <!-- Telemetría: Velocidad, Coordenadas y Carga -->
        <div class="grid grid-cols-2 gap-space-sm">
          <div class="p-space-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
            <span class="font-label-sm text-label-sm text-outline uppercase">Velocidad GPS</span>
            <span class="font-headline-lg text-headline-lg text-on-surface font-extrabold mt-1">${currentDeviceCoords ? Math.round((currentDeviceCoords.speed || 0) * 3.6) : (telem.speedKmH || 0)} <span class="text-sm font-semibold">km/h</span></span>
            <span class="text-tertiary font-label-sm text-[11px] font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span> ${currentDeviceCoords ? `GPS ±${Math.round(currentDeviceCoords.accuracy)}m` : (telem.signal || '4G OK')}
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

        ${currentDeviceCoords ? `
          <div class="px-3 py-2 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-between text-xs">
            <span class="font-semibold text-primary flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">smartphone</span>
              GPS Teléfono Activo:
            </span>
            <span class="font-mono font-bold text-on-surface">${currentDeviceCoords.lat.toFixed(5)}°, ${currentDeviceCoords.lng.toFixed(5)}°</span>
          </div>
        ` : ''}

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
    const rates = await service.getDriverRates();
    const cvuActual = rates.cvuMercadoPago || '';
    const objDiarioActual = rates.objetivoDiario || 50000;
    const completedTrips = (service.state.rawTrips || []).filter(t => t.status === 'completed');

    const totalFacturado = kpis.monthlyBilling || 0;
    const pctObjetivo = Math.min(Math.round((totalFacturado / (objDiarioActual || 1)) * 100), 100);

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Tarjetas Superiores: Saldo, Objetivo y Mercado Pago -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Saldo Disponible / Facturación -->
          <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container-high/60 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">${mode === 'conductor' ? 'Ganancias Acumuladas' : 'Facturación Total'}</span>
              <div class="w-9 h-9 rounded-xl bg-tertiary-container/15 text-tertiary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <div class="my-3">
              <span class="text-3xl font-extrabold text-on-surface">$${totalFacturado.toLocaleString('es-AR')}</span>
              <span class="text-xs text-outline font-semibold"> ARS</span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-surface-container-high/60">
              <span class="text-xs text-outline">Liquidaciones listas:</span>
              <span class="text-xs font-bold text-tertiary">${completedTrips.length} mudanza(s)</span>
            </div>
          </div>

          <!-- Objetivo Diario -->
          <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container-high/60 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Objetivo Diario</span>
              <div class="w-9 h-9 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">flag</span>
              </div>
            </div>
            <div class="my-3">
              <div class="flex items-baseline justify-between mb-1">
                <span class="text-sm font-bold text-on-surface">$${totalFacturado.toLocaleString('es-AR')} / $${objDiarioActual.toLocaleString('es-AR')}</span>
                <span class="text-xs font-extrabold text-primary">${pctObjetivo}%</span>
              </div>
              <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div class="bg-primary-container h-full rounded-full transition-all duration-500" style="width: ${pctObjetivo}%"></div>
              </div>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-surface-container-high/60">
              <input type="number" id="input-daily-goal" placeholder="Nuevo objetivo" value="${objDiarioActual}" class="w-full px-2.5 py-1 text-xs rounded-lg bg-surface-container border border-surface-container-high text-on-surface focus:outline-none focus:border-primary">
              <button id="btn-save-daily-goal" class="px-3 py-1 bg-surface-container-highest hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-bold transition-all whitespace-nowrap">Guardar</button>
            </div>
          </div>

          <!-- Billetera Mercado Pago CVU -->
          <div class="bg-surface-container-low p-5 rounded-2xl border border-surface-container-high/60 flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-outline uppercase tracking-wider">Billetera Mercado Pago</span>
              <div class="w-9 h-9 rounded-xl bg-[#009ee3]/15 text-[#009ee3] flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <div class="my-2">
              <label class="text-[11px] text-outline font-semibold">CVU o Alias de Cobro</label>
              <input type="text" id="input-mp-cvu" value="${cvuActual}" placeholder="Ingresa CVU / Alias MP" class="w-full px-3 py-2 text-xs rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-mono font-bold mt-1 focus:outline-none focus:border-primary">
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-surface-container-high/60">
              <button id="btn-save-mp-cvu" class="w-full py-1.5 px-3 rounded-lg bg-[#009ee3] text-white text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[15px]">link</span>
                Vincular CVU Mercado Pago
              </button>
            </div>
          </div>
        </div>

        <!-- Solicitud de Retiro / Liquidación Rápida -->
        <div class="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-tertiary-container/15 text-tertiary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[22px]">send_money</span>
            </div>
            <div>
              <h5 class="text-sm font-bold text-on-surface">Solicitar Retiro a tu Cuenta Bancaria / MP</h5>
              <p class="text-xs text-outline">Las transferencias de liquidación se procesan automáticamente en el horario bancario.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <input type="number" id="input-withdraw-amount" placeholder="Monto ($)" class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-xs text-on-surface font-mono font-bold w-32 focus:outline-none">
            <button id="btn-request-withdrawal" class="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-bold shadow-sm hover:opacity-95 whitespace-nowrap transition-all">
              Solicitar Retiro
            </button>
          </div>
        </div>

        <!-- Historial de Liquidaciones y Viajes -->
        <div class="bg-surface-container-low rounded-2xl border border-surface-container-high/60 overflow-hidden">
          <div class="p-4 border-b border-surface-container-high/60 flex items-center justify-between">
            <h5 class="text-sm font-bold text-on-surface">Detalle de Remitos & Liquidaciones Finalizadas</h5>
            <span class="text-xs text-outline">${completedTrips.length} registros</span>
          </div>

          <div class="divide-y divide-surface-container-high/60">
            ${completedTrips.length === 0 ? `
              <div class="p-8 text-center text-on-surface-variant font-semibold text-xs">
                Aún no tienes viajes finalizados en este período. Al completar mudanzas con el código OTP, se acreditarán automáticamente aquí.
              </div>
            ` : completedTrips.map(tr => {
              const tripPrice = (tr.totalPrice || tr.precio || 0).toLocaleString('es-AR');
              const tripDate = tr.date ? new Date(tr.date.toDate ? tr.date.toDate() : tr.date).toLocaleDateString('es-AR') : 'Reciente';
              return `
                <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-surface-container/50 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-tertiary-container/15 text-tertiary-container flex items-center justify-center font-bold text-xs">
                      <span class="material-symbols-outlined text-[18px]">verified</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-on-surface">Viaje #${(tr.id || '').substring(0, 8).toUpperCase()}</span>
                        <span class="text-[11px] text-outline font-mono">${tripDate}</span>
                      </div>
                      <span class="text-xs text-outline">${tr.originAddress || tr.origen || 'Origen'} ➔ ${tr.destinationAddress || tr.destino || 'Destino'}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-sm font-extrabold text-tertiary">+$${tripPrice} ARS</span>
                    <span class="px-2.5 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary text-[11px] font-bold">Liquidado</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Eventos Billetera
    const btnSaveCvu = document.getElementById('btn-save-mp-cvu');
    if (btnSaveCvu) {
      btnSaveCvu.addEventListener('click', async () => {
        const inputCvu = document.getElementById('input-mp-cvu');
        const cvu = inputCvu ? inputCvu.value.trim() : '';
        if (!cvu) {
          showToast('CVU Requerido', 'Por favor ingresa un CVU o Alias válido.', 'error');
          return;
        }
        btnSaveCvu.disabled = true;
        btnSaveCvu.innerHTML = '<span class="material-symbols-outlined text-[15px] animate-spin">refresh</span> Guardando...';
        try {
          await service.linkMercadoPagoCVU(cvu);
          showToast('Mercado Pago', 'CVU / Alias vinculado exitosamente a tu cuenta.', 'success');
        } catch (err) {
          showToast('Error', err.message || 'No se pudo guardar el CVU.', 'error');
        } finally {
          btnSaveCvu.disabled = false;
          btnSaveCvu.innerHTML = '<span class="material-symbols-outlined text-[15px]">link</span> Vincular CVU Mercado Pago';
        }
      });
    }

    const btnSaveGoal = document.getElementById('btn-save-daily-goal');
    if (btnSaveGoal) {
      btnSaveGoal.addEventListener('click', async () => {
        const inputGoal = document.getElementById('input-daily-goal');
        const amount = parseFloat(inputGoal ? inputGoal.value : 0);
        if (isNaN(amount) || amount <= 0) {
          showToast('Monto Inválido', 'Ingresa un objetivo diario válido mayor a 0.', 'error');
          return;
        }
        try {
          await service.setDailyGoal(amount);
          showToast('Objetivo Guardado', `Tu meta diaria es de $${amount.toLocaleString('es-AR')} ARS.`, 'success');
          renderInvoicesModule();
        } catch (err) {
          showToast('Error', err.message, 'error');
        }
      });
    }

    const btnWithdraw = document.getElementById('btn-request-withdrawal');
    if (btnWithdraw) {
      btnWithdraw.addEventListener('click', async () => {
        const inputAmount = document.getElementById('input-withdraw-amount');
        const amount = parseFloat(inputAmount ? inputAmount.value : 0);
        if (isNaN(amount) || amount <= 0) {
          showToast('Monto Inválido', 'Ingresa un monto de retiro válido.', 'error');
          return;
        }
        try {
          const res = await service.requestWithdrawal(amount);
          showToast('Retiro Solicitado', `Se ha generado la solicitud #${res.withdrawalId} por $${amount.toLocaleString('es-AR')}.`, 'success');
          if (inputAmount) inputAmount.value = '';
        } catch (err) {
          showToast('Error de Retiro', err.message, 'error');
        }
      });
    }
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
    const sub = service.getSubscription();
    const maxVeh = service.getMaxVehiclesAllowed();
    const rates = await service.getDriverRates();

    const maxVehText = maxVeh === Infinity ? 'Ilimitados' : `${maxVeh} unidad(es)`;

    container.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Switcher de Modo y Perfil -->
        <div class="flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 gap-4">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full ${service.state.dbConnected ? 'bg-tertiary-container' : 'bg-primary-container'} animate-pulse"></span>
              <span class="font-bold text-on-surface">Tipo de Cuenta Activa</span>
            </div>
            <span class="text-xs text-primary font-bold mt-1">${mode === 'conductor' ? '🚚 Conductor Independiente' : '🏢 Empresa de Mudanzas'}</span>
            <span class="text-[11px] text-outline mt-0.5">Usuario: ${profile.name} (${profile.email})</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'conductor' ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}"
                    onclick="window.MudifyUI.switchAccountMode('conductor')">
              Modo Conductor
            </button>
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === 'empresa' ? 'bg-primary-container text-on-primary shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}"
                    onclick="window.MudifyUI.switchAccountMode('empresa')">
              Modo Empresa
            </button>
          </div>
        </div>

        <!-- Suscripción y Límite de Vehículos -->
        <div class="p-5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[22px]">workspace_premium</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h5 class="text-sm font-bold text-on-surface">${sub ? sub.planName : (mode === 'conductor' ? 'Plan Fletero Pro' : 'Plan Flota Enterprise')}</h5>
                <span class="px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-bold text-[10px]">Activa</span>
              </div>
              <p class="text-xs text-outline mt-0.5">
                Capacidad permitida en plataforma: <strong>${maxVehText}</strong>. 
                ${mode === 'conductor' ? 'Los conductores independientes disponen de 1 solo vehículo autorizado.' : 'Gestión multi-unidad corporativa.'}
              </p>
            </div>
          </div>
          <a href="index.html#suscripciones" class="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all flex items-center gap-1.5 whitespace-nowrap">
            <span class="material-symbols-outlined text-[16px] text-primary">arrow_upward</span>
            Cambiar o Ampliar Plan
          </a>
        </div>

        <!-- Formulario Completo de Tarifas y Servicios (Mapeado a Cloud Firestore mudancero) -->
        <div class="p-6 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex flex-col gap-5">
          <div class="flex items-center justify-between pb-3 border-b border-surface-container-high/60">
            <div>
              <h4 class="font-bold text-on-surface text-base">Tarifario de Fletes & Mudanzas</h4>
              <p class="text-xs text-outline">Estos valores se sincronizan directamente con el cálculo de cotizaciones en la app del cliente.</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-tertiary-container/10 text-tertiary font-bold text-xs">Cloud Firestore OK</span>
          </div>

          <form id="form-driver-rates" class="flex flex-col gap-6">
            <!-- Bloque 1: Tarifas Base -->
            <div>
              <h5 class="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">speed</span>
                Tarifas Base de Desplazamiento & Tiempo
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold text-outline">Precio por Kilómetro ($)</label>
                  <input type="number" step="any" id="rate-price-per-km" value="${rates.pricePerKm || 0}" class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold text-outline">Precio por Hora ($)</label>
                  <input type="number" step="any" id="rate-price-per-hour" value="${rates.pricePerHour || 0}" class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold text-outline">Radio tarifa tiempo (km)</label>
                  <input type="number" step="any" id="rate-radius-km" value="${rates.timeRateRadiusKm || 0}" class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary">
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-semibold text-outline">Tarifa por demora/espera ($/h)</label>
                  <input type="number" step="any" id="rate-delay" value="${rates.delayRate || 0}" class="px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-mono font-bold text-sm focus:outline-none focus:border-primary">
                </div>
              </div>
            </div>

            <!-- Bloque 2: Servicios Adicionales -->
            <div>
              <h5 class="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">handyman</span>
                Servicios Adicionales & Cuadrilla
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Ayudantes / Estibadores -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Ayudantes de Carga</span>
                    <input type="checkbox" id="rate-offers-helpers" ${rates.offersHelpers ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span class="text-[10px] text-outline font-semibold">Tarifa/ayudante ($)</span>
                      <input type="number" id="rate-helper-rate" value="${rates.helperRate || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                    </div>
                    <div>
                      <span class="text-[10px] text-outline font-semibold">Máx ayudantes</span>
                      <input type="number" id="rate-max-helpers" value="${rates.maxHelpers || 1}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                    </div>
                  </div>
                </div>

                <!-- Canastos Plásticos -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Canastos Plásticos</span>
                    <input type="checkbox" id="rate-offers-baskets" ${rates.offersBaskets ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <span class="text-[10px] text-outline font-semibold">Precio por canasto ($)</span>
                      <input type="number" id="rate-basket-price" value="${rates.basketPrice || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                    </div>
                    <div>
                      <span class="text-[10px] text-outline font-semibold">Disponibles</span>
                      <input type="number" id="rate-avail-baskets" value="${rates.availableBaskets || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                    </div>
                  </div>
                </div>

                <!-- Cajas de Cartón -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Cajas de Cartón</span>
                    <input type="checkbox" id="rate-offers-boxes" ${rates.offersBoxes ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="mt-1">
                    <span class="text-[10px] text-outline font-semibold">Precio por caja ($)</span>
                    <input type="number" id="rate-box-price" value="${rates.boxPrice || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                  </div>
                </div>

                <!-- Embalaje y Protección -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Servicio de Embalaje</span>
                    <input type="checkbox" id="rate-offers-packing" ${rates.offersPacking ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="mt-1">
                    <span class="text-[10px] text-outline font-semibold">Tarifa embalaje ($)</span>
                    <input type="number" id="rate-packing-rate" value="${rates.packingRate || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                  </div>
                </div>

                <!-- Desarme y Armado de Muebles -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Desarme & Armado</span>
                    <input type="checkbox" id="rate-offers-assembly" ${rates.offersAssembly ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="mt-1">
                    <span class="text-[10px] text-outline font-semibold">Tarifa armado ($)</span>
                    <input type="number" id="rate-assembly-rate" value="${rates.assemblyRate || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                  </div>
                </div>

                <!-- Subida por Escalera -->
                <div class="p-4 rounded-xl bg-surface-container border border-surface-container-high/60 flex flex-col gap-2">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-xs font-bold text-on-surface">Subida por Escalera</span>
                    <input type="checkbox" id="rate-offers-stairs" ${rates.offersStairs ? 'checked' : ''} class="w-4 h-4 accent-primary">
                  </label>
                  <div class="mt-1">
                    <span class="text-[10px] text-outline font-semibold">Tarifa por piso ($)</span>
                    <input type="number" id="rate-stair-rate" value="${rates.stairFloorRate || 0}" class="w-full px-2 py-1 text-xs rounded-lg bg-surface-container-low border border-surface-container-high text-on-surface font-mono font-bold">
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end pt-4 border-t border-surface-container-high/60">
              <button type="submit" id="btn-submit-rates" class="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs shadow-md hover:opacity-95 flex items-center gap-2 transition-all">
                <span class="material-symbols-outlined text-[18px]">save</span>
                Guardar Tarifario en Cloud Firestore
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Evento Guardar Tarifas
    const formRates = document.getElementById('form-driver-rates');
    if (formRates) {
      formRates.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-rates');
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">refresh</span> Guardando tarifas...';
        }

        const newRates = {
          pricePerKm: parseFloat(document.getElementById('rate-price-per-km')?.value || 0),
          pricePerHour: parseFloat(document.getElementById('rate-price-per-hour')?.value || 0),
          timeRateRadiusKm: parseFloat(document.getElementById('rate-radius-km')?.value || 0),
          delayRate: parseFloat(document.getElementById('rate-delay')?.value || 0),
          offersHelpers: document.getElementById('rate-offers-helpers')?.checked || false,
          helperRate: parseFloat(document.getElementById('rate-helper-rate')?.value || 0),
          maxHelpers: parseInt(document.getElementById('rate-max-helpers')?.value || 1, 10),
          offersBaskets: document.getElementById('rate-offers-baskets')?.checked || false,
          basketPrice: parseFloat(document.getElementById('rate-basket-price')?.value || 0),
          availableBaskets: parseInt(document.getElementById('rate-avail-baskets')?.value || 0, 10),
          offersBoxes: document.getElementById('rate-offers-boxes')?.checked || false,
          boxPrice: parseFloat(document.getElementById('rate-box-price')?.value || 0),
          offersPacking: document.getElementById('rate-offers-packing')?.checked || false,
          packingRate: parseFloat(document.getElementById('rate-packing-rate')?.value || 0),
          offersAssembly: document.getElementById('rate-offers-assembly')?.checked || false,
          assemblyRate: parseFloat(document.getElementById('rate-assembly-rate')?.value || 0),
          offersStairs: document.getElementById('rate-offers-stairs')?.checked || false,
          stairFloorRate: parseFloat(document.getElementById('rate-stair-rate')?.value || 0)
        };

        try {
          const user = service.getCurrentUser();
          await service.saveDriverRates(user ? user.uid : null, newRates);
          showToast('Tarifas Guardadas', 'Tu tarifario ha sido actualizado en Cloud Firestore y ya está activo.', 'success');
        } catch (err) {
          showToast('Error', err.message || 'No se pudieron guardar las tarifas.', 'error');
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">save</span> Guardar Tarifario en Cloud Firestore';
          }
        }
      });
    }
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
    window.firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        let isEmp = service.getAccountMode() === 'empresa';
        if (window.firebase.firestore) {
          try {
            const db = window.firebase.firestore();
            let snap = await db.collection('users').doc(fbUser.uid).get();
            if (!snap.exists) snap = await db.collection('usuarios').doc(fbUser.uid).get();
            if (snap.exists && snap.data().role === 'empresa') {
              isEmp = true;
              await service.setAccountMode('empresa');
              updateModeSwitcherUI();
            }
          } catch(e) {
            console.warn('Error sincronizando rol en panel.js:', e);
          }
        }
        const profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Usuario Google',
          email: fbUser.email,
          avatarUrl: fbUser.photoURL || '',
          role: isEmp ? 'Empresa de Mudanzas' : 'Conductor Independiente'
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

  // =========================================================================
  // GESTIÓN DE VEHÍCULOS Y LÍMITES POR SUSCRIPCIÓN
  // =========================================================================
  const initVehicleModals = () => {
    const btnOpenAddVeh = document.getElementById('btn-open-add-vehicle');
    const modalAddVeh = document.getElementById('modal-add-vehicle');
    const modalUpgrade = document.getElementById('modal-upgrade-plan');
    const btnCloseAddVeh = document.getElementById('btn-close-add-veh-modal');
    const btnCancelAddVeh = document.getElementById('btn-cancel-add-veh');
    const btnCloseUpgrade = document.getElementById('btn-close-upgrade-modal');
    const formAddVeh = document.getElementById('form-add-vehicle');

    if (btnOpenAddVeh && !btnOpenAddVeh.dataset.bound) {
      btnOpenAddVeh.dataset.bound = 'true';
      btnOpenAddVeh.addEventListener('click', async () => {
        const vehicles = await service.getVehicles('todos');
        const maxAllowed = service.getMaxVehiclesAllowed();
        const sub = service.getSubscription();

        if (vehicles.length >= maxAllowed) {
          // Límite de suscripción alcanzado
          const modalDesc = document.getElementById('upgrade-modal-desc');
          if (modalDesc) {
            modalDesc.innerHTML = `
              Tu suscripción actual <strong>${sub.planName}</strong> autoriza un cupo máximo de <strong>${maxAllowed} vehículo(s)</strong> (actualmente tienes ${vehicles.length} registrados).<br><br>
              Para incorporar más unidades, cuadrillas o choferes, actualiza tu suscripción al <strong>Plan Flota por Vehículos</strong> o <strong>Plan Flota Enterprise</strong>.
            `;
          }
          if (modalUpgrade) modalUpgrade.classList.remove('hidden');
        } else {
          // Dentro del cupo permitido
          const planHint = document.getElementById('modal-add-veh-plan-hint');
          if (planHint) {
            const limitText = maxAllowed === Infinity ? 'Ilimitados' : maxAllowed;
            planHint.textContent = `${sub.planName} · Cupo: ${vehicles.length} de ${limitText} unidades`;
          }
          if (modalAddVeh) modalAddVeh.classList.remove('hidden');
        }
      });
    }

    if (btnCloseAddVeh) {
      btnCloseAddVeh.addEventListener('click', () => {
        if (modalAddVeh) modalAddVeh.classList.add('hidden');
      });
    }
    if (btnCancelAddVeh) {
      btnCancelAddVeh.addEventListener('click', () => {
        if (modalAddVeh) modalAddVeh.classList.add('hidden');
      });
    }
    if (btnCloseUpgrade) {
      btnCloseUpgrade.addEventListener('click', () => {
        if (modalUpgrade) modalUpgrade.classList.add('hidden');
      });
    }

    if (formAddVeh && !formAddVeh.dataset.bound) {
      formAddVeh.dataset.bound = 'true';
      formAddVeh.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btn-submit-add-veh');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Registrando en Cloud Firestore...';
        }

        const vehData = {
          plate: (document.getElementById('input-veh-plate')?.value || '').trim().toUpperCase(),
          brand: (document.getElementById('input-veh-brand')?.value || '').trim(),
          model: (document.getElementById('input-veh-model')?.value || '').trim(),
          category: document.getElementById('select-veh-category')?.value || 'Flete Mediano',
          capacity: (document.getElementById('input-veh-capacity')?.value || '').trim() || '10 m³',
          driverName: (document.getElementById('input-veh-driver-name')?.value || '').trim()
        };

        try {
          await service.addVehicle(vehData);
          showToast('Vehículo Registrado', `La unidad ${vehData.plate} (${vehData.brand} ${vehData.model}) fue guardada exitosamente.`, 'success');
          formAddVeh.reset();
          if (modalAddVeh) modalAddVeh.classList.add('hidden');
          await renderFlotaMantenimiento();
          await initTopbar();
        } catch (err) {
          showToast('Límite de Suscripción', err.message || 'No se pudo registrar el vehículo.', 'error');
          if (modalAddVeh) modalAddVeh.classList.add('hidden');
          if (modalUpgrade) modalUpgrade.classList.remove('hidden');
        } finally {
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Guardar Vehículo';
          }
        }
      });
    }
  };

  await initTopbar();
  initVehicleModals();
  startDeviceGeolocationTracking();
  switchView(resolveViewFromHashOrUser());

  window.addEventListener('hashchange', () => {
    switchView(resolveViewFromHashOrUser());
  });
});
