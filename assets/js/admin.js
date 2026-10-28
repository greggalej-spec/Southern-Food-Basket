/* Southern Food Basket — store admin: specials, Instagram post maker, stores and hours, staff notices, publish.
   Role: admin (SFBStore.requireRole). All state lives in SFBStore (localStorage). The public pages in the same
   browser read the same data, so a save here shows on specials.html, locations.html and the portal straight away.
   Photos are picked from the existing library by file stem: no file bytes or data URLs ever go into the store. */
(function () {
  const S = window.SFBStore, U = window.SFBUI;
  if (!S || !U) return;
  const s = SFBStore.requireRole(['admin']); if (!s) return;

  const esc = U.esc, icon = U.icon;
  const $ = id => document.getElementById(id);
  const TABS = ['deals', 'posts', 'stores', 'notices', 'publish'];
  const cssEsc = v => (window.CSS && CSS.escape ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, '\\$&'));

  /* ---------- helpers ---------- */
  function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isDay(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !isNaN(S.parseDay(v)); }
  function stemOf(img) { return String(img || '').replace(/^.*\//, '').replace(/\.webp$/i, ''); }
  function photoSrc(stem) { return U.href('assets/img/photos/' + stem + '.webp'); }
  function photoLabel(stem) { const t = String(stem).replace(/-/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); }
  function dollars(v) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dept(d, id) { return S.byId(d.departments, id) || { id: id, name: id, short: id }; }
  function branchName(d, id) { const b = S.byId(d.branches, id); return b ? b.name : 'A store no longer listed'; }
  function retailDepts(d) { return (d.departments || []).filter(x => x.id !== 'wholesale'); }
  function newestFirst(list) { return list.slice().sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0)); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  /* the photo library: every distinct photo already used by a deal or a department, in the seed or in this browser */
  function photoLibrary(d) {
    const seen = new Set();
    const add = img => { const st = stemOf(img); if (/^[a-z0-9][a-z0-9-]*$/i.test(st)) seen.add(st); };
    [window.SFB_DATA || {}, d].forEach(src => {
      (src.specials || []).forEach(sp => add(sp.img));
      (src.departments || []).forEach(x => add(x.img));
    });
    return Array.from(seen).sort();
  }
  /* key-order-independent JSON, so "changed then changed back" counts as unchanged */
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }

  /* field errors: the error element is #<input id>-err and the hint (if any) is #<input id>-hint */
  function setFieldError(input, msg) {
    if (!input) return;
    const err = $(input.id + '-err'), hint = $(input.id + '-hint');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
    const ids = [hint ? hint.id : '', msg && err ? err.id : ''].filter(Boolean).join(' ');
    if (ids) input.setAttribute('aria-describedby', ids); else input.removeAttribute('aria-describedby');
  }
  /* apply a { fieldName: message } map to a form; returns the first invalid control */
  function applyErrors(form, names, errors) {
    let first = null;
    names.forEach(n => {
      const f = form.elements[n]; if (!f) return;
      setFieldError(f, errors[n] || '');
      if (errors[n] && !first) first = f;
    });
    return first;
  }
  /* once a field has been marked invalid, re-check it as the user types */
  function liveRevalidate(form, names, check) {
    names.forEach(n => {
      const f = form.elements[n]; if (!f) return;
      const ev = f.tagName === 'SELECT' || f.type === 'date' ? 'change' : 'input';
      f.addEventListener(ev, () => { if (f.getAttribute('aria-invalid') === 'true') setFieldError(f, check()[n] || ''); });
    });
  }

  /* ---------- stats ---------- */
  function renderStats() {
    const d = S.load(), sp = d.specials || [];
    const stat = (label, value, sub) => '<div class="stat"><div class="stat-label">' + esc(label) + '</div><div class="stat-value">' + esc(String(value)) + '</div><div class="stat-sub">' + esc(sub) + '</div></div>';
    $('admin-stats').innerHTML =
      stat('Live deals', sp.length, 'on the Specials page') +
      stat('Tagged Couva', sp.filter(x => x.couva).length, 'deals with the Couva pin') +
      stat('Stores', (d.branches || []).length, 'hours and phone numbers') +
      stat('Staff notices', (d.announcements || []).length, 'on the employee portal');
  }

  /* ---------- tabs (#deals, #posts, #stores, #notices, #publish) ---------- */
  const tabsEl = $('admin-tabs');
  function currentTab() { const h = location.hash.replace('#', ''); return TABS.includes(h) ? h : 'deals'; }
  function showTab(id) {
    TABS.forEach(t => {
      const sec = $('panel-' + t); if (sec) sec.hidden = t !== id;
      const btn = $('tab-' + t); if (btn) { btn.setAttribute('aria-selected', String(t === id)); btn.tabIndex = t === id ? 0 : -1; }
    });
    document.querySelectorAll('.app-nav a').forEach(a => {
      const h = (a.getAttribute('href') || '').split('#')[1];
      if (!h || !TABS.includes(h)) return;
      if (h === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    /* on a phone the tab strip scrolls sideways: bring the selected tab into view */
    const sel = $('tab-' + id);
    if (sel && tabsEl.scrollWidth > tabsEl.clientWidth) {
      const br = sel.getBoundingClientRect(), tr = tabsEl.getBoundingClientRect();
      if (br.left < tr.left) tabsEl.scrollLeft -= tr.left - br.left + 16;
      else if (br.right > tr.right) tabsEl.scrollLeft += br.right - tr.right + 16;
    }
    if (id === 'posts') showPostMaker();
    if (id === 'publish') renderPublish();
  }
  tabsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]'); if (!btn) return;
    const id = btn.getAttribute('data-tab');
    if (currentTab() === id) showTab(id); else location.hash = id;
  });
  tabsEl.addEventListener('keydown', e => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = TABS.indexOf(currentTab());
    const n = e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS[TABS.length - 1] : TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    location.hash = n;
    const b = $('tab-' + n); if (b) b.focus();
  });
  /* the off-canvas sidebar links point at these tabs: close it so the section is not left hidden behind it */
  function closeSidebar() {
    const shell = document.querySelector('.app.sidebar-open'); if (!shell) return false;
    const mb = shell.querySelector('.app-menu-btn'); if (mb) mb.click();
    const panel = $('panel-' + currentTab()); if (panel) panel.focus({ preventScroll: true });
    return true;
  }
  window.addEventListener('hashchange', () => {
    if (drawerOpen) closeDrawer(false);
    showTab(currentTab());
    closeSidebar();
    const top = tabsEl.getBoundingClientRect().top;
    if (top < 64) window.scrollTo({ top: Math.max(0, window.scrollY + top - 80) });
  });
  /* a sidebar link to the tab already showing fires no hashchange, so close the sidebar here */
  document.addEventListener('click', e => {
    const a = e.target.closest('.app-nav a'); if (!a) return;
    const h = (a.getAttribute('href') || '').split('#')[1];
    if (h && TABS.includes(h) && location.hash === '#' + h) closeSidebar();
  });

  /* =====================================================================
     1. Specials
     ===================================================================== */
  const dealEl = { dept: $('deal-dept'), search: $('deal-search'), count: $('deal-count'), rows: $('deal-rows'), add: $('deal-add'), saved: $('deal-saved') };
  let dealDept = 'all', dealQuery = '';

  function renderDealFilter() {
    const d = S.load();
    const opts = retailDepts(d).map(x => {
      const n = (d.specials || []).filter(sp => sp.dept === x.id).length;
      return '<option value="' + esc(x.id) + '">' + esc(x.short + ' (' + n + ')') + '</option>';
    }).join('');
    dealEl.dept.innerHTML = '<option value="all">All departments (' + (d.specials || []).length + ')</option>' + opts;
    dealEl.dept.value = retailDepts(d).some(x => x.id === dealDept) ? dealDept : 'all';
    dealDept = dealEl.dept.value;
  }
  function shownDeals(d) {
    const q = dealQuery.trim().toLowerCase();
    return newestFirst(d.specials || []).filter(sp =>
      (dealDept === 'all' || sp.dept === dealDept) &&
      (!q || (String(sp.name) + ' ' + dept(d, sp.dept).name).toLowerCase().indexOf(q) !== -1));
  }
  function dealRow(d, sp) {
    const tags = (sp.isNew ? '<span class="badge badge-clay">New</span>' : '') + (sp.couva ? '<span class="badge badge-green">Couva</span>' : '');
    return '<tr data-id="' + esc(sp.id) + '">' +
      '<td class="col-photo"><img class="admin-thumb" src="' + esc(photoSrc(sp.img)) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></td>' +
      '<td class="deal-cell-name">' + esc(sp.name) + '</td>' +
      '<td class="dept-cell">' + esc(dept(d, sp.dept).short) + '</td>' +
      '<td class="num price-cell">' + esc(S.money(sp.price)) + '</td>' +
      '<td class="posted-cell"><span class="cell-label">Posted </span>' + esc(U.fmtDate(sp.posted)) + '</td>' +
      '<td class="tag-cell">' + tags + '</td>' +
      '<td class="actions-cell"><button class="btn btn-ghost btn-sm" type="button" data-edit="' + esc(sp.id) + '">Edit<span class="visually-hidden"> ' + esc(sp.name) + '</span></button>' +
      '<button class="btn btn-danger btn-sm" type="button" data-remove="' + esc(sp.id) + '">Remove<span class="visually-hidden"> ' + esc(sp.name) + '</span></button></td></tr>';
  }
  function renderDeals() {
    const d = S.load(), all = d.specials || [], shown = shownDeals(d);
    dealEl.rows.innerHTML = shown.length
      ? shown.map(sp => dealRow(d, sp)).join('')
      : '<tr><td class="empty-cell" colspan="7"><p>' + (all.length ? 'No deals match. Clear the search or pick All departments.' : 'There are no deals yet. Add the first one.') + '</p>' +
        (all.length ? '<button class="btn btn-ghost btn-sm" type="button" data-show-all>Show every deal</button>' : '') + '</td></tr>';
    dealEl.count.textContent = shown.length === all.length ? plural(all.length, 'deal') : shown.length + ' of ' + plural(all.length, 'deal');
  }
  function setSavedNote(sp) {
    if (!sp) { dealEl.saved.innerHTML = ''; return; }
    const url = U.href('specials.html') + '?' + new URLSearchParams({ dept: sp.dept }).toString();
    dealEl.saved.innerHTML = '<div class="alert alert-ok">' + icon('check') +
      '<p><strong>' + esc(sp.name) + '</strong> is saved and live on the Specials page in this browser. ' +
      '<a href="' + esc(url) + '" target="_blank" rel="noopener">Open the Specials page<span class="visually-hidden"> (opens in a new tab)</span></a> · ' +
      '<button class="link-btn" type="button" data-make-post="' + esc(sp.id) + '">Make an Instagram post of it</button></p></div>';
  }
  function refreshDeals() { renderStats(); renderDealFilter(); renderDeals(); renderPostSelect(); }

  dealEl.dept.addEventListener('change', () => { dealDept = dealEl.dept.value; renderDeals(); });
  dealEl.search.addEventListener('input', () => { dealQuery = dealEl.search.value; renderDeals(); });
  dealEl.add.addEventListener('click', () => openDealDrawer(null, dealEl.add));
  dealEl.rows.addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'); if (ed) { openDealDrawer(ed.getAttribute('data-edit'), ed); return; }
    const rm = e.target.closest('[data-remove]'); if (rm) { removeDeal(rm.getAttribute('data-remove'), rm); return; }
    if (e.target.closest('[data-show-all]')) {
      dealDept = 'all'; dealQuery = ''; dealEl.search.value = ''; renderDealFilter(); renderDeals();
      const first = dealEl.rows.querySelector('[data-edit]'); if (first) first.focus();
    }
  });
  dealEl.saved.addEventListener('click', e => {
    const b = e.target.closest('[data-make-post]'); if (!b) return;
    renderPostSelect();
    postEl.deal.value = b.getAttribute('data-make-post');
    postDealChosen = true;
    if (currentTab() === 'posts') showPostMaker(); else location.hash = 'posts';
  });

  async function removeDeal(id, opener) {
    const d = S.load(), sp = S.byId(d.specials, id);
    if (!sp) { refreshDeals(); return; }
    const ok = await U.confirm({ title: 'Remove this deal?', body: sp.name + ' comes off the Specials page and the home page in this browser.', okLabel: 'Remove deal', danger: true });
    if (!ok) { if (opener && document.contains(opener)) opener.focus(); return; }
    const rows = Array.from(dealEl.rows.querySelectorAll('tr[data-id]'));
    const i = rows.findIndex(r => r.getAttribute('data-id') === id);
    const neighbour = rows[i + 1] || rows[i - 1];
    const nextId = neighbour ? neighbour.getAttribute('data-id') : null;
    S.update(dd => { dd.specials = (dd.specials || []).filter(x => x.id !== id); });
    if (drawerOpen) closeDrawer(false);
    setSavedNote(null);
    refreshDeals();
    U.toast('Removed. ' + sp.name + ' is off the Specials page in this browser.', 'ok');
    const target = nextId ? dealEl.rows.querySelector('[data-edit="' + cssEsc(nextId) + '"]') : null;
    (target || dealEl.add).focus();
  }

  /* ---------- the deal drawer ---------- */
  const drawer = $('drawer'), backdrop = $('drawer-backdrop');
  let drawerOpen = false, editId = null, lastFocus = null;

  /* the public deal card, same markup as site.js dealCard (name as <p> so the preview adds no heading) */
  function dealCardHtml(d, sp) {
    const price = isFinite(sp.price) && sp.price > 0 ? sp.price : 0;
    return '<article class="deal">' +
      '<figure class="deal-photo"><img src="' + esc(photoSrc(sp.img)) + '" alt="' + esc(sp.alt || sp.name) + '" width="800" height="667" decoding="async">' +
      (sp.isNew ? '<span class="new-corner" aria-hidden="true">NEW</span>' : '') + U.seal(price) + '</figure>' +
      '<div class="deal-body"><p class="deal-dept">' + esc(dept(d, sp.dept).short) + '</p>' +
      '<p class="deal-name">' + esc(sp.name || 'Deal name') + '</p>' +
      '<p class="deal-price" aria-hidden="true"><span class="qty">1 FOR</span><span class="amt">' + esc(dollars(price)) + '</span></p>' +
      '<p class="deal-meta"><span>Posted ' + esc(U.fmtDate(sp.posted)) + '</span>' +
      (sp.couva ? '<span class="couva">' + icon('pin') + 'Couva</span>' : '') + '</p></div></article>';
  }

  function openDealDrawer(id, fromEl) {
    const d = S.load();
    const sp = id ? S.byId(d.specials, id) : null;
    if (id && !sp) { U.toast('That deal is no longer in the list.', 'bad'); refreshDeals(); return; }
    editId = sp ? sp.id : null;
    lastFocus = fromEl || document.activeElement;
    const depts = retailDepts(d), lib = photoLibrary(d);
    const v = sp
      ? { name: sp.name, dept: sp.dept, price: Number(sp.price).toFixed(2), posted: sp.posted, img: stemOf(sp.img), isNew: !!sp.isNew, couva: !!sp.couva, alt: sp.alt || '' }
      : { name: '', dept: dealDept !== 'all' ? dealDept : (depts[0] || {}).id, price: '', posted: todayIso(), img: '', isNew: false, couva: false, alt: '' };
    /* a new deal starts with its department's own photo */
    if (!sp) { const st = stemOf((S.byId(depts, v.dept) || {}).img); v.img = lib.includes(st) ? st : (lib[0] || ''); }
    let altTouched = !!(sp && sp.alt && sp.alt !== sp.name);

    const deptOpts = depts.map(x => '<option value="' + esc(x.id) + '"' + (x.id === v.dept ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('');
    const photoOpts = lib.map(st => '<option value="' + esc(st) + '"' + (st === v.img ? ' selected' : '') + '>' + esc(photoLabel(st)) + '</option>').join('');

    drawer.innerHTML =
      '<div class="drawer-head"><div><h2 id="drawer-title" tabindex="-1">' + (sp ? 'Edit deal' : 'Add a deal') + '</h2>' +
      '<p class="drawer-sub">' + (sp ? 'Changes show on the Specials page when you save.' : 'The new deal goes to the top of the Specials page when you save.') + '</p></div>' +
      '<button class="icon-btn" type="button" id="drawer-close" aria-label="Close without saving">' + icon('close') + '</button></div>' +
      '<div class="drawer-body">' +
      '<div class="deal-preview" aria-hidden="true"><p class="preview-label">Preview, as shoppers see it</p><div id="dp-card"></div></div>' +
      '<form id="deal-form" novalidate>' +
      '<div class="field"><label for="df-name">Deal name</label><input type="text" id="df-name" name="name" maxlength="90" autocomplete="off" value="' + esc(v.name) + '" aria-describedby="df-name-hint">' +
      '<p class="hint" id="df-name-hint">As it appears on the card, for example “Chunky veg pack”.</p><p class="error-text" id="df-name-err" hidden></p></div>' +
      '<div class="form-row">' +
      '<div class="field"><label for="df-dept">Department</label><select id="df-dept" name="dept">' + deptOpts + '</select></div>' +
      '<div class="field"><label for="df-price">Price in TTD</label><input type="number" id="df-price" name="price" min="0.01" step="0.01" inputmode="decimal" value="' + esc(v.price) + '" aria-describedby="df-price-hint">' +
      '<p class="hint" id="df-price-hint">For one item, for example 24.95.</p><p class="error-text" id="df-price-err" hidden></p></div>' +
      '</div>' +
      '<div class="field"><label for="df-posted">Date posted</label><input type="date" id="df-posted" name="posted" value="' + esc(v.posted) + '" aria-describedby="df-posted-hint">' +
      '<p class="hint" id="df-posted-hint">Shown on the card as “Posted” with this date.</p><p class="error-text" id="df-posted-err" hidden></p></div>' +
      '<div class="field"><label for="df-img">Photo</label><div class="photo-pick"><select id="df-img" name="img" aria-describedby="df-img-hint">' + photoOpts + '</select>' +
      '<img class="admin-thumb" id="df-img-thumb" src="' + esc(photoSrc(v.img)) + '" alt="" width="64" height="64" decoding="async"></div>' +
      '<p class="hint" id="df-img-hint">Pick from the store’s photo library. New photos are added by the web team.</p><p class="error-text" id="df-img-err" hidden></p></div>' +
      '<fieldset><legend>Labels on the photo</legend>' +
      '<label class="check" for="df-new"><input type="checkbox" id="df-new" name="isNew"' + (v.isNew ? ' checked' : '') + '><span>Marked new <span class="muted">(red NEW corner)</span></span></label>' +
      '<label class="check" for="df-couva"><input type="checkbox" id="df-couva" name="couva"' + (v.couva ? ' checked' : '') + '><span>Tagged Couva <span class="muted">(Couva pin under the name)</span></span></label>' +
      '</fieldset>' +
      '<div class="field"><label for="df-alt">Photo description (alt text)</label><textarea id="df-alt" name="alt" rows="3" maxlength="200" aria-describedby="df-alt-hint">' + esc(v.alt || v.name) + '</textarea>' +
      '<p class="hint" id="df-alt-hint">Read aloud to people who use screen readers. Say what the photo shows.</p><p class="error-text" id="df-alt-err" hidden></p></div>' +
      '</form></div>' +
      '<div class="drawer-foot"><button class="btn btn-primary" type="submit" form="deal-form">Save deal</button>' +
      '<button class="btn btn-ghost" type="button" data-close>Cancel</button>' +
      (sp ? '<span class="spacer" aria-hidden="true"></span><button class="btn btn-danger" type="button" data-remove-drawer>Remove deal</button>' : '') +
      '</div>';

    const form = $('deal-form'), f = form.elements, card = $('dp-card'), thumb = $('df-img-thumb');
    const NAMES = ['name', 'price', 'posted', 'img', 'alt'];
    function readForm() {
      const priceRaw = f.price.value.trim(), price = Number(priceRaw);
      return {
        name: f.name.value.trim().replace(/\s+/g, ' '), dept: f.dept.value, priceRaw: priceRaw, price: price,
        posted: f.posted.value, img: f.img.value, isNew: f.isNew.checked, couva: f.couva.checked,
        alt: f.alt.value.trim().replace(/\s+/g, ' ')
      };
    }
    function check() {
      const r = readForm(), e = {};
      if (!r.name) e.name = 'Enter the deal name, for example “Chunky veg pack”.';
      if (!r.priceRaw || !isFinite(r.price) || r.price <= 0) e.price = 'Enter a price above 0, for example 24.95.';
      else if (Math.abs(r.price * 100 - Math.round(r.price * 100)) > 1e-6) e.price = 'Use no more than two decimal places, for example 24.95.';
      else if (r.price >= 100000) e.price = 'Enter a price below TTD 100,000.00.';
      if (!isDay(r.posted)) e.posted = 'Choose the date the deal was posted.';
      if (!lib.includes(r.img)) e.img = 'Choose a photo from the list.';
      if (!r.alt) e.alt = 'Describe the photo in a few words, for example “Tray of cut carrot and broccoli”.';
      return e;
    }
    function paintPreview() {
      const r = readForm();
      card.innerHTML = dealCardHtml(d, { name: r.name, dept: r.dept, price: r.price, posted: isDay(r.posted) ? r.posted : '', img: r.img, isNew: r.isNew, couva: r.couva, alt: r.alt });
      thumb.src = photoSrc(r.img);
    }
    paintPreview();
    form.addEventListener('input', paintPreview);
    form.addEventListener('change', paintPreview);
    f.name.addEventListener('input', () => {
      if (!altTouched) { f.alt.value = f.name.value; if (f.alt.getAttribute('aria-invalid') === 'true') setFieldError(f.alt, check().alt || ''); }
    });
    f.alt.addEventListener('input', () => { altTouched = f.alt.value.trim() !== ''; });
    liveRevalidate(form, NAMES, check);

    form.addEventListener('submit', e => {
      e.preventDefault();
      const errors = check(), first = applyErrors(form, NAMES, errors);
      if (first) { first.focus(); U.toast('Check the highlighted fields.', 'bad'); return; }
      const r = readForm();
      const rec = { name: r.name, dept: r.dept, price: Math.round(r.price * 100) / 100, img: r.img, posted: r.posted, alt: r.alt };
      let savedId = null;
      S.update(dd => {
        dd.specials = dd.specials || [];
        const cur = editId ? S.byId(dd.specials, editId) : null;
        if (cur) {
          Object.assign(cur, rec);
          if (r.isNew) cur.isNew = true; else delete cur.isNew;
          if (r.couva) cur.couva = true; else delete cur.couva;
          savedId = cur.id;
        } else {
          let nid; do { nid = S.uid('sp'); } while (S.byId(dd.specials, nid));
          const add = Object.assign({ id: nid }, rec);
          if (r.isNew) add.isNew = true;
          if (r.couva) add.couva = true;
          dd.specials.unshift(add);
          savedId = nid;
        }
      });
      closeDrawer(false);
      /* make sure the saved row is visible before focusing it */
      const saved = S.byId(S.load().specials, savedId);
      if (!shownDeals(S.load()).some(x => x.id === savedId)) { dealDept = 'all'; dealQuery = ''; dealEl.search.value = ''; }
      refreshDeals();
      setSavedNote(saved);
      U.toast('Saved. It is live on the Specials page in this browser.', 'ok');
      const btn = dealEl.rows.querySelector('[data-edit="' + cssEsc(savedId) + '"]');
      if (btn) btn.focus();
    });

    $('drawer-close').addEventListener('click', () => closeDrawer());
    drawer.querySelector('[data-close]').addEventListener('click', () => closeDrawer());
    const rmBtn = drawer.querySelector('[data-remove-drawer]');
    if (rmBtn) rmBtn.addEventListener('click', () => removeDeal(editId, rmBtn));

    drawer.classList.add('is-open'); backdrop.classList.add('is-open');
    drawer.removeAttribute('aria-hidden'); drawer.inert = false; drawer.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    drawerOpen = true;
    /* adding: straight into the name field; editing: the title, so the phone keyboard does not cover the preview */
    (sp ? $('drawer-title') : f.name).focus();
  }

  function closeDrawer(restore) {
    if (!drawerOpen) return;
    drawer.classList.remove('is-open'); backdrop.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true'); drawer.inert = true; drawer.setAttribute('inert', '');
    document.body.style.overflow = '';
    drawerOpen = false;
    let back = lastFocus;
    if (editId && (!back || !document.contains(back))) back = dealEl.rows.querySelector('[data-edit="' + cssEsc(editId) + '"]');
    editId = null; lastFocus = null;
    if (restore !== false && back && document.contains(back) && typeof back.focus === 'function') back.focus();
  }
  backdrop.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !drawerOpen) return;
    if (document.querySelector('dialog[open]')) return; /* the confirm dialog handles its own Escape */
    e.preventDefault(); closeDrawer();
  });
  /* loose focus trap: Tab wraps inside the drawer while it is open */
  drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = Array.from(drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === $('drawer-title'))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* =====================================================================
     2. Post maker: the company's own Instagram format, 1080 × 1350 PNG
     ===================================================================== */
  const postEl = { deal: $('post-deal'), headline: $('post-headline'), focus: $('post-focus'), status: $('post-status'), dl: $('post-download'), caption: $('post-caption'), copy: $('post-copy'), canvas: $('post-canvas') };
  const W = 1080, H = 1350;
  const C = { red: '#D3202D', yellow: '#FFD21A', ink: '#2A1A1F', flour: '#FFFDFA', clay: '#B8195A', wash: '#F8EEE6' };
  const SANS = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif';
  const SLAB = '"Alfa Slab One", "Rockwell Extra Bold", Rockwell, Georgia, serif';
  const DISPLAY = '"Caprasimo", "Cooper Black", Georgia, serif';
  const FONT_TESTS = ['800 80px "Atkinson Hyperlegible Next"', '400 70px "Alfa Slab One"', '400 64px "Caprasimo"'];
  let fontsPromise = null, logoPromise = null, drawSeq = 0, drawTimer = 0, captionKey = '';
  let svgLogoBlocked = false, postDealChosen = false;
  const photoCache = {};

  /* until the user picks a deal, the post maker follows the newest one (so a deal just added is ready to post) */
  function renderPostSelect() {
    const d = S.load(), keep = postEl.deal.value, list = newestFirst(d.specials || []);
    postEl.deal.innerHTML = list.length
      ? list.map(sp => '<option value="' + esc(sp.id) + '">' + esc(sp.name + ' · ' + S.money(sp.price)) + '</option>').join('')
      : '<option value="">No deals yet. Add one under Specials.</option>';
    postEl.deal.disabled = !list.length;
    if (postDealChosen && list.some(sp => sp.id === keep)) postEl.deal.value = keep;
    else { postDealChosen = false; if (list.length) postEl.deal.value = list[0].id; }
  }

  function loadFonts() {
    if (!fontsPromise) {
      fontsPromise = !document.fonts ? Promise.resolve() :
        document.fonts.ready
          .then(() => Promise.all(FONT_TESTS.map(f => document.fonts.load(f).catch(() => null))))
          .then(() => document.fonts.ready)
          .catch(() => null);
    }
    return fontsPromise;
  }
  function fontsMissing() {
    if (!document.fonts || !document.fonts.check) return false;
    return FONT_TESTS.some(f => { try { return !document.fonts.check(f); } catch (e) { return false; } });
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onerror = () => reject(new Error('Could not load ' + src));
      img.onload = () => {
        /* an SVG with only a viewBox can report no natural size; some browsers then refuse to draw it */
        const done = () => (img.naturalWidth && img.naturalHeight) ? resolve(img) : reject(new Error('No natural size ' + src));
        if (img.decode) img.decode().then(done, done); else done();
      };
      img.src = src;
    });
  }
  /* the lead may swap in an SVG logo later: try it first, fall back to the WebP */
  function loadLogo() {
    if (!logoPromise) {
      const webp = () => loadImage(U.href('assets/img/sfb-logo.webp'));
      logoPromise = (svgLogoBlocked ? webp() : loadImage(U.href('assets/img/sfb-logo.svg')).catch(webp)).catch(() => null);
    }
    return logoPromise;
  }
  function loadPhoto(stem) {
    if (!photoCache[stem]) {
      photoCache[stem] = loadImage(photoSrc(stem));
      photoCache[stem].catch(() => { delete photoCache[stem]; }); /* let a failed photo retry on the next draw */
    }
    return photoCache[stem];
  }

  /* drawing helpers */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function spacing(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }
  /* text centred on (cx, cy) by its ink, so caps sit in the middle of a pill or band whatever the font metrics */
  function inkCentered(ctx, text, cx, cy, ls) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    const asc = m.actualBoundingBoxAscent || 0, desc = m.actualBoundingBoxDescent || 0;
    ctx.fillText(text, cx + (ls ? ls / 2 : 0), cy + (asc - desc) / 2);
  }
  function wrapLines(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCover(ctx, img, fx) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const scale = Math.max(W / iw, H / ih), dw = iw * scale, dh = ih * scale;
    /* the position slider moves along whichever axis overflows (sideways for the store's landscape photos) */
    const dx = dw > W + 1 ? (W - dw) * fx : (W - dw) / 2;
    const dy = dh > H + 1 ? (H - dh) * fx : (H - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  function drawLogo(ctx, logo) {
    const nw = logo.naturalWidth || 386, nh = logo.naturalHeight || 176;
    let w = 400, h = w * nh / nw;
    if (h > 220) { h = 220; w = h * nw / nh; }
    ctx.save();
    ctx.shadowColor = 'rgba(42,26,31,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
    ctx.drawImage(logo, 44, 44, w, h);
    ctx.restore();
    return 44 + h;
  }
  /* the price seal, the same geometry as SFBUI.seal: an 18-bump scallop (viewBox 0–100), "1 FOR",
     the yellow price pill and the red TRY ME banner. CSS sizes it in cqi of the card (seal = 40cqi),
     so u = size / 40 is one cqi here. Drawn offscreen first so the drop shadow falls on the whole seal at once. */
  function drawSeal(ctx, price, x, y, size) {
    const u = size / 40, k = size / 100;
    const off = document.createElement('canvas');
    const ox = Math.round(size * 0.1), oy = Math.round(size * 0.06);
    off.width = Math.ceil(size * 1.2); off.height = Math.ceil(size * 1.12);
    const g = off.getContext('2d');
    g.translate(ox, oy);
    /* scallop */
    const n = 18, rIn = 41, rOut = 53, c = 50, step = Math.PI * 2 / n;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a0 = i * step - Math.PI / 2, a1 = (i + 1) * step - Math.PI / 2, am = (i + 0.5) * step - Math.PI / 2;
      if (i === 0) g.moveTo((c + rIn * Math.cos(a0)) * k, (c + rIn * Math.sin(a0)) * k);
      g.quadraticCurveTo((c + rOut * Math.cos(am)) * k, (c + rOut * Math.sin(am)) * k, (c + rIn * Math.cos(a1)) * k, (c + rIn * Math.sin(a1)) * k);
    }
    g.closePath();
    g.fillStyle = C.red; g.fill();
    /* dashed inner ring */
    g.save();
    g.beginPath(); g.arc(c * k, c * k, 35 * k, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = k; g.setLineDash([2 * k, 2 * k]); g.stroke();
    g.restore();
    /* "1 FOR" over the price pill, centred and nudged up 7% like .seal-in */
    const qtySize = 7.4 * u, gap = 1.2 * u, padY = 1.4 * u, padX = 2.6 * u;
    let priceSize = 6.4 * u;
    const amt = dollars(price);
    g.font = '400 ' + priceSize + 'px ' + SLAB; spacing(g, 0);
    let tw = g.measureText(amt).width;
    const maxPill = size * 0.84;
    if (tw + 2 * padX > maxPill) { priceSize *= (maxPill - 2 * padX) / tw; g.font = '400 ' + priceSize + 'px ' + SLAB; tw = g.measureText(amt).width; }
    const pillH = priceSize + 2 * padY, pillW = tw + 2 * padX;
    const blockH = qtySize + gap + pillH;
    const top = c * k - blockH / 2 - blockH * 0.07;
    g.fillStyle = '#fff';
    g.font = '800 ' + qtySize + 'px ' + SANS; spacing(g, qtySize * 0.02);
    inkCentered(g, '1 FOR', c * k, top + qtySize / 2, qtySize * 0.02);
    spacing(g, 0);
    const pillY = top + qtySize + gap;
    roundRect(g, c * k - pillW / 2, pillY, pillW, pillH, pillH / 2);
    g.fillStyle = C.yellow; g.fill();
    g.fillStyle = C.ink; g.font = '400 ' + priceSize + 'px ' + SLAB;
    inkCentered(g, amt, c * k, pillY + pillH / 2, 0);
    /* TRY ME banner: left/right -5%, bottom 4%, clip-path polygon(2% 8%, 100% 0, 98% 92%, 0 100%) */
    const trySize = 4.6 * u, bw = size * 1.1, bh = trySize + 1.6 * u + 1.8 * u;
    const bx = -size * 0.05, by = size * 0.96 - bh;
    g.beginPath();
    g.moveTo(bx + bw * 0.02, by + bh * 0.08); g.lineTo(bx + bw, by); g.lineTo(bx + bw * 0.98, by + bh * 0.92); g.lineTo(bx, by + bh);
    g.closePath(); g.fillStyle = C.red; g.fill();
    g.fillStyle = '#fff'; g.font = '400 ' + trySize + 'px ' + SLAB; spacing(g, trySize * 0.08);
    inkCentered(g, 'TRY ME', bx + bw / 2, by + 1.6 * u + trySize / 2, trySize * 0.08);
    /* composite with one drop shadow, as filter: drop-shadow() does on the card */
    ctx.save();
    ctx.shadowColor = 'rgba(42,26,31,.3)'; ctx.shadowOffsetY = size * 0.02; ctx.shadowBlur = size * 0.04;
    ctx.drawImage(off, x - ox, y - oy);
    ctx.restore();
  }
  /* "NEW PRODUCT" ribbon across the top-right corner, as on the company's posts */
  function drawNewRibbon(ctx) {
    const dist = 270, band = 84;
    ctx.save();
    ctx.translate(W, 0); ctx.rotate(Math.PI / 4);
    ctx.shadowColor = 'rgba(42,26,31,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.fillStyle = C.red;
    ctx.fillRect(-dist * 2, dist - band / 2, dist * 4, band);
    ctx.shadowColor = 'transparent';
    let size = 46;
    ctx.font = '400 ' + size + 'px ' + SLAB; spacing(ctx, size * 0.08);
    const room = 2 * (dist - band / 2) - 72; /* the visible length of the band's inner edge, less a margin */
    const tw = ctx.measureText('NEW PRODUCT').width;
    if (tw > room) { size *= room / tw; ctx.font = '400 ' + size + 'px ' + SLAB; spacing(ctx, size * 0.08); }
    ctx.fillStyle = '#fff';
    inkCentered(ctx, 'NEW PRODUCT', 0, dist, size * 0.08);
    ctx.restore();
  }
  function drawHeadline(ctx, text, top, roomForRibbon) {
    const x = 48, padX = 32, padY = 24, maxW = (roomForRibbon ? 820 : W - 96) - padX * 2;
    let size = 62, lines;
    do {
      ctx.font = '400 ' + size + 'px ' + DISPLAY;
      lines = wrapLines(ctx, text, maxW);
      if (lines.length <= 3) break;
      size -= 4;
    } while (size >= 44);
    if (lines.length > 3) { lines = lines.slice(0, 3); lines[2] = lines[2].replace(/\s*\S+$/, '') + '…'; }
    const lh = Math.round(size * 1.12);
    const textW = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
    const boxW = Math.min(textW, maxW) + padX * 2, boxH = lines.length * lh + padY * 2;
    ctx.save();
    ctx.shadowColor = 'rgba(42,26,31,.25)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    roundRect(ctx, x, top, boxW, boxH, 18);
    ctx.fillStyle = C.flour; ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; spacing(ctx, 0);
    lines.forEach((l, i) => ctx.fillText(l, x + padX, top + padY + lh * i + lh / 2));
  }
  function drawCouva(ctx) {
    const text = 'Couva', fs = 40, iconSize = 42, padX = 26, gap = 10, h = 78;
    ctx.save();
    ctx.font = '800 ' + fs + 'px ' + SANS; spacing(ctx, 0);
    const tw = ctx.measureText(text).width;
    const w = padX + iconSize + gap + tw + padX, x = W - 56 - w, y = H - 56 - h;
    ctx.shadowColor = 'rgba(42,26,31,.3)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = C.flour; ctx.fill();
    ctx.shadowColor = 'transparent';
    /* the site's pin icon (24-unit grid), filled */
    ctx.save();
    ctx.translate(x + padX, y + (h - iconSize) / 2); ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = C.clay;
    ctx.fill(new Path2D('M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z'));
    ctx.beginPath(); ctx.arc(12, 9.5, 2.6, 0, Math.PI * 2); ctx.fillStyle = C.flour; ctx.fill();
    ctx.restore();
    ctx.fillStyle = C.clay; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(text);
    ctx.fillText(text, x + padX + iconSize + gap, y + h / 2 + ((m.actualBoundingBoxAscent || fs * 0.7) - (m.actualBoundingBoxDescent || 0)) / 2);
    ctx.restore();
  }

  /* only touch the live region when the message changes, so dragging the slider is not read out on every frame */
  function setPostStatus(msg, bad) {
    if (postEl.status.textContent !== msg) postEl.status.textContent = msg;
    postEl.status.classList.toggle('is-bad', !!bad);
  }
  function setDownload(url, name) {
    if (url) {
      postEl.dl.href = url; postEl.dl.download = name;
      postEl.dl.removeAttribute('aria-disabled');
    } else {
      postEl.dl.href = '#'; postEl.dl.setAttribute('aria-disabled', 'true');
    }
  }
  postEl.dl.addEventListener('click', e => {
    if (postEl.dl.getAttribute('aria-disabled') !== 'true') return;
    e.preventDefault();
    U.toast(postEl.status.classList.contains('is-bad') ? postEl.status.textContent : 'The post is still being drawn. Try again in a moment.', 'bad');
  });

  function captionFor(sp) {
    return [
      (sp.isNew ? 'NEW PRODUCT · ' : '') + '1 FOR ' + dollars(sp.price) + ' · TRY ME',
      sp.name + ', now at Southern Food Basket' + (sp.couva ? ' Couva' : '') + '.',
      '#southernfoodbasket #trinidad' + (sp.couva ? ' #couva' : '')
    ].join('\n');
  }

  async function drawPost() {
    const seq = ++drawSeq;
    const d = S.load(), sp = S.byId(d.specials, postEl.deal.value);
    const ctx = postEl.canvas.getContext('2d');
    if (!sp) {
      ctx.clearRect(0, 0, W, H);
      setDownload(null);
      setPostStatus('There are no deals to make a post from. Add one under Specials first.', true);
      postEl.canvas.setAttribute('aria-label', 'Empty post preview');
      return;
    }
    if (!postEl.status.textContent || postEl.status.classList.contains('is-bad')) setPostStatus('Drawing the post…');
    setDownload(null);
    await loadFonts();
    let photo = null;
    try { photo = await loadPhoto(stemOf(sp.img)); } catch (e) { photo = null; }
    const logo = await loadLogo();
    if (seq !== drawSeq) return; /* a newer draw has started */

    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.wash; ctx.fillRect(0, 0, W, H);
    if (photo) drawCover(ctx, photo, Number(postEl.focus.value) / 100);
    const logoBottom = logo ? drawLogo(ctx, logo) : 44;
    if (sp.isNew) drawNewRibbon(ctx);
    if (postEl.headline.checked) drawHeadline(ctx, sp.name, logoBottom + 28, !!sp.isNew);
    const seal = 440;
    drawSeal(ctx, sp.price, 60, H - 60 - seal, seal);
    if (sp.couva) drawCouva(ctx);
    ctx.restore();

    postEl.canvas.setAttribute('aria-label', 'Preview of the Instagram post: ' + sp.name + ', 1 FOR ' + dollars(sp.price) + ', TRY ME' +
      (sp.isNew ? ', with a NEW PRODUCT ribbon' : '') + (sp.couva ? ', with a Couva pin' : '') + (postEl.headline.checked ? ', with the name as a headline' : '') + '.');

    if (!photo) {
      setDownload(null);
      setPostStatus('The product photo did not load, so the post has no picture. Reload the page and try again.', true);
      return;
    }
    try {
      const url = postEl.canvas.toDataURL('image/png');
      setDownload(url, 'sfb-' + String(sp.id).replace(/[^\w-]/g, '') + '.png');
      const notes = [];
      if (!logo) notes.push('the logo did not load');
      if (fontsMissing()) notes.push('the brand fonts did not load, so a fallback font is used');
      setPostStatus(notes.length ? 'Ready, but ' + notes.join(' and ') + '. Check the internet connection and reload.' : 'Ready to download: 1080 × 1350 pixels, PNG.', notes.length > 0);
    } catch (err) {
      /* some browsers block export after drawing an SVG: retry once with the WebP logo */
      if (logo && /\.svg(\?|$)/i.test(logo.src || '') && !svgLogoBlocked) {
        svgLogoBlocked = true; logoPromise = null;
        scheduleDraw(0);
        return;
      }
      /* a page opened straight from disk (file://) taints the canvas, so the browser refuses to export it */
      setDownload(null);
      setPostStatus('This browser will not save the picture from a page opened as a file. Open the site through a local web server (for example python -m http.server) and try again.', true);
    }
  }
  function scheduleDraw(delay) {
    clearTimeout(drawTimer);
    drawTimer = setTimeout(drawPost, delay || 0);
  }
  /* called whenever the Post maker tab is shown: refresh the caption if the deal (or its details) changed */
  function showPostMaker() {
    const d = S.load(), sp = S.byId(d.specials, postEl.deal.value);
    const key = sp ? canon(sp) : '';
    if (key !== captionKey) {
      captionKey = key;
      postEl.caption.value = sp ? captionFor(sp) : '';
      postEl.focus.value = '50'; setFocusText();
    }
    scheduleDraw(0);
  }
  function setFocusText() {
    const v = Number(postEl.focus.value);
    postEl.focus.setAttribute('aria-valuetext', v <= 20 ? 'Left side' : v >= 80 ? 'Right side' : v < 45 ? 'Left of centre' : v > 55 ? 'Right of centre' : 'Centre');
  }
  postEl.deal.addEventListener('change', () => { postDealChosen = true; showPostMaker(); });
  postEl.headline.addEventListener('change', () => scheduleDraw(0));
  postEl.focus.addEventListener('input', () => { setFocusText(); scheduleDraw(120); });
  postEl.copy.addEventListener('click', async () => {
    const text = postEl.caption.value;
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); ok = true; } } catch (e) { ok = false; }
    if (!ok) {
      try { postEl.caption.focus(); postEl.caption.select(); ok = document.execCommand('copy'); } catch (e) { ok = false; }
      postEl.copy.focus();
    }
    U.toast(ok ? 'Caption copied. Paste it under the post on Instagram.' : 'Copy did not work here. Select the caption text and copy it yourself.', ok ? 'ok' : 'bad');
  });

  /* =====================================================================
     3. Stores and hours
     ===================================================================== */
  const storeList = $('store-list');
  function storePanel(b) {
    const id = esc(b.id), rows = b.hours || [];
    const msLabel = (rows[0] && rows[0][0]) || 'Mon – Sat', sunLabel = (rows[1] && rows[1][0]) || 'Sunday';
    const ms = (rows[0] && rows[0][1]) || '', sun = (rows[1] && rows[1][1]) || '';
    const today = U.todayHours(b);
    const field = (key, label, value, type, hint) => {
      const fid = 'st-' + id + '-' + key;
      return '<div class="field"><label for="' + fid + '">' + esc(label) + '</label>' +
        '<input type="' + type + '" id="' + fid + '" name="' + key + '" value="' + esc(value) + '" maxlength="' + (type === 'tel' ? 20 : 60) + '" autocomplete="off"' + (hint ? ' aria-describedby="' + fid + '-hint"' : '') + '>' +
        (hint ? '<p class="hint" id="' + fid + '-hint">' + esc(hint) + '</p>' : '') + '<p class="error-text" id="' + fid + '-err" hidden></p></div>';
    };
    return '<section class="panel" data-store-panel="' + id + '" aria-labelledby="st-' + id + '-h">' +
      '<div class="panel-head"><h3 id="st-' + id + '-h">' + esc(b.name) + '</h3><span class="store-head-sub">' + esc(b.short || '') + '</span></div>' +
      '<div class="panel-body"><div class="store-split"><div>' +
      '<dl class="kv">' +
      '<dt>Address</dt><dd>' + esc(b.address || 'Not recorded') + '</dd>' +
      '<dt>Phone</dt><dd class="num">' + esc(b.phone || 'Not recorded') + '</dd>' +
      '<dt>Plus code</dt><dd>' + esc(b.plusCode || 'Not recorded') + '</dd>' +
      '<dt>Open today</dt><dd>' + esc(today || 'Not recorded') + '</dd>' +
      '</dl>' +
      '<div class="cluster store-links">' +
      '<a class="btn btn-ghost btn-sm" href="' + esc(U.mapsDir(b)) + '" target="_blank" rel="noopener">' + icon('pin') + 'Directions<span class="visually-hidden"> to ' + esc(b.name) + ' (opens Google Maps in a new tab)</span></a>' +
      '<a class="btn btn-ghost btn-sm" href="' + esc(U.mapsView(b)) + '" target="_blank" rel="noopener">' + icon('search') + 'View on Google Maps<span class="visually-hidden">: ' + esc(b.name) + ' (opens in a new tab)</span></a>' +
      '</div>' +
      (b.source ? '<p class="store-source">Source: ' + esc(b.source) + '.</p>' : '') +
      '</div>' +
      '<form class="store-form" data-branch="' + id + '" novalidate><h4>Edit hours and phone</h4>' +
      field('ms', msLabel + ' hours', ms, 'text', 'For example “7:00 am – 10:00 pm”.') +
      field('sun', sunLabel + ' hours', sun, 'text', 'Public holidays follow the Sunday hours on the Store locations page.') +
      field('phone', 'Phone', b.phone || '', 'tel', '') +
      '<button class="btn btn-primary" type="submit">Save ' + esc(b.name) + '</button></form>' +
      '</div></div></section>';
  }
  function renderStores() {
    const d = S.load();
    storeList.innerHTML = (d.branches || []).length
      ? d.branches.map(storePanel).join('')
      : '<div class="empty"><p>No stores are listed.</p></div>';
  }
  function checkStore(form) {
    const e = {}, ms = form.elements.ms.value.trim(), sun = form.elements.sun.value.trim(), ph = form.elements.phone.value.trim();
    if (!ms) e.ms = 'Enter the Monday to Saturday hours, for example “7:00 am – 10:00 pm”. Write “Closed” if the store is shut.';
    if (!sun) e.sun = 'Enter the Sunday hours, for example “7:00 am – 7:00 pm”. Write “Closed” if the store is shut.';
    if (!/^[\d\s()+\-]{7,20}$/.test(ph)) e.phone = 'Enter a phone number using digits, spaces, + or -, for example +1 868-225-4732.';
    return e;
  }
  storeList.addEventListener('input', e => {
    const f = e.target; if (!f.form || !f.form.classList.contains('store-form')) return;
    if (f.getAttribute('aria-invalid') === 'true') setFieldError(f, checkStore(f.form)[f.name] || '');
  });
  storeList.addEventListener('submit', e => {
    const form = e.target.closest('form.store-form'); if (!form) return;
    e.preventDefault();
    const errors = checkStore(form), first = applyErrors(form, ['ms', 'sun', 'phone'], errors);
    if (first) { first.focus(); U.toast('Check the highlighted fields.', 'bad'); return; }
    const id = form.getAttribute('data-branch');
    const ms = form.elements.ms.value.trim().replace(/\s+/g, ' '), sun = form.elements.sun.value.trim().replace(/\s+/g, ' '), ph = form.elements.phone.value.trim().replace(/\s+/g, ' ');
    let name = '';
    S.update(d => {
      const b = S.byId(d.branches, id); if (!b) return;
      const rows = b.hours || [];
      b.hours = [[(rows[0] && rows[0][0]) || 'Mon – Sat', ms], [(rows[1] && rows[1][0]) || 'Sunday', sun]].concat(rows.slice(2));
      b.phone = ph;
      name = b.name;
    });
    if (!name) { U.toast('That store is no longer listed. Reload the page.', 'bad'); return; }
    /* re-render only this store, so unsaved edits in the other forms survive */
    const b = S.byId(S.load().branches, id), panel = storeList.querySelector('[data-store-panel="' + cssEsc(id) + '"]');
    if (panel && b) panel.outerHTML = storePanel(b);
    renderStats();
    U.toast('Saved. ' + name + ' hours and phone are live on the Store locations page in this browser.', 'ok');
    const again = storeList.querySelector('form[data-branch="' + cssEsc(id) + '"] button[type="submit"]');
    if (again) again.focus();
  });

  /* =====================================================================
     4. Staff notices
     ===================================================================== */
  const nForm = $('notice-form'), nList = $('notice-list');
  const N_FIELDS = ['title', 'body', 'date'];
  function renderNoticeBranches() {
    const d = S.load(), keep = nForm.elements.branch.value;
    nForm.elements.branch.innerHTML = '<option value="">All stores</option>' + (d.branches || []).map(b => '<option value="' + esc(b.id) + '">' + esc(b.name) + ' only</option>').join('');
    if ((d.branches || []).some(b => b.id === keep)) nForm.elements.branch.value = keep;
  }
  function renderNotices() {
    const d = S.load();
    const list = (d.announcements || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    $('notice-count').textContent = plural(list.length, 'notice');
    nList.innerHTML = list.length ? list.map(a =>
      '<li data-id="' + esc(a.id) + '"><div class="grow"><strong>' + esc(a.title) + '</strong>' +
      '<div class="meta">' + esc(a.branchId ? branchName(d, a.branchId) : 'All stores') + ' · ' + esc(U.fmtDate(a.date)) + '</div>' +
      '<p class="notice-body">' + esc(a.body) + '</p></div>' +
      '<button class="btn btn-danger btn-sm" type="button" data-remove-notice="' + esc(a.id) + '">Remove<span class="visually-hidden"> notice: ' + esc(a.title) + '</span></button></li>').join('')
      : '<li class="empty-row">No notices yet. Post one with the form.</li>';
  }
  function checkNotice() {
    const e = {}, f = nForm.elements, title = f.title.value.trim(), body = f.body.value.trim();
    if (!title) e.title = 'Enter a short title, for example “Public holiday rota is up”.';
    if (!body) e.body = 'Write the message staff should read.';
    else if (body.length > 400) e.body = 'Shorten the message to 400 characters or fewer (now ' + body.length + ').';
    if (!isDay(f.date.value)) e.date = 'Choose the date for the notice.';
    return e;
  }
  function updateBodyCount() { $('n-body-count').textContent = String(nForm.elements.body.value.length); }
  nForm.elements.body.addEventListener('input', updateBodyCount);
  liveRevalidate(nForm, N_FIELDS, checkNotice);
  nForm.addEventListener('submit', e => {
    e.preventDefault();
    const first = applyErrors(nForm, N_FIELDS, checkNotice());
    if (first) { first.focus(); U.toast('Check the highlighted fields.', 'bad'); return; }
    const f = nForm.elements;
    const rec = { branchId: f.branch.value || null, date: f.date.value, title: f.title.value.trim().replace(/\s+/g, ' '), body: f.body.value.trim() };
    S.update(d => {
      d.announcements = d.announcements || [];
      let nid; do { nid = S.uid('an'); } while (S.byId(d.announcements, nid));
      d.announcements.unshift(Object.assign({ id: nid }, rec));
    });
    renderNotices(); renderStats();
    f.title.value = ''; f.body.value = ''; f.date.value = todayIso(); updateBodyCount();
    const d = S.load();
    U.toast('Posted. ' + (rec.branchId ? 'Staff at ' + branchName(d, rec.branchId) : 'Staff at every store') + ' see it on the employee portal home in this browser.', 'ok');
    f.title.focus();
  });
  nList.addEventListener('click', async e => {
    const btn = e.target.closest('[data-remove-notice]'); if (!btn) return;
    const id = btn.getAttribute('data-remove-notice');
    const d = S.load(), a = S.byId(d.announcements, id); if (!a) { renderNotices(); return; }
    const ok = await U.confirm({ title: 'Remove this notice?', body: a.title + ' comes off the employee portal home in this browser.', okLabel: 'Remove notice', danger: true });
    if (!ok) { if (document.contains(btn)) btn.focus(); return; }
    const items = Array.from(nList.querySelectorAll('li[data-id]'));
    const i = items.findIndex(li => li.getAttribute('data-id') === id);
    const neighbour = items[i + 1] || items[i - 1];
    const nextId = neighbour ? neighbour.getAttribute('data-id') : null;
    S.update(dd => { dd.announcements = (dd.announcements || []).filter(x => x.id !== id); });
    renderNotices(); renderStats();
    U.toast('Removed. The notice is off the employee portal in this browser.', 'ok');
    const next = nextId ? nList.querySelector('[data-remove-notice="' + cssEsc(nextId) + '"]') : null;
    (next || nForm.elements.title).focus();
  });

  /* =====================================================================
     5. Publish
     ===================================================================== */
  const AREAS = [
    { keys: ['specials'], label: 'Specials' },
    { keys: ['branches'], label: 'Store hours and phone numbers' },
    { keys: ['announcements'], label: 'Staff notices' }
  ];
  function renderPublish() {
    const d = S.load(), seed = window.SFB_DATA || {};
    const same = k => canon(d[k]) === canon(seed[k]);
    const mine = AREAS.reduce((a, x) => a.concat(x.keys), ['version']);
    const otherKeys = Object.keys(Object.assign({}, seed, d)).filter(k => mine.indexOf(k) === -1);
    const row = (label, unchanged) => '<li><span>' + esc(label) + '</span>' +
      (unchanged ? '<span class="badge">Same as shipped</span>' : '<span class="badge badge-warn">Changed in this browser</span>') + '</li>';
    $('pub-changes').innerHTML = AREAS.map(a => row(a.label, a.keys.every(same))).join('') +
      row('Everything else (jobs, applications, staff records)', otherKeys.every(same));
  }
  $('pub-download').addEventListener('click', () => {
    const data = JSON.parse(JSON.stringify(S.load()));
    data.version = (Number(data.version) || 0) + 1;
    const header =
      '/* Southern Food Basket — seed data for the concept site.\n' +
      '   Exported from the store admin on ' + U.fmtDate(new Date()) + ' (version ' + data.version + ').\n' +
      '   Two kinds of data, kept apart:\n' +
      '   - SOURCED: deals, prices, post dates, department lines and the Couva location come from the company\'s own\n' +
      '     public Instagram posts; company facts and branch addresses come from public directories (unverified).\n' +
      '   - DEMO: every person, job, document, hour, phone number and e-mail is invented for the prototype.\n' +
      '   This export keeps the data only. The notes on where each item came from live in the original data/seed.js.\n' +
      '   Bump `version` when the seed changes so stale localStorage copies are replaced. */\n';
    const text = header + 'window.SFB_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'seed.js'; a.hidden = true;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      U.toast('Downloaded seed.js (version ' + data.version + '). Send it to the web team.', 'ok');
    } catch (err) {
      U.toast('The download did not start. Try another browser, or ask the web team for help.', 'bad');
    }
  });
  $('pub-reset').addEventListener('click', async () => {
    const ok = await U.confirm({
      title: 'Discard every change in this browser?',
      body: 'Deals, hours, notices and anything changed in the other demo portals go back to how the website shipped. This cannot be undone.',
      okLabel: 'Discard my changes', danger: true
    });
    if (!ok) return;
    SFBStore.reset();
    SFBStore.login('admin', 'emp-ria');
    location.reload();
  });

  /* another tab of this site changed the data (for example a reset on a public page): show the latest */
  window.addEventListener('storage', e => {
    if (e.key !== S.KEY && e.key !== null) return;
    S.load(true);
    if (drawerOpen) closeDrawer(false);
    refreshAll(); renderStores();
  });

  /* ---------- refresh + boot ---------- */
  function refreshAll() {
    renderStats(); renderDealFilter(); renderDeals(); renderPostSelect(); renderNoticeBranches(); renderNotices();
    if (currentTab() === 'publish') renderPublish();
    if (currentTab() === 'posts') showPostMaker();
  }
  function boot() {
    nForm.elements.date.value = todayIso();
    updateBodyCount();
    renderStores();
    refreshAll();
    showTab(currentTab());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
