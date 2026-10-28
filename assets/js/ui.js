/* Southern Food Basket — shared UI: logo, site header/footer, app shell, banner, price seal, toasts, dialogs, helpers.
   Every page includes this after store.js. Reads <html data-root="./|../"> to build links. */
(function () {
  const ROOT = document.documentElement.getAttribute('data-root') || './';
  const DISCLAIMER = 'Unofficial concept by Trinovata. Not affiliated with Southern Food Basket Ltd. Store hours and phone numbers come from Google Maps, prices and photos from the company’s public Instagram; people, jobs and documents are demo data.';
  const href = p => ROOT + p;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* The real logo, traced to SVG from the company's own artwork (assets/img/SOURCES.md). */
  const LOGO = '<img src="' + href('assets/img/sfb-logo.svg') + '" alt="Southern Food Basket" width="861" height="393" decoding="async">';
  const MONO = '<img class="sfb-mark" src="' + href('assets/img/sfb-mark.svg') + '" alt="" width="96" height="96" decoding="async">';

  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14h2"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    file: '<path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    pin: '<path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    phone: '<path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M4 19h16"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 21h4"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    basket: '<path d="M5 10h14l-1.5 9H6.5L5 10Z"/><path d="M8 10l3-6M16 10l-3-6M3 10h18"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.5"/>',
    camera: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    store: '<path d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10h18M9 20v-6h6v6"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  const SITE_NAV = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'specials', label: 'Specials', href: 'specials.html' },
    { id: 'departments', label: 'Departments', href: 'departments.html' },
    { id: 'wholesale', label: 'Wholesale', href: 'wholesale.html' },
    { id: 'locations', label: 'Store locations', href: 'locations.html' },
    { id: 'about', label: 'About us', href: 'about.html' },
    { id: 'careers', label: 'Careers', href: 'careers/index.html' }
  ];

  /* Google Maps links for a branch. Directions open the store's own listing (destination_place_id) so the
     route ends at the right building; the query text is the fallback when the place ID is unknown. */
  function mapsQuery(b) { return (b.listing || 'Southern Food Basket') + ', ' + (b.address || b.name) + ', Trinidad and Tobago'; }
  function mapsDir(b) {
    const q = new URLSearchParams({ api: '1', destination: mapsQuery(b) });
    if (b.placeId) q.set('destination_place_id', b.placeId);
    return 'https://www.google.com/maps/dir/?' + q.toString();
  }
  function mapsView(b) {
    const q = new URLSearchParams({ api: '1', query: mapsQuery(b) });
    if (b.placeId) q.set('query_place_id', b.placeId);
    return 'https://www.google.com/maps/search/?' + q.toString();
  }
  function telHref(phone) { return 'tel:' + String(phone || '').replace(/[^\d+]/g, ''); }

  /* hours[0] is Mon–Sat, hours[1] is Sunday (Google Maps listings) */
  function todayHours(b) {
    const rows = (b && b.hours) || [];
    if (!rows.length) return '';
    const row = new Date().getDay() === 0 ? (rows[1] || rows[0]) : rows[0];
    return row ? row[1] : '';
  }

  function renderSiteHeader(el) {
    const active = el.getAttribute('data-active') || '';
    const d = window.SFBStore ? SFBStore.load() : { branches: [] };
    const first = (d.branches || [])[0];
    const hrs = todayHours(first);
    const count = (d.branches || []).length;
    const navLinks = SITE_NAV.map(n => '<li><a href="' + href(n.href) + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>').join('');
    const mobileLinks = SITE_NAV.map(n => '<li><a href="' + href(n.href) + '"' + (n.id === active ? ' aria-current="page"' : '') + '><span>' + esc(n.label) + '</span>' + icon('arrow') + '</a></li>').join('');
    el.className = 'site-header';
    el.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<div class="utility"><div class="container">' +
      '<p>' + icon('clock') + (hrs ? '<span>Open today <strong>' + esc(hrs) + '</strong></span>' : '<span>See store hours</span>') + (first && first.phone ? '<a class="utility-phone" href="' + telHref(first.phone) + '">' + esc(first.phone) + '</a>' : '') + '</p>' +
      '<nav class="utility-links" aria-label="Quick links"><a href="' + href('locations.html') + '">' + esc(count ? count + ' store locations' : 'Store locations') + '</a><a href="' + href('careers/index.html') + '">Careers</a><a href="' + href('portal/index.html') + '">Staff portal</a></nav>' +
      '</div></div>' +
      '<div class="masthead"><div class="container">' +
      '<a class="brand" href="' + href('index.html') + '" aria-label="Southern Food Basket, home">' + LOGO + '</a>' +
      '<div class="masthead-actions"><a class="btn btn-ghost" href="' + href('locations.html') + '">' + icon('pin') + 'Find a store</a><a class="btn btn-accent" href="' + href('specials.html') + '">' + icon('tag') + 'Specials</a></div>' +
      '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav">' + icon('menu') + '<span>Menu</span></button>' +
      '</div></div>' +
      '<nav class="navband" aria-label="Main"><div class="container"><ul>' + navLinks + '</ul></div></nav>' +
      '<nav class="mobile-nav" id="mobile-nav" aria-label="Main"><ul>' + mobileLinks + '</ul>' +
      '<div class="mobile-cta"><a class="btn btn-accent" href="' + href('specials.html') + '">' + icon('tag') + 'Specials</a>' +
      '<a class="btn btn-ghost" href="' + href('portal/index.html') + '">' + icon('user') + 'Staff portal</a></div></nav>' +
      '<div class="ribbon" aria-hidden="true"></div>';
    const btn = el.querySelector('.menu-btn'), menu = el.querySelector('.mobile-nav');
    const set = open => {
      menu.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = icon(open ? 'close' : 'menu') + '<span>' + (open ? 'Close' : 'Menu') + '</span>';
    };
    btn.addEventListener('click', () => set(!menu.classList.contains('is-open')));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); } });
  }

  function renderSiteFooter(el) {
    const d = window.SFBStore ? SFBStore.load() : { branches: [], settings: {} };
    const branches = (d.branches || []).map(b => '<li class="footer-branch"><a href="' + href('locations.html#' + esc(b.id)) + '"><strong>' + esc(b.name) + '</strong></a><span>' + esc(b.short || b.address) + '</span></li>').join('');
    const ig = (d.settings || {}).instagram;
    el.className = 'site-footer';
    el.innerHTML =
      '<div class="facade-band" aria-hidden="true"></div>' +
      '<div class="container"><div class="footer-grid">' +
      '<div><a class="brand" href="' + href('index.html') + '" aria-label="Southern Food Basket, home">' + LOGO + '</a><p style="margin-top:16px">Supermarket and wholesale for the south of Trinidad.</p>' + (d.settings && d.settings.phone ? '<p><a href="' + telHref(d.settings.phone) + '">' + esc(d.settings.phone) + '</a></p>' : '') + '</div>' +
      '<div><h4>Our stores</h4><ul>' + branches + '</ul></div>' +
      '<div><h4>Shop</h4><ul><li><a href="' + href('specials.html') + '">Specials</a></li><li><a href="' + href('departments.html') + '">Departments</a></li><li><a href="' + href('wholesale.html') + '">Wholesale and trade</a></li><li><a href="' + href('locations.html') + '">Store hours</a></li></ul></div>' +
      '<div><h4>Company</h4><ul><li><a href="' + href('about.html') + '">About us</a></li><li><a href="' + href('careers/index.html') + '">Careers</a></li><li><a href="' + href('portal/index.html') + '">Staff portal</a></li><li><a href="' + href('hr/index.html') + '">HR console</a></li>' +
      (ig ? '<li><a href="' + esc(ig.url) + '" target="_blank" rel="noopener">' + esc(ig.handle) + ' on Instagram<span class="visually-hidden"> (opens in a new tab)</span></a></li>' : '') + '</ul></div>' +
      '</div><div class="footer-bottom"><p>' + esc(DISCLAIMER) + '</p>' +
      '<p><span class="concept-pill">Unofficial concept</span> &nbsp; <button class="link-btn" type="button" data-reset-demo style="color:#F3EBDD">Reset demo data</button></p></div></div>';
  }

  /* dismissable banner on app-style pages (careers/hr/portal) */
  function renderBanner() {
    if (!document.body.hasAttribute('data-banner')) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('sfb-banner-dismissed') === '1'; } catch (e) {}
    if (dismissed) return;
    const b = document.createElement('div');
    b.className = 'concept-banner'; b.setAttribute('role', 'note');
    b.innerHTML = '<div class="container"><p><strong>Demo.</strong> ' + esc(DISCLAIMER) + ' Nothing you enter leaves this browser.</p><button type="button">Got it</button></div>';
    b.querySelector('button').addEventListener('click', () => { b.remove(); try { sessionStorage.setItem('sfb-banner-dismissed', '1'); } catch (e) {} });
    document.body.prepend(b);
  }

  /* app shell: sidebar + topbar around <main data-app-main> */
  const MY_PORTAL = [
    { id: 'home', label: 'Home', href: 'portal/home.html', icon: 'home' },
    { id: 'schedule', label: 'Schedule', href: 'portal/schedule.html', icon: 'calendar' },
    { id: 'leave', label: 'Leave', href: 'portal/leave.html', icon: 'sun' },
    { id: 'pay', label: 'Pay', href: 'portal/pay.html', icon: 'wallet' },
    { id: 'docs', label: 'Documents & training', href: 'portal/docs.html', icon: 'folder' },
    { id: 'profile', label: 'Profile', href: 'portal/profile.html', icon: 'user' }
  ];
  const APP_NAV = {
    applicant: [
      { id: 'me', label: 'My application', href: 'careers/me.html', icon: 'file' },
      { id: 'jobs', label: 'Browse jobs', href: 'careers/index.html', icon: 'search' }
    ],
    employee: MY_PORTAL,
    hr: [
      { id: 'pipeline', label: 'Hiring pipeline', href: 'hr/index.html#pipeline', icon: 'briefcase' },
      { id: 'roles', label: 'Jobs', href: 'hr/index.html#roles', icon: 'grid' },
      { id: 'compliance', label: 'Compliance', href: 'hr/index.html#compliance', icon: 'shield' },
      { group: 'My portal' }
    ].concat(MY_PORTAL),
    admin: [
      { id: 'deals', label: 'Specials', href: 'admin/index.html#deals', icon: 'tag' },
      { id: 'posts', label: 'Post maker', href: 'admin/index.html#posts', icon: 'camera' },
      { id: 'stores', label: 'Stores and hours', href: 'admin/index.html#stores', icon: 'store' },
      { id: 'notices', label: 'Staff notices', href: 'admin/index.html#notices', icon: 'bell' },
      { id: 'publish', label: 'Publish', href: 'admin/index.html#publish', icon: 'upload' },
      { group: 'My portal' }
    ].concat(MY_PORTAL)
  };
  const ROLE_LABEL = { applicant: 'Applicant', employee: 'Employee', hr: 'HR', admin: 'Store admin' };

  function renderAppShell() {
    const main = document.querySelector('[data-app-main]');
    if (!main) return;
    const section = document.body.getAttribute('data-app') || 'portal';
    const active = document.body.getAttribute('data-active') || '';
    const s = window.SFBStore ? SFBStore.session() : null;
    const role = (s && s.role) || (section === 'hr' ? 'hr' : section === 'admin' ? 'admin' : section === 'careers' ? 'applicant' : 'employee');
    const user = window.SFBStore ? SFBStore.currentUser() : null;
    const nav = (APP_NAV[role] || []).map(n => n.group
      ? '<p class="app-nav-group">' + esc(n.group) + '</p>'
      : '<a href="' + href(n.href) + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span></a>').join('');
    const name = user ? user.name : ROLE_LABEL[role] || 'Guest';
    const title = document.body.getAttribute('data-title') || document.title.split('·')[0].trim();
    if (!main.id) main.id = 'app-main';

    const shell = document.createElement('div');
    shell.className = 'app';
    shell.innerHTML =
      '<a class="skip-link" href="#' + esc(main.id) + '">Skip to content</a>' +
      '<aside class="app-sidebar" id="app-sidebar" aria-label="Portal menu">' +
      '<a class="app-brand" href="' + href('index.html') + '">' + MONO + '<span>Southern Food Basket<small>' + esc(ROLE_LABEL[role] || '') + ' portal</small></span></a>' +
      '<nav class="app-nav" aria-label="Portal">' + nav + '</nav>' +
      '<div class="app-sidebar-foot">' +
      '<a href="' + href('portal/index.html') + '">' + icon('swap') + '<span>Switch role</span></a>' +
      '<button type="button" data-reset-demo>' + icon('logout') + '<span>Reset demo</span></button>' +
      '<p class="small">' + esc(DISCLAIMER) + '</p></div></aside>' +
      '<div class="app-body">' +
      '<header class="app-topbar">' +
      '<button class="app-menu-btn" type="button" aria-expanded="false" aria-controls="app-sidebar">' + icon('menu') + '<span>Menu</span></button>' +
      '<div class="app-topbar-title"><span class="eyebrow" style="margin:0">' + esc(ROLE_LABEL[role] || '') + '</span><strong>' + esc(title) + '</strong></div>' +
      '<div class="app-user"><span class="app-avatar" aria-hidden="true">' + esc(initials(name)) + '</span><span class="app-user-name">' + esc(name) + '</span></div>' +
      '</header></div>';
    main.parentNode.insertBefore(shell, main);
    shell.querySelector('.app-body').appendChild(main);
    main.classList.add('app-main');

    const btn = shell.querySelector('.app-menu-btn'), sidebar = shell.querySelector('.app-sidebar');
    const wide = window.matchMedia('(min-width: 910px)');
    const set = open => {
      shell.classList.toggle('sidebar-open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = icon(open ? 'close' : 'menu') + '<span>' + (open ? 'Close' : 'Menu') + '</span>';
      /* a closed off-canvas sidebar must leave the tab order and the accessibility tree */
      if (wide.matches || open) sidebar.removeAttribute('inert'); else sidebar.setAttribute('inert', '');
    };
    set(false);
    btn.addEventListener('click', () => set(!shell.classList.contains('sidebar-open')));
    shell.addEventListener('click', e => { if (e.target === shell && shell.classList.contains('sidebar-open')) { set(false); btn.focus(); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && shell.classList.contains('sidebar-open')) { set(false); btn.focus(); } });
    (wide.addEventListener ? wide.addEventListener('change', () => set(false)) : wide.addListener(() => set(false)));
  }

  /* small helpers */
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'SF'; }
  /* Dates: a bare YYYY-MM-DD is a calendar day in the viewer's timezone (never UTC midnight, which
     renders a day early in Trinidad). Month names are fixed so ICU quirks like "Sept" cannot appear. */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function parseDate(v) {
    if (v instanceof Date) return v;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const p = v.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
    return new Date(v);
  }
  /* fmtDate('2026-11-18') -> '18 Nov 2026'; opts.year === false drops the year; opts.weekday adds 'Wed '. */
  function fmtDate(iso, opts) {
    if (!iso) return '';
    const d = parseDate(iso); if (isNaN(d)) return esc(iso);
    opts = opts || {};
    const core = d.getDate() + ' ' + MONTHS[d.getMonth()] + (opts.year === false ? '' : ' ' + d.getFullYear());
    return (opts.weekday ? DAYS[d.getDay()] + ' ' : '') + core;
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    const d = parseDate(iso); if (isNaN(d)) return esc(iso);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am'; const hh = ((h + 11) % 12) + 1;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + hh + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }
  function fmtTime(hhmm) {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am'; const hh = ((h + 11) % 12) + 1;
    return hh + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }
  function fileSize(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  function stageBadge(stageId) {
    const d = SFBStore.load();
    const s = (d.stages || []).find(x => x.id === stageId) || { label: stageId, tone: 'plain' };
    return '<span class="badge badge-' + esc(s.tone || 'plain') + '">' + esc(s.label) + '</span>';
  }
  const DOC_STATE = {
    missing: { label: 'Not provided', cls: '' },
    uploaded: { label: 'Awaiting review', cls: 'badge-warn' },
    verified: { label: 'Verified', cls: 'badge-ok' },
    flagged: { label: 'Needs attention', cls: 'badge-bad' },
    expired: { label: 'Expired', cls: 'badge-bad' },
    expiring: { label: 'Expiring soon', cls: 'badge-warn' }
  };
  function docBadge(state) {
    const s = DOC_STATE[state] || DOC_STATE.missing;
    return '<span class="badge ' + s.cls + '">' + s.label + '</span>';
  }
  /* derive the displayed state of a document, taking expiry into account */
  function docDisplayState(doc) {
    if (!doc || !doc.state || doc.state === 'missing') return 'missing';
    if (doc.state === 'verified' && doc.expiry) {
      const days = SFBStore.daysUntil(doc.expiry);
      if (days != null && days < 0) return 'expired';
      if (days != null && days <= 45) return 'expiring';
    }
    return doc.state;
  }

  /* Price seal, after the company's "1 FOR $x · TRY ME" posts. Decorative: the same price must also be
     present as text for screen readers (deal cards add a visually hidden line). */
  const SCALLOP = (function () {
    const n = 18, rIn = 41, rOut = 53, c = 50, step = Math.PI * 2 / n;
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = i * step - Math.PI / 2, a1 = (i + 1) * step - Math.PI / 2, am = (i + 0.5) * step - Math.PI / 2;
      const p0 = [c + rIn * Math.cos(a0), c + rIn * Math.sin(a0)], p1 = [c + rIn * Math.cos(a1), c + rIn * Math.sin(a1)], q = [c + rOut * Math.cos(am), c + rOut * Math.sin(am)];
      if (i === 0) d += 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2);
      d += 'Q' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + ' ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
    }
    return d + 'Z';
  })();
  function seal(price, opts) {
    opts = opts || {};
    const amt = Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '<div class="seal" aria-hidden="true"><svg class="seal-bg" viewBox="0 0 100 100" focusable="false"><path d="' + SCALLOP + '" fill="#D3202D"/>' +
      '<circle cx="50" cy="50" r="35" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 2"/></svg>' +
      '<div class="seal-in"><span class="seal-qty">' + esc(opts.qty || '1 FOR') + '</span><span class="seal-price">$' + esc(amt) + '</span></div>' +
      (opts.tryMe === false ? '' : '<span class="seal-try">TRY ME</span>') + '</div>';
  }

  /* toasts */
  let host;
  function toast(msg, kind) {
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast-' + kind : ''); t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 200ms'; setTimeout(() => t.remove(), 220); }, 3600);
  }

  let dlgSeq = 0;
  /* confirm({ title, body, okLabel, danger }) -> Promise<boolean> */
  function confirm(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const id = 'sfb-dlg-' + (++dlgSeq);
      const dlg = document.createElement('dialog'); dlg.className = 'sfb-dialog';
      dlg.setAttribute('aria-labelledby', id + '-t'); dlg.setAttribute('aria-describedby', id + '-b');
      dlg.innerHTML = '<form method="dialog"><div class="dialog-body"><h3 id="' + id + '-t">' + esc(opts.title || 'Are you sure?') + '</h3><p id="' + id + '-b">' + esc(opts.body || '') + '</p></div>' +
        '<div class="dialog-actions"><button class="btn btn-ghost" value="cancel" type="submit">Cancel</button><button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" value="ok" type="submit">' + esc(opts.okLabel || 'Confirm') + '</button></div></form>';
      document.body.appendChild(dlg);
      dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
      dlg.showModal();
    });
  }
  /* prompt({ title, body, label, placeholder, okLabel }) -> Promise<string|null> */
  function prompt(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const id = 'sfb-dlg-' + (++dlgSeq);
      const dlg = document.createElement('dialog'); dlg.className = 'sfb-dialog';
      dlg.setAttribute('aria-labelledby', id + '-t');
      dlg.innerHTML = '<form method="dialog"><div class="dialog-body"><h3 id="' + id + '-t">' + esc(opts.title || '') + '</h3>' + (opts.body ? '<p>' + esc(opts.body) + '</p>' : '') +
        '<label for="' + id + '-in">' + esc(opts.label || 'Reason') + '</label><textarea id="' + id + '-in" placeholder="' + esc(opts.placeholder || '') + '"></textarea></div>' +
        '<div class="dialog-actions"><button class="btn btn-ghost" value="cancel" type="submit">Cancel</button><button class="btn btn-primary" value="ok" type="submit">' + esc(opts.okLabel || 'Save') + '</button></div></form>';
      document.body.appendChild(dlg);
      const ta = dlg.querySelector('textarea');
      dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok' ? ta.value.trim() : null); dlg.remove(); });
      dlg.showModal(); ta.focus();
    });
  }

  /* picture tile with graceful fallback when an image is missing */
  function pic(src, alt, opts) {
    opts = opts || {};
    const cls = 'pic' + (opts.cls ? ' ' + opts.cls : '');
    const style = opts.ar ? ' style="--ar:' + esc(opts.ar) + '"' : '';
    return '<figure class="' + cls + '"' + style + '><img src="' + esc(href(src)) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async"></figure>';
  }
  function wirePics(scope) {
    (scope || document).querySelectorAll('.pic img').forEach(img => {
      const mark = () => img.closest('.pic').classList.add('is-missing');
      if (img.complete && img.naturalWidth === 0) mark();
      img.addEventListener('error', mark, { once: true });
    });
  }

  function wireResetButtons(scope) {
    (scope || document).querySelectorAll('[data-reset-demo]').forEach(b => b.addEventListener('click', async () => {
      const ok = await confirm({ title: 'Reset demo data?', body: 'This clears everything you changed in this browser and signs you out of the demo portals.', okLabel: 'Reset', danger: true });
      if (!ok) return;
      SFBStore.reset();
      location.href = href('index.html');
    }));
  }

  function boot() {
    document.querySelectorAll('[data-sfb-header]').forEach(renderSiteHeader);
    document.querySelectorAll('[data-sfb-footer]').forEach(renderSiteFooter);
    renderAppShell();
    renderBanner();
    wireResetButtons();
    wirePics();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.SFBUI = { ROOT, DISCLAIMER, href, esc, icon, LOGO, MONO, SITE_NAV, APP_NAV, initials, parseDate, fmtDate, fmtDateTime, fmtTime, fileSize, qs, MONTHS, DAYS,
    todayHours, mapsDir, mapsView, telHref, stageBadge, docBadge, docDisplayState, DOC_STATE, seal, toast, confirm, prompt, pic, wirePics, wireResetButtons };
})();
