/* =============================================================
   /3D MODE — Immersive experience runtime
   Three.js particle-hologram + HUD interactivity
   Stack: THREE (global, r134) + GSAP (global)
   ============================================================= */
(function () {
  'use strict';

  // -----------------------------------------------------------
  // 0. Project data
  // -----------------------------------------------------------
  var PROJECTS = [
    {
      title: 'EVENT TICKETING / QR ACCESS',
      desc: 'Full-cycle ticketing, QR generation, admin control, analytics and scanner-safe access. Configured for 75 club locations across 22 countries.',
      tags: ['QR tickets', 'Search', 'Analytics', 'Maps', 'Scanner'],
      image: './assets/screens/ticketing-dashboard.jpg',
      tint: [0.78, 0.82, 1.00]
    },
    {
      title: 'TASK CONTROL / TEAM OPS',
      desc: 'Role-based product for coordinating recurring events, teams, permissions, task groups, confirmations, analytics, archives and operational comms.',
      tags: ['Roles', 'Tasks', 'Events', 'Archive', 'Sync'],
      image: './assets/screens/task-control-dashboard.jpg',
      tint: [0.90, 0.82, 1.00]
    },
    {
      title: 'AI VOICE AUTO-RESPONDER',
      desc: 'Inbound voice product handling calls as a flow — parser + cached layer ground every answer in current venue data with operator-aware fallbacks.',
      tags: ['Voice', 'Parser', 'Cache', 'Rules', 'Fallback'],
      image: null, // procedural waveform
      tint: [0.95, 0.78, 1.00]
    }
  ];

  var PARTICLE_COUNT = 32000;
  var IS_MOBILE = window.matchMedia('(max-width: 880px), (pointer: coarse)').matches;
  if (IS_MOBILE) PARTICLE_COUNT = 16000;
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -----------------------------------------------------------
  // 1. DOM refs
  // -----------------------------------------------------------
  var canvas    = document.getElementById('xp-canvas');
  var hud       = document.getElementById('xp-hud');
  var boot      = document.getElementById('xp-boot');
  var bootLog   = document.getElementById('xp-boot-log');
  var enterBtn  = document.getElementById('xp-enter');
  var idxEl     = document.getElementById('xp-idx');
  var totalEl   = document.getElementById('xp-total');
  var titleEl   = document.getElementById('xp-title');
  var descEl    = document.getElementById('xp-desc');
  var tagsEl    = document.getElementById('xp-tags');
  var centerEl  = document.getElementById('xp-center');
  var prevBtn   = document.getElementById('xp-prev');
  var nextBtn   = document.getElementById('xp-next');
  var muteBtn   = document.getElementById('xp-mute');
  var audio     = document.getElementById('xp-audio');
  var cursorEl  = document.getElementById('xp-cursor');

  totalEl.textContent = String(PROJECTS.length).padStart(2, '0');

  // -----------------------------------------------------------
  // 2. Boot sequence (typed log)
  // -----------------------------------------------------------
  var BOOT_LINES = [
    '> INIT.RENDERER ............. <span class="ok">OK</span>',
    '> LOAD.SHADERS .............. <span class="ok">OK</span>',
    '> SAMPLE.ASSETS [1/3] ....... <span class="ok">OK</span>',
    '> SAMPLE.ASSETS [2/3] ....... <span class="ok">OK</span>',
    '> SAMPLE.ASSETS [3/3] ....... <span class="ok">OK</span>',
    '> CALIBRATE.HUD ............. <span class="ok">OK</span>',
    '> AUDIO.STREAM .............. <span class="warn">STANDBY</span>',
    '> READY'
  ];
  var bootIdx = 0;
  function typeBoot() {
    if (bootIdx >= BOOT_LINES.length) return;
    bootLog.innerHTML += BOOT_LINES[bootIdx] + '\n';
    bootIdx++;
    setTimeout(typeBoot, 180 + Math.random() * 120);
  }
  typeBoot();

  // -----------------------------------------------------------
  // 3. Three.js scene setup
  // -----------------------------------------------------------
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: !IS_MOBILE,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x05060a, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.085);

  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.2, 6.2);
  camera.lookAt(0, 0.4, 0);

  // ---------- Ground podium ----------
  (function buildPodium() {
    // big outer disc
    var outer = new THREE.Mesh(
      new THREE.CircleGeometry(8, 96),
      new THREE.MeshBasicMaterial({
        color: 0x0c0e16,
        transparent: true,
        opacity: 0.95
      })
    );
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -1.6;
    scene.add(outer);

    // mid disc (the platform itself)
    var midGeo = new THREE.CircleGeometry(2.6, 72);
    var midMat = new THREE.MeshBasicMaterial({ color: 0x141821 });
    var mid = new THREE.Mesh(midGeo, midMat);
    mid.rotation.x = -Math.PI / 2;
    mid.position.y = -1.5;
    scene.add(mid);

    // emissive ring close
    var ring1 = new THREE.Mesh(
      new THREE.RingGeometry(2.55, 2.62, 96),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.55 })
    );
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = -1.49;
    scene.add(ring1);

    // ring 2
    var ring2 = new THREE.Mesh(
      new THREE.RingGeometry(3.4, 3.42, 128),
      new THREE.MeshBasicMaterial({ color: 0xc7cbd6, transparent: true, opacity: 0.18 })
    );
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = -1.55;
    scene.add(ring2);

    // ring 3 (outer faint)
    var ring3 = new THREE.Mesh(
      new THREE.RingGeometry(5.0, 5.02, 128),
      new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.08 })
    );
    ring3.rotation.x = -Math.PI / 2;
    ring3.position.y = -1.58;
    scene.add(ring3);

    // ambient ground grid (very subtle)
    var grid = new THREE.GridHelper(20, 40, 0x202531, 0x101319);
    grid.material.transparent = true;
    grid.material.opacity = 0.25;
    grid.position.y = -1.595;
    scene.add(grid);

    // overhead halo
    var halo = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 2.7, 96),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 3.5;
    scene.add(halo);

    // godray cone (additive)
    var coneGeo = new THREE.ConeGeometry(2.5, 5.2, 48, 1, true);
    var coneMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0xa78bfa) }
      },
      vertexShader: [
        'varying float vY;',
        'void main(){',
        '  vY = (position.y + 2.6) / 5.2;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying float vY;',
        'uniform vec3 uColor;',
        'void main(){',
        '  float a = smoothstep(0.0, 1.0, vY) * 0.18;',
        '  a *= 1.0 - smoothstep(0.6, 1.0, vY);',
        '  gl_FragColor = vec4(mix(vec3(1.0), uColor, 0.6), a);',
        '}'
      ].join('\n')
    });
    var cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 1.1;
    cone.rotation.x = Math.PI; // tip down
    scene.add(cone);
  })();

  // -----------------------------------------------------------
  // 4. Particle hologram
  // -----------------------------------------------------------
  // Per-particle attributes:
  //  - aPosA  (current target, animated to)
  //  - aPosB  (next target)
  //  - aSeed  (random vec3 for noise + explosion vector)
  // Uniforms:
  //  - uTime, uProgress (0..1 morph), uChaos (0..1 explode), uTint

  var positionsA = new Float32Array(PARTICLE_COUNT * 3);
  var positionsB = new Float32Array(PARTICLE_COUNT * 3);
  var seeds      = new Float32Array(PARTICLE_COUNT * 3);

  for (var i = 0; i < PARTICLE_COUNT; i++) {
    seeds[i * 3]     = (Math.random() * 2 - 1);
    seeds[i * 3 + 1] = (Math.random() * 2 - 1);
    seeds[i * 3 + 2] = (Math.random() * 2 - 1);
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('aPosA', new THREE.BufferAttribute(positionsA, 3));
  pGeo.setAttribute('aPosB', new THREE.BufferAttribute(positionsB, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
  // Required position attribute for raycasting / frustum; reuse aPosA buffer view.
  pGeo.setAttribute('position', new THREE.BufferAttribute(positionsA, 3));
  pGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 10);

  var pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:     { value: 0 },
      uProgress: { value: 0 },
      uChaos:    { value: 0 },
      uSize:     { value: IS_MOBILE ? 1.6 : 2.0 },
      uPxRatio:  { value: renderer.getPixelRatio() },
      uTint:     { value: new THREE.Color(0xa78bfa) },
      uAccent:   { value: new THREE.Color(0xffffff) }
    },
    vertexShader: [
      'attribute vec3 aPosA;',
      'attribute vec3 aPosB;',
      'attribute vec3 aSeed;',
      'uniform float uTime;',
      'uniform float uProgress;',
      'uniform float uChaos;',
      'uniform float uSize;',
      'uniform float uPxRatio;',
      'varying float vSeed;',
      'varying float vChaos;',
      'float easeInOut(float t){ return t<0.5 ? 2.0*t*t : 1.0 - pow(-2.0*t+2.0, 2.0)*0.5; }',
      'void main(){',
      '  float p = easeInOut(clamp(uProgress, 0.0, 1.0));',
      '  vec3 pos = mix(aPosA, aPosB, p);',
      '  // breathing micro-noise',
      '  float n = sin(uTime*0.6 + aSeed.x*9.0) * 0.012 + cos(uTime*0.5 + aSeed.y*7.0) * 0.012;',
      '  pos += aSeed * n;',
      '  // explosion offset (peaks mid-morph)',
      '  float chaosBell = uChaos * (1.0 - abs(p - 0.5) * 2.0);',
      '  pos += aSeed * chaosBell * 1.4;',
      '  // slow lift float',
      '  pos.y += sin(uTime*0.4 + aSeed.z*3.14) * 0.02;',
      '  vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
      '  gl_Position = projectionMatrix * mv;',
      '  float dist = -mv.z;',
      '  gl_PointSize = uSize * uPxRatio * (240.0 / dist);',
      '  vSeed = aSeed.x * 0.5 + 0.5;',
      '  vChaos = chaosBell;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uTint;',
      'uniform vec3 uAccent;',
      'varying float vSeed;',
      'varying float vChaos;',
      'void main(){',
      '  vec2 uv = gl_PointCoord - 0.5;',
      '  float d = length(uv);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.0, d);',
      '  vec3 col = mix(uTint, uAccent, vSeed*0.55);',
      '  col = mix(col, vec3(1.0, 0.92, 1.0), vChaos*0.7);',
      '  gl_FragColor = vec4(col, a * 0.9);',
      '}'
    ].join('\n')
  });

  var particles = new THREE.Points(pGeo, pMat);
  particles.frustumCulled = false;
  scene.add(particles);

  // -----------------------------------------------------------
  // 5. Shape sampling
  // -----------------------------------------------------------
  // Cache of sampled positions per project (Float32Array of length PARTICLE_COUNT*3)
  var SHAPE_CACHE = [];

  function sampleImageShape(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        var tw = 220;
        var th = Math.round(tw * (img.height / img.width));
        var c = document.createElement('canvas');
        c.width = tw; c.height = th;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, tw, th);
        var data = ctx.getImageData(0, 0, tw, th).data;

        // Build brightness list of bright-enough pixels
        var bright = [];
        for (var y = 0; y < th; y++) {
          for (var x = 0; x < tw; x++) {
            var idx = (y * tw + x) * 4;
            var r = data[idx], g = data[idx+1], b = data[idx+2];
            var br = (r * 0.3 + g * 0.59 + b * 0.11) / 255;
            if (br > 0.18) bright.push(x, y, br);
          }
        }
        var poolCount = bright.length / 3;
        var out = new Float32Array(PARTICLE_COUNT * 3);
        // Shape mapping: width 3.4, height proportional, centered around y=0.3
        var W = 3.4;
        var H = W * (th / tw);
        var yCenter = 0.4;

        for (var i = 0; i < PARTICLE_COUNT; i++) {
          // rejection sampling weighted by brightness
          var px, py, pr;
          var tries = 0;
          do {
            var k = (Math.random() * poolCount) | 0;
            px = bright[k * 3];
            py = bright[k * 3 + 1];
            pr = bright[k * 3 + 2];
            tries++;
          } while (Math.random() > pr && tries < 6);

          // normalize to [-0.5..0.5] then scale; flip Y so image is upright
          var nx = (px / (tw - 1)) - 0.5;
          var ny = 0.5 - (py / (th - 1));
          // jitter inside the "pixel"
          nx += (Math.random() - 0.5) / tw;
          ny += (Math.random() - 0.5) / th;

          var ox = nx * W;
          var oy = yCenter + ny * H;
          var oz = (Math.random() - 0.5) * 0.08;

          out[i * 3]     = ox;
          out[i * 3 + 1] = oy;
          out[i * 3 + 2] = oz;
        }
        resolve(out);
      };
      img.onerror = function () {
        resolve(buildProceduralWave());
      };
      img.src = url;
    });
  }

  function buildProceduralWave() {
    // cylindrical waveform — for AI Voice project
    var out = new Float32Array(PARTICLE_COUNT * 3);
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var t = i / PARTICLE_COUNT;
      var angle = t * Math.PI * 2 * 6 + Math.random() * 0.3;
      var radius = 1.4 + Math.random() * 0.4 + Math.sin(angle * 0.5) * 0.2;
      // double-helix-ish waveform with vertical sinusoid
      var y = 0.35 + Math.sin(angle * 2.4 + Math.random() * 0.2) * 0.7 + (Math.random() - 0.5) * 0.15;
      var x = Math.cos(angle) * radius;
      var z = Math.sin(angle) * radius * 0.55;
      // sprinkle some "echo" particles further out
      if (Math.random() < 0.18) {
        var er = radius + 0.4 + Math.random() * 0.6;
        x = Math.cos(angle) * er;
        z = Math.sin(angle) * er * 0.55;
        y += (Math.random() - 0.5) * 0.4;
      }
      out[i * 3]     = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }
    return out;
  }

  function buildCloud() {
    // initial "fog" cloud — starting shape
    var out = new Float32Array(PARTICLE_COUNT * 3);
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var r = Math.pow(Math.random(), 0.4) * 1.6;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 2 - 1);
      out[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      out[i * 3 + 1] = 0.4 + r * Math.cos(phi) * 0.7;
      out[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    }
    return out;
  }

  function loadAllShapes() {
    var tasks = PROJECTS.map(function (p) {
      if (p.image) return sampleImageShape(p.image);
      return Promise.resolve(buildProceduralWave());
    });
    return Promise.all(tasks).then(function (arr) {
      SHAPE_CACHE = arr;
    });
  }

  // -----------------------------------------------------------
  // 6. Morph / project switching
  // -----------------------------------------------------------
  var currentIdx = 0;
  var isMorphing = false;

  function setBufferFromShape(attrName, shape) {
    var attr = pGeo.getAttribute(attrName);
    attr.array.set(shape);
    attr.needsUpdate = true;
  }

  function applyHUD(i) {
    var p = PROJECTS[i];
    idxEl.textContent = String(i + 1).padStart(2, '0');
    titleEl.textContent = p.title;
    descEl.textContent = p.desc;
    tagsEl.innerHTML = p.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    // update tint
    pMat.uniforms.uTint.value.setRGB(p.tint[0], p.tint[1], p.tint[2]);
  }

  function goTo(nextIdx, direction) {
    if (isMorphing) return;
    nextIdx = ((nextIdx % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
    if (nextIdx === currentIdx) return;
    isMorphing = true;

    // Write next target into aPosB
    setBufferFromShape('aPosB', SHAPE_CACHE[nextIdx]);
    pMat.uniforms.uProgress.value = 0;

    // HUD micro-glitch
    centerEl.classList.add('is-morphing');

    var dur = REDUCED_MOTION ? 0.6 : 1.4;
    if (window.gsap) {
      gsap.to(pMat.uniforms.uChaos, { value: 1.0, duration: dur * 0.45, ease: 'power2.in' });
      gsap.to(pMat.uniforms.uProgress, {
        value: 1, duration: dur, ease: 'power2.inOut',
        onComplete: function () {
          // After morph completes, swap: B becomes A, progress reset
          setBufferFromShape('aPosA', SHAPE_CACHE[nextIdx]);
          pMat.uniforms.uProgress.value = 0;
          currentIdx = nextIdx;
          isMorphing = false;
          centerEl.classList.remove('is-morphing');
        }
      });
      gsap.to(pMat.uniforms.uChaos, { value: 0.0, duration: dur * 0.55, delay: dur * 0.45, ease: 'power2.out' });
      // Apply HUD halfway through
      gsap.delayedCall(dur * 0.45, function () { applyHUD(nextIdx); });
    } else {
      setBufferFromShape('aPosA', SHAPE_CACHE[nextIdx]);
      currentIdx = nextIdx;
      isMorphing = false;
      centerEl.classList.remove('is-morphing');
      applyHUD(nextIdx);
    }
  }

  // -----------------------------------------------------------
  // 7. Camera parallax & loop
  // -----------------------------------------------------------
  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 1.2;
  window.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  var clock = new THREE.Clock();
  function tick() {
    var t = clock.getElapsedTime();
    pMat.uniforms.uTime.value = t;

    // slow auto-rotation + parallax
    var orbit = t * 0.06 + mouseX * 0.45;
    var cx = Math.sin(orbit) * 6.2;
    var cz = Math.cos(orbit) * 6.2;
    targetCamX = cx;
    var liftY = 1.2 - mouseY * 0.25;

    camera.position.x += (targetCamX - camera.position.x) * 0.04;
    camera.position.z += (cz - camera.position.z) * 0.04;
    camera.position.y += (liftY - camera.position.y) * 0.04;
    camera.lookAt(0, 0.45, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // -----------------------------------------------------------
  // 8. Resize
  // -----------------------------------------------------------
  function onResize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uPxRatio.value = renderer.getPixelRatio();
  }
  window.addEventListener('resize', onResize);

  // -----------------------------------------------------------
  // 9. Boot → enter flow
  // -----------------------------------------------------------
  // start with cloud shape so render shows something faint before enter
  setBufferFromShape('aPosA', buildCloud());
  setBufferFromShape('aPosB', buildCloud());
  tick();

  // Pre-load shapes in background while user reads boot
  var shapesReady = loadAllShapes();

  enterBtn.addEventListener('click', function () {
    enterBtn.disabled = true;
    shapesReady.then(function () {
      // hide boot, show HUD
      boot.classList.add('is-hidden');
      hud.classList.add('is-active');

      // start audio (we're inside a user gesture now)
      audio.volume = 0;
      var pl = audio.play();
      if (pl && typeof pl.catch === 'function') {
        pl.catch(function () { muteBtn.classList.add('is-muted'); });
      }
      if (window.gsap) gsap.to(audio, { volume: 0.4, duration: 2.2 });

      // initial HUD content
      applyHUD(0);

      // set first project shape and morph into it
      setBufferFromShape('aPosB', SHAPE_CACHE[0]);
      pMat.uniforms.uProgress.value = 0;
      if (window.gsap) {
        gsap.to(pMat.uniforms.uChaos, { value: 0.6, duration: 0.6, ease: 'power2.in' });
        gsap.to(pMat.uniforms.uProgress, {
          value: 1, duration: 1.6, ease: 'power2.inOut',
          onComplete: function () {
            setBufferFromShape('aPosA', SHAPE_CACHE[0]);
            pMat.uniforms.uProgress.value = 0;
          }
        });
        gsap.to(pMat.uniforms.uChaos, { value: 0, duration: 1.0, delay: 0.6, ease: 'power2.out' });
      } else {
        setBufferFromShape('aPosA', SHAPE_CACHE[0]);
      }
    });
  });

  // -----------------------------------------------------------
  // 10. Controls — arrows, keyboard, swipe, mute
  // -----------------------------------------------------------
  prevBtn.addEventListener('click', function () { goTo(currentIdx - 1, -1); });
  nextBtn.addEventListener('click', function () { goTo(currentIdx + 1,  1); });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  goTo(currentIdx - 1, -1);
    if (e.key === 'ArrowRight') goTo(currentIdx + 1,  1);
    if (e.key === 'Escape')     window.location.href = './case-study.html';
  });

  // touch swipe
  var touchX0 = null;
  window.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) touchX0 = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (touchX0 === null) return;
    var dx = e.changedTouches[0].clientX - touchX0;
    if (Math.abs(dx) > 60) {
      if (dx < 0) goTo(currentIdx + 1, 1);
      else        goTo(currentIdx - 1, -1);
    }
    touchX0 = null;
  });

  muteBtn.addEventListener('click', function () {
    if (audio.muted || audio.paused) {
      audio.muted = false;
      var pl = audio.play();
      if (pl && typeof pl.catch === 'function') pl.catch(function(){});
      muteBtn.classList.remove('is-muted');
    } else {
      audio.muted = true;
      muteBtn.classList.add('is-muted');
    }
  });

  // -----------------------------------------------------------
  // 11. Custom cursor + magnetic hot zones
  // -----------------------------------------------------------
  var cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
  var ringX = cursorX, ringY = cursorY;
  window.addEventListener('mousemove', function (e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
  });
  function cursorTick() {
    ringX += (cursorX - ringX) * 0.22;
    ringY += (cursorY - ringY) * 0.22;
    if (cursorEl) {
      cursorEl.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px, 0)';
    }
    requestAnimationFrame(cursorTick);
  }
  cursorTick();

  document.querySelectorAll('.xp-arrow, .xp-target, .xp-pill, .xp-enter-btn').forEach(function (el) {
    el.addEventListener('mouseenter', function () { cursorEl && cursorEl.classList.add('is-hot'); });
    el.addEventListener('mouseleave', function () { cursorEl && cursorEl.classList.remove('is-hot'); });
  });

  // -----------------------------------------------------------
  // 12. Simple FPS watchdog → degrade if needed
  // -----------------------------------------------------------
  (function fpsWatch() {
    var frames = 0;
    var t0 = performance.now();
    function loop() {
      frames++;
      var now = performance.now();
      if (now - t0 > 2000) {
        var fps = (frames * 1000) / (now - t0);
        if (fps < 28 && pMat.uniforms.uSize.value > 1.2) {
          pMat.uniforms.uSize.value *= 0.8;
        }
        frames = 0;
        t0 = now;
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

})();
