/* Southern Food Basket — design option D, Grand Entrance.
   1) The arrival: scroll drives a camera from an aerial, tilted wide shot of the store front down to the front
      door; the sliding doors open and the crew in red steps forward waving; the welcome card fades in.
   2) The store: ticker, highlights carousel, specials, careers, who we are, departments, stores and socials,
      all rendered from window.SFB_DATA (data/seed.js). The physics layer lives in living.js. */
(function () {
  'use strict';
  const D = window.SFB_DATA || { specials: [], departments: [], branches: [], settings: {}, content: {} };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. the arrival ---------- */
  const intro = $('#top'), stage = $('#stage');
  const doorL = $('.door-l'), doorR = $('.door-r'), crew = $('.crew'), clouds = $('.clouds');
  const startCopy = $('#intro-start'), endCopy = $('#intro-end'), bar = $('#progress-bar'), note = $('.concept-note'), skipPill = $('#skip-intro');
  const svg = $('.storefront');
  let geo = null, vbNow = [0, 0, 1600, 1000];

  /* The camera moves the SVG's own viewBox (not a CSS transform), so the vector scene is redrawn sharp at
     every zoom level. The scene's sky, tree line and lot extend far beyond the 1600×1000 frame, so any screen
     shape gets a seamless wide shot. Door (scene units): x 736–864, y 636–712, centre (800, 674). */
  const DOOR = { x: 800, y: 674, w: 128, h: 76 }, BUILDING = { x0: 140, x1: 1460, top: 108, base: 722 };
  function measure() {
    const w = stage.clientWidth || window.innerWidth || 1, h = stage.clientHeight || window.innerHeight || 1, A = w / h; // a hidden tab can report 0 × 0
    // opening shot: the whole front (wings may crop on phones), building base at ~76% height, sky above for the title
    const w0 = A < 0.8 ? 1180 : Math.max(1560, 1100 * A);
    const h0 = w0 / A;
    const v0 = { cx: 800, top: BUILDING.base - (A < 0.8 ? 0.8 : 0.93) * h0, w: w0, h: h0 };
    // final shot: the doorway fills ~62% of the width and at most ~52% of the height, centred at 40% from the top
    const wf = Math.max(DOOR.w / 0.62, (DOOR.h / 0.52) * A), hf = wf / A;
    const vf = { cx: DOOR.x, top: DOOR.y - 0.4 * hf, w: wf, h: hf };
    geo = { v0, vf, A };
  }

  function progress() {
    if (reduce.matches) return 1;
    const top = intro.offsetTop, span = intro.offsetHeight - window.innerHeight;
    return span > 0 ? clamp((window.scrollY - top) / span, 0, 1) : 1;
  }

  function draw(p) {
    if (!geo) measure();
    const e = ease(clamp(p / 0.7, 0, 1));
    const g = geo, v0 = g.v0, vf = g.vf;
    const vw = v0.w * Math.pow(vf.w / v0.w, e), vh = vw / g.A;           // zoom is geometric so it feels even
    const k = (v0.w - vw) / (v0.w - vf.w || 1);                           // 0 → 1 as the zoom completes
    const cx = v0.cx + (vf.cx - v0.cx) * k, top = v0.top + (vf.top - v0.top) * k;
    vbNow = [cx - vw / 2, top, vw, vh];
    svg.setAttribute('viewBox', vbNow.map(n => n.toFixed(2)).join(' '));
    const d = ease(clamp((p - 0.62) / 0.16, 0, 1));
    doorL.style.transform = 'translateX(' + (-62 * d).toFixed(2) + 'px)';
    doorR.style.transform = 'translateX(' + (62 * d).toFixed(2) + 'px)';
    crew.style.transform = 'translateY(' + (3 * (1 - d)).toFixed(2) + 'px)';
    if (clouds) clouds.style.transform = 'translateX(' + (-140 * p).toFixed(1) + 'px)';
    stage.style.setProperty('--vig', (0.9 * e).toFixed(3));
    const a = 1 - clamp(p / 0.1, 0, 1);
    startCopy.style.opacity = a.toFixed(3); startCopy.style.visibility = a > 0.01 ? 'visible' : 'hidden';
    const b = clamp((p - 0.78) / 0.1, 0, 1);
    endCopy.style.opacity = b.toFixed(3); endCopy.style.visibility = b > 0.02 ? 'visible' : 'hidden';
    endCopy.style.transform = 'translateX(-50%) translateY(' + (16 * (1 - b)).toFixed(1) + 'px)';
    if (note) note.style.opacity = (1 - b).toFixed(3);
    if (skipPill) { skipPill.style.opacity = (1 - b).toFixed(3); skipPill.style.visibility = b < 0.98 ? 'visible' : 'hidden'; }
    bar.style.width = (p * 100).toFixed(2) + '%';
  }

  // The camera trails the scroll on a critically damped spring: a flick of the wheel becomes a glide, never a jolt.
  let pView = null, vel = 0, raf = 0, lastT = 0;
  function frame(now) {
    raf = 0;
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60; lastT = now;
    const t = progress();
    if (pView == null || reduce.matches) { pView = t; vel = 0; }
    else { vel += (60 * (t - pView) - 15.5 * vel) * dt; pView += vel * dt; }
    if (Math.abs(t - pView) < 0.0004 && Math.abs(vel) < 0.002) { pView = t; vel = 0; }
    draw(pView);
    if (pView !== t) raf = requestAnimationFrame(frame); else lastT = 0;
  }
  const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
  window.SFBStage = { p: () => pView || 0, vb: () => vbNow, svg };
  let resizeTimer;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); draw(pView == null ? progress() : pView); }, 120); });
  (reduce.addEventListener ? reduce.addEventListener('change', () => { measure(); pView = null; request(); }) : null);
  measure(); pView = progress(); draw(pView);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); draw(pView); });

  // "Skip intro": jump straight past the animation (a smooth scroll would replay all of it)
  $$('a[href="#inside"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const main = $('#inside');
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
    main.focus({ preventScroll: true });
  }));

  /* ---------- top bar menu ---------- */
  const topbar = $('#topbar'), btn = $('.menu-btn'), menu = $('#mobile-menu');
  [...menu.querySelectorAll('a')].forEach((a, i) => a.style.setProperty('--i', i));
  menu.inert = true;
  const setMenu = (open, refocus) => {
    menu.classList.toggle('is-open', open); menu.inert = !open;
    btn.setAttribute('aria-expanded', String(open)); $('.label', btn).textContent = open ? 'Close' : 'Menu';
    if (!open && refocus) btn.focus();
  };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, true); });
  document.addEventListener('click', e => { if (menu.classList.contains('is-open') && !topbar.contains(e.target)) setMenu(false); });

  // the top bar firms up once the page moves
  const onBar = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onBar, { passive: true }); onBar();

  // desktop nav: an ink pill follows the pointer and rests on the section in view
  const nav = $('.topnav'), ink = document.createElement('span');
  ink.className = 'ink'; ink.setAttribute('aria-hidden', 'true'); nav.prepend(ink);
  const links = [...nav.querySelectorAll('a')];
  let active = null;
  const moveInk = a => {
    if (!a) { nav.classList.remove('has-ink'); return; }
    ink.style.width = a.offsetWidth + 'px'; ink.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    nav.classList.add('has-ink');
  };
  links.forEach(a => { a.addEventListener('mouseenter', () => moveInk(a)); a.addEventListener('focus', () => moveInk(a)); });
  nav.addEventListener('mouseleave', () => moveInk(active));
  nav.addEventListener('focusout', e => { if (!nav.contains(e.relatedTarget)) moveInk(active); });
  const spy = links.map(a => [a, document.getElementById((a.getAttribute('href') || '').replace(/^#/, ''))]).filter(p => p[1] && p[0].getAttribute('href').startsWith('#'));
  if ('IntersectionObserver' in window && spy.length) {
    const seen = new Map();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => seen.set(en.target, en.isIntersecting));
      const hit = spy.find(p => seen.get(p[1]));
      active = hit ? hit[0] : null;
      links.forEach(a => a.classList.toggle('is-active', a === active));
      if (!nav.matches(':hover') && !nav.contains(document.activeElement)) moveInk(active);
    }, { rootMargin: '-45% 0px -50% 0px' });
    spy.forEach(p => io.observe(p[1]));
  }

  /* ---------- 2. the store ---------- */
  const dollars = v => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDate = iso => { const p = String(iso).split('-').map(Number); return p.length === 3 ? p[2] + ' ' + MONTHS[p[1] - 1] + ' ' + p[0] : esc(iso); };
  const dept = id => (D.departments || []).find(x => x.id === id) || { short: id, name: id };
  const SCALLOP = (() => { const n = 18, rIn = 41, rOut = 53, c = 50, st = Math.PI * 2 / n; let d = ''; for (let i = 0; i < n; i++) { const a0 = i * st - Math.PI / 2, a1 = (i + 1) * st - Math.PI / 2, am = (i + .5) * st - Math.PI / 2; if (!i) d += 'M' + (c + rIn * Math.cos(a0)).toFixed(2) + ' ' + (c + rIn * Math.sin(a0)).toFixed(2); d += 'Q' + (c + rOut * Math.cos(am)).toFixed(2) + ' ' + (c + rOut * Math.sin(am)).toFixed(2) + ' ' + (c + rIn * Math.cos(a1)).toFixed(2) + ' ' + (c + rIn * Math.sin(a1)).toFixed(2); } return d + 'Z'; })();
  const seal = price => '<div class="seal" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="' + SCALLOP + '" fill="#D3202D"/><circle cx="50" cy="50" r="35" fill="none" stroke="#fff" stroke-opacity=".35" stroke-dasharray="2 2"/></svg><div class="seal-in"><span class="seal-qty">1 FOR</span><span class="seal-price">' + esc(dollars(price)) + '</span></div><span class="seal-try">TRY ME</span></div>';

  // specials shelf
  const deals = (D.specials || []).slice().sort((a, b) => (a.posted < b.posted ? 1 : -1)).slice(0, 12);
  $('#shelf').innerHTML = deals.map(sp => '<article class="deal"><figure class="deal-photo"><img src="assets/img/photos/' + esc(sp.img) + '.webp" alt="' + esc(sp.alt || sp.name) + '" width="800" height="667" loading="lazy">' + (sp.isNew ? '<span class="new-corner" aria-hidden="true">NEW</span>' : '') + seal(sp.price) + '</figure>' +
    '<div class="deal-body"><p class="deal-dept">' + esc(dept(sp.dept).short) + '</p><h3 class="deal-name">' + esc(sp.name) + '</h3><p class="visually-hidden">Price TTD ' + esc(Number(sp.price).toFixed(2)) + ' each.</p><p class="deal-meta">Posted ' + fmtDate(sp.posted) + (sp.couva ? ' · Couva' : '') + '</p></div></article>').join('');
  $('#deals-note').textContent = (D.settings || {}).dealsNote || '';
  $$('[data-shelf]').forEach(b => b.addEventListener('click', () => {
    const sh = $('#shelf'); sh.scrollBy({ left: Number(b.getAttribute('data-shelf')) * sh.clientWidth * 0.8, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));

  // price ticker banner: the same specials, as the posts word them (decorative; the shelf carries the content)
  const tk = $('#ticker');
  if (tk && deals.length) {
    const run = deals.map(sp => '<span class="tk-item"><span class="tk-qty">1 FOR</span><span class="tk-price">' + esc(dollars(sp.price)) + '</span>' + esc(sp.name) + '</span><span class="tk-flag"></span>').join('');
    tk.innerHTML = run + run;
  }

  // departments: a coloured tile each, linking to that department on the departments page
  const TILE = { fresh: '#1D6B35', bakery: '#C81A35', chilled: '#1C6863', snacks: '#B8195A', health: '#123F22', care: '#164F4B' };
  const depts = (D.departments || []).filter(x => x.id !== 'wholesale');
  const countOf = id => (D.specials || []).filter(s => s.dept === id).length;
  const card = x => { const n = countOf(x.id); return '<a class="dc" href="departments.html#' + esc(x.id) + '" style="--tile:' + (TILE[x.id] || '#1D6B35') + '">' +
    '<span class="dc-photo"><img src="' + esc(x.img) + '" alt="" width="800" height="600" loading="lazy"></span><strong class="dc-name">' + esc(x.name) + '</strong>' +
    '<span class="dc-go">' + (n ? '<span class="dc-count">' + n + (n === 1 ? ' special' : ' specials') + '</span>' : '') + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>'; };
  const deptEl = $('#dept');
  if (deptEl) deptEl.innerHTML = depts.map(card).join('');
  $('#counters').innerHTML = (D.storeServices || []).map(s => '<li>' + esc(s) + '</li>').join('');

  // stores
  const mapsDir = b => 'https://www.google.com/maps/dir/?' + new URLSearchParams({ api: '1', destination: (b.listing || 'Southern Food Basket') + ', ' + b.address + ', Trinidad and Tobago', destination_place_id: b.placeId || '' }).toString();
  const tel = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  const toMin = t => { const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i); if (!m) return null; let h = Number(m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + Number(m[2]); };
  function today(b) { const rows = b.hours || []; const row = new Date().getDay() === 0 ? (rows[1] || rows[0]) : rows[0]; return row ? row[1] : ''; }
  function openNow(b) { const t = today(b).split(/\s+[–-]\s+/); if (t.length !== 2) return false; const a = toMin(t[0]), z = toMin(t[1]); const now = new Date(); const m = now.getHours() * 60 + now.getMinutes(); return a != null && z != null && m >= a && m < z; }
  const ICON = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    Instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor"/></svg>',
    Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5H17V4.4A21 21 0 0 0 14.6 4C12.3 4 10.8 5.4 10.8 8v2.5H8.2v3h2.6V21Z" fill="currentColor"/></svg>',
    TikTok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h3a4.5 4.5 0 0 0 4 4v3a7.4 7.4 0 0 1-4-1.3V15a6 6 0 1 1-6-6v3.1A3 3 0 1 0 14 15Z" fill="currentColor"/></svg>',
    WhatsApp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.5c0 3.5 2.6 6.5 6.5 6.5l1-1.6-2-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-2Z" fill="currentColor"/></svg>'
  };
  $('#store-grid').innerHTML = (D.branches || []).map(b => '<article class="store" id="store-' + esc(b.id) + '"><div class="cap" aria-hidden="true"></div><h3>' + esc(b.name) + '</h3><address>' + esc(b.address) + '</address>' +
    '<p class="row-i">' + ICON.clock + '<span>Today ' + esc(today(b)) + (openNow(b) ? ' <span class="open-now">Open now</span>' : '') + '</span></p>' +
    '<details class="store-week"><summary>See all times<span class="visually-hidden"> for ' + esc(b.name) + '</span></summary><dl>' +
    (b.hours || []).map(r => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('') + '</dl></details>' +
    (b.phone ? '<p class="row-i">' + ICON.phone + '<a href="' + esc(tel(b.phone)) + '">' + esc(b.phone) + '</a></p>' : '') +
    '<div class="actions"><a class="btn btn-sign" href="' + esc(mapsDir(b)) + '" target="_blank" rel="noopener">Directions<span class="visually-hidden"> to ' + esc(b.name) + ' on Google Maps, opens in a new tab</span></a></div></article>').join('');

  // where we are: the five stores placed from their Google Maps coordinates and joined by a flag-wave line
  const ROUTE = [['couva', 'r'], ['sando', 'l'], ['ptown', 'b'], ['penal', 'r'], ['pfortin', 'b']];
  const stops = ROUTE.map(r => [(D.branches || []).find(b => b.id === r[0]), r[1]]).filter(s => s[0] && typeof s[0].lat === 'number');
  const routeEl = $('#route');
  if (routeEl && stops.length > 1) {
    const kx = Math.cos(stops.reduce((s, b) => s + b[0].lat, 0) / stops.length * Math.PI / 180);
    const xs = stops.map(s => s[0].lng * kx), ys = stops.map(s => -s[0].lat);
    const W = 360, H = 300, pad = 46, x0 = Math.min(...xs), y0 = Math.min(...ys), sx = Math.max(...xs) - x0, sy = Math.max(...ys) - y0;
    const sc = Math.min((W - 2 * pad) / sx, (H - 2 * pad) / sy), ox = (W - sx * sc) / 2, oy = (H - sy * sc) / 2;
    const pts = stops.map((s, i) => [ox + (xs[i] - x0) * sc, oy + (ys[i] - y0) * sc]);
    let d = 'M' + pts[0].map(n => n.toFixed(1)).join(' ');
    for (let i = 0; i < pts.length - 1; i++) { // Catmull-Rom through the stores, written as cubic Béziers
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]].map(n => n.toFixed(1)).join(' ');
    }
    const LAB = { r: [12, 5, 'start'], l: [-12, 5, 'end'], b: [0, 24, 'middle'] };
    routeEl.innerHTML = '<path class="route-pink" d="' + d + '" pathLength="1"/><path class="route-green" d="' + d + '" pathLength="1"/>' +
      stops.map((s, i) => { const l = LAB[s[1]]; return '<g class="route-stop" style="--i:' + i + '"><circle cx="' + pts[i][0].toFixed(1) + '" cy="' + pts[i][1].toFixed(1) + '" r="7"/><text x="' + (pts[i][0] + l[0]).toFixed(1) + '" y="' + (pts[i][1] + l[1]).toFixed(1) + '" text-anchor="' + l[2] + '">' + esc(s[0].name) + '</text></g>'; }).join('') +
      '<g class="route-north"><path d="M22 34 L30 14 L38 34 L30 29Z"/><text x="30" y="50" text-anchor="middle">N</text></g>';
    $('#route-list').innerHTML = stops.map(s => '<li><a href="#store-' + esc(s[0].id) + '">' + esc(s[0].name) + '</a></li>').join('');
  }

  // careers, footer and socials
  $('#why').innerHTML = ((D.content || {}).careersWhy || []).slice(0, 3).map(w => '<li><div><strong>' + esc(w.title) + '</strong><p>' + esc(w.text) + '</p></div></li>').join('');
  $('#footer-stores').innerHTML = (D.branches || []).map(b => '<li><a href="' + esc(mapsDir(b)) + '" target="_blank" rel="noopener">' + esc(b.name) + '</a></li>').join('');
  const S = D.settings || {};
  if (S.phone) $('#footer-phone').innerHTML = '<a href="' + esc(tel(S.phone)) + '">' + esc(S.phone) + '</a>';
  const socials = [['Instagram', S.instagram && S.instagram.url, S.instagram && S.instagram.handle], ['Facebook', S.facebook], ['TikTok', S.tiktok], ['WhatsApp', S.whatsappChannel, 'WhatsApp channel']].filter(s => s[1]);
  const socEl = $('#social-links');
  if (socEl) socEl.innerHTML = socials.map(s => '<li><a href="' + esc(s[1]) + '" target="_blank" rel="noopener">' + ICON[s[0]] + '<span>' + esc(s[2] || s[0]) + '</span><span class="visually-hidden">, ' + esc(s[0]) + ', opens in a new tab</span></a></li>').join('');

  /* ---------- highlights carousel ---------- */
  const car = $('#carousel');
  if (car) {
    const track = $('.car-track', car), slides = $$('.slide', track), dotsEl = $('.car-dots', car), playBtn = $('.car-play', car);
    let idx = 0, paused = reduce.matches, touched = false, seen = false;
    dotsEl.innerHTML = slides.map((s, i) => '<button type="button" class="car-dot" aria-label="Slide ' + (i + 1) + ': ' + esc($('h3', s).textContent) + '"></button>').join('');
    const dots = $$('.car-dot', dotsEl);
    const show = i => {
      idx = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[idx].offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
    };
    const sync = () => {
      const i = clamp(Math.round(track.scrollLeft / (track.clientWidth || 1)), 0, slides.length - 1);
      idx = i;
      slides.forEach((s, k) => { s.inert = k !== i; });
      dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    };
    const setPlay = on => {
      paused = !on;
      playBtn.setAttribute('aria-label', on ? 'Pause the slides' : 'Play the slides');
      playBtn.classList.toggle('is-paused', !on);
    };
    let st = 0;
    track.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(sync, 90); }, { passive: true });
    const stopAuto = () => { if (!touched) { touched = true; setPlay(false); } }; // the button never claims it is still playing
    ['pointerdown', 'keydown', 'focusin'].forEach(ev => car.addEventListener(ev, e => { if (!e.target.closest('.car-play')) stopAuto(); }));
    $('.car-prev', car).addEventListener('click', () => { stopAuto(); show(idx - 1); });
    $('.car-next', car).addEventListener('click', () => { stopAuto(); show(idx + 1); });
    dots.forEach((d, k) => d.addEventListener('click', () => { stopAuto(); show(k); }));
    playBtn.addEventListener('click', () => { touched = false; setPlay(paused); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[0].isIntersecting; }, { threshold: 0.5 }).observe(car);
    // Advances every 7 s only while it is on screen, motion is allowed and nobody has touched it.
    setInterval(() => { if (!paused && !touched && seen && !document.hidden) show(idx + 1); }, 7000);
    setPlay(!paused); sync();
    window.addEventListener('resize', () => { track.scrollTo({ left: slides[idx].offsetLeft, behavior: 'auto' }); });
  }
})();
