/* =============================================================
   /3D MODE вЂ” Immersive scroll experience runtime
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
  //   0 в†’ Hero (abstract orbit shapes)
  //   1 в†’ Ticketing      (cluster A)
  //   2 в†’ Task Control   (cluster B)
  //   3 в†’ AI Voice       (waveform cluster C)
  //   4 в†’ Stack          (formation: panels arrange into grid)
  //   5 в†’ Connect        (panels orbit around center)

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
      images: []  // procedural only вЂ” no screenshots available
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
        // tex sample вЂ” textures use flipY=true so sample uv directly
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
        uEnergy: { value: 0 }    // 0..1 вЂ” how active this cluster is (driven by scroll)
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
  // 9. Project clusters вЂ” placed at section Y positions
  // -----------------------------------------------------------
  // Layout strategy:
  //   sectionIdx 1 (Ticketing):    Y = -STOP_GAP   (we move camera DOWN in -Y as we scroll)
  //   sectionIdx 2 (Task Control): Y = -2*STOP_GAP
  //   sectionIdx 3 (AI Voice):     Y = -3*STOP_GAP
  //   sectionIdx 4 (Stack):        Y = -4*STOP_GAP вЂ” formation
  //   sectionIdx 5 (Connect):      Y = -5*STOP_GAP вЂ” orbit

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

    // For procedural-only project (AI Voice вЂ” no images): build abstract panels with gradient texture
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
    ctx.fillText('AI В· VOICE', 256, 160);
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
    var XS = [0, -1.4, 1.4, -1.4, 0, 0];   // mirror of cluster x (cluster x = В±3.2, push camera slightly toward them)
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
      // proximity 0 (right on cluster) в†’ 1.0 reveal, 1+ в†’ 0 reveal
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
  // 16. Audio вЂ” WebAudio synthesized ambient drone (no network)
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
  // 17. Boot в†’ Enter
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
  // 20. PROJECT GALLERY вЂ” 3D orbit scene with procedural tree
  // -----------------------------------------------------------
  var GALLERY_DATA = {
    ticketing: {
      eyebrowNum: '/ 01',
      title: 'Event Ticketing & QR Access',
      sub: 'Full-cycle platform вЂ” QR generation, scanner-safe access, admin control, analytics and live maps. 75 clubs, 22 countries.',
      meta: [['75','Clubs'],['22','Countries'],['E2E','Full-stack']],
      shots: [
        { file: 'ticketing-dashboard.jpg',         tag: '01 / OPERATIONS', title: 'Operations dashboard',  desc: 'Top-level view of issuance, scanner load, anomalies and venue health.' },
        { file: 'ticketing-analytics-overview.jpg', tag: '02 / ANALYTICS',  title: 'Analytics overview',   desc: 'Cross-venue rollups, conversion funnels, time-of-day patterns.' },
        { file: 'ticketing-charts.jpg',             tag: '03 / CHARTS',     title: 'Detailed charts',      desc: 'Per-event series вЂ” entries, scans, no-shows вЂ” with comparable baselines.' },
        { file: 'ticketing-map.jpg',                tag: '04 / GEO LAYER',  title: 'Live geographic map',  desc: 'Country and city distribution; quick context switching across markets.' },
        { file: 'ticketing-search.jpg',             tag: '05 / SEARCH',     title: 'Cross-event search',   desc: 'Find any guest, ticket or order across the entire venue network.' },
        { file: 'ticketing-segmentation.jpg',       tag: '06 / SEGMENTS',   title: 'Segmentation',         desc: 'Filter and group by audience traits to inform marketing decisions.' },
        { file: 'scanner.jpg',                      tag: '07 / SCANNER',    title: 'Scanner surface',      desc: 'Door-side scan UX вЂ” isolated from backoffice so it never blocks entry.' }
      ]
    },
    taskcontrol: {
      eyebrowNum: '/ 02',
      title: 'Task Control & Team Ops',
      sub: 'Operational layer for recurring event work вЂ” roles, tasks, archives and synced state across mobile and desktop.',
      meta: [['5+','Role layers'],['в€ћ','Events'],['1','Unified ops']],
      shots: [
        { file: 'task-control-dashboard.jpg',    tag: '01 / OVERVIEW',    title: 'Operations dashboard', desc: 'Daily situational view: load, status, attention and outliers.' },
        { file: 'task-control-events-board.jpg', tag: '02 / EVENTS',      title: 'Events board',         desc: 'Active and upcoming events with state, ownership and progress.' },
        { file: 'task-control-tasks.jpg',        tag: '03 / TASKS',       title: 'Task pipeline',        desc: 'Concrete deliverables вЂ” assignment, deadline, status, notes.' },
        { file: 'task-control-events-list.jpg',  tag: '04 / EVENT LIST',  title: 'Event list',           desc: 'Searchable directory with filters by venue, type and time.' },
        { file: 'task-control-users.jpg',        tag: '05 / ROLES',       title: 'Team & roles',         desc: 'User registry вЂ” roles, scopes, access boundaries.' },
        { file: 'task-control-archive.jpg',      tag: '06 / ARCHIVE',     title: 'Archive view',         desc: 'Historic event data вЂ” searchable, exportable, audit-friendly.' },
        { file: 'task-control-bot-settings.jpg', tag: '07 / AUTOMATION',  title: 'Bot settings',         desc: 'Notification rules, automation triggers, sync targets.' }
      ]
    },
    aivoice: {
      eyebrowNum: '/ 03',
      title: 'AI Voice Auto-Responder',
      sub: 'Inbound voice automation вЂ” parser + cached venue state + business rules + operator fallbacks, live 24/7.',
      meta: [['24/7','Answering'],['~1s','Cache hit'],['Live','Venue sync']],
      shots: [
        { label: 'VOICE\nPARSER',    tag: '01 / PARSER',    title: 'Natural language parser',  desc: 'Intent detection and entity extraction from inbound call transcripts in real time.' },
        { label: 'VENUE\nCACHE',     tag: '02 / CACHE',     title: 'Venue cache layer',        desc: 'Events, capacity and schedule pre-loaded so answers are grounded in current state.' },
        { label: 'BUSINESS\nRULES',  tag: '03 / RULES',     title: 'Rules engine',             desc: 'Configurable matrix: closed venues, sold-out events, VIP routing, special cases.' },
        { label: 'OPERATOR\nFALLBK', tag: '04 / FALLBACK',  title: 'Operator hand-off',       desc: 'Graceful fallback when confidence is low вЂ” routes to human with full context.' },
        { label: '24/7\nACTIVE',     tag: '05 / UPTIME',    title: '24/7 availability',        desc: 'Always-on. No shift gaps, no fatigue вЂ” handles call surges without queue saturation.' },
        { label: 'BOOKING\nSYNC',    tag: '06 / BOOKING',   title: 'Live booking sync',        desc: 'Real-time availability checks and reservation confirmations via ticketing API.' },
        { label: 'CALL\nANALYTICS', tag: '07 / ANALYTICS', title: 'Call analytics',           desc: 'Intent logs, resolution rate, fallback frequency вЂ” full visibility into voice traffic.' }
      ]
    }
  };

  // gallery 3D state
  var galScene, galRenderer, galCamera, galRaf;
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
  var galFrameTag   = document.getElementById('xp-gal-frame-tag');
  var galFrameTitle = document.getElementById('xp-gal-frame-title');
  var galFrameDesc  = document.getElementById('xp-gal-frame-desc');
  var galPrevBtn    = document.getElementById('xp-gal-prev');
  var galNextBtn    = document.getElementById('xp-gal-next');

  // --- procedural glowing tree ---
  function buildGalTree(sc) {
    var g = new THREE.Group();
    var seed = 7;
    function rnd() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 4294967295; }

    function seg(a, b, r, op) {
      var m1 = a.clone().lerp(b, 0.33).addScaledVector(new THREE.Vector3(rnd()-0.5, 0, rnd()-0.5), r * 5);
      var m2 = a.clone().lerp(b, 0.66).addScaledVector(new THREE.Vector3(rnd()-0.5, 0, rnd()-0.5), r * 5);
      var crv = new THREE.CatmullRomCurve3([a, m1, m2, b]);
      var geo = new THREE.TubeGeometry(crv, 8, r, 6, false);
      var mat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: op !== undefined ? op : Math.min(0.88, 0.15 + r * 12), blending: THREE.AdditiveBlending, depthWrite: false });
      g.add(new THREE.Mesh(geo, mat));
      var tg = new THREE.Mesh(new THREE.SphereGeometry(r * 2.8, 7, 7), new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      tg.position.copy(b); g.add(tg);
    }

    function grow(start, dir, len, r, depth) {
      if (depth < 0 || r < 0.003) return;
      var end = start.clone().addScaledVector(dir, len);
      seg(start, end, r);
      var kids = depth >= 3 ? 3 : 2;
      for (var k = 0; k < kids; k++) {
        var nd = new THREE.Vector3(dir.x + (rnd()-0.5)*0.95, dir.y + rnd()*0.28 + 0.05, dir.z + (rnd()-0.5)*0.95).normalize();
        grow(end, nd, len * 0.62, r * 0.58, depth - 1);
      }
    }

    grow(new THREE.Vector3(0, -1.6, 0), new THREE.Vector3(0, 1, 0), 0.88, 0.058, 4);

    // long vertical trunk going DOWN through the helix (tree extends deep)
    var trunkBottomY = -14; // covers up to ~9 helix steps
    var trunkSegs = 12;
    for (var ti = 0; ti < trunkSegs; ti++) {
      var ya = -1.6 + (trunkBottomY + 1.6) * (ti / trunkSegs);
      var yb = -1.6 + (trunkBottomY + 1.6) * ((ti + 1) / trunkSegs);
      var ro = 0.052 * (1 - ti / (trunkSegs + 2));
      seg(new THREE.Vector3((rnd()-0.5)*0.12, ya, (rnd()-0.5)*0.12),
          new THREE.Vector3((rnd()-0.5)*0.18, yb, (rnd()-0.5)*0.18), Math.max(0.012, ro), 0.7);
    }
    // side branches at multiple depths (every ~1.5 units)
    for (var by = -2.2; by > trunkBottomY + 1; by -= 1.5) {
      var bn = 4 + Math.floor(rnd() * 3);
      for (var bi2 = 0; bi2 < bn; bi2++) {
        var bang = rnd() * Math.PI * 2;
        var blen = 0.5 + rnd() * 0.7;
        var endY = by + (rnd() - 0.5) * 0.6;
        seg(new THREE.Vector3(0, by, 0),
            new THREE.Vector3(Math.sin(bang)*blen, endY, Math.cos(bang)*blen),
            0.011 + rnd()*0.008, 0.55);
        // tiny sub-tip
        var sub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        sub.position.set(Math.sin(bang)*blen*1.05, endY, Math.cos(bang)*blen*1.05);
        g.add(sub);
      }
    }

    // root tendrils
    for (var ri = 0; ri < 6; ri++) {
      var ra = (ri / 6) * Math.PI * 2;
      seg(new THREE.Vector3(Math.sin(ra)*0.35, -1.45, Math.cos(ra)*0.35),
          new THREE.Vector3(Math.sin(ra)*0.70, -1.90, Math.cos(ra)*0.70), 0.013, 0.45);
    }

    // core + outer glow
    var coreM = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false });
    var core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), coreM);
    core.position.y = -1.6; g.add(core);
    var outerM = new THREE.MeshBasicMaterial({ color: 0x6d28d9, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide });
    var outer = new THREE.Mesh(new THREE.SphereGeometry(0.48, 14, 14), outerM);
    outer.position.y = -1.6; g.add(outer);
    var topM = new THREE.MeshBasicMaterial({ color: 0x4c1d95, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide });
    var topGlow = new THREE.Mesh(new THREE.SphereGeometry(1.45, 14, 14), topM);
    topGlow.position.y = 0.4; g.add(topGlow);

    // particle cloud — distributed along the whole vertical column
    var pCount = 1200, pp = new Float32Array(pCount * 3), ps = 31337;
    for (var pi = 0; pi < pCount; pi++) {
      ps = (ps*1664525+1013904223)&0xffffffff; var rv = (ps>>>0)/4294967295;
      ps = (ps*1664525+1013904223)&0xffffffff; var ph = (ps>>>0)/4294967295*Math.PI*2;
      ps = (ps*1664525+1013904223)&0xffffffff; var yv = (ps>>>0)/4294967295;
      var rad = 0.4 + rv * 3.2;
      pp[pi*3]   = rad*Math.cos(ph);
      pp[pi*3+1] = -14 + yv * 16; // spread from -14 up to +2
      pp[pi*3+2] = rad*Math.sin(ph);
    }
    var pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    galParticlesObj = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0x8b5cf6, size: 0.014, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(galParticlesObj);
    sc.add(g);
    galTreeGroup = g;
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
    cx.fillText('MODULE · ACTIVE', 36, 43);
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
    cx.fillText('CH·01 · 48kHz · 16b', W - 40, H - 24);
    // scanline overlay
    cx.fillStyle = 'rgba(255,255,255,0.018)';
    for (var sl = 0; sl < H; sl += 3) { cx.fillRect(0, sl, W, 1); }
    var t = new THREE.CanvasTexture(cv); t.flipY = true; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    return t;
  }

  // build RING of cards orbiting around the tree
  var galStepProg = 1;
  var galTargetProg = 0;
  var galProg = 0;
  var galMaxProg = 0;
  var galRingRadius = 3.6;     // distance from tree center
  var galViewSlot = new THREE.Vector3(2.0, 0.5, 2.6); // active card pulled out toward camera/right
  // legacy holdovers
  var galHelixStep = 1;
  var galHelixRadius = 0;
  var galTargetY = 0;
  var galCameraY = 0;
  var galMaxScroll = 0;
  function buildGalOrbit(sc, shots, textures) {
    var og = new THREE.Group();
    var n = shots.length;
    galMaxProg = n - 1;
    shots.forEach(function(s, i) {
      var mat = new THREE.MeshBasicMaterial({ map: textures[i], transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false });
      var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), mat);
      var gm = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      var gmesh = new THREE.Mesh(new THREE.PlaneGeometry(2.65, 1.74), gm);
      gmesh.position.z = -0.015;
      mesh.add(gmesh);
      var frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.42, 1.52));
      var frameMat = new THREE.LineBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0 });
      var frame = new THREE.LineSegments(frameGeo, frameMat);
      frame.position.z = 0.005;
      mesh.add(frame);
      mesh.userData.glowMat = gm;
      mesh.userData.frameMat = frameMat;
      mesh.userData.shotIdx = i;
      mesh.userData.shotData = s;
      mesh.userData.baseAngle = (i / n) * Math.PI * 2;
      og.add(mesh);
    });
    sc.add(og);
    galOrbitGroup = og;
    galPanels = og.children.slice();
  }

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
    if (galChip) galChip.textContent = String(idx+1).padStart(2,'0') + ' / ' + String(n).padStart(2,'0');
  }

  var galRaycaster = new THREE.Raycaster();

  function galTick() {
    if (!galScene || !galRenderer) return;
    galRaf = requestAnimationFrame(galTick);
    var w = Math.max(1, galCanvas.clientWidth), h = Math.max(1, galCanvas.clientHeight);
    if (galRenderer.domElement.width !== w || galRenderer.domElement.height !== h) {
      galRenderer.setSize(w, h, false);
      galCamera.aspect = w / h;
      galCamera.updateProjectionMatrix();
    }
    galProg += (galTargetProg - galProg) * 0.085;
    // camera fixed — offset to LEFT so tree stays center-left, viewing slot on the right
    if (galCamera) {
      galCamera.position.set(-1.4, 1.0, 6.4);
      galCamera.lookAt(0.6, 0.2, 0);
    }
    // tree gently sways with scroll
    if (galTreeGroup) {
      galTreeGroup.rotation.y = galProg * 0.18;
      if (galParticlesObj) galParticlesObj.rotation.y = -galProg * 0.10;
    }
    // arrange cards on a ring around tree; rotate ring so active card swings into front slot
    var n = galPanels.length;
    if (n > 0) {
      var active = Math.round(galProg);
      if (active < 0) active = 0; if (active > n-1) active = n-1;
      setGalActive(active);
      var slotAngle = 0;            // angle 0 = +X side (front-right of tree)
      var step = (Math.PI * 2) / n;
      for (var pi = 0; pi < n; pi++) {
        var p = galPanels[pi];
        // current angle relative to slot
        var rel = pi - galProg;
        // wrap to nearest path
        while (rel >  n/2) rel -= n;
        while (rel < -n/2) rel += n;
        var ang = slotAngle + rel * step;
        // ring position
        var rx = Math.cos(ang) * galRingRadius;
        var rz = Math.sin(ang) * galRingRadius;
        var ry = 0.5 + Math.sin(rel * 0.7) * 0.15;
        // proximity to slot (0 = active)
        var ar = Math.abs(rel);
        // when active, pull OUT of ring toward viewing slot
        var pullT = Math.max(0, 1 - ar * 1.4); // 1 at active, 0 by ~0.7 away
        var tx = rx + (galViewSlot.x - rx) * pullT;
        var ty = ry + (galViewSlot.y - ry) * pullT;
        var tz = rz + (galViewSlot.z - rz) * pullT;
        // facing
        var faceTargetX, faceTargetZ;
        if (pullT > 0.5) {
          // active card faces camera
          faceTargetX = galCamera.position.x;
          faceTargetZ = galCamera.position.z;
        } else {
          // non-active faces tree center (so back is to outside)
          faceTargetX = 0;
          faceTargetZ = 0;
        }
        // lerp position
        p.position.x += (tx - p.position.x) * 0.09;
        p.position.y += (ty - p.position.y) * 0.09;
        p.position.z += (tz - p.position.z) * 0.09;
        // compute target yaw to face target
        var dx = faceTargetX - p.position.x;
        var dz = faceTargetZ - p.position.z;
        var tyaw = Math.atan2(dx, dz);
        // lerp yaw shortest way
        var curYaw = p.rotation.y;
        var diff = tyaw - curYaw;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        p.rotation.y += diff * 0.10;
        // scale & opacity
        var ts = 0.7 + pullT * 0.45;
        p.scale.x += (ts - p.scale.x) * 0.10;
        p.scale.y += (ts - p.scale.y) * 0.10;
        var top = 0.25 + pullT * 0.75;
        // hide cards on the FAR side of the ring (behind tree from camera) more aggressively
        if (rz < -1.5 && pullT < 0.3) top *= 0.35;
        if (p.material)          p.material.opacity          += (top - p.material.opacity) * 0.10;
        if (p.userData.frameMat) p.userData.frameMat.opacity += (top * 0.7 - p.userData.frameMat.opacity) * 0.10;
        if (p.userData.glowMat) {
          var tg = pullT > 0.6 ? 0.30 * (pullT - 0.6) / 0.4 : 0;
          p.userData.glowMat.opacity += (tg - p.userData.glowMat.opacity) * 0.10;
        }
        p.renderOrder = pullT * 10 + (5 - rz);
      }
    }
    galRenderer.render(galScene, galCamera);
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
    var w = window.innerWidth, h = window.innerHeight;
    galScene = new THREE.Scene();
    galCamera = new THREE.PerspectiveCamera(48, w/h, 0.1, 200);
    galTargetProg = 0; galProg = 0;
    galCamera.position.set(-1.4, 1.0, 6.4);
    galCamera.lookAt(0.6, 0.2, 0);
    galRenderer = new THREE.WebGLRenderer({ canvas: galCanvas, antialias: true, alpha: true });
    galRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    galRenderer.setSize(w, h, false);
    galRenderer.setClearColor(0x000000, 0);
    galScene.fog = new THREE.FogExp2(0x04030a, 0.038);
    galScene.add(new THREE.AmbientLight(0xa78bfa, 0.45));
    var pl = new THREE.PointLight(0x7c3aed, 2.8, 16);
    pl.position.set(0, 2.5, 4); galScene.add(pl);
    var pl2 = new THREE.PointLight(0x4c1d95, 2.0, 14);
    pl2.position.set(0, -3, 2); galScene.add(pl2);
    var pl3 = new THREE.PointLight(0xc4b5fd, 1.4, 10);
    pl3.position.set(3, 0.5, 3.5); galScene.add(pl3);

    // starfield backdrop (far)
    (function starfield() {
      var sc = 1400, sp = new Float32Array(sc*3), ss = 9001;
      for (var i = 0; i < sc; i++) {
        ss = (ss*1664525+1013904223)&0xffffffff; var u = (ss>>>0)/4294967295;
        ss = (ss*1664525+1013904223)&0xffffffff; var v = (ss>>>0)/4294967295;
        ss = (ss*1664525+1013904223)&0xffffffff; var d = (ss>>>0)/4294967295;
        var th = u * Math.PI * 2;
        var ph = Math.acos(2*v - 1);
        var r  = 35 + d * 25;
        sp[i*3]   = r * Math.sin(ph) * Math.cos(th);
        sp[i*3+1] = r * Math.cos(ph);
        sp[i*3+2] = r * Math.sin(ph) * Math.sin(th);
      }
      var sgeo = new THREE.BufferGeometry();
      sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      var smat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
      galScene.add(new THREE.Points(sgeo, smat));
    })();

    // nebula plane far behind
    (function nebula() {
      var cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024;
      var cx = cv.getContext('2d');
      var bg = cx.createRadialGradient(512, 512, 80, 512, 512, 600);
      bg.addColorStop(0, 'rgba(167,139,250,0.55)');
      bg.addColorStop(0.35, 'rgba(124,58,237,0.30)');
      bg.addColorStop(0.7, 'rgba(76,29,149,0.12)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = bg; cx.fillRect(0, 0, 1024, 1024);
      // noisy blobs
      for (var k = 0; k < 80; k++) {
        var bx = Math.random()*1024, by = Math.random()*1024;
        var br = 30 + Math.random()*120;
        var rg = cx.createRadialGradient(bx, by, 0, bx, by, br);
        rg.addColorStop(0, 'rgba(196,181,253,' + (0.08 + Math.random()*0.10) + ')');
        rg.addColorStop(1, 'rgba(196,181,253,0)');
        cx.fillStyle = rg; cx.beginPath(); cx.arc(bx, by, br, 0, Math.PI*2); cx.fill();
      }
      var ntex = new THREE.CanvasTexture(cv);
      var nmat = new THREE.MeshBasicMaterial({ map: ntex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
      var np = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), nmat);
      np.position.set(0, 0, -14);
      galScene.add(np);
    })();

    // distant grid floor (faint horizon)
    (function gridFloor() {
      var g = new THREE.GridHelper(40, 40, 0x4c1d95, 0x2a1b4d);
      g.material.transparent = true; g.material.opacity = 0.18;
      g.position.y = -3.5;
      galScene.add(g);
    })();

    galOrbitGroup = null; galPanels = []; galActiveIdx = 0; galLoadedTextures = [];
    buildGalTree(galScene);
    // tree stays BIG and centered — the showpiece
    if (galTreeGroup) {
      galTreeGroup.position.set(0, 0, 0);
      galTreeGroup.scale.set(1.15, 1.15, 1.15);
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
  var galTouchY = 0;
  function onGTS(e) { galTouchY = e.touches[0].clientY; }
  function onGTM(e) {
    if (e.cancelable) e.preventDefault();
    var ty = e.touches[0].clientY;
    var dy = galTouchY - ty;
    galTargetProg += dy * 0.012;
    if (galTargetProg < -0.3) galTargetProg = -0.3;
    if (galTargetProg > galMaxProg + 0.3) galTargetProg = galMaxProg + 0.3;
    galTouchY = ty;
  }
  function onGTE() {
    // snap to nearest
    galTargetProg = Math.round(galTargetProg);
    if (galTargetProg < 0) galTargetProg = 0;
    if (galTargetProg > galMaxProg) galTargetProg = galMaxProg;
  }
  function onGC(e) {
    if (!galOrbitGroup || !galCamera) return;
    galRaycaster.setFromCamera(new THREE.Vector2((e.clientX/galCanvas.clientWidth)*2-1, -((e.clientY/galCanvas.clientHeight)*2-1)), galCamera);
    var hits = galRaycaster.intersectObjects(galPanels, false);
    if (hits.length && hits[0].object.userData.shotIdx !== undefined) {
      galTargetProg = hits[0].object.userData.shotIdx;
    }
  }

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
  // 21. GALLERY TRIGGERS вЂ” buttons & heading clicks
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
    }, { threshold: 0.35 });
    co.observe(stackSec);
  }

})();
