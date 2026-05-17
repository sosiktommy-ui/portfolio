const baseTranslations = {
  en: {
    'meta.description': 'Premium case study landing page for an international QR ticketing and event operations platform.',
    'page.title': 'Case Study • International Event Ticketing Platform',
    'brand.title': 'Event Systems',
    'brand.subtitle': 'Premium project case study',
    'nav.sectionsAria': 'Sections',
    'nav.capabilities': 'Capabilities',
    'nav.difference': 'Difference',
    'nav.architecture': 'Architecture',
    'nav.summary': 'Summary',
    'header.copyReady': 'Interactive portfolio case',
    'hero.eyebrow': 'Custom product • live operations • premium delivery',
    'hero.title': 'International event ticketing infrastructure built for real crowds, real pressure, and real production responsibility.',
    'hero.intro': 'A full-cycle platform for a nightlife and events business operating across 75 club locations in 22 countries. The system connected order intake, secure QR ticket generation, delivery, entrance scanning, admin workflows, and analytics into one operational flow.',
    'hero.buttonExplore': 'Explore the system',
    'hero.buttonSummary': 'Jump to summary',
    'hero.factCoverageLabel': 'Coverage',
    'hero.factCoverageValue': '75 club locations',
    'hero.factCoverageBody': 'Configured for a distributed venue network, not a single-event demo.',
    'hero.factReachLabel': 'Reach',
    'hero.factReachValue': '22 countries',
    'hero.factReachBody': 'Built for multi-market operations and city-level oversight.',
    'hero.factLoopLabel': 'Operational loop',
    'hero.factLoopValue': 'One connected flow',
    'hero.factLoopBody': 'Orders, tickets, scanning, analytics, and support all worked together.',
    'visual.coreKicker': 'ONE CONNECTED FLOW',
    'visual.title': 'Order to entrance, without disconnected tools in between.',
    'visual.body': 'Secure ticketing, live validation, admin control, reporting, and reliability work in one system.',
    'visual.intakeTag': 'INTAKE',
    'visual.intakeBody': 'Spreadsheet and external-source order ingestion',
    'visual.deliveryTag': 'DELIVERY',
    'visual.deliveryBody': 'Automated QR ticket generation and dispatch',
    'visual.doorTag': 'DOOR CONTROL',
    'visual.doorBody': 'Real-time scanner validation for entrance teams',
    'visual.analyticsTag': 'ANALYTICS',
    'visual.analyticsBody': 'Admin visibility across cities, events, sales, and attendance',
    'visual.badgeTop': 'Live ops ready',
    'visual.badgeBottom': 'Recovery-minded engineering',
    'marquee.aria': 'Project keywords',
    'marquee.operations': 'Event operations',
    'marquee.qr': 'QR ticketing',
    'marquee.scanning': 'Entrance scanning',
    'marquee.analytics': 'Admin analytics',
    'marquee.migrations': 'Safe migrations',
    'marquee.recovery': 'Production recovery',
    'capabilities.eyebrow': 'Scale and characteristics',
    'capabilities.title': 'Built as an operating system for venue teams, not just a dashboard with nice charts.',
    'capabilities.body': 'The value of the project came from how many moving parts it unified and how safely it could be maintained under real business pressure.',
    'capabilities.metricOneTitle': 'Club locations configured',
    'capabilities.metricOneBody': 'Ready for a wide venue network rather than one isolated market.',
    'capabilities.metricTwoTitle': 'Countries supported',
    'capabilities.metricTwoBody': 'Designed for international operations and location-level segmentation.',
    'capabilities.metricThreeTitle': 'Core product layers',
    'capabilities.metricThreeBody': 'Orders, ticketing, delivery, validation, analytics, and recovery tooling.',
    'capabilities.metricFourTitle': 'Connected operational flow',
    'capabilities.metricFourBody': 'One platform covering the full path from purchase to entrance verification.',
    'difference.eyebrow': 'Why this project stands out',
    'difference.title': 'Most ticketing tools solve one layer. This system linked the entire event operation together.',
    'difference.body': 'That meant fewer manual handoffs, tighter control at the door, cleaner operational reporting, and a product that could survive the messy parts of production instead of breaking outside the happy path.',
    'difference.cardOneTitle': 'Automation without fragmented tools',
    'difference.cardOneBody': 'Order intake, ticket creation, dispatch, validation, and admin reporting were connected as one flow.',
    'difference.cardTwoTitle': 'Built for live entrance pressure',
    'difference.cardTwoBody': 'The scanner side was treated as mission-critical, so business changes had to stay safe for real check-in operations.',
    'difference.cardThreeTitle': 'Useful analytics, not decorative analytics',
    'difference.cardThreeBody': 'Organizers could read sales, attendance, city performance, timelines, and operational status in one admin surface.',
    'difference.cardFourTitle': 'Recovery-first engineering',
    'difference.cardFourBody': 'Production support included data restoration, analytics recovery, safe migrations, and template/rendering fixes.',
    'architecture.eyebrow': 'System choreography',
    'architecture.title': 'The product behaved like a control room, not a collection of unrelated pages.',
    'architecture.body': 'Orders could arrive from spreadsheets and external inputs. Tickets were generated and delivered automatically. Scanner flows validated entrance in real time. The admin layer translated activity into business visibility. When production problems happened, the system was supported with safe operational fixes instead of guesswork.',
    'architecture.stepOneTitle': 'Order intake',
    'architecture.stepOneBody': 'Google Sheets and external-source flows fed structured ticket data into the system.',
    'architecture.stepTwoTitle': 'Ticket generation',
    'architecture.stepTwoBody': 'Secure QR-based tickets were generated with custom templates and operational controls.',
    'architecture.stepThreeTitle': 'Delivery and handling',
    'architecture.stepThreeBody': 'Customers received tickets while admin tools kept event operations and corrections manageable.',
    'architecture.stepFourTitle': 'Entrance validation',
    'architecture.stepFourBody': 'The scanner application handled ticket checks where reliability mattered most: at the door.',
    'architecture.stepFiveTitle': 'Analytics and support',
    'architecture.stepFiveBody': 'Admin reporting, production debugging, safe migrations, and data recovery completed the operational loop.',
    'resilience.eyebrow': 'Production reliability',
    'resilience.title': 'What made the project premium was not just feature depth. It was the ability to keep it working when reality got messy.',
    'resilience.cardOneTitle': 'Safe data restoration',
    'resilience.cardOneBody': 'Critical analytics data could be repaired without touching scanner-critical validation paths.',
    'resilience.cardTwoTitle': 'Careful production maintenance',
    'resilience.cardTwoBody': 'Changes were handled with caution because event-night workflows could not afford side effects.',
    'resilience.cardThreeTitle': 'Template and rendering resilience',
    'resilience.cardThreeBody': 'Ticket generation was hardened so visual output stayed correct even when environment details changed.',
    'resilience.cardFourTitle': 'Operational clarity',
    'resilience.cardFourBody': 'The admin side focused on readable information for organizers, not just technical completeness.',
    'stack.eyebrow': 'Technology footprint',
    'stack.title': 'Chosen for control, speed, and maintainable real-world delivery.',
    'stack.backendLabel': 'Backend',
    'stack.backendChipOne': 'Python',
    'stack.backendChipTwo': 'FastAPI',
    'stack.backendChipThree': 'PostgreSQL',
    'stack.backendChipFour': 'SQLite',
    'stack.frontendLabel': 'Frontend',
    'stack.frontendChipOne': 'React',
    'stack.frontendChipTwo': 'TypeScript',
    'stack.frontendChipThree': 'Custom analytics UI',
    'stack.operationsLabel': 'Operations',
    'stack.operationsChipOne': 'QR ticket rendering',
    'stack.operationsChipTwo': 'Scanner flows',
    'stack.operationsChipThree': 'Google Sheets integrations',
    'stack.operationsChipFour': 'Production support',
    'summary.eyebrow': 'Portfolio snapshot',
    'summary.title': 'This page can be attached directly to a portfolio, while the blocks below remain available if a client asks for a text summary.',
    'summary.cardOneTitle': 'Short overview',
    'summary.cardOneBody': 'I developed and maintained a custom event ticketing ecosystem for an international nightlife and events business operating across 75 club locations in 22 countries. The platform covered the full operational cycle: automated order intake, secure QR ticket generation, ticket delivery, entrance validation, admin workflows, analytics, and production support. It included a backend/API layer for ticket lifecycle management, a scanner application for door control, and an admin dashboard for tracking sales, attendance, city-level performance, event-level metrics, and operational status across multiple locations.',
    'summary.cardTwoTitle': 'Why it stands out',
    'summary.cardTwoBody': 'Built for live operations rather than static demo use, the system connected backend logic, QR ticketing, scanner validation, and decision-grade reporting in one flow. My role covered product development, backend architecture, analytics logic, production debugging, safe migrations, data recovery, ticket rendering reliability, and platform hardening. The result was a practical, production-focused ticketing platform designed to reduce manual operations and keep critical event workflows stable under real pressure.',
    'footer.body': 'Standalone HTML showcase for portfolio attachments and premium project presentations.',
    'footer.metaPrefix': 'Portfolio Case Study',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.selectManually': 'Select manually'
  },
  ru: {
    'meta.description': 'Премиальный лендинг-кейс для международной event ticketing-платформы.',
    'page.title': 'Кейс • Международная event ticketing-платформа',
    'brand.title': 'Event Systems',
    'brand.subtitle': 'Премиальный кейс проекта',
    'nav.sectionsAria': 'Разделы',
    'nav.capabilities': 'Возможности',
    'nav.difference': 'Сильные стороны',
    'nav.architecture': 'Архитектура',
    'nav.summary': 'Описание',
    'header.copyReady': 'Интерактивный кейс для портфолио',
    'hero.eyebrow': 'Кастомный продукт • live operations • premium delivery',
    'hero.title': 'Инфраструктура event ticketing для реальных площадок, реальной нагрузки и живого production.',
    'hero.intro': 'Полноценная платформа для nightlife и event-бизнеса с сетью из 75 клубных локаций в 22 странах. Система объединяла приём заказов, защищённую генерацию QR-билетов, доставку, сканирование на входе, admin-workflows и аналитику в один связный операционный поток.',
    'hero.buttonExplore': 'Посмотреть систему',
    'hero.buttonSummary': 'К описанию',
    'hero.factCoverageLabel': 'Масштаб',
    'hero.factCoverageValue': '75 клубных локаций',
    'hero.factCoverageBody': 'Система рассчитана на распределённую сеть площадок, а не на demo для одного события.',
    'hero.factReachLabel': 'География',
    'hero.factReachValue': '22 страны',
    'hero.factReachBody': 'Архитектура учитывает multi-market операции и контроль по городам.',
    'hero.factLoopLabel': 'Операционный цикл',
    'hero.factLoopValue': 'Один связный поток',
    'hero.factLoopBody': 'Заказы, билеты, сканирование, аналитика и support работали как единая система.',
    'visual.coreKicker': 'ONE CONNECTED FLOW',
    'visual.title': 'От заказа до входа, без разрозненных инструментов между этапами.',
    'visual.body': 'Защищённый ticketing, live validation, admin-control, отчётность и надёжность были собраны в одной системе.',
    'visual.intakeTag': 'ПРИЁМ',
    'visual.intakeBody': 'Загрузка заказов из таблиц и внешних источников',
    'visual.deliveryTag': 'ДОСТАВКА',
    'visual.deliveryBody': 'Автоматическая генерация и отправка QR-билетов',
    'visual.doorTag': 'ВХОД',
    'visual.doorBody': 'Проверка билетов в реальном времени для команд на входе',
    'visual.analyticsTag': 'АНАЛИТИКА',
    'visual.analyticsBody': 'Видимость по городам, ивентам, продажам и посещаемости',
    'visual.badgeTop': 'Готово к live-операциям',
    'visual.badgeBottom': 'Инженерия с прицелом на recovery',
    'marquee.aria': 'Ключевые особенности проекта',
    'marquee.operations': 'Event operations',
    'marquee.qr': 'QR-билеты',
    'marquee.scanning': 'Сканирование на входе',
    'marquee.analytics': 'Админ-аналитика',
    'marquee.migrations': 'Безопасные миграции',
    'marquee.recovery': 'Восстановление production-данных',
    'capabilities.eyebrow': 'Масштаб и характеристики',
    'capabilities.title': 'Это был не просто dashboard с красивыми графиками, а операционная система для venue-команд.',
    'capabilities.body': 'Ценность проекта определялась тем, сколько слоёв он объединял и насколько безопасно его можно было поддерживать под реальным бизнес-давлением.',
    'capabilities.metricOneTitle': 'Сконфигурировано локаций',
    'capabilities.metricOneBody': 'Платформа подготовлена под широкую сеть площадок, а не под один рынок.',
    'capabilities.metricTwoTitle': 'Поддерживаемые страны',
    'capabilities.metricTwoBody': 'Решение проектировалось под международную операционную модель и сегментацию по локациям.',
    'capabilities.metricThreeTitle': 'Ключевые продуктовые слои',
    'capabilities.metricThreeBody': 'Заказы, ticketing, доставка, валидация, аналитика и recovery tooling.',
    'capabilities.metricFourTitle': 'Связный операционный поток',
    'capabilities.metricFourBody': 'Одна платформа закрывала путь от покупки до проверки билета на входе.',
    'difference.eyebrow': 'Почему этот проект сильный',
    'difference.title': 'Большинство ticketing-решений закрывают один слой. Здесь была связана вся event-операция целиком.',
    'difference.body': 'Это означало меньше ручных передаваний между командами, более жёсткий контроль на входе, более чистую операционную отчётность и продукт, который выдерживал messy-сценарии production, а не ломался вне happy path.',
    'difference.cardOneTitle': 'Автоматизация без фрагментации инструментов',
    'difference.cardOneBody': 'Приём заказов, создание билетов, отправка, валидация и admin-отчётность были собраны в один поток.',
    'difference.cardTwoTitle': 'Проектировалось под реальное давление на входе',
    'difference.cardTwoBody': 'Сканер рассматривался как mission-critical часть, поэтому любые изменения должны были оставаться безопасными для check-in-процессов.',
    'difference.cardThreeTitle': 'Полезная аналитика, а не декоративная аналитика',
    'difference.cardThreeBody': 'Организаторы видели продажи, посещаемость, эффективность городов, таймлайны и операционный статус в одной admin-поверхности.',
    'difference.cardFourTitle': 'Recovery-first engineering',
    'difference.cardFourBody': 'Production-support включал восстановление данных, ремонт аналитики, безопасные миграции и исправления ticket-rendering.',
    'architecture.eyebrow': 'Хореография системы',
    'architecture.title': 'Продукт работал как control room, а не как набор случайных страниц.',
    'architecture.body': 'Заказы могли приходить из таблиц и внешних источников. Билеты автоматически генерировались и доставлялись. Scanner-flows валидировали вход в реальном времени. Admin-слой превращал события системы в управленческую видимость. Когда в production что-то ломалось, поддержка строилась на безопасных операционных фиксах, а не на догадках.',
    'architecture.stepOneTitle': 'Приём заказов',
    'architecture.stepOneBody': 'Google Sheets и внешние источники подавали структурированные ticket-данные в систему.',
    'architecture.stepTwoTitle': 'Генерация билетов',
    'architecture.stepTwoBody': 'Защищённые QR-билеты создавались на кастомных шаблонах с операционными ограничениями.',
    'architecture.stepThreeTitle': 'Доставка и обработка',
    'architecture.stepThreeBody': 'Покупатели получали билеты, а admin-инструменты помогали управлять корректировками и процессами мероприятия.',
    'architecture.stepFourTitle': 'Валидация на входе',
    'architecture.stepFourBody': 'Scanner-приложение проверяло билеты там, где надёжность была критична больше всего: на дверях.',
    'architecture.stepFiveTitle': 'Аналитика и support',
    'architecture.stepFiveBody': 'Admin-отчётность, production-debugging, safe migrations и data recovery замыкали операционный цикл.',
    'resilience.eyebrow': 'Надёжность в production',
    'resilience.title': 'Премиальность проекта определялась не только глубиной фич, но и способностью продолжать работать, когда реальность становилась грязной.',
    'resilience.cardOneTitle': 'Безопасное восстановление данных',
    'resilience.cardOneBody': 'Критичную аналитику можно было чинить без вмешательства в scanner-critical пути валидации.',
    'resilience.cardTwoTitle': 'Осторожная поддержка production',
    'resilience.cardTwoBody': 'Изменения вносились максимально аккуратно, потому что event-night workflows не допускали побочных эффектов.',
    'resilience.cardThreeTitle': 'Устойчивый ticket rendering',
    'resilience.cardThreeBody': 'Генерация билетов была усилена так, чтобы визуальный вывод оставался корректным даже при изменении окружения.',
    'resilience.cardFourTitle': 'Операционная ясность',
    'resilience.cardFourBody': 'Admin-слой делался прежде всего для понятной работы организаторов, а не ради технической полноты ради полноты.',
    'stack.eyebrow': 'Технологический стек',
    'stack.title': 'Технологии подбирались под контроль, скорость и поддерживаемую доставку в реальном мире.',
    'stack.backendLabel': 'Backend',
    'stack.backendChipOne': 'Python',
    'stack.backendChipTwo': 'FastAPI',
    'stack.backendChipThree': 'PostgreSQL',
    'stack.backendChipFour': 'SQLite',
    'stack.frontendLabel': 'Frontend',
    'stack.frontendChipOne': 'React',
    'stack.frontendChipTwo': 'TypeScript',
    'stack.frontendChipThree': 'Кастомный аналитический UI',
    'stack.operationsLabel': 'Operations',
    'stack.operationsChipOne': 'Рендеринг QR-билетов',
    'stack.operationsChipTwo': 'Scanner-flows',
    'stack.operationsChipThree': 'Интеграции с Google Sheets',
    'stack.operationsChipFour': 'Production-support',
    'summary.eyebrow': 'Портфолио-снимок проекта',
    'summary.title': 'Эту страницу можно прикладывать к портфолио как самостоятельный кейс, а блоки ниже остаются на случай, если клиент попросит текстовое описание.',
    'summary.cardOneTitle': 'Короткое описание',
    'summary.cardOneBody': 'Разработал и поддерживал кастомную ticketing-экосистему для международного nightlife и event-бизнеса с сетью из 75 клубных локаций в 22 странах. Платформа закрывала полный операционный цикл: автоматический приём заказов, защищённую генерацию QR-билетов, доставку билетов, валидацию на входе, admin-процессы, аналитику и production-support. В неё входили backend/API для управления жизненным циклом билетов, scanner-приложение для door control и admin dashboard для отслеживания продаж, посещаемости, эффективности по городам, метрик по мероприятиям и операционного статуса сразу по нескольким локациям.',
    'summary.cardTwoTitle': 'Почему это сильный кейс',
    'summary.cardTwoBody': 'Система проектировалась под живые операции, а не под статичную demo-сцену: backend-логика, QR-ticketing, scanner-validation и управленческая аналитика были собраны в один связный поток. Моя роль включала product development, backend architecture, analytics logic, production debugging, safe migrations, data recovery, надёжность ticket rendering и platform hardening. В результате получилась практичная, production-oriented ticketing-платформа, которая снижала долю ручных операций и удерживала критичные event-workflows стабильными под реальной нагрузкой.',
    'footer.body': 'Статичный HTML-showcase для портфолио, вложений к кейсам и премиальных проектных презентаций.',
    'footer.metaPrefix': 'Портфолио-кейс',
    'common.copy': 'Скопировать',
    'common.copied': 'Скопировано',
    'common.selectManually': 'Выделите вручную'
  }
};

const projectOverrides = {
  zipiki: {
    en: {
      'meta.description': 'Premium case study landing page for Zipiki, an event operations and task orchestration platform.',
      'page.title': 'Case Study • Zipiki Event Operations Platform',
      'hero.eyebrow': 'Operations platform • team coordination • workflow control',
      'hero.title': 'Zipiki is an event operations platform built to coordinate teams, recurring events, and execution across moving parts.',
      'hero.intro': 'A role-based system for event planning and task orchestration, combining a NestJS backend, React admin interface, Google Sheets syncing, Telegram notifications, analytics, archives, and granular access control. It turned event schedules into structured execution flows instead of leaving teams inside scattered chats and spreadsheets.',
      'hero.buttonExplore': 'See the platform',
      'hero.factCoverageLabel': 'Platform core',
      'hero.factCoverageValue': 'Role-based task orchestration',
      'hero.factCoverageBody': 'Built around users, permissions, task groups, subgroups, confirmations, and admin oversight.',
      'hero.factReachLabel': 'Automation',
      'hero.factReachValue': 'Google Sheets -> events -> tasks',
      'hero.factReachBody': 'New events could be imported or synced into structured task flows instead of being recreated manually.',
      'hero.factLoopLabel': 'Notifications',
      'hero.factLoopValue': 'Telegram delivery + confirmations',
      'hero.factLoopBody': 'Operational teams received actionable notifications instead of passive status updates.',
      'visual.title': 'From spreadsheet to confirmed event execution.',
      'visual.body': 'Sync, task generation, permissions, notifications, analytics, and archive control worked as one operating loop.',
      'visual.intakeTag': 'SYNC',
      'visual.intakeBody': 'Google Sheet imports and recurring event synchronization',
      'visual.deliveryTag': 'TASKS',
      'visual.deliveryBody': 'Automatic task generation by groups, subgroups, and event templates',
      'visual.doorTag': 'NOTIFICATIONS',
      'visual.doorBody': 'Telegram delivery, callbacks, and confirmations for operational teams',
      'visual.analyticsTag': 'CONTROL',
      'visual.analyticsBody': 'Admin visibility for analytics, archives, users, and task execution',
      'visual.badgeTop': 'Ops workflow ready',
      'visual.badgeBottom': 'Sync + permissions + notifications',
      'marquee.operations': 'Task orchestration',
      'marquee.qr': 'Google Sheet sync',
      'marquee.scanning': 'Telegram notifications',
      'marquee.analytics': 'Role-based access',
      'marquee.migrations': 'Archive control',
      'marquee.recovery': 'Event analytics',
      'capabilities.title': 'Built as an execution layer for event teams, not as another generic to-do board.',
      'capabilities.body': 'The platform connected planning, sync, permissions, task execution, confirmations, and analytics into one operational surface for recurring event work.',
      'capabilities.metricOneTitle': 'Core backend modules',
      'capabilities.metricOneBody': 'Auth, events, tasks, task groups, analytics, import, sync, notifications, and users were split into dedicated modules.',
      'capabilities.metricTwoTitle': 'Minute sync cycle',
      'capabilities.metricTwoBody': 'A scheduled job could re-read the published sheet every five minutes and reconcile event data.',
      'capabilities.metricThreeTitle': 'Telegram queue throughput',
      'capabilities.metricThreeBody': 'Notification delivery was rate-limited and queued for operational safety instead of blasting messages blindly.',
      'capabilities.metricFourTitle': 'Task states in workflow',
      'capabilities.metricFourBody': 'The flow tracked not done, done, and confirmed states for accountability across teams.',
      'difference.title': 'Most task tools stop at lists. Zipiki linked event schedules, permissions, notifications, and execution into one system.',
      'difference.body': 'That made it useful for real operations: teams could see what mattered, admins could control access, and recurring event work moved through a structured workflow rather than informal coordination.',
      'difference.cardOneTitle': 'Recurring event operations, not generic tasks',
      'difference.cardOneBody': 'Events carried location, organization, archive state, and automatically generated task checklists.',
      'difference.cardTwoTitle': 'Granular access by subgroup',
      'difference.cardTwoBody': 'Permissions could be assigned at subgroup level so users only saw and edited the work that belonged to them.',
      'difference.cardThreeTitle': 'Telegram notifications with action flow',
      'difference.cardThreeBody': 'The bot delivered updates, account linking, and confirmation actions instead of acting as a passive broadcast channel.',
      'difference.cardFourTitle': 'Live sync and archive logic',
      'difference.cardFourBody': 'The system handled scheduled sheet sync, duplicate cleanup, and archive transitions for events that changed over time.',
      'architecture.title': 'The product worked like a control layer for recurring event execution.',
      'architecture.body': 'Published sheet data could be synced into events. New events automatically spawned tasks for visible subgroups. Users completed and confirmed work through role-aware access. Admin flows handled analytics, archives, user management, and bot settings. Telegram notifications closed the loop by delivering real operational signals to the team.',
      'architecture.stepOneTitle': 'Sheet sync',
      'architecture.stepOneBody': 'Published Google Sheets data was parsed, validated, and compared with existing events on a schedule.',
      'architecture.stepTwoTitle': 'Event creation',
      'architecture.stepTwoBody': 'New or updated events were created with organization, city, club, theme, notes, and archive metadata.',
      'architecture.stepThreeTitle': 'Task generation',
      'architecture.stepThreeBody': 'Each event automatically generated task records for visible subgroups so execution started with structure.',
      'architecture.stepFourTitle': 'Notifications and confirmations',
      'architecture.stepFourBody': 'Telegram delivery supported account linking, queue-based sending, callback actions, and confirmation workflows.',
      'architecture.stepFiveTitle': 'Analytics and admin control',
      'architecture.stepFiveBody': 'Admins could manage users, task groups, archives, analytics, profile flows, and bot-related settings from the interface.',
      'resilience.title': 'What made Zipiki strong was not just task CRUD. It was the operational discipline around sync, permissions, and communication.',
      'resilience.cardOneTitle': 'Duplicate cleanup and archive handling',
      'resilience.cardOneBody': 'The backend could reconcile repeated event entries, archive removed events, and preserve manual archive intent.',
      'resilience.cardTwoTitle': 'Permission-aware execution',
      'resilience.cardTwoBody': 'Access controls were attached to subgroups so the system reflected organizational boundaries instead of flattening them.',
      'resilience.cardThreeTitle': 'Queue-based Telegram delivery',
      'resilience.cardThreeBody': 'Notifications were rate-limited, retried around Telegram limits, and cleaned up when users blocked the bot.',
      'resilience.cardFourTitle': 'Import, export, and admin visibility',
      'resilience.cardFourBody': 'Teams were not locked into opaque state: events could be imported, exported, reviewed, and tracked through admin surfaces.',
      'stack.backendChipOne': 'NestJS',
      'stack.backendChipTwo': 'Prisma',
      'stack.backendChipThree': 'PostgreSQL',
      'stack.backendChipFour': 'Telegram bot',
      'stack.frontendChipThree': 'Vite + Zustand admin UI',
      'stack.operationsChipOne': 'Google Sheets sync',
      'stack.operationsChipTwo': 'Task permissions',
      'stack.operationsChipThree': 'Telegram notifications',
      'stack.operationsChipFour': 'Archive and analytics flows',
      'summary.cardOneBody': 'I built Zipiki as a role-based event operations and task orchestration platform for coordinating recurring events, teams, and execution workflows. The system combined a NestJS/Prisma backend, React admin interface, Google Sheets syncing, Telegram notifications, analytics, archives, and user management. It turned event schedules into structured task flows with permissions, confirmations, and admin visibility instead of leaving operations spread across chats and spreadsheets.',
      'summary.cardTwoBody': 'What made the project strong was not just task management. Zipiki linked planning, sync, access control, notifications, and reporting into one operating loop. It supported scheduled sheet synchronization, duplicate cleanup, archive logic, Telegram-based confirmations, and role-aware controls for admins, editors, and users. The result was a practical operations platform for teams who needed accountability and fast visibility across many moving parts.'
    },
    ru: {
      'meta.description': 'Премиальный лендинг-кейс для Zipiki, платформы event operations и task orchestration.',
      'page.title': 'Кейс • Zipiki Event Operations Platform',
      'hero.eyebrow': 'Operations platform • team coordination • workflow control',
      'hero.title': 'Zipiki — это платформа event operations, созданная для координации команд, повторяющихся мероприятий и реального исполнения задач.',
      'hero.intro': 'Role-based система для планирования мероприятий и task orchestration, которая объединила NestJS backend, React admin interface, синхронизацию с Google Sheets, Telegram-уведомления, аналитику, архивы и granular access control. Она превращала расписание событий в структурированный execution-flow вместо работы через разрозненные чаты и таблицы.',
      'hero.buttonExplore': 'Посмотреть платформу',
      'hero.factCoverageLabel': 'Ядро платформы',
      'hero.factCoverageValue': 'Role-based task orchestration',
      'hero.factCoverageBody': 'Система строилась вокруг пользователей, прав доступа, task groups, subgroups, подтверждений и admin-контроля.',
      'hero.factReachLabel': 'Автоматизация',
      'hero.factReachValue': 'Google Sheets -> events -> tasks',
      'hero.factReachBody': 'Новые мероприятия импортировались или синхронизировались в структурированные task-flows вместо ручного пересоздания.',
      'hero.factLoopLabel': 'Уведомления',
      'hero.factLoopValue': 'Telegram-доставка + подтверждения',
      'hero.factLoopBody': 'Операционные команды получали не просто статусы, а actionable-уведомления с реальным действием.',
      'visual.title': 'От таблицы до подтверждённого исполнения мероприятия.',
      'visual.body': 'Синхронизация, генерация задач, права доступа, уведомления, аналитика и архивный контроль работали как единый operating loop.',
      'visual.intakeTag': 'SYNC',
      'visual.intakeBody': 'Импорт из Google Sheets и синхронизация повторяющихся мероприятий',
      'visual.deliveryTag': 'TASKS',
      'visual.deliveryBody': 'Автоматическая генерация задач по группам, подгруппам и event-шаблонам',
      'visual.doorTag': 'NOTIFY',
      'visual.doorBody': 'Telegram-доставка, callback-действия и подтверждения для операционных команд',
      'visual.analyticsTag': 'CONTROL',
      'visual.analyticsBody': 'Admin-видимость по аналитике, архивам, пользователям и статусам выполнения',
      'visual.badgeTop': 'Готово к ops-workflows',
      'visual.badgeBottom': 'Sync + permissions + notifications',
      'marquee.operations': 'Task orchestration',
      'marquee.qr': 'Google Sheet sync',
      'marquee.scanning': 'Telegram-уведомления',
      'marquee.analytics': 'Role-based access',
      'marquee.migrations': 'Архивный контроль',
      'marquee.recovery': 'Event-аналитика',
      'capabilities.title': 'Это был не очередной to-do board, а execution-layer для event-команд.',
      'capabilities.body': 'Платформа связывала планирование, sync, permissions, выполнение задач, подтверждения и аналитику в одну операционную поверхность для повторяющейся event-работы.',
      'capabilities.metricOneTitle': 'Ключевые backend-модули',
      'capabilities.metricOneBody': 'Auth, events, tasks, task groups, analytics, import, sync, notifications и users были вынесены в отдельные модули.',
      'capabilities.metricTwoTitle': 'Минутный цикл синхронизации',
      'capabilities.metricTwoBody': 'Планировщик мог перечитывать опубликованную таблицу каждые пять минут и сверять состояние мероприятий.',
      'capabilities.metricThreeTitle': 'Пропускная способность Telegram-очереди',
      'capabilities.metricThreeBody': 'Доставка уведомлений шла через очередь и rate-limit, а не через хаотичную массовую отправку.',
      'capabilities.metricFourTitle': 'Состояния задач в workflow',
      'capabilities.metricFourBody': 'Процесс фиксировал not done, done и confirmed для реальной ответственности внутри команд.',
      'difference.title': 'Большинство task-инструментов заканчиваются на списках. Zipiki связал event-расписание, права доступа, уведомления и исполнение в одну систему.',
      'difference.body': 'За счёт этого платформа была полезна в реальных операциях: команды видели только своё, админы контролировали доступ, а повторяющаяся event-работа проходила через понятный workflow, а не через неформальную координацию.',
      'difference.cardOneTitle': 'Повторяющиеся event-операции вместо generic-задач',
      'difference.cardOneBody': 'Мероприятия несли в себе локацию, организацию, архивный статус и автоматически созданные task-checklists.',
      'difference.cardTwoTitle': 'Гранулярный доступ по subgroup',
      'difference.cardTwoBody': 'Права можно было назначать на уровне подгрупп, чтобы пользователи видели и редактировали только свою зону ответственности.',
      'difference.cardThreeTitle': 'Telegram-уведомления с action-flow',
      'difference.cardThreeBody': 'Бот не просто рассылал сообщения, а поддерживал привязку аккаунта, callbacks и подтверждения действий.',
      'difference.cardFourTitle': 'Живая синхронизация и архивная логика',
      'difference.cardFourBody': 'Система обрабатывала плановую синхронизацию таблицы, очистку дублей и архивирование мероприятий при изменении источника.',
      'architecture.title': 'Продукт работал как control-layer для исполнения повторяющихся мероприятий.',
      'architecture.body': 'Данные из опубликованной таблицы синхронизировались в события. Для новых мероприятий автоматически создавались задачи по видимым subgroup. Пользователи выполняли и подтверждали работу через role-aware доступ. Admin-flows закрывали аналитику, архив, users management и bot settings. Telegram-уведомления замыкали цикл, доставляя реальный операционный сигнал в команду.',
      'architecture.stepOneTitle': 'Синхронизация таблицы',
      'architecture.stepOneBody': 'Опубликованные данные Google Sheets парсились, валидировались и регулярно сверялись с текущими событиями.',
      'architecture.stepTwoTitle': 'Создание мероприятий',
      'architecture.stepTwoBody': 'Новые или обновлённые события создавались с organization, city, club, theme, notes и archive metadata.',
      'architecture.stepThreeTitle': 'Генерация задач',
      'architecture.stepThreeBody': 'Для каждого события автоматически создавались task records по видимым subgroup, чтобы исполнение сразу имело структуру.',
      'architecture.stepFourTitle': 'Уведомления и подтверждения',
      'architecture.stepFourBody': 'Telegram-доставка поддерживала привязку аккаунтов, queue-based sending, callback-действия и confirm-workflows.',
      'architecture.stepFiveTitle': 'Аналитика и admin-control',
      'architecture.stepFiveBody': 'Админы управляли users, task groups, archive, analytics, profile flows и bot-настройками из интерфейса.',
      'resilience.title': 'Сила Zipiki была не в самом факте task CRUD, а в дисциплине вокруг sync, permissions и коммуникации.',
      'resilience.cardOneTitle': 'Очистка дублей и архивная обработка',
      'resilience.cardOneBody': 'Backend умел сверять повторяющиеся события, архивировать исчезнувшие из источника и сохранять смысл ручного архивирования.',
      'resilience.cardTwoTitle': 'Исполнение с учётом прав доступа',
      'resilience.cardTwoBody': 'Access controls были привязаны к subgroup, поэтому система отражала реальную организационную структуру, а не сглаживала её.',
      'resilience.cardThreeTitle': 'Telegram-доставка через очередь',
      'resilience.cardThreeBody': 'Уведомления учитывали rate-limit, умели пережидать ограничения Telegram и очищали привязку, если пользователь блокировал бота.',
      'resilience.cardFourTitle': 'Импорт, экспорт и admin-видимость',
      'resilience.cardFourBody': 'Команды не оказывались заперты в непрозрачном состоянии: события можно было импортировать, экспортировать, ревьюить и отслеживать через admin-поверхности.',
      'stack.backendChipOne': 'NestJS',
      'stack.backendChipTwo': 'Prisma',
      'stack.backendChipThree': 'PostgreSQL',
      'stack.backendChipFour': 'Telegram bot',
      'stack.frontendChipThree': 'Vite + Zustand admin UI',
      'stack.operationsChipOne': 'Синхронизация с Google Sheets',
      'stack.operationsChipTwo': 'Task permissions',
      'stack.operationsChipThree': 'Telegram-уведомления',
      'stack.operationsChipFour': 'Архив и аналитические потоки',
      'summary.cardOneBody': 'Я сделал Zipiki как role-based платформу для event operations и task orchestration, чтобы координировать повторяющиеся мероприятия, команды и execution-workflows. Система объединила NestJS/Prisma backend, React admin interface, синхронизацию с Google Sheets, Telegram-уведомления, аналитику, архивы и users management. Она превращала event-расписание в структурированные task-flows с правами доступа, подтверждениями и admin-видимостью вместо работы через разрозненные чаты и таблицы.',
      'summary.cardTwoBody': 'Сильная сторона проекта была не просто в task management. Zipiki связывал планирование, sync, access control, уведомления и отчётность в один operating loop. Он поддерживал плановую синхронизацию таблиц, очистку дублей, archive-логику, Telegram-based confirmations и role-aware control для admins, editors и users. В итоге получилась практичная operations-платформа для команд, которым нужна ответственность и быстрая видимость по большому числу движущихся частей.'
    }
  }
};

const projectMetrics = {
  qrbot: [
    { target: 75, suffix: '+' },
    { target: 22, suffix: '' },
    { target: 6, suffix: '' },
    { target: 1, suffix: '' },
  ],
  zipiki: [
    { target: 9, suffix: '' },
    { target: 5, suffix: '' },
    { target: 20, suffix: '' },
    { target: 3, suffix: '' },
  ],
};

const revealElements = document.querySelectorAll('.reveal');
const metricElements = Array.from(document.querySelectorAll('.metric-number'));
const copyButtons = document.querySelectorAll('[data-copy-target]');
const languageButtons = document.querySelectorAll('[data-lang-trigger]');
const projectButtons = document.querySelectorAll('[data-project-trigger]');
const translatableElements = document.querySelectorAll('[data-i18n]');
const orbitalShell = document.querySelector('.orbital-shell');
const currentYear = document.getElementById('current-year');
const pageDescription = document.getElementById('page-description');
const siteNav = document.getElementById('site-nav');
const marqueeBand = document.getElementById('marquee-band');
const supportedLanguages = new Set(Object.keys(baseTranslations));
const supportedProjects = new Set(Object.keys(projectMetrics));

let currentLanguage = resolveInitialLanguage();
let currentProject = resolveInitialProject();
let metricsHaveAnimated = false;

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

applyTranslations();

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.18,
  rootMargin: '0px 0px -6% 0px'
});

revealElements.forEach((element) => revealObserver.observe(element));

function resolveInitialLanguage() {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (supportedLanguages.has(queryLanguage)) {
    return queryLanguage;
  }

  try {
    const storedLanguage = window.localStorage.getItem('caseStudyLanguage');
    if (supportedLanguages.has(storedLanguage)) {
      return storedLanguage;
    }
  } catch (error) {
    // Ignore storage access issues and fall back to navigator language.
  }

  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function resolveInitialProject() {
  const queryProject = new URLSearchParams(window.location.search).get('project');
  if (supportedProjects.has(queryProject)) {
    return queryProject;
  }

  try {
    const storedProject = window.localStorage.getItem('caseStudyProject');
    if (supportedProjects.has(storedProject)) {
      return storedProject;
    }
  } catch (error) {
    // Ignore storage access issues and fall back to default project.
  }

  return document.body.dataset.project && supportedProjects.has(document.body.dataset.project)
    ? document.body.dataset.project
    : 'qrbot';
}

function t(key) {
  const projectTable = projectOverrides[currentProject]?.[currentLanguage] || {};
  const languageTable = baseTranslations[currentLanguage] || baseTranslations.en;
  return projectTable[key] || languageTable[key] || baseTranslations.en[key] || key;
}

function syncLanguageButtons() {
  languageButtons.forEach((button) => {
    const isActive = button.dataset.langTrigger === currentLanguage;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function syncProjectButtons() {
  projectButtons.forEach((button) => {
    const isActive = button.dataset.projectTrigger === currentProject;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  document.body.dataset.language = currentLanguage;
  document.body.dataset.project = currentProject;
  document.title = t('page.title');

  if (pageDescription) {
    pageDescription.setAttribute('content', t('meta.description'));
  }

  if (siteNav) {
    siteNav.setAttribute('aria-label', t('nav.sectionsAria'));
  }

  if (marqueeBand) {
    marqueeBand.setAttribute('aria-label', t('marquee.aria'));
  }

  translatableElements.forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });

  syncLanguageButtons();
  syncProjectButtons();
  applyProjectMetrics(metricsHaveAnimated);
}

function persistState() {
  try {
    window.localStorage.setItem('caseStudyLanguage', currentLanguage);
    window.localStorage.setItem('caseStudyProject', currentProject);
  } catch (error) {
    // Ignore storage access issues for file-based previews.
  }

  const url = new URL(window.location.href);
  url.searchParams.set('lang', currentLanguage);
  url.searchParams.set('project', currentProject);
  window.history.replaceState({}, '', url);
}

function animateMetric(element) {
  const target = Number(element.dataset.target || '0');
  const suffix = element.dataset.suffix || '';
  const duration = 1500;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function applyProjectMetrics(animateImmediately) {
  const metrics = projectMetrics[currentProject] || projectMetrics.qrbot;

  metricElements.forEach((element, index) => {
    const config = metrics[index];
    if (!config) {
      return;
    }

    element.dataset.target = String(config.target);
    element.dataset.suffix = config.suffix || '';

    if (animateImmediately) {
      animateMetric(element);
    } else {
      element.textContent = '0';
    }
  });
}

const metricObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    metricsHaveAnimated = true;
    animateMetric(entry.target);
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.6
});

metricElements.forEach((element) => metricObserver.observe(element));

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', 'readonly');
  helper.style.position = 'absolute';
  helper.style.left = '-9999px';
  document.body.appendChild(helper);
  helper.select();
  document.execCommand('copy');
  document.body.removeChild(helper);
}

copyButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const targetId = button.dataset.copyTarget;
    const source = targetId ? document.getElementById(targetId) : null;

    if (!source) {
      return;
    }

    try {
      await copyText(source.textContent.trim());
      button.textContent = t('common.copied');
    } catch (error) {
      button.textContent = t('common.selectManually');
    }

    window.setTimeout(() => {
      button.textContent = t('common.copy');
    }, 1400);
  });
});

languageButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextLanguage = button.dataset.langTrigger;

    if (!supportedLanguages.has(nextLanguage) || nextLanguage === currentLanguage) {
      return;
    }

    currentLanguage = nextLanguage;
    persistState();
    applyTranslations();
  });
});

projectButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextProject = button.dataset.projectTrigger;

    if (!supportedProjects.has(nextProject) || nextProject === currentProject) {
      return;
    }

    currentProject = nextProject;
    persistState();
    applyTranslations();
  });
});

if (orbitalShell) {
  orbitalShell.addEventListener('pointermove', (event) => {
    const rect = orbitalShell.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateY = relativeX * 10;
    const rotateX = relativeY * -10;
    orbitalShell.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  });

  orbitalShell.addEventListener('pointerleave', () => {
    orbitalShell.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}
