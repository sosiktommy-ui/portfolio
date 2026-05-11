(function () {
  'use strict';

  /* ================================================================
     VANTA GLOBE — neon planet
  ================================================================ */
  function initPlanet() {
    if (typeof VANTA === 'undefined' || typeof VANTA.GLOBE === 'undefined') return;
    var container = document.getElementById('vanta-bg');
    if (!container) return;
    VANTA.GLOBE({
      el: container,
      THREE: typeof THREE !== 'undefined' ? THREE : undefined,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1.0,
      scaleMobile: 0.75,
      color: 0x9333ea,
      color2: 0x06b6d4,
      size: 1.6,
      backgroundColor: 0x04000e
    });
  }

  if (document.readyState === 'complete') { initPlanet(); }
  else { window.addEventListener('load', initPlanet, { once: true }); }

  /* ================================================================
     CURSOR GLOW
  ================================================================ */
  var cursorGlow = document.getElementById('cursor-glow');
  var mX = window.innerWidth / 2, mY = window.innerHeight / 2, gX = mX, gY = mY;
  document.addEventListener('mousemove', function (e) { mX = e.clientX; mY = e.clientY; if (cursorGlow) cursorGlow.style.opacity = '1'; }, { passive: true });
  document.addEventListener('mouseleave', function () { if (cursorGlow) cursorGlow.style.opacity = '0'; });
  (function ac() { gX += (mX - gX) * 0.06; gY += (mY - gY) * 0.06; if (cursorGlow) cursorGlow.style.transform = 'translate(' + gX + 'px,' + gY + 'px)'; requestAnimationFrame(ac); })();

  /* ================================================================
     3D CARD TILT
  ================================================================ */
  function initTilt(sel) {
    document.querySelectorAll(sel).forEach(function (card) {
      var tx = 0, ty = 0, cx = 0, cy = 0, hov = false;
      card.addEventListener('mouseenter', function () { hov = true; });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        tx = (e.clientY - r.top) / r.height - 0.5;
        ty = (e.clientX - r.left) / r.width - 0.5;
      });
      card.addEventListener('mouseleave', function () {
        hov = false; tx = 0; ty = 0;
        card.style.transition = 'transform 600ms cubic-bezier(0.4,0,0.2,1)';
      });
      (function tick() {
        cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
        if (hov || Math.abs(cx) > 0.002 || Math.abs(cy) > 0.002) {
          card.style.transform = 'perspective(900px) rotateX(' + (-cx * 13).toFixed(3) + 'deg) rotateY(' + (cy * 13).toFixed(3) + 'deg) translateY(' + (hov ? -6 : 0) + 'px)';
        }
        requestAnimationFrame(tick);
      })();
    });
  }
  initTilt('.sys-card, .cap-card, .stack-panel, .stat-card, .ai-detail');

  document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('mousemove', function (e) {
      var r = item.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      item.style.transform = 'perspective(700px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 6).toFixed(2) + 'deg) translateY(-4px) scale(1.015)';
    });
    item.addEventListener('mouseleave', function () {
      item.style.transition = 'transform 500ms cubic-bezier(0.4,0,0.2,1)'; item.style.transform = '';
    });
  });

  /* ================================================================
     SCROLL EVENTS
  ================================================================ */
  var topbar = document.getElementById('topbar');
  var sections = document.querySelectorAll('.section-anchor');
  var navLinks = document.querySelectorAll('.nav-link');
  function onScroll() {
    var st = window.scrollY, dh = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--scroll-pct', dh > 0 ? (st / dh).toFixed(4) : '0');
    if (topbar) topbar.classList.toggle('scrolled', st > 60);
    var cur = '';
    sections.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 120 && r.bottom > 120) cur = s.id; });
    navLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + cur); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ================================================================
     REVEAL
  ================================================================ */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, d = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function () { el.classList.add('is-visible'); }, d);
      revObs.unobserve(el);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
  document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(function (el) { revObs.observe(el); });

  /* ================================================================
     COUNTERS
  ================================================================ */
  var cntObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / 1800, 1), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.floor(e * target);
        if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
      })(performance.now());
      cntObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cntObs.observe(el); });

  /* ================================================================
     STACK BARS
  ================================================================ */
  var stkObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); stkObs.unobserve(en.target); } });
  }, { threshold: 0.25 });
  document.querySelectorAll('.stack-panel').forEach(function (p) { stkObs.observe(p); });

  /* ================================================================
     MOBILE MENU
  ================================================================ */
  var menuToggle = document.getElementById('menu-toggle'), mobileNav = document.getElementById('mobile-nav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () { mobileNav.classList.toggle('is-open'); });
    mobileNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { mobileNav.classList.remove('is-open'); }); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mobileNav) mobileNav.classList.remove('is-open'); });

  /* SMOOTH SCROLL */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href'); if (href === '#') return;
      var t = document.querySelector(href); if (!t) return;
      e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  /* PAGE FADE IN */
  document.body.style.cssText = 'opacity:0;transition:opacity 500ms ease;';
  function showPage() { document.body.style.opacity = '1'; }
  if (document.readyState === 'complete') { showPage(); }
  else { window.addEventListener('load', showPage, { once: true }); setTimeout(showPage, 1800); }

  /* ================================================================
     LIGHTBOX — futuristic image viewer
  ================================================================ */
  (function () {
    var lb      = document.getElementById('lb');
    if (!lb) return;
    var lbBd    = document.getElementById('lb-bd');
    var lbFrame = document.getElementById('lb-frame');
    var lbImg   = document.getElementById('lb-img');
    var lbCap   = document.getElementById('lb-cap');
    var lbIdx   = document.getElementById('lb-idx');
    var lbClose = document.getElementById('lb-close');
    var lbPrev  = document.getElementById('lb-prev');
    var lbNext  = document.getElementById('lb-next');

    var items = [];
    var current = 0;
    var isOpen = false;

    function buildItems() {
      items = [];
      document.querySelectorAll('.gallery-img-wrap img').forEach(function (img) {
        var cap = '';
        var fig = img.closest('figure');
        if (fig) { var fc = fig.querySelector('figcaption'); if (fc) cap = fc.textContent.trim(); }
        items.push({ src: img.src, alt: img.alt || '', cap: cap });
      });
    }

    function replayScan() {
      var scan = lbFrame.querySelector('.lb-scan');
      if (!scan) return;
      scan.style.animation = 'none';
      void scan.offsetWidth;
      scan.style.animation = '';
    }

    function show(index) {
      if (!items.length) buildItems();
      current = ((index % items.length) + items.length) % items.length;
      var item = items[current];
      lbIdx.textContent = (current + 1) + ' / ' + items.length;

      if (!isOpen) {
        lbFrame.classList.remove('lb-in');
        lb.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        isOpen = true;
        lbImg.src = item.src;
        lbImg.alt = item.alt;
        lbCap.textContent = item.cap;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            lb.classList.add('lb-open');
            lbFrame.classList.add('lb-in');
          });
        });
      } else {
        lbImg.style.opacity = '0';
        setTimeout(function () {
          lbImg.src = item.src;
          lbImg.alt = item.alt;
          lbCap.textContent = item.cap;
          lbImg.style.opacity = '';
          replayScan();
        }, 180);
      }
    }

    function close() {
      lb.classList.remove('lb-open');
      lbFrame.classList.remove('lb-in');
      isOpen = false;
      document.body.style.overflow = '';
      setTimeout(function () { lb.setAttribute('hidden', ''); lbImg.src = ''; }, 440);
    }

    document.querySelectorAll('.gallery-img-wrap').forEach(function (wrap) {
      wrap.addEventListener('click', function () {
        if (!items.length) buildItems();
        var src = (wrap.querySelector('img') || {}).src || '';
        var idx = 0;
        for (var j = 0; j < items.length; j++) { if (items[j].src === src) { idx = j; break; } }
        show(idx);
      });
    });

    lbClose.addEventListener('click', close);
    lbBd.addEventListener('click', close);
    lbPrev.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    lbNext.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape')      close();
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft')  show(current - 1);
    });
  })();

  /* ================================================================
     i18n — LANGUAGE SWITCHER
  ================================================================ */
  (function () {
    var translations = {
      en: {
        'hero.eyebrow': 'Independent full-stack developer',
        'hero.ctaPrimary': 'See selected builds',
        'hero.ctaSecondary': 'Get in touch',
        'systems.eyebrow': 'System range',
        'capabilities.eyebrow': 'Capabilities',
        'stack.eyebrow': 'Stack',
        'lang.switchAria': 'Language switch'
      },
      ru: {
        'hero.eyebrow': 'Независимый full-stack разработчик',
        'hero.ctaPrimary': 'Посмотреть проекты',
        'hero.ctaSecondary': 'Связаться',
        'systems.eyebrow': 'Диапазон систем',
        'capabilities.eyebrow': 'Возможности',
        'stack.eyebrow': 'Стек',
        'lang.switchAria': 'Переключение языка'
      }
    };

    var supportedLanguages = new Set(Object.keys(translations));
    var storageKey = 'portfolioLanguage';

    function resolveInitialLanguage() {
      var qp = new URLSearchParams(window.location.search).get('lang');
      if (supportedLanguages.has(qp)) return qp;
      try {
        var stored = window.localStorage.getItem(storageKey);
        if (supportedLanguages.has(stored)) return stored;
      } catch (e) {}
      return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
    }

    var currentLanguage = resolveInitialLanguage();

    function t(key) {
      return (translations[currentLanguage] || {})[key] || (translations.en || {})[key] || key;
    }

    function syncButtons() {
      document.querySelectorAll('[data-lang-trigger]').forEach(function (btn) {
        var active = btn.dataset.langTrigger === currentLanguage;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    }

    function applyTranslations() {
      document.documentElement.lang = currentLanguage;
      document.body.dataset.language = currentLanguage;
      document.querySelectorAll('[data-i18n]').forEach(function (el) {
        el.textContent = t(el.dataset.i18n);
      });
      document.querySelectorAll('[data-lang-trigger]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var next = btn.dataset.langTrigger;
          if (!supportedLanguages.has(next) || next === currentLanguage) return;
          currentLanguage = next;
          applyTranslations();
          try { window.localStorage.setItem(storageKey, currentLanguage); } catch (e) {}
          var url = new URL(window.location.href);
          url.searchParams.set('lang', currentLanguage);
          window.history.replaceState({}, '', url);
        });
      });
      syncButtons();
    }

    applyTranslations();
  })();

})();
