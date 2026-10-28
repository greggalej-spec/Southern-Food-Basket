/* Southern Food Basket — the living storefront (design option D, Grand Entrance).
   Hand-written physics layered on grand-entrance.js, no libraries:
   1) cloth flags on the roof: a verlet mesh in the wind, gusting with scroll speed, the real logo folding with it
   2) the crew at the door waving, each on their own rhythm; palms rocking and leaning into gusts; birds drifting past
   3) bunting over the specials: a rope you can grab, fling and pluck
   4) price seals that swing on their pins
   5) reveals: word-mask headlines, fade-ups, flag-wave ribbons that draw in, and drift tied to scroll
   Every piece sleeps when it is out of view. Under reduced motion only the bunting is drawn, once, at rest;
   the page underneath is complete without any of this. */
(function () {
  'use strict';
  const live = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const n1 = v => v.toFixed(1);

  /* one shared frame loop: a job returns false to go to sleep, and anything can wake it with run(job) */
  const jobs = new Set();
  let raf = 0, lastT = 0, lastY = window.scrollY, fdy = 0, evY = window.scrollY, evDy = 0;
  function tick(now) {
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60; lastT = now;
    const y = window.scrollY; fdy = y - lastY; lastY = y;
    jobs.forEach(job => { if (job(dt) === false) jobs.delete(job); });
    if (jobs.size) raf = requestAnimationFrame(tick); else { raf = 0; lastT = 0; }
  }
  const run = job => { jobs.add(job); if (!raf) { lastY = window.scrollY - evDy; evDy = 0; raf = requestAnimationFrame(tick); } };
  const watchers = new Map();
  const io = live ? new IntersectionObserver(es => es.forEach(e => { const cb = watchers.get(e.target); if (cb) cb(e.isIntersecting); }), { rootMargin: '80px 0px' }) : null;
  const watch = (el, cb) => { if (el && io) { watchers.set(el, cb); io.observe(el); } };
  const onScroll = [];
  if (live) window.addEventListener('scroll', () => { const y = window.scrollY; evDy = y - evY; evY = y; onScroll.forEach(f => f()); }, { passive: true });

  /* ---------- 1. cloth flags ---------- */
  // Must match FLAG, vTop and vBot in tools/grand-entrance/make-scene.js (the static flag is the fallback).
  const FW = 146, FH = 100, FTOP = 194, C = 16, R = 8, G = 230, DRAG = 6;
  const KU = 8.4, KJ = 0.32, SLANT = (KJ / KU) * FW / (FH / R); // ripple wavenumbers; SLANT = how far a fold crest leans per unit down
  const LOGO = { u0: 0.1, u1: 0.9, v0: 0.236, v1: 0.784, w: 861, h: 393, slices: 8, href: 'assets/img/sfb-logo.webp' };
  const vTop = u => 0.15 - 0.06 * u + 0.012 * Math.sin(Math.PI * u), vBot = u => 0.89 - 0.07 * u + 0.012 * Math.sin(Math.PI * u);
  const zero = () => 0, one = () => 1, inTop = u => vTop(u) + 0.035, inBot = u => vBot(u) - 0.035;
  const LN = Math.hypot(-0.5, -0.45, 0.74), LX = -0.5 / LN, LY = -0.45 / LN, LZ = 0.74 / LN; // light from the upper left
  const stage = window.SFBStage, scene = $('.storefront');
  const flags = [];
  let heroOn = false, gust = 0;

  function cloth(g, n, defs) {
    const X0 = Number(g.getAttribute('data-pole')) + 4, N = (C + 1) * (R + 1);
    const c = { X0, t: n * 1.7, acc: 0, ph: n * 2.1, links: null, tris: [] };
    ['x', 'y', 'z', 'px', 'py', 'pz', 'sx', 'sy', 'inv'].forEach(k => { c[k] = new Float32Array(N); });
    const id = (i, j) => j * (C + 1) + i;
    for (let j = 0; j <= R; j++) for (let i = 0; i <= C; i++) {
      const k = id(i, j);
      c.x[k] = c.px[k] = X0 + (i / C) * FW; c.y[k] = c.py[k] = FTOP + (j / R) * FH; c.inv[k] = i ? 1 : 0; // the hoist edge is sewn to the pole
    }
    const L = [], link = (a, b, s) => L.push(a, b, Math.hypot(c.x[b] - c.x[a], c.y[b] - c.y[a]), s);
    for (let j = 0; j <= R; j++) for (let i = 0; i <= C; i++) {
      if (i < C) link(id(i, j), id(i + 1, j), 1);
      if (j < R) link(id(i, j), id(i, j + 1), 1);
      if (i < C && j < R) { link(id(i, j), id(i + 1, j + 1), 0.7); link(id(i + 1, j), id(i, j + 1), 0.7); } // shear
      if (i < C - 1) link(id(i, j), id(i + 2, j), 0.25);                                                      // bend
      if (j < R - 1) link(id(i, j), id(i, j + 2), 0.25);
    }
    c.links = Float32Array.from(L);

    const root = make('g', { class: 'cloth-live', 'aria-hidden': 'true' });
    g.insertBefore(root, g.querySelector('.sleeve'));
    c.base = make('path', { fill: '#fff' }, root);
    c.pink = make('path', { fill: '#E3336F' }, root);
    c.green = make('path', { fill: '#2A8A45' }, root);
    // The logo is cut into triangles, each mapped by its own affine matrix, so it bends with the cloth.
    // Clip shapes live in the logo's own units and never change; only the matrices do.
    const logo = make('g', {}, root), sw = LOGO.w / LOGO.slices, H = LOGO.h;
    for (let s = 0; s < LOGO.slices; s++) for (let half = 0; half < 2; half++) {
      const x0 = s * sw, x1 = x0 + sw, cid = 'flag' + n + 's' + s + half;
      const pts = half ? [[x1 + 1, -1], [x1 + 1, H + 1], [x0 - 1.5, H + 1]] : [[x0 - 1, -1], [x1 + 1.5, -1], [x0 - 1, H + 1.5]];
      make('polygon', { points: pts.map(p => p.join(',')).join(' ') }, make('clipPath', { id: cid }, defs));
      const holder = make('g', {}, logo);
      make('image', { href: LOGO.href, width: LOGO.w, height: H, preserveAspectRatio: 'none', 'clip-path': 'url(#' + cid + ')' }, holder);
      c.tris.push(holder);
    }
    // Fold shading: one shadow layer over the whole cloth whose gradient stops are re-set per column each frame, so
    // folds darken smoothly instead of in cell-sized facets. The gradient is skewed to lean with the fold crests.
    // Shadow only: the cloth is matte, so there is no highlight.
    const gid = 'fold' + n;
    c.grad = make('linearGradient', { id: gid, gradientUnits: 'userSpaceOnUse', y1: 0, y2: 0, gradientTransform: 'skewX(' + (Math.atan(SLANT) * 180 / Math.PI).toFixed(2) + ')' }, defs);
    c.stops = [];
    for (let i = 0; i <= C; i++) c.stops.push(make('stop', { offset: i / C, 'stop-color': '#2A1A1F', 'stop-opacity': 0 }, c.grad));
    c.fold = make('path', { fill: 'url(#' + gid + ')' }, root);
    c.cs = new Float32Array(C);
    for (let i = 0; i < 90; i++) step(c, 1 / 60); // settle into the wind before the first frame
    draw(c);
    g.classList.add('lv-cloth');
    return c;
  }

  function step(c, h) {
    const { x, y, z, px, py, pz, inv, links } = c, t = (c.t += h), h2 = h * h;
    const wind = 118 + 34 * Math.sin(t * 0.55 + c.ph) + 18 * Math.sin(t * 1.7) + gust, Z = 1500 + gust * 3.4;
    for (let j = 0; j <= R; j++) for (let i = 1; i <= C; i++) {
      const k = j * (C + 1) + i, u = i / C;
      const vx = (x[k] - px[k]) / h, vy = (y[k] - py[k]) / h, vz = (z[k] - pz[k]) / h;
      const ax = DRAG * (wind - vx), ay = G - 1.4 * vy;
      const az = Z * u * Math.sin(t * 8.8 - u * KU + j * KJ + c.ph) - 1.4 * vz; // a ripple travelling to the fly end
      const nx = x[k] + (x[k] - px[k]) * 0.99 + ax * h2, ny = y[k] + (y[k] - py[k]) * 0.99 + ay * h2, nz = z[k] + (z[k] - pz[k]) * 0.99 + az * h2;
      px[k] = x[k]; py[k] = y[k]; pz[k] = z[k]; x[k] = nx; y[k] = ny; z[k] = nz;
    }
    for (let it = 0; it < 4; it++) for (let l = 0; l < links.length; l += 4) {
      const a = links[l], b = links[l + 1], wa = inv[a], wb = inv[b], w = wa + wb;
      if (!w) continue;
      const dx = x[b] - x[a], dy = y[b] - y[a], dz = z[b] - z[a], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const k = ((d - links[l + 2]) / (d * w)) * links[l + 3];
      x[a] += dx * k * wa; y[a] += dy * k * wa; z[a] += dz * k * wa;
      x[b] -= dx * k * wb; y[b] -= dy * k * wb; z[b] -= dz * k * wb;
    }
  }

  const P = [0, 0], A = [0, 0], B = [0, 0], Cc = [0, 0], Dd = [0, 0];
  function at(c, u, v, out) { // bilinear lookup on the projected mesh
    const fi = clamp(u * C, 0, C - 1e-4), fj = clamp(v * R, 0, R - 1e-4), i = fi | 0, j = fj | 0, a = fi - i, b = fj - j;
    const k = j * (C + 1) + i, k2 = k + C + 1, sx = c.sx, sy = c.sy;
    out[0] = (sx[k] * (1 - a) + sx[k + 1] * a) * (1 - b) + (sx[k2] * (1 - a) + sx[k2 + 1] * a) * b;
    out[1] = (sy[k] * (1 - a) + sy[k + 1] * a) * (1 - b) + (sy[k2] * (1 - a) + sy[k2 + 1] * a) * b;
    return out;
  }
  function band(c, va, vb) {
    let s = '';
    for (let i = 0; i <= C; i++) { at(c, i / C, va(i / C), P); s += (i ? 'L' : 'M') + n1(P[0]) + ' ' + n1(P[1]); }
    for (let i = C; i >= 0; i--) { at(c, i / C, vb(i / C), P); s += 'L' + n1(P[0]) + ' ' + n1(P[1]); }
    return s + 'Z';
  }
  const mat = (a, b, cc, d, e, f) => 'matrix(' + a.toFixed(4) + ' ' + b.toFixed(4) + ' ' + cc.toFixed(4) + ' ' + d.toFixed(4) + ' ' + e.toFixed(2) + ' ' + f.toFixed(2) + ')';

  function draw(c) {
    const { x, y, z, sx, sy } = c, N = x.length;
    for (let k = 0; k < N; k++) { sx[k] = x[k] + z[k] * 0.3; sy[k] = y[k] - z[k] * 0.3; } // oblique projection, seen a little from below so folds show in the edges
    c.base.setAttribute('d', band(c, zero, one));
    c.pink.setAttribute('d', band(c, zero, vTop) + band(c, vBot, one));
    c.green.setAttribute('d', band(c, vTop, inTop) + band(c, inBot, vBot));
    const sw = LOGO.w / LOGO.slices, H = LOGO.h, du = (LOGO.u1 - LOGO.u0) / LOGO.slices;
    for (let s = 0; s < LOGO.slices; s++) {
      const u0 = LOGO.u0 + s * du, u1 = u0 + du, lx0 = s * sw, lx1 = lx0 + sw;
      at(c, u0, LOGO.v0, A); at(c, u1, LOGO.v0, B); at(c, u0, LOGO.v1, Cc); at(c, u1, LOGO.v1, Dd);
      let a = (B[0] - A[0]) / sw, b = (B[1] - A[1]) / sw, cc = (Cc[0] - A[0]) / H, d = (Cc[1] - A[1]) / H;
      c.tris[s * 2].setAttribute('transform', mat(a, b, cc, d, A[0] - a * lx0, A[1] - b * lx0));
      a = (Dd[0] - Cc[0]) / sw; b = (Dd[1] - Cc[1]) / sw; cc = (Dd[0] - B[0]) / H; d = (Dd[1] - B[1]) / H;
      c.tris[s * 2 + 1].setAttribute('transform', mat(a, b, cc, d, Dd[0] - a * lx1 - cc * H, Dd[1] - b * lx1 - d * H));
    }
    // fold shading: each column's normal against the light (relative to a flat cloth), read across the middle rows
    const cs = c.cs, jm = R >> 1;
    for (let i = 0; i < C; i++) {
      let sum = 0;
      for (let j = jm - 1; j <= jm; j++) {
        const a = j * (C + 1) + i, b = a + 1, d = a + C + 1;
        const ux = x[b] - x[a], uy = y[b] - y[a], uz = z[b] - z[a], wx = x[d] - x[a], wy = y[d] - y[a], wz = z[d] - z[a];
        const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        sum += (nx * LX + ny * LY + nz * LZ) / (Math.hypot(nx, ny, nz) || 1) - LZ;
      }
      cs[i] = sum / 2;
    }
    // stops sit where each column crosses the middle row, measured in the gradient's own (unskewed) space
    const m0 = jm * (C + 1), g0 = sx[m0] - SLANT * sy[m0], g1 = sx[m0 + C] - SLANT * sy[m0 + C], gw = g1 - g0 || 1;
    c.grad.setAttribute('x1', n1(g0)); c.grad.setAttribute('x2', n1(g1));
    let prev = 0;
    for (let i = 0; i <= C; i++) {
      const v = (cs[Math.max(0, i - 1)] + cs[Math.min(C - 1, i)]) / 2;
      prev = clamp((sx[m0 + i] - SLANT * sy[m0 + i] - g0) / gw, prev, 1);
      c.stops[i].setAttribute('offset', prev.toFixed(3));
      c.stops[i].setAttribute('stop-opacity', clamp(-v * 2.1, 0, 0.42).toFixed(3));
    }
    c.fold.setAttribute('d', band(c, zero, one));
  }

  function flagsJob(dt) {
    if (!heroOn) return false;
    const target = Math.min(260, (Math.abs(fdy) / dt) * 0.16);
    gust += (target - gust) * (target > gust ? 0.25 : 0.025);
    const vb = stage.vb();
    let on = false;
    for (const c of flags) {
      if (vb[0] > c.X0 + FW + 40 || vb[0] + vb[2] < c.X0 - 10 || vb[1] > FTOP + FH + 50 || vb[1] + vb[3] < FTOP - 30) continue; // off camera
      on = true;
      c.acc = Math.min(c.acc + dt, 3 / 60);
      while (c.acc >= 1 / 60) { step(c, 1 / 60); c.acc -= 1 / 60; }
      draw(c);
    }
    return on;
  }

  /* ---------- 2. the crew, the palms and the birds ---------- */
  // Each waver runs their own routine from the data-* on their .staff group (make-scene.js): bursts of waving and
  // rests with the arm down, the raise driven by a critically damped spring, the forearm swinging about the elbow with
  // the wrist trailing, plus breathing, a head that leans toward the wave, blinks and a ponytail that lags behind.
  const crew = [], palms = [], birds = [];
  let T = 0;
  const rot = (el, a, cx, cy) => el.setAttribute('transform', 'rotate(' + a.toFixed(2) + (cx === undefined ? '' : ' ' + cx + ' ' + cy) + ')');
  function setupLife() {
    $$('.staff', scene).forEach((g, n) => {
      let seed = (n + 1) * 9301 + 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const span = a => { const [lo, hi] = a.split(' ').map(Number); return () => lo + (hi - lo) * rnd(); };
      const d = g.dataset, wave = g.querySelector('.arm-wave'), rest = g.querySelector('.arm-rest');
      crew.push({ s: +d.side, reach: +d.reach, tempo: +d.tempo, swing: +d.swing, burst: span(d.burst), rest: span(d.rest), sway: n * 1.9,
        sh: wave.querySelector('.j-sh'), el: wave.querySelector('.j-el'), wr: wave.querySelector('.j-wr'), rsh: rest.querySelector('.j-sh'),
        body: g.querySelector('.j-body'), head: g.querySelector('.j-head'), eyes: g.querySelector('.j-eyes'), pony: g.querySelector('.j-pony'),
        r: 1, rv: 0, up: true, timer: 0.4 + rnd() * 2.2, ph: rnd() * 6.28, blink: 1 + rnd() * 3, bt: -1, po: 0, pv: 0, rnd });
    });
    $$('.palm', scene).forEach((g, n) => palms.push({ el: g.querySelector('.sway'), dir: +g.dataset.dir || 1, ph: n * 1.3, w: 0.8 + (n % 3) * 0.12, lean: 0 }));
    $$('.bird', scene).forEach((el, n) => {
      const m = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/.exec(el.getAttribute('transform'));
      birds.push({ el, x: +m[1], y: +m[2], k: +m[3], ph: n * 2.4 });
    });
  }
  function person(p, dt) {
    if ((p.timer -= dt) <= 0) { p.up = !p.up; p.timer = p.up ? p.burst() : p.rest(); }
    p.rv += (46 * ((p.up ? 1 : 0) - p.r) - 13.6 * p.rv) * dt; p.r += p.rv * dt;
    const r = clamp(p.r, -0.05, 1.05), e = r * r, s = p.s;
    p.ph += dt * 6.2832 * p.tempo * (1 + 0.07 * Math.sin(T * 0.6 + p.sway));
    const sw = Math.sin(p.ph) * p.swing * e;
    rot(p.sh, -s * (12 + (p.reach - 12) * r) + 0.18 * sw);
    rot(p.el, s * (8 - (188 - p.reach) * r) + sw);
    rot(p.wr, 0.6 * p.swing * e * Math.sin(p.ph - 1.1));
    rot(p.rsh, s * (10 + 1.4 * Math.sin(T * 1.3 + p.sway)));
    p.body.setAttribute('transform', 'translate(' + (0.35 * Math.sin(T * 0.8 + p.sway) + 0.1 * sw / p.swing).toFixed(2) + ' ' + (-0.3 * e * Math.abs(Math.sin(p.ph))).toFixed(2) + ')');
    const tilt = 2.6 * Math.sin(T * 0.5 + p.sway * 1.7) + s * 2.4 * r;
    rot(p.head, tilt, 0, -50);
    if (p.pony) { p.pv += (60 * (-1.2 * tilt - 0.25 * sw - p.po) - 5 * p.pv) * dt; p.po += p.pv * dt; rot(p.pony, p.po, 5, -60.5); }
    if ((p.blink -= dt) <= 0 && p.bt < 0) { p.bt = 0.16; p.blink = 1.8 + p.rnd() * 4.2; p.eyes.setAttribute('transform', 'translate(0 -56.4) scale(1 .1) translate(0 56.4)'); }
    if (p.bt >= 0 && (p.bt -= dt) < 0) p.eyes.removeAttribute('transform');
  }
  function lifeJob(dt) {
    if (!heroOn) return false;
    T += dt;
    const g = gust / 260;
    for (const p of crew) person(p, dt);
    for (const m of palms) {
      m.ph += dt * m.w;
      m.lean += (7 * g - m.lean) * (1 - Math.exp(-dt * 1.5));
      rot(m.el, m.dir * (2.2 * Math.sin(m.ph) + 0.6 * Math.sin(2.3 * m.ph + 1) + m.lean));
    }
    birds.forEach((b, i) => {
      b.x += (16 + 7 * i + 40 * g) * dt; if (b.x > 2100) b.x = -500;
      const fl = Math.sin(T * 7 + b.ph) * Math.max(0, Math.sin(T * 0.5 + b.ph)), ty = -3.5 * fl, cy = -5 - 1.5 * fl;
      b.el.setAttribute('transform', 'translate(' + n1(b.x) + ' ' + n1(b.y + 3 * Math.sin(T * 0.4 + b.ph)) + ') scale(' + b.k + ')');
      b.el.setAttribute('d', 'M-9 ' + n1(ty) + 'Q-4.5 ' + n1(cy) + ' 0 0Q4.5 ' + n1(cy) + ' 9 ' + n1(ty));
    });
    return true;
  }

  if (live && stage && scene) {
    const defs = make('defs', {}, scene);
    $$('.flag', scene).forEach((g, n) => flags.push(cloth(g, n, defs)));
    setupLife();
    const wake = () => { if (heroOn) { if (flags.length) run(flagsJob); run(lifeJob); } };
    watch($('#top'), on => { heroOn = on; wake(); });
    onScroll.push(wake);
  }

  /* ---------- 3. bunting over the specials ---------- */
  const deals = $('#deals');
  if (deals) bunting(deals);
  function bunting(band) {
    const host = document.createElement('div');
    host.className = 'bunting'; host.setAttribute('aria-hidden', 'true');
    band.prepend(host);
    const svg = make('svg', { class: 'bunting-svg', focusable: 'false' }, host);
    const rope = make('path', { class: 'b-rope', fill: 'none' }, svg);
    const pinkP = make('path', { fill: '#E3336F' }, svg), greenP = make('path', { fill: '#2A8A45' }, svg), pins = make('g', { class: 'b-pins' }, svg);
    const TOP = 12, SAG = 34, PH = 24, SEG = 24, GRAV = 1600, HIT = 34;
    let W = 0, m = 1, n = 0, rest = 0, x, y, px, py, inv, acc = 0, calm = 0, onScreen = false;
    let grab = -1, gp = [0, 0], gv = [0, 0], lastE = 0;

    function build() {
      W = host.clientWidth;
      if (!W) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' 96'); svg.setAttribute('width', W); svg.setAttribute('height', 96);
      const swags = Math.max(1, Math.round(W / 560)), span = (W - 24) / swags;
      m = Math.max(6, Math.round(span / SEG)); n = swags * m + 1;
      rest = (span * (1 + (8 / 3) * Math.pow(SAG / span, 2))) / m; // arc length of the sag, shared by the segments
      x = new Float32Array(n); y = new Float32Array(n); px = new Float32Array(n); py = new Float32Array(n); inv = new Float32Array(n);
      for (let k = 0; k < n; k++) { const f = (k % m) / m; x[k] = px[k] = 12 + (k * span) / m; y[k] = py[k] = TOP + SAG * 4 * f * (1 - f); inv[k] = k % m ? 1 : 0; }
      pins.textContent = '';
      for (let k = 0; k < n; k += m) make('circle', { cx: n1(x[k]), cy: TOP, r: 5 }, pins);
      for (let i = 0; i < 240; i++) sim(1 / 60, 0);
      draw();
    }
    function sim(h, push) {
      for (let k = 0; k < n; k++) {
        if (!inv[k]) continue;
        if (k === grab) { px[k] = x[k]; py[k] = y[k]; x[k] = gp[0]; y[k] = gp[1]; continue; }
        const vx = (x[k] - px[k]) * 0.985, vy = (y[k] - py[k]) * 0.985;
        px[k] = x[k]; py[k] = y[k];
        x[k] += vx; y[k] += vy + GRAV * h * h + push * Math.sin((Math.PI * (k % m)) / m);
      }
      for (let it = 0; it < 14; it++) for (let k = 0; k < n - 1; k++) {
        const wa = k === grab ? 0 : inv[k], wb = k + 1 === grab ? 0 : inv[k + 1], w = wa + wb;
        if (!w) continue;
        const dx = x[k + 1] - x[k], dy = y[k + 1] - y[k], d = Math.hypot(dx, dy) || 1, q = (d - rest) / (d * w);
        x[k] += dx * q * wa; y[k] += dy * q * wa; x[k + 1] -= dx * q * wb; y[k + 1] -= dy * q * wb;
      }
    }
    function draw() {
      let r = 'M' + n1(x[0]) + ' ' + n1(y[0]), pk = '', gr = '';
      for (let k = 0; k < n - 1; k++) {
        const ax = x[k], ay = y[k], dx = x[k + 1] - ax, dy = y[k + 1] - ay, d = Math.hypot(dx, dy) || 1;
        let nx = -dy / d, ny = dx / d;
        if (ny < 0) { nx = -nx; ny = -ny; } // pennants always hang below the string
        r += 'L' + n1(x[k + 1]) + ' ' + n1(y[k + 1]);
        const s = 'M' + n1(ax + dx * 0.1) + ' ' + n1(ay + dy * 0.1) + 'L' + n1(ax + dx * 0.9) + ' ' + n1(ay + dy * 0.9) + 'L' + n1(ax + dx * 0.5 + nx * PH) + ' ' + n1(ay + dy * 0.5 + ny * PH) + 'Z';
        if (k % 2) gr += s; else pk += s;
      }
      rope.setAttribute('d', r); pinkP.setAttribute('d', pk); greenP.setAttribute('d', gr);
    }
    function job(dt) {
      if (!onScreen && grab < 0) return false;
      const push = clamp(fdy, -40, 40) * 0.07; // the string lags behind the scroll, then swings back
      acc = Math.min(acc + dt, 3 / 60);
      let first = true;
      while (acc >= 1 / 60) { sim(1 / 60, first ? push : 0); first = false; acc -= 1 / 60; }
      draw();
      let e = 0;
      for (let k = 0; k < n; k++) e += Math.abs(x[k] - px[k]) + Math.abs(y[k] - py[k]);
      calm = e < n * 0.02 && grab < 0 ? calm + 1 : 0;
      return calm < 30;
    }

    build();
    if (window.ResizeObserver) new ResizeObserver(() => { if (Math.abs(host.clientWidth - W) > 30) { grab = -1; build(); } }).observe(host);
    if (!live) return;

    const local = e => { const r = svg.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const nearest = (p, max) => { let best = -1, bd = max; for (let k = 0; k < n; k++) { if (!inv[k]) continue; const d = Math.hypot(x[k] - p[0], y[k] - p[1]); if (d < bd) { bd = d; best = k; } } return best; };
    svg.addEventListener('pointerdown', e => {
      const p = local(e), k = nearest(p, HIT);
      if (k >= 0) {
        grab = k; gp = [x[k], y[k]]; gv = [0, 0]; lastE = e.timeStamp;
        svg.setPointerCapture(e.pointerId); host.classList.add('is-grabbing');
      } else {
        const j = nearest(p, 90);
        if (j >= 0) y[j] += 9; // a pluck
      }
      calm = 0; run(job);
    });
    svg.addEventListener('pointermove', e => {
      const p = local(e);
      if (grab >= 0) {
        const t = Math.max(8, e.timeStamp - lastE) / 1000; lastE = e.timeStamp;
        const q = [clamp(p[0], 0, W), clamp(p[1], -20, 170)];
        gv = [gv[0] * 0.4 + ((q[0] - gp[0]) / t) * 0.6, gv[1] * 0.4 + ((q[1] - gp[1]) / t) * 0.6];
        gp = q;
      } else if (e.pointerType === 'mouse') { // brushing past the string with the mouse
        for (let k = 0; k < n; k++) {
          if (!inv[k]) continue;
          const d = Math.hypot(x[k] - p[0], y[k] - p[1]);
          if (d < 40) { const f = (1 - d / 40) * 0.3; x[k] += clamp(e.movementX, -30, 30) * f; y[k] += clamp(e.movementY, -30, 30) * f; }
        }
      } else return;
      calm = 0; run(job);
    });
    const release = () => {
      if (grab < 0) return;
      const vx = clamp(gv[0], -1800, 1800), vy = clamp(gv[1], -1800, 1800);
      x[grab] = gp[0]; y[grab] = gp[1]; px[grab] = gp[0] - vx / 60; py[grab] = gp[1] - vy / 60; // fling
      grab = -1; host.classList.remove('is-grabbing'); calm = 0; run(job);
    };
    svg.addEventListener('pointerup', release); svg.addEventListener('pointercancel', release); svg.addEventListener('lostpointercapture', release);
    watch(band, on => { onScreen = on; if (on) { calm = 0; run(job); } });
    onScroll.push(() => { if (onScreen) { calm = 0; run(job); } });
  }

  if (!live) return;

  /* ---------- 4. price seals swing on their pins ---------- */
  const shelf = $('#shelf');
  if (shelf) {
    const seals = $$('.seal', shelf).map(el => ({ el, a: 0, w: 0, card: el.closest('.deal') }));
    let acc = 0, sl = shelf.scrollLeft, kicked = false;
    const job = dt => {
      acc = Math.min(acc + dt, 0.05);
      while (acc >= 1 / 120) { // a damped pendulum, integrated at 120 Hz
        for (const s of seals) { s.w = clamp(s.w + (-34 * Math.sin(s.a) - 1.9 * s.w) / 120, -2.6, 2.6); s.a = clamp(s.a + s.w / 120, -0.6, 0.6); }
        acc -= 1 / 120;
      }
      let e = 0;
      for (const s of seals) { e += Math.abs(s.a) + Math.abs(s.w); s.el.style.transform = Math.abs(s.a) > 0.0005 ? 'rotate(' + (s.a * 57.2958).toFixed(2) + 'deg)' : ''; }
      return e > 0.004;
    };
    const kick = (s, v) => { s.w = clamp(s.w + v, -2.6, 2.6); run(job); };
    shelf.addEventListener('scroll', () => { const d = shelf.scrollLeft - sl; sl = shelf.scrollLeft; seals.forEach(s => kick(s, clamp(-d * 0.006, -0.5, 0.5))); }, { passive: true });
    seals.forEach(s => {
      s.card.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && e.movementX) kick(s, clamp(e.movementX * 0.012, -0.3, 0.3)); });
      s.card.addEventListener('pointerdown', () => kick(s, (Math.random() < 0.5 ? -1 : 1) * 1.1));
    });
    watch(shelf, on => { if (on && !kicked) { kicked = true; seals.forEach((s, i) => setTimeout(() => kick(s, i % 2 ? -1.5 : 1.5), 160 + i * 90)); } });
  }

  /* ---------- 5. reveals and scroll drift ---------- */
  const targets = [];
  const mark = (els, cls) => els.forEach(el => { el.classList.add(cls); el.style.setProperty('--d', Math.min(6, [...el.parentNode.children].indexOf(el))); targets.push(el); });
  // headlines rise word by word out of a mask; screen readers get the sentence once, untouched
  $$('main h2:not(.visually-hidden), .social-band h2').forEach(h => {
    if (h.children.length || !h.textContent.trim()) return;
    const text = h.textContent.trim(), sr = document.createElement('span'), vis = document.createElement('span');
    sr.className = 'visually-hidden'; sr.textContent = text; vis.setAttribute('aria-hidden', 'true');
    text.split(/\s+/).forEach((w, i) => {
      const m = document.createElement('span'), inner = document.createElement('span');
      m.className = 'wm'; inner.textContent = w; inner.style.setProperty('--i', i);
      m.appendChild(inner); vis.append(m, ' ');
    });
    h.textContent = ''; h.append(sr, vis);
    mark([h], 'rv-words');
  });
  mark($$('.section-head > div > :not(h2), .section-head > fieldset, .careers .lede, .why li, .careers .row, .counters li, .who-card, .store, #dept .dc, .cmp, .social > *'), 'rv');
  mark($$('.deal'), 'rv');
  mark($$('.arch-photo'), 'rv-wipe');
  mark($$('.ribbon'), 'rv-draw');
  // A clip-path that hides an element also hides it from IntersectionObserver, so a ribbon is watched through its band.
  const via = new Map();
  targets.forEach(t => { const w = t.classList.contains('rv-draw') ? t.parentNode : t; via.set(w, (via.get(w) || []).concat(t)); });
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { via.get(e.target).forEach(t => t.classList.add('in')); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.12 });
  via.forEach((_, w) => rio.observe(w));
  window.addEventListener('beforeprint', () => targets.forEach(t => t.classList.add('in')));

  // ribbons and the price ticker drift with the scroll (never on their own, so nothing moves while you read)
  const drifting = new Set(), driftJob = () => {
    const y = window.scrollY;
    drifting.forEach(el => {
      if (el.classList.contains('ribbon')) el.style.backgroundPositionX = n1(-y * 0.12) + 'px';
      else { const half = el.scrollWidth / 2; if (half) el.style.transform = 'translateX(' + n1(-((y * 0.45) % half)) + 'px)'; }
    });
    return false;
  };
  $$('.ribbon, .ticker-track').forEach(el => watch(el, on => { if (on) drifting.add(el); else drifting.delete(el); run(driftJob); }));
  onScroll.push(() => { if (drifting.size) run(driftJob); });

  // carousel photos trail the swipe a little
  const track = $('.car-track');
  if (track) {
    const slides = $$('.slide', track);
    const par = () => { const w = track.clientWidth || 1; slides.forEach(s => s.style.setProperty('--sx', ((s.offsetLeft - track.scrollLeft) / w).toFixed(3))); return false; };
    track.addEventListener('scroll', () => run(par), { passive: true });
    par();
  }

  document.documentElement.classList.add('lv');
})();
