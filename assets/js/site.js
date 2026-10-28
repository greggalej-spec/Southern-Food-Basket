/* Southern Food Basket — public pages: home, specials, departments, wholesale enquiry (mock), locations, about.
   One script for all six pages; each block looks for its own hooks and returns if absent.
   Data comes from SFBStore (data/seed.js overlaid with localStorage); every string is escaped with SFBUI.esc. */
(function () {
  if (!window.SFBStore || !window.SFBUI) return;
  var esc = SFBUI.esc, href = SFBUI.href, icon = SFBUI.icon, pic = SFBUI.pic, wirePics = SFBUI.wirePics, toast = SFBUI.toast, fmtDate = SFBUI.fmtDate, seal = SFBUI.seal;
  var money = SFBStore.money;
  function data() { return SFBStore.load(); }
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0] || null; }

  /* ---------- shared pieces ---------- */
  function dept(id) { return byId(data().departments, id) || { id: id, name: id, short: id }; }
  function branchName(id) { var b = byId(data().branches, id); return b ? b.name : id; }
  function newestFirst(list) { return list.slice().sort(function (a, b) { return a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0; }); }
  function dealsIn(id) { return (data().specials || []).filter(function (sp) { return sp.dept === id; }); }
  function minPrice(id) { var l = dealsIn(id); return l.length ? Math.min.apply(null, l.map(function (x) { return x.price; })) : null; }
  function dollars(v) { return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function dealCard(sp, opts) {
    opts = opts || {};
    var h = opts.h || 'h3';
    return '<article class="deal">' +
      '<figure class="deal-photo"><img src="' + esc(href('assets/img/photos/' + sp.img + '.webp')) + '" alt="' + esc(sp.alt || sp.name) + '" width="800" height="667" loading="lazy" decoding="async">' +
      (sp.isNew ? '<span class="new-corner" aria-hidden="true">NEW</span>' : '') + seal(sp.price) + '</figure>' +
      '<div class="deal-body"><p class="deal-dept">' + esc(dept(sp.dept).short) + '</p>' +
      '<' + h + ' class="deal-name">' + esc(sp.name) + '</' + h + '>' +
      '<p class="deal-price" aria-hidden="true"><span class="qty">1 FOR</span><span class="amt">' + esc(dollars(sp.price)) + '</span></p>' +
      '<p class="visually-hidden">' + (sp.isNew ? 'New product. ' : '') + 'Price ' + esc(money(sp.price)) + ' each.</p>' +
      '<p class="deal-meta"><span>Posted ' + esc(fmtDate(sp.posted)) + '</span>' +
      (sp.couva ? '<span class="couva">' + icon('pin') + 'Couva</span>' : '') + '</p></div></article>';
  }

  function factItem(f) {
    return '<li class="fact"><p>' + esc(f.text) + '</p><span class="fact-src">Source: ' + esc(f.source) + '</span></li>';
  }

  function directionsLink(b, cls) {
    return '<a class="btn ' + (cls || 'btn-ghost btn-sm') + '" href="' + esc(SFBUI.mapsDir(b)) + '" target="_blank" rel="noopener">' + icon('pin') + 'Directions<span class="visually-hidden"> to ' + esc(b.name) + ' (opens Google Maps in a new tab)</span></a>';
  }
  function storeCard(b) {
    var hrs = SFBUI.todayHours(b);
    return '<article class="store-card"><span class="store-arch" aria-hidden="true"></span><h3>' + esc(b.name) + '</h3><address>' + esc(b.address) + '</address>' +
      (hrs ? '<p class="today">' + icon('clock') + '<span>Open today ' + esc(hrs) + '</span></p>' : '') +
      (b.phone ? '<p class="today">' + icon('phone') + '<a href="' + esc(SFBUI.telHref(b.phone)) + '">' + esc(b.phone) + '</a></p>' : '') +
      '<div class="actions">' + directionsLink(b, 'btn-primary btn-sm') +
      '<a class="btn btn-ghost btn-sm" href="' + esc(href('locations.html#' + b.id)) + '">Store details</a>' +
      '</div></article>';
  }

  /* ---------- home ---------- */
  function home() {
    var root = $('[data-home]');
    if (!root) return;
    var d = data();

    var h = $('[data-hero-headline]'), s = $('[data-hero-sub]');
    if (s && d.content && d.content.hero) s.textContent = d.content.hero.sub;

    var vegFrom = minPrice('fresh'), cakeFrom = minPrice('bakery');
    var points = $('[data-hero-points]');
    if (points) {
      var names = (d.branches || []).map(function (b) { return b.name; });
      var where = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names.join('');
      points.innerHTML =
        '<li><span class="dot">' + icon('store') + '</span><span>' + esc(names.length + ' stores: ' + where) + '</span></li>' +
        (vegFrom != null ? '<li><span class="dot">' + icon('tag') + '</span><span>Fresh-cut veg packs from ' + esc(dollars(vegFrom)) + '</span></li>' : '') +
        (cakeFrom != null ? '<li><span class="dot">' + icon('basket') + '</span><span>Double-layer cakes from ' + esc(dollars(cakeFrom)) + '</span></li>' : '');
    }
    var stick = $('[data-sticker-price]');
    if (stick && vegFrom != null) stick.textContent = dollars(vegFrom);

    /* deals: one from each department first, newest first, then the rest */
    var all = newestFirst(d.specials || []), seen = {}, picks = [];
    all.forEach(function (sp) { if (!seen[sp.dept]) { seen[sp.dept] = 1; picks.push(sp); } });
    all.forEach(function (sp) { if (picks.length < 8 && picks.indexOf(sp) < 0) picks.push(sp); });
    var strip = $('[data-deals-strip]');
    if (strip) strip.innerHTML = picks.slice(0, 8).map(function (sp) { return dealCard(sp); }).join('');
    var total = $('[data-deals-total]');
    if (total) total.textContent = String((d.specials || []).length);
    var note = $('[data-deals-note]');
    if (note) note.textContent = (d.settings || {}).dealsNote || '';

    var chips = $('[data-dept-chips]');
    if (chips) {
      chips.innerHTML = (d.departments || []).filter(function (x) { return dealsIn(x.id).length; }).map(function (x) {
        return '<li><a class="chip" href="' + esc(href('specials.html?dept=' + encodeURIComponent(x.id))) + '">' + esc(x.short) + ' <span class="count">(' + dealsIn(x.id).length + ')</span></a></li>';
      }).join('');
    }

    var grid = $('[data-dept-grid]');
    if (grid) {
      grid.innerHTML = (d.departments || []).filter(function (x) { return x.id !== 'wholesale'; }).map(function (dep) {
        return '<a class="dept-tile" href="' + esc(href('departments.html#' + dep.id)) + '">' + pic(dep.img, dep.alt || dep.name) +
          '<span class="label"><strong>' + esc(dep.name) + icon('arrow') + '</strong><span>' + esc(dep.blurb) + '</span></span></a>';
      }).join('');
      wirePics(grid);
    }

    var stores = $('[data-store-grid]');
    if (stores) stores.innerHTML = (d.branches || []).map(storeCard).join('');

    var c = (d.content || {}).community;
    var comm = $('[data-community]');
    if (comm && c) {
      $('[data-community-title]', comm).textContent = c.title;
      $('[data-community-text]', comm).textContent = c.text;
      $('[data-community-source]', comm).textContent = 'From ' + c.source + '.';
      var ig = (d.settings || {}).instagram, igLink = $('[data-instagram]', comm);
      if (ig && igLink) { igLink.href = ig.url; $('[data-instagram-handle]', igLink).textContent = ig.handle; } else if (igLink) igLink.hidden = true;
    }

    var why = $('[data-careers-why]');
    if (why) {
      why.innerHTML = ((d.content || {}).careersWhy || []).slice(0, 3).map(function (w) {
        return '<li>' + icon('check') + '<div><strong>' + esc(w.title) + '</strong><p>' + esc(w.text) + '</p></div></li>';
      }).join('');
    }
  }

  /* ---------- Specials ---------- */
  function specials() {
    var grid = $('[data-deals-grid]');
    if (!grid) return;
    var d = data();
    var list = newestFirst(d.specials || []);
    var depts = (d.departments || []).filter(function (x) { return dealsIn(x.id).length; });
    var chipsEl = $('[data-deal-filters]'), couvaBox = $('#f-couva'), count = $('[data-deals-count]'), note = $('[data-deals-note]');
    if (note) note.textContent = (d.settings || {}).dealsNote || '';

    function readUrl() {
      var q = new URLSearchParams(location.search);
      var dep = q.get('dept') || 'all';
      if (dep !== 'all' && !depts.some(function (x) { return x.id === dep; })) dep = 'all';
      return { dept: dep, couva: q.get('couva') === '1' };
    }
    function writeUrl(st) {
      var q = new URLSearchParams(location.search);
      if (st.dept !== 'all') q.set('dept', st.dept); else q.delete('dept');
      if (st.couva) q.set('couva', '1'); else q.delete('couva');
      var s = q.toString();
      try { history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
    }
    var state = readUrl();

    function paintChips() {
      chipsEl.innerHTML = [{ id: 'all', short: 'All deals' }].concat(depts).map(function (x) {
        var n = x.id === 'all' ? list.length : dealsIn(x.id).length;
        return '<li><button type="button" class="chip" data-dept="' + esc(x.id) + '" aria-pressed="' + (state.dept === x.id) + '">' + esc(x.short) + ' <span class="count">(' + n + ')</span></button></li>';
      }).join('');
    }
    function render() {
      var shown = list.filter(function (sp) { return (state.dept === 'all' || sp.dept === state.dept) && (!state.couva || sp.couva); });
      if (shown.length) {
        grid.innerHTML = shown.map(function (sp) { return dealCard(sp, { h: 'h2' }); }).join('');
      } else {
        grid.innerHTML = '<div class="empty"><p>No Couva-tagged posts in this department yet.</p><button class="btn btn-ghost btn-sm" type="button" data-show-all>Show every deal</button></div>';
        $('[data-show-all]', grid).addEventListener('click', function () { state = { dept: 'all', couva: false }; couvaBox.checked = false; paintChips(); render(); });
      }
      var what = state.dept === 'all' ? 'deals' : dept(state.dept).name.toLowerCase() + ' deals';
      count.textContent = shown.length + ' ' + (shown.length === 1 ? what.replace(/s$/, '') : what) + (state.couva ? ' tagged Couva' : '');
      writeUrl(state);
    }
    paintChips();
    couvaBox.checked = state.couva;
    chipsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-dept]'); if (!b) return;
      state.dept = b.getAttribute('data-dept'); paintChips(); render();
      var again = $('[data-dept="' + state.dept + '"]', chipsEl); if (again) again.focus();
    });
    couvaBox.addEventListener('change', function () { state.couva = couvaBox.checked; render(); });
    window.addEventListener('popstate', function () { state = readUrl(); couvaBox.checked = state.couva; paintChips(); render(); });
    render();
  }

  /* ---------- departments ---------- */
  function departments() {
    var root = $('[data-dept-sections]');
    if (!root) return;
    var d = data();
    var jumps = $('[data-dept-jumps]');
    if (jumps) jumps.innerHTML = (d.departments || []).map(function (x) { return '<li><a class="chip" href="#' + esc(x.id) + '">' + esc(x.short) + '</a></li>'; }).join('');
    root.innerHTML = (d.departments || []).map(function (x, i) {
      var deals = newestFirst(dealsIn(x.id));
      var rows = deals.length ? '<h3>Recent specials</h3><ul class="deal-rows">' + deals.map(function (sp) {
        return '<li><span class="name">' + esc(sp.name) + '</span><span class="when">Posted ' + esc(fmtDate(sp.posted)) + (sp.couva ? ' · Couva' : '') + '</span><span class="amt" aria-label="' + esc(money(sp.price)) + '">' + esc(dollars(sp.price)) + '</span></li>';
      }).join('') + '</ul><p style="margin-top:16px"><a class="more-link" href="' + esc(href('specials.html?dept=' + encodeURIComponent(x.id))) + '">See these deals with photos ' + icon('arrow') + '</a></p>'
        : x.id === 'wholesale' ? '<p><a class="btn btn-primary" href="' + esc(href('wholesale.html')) + '">Wholesale and trade accounts</a></p>' : '';
      return '<section class="dept-section" id="' + esc(x.id) + '" aria-labelledby="' + esc(x.id) + '-title"><div class="container"><div class="split split-top' + (i % 2 ? ' reverse' : '') + '">' +
        pic(x.img, x.alt || x.name) +
        '<div><p class="eyebrow">Department</p><h2 id="' + esc(x.id) + '-title">' + esc(x.name) + '</h2><p class="lede">' + esc(x.blurb) + '</p>' + rows + '</div>' +
        '</div></div></section>';
    }).join('');
    wirePics(root);
    jumpToHash();
  }

  /* ---------- wholesale ---------- */
  function wholesale() {
    var d = data(), w = d.wholesale || {};
    var lines = $('[data-wholesale-lines]');
    if (lines) lines.innerHTML = (w.lines || []).map(function (t) { return '<li>' + icon('check') + '<span>' + esc(t) + '</span></li>'; }).join('');
    var types = $('[data-customer-types]');
    if (types) types.innerHTML = (w.customerTypes || []).map(function (t) { return '<li>' + icon('basket') + '<span>' + esc(t) + '</span></li>'; }).join('');
    var sourced = $('[data-wholesale-sourced]');
    if (sourced) sourced.innerHTML = (w.sourced || []).map(factItem).join('');

    var form = $('[data-enquiry]');
    if (!form) return;
    var success = $('[data-enquiry-success]');
    var branchSel = $('#e-branch', form);
    if (branchSel) {
      branchSel.innerHTML = '<option value="">Choose a store</option>' + (d.branches || []).map(function (b) {
        return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>';
      }).join('');
    }
    var RULES = {
      business: function (v) { return v.length >= 2 ? '' : 'Enter your business name.'; },
      contact: function (v) { return v.length >= 2 ? '' : 'Enter a contact name.'; },
      phone: function (v) { return /^[\d\s()+\-]{7,20}$/.test(v) ? '' : 'Enter a phone or WhatsApp number, digits only.'; },
      branch: function (v) { return v ? '' : 'Choose the store nearest you.'; },
      buys: function (v) { return v.length >= 10 ? '' : 'Tell us a little about what you buy (at least 10 characters).'; }
    };
    function setError(name, msg) {
      var field = form.elements[name], out = $('[data-error-for="' + name + '"]', form);
      if (!field) return;
      if (msg) { field.setAttribute('aria-invalid', 'true'); if (out) { out.textContent = msg; out.hidden = false; field.setAttribute('aria-describedby', out.id); } }
      else { field.removeAttribute('aria-invalid'); if (out) { out.textContent = ''; out.hidden = true; } field.removeAttribute('aria-describedby'); }
    }
    Object.keys(RULES).forEach(function (name) {
      var field = form.elements[name];
      if (field) field.addEventListener('input', function () { if (field.getAttribute('aria-invalid')) setError(name, RULES[name](field.value.trim())); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(RULES).forEach(function (name) {
        var field = form.elements[name]; if (!field) return;
        var msg = RULES[name](field.value.trim());
        setError(name, msg);
        if (msg && !firstBad) firstBad = field;
      });
      if (firstBad) { firstBad.focus(); toast('Check the highlighted fields.', 'bad'); return; }
      var business = form.elements.business.value.trim(), contact = form.elements.contact.value.trim();
      var branch = branchName(form.elements.branch.value);
      if (success) {
        success.innerHTML = '<h3>' + icon('check') + 'Enquiry noted (demo)</h3>' +
          '<p>In the real thing the trade desk would call <span data-contact></span> back. This is a prototype: nothing was sent and nothing was stored.</p>' +
          '<dl><dt>Business</dt><dd data-business></dd><dt>Nearest store</dt><dd data-branch></dd></dl>' +
          '<button class="btn btn-ghost btn-sm" type="button" data-again>Send another enquiry</button>';
        $('[data-contact]', success).textContent = contact;
        $('[data-business]', success).textContent = business;
        $('[data-branch]', success).textContent = branch;
        success.hidden = false;
        form.hidden = true;
        success.setAttribute('tabindex', '-1');
        success.focus();
        $('[data-again]', success).addEventListener('click', function () {
          form.reset(); Object.keys(RULES).forEach(function (n) { setError(n, ''); });
          success.hidden = true; form.hidden = false; form.elements.business.focus();
        });
      }
      toast('Demo enquiry noted. Nothing was sent.', 'ok');
    });
  }

  /* ---------- locations ---------- */
  function locations() {
    var root = $('[data-locations]');
    if (!root) return;
    var d = data(), settings = d.settings || {};
    var jumps = $('[data-branch-jumps]');
    if (jumps) jumps.innerHTML = (d.branches || []).map(function (b) { return '<li><a class="chip" href="#' + esc(b.id) + '">' + icon('pin') + esc(b.name) + '</a></li>'; }).join('');
    var svc = $('[data-store-services]');
    if (svc) svc.innerHTML = (d.storeServices || []).map(function (s) { return '<li>' + icon('check') + '<span>' + esc(s) + '</span></li>'; }).join('');

    root.innerHTML = (d.branches || []).map(function (b) {
      var hours = (b.hours || []).map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
      var services = (b.services || []).map(function (s) { return '<span class="badge badge-green badge-plain">' + esc(s) + '</span>'; }).join('');
      return '<section class="branch" id="' + esc(b.id) + '" aria-labelledby="' + esc(b.id) + '-title"><div class="container"><div class="split split-top">' +
        '<div><span class="store-arch" aria-hidden="true"></span><p class="eyebrow">Store</p><h2 id="' + esc(b.id) + '-title">' + esc(b.name) + '</h2>' +
        '<address>' + esc(b.address) + '</address>' +
        (b.plusCode ? '<p class="plus-code">Plus code ' + esc(b.plusCode) + '</p>' : '') +
        (services ? '<h3 class="visually-hidden">At this store</h3><div class="cluster services">' + services + '</div>' + (b.servicesSource ? '<span class="source-line">From ' + esc(b.servicesSource) + '.</span>' : '') : '') +
        '<ul class="contact-list">' +
        (b.phone ? '<li>' + icon('phone') + '<a class="num" href="' + esc(SFBUI.telHref(b.phone)) + '">' + esc(b.phone) + '</a></li>' : '') +
        (settings.whatsappChannel ? '<li>' + icon('bell') + '<a href="' + esc(settings.whatsappChannel) + '" target="_blank" rel="noopener">Deals on our WhatsApp channel<span class="visually-hidden"> (opens in a new tab)</span></a></li>' : '') +
        '</ul>' +
        '<div class="actions">' + directionsLink(b, 'btn-primary') +
        '<a class="btn btn-ghost" href="' + esc(SFBUI.mapsView(b)) + '" target="_blank" rel="noopener">View on Google Maps<span class="visually-hidden"> (opens in a new tab)</span></a>' +
        '</div><span class="source-line">Source: ' + esc(b.source) + '.</span></div>' +
        '<div class="card hours-card"><h3>Opening hours</h3><table><thead><tr><th scope="col">Days</th><th scope="col">Hours</th></tr></thead><tbody>' + hours + '</tbody></table>' +
        '<span class="source-line">From the store’s Google Maps listing, October 2026. Public holiday hours may differ.</span></div>' +
        '</div></div></section>';
    }).join('');
    jumpToHash();
  }

  /* sections render after parse, so jump to #id explicitly; a malformed fragment is ignored */
  function jumpToHash() {
    function jump() {
      var id; try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
      if (!id) return;
      var el = document.getElementById(id);
      if (el) requestAnimationFrame(function () { el.scrollIntoView({ block: 'start' }); });
    }
    jump();
    window.addEventListener('hashchange', jump);
  }

  /* ---------- about ---------- */
  function about() {
    var facts = $('[data-facts]'), values = $('[data-values]');
    if (!facts && !values) return;
    var c = data().content || {};
    if (facts) facts.innerHTML = (c.facts || []).map(factItem).join('');
    if (values) {
      values.innerHTML = (c.values || []).map(function (v) {
        return '<article class="value-card"><h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p></article>';
      }).join('');
    }
  }

  function boot() { home(); specials(); departments(); wholesale(); locations(); about(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
