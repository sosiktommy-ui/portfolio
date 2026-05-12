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
        'hero.eyebrow': 'Independent Full-Stack Developer',
        'hero.sub': 'I build custom websites, internal tools, admin platforms, parsers, bots, automation flows, and AI-assisted products - where design, backend logic, integrations, and operational safety behave like one system.',
        'hero.ctaPrimary': 'See selected builds',
        'hero.ctaSecondary': 'Get in touch',
        'hero.scroll': 'Scroll to explore',
        'stat.clubs': 'Club locations powered',
        'stat.countries': 'Countries covered',
        'stat.products': 'Live products shipped',
        'stat.e2e': 'End-to-end full-stack',
        'stat.tagline': 'From database to interface -',
        'stat.turnkey': 'turnkey.',
        'systems.eyebrow': 'System range',
        'systems.h2': 'From visible frontend polish to the <span class="text-glow">invisible logic</span> underneath.',
        'systems.sub': 'Five system types I build - from polished marketing surfaces to full operational stacks.',
        'sys.01.h3': 'Business websites with depth',
        'sys.01.p': 'Premium visual layer paired with real logic: forms, structured flows, admin surfaces, integrations, and operational content.',
        'sys.02.h3': 'Internal operating layers',
        'sys.02.p': 'Permissions, filters, analytics, archive views, task flows, role-based control for real teams.',
        'sys.03.h3': 'Parsers and data intake',
        'sys.03.p': 'Scraping, cached layers, imports, scheduled sync, and source-to-dashboard data flows.',
        'sys.04.h3': 'Bots and automation',
        'sys.04.p': 'Telegram bots, notification systems, workflow triggers, auto-confirmations, and operational messaging.',
        'sys.05.h3': 'AI responder flows',
        'sys.05.p': 'Voice-first or assistant-like experiences connected to real data, business rules, and fallback handling.',
        'about.eyebrow': 'About me',
        'about.h2': 'I am building products with <span class="text-glow">taste, structure, and intent</span>.',
        'about.sub': 'A short snapshot of who I am, what I bring to the table, and the kind of work I keep taking on.',
        'about.card1.h3': 'Vladyslav Tomashchuk',
        'about.card1.p': '21 years old, born in 2004, originally from Ukraine, working in IT for a long time already. I care about clean structure, practical decisions, and making things feel finished instead of generic.',
        'about.card2.h3': 'What I bring',
        'about.card2.p': 'Ideas, product thinking, careful implementation, consulting around direction, and a habit of pushing projects past the obvious version into something that feels stronger and more polished.',
        'about.card3.h3': 'Support and ideas',
        'about.card3.p': 'Dmitry Ganj helped with ideas and consultation along the way. You can find him here: <a href="https://www.instagram.com/dmitry_ganj/" target="_blank" rel="noopener noreferrer">instagram.com/dmitry_ganj</a>.',
        'proj.01.h2': 'Event Ticketing and QR Access Platform',
        'proj.01.desc': 'A full-cycle system for ticket sales, QR generation, admin control, search, analytics, maps, and scanner-safe event operations. Configured for <strong>75 club locations in 22 countries</strong>.',
        'proj.01.f1': 'Ticket issuance, search, reporting, analytics, and access control in one product surface.',
        'proj.01.f2': 'Scanner-side reliability cannot be broken by backoffice changes.',
        'proj.01.f3': 'Recovery and corrective tooling were part of the real production work.',
        'proj.02.h2': 'Task Control and Team Operations Platform',
        'proj.02.desc': 'A role-based product for coordinating recurring events, teams, permissions, task groups, confirmations, analytics, archives, and operational communication.',
        'proj.02.f1': 'Designed around repeated operational use, not one-off admin tasks.',
        'proj.02.f2': 'Connected task execution with notifications, sync flows, user roles, and event visibility.',
        'proj.02.f3': 'Turned fragmented team coordination into one controlled product environment.',
        'proj.03.h2': 'AI Voice Auto-Responder and Booking Assistant',
        'proj.03.desc': 'A voice-first AI assistant for inbound calls, booking requests, and operational answers. Built around <strong>Twilio webhooks, Groq/OpenAI flows, speech handling, and SQLite logging</strong>.',
        'proj.03.f1': 'Handles inbound calls as a product flow, not just a single endpoint.',
        'proj.03.f2': 'Uses a parser and cached layer so answers are grounded in current venue data.',
        'proj.03.f3': 'Combines voice automation, business rules, and operator-minded fallbacks.',
        'capabilities.eyebrow': 'Capabilities',
        'cap.h2': 'I can shape both the <span class="text-glow">polished surface</span> and the messy system underneath.',
        'cap.01.h3': 'Complex portfolio-grade websites',
        'cap.01.p': 'High-end layouts, layered composition, custom motion, strong visual hierarchy - designed, not templated.',
        'cap.02.h3': 'Admin platforms',
        'cap.02.p': 'Backoffice systems with filters, tables, analytics, permissions, settings, and operational controls.',
        'cap.03.h3': 'Workflow products',
        'cap.03.p': 'Task coordination, confirmation flows, archives, and products structured around actual execution logic.',
        'cap.04.h3': 'Parsers and data intake',
        'cap.04.p': 'Website parsing, cached source data, import pipelines, and scheduled sync around external systems.',
        'cap.05.h3': 'Bots and AI assistants',
        'cap.05.p': 'Telegram bots, voice bots, responder flows, and assistant-style systems connected to real business logic.',
        'cap.06.h3': 'Automation and integrations',
        'cap.06.p': 'Google Sheets sync, exports, notifications, scheduled jobs, and process automation between tools.',
        'stack.eyebrow': 'Tech stack',
        'stack.h2': 'Technologies across sites, products, automations, and <span class="text-glow">AI systems</span>.',
        'stack.fe.label': 'Frontend',
        'stack.fe.h3': 'Web and interface layers',
        'stack.be.label': 'Backend',
        'stack.be.h3': 'Product logic and APIs',
        'stack.data.label': 'Data and automation',
        'stack.data.h3': 'Sync, storage, parsing',
        'stack.ai.label': 'Bots and AI',
        'stack.ai.h3': 'Assistants and response layers',
        'process.eyebrow': 'How I work',
        'process.h2': 'Five phases from <span class="text-glow">discovery to launch</span>.',
        'step.01.tag': 'Discovery',
        'step.01.h3': 'Pressure map',
        'step.01.p': 'Where the workflow can break, what must stay editable, who owns which action, what absolutely cannot fail.',
        'step.02.tag': 'Architecture',
        'step.02.h3': 'Structure',
        'step.02.p': 'How screens, logic, permissions, logs, and recovery paths connect so the product survives real use.',
        'step.03.tag': 'Interface',
        'step.03.h3': 'Surface',
        'step.03.p': 'Typography, rhythm, motion, density, and contrast tuned so the page feels authored, not assembled.',
        'step.04.tag': 'Automation',
        'step.04.h3': 'Integration',
        'step.04.p': 'Bots, parsers, sheets, AI, and admin actions that reinforce the same workflow instead of creating side channels.',
        'step.05.tag': 'Launch',
        'step.05.h3': 'Release',
        'step.05.p': 'Supportability, rollback paths, clear admin states, and practical maintenance are part of the design.',
        'footer.eyebrow': 'Let us work together',
        'footer.h2': 'Ready to build <span class="text-glow">something real?</span>',
        'footer.sub': 'I take on custom builds that mix strong visual surfaces, product thinking, backend logic, integrations, automation, and operational safety. Based in Poland, working remotely.',
        'footer.creditLabel': 'Credit',
        'footer.creditValue': 'Ideas and consultation with <a href="https://www.instagram.com/dmitry_ganj/" target="_blank" rel="noopener noreferrer">Dmitry Ganj</a>',
        'lang.switchAria': 'Language switch'
      },
      ru: {
        'hero.eyebrow': 'Независимый Full-Stack разработчик',
        'hero.sub': 'Создаю сайты, внутренние инструменты, admin-панели, парсеры, боты, автоматизацию и AI-продукты — где дизайн, серверная логика, интеграции и операционная надёжность работают как единая система.',
        'hero.ctaPrimary': 'Посмотреть проекты',
        'hero.ctaSecondary': 'Связаться',
        'hero.scroll': 'Листать ниже',
        'stat.clubs': 'Клубных локаций',
        'stat.countries': 'Охваченных стран',
        'stat.products': 'Запущенных продуктов',
        'stat.e2e': 'Full-stack от начала до конца',
        'stat.tagline': 'От базы данных до интерфейса -',
        'stat.turnkey': 'под ключ.',
        'systems.eyebrow': 'Типы систем',
        'systems.h2': 'От заметной полировки фронтенда до <span class="text-glow">невидимой логики</span> внутри.',
        'systems.sub': 'Пять типов систем — от маркетинговых поверхностей до полноценных операционных стеков.',
        'sys.01.h3': 'Бизнес-сайты с глубиной',
        'sys.01.p': 'Премиальный визуальный слой + реальная логика: формы, структурированные флоу, admin-интерфейсы, интеграции и операционный контент.',
        'sys.02.h3': 'Внутренние операционные слои',
        'sys.02.p': 'Разрешения, фильтры, аналитика, архивные представления, задачные флоу, ролевое управление для реальных команд.',
        'sys.03.h3': 'Парсеры и сбор данных',
        'sys.03.p': 'Скрапинг, кешированные слои, импорты, плановая синхронизация и потоки данных от источника до дашборда.',
        'sys.04.h3': 'Боты и автоматизация',
        'sys.04.p': 'Telegram-боты, системы уведомлений, триггеры воркфлоу, авто-подтверждения и операционные сообщения.',
        'sys.05.h3': 'AI-ответчики',
        'sys.05.p': 'Голосовые или ассистентские сценарии, связанные с реальными данными, бизнес-правилами и обработкой исключений.',
        'about.eyebrow': 'Обо мне',
        'about.h2': 'Я делаю продукты с <span class="text-glow">вкусом, структурой и смыслом</span>.',
        'about.sub': 'Короткий срез того, кто я, что могу принести в проект и какой тип работы мне интересен.',
        'about.card1.h3': 'Владислав Томашчук',
        'about.card1.p': '21 год, 2004 года рождения, родом из Украины, давно работаю в IT. Мне важны чистая структура, практичные решения и ощущение завершённости вместо шаблонности.',
        'about.card2.h3': 'Что я привношу',
        'about.card2.p': 'Идеи, продуктовое мышление, аккуратную реализацию, консультации по направлению и привычку доводить проект дальше очевидной версии — до более сильного и отполированного результата.',
        'about.card3.h3': 'Поддержка и идеи',
        'about.card3.p': 'Dmitry Ganj помогал с идеями и консультацией по ходу работы. Его можно найти здесь: <a href="https://www.instagram.com/dmitry_ganj/" target="_blank" rel="noopener noreferrer">instagram.com/dmitry_ganj</a>.',
        'proj.01.h2': 'Платформа продажи билетов и QR-доступа',
        'proj.01.desc': 'Полноцикловая система для продажи билетов, генерации QR, admin-контроля, поиска, аналитики, карт и безопасных операций на мероприятиях. Настроена для <strong>75 клубных локаций в 22 странах</strong>.',
        'proj.01.f1': 'Выдача билетов, поиск, отчётность, аналитика и контроль доступа в одном продукте.',
        'proj.01.f2': 'Надёжность сканера не зависит от изменений в бэкофисе.',
        'proj.01.f3': 'Инструменты восстановления и коррекции — часть реального продакшн-процесса.',
        'proj.02.h2': 'Платформа управления задачами и командными операциями',
        'proj.02.desc': 'Продукт с ролевым доступом для координации повторяющихся мероприятий, команд, разрешений, задачных групп, подтверждений, аналитики, архивов и операционной коммуникации.',
        'proj.02.f1': 'Создан для повторяющегося операционного использования, а не разовых admin-задач.',
        'proj.02.f2': 'Связал выполнение задач с уведомлениями, синхронизационными флоу, ролями и видимостью мероприятий.',
        'proj.02.f3': 'Превратил разрозненную координацию команды в единую управляемую среду продукта.',
        'proj.03.h2': 'AI-голосовой автоответчик и ассистент бронирования',
        'proj.03.desc': 'Голосовой AI-ассистент для входящих звонков, запросов бронирования и операционных ответов. Построен на <strong>Twilio webhooks, Groq/OpenAI флоу, обработке речи и SQLite логировании</strong>.',
        'proj.03.f1': 'Обрабатывает входящие звонки как продуктовый флоу, а не просто единый эндпоинт.',
        'proj.03.f2': 'Использует парсер и кешированный слой — ответы основаны на актуальных данных площадки.',
        'proj.03.f3': 'Сочетает голосовую автоматизацию, бизнес-правила и операторские fallback-сценарии.',
        'capabilities.eyebrow': 'Возможности',
        'cap.h2': 'Формирую как <span class="text-glow">отполированный интерфейс</span>, так и сложную логику внутри.',
        'cap.01.h3': 'Комплексные портфолио-сайты',
        'cap.01.p': 'Высококлассные лейауты, многоуровневая композиция, кастомная анимация, сильная визуальная иерархия — спроектированная, а не из шаблона.',
        'cap.02.h3': 'Admin-платформы',
        'cap.02.p': 'Бэкофисные системы с фильтрами, таблицами, аналитикой, разрешениями, настройками и операционными инструментами.',
        'cap.03.h3': 'Воркфлоу-продукты',
        'cap.03.p': 'Координация задач, флоу подтверждений, архивы и продукты, построенные вокруг реальной логики выполнения.',
        'cap.04.h3': 'Парсеры и сбор данных',
        'cap.04.p': 'Парсинг сайтов, кешированные данные источника, пайплайны импорта и плановая синхронизация с внешними системами.',
        'cap.05.h3': 'Боты и AI-ассистенты',
        'cap.05.p': 'Telegram-боты, голосовые боты, флоу ответчиков и ассистентские системы, подключённые к реальной бизнес-логике.',
        'cap.06.h3': 'Автоматизация и интеграции',
        'cap.06.p': 'Синхронизация с Google Sheets, экспорты, уведомления, плановые задачи и автоматизация процессов между инструментами.',
        'stack.eyebrow': 'Технологии',
        'stack.h2': 'Технологии для сайтов, продуктов, автоматизации и <span class="text-glow">AI-систем</span>.',
        'stack.fe.label': 'Фронтенд',
        'stack.fe.h3': 'Веб и интерфейсные слои',
        'stack.be.label': 'Бэкенд',
        'stack.be.h3': 'Логика продукта и API',
        'stack.data.label': 'Данные и автоматизация',
        'stack.data.h3': 'Синхронизация, хранение, парсинг',
        'stack.ai.label': 'Боты и AI',
        'stack.ai.h3': 'Ассистенты и слои ответов',
        'process.eyebrow': 'Как я работаю',
        'process.h2': 'Пять этапов от <span class="text-glow">анализа до запуска</span>.',
        'step.01.tag': 'Анализ',
        'step.01.h3': 'Карта давления',
        'step.01.p': 'Где воркфлоу может сломаться, что должно оставаться редактируемым, кто за что отвечает, что вообще не может упасть.',
        'step.02.tag': 'Архитектура',
        'step.02.h3': 'Структура',
        'step.02.p': 'Как экраны, логика, разрешения, логи и пути восстановления соединяются, чтобы продукт выжил в реальной эксплуатации.',
        'step.03.tag': 'Интерфейс',
        'step.03.h3': 'Поверхность',
        'step.03.p': 'Типографика, ритм, анимация, плотность и контрастность — настроены так, чтобы страница ощущалась авторской.',
        'step.04.tag': 'Автоматизация',
        'step.04.h3': 'Интеграция',
        'step.04.p': 'Боты, парсеры, таблицы, AI и admin-действия, которые усиливают один воркфлоу вместо создания параллельных каналов.',
        'step.05.tag': 'Запуск',
        'step.05.h3': 'Релиз',
        'step.05.p': 'Поддерживаемость, пути отката, понятные состояния admin-панели и практичное обслуживание — часть дизайна.',
        'footer.eyebrow': 'Давайте работать вместе',
        'footer.h2': 'Готовы построить <span class="text-glow">что-то настоящее?</span>',
        'footer.sub': 'Берусь за кастомные проекты, которые сочетают сильные визуальные поверхности, продуктовое мышление, серверную логику, интеграции, автоматизацию и операционную надёжность. Базируюсь в Польше, работаю удалённо.',
        'footer.creditLabel': 'Кредит',
        'footer.creditValue': 'Идеи и консультация с <a href="https://www.instagram.com/dmitry_ganj/" target="_blank" rel="noopener noreferrer">Dmitry Ganj</a>',
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
      document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
        el.innerHTML = t(el.dataset.i18nHtml);
      });
      syncButtons();
    }

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

    applyTranslations();
  })();

})();
