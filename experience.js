/* =============================================================
   /3D MODE — Immersive scroll experience runtime
   Activetheory-style scroll-driven 3D stage with floating
   project panels, particle bursts, parallax atmospherics.

   Stack: THREE (global, r134) + GSAP (global)
   ============================================================= */
(function () {
  'use strict';

  // -----------------------------------------------------------
  // 0. Project data + scene layout
  // -----------------------------------------------------------
  // Sections in scrollable DOM:
  //   0 → Hero (abstract orbit shapes)
  //   1 → Ticketing      (cluster A)
  //   2 → Task Control   (cluster B)
  //   3 → AI Voice       (waveform cluster C)
  //   4 → Stack          (formation: panels arrange into grid)
  //   5 → Connect        (panels orbit around center)

  var PROJECTS = [
    {
      key: 'ticketing',
      sectionIdx: 1,
      tintHex: 0x8b9eff,   // cool blue
      accentHex: 0xa78bfa,
      images: [
        './assets/screens/ticketing-dashboard.jpg',
        './assets/screens/ticketing-analytics-overview.jpg',
        './assets/screens/ticketing-charts.jpg',
        './assets/screens/ticketing-map.jpg',
        './assets/screens/ticketing-search.jpg',
        './assets/screens/scanner.jpg'
      ]
    },
    {
      key: 'taskcontrol',
      sectionIdx: 2,
      tintHex: 0xb290ff,   // violet
      accentHex: 0xc7a4ff,
      images: [
        './assets/screens/task-control-dashboard.jpg',
        './assets/screens/task-control-events-board.jpg',
        './assets/screens/task-control-tasks.jpg',
        './assets/screens/task-control-events-list.jpg',
        './assets/screens/task-control-users.jpg',
        './assets/screens/task-control-archive.jpg'
      ]
    },
    {
      key: 'aivoice',
      sectionIdx: 3,
      tintHex: 0xf0abfc,   // pink-violet
      accentHex: 0xff9ad9,
      images: []  // procedural only — no screenshots available
    }
  ];

  // distance between section "stops" in 3D world (Y axis)
  var STOP_GAP = 18;
  // total stops = 6 (sections)
  var NUM_STOPS = 6;

  var IS_MOBILE = window.matchMedia('(max-width: 880px), (pointer: coarse)').matches;
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------------------------------------
  // 1. DOM refs
  // -----------------------------------------------------------
  var canvas    = document.getElementById('xp-canvas');
  var boot      = document.getElementById('xp-boot');
  var bootLog   = document.getElementById('xp-boot-log');
  var enterBtn  = document.getElementById('xp-enter');
  var hud       = document.getElementById('xp-hud');
  var sectionTag= document.getElementById('xp-section-tag');
  var muteBtn   = document.getElementById('xp-mute');
  var audio     = document.getElementById('xp-audio');
  var cursorEl  = document.getElementById('xp-cursor');
  var scrollHint= document.getElementById('xp-scroll-hint');
  var rail      = document.getElementById('xp-rail');
  var railItems = rail ? rail.querySelectorAll('.xp-rail-item') : [];
  var sections  = document.querySelectorAll('.xp-sec');

  // -----------------------------------------------------------
  // 2. Boot log
  // -----------------------------------------------------------
  var BOOT_LINES = [
    '> INIT.RENDERER ............. <span class="ok">OK</span>',
    '> LOAD.SHADERS .............. <span class="ok">OK</span>',
    '> COMPILE.MATERIALS ......... <span class="ok">OK</span>',
    '> SAMPLE.TEXTURES [00/12] ... <span class="ok">QUEUED</span>',
    '> CALIBRATE.HUD ............. <span class="ok">OK</span>',
    '> AUDIO.STREAM .............. <span class="warn">STANDBY</span>',
    '> AWAITING.USER ............. <span class="warn">USER_GESTURE</span>',
    '> READY'
  ];
  var bi = 0;
  function typeBoot() {
    if (bi >= BOOT_LINES.length) return;
    bootLog.innerHTML += BOOT_LINES[bi] + '\n';
    bi++;
    setTimeout(typeBoot, 160 + Math.random() * 130);
  }
  typeBoot();

  // -----------------------------------------------------------
  // 3. Three.js core
  // -----------------------------------------------------------
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !IS_MOBILE,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06070d, 0.022);

  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  var sceneRefs = {};

  // -----------------------------------------------------------
  // 4. Background star particles (huge field)
  // -----------------------------------------------------------
  (function buildStars(){
    var N = IS_MOBILE ? 1200 : 2600;
    var positions = new Float32Array(N * 3);
    var sizes     = new Float32Array(N);
    var colors    = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var r  = 60 + Math.random() * 60;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(Math.random() * 2 - 1);
      positions[i*3]   = Math.sin(ph) * Math.cos(th) * r;
      positions[i*3+1] = (Math.random() * 2 - 1) * (NUM_STOPS * STOP_GAP);
      positions[i*3+2] = Math.sin(ph) * Math.sin(th) * r - 30;
      sizes[i] = 0.5 + Math.random() * 1.8;
      var t = Math.random();
      colors[i*3]   = 0.7 + t*0.3;
      colors[i*3+1] = 0.65 + t*0.3;
      colors[i*3+2] = 0.95;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,0,0), 200);

    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime:{value:0}, uPx:{value:renderer.getPixelRatio()} },
      vertexShader: [
        'attribute float aSize;',
        'attribute vec3 aColor;',
        'uniform float uTime; uniform float uPx;',
        'varying vec3 vC; varying float vT;',
        'void main(){',
        ' vC = aColor;',
        ' vec4 mv = modelViewMatrix * vec4(position,1.0);',
        ' gl_Position = projectionMatrix * mv;',
        ' float tw = sin(uTime*0.8 + position.x*0.6 + position.y*0.3)*0.5+0.5;',
        ' vT = tw;',
        ' gl_PointSize = aSize * uPx * (260.0 / -mv.z) * (0.4 + tw*0.6);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vC; varying float vT;',
        'void main(){',
        ' vec2 uv = gl_PointCoord - 0.5;',
        ' float d = length(uv);',
        ' if(d>0.5) discard;',
        ' float a = smoothstep(0.5,0.0,d) * (0.35 + vT*0.55);',
        ' gl_FragColor = vec4(vC, a);',
        '}'
      ].join('\n')
    });
    var pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.userData.isStars = true;
    pts.userData.mat = m;
    scene.add(pts);
    sceneRefs.stars = pts;
  })();

  // -----------------------------------------------------------
  // 5. Texture loader (with async fallback)
  // -----------------------------------------------------------
  var texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';

  function loadTex(url) {
    return new Promise(function (resolve) {
      texLoader.load(
        url,
        function (t) {
          t.minFilter = THREE.LinearFilter;
          t.magFilter = THREE.LinearFilter;
          t.generateMipmaps = false;
          t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
          t.flipY = true;
          if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
          resolve(t);
        },
        undefined,
        function () {
          // graceful fallback: 1x1 gray
          var c = document.createElement('canvas'); c.width = c.height = 4;
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#222';
          ctx.fillRect(0,0,4,4);
          var ft = new THREE.CanvasTexture(c);
          ft.flipY = true;
          resolve(ft);
        }
      );
    });
  }

  // -----------------------------------------------------------
  // 6. Project panel (textured plane with rounded corners
  //    + glow border) shader
  // -----------------------------------------------------------
  function makePanel(texture, w, h, tintColor) {
    var geo = new THREE.PlaneGeometry(w, h, 1, 1);
    var mat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTex:    { value: texture },
        uTint:   { value: new THREE.Color(tintColor) },
        uTime:   { value: 0 },
        uOpacity:{ value: 1.0 },
        uHover:  { value: 0 },
        uAspect: { value: new THREE.Vector2(w, h) },
        uRadius: { value: 0.08 },         // corner radius (in world units)
        uReveal: { value: 0.0 }           // 0..1 reveal swipe
      },
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vP;',
        'void main(){',
        ' vUv = uv;',
        ' vP = position;',
        ' gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'precision highp float;',
        'uniform sampler2D uTex;',
        'uniform vec3 uTint;',
        'uniform float uTime;',
        'uniform float uOpacity;',
        'uniform float uHover;',
        'uniform vec2 uAspect;',
        'uniform float uRadius;',
        'uniform float uReveal;',
        'varying vec2 vUv;',
        'varying vec3 vP;',
        // rounded rect mask in world units (centered at 0)
        'float sdRoundedBox(vec2 p, vec2 b, float r){',
        ' vec2 q = abs(p) - b + r;',
        ' return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;',
        '}',
        'void main(){',
        ' vec2 hb = uAspect * 0.5;',
        ' float d = sdRoundedBox(vP.xy, hb, uRadius);',
        ' float aaw = fwidth(d);',
        ' float maskInside = 1.0 - smoothstep(0.0, aaw*1.5, d);',
        ' if (maskInside <= 0.001) discard;',
        // tex sample — textures use flipY=true so sample uv directly
        ' vec4 t = texture2D(uTex, vUv);',
        ' vec3 col = t.rgb;',
        // mild tint multiply
        ' col = mix(col, col * uTint, 0.20);',
        // hover boost
        ' col = mix(col, col * 1.15, uHover);',
        // bevel edge: distance-from-edge glow
        ' float edge = smoothstep(0.0, -0.08, d);',
        ' float rim  = (1.0 - edge);',
        ' vec3 rimCol = uTint * 1.3;',
        ' col = mix(col, rimCol, rim * 0.55);',
        // scanline pattern
        ' float scan = sin((vP.y) * 80.0 + uTime*1.5) * 0.5 + 0.5;',
        ' col += scan * 0.025;',
        ' float alpha = maskInside * uOpacity;',
        ' gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.userData.panelMat = mat;
    mesh.userData.isPanel = true;
    mesh.renderOrder = 10;
    return mesh;
  }

  // -----------------------------------------------------------
  // 7. Particle burst around a center (per project cluster)
  // -----------------------------------------------------------
  function makeBurst(count, center, color1, color2, spread) {
    var positions = new Float32Array(count * 3);
    var seeds     = new Float32Array(count * 3);
    var rndSize   = new Float32Array(count);
    for (var i = 0; i < count; i++) {
      // radial cluster, biased toward center
      var r  = Math.pow(Math.random(), 0.6) * spread;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(Math.random() * 2 - 1);
      positions[i*3]   = center.x + Math.sin(ph) * Math.cos(th) * r;
      positions[i*3+1] = center.y + Math.sin(ph) * Math.sin(th) * r * 0.7;
      positions[i*3+2] = center.z + Math.cos(ph) * r * 0.8;
      seeds[i*3]   = (Math.random()*2-1);
      seeds[i*3+1] = (Math.random()*2-1);
      seeds[i*3+2] = (Math.random()*2-1);
      rndSize[i] = 0.5 + Math.random() * 1.5;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 3));
    g.setAttribute('aSize',    new THREE.BufferAttribute(rndSize, 1));
    g.boundingSphere = new THREE.Sphere(center.clone(), spread * 2.5);

    var m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime:   { value: 0 },
        uPx:     { value: renderer.getPixelRatio() },
        uColor1: { value: new THREE.Color(color1) },
        uColor2: { value: new THREE.Color(color2) },
        uEnergy: { value: 0 }    // 0..1 — how active this cluster is (driven by scroll)
      },
      vertexShader: [
        'attribute vec3 aSeed;',
        'attribute float aSize;',
        'uniform float uTime; uniform float uPx; uniform float uEnergy;',
        'varying float vT; varying vec3 vS;',
        'void main(){',
        ' vec3 pos = position;',
        ' // breathing motion',
        ' pos.x += sin(uTime*0.6 + aSeed.x*9.0) * 0.18;',
        ' pos.y += cos(uTime*0.5 + aSeed.y*7.0) * 0.20;',
        ' pos.z += sin(uTime*0.7 + aSeed.z*5.0) * 0.18;',
        ' // outward push driven by energy',
        ' pos += aSeed * uEnergy * 2.0;',
        ' vec4 mv = modelViewMatrix * vec4(pos,1.0);',
        ' gl_Position = projectionMatrix * mv;',
        ' vT = aSeed.x*0.5+0.5;',
        ' vS = aSeed;',
        ' float s = aSize * (0.6 + uEnergy*0.8);',
        ' gl_PointSize = s * uPx * (220.0 / -mv.z);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor1;',
        'uniform vec3 uColor2;',
        'uniform float uEnergy;',
        'varying float vT;',
        'varying vec3 vS;',
        'void main(){',
        ' vec2 uv = gl_PointCoord - 0.5;',
        ' float d = length(uv);',
        ' if(d>0.5) discard;',
        ' float a = smoothstep(0.5, 0.0, d);',
        ' vec3 col = mix(uColor1, uColor2, vT);',
        ' col = mix(col*0.7, col*1.4, uEnergy);',
        ' gl_FragColor = vec4(col, a * (0.06 + uEnergy*0.14));',
        '}'
      ].join('\n')
    });

    var pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    pts.userData.burstMat = m;
    pts.renderOrder = -10;
    return pts;
  }

  // -----------------------------------------------------------
  // 8. Hero abstract centerpiece
  //    floating wireframe icosahedron + ring + particle haze
  // -----------------------------------------------------------
  var heroGroup;
  (function buildHero() {
    heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0, 0);

    // wireframe icosahedron
    var icoGeo = new THREE.IcosahedronGeometry(1.6, 1);
    var icoMat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.7
    });
    var ico = new THREE.Mesh(icoGeo, icoMat);
    heroGroup.add(ico);

    // inner solid (very faint)
    var inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.MeshBasicMaterial({ color: 0x1a1d2e, transparent: true, opacity: 0.35 })
    );
    heroGroup.add(inner);

    // halo ring
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(2.8, 2.86, 128),
      new THREE.MeshBasicMaterial({ color: 0xc7a4ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2.2;
    heroGroup.add(ring);

    var ring2 = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 3.62, 128),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    );
    ring2.rotation.x = Math.PI / 2.5;
    heroGroup.add(ring2);

    // particle halo around hero (subtle)
    var burst = makeBurst(IS_MOBILE ? 500 : 1200, new THREE.Vector3(0,0,-2.5), 0xa78bfa, 0xffffff, 4.0);
    burst.userData.burstMat.uniforms.uEnergy.value = 0.5;
    heroGroup.add(burst);

    heroGroup.userData.ico = ico;
    heroGroup.userData.ring = ring;
    heroGroup.userData.ring2 = ring2;
    heroGroup.userData.burst = burst;

    scene.add(heroGroup);
  })();

  // -----------------------------------------------------------
  // 9. Project clusters — placed at section Y positions
  // -----------------------------------------------------------
  // Layout strategy:
  //   sectionIdx 1 (Ticketing):    Y = -STOP_GAP   (we move camera DOWN in -Y as we scroll)
  //   sectionIdx 2 (Task Control): Y = -2*STOP_GAP
  //   sectionIdx 3 (AI Voice):     Y = -3*STOP_GAP
  //   sectionIdx 4 (Stack):        Y = -4*STOP_GAP — formation
  //   sectionIdx 5 (Connect):      Y = -5*STOP_GAP — orbit

  var clusters = [];   // each: { group, panels[], burst, sectionIdx, basis }

  function buildClusterFor(project) {
    var group = new THREE.Group();
    group.position.y = -project.sectionIdx * STOP_GAP;
    group.userData.project = project;

    // Cluster center: on the right side for odd sections, left for even (mirror)
    var mirror = (project.sectionIdx % 2 === 0);
    var clusterX = mirror ? -3.2 : 3.2;
    group.position.x = clusterX;

    // particle burst BEHIND cluster center (small, subtle)
    var burst = makeBurst(
      IS_MOBILE ? 400 : 800,
      new THREE.Vector3(0, 0, -3.5),
      project.tintHex,
      project.accentHex,
      5.2
    );
    group.add(burst);

    // panels arranged in a depth-staggered fan
    var panels = [];
    var imgs = project.images.slice(0, 6);

    var positions = [
      // [x,    y,   z,   rotY,    rotZ,   w,   h ]
      [ 0.0,   0.6,  0.0,   0.00,   0.00,  4.8, 3.0 ],   // hero (front)
      [-2.8,   1.2, -2.4,  -0.30,   0.05,  3.2, 2.0 ],
      [ 2.6,  -0.4, -2.2,   0.32,  -0.04,  3.0, 1.9 ],
      [-2.2,  -1.6, -3.8,  -0.22,   0.03,  2.6, 1.6 ],
      [ 2.0,   1.8, -4.2,   0.28,  -0.05,  2.4, 1.5 ],
      [ 0.2,  -2.0, -5.2,   0.0,    0.02,  2.8, 1.75]
    ];

    // For procedural-only project (AI Voice — no images): build abstract panels with gradient texture
    if (imgs.length === 0) {
      var grad = makeGradientTexture(project.tintHex, project.accentHex);
      for (var i = 0; i < positions.length; i++) {
        var p = positions[i];
        var panel = makePanel(grad, p[5], p[6], project.tintHex);
        panel.position.set(p[0], p[1], p[2]);
        panel.rotation.y = p[3];
        panel.rotation.z = p[4];
        panel.userData.basePos = panel.position.clone();
        panel.userData.baseRot = { x: 0, y: p[3], z: p[4] };
        panel.userData.floatPhase = Math.random() * Math.PI * 2;
        panel.userData.projectKey = project.key;
        panel.userData.imgIdx = i;
        group.add(panel);
        panels.push(panel);

        // add waveform decoration on top of panel
        addWaveformLines(panel, project.tintHex);
      }
      group.userData.panels = panels;
      group.userData.burst = burst;
      scene.add(group);
      clusters.push(group);
      return Promise.resolve();
    }

    var promises = imgs.map(function (src, idx) {
      return loadTex(src).then(function (tex) {
        var p = positions[idx];
        var panel = makePanel(tex, p[5], p[6], project.tintHex);
        panel.position.set(p[0], p[1], p[2]);
        panel.rotation.y = p[3];
        panel.rotation.z = p[4];
        panel.userData.basePos = panel.position.clone();
        panel.userData.baseRot = { x: 0, y: p[3], z: p[4] };
        panel.userData.floatPhase = Math.random() * Math.PI * 2;
        panel.userData.projectKey = project.key;
        panel.userData.imgIdx = idx;
        group.add(panel);
        panels[idx] = panel;
      });
    });

    return Promise.all(promises).then(function () {
      group.userData.panels = panels;
      group.userData.burst = burst;
      scene.add(group);
      clusters.push(group);
    });
  }

  function makeGradientTexture(c1, c2) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 320;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 512, 320);
    var hex = function (h) { return '#' + ('000000' + h.toString(16)).slice(-6); };
    g.addColorStop(0, hex(c1));
    g.addColorStop(0.5, '#1a1d2e');
    g.addColorStop(1, hex(c2));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 320);
    // overlay grid
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < 512; x += 32) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,320); ctx.stroke(); }
    for (var y = 0; y < 320; y += 32) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(512,y); ctx.stroke(); }
    // big "AI VOICE" text
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 40px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AI · VOICE', 256, 160);
    ctx.font = '14px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('[ ACTIVE_LISTENER_v3 ]', 256, 192);

    // waveform
    ctx.strokeStyle = hex(c2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var xx = 0; xx <= 512; xx += 4) {
      var amp = Math.sin(xx * 0.04) * 16 + Math.sin(xx * 0.11) * 8;
      var py = 240 + amp;
      if (xx === 0) ctx.moveTo(xx, py); else ctx.lineTo(xx, py);
    }
    ctx.stroke();

    var t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.flipY = true;
    return t;
  }

  function addWaveformLines(panel, color) {
    // a simple animated bar overlay; purely decorative
    var pos = panel.position;
    var w = panel.userData.panelMat.uniforms.uAspect.value.x;
    var bars = new THREE.Group();
    for (var i = 0; i < 12; i++) {
      var bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.5, 0.02),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.65 })
      );
      bar.position.x = (i - 5.5) * (w * 0.06);
      bar.position.y = -w * 0.18;
      bar.position.z = 0.04;
      bar.userData.phase = i;
      bars.add(bar);
    }
    bars.position.copy(pos);
    bars.rotation.copy(panel.rotation);
    panel.userData.bars = bars;
    panel.parent && panel.parent.add(bars);
  }

  // -----------------------------------------------------------
  // 10. Build all clusters (async)
  // -----------------------------------------------------------
  var clustersReady = Promise.all(PROJECTS.map(buildClusterFor));

  // -----------------------------------------------------------
  // 11. Camera scroll system
  // -----------------------------------------------------------
  var scrollProgress = 0;   // 0..NUM_STOPS-1 (continuous)
  var targetCamY = 0;
  var camY = 0;
  var camX = 0;
  var targetCamX = 0;
  var camZ = 10;
  var targetCamZ = 10;

  function computeScrollProgress() {
    // scroll progress: total scroll = (NUM_STOPS - 1) * vh
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var s = max > 0 ? (window.scrollY / max) : 0;
    s = Math.max(0, Math.min(1, s));
    return s * (NUM_STOPS - 1);
  }

  function updateScrollState() {
    scrollProgress = computeScrollProgress();
    // section index nearest
    var idx = Math.round(scrollProgress);

    // camera y: linear with scroll
    targetCamY = -scrollProgress * STOP_GAP;

    // camera x sway: mirror clusters get +X view (camera shifts opposite)
    var floorIdx = Math.floor(scrollProgress);
    var frac = scrollProgress - floorIdx;

    // base x per section
    var XS = [0, -1.4, 1.4, -1.4, 0, 0];   // mirror of cluster x (cluster x = ±3.2, push camera slightly toward them)
    var xa = XS[floorIdx] || 0;
    var xb = XS[Math.min(floorIdx + 1, NUM_STOPS - 1)] || 0;
    targetCamX = xa + (xb - xa) * frac;

    // camera Z: orbit a bit closer in connect/stack
    var ZS = [11, 10, 10, 10, 14, 11];
    var za = ZS[floorIdx] || 10;
    var zb = ZS[Math.min(floorIdx + 1, NUM_STOPS - 1)] || 10;
    targetCamZ = za + (zb - za) * frac;

    // update HUD tag
    var labels = ['CHAPTER 00 / INTRO', 'CHAPTER 01 / TICKETING', 'CHAPTER 02 / TASK CONTROL', 'CHAPTER 03 / AI VOICE', 'CHAPTER 04 / SYSTEM RANGE', 'CHAPTER 05 / CONNECT'];
    if (sectionTag) sectionTag.textContent = labels[idx] || labels[0];

    // rail active
    for (var i = 0; i < railItems.length; i++) {
      railItems[i].classList.toggle('is-active', i === idx);
    }

    // section reveal (each section observes its own viewport intersection)
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      var r = sec.getBoundingClientRect();
      var midDist = Math.abs((r.top + r.height/2) - window.innerHeight/2);
      if (midDist < window.innerHeight * 0.55) sec.classList.add('is-in');
    }

    // scroll hint fade
    if (scrollHint) {
      if (window.scrollY > 80) scrollHint.classList.add('is-hidden');
      else scrollHint.classList.remove('is-hidden');
    }

    // panel reveal: drive each panel's uReveal uniform from local proximity
    clusters.forEach(function (cl) {
      var d = Math.abs((cl.userData.project.sectionIdx) - scrollProgress);
      // proximity 0 (right on cluster) → 1.0 reveal, 1+ → 0 reveal
      var prox = Math.max(0, 1 - d);
      var reveal = THREE.MathUtils.smoothstep(prox, 0.05, 0.6);
      // also energy for burst
      var energy = THREE.MathUtils.smoothstep(prox, 0.0, 0.8);
      if (cl.userData.panels) {
        cl.userData.panels.forEach(function (p, i) {
          if (!p) return;
          var mat = p.userData.panelMat;
          if (!mat) return;
          // simple opacity fade based on proximity (no wipe)
          mat.uniforms.uOpacity.value = THREE.MathUtils.clamp(prox * 1.6, 0, 1);
        });
      }
      if (cl.userData.burst && cl.userData.burst.userData.burstMat) {
        cl.userData.burst.userData.burstMat.uniforms.uEnergy.value = energy;
      }
    });
  }

  // -----------------------------------------------------------
  // 12. Hero shape fade-in/out as you leave section 0
  // -----------------------------------------------------------
  function updateHeroVisibility() {
    var d = Math.abs(scrollProgress - 0);
    var op = Math.max(0, 1 - d * 0.9);
    heroGroup.userData.ico.material.opacity = 0.7 * op;
    heroGroup.userData.ring.material.opacity = 0.6 * op;
    heroGroup.userData.ring2.material.opacity = 0.15 * op;
    if (heroGroup.userData.burst && heroGroup.userData.burst.userData.burstMat) {
      heroGroup.userData.burst.userData.burstMat.uniforms.uEnergy.value = 0.6 * op;
    }
  }

  // -----------------------------------------------------------
  // 13. Animation loop
  // -----------------------------------------------------------
  var clock = new THREE.Clock();
  var mouseNX = 0, mouseNY = 0;
  window.addEventListener('mousemove', function (e) {
    mouseNX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function tick() {
    var t = clock.getElapsedTime();

    // smooth camera lerp
    camY += (targetCamY - camY) * 0.08;
    camX += (targetCamX - camX) * 0.08;
    camZ += (targetCamZ - camZ) * 0.06;

    // mouse parallax (small)
    camera.position.x = camX + mouseNX * 0.6;
    camera.position.y = camY - mouseNY * 0.4;
    camera.position.z = camZ;
    camera.lookAt(0, camY, 0);

    // stars time
    if (sceneRefs.stars && sceneRefs.stars.userData.mat) {
      sceneRefs.stars.userData.mat.uniforms.uTime.value = t;
    }

    // hero rotation
    if (heroGroup) {
      heroGroup.userData.ico.rotation.x = t * 0.18;
      heroGroup.userData.ico.rotation.y = t * 0.24;
      heroGroup.userData.ring.rotation.z = t * 0.12;
      heroGroup.userData.ring2.rotation.z = -t * 0.08;
      if (heroGroup.userData.burst && heroGroup.userData.burst.userData.burstMat) {
        heroGroup.userData.burst.userData.burstMat.uniforms.uTime.value = t;
      }
    }

    // clusters update
    clusters.forEach(function (cl) {
      // gentle group rotation
      cl.rotation.y = Math.sin(t * 0.15 + cl.userData.project.sectionIdx) * 0.06;

      // panel float
      if (cl.userData.panels) {
        cl.userData.panels.forEach(function (p) {
          if (!p) return;
          var base = p.userData.basePos;
          var ph = p.userData.floatPhase || 0;
          p.position.x = base.x + Math.sin(t * 0.5 + ph) * 0.08;
          p.position.y = base.y + Math.cos(t * 0.4 + ph) * 0.10;
          p.position.z = base.z + Math.sin(t * 0.3 + ph) * 0.06;
          p.rotation.y = p.userData.baseRot.y + Math.sin(t * 0.25 + ph) * 0.04;
          if (p.userData.panelMat) p.userData.panelMat.uniforms.uTime.value = t;
          // wavebars
          if (p.userData.bars) {
            p.userData.bars.position.copy(p.position);
            p.userData.bars.rotation.copy(p.rotation);
            for (var bi = 0; bi < p.userData.bars.children.length; bi++) {
              var b = p.userData.bars.children[bi];
              var sy = 0.5 + Math.abs(Math.sin(t * 3 + b.userData.phase * 0.6)) * 1.2;
              b.scale.y = sy;
            }
          }
        });
      }
      // burst time
      if (cl.userData.burst && cl.userData.burst.userData.burstMat) {
        cl.userData.burst.userData.burstMat.uniforms.uTime.value = t;
      }
    });

    updateHeroVisibility();

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // -----------------------------------------------------------
  // 14. Resize
  // -----------------------------------------------------------
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', updateScrollState, { passive: true });

  // -----------------------------------------------------------
  // 15. Rail clicks (smooth scroll to section)
  // -----------------------------------------------------------
  railItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      var jump = parseInt(item.getAttribute('data-jump'), 10) || 0;
      var sec = document.getElementById('sec-' + jump);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // -----------------------------------------------------------
  // 16. Audio — WebAudio synthesized ambient drone (no network)
  // -----------------------------------------------------------
  var audioCtx = null;
  var masterGain = null;
  var audioMuted = false;
  function buildAudio() {
    if (audioCtx) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.0001;
      masterGain.connect(audioCtx.destination);

      // soft reverb-ish lowpass tail using delay feedback
      var lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      lp.Q.value = 0.6;
      lp.connect(masterGain);

      // three slowly-detuned sine pads
      var freqs = [55, 82.5, 110, 138.59, 165];
      freqs.forEach(function (f, i) {
        var osc = audioCtx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.value = f;
        var g = audioCtx.createGain();
        g.gain.value = 0.06 + Math.random() * 0.04;
        // slow LFO on gain (breathing)
        var lfo = audioCtx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.013;
        var lfoG = audioCtx.createGain();
        lfoG.gain.value = 0.03;
        lfo.connect(lfoG); lfoG.connect(g.gain);
        // slow LFO on detune
        var lfoD = audioCtx.createOscillator();
        lfoD.frequency.value = 0.03 + i * 0.007;
        var lfoDG = audioCtx.createGain();
        lfoDG.gain.value = 3 + i;
        lfoD.connect(lfoDG); lfoDG.connect(osc.detune);
        osc.connect(g); g.connect(lp);
        osc.start(); lfo.start(); lfoD.start();
      });

      // subtle filtered noise wind
      var bufSize = 2 * audioCtx.sampleRate;
      var noiseBuffer = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
      var nd = noiseBuffer.getChannelData(0);
      for (var n = 0; n < bufSize; n++) nd[n] = (Math.random() * 2 - 1) * 0.5;
      var noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer; noise.loop = true;
      var nFilt = audioCtx.createBiquadFilter();
      nFilt.type = 'bandpass'; nFilt.frequency.value = 600; nFilt.Q.value = 0.7;
      var nGain = audioCtx.createGain(); nGain.gain.value = 0.04;
      noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(lp);
      noise.start();
    } catch (e) { audioCtx = null; }
  }
  function fadeAudio(target, dur) {
    if (!masterGain || !audioCtx) return;
    var now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(target, now + dur);
  }
  function startAudio() {
    buildAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    audioMuted = false;
    muteBtn.classList.remove('is-muted');
    fadeAudio(0.35, 2.4);
  }
  muteBtn.addEventListener('click', function () {
    if (!audioCtx) { startAudio(); return; }
    if (audioMuted) {
      audioMuted = false;
      muteBtn.classList.remove('is-muted');
      fadeAudio(0.35, 0.6);
    } else {
      audioMuted = true;
      muteBtn.classList.add('is-muted');
      fadeAudio(0.0001, 0.5);
    }
  });

  // -----------------------------------------------------------
  // 17. Boot → Enter
  // -----------------------------------------------------------
  enterBtn.addEventListener('click', function () {
    enterBtn.disabled = true;
    boot.classList.add('is-hidden');
    hud.classList.add('is-active');
    startAudio();
    // kick first reveal
    updateScrollState();
  });

  // also allow Esc to exit
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.location.href = './case-study.html';
  });

  // -----------------------------------------------------------
  // 18. Custom cursor + magnetic
  // -----------------------------------------------------------
  var cx = window.innerWidth/2, cy = window.innerHeight/2;
  var rx = cx, ry = cy;
  window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; });
  function cursorTick() {
    rx += (cx - rx) * 0.22;
    ry += (cy - ry) * 0.22;
    if (cursorEl) cursorEl.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    requestAnimationFrame(cursorTick);
  }
  cursorTick();
  document.querySelectorAll('a, button, .xp-target, .xp-card').forEach(function (el) {
    el.addEventListener('mouseenter', function () { cursorEl && cursorEl.classList.add('is-hot'); });
    el.addEventListener('mouseleave', function () { cursorEl && cursorEl.classList.remove('is-hot'); });
  });

  // card spotlight
  document.querySelectorAll('.xp-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  // -----------------------------------------------------------
  // 19. Kick off
  // -----------------------------------------------------------
  tick();
  clustersReady.then(function () {
    updateScrollState();
  });

  // -----------------------------------------------------------
  // 20. PROJECT GALLERY (click-to-zoom into scrollable feed)
  // -----------------------------------------------------------
  var GALLERY_DATA = {
    ticketing: {
      eyebrowNum: '/ 01',
      title: 'Event Ticketing & QR Access',
      sub: 'Full-cycle ticketing platform: QR generation, scanner-safe access, admin control, search, analytics and live maps — configured for 75 club locations across 22 countries.',
      meta: [['75','Club locations'],['22','Countries'],['E2E','Full-stack']],
      shots: [
        ['ticketing-dashboard.jpg','01 / OPERATIONS','Operations dashboard','Top-level view of issuance, scanner load, anomalies and venue health.'],
        ['ticketing-analytics-overview.jpg','02 / ANALYTICS','Analytics overview','Cross-venue rollups, conversion funnels, time-of-day patterns and aggregates.'],
        ['ticketing-charts.jpg','03 / CHARTS','Detailed charts','Per-event series — entries, scans, no-shows — with comparable baselines.'],
        ['ticketing-map.jpg','04 / GEO LAYER','Live geographic map','Country and city distribution; quick context switching across markets.'],
        ['ticketing-search.jpg','05 / SEARCH','Cross-event search','Find a specific guest, ticket or order across the entire venue network.'],
        ['ticketing-segmentation.jpg','06 / SEGMENTS','Segmentation slice','Filter and group by audience traits to inform marketing decisions.'],
        ['scanner.jpg','07 / SCANNER','Scanner-side surface','Door-side scan UX — isolated from backoffice so it never blocks entry.']
      ]
    },
    taskcontrol: {
      eyebrowNum: '/ 02',
      title: 'Task Control & Team Ops',
      sub: 'Operational layer for recurring event work — roles, tasks, archives and synced state across mobile and desktop.',
      meta: [['5+','Role layers'],['∞','Recurring events'],['1','Unified ops']],
      shots: [
        ['task-control-dashboard.jpg','01 / OVERVIEW','Operations dashboard','Daily situational view: load, status, attention and outliers.'],
        ['task-control-events-board.jpg','02 / EVENTS','Events board','Active and upcoming events with state, ownership and progress.'],
        ['task-control-tasks.jpg','03 / TASKS','Task pipeline','Concrete deliverables — assignment, deadline, status, notes.'],
        ['task-control-events-list.jpg','04 / EVENT LIST','Event list view','Searchable directory with filters by venue, type and time.'],
        ['task-control-users.jpg','05 / ROLES','Team & roles','User registry — roles, scopes, access boundaries.'],
        ['task-control-archive.jpg','06 / ARCHIVE','Archive view','Historic event data — searchable, exportable, audit-friendly.'],
        ['task-control-bot-settings.jpg','07 / AUTOMATION','Bot & sync settings','Notification rules, automation triggers, sync targets.']
      ]
    },
    aivoice: {
      eyebrowNum: '/ 03',
      title: 'AI Voice Auto-Responder',
      sub: 'Inbound voice automation handled as a product flow — parser, cached venue state, business rules and operator fallbacks.',
      meta: [['24/7','Answering'],['~1s','Cache hit'],['Live','Venue sync']],
      shots: []
    }
  };

  function gImg(name) { return './assets/screens/' + name; }

  var galleryEl     = document.getElementById('xp-gallery');
  var galleryScroll = document.getElementById('xp-gallery-scroll');
  var galleryClose  = document.getElementById('xp-gallery-close');
  var galStackEl    = document.getElementById('xp-gal-stack');
  var galTitleEl    = document.getElementById('xp-gal-title');
  var galSubEl      = document.getElementById('xp-gal-sub');
  var galMetaEl     = document.getElementById('xp-gal-meta');
  var galEbNum      = document.getElementById('xp-gal-eb-num');
  var galChip       = document.getElementById('xp-gal-chip');

  var galleryObserver = null;
  var galleryOpen = false;

  function openGallery(projectKey) {
    var data = GALLERY_DATA[projectKey];
    if (!data || galleryOpen || !galleryEl) return;
    galleryOpen = true;

    if (galEbNum)   galEbNum.textContent   = data.eyebrowNum;
    if (galTitleEl) galTitleEl.textContent = data.title;
    if (galSubEl)   galSubEl.textContent   = data.sub;

    if (galMetaEl) {
      galMetaEl.innerHTML = '';
      data.meta.forEach(function (m) {
        var c = document.createElement('div'); c.className = 'xp-gal-meta-cell';
        var n = document.createElement('span'); n.className = 'xp-meta-num'; n.textContent = m[0];
        var l = document.createElement('span'); l.className = 'xp-meta-lbl'; l.textContent = m[1];
        c.appendChild(n); c.appendChild(l); galMetaEl.appendChild(c);
      });
    }

    galStackEl.innerHTML = '';
    if (data.shots.length === 0) {
      var note = document.createElement('div');
      note.className = 'xp-gal-fig';
      note.innerHTML = '<div class="xp-gal-fig-frame" style="padding:80px 60px;text-align:center;"><h3 style="font-family:var(--xp-sans);font-weight:300;font-size:clamp(28px,4vw,42px);color:var(--xp-fg);margin:0 0 18px;">Voice-first surface</h3><p style="color:var(--xp-fg-dim);max-width:62ch;margin:0 auto;line-height:1.7;">Visual proofs for this build are intentionally minimal — value lives in the call flow, business rules and fallback chain. Audio walkthrough available on request.</p></div>';
      galStackEl.appendChild(note);
    } else {
      data.shots.forEach(function (s, idx) {
        var fig = document.createElement('figure');
        fig.className = 'xp-gal-fig';
        fig.style.transitionDelay = (Math.min(idx, 6) * 0.04) + 's';
        fig.innerHTML =
          '<div class="xp-gal-fig-frame">' +
            '<span class="xp-c xp-c-tl"></span>' +
            '<span class="xp-c xp-c-tr"></span>' +
            '<span class="xp-c xp-c-bl"></span>' +
            '<span class="xp-c xp-c-br"></span>' +
            '<img loading="lazy" src="' + gImg(s[0]) + '" alt="' + s[2] + '">' +
          '</div>' +
          '<figcaption class="xp-gal-fig-cap">' +
            '<span class="xp-gal-fig-num">' + s[1] + '</span>' +
            '<div class="xp-gal-fig-body"><h3>' + s[2] + '</h3><p>' + s[3] + '</p></div>' +
          '</figcaption>';
        galStackEl.appendChild(fig);
      });
    }

    if (galChip) galChip.textContent = 'FRAME 00 / ' + String(data.shots.length || 1).padStart(2, '0');

    galleryEl.classList.add('is-open');
    galleryEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (galleryScroll) galleryScroll.scrollTop = 0;

    if (galleryObserver) galleryObserver.disconnect();
    galleryObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          var idx = Array.prototype.indexOf.call(galStackEl.children, e.target) + 1;
          var total = galStackEl.children.length;
          if (galChip) galChip.textContent = 'FRAME ' + String(idx).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
        }
      });
    }, { root: galleryScroll, threshold: 0.18, rootMargin: '-10% 0px -10% 0px' });
    Array.prototype.forEach.call(galStackEl.children, function (c) { galleryObserver.observe(c); });

    if (typeof fadeAudio === 'function') fadeAudio(0.18, 0.8);
  }

  function closeGallery() {
    if (!galleryOpen || !galleryEl) return;
    galleryOpen = false;
    galleryEl.classList.remove('is-open');
    galleryEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (galleryObserver) { galleryObserver.disconnect(); galleryObserver = null; }
    if (typeof fadeAudio === 'function' && !audioMuted) fadeAudio(0.35, 1.0);
  }

  if (galleryClose) galleryClose.addEventListener('click', closeGallery);
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && galleryOpen) { closeGallery(); e.stopImmediatePropagation(); }
  });

  // -----------------------------------------------------------
  // 21. RAYCASTER — click 3D panel to open its gallery
  // -----------------------------------------------------------
  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2();

  function panelUnderPointer(e) {
    var rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    var meshes = [];
    clusters.forEach(function (cl) {
      if (cl.userData.panels) cl.userData.panels.forEach(function (p) { if (p) meshes.push(p); });
    });
    var hits = raycaster.intersectObjects(meshes, false);
    for (var i = 0; i < hits.length; i++) {
      var m = hits[i].object;
      var mat = m.userData.panelMat;
      if (mat && mat.uniforms.uOpacity.value > 0.25) return m;
    }
    return null;
  }

  renderer.domElement.style.pointerEvents = 'auto';
  renderer.domElement.addEventListener('mousemove', function (e) {
    if (galleryOpen) return;
    var m = panelUnderPointer(e);
    document.body.classList.toggle('is-hover-panel', !!m);
  });
  renderer.domElement.addEventListener('click', function (e) {
    if (galleryOpen) return;
    var m = panelUnderPointer(e);
    if (m && m.userData.projectKey) openGallery(m.userData.projectKey);
  });

  // headings also open gallery
  var SEC_TO_KEY = { 1: 'ticketing', 2: 'taskcontrol', 3: 'aivoice' };
  document.querySelectorAll('.xp-proj-h2').forEach(function (h) {
    var secEl = h.closest('.xp-sec');
    var sec = secEl ? parseInt(secEl.getAttribute('data-sec'), 10) : -1;
    var key = SEC_TO_KEY[sec];
    if (!key) return;
    h.style.cursor = 'pointer';
    h.setAttribute('role', 'button');
    h.setAttribute('tabindex', '0');
    h.addEventListener('click', function () { openGallery(key); });
    h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGallery(key); } });
  });

  // -----------------------------------------------------------
  // 22. STACK META number counters (animate on reveal)
  // -----------------------------------------------------------
  var counterInited = false;
  function initCounters() {
    if (counterInited) return;
    counterInited = true;
    document.querySelectorAll('.xp-meta-num[data-count]').forEach(function (el) {
      var raw = el.getAttribute('data-count');
      var to = parseFloat(raw) || 0;
      var pad = raw.length;
      var dur = 1400 + Math.random() * 400;
      var start = performance.now();
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - t, 3);
        var v = Math.round(to * eased);
        el.textContent = String(v).padStart(pad, '0');
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  var stackSec = document.getElementById('sec-4');
  if (stackSec && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { initCounters(); co.disconnect(); } });
    }, { threshold: 0.35 });
    co.observe(stackSec);
  }

})();
