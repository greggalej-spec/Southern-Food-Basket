/* Southern Food Basket — public pages: home strips, departments, specials filters, wholesale enquiry (mock),
   locations, about. One script for all six pages; each block looks for its own hooks and returns if absent.
   Data comes from SFBStore (data/seed.js overlaid with localStorage); every string is escaped with SFBUI.esc. */
(function () {
  if (!window.SFBStore || !window.SFBUI) return;
  var esc = SFBUI.esc, href = SFBUI.href, icon = SFBUI.icon, pic = SFBUI.pic, wirePics = SFBUI.wirePics, toast = SFBUI.toast;
  var money = SFBStore.money;
  function data() { return SFBStore.load(); }
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $all(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function byId(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0] || null; }

  /* alt text for the department illustrations (hand-authored SVGs, see assets/img/SOURCES.md) */
  var DEPT_ALT = {
    produce: 'Illustration of a field crate with a dasheen leaf, a mango, pimento peppers and a bundle of bodi',
    meats: 'Illustration of a counter plate with two cuts of meat, parsley and a snowflake for the frozen range',
    pantry: 'Illustration of a rice sack, a bottle of cooking oil and a jar of split peas on a shelf',
    bakery: 'Illustration of hops bread, a loaf and a wheat ear on a board',
    household: 'Illustration of a spray bottle, a paper roll, a bar of soap and bubbles',
    wholesale: 'Illustration of boxes and a rice sack stacked on a wooden pallet'
  };

  /* ---------- shared pieces ---------- */
  function deptName(id) { var d = byId(data().departments, id); return d ? d.name : id; }
  function branchName(id) { var b = byId(data().branches, id); return b ? b.name : id; }
  function forAllBranches(sp) { return !sp.branches || sp.branches.length === 0 || sp.branches.indexOf('all') > -1; }
  function whereText(sp) {
    if (forAllBranches(sp)) return 'All branches';
    return sp.branches.map(branchName).join(' · ');
  }
  function atBranch(sp, branchId) { return !branchId || branchId === 'all' || forAllBranches(sp) || sp.branches.indexOf(branchId) > -1; }

  /* money(price, unit) is the only price formatter; split "TTD 9.99 / lb" into amount and per-unit for display */
  function priceHtml(sp) {
    var full = money(sp.price, sp.unit);
    var i = full.indexOf(' / ');
    var amt = i > -1 ? full.slice(0, i) : full;
    var per = i > -1 ? full.slice(i + 1) : '';
    var html = '<p class="special-price price"><span class="amt">' + esc(amt) + '</span>' + (per ? '<span class="per">' + esc(per) + '</span>' : '') + '</p>';
    if (sp.was != null && sp.was !== '') html += '<p class="was">was <s>' + esc(money(sp.was, sp.unit)) + '</s></p>';
    return html;
  }
  function specialCard(sp) {
    return '<article class="card special-card">' +
      '<div class="special-top"><span class="dept">' + esc(deptName(sp.dept)) + '</span>' +
      (sp.tag ? '<span class="badge badge-clay badge-plain">' + esc(sp.tag) + '</span>' : '') + '</div>' +
      '<h3>' + esc(sp.name) + '</h3>' + priceHtml(sp) +
      '<p class="where">' + esc(whereText(sp)) + '</p></article>';
  }

  /* hours[0] is Mon–Sat, hours[1] is Sun & public holidays; we cannot know public holidays, so Sunday only */
  function todayHours(b) {
    var rows = b.hours || [];
    if (!rows.length) return '';
    var row = new Date().getDay() === 0 ? (rows[1] || rows[0]) : rows[0];
    return row ? row[1] : '';
  }

  function factItem(f, srcLabel) {
    return '<li class="fact"><p>' + esc(f.text) + '</p><span class="fact-src muted">' + esc(srcLabel || 'Source') + ': ' + esc(f.source) + '</span></li>';
  }

  /* week label appears on several pages */
  function fillWeekLabel() {
    var label = (data().settings || {}).weekLabel || '';
    $all('[data-week-label]').forEach(function (el) { el.textContent = label; });
  }

  /* ---------- home ---------- */
  function home() {
    var d = data();
    var h = $('[data-hero-headline]'), s = $('[data-hero-sub]');
    if (h && d.content && d.content.hero) h.textContent = d.content.hero.headline;
    if (s && d.content && d.content.hero) s.textContent = d.content.hero.sub;

    var strip = $('[data-specials-strip]');
    if (strip) strip.innerHTML = (d.specials || []).slice(0, 4).map(specialCard).join('');

    var grid = $('[data-dept-grid]');
    if (grid) {
      grid.innerHTML = (d.departments || []).map(function (dep) {
        return '<a class="card card-flush dept-card" href="' + esc(href('departments.html#' + dep.id)) + '">' +
          pic(dep.img, DEPT_ALT[dep.id] || dep.name, { tone: dep.tone }) +
          '<div class="dept-card-body"><h3>' + esc(dep.name) + icon('arrow') + '</h3><p>' + esc(dep.blurb) + '</p></div></a>';
      }).join('');
      wirePics(grid);
    }

    var facts = $('[data-wholesale-facts]');
    if (facts) facts.innerHTML = ((d.wholesale || {}).sourced || []).slice(0, 2).map(function (f) { return factItem(f); }).join('');

    var row = $('[data-branches-row]');
    if (row) {
      row.innerHTML = (d.branches || []).map(function (b) {
        var hrs = todayHours(b);
        return '<article class="card branch-card"><h3>' + esc(b.name) + '</h3><address>' + esc(b.address) + '</address>' +
          (hrs ? '<p class="hours-today">' + icon('clock') + '<span>Today, ' + esc(hrs) + '</span></p>' : '') +
          '<div class="actions">' +
          '<a class="btn btn-ghost btn-sm" href="' + esc(b.osm) + '" target="_blank" rel="noopener">' + icon('pin') + 'Directions<span class="visually-hidden"> to ' + esc(b.name) + ' (opens OpenStreetMap in a new tab)</span></a>' +
          '<a class="btn btn-primary btn-sm" href="' + esc(href('locations.html#' + b.id)) + '">Hours &amp; services</a>' +
          '</div></article>';
      }).join('');
    }

    var why = $('[data-careers-why]');
    if (why) {
      why.innerHTML = ((d.content || {}).careersWhy || []).slice(0, 2).map(function (w) {
        return '<li>' + icon('check') + '<div><strong>' + esc(w.title) + '</strong><p>' + esc(w.text) + '</p></div></li>';
      }).join('');
    }
  }

  /* ---------- departments ---------- */
  function departments() {
    var blurbs = $all('[data-dept-blurb]');
    var weeks = $all('[data-this-week]');
    if (!blurbs.length && !weeks.length) return;
    var d = data();
    blurbs.forEach(function (el) {
      var dep = byId(d.departments, el.getAttribute('data-dept-blurb'));
      if (dep) el.textContent = dep.blurb;
    });
    weeks.forEach(function (el) {
      var id = el.getAttribute('data-this-week');
      var list = (d.specials || []).filter(function (sp) { return sp.dept === id; });
      if (!list.length) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = '<h3>This week</h3><ul>' + list.map(function (sp) {
        return '<li><span><span class="tw-name">' + esc(sp.name) + '</span>' +
          (forAllBranches(sp) ? '' : '<span class="tw-where">' + esc(whereText(sp)) + '</span>') + '</span>' +
          '<span class="tw-price"><span class="num">' + esc(money(sp.price, sp.unit)) + '</span>' +
          (sp.was != null ? '<s>' + esc(money(sp.was, sp.unit)) + '</s>' : '') + '</span></li>';
      }).join('') + '</ul>' +
        '<a class="more" href="' + esc(href('specials.html?dept=' + encodeURIComponent(id))) + '">All ' + esc(deptName(id).toLowerCase()) + ' specials</a>';
    });
  }

  /* ---------- specials ---------- */
  function specials() {
    var grid = $('[data-specials-grid]');
    if (!grid) return;
    var d = data();
    var branchSel = $('#f-branch'), deptSel = $('#f-dept'), count = $('[data-specials-count]'), clear = $('[data-clear]'), form = $('[data-specials-toolbar]');
    var branches = d.branches || [], specialsList = d.specials || [];
    var deptIds = (d.departments || []).map(function (x) { return x.id; }).filter(function (id) {
      return specialsList.some(function (sp) { return sp.dept === id; });
    });

    function option(value, label, selected) {
      return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(label) + '</option>';
    }
    function readUrl() {
      var sp = new URLSearchParams(location.search);
      var b = sp.get('branch') || 'all', dep = sp.get('dept') || 'all';
      if (b !== 'all' && !byId(branches, b)) b = 'all';
      if (dep !== 'all' && deptIds.indexOf(dep) < 0) dep = 'all';
      return { branch: b, dept: dep };
    }
    function writeUrl(state) {
      var sp = new URLSearchParams(location.search);
      ['branch', 'dept'].forEach(function (k) { if (state[k] && state[k] !== 'all') sp.set(k, state[k]); else sp.delete(k); });
      var q = sp.toString();
      try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {}
    }
    function describe(state, n) {
      var s = n + (n === 1 ? ' special' : ' specials');
      if (state.dept !== 'all') s += ' in ' + deptName(state.dept);
      if (state.branch !== 'all') s += ' at ' + branchName(state.branch);
      return s;
    }
    function render() {
      var state = { branch: branchSel.value, dept: deptSel.value };
      var list = specialsList.filter(function (sp) { return atBranch(sp, state.branch) && (state.dept === 'all' || sp.dept === state.dept); });
      if (list.length) {
        grid.innerHTML = list.map(specialCard).join('');
      } else {
        grid.innerHTML = '<div class="empty"><p>No specials match that branch and department this week.</p><button class="btn btn-ghost btn-sm" type="button" data-clear-inline>Show all specials</button></div>';
        var b = $('[data-clear-inline]', grid); if (b) b.addEventListener('click', reset);
      }
      if (count) count.textContent = describe(state, list.length) + ', ' + ((d.settings || {}).weekLabel || 'this week') + '.';
      if (clear) clear.hidden = state.branch === 'all' && state.dept === 'all';
      writeUrl(state);
    }
    function reset() { branchSel.value = 'all'; deptSel.value = 'all'; render(); branchSel.focus(); }

    var init = readUrl();
    branchSel.innerHTML = option('all', 'All branches', init.branch === 'all') + branches.map(function (b) { return option(b.id, b.name, init.branch === b.id); }).join('');
    deptSel.innerHTML = option('all', 'All departments', init.dept === 'all') + deptIds.map(function (id) { return option(id, deptName(id), init.dept === id); }).join('');
    branchSel.addEventListener('change', render);
    deptSel.addEventListener('change', render);
    if (clear) clear.addEventListener('click', reset);
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    window.addEventListener('popstate', function () { var s = readUrl(); branchSel.value = s.branch; deptSel.value = s.dept; render(); });
    render();
  }

  /* ---------- wholesale ---------- */
  function wholesale() {
    var d = data(), w = d.wholesale || {};
    var lines = $('[data-wholesale-lines]');
    if (lines) lines.innerHTML = (w.lines || []).map(function (t) { return '<li>' + icon('check') + '<span>' + esc(t) + '</span></li>'; }).join('');
    var types = $('[data-customer-types]');
    if (types) types.innerHTML = (w.customerTypes || []).map(function (t) { return '<li>' + icon('basket') + '<span>' + esc(t) + '</span></li>'; }).join('');
    var sourced = $('[data-wholesale-sourced]');
    if (sourced) sourced.innerHTML = (w.sourced || []).map(function (f) { return factItem(f); }).join('');

    var form = $('[data-enquiry]');
    if (!form) return;
    var success = $('[data-enquiry-success]');
    var branchSel = $('#e-branch', form);
    if (branchSel) {
      branchSel.innerHTML = '<option value="">Choose a branch</option>' + (d.branches || []).map(function (b) {
        return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>';
      }).join('');
    }
    var RULES = {
      business: function (v) { return v.length >= 2 ? '' : 'Enter your business name.'; },
      contact: function (v) { return v.length >= 2 ? '' : 'Enter a contact name.'; },
      phone: function (v) { return /^[\d\s()+\-]{7,20}$/.test(v) ? '' : 'Enter a phone or WhatsApp number, digits only.'; },
      branch: function (v) { return v ? '' : 'Choose the branch nearest you.'; },
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
      try { sessionStorage.setItem('sfb-enquiry-demo', '1'); } catch (err) {}
      if (success) {
        success.innerHTML = '<h3>' + icon('check') + 'Enquiry noted (demo)</h3>' +
          '<p>In the real thing the Princes Town trade desk would call <span data-contact></span> back within two working days. This is a prototype: nothing was sent and nothing was stored beyond this browser tab.</p>' +
          '<dl><dt>Business</dt><dd data-business></dd><dt>Nearest branch</dt><dd data-branch></dd></dl>' +
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
    var wa = settings.whatsapp || '', waNote = settings.whatsappNote || 'demo number';
    var jumps = $('[data-branch-jumps]');
    if (jumps) jumps.innerHTML = (d.branches || []).map(function (b) { return '<a class="btn btn-ghost btn-sm" href="#' + esc(b.id) + '">' + esc(b.name) + '</a>'; }).join('');

    root.innerHTML = (d.branches || []).map(function (b) {
      var hours = (b.hours || []).map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
      var services = (b.services || []).map(function (s) { return '<span class="badge badge-green badge-plain">' + esc(s) + '</span>'; }).join('');
      return '<section class="branch" id="' + esc(b.id) + '" aria-labelledby="' + esc(b.id) + '-title"><div class="container"><div class="split">' +
        '<div><p class="eyebrow">Branch</p><h2 id="' + esc(b.id) + '-title">' + esc(b.name) + '</h2>' +
        '<address>' + esc(b.address) + '</address>' +
        '<span class="source muted">Address from public directories, unverified' + (b.source ? ' (' + esc(b.source.replace(/,\s*unverified$/i, '')) + ')' : '') + '.</span>' +
        '<h3 class="visually-hidden">Services at ' + esc(b.name) + '</h3><div class="cluster services">' + services + '</div>' +
        '<ul class="contact-list">' +
        '<li>' + icon('phone') + '<span class="num">' + esc(b.phone) + '</span><span class="source">demo number</span></li>' +
        (wa ? '<li>' + icon('phone') + '<span>WhatsApp <span class="num">' + esc(wa) + '</span></span><span class="source">' + esc(waNote) + '</span></li>' : '') +
        '</ul>' +
        '<div class="actions">' +
        '<a class="btn btn-primary" href="' + esc(b.osm) + '" target="_blank" rel="noopener">' + icon('pin') + 'Directions<span class="visually-hidden"> to ' + esc(b.name) + ' (opens OpenStreetMap in a new tab)</span></a>' +
        (wa ? '<button class="btn btn-ghost" type="button" data-whatsapp>WhatsApp (' + esc(waNote) + ')</button>' : '') +
        '</div></div>' +
        '<div class="card hours-card"><h3>Opening hours</h3><table><thead><tr><th scope="col">Days</th><th scope="col">Hours</th></tr></thead><tbody>' + hours + '</tbody></table>' +
        '<span class="source">Demo hours for the concept. Public holiday hours follow the Sunday row.</span></div>' +
        '</div></div></section>';
    }).join('');

    $all('[data-whatsapp]', root).forEach(function (btn) {
      btn.addEventListener('click', function () { toast('WhatsApp ' + wa + ' is a demo number. Nothing opens in this prototype.'); });
    });

    /* footer and home link to locations.html#sando etc.; the sections are rendered after parse, so jump explicitly */
    function jump() {
      var id = decodeURIComponent(location.hash.slice(1));
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
    if (facts) facts.innerHTML = (c.facts || []).map(function (f) { return factItem(f); }).join('');
    if (values) {
      values.innerHTML = (c.values || []).map(function (v) {
        return '<article class="card value-card"><h3>' + esc(v.title) + '</h3><p>' + esc(v.text) + '</p></article>';
      }).join('');
    }
  }

  function boot() {
    fillWeekLabel();
    home(); departments(); specials(); wholesale(); locations(); about();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
