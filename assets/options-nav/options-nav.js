/* Homepage-designs switcher: Main (Grand Entrance, the home page) and options A to C, on every homepage design.
   The pill compacts to a sphere that can be dragged or flicked to either bottom corner; it never disappears.
   Include in <head>: <script src="assets/options-nav/options-nav.js" data-option="d" data-root=""></script>
   data-option: this page's design (d = Main; blank on the chooser). data-root: path from this page to the site root. */
(function () {
  'use strict';
  const DESIGNS = [
    { id: 'd', path: 'index.html', short: 'Main', face: '★', label: 'Main design · Grand Entrance', aria: 'Main design, Grand Entrance' },
    { id: 'a', path: 'options/a/index.html', short: 'A', face: 'A', label: 'Option A · The Storefront', aria: 'Option A, The Storefront' },
    { id: 'b', path: 'options/b/index.html', short: 'B', face: 'B', label: 'Option B · The Weekly Flyer', aria: 'Option B, The Weekly Flyer' },
    { id: 'c', path: 'options/c/index.html', short: 'C', face: 'C', label: 'Option C · Market Day', aria: 'Option C, Market Day' }
  ];
  const GRID = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/></svg>';
  const SHRINK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h4V2M14 10h-4v4M10 2v4h4M6 14v-4H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: corner just isn't remembered */ } } };

  // the corner is known before first paint, so the page-to-page bloom starts from it
  let side = store.get('sfbx-side') === 'left' ? 'left' : 'right';
  document.documentElement.setAttribute('data-sfbx-side', side);

  // a cross-page transition the browser skips (background tab, fast clicks) rejects its promises; that is not an error here
  const quiet = e => { const v = e.viewTransition; if (v) ['ready', 'finished', 'updateCallbackDone'].forEach(k => v[k] && v[k].catch(() => {})); };
  window.addEventListener('pagereveal', quiet);
  window.addEventListener('pageswap', quiet);

  const me = document.currentScript;
  const current = ((me && me.getAttribute('data-option')) || '').toLowerCase();
  const root = (me && me.getAttribute('data-root')) || '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function build() {
    const nav = document.createElement('nav');
    nav.className = 'sfbx is-collapsed side-' + side; nav.setAttribute('aria-label', 'Homepage designs');
    const label = document.createElement('span'); label.className = 'sfbx-label'; label.setAttribute('aria-hidden', 'true');
    const dock = document.createElement('div'); dock.className = 'sfbx-dock';
    const track = document.createElement('div'); track.className = 'sfbx-track'; track.id = 'sfbx-track';
    const glow = document.createElement('span'); glow.className = 'sfbx-glow'; glow.setAttribute('aria-hidden', 'true');
    track.appendChild(glow);

    const all = document.createElement('a');
    all.className = 'sfbx-all'; all.href = root + 'options/index.html';
    all.innerHTML = GRID + '<span>All designs</span>';
    all.dataset.badge = '☷'; all.dataset.label = 'Compare all four designs';
    if (!current) all.setAttribute('aria-current', 'page');
    track.appendChild(all);
    const sep = document.createElement('span'); sep.className = 'sfbx-sep'; sep.setAttribute('aria-hidden', 'true');
    track.appendChild(sep);

    const links = [all];
    let here = null;
    DESIGNS.forEach(o => {
      const a = document.createElement('a');
      a.className = 'sfbx-opt' + (o.id === 'd' ? ' sfbx-main' : ''); a.href = root + o.path;
      a.textContent = o.short; a.setAttribute('aria-label', o.aria);
      a.dataset.badge = o.face; a.dataset.label = o.label;
      if (o.id === current) { a.setAttribute('aria-current', 'page'); here = o; }
      track.appendChild(a); links.push(a);
    });
    const min = document.createElement('button');
    min.type = 'button'; min.className = 'sfbx-min'; min.setAttribute('aria-label', 'Shrink the designs switcher'); min.innerHTML = SHRINK;
    track.appendChild(min);

    const orb = document.createElement('button');
    orb.type = 'button'; orb.className = 'sfbx-orb';
    orb.setAttribute('aria-controls', track.id); orb.setAttribute('aria-expanded', 'false');
    orb.setAttribute('aria-label', 'Homepage designs, now showing ' + (here ? here.aria : 'all designs') + '. Drag to either corner.');
    if (here) { orb.appendChild(document.createTextNode(here.face)); const dot = document.createElement('span'); dot.className = 'sfbx-dot'; dot.setAttribute('aria-hidden', 'true'); orb.appendChild(dot); }
    else orb.innerHTML = GRID;

    dock.appendChild(track); dock.appendChild(orb);
    nav.appendChild(label); nav.appendChild(dock);
    document.body.appendChild(nav);

    const home = links.find(a => a.hasAttribute('aria-current')) || all;

    /* ---------- label and glow ---------- */
    function setLabel(a) {
      label.classList.toggle('is-all', a === all);
      label.textContent = '';
      const b = document.createElement('b'); b.textContent = a.dataset.badge;
      label.appendChild(b); label.appendChild(document.createTextNode(a.dataset.label));
      label.classList.remove('swap'); void label.offsetWidth; label.classList.add('swap');
    }
    function moveGlow(a) {
      glow.style.width = a.offsetWidth + 'px';
      glow.style.transform = 'translateX(' + a.offsetLeft + 'px)';
      glow.classList.toggle('is-all', a === all);
      track.classList.add('has-glow');
    }
    let labelTimer;
    function peek(a, hold) {
      moveGlow(a); setLabel(a); nav.classList.add('show-label');
      clearTimeout(labelTimer);
      if (!hold) labelTimer = setTimeout(() => nav.classList.remove('show-label'), 2400);
    }
    links.forEach(a => {
      a.addEventListener('mouseenter', () => peek(a, true));
      a.addEventListener('focus', () => peek(a, true));
    });
    const rest = () => { moveGlow(home); setLabel(home); clearTimeout(labelTimer); labelTimer = setTimeout(() => nav.classList.remove('show-label'), 900); };
    track.addEventListener('mouseleave', rest);
    track.addEventListener('focusout', e => { if (!track.contains(e.relatedTarget)) rest(); });
    const settle = () => moveGlow(home);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
    window.addEventListener('resize', settle);

    /* ---------- pill <-> sphere ---------- */
    let expanded = false, openedAtY = 0, autoTimer;
    function setExpanded(open, moveFocus) {
      expanded = open; clearTimeout(autoTimer);
      nav.classList.toggle('is-collapsed', !open);
      orb.setAttribute('aria-expanded', String(open));
      track.inert = !open;
      if (open) { settle(); openedAtY = window.scrollY; if (moveFocus) home.focus({ preventScroll: true }); }
      else {
        nav.classList.remove('show-label');
        if (moveFocus) orb.focus({ preventScroll: true });
        if (!store.get('sfbx-hinted')) { nav.classList.add('hint'); store.set('sfbx-hinted', '1'); }
      }
    }
    const busy = () => nav.matches(':hover') || nav.contains(document.activeElement);
    function scheduleCollapse(ms) { clearTimeout(autoTimer); autoTimer = setTimeout(function tick() { if (busy()) { autoTimer = setTimeout(tick, 1200); return; } setExpanded(false); }, ms); }

    // arrive open and say where we are, then compact to the sphere
    track.inert = true;
    requestAnimationFrame(() => { setExpanded(true); peek(home, false); scheduleCollapse(reduce.matches ? 2600 : 3200); });

    orb.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      setExpanded(true, true); peek(home, false); scheduleCollapse(6000);
    });
    min.addEventListener('click', () => setExpanded(false, true));
    nav.addEventListener('keydown', e => { if (e.key === 'Escape' && expanded) { e.stopPropagation(); setExpanded(false, true); } });
    document.addEventListener('pointerdown', e => { if (expanded && !nav.contains(e.target)) setExpanded(false); });
    window.addEventListener('scroll', () => { if (expanded && !busy() && Math.abs(window.scrollY - openedAtY) > 48) setExpanded(false); }, { passive: true });

    /* ---------- drag or flick the sphere to either corner ---------- */
    let drag = null, suppressClick = false;
    orb.addEventListener('pointerdown', e => {
      if (e.button !== 0 || !nav.classList.contains('is-collapsed')) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, lt: performance.now(), vx: 0, moved: false };
      orb.setPointerCapture(e.pointerId);
    });
    orb.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved) { if (Math.hypot(dx, dy) < 6) return; drag.moved = true; nav.classList.add('is-dragging'); nav.classList.remove('hint'); }
      const now = performance.now();
      drag.vx = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
      nav.style.transform = 'translate(' + dx + 'px,' + Math.min(0, dy) * 0.4 + 'px)'; // sideways freely, upward with resistance
    });
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (!d.moved) return;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 350);
      const from = orb.getBoundingClientRect(), cx = from.left + from.width / 2;
      const next = Math.abs(d.vx) > 0.45 ? (d.vx < 0 ? 'left' : 'right') : (cx < window.innerWidth / 2 ? 'left' : 'right');
      nav.classList.remove('is-dragging');
      snapTo(next, from);
    }
    orb.addEventListener('pointerup', endDrag);
    orb.addEventListener('pointercancel', endDrag);
    function snapTo(next, from) {
      side = next; store.set('sfbx-side', side); document.documentElement.setAttribute('data-sfbx-side', side);
      nav.classList.toggle('side-left', side === 'left'); nav.classList.toggle('side-right', side === 'right');
      nav.style.transition = 'none'; nav.style.transform = '';
      const to = orb.getBoundingClientRect();
      nav.style.transform = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px)';
      void nav.offsetWidth;
      nav.style.transition = reduce.matches ? 'none' : 'transform .55s cubic-bezier(.22, 1, .36, 1)';
      nav.style.transform = '';
      setTimeout(() => { nav.style.transition = ''; }, 600);
    }
    // keyboard users can move it too
    orb.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = e.key === 'ArrowLeft' ? 'left' : 'right';
      if (next !== side) { e.preventDefault(); snapTo(next, orb.getBoundingClientRect()); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
