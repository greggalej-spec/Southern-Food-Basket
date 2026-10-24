/* Southern Food Basket — design option D, Grand Entrance.
   1) The arrival: scroll drives a camera from an aerial, tilted wide shot of the store front down to the front
      door; the sliding doors open and the crew in red steps forward waving; the welcome card fades in.
   2) The store: deals, aisles, stores and careers rendered from window.SFB_DATA (data/seed.js). */
(function () {
  'use strict';
  const D = window.SFB_DATA || { specials: [], departments: [], branches: [], settings: {}, content: {} };
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. the arrival ---------- */
  const intro = $('#top'), stage = $('#stage'), camera = $('#camera');
  const doorTarget = $('#door-target'), doorL = $('.door-l'), doorR = $('.door-r'), crew = $('.crew'), clouds = $('.clouds');
  const startCopy = $('#intro-start'), endCopy = $('#intro-end'), bar = $('#progress-bar'), note = $('.concept-note');
  const svg = $('.storefront');
  let geo = null, ticking = false;

  /* The camera moves the SVG's own viewBox (not a CSS transform), so the vector scene is redrawn sharp at
     every zoom level. The scene's sky, tree line and lot extend far beyond the 1600×1000 frame, so any screen
     shape gets a seamless wide shot. Door (scene units): x 736–864, y 636–712, centre (800, 674). */
  const DOOR = { x: 800, y: 674, w: 128, h: 76 }, BUILDING = { x0: 140, x1: 1460, top: 108, base: 722 };
  function measure() {
    const w = stage.clientWidth, h = stage.clientHeight, A = w / h;
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

  function render() {
    ticking = false;
    if (!geo) measure();
    const p = progress();
    const e = ease(clamp(p / 0.7, 0, 1));
    const g = geo, v0 = g.v0, vf = g.vf;
    const vw = v0.w * Math.pow(vf.w / v0.w, e), vh = vw / g.A;           // zoom is geometric so it feels even
    const k = (v0.w - vw) / (v0.w - vf.w || 1);                           // 0 → 1 as the zoom completes
    const cx = v0.cx + (vf.cx - v0.cx) * k, top = v0.top + (vf.top - v0.top) * k;
    svg.setAttribute('viewBox', (cx - vw / 2).toFixed(2) + ' ' + top.toFixed(2) + ' ' + vw.toFixed(2) + ' ' + vh.toFixed(2));
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
    bar.style.width = (p * 100).toFixed(2) + '%';
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
  let resizeTimer;
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); render(); }, 120); });
  (reduce.addEventListener ? reduce.addEventListener('change', () => { measure(); render(); }) : null);
  measure(); render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); render(); });

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

  const deals = (D.specials || []).slice().sort((a, b) => (a.posted < b.posted ? 1 : -1)).slice(0, 12);
  $('#shelf').innerHTML = deals.map(sp => '<article class="deal"><figure class="deal-photo"><img src="assets/img/photos/' + esc(sp.img) + '.webp" alt="' + esc(sp.alt || sp.name) + '" width="800" height="667" loading="lazy">' + (sp.isNew ? '<span class="new-corner" aria-hidden="true">NEW</span>' : '') + seal(sp.price) + '</figure>' +
    '<div class="deal-body"><p class="deal-dept">' + esc(dept(sp.dept).short) + '</p><h3 class="deal-name">' + esc(sp.name) + '</h3><p class="visually-hidden">Price TTD ' + esc(Number(sp.price).toFixed(2)) + ' each.</p><p class="deal-meta">Posted ' + fmtDate(sp.posted) + (sp.couva ? ' · Couva' : '') + '</p></div></article>').join('');
  $('#deals-note').textContent = (D.settings || {}).dealsNote || '';
  document.querySelectorAll('[data-shelf]').forEach(b => b.addEventListener('click', () => {
    const sh = $('#shelf'); sh.scrollBy({ left: Number(b.getAttribute('data-shelf')) * sh.clientWidth * 0.8, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));

  $('#aisle-grid').innerHTML = (D.departments || []).filter(x => x.id !== 'wholesale').map(x => '<a class="aisle" href="#aisles"><img src="' + esc(x.img) + '" alt="' + esc(x.alt || x.name) + '" width="800" height="600" loading="lazy"><span class="pane" aria-hidden="true"></span><span class="label"><strong>' + esc(x.name) + '</strong><span>' + esc(x.blurb) + '</span></span></a>').join('');
  $('#counters').innerHTML = (D.storeServices || []).map(s => '<li>' + esc(s) + '</li>').join('');

  const mapsDir = b => 'https://www.google.com/maps/dir/?' + new URLSearchParams({ api: '1', destination: (b.listing || 'Southern Food Basket') + ', ' + b.address + ', Trinidad and Tobago', destination_place_id: b.placeId || '' }).toString();
  const tel = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
  const toMin = t => { const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i); if (!m) return null; let h = Number(m[1]) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + Number(m[2]); };
  function today(b) { const rows = b.hours || []; const row = new Date().getDay() === 0 ? (rows[1] || rows[0]) : rows[0]; return row ? row[1] : ''; }
  function openNow(b) { const t = today(b).split(/\s+[–-]\s+/); if (t.length !== 2) return false; const a = toMin(t[0]), z = toMin(t[1]); const now = new Date(); const m = now.getHours() * 60 + now.getMinutes(); return a != null && z != null && m >= a && m < z; }
  const ICON = { clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>', phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' };
  $('#store-grid').innerHTML = (D.branches || []).map(b => '<article class="store"><div class="cap" aria-hidden="true"></div><h3>' + esc(b.name) + '</h3><address>' + esc(b.address) + '</address>' +
    '<p class="row-i">' + ICON.clock + '<span>Today ' + esc(today(b)) + (openNow(b) ? ' <span class="open-now">Open now</span>' : '') + '</span></p>' +
    (b.phone ? '<p class="row-i">' + ICON.phone + '<a href="' + esc(tel(b.phone)) + '">' + esc(b.phone) + '</a></p>' : '') +
    '<div class="actions"><a class="btn btn-sign" href="' + esc(mapsDir(b)) + '" target="_blank" rel="noopener">Directions<span class="visually-hidden"> to ' + esc(b.name) + ' on Google Maps, opens in a new tab</span></a></div></article>').join('');

  $('#why').innerHTML = ((D.content || {}).careersWhy || []).slice(0, 3).map(w => '<li><div><strong>' + esc(w.title) + '</strong><p>' + esc(w.text) + '</p></div></li>').join('');
  $('#footer-stores').innerHTML = (D.branches || []).map(b => '<li><a href="' + esc(mapsDir(b)) + '" target="_blank" rel="noopener">' + esc(b.name) + '</a></li>').join('');
  const ph = (D.settings || {}).phone; if (ph) $('#footer-phone').innerHTML = '<a href="' + esc(tel(ph)) + '">' + esc(ph) + '</a>';
})();
