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
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if(targetId === '#') return;
      
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
  let closeMobileMenu = () => {};
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
          if(target > 999) {
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
  // SISTEMA DE AUTENTICACIÓN GOOGLE (LOGIN Y REGISTRO)
  // ========================================================

  // Configuración de Google OAuth 2.0 / Google Identity Services
  // Para conectar un Google Client ID real de Google Cloud Console:
  const GOOGLE_CLIENT_ID = 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const AUTH_STORAGE_KEY = 'mudify_user_session';

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

  // Elementos del Diálogo Selector de Cuentas Google
  const googleChooserModal = document.getElementById('googleChooserModal');
  const closeGoogleChooserBtn = document.getElementById('closeGoogleChooser');
  const googleAccountButtons = document.querySelectorAll('.google-account-btn[data-account]');
  const btnCustomGoogle = document.getElementById('btnCustomGoogle');
  const googleCustomForm = document.getElementById('googleCustomForm');
  const customGoogleName = document.getElementById('customGoogleName');
  const customGoogleEmail = document.getElementById('customGoogleEmail');
  const btnCancelCustomGoogle = document.getElementById('btnCancelCustomGoogle');

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

  // Abrir y cerrar Modal de Autenticación
  const openAuthModal = (tab = 'login', role = 'cliente') => {
    currentAuthTab = tab;
    selectedUserRole = role;

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

  // Cerrar Sesión
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', () => {
      clearUserSession();
      showToast('Sesión finalizada', 'Has cerrado sesión en Mudify correctamente.', 'info');
    });
  }

  // ========================================================
  // INTEGRACIÓN GOOGLE SIGN-IN / SELECTOR DE CUENTAS
  // ========================================================
  const accountsData = {
    '1': {
      name: 'Camila Rodríguez',
      email: 'camila.rodriguez@gmail.com',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80'
    },
    '2': {
      name: 'Martín González',
      email: 'martin.gonzalez@gmail.com',
      picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
    }
  };

  const openGoogleChooser = () => {
    if (googleChooserModal) {
      googleChooserModal.classList.add('open');
      googleChooserModal.setAttribute('aria-hidden', 'false');
    }
  };

  const closeGoogleChooser = () => {
    if (googleChooserModal) {
      googleChooserModal.classList.remove('open');
      googleChooserModal.setAttribute('aria-hidden', 'true');
      if (googleCustomForm) googleCustomForm.style.display = 'none';
    }
  };

  const completeGoogleLogin = (account) => {
    const isRegister = currentAuthTab === 'register';
    const userRole = isRegister ? selectedUserRole : 'cliente';

    // Inicializar suscripción con 60 días de gracia bonificados (fleteros y empresas) o exención (clientes)
    let subscriptionData = null;
    const now = new Date();
    const trialEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    if (userRole === 'conductor') {
      subscriptionData = {
        status: 'trial_active',
        planName: 'Plan Fletero Pro',
        trialDaysTotal: 60,
        daysRemaining: 60,
        startDate: now.toLocaleDateString('es-AR'),
        endDate: trialEnd.toLocaleDateString('es-AR'),
        price: 0,
        currency: 'ARS'
      };
    } else if (userRole === 'empresa') {
      subscriptionData = {
        status: 'trial_active',
        planName: 'Plan Flota Business',
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

    const userObj = {
      id: 'g_' + Date.now(),
      name: account.name,
      email: account.email,
      picture: account.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      role: userRole,
      provider: 'google',
      subscription: subscriptionData,
      registeredAt: new Date().toISOString()
    };

    saveUserSession(userObj);
    closeGoogleChooser();
    closeAuthModal();

    if (isRegister) {
      if (userRole === 'conductor') {
        showToast('🎉 ¡60 días gratis activados!', `Bienvenido a Mudify, ${userObj.name}. Tu período de gracia de 60 días como Conductor / Fletero ya está activo ($0 ARS).`, 'success', 6000);
      } else if (userRole === 'empresa') {
        showToast('🎉 ¡Flota bonificada por 60 días!', `Bienvenido a Mudify, ${userObj.name}. Tu empresa cuenta con 60 días sin costo de suscripción.`, 'success', 6000);
      } else {
        showToast('¡Cuenta creada con éxito!', `Bienvenido a Mudify, ${userObj.name}. Tu cuenta de Cliente es 100% gratuita para pedir mudanzas y fletes.`, 'success', 5000);
      }
    } else {
      showToast('¡Hola de nuevo!', `Has iniciado sesión correctamente como ${userObj.name}.`, 'success');
    }
  };

  // Botón Principal Continuar con Google
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', () => {
      // Si el cliente ID es válido y no el placeholder predeterminado, intentar usar Google Identity Services
      const hasRealClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('TU_GOOGLE');

      if (hasRealClientId && window.google && window.google.accounts && window.google.accounts.id) {
        try {
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Si Google One Tap es bloqueado o cancelado, abrir selector visual
              openGoogleChooser();
            }
          });
        } catch (err) {
          openGoogleChooser();
        }
      } else {
        // En entorno local o modo demostración, abrir selector interactivo de Google
        openGoogleChooser();
      }
    });
  }

  // Cuentas del Selector de Google
  googleAccountButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const accId = btn.getAttribute('data-account');
      const acc = accountsData[accId];
      if (acc) {
        completeGoogleLogin(acc);
      }
    });
  });

  // Opción "Usar otra cuenta de Google"
  if (btnCustomGoogle && googleCustomForm) {
    btnCustomGoogle.addEventListener('click', () => {
      googleCustomForm.style.display = 'flex';
      if (customGoogleName) customGoogleName.focus();
    });
  }

  if (btnCancelCustomGoogle && googleCustomForm) {
    btnCancelCustomGoogle.addEventListener('click', () => {
      googleCustomForm.style.display = 'none';
    });
  }

  if (googleCustomForm) {
    googleCustomForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = customGoogleName?.value.trim() || 'Usuario Google';
      const email = customGoogleEmail?.value.trim() || 'usuario@gmail.com';
      completeGoogleLogin({
        name: name,
        email: email,
        picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
      });
    });
  }

  if (closeGoogleChooserBtn) {
    closeGoogleChooserBtn.addEventListener('click', closeGoogleChooser);
  }

  if (googleChooserModal) {
    googleChooserModal.addEventListener('click', (e) => {
      if (e.target === googleChooserModal) closeGoogleChooser();
    });
  }

  // ========================================================
  // SISTEMA DE SUSCRIPCIONES Y PERÍODO DE GRACIA (60 DÍAS)
  // ========================================================
  const btnToggleFleteros = document.getElementById('btnToggleFleteros');
  const btnToggleEmpresas = document.getElementById('btnToggleEmpresas');
  const planFleteros = document.getElementById('planFleteros');
  const planEmpresas = document.getElementById('planEmpresas');
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

  // Alternar pestañas de audiencia (Fleteros vs Empresas)
  const setPricingAudience = (type) => {
    if (type === 'fleteros') {
      btnToggleFleteros?.classList.add('active');
      btnToggleFleteros?.setAttribute('aria-selected', 'true');
      btnToggleEmpresas?.classList.remove('active');
      btnToggleEmpresas?.setAttribute('aria-selected', 'false');

      planFleteros?.classList.add('active');
      planEmpresas?.classList.remove('active');
    } else {
      btnToggleEmpresas?.classList.add('active');
      btnToggleEmpresas?.setAttribute('aria-selected', 'true');
      btnToggleFleteros?.classList.remove('active');
      btnToggleFleteros?.setAttribute('aria-selected', 'false');

      planEmpresas?.classList.add('active');
      planFleteros?.classList.remove('active');
    }
  };

  if (btnToggleFleteros) {
    btnToggleFleteros.addEventListener('click', () => setPricingAudience('fleteros'));
  }
  if (btnToggleEmpresas) {
    btnToggleEmpresas.addEventListener('click', () => setPricingAudience('empresas'));
  }

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
      const daysLeft = user.subscription?.daysRemaining ?? 60;
      const totalDays = user.subscription?.trialDaysTotal ?? 60;
      const pct = Math.max(5, Math.min(100, Math.round((daysLeft / totalDays) * 100)));

      if (subModalStatusBadge) subModalStatusBadge.textContent = 'PERÍODO DE GRACIA ACTIVO';
      if (subModalTitle) subModalTitle.textContent = isConductor ? 'Tu Cuenta de Conductor / Fletero' : 'Tu Cuenta de Flota Empresarial';
      if (subModalPlanName) subModalPlanName.textContent = user.subscription?.planName || (isConductor ? 'Plan Fletero Pro' : 'Plan Flota Business');
      if (subDaysRemaining) subDaysRemaining.textContent = daysLeft;
      if (subCurrentCost) subCurrentCost.textContent = '$0 ARS';
      if (subProgressFill) subProgressFill.style.width = `${pct}%`;
      if (subStartDate) subStartDate.textContent = user.subscription?.startDate || new Date().toLocaleDateString('es-AR');
      if (subEndDate) subEndDate.textContent = user.subscription?.endDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR');

      if (subBenefitsList) {
        if (isConductor) {
          subBenefitsList.innerHTML = `
            <li><span class="check">✓</span> 0% de costo fijo de suscripción por 60 días</li>
            <li><span class="check">✓</span> Viajes y fletes en tiempo real según tu radio de cobertura</li>
            <li><span class="check">✓</span> Cobros asegurados acreditados en 24hs hábiles</li>
            <li><span class="check">✓</span> Retornos programados para no viajar con la caja vacía</li>
            <li><span class="check">✓</span> Asistencia y soporte preferencial por WhatsApp</li>
          `;
        } else {
          subBenefitsList.innerHTML = `
            <li><span class="check">✓</span> Suscripción bonificada por 60 días para toda tu flota</li>
            <li><span class="check">✓</span> Habilitación de camiones, choferes y ayudantes ilimitados</li>
            <li><span class="check">✓</span> Despacho de traslados de casas, oficinas y larga distancia</li>
            <li><span class="check">✓</span> Facturación corporativa unificada y reportes quincenales</li>
            <li><span class="check">✓</span> Ejecutivo de cuentas asignado a tu empresa</li>
          `;
        }
      }

      if (subNoticeBox) {
        subNoticeBox.innerHTML = `
          <span class="info-icon">💡</span>
          <p>Estás operando bajo el <strong>Período de Gracia de Lanzamiento de Mudify</strong>. No tenés cargos fijos ni tarjetas adheridas. Disfrutá de la demanda de clientes sin costo.</p>
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
          <li><span class="check">✓</span> Pagos protegidos con Mercado Pago y tarjetas</li>
        `;
      }

      if (subNoticeBox) {
        subNoticeBox.innerHTML = `
          <span class="info-icon">📦</span>
          <p>Los clientes de Mudify <strong>nunca abonan suscripciones</strong>. Solo pagás el traslado que contratás con tu chofer o empresa elegida.</p>
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
      const user = getStoredUser();

      if (!user) {
        openAuthModal('register', role);
      } else {
        if (user.role === role) {
          openSubscriptionModal();
          showToast('Período de gracia activo', `Ya contás con tu período de gracia de 60 días bonificados como ${role === 'conductor' ? 'Fletero' : 'Empresa'}.`, 'success');
        } else {
          // Si el usuario registrado era cliente y decide sumarse como fletero o empresa
          const now = new Date();
          const trialEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
          user.role = role;
          user.subscription = {
            status: 'trial_active',
            planName: role === 'conductor' ? 'Plan Fletero Pro' : 'Plan Flota Business',
            trialDaysTotal: 60,
            daysRemaining: 60,
            startDate: now.toLocaleDateString('es-AR'),
            endDate: trialEnd.toLocaleDateString('es-AR'),
            price: 0,
            currency: 'ARS'
          };
          saveUserSession(user);
          openSubscriptionModal();
          showToast('🎉 ¡Período de gracia activado!', `Has activado tus 60 días bonificados para operar como ${role === 'conductor' ? 'Fletero Pro' : 'Empresa con Flota'}.`, 'success', 5000);
        }
      }
    });
  });

  // Tecla Escape para cerrar modales y menús
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (googleChooserModal && googleChooserModal.classList.contains('open')) {
        closeGoogleChooser();
      } else if (authModal && authModal.classList.contains('open')) {
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
