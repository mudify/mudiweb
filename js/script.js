/* ==========================================
   MUDIFY v5 — Scripts
   ========================================== */
(function () {
  'use strict';

  /* ===== NAV SCROLL ===== */
  var nav = document.getElementById('nav');
  var btt = document.getElementById('btt');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    if (btt) {
      if (window.scrollY > 500) btt.classList.add('show');
      else btt.classList.remove('show');
    }
  }, { passive: true });

  if (btt) btt.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ===== HAMBURGER / MOBILE MENU ===== */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  var menuOpen = false;

  function openMenu() {
    menuOpen = true;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var s = burger.querySelectorAll('span');
    s[0].style.transform = 'rotate(45deg) translate(5px,5px)';
    s[1].style.opacity = '0';
    s[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
  }

  function closeMenu() {
    menuOpen = false;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    var s = burger.querySelectorAll('span');
    s[0].style.transform = '';
    s[1].style.opacity = '';
    s[2].style.transform = '';
  }

  if (burger) {
    burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('click', function (e) {
      if (menuOpen && !nav.contains(e.target) && !mobileMenu.contains(e.target)) closeMenu();
    });
  }

  /* ===== SMOOTH SCROLL ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (id === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      var el = document.querySelector(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ===== DATE MIN ===== */
  var dateField = document.getElementById('field-date');
  if (dateField) dateField.setAttribute('min', new Date().toISOString().split('T')[0]);

  /* ===== LOCALSTORAGE ===== */
  var lsMap = [
    { id: 'field-origin', key: 'mf5-origin' },
    { id: 'field-dest',   key: 'mf5-dest'   },
    { id: 'field-type',   key: 'mf5-type'   },
    { id: 'field-date',   key: 'mf5-date'   }
  ];

  lsMap.forEach(function (m) {
    var el = document.getElementById(m.id);
    if (!el) return;
    var saved = localStorage.getItem(m.key);
    if (saved) el.value = saved;
    el.addEventListener('change', function () { localStorage.setItem(m.key, this.value); });
  });

  /* ===== HERO FORM ===== */
  var heroBtn = document.getElementById('hero-submit-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', function () {
      var origin = document.getElementById('field-origin').value.trim();
      var dest   = document.getElementById('field-dest').value.trim();
      var type   = document.getElementById('field-type').value;
      var date   = document.getElementById('field-date').value;

      if (!origin || !dest || !type || !date) {
        showToast('Completá todos los campos para ver precios.', 'warn');
        return;
      }

      heroBtn.textContent = 'Buscando...';
      heroBtn.disabled = true;
      heroBtn.style.opacity = '.75';

      setTimeout(function () {
        showToast('¡Mudanza publicada! Recibirás ofertas de conductores pronto. 🚚', 'ok');
        heroBtn.textContent = 'Ver precios disponibles';
        heroBtn.disabled = false;
        heroBtn.style.opacity = '';
        lsMap.forEach(function (m) { localStorage.removeItem(m.key); });
      }, 1800);
    });
  }

  /* ===== CTA EMAIL ===== */
  var ctaForm = document.getElementById('ctaEmailForm');
  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('cta-email-input').value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Ingresá un email válido.', 'warn');
        return;
      }
      var btn = document.getElementById('cta-email-btn');
      var orig = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      setTimeout(function () {
        showToast('¡Listo! Te contactamos pronto. 🙌', 'ok');
        document.getElementById('cta-email-input').value = '';
        btn.textContent = orig;
        btn.disabled = false;
      }, 1200);
    });
  }

  /* ===== TOAST ===== */
  function showToast(msg, type) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'toast';
    var ico = type === 'ok' ? '✅' : '⚠️';
    el.innerHTML = '<span>' + ico + '</span><span>' + msg + '</span>';
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .4s ease, transform .4s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function () { el.remove(); }, 400);
    }, 4500);
  }

  /* ===== FAQ ===== */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (i) {
        i.classList.remove('open');
        i.querySelector('.faq-btn').setAttribute('aria-expanded', 'false');
      });
      if (!open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ===== COUNTERS ===== */
  var counted = false;
  var counters = document.querySelectorAll('.counter');

  function runCounters() {
    if (counted) return;
    counted = true;
    counters.forEach(function (el) {
      var target = parseInt(el.dataset.target, 10);
      var suf = el.dataset.suffix || '';
      var pre = el.dataset.prefix || '';
      var dur = 2000;
      var start = null;
      function ease(t) { return 1 - Math.pow(1 - t, 3); }
      (function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = pre + Math.floor(ease(p) * target).toLocaleString('es-AR') + suf;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = pre + target.toLocaleString('es-AR') + suf;
      })(performance.now());
    });
  }

  /* ===== INTERSECTION OBSERVER ===== */
  if ('IntersectionObserver' in window) {
    // Counters
    var statsSec = document.querySelector('.stats-section');
    if (statsSec) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { runCounters(); }
      }, { threshold: 0.4 }).observe(statsSec);
    }

    // Reveal
    var reveals = document.querySelectorAll(
      '.svc-card, .how-step, .review-card, .price-card, .d-feat, .faq-item, .stat-item, .dual-card, .hero-form'
    );
    reveals.forEach(function (el) { el.classList.add('reveal'); });

    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var siblings = entry.target.parentElement ? Array.from(entry.target.parentElement.children) : [];
          var idx = siblings.indexOf(entry.target);
          setTimeout(function () { entry.target.classList.add('in'); }, idx * 80);
          revObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });

    reveals.forEach(function (el) { revObs.observe(el); });

  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    runCounters();
  }

  /* ===== HERO TABS ===== */
  var heroTabs = document.querySelectorAll('.hero-tab');
  heroTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      heroTabs.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  /* ===== HERO CAROUSEL ===== */
  var carouselTrack = document.getElementById('carousel-track');
  var slides = document.querySelectorAll('.carousel__slide');
  var dots = document.querySelectorAll('.carousel__dot');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');
  var carouselContainer = document.getElementById('hero-carousel');
  var currentIndex = 0;
  var slideCount = slides.length;
  var autoSlideInterval = null;

  function updateCarousel(index) {
    if (index < 0) index = slideCount - 1;
    if (index >= slideCount) index = 0;
    currentIndex = index;

    if (carouselTrack) {
      carouselTrack.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    }

    slides.forEach(function (slide, idx) {
      if (idx === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach(function (dot, idx) {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(function () {
      updateCarousel(currentIndex + 1);
    }, 4000);
  }

  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    }
  }

  if (carouselTrack && slideCount > 0) {
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        updateCarousel(currentIndex - 1);
        startAutoSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        updateCarousel(currentIndex + 1);
        startAutoSlide();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(this.dataset.index, 10);
        updateCarousel(idx);
        startAutoSlide();
      });
    });

    if (carouselContainer) {
      carouselContainer.addEventListener('mouseenter', stopAutoSlide);
      carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // Touch swipe support
    var startX = 0;
    var currentX = 0;
    var isDragging = false;

    carouselContainer.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      isDragging = true;
      stopAutoSlide();
    }, { passive: true });

    carouselContainer.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      currentX = e.touches[0].clientX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', function () {
      if (!isDragging) return;
      isDragging = false;
      var diffX = startX - currentX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) updateCarousel(currentIndex + 1);
        else updateCarousel(currentIndex - 1);
      }
      startAutoSlide();
    });

    startAutoSlide();
  }

  // ===== COMING SOON MODAL =====
  var comingSoonModal = document.getElementById('comingSoonModal');
  var closeModalBtn = document.getElementById('closeModalBtn');
  var closeModalActionBtn = document.getElementById('closeModalActionBtn');
  var comingSoonTriggers = [
    document.getElementById('nav-signin'),
    document.getElementById('nav-cta'),
    document.getElementById('mm-signin'),
    document.getElementById('mm-conductores')
  ];

  function openModal(e) {
    if (e) e.preventDefault();
    if (comingSoonModal) {
      comingSoonModal.classList.add('open');
      comingSoonModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    if (comingSoonModal) {
      comingSoonModal.classList.remove('open');
      comingSoonModal.setAttribute('aria-hidden', 'true');
    }
  }

  comingSoonTriggers.forEach(function(trigger) {
    if (trigger) {
      trigger.addEventListener('click', openModal);
    }
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (closeModalActionBtn) closeModalActionBtn.addEventListener('click', closeModal);

  // Close on backdrop click
  if (comingSoonModal) {
    comingSoonModal.addEventListener('click', function(e) {
      if (e.target === comingSoonModal) {
        closeModal();
      }
    });
  }

})();
