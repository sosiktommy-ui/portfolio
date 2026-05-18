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
  // 1b. ENTER button — registered immediately, before any THREE setup
  //     (functions startAudio / updateScrollState are hoisted)
  // -----------------------------------------------------------
  if (enterBtn) {
    enterBtn.addEventListener('click', function onEnter() {
      enterBtn.removeEventListener('click', onEnter);
      enterBtn.disabled = true;
      if (boot) boot.classList.add('is-hidden');
      if (hud)  hud.classList.add('is-active');
      try { startAudio(); } catch(e) {}
      try { updateScrollState(); } catch(e) {}
    });
  }

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

  // boot 3D parallax — title reacts to mouse
  (function bootParallax() {
    var titleEl = document.querySelector('.xp-boot-title');
    var subEl   = document.querySelector('.xp-boot-sub');
    var ebEl    = document.querySelector('.xp-boot-eyebrow');
    if (!titleEl) return;
    var bx = 0, by = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function(e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    function loop() {
      if (boot && boot.classList.contains('is-hidden')) return;
      bx += (tx - bx) * 0.08;
      by += (ty - by) * 0.08;
      var rx = -by * 8, ry = bx * 12;
      titleEl.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';
      if (subEl) subEl.style.transform = 'translate(' + (bx*8).toFixed(1) + 'px,' + (by*6).toFixed(1) + 'px)';
      if (ebEl)  ebEl.style.transform  = 'translate(' + (bx*14).toFixed(1) + 'px,' + (by*10).toFixed(1) + 'px)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

  // 3D boot background — wireframe core + orbiting rings + particle field
  (function bootScene() {
    var cvs = document.getElementById('xp-boot-canvas');
    if (!cvs || typeof THREE === 'undefined') return;
    var rdr = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
    rdr.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scn = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    cam.position.set(0, 0, 6);

    // central icosahedron — solid dark + wireframe glow on top
    var icoGeo = new THREE.IcosahedronGeometry(1.4, 1);
    var icoSolid = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({
      color: 0x0a0612, transparent: true, opacity: 0.85
    }));
    var icoWire = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({
      color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.55
    }));
    var icoGroup = new THREE.Group();
    icoGroup.add(icoSolid);
    icoGroup.add(icoWire);
    // inner pulse core
    var pulseCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 18, 18),
      new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    icoGroup.add(pulseCore);
    scn.add(icoGroup);

    // orbiting tori (rings)
    var rings = [];
    for (var ri = 0; ri < 3; ri++) {
      var ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2 + ri * 0.55, 0.008, 8, 128),
        new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.35 - ri * 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      ring.rotation.x = Math.PI * (0.25 + ri * 0.18);
      ring.rotation.y = ri * 0.7;
      scn.add(ring);
      rings.push(ring);
    }

    // particle field
    var pCount = 600;
    var pPos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      var r  = 3 + Math.random() * 6;
      pPos[i*3]   = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i*3+2] = r * Math.cos(ph);
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({ color: 0xc4b5fd, size: 0.028, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    var pts = new THREE.Points(pGeo, pMat);
    scn.add(pts);

    // mouse parallax
    var mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', function(e) {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    function resize() {
      var w = cvs.clientWidth || window.innerWidth;
      var h = cvs.clientHeight || window.innerHeight;
      rdr.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var t = 0;
    function tick() {
      if (boot && boot.classList.contains('is-hidden')) {
        // freeze rendering once hidden but keep RAF idle
        requestAnimationFrame(tick);
        return;
      }
      t += 0.01;
      cx += (mx - cx) * 0.05;
      cy += (my - cy) * 0.05;
      icoGroup.rotation.y += 0.004;
      icoGroup.rotation.x = Math.sin(t * 0.3) * 0.15 + cy * 0.2;
      icoGroup.rotation.z = cx * 0.18;
      icoWire.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
      pulseCore.scale.setScalar(0.85 + Math.sin(t * 2.0) * 0.18);
      pulseCore.material.opacity = 0.7 + Math.sin(t * 2.0) * 0.25;
      for (var k = 0; k < rings.length; k++) {
        rings[k].rotation.z += 0.002 + k * 0.0015;
        rings[k].rotation.x += 0.0008;
      }
      pts.rotation.y += 0.0006;
      pts.rotation.x += 0.0003;
      cam.position.x = cx * 0.6;
      cam.position.y = -cy * 0.4;
      cam.lookAt(0, 0, 0);
      rdr.render(scn, cam);
      requestAnimationFrame(tick);
    }
    tick();
  })();

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
    ctx.fillText('AI \u00B7 VOICE', 256, 160);
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
  // 10. Build all clusters (async) — skipped on mobile (too chaotic on narrow portrait screens)
  // -----------------------------------------------------------
  var clustersReady = IS_MOBILE
    ? Promise.resolve([])
    : Promise.all(PROJECTS.map(buildClusterFor));

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
      // also trigger for tall sections (taller than viewport) when top enters view
      var topInView = r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.15;
      if (midDist < window.innerHeight * 0.55 || topInView) sec.classList.add('is-in');
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

  var _prevTickT = 0;
  function tick() {
    var t = clock.getElapsedTime();
    var _dt = t - _prevTickT; _prevTickT = t;

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

    if (typeof sceneRefs.ufoAnimate === 'function') sceneRefs.ufoAnimate(_dt);
    if (typeof sceneRefs.clickBurstsUpdate === 'function') sceneRefs.clickBurstsUpdate(t);

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
  var _sparkleTimer = null;
  function buildAudio() {
    if (audioCtx) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
      var sr = audioCtx.sampleRate;

      // Compressor — keeps everything smooth, no harsh peaks
      var comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 20;
      comp.ratio.value = 6;
      comp.attack.value = 0.010;
      comp.release.value = 0.40;

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.0001;
      masterGain.connect(comp);
      comp.connect(audioCtx.destination);

      // Reverb — feedback delay network: warm tail, no harsh reflections
      var revDelay = audioCtx.createDelay(3.0);
      revDelay.delayTime.value = 1.8;
      var revFb = audioCtx.createGain();
      revFb.gain.value = 0.38;
      var revLp = audioCtx.createBiquadFilter();
      revLp.type = 'lowpass'; revLp.frequency.value = 1400; revLp.Q.value = 0.4;
      var revWet = audioCtx.createGain();
      revWet.gain.value = 0.28;
      // delay chain: input → revDelay → revLp → revFb → revDelay (loop) + revWet → masterGain
      revLp.connect(revFb); revFb.connect(revDelay);
      revLp.connect(revWet); revWet.connect(masterGain);

      // Pad bus → both dry and reverb
      var padBus = audioCtx.createGain();
      padBus.gain.value = 1.0;
      var dryLp = audioCtx.createBiquadFilter();
      dryLp.type = 'lowpass'; dryLp.frequency.value = 600; dryLp.Q.value = 0.3;
      dryLp.connect(masterGain);   // dry
      dryLp.connect(revDelay);     // into reverb input
      padBus.connect(dryLp);

      // Pure SINE pad — Am chord: A2 E3 A3 C#4 E4  (smooth, no buzz)
      var padFreqs  = [110, 164.8, 220, 277.2, 329.6];
      var padVols   = [0.032, 0.026, 0.022, 0.016, 0.013];
      padFreqs.forEach(function(f, i) {
        var osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        // Very slow detune drift (imperceptible, just alive)
        var lfoD = audioCtx.createOscillator();
        lfoD.frequency.value = 0.025 + i * 0.008;
        var lfoDG = audioCtx.createGain();
        lfoDG.gain.value = 1.2;
        lfoD.connect(lfoDG); lfoDG.connect(osc.detune);
        // Gentle amplitude breathe
        var g = audioCtx.createGain();
        g.gain.value = padVols[i];
        var lfoA = audioCtx.createOscillator();
        lfoA.frequency.value = 0.035 + i * 0.007;
        var lfoAG = audioCtx.createGain();
        lfoAG.gain.value = padVols[i] * 0.25;
        lfoA.connect(lfoAG); lfoAG.connect(g.gain);
        osc.connect(g); g.connect(padBus);
        osc.start(); lfoD.start(); lfoA.start();
      });

      // Sub rumble — very deep pink noise (< 80 Hz), barely audible, just felt
      var nBuf = audioCtx.createBuffer(1, 3 * sr, sr);
      var nd = nBuf.getChannelData(0);
      var b0=0, b1=0, b2=0;
      for (var n = 0; n < nd.length; n++) {
        var wh = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + wh*0.0555179;
        b1 = 0.99332*b1 + wh*0.0750759;
        b2 = 0.96900*b2 + wh*0.1538520;
        nd[n] = (b0 + b1 + b2 + wh*0.0782232) * 0.11;
      }
      var noise = audioCtx.createBufferSource();
      noise.buffer = nBuf; noise.loop = true;
      var nLp = audioCtx.createBiquadFilter();
      nLp.type = 'lowpass'; nLp.frequency.value = 75; nLp.Q.value = 0.4;
      var nG = audioCtx.createGain(); nG.gain.value = 0.09;
      noise.connect(nLp); nLp.connect(nG); nG.connect(masterGain);
      noise.start();

      // Sparkle pings — random high sine tones, soft attack + long exponential decay
      var sparkleFreqs = [1318.5, 1046.5, 987.8, 1174.7, 880.0, 1567.0, 1318.5, 783.9];
      function scheduleSparkle() {
        var wait = 2800 + Math.random() * 5500;
        _sparkleTimer = setTimeout(function() {
          if (!audioCtx || audioMuted) { scheduleSparkle(); return; }
          var t = audioCtx.currentTime;
          var freq = sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)];
          var sOsc = audioCtx.createOscillator();
          sOsc.type = 'sine';
          sOsc.frequency.value = freq;
          var sEnv = audioCtx.createGain();
          sEnv.gain.setValueAtTime(0, t);
          sEnv.gain.linearRampToValueAtTime(0.028, t + 0.06);
          sEnv.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
          sOsc.connect(sEnv); sEnv.connect(revDelay); sEnv.connect(masterGain);
          sOsc.start(t); sOsc.stop(t + 3.5);
          scheduleSparkle();
        }, wait);
      }
      scheduleSparkle();

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
  // 17. Boot -> Enter  (listener registered early in section 1b)
  // -----------------------------------------------------------

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
  // 20. PROJECT GALLERY — 3D orbit scene with procedural tree
  // -----------------------------------------------------------
  var GALLERY_DATA = {
    ticketing: {
      eyebrowNum: '/ 01',
      title: 'Event Ticketing & QR Access',
      sub: 'Full-cycle platform \u2014 QR generation, scanner-safe access, admin control, analytics and live maps. 75 clubs, 22 countries.',
      meta: [['75','Clubs'],['22','Countries'],['E2E','Full-stack']],
      shots: [
        { file: 'ticketing-dashboard.jpg',         tag: '01 / OPERATIONS', title: 'Operations dashboard',  desc: 'Top-level view of issuance, scanner load, anomalies and venue health.' },
        { file: 'ticketing-analytics-overview.jpg', tag: '02 / ANALYTICS',  title: 'Analytics overview',   desc: 'Cross-venue rollups, conversion funnels, time-of-day patterns.' },
        { file: 'ticketing-charts.jpg',             tag: '03 / CHARTS',     title: 'Detailed charts',      desc: 'Per-event series \u2014 entries, scans, no-shows \u2014 with comparable baselines.' },
        { file: 'ticketing-map.jpg',                tag: '04 / GEO LAYER',  title: 'Live geographic map',  desc: 'Country and city distribution; quick context switching across markets.' },
        { file: 'ticketing-search.jpg',             tag: '05 / SEARCH',     title: 'Cross-event search',   desc: 'Find any guest, ticket or order across the entire venue network.' },
        { file: 'ticketing-segmentation.jpg',       tag: '06 / SEGMENTS',   title: 'Segmentation',         desc: 'Filter and group by audience traits to inform marketing decisions.' },
        { file: 'scanner.jpg',                      tag: '07 / SCANNER',    title: 'Scanner surface',      desc: 'Door-side scan UX \u2014 isolated from backoffice so it never blocks entry.' }
      ]
    },
    taskcontrol: {
      eyebrowNum: '/ 02',
      title: 'Task Control & Team Ops',
      sub: 'Operational layer for recurring event work \u2014 roles, tasks, archives and synced state across mobile and desktop.',
      meta: [['5+','Role layers'],['\u221E','Events'],['1','Unified ops']],
      shots: [
        { file: 'task-control-dashboard.jpg',    tag: '01 / OVERVIEW',    title: 'Operations dashboard', desc: 'Daily situational view: load, status, attention and outliers.' },
        { file: 'task-control-events-board.jpg', tag: '02 / EVENTS',      title: 'Events board',         desc: 'Active and upcoming events with state, ownership and progress.' },
        { file: 'task-control-tasks.jpg',        tag: '03 / TASKS',       title: 'Task pipeline',        desc: 'Concrete deliverables \u2014 assignment, deadline, status, notes.' },
        { file: 'task-control-events-list.jpg',  tag: '04 / EVENT LIST',  title: 'Event list',           desc: 'Searchable directory with filters by venue, type and time.' },
        { file: 'task-control-users.jpg',        tag: '05 / ROLES',       title: 'Team & roles',         desc: 'User registry \u2014 roles, scopes, access boundaries.' },
        { file: 'task-control-archive.jpg',      tag: '06 / ARCHIVE',     title: 'Archive view',         desc: 'Historic event data \u2014 searchable, exportable, audit-friendly.' },
        { file: 'task-control-bot-settings.jpg', tag: '07 / AUTOMATION',  title: 'Bot settings',         desc: 'Notification rules, automation triggers, sync targets.' }
      ]
    },
    aivoice: {
      eyebrowNum: '/ 03',
      title: 'AI Voice Auto-Responder',
      sub: 'Inbound voice automation \u2014 parser + cached venue state + business rules + operator fallbacks, live 24/7.',
      meta: [['24/7','Answering'],['~1s','Cache hit'],['Live','Venue sync']],
      shots: [
        { label: 'VOICE\nPARSER',    tag: '01 / PARSER',    title: 'Natural language parser',  desc: 'Intent detection and entity extraction from inbound call transcripts in real time.' },
        { label: 'VENUE\nCACHE',     tag: '02 / CACHE',     title: 'Venue cache layer',        desc: 'Events, capacity and schedule pre-loaded so answers are grounded in current state.' },
        { label: 'BUSINESS\nRULES',  tag: '03 / RULES',     title: 'Rules engine',             desc: 'Configurable matrix: closed venues, sold-out events, VIP routing, special cases.' },
        { label: 'OPERATOR\nFALLBK', tag: '04 / FALLBACK',  title: 'Operator hand-off',       desc: 'Graceful fallback when confidence is low \u2014 routes to human with full context.' },
        { label: '24/7\nACTIVE',     tag: '05 / UPTIME',    title: '24/7 availability',        desc: 'Always-on. No shift gaps, no fatigue \u2014 handles call surges without queue saturation.' },
        { label: 'BOOKING\nSYNC',    tag: '06 / BOOKING',   title: 'Live booking sync',        desc: 'Real-time availability checks and reservation confirmations via ticketing API.' },
        { label: 'CALL\nANALYTICS', tag: '07 / ANALYTICS', title: 'Call analytics',           desc: 'Intent logs, resolution rate, fallback frequency \u2014 full visibility into voice traffic.' }
      ]
    }
  };

  // gallery 3D state
  var galScene, galRenderer, galCamera, galRaf;
  var galComposer = null, galBloomPass = null;
  var galOrbitGroup, galPanels = [], galActiveIdx = 0;
  var galTreeGroup, galParticlesObj;
  var galDragging = false, galDragStartX = 0, galDragMoved = false, galRotVel = 0;
  var galleryOpen = false;
  var galLoadedTextures = [];
  var galleryEl     = document.getElementById('xp-gallery');
  var galleryClose  = document.getElementById('xp-gallery-close');
  var galCanvas     = document.getElementById('xp-gal-canvas');
  var galTitleEl    = document.getElementById('xp-gal-title');
  var galSubEl      = document.getElementById('xp-gal-sub');
  var galMetaEl     = document.getElementById('xp-gal-meta');
  var galEbNum      = document.getElementById('xp-gal-eb-num');
  var galChip       = document.getElementById('xp-gal-chip');
  var galChipNav    = document.getElementById('xp-gal-chip-nav');
  var galFrameTag   = document.getElementById('xp-gal-frame-tag');
  var galFrameTitle = document.getElementById('xp-gal-frame-title');
  var galFrameDesc  = document.getElementById('xp-gal-frame-desc');
  var galPrevBtn    = document.getElementById('xp-gal-prev');
  var galNextBtn    = document.getElementById('xp-gal-next');

  // --- procedural BLOOM COLUMN — vertical rising particle column (activetheory-style) ---
  var galColumnData = null;
  function buildGalTree(sc) {
    var g = new THREE.Group();
    // soft round sprite texture
    var spriteCv = document.createElement('canvas'); spriteCv.width = 128; spriteCv.height = 128;
    var sctx = spriteCv.getContext('2d');
    var grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = grad; sctx.fillRect(0, 0, 128, 128);
    var spriteTex = new THREE.CanvasTexture(spriteCv);
    spriteTex.minFilter = THREE.LinearFilter; spriteTex.magFilter = THREE.LinearFilter;

    // 14000 particles forming the column
    var N = 14000;
    var positions = new Float32Array(N * 3);
    var colors    = new Float32Array(N * 3);
    var sizes     = new Float32Array(N);
    var speeds    = new Float32Array(N);
    var phases    = new Float32Array(N);
    var radii     = new Float32Array(N);
    var seed = 42;
    function r01() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 4294967295; }
    // HSV→RGB
    function hsv(h, s, v, out, o) {
      var c = v * s, x = c * (1 - Math.abs((h/60) % 2 - 1)), m = v - c;
      var R=0,G=0,B=0;
      if (h <  60) { R=c; G=x; B=0; }
      else if (h <120) { R=x; G=c; B=0; }
      else if (h <180) { R=0; G=c; B=x; }
      else if (h <240) { R=0; G=x; B=c; }
      else if (h <300) { R=x; G=0; B=c; }
      else             { R=c; G=0; B=x; }
      out[o] = R+m; out[o+1] = G+m; out[o+2] = B+m;
    }
    var H_BOT = -11.0, H_TOP = 9.0;    // vertical extent of column
    for (var i = 0; i < N; i++) {
      var y = H_BOT + r01() * (H_TOP - H_BOT);
      // radius profile: narrow at bottom, wider in middle, narrows at top
      var t  = (y - H_BOT) / (H_TOP - H_BOT);   // 0..1
      var rprof = Math.sin(t * Math.PI) * 1.15 + 0.18;
      var r  = rprof * (0.4 + r01() * 1.0);
      var th = r01() * Math.PI * 2;
      positions[i*3]   = Math.cos(th) * r;
      positions[i*3+1] = y;
      positions[i*3+2] = Math.sin(th) * r;
      // color: dominant magenta-violet (270-320°), 10% cyan accents
      var hue;
      var roll = r01();
      if (roll < 0.10)       hue = 185 + r01() * 25;   // cyan
      else if (roll < 0.20)  hue = 320 + r01() * 25;   // pink
      else                   hue = 260 + r01() * 50;   // violet→magenta
      hsv(hue, 0.75 + r01() * 0.25, 0.8 + r01() * 0.2, colors, i*3);
      sizes[i]  = 0.07 + r01() * 0.35;
      speeds[i] = 0.22 + r01() * 0.22;
      phases[i] = r01() * Math.PI * 2;
      radii[i]  = r;
    }
    var pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pgeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    pgeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    // Custom shader for size-attenuation + per-vertex color + sprite + soft Y fade
    var pmat = new THREE.ShaderMaterial({
      uniforms: {
        uTex:  { value: spriteTex },
        uTime: { value: 0 },
        uYMin: { value: H_BOT },
        uYMax: { value: H_TOP }
      },
      vertexShader: [
        'attribute float size;',
        'varying vec3 vColor;',
        'varying float vFade;',
        'uniform float uYMin;',
        'uniform float uYMax;',
        'void main() {',
        '  vColor = color;',
        '  float t = (position.y - uYMin) / (uYMax - uYMin);',
        '  // fade in at bottom, fade out at top for seamless wrap',
        '  vFade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t));',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_Position = projectionMatrix * mv;',
        '  gl_PointSize = size * (320.0 / max(-mv.z, 0.1));',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying vec3 vColor;',
        'varying float vFade;',
        'void main() {',
        '  vec4 tx = texture2D(uTex, gl_PointCoord);',
        '  float a = tx.a * vFade;',
        '  if (a < 0.02) discard;',
        '  gl_FragColor = vec4(vColor * (1.2 + tx.r * 0.3), a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });
    var points = new THREE.Points(pgeo, pmat);
    g.add(points);

    // central core glow at base
    var coreM = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), coreM);
    core.position.y = H_BOT + 0.4; g.add(core);
    var outerM = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide });
    var outer = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), outerM);
    outer.position.y = H_BOT + 0.4; g.add(outer);

    // glowing horizontal rings along column at regular intervals
    var ringYs = [-6, -2.5, 1.0, 4.5, 7.5];
    var ringColors = [0xec4899, 0xa78bfa, 0x67e8f9, 0xa78bfa, 0xec4899];
    ringYs.forEach(function(ry, ri) {
      var rmat = new THREE.MeshBasicMaterial({ color: ringColors[ri], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      var ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.035, 8, 72), rmat);
      ring.position.y = ry; g.add(ring);
      // outer glow halo
      var haloMat = new THREE.MeshBasicMaterial({ color: ringColors[ri], transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      var halo = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.12, 8, 72), haloMat);
      halo.position.y = ry; g.add(halo);
    });

    sc.add(g);
    galTreeGroup = g;
    galParticlesObj = points;
    galColumnData = { positions: positions, speeds: speeds, phases: phases, radii: radii, count: N, yMin: H_BOT, yMax: H_TOP, mat: pmat };
  }

  // canvas texture for AI Voice node cards — dashboard-like module
  function makeNodeTex(label) {
    var W = 720, H = 450;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var cx = cv.getContext('2d');
    // base gradient
    var bg = cx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#100925'); bg.addColorStop(0.6, '#0a0716'); bg.addColorStop(1, '#04020c');
    cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
    // hex grid faint
    cx.strokeStyle = 'rgba(167,139,250,0.07)'; cx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 24) { cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, H); cx.stroke(); }
    for (var gy = 0; gy < H; gy += 24) { cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(W, gy); cx.stroke(); }
    // radial glow center
    var rg = cx.createRadialGradient(W/2, H/2-30, 0, W/2, H/2, 360);
    rg.addColorStop(0, 'rgba(167,139,250,0.32)'); rg.addColorStop(1, 'transparent');
    cx.fillStyle = rg; cx.fillRect(0, 0, W, H);
    // outer border
    cx.strokeStyle = 'rgba(167,139,250,0.55)'; cx.lineWidth = 2;
    cx.strokeRect(8, 8, W-16, H-16);
    // corner ticks
    cx.strokeStyle = 'rgba(196,181,253,0.9)'; cx.lineWidth = 2;
    [[20,20,1,1],[W-20,20,-1,1],[20,H-20,1,-1],[W-20,H-20,-1,-1]].forEach(function(q) {
      cx.beginPath();
      cx.moveTo(q[0]+q[2]*28, q[1]); cx.lineTo(q[0], q[1]); cx.lineTo(q[0], q[1]+q[3]*28);
      cx.stroke();
    });
    // header bar (left tag)
    cx.fillStyle = 'rgba(167,139,250,0.18)';
    cx.fillRect(28, 32, 110, 22);
    cx.strokeStyle = 'rgba(167,139,250,0.7)'; cx.lineWidth = 1;
    cx.strokeRect(28, 32, 110, 22);
    cx.fillStyle = '#ddd6fe'; cx.font = 'bold 11px monospace'; cx.textAlign = 'left'; cx.textBaseline = 'middle';
    cx.fillText('MODULE \u00B7 ACTIVE', 36, 43);
    // status pill (right)
    cx.fillStyle = 'rgba(126,255,160,0.15)';
    cx.beginPath(); cx.arc(W-100, 43, 11, 0, Math.PI*2); cx.fill();
    cx.fillStyle = '#7effa0'; cx.beginPath(); cx.arc(W-100, 43, 4, 0, Math.PI*2); cx.fill();
    cx.fillStyle = '#a7f3d0'; cx.font = 'bold 11px monospace'; cx.textAlign = 'left';
    cx.fillText('LIVE', W-82, 43);
    // big label centered
    cx.fillStyle = '#ffffff';
    cx.font = 'bold 64px monospace';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.shadowColor = 'rgba(167,139,250,0.7)'; cx.shadowBlur = 22;
    var lines = label.split('\n');
    var lh = 76;
    var sy = H/2 - ((lines.length-1) * lh) / 2 - 10;
    lines.forEach(function(ln, i) { cx.fillText(ln, W/2, sy + i*lh); });
    cx.shadowBlur = 0;
    // waveform bars at bottom
    var bw = 6, bg2 = 4, baseY = H - 60, cnt = Math.floor((W - 80) / (bw + bg2));
    for (var bi = 0; bi < cnt; bi++) {
      var hh = 6 + (Math.sin(bi * 0.45) * 0.5 + 0.5) * 28 + (bi % 3 === 0 ? 14 : 0);
      var grad = cx.createLinearGradient(0, baseY - hh, 0, baseY);
      grad.addColorStop(0, '#a78bfa'); grad.addColorStop(1, 'rgba(167,139,250,0.2)');
      cx.fillStyle = grad;
      cx.fillRect(40 + bi * (bw + bg2), baseY - hh, bw, hh);
    }
    // bottom label strip
    cx.fillStyle = 'rgba(232,236,242,0.55)';
    cx.font = 'bold 10px monospace'; cx.textAlign = 'left'; cx.textBaseline = 'middle';
    cx.fillText('VOICE / SIGNAL', 40, H - 24);
    cx.textAlign = 'right';
    cx.fillText('CH\u00B701 \u00B7 48kHz \u00B7 16b', W - 40, H - 24);
    // scanline overlay
    cx.fillStyle = 'rgba(255,255,255,0.018)';
    for (var sl = 0; sl < H; sl += 3) { cx.fillRect(0, sl, W, 1); }
    var t = new THREE.CanvasTexture(cv); t.flipY = true; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    return t;
  }

  // PHOTOS arranged on 2 orbital tiers around the particle column.
  // Camera auto-orbits + scroll shifts orbit angle to bring next photo to front.
  var galStepProg = 1;
  var galTargetProg = 0;
  var galProg = 0;
  var galMaxProg = 0;
  var galTier1R = 4.0;  var galTier1Y =  0.6;
  var galTier2R = 5.7;  var galTier2Y = -0.7;
  var galCamRadius = 9.0;
  var galCamHeight = 1.4;
  var galCamAng    = 0;        // current camera azimuth
  var galCamAngTgt = 0;
  var galMouseX = 0, galMouseY = 0;
  // legacy holdovers
  var galHelixStep = 1; var galHelixRadius = 0; var galTargetY = 0; var galCameraY = 0; var galMaxScroll = 0;
  var galRingRadius = 0; var galViewSlot = new THREE.Vector3(0, 0, 0);
  var galSpiralRadius = 0, galSpiralYStep = 0, galSpiralAngStep = 0, galSpiralStartAng = 0;
  function buildGalOrbit(sc, shots, textures) {
    var og = new THREE.Group();
    var n = shots.length;
    galMaxProg = n - 1;
    // HELIX / SPIRAL — each photo descends AND rotates around the column
    var spiralR        = 5.2;
    var spiralAngStep  = (Math.PI * 2) / 3.0;   // 120 deg apart — exactly 3 per turn
    var spiralYStep    = 1.20;                   // vertical spacing per photo — clear staircase
    var spiralStartY   = 1.2;
    shots.forEach(function(s, i) {
      var theta = i * spiralAngStep;
      var y     = spiralStartY - i * spiralYStep;
      var x = Math.cos(theta) * spiralR;
      var z = Math.sin(theta) * spiralR;

      var grp = new THREE.Group();

      // soft outer glow plane (additive)
      var gm = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      var gmesh = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.4), gm);
      gmesh.position.z = -0.03;
      grp.add(gmesh);

      // device bezel — flat dark frame slightly behind/around the photo
      var bezelMat = new THREE.MeshBasicMaterial({ color: 0x0d0820, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      var bezel = new THREE.Mesh(new THREE.PlaneGeometry(4.45, 2.78), bezelMat);
      bezel.position.z = -0.012;
      grp.add(bezel);

      // photo plane
      var mat = new THREE.MeshBasicMaterial({ map: textures[i], color: 0xd8d8d8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.60), mat);
      grp.add(mesh);

      // frame outline
      var frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.22, 2.62));
      var frameMat = new THREE.LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0 });
      var frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.z = 0.012;
      grp.add(frame);

      grp.position.set(x, y, z);
      // face roughly outward from column (will be re-lerped each frame to look at camera)
      grp.lookAt(x * 3, y, z * 3);

      grp.userData.glowMat  = gm;
      grp.userData.bezelMat = bezelMat;
      grp.userData.frameMat = frameMat;
      grp.userData.photoMat = mat;
      grp.userData.shotIdx  = i;
      grp.userData.shotData = s;
      grp.userData.tier     = 1;
      grp.userData.baseTheta = theta;
      grp.userData.baseR    = spiralR;
      grp.userData.baseY    = y;
      // expose photo mesh for raycaster
      grp.userData.photoMesh = mesh;
      mesh.userData.shotIdx = i;
      og.add(grp);
    });
    sc.add(og);
    galOrbitGroup = og;
    galPanels = og.children.slice();
  }

  // mouse-parallax tracking (also drives camera-orbit input)
  window.addEventListener('mousemove', function(e) {
    galMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    galMouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  function setGalActive(idx) {
    if (idx === galActiveIdx && galFrameTag && galFrameTag.textContent) return;
    galActiveIdx = idx;
    var n = galPanels.length;
    var s = galPanels[idx] && galPanels[idx].userData.shotData;
    if (s) {
      if (galFrameTag)   galFrameTag.textContent   = s.tag   || '';
      if (galFrameTitle) galFrameTitle.textContent = s.title || '';
      if (galFrameDesc)  galFrameDesc.textContent  = s.desc  || '';
    }
    if (galChip) galChip.textContent = 'FRAME ' + String(idx+1).padStart(2,'0') + ' / ' + String(n).padStart(2,'0');
    if (galChipNav) galChipNav.textContent = String(idx+1).padStart(2,'0') + ' / ' + String(n).padStart(2,'0');
  }

  var galRaycaster = new THREE.Raycaster();

  var _galClock = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  function galTick() {
    if (!galScene || !galRenderer) return;
    galRaf = requestAnimationFrame(galTick);
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    var dt = Math.min(0.05, (now - _galClock) / 1000);
    _galClock = now;
    var w = Math.max(1, galCanvas.clientWidth), h = Math.max(1, galCanvas.clientHeight);
    if (galRenderer.domElement.width !== w || galRenderer.domElement.height !== h) {
      galRenderer.setSize(w, h, false);
      galCamera.aspect = w / h;
      galCamera.updateProjectionMatrix();
      if (galComposer) galComposer.setSize(w, h);
    }
    // smooth progress
    galProg += (galTargetProg - galProg) * 0.065;
    var n = galPanels.length;

    // ----- SPIRAL DESCENT CAMERA -----
    // Each photo scroll step = 120deg rotation + descent (like Secret Sky / helix fly-through)
    // helix params MUST match buildGalOrbit
    var spiralAngStep = (Math.PI * 2) / 3.0;   // 120 deg per photo
    var spiralYStep   = 1.20;                   // MUST match buildGalOrbit
    var spiralStartY  = 1.2;
    var activeIdxF = Math.max(0, Math.min(n > 0 ? n - 1 : 0, galProg));
    var activePhotoY  = spiralStartY - activeIdxF * spiralYStep;
    // camera angle = exactly opposite active photo (+PI)
    // photos[i] are at i*spiralAngStep, camera must be at that angle + PI
    galCamAngTgt = galProg * spiralAngStep + Math.PI;
    // gentle lerp — but no extra drift so active photo always ends up centered
    galCamAng += (galCamAngTgt - galCamAng) * 0.038;
    var camX = Math.cos(galCamAng) * galCamRadius;
    var camZ = Math.sin(galCamAng) * galCamRadius;
    // camera descends WITH the helix
    var camYTarget = activePhotoY + 1.6;
    galCamHeight += (camYTarget - galCamHeight) * 0.028;
    // mouse adds subtle sway
    var pY = galCamHeight + galMouseY * -0.4;
    var pX = camX + galMouseX * 0.25;
    if (galCamera) {
      galCamera.position.x += (pX - galCamera.position.x) * 0.05;
      galCamera.position.y += (pY - galCamera.position.y) * 0.05;
      galCamera.position.z += (camZ - galCamera.position.z) * 0.05;
      galCamera.lookAt(0, activePhotoY + 0.3, 0);
    }

    // ----- column particles: rise & wrap, gentle horizontal sway -----
    if (galColumnData) {
      var d = galColumnData;
      var pos = d.positions;
      var yRange = d.yMax - d.yMin;
      for (var pi = 0; pi < d.count; pi++) {
        var y = pos[pi*3 + 1] + d.speeds[pi] * dt;
        if (y > d.yMax) y = d.yMin + (y - d.yMax);
        pos[pi*3 + 1] = y;
        // breathing radius — softer, slower
        var ph = d.phases[pi] + now * 0.00035;
        var rr = d.radii[pi] * (1 + Math.sin(now * 0.00025 + d.phases[pi]) * 0.03);
        pos[pi*3]     = Math.cos(ph) * rr;
        pos[pi*3 + 2] = Math.sin(ph) * rr;
      }
      if (galParticlesObj && galParticlesObj.geometry && galParticlesObj.geometry.attributes.position) {
        galParticlesObj.geometry.attributes.position.needsUpdate = true;
      }
    }
    if (galTreeGroup) {
      // counter-rotate entire tree slowly — activetheory-style elegant drift
      galTreeGroup.rotation.y = now * 0.00012;
      // spin individual rings gracefully, alternating direction
      var kids = galTreeGroup.children;
      for (var ki = 0; ki < kids.length; ki++) {
        if (kids[ki].geometry && kids[ki].geometry.type === 'TorusGeometry') {
          kids[ki].rotation.y = now * (ki % 2 === 0 ? 0.00038 : -0.00032);
          kids[ki].rotation.z = Math.sin(now * 0.00018 + ki * 0.7) * 0.08;
        }
      }
    }

    // ----- photos: helix positions, face camera, focus active -----
    if (n > 0) {
      var active = Math.round(galProg);
      if (active < 0) active = 0; if (active > n-1) active = n-1;
      setGalActive(active);
      var camPos = galCamera.position;
      for (var i = 0; i < n; i++) {
        var p = galPanels[i];
        var d2 = i - galProg;
        var ad = Math.abs(d2);
        var focus = Math.max(0, 1 - ad * 0.50); // 1 at active, 0 by ~2 away
        // gentle bob
        var bob = Math.sin(now * 0.0009 + i * 1.2) * 0.06;
        p.position.y += ((p.userData.baseY + bob) - p.position.y) * 0.05;
        // active photo: pulled slightly toward camera for zoom-in feel
        var pullR = p.userData.baseR - focus * 0.45;
        var theta = p.userData.baseTheta;
        var tx = Math.cos(theta) * pullR;
        var tz = Math.sin(theta) * pullR;
        p.position.x += (tx - p.position.x) * 0.05;
        p.position.z += (tz - p.position.z) * 0.05;
        // always face camera so photos look like floating screens
        var tmp = new THREE.Object3D();
        tmp.position.copy(p.position);
        tmp.lookAt(camPos);
        p.quaternion.slerp(tmp.quaternion, 0.06);
        // side-visibility: hide photos that are behind the column from camera's POV
        // camera is at galCamAng; photo is at theta. Photo is VISIBLE when they're
        // on OPPOSITE sides (camera looks inward). cos(theta - camAng) = -1 means
        // photo is directly in front of camera. So we NEGATE for the fade.
        var sideCos = -Math.cos(theta - galCamAng);
        // sideFactor: 1 = photo faces camera, 0 = photo is hidden behind column
        var sideFactor = Math.max(0, Math.min(1, (sideCos + 0.35) / 0.70));
        // scale — active bigger, far ones smaller
        var ts  = 0.65 + focus * 0.45;   // 0.65 (far) .. 1.10 (active)
        // photo opacity: distance-based * side-visibility (0 when behind column)
        var distOp = IS_MOBILE
          ? Math.max(0, 0.92 - ad * 0.72)   // mobile: only active+1 visible
          : Math.max(0, 0.92 - ad * 0.28);  // desktop: soft fall-off
        var top = distOp * sideFactor;
        var tgl = focus > 0.3 ? (focus - 0.3) * 0.55 * sideFactor : 0;
        var tfr = (0.18 + focus * 0.82) * sideFactor;
        var tbz = (0.35 + focus * 0.55) * sideFactor;
        p.scale.x += (ts - p.scale.x) * 0.07;
        p.scale.y += (ts - p.scale.y) * 0.07;
        p.scale.z += (ts - p.scale.z) * 0.07;
        if (p.userData.photoMat) p.userData.photoMat.opacity += (top - p.userData.photoMat.opacity) * 0.07;
        if (p.userData.frameMat) p.userData.frameMat.opacity += (tfr - p.userData.frameMat.opacity) * 0.07;
        if (p.userData.glowMat)  p.userData.glowMat.opacity  += (tgl - p.userData.glowMat.opacity) * 0.07;
        if (p.userData.bezelMat) p.userData.bezelMat.opacity += (tbz - p.userData.bezelMat.opacity) * 0.07;
        p.renderOrder = 10 - Math.round(ad * ad);
      }
    }
    if (galComposer) galComposer.render(); else galRenderer.render(galScene, galCamera);
  }

  function openGallery(projectKey) {
    var data = GALLERY_DATA[projectKey];
    if (!data || galleryOpen || !galleryEl || !galCanvas) return;
    galleryOpen = true;
    if (galEbNum)   galEbNum.textContent   = data.eyebrowNum;
    if (galTitleEl) galTitleEl.textContent = data.title;
    if (galSubEl)   galSubEl.textContent   = data.sub;
    if (galMetaEl) {
      galMetaEl.innerHTML = '';
      data.meta.forEach(function(m) {
        var c = document.createElement('div'); c.className = 'xp-gal-meta-cell';
        c.innerHTML = '<span class="xp-meta-num">' + m[0] + '</span><span class="xp-meta-lbl">' + m[1] + '</span>';
        galMetaEl.appendChild(c);
      });
    }
    galleryEl.classList.add('is-open');
    galleryEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // show swipe hint only on touch/mobile
    var swipeHint = document.getElementById('xp-gal-swipe-hint');
    if (swipeHint && window.matchMedia('(max-width: 480px)').matches) {
      swipeHint.style.animation = 'none';
      swipeHint.offsetHeight; // reflow to restart animation
      swipeHint.style.animation = '';
      swipeHint.style.display = 'flex';
      setTimeout(function() { swipeHint.style.display = 'none'; }, 3200);
    }
    var w = window.innerWidth, h = window.innerHeight;
    galScene = new THREE.Scene();
    galCamera = new THREE.PerspectiveCamera(50, w/h, 0.1, 200);
    galTargetProg = 0; galProg = 0;
    galCamAng = Math.PI; galCamAngTgt = Math.PI;
    galCamHeight = 3.2;  // start above spiral top
    // photo 0 is at theta=0, so camera must start at theta=PI (directly opposite)
    galCamera.position.set(-galCamRadius, galCamHeight, 0);
    galCamera.lookAt(0, 0, 0);
    galRenderer = new THREE.WebGLRenderer({ canvas: galCanvas, antialias: true, alpha: true });
    galRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    galRenderer.setSize(w, h, false);
    galRenderer.setClearColor(0x000000, 0);
    galScene.fog = new THREE.FogExp2(0x02010a, 0.022);

    // postprocess: real UnrealBloom if available, otherwise skip (additive glow alone)
    galComposer = null; galBloomPass = null;
    if (THREE.EffectComposer && THREE.UnrealBloomPass && THREE.RenderPass && THREE.ShaderPass && THREE.CopyShader) {
      try {
        galComposer = new THREE.EffectComposer(galRenderer);
        galComposer.setSize(w, h);
        galComposer.addPass(new THREE.RenderPass(galScene, galCamera));
        galBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.38, 0.45, 0.68);
        galBloomPass.threshold = 0.68;
        galBloomPass.strength  = 0.38;
        galBloomPass.radius    = 0.45;
        galComposer.addPass(galBloomPass);
        var copy = new THREE.ShaderPass(THREE.CopyShader);
        copy.renderToScreen = true;
        galComposer.addPass(copy);
      } catch (err) {
        console.warn('Bloom postprocess failed, falling back to direct render:', err);
        galComposer = null;
      }
    }
    galScene.add(new THREE.AmbientLight(0xa78bfa, 0.55));
    var pl = new THREE.PointLight(0xec4899, 3.0, 22);
    pl.position.set(0, 2.5, 4); galScene.add(pl);
    var pl2 = new THREE.PointLight(0x06b6d4, 2.2, 20);
    pl2.position.set(2, -2, -2); galScene.add(pl2);
    var pl3 = new THREE.PointLight(0xa78bfa, 2.4, 18);
    pl3.position.set(-3, 1, 3); galScene.add(pl3);
    // extra rim light from above
    var pl4 = new THREE.PointLight(0x7c3aed, 1.8, 24);
    pl4.position.set(0, 8, 0); galScene.add(pl4);

    // starfield backdrop — multi-color (magenta + cyan accents), denser
    (function starfield() {
      var sc = 2800, sp = new Float32Array(sc*3), sclr = new Float32Array(sc*3), ss = 9001;
      for (var i = 0; i < sc; i++) {
        ss = (ss*1664525+1013904223)&0xffffffff; var u = (ss>>>0)/4294967295;
        ss = (ss*1664525+1013904223)&0xffffffff; var v = (ss>>>0)/4294967295;
        ss = (ss*1664525+1013904223)&0xffffffff; var d = (ss>>>0)/4294967295;
        ss = (ss*1664525+1013904223)&0xffffffff; var cc = (ss>>>0)/4294967295;
        var th = u * Math.PI * 2;
        var ph = Math.acos(2*v - 1);
        var r  = 32 + d * 35;
        sp[i*3]   = r * Math.sin(ph) * Math.cos(th);
        sp[i*3+1] = r * Math.cos(ph);
        sp[i*3+2] = r * Math.sin(ph) * Math.sin(th);
        if (cc < 0.10)      { sclr[i*3]=0.4; sclr[i*3+1]=0.95; sclr[i*3+2]=1.0; } // cyan
        else if (cc < 0.20) { sclr[i*3]=1.0; sclr[i*3+1]=0.45; sclr[i*3+2]=0.85; } // pink
        else                { sclr[i*3]=1;   sclr[i*3+1]=1;    sclr[i*3+2]=1; }
      }
      var sgeo = new THREE.BufferGeometry();
      sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      sgeo.setAttribute('color',    new THREE.BufferAttribute(sclr, 3));
      var smat = new THREE.PointsMaterial({ vertexColors: true, size: 0.16, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
      galScene.add(new THREE.Points(sgeo, smat));
    })();

    // deep background: glowing hex-grid floor (extends vertically as camera descends)
    (function gridFloor() {
      var cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
      var cx = cv.getContext('2d');
      cx.clearRect(0, 0, 512, 512);
      cx.strokeStyle = 'rgba(167,139,250,0.18)'; cx.lineWidth = 1;
      for (var gx = 0; gx < 512; gx += 28) { cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, 512); cx.stroke(); }
      for (var gy = 0; gy < 512; gy += 28) { cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(512, gy); cx.stroke(); }
      var gt = new THREE.CanvasTexture(cv);
      gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(4, 24);
      var gm = new THREE.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
      var gp = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 30, 32, 1, true), gm);
      gp.position.y = -4; galScene.add(gp);
    })();

    // rich nebula background
    function nebPlane(z, hue1, hue2, alpha, ySeed) {
      var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024;
      var cx = cv.getContext('2d');
      var bg = cx.createRadialGradient(512, 512, 60, 512, 512, 580);
      bg.addColorStop(0, hue1);
      bg.addColorStop(0.5, hue2);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = bg; cx.fillRect(0, 0, 1024, 1024);
      for (var k = 0; k < 80; k++) {
        var bx = Math.random()*1024, by = Math.random()*1024;
        var br = 40 + Math.random()*160;
        var rg = cx.createRadialGradient(bx, by, 0, bx, by, br);
        rg.addColorStop(0, 'rgba(220,200,255,' + (0.06 + Math.random()*0.12) + ')');
        rg.addColorStop(1, 'rgba(220,200,255,0)');
        cx.fillStyle = rg; cx.beginPath(); cx.arc(bx, by, br, 0, Math.PI*2); cx.fill();
      }
      var ntex = new THREE.CanvasTexture(cv);
      var nmat = new THREE.MeshBasicMaterial({ map: ntex, transparent: true, opacity: alpha, depthWrite: false, blending: THREE.AdditiveBlending });
      var np = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), nmat);
      np.position.set(0, ySeed || 0, z);
      galScene.add(np);
    }
    // Full 360° nebula sky — large back-sided sphere wraps entire scene
    (function makeNebulaSky() {
      var cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
      var cx = cv.getContext('2d');
      // deep space base
      cx.fillStyle = '#02000f'; cx.fillRect(0, 0, 2048, 1024);
      // large nebula clouds
      var blobs = [
        {x:0.08, y:0.35, r:0.45, c1:'rgba(220,60,140,0.70)',  c2:'rgba(100,30,200,0.0)'},
        {x:0.30, y:0.68, r:0.32, c1:'rgba(0,200,230,0.60)',   c2:'rgba(0,0,0,0)'},
        {x:0.58, y:0.22, r:0.38, c1:'rgba(130,80,255,0.65)',  c2:'rgba(0,0,0,0)'},
        {x:0.78, y:0.72, r:0.34, c1:'rgba(236,72,153,0.58)',  c2:'rgba(60,20,130,0.0)'},
        {x:0.92, y:0.42, r:0.30, c1:'rgba(0,190,220,0.50)',   c2:'rgba(0,0,0,0)'},
        {x:0.18, y:0.82, r:0.26, c1:'rgba(160,120,255,0.55)', c2:'rgba(0,0,0,0)'},
        {x:0.68, y:0.52, r:0.40, c1:'rgba(110,40,220,0.48)',  c2:'rgba(0,0,0,0)'},
        {x:0.48, y:0.12, r:0.28, c1:'rgba(236,72,153,0.45)',  c2:'rgba(0,0,0,0)'},
        {x:0.50, y:0.50, r:0.55, c1:'rgba(80,20,160,0.38)',   c2:'rgba(0,0,0,0)'}
      ];
      blobs.forEach(function(b) {
        var bx = b.x*2048, by = b.y*1024, br = b.r*1024;
        var g = cx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, b.c1); g.addColorStop(1, b.c2);
        cx.fillStyle = g; cx.fillRect(0, 0, 2048, 1024);
      });
      // stars: bright white + colored
      for (var s = 0; s < 3200; s++) {
        var sx = Math.random()*2048, sy = Math.random()*1024;
        var sr = Math.random() < 0.05 ? 2.5 + Math.random()*2 : 0.5 + Math.random()*1.2;
        var sa = 0.5 + Math.random()*0.5;
        var roll = Math.random();
        var sc2 = roll < 0.08 ? 'rgba(120,220,255,'+sa+')' : roll < 0.15 ? 'rgba(255,150,220,'+sa+')' : 'rgba(255,255,255,'+sa+')';
        cx.beginPath(); cx.arc(sx, sy, sr, 0, Math.PI*2);
        cx.fillStyle = sc2; cx.fill();
        // cross-spike on bright stars
        if (sr > 2) {
          cx.strokeStyle = 'rgba(255,255,255,0.3)'; cx.lineWidth = 0.5;
          cx.beginPath(); cx.moveTo(sx-sr*3,sy); cx.lineTo(sx+sr*3,sy); cx.stroke();
          cx.beginPath(); cx.moveTo(sx,sy-sr*3); cx.lineTo(sx,sy+sr*3); cx.stroke();
        }
      }
      var ntex = new THREE.CanvasTexture(cv);
      var nmat = new THREE.MeshBasicMaterial({ map: ntex, side: THREE.BackSide, depthWrite: false });
      galScene.add(new THREE.Mesh(new THREE.SphereGeometry(65, 48, 32), nmat));
    })();
    // background planets
    (function makePlanets() {
      var defs = [
        { pos:[28,-8,-42],  r:5.5, ca:'rgba(124,58,237,1)',  cb:'rgba(30,0,64,1)'  },
        { pos:[-38, 5,-50], r:7.0, ca:'rgba(14,116,144,1)',  cb:'rgba(0,26,34,1)'  },
        { pos:[ 22, 20,-48],r:3.8, ca:'rgba(190,24,93,1)',   cb:'rgba(45,0,24,1)'  }
      ];
      defs.forEach(function(d) {
        var cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
        var cx = cv.getContext('2d');
        var g = cx.createRadialGradient(200, 180, 20, 256, 256, 256);
        g.addColorStop(0,    'rgba(255,255,255,1)');
        g.addColorStop(0.15, d.ca);
        g.addColorStop(0.7,  d.cb);
        g.addColorStop(1,    'rgba(0,0,0,0)');
        cx.fillStyle = g; cx.fillRect(0, 0, 512, 512);
        var ptex = new THREE.CanvasTexture(cv);
        var pmat = new THREE.MeshBasicMaterial({ map: ptex, transparent: true, opacity: 0.82, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        var pm = new THREE.Mesh(new THREE.PlaneGeometry(d.r*2, d.r*2), pmat);
        pm.position.set(d.pos[0], d.pos[1], d.pos[2]);
        pm.lookAt(0, 0, 0);
        galScene.add(pm);
      });
    })();

    galOrbitGroup = null; galPanels = []; galActiveIdx = 0; galLoadedTextures = [];
    galColumnData = null; galParticlesObj = null; galTreeGroup = null;
    buildGalTree(galScene);
    // particle column is centered — no offset needed (already spans -8..+7)
    if (galTreeGroup) {
      galTreeGroup.position.set(0, 0, 0);
      galTreeGroup.scale.set(1, 1, 1);
    }
    var shots = data.shots, pending = shots.length;
    function afterLoad() {
      buildGalOrbit(galScene, shots, galLoadedTextures);
      setGalActive(0);
      requestAnimationFrame(galTick);
    }
    if (pending === 0) { afterLoad(); return; }
    var tld = new THREE.TextureLoader();
    shots.forEach(function(s, i) {
      if (s.label) {
        galLoadedTextures[i] = makeNodeTex(s.label);
        if (--pending <= 0) afterLoad();
      } else {
        tld.load('./assets/screens/' + s.file, function(tex) {
          tex.flipY = true; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
          galLoadedTextures[i] = tex;
          if (--pending <= 0) afterLoad();
        }, undefined, function() {
          galLoadedTextures[i] = makeNodeTex('NO\nIMAGE');
          if (--pending <= 0) afterLoad();
        });
      }
    });
    galCanvas.addEventListener('click',     onGC);
    galCanvas.addEventListener('wheel',     onGWheel, { passive: false });
    galCanvas.addEventListener('touchstart', onGTS, { passive: true });
    galCanvas.addEventListener('touchmove',  onGTM, { passive: false });
    galCanvas.addEventListener('touchend',   onGTE);
    window.addEventListener('resize', onGalResize);
    if (typeof fadeAudio === 'function') fadeAudio(0.18, 0.8);
  }

  function onGalResize() {
    if (!galRenderer) return;
    var w = window.innerWidth, h = window.innerHeight;
    galRenderer.setSize(w, h, false);
    galCamera.aspect = w / h;
    galCamera.updateProjectionMatrix();
  }

  function closeGallery() {
    if (!galleryOpen || !galleryEl) return;
    galleryOpen = false;
    galleryEl.classList.remove('is-open');
    galleryEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    cancelAnimationFrame(galRaf);
    if (galComposer) { galComposer = null; }
    galBloomPass = null;
    if (galRenderer) { galRenderer.dispose(); galRenderer = null; }
    galLoadedTextures.forEach(function(t) { if (t && t.dispose) t.dispose(); });
    galLoadedTextures = []; galPanels = []; galScene = null;
    galCanvas.removeEventListener('click',     onGC);
    galCanvas.removeEventListener('wheel',     onGWheel);
    galCanvas.removeEventListener('touchstart', onGTS);
    galCanvas.removeEventListener('touchmove',  onGTM);
    galCanvas.removeEventListener('touchend',   onGTE);
    window.removeEventListener('resize', onGalResize);
    if (typeof fadeAudio === 'function' && !audioMuted) fadeAudio(0.35, 1.0);
  }

  function onGWheel(e) {
    e.preventDefault();
    var delta = e.deltaY || 0;
    galTargetProg += delta * 0.0025;
    if (galTargetProg < -0.3) galTargetProg = -0.3;
    if (galTargetProg > galMaxProg + 0.3) galTargetProg = galMaxProg + 0.3;
  }
  var galTouchY = 0, galTouchX = 0, galTouchMoved = false;
  function onGTS(e) {
    galTouchY = e.touches[0].clientY;
    galTouchX = e.touches[0].clientX;
    galTouchMoved = false;
  }
  function onGTM(e) {
    if (e.cancelable) e.preventDefault();
    var ty = e.touches[0].clientY;
    var tx = e.touches[0].clientX;
    var dy = galTouchY - ty;
    var dx = galTouchX - tx;
    galTouchMoved = true;
    // horizontal swipe dominant → navigate prev/next panel
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      // handled by touchend snap; update galTouchX only
      galTouchX = tx;
      return;
    }
    galTargetProg += dy * 0.012;
    if (galTargetProg < -0.3) galTargetProg = -0.3;
    if (galTargetProg > galMaxProg + 0.3) galTargetProg = galMaxProg + 0.3;
    galTouchY = ty;
  }
  function onGTE(e) {
    if (e && e.changedTouches && e.changedTouches[0]) {
      var dx = galTouchX - e.changedTouches[0].clientX;
      var dy = galTouchY - e.changedTouches[0].clientY;
      if (galTouchMoved && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        // horizontal swipe: prev or next
        var dir = dx > 0 ? 1 : -1;
        galTargetProg = Math.round(galTargetProg) + dir;
        if (galTargetProg < 0) galTargetProg = 0;
        if (galTargetProg > galMaxProg) galTargetProg = galMaxProg;
        return;
      }
    }
    // snap to nearest
    galTargetProg = Math.round(galTargetProg);
    if (galTargetProg < 0) galTargetProg = 0;
    if (galTargetProg > galMaxProg) galTargetProg = galMaxProg;
  }
  function onGC(e) {
    if (!galCamera || !galPanels.length) return;
    galRaycaster.setFromCamera(new THREE.Vector2((e.clientX/galCanvas.clientWidth)*2-1, -((e.clientY/galCanvas.clientHeight)*2-1)), galCamera);
    var hits = galRaycaster.intersectObjects(galPanels, true);
    for (var hi = 0; hi < hits.length; hi++) {
      var o = hits[hi].object;
      while (o && o.userData.shotIdx === undefined) o = o.parent;
      if (o && o.userData.shotIdx !== undefined) {
        var idx = o.userData.shotIdx;
        // Always rotate to the clicked photo AND open lightbox immediately
        galTargetProg = idx;
        galProg = idx;
        openGalLightbox(galPanels[idx]);
        return;
      }
    }
  }

  // ---- LIGHTBOX ----
  var galLbEl = null;
  function openGalLightbox(panel) {
    var mat = panel.userData.photoMat;
    if (!mat || !mat.map) return;
    var shot = panel.userData.shotData || {};
    if (!galLbEl) {
      galLbEl = document.createElement('div');
      galLbEl.className = 'xp-lb';
      galLbEl.style.cssText = [
        'position:fixed','inset:0','z-index:9999',
        'display:flex','flex-direction:column','align-items:center','justify-content:center',
        'background:rgba(2,0,15,0)',
        '-webkit-backdrop-filter:blur(0px)','backdrop-filter:blur(0px)',
        'transition:background 0.5s ease, -webkit-backdrop-filter 0.5s ease, backdrop-filter 0.5s ease',
        'cursor:zoom-out','padding:40px','box-sizing:border-box','gap:24px'
      ].join(';') + ';';
      galLbEl.innerHTML = [
        '<button class="xp-lb-close" type="button" aria-label="Close" style="position:absolute;top:24px;right:28px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.04);border:1px solid rgba(167,139,250,0.35);border-radius:999px;color:#e8ecf2;cursor:pointer;transition:background 0.2s,border-color 0.2s,transform 0.2s;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        '</button>',
        '<div class="xp-lb-tag" style="font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.3em;color:rgba(196,181,253,0.85);text-transform:uppercase;opacity:0;transform:translateY(-8px);transition:opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s;"></div>',
        '<div class="xp-lb-imgwrap" style="position:relative;max-width:92vw;max-height:74vh;opacity:0;transform:scale(0.92) translateY(18px);transition:transform 0.6s cubic-bezier(.22,1,.36,1),opacity 0.45s ease;">',
          '<img alt="" style="display:block;max-width:92vw;max-height:74vh;border-radius:10px;box-shadow:0 0 0 1px rgba(167,139,250,0.35),0 30px 80px rgba(0,0,0,0.65),0 0 100px rgba(167,139,250,0.35),0 0 200px rgba(236,72,153,0.18);" />',
        '</div>',
        '<div class="xp-lb-caption" style="max-width:720px;text-align:center;opacity:0;transform:translateY(12px);transition:opacity 0.45s ease 0.2s, transform 0.45s ease 0.2s;">',
          '<h4 class="xp-lb-title" style="margin:0 0 6px;font-family:\'Space Grotesk\',sans-serif;font-size:18px;font-weight:500;letter-spacing:0.02em;color:#f5f3ff;"></h4>',
          '<p class="xp-lb-desc" style="margin:0;font-family:\'Space Grotesk\',sans-serif;font-size:13px;line-height:1.55;color:rgba(232,236,242,0.65);"></p>',
        '</div>',
        '<div class="xp-lb-hint" style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);font-family:\'Space Mono\',monospace;font-size:10px;letter-spacing:0.25em;color:rgba(196,181,253,0.5);text-transform:uppercase;opacity:0;transition:opacity 0.5s ease 0.35s;">CLICK ANYWHERE \u00B7 ESC TO CLOSE</div>'
      ].join('');
      document.body.appendChild(galLbEl);
      // Hover effect for close btn
      var closeBtn = galLbEl.querySelector('.xp-lb-close');
      closeBtn.addEventListener('mouseenter', function() {
        closeBtn.style.background = 'rgba(236,72,153,0.18)';
        closeBtn.style.borderColor = 'rgba(236,72,153,0.7)';
        closeBtn.style.transform = 'rotate(90deg)';
      });
      closeBtn.addEventListener('mouseleave', function() {
        closeBtn.style.background = 'rgba(255,255,255,0.04)';
        closeBtn.style.borderColor = 'rgba(167,139,250,0.35)';
        closeBtn.style.transform = 'rotate(0deg)';
      });
      closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeGalLightbox(); });
    }
    var img = galLbEl.querySelector('img');
    var src = mat.map.image && (mat.map.image.src || (mat.map.image.toDataURL && mat.map.image.toDataURL()));
    if (!src) return;
    img.src = src;
    galLbEl.querySelector('.xp-lb-tag').textContent  = shot.tag   || '';
    galLbEl.querySelector('.xp-lb-title').textContent = shot.title || '';
    galLbEl.querySelector('.xp-lb-desc').textContent  = shot.desc  || '';
    galLbEl.style.display = 'flex';
    // reset to start state then animate in
    var wrap = galLbEl.querySelector('.xp-lb-imgwrap');
    var tag = galLbEl.querySelector('.xp-lb-tag');
    var cap = galLbEl.querySelector('.xp-lb-caption');
    var hint = galLbEl.querySelector('.xp-lb-hint');
    wrap.style.opacity = '0'; wrap.style.transform = 'scale(0.92) translateY(18px)';
    tag.style.opacity  = '0'; tag.style.transform  = 'translateY(-8px)';
    cap.style.opacity  = '0'; cap.style.transform  = 'translateY(12px)';
    hint.style.opacity = '0';
    galLbEl.style.background = 'rgba(2,0,15,0)';
    galLbEl.style.backdropFilter = 'blur(0px)';
    galLbEl.style.webkitBackdropFilter = 'blur(0px)';
    requestAnimationFrame(function() {
      galLbEl.style.background = 'rgba(2,0,15,0.82)';
      galLbEl.style.backdropFilter = 'blur(14px)';
      galLbEl.style.webkitBackdropFilter = 'blur(14px)';
      wrap.style.opacity = '1'; wrap.style.transform = 'scale(1) translateY(0)';
      tag.style.opacity  = '1'; tag.style.transform  = 'translateY(0)';
      cap.style.opacity  = '1'; cap.style.transform  = 'translateY(0)';
      hint.style.opacity = '1';
    });
    galLbEl.onclick = function(e) {
      if (e.target.closest('.xp-lb-close')) return;
      closeGalLightbox();
    };
    window.addEventListener('keydown', galLbKeydown);
  }
  function closeGalLightbox() {
    if (!galLbEl) return;
    var wrap = galLbEl.querySelector('.xp-lb-imgwrap');
    var tag  = galLbEl.querySelector('.xp-lb-tag');
    var cap  = galLbEl.querySelector('.xp-lb-caption');
    var hint = galLbEl.querySelector('.xp-lb-hint');
    wrap.style.opacity = '0'; wrap.style.transform = 'scale(0.94) translateY(8px)';
    tag.style.opacity  = '0';
    cap.style.opacity  = '0';
    hint.style.opacity = '0';
    galLbEl.style.background = 'rgba(2,0,15,0)';
    galLbEl.style.backdropFilter = 'blur(0px)';
    galLbEl.style.webkitBackdropFilter = 'blur(0px)';
    setTimeout(function() { if (galLbEl) galLbEl.style.display = 'none'; }, 500);
    window.removeEventListener('keydown', galLbKeydown);
  }
  function galLbKeydown(e) { if (e.key === 'Escape') closeGalLightbox(); }

  if (galleryClose) galleryClose.addEventListener('click', closeGallery);
  window.addEventListener('keydown', function(e) {
    if (!galleryOpen) return;
    if (e.key === 'Escape') { closeGallery(); e.stopImmediatePropagation(); return; }
    if (galPanels.length < 2) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      galTargetProg = Math.min(galMaxProg, Math.round(galTargetProg) + 1);
    }
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft') {
      galTargetProg = Math.max(0, Math.round(galTargetProg) - 1);
    }
  });
  if (galPrevBtn) galPrevBtn.addEventListener('click', function() {
    if (galPanels.length > 1) galTargetProg = Math.max(0, Math.round(galTargetProg) - 1);
  });
  if (galNextBtn) galNextBtn.addEventListener('click', function() {
    if (galPanels.length > 1) galTargetProg = Math.min(galMaxProg, Math.round(galTargetProg) + 1);
  });

  // -----------------------------------------------------------
  // 21. GALLERY TRIGGERS — buttons & heading clicks
  // -----------------------------------------------------------
  var SEC_TO_KEY = { 1: 'ticketing', 2: 'taskcontrol', 3: 'aivoice' };
  document.querySelectorAll('.xp-gal-trigger[data-sec]').forEach(function(btn) {
    var key = SEC_TO_KEY[parseInt(btn.getAttribute('data-sec'), 10)];
    if (key) btn.addEventListener('click', function() { openGallery(key); });
  });
  document.querySelectorAll('.xp-proj-h2').forEach(function(h) {
    var secEl = h.closest('.xp-sec');
    var key = SEC_TO_KEY[secEl ? parseInt(secEl.getAttribute('data-sec'), 10) : -1];
    if (!key) return;
    h.style.cursor = 'pointer';
    h.setAttribute('tabindex', '0');
    h.addEventListener('click', function() { openGallery(key); });
  });

  // clickable 3D screenshots on main stage — raycaster hit-test
  // (canvas has pointer-events:none, so listen on the scroller layer that sits above)
  (function mainStageClick() {
    if (!canvas) return;
    var scroller = document.getElementById('xp-scroller') || document;
    var mainRay = new THREE.Raycaster();
    var lastDown = { x: 0, y: 0, t: 0 };
    function collectPool() {
      var pool = [];
      clusters.forEach(function(g) {
        if (g.userData && g.userData.panels) {
          g.userData.panels.forEach(function(p) { if (p) pool.push(p); });
        }
      });
      return pool;
    }
    function raycast(e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;
      var ny = -((e.clientY / window.innerHeight) * 2 - 1);
      mainRay.setFromCamera(new THREE.Vector2(nx, ny), camera);
      return mainRay.intersectObjects(collectPool(), false);
    }
    function isUI(t) {
      if (!t) return false;
      var el = t;
      while (el && el !== document.body) {
        var cls = el.className || '';
        if (typeof cls === 'string') {
          if (/xp-gal-trigger|xp-enter-btn|xp-cta|xp-link|xp-button|xp-proj-h2|xp-foot/.test(cls)) return true;
        }
        if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'INPUT') return true;
        el = el.parentElement;
      }
      return false;
    }
    document.addEventListener('pointerdown', function(e) {
      lastDown.x = e.clientX; lastDown.y = e.clientY; lastDown.t = Date.now();
    });
    document.addEventListener('pointerup', function(e) {
      if (galleryOpen) return;
      if (isUI(e.target)) return;
      var dx = Math.abs(e.clientX - lastDown.x), dy = Math.abs(e.clientY - lastDown.y);
      var dt = Date.now() - lastDown.t;
      if (dx > 8 || dy > 8 || dt > 600) return;
      var hits = raycast(e);
      if (hits.length) {
        var key = hits[0].object.userData.projectKey;
        if (key) openGallery(key);
      }
    });
    // hover cursor feedback on scroller (where pointer actually lives)
    if (scroller && scroller.addEventListener) {
      scroller.addEventListener('pointermove', function(e) {
        if (galleryOpen) return;
        if (isUI(e.target)) { scroller.style.cursor = ''; return; }
        var hits = raycast(e);
        scroller.style.cursor = hits.length ? 'pointer' : '';
      });
    }
  })();

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
    }, { threshold: 0.05 });
    co.observe(stackSec);
  }

  // -----------------------------------------------------------
  // 23. PROGRESS BAR
  // -----------------------------------------------------------
  (function () {
    var fill = document.getElementById('xp-progress-fill');
    if (!fill) return;
    function updateProgress() {
      var scroller = document.getElementById('xp-scroller');
      if (!scroller) return;
      var maxScroll = scroller.scrollHeight - scroller.clientHeight;
      if (maxScroll <= 0) { fill.style.width = '0%'; return; }
      fill.style.width = Math.min(100, (scroller.scrollTop / maxScroll) * 100) + '%';
    }
    var scroller = document.getElementById('xp-scroller');
    if (scroller) scroller.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  })();

  // -----------------------------------------------------------
  // 24. LIVE CLOCK (Warsaw time)
  // -----------------------------------------------------------
  (function () {
    var clockEl = document.getElementById('xp-clock');
    if (!clockEl) return;
    var blinkOn = true;
    function updateClock() {
      var now = new Date();
      var h = now.toLocaleString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', hour12: false });
      var m = now.toLocaleString('en-GB', { timeZone: 'Europe/Warsaw', minute: '2-digit' });
      blinkOn = !blinkOn;
      clockEl.textContent = h + (blinkOn ? ':' : '\u2009') + m + ' WA';
    }
    updateClock();
    setInterval(updateClock, 500);
  })();

  // -----------------------------------------------------------
  // 25. BACK TO TOP BUTTON
  // -----------------------------------------------------------
  (function () {
    var btn = document.getElementById('xp-back-top');
    if (!btn) return;
    var scroller = document.getElementById('xp-scroller');
    function checkShow() {
      if (!scroller) return;
      btn.classList.toggle('xp-back-top--visible', scroller.scrollTop > 300);
    }
    if (scroller) scroller.addEventListener('scroll', checkShow, { passive: true });
    btn.addEventListener('click', function () {
      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // -----------------------------------------------------------
  // 26. ANIMATED STAT COUNTERS (project sections)
  // -----------------------------------------------------------
  (function () {
    var stats = document.querySelectorAll('#xp-scroller .xp-stat-n');
    if (!stats.length || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var raw = el.textContent.trim();
        var num = parseInt(raw, 10);
        if (isNaN(num) || num <= 0 || num > 9999) return;
        observer.unobserve(el);
        var start = 0;
        var duration = 900;
        var startTime = performance.now();
        function step(now) {
          var elapsed = now - startTime;
          var progress = Math.min(1, elapsed / duration);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = String(Math.round(start + (num - start) * eased));
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = String(num);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { observer.observe(el); });
  })();

  // -----------------------------------------------------------
  // 27. KONAMI CODE
  // -----------------------------------------------------------
  (function () {
    var seq = [38,38,40,40,37,39,37,39,66,65];
    var pos = 0;
    var overlay = document.getElementById('xp-konami-overlay');
    if (!overlay) return;
    var timer = null;
    document.addEventListener('keydown', function (e) {
      if (e.keyCode === seq[pos]) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          overlay.removeAttribute('aria-hidden');
          overlay.classList.add('xp-konami--active');
          document.body.classList.add('xp-konami-active');
          clearTimeout(timer);
          timer = setTimeout(function () {
            overlay.setAttribute('aria-hidden', 'true');
            overlay.classList.remove('xp-konami--active');
            document.body.classList.remove('xp-konami-active');
          }, 4000);
        }
      } else {
        pos = 0;
      }
    });
  })();

  // -----------------------------------------------------------
  // 28. UFO EASTER EGG
  // -----------------------------------------------------------
  (function () {
    var UFO_FACTS = [
      'This system processed over 148,000 fake guest names before 9am.',
      'The QR scanner was once triggered by a cat photo. It worked.',
      'One admin accidentally sent 11,000 Telegram notifications at 3am.',
      'The database once had 7 different spellings of "Rotterdam".',
      'Vladyslav\u2019s first production deploy was at 04:37. It worked first try.',
      'This portfolio was built during 3 separate power outages.',
      'Dmitry Ganj once approved a feature via voice message from a boat.',
      'The AI voice bot once booked a reservation for a dog named Boris.',
      'Total lines of code: somewhere between 40,000 and way too many.',
      'The ticketing system once scanned the same QR 73 times in 2 minutes.'
    ];

    // Build UFO mesh
    var ufoGroup = new THREE.Group();

    // Disc body
    var discGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.28, 32);
    var discMat = new THREE.MeshBasicMaterial({ color: 0xb8a4f0, wireframe: false });
    var disc = new THREE.Mesh(discGeo, discMat);
    ufoGroup.add(disc);

    // Dome
    var domeGeo = new THREE.SphereGeometry(0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var domeMat = new THREE.MeshBasicMaterial({ color: 0xe2d9ff, transparent: true, opacity: 0.6 });
    var dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.14;
    ufoGroup.add(dome);

    // Glow ring
    var ringGeo = new THREE.TorusGeometry(1.18, 0.07, 8, 40);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.85 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = -0.12;
    ufoGroup.add(ring);

    // Bottom lights
    var lightColors = [0xff8aff, 0x88f8ff, 0xffed6f, 0xa78bfa, 0xff8aff, 0x88f8ff, 0xffed6f, 0xa78bfa];
    var ufoLights = [];
    for (var li = 0; li < 8; li++) {
      var lGeo = new THREE.SphereGeometry(0.1, 8, 8);
      var lMat = new THREE.MeshBasicMaterial({ color: lightColors[li], transparent: true, opacity: 0.9 });
      var lMesh = new THREE.Mesh(lGeo, lMat);
      var angle = (li / 8) * Math.PI * 2;
      lMesh.position.set(Math.cos(angle) * 0.85, -0.18, Math.sin(angle) * 0.85);
      ufoGroup.add(lMesh);
      ufoLights.push({ mesh: lMesh, mat: lMat });
    }

    ufoGroup.visible = false;
    ufoGroup.scale.setScalar(0.85);
    scene.add(ufoGroup);

    // UFO flight state machine
    var ufoState = 'idle'; // idle | flying | done
    var ufoPhase = 0;      // 0..1 along arc
    var ufoTimer = 0;      // seconds until next flight
    var ufoNextDelay = 8 + Math.random() * 7;
    var ufoStart = new THREE.Vector3(-14, 1 + Math.random() * 2, -6);
    var ufoEnd   = new THREE.Vector3( 14, 0 + Math.random() * 2, -8);
    var ufoClicked = false;

    // Breach overlay
    var breachEl = document.getElementById('xp-ufo-breach');
    var factEl   = document.getElementById('xp-ufo-fact');
    var closeBtn = document.getElementById('xp-ufo-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        breachEl.setAttribute('aria-hidden', 'true');
        breachEl.classList.remove('xp-ufo-breach--active');
      });
    }

    function showBreach() {
      if (!breachEl || !factEl) return;
      factEl.textContent = UFO_FACTS[Math.floor(Math.random() * UFO_FACTS.length)];
      breachEl.removeAttribute('aria-hidden');
      breachEl.classList.add('xp-ufo-breach--active');
    }

    function resetUFO() {
      var cy = camY || 0;
      ufoStart.set(-14, cy + 1 + Math.random() * 2, -5 - Math.random() * 3);
      ufoEnd.set(  14, cy + 0.5 + Math.random() * 2, -5 - Math.random() * 3);
      if (Math.random() > 0.5) {
        var tmp = ufoStart.clone(); ufoStart.copy(ufoEnd); ufoEnd.copy(tmp);
      }
      ufoPhase = 0;
      ufoClicked = false;
    }

    // Click/tap anywhere when UFO is flying
    document.addEventListener('click', function () {
      if (ufoState === 'flying' && !ufoClicked) {
        ufoClicked = true;
        showBreach();
      }
    });

    sceneRefs.ufoAnimate = function (dt) {
      if (!dt || dt > 0.1) dt = 0.016;
      ufoTimer += dt;

      if (ufoState === 'idle') {
        if (ufoTimer >= ufoNextDelay) {
          ufoState = 'flying';
          ufoTimer = 0;
          resetUFO();
          ufoGroup.visible = true;
        }
        return;
      }

      if (ufoState === 'flying') {
        ufoPhase += dt * 0.12;
        if (ufoPhase >= 1) {
          ufoPhase = 1;
          ufoState = 'done';
          ufoGroup.visible = false;
          ufoNextDelay = 10 + Math.random() * 10;
          ufoTimer = 0;
        }

        // Lerp position along arc with slight sine bob
        ufoGroup.position.lerpVectors(ufoStart, ufoEnd, ufoPhase);
        ufoGroup.position.y += Math.sin(ufoPhase * Math.PI) * 1.8;

        // Rotate disc
        disc.rotation.y += dt * 1.2;
        ring.rotation.z += dt * 2.0;

        // Pulse lights
        var lt = performance.now() * 0.003;
        ufoLights.forEach(function (l, i) {
          l.mat.opacity = 0.5 + 0.5 * Math.abs(Math.sin(lt * 3 + i * 0.7));
        });

        // Face direction of travel
        var dir = new THREE.Vector3().subVectors(ufoEnd, ufoStart).normalize();
        ufoGroup.lookAt(ufoGroup.position.clone().add(dir));
      }

      if (ufoState === 'done') {
        ufoState = 'idle';
      }
    };
  })();

  // -----------------------------------------------------------
  // 29. CLICK BURST PARTICLES
  // -----------------------------------------------------------
  (function () {
    var BURST_COUNT = 60;
    var burstGeo = new THREE.BufferGeometry();
    var positions = new Float32Array(BURST_COUNT * 3);
    var velocities = [];
    var burstActive = false;
    var burstT = 0;

    for (var i = 0; i < BURST_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      ));
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var burstMat = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.06,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var burstPoints = new THREE.Points(burstGeo, burstMat);
    scene.add(burstPoints);

    function spawnBurst(worldPos) {
      burstActive = true;
      burstT = 0;
      var pos = burstGeo.attributes.position.array;
      for (var i = 0; i < BURST_COUNT; i++) {
        pos[i * 3]     = worldPos.x;
        pos[i * 3 + 1] = worldPos.y;
        pos[i * 3 + 2] = worldPos.z;
        velocities[i].set(
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4
        );
      }
      burstGeo.attributes.position.needsUpdate = true;
      burstMat.opacity = 1;
    }

    sceneRefs.clickBurstsUpdate = function (t) {
      if (!burstActive) return;
      burstT += 0.025;
      if (burstT >= 1) {
        burstActive = false;
        burstMat.opacity = 0;
        return;
      }
      var fade = 1 - burstT;
      burstMat.opacity = fade * 0.9;
      var pos = burstGeo.attributes.position.array;
      for (var i = 0; i < BURST_COUNT; i++) {
        pos[i * 3]     += velocities[i].x * 0.018;
        pos[i * 3 + 1] += velocities[i].y * 0.018;
        pos[i * 3 + 2] += velocities[i].z * 0.018;
      }
      burstGeo.attributes.position.needsUpdate = true;
    };

    // Raycaster for world-pos click (desktop only)
    if (!IS_MOBILE) {
      var canvasEl = document.getElementById('xp-canvas');
      var raycasterB = new THREE.Raycaster();
      var planeB = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      if (canvasEl) {
        canvasEl.addEventListener('click', function (e) {
          // Skip if clicking a UI element
          if (e.target !== canvasEl) return;
          var mx = (e.clientX / window.innerWidth)  *  2 - 1;
          var my = (e.clientY / window.innerHeight) * -2 + 1;
          raycasterB.setFromCamera({ x: mx, y: my }, camera);
          var hitPt = new THREE.Vector3();
          raycasterB.ray.intersectPlane(planeB, hitPt);
          spawnBurst(hitPt);
        });
      }
    }
  })();

  // -----------------------------------------------------------
  // 30. TILT PARALLAX (mobile DeviceOrientation)
  // -----------------------------------------------------------
  (function () {
    if (!IS_MOBILE) return;
    var tiltEnabled = false;
    function onOrient(e) {
      if (!sceneRefs.stars) return;
      var beta  = (e.beta  || 0) / 90;  // -1..1
      var gamma = (e.gamma || 0) / 90;  // -1..1
      sceneRefs.stars.rotation.x = beta  * 0.15;
      sceneRefs.stars.rotation.z = gamma * 0.15;
    }
    function requestPerm() {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(function (state) {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', onOrient, { passive: true });
              tiltEnabled = true;
            }
          }).catch(function () {});
      } else {
        window.addEventListener('deviceorientation', onOrient, { passive: true });
        tiltEnabled = true;
      }
    }
    // Request on first touch
    document.addEventListener('touchstart', function tryTilt() {
      if (!tiltEnabled) requestPerm();
      document.removeEventListener('touchstart', tryTilt);
    }, { passive: true, once: true });
  })();

})();
