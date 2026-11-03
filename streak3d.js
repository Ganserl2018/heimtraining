// Streak-Zahl als drehende 3D-Ziffern (Three.js aus vendor/, wie die Figur im Wizard).
// Formen: vendor/streak-glyphs.js (Anton-Ziffern, Rahmen + Innenraum). Ohne WebGL bleiben die Bilder (img/streak) stehen.
(function () {
  'use strict';
  const SX = 1.2, D = 0.2, GAP = 0.1, H = 176;
  let S = null, boot = null;
  const wait = (test, ms = 10000) => new Promise((ok, no) => { const t0 = Date.now(); (function p() { test() ? ok() : Date.now() - t0 > ms ? no() : setTimeout(p, 40); })(); });
  const addScript = src => { if (!document.querySelector('script[src^="' + src + '"]')) { const s = document.createElement('script'); s.src = src; document.head.appendChild(s); } };
  function loadLibs() {
    if (boot) return boot;
    addScript('vendor/three.min.js');
    boot = wait(() => window.THREE).then(() => { addScript('vendor/OrbitControls.js'); addScript('vendor/streak-glyphs.js'); return wait(() => window.THREE.OrbitControls && window.S3D_GLYPHS); });
    return boot;
  }
  function envTex(T, r) {
    const sc = new T.Scene();
    sc.add(new T.Mesh(new T.SphereGeometry(10, 24, 16), new T.MeshBasicMaterial({ color: 0x2c3833, side: T.BackSide })));
    const box = (w, h, x, y, z, i, c) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(i), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
    box(7, 3, 0, 6, 3, 5, 0xffffff); box(2, 6, -7, 1, 2, 3.2, 0xe6fff0); box(2, 6, 7, 0, -1, 2.6, 0xffffff); box(8, 1.6, 0, -5, 4, 2.2, 0x66ff55); box(6, 2, 0, 1, -7, 1.6, 0xffffff);
    const pm = new T.PMREMGenerator(r), t = pm.fromScene(sc, 0.02).texture; pm.dispose(); return t;
  }
  const pts = (T, a) => a.map(p => new T.Vector2(p[0] * SX, p[1]));
  const shape = (T, [outer, holes]) => { const sh = new T.Shape(pts(T, outer)); holes.forEach(h => sh.holes.push(new T.Path(pts(T, h)))); return sh; };
  function geo(ch, kind, depth, bevel) {
    const key = ch + kind; if (S.geo[key]) return S.geo[key];
    const T = S.T, g = new T.ExtrudeGeometry(window.S3D_GLYPHS[ch][kind].map(p => shape(T, p)), { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: (bevel || 0) * 0.7, bevelSegments: 3, steps: 1, curveSegments: 1 });
    g.translate(0, 0, -depth / 2); return (S.geo[key] = g);
  }
  const LIQ_V = 'varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }';
  const LIQ_F = 'uniform float uLevel; uniform float uTime; uniform float uOn; varying vec3 vP; varying vec3 vN; varying vec3 vV;' +
    'void main(){ float w=sin(vP.x*13.+uTime*2.2)*.014+sin(vP.x*29.-uTime*3.3)*.007; float lv=uLevel+w; if(vP.y>lv) discard; float d=lv-vP.y;' +
    'float edge=smoothstep(.04,0.,d); vec3 deep=vec3(.03,.5,.04), lite=vec3(.5,1.,.12); vec3 c=mix(lite,deep,smoothstep(0.,.55,d));' +
    'float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.); c+=vec3(.55,.8,.35)*edge*.8+vec3(.2,.5,.15)*f*.6;' +
    'float a=.52+.28*edge+.16*f; gl_FragColor=vec4(c,a*uOn); }';
  function init() {
    const T = window.THREE, cv = document.createElement('canvas');
    const r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(26, 1, 0.05, 100);
    scene.environment = envTex(T, r); scene.add(cam);
    const key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(2, 3, 4); cam.add(key);
    const ctl = new T.OrbitControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.enablePan = false; ctl.enableZoom = false;
    ctl.minPolarAngle = ctl.maxPolarAngle = Math.PI / 2; ctl.autoRotate = !matchMedia('(prefers-reduced-motion:reduce)').matches; ctl.autoRotateSpeed = 6.5;
    const frameM = new T.MeshStandardMaterial({ color: 0xe4eae6, metalness: 1, roughness: 0.14, envMapIntensity: 1.9 });
    const glassM = new T.MeshPhysicalMaterial({ color: 0x9fb8ae, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.09, envMapIntensity: 1.4, depthWrite: false });
    const liqU = { uLevel: { value: -1 }, uTime: { value: 0 }, uOn: { value: 1 } };
    const liqM = new T.ShaderMaterial({ uniforms: liqU, vertexShader: LIQ_V, fragmentShader: LIQ_F, transparent: true, depthWrite: false, side: T.DoubleSide });
    const group = new T.Group(); scene.add(group);
    // Tropfen
    const dc = document.createElement('canvas'); dc.width = dc.height = 32; const x = dc.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(210,255,150,1)'); g.addColorStop(0.45, 'rgba(120,255,40,.85)'); g.addColorStop(1, 'rgba(60,255,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    const N = 14, dpos = new Float32Array(N * 3), dgeo = new T.BufferGeometry(); dgeo.setAttribute('position', new T.BufferAttribute(dpos, 3));
    const drops = new T.Points(dgeo, new T.PointsMaterial({ size: 0.05, map: new T.CanvasTexture(dc), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xb6ff6a }));
    drops.frustumCulled = false; group.add(drops);
    const dp = Array.from({ length: N }, (_, i) => ({ t: i / N * 1.4, life: 0.9 + Math.random() * 0.5, vx: 0, vy: 0, x0: 0, z: 0 }));
    S = { T, r, cv, scene, cam, ctl, group, frameM, glassM, liqM, liqU, geo: {}, drops, dpos, dgeo, dp, n: null, level: -1, target: -1, W: 1, el: null, last: 0, spans: [] };
    r.setAnimationLoop(t => {
      if (!S.el || !S.el.isConnected) return;
      const dt = Math.min(0.05, (t - S.last) / 1000 || 0.016); S.last = t;
      liqU.uTime.value = t / 1000;
      S.level += (S.target - S.level) * Math.min(1, dt * 2.6);
      liqU.uLevel.value = S.level;
      // Tropfen springen an der Wasserlinie
      const show = S.level > 0.1 && S.spans.length;
      for (let i = 0; i < N; i++) {
        const p = dp[i]; p.t += dt;
        if (p.t > p.life) { p.t = 0; p.life = 0.8 + Math.random() * 0.6; const sp = S.spans[(Math.random() * S.spans.length) | 0] || [0, 0]; p.x0 = sp[0] + Math.random() * (sp[1] - sp[0]); p.vx = (Math.random() - 0.5) * 0.25; p.vy = 0.55 + Math.random() * 0.5; p.z = (Math.random() - 0.5) * 0.12; }
        const y = S.level + p.vy * p.t - 1.6 * p.t * p.t;
        dpos[i * 3] = p.x0 + p.vx * p.t; dpos[i * 3 + 1] = show && y > S.level - 0.005 ? y : -9; dpos[i * 3 + 2] = p.z;
      }
      dgeo.attributes.position.needsUpdate = true;
      ctl.update(); r.render(scene, cam);
    });
  }
  function build(n) {
    const T = S.T, G = window.S3D_GLYPHS, grp = S.group;
    for (let i = grp.children.length - 1; i >= 0; i--) if (grp.children[i] !== S.drops) grp.remove(grp.children[i]);
    let x = 0; const items = [];
    String(n).split('').forEach(ch => { const g = G[ch]; if (!g) return; const w = (g.bbox[2] - g.bbox[0]) * SX; items.push([ch, x - g.bbox[0] * SX, x, x + w]); x += w + GAP; });
    const W = Math.max(0.3, x - GAP), off = -W / 2; S.spans = [];
    items.forEach(([ch, px, x0, x1]) => {
      const d = new T.Group(); d.position.x = px + off;
      const fr = new T.Mesh(geo(ch, 'frame', D, 0.014), S.frameM), li = new T.Mesh(geo(ch, 'inner', D - 0.07, 0), S.liqM), gl = new T.Mesh(geo(ch, 'inner', D - 0.035, 0), S.glassM);
      li.renderOrder = 1; gl.renderOrder = 2; d.add(fr, li, gl); grp.add(d);
      S.spans.push([x0 + off + 0.06, x1 + off - 0.06]);
    });
    grp.position.y = -0.5; S.W = W; S.n = n;
  }
  function size(el) {
    const w = Math.max(120, el.clientWidth || 351), T = S.T, asp = w / H;
    S.r.setSize(w, H, false); S.cam.aspect = asp; const th = Math.tan(T.MathUtils.degToRad(S.cam.fov / 2));
    const dist = Math.max((0.5 * 1.2) / th, (S.W / 2 * 1.14) / (th * asp)) + D / 2;
    const dir = S.cam.position.clone(); if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    S.cam.position.copy(dir.normalize().multiplyScalar(dist)); S.ctl.minDistance = S.ctl.maxDistance = dist; S.cam.far = dist * 20; S.cam.near = dist / 50; S.cam.updateProjectionMatrix(); S.ctl.update();
  }
  function mount(el) {
    if (!el.isConnected) return;
    try {
      if (!S) init();
      const n = el.dataset.n || '0', fill = Math.max(0, Math.min(1, Number(el.dataset.fill) || 0));
      S.el = el; el.appendChild(S.cv);
      if (S.n !== n) build(n);
      S.target = Number(n) > 0 ? 0.08 + 0.8 * fill : -1;
      if (S.level < -0.5 || matchMedia('(prefers-reduced-motion:reduce)').matches) S.level = Number(n) > 0 ? (matchMedia('(prefers-reduced-motion:reduce)').matches ? S.target : 0.0) : -1;
      S.liqU.uOn.value = Number(n) > 0 ? 1 : 0;
      size(el); el.classList.add('is3d');
    } catch (e) { el.classList.remove('is3d'); }
  }
  function scan() { const el = document.querySelector('.gz-digits[data-n]'); if (!el || el.dataset.s3) return; el.dataset.s3 = 1; loadLibs().then(() => mount(el)).catch(() => {}); }
  new MutationObserver(scan).observe(document.getElementById('content') || document.body, { childList: true, subtree: true });
  scan();
})();
