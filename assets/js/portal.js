/* Southern Food Basket — employee portal (portal/*.html). Branches on <body data-page="…">.
   Every page is a clickable mock over SFBStore (localStorage). Strings from the store or the user go
   through SFBUI.esc() before they touch innerHTML. File bytes are never stored: metadata only. */
(function () {
  'use strict';
  const page = document.body.getAttribute('data-page');
  if (!page) return;

  /* every page except the demo login needs an employee or HR session; requireRole redirects otherwise */
  if (page !== 'login') {
    const s = SFBStore.requireRole(['employee', 'hr', 'admin']);
    if (!s) return;
  }

  const UI = window.SFBUI, S = window.SFBStore;
  const esc = UI.esc, icon = UI.icon, fmtTime = UI.fmtTime, toast = UI.toast;
  const MAX_UPLOAD = 8 * 1024 * 1024; /* 8 MB */
  const el = id => document.getElementById(id);

  /* ---------- dates. Seed dates are plain YYYY-MM-DD; treat them as local calendar days so a
     negative UTC offset (Trinidad is UTC-4) never shows the day before. ---------- */
  const pad2 = n => String(n).padStart(2, '0');
  const isDay = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  function isoLocal(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseDay(iso) { const p = String(iso).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function todayIso() { return isoLocal(new Date()); }
  /* fmtDay keeps the Intl-style options its callers pass and maps them onto SFBUI.fmtDate:
     { day } alone -> "23"; { day, month } -> "23 Oct"; add weekday -> "Fri 23 Oct"; no options -> "23 Oct 2026". */
  function fmtDay(iso, opts) {
    if (!iso) return '';
    if (!opts) return UI.fmtDate(iso);
    if (opts.day && !opts.month) { const d = UI.parseDate(iso); return isNaN(d) ? '' : String(d.getDate()); }
    return UI.fmtDate(iso, { year: opts.year ? undefined : false, weekday: !!opts.weekday });
  }
  function weekdayShort(iso) { return parseDay(iso).toLocaleDateString('en-GB', { weekday: 'short' }); }
  function cmp(a, b) { a = String(a || ''); b = String(b || ''); return a < b ? -1 : a > b ? 1 : 0; }
  function plural(n, unit) { return n + ' ' + unit + (n === 1 ? '' : 's'); }
  function inDays(n) {
    if (n == null) return '';
    if (n < 0) return plural(-n, 'day') + ' ago';
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    return 'in ' + plural(n, 'day');
  }
  function dateRange(from, to) {
    if (!from) return '';
    if (!to || to === from) return fmtDay(from);
    const a = parseDay(from), b = parseDay(to);
    if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return fmtDay(from, { day: 'numeric' }) + ' – ' + fmtDay(to);
    if (a.getFullYear() === b.getFullYear()) return fmtDay(from, { day: 'numeric', month: 'short' }) + ' – ' + fmtDay(to);
    return fmtDay(from) + ' – ' + fmtDay(to);
  }

  /* ---------- shifts ---------- */
  function mins(hhmm) { const p = String(hhmm || '0:0').split(':').map(Number); return p[0] * 60 + (p[1] || 0); }
  function nowMins() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function shiftHours(sh) { return Math.max(0, mins(sh.end) - mins(sh.start)) / 60; }
  function fmtHours(h) { return (Number.isInteger(h) ? String(h) : h.toFixed(1).replace(/\.0$/, '')) + ' h'; }
  function fmtMinutes(m) { m = Number(m) || 0; return m >= 60 ? fmtHours(m / 60) : m + ' min'; }
  function sortedShifts(me) { return (me.shifts || []).slice().sort((a, b) => cmp(a.date, b.date) || cmp(a.start, b.start)); }
  function shiftEnded(sh) { const t = todayIso(); return sh.date < t || (sh.date === t && mins(sh.end) <= nowMins()); }
  function shiftStarted(sh) { const t = todayIso(); return sh.date < t || (sh.date === t && mins(sh.start) <= nowMins()); }
  function shiftRange(sh) { return fmtTime(sh.start) + ' – ' + fmtTime(sh.end); }

  /* ---------- small renderers ---------- */
  const STATUS = { pending: ['badge-warn', 'Pending'], approved: ['badge-ok', 'Approved'], declined: ['badge-bad', 'Declined'] };
  function statusBadge(status) {
    const s = STATUS[status] || ['', String(status || '').replace(/^./, c => c.toUpperCase())];
    return '<span class="badge ' + s[0] + '">' + esc(s[1]) + '</span>';
  }
  function stat(label, value, sub, cls) {
    return '<div class="stat"><div class="stat-label">' + esc(label) + '</div><div class="stat-value' + (cls ? ' ' + cls : '') + '">' + esc(value) + '</div>' +
      (sub ? '<div class="stat-sub">' + esc(sub) + '</div>' : '') + '</div>';
  }
  function emptyRow(text) { return '<li><div class="grow muted">' + esc(text) + '</div></li>'; }
  function fillIcons(scope) {
    (scope || document).querySelectorAll('[data-icon]').forEach(n => { n.innerHTML = icon(n.getAttribute('data-icon')); });
  }
  function fail(errEl, msg, input) {
    errEl.textContent = msg; errEl.hidden = false;
    if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
    return false;
  }
  function branchName(d, id) { const b = S.byId(d.branches, id); return b ? b.name : ''; }
  function docName(d, docId) { const doc = S.byId(d.kycDocs, docId); return doc ? doc.name : docId; }

  /* ---------- login (portal/index.html) ---------- */
  const ROLE_HOME = { applicant: 'careers/me.html', employee: 'portal/home.html', hr: 'hr/index.html', admin: 'admin/index.html' };
  const ROLE_AREA = { applicant: /^careers\//, employee: /^portal\//, hr: /^(portal|hr)\//, admin: /^(admin|portal)\// };
  const ROLE_LABEL = { applicant: 'Applicant', employee: 'Employee', hr: 'HR', admin: 'Store admin' };
  /* ?next= is honoured only when it is a plain relative path inside the site */
  function safeNext() {
    const n = UI.qs('next');
    if (!n || n.charAt(0) === '/' || n.indexOf('//') !== -1 || n.indexOf(':') !== -1 || n.indexOf('\\') !== -1) return null;
    if (n.split(/[/?#]/).indexOf('..') !== -1) return null;
    /* no percent-encoding at all: an encoded "..", "//" or ":" must not slip past the checks above */
    if (!/^[\w\-./?=&#]+$/.test(n)) return null;
    return n;
  }
  function destinationFor(role) {
    const n = safeNext();
    const ok = n && ROLE_AREA[role] && ROLE_AREA[role].test(n);
    return UI.href(ok ? n : (ROLE_HOME[role] || 'index.html'));
  }
  function renderLogin() {
    fillIcons(document);
    /* ?as=applicant|employee|hr signs straight in as that demo role (shareable prototype links) */
    const as = UI.qs('as');
    if (as && ROLE_HOME[as]) {
      const card = document.querySelector('.role-card[data-role="' + as + '"]');
      S.login(as, card ? card.getAttribute('data-user') : null);
      location.replace(destinationFor(as));
      return;
    }
    const note = el('session-note');
    function paintNote() {
      const s = S.session(), u = S.currentUser();
      if (!s || !u) { note.innerHTML = ''; return; }
      note.innerHTML = '<div class="alert alert-info session-alert">' + icon('user') +
        '<p class="grow">You are signed in as <strong>' + esc(u.name) + '</strong> (' + esc(ROLE_LABEL[s.role] || s.role) + ').</p>' +
        '<div class="cluster" style="--gap:8px"><a class="btn btn-primary btn-sm" href="' + esc(destinationFor(s.role)) + '">Continue</a>' +
        '<button class="btn btn-ghost btn-sm" type="button" id="note-signout">Sign out</button></div></div>';
      note.querySelector('#note-signout').addEventListener('click', () => { S.logout(); paintNote(); toast('Signed out of the demo.'); });
    }
    paintNote();
    document.querySelectorAll('.role-card[data-role]').forEach(btn => btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      S.login(role, btn.getAttribute('data-user'));
      location.href = destinationFor(role);
    }));
  }

  /* ---------- home ---------- */
  function complianceAlerts(me, d) {
    const out = [];
    (me.compliance || []).forEach(c => {
      const name = docName(d, c.docId), st = UI.docDisplayState(c), to = 'docs.html#documents';
      if (st === 'expiring') out.push({ tone: 'warn', text: name + ' expires ' + inDays(S.daysUntil(c.expiry)) + ' (' + fmtDay(c.expiry) + '). Upload the renewal before then.', href: to });
      else if (st === 'expired') out.push({ tone: 'bad', text: name + ' expired on ' + fmtDay(c.expiry) + '. Upload a current one.', href: to });
      else if (st === 'missing') out.push({ tone: 'bad', text: name + ' has not been provided.', href: to });
      else if (st === 'flagged') out.push({ tone: 'bad', text: name + ' needs attention' + (c.reason ? ': ' + c.reason : '.'), href: to });
    });
    (me.training || []).filter(t => !t.done && t.due).forEach(t => {
      const n = S.daysUntil(t.due);
      if (n < 0) out.push({ tone: 'bad', text: t.name + ' training is overdue (due ' + fmtDay(t.due) + ').', href: 'docs.html#training' });
      else if (n <= 30) out.push({ tone: 'warn', text: t.name + ' training is due ' + inDays(n) + ' (' + fmtDay(t.due) + ').', href: 'docs.html#training' });
    });
    return out;
  }
  function renderHome(me, d) {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    el('greeting').textContent = greet + ', ' + (String(me.name).split(/\s+/)[0] || me.name) + '.';
    el('whoami').textContent = me.role + ' · ' + branchName(d, me.branchId);

    el('alerts').innerHTML = complianceAlerts(me, d).map(a =>
      '<div class="alert alert-' + a.tone + '">' + icon('bell') + '<p>' + esc(a.text) + ' <a href="' + esc(a.href) + '">Documents &amp; training</a></p></div>').join('');

    const shifts = sortedShifts(me), today = todayIso();
    const next = shifts.find(sh => !shiftEnded(sh));
    const lv = me.leave || {};
    const annualLeft = Math.max(0, (lv.annualEntitled || 0) - (lv.annualUsed || 0));
    const pendingAnnual = (me.leaveRequests || []).filter(r => r.status === 'pending' && r.type === 'Annual').reduce((n, r) => n + (Number(r.days) || 0), 0);
    const todo = (me.training || []).filter(t => !t.done);
    const nextDue = todo.filter(t => t.due).sort((a, b) => cmp(a.due, b.due))[0];
    const slips = (me.payslips || []).slice().sort((a, b) => cmp(b.paidOn || b.to, a.paidOn || a.to));
    const last = slips[0];
    el('stats').innerHTML =
      stat('Next shift', next ? fmtDay(next.date, { day: 'numeric', month: 'short' }) : 'None', next ? weekdayShort(next.date) + ' · ' + shiftRange(next) : 'Nothing rostered after today') +
      stat('Annual leave left', plural(annualLeft, 'day'), (lv.annualUsed || 0) + ' of ' + (lv.annualEntitled || 0) + ' days used' + (pendingAnnual ? ' · ' + plural(pendingAnnual, 'day') + ' pending' : '')) +
      stat('Training to do', plural(todo.length, 'course'), nextDue ? 'Next due ' + fmtDay(nextDue.due) : 'Nothing outstanding') +
      stat('Last payslip', last ? S.money(last.net) : 'None yet', last ? last.period + ' · net pay, paid ' + fmtDay(last.paidOn) : 'No payslips on file', last ? 'money' : '');

    const todays = shifts.find(sh => sh.date === today);
    const todayLabel = 'Today · ' + fmtDay(today, { weekday: 'short', day: 'numeric', month: 'short' });
    el('today-shift').innerHTML = todays
      ? '<div class="shift-today"><div><p class="eyebrow">' + esc(todayLabel) + '</p><div class="shift-time">' + esc(shiftRange(todays)) + '</div><div class="small">' + esc(todays.role) + '</div></div><span class="badge badge-green">' + esc(fmtHours(shiftHours(todays))) + '</span></div>'
      : '<div class="shift-today is-off"><div><p class="eyebrow">' + esc(todayLabel) + '</p><div class="shift-time">Off today</div></div></div>';
    const upcoming = shifts.filter(sh => sh.date > today).slice(0, 5);
    el('upcoming').innerHTML = upcoming.length ? upcoming.map(sh =>
      '<li><div class="grow"><strong>' + esc(weekdayShort(sh.date) + ' ' + fmtDay(sh.date, { day: 'numeric', month: 'short' })) + '</strong><div class="meta">' + esc(shiftRange(sh) + ' · ' + sh.role) + '</div></div><span class="badge badge-plain">' + esc(fmtHours(shiftHours(sh))) + '</span></li>').join('')
      : emptyRow('No more shifts in the roster on file.');

    const anns = (d.announcements || []).filter(a => !a.branchId || a.branchId === me.branchId).sort((a, b) => cmp(b.date, a.date));
    el('announcements').innerHTML = anns.length ? anns.map(a =>
      '<li><div class="grow"><strong>' + esc(a.title) + '</strong><div class="meta">' + esc(fmtDay(a.date)) + ' · ' + esc(a.branchId ? branchName(d, a.branchId) : 'All branches') + '</div><p class="small ann-body">' + esc(a.body) + '</p></div></li>').join('')
      : emptyRow('No announcements.');
  }

  /* ---------- schedule ---------- */
  function renderSchedule(me, d) {
    const shifts = sortedShifts(me), today = todayIso();
    const byDate = {}; shifts.forEach(sh => { byDate[sh.date] = sh; });
    let offset = 0;
    el('sched-sub').textContent = me.role + ' · ' + branchName(d, me.branchId);
    const weekEl = el('week'), label = el('wk-label'), hours = el('wk-hours'), note = el('week-note');
    const btnPrev = el('wk-prev'), btnThis = el('wk-this'), btnNext = el('wk-next');

    function paintWeek() {
      const t = parseDay(today);
      const monday = addDays(t, -((t.getDay() + 6) % 7) + offset * 7);
      const days = []; for (let i = 0; i < 7; i++) days.push(isoLocal(addDays(monday, i)));
      label.textContent = fmtDay(days[0], { day: 'numeric', month: 'short' }) + ' – ' + fmtDay(days[6]);
      let total = 0, any = false;
      weekEl.innerHTML = days.map(iso => {
        const sh = byDate[iso]; if (sh) { total += shiftHours(sh); any = true; }
        const isToday = iso === today;
        return '<li class="day' + (isToday ? ' is-today' : '') + '"' + (isToday ? ' aria-current="date"' : '') + '>' +
          '<div class="day-name">' + esc(weekdayShort(iso)) + (isToday ? ' <span class="today-tag">Today</span>' : '') + '</div>' +
          '<div class="day-date">' + esc(fmtDay(iso, { day: 'numeric', month: 'short' })) + '</div>' +
          (sh ? '<div class="shift">' + esc(shiftRange(sh)) + '<small>' + esc(sh.role) + ' · ' + esc(fmtHours(shiftHours(sh))) + '</small></div>' : '<div class="off">Off</div>') + '</li>';
      }).join('');
      hours.textContent = fmtHours(total) + (offset === 0 ? ' this week' : ' that week');
      note.hidden = any;
      note.textContent = any ? '' : 'No shifts are rostered for this week.' + (shifts.length ? ' The roster on file runs ' + dateRange(shifts[0].date, shifts[shifts.length - 1].date) + '.' : '');
      btnThis.setAttribute('aria-pressed', String(offset === 0));
    }
    btnPrev.addEventListener('click', () => { offset -= 1; paintWeek(); });
    btnThis.addEventListener('click', () => { offset = 0; paintWeek(); });
    btnNext.addEventListener('click', () => { offset += 1; paintWeek(); });

    const swapShifts = el('swap-shifts'), mySwaps = el('my-swaps');
    function paintSwaps() {
      const m = S.currentUser();
      const reqs = (m.swapRequests || []).slice().sort((a, b) => cmp(b.requestedAt, a.requestedAt));
      const pending = {}; reqs.filter(r => r.status === 'pending').forEach(r => { pending[r.shiftDate] = true; });
      const upcoming = shifts.filter(sh => !shiftStarted(sh));
      swapShifts.innerHTML = upcoming.length ? upcoming.map(sh =>
        '<li><div class="grow"><strong>' + esc(weekdayShort(sh.date) + ' ' + fmtDay(sh.date)) + '</strong><div class="meta">' + esc(shiftRange(sh) + ' · ' + sh.role) + '</div></div><div class="actions">' +
        (pending[sh.date] ? '<span class="badge badge-warn">Swap requested</span>' : '<button class="btn btn-ghost btn-sm" type="button" data-swap="' + esc(sh.date) + '">Request swap</button>') + '</div></li>').join('')
        : emptyRow('No upcoming shifts to swap.');
      mySwaps.innerHTML = reqs.length ? reqs.map(r =>
        '<li><div class="grow"><strong>' + esc(weekdayShort(r.shiftDate) + ' ' + fmtDay(r.shiftDate)) + '</strong><div class="meta">' + (r.note ? esc(r.note) + ' · ' : '') + 'requested ' + esc(UI.fmtDate(r.requestedAt)) + '</div></div>' + statusBadge(r.status) + '</li>').join('')
        : emptyRow('No swap requests yet.');
    }
    swapShifts.addEventListener('click', async e => {
      const b = e.target.closest('[data-swap]'); if (!b) return;
      const date = b.getAttribute('data-swap'), sh = byDate[date]; if (!sh) return;
      const noteText = await UI.prompt({
        title: 'Request a swap', body: 'Shift: ' + weekdayShort(date) + ' ' + fmtDay(date) + ', ' + shiftRange(sh) + '. Your branch manager confirms cover before anything changes.',
        label: 'Note for your manager', placeholder: 'Who could cover, or why you need the swap', okLabel: 'Send request'
      });
      if (noteText === null) return;
      S.requestSwap(me.id, date, noteText);
      toast('Swap request sent for ' + fmtDay(date) + '.', 'ok');
      paintSwaps();
    });
    paintWeek(); paintSwaps();
  }

  /* ---------- leave ---------- */
  function renderLeave(me) {
    const TYPES = [['Annual', 'annual'], ['Sick', 'sick'], ['Casual', 'casual']];
    function balances(m) {
      const lv = m.leave || {};
      return TYPES.map(t => { const ent = Number(lv[t[1] + 'Entitled']) || 0, used = Number(lv[t[1] + 'Used']) || 0; return { label: t[0], ent, used, left: Math.max(0, ent - used) }; });
    }
    const bars = el('bars'), hist = el('leave-history');
    function paintBars() {
      bars.innerHTML = balances(S.currentUser()).map(b => {
        const pct = b.ent ? Math.min(100, Math.round(b.used / b.ent * 100)) : 0;
        return '<div class="bar"><div class="bar-head"><span><strong>' + esc(b.label) + '</strong> · ' + b.used + ' of ' + b.ent + ' days used</span><span class="num">' + esc(plural(b.left, 'day')) + ' left</span></div>' +
          '<div class="bar-track" role="img" aria-label="' + esc(b.label + ' leave: ' + b.used + ' of ' + b.ent + ' days used') + '"><div class="bar-fill' + (b.ent && b.left === 0 ? ' is-full' : '') + '" style="width:' + pct + '%"></div></div></div>';
      }).join('');
    }
    function paintHistory() {
      const reqs = (S.currentUser().leaveRequests || []).slice().sort((a, b) => cmp(b.requestedAt, a.requestedAt));
      hist.innerHTML = reqs.length
        ? '<div class="table-wrap"><table><thead><tr><th scope="col">Type</th><th scope="col">Dates</th><th scope="col" class="num">Days</th><th scope="col">Reason</th><th scope="col">Status</th></tr></thead><tbody>' +
          reqs.map(r => '<tr><td>' + esc(r.type) + '</td><td>' + esc(dateRange(r.from, r.to)) + '</td><td class="num">' + esc(plural(Number(r.days) || 0, 'day')) + '</td><td>' + (r.reason ? esc(r.reason) : '<span class="muted">—</span>') + '</td><td>' + statusBadge(r.status) + '</td></tr>').join('') +
          '</tbody></table></div>'
        : '<div class="empty">No leave requests yet.</div>';
    }

    const form = el('leave-form'), type = el('lv-type'), from = el('lv-from'), to = el('lv-to'), reason = el('lv-reason');
    const daysLine = el('lv-days'), warn = el('lv-warn'), err = el('lv-error');
    function remainingFor(label) { const b = balances(S.currentUser()).find(x => x.label === label); return b ? b.left : 0; }
    function preview() {
      err.hidden = true; from.removeAttribute('aria-invalid'); to.removeAttribute('aria-invalid');
      to.min = from.value || '';
      if (!from.value || !to.value || to.value < from.value) { daysLine.textContent = ''; warn.hidden = true; return; }
      const n = S.daysBetween(from.value, to.value), left = remainingFor(type.value);
      daysLine.textContent = plural(n, 'day') + ' requested · ' + plural(left, 'day') + ' of ' + type.value.toLowerCase() + ' leave left';
      if (n > left) { warn.textContent = 'This is ' + plural(n - left, 'day') + ' more than your remaining ' + type.value.toLowerCase() + ' leave. You can still send it; your manager decides.'; warn.hidden = false; }
      else warn.hidden = true;
    }
    [type, from, to].forEach(i => { i.addEventListener('input', preview); i.addEventListener('change', preview); });
    form.addEventListener('submit', e => {
      e.preventDefault(); err.hidden = true;
      from.removeAttribute('aria-invalid'); to.removeAttribute('aria-invalid');
      if (!from.value) return fail(err, 'Choose a start date.', from);
      if (!to.value) return fail(err, 'Choose an end date.', to);
      if (to.value < from.value) return fail(err, 'The end date must be on or after the start date.', to);
      const days = S.daysBetween(from.value, to.value);
      S.requestLeave(me.id, { type: type.value, from: from.value, to: to.value, days, reason: reason.value.trim().slice(0, 200) });
      toast('Leave request sent: ' + plural(days, 'day') + ' ' + type.value.toLowerCase() + ', ' + dateRange(from.value, to.value) + '.', 'ok');
      form.reset(); preview(); paintBars(); paintHistory();
    });
    paintBars(); paintHistory();
  }

  /* ---------- pay ---------- */
  function renderPay(me, d) {
    const slips = (me.payslips || []).slice().sort((a, b) => cmp(b.paidOn || b.to, a.paidOn || a.to));
    let selected = slips.length ? slips[0].id : null;
    const listEl = el('payslip-list'), slipEl = el('payslip');
    function paintList() {
      listEl.innerHTML = slips.length ? slips.map(p =>
        '<li><button class="payslip-item" type="button" data-slip="' + esc(p.id) + '" aria-pressed="' + (p.id === selected ? 'true' : 'false') + '">' +
        '<strong>' + esc(p.period) + '</strong><span class="meta">Paid ' + esc(fmtDay(p.paidOn)) + '</span><span class="amt num">' + esc(S.money(p.net)) + '</span></button></li>').join('')
        : '<li class="panel-body muted">No payslips yet.</li>';
    }
    function moneyTable(title, rows, totalLabel, total) {
      return '<table><thead><tr><th scope="col">' + esc(title) + '</th><th scope="col" class="num">Amount</th></tr></thead><tbody>' +
        ((rows || []).map(r => '<tr><td>' + esc(r.label) + '</td><td class="num">' + esc(S.money(r.amount)) + '</td></tr>').join('') || '<tr><td colspan="2" class="muted">None</td></tr>') +
        '</tbody><tfoot><tr><td>' + esc(totalLabel) + '</td><td class="num">' + esc(S.money(total)) + '</td></tr></tfoot></table>';
    }
    function paintSlip() {
      const p = slips.find(x => x.id === selected);
      if (!p) { slipEl.innerHTML = '<div class="empty">No payslips yet. Your first payslip appears here after the first pay run.</div>'; return; }
      const sum = rows => (rows || []).reduce((n, r) => n + (Number(r.amount) || 0), 0);
      const earn = sum(p.earnings), ded = sum(p.deductions);
      slipEl.innerHTML = '<article class="payslip" aria-labelledby="ps-title">' +
        '<div class="payslip-head"><div><p class="eyebrow">Payslip</p><h2 id="ps-title" class="payslip-title">' + esc(p.period) + '</h2><p class="muted small payslip-dates">' + esc(dateRange(p.from, p.to)) + ' · paid ' + esc(fmtDay(p.paidOn)) + '</p></div>' +
        '<div class="payslip-org">' + UI.MONO + '<div><strong>Southern Food Basket</strong><div class="small muted">Demo payslip, not a real document</div></div></div></div>' +
        '<dl class="kv payslip-kv"><dt>Name</dt><dd>' + esc(me.name) + '</dd><dt>Employee no.</dt><dd>' + esc(me.employeeNo) + '</dd><dt>Role</dt><dd>' + esc(me.role) + '</dd><dt>Branch</dt><dd>' + esc(branchName(d, me.branchId)) + '</dd></dl>' +
        '<div class="payslip-tables">' + moneyTable('Earnings', p.earnings, 'Total earnings', earn) + moneyTable('Deductions', p.deductions, 'Total deductions', ded) + '</div>' +
        '<div class="payslip-totals"><div><span>Gross pay</span><strong class="num">' + esc(S.money(p.gross)) + '</strong></div><div><span>Total deductions</span><strong class="num">' + esc(S.money(ded)) + '</strong></div>' +
        '<div class="payslip-net"><span>Net pay</span><strong class="net num">' + esc(S.money(p.net)) + '</strong></div></div>' +
        '<div class="cluster no-print payslip-actions"><button class="btn btn-ghost" type="button" id="print-slip">' + icon('file') + ' Print or save as PDF</button></div>' +
        '<p class="hint">Demo figures. Deductions are illustrative, not a statement of Trinidad and Tobago payroll rules.</p></article>';
      slipEl.querySelector('#print-slip').addEventListener('click', () => window.print());
    }
    listEl.addEventListener('click', e => {
      const b = e.target.closest('[data-slip]'); if (!b) return;
      selected = b.getAttribute('data-slip'); paintList(); paintSlip();
      const nb = listEl.querySelector('[data-slip="' + selected + '"]'); if (nb) nb.focus();
    });
    paintList(); paintSlip();
  }

  /* ---------- documents & training ---------- */
  function renderDocs(me, d) {
    const trList = el('training-list'), trCount = el('tr-count'), polList = el('policy-list'), docList = el('doc-list');
    const previews = {}; /* docId -> { url, name }; object URLs live only in this tab */

    function paintTraining() {
      const items = (S.currentUser().training || []).slice();
      const todo = items.filter(t => !t.done).length;
      trCount.textContent = todo ? plural(todo, 'course') + ' to do' : 'All done';
      trCount.className = 'badge ' + (todo ? 'badge-warn' : 'badge-ok');
      trList.innerHTML = items.length ? items.map(t => {
        let badge = '<span class="badge">To do</span>', meta = fmtMinutes(t.minutes);
        if (t.done) { badge = '<span class="badge badge-ok">Completed</span>'; if (t.completedAt) meta += ' · completed ' + fmtDay(t.completedAt); }
        else if (t.due) {
          const n = S.daysUntil(t.due); meta += ' · due ' + fmtDay(t.due);
          badge = n < 0 ? '<span class="badge badge-bad">Overdue</span>' : n <= 30 ? '<span class="badge badge-warn">Due ' + esc(inDays(n)) + '</span>' : badge;
        }
        return '<li><div class="grow"><strong>' + esc(t.name) + '</strong><div class="meta">' + esc(meta) + '</div></div><div class="actions">' + badge +
          '<button class="btn btn-sm ' + (t.done ? 'btn-ghost' : 'btn-primary') + '" type="button" data-training="' + esc(t.id) + '" data-done="' + (t.done ? '0' : '1') + '">' + (t.done ? 'Undo' : 'Mark complete') + '</button></div></li>';
      }).join('') : emptyRow('No training assigned.');
    }
    trList.addEventListener('click', e => {
      const b = e.target.closest('[data-training]'); if (!b) return;
      const id = b.getAttribute('data-training'), done = b.getAttribute('data-done') === '1';
      S.setTrainingDone(me.id, id, done);
      const t = (S.currentUser().training || []).find(x => x.id === id);
      toast((done ? 'Marked complete: ' : 'Marked as not done: ') + (t ? t.name : ''), 'ok');
      paintTraining();
      const nb = trList.querySelector('[data-training="' + id + '"]'); if (nb) nb.focus();
    });

    polList.innerHTML = (d.policies || []).map(p =>
      '<li><div class="grow"><strong>' + esc(p.title) + '</strong><div class="meta">Updated ' + esc(fmtDay(p.updated)) + '</div><p class="small ann-body">' + esc(p.summary) + '</p></div>' +
      '<div class="actions"><button class="btn btn-ghost btn-sm" type="button" aria-disabled="true" data-policy="' + esc(p.id) + '">Open</button></div></li>').join('') || emptyRow('No policies published.');
    polList.addEventListener('click', e => { if (e.target.closest('[data-policy]')) toast('Demo: policy documents are not included.'); });

    const UPLOADABLE = { missing: true, expired: true, expiring: true, flagged: true };
    function fmtFormats(list) { const f = (list || []).map(x => x.toUpperCase()); return f.length > 1 ? f.slice(0, -1).join(', ') + ' or ' + f[f.length - 1] : f.join(''); }
    function uploadControl(doc, st) {
      const id = 'exp-' + doc.id, accept = (doc.formats || []).map(f => '.' + f).join(',');
      const verb = st === 'missing' ? 'Upload' : st === 'flagged' ? 'Replace' : 'Upload renewal';
      return '<form class="doc-upload-form" data-doc="' + esc(doc.id) + '">' +
        (doc.expires ? '<div class="field"><label for="' + esc(id) + '">New expiry date</label><input type="date" id="' + esc(id) + '" name="expiry" min="' + todayIso() + '" required></div>' : '') +
        '<label class="btn btn-ghost btn-sm doc-upload">' + icon('upload') + ' ' + verb + '<input type="file" class="visually-hidden" name="file" accept="' + esc(accept) + '" data-doc="' + esc(doc.id) + '"></label></form>';
    }
    function paintDocs() {
      const comp = S.currentUser().compliance || [];
      docList.innerHTML = comp.length ? comp.map(c => {
        const doc = S.byId(d.kycDocs, c.docId) || { id: c.docId, name: c.docId, desc: '', formats: ['pdf', 'jpg', 'png'], expires: !!c.expiry };
        const st = UI.docDisplayState(c), bits = [];
        if (c.fileName) bits.push(esc(c.fileName) + (c.size ? ' · ' + esc(UI.fileSize(c.size)) : ''));
        if (c.expiry) { const n = S.daysUntil(c.expiry); bits.push((n < 0 ? 'Expired ' : 'Expires ') + esc(fmtDay(c.expiry)) + ' (' + esc(inDays(n)) + ')'); }
        if (c.updatedAt) bits.push('Updated ' + esc(UI.fmtDate(c.updatedAt)));
        const pv = previews[c.docId];
        return '<div class="doc-row">' +
          '<div class="doc-with-preview">' + (pv ? '<img class="doc-preview" src="' + esc(pv.url) + '" alt="Preview of ' + esc(pv.name) + '">' : '') +
          '<div><div class="doc-name">' + esc(doc.name) + '</div><div class="doc-desc">' + esc(doc.desc) + '</div>' + (bits.length ? '<div class="doc-file"><span>' + bits.join('</span><span>') + '</span></div>' : '') + '</div></div>' +
          '<div>' + UI.docBadge(st) + '</div>' +
          '<div class="doc-actions">' + (UPLOADABLE[st] ? uploadControl(doc, st) : '') + '</div>' +
          (st === 'flagged' && c.reason ? '<div class="doc-reason">' + esc(c.reason) + '</div>' : '') + '</div>';
      }).join('') : '<div class="empty">No documents on file.</div>';
    }
    docList.addEventListener('submit', e => e.preventDefault());
    docList.addEventListener('change', e => {
      const input = e.target;
      if (!input || input.type !== 'file') return;
      const file = input.files && input.files[0]; if (!file) return;
      const docId = input.getAttribute('data-doc');
      const doc = S.byId(d.kycDocs, docId) || { name: docId, formats: ['pdf', 'jpg', 'png'] };
      const form = input.closest('form'), expInput = form ? form.querySelector('input[type="date"]') : null;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const okExt = (doc.formats || []).some(f => f === ext || (f === 'jpg' && ext === 'jpeg'));
      const okType = !file.type || /^(application\/pdf|image\/(jpeg|png))$/.test(file.type);
      if (!okExt || !okType) { toast('That file type is not accepted. Use ' + fmtFormats(doc.formats) + '.', 'bad'); input.value = ''; return; }
      if (file.size > MAX_UPLOAD) { toast('That file is ' + UI.fileSize(file.size) + '. The limit is 8 MB.', 'bad'); input.value = ''; return; }
      if (expInput) {
        expInput.removeAttribute('aria-invalid');
        if (!expInput.value) { toast('Enter the new expiry date first.', 'bad'); expInput.setAttribute('aria-invalid', 'true'); expInput.focus(); input.value = ''; return; }
        if (expInput.value <= todayIso()) { toast('The new expiry date must be after today.', 'bad'); expInput.setAttribute('aria-invalid', 'true'); expInput.focus(); input.value = ''; return; }
      }
      if (previews[docId]) { try { URL.revokeObjectURL(previews[docId].url); } catch (x) {} delete previews[docId]; }
      if (/^image\//.test(file.type)) previews[docId] = { url: URL.createObjectURL(file), name: file.name };
      const extra = { fileName: file.name, size: file.size, type: file.type || 'application/octet-stream' };
      if (expInput) extra.expiry = expInput.value;
      S.setEmployeeDoc(me.id, docId, 'uploaded', extra); /* metadata only; the file itself stays in this tab */
      toast(doc.name + ' uploaded. HR will review it.', 'ok');
      paintDocs();
    });
    paintTraining(); paintDocs();
  }

  /* ---------- profile ---------- */
  function renderProfile(me, d) {
    const details = el('details'), bank = el('bank'), idDocs = el('id-docs');
    function kv(pairs) { return pairs.map(p => '<dt>' + esc(p[0]) + '</dt><dd>' + (p[1] ? esc(p[1]) : '<span class="muted">Not recorded</span>') + '</dd>').join(''); }
    function service(start) {
      if (!isDay(start)) return '';
      const s = parseDay(start), n = new Date();
      let months = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
      if (n.getDate() < s.getDate()) months -= 1;
      if (months < 1) return 'less than a month of service';
      const y = Math.floor(months / 12), mo = months % 12;
      if (y < 1) return plural(mo, 'month') + ' of service';
      return plural(y, 'year') + (mo ? ' ' + plural(mo, 'month') : '') + ' of service';
    }
    function paintDetails() {
      const m = S.currentUser();
      details.innerHTML = kv([
        ['Name', m.name], ['Employee number', m.employeeNo], ['Role', m.role], ['Department', m.dept], ['Branch', branchName(d, m.branchId)],
        ['Start date', m.startDate ? fmtDay(m.startDate) + ' · ' + service(m.startDate) : ''], ['Email', m.email], ['Phone', m.phone], ['Address', m.address]
      ]);
      bank.innerHTML = kv([['Bank', m.bank && m.bank.bank], ['Account', m.bank && m.bank.masked]]);
      const comp = m.compliance || [];
      idDocs.innerHTML = comp.length ? comp.map(c => {
        const n = c.expiry ? S.daysUntil(c.expiry) : null;
        return '<li><div class="grow"><strong>' + esc(docName(d, c.docId)) + '</strong>' + (c.expiry ? '<div class="meta">' + (n < 0 ? 'Expired ' : 'Expires ') + esc(fmtDay(c.expiry)) + '</div>' : '') + '</div>' + UI.docBadge(UI.docDisplayState(c)) + '</li>';
      }).join('') : emptyRow('No documents on file.');
    }
    const form = el('em-form'), name = el('em-name'), rel = el('em-relation'), phone = el('em-phone'), err = el('em-error');
    function fillForm() { const em = S.currentUser().emergency || {}; name.value = em.name || ''; rel.value = em.relation || ''; phone.value = em.phone || ''; }
    form.addEventListener('submit', e => {
      e.preventDefault(); err.hidden = true;
      [name, rel, phone].forEach(i => i.removeAttribute('aria-invalid'));
      const v = { name: name.value.trim(), relation: rel.value.trim(), phone: phone.value.trim() };
      if (!v.name) return fail(err, 'Enter the contact’s name.', name);
      if (!v.phone) return fail(err, 'Enter a phone number.', phone);
      if (!/^[\d\s()+\-]{7,30}$/.test(v.phone)) return fail(err, 'Enter a phone number using digits, spaces, brackets, + or -.', phone);
      S.updateEmployee(me.id, emp => { emp.emergency = v; });
      toast('Emergency contact saved.', 'ok');
      fillForm(); paintDetails();
    });
    el('signout').addEventListener('click', () => { S.logout(); location.href = UI.href('portal/index.html'); });
    paintDetails(); fillForm();
  }

  /* ---------- boot: ui.js registered its DOMContentLoaded first, so the shell exists before we paint ---------- */
  const PAGES = { home: renderHome, schedule: renderSchedule, leave: renderLeave, pay: renderPay, docs: renderDocs, profile: renderProfile };
  function init() {
    if (page === 'login') { renderLogin(); return; }
    const me = S.currentUser();
    if (!me) { S.logout(); location.replace(UI.href('portal/index.html')); return; }
    fillIcons(document);
    const fn = PAGES[page];
    if (fn) fn(me, S.load());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
