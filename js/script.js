document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');

  // ===== REVEAL ON SCROLL =====
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');

      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // 80px offset for sticky header
          behavior: 'smooth'
        });
      }
    });
  });

  // Mobile menu
  let closeMobileMenu = () => { };
  if (mobileMenuBtn) {
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.id = 'mobileMenu';
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.innerHTML = `
      <nav class="mobile-menu__inner" aria-label="Navegación móvil">
        <a href="#viajar">Para Clientes</a>
        <a href="#conducir">Para Conductores</a>
        <a href="#empresas">Para Empresas</a>
        <a href="#suscripciones">Suscripciones (60 Días Gratis)</a>
        <a href="#como-funciona">Cómo Funciona</a>
        <a href="#faq">Ayuda</a>
        <div class="mobile-menu-auth" id="mobileMenuAuth"></div>
        <a href="#descargar-app" class="btn btn--primary">Descargar la app</a>
      </nav>`;
    document.body.appendChild(mobileMenu);

    closeMobileMenu = () => {
      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    };

    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', event => {
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          event.preventDefault();
          window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
        closeMobileMenu();
      });
    });

    document.addEventListener('click', event => {
      if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        closeMobileMenu();
      }
    });
  }

  // FAQ Accordion logic
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      // Toggle current answer
      const answer = question.nextElementSibling;
      const isActive = question.classList.contains('active');

      // Close all other answers (optional accordion behavior)
      document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
        q.nextElementSibling.style.maxHeight = null;
      });

      // If it wasn't active, open it
      if (!isActive) {
        question.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  // Counter Animation Logic
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // The lower the slower

  const animateCounters = () => {
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText;

        const inc = target / speed;

        if (count < target) {
          counter.innerText = Math.ceil(count + inc);
          setTimeout(updateCount, 15);
        } else {
          // Format with commas if it's a large number
          if (target > 999) {
            counter.innerText = target.toLocaleString('es-AR');
          } else {
            counter.innerText = target;
          }
        }
      };
      updateCount();
    });
  };

  // Trigger animation when stats section is in view
  const statsSection = document.querySelector('.stats-band');
  if (statsSection) {
    const observer = new IntersectionObserver((entries, observer) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        animateCounters();
        observer.unobserve(statsSection);
      }
    }, {
      root: null,
      threshold: 0.5,
    });
    observer.observe(statsSection);
  }

  // ===== B2B INDUSTRY TABS =====
  const b2bTabs = document.querySelectorAll('.b2b-tab');
  const b2bPanels = document.querySelectorAll('.b2b-tab-content');

  b2bTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = `tab-${tab.getAttribute('data-tab')}`;

      b2bTabs.forEach(t => t.classList.remove('active'));
      b2bPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // ===== B2B MODAL INTERACTION =====
  const b2bModal = document.getElementById('b2bModal');
  const closeB2bBtn = document.getElementById('closeB2bModal');
  const b2bOpenButtons = document.querySelectorAll('.b2b-open-modal');
  const b2bForm = document.getElementById('b2bForm');
  const b2bSuccess = document.getElementById('b2bSuccess');
  const btnOkB2b = document.getElementById('btnOkB2b');

  const openModal = () => {
    if (!b2bModal) return;
    b2bModal.classList.add('open');
    b2bModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!b2bModal) return;
    b2bModal.classList.remove('open');
    b2bModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  b2bOpenButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeB2bBtn) {
    closeB2bBtn.addEventListener('click', closeModal);
  }

  if (b2bModal) {
    b2bModal.addEventListener('click', (e) => {
      if (e.target === b2bModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && b2bModal && b2bModal.classList.contains('open')) {
      closeModal();
    }
  });

  if (b2bForm) {
    b2bForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const empresa = document.getElementById('empresaNombre')?.value || '';
      const flota = document.getElementById('empresaFlota')?.value || '';
      const peones = document.getElementById('empresaPeones')?.value || '';
      const zona = document.getElementById('empresaZona')?.value || '';
      const contacto = document.getElementById('empresaContacto')?.value || '';
      const telefono = document.getElementById('empresaTelefono')?.value || '';
      const email = document.getElementById('empresaEmail')?.value || '';

      // Visual feedback
      b2bForm.style.display = 'none';
      if (b2bSuccess) {
        b2bSuccess.style.display = 'block';
      }

      console.log('Solicitud de alta de empresa de mudanzas recibida:', { empresa, flota, peones, zona, contacto, telefono, email });
    });
  }

  if (btnOkB2b) {
    btnOkB2b.addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        if (b2bForm) {
          b2bForm.reset();
          b2bForm.style.display = 'flex';
        }
        if (b2bSuccess) {
          b2bSuccess.style.display = 'none';
        }
      }, 400);
    });
  }

  // ========================================================
  // SISTEMA DE AUTENTICACIÓN GOOGLE Y BASE DE DATOS (FIREBASE)
  // ========================================================

  // Configuración oficial de Firebase para Mudify Web
  const firebaseConfig = {
    apiKey: "AIzaSyCawyfIZozyoWixe4sH3SoJ9qbcgZeRFDQ",
    authDomain: "mudiweb-7d4a2.firebaseapp.com",
    projectId: "mudiweb-7d4a2",
    storageBucket: "mudiweb-7d4a2.firebasestorage.app",
    messagingSenderId: "94905247875",
    appId: "1:94905247875:web:36a8c9a5922b3b181213b6",
    measurementId: "G-0YM8ZT13J5"
  };

  const AUTH_STORAGE_KEY = 'mudify_user_session';

  // Inicialización de servicios de Firebase (Auth y Firestore Database)
  let firebaseAuth = null;
  let firestoreDb = null;
  let googleAuthProvider = null;

  try {
    if (window.firebase && !window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    if (window.firebase) {
      firebaseAuth = window.firebase.auth();
      firestoreDb = window.firebase.firestore();
      googleAuthProvider = new window.firebase.auth.GoogleAuthProvider();
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
    }
  } catch (err) {
    console.error('Error inicializando Firebase SDK:', err);
  }

  // Elementos del Header
  const headerAuthGuest = document.getElementById('headerAuthGuest');
  const headerAuthUser = document.getElementById('headerAuthUser');
  const headerLoginBtn = document.getElementById('headerLoginBtn');
  const headerRegisterBtn = document.getElementById('headerRegisterBtn');
  const userChipBtn = document.getElementById('userChipBtn');
  const userChipAvatar = document.getElementById('userChipAvatar');
  const userChipName = document.getElementById('userChipName');
  const userChipRole = document.getElementById('userChipRole');
  const userDropdownCard = document.getElementById('userDropdownCard');
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');
  const dropdownRoleLink = document.getElementById('dropdownRoleLink');
  const dropdownRoleIcon = document.getElementById('dropdownRoleIcon');
  const dropdownRoleTitle = document.getElementById('dropdownRoleTitle');
  const dropdownRoleSubtitle = document.getElementById('dropdownRoleSubtitle');
  const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');

  // Elementos del Modal de Autenticación
  const authModal = document.getElementById('authModal');
  const closeAuthModalBtn = document.getElementById('closeAuthModal');
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const authModalTitle = document.getElementById('authModalTitle');
  const authModalSubtitle = document.getElementById('authModalSubtitle');
  const authRoleSection = document.getElementById('authRoleSection');
  const authRoleCards = document.querySelectorAll('.auth-role-card');
  const googleAuthBtn = document.getElementById('googleAuthBtn');
  const googleBtnLabel = document.getElementById('googleBtnLabel');
  const authGooglePrompt = document.getElementById('authGooglePrompt');

  let currentAuthTab = 'login'; // 'login' | 'register'
  let selectedUserRole = 'cliente'; // 'cliente' | 'conductor' | 'empresa'

  // Helper de Notificaciones Toast
  const showToast = (title, message, type = 'info', duration = 4000) => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-text">
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, duration);
  };

  // Helper para obtener y guardar sesión
  const getStoredUser = () => {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  };

  const saveUserSession = (user) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error guardando sesión:', e);
    }
    renderAuthState();
  };

  const clearUserSession = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    renderAuthState();
  };

  // Actualización visual del estado del Header
  const renderAuthState = () => {
    const user = getStoredUser();

    if (user) {
      // Estado con usuario conectado
      if (headerAuthGuest) headerAuthGuest.style.display = 'none';
      if (headerAuthUser) headerAuthUser.style.display = 'flex';

      const avatarSrc = user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80';
      if (userChipAvatar) userChipAvatar.src = avatarSrc;
      if (dropdownAvatar) dropdownAvatar.src = avatarSrc;

      const firstName = user.name ? user.name.split(' ')[0] : 'Usuario';
      if (userChipName) userChipName.textContent = firstName;
      if (dropdownUserName) dropdownUserName.textContent = user.name || 'Usuario Mudify';
      if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';

      let roleLabel = 'Cliente';
      if (user.role === 'conductor') roleLabel = 'Conductor';
      if (user.role === 'empresa') roleLabel = 'Empresa';

      if (userChipRole) userChipRole.textContent = roleLabel;

      // Personalizar accesos según el rol
      if (dropdownRoleLink && dropdownRoleIcon && dropdownRoleTitle && dropdownRoleSubtitle) {
        if (user.role === 'conductor') {
          dropdownRoleIcon.textContent = '🚛';
          dropdownRoleTitle.textContent = 'Mi Panel de Conductor';
          dropdownRoleSubtitle.textContent = 'Viajes disponibles y ganancias';
          dropdownRoleLink.setAttribute('href', '#conducir');
        } else if (user.role === 'empresa') {
          dropdownRoleIcon.textContent = '🏢';
          dropdownRoleTitle.textContent = 'Panel Mudify Business';
          dropdownRoleSubtitle.textContent = 'Gestión de flota y despachos';
          dropdownRoleLink.setAttribute('href', '#empresas');
        } else {
          dropdownRoleIcon.textContent = '📦';
          dropdownRoleTitle.textContent = 'Mis Mudanzas y Cotizaciones';
          dropdownRoleSubtitle.textContent = 'Ver solicitudes y presupuestos';
          dropdownRoleLink.setAttribute('href', '#descargar-app');
        }
      }

      // Personalizar enlace de suscripción y período de gracia
      const dropdownSubscriptionLink = document.getElementById('dropdownSubscriptionLink');
      const dropdownSubTitle = document.getElementById('dropdownSubTitle');
      const dropdownSubSubtitle = document.getElementById('dropdownSubSubtitle');
      const dropdownSubIcon = document.getElementById('dropdownSubIcon');

      if (dropdownSubscriptionLink && dropdownSubTitle && dropdownSubSubtitle && dropdownSubIcon) {
        if (user.role === 'conductor' || user.role === 'empresa') {
          const daysLeft = user.subscription?.daysRemaining || 60;
          dropdownSubIcon.textContent = '🎁';
          dropdownSubTitle.textContent = 'Mi Suscripción';
          dropdownSubSubtitle.textContent = `⏳ ${daysLeft} días bonificados ($0)`;
        } else {
          dropdownSubIcon.textContent = '✨';
          dropdownSubTitle.textContent = 'Cuenta Cliente Gratuita';
          dropdownSubSubtitle.textContent = '100% Exenta de suscripción ($0)';
        }
      }
    } else {
      // Estado visitante
      if (headerAuthGuest) headerAuthGuest.style.display = 'flex';
      if (headerAuthUser) headerAuthUser.style.display = 'none';
      if (userDropdownCard) userDropdownCard.classList.remove('show');
      if (userChipBtn) {
        userChipBtn.classList.remove('open');
        userChipBtn.setAttribute('aria-expanded', 'false');
      }
    }

    // Sincronizar estado en menú móvil
    const mobileMenuAuth = document.getElementById('mobileMenuAuth');
    if (mobileMenuAuth) {
      if (user) {
        const roleLabel = user.role === 'conductor' ? 'Conductor' : user.role === 'empresa' ? 'Empresa' : 'Cliente';
        mobileMenuAuth.innerHTML = `
          <div style="padding: 0.75rem 0.5rem; background: var(--blue-50); border-radius: 12px; margin: 0.5rem 0; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${user.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid var(--blue-600);" alt="Avatar">
              <div style="display: flex; flex-direction: column;">
                <strong style="font-size: 0.85rem; color: var(--black); line-height: 1.2;">${user.name}</strong>
                <span style="font-size: 0.7rem; color: var(--blue-600); font-weight: 700; text-transform: uppercase;">${roleLabel}</span>
              </div>
            </div>
            <button type="button" id="mobileLogoutBtn" style="border: none; background: transparent; color: #dc2626; font-size: 0.8rem; font-weight: 700; cursor: pointer; padding: 4px 8px;">Salir</button>
          </div>
        `;
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
          mobileLogoutBtn.addEventListener('click', () => {
            clearUserSession();
            closeMobileMenu();
            showToast('Sesión finalizada', 'Has cerrado sesión en Mudify correctamente.', 'info');
          });
        }
      } else {
        mobileMenuAuth.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.45rem; margin: 0.5rem 0;">
            <button type="button" class="btn btn--text" id="mobileLoginBtn" style="width: 100%; border: 1.5px solid var(--gray-200); border-radius: 100px; padding: 0.65rem;">Iniciar sesión</button>
            <button type="button" class="btn btn--primary" id="mobileRegisterBtn" style="width: 100%; padding: 0.65rem;">Registrarse con Google</button>
          </div>
        `;
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');
        if (mobileLoginBtn) {
          mobileLoginBtn.addEventListener('click', () => {
            closeMobileMenu();
            openAuthModal('login');
          });
        }
        if (mobileRegisterBtn) {
          mobileRegisterBtn.addEventListener('click', () => {
            closeMobileMenu();
            openAuthModal('register');
          });
        }
      }
    }
  };

  let pendingPlanType = null;

  // Abrir y cerrar Modal de Autenticación
  const openAuthModal = (tab = 'login', role = 'cliente', plan = null) => {
    currentAuthTab = tab;
    selectedUserRole = role;
    pendingPlanType = plan;

    // Configurar Tabs
    if (tab === 'register') {
      if (tabBtnRegister) tabBtnRegister.classList.add('active');
      if (tabBtnLogin) tabBtnLogin.classList.remove('active');
      if (authRoleSection) authRoleSection.style.display = 'block';
      if (authModalTitle) authModalTitle.textContent = 'Creá tu cuenta en Mudify';
      if (authModalSubtitle) authModalSubtitle.textContent = 'Elegí tu perfil y vinculá tu cuenta de Google en 1 clic.';
      if (googleBtnLabel) googleBtnLabel.textContent = 'Registrarme con Google';
      if (authGooglePrompt) authGooglePrompt.textContent = '2. Registro instantáneo con Google:';
    } else {
      if (tabBtnLogin) tabBtnLogin.classList.add('active');
      if (tabBtnRegister) tabBtnRegister.classList.remove('active');
      if (authRoleSection) authRoleSection.style.display = 'none';
      if (authModalTitle) authModalTitle.textContent = 'Accedé a Mudify';
      if (authModalSubtitle) authModalSubtitle.textContent = 'Iniciá sesión de forma rápida y segura con tu cuenta de Google.';
      if (googleBtnLabel) googleBtnLabel.textContent = 'Continuar con Google';
      if (authGooglePrompt) authGooglePrompt.textContent = 'Acceso oficial con Google:';
    }

    // Preseleccionar rol
    authRoleCards.forEach(card => {
      const cardRole = card.getAttribute('data-role');
      const radio = card.querySelector('.auth-role-radio');
      if (cardRole === role) {
        card.classList.add('active');
        if (radio) radio.checked = true;
      } else {
        card.classList.remove('active');
        if (radio) radio.checked = false;
      }
    });

    if (authModal) {
      authModal.classList.add('open');
      authModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeAuthModal = () => {
    if (authModal) {
      authModal.classList.remove('open');
      authModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  // Manejo de tabs en el modal
  if (tabBtnLogin) {
    tabBtnLogin.addEventListener('click', () => openAuthModal('login', selectedUserRole));
  }
  if (tabBtnRegister) {
    tabBtnRegister.addEventListener('click', () => openAuthModal('register', selectedUserRole));
  }

  // Selección de rol en registro
  authRoleCards.forEach(card => {
    card.addEventListener('click', () => {
      authRoleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('.auth-role-radio');
      if (radio) {
        radio.checked = true;
        selectedUserRole = radio.value;
      }
    });
  });

  // Triggers de botones del Header
  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', () => openAuthModal('login'));
  }
  if (headerRegisterBtn) {
    headerRegisterBtn.addEventListener('click', () => openAuthModal('register'));
  }
  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  // Toggle Menú de Usuario (Dropdown)
  if (userChipBtn && userDropdownCard) {
    userChipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = userDropdownCard.classList.toggle('show');
      userChipBtn.classList.toggle('open', isOpen);
      userChipBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!userDropdownCard.contains(e.target) && !userChipBtn.contains(e.target)) {
        userDropdownCard.classList.remove('show');
        userChipBtn.classList.remove('open');
        userChipBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Cerrar Sesión con Firebase
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', async () => {
      try {
        if (firebaseAuth) {
          await firebaseAuth.signOut();
        }
      } catch (e) {
        console.warn('Aviso al cerrar sesión en Firebase:', e);
      }
      clearUserSession();
      showToast('Sesión finalizada', 'Has cerrado sesión en Mudify correctamente.', 'info');
    });
  }

  // ========================================================
  // AUTENTICACIÓN GOOGLE REAL CON FIREBASE AUTH Y FIRESTORE
  // ========================================================

  const processFirebaseUser = async (fbUser, isRegister, chosenRole) => {
    let role = chosenRole || 'cliente';
    let subscriptionData = null;

    // 1. Intentar leer perfil existente en la colección 'usuarios' de Firestore
    if (firestoreDb) {
      try {
        const userDocRef = firestoreDb.collection('usuarios').doc(fbUser.uid);
        const userDocSnap = await userDocRef.get();

        if (userDocSnap.exists) {
          const data = userDocSnap.data();
          if (data.role) role = data.role;
          if (data.subscription) subscriptionData = data.subscription;
        }
      } catch (err) {
        console.warn('Aviso al leer de Firestore (se continúa con sesión activa):', err);
      }
    }

    // 2. Si es nuevo usuario o no tiene suscripción registrada, inicializarla según el rol y plan
    if (!subscriptionData) {
      const now = new Date();
      const trialEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

      if (role === 'conductor') {
        subscriptionData = {
          status: 'trial_active',
          planType: 'fletero_pro',
          planName: 'Plan Fletero Pro (1 Vehículo)',
          trialDaysTotal: 60,
          daysRemaining: 60,
          startDate: now.toLocaleDateString('es-AR'),
          endDate: trialEnd.toLocaleDateString('es-AR'),
          price: 0,
          currency: 'ARS'
        };
      } else if (role === 'empresa') {
        const isDashboard = pendingPlanType === 'dashboard_completo';
        subscriptionData = {
          status: 'trial_active',
          planType: isDashboard ? 'dashboard_completo' : 'flota_vehiculos',
          planName: isDashboard ? 'Plan Flota Enterprise (Dashboard Completo)' : 'Plan Flota por Vehículos',
          trialDaysTotal: 60,
          daysRemaining: 60,
          startDate: now.toLocaleDateString('es-AR'),
          endDate: trialEnd.toLocaleDateString('es-AR'),
          price: 0,
          currency: 'ARS'
        };
      } else {
        subscriptionData = {
          status: 'exempt',
          planName: 'Cuenta Cliente Gratuita',
          description: 'Exenta de suscripción (100% Gratis)'
        };
      }
    }

    // 3. Crear objeto de sesión unificado con datos reales de Google
    const userObj = {
      uid: fbUser.uid,
      name: fbUser.displayName || 'Usuario Google',
      email: fbUser.email,
      picture: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      role: role,
      provider: 'google',
      subscription: subscriptionData,
      lastLoginAt: new Date().toISOString()
    };

    // 4. Guardar/actualizar en la base de datos Firestore
    if (firestoreDb) {
      try {
        await firestoreDb.collection('usuarios').doc(fbUser.uid).set({
          uid: userObj.uid,
          name: userObj.name,
          email: userObj.email,
          picture: userObj.picture,
          role: userObj.role,
          subscription: userObj.subscription,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Usuario sincronizado en base de datos Firestore:', userObj.email);
      } catch (err) {
        console.warn('Aviso al guardar en Firestore:', err);
      }
    }

    saveUserSession(userObj);
    closeAuthModal();
    pendingPlanType = null;

    if (isRegister) {
      if (role === 'conductor') {
        showToast('🎉 ¡60 días gratis activados!', `Bienvenido a Mudify, ${userObj.name}. Tu período de gracia de 60 días como Fletero Pro ya está activo ($0 ARS).`, 'success', 6000);
      } else if (role === 'empresa') {
        showToast('🎉 ¡Flota bonificada por 60 días!', `Bienvenido a Mudify, ${userObj.name}. Tu empresa cuenta con 60 días sin costo de suscripción.`, 'success', 6000);
      } else {
        showToast('¡Cuenta creada con éxito!', `Bienvenido a Mudify, ${userObj.name}. Tu cuenta de Cliente es 100% gratuita para pedir mudanzas y fletes.`, 'success', 5000);
      }
    } else {
      showToast('¡Hola de nuevo!', `Has iniciado sesión correctamente como ${userObj.name}.`, 'success');
    }
  };

  // Botón Principal Continuar con Google (Firebase Popup)
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', async () => {
      if (!firebaseAuth || !googleAuthProvider) {
        showToast('Servicio no disponible', 'No se pudo conectar con Firebase Auth. Verificá tu conexión a internet.', 'error');
        return;
      }

      const prevText = googleBtnLabel ? googleBtnLabel.textContent : 'Continuar con Google';
      if (googleBtnLabel) googleBtnLabel.textContent = 'Conectando con Google...';
      googleAuthBtn.style.pointerEvents = 'none';
      googleAuthBtn.style.opacity = '0.7';

      try {
        const result = await firebaseAuth.signInWithPopup(googleAuthProvider);
        if (result && result.user) {
          await processFirebaseUser(result.user, currentAuthTab === 'register', selectedUserRole);
        }
      } catch (error) {
        console.error('Error durante autenticación con Google:', error);
        if (error.code === 'auth/popup-blocked') {
          showToast('Ventana bloqueada', 'El navegador bloqueó la ventana emergente de Google. Intentando redirección...', 'info');
          try {
            await firebaseAuth.signInWithRedirect(googleAuthProvider);
          } catch (redErr) {
            showToast('Error de acceso', 'No se pudo completar el inicio de sesión.', 'error');
          }
        } else if (error.code === 'auth/popup-closed-by-user') {
          showToast('Inicio cancelado', 'Se cerró la ventana de Google antes de finalizar.', 'info');
        } else if (error.code === 'auth/operation-not-supported-in-this-environment' || window.location.protocol === 'file:') {
          showToast('Servidor local requerido', 'Google Sign-In requiere un servidor web (http://localhost o Live Server) y no abrir el archivo directamente (file://).', 'error', 9000);
        } else if (error.code === 'auth/unauthorized-domain') {
          showToast('Dominio no autorizado', `Debes autorizar "${window.location.hostname}" en Firebase Console > Authentication > Settings > Authorized domains.`, 'error', 9000);
        } else {
          showToast('Error de autenticación', error.message || 'No se pudo conectar con Google.', 'error');
        }
      } finally {
        if (googleBtnLabel) googleBtnLabel.textContent = prevText;
        googleAuthBtn.style.pointerEvents = 'auto';
        googleAuthBtn.style.opacity = '1';
      }
    });
  }

  // Escuchar estado de autenticación de Firebase en tiempo real
  if (firebaseAuth) {
    firebaseAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const stored = getStoredUser();
        if (!stored || stored.uid !== fbUser.uid) {
          await processFirebaseUser(fbUser, false, selectedUserRole);
        } else {
          renderAuthState();
        }
      }
    });

    // Procesar retorno de redirección si se usó signInWithRedirect
    firebaseAuth.getRedirectResult().then(async (result) => {
      if (result && result.user) {
        await processFirebaseUser(result.user, currentAuthTab === 'register', selectedUserRole);
      }
    }).catch((err) => {
      if (err.code !== 'auth/credential-already-in-use') {
        console.warn('Aviso en redirect de Firebase:', err);
      }
    });
  }

  // ========================================================
  // SISTEMA DE SUSCRIPCIONES Y PERÍODO DE GRACIA (60 DÍAS)
  // ========================================================
  const btnToggleTodos = document.getElementById('btnToggleTodos');
  const btnToggleFleteros = document.getElementById('btnToggleFleteros');
  const btnToggleFlota = document.getElementById('btnToggleFlota');
  const btnToggleDashboard = document.getElementById('btnToggleDashboard');

  const planFleteros = document.getElementById('planFleteros');
  const planFlotaVehiculos = document.getElementById('planFlotaVehiculos');
  const planDashboardCompleto = document.getElementById('planDashboardCompleto');
  const btnActivateTrials = document.querySelectorAll('.btn-activate-trial');

  // Modal de Suscripción
  const subscriptionModal = document.getElementById('subscriptionModal');
  const closeSubModalBtn = document.getElementById('closeSubModal');
  const btnCloseSubModal = document.getElementById('btnCloseSubModal');
  const dropdownSubscriptionLink = document.getElementById('dropdownSubscriptionLink');
  const subModalStatusBadge = document.getElementById('subModalStatusBadge');
  const subModalTitle = document.getElementById('subModalTitle');
  const subModalPlanName = document.getElementById('subModalPlanName');
  const subGraceCard = document.getElementById('subGraceCard');
  const subDaysRemaining = document.getElementById('subDaysRemaining');
  const subCurrentCost = document.getElementById('subCurrentCost');
  const subProgressFill = document.getElementById('subProgressFill');
  const subStartDate = document.getElementById('subStartDate');
  const subEndDate = document.getElementById('subEndDate');
  const subClientCard = document.getElementById('subClientCard');
  const subBenefitsList = document.getElementById('subBenefitsList');
  const subNoticeBox = document.getElementById('subNoticeBox');

  // Alternar pestañas de audiencia y planes
  const setPricingAudience = (type) => {
    const allBtns = [btnToggleTodos, btnToggleFleteros, btnToggleFlota, btnToggleDashboard];
    const allCards = [planFleteros, planFlotaVehiculos, planDashboardCompleto];

    allBtns.forEach(b => {
      b?.classList.remove('active');
      b?.setAttribute('aria-selected', 'false');
    });

    if (type === 'todos') {
      btnToggleTodos?.classList.add('active');
      btnToggleTodos?.setAttribute('aria-selected', 'true');
      allCards.forEach(c => c?.classList.add('active'));
    } else if (type === 'fleteros') {
      btnToggleFleteros?.classList.add('active');
      btnToggleFleteros?.setAttribute('aria-selected', 'true');
      allCards.forEach(c => c?.classList.remove('active'));
      planFleteros?.classList.add('active');
      if (window.innerWidth <= 768 && planFleteros) {
        window.scrollTo({ top: planFleteros.offsetTop - 90, behavior: 'smooth' });
      }
    } else if (type === 'flota') {
      btnToggleFlota?.classList.add('active');
      btnToggleFlota?.setAttribute('aria-selected', 'true');
      allCards.forEach(c => c?.classList.remove('active'));
      planFlotaVehiculos?.classList.add('active');
      if (window.innerWidth <= 768 && planFlotaVehiculos) {
        window.scrollTo({ top: planFlotaVehiculos.offsetTop - 90, behavior: 'smooth' });
      }
    } else if (type === 'dashboard') {
      btnToggleDashboard?.classList.add('active');
      btnToggleDashboard?.setAttribute('aria-selected', 'true');
      allCards.forEach(c => c?.classList.remove('active'));
      planDashboardCompleto?.classList.add('active');
      if (window.innerWidth <= 768 && planDashboardCompleto) {
        window.scrollTo({ top: planDashboardCompleto.offsetTop - 90, behavior: 'smooth' });
      }
    }
  };

  if (btnToggleTodos) btnToggleTodos.addEventListener('click', () => setPricingAudience('todos'));
  if (btnToggleFleteros) btnToggleFleteros.addEventListener('click', () => setPricingAudience('fleteros'));
  if (btnToggleFlota) btnToggleFlota.addEventListener('click', () => setPricingAudience('flota'));
  if (btnToggleDashboard) btnToggleDashboard.addEventListener('click', () => setPricingAudience('dashboard'));

  // Modal de Suscripción Interactivo
  const openSubscriptionModal = () => {
    const user = getStoredUser();

    if (!user) {
      showToast('Acceso a Suscripción', 'Registrate o iniciá sesión con Google para ver o activar tus 60 días gratis.', 'info');
      openAuthModal('register', 'conductor');
      return;
    }

    if (!subscriptionModal) return;

    if (user.role === 'conductor' || user.role === 'empresa') {
      if (subGraceCard) subGraceCard.style.display = 'block';
      if (subClientCard) subClientCard.style.display = 'none';

      const isConductor = user.role === 'conductor';
      const planType = user.subscription?.planType || (isConductor ? 'fletero_pro' : 'dashboard_completo');
      const daysLeft = user.subscription?.daysRemaining ?? 60;
      const totalDays = user.subscription?.trialDaysTotal ?? 60;
      const pct = Math.max(5, Math.min(100, Math.round((daysLeft / totalDays) * 100)));

      if (subModalStatusBadge) subModalStatusBadge.textContent = 'PERÍODO DE GRACIA ACTIVO';
      if (subModalTitle) {
        if (planType === 'fletero_pro') {
          subModalTitle.textContent = 'Tu Cuenta de Conductor / Fletero';
        } else if (planType === 'flota_vehiculos') {
          subModalTitle.textContent = 'Tu Cuenta de Flota Multi-Vehículo';
        } else {
          subModalTitle.textContent = 'Tu Cuenta Enterprise con Dashboard';
        }
      }
      if (subModalPlanName) {
        subModalPlanName.textContent = user.subscription?.planName ||
          (planType === 'fletero_pro' ? 'Plan Fletero Pro (1 Vehículo)' :
            planType === 'flota_vehiculos' ? 'Plan Flota por Vehículos' : 'Plan Flota Enterprise (Dashboard Completo)');
      }
      if (subDaysRemaining) subDaysRemaining.textContent = daysLeft;
      if (subCurrentCost) subCurrentCost.textContent = '$0 ARS';
      if (subProgressFill) subProgressFill.style.width = `${pct}%`;
      if (subStartDate) subStartDate.textContent = user.subscription?.startDate || new Date().toLocaleDateString('es-AR');
      if (subEndDate) subEndDate.textContent = user.subscription?.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR');

      if (subBenefitsList) {
        if (planType === 'fletero_pro') {
          subBenefitsList.innerHTML = `
            <li><span class="check">✓</span> 1 vehículo habilitado con 60 días bonificados ($0 de costo fijo)</li>
            <li><span class="check">✓</span> Solicitudes de viajes y fletes en tiempo real por GPS</li>
            <li><span class="check">✓</span> Cobro 100% directo con el cliente (0% comisión por viaje para Mudify)</li>
            <li><span class="check">✓</span> Registro de números y viajes: estadísticas de tus fletes completados</li>
            <li><span class="check">✓</span> Retornos coordinados para nunca volver vacío</li>
            <li><span class="check">✓</span> Soporte operativo preferencial por WhatsApp</li>
          `;
        } else if (planType === 'flota_vehiculos') {
          subBenefitsList.innerHTML = `
            <li><span class="check">✓</span> Suscripción bonificada por cantidad de vehículos (hasta 3 unidades)</li>
            <li><span class="check">✓</span> Cobro directo de tus clientes a tu empresa sin intermediación de fondos</li>
            <li><span class="check">✓</span> Registro centralizado de números de flota: estadísticas de volumen y kilómetros</li>
            <li><span class="check">✓</span> Perfiles y turnos individuales por chofer</li>
            <li><span class="check">✓</span> Asignación según porte: utilitarios, furgones y camiones</li>
            <li><span class="check">✓</span> Retornos interprovinciales coordinados para toda la flota</li>
          `;
        } else {
          subBenefitsList.innerHTML = `
            <li><span class="check">✓</span> Dashboard Web Centralizado Full con torre de control de despacho</li>
            <li><span class="check">✓</span> Telemetría GPS en tiempo real de toda tu flota en mapa interactivo</li>
            <li><span class="check">✓</span> Consola de registro de números, cotizaciones históricas y estadísticas de flota</li>
            <li><span class="check">✓</span> Cobro directo de todos los viajes entre cliente y empresa (0% retención de dinero)</li>
            <li><span class="check">✓</span> Gestión de cuadrillas y peones de carga para mudanzas integrales</li>
            <li><span class="check">✓</span> Ejecutivo corporativo asignado y soporte prioritario 24/7</li>
          `;
        }
      }

      if (subNoticeBox) {
        subNoticeBox.innerHTML = `
          <span class="info-icon">💡</span>
          <p>Estás operando bajo el <strong>Período de Gracia de Lanzamiento de Mudify</strong>. Mudify únicamente cobra la suscripción mensual fija (bonificada por 60 días a $0) y registra los números de tus operaciones. Los cobros de los viajes se realizan <strong>100% de forma directa</strong> entre el cliente y vos/tu empresa, sin comisiones por flete.</p>
        `;
      }
    } else {
      // Cliente exento
      if (subGraceCard) subGraceCard.style.display = 'none';
      if (subClientCard) subClientCard.style.display = 'block';

      if (subModalStatusBadge) subModalStatusBadge.textContent = 'CUENTA CLIENTE EXENTA';
      if (subModalTitle) subModalTitle.textContent = 'Tu Perfil en Mudify';
      if (subModalPlanName) subModalPlanName.textContent = 'Cuenta Particular 100% Gratuita';

      if (subBenefitsList) {
        subBenefitsList.innerHTML = `
          <li><span class="check">✓</span> Sin cuota mensual ni costos ocultos ($0 de suscripción de por vida)</li>
          <li><span class="check">✓</span> Cotizaciones inmediatas y conductores verificados</li>
          <li><span class="check">✓</span> Seguimiento satelital por GPS en vivo de tu mudanza</li>
          <li><span class="check">✓</span> Trato y pago 100% directo con tu chofer o empresa acordada (sin comisiones de intermediación)</li>
        `;
      }

      if (subNoticeBox) {
        subNoticeBox.innerHTML = `
          <span class="info-icon">📦</span>
          <p>Los clientes de Mudify <strong>nunca abonan suscripciones</strong>. Solo acordás y abonás el valor del traslado directamente a tu conductor o empresa de mudanzas elegida.</p>
        `;
      }
    }

    subscriptionModal.classList.add('open');
    subscriptionModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeSubscriptionModal = () => {
    if (subscriptionModal) {
      subscriptionModal.classList.remove('open');
      subscriptionModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  };

  if (closeSubModalBtn) closeSubModalBtn.addEventListener('click', closeSubscriptionModal);
  if (btnCloseSubModal) btnCloseSubModal.addEventListener('click', closeSubscriptionModal);
  if (subscriptionModal) {
    subscriptionModal.addEventListener('click', (e) => {
      if (e.target === subscriptionModal) closeSubscriptionModal();
    });
  }

  if (dropdownSubscriptionLink) {
    dropdownSubscriptionLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (userDropdownCard) userDropdownCard.classList.remove('show');
      openSubscriptionModal();
    });
  }

  // Botones de activación en las tarjetas de precios
  btnActivateTrials.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role') || 'conductor';
      const planType = btn.getAttribute('data-plan') || (role === 'conductor' ? 'fletero_pro' : 'dashboard_completo');
      const user = getStoredUser();

      let planName = 'Plan Fletero Pro (1 Vehículo)';
      if (planType === 'flota_vehiculos') {
        planName = 'Plan Flota por Vehículos';
      } else if (planType === 'dashboard_completo') {
        planName = 'Plan Flota Enterprise (Dashboard Completo)';
      }

      if (!user) {
        openAuthModal('register', role, planType);
      } else {
        const now = new Date();
        const trialEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        user.role = role;
        user.subscription = {
          status: 'trial_active',
          planType: planType,
          planName: planName,
          trialDaysTotal: 60,
          daysRemaining: 60,
          startDate: now.toLocaleDateString('es-AR'),
          endDate: trialEnd.toLocaleDateString('es-AR'),
          price: 0,
          currency: 'ARS'
        };
        saveUserSession(user);
        if (firestoreDb && user.uid) {
          firestoreDb.collection('usuarios').doc(user.uid).set({
            role: role,
            subscription: user.subscription,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch(e => console.warn('Aviso Firestore:', e));
        }
        openSubscriptionModal();
        showToast('🎉 ¡Período de gracia activado!', `Has activado tus 60 días bonificados para el ${planName}.`, 'success', 5000);
      }
    });
  });

  // Tecla Escape para cerrar modales y menús
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (authModal && authModal.classList.contains('open')) {
        closeAuthModal();
      } else if (subscriptionModal && subscriptionModal.classList.contains('open')) {
        closeSubscriptionModal();
      }
      if (userDropdownCard) {
        userDropdownCard.classList.remove('show');
        if (userChipBtn) {
          userChipBtn.classList.remove('open');
          userChipBtn.setAttribute('aria-expanded', 'false');
        }
      }
    }
  });

  // Inicializar estado de autenticación al cargar
  renderAuthState();
});
