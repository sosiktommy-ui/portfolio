(function () {
  const COLORS = {
    blue: "#0A84FF",
    green: "#30D158",
    orange: "#FF9500",
    red: "#FF453A",
    purple: "#A78BFA",
    cyan: "#22D3EE",
    muted: "#636366",
    border: "#2A2A2E",
    grid: "rgba(255,255,255,0.06)",
    textSecondary: "#8E8E93",
  };

  const STORAGE_KEYS = {
    seed: "portfolioMockSeed",
    mask: "portfolioMockMask",
    tools: "portfolioMockToolsHidden",
  };

  const EVENT_POOL = [
    { title: "Neon Pulse", city: "Berlin", country: "DE", flag: "DE", date: "18.04", basePrice: 26 },
    { title: "Spring Session", city: "Vienna", country: "AT", flag: "AT", date: "21.04", basePrice: 24 },
    { title: "After Midnight", city: "Prague", country: "CZ", flag: "CZ", date: "25.04", basePrice: 18 },
    { title: "Night Shift", city: "Rotterdam", country: "NL", flag: "NL", date: "27.04", basePrice: 21 },
    { title: "Electric Bloom", city: "Amsterdam", country: "NL", flag: "NL", date: "02.05", basePrice: 23 },
    { title: "Velocity Club", city: "Sofia", country: "BG", flag: "BG", date: "09.05", basePrice: 17 },
    { title: "Blue District", city: "Warsaw", country: "PL", flag: "PL", date: "15.05", basePrice: 19 },
  ];

  const BUYER_ALIASES = Array.from({ length: 34 }, function (_, index) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const base = alphabet[index % alphabet.length];
    const suffix = index >= alphabet.length ? String(index - alphabet.length + 1) : "";
    return "Client " + base + suffix;
  });

  const PROMO_CODES = ["SPRING10", "CITYPASS", "VIPUP", "FRIENDS", "NIGHT15"];
  const TICKET_TYPES = ["Standard", "VIP", "Premium", "Guest"];
  const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  function safeStorageGet(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      return;
    }
  }

  function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
      state += 0x6d2b79f5;
      let value = Math.imul(state ^ (state >>> 15), 1 | state);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randInt(random, min, max) {
    return Math.floor(random() * (max - min + 1)) + min;
  }

  function sample(random, list) {
    return list[randInt(random, 0, list.length - 1)];
  }

  function weighted(random, items) {
    const totalWeight = items.reduce(function (sum, item) { return sum + item.weight; }, 0);
    let cursor = random() * totalWeight;
    for (let index = 0; index < items.length; index += 1) {
      cursor -= items[index].weight;
      if (cursor <= 0) {
        return items[index].value;
      }
    }
    return items[items.length - 1].value;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + " EUR";
  }

  function formatPercent(value) {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value) + "%";
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return day + "." + month + " " + hours + ":" + minutes;
  }

  function seedValue() {
    const saved = Number(safeStorageGet(STORAGE_KEYS.seed, "0"));
    if (saved) {
      return saved;
    }
    const seed = Date.now() % 1000000000;
    safeStorageSet(STORAGE_KEYS.seed, String(seed));
    return seed;
  }

  function applyGlobalState() {
    if (safeStorageGet(STORAGE_KEYS.mask, "0") === "1") {
      document.body.classList.add("mask-sensitive");
    }
    if (safeStorageGet(STORAGE_KEYS.tools, "0") === "1") {
      document.body.classList.add("tools-hidden");
    }
  }

  function setMaskState(enabled) {
    document.body.classList.toggle("mask-sensitive", enabled);
    safeStorageSet(STORAGE_KEYS.mask, enabled ? "1" : "0");
    updateToolLabels();
  }

  function setToolsHidden(enabled) {
    document.body.classList.toggle("tools-hidden", enabled);
    safeStorageSet(STORAGE_KEYS.tools, enabled ? "1" : "0");
    updateToolLabels();
  }

  function updateToolLabels() {
    const maskButton = document.getElementById("toggle-mask");
    const toolsButton = document.getElementById("toggle-tools");
    if (maskButton) {
      maskButton.textContent = document.body.classList.contains("mask-sensitive")
        ? "Показать поля"
        : "Маскировать поля";
    }
    if (toolsButton) {
      toolsButton.textContent = document.body.classList.contains("tools-hidden")
        ? "Показать панель"
        : "Скрыть панель";
    }
  }

  function countryFlag(flag) {
    const map = {
      PL: "🇵🇱",
      NL: "🇳🇱",
      DE: "🇩🇪",
      BG: "🇧🇬",
      AT: "🇦🇹",
      CZ: "🇨🇿",
    };
    return map[flag] || "🌍";
  }

  function buildDataset(seed) {
    const random = mulberry32(seed);
    const tickets = [];
    const startDate = new Date(2026, 3, 1, 8, 15);

    for (let index = 0; index < 184; index += 1) {
      const event = sample(random, EVENT_POOL);
      const buyer = sample(random, BUYER_ALIASES);
      const quantity = weighted(random, [
        { value: 1, weight: 58 },
        { value: 2, weight: 26 },
        { value: 3, weight: 11 },
        { value: 4, weight: 5 },
      ]);
      const type = weighted(random, [
        { value: "Standard", weight: 58 },
        { value: "VIP", weight: 18 },
        { value: "Premium", weight: 15 },
        { value: "Guest", weight: 9 },
      ]);
      const status = weighted(random, [
        { value: "valid", weight: 51 },
        { value: "used", weight: 42 },
        { value: "cancelled", weight: 7 },
      ]);

      const createdAt = new Date(startDate.getTime());
      createdAt.setDate(createdAt.getDate() + randInt(random, 0, 33));
      createdAt.setHours(randInt(random, 9, 23), randInt(random, 0, 59), 0, 0);

      const buyerEmail = buyer.toLowerCase().replace(/\s+/g, ".") + "@demo.local";
      const buyerPhone = "+48 5" + randInt(random, 10, 99) + " " + randInt(random, 100, 999) + " " + randInt(random, 100, 999);
      const orderId = "DMO-" + String(seed).slice(-4) + "-" + String(index + 1).padStart(4, "0");
      const qrToken = "qr_" + Math.floor(random() * 0xffffff).toString(16).padStart(6, "0") + Math.floor(random() * 0xffffff).toString(16).padStart(6, "0");
      const originalUnitPrice = type === "Guest" ? 0 : event.basePrice + (type === "VIP" ? 16 : type === "Premium" ? 9 : 0);
      const promo = random() < 0.21 && originalUnitPrice > 0 ? sample(random, PROMO_CODES) : "";
      const discountPerPerson = promo ? randInt(random, 2, 7) : 0;
      const unitPrice = Math.max(0, originalUnitPrice - discountPerPerson);
      const price = unitPrice * quantity;
      const originalPrice = originalUnitPrice * quantity;

      tickets.push({
        id: index + 1,
        buyer: buyer,
        buyerEmail: buyerEmail,
        buyerPhone: buyerPhone,
        orderId: orderId,
        qrToken: qrToken,
        eventTitle: event.title,
        city: event.city,
        country: event.country,
        flag: event.flag,
        eventDate: event.date,
        quantity: quantity,
        type: type,
        promo: promo,
        price: price,
        originalPrice: originalPrice,
        status: status,
        createdAt: createdAt,
      });
    }

    tickets.sort(function (left, right) {
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    const totals = tickets.reduce(function (accumulator, ticket) {
      accumulator.totalQR += 1;
      accumulator.totalPeople += ticket.quantity;
      accumulator.revenue += ticket.price;
      accumulator.valid += ticket.status === "valid" ? 1 : 0;
      accumulator.used += ticket.status === "used" ? 1 : 0;
      accumulator.cancelled += ticket.status === "cancelled" ? 1 : 0;
      accumulator.withPromo += ticket.promo ? 1 : 0;
      accumulator.discountTotal += Math.max(0, ticket.originalPrice - ticket.price);
      accumulator.maxCheck = Math.max(accumulator.maxCheck, ticket.price);
      accumulator.free += ticket.price === 0 ? 1 : 0;
      return accumulator;
    }, {
      totalQR: 0,
      totalPeople: 0,
      revenue: 0,
      valid: 0,
      used: 0,
      cancelled: 0,
      withPromo: 0,
      discountTotal: 0,
      maxCheck: 0,
      free: 0,
    });

    const uniqueBuyers = new Set(tickets.map(function (ticket) { return ticket.buyerEmail; })).size;
    const avgCheck = Math.round(totals.revenue / Math.max(1, tickets.filter(function (ticket) { return ticket.price > 0; }).length));
    const enteredPeople = tickets.filter(function (ticket) { return ticket.status === "used"; }).reduce(function (sum, ticket) {
      return sum + ticket.quantity;
    }, 0);
    const repeatGroups = Object.values(tickets.reduce(function (map, ticket) {
      map[ticket.buyerEmail] = (map[ticket.buyerEmail] || 0) + 1;
      return map;
    }, {})).filter(function (count) { return count > 1; }).length;

    const todayDate = "03.05";
    const todayTickets = tickets.filter(function (ticket) {
      return ticket.eventDate === todayDate || (ticket.createdAt.getDate() === 3 && ticket.createdAt.getMonth() === 4);
    }).slice(0, 18);
    const todayRevenue = todayTickets.reduce(function (sum, ticket) { return sum + ticket.price; }, 0);

    const cityStatsMap = {};
    const eventStatsMap = {};
    const countryStatsMap = {};
    const typeMap = {};
    const buyerMap = {};
    const heatmap = WEEKDAYS.map(function (day) {
      return { day: day, values: Array.from({ length: 12 }, function () { return 0; }) };
    });

    tickets.forEach(function (ticket) {
      if (!cityStatsMap[ticket.city]) {
        cityStatsMap[ticket.city] = { label: ticket.city, value: 0, revenue: 0, flag: ticket.flag };
      }
      cityStatsMap[ticket.city].value += ticket.quantity;
      cityStatsMap[ticket.city].revenue += ticket.price;

      if (!eventStatsMap[ticket.eventTitle]) {
        eventStatsMap[ticket.eventTitle] = { label: ticket.eventTitle, value: 0, revenue: 0, city: ticket.city };
      }
      eventStatsMap[ticket.eventTitle].value += ticket.quantity;
      eventStatsMap[ticket.eventTitle].revenue += ticket.price;

      if (!countryStatsMap[ticket.country]) {
        countryStatsMap[ticket.country] = { label: ticket.country, value: 0, revenue: 0, flag: ticket.flag };
      }
      countryStatsMap[ticket.country].value += ticket.quantity;
      countryStatsMap[ticket.country].revenue += ticket.price;

      typeMap[ticket.type] = (typeMap[ticket.type] || 0) + 1;
      buyerMap[ticket.buyer] = (buyerMap[ticket.buyer] || 0) + ticket.quantity;

      const weekdayIndex = (ticket.createdAt.getDay() + 6) % 7;
      const slot = Math.min(11, Math.floor(ticket.createdAt.getHours() / 2));
      heatmap[weekdayIndex].values[slot] += ticket.quantity;
    });

    const cityStats = Object.values(cityStatsMap).sort(function (left, right) {
      return right.revenue - left.revenue;
    });
    const eventStats = Object.values(eventStatsMap).sort(function (left, right) {
      return right.revenue - left.revenue;
    });
    const countryStats = Object.values(countryStatsMap).sort(function (left, right) {
      return right.value - left.value;
    });
    const donutStats = Object.keys(typeMap).map(function (label, index) {
      const palette = [COLORS.blue, COLORS.cyan, COLORS.orange, COLORS.purple, COLORS.green];
      return {
        label: label,
        value: typeMap[label],
        color: palette[index % palette.length],
      };
    });
    const topBuyers = Object.keys(buyerMap).map(function (label) {
      return { label: label, value: buyerMap[label] };
    }).sort(function (left, right) {
      return right.value - left.value;
    }).slice(0, 6);

    const timeline = [];
    const statusTimeline = [];
    const timelineStart = new Date(2026, 3, 20);
    for (let offset = 0; offset < 14; offset += 1) {
      const day = new Date(timelineStart.getTime());
      day.setDate(day.getDate() + offset);
      const dayTickets = tickets.filter(function (ticket) {
        return ticket.createdAt.getDate() === day.getDate() && ticket.createdAt.getMonth() === day.getMonth();
      });
      timeline.push({
        label: String(day.getDate()).padStart(2, "0") + "." + String(day.getMonth() + 1).padStart(2, "0"),
        tickets: dayTickets.length,
        people: dayTickets.reduce(function (sum, ticket) { return sum + ticket.quantity; }, 0),
        revenue: dayTickets.reduce(function (sum, ticket) { return sum + ticket.price; }, 0),
      });
      statusTimeline.push({
        label: String(day.getDate()).padStart(2, "0") + "." + String(day.getMonth() + 1).padStart(2, "0"),
        valid: dayTickets.filter(function (ticket) { return ticket.status === "valid"; }).length,
        used: dayTickets.filter(function (ticket) { return ticket.status === "used"; }).length,
        cancelled: dayTickets.filter(function (ticket) { return ticket.status === "cancelled"; }).length,
      });
    }

    const peakHourMap = tickets.reduce(function (map, ticket) {
      const hour = ticket.createdAt.getHours();
      map[hour] = (map[hour] || 0) + ticket.quantity;
      return map;
    }, {});
    const peakHour = Object.keys(peakHourMap).sort(function (left, right) {
      return peakHourMap[right] - peakHourMap[left];
    })[0];

    return {
      seed: seed,
      tickets: tickets,
      summary: {
        totalQR: totals.totalQR,
        totalPeople: totals.totalPeople,
        valid: totals.valid,
        used: totals.used,
        cancelled: totals.cancelled,
        revenue: totals.revenue,
        uniqueBuyers: uniqueBuyers,
        avgCheck: avgCheck,
        withPromo: totals.withPromo,
        free: totals.free,
        maxCheck: totals.maxCheck,
        discountTotal: totals.discountTotal,
        enteredPeople: enteredPeople,
        todayCount: todayTickets.length,
        todayRevenue: todayRevenue,
        repeatBuyers: repeatGroups,
        conversion: (enteredPeople / Math.max(1, totals.totalPeople)) * 100,
        topCity: cityStats[0],
        topEvent: eventStats[0],
        peakHour: peakHour,
      },
      countryStats: countryStats,
      cityStats: cityStats,
      eventStats: eventStats,
      donutStats: donutStats,
      topBuyers: topBuyers,
      timeline: timeline,
      statusTimeline: statusTimeline,
      heatmap: heatmap,
      recentTickets: tickets.slice(0, 10),
      todayTickets: todayTickets,
    };
  }

  function createKpiCard(card) {
    const element = document.createElement("article");
    element.className = "kpi-card";
    element.innerHTML = "" +
      '<div class="kpi-head">' +
        '<div class="kpi-icon" style="background:' + card.iconBackground + ';color:' + card.iconColor + '">' + card.icon + '</div>' +
        (card.delta ? '<span class="delta-pill">' + card.delta + '</span>' : '') +
      '</div>' +
      '<p class="kpi-label">' + card.label + '</p>' +
      '<p class="kpi-value" data-mask="' + (card.mask ? 'sensitive' : '') + '">' + card.value + '</p>' +
      (card.subValue ? '<p class="kpi-subvalue">' + card.subValue + '</p>' : '');
    return element;
  }

  function createSummaryPanel(panel) {
    const element = document.createElement("article");
    element.className = "panel";
    element.innerHTML = '<h3 class="panel-title">' + panel.title + '</h3><p class="panel-subtitle">' + panel.subtitle + '</p>';
    const list = document.createElement("div");
    list.className = "summary-list";
    panel.rows.forEach(function (row) {
      const item = document.createElement("div");
      item.className = "summary-row";
      item.innerHTML = '<span>' + row.label + '</span><strong>' + row.value + '</strong>';
      list.appendChild(item);
    });
    element.appendChild(list);
    return element;
  }

  function createRecentRow(ticket) {
    return '<tr>' +
      '<td><div><strong data-mask="sensitive">' + ticket.buyer + '</strong><div class="micro" data-mask="sensitive">' + ticket.buyerEmail + '</div></div></td>' +
      '<td><div><strong>' + ticket.eventTitle + '</strong><div class="micro">' + ticket.city + ' • ' + ticket.eventDate + '</div></div></td>' +
      '<td class="muted">' + formatDate(ticket.createdAt) + '</td>' +
      '<td><strong>' + formatMoney(ticket.price) + '</strong><div class="micro">' + ticket.quantity + ' чел.</div></td>' +
      '<td>' + statusBadge(ticket.status) + '</td>' +
      '<td class="micro" data-mask="sensitive">' + ticket.orderId + '</td>' +
    '</tr>';
  }

  function statusBadge(status) {
    const map = {
      valid: { label: "Действителен", className: "valid" },
      used: { label: "Использован", className: "used" },
      cancelled: { label: "Отменён", className: "cancelled" },
    };
    const item = map[status];
    return '<span class="status-pill ' + item.className + '">' + item.label + '</span>';
  }

  function chartSvg(values, options) {
    const width = options.width || 760;
    const height = options.height || 240;
    const padding = 24;
    const max = Math.max.apply(null, values.map(function (item) { return item.value; })) || 1;
    const stepX = (width - padding * 2) / Math.max(1, values.length - 1);
    const points = values.map(function (item, index) {
      const x = padding + index * stepX;
      const y = height - padding - ((item.value / max) * (height - padding * 2));
      return { x: x, y: y, label: item.label, value: item.value };
    });
    const line = points.map(function (point) { return point.x + ',' + point.y; }).join(' ');
    const area = 'M ' + padding + ' ' + (height - padding) + ' L ' + points.map(function (point) { return point.x + ' ' + point.y; }).join(' L ') + ' L ' + points[points.length - 1].x + ' ' + (height - padding) + ' Z';
    const grids = [0.25, 0.5, 0.75].map(function (ratio) {
      const y = padding + ratio * (height - padding * 2);
      return '<line x1="' + padding + '" y1="' + y + '" x2="' + (width - padding) + '" y2="' + y + '" stroke="' + COLORS.grid + '" stroke-width="1" />';
    }).join('');
    const labels = points.filter(function (_point, index) { return index % 2 === 0 || index === points.length - 1; }).map(function (point) {
      return '<text class="axis-label" x="' + point.x + '" y="' + (height - 6) + '" text-anchor="middle">' + point.label + '</text>';
    }).join('');
    return '<svg class="svg-chart" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      grids +
      '<path d="' + area + '" fill="' + options.fill + '" />' +
      '<polyline points="' + line + '" fill="none" stroke="' + options.stroke + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />' +
      points.map(function (point) {
        return '<circle cx="' + point.x + '" cy="' + point.y + '" r="4.5" fill="' + options.stroke + '" stroke="#101014" stroke-width="2" />';
      }).join('') +
      labels +
    '</svg>';
  }

  function barSvg(values, options) {
    const width = options.width || 760;
    const height = options.height || 240;
    const padding = 26;
    const barGap = 14;
    const max = Math.max.apply(null, values.map(function (item) { return item.value; })) || 1;
    const barWidth = (width - padding * 2 - barGap * (values.length - 1)) / values.length;
    const bars = values.map(function (item, index) {
      const x = padding + index * (barWidth + barGap);
      const barHeight = (item.value / max) * (height - padding * 2);
      const y = height - padding - barHeight;
      return '' +
        '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barHeight + '" rx="10" fill="' + item.color + '" fill-opacity="0.92" />' +
        '<text class="axis-label" x="' + (x + barWidth / 2) + '" y="' + (height - 6) + '" text-anchor="middle">' + item.label + '</text>';
    }).join('');
    return '<svg class="svg-chart" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      '<line x1="' + padding + '" y1="' + (height - padding) + '" x2="' + (width - padding) + '" y2="' + (height - padding) + '" stroke="' + COLORS.grid + '" stroke-width="1" />' +
      bars +
    '</svg>';
  }

  function stackedBarSvg(values) {
    const width = 760;
    const height = 240;
    const padding = 28;
    const barGap = 18;
    const barWidth = (width - padding * 2 - barGap * (values.length - 1)) / values.length;
    const max = Math.max.apply(null, values.map(function (item) { return item.valid + item.used + item.cancelled; })) || 1;
    return '<svg class="svg-chart" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none">' +
      values.map(function (item, index) {
        const totalHeight = height - padding * 2;
        const x = padding + index * (barWidth + barGap);
        const validHeight = (item.valid / max) * totalHeight;
        const usedHeight = (item.used / max) * totalHeight;
        const cancelledHeight = (item.cancelled / max) * totalHeight;
        const startY = height - padding;
        return '' +
          '<rect x="' + x + '" y="' + (startY - validHeight) + '" width="' + barWidth + '" height="' + validHeight + '" rx="8" fill="' + COLORS.green + '" />' +
          '<rect x="' + x + '" y="' + (startY - validHeight - usedHeight) + '" width="' + barWidth + '" height="' + usedHeight + '" fill="' + COLORS.orange + '" />' +
          '<rect x="' + x + '" y="' + (startY - validHeight - usedHeight - cancelledHeight) + '" width="' + barWidth + '" height="' + cancelledHeight + '" fill="' + COLORS.red + '" />' +
          '<text class="axis-label" x="' + (x + barWidth / 2) + '" y="' + (height - 6) + '" text-anchor="middle">' + item.label + '</text>';
      }).join('') +
    '</svg>';
  }

  function donutSvg(values) {
    const total = values.reduce(function (sum, item) { return sum + item.value; }, 0) || 1;
    const radius = 62;
    const circumference = Math.PI * 2 * radius;
    let offset = 0;
    const segments = values.map(function (item) {
      const length = (item.value / total) * circumference;
      const node = '<circle cx="90" cy="90" r="' + radius + '" fill="none" stroke="' + item.color + '" stroke-width="22" stroke-dasharray="' + length + ' ' + (circumference - length) + '" stroke-dashoffset="' + (-offset) + '" stroke-linecap="round" transform="rotate(-90 90 90)" />';
      offset += length;
      return node;
    }).join('');
    return '<svg class="svg-chart" viewBox="0 0 180 180" style="height:220px;max-width:320px;margin:0 auto;display:block">' +
      '<circle cx="90" cy="90" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="22" />' +
      segments +
      '<text x="90" y="84" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="700">' + formatNumber(total) + '</text>' +
      '<text x="90" y="104" text-anchor="middle" fill="#8E8E93" font-size="11">билетов</text>' +
    '</svg>';
  }

  function qrSvg(seed) {
    const random = mulberry32(seed);
    const size = 29;
    const modules = [];
    function dark(x, y) {
      if ((x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21)) {
        const localX = x % 22;
        const localY = y % 22;
        const inFrame = localX === 0 || localX === 6 || localY === 0 || localY === 6;
        const inCore = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;
        return inFrame || inCore;
      }
      return random() > 0.56;
    }
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (dark(x, y)) {
          modules.push('<rect x="' + (x * 8) + '" y="' + (y * 8) + '" width="8" height="8" fill="#111111" />');
        }
      }
    }
    return '<svg class="qr-svg" viewBox="0 0 232 232" xmlns="http://www.w3.org/2000/svg"><rect width="232" height="232" rx="18" fill="#ffffff" />' + modules.join('') + '</svg>';
  }

  function renderOverview(dataset) {
    const subtitle = document.getElementById("page-subtitle");
    subtitle.textContent = formatNumber(dataset.summary.totalQR) + " QR-кодов • " + formatNumber(dataset.summary.totalPeople) + " людей • " + dataset.countryStats.length + " стран";

    const topCards = [
      {
        label: "Всего QR-кодов",
        value: formatNumber(dataset.summary.totalQR),
        icon: "QR",
        iconBackground: "rgba(10,132,255,0.14)",
        iconColor: COLORS.blue,
        delta: "+12.8%",
      },
      {
        label: "Всего людей",
        value: formatNumber(dataset.summary.totalPeople),
        icon: "P",
        iconBackground: "rgba(34,211,238,0.14)",
        iconColor: COLORS.cyan,
        delta: "+8.4%",
      },
      {
        label: "Действительных QR",
        value: formatNumber(dataset.summary.valid),
        icon: "OK",
        iconBackground: "rgba(48,209,88,0.14)",
        iconColor: COLORS.green,
        delta: "+4.1%",
      },
      {
        label: "Использованных QR",
        value: formatNumber(dataset.summary.used),
        icon: "IN",
        iconBackground: "rgba(255,149,0,0.14)",
        iconColor: COLORS.orange,
        delta: "+10.2%",
      },
      {
        label: "Отменённых QR",
        value: formatNumber(dataset.summary.cancelled),
        icon: "X",
        iconBackground: "rgba(255,69,58,0.14)",
        iconColor: COLORS.red,
        delta: "-1.6%",
      },
    ];

    const secondaryCards = [
      {
        label: "Общая выручка",
        value: formatMoney(dataset.summary.revenue),
        icon: "€",
        iconBackground: "rgba(48,209,88,0.14)",
        iconColor: COLORS.green,
        delta: "+14.7%",
      },
      {
        label: "Сегодня",
        value: formatNumber(dataset.summary.todayCount),
        subValue: formatMoney(dataset.summary.todayRevenue),
        icon: "D",
        iconBackground: "rgba(255,149,0,0.14)",
        iconColor: COLORS.orange,
        delta: "+3.9%",
      },
      {
        label: "Уникальных покупателей",
        value: formatNumber(dataset.summary.uniqueBuyers),
        icon: "U",
        iconBackground: "rgba(10,132,255,0.14)",
        iconColor: COLORS.blue,
        delta: "+6.1%",
      },
      {
        label: "Средний чек",
        value: formatMoney(dataset.summary.avgCheck),
        icon: "AVG",
        iconBackground: "rgba(167,139,250,0.14)",
        iconColor: COLORS.purple,
        delta: "+5.3%",
      },
    ];

    const topRow = document.getElementById("overview-kpis-primary");
    const secondRow = document.getElementById("overview-kpis-secondary");
    topCards.forEach(function (card) { topRow.appendChild(createKpiCard(card)); });
    secondaryCards.forEach(function (card) { secondRow.appendChild(createKpiCard(card)); });

    const panels = [
      {
        title: "QR-коды",
        subtitle: "Операционный срез по статусам и проходам",
        rows: [
          { label: "Всего QR", value: formatNumber(dataset.summary.totalQR) },
          { label: "Вошли", value: formatNumber(dataset.summary.used) },
          { label: "Дубликаты", value: formatNumber(Math.max(4, Math.round(dataset.summary.used * 0.06))) },
        ],
      },
      {
        title: "Покупатели",
        subtitle: "Поведение аудитории и повторные заказы",
        rows: [
          { label: "Уникальных", value: formatNumber(dataset.summary.uniqueBuyers) },
          { label: "Повторных", value: formatNumber(dataset.summary.repeatBuyers) },
          { label: "Конверсия", value: formatPercent(dataset.summary.conversion) },
        ],
      },
      {
        title: "Промо и free",
        subtitle: "Распределение промокодов и подарочных входов",
        rows: [
          { label: "С промокодом", value: formatNumber(dataset.summary.withPromo) },
          { label: "Бесплатных", value: formatNumber(dataset.summary.free) },
          { label: "Скидок", value: formatMoney(dataset.summary.discountTotal) },
        ],
      },
      {
        title: "Финансы",
        subtitle: "Ключевые денежные показатели за период",
        rows: [
          { label: "Выручка", value: formatMoney(dataset.summary.revenue) },
          { label: "Макс. чек", value: formatMoney(dataset.summary.maxCheck) },
          { label: "Средний чек", value: formatMoney(dataset.summary.avgCheck) },
        ],
      },
    ];

    const panelGrid = document.getElementById("overview-panels");
    panels.forEach(function (panel) { panelGrid.appendChild(createSummaryPanel(panel)); });

    const countryRoot = document.getElementById("country-breakdown");
    const maxCountry = dataset.countryStats[0].value;
    dataset.countryStats.forEach(function (country) {
      const row = document.createElement("div");
      row.className = "country-row";
      row.innerHTML = '' +
        '<div class="flag-badge">' + countryFlag(country.flag) + '</div>' +
        '<div>' +
          '<div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px"><strong>' + country.label + '</strong><span class="micro">' + formatMoney(country.revenue) + '</span></div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + ((country.value / maxCountry) * 100) + '%"></div></div>' +
        '</div>' +
        '<strong>' + formatNumber(country.value) + '</strong>';
      countryRoot.appendChild(row);
    });

    document.getElementById("recent-tickets-body").innerHTML = dataset.recentTickets.map(createRecentRow).join("");
  }

  function renderAnalytics(dataset) {
    const subtitle = document.getElementById("page-subtitle");
    subtitle.textContent = formatNumber(dataset.summary.totalQR) + " QR-кодов • 6 безопасных графиков";

    const cards = [
      { label: "Всего QR", value: formatNumber(dataset.summary.totalQR), icon: "QR", iconBackground: "rgba(10,132,255,0.14)", iconColor: COLORS.blue, delta: "+11.2%" },
      { label: "Всего людей", value: formatNumber(dataset.summary.totalPeople), icon: "P", iconBackground: "rgba(34,211,238,0.14)", iconColor: COLORS.cyan, delta: "+9.7%" },
      { label: "Выручка", value: formatMoney(dataset.summary.revenue), icon: "€", iconBackground: "rgba(48,209,88,0.14)", iconColor: COLORS.green, delta: "+14.1%" },
      { label: "Средний чек", value: formatMoney(dataset.summary.avgCheck), icon: "AVG", iconBackground: "rgba(167,139,250,0.14)", iconColor: COLORS.purple, delta: "+5.0%" },
      { label: "Конверсия", value: formatPercent(dataset.summary.conversion), icon: "%", iconBackground: "rgba(255,149,0,0.14)", iconColor: COLORS.orange, delta: "+2.6%" },
      { label: "Топ-город", value: dataset.summary.topCity.label, icon: "C", iconBackground: "rgba(10,132,255,0.14)", iconColor: COLORS.blue, subValue: formatMoney(dataset.summary.topCity.revenue) },
      { label: "Топ-ивент", value: dataset.summary.topEvent.label, icon: "E", iconBackground: "rgba(48,209,88,0.14)", iconColor: COLORS.green, subValue: dataset.summary.topEvent.city },
      { label: "Пиковый час", value: String(dataset.summary.peakHour).padStart(2, "0") + ":00", icon: "H", iconBackground: "rgba(255,149,0,0.14)", iconColor: COLORS.orange, subValue: "максимум сканов" },
    ];
    const grid = document.getElementById("analytics-kpis");
    cards.forEach(function (card) { grid.appendChild(createKpiCard(card)); });

    const timelineValues = dataset.timeline.map(function (item) {
      return { label: item.label, value: item.revenue };
    });
    const timelineBody = document.getElementById("timeline-chart-body");
    timelineBody.innerHTML = chartSvg(timelineValues, {
      stroke: COLORS.blue,
      fill: "rgba(10, 132, 255, 0.18)",
    });

    const cityValues = dataset.cityStats.slice(0, 6).map(function (item, index) {
      const palette = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple, COLORS.cyan, "#F472B6"];
      return {
        label: item.label,
        value: item.revenue,
        color: palette[index % palette.length],
      };
    });
    document.getElementById("cities-chart-body").innerHTML = barSvg(cityValues, {});

    document.getElementById("status-chart-body").innerHTML = stackedBarSvg(dataset.statusTimeline.slice(-8));
    document.getElementById("donut-chart-body").innerHTML = donutSvg(dataset.donutStats);

    const legend = document.getElementById("donut-legend");
    dataset.donutStats.forEach(function (item) {
      const row = document.createElement("span");
      row.className = "legend-item";
      row.innerHTML = '<span class="legend-dot" style="background:' + item.color + '"></span>' + item.label + ' • ' + formatNumber(item.value);
      legend.appendChild(row);
    });

    const heatmapRoot = document.getElementById("heatmap-body");
    const header = document.createElement("div");
    header.className = "heatmap-header";
    header.appendChild(document.createElement("div"));
    for (let index = 0; index < 12; index += 1) {
      const axis = document.createElement("div");
      axis.className = "heatmap-axis";
      axis.textContent = String(index * 2).padStart(2, "0");
      header.appendChild(axis);
    }
    heatmapRoot.appendChild(header);
    const maxHeat = Math.max.apply(null, dataset.heatmap.flatMap(function (row) { return row.values; })) || 1;
    dataset.heatmap.forEach(function (row) {
      const line = document.createElement("div");
      line.className = "heatmap-row";
      const label = document.createElement("div");
      label.className = "heatmap-label";
      label.textContent = row.day;
      line.appendChild(label);
      row.values.forEach(function (value) {
        const cell = document.createElement("div");
        const opacity = value / maxHeat;
        cell.className = "heat-cell";
        cell.style.background = 'rgba(10,132,255,' + (0.12 + opacity * 0.72) + ')';
        line.appendChild(cell);
      });
      heatmapRoot.appendChild(line);
    });

    const buyersRoot = document.getElementById("buyers-list");
    const maxBuyer = dataset.topBuyers[0].value;
    dataset.topBuyers.forEach(function (buyer) {
      const row = document.createElement("div");
      row.className = "buyer-row";
      row.innerHTML = '' +
        '<div>' +
          '<strong data-mask="sensitive">' + buyer.label + '</strong>' +
          '<div class="bar-track" style="margin-top:10px"><div class="bar-fill" style="width:' + ((buyer.value / maxBuyer) * 100) + '%"></div></div>' +
        '</div>' +
        '<strong>' + formatNumber(buyer.value) + ' чел.</strong>';
      buyersRoot.appendChild(row);
    });
  }

  function renderTickets(dataset) {
    const subtitle = document.getElementById("page-subtitle");
    subtitle.textContent = formatNumber(dataset.summary.totalQR) + " QR-кодов • " + formatNumber(dataset.summary.valid) + " активных • безопасный режим для скринов";

    const statGrid = document.getElementById("ticket-stats");
    [
      { label: "Все билеты", value: formatNumber(dataset.summary.totalQR), icon: "ALL", iconBackground: "rgba(10,132,255,0.14)", iconColor: COLORS.blue, delta: "+12.8%" },
      { label: "Действительные", value: formatNumber(dataset.summary.valid), icon: "OK", iconBackground: "rgba(48,209,88,0.14)", iconColor: COLORS.green, delta: "+4.1%" },
      { label: "Использованные", value: formatNumber(dataset.summary.used), icon: "IN", iconBackground: "rgba(255,149,0,0.14)", iconColor: COLORS.orange, delta: "+6.4%" },
      { label: "Отменённые", value: formatNumber(dataset.summary.cancelled), icon: "X", iconBackground: "rgba(255,69,58,0.14)", iconColor: COLORS.red, delta: "-1.2%" },
    ].forEach(function (card) {
      statGrid.appendChild(createKpiCard(card));
    });

    const rowsRoot = document.getElementById("tickets-table-body");
    dataset.tickets.slice(0, 16).forEach(function (ticket, index) {
      const row = document.createElement("tr");
      row.dataset.ticketId = String(ticket.id);
      row.innerHTML = '' +
        '<td class="micro" data-mask="sensitive">' + ticket.orderId + '</td>' +
        '<td><div><strong data-mask="sensitive">' + ticket.buyer + '</strong><div class="micro" data-mask="sensitive">' + ticket.buyerEmail + '</div></div></td>' +
        '<td><div><strong>' + ticket.eventTitle + '</strong><div class="micro">' + ticket.city + ' • ' + ticket.eventDate + '</div></div></td>' +
        '<td class="muted">' + formatDate(ticket.createdAt) + '</td>' +
        '<td><strong>' + formatMoney(ticket.price) + '</strong><div class="micro">' + ticket.quantity + ' чел.</div></td>' +
        '<td>' + statusBadge(ticket.status) + '</td>';
      if (index === 0) {
        row.classList.add("is-selected");
      }
      row.addEventListener("click", function () {
        Array.from(rowsRoot.querySelectorAll("tr")).forEach(function (item) {
          item.classList.remove("is-selected");
        });
        row.classList.add("is-selected");
        updateTicketDetail(ticket);
      });
      rowsRoot.appendChild(row);
    });

    updateTicketDetail(dataset.tickets[0]);
  }

  function updateTicketDetail(ticket) {
    document.getElementById("detail-status").innerHTML = statusBadge(ticket.status);
    document.getElementById("detail-title").textContent = ticket.eventTitle;
    document.getElementById("detail-caption").textContent = ticket.city + ' • ' + ticket.eventDate + ' • ' + ticket.type;
    document.getElementById("detail-qr").innerHTML = qrSvg(ticket.id * 1127 + 17);
    document.getElementById("detail-fields").innerHTML = '' +
      detailRow("Покупатель", ticket.buyer, true) +
      detailRow("Email", ticket.buyerEmail, true) +
      detailRow("Телефон", ticket.buyerPhone, true) +
      detailRow("Order ID", ticket.orderId, true) +
      detailRow("QR token", ticket.qrToken, true) +
      detailRow("Дата покупки", formatDate(ticket.createdAt), false) +
      detailRow("Цена", formatMoney(ticket.price), false) +
      detailRow("Количество", String(ticket.quantity) + " чел.", false) +
      detailRow("Промокод", ticket.promo || "—", !!ticket.promo);
  }

  function detailRow(label, value, sensitive) {
    return '<div class="detail-row"><span>' + label + '</span><strong data-mask="' + (sensitive ? 'sensitive' : '') + '">' + value + '</strong></div>';
  }

  function wireControls() {
    const reroll = document.getElementById("reroll-data");
    const toggleMask = document.getElementById("toggle-mask");
    const toggleTools = document.getElementById("toggle-tools");
    if (reroll) {
      reroll.addEventListener("click", function () {
        safeStorageSet(STORAGE_KEYS.seed, String(Date.now() % 1000000000));
        window.location.reload();
      });
    }
    if (toggleMask) {
      toggleMask.addEventListener("click", function () {
        setMaskState(!document.body.classList.contains("mask-sensitive"));
      });
    }
    if (toggleTools) {
      toggleTools.addEventListener("click", function () {
        setToolsHidden(!document.body.classList.contains("tools-hidden"));
      });
    }
    updateToolLabels();
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyGlobalState();
    wireControls();
    const dataset = buildDataset(seedValue());
    const page = document.body.dataset.page;
    if (page === "overview") {
      renderOverview(dataset);
    }
    if (page === "analytics") {
      renderAnalytics(dataset);
    }
    if (page === "tickets") {
      renderTickets(dataset);
    }
  });
})();