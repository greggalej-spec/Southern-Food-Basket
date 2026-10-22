/* Southern Food Basket — shared UI: brand mark, site header/footer, app shell, banner, toasts, dialogs, helpers.
   Every page includes this after store.js. Reads <html data-root="./|../"> to build links. */
(function () {
  const ROOT = document.documentElement.getAttribute('data-root') || './';
  const DISCLAIMER = 'Unofficial concept by Trinovata. Not affiliated with Southern Food Basket Ltd. All people, jobs, prices and documents are demo data.';
  const href = p => ROOT + p;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Basket glyph: our own asset (DESIGN.md "Mark"). */
  const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M12 15c0-6 3.5-10 8-10s8 4 8 10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M5 16h30l-3.2 15.2A4 4 0 0 1 27.9 34H12.1a4 4 0 0 1-3.9-2.8L5 16Z" fill="currentColor"/><path d="M11 20l2.5 10M17 20l1.2 10M23 20l-1.2 10M29 20l-2.5 10M8 24h24M9.5 29h21" fill="none" stroke="#FAF7F0" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const MONO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect width="40" height="40" rx="10" fill="currentColor"/><path d="M14 13c0-3.5 2.6-6 6-6s6 2.5 6 6" fill="none" stroke="#FAF7F0" stroke-width="2" stroke-linecap="round"/><path d="M9 14h22l-2.4 11.3A3 3 0 0 1 25.7 28H14.3a3 3 0 0 1-2.9-2.3L9 14Z" fill="#FAF7F0"/><path d="M13.5 17.5l1.8 7.5M19 17.5l.8 7.5M23.5 17.5l-.8 7.5M27 17.5l-1.8 7.5M11 20.5h18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>';

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
    basket: '<path d="M5 10h14l-1.5 9H6.5L5 10Z"/><path d="M8 10l3-6M16 10l-3-6M3 10h18"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  const SITE_NAV = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'departments', label: 'Departments', href: 'departments.html' },
    { id: 'specials', label: 'Specials', href: 'specials.html' },
    { id: 'wholesale', label: 'Wholesale', href: 'wholesale.html' },
    { id: 'locations', label: 'Locations', href: 'locations.html' },
    { id: 'about', label: 'About', href: 'about.html' },
    { id: 'careers', label: 'Careers', href: 'careers/index.html' }
  ];

  function brandHtml(opts) {
    opts = opts || {};
    return '<a class="brand" href="' + href(opts.href || 'index.html') + '" aria-label="Southern Food Basket home">' + LOGO +
      '<span><span class="brand-name">Southern Food Basket</span><span class="brand-sub">' + esc(opts.sub || 'The South’s basket') + '</span></span></a>';
  }

  function renderSiteHeader(el) {
    const active = el.getAttribute('data-active') || '';
    const links = SITE_NAV.map(n => '<a href="' + href(n.href) + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a>').join('');
    el.className = 'site-header';
    el.innerHTML =
      '<a class="skip-link" href="#main">Skip to content</a>' +
      '<div class="container">' + brandHtml() +
      '<nav class="nav" aria-label="Primary">' + links + '</nav>' +
      '<div class="cluster" style="--gap:8px">' +
      '<a class="btn btn-ghost btn-sm nav-cta" href="' + href('portal/index.html') + '">' + icon('user') + ' Staff portal</a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open menu">' + icon('menu') + '</button>' +
      '</div></div>' +
      '<div class="mobile-nav" id="mobile-nav">' + links +
      '<div class="mobile-cta"><a class="btn btn-primary" href="' + href('careers/index.html') + '">See open roles</a>' +
      '<a class="btn btn-ghost" href="' + href('portal/index.html') + '">' + icon('user') + ' Staff portal</a></div></div>';
    const btn = el.querySelector('.nav-toggle'), menu = el.querySelector('.mobile-nav');
    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      btn.innerHTML = icon(open ? 'close' : 'menu');
    });
  }

  function renderSiteFooter(el) {
    const d = window.SFBStore ? SFBStore.load() : { branches: [], settings: {} };
    const branches = (d.branches || []).map(b => '<li><a href="' + href('locations.html#' + esc(b.id)) + '">' + esc(b.name) + '</a></li>').join('');
    el.className = 'site-footer';
    el.innerHTML =
      '<div class="container"><div class="footer-grid">' +
      '<div>' + brandHtml({ sub: 'Since 1998 · South Trinidad' }) + '<p style="margin-top:16px">Supermarket and wholesale for the south. Fresh produce, meats, pantry staples and bulk supply from three branches.</p></div>' +
      '<div><h4>Shop</h4><ul><li><a href="' + href('departments.html') + '">Departments</a></li><li><a href="' + href('specials.html') + '">This week’s specials</a></li><li><a href="' + href('wholesale.html') + '">Wholesale &amp; export</a></li></ul></div>' +
      '<div><h4>Branches</h4><ul>' + branches + '</ul></div>' +
      '<div><h4>Company</h4><ul><li><a href="' + href('about.html') + '">About</a></li><li><a href="' + href('careers/index.html') + '">Careers</a></li><li><a href="' + href('portal/index.html') + '">Staff portal</a></li><li><a href="' + href('hr/index.html') + '">HR console</a></li></ul></div>' +
      '</div><div class="footer-bottom"><p>' + esc(DISCLAIMER) + ' Branch addresses are from public directories and unverified.</p>' +
      '<p><span class="concept-pill">Unofficial concept</span> &nbsp; <button class="link-btn" type="button" data-reset-demo style="color:#DCE5DD">Reset demo data</button></p></div></div>';
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
  const APP_NAV = {
    applicant: [
      { id: 'me', label: 'My application', href: 'careers/me.html', icon: 'file' },
      { id: 'jobs', label: 'Browse roles', href: 'careers/index.html', icon: 'search' }
    ],
    employee: [
      { id: 'home', label: 'Home', href: 'portal/home.html', icon: 'home' },
      { id: 'schedule', label: 'Schedule', href: 'portal/schedule.html', icon: 'calendar' },
      { id: 'leave', label: 'Leave', href: 'portal/leave.html', icon: 'sun' },
      { id: 'pay', label: 'Pay', href: 'portal/pay.html', icon: 'wallet' },
      { id: 'docs', label: 'Documents & training', href: 'portal/docs.html', icon: 'folder' },
      { id: 'profile', label: 'Profile', href: 'portal/profile.html', icon: 'user' }
    ],
    hr: [
      { id: 'pipeline', label: 'Hiring pipeline', href: 'hr/index.html#pipeline', icon: 'briefcase' },
      { id: 'roles', label: 'Roles', href: 'hr/index.html#roles', icon: 'grid' },
      { id: 'compliance', label: 'Compliance', href: 'hr/index.html#compliance', icon: 'shield' },
      { id: 'home', label: 'My portal', href: 'portal/home.html', icon: 'home' }
    ]
  };
  const ROLE_LABEL = { applicant: 'Applicant', employee: 'Employee', hr: 'HR' };

  function renderAppShell() {
    const main = document.querySelector('[data-app-main]');
    if (!main) return;
    const section = document.body.getAttribute('data-app') || 'portal';
    const active = document.body.getAttribute('data-active') || '';
    const s = window.SFBStore ? SFBStore.session() : null;
    const role = (s && s.role) || (section === 'hr' ? 'hr' : section === 'careers' ? 'applicant' : 'employee');
    const user = window.SFBStore ? SFBStore.currentUser() : null;
    const nav = (APP_NAV[role] || []).map(n => '<a href="' + href(n.href) + '"' + (n.id === active ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span></a>').join('');
    const name = user ? user.name : ROLE_LABEL[role] || 'Guest';
    const title = document.body.getAttribute('data-title') || document.title.split('·')[0].trim();

    const shell = document.createElement('div');
    shell.className = 'app';
    shell.innerHTML =
      '<aside class="app-sidebar" id="app-sidebar">' +
      '<a class="app-brand" href="' + href('index.html') + '">' + MONO + '<span>Southern Food Basket<small>' + esc(ROLE_LABEL[role] || '') + ' portal</small></span></a>' +
      '<nav class="app-nav" aria-label="Portal">' + nav + '</nav>' +
      '<div class="app-sidebar-foot">' +
      '<a href="' + href('portal/index.html') + '">' + icon('swap') + '<span>Switch role</span></a>' +
      '<button type="button" data-reset-demo>' + icon('logout') + '<span>Reset demo</span></button>' +
      '<p class="small">Demo data only. Nothing leaves this browser.</p></div></aside>' +
      '<div class="app-body">' +
      '<header class="app-topbar">' +
      '<button class="app-menu-btn" type="button" aria-expanded="false" aria-controls="app-sidebar" aria-label="Open portal menu">' + icon('menu') + '</button>' +
      '<div class="app-topbar-title"><span class="eyebrow" style="margin:0">' + esc(ROLE_LABEL[role] || '') + '</span><strong>' + esc(title) + '</strong></div>' +
      '<div class="app-user"><span class="app-avatar" aria-hidden="true">' + esc(initials(name)) + '</span><span class="app-user-name">' + esc(name) + '</span></div>' +
      '</header></div>';
    main.parentNode.insertBefore(shell, main);
    shell.querySelector('.app-body').appendChild(main);
    main.classList.add('app-main');
    const btn = shell.querySelector('.app-menu-btn');
    btn.addEventListener('click', () => {
      const open = shell.classList.toggle('sidebar-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = icon(open ? 'close' : 'menu');
    });
    shell.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('app')) shell.classList.remove('sidebar-open'); });
  }

  /* small helpers */
  function initials(name) { return String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'SF'; }
  function fmtDate(iso, opts) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

  /* toasts */
  let host;
  function toast(msg, kind) {
    if (!host) { host = document.createElement('div'); host.className = 'toast-host'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' toast-' + kind : ''); t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 200ms'; setTimeout(() => t.remove(), 220); }, 3200);
  }

  /* confirm({ title, body, okLabel, danger }) -> Promise<boolean> */
  function confirm(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const dlg = document.createElement('dialog'); dlg.className = 'sfb-dialog';
      dlg.innerHTML = '<form method="dialog"><div class="dialog-body"><h3>' + esc(opts.title || 'Are you sure?') + '</h3><p>' + esc(opts.body || '') + '</p></div>' +
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
      const dlg = document.createElement('dialog'); dlg.className = 'sfb-dialog';
      dlg.innerHTML = '<form method="dialog"><div class="dialog-body"><h3>' + esc(opts.title || '') + '</h3>' + (opts.body ? '<p>' + esc(opts.body) + '</p>' : '') +
        '<label for="sfb-prompt-input">' + esc(opts.label || 'Reason') + '</label><textarea id="sfb-prompt-input" placeholder="' + esc(opts.placeholder || '') + '"></textarea></div>' +
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
    const cls = 'pic' + (opts.tone ? ' tone-' + opts.tone : '') + (opts.cls ? ' ' + opts.cls : '');
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

  window.SFBUI = { ROOT, DISCLAIMER, href, esc, icon, LOGO, MONO, SITE_NAV, APP_NAV, initials, fmtDate, fmtDateTime, fmtTime, fileSize, qs,
    stageBadge, docBadge, docDisplayState, DOC_STATE, toast, confirm, prompt, pic, wirePics, wireResetButtons };
})();
