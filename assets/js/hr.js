/* Southern Food Basket — HR console: pipeline board + applicant drawer, roles table, compliance.
   Role: hr (SFBStore.requireRole). Everything renders from SFBStore after each action.
   Documents are metadata only (name, size, type, state, dates); no file bytes are ever shown or stored. */
(function () {
  const U = window.SFBUI, S = window.SFBStore;
  const esc = U.esc, icon = U.icon;
  const session = S.requireRole(['hr']); if (!session) return;

  const MAIN_STAGES = ['submitted', 'screening', 'kyc', 'interview', 'offer', 'hired'];
  const CLOSED_STAGES = ['not-selected', 'withdrawn'];
  const TABS = ['pipeline', 'roles', 'compliance'];
  const isActive = a => !['hired', 'not-selected', 'withdrawn'].includes(a.stage);

  /* ---------- helpers ---------- */
  function branchName(d, id) { const b = S.byId(d.branches, id); return b ? b.name : ''; }
  function fmtDay(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? U.fmtDate(v + 'T12:00:00') : U.fmtDate(v); }
  function payBand(job) {
    if (!job || !job.payBand) return '';
    const a = S.money(job.payBand[0]);
    const b = S.money(job.payBand[1]).replace(/^[A-Z]{3}\s/, '');
    return (a + ' – ' + b).replace(/\.00\b/g, '') + ' / ' + job.payUnit;
  }
  function hrName() { const u = S.currentUser(); return (u && u.name) || 'HR'; }
  function jobLine(d, a) { const j = S.byId(d.jobs, a.jobId); return j ? j.title + ' · ' + branchName(d, j.branchId) : 'Role removed'; }
  function dotClass(state) {
    if (state === 'verified') return 'ok';
    if (state === 'uploaded' || state === 'expiring') return 'warn';
    if (state === 'flagged' || state === 'expired') return 'bad';
    return '';
  }
  function fileMetaHtml(m) {
    if (!m || !m.fileName) return '';
    const bits = ['<span>' + esc(m.fileName) + '</span>'];
    if (m.size != null) bits.push('<span>' + esc(U.fileSize(m.size)) + '</span>');
    if (m.expiry) bits.push('<span>Expires ' + fmtDay(m.expiry) + '</span>');
    if (m.updatedAt) bits.push('<span>Updated ' + U.fmtDateTime(m.updatedAt) + '</span>');
    return '<div class="doc-file">' + bits.join('<span aria-hidden="true">·</span>') + '</div>';
  }
  function thumbHtml(m) {
    if (!m || !m.fileName) return '';
    return '<span class="doc-ph" aria-hidden="true">' + icon('file') + '</span>';
  }
  function daysLabel(dateStr) {
    const n = S.daysUntil(dateStr);
    if (n == null) return '';
    if (n < 0) return Math.abs(n) + (n === -1 ? ' day ago' : ' days ago');
    if (n === 0) return 'today';
    return 'in ' + n + (n === 1 ? ' day' : ' days');
  }

  /* ---------- state ---------- */
  let roleFilter = 'all', search = '';
  let openId = null, drawerTab = 'details', actionForm = null, lastFocus = null;

  const el = {
    stats: document.getElementById('hr-stats'),
    tabs: document.getElementById('hr-tabs'),
    board: document.getElementById('board'),
    pipeRole: document.getElementById('pipe-role'),
    pipeSearch: document.getElementById('pipe-search'),
    pipeCount: document.getElementById('pipe-count'),
    rolesBody: document.getElementById('roles-body'),
    compDocs: document.getElementById('comp-docs'), compDocsCount: document.getElementById('comp-docs-count'),
    compTrain: document.getElementById('comp-train'), compTrainCount: document.getElementById('comp-train-count'),
    compLeave: document.getElementById('comp-leave'), compLeaveCount: document.getElementById('comp-leave-count'),
    drawer: document.getElementById('drawer'),
    backdrop: document.getElementById('drawer-backdrop')
  };

  /* ---------- tabs (#pipeline, #roles, #compliance) ---------- */
  function currentTab() { const h = location.hash.replace('#', ''); return TABS.includes(h) ? h : 'pipeline'; }
  function showTab(id) {
    TABS.forEach(t => {
      const sec = document.getElementById(t); if (sec) sec.hidden = t !== id;
      const btn = el.tabs.querySelector('[data-tab="' + t + '"]');
      if (btn) { btn.setAttribute('aria-selected', String(t === id)); btn.tabIndex = t === id ? 0 : -1; }
    });
    document.querySelectorAll('.app-nav a').forEach(a => {
      const h = (a.getAttribute('href') || '').split('#')[1];
      if (!h || !TABS.includes(h)) return;
      if (h === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  el.tabs.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]'); if (!btn) return;
    const id = btn.getAttribute('data-tab');
    if (currentTab() === id) showTab(id); else location.hash = id;
  });
  el.tabs.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.indexOf(currentTab()); const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    location.hash = n; const b = el.tabs.querySelector('[data-tab="' + n + '"]'); if (b) b.focus();
  });
  window.addEventListener('hashchange', () => showTab(currentTab()));

  /* ---------- compliance data (also feeds the stats) ---------- */
  function complianceRows(d) {
    const docs = [], training = [], leave = [];
    (d.employees || []).forEach(e => {
      (e.compliance || []).forEach(c => {
        const state = U.docDisplayState(c);
        if (['expired', 'expiring', 'missing', 'uploaded', 'flagged'].includes(state)) docs.push({ e, c, state, doc: S.byId(d.kycDocs, c.docId) });
      });
      (e.training || []).forEach(t => {
        if (t.done || !t.due) return;
        const n = S.daysUntil(t.due);
        if (n != null && n <= 30) training.push({ e, t, days: n });
      });
      (e.leaveRequests || []).forEach(r => { if (r.status === 'pending') leave.push({ e, r }); });
    });
    docs.sort((x, y) => (['expired', 'flagged', 'missing', 'uploaded', 'expiring'].indexOf(x.state)) - (['expired', 'flagged', 'missing', 'uploaded', 'expiring'].indexOf(y.state)));
    training.sort((x, y) => x.days - y.days);
    return { docs, training, leave, total: docs.length + training.length + leave.length };
  }

  /* ---------- stats ---------- */
  function renderStats() {
    const d = S.load();
    const active = d.applicants.filter(isActive);
    const weekAgo = Date.now() - 7 * 86400000;
    const thisWeek = d.applicants.filter(a => new Date(a.submittedAt).getTime() >= weekAgo).length;
    const awaiting = active.reduce((n, a) => n + Object.keys(a.docs || {}).filter(k => a.docs[k] && a.docs[k].state === 'uploaded').length, 0);
    const comp = complianceRows(d);
    const stat = (label, value, sub) => '<div class="stat"><div class="stat-label">' + esc(label) + '</div><div class="stat-value">' + esc(String(value)) + '</div>' + (sub ? '<div class="stat-sub">' + esc(sub) + '</div>' : '') + '</div>';
    el.stats.innerHTML =
      stat('Open roles', d.jobs.filter(j => j.status === 'open').length, d.jobs.length + ' in total') +
      stat('Active applicants', active.length, 'not hired, declined or withdrawn') +
      stat('New this week', thisWeek, 'submitted in the last 7 days') +
      stat('Documents to review', awaiting, 'uploaded, awaiting a decision') +
      stat('Compliance alerts', comp.total, comp.docs.length + ' docs · ' + comp.training.length + ' training · ' + comp.leave.length + ' leave');
  }

  /* ---------- pipeline board ---------- */
  function renderRoleFilter() {
    const d = S.load();
    const open = d.jobs.filter(j => j.status === 'open');
    const keep = roleFilter;
    el.pipeRole.innerHTML = '<option value="all">All open roles</option>' + open.map(j => '<option value="' + esc(j.id) + '">' + esc(j.title + ' · ' + branchName(d, j.branchId)) + '</option>').join('');
    el.pipeRole.value = open.some(j => j.id === keep) ? keep : 'all';
    roleFilter = el.pipeRole.value;
  }
  function cardHtml(d, a) {
    const req = S.requiredDocsFor(a);
    const counts = { ok: 0, warn: 0, bad: 0, none: 0 };
    const dots = req.map(doc => {
      const st = U.docDisplayState((a.docs || {})[doc.id]); const cls = dotClass(st);
      counts[cls || 'none']++;
      return '<span class="docdot ' + cls + '" title="' + esc(doc.name + ': ' + (U.DOC_STATE[st] || U.DOC_STATE.missing).label) + '"></span>';
    }).join('');
    const summary = counts.ok + ' verified, ' + counts.warn + ' awaiting review, ' + counts.bad + ' need attention, ' + counts.none + ' not provided';
    return '<button type="button" class="board-card" data-app-id="' + esc(a.id) + '" aria-haspopup="dialog">' +
      '<strong>' + esc(a.name) + '</strong>' +
      '<span class="meta">' + esc(jobLine(d, a)) + '</span>' +
      '<span class="meta">Submitted ' + fmtDay(a.submittedAt) + (CLOSED_STAGES.includes(a.stage) ? ' · ' + esc(S.stageLabel(a.stage)) : '') + '</span>' +
      '<span class="docs" aria-hidden="true">' + dots + '</span><span class="visually-hidden">Documents: ' + esc(summary) + '</span>' +
      '</button>';
  }
  function renderBoard() {
    const d = S.load();
    let apps = d.applicants.filter(a => roleFilter === 'all' || a.jobId === roleFilter);
    const q = search.trim().toLowerCase();
    if (q) apps = apps.filter(a => (a.name || '').toLowerCase().includes(q));
    apps = apps.slice().sort((x, y) => (y.submittedAt || '').localeCompare(x.submittedAt || ''));
    const cols = MAIN_STAGES.map(id => ({ id, label: S.stageLabel(id), items: apps.filter(a => a.stage === id) }))
      .concat([{ id: 'closed', label: 'Closed', items: apps.filter(a => CLOSED_STAGES.includes(a.stage)) }]);
    el.board.innerHTML = cols.map(c =>
      '<section class="board-col" aria-labelledby="col-' + esc(c.id) + '"><div class="board-col-head"><span id="col-' + esc(c.id) + '">' + esc(c.label) + '</span><span class="count" aria-label="' + c.items.length + ' applicants">' + c.items.length + '</span></div>' +
      (c.items.length ? c.items.map(a => cardHtml(d, a)).join('') : '<p class="board-empty">No one here.</p>') + '</section>').join('');
    el.pipeCount.textContent = apps.length + (apps.length === 1 ? ' applicant' : ' applicants') + (q || roleFilter !== 'all' ? ' match' : '');
  }
  el.board.addEventListener('click', e => {
    const card = e.target.closest('.board-card'); if (!card) return;
    openDrawer(card.getAttribute('data-app-id'), card);
  });
  el.pipeRole.addEventListener('change', () => { roleFilter = el.pipeRole.value; renderBoard(); });
  el.pipeSearch.addEventListener('input', () => { search = el.pipeSearch.value; renderBoard(); });

  /* ---------- drawer ---------- */
  function openDrawer(id, fromEl) {
    openId = id; drawerTab = 'details'; actionForm = null; lastFocus = fromEl || document.activeElement;
    renderDrawer();
    el.drawer.classList.add('is-open'); el.backdrop.classList.add('is-open');
    el.drawer.removeAttribute('aria-hidden'); el.drawer.inert = false; el.drawer.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    const close = el.drawer.querySelector('#drawer-close'); if (close) close.focus();
  }
  function closeDrawer() {
    el.drawer.classList.remove('is-open'); el.backdrop.classList.remove('is-open');
    el.drawer.setAttribute('aria-hidden', 'true'); el.drawer.inert = true; el.drawer.setAttribute('inert', '');
    document.body.style.overflow = '';
    const back = (openId && document.querySelector('.board-card[data-app-id="' + openId + '"]')) || lastFocus;
    openId = null; actionForm = null;
    if (back && typeof back.focus === 'function') back.focus();
  }
  el.backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !openId) return;
    if (document.querySelector('dialog[open]')) return; /* let the confirm/prompt dialog take it */
    e.preventDefault(); closeDrawer();
  });
  /* loose focus trap: Tab wraps inside the drawer while it is open */
  el.drawer.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = Array.from(el.drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(x => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function drawerTabs(a) {
    const tabs = [['details', 'Details'], ['documents', 'Documents'], ['notes', 'Notes' + ((a.notes || []).length ? ' (' + a.notes.length + ')' : '')], ['messages', 'Messages' + ((a.messages || []).length ? ' (' + a.messages.length + ')' : '')], ['timeline', 'Timeline']];
    return '<div class="tabs" role="tablist" aria-label="Applicant sections">' + tabs.map(([id, label]) =>
      '<button type="button" role="tab" id="dtab-' + id + '" data-dtab="' + id + '" aria-selected="' + (drawerTab === id) + '" aria-controls="dpanel-' + id + '"' + (drawerTab === id ? '' : ' tabindex="-1"') + '>' + esc(label) + '</button>').join('') + '</div>';
  }
  function detailsHtml(d, a) {
    const p = a.personal || {}, x = a.experience || {};
    return '<dl class="kv">' +
      '<dt>Email</dt><dd><a href="mailto:' + esc(encodeURIComponent(a.email)) + '">' + esc(a.email) + '</a></dd>' +
      '<dt>Phone</dt><dd>' + esc(a.phone) + '</dd>' +
      '<dt>Address</dt><dd>' + esc(p.address || '') + '</dd>' +
      '<dt>Date of birth</dt><dd>' + (p.dob ? fmtDay(p.dob) : '<span class="muted">Not given</span>') + '</dd>' +
      '<dt>Right to work</dt><dd>' + (p.nonNational ? '<span class="badge badge-warn">Work permit required</span>' : 'National of Trinidad and Tobago or CARICOM skills certificate') + '</dd>' +
      '<dt>Availability</dt><dd>' + esc((x.availability || []).join(', ') || '—') + '</dd>' +
      '<dt>Earliest start</dt><dd>' + (x.startDate ? fmtDay(x.startDate) : '—') + '</dd>' +
      '<dt>Applied</dt><dd>' + U.fmtDateTime(a.submittedAt) + '</dd>' +
      '</dl>' +
      '<h3 style="font-size:1rem;margin:var(--s5) 0 var(--s2)">Experience</h3><p class="summary-text" style="font-size:.9375rem">' + esc(x.summary || '—') + '</p>' +
      (a.interview ? '<h3 style="font-size:1rem;margin:var(--s5) 0 var(--s2)">Interview</h3><dl class="kv"><dt>When</dt><dd>' + U.fmtDateTime(a.interview.at) + '</dd><dt>Where</dt><dd>' + esc(a.interview.where) + '</dd><dt>With</dt><dd>' + esc(a.interview.with) + '</dd></dl>' : '') +
      (a.offer ? '<h3 style="font-size:1rem;margin:var(--s5) 0 var(--s2)">Offer</h3><dl class="kv"><dt>Pay</dt><dd>' + esc(S.money(a.offer.pay, a.offer.payUnit)) + '</dd><dt>Start</dt><dd>' + fmtDay(a.offer.startDate) + '</dd><dt>Status</dt><dd>' + esc(a.offer.status === 'accepted' ? 'Accepted' : a.offer.status === 'declined' ? 'Declined' : 'Sent, awaiting reply') + (a.offer.sentAt ? ' · sent ' + U.fmtDateTime(a.offer.sentAt) : '') + '</dd></dl>' : '');
  }
  function documentsHtml(d, a) {
    const req = S.requiredDocsFor(a);
    if (!req.length) return '<p class="muted">No documents are required for this role.</p>';
    return '<div class="doc-list">' + req.map(doc => {
      const m = (a.docs || {})[doc.id]; const state = U.docDisplayState(m); const has = !!(m && m.fileName);
      const raw = (m && m.state) || 'missing'; /* actions key off the stored state; the badge shows the derived one */
      const actions = [];
      if (has && raw !== 'verified') actions.push('<button class="btn btn-primary btn-sm" type="button" data-verify="' + esc(doc.id) + '">Verify</button>');
      if (has && raw !== 'flagged') actions.push('<button class="btn btn-ghost btn-sm" type="button" data-flag="' + esc(doc.id) + '">Flag</button>');
      return '<div class="doc-row" data-doc="' + esc(doc.id) + '">' +
        '<div class="doc-main">' + thumbHtml(m) + '<div class="doc-text"><div class="doc-name">' + esc(doc.name) + '</div><div class="doc-desc">' + esc(doc.desc) + '</div>' + fileMetaHtml(m) +
        (!has ? '<div class="doc-file">Not provided yet.</div>' : '') + '</div></div>' +
        U.docBadge(state) +
        '<div class="doc-actions">' + actions.join('') + '</div>' +
        (state === 'flagged' && m && m.reason ? '<div class="doc-reason">' + esc(m.reason) + '</div>' : '') +
        (state === 'expired' ? '<div class="doc-reason">Expired ' + fmtDay(m.expiry) + '. Ask for a current copy.</div>' : '') +
        (state === 'expiring' ? '<div class="doc-reason" style="background:var(--warn-bg);color:var(--warn)">Expires ' + fmtDay(m.expiry) + ' (' + esc(daysLabel(m.expiry)) + ').</div>' : '') +
        '</div>';
    }).join('') + '</div><p class="hint" style="margin-top:var(--s3)">Metadata only: file names, sizes and dates. This demo never stores or shows file contents.</p>';
  }
  function notesHtml(a) {
    const notes = (a.notes || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''));
    return (notes.length ? '<ul class="list" style="border:1px solid var(--line);border-radius:var(--r)">' + notes.map(n => '<li><div class="grow"><strong>' + esc(n.author || 'HR') + '</strong><div class="meta">' + U.fmtDateTime(n.at) + '</div><p style="margin:6px 0 0;font-size:.9375rem" class="summary-text">' + esc(n.text) + '</p></div></li>').join('') + '</ul>' : '<p class="muted">No internal notes yet.</p>') +
      '<form class="composer" id="note-form"><label for="note-text">Add a note (internal, not shown to the applicant)</label><textarea id="note-text" required></textarea><div class="actions"><button class="btn btn-primary btn-sm" type="submit">Add note</button></div></form>';
  }
  function messagesHtml(a) {
    const msgs = (a.messages || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''));
    return (msgs.length ? '<ul class="list" style="border:1px solid var(--line);border-radius:var(--r)">' + msgs.map(m => '<li><div class="grow"><strong>' + esc(m.from || 'HR') + '</strong><div class="meta">' + U.fmtDateTime(m.at) + '</div><p style="margin:6px 0 0;font-size:.9375rem" class="summary-text">' + esc(m.text) + '</p></div></li>').join('') + '</ul>' : '<p class="muted">No messages yet.</p>') +
      '<form class="composer" id="msg-form"><label for="msg-text">Message to ' + esc(a.name.split(' ')[0]) + ' (shown in their dashboard)</label><textarea id="msg-text" required></textarea><div class="actions"><button class="btn btn-primary btn-sm" type="submit">Send message</button></div></form>';
  }
  function timelineHtml(a) {
    const tl = (a.timeline || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''));
    return tl.length ? '<ol class="timeline">' + tl.map(t => '<li><time datetime="' + esc(t.at) + '">' + U.fmtDateTime(t.at) + '</time>' + esc(t.text) + '</li>').join('') + '</ol>' : '<p class="muted">Nothing yet.</p>';
  }
  function actionFormHtml(d, a, job) {
    if (actionForm === 'interview') {
      const iv = a.interview || {};
      return '<form class="drawer-action" id="action-form"><h3>Schedule interview</h3>' +
        '<div class="field"><label for="iv-at">Date and time</label><input type="datetime-local" id="iv-at" value="' + esc((iv.at || '').slice(0, 16)) + '" required></div>' +
        '<div class="form-row"><div class="field"><label for="iv-where">Where</label><input type="text" id="iv-where" value="' + esc(iv.where || (job ? branchName(d, job.branchId) + ' branch' : '')) + '" required></div>' +
        '<div class="field"><label for="iv-with">With</label><input type="text" id="iv-with" value="' + esc(iv.with || hrName()) + '" required></div></div>' +
        '<p class="hint" style="margin-top:0">Saving moves the applicant to Interview and sends them a message with these details.</p>' +
        '<div class="actions"><button class="btn btn-primary btn-sm" type="submit">Save interview</button><button class="btn btn-ghost btn-sm" type="button" data-cancel-action>Cancel</button></div></form>';
    }
    if (actionForm === 'offer') {
      const o = a.offer || {};
      const unit = o.payUnit || (job && job.payUnit) || 'month';
      return '<form class="drawer-action" id="action-form"><h3>Send offer</h3>' +
        '<div class="form-row"><div class="field"><label for="of-pay">Pay (TTD)</label><input type="number" id="of-pay" min="0" step="0.01" value="' + esc(o.pay != null ? o.pay : (job ? job.payBand[0] : '')) + '" required></div>' +
        '<div class="field"><label for="of-unit">Per</label><select id="of-unit"><option value="month"' + (unit === 'month' ? ' selected' : '') + '>Month</option><option value="hour"' + (unit === 'hour' ? ' selected' : '') + '>Hour</option></select></div></div>' +
        '<div class="field"><label for="of-start">Start date</label><input type="date" id="of-start" value="' + esc(o.startDate || (a.experience && a.experience.startDate) || '') + '" required></div>' +
        (job ? '<p class="hint" style="margin-top:0">Band for this role: ' + esc(payBand(job)) + '. Saving moves the applicant to Offer and messages them.</p>' : '') +
        '<div class="actions"><button class="btn btn-primary btn-sm" type="submit">Send offer</button><button class="btn btn-ghost btn-sm" type="button" data-cancel-action>Cancel</button></div></form>';
    }
    return '';
  }
  function renderDrawer(focusId) {
    const d = S.load();
    const a = S.byId(d.applicants, openId);
    if (!a) { closeDrawer(); return; }
    const job = S.byId(d.jobs, a.jobId);
    const closed = CLOSED_STAGES.includes(a.stage);
    const panel = drawerTab === 'details' ? detailsHtml(d, a) : drawerTab === 'documents' ? documentsHtml(d, a) : drawerTab === 'notes' ? notesHtml(a) : drawerTab === 'messages' ? messagesHtml(a) : timelineHtml(a);
    const stageOptions = (d.stages || []).map(s => '<option value="' + esc(s.id) + '"' + (s.id === a.stage ? ' selected' : '') + '>' + esc(s.label) + '</option>').join('');
    el.drawer.innerHTML =
      '<div class="drawer-head"><div><h2 id="drawer-title">' + esc(a.name) + '</h2><p class="who">' + esc(jobLine(d, a)) + '</p><div class="badge-row">' + U.stageBadge(a.stage) + (a.personal && a.personal.nonNational ? '<span class="badge badge-warn">Work permit</span>' : '') + '</div></div>' +
      '<button class="icon-btn" type="button" id="drawer-close" aria-label="Close applicant details">' + icon('close') + '</button></div>' +
      '<div class="drawer-body">' + actionFormHtml(d, a, job) + drawerTabs(a) + '<div role="tabpanel" id="dpanel-' + esc(drawerTab) + '" aria-labelledby="dtab-' + esc(drawerTab) + '">' + panel + '</div></div>' +
      '<div class="drawer-foot">' +
        '<label class="visually-hidden" for="move-stage">Move to stage</label><select id="move-stage" aria-label="Move to stage">' + stageOptions + '</select>' +
        (!closed && a.stage !== 'hired' ? '<button class="btn btn-ghost btn-sm" type="button" data-action="interview">' + icon('calendar') + ' Schedule interview</button>' : '') +
        (!closed && (a.stage === 'interview' || a.stage === 'offer') ? '<button class="btn btn-primary btn-sm" type="button" data-action="offer">' + icon('check') + ' ' + (a.offer ? 'Resend offer' : 'Send offer') + '</button>' : '') +
        (!closed && a.stage !== 'hired' ? '<button class="btn btn-danger btn-sm" type="button" data-action="not-selected">Not selected</button>' : '') +
      '</div>';
    wireDrawer(d, a, job);
    /* keep focus inside the drawer after a re-render: the requested control, else the active tab */
    const target = el.drawer.querySelector('#' + (focusId || 'dtab-' + drawerTab));
    if (target) target.focus();
  }
  function wireDrawer(d, a, job) {
    el.drawer.querySelector('#drawer-close').addEventListener('click', closeDrawer);
    el.drawer.querySelectorAll('[data-dtab]').forEach(b => b.addEventListener('click', () => { drawerTab = b.getAttribute('data-dtab'); renderDrawer('dtab-' + drawerTab); }));
    const tablist = el.drawer.querySelector('[role="tablist"]');
    tablist.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const ids = ['details', 'documents', 'notes', 'messages', 'timeline']; const i = ids.indexOf(drawerTab);
      drawerTab = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]; renderDrawer('dtab-' + drawerTab);
    });

    /* documents */
    el.drawer.querySelectorAll('[data-verify]').forEach(b => b.addEventListener('click', () => {
      const docId = b.getAttribute('data-verify');
      S.setDocState(a.id, docId, 'verified', { reason: undefined });
      U.toast(docName(d, docId) + ' verified', 'ok'); refresh();
    }));
    el.drawer.querySelectorAll('[data-flag]').forEach(b => b.addEventListener('click', async () => {
      const docId = b.getAttribute('data-flag');
      const reason = await U.prompt({ title: 'Flag ' + docName(d, docId), body: 'The reason is shown to the applicant so they know what to fix.', label: 'Reason', placeholder: 'For example: the bill is older than three months. Please upload a recent one.', okLabel: 'Flag document' });
      if (reason == null) return;
      if (!reason) { U.toast('Add a reason so the applicant knows what to fix.', 'bad'); return; }
      S.setDocState(a.id, docId, 'flagged', { reason });
      S.addMessage(a.id, docName(d, docId) + ': ' + reason, 'HR');
      U.toast(docName(d, docId) + ' flagged'); refresh();
    }));

    /* notes + messages */
    const noteForm = el.drawer.querySelector('#note-form');
    if (noteForm) noteForm.addEventListener('submit', e => {
      e.preventDefault(); const ta = noteForm.querySelector('textarea'); const text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      S.addNote(a.id, text, hrName()); U.toast('Note added', 'ok'); renderDrawer('note-text');
    });
    const msgForm = el.drawer.querySelector('#msg-form');
    if (msgForm) msgForm.addEventListener('submit', e => {
      e.preventDefault(); const ta = msgForm.querySelector('textarea'); const text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      S.addMessage(a.id, text, 'HR'); U.toast('Message sent to ' + a.name.split(' ')[0], 'ok'); renderDrawer('msg-text');
    });

    /* foot actions */
    el.drawer.querySelector('#move-stage').addEventListener('change', e => {
      const stage = e.target.value; if (!stage || stage === a.stage) return;
      S.setStage(a.id, stage, 'by ' + hrName());
      U.toast(a.name + ' moved to ' + S.stageLabel(stage), 'ok'); refresh('move-stage');
    });
    el.drawer.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', async () => {
      const act = b.getAttribute('data-action');
      if (act === 'interview' || act === 'offer') { actionForm = act; renderDrawer(act === 'interview' ? 'iv-at' : 'of-pay'); return; }
      if (act === 'not-selected') {
        const reason = await U.prompt({ title: 'Mark ' + a.name + ' as not selected', body: 'The reason goes into the timeline and the message to the applicant. Keep it short and kind.', label: 'Reason', placeholder: 'For example: the role has been filled.', okLabel: 'Confirm' });
        if (reason == null) return;
        S.setStage(a.id, 'not-selected', reason || 'no reason given');
        S.addMessage(a.id, 'Thank you for applying for ' + (job ? job.title : 'this role') + '. We have not taken your application further' + (reason ? ': ' + reason : '.') + (reason && !/[.!?]$/.test(reason) ? '.' : '') + ' We will keep your details on file for six months.', 'HR');
        U.toast(a.name + ' marked not selected'); refresh();
      }
    }));
    const cancel = el.drawer.querySelector('[data-cancel-action]');
    if (cancel) cancel.addEventListener('click', () => { actionForm = null; renderDrawer('drawer-close'); });
    const form = el.drawer.querySelector('#action-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      if (actionForm === 'interview') {
        const at = form.querySelector('#iv-at').value, where = form.querySelector('#iv-where').value.trim(), who = form.querySelector('#iv-with').value.trim();
        if (!at || !where || !who) { U.toast('Fill in the date, place and interviewer.', 'bad'); return; }
        S.updateApplicant(a.id, { interview: { at, where, with: who } });
        if (a.stage !== 'interview') S.setStage(a.id, 'interview', 'Interview scheduled for ' + U.fmtDateTime(at));
        else S.update(dd => { const ap = S.byId(dd.applicants, a.id); if (ap) ap.timeline.push({ at: S.nowIso(), text: 'Interview rescheduled for ' + U.fmtDateTime(at) }); });
        S.addMessage(a.id, 'Hi ' + a.name.split(' ')[0] + ', your interview is on ' + U.fmtDateTime(at) + ' at ' + where + ' with ' + who + '. Bring your original documents.', 'HR');
        actionForm = null; U.toast('Interview scheduled and applicant messaged', 'ok'); refresh('drawer-close');
      } else if (actionForm === 'offer') {
        const pay = Number(form.querySelector('#of-pay').value), payUnit = form.querySelector('#of-unit').value, startDate = form.querySelector('#of-start').value;
        if (!(pay > 0) || !startDate) { U.toast('Enter the pay and a start date.', 'bad'); return; }
        S.updateApplicant(a.id, { offer: { pay, payUnit, startDate, sentAt: S.nowIso(), status: 'sent' } });
        if (a.stage !== 'offer') S.setStage(a.id, 'offer', 'Offer sent: ' + S.money(pay, payUnit));
        else S.update(dd => { const ap = S.byId(dd.applicants, a.id); if (ap) ap.timeline.push({ at: S.nowIso(), text: 'Offer resent: ' + S.money(pay, payUnit) }); });
        S.addMessage(a.id, 'Hi ' + a.name.split(' ')[0] + ', we would like to offer you the ' + (job ? job.title : 'role') + (job ? ' role at ' + branchName(d, job.branchId) : '') + ': ' + S.money(pay, payUnit) + ', starting ' + fmtDay(startDate) + '. Accept or decline from your dashboard.', 'HR');
        actionForm = null; U.toast('Offer sent and applicant messaged', 'ok'); refresh('drawer-close');
      }
    });
  }
  function docName(d, docId) { const doc = S.byId(d.kycDocs, docId); return doc ? doc.name : docId; }

  /* ---------- roles table ---------- */
  function renderRoles() {
    const d = S.load();
    const jobs = d.jobs.slice().sort((x, y) => (x.status === y.status ? (y.posted || '').localeCompare(x.posted || '') : x.status === 'open' ? -1 : 1));
    el.rolesBody.innerHTML = jobs.map(j => {
      const active = d.applicants.filter(a => a.jobId === j.id && isActive(a)).length;
      return '<tr>' +
        '<td><strong>' + esc(j.title) + '</strong><div class="small muted">' + esc(j.dept) + '</div></td>' +
        '<td>' + esc(branchName(d, j.branchId)) + '</td>' +
        '<td>' + esc(j.type) + '</td>' +
        '<td class="price">' + esc(payBand(j)) + '</td>' +
        '<td>' + fmtDay(j.posted) + '</td>' +
        '<td class="num">' + active + '</td>' +
        '<td>' + (j.status === 'open' ? '<span class="badge badge-ok">Open</span>' : '<span class="badge">Closed</span>') + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" type="button" data-toggle-job="' + esc(j.id) + '" aria-label="' + (j.status === 'open' ? 'Close' : 'Reopen') + ' ' + esc(j.title) + ', ' + esc(branchName(d, j.branchId)) + '">' + (j.status === 'open' ? 'Close' : 'Reopen') + '</button></td>' +
        '</tr>';
    }).join('');
  }
  el.rolesBody.addEventListener('click', async e => {
    const b = e.target.closest('[data-toggle-job]'); if (!b) return;
    const d = S.load(); const job = S.byId(d.jobs, b.getAttribute('data-toggle-job')); if (!job) return;
    if (job.status === 'open') {
      const active = d.applicants.filter(a => a.jobId === job.id && isActive(a)).length;
      if (active) {
        const ok = await U.confirm({ title: 'Close ' + job.title + '?', body: active + (active === 1 ? ' active applicant stays' : ' active applicants stay') + ' in the pipeline, but the role disappears from the careers page and no one else can apply.', okLabel: 'Close role', danger: true });
        if (!ok) return;
      }
      S.update(dd => { const j = S.byId(dd.jobs, job.id); if (j) j.status = 'closed'; });
      U.toast(job.title + ' closed');
    } else {
      S.update(dd => { const j = S.byId(dd.jobs, job.id); if (j) j.status = 'open'; });
      U.toast(job.title + ' reopened', 'ok');
    }
    refresh();
    const again = el.rolesBody.querySelector('[data-toggle-job="' + job.id + '"]'); if (again) again.focus();
  });

  /* ---------- compliance ---------- */
  function emptyRow(cols, text) { return '<tr><td colspan="' + cols + '"><p class="small muted">' + esc(text) + '</p></td></tr>'; }
  function renderCompliance() {
    const d = S.load();
    const comp = complianceRows(d);

    el.compDocsCount.textContent = comp.docs.length + (comp.docs.length === 1 ? ' item' : ' items');
    el.compDocs.innerHTML = '<div class="table-wrap" style="border:0;border-radius:0"><table><thead><tr><th scope="col">Employee</th><th scope="col">Document</th><th scope="col">Status</th><th scope="col">Expiry</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>' +
      (comp.docs.length ? comp.docs.map(r => {
        const when = r.c.expiry ? fmtDay(r.c.expiry) + ' <span class="small muted">(' + esc(daysLabel(r.c.expiry)) + ')</span>' : '<span class="muted">—</span>';
        const canVerify = r.state === 'uploaded' || r.state === 'flagged';
        return '<tr>' +
          '<td><strong>' + esc(r.e.name) + '</strong><div class="small muted">' + esc(r.e.role) + ' · ' + esc(branchName(d, r.e.branchId)) + '</div></td>' +
          '<td>' + esc(r.doc ? r.doc.name : r.c.docId) + '</td>' +
          '<td>' + U.docBadge(r.state) + '</td>' +
          '<td>' + when + '</td>' +
          '<td><div class="row-actions">' +
            (canVerify ? '<button class="btn btn-primary btn-sm" type="button" data-emp-verify="' + esc(r.e.id) + '" data-doc="' + esc(r.c.docId) + '">Mark verified</button>' : '') +
            '<button class="btn btn-ghost btn-sm" type="button" data-emp-request="' + esc(r.e.id) + '" data-doc="' + esc(r.c.docId) + '">Request from employee</button>' +
          '</div></td></tr>';
      }).join('') : emptyRow(5, 'Every employee document is verified and in date.')) + '</tbody></table></div>';

    el.compTrainCount.textContent = comp.training.length + (comp.training.length === 1 ? ' item' : ' items');
    el.compTrain.innerHTML = '<div class="table-wrap" style="border:0;border-radius:0"><table><thead><tr><th scope="col">Employee</th><th scope="col">Module</th><th scope="col">Due</th><th scope="col">Status</th></tr></thead><tbody>' +
      (comp.training.length ? comp.training.map(r => '<tr>' +
        '<td><strong>' + esc(r.e.name) + '</strong><div class="small muted">' + esc(r.e.role) + ' · ' + esc(branchName(d, r.e.branchId)) + '</div></td>' +
        '<td>' + esc(r.t.name) + (r.t.minutes ? ' <span class="small muted">(' + (r.t.minutes >= 60 && r.t.minutes % 60 === 0 ? (r.t.minutes / 60) + ' h' : r.t.minutes + ' min') + ')</span>' : '') + '</td>' +
        '<td>' + fmtDay(r.t.due) + '</td>' +
        '<td>' + (r.days < 0 ? '<span class="badge badge-bad">Overdue ' + esc(daysLabel(r.t.due).replace(' ago', '')) + '</span>' : '<span class="badge badge-warn">Due ' + esc(daysLabel(r.t.due)) + '</span>') + '</td>' +
        '</tr>').join('') : emptyRow(4, 'No training is overdue or due in the next 30 days.')) + '</tbody></table></div>';

    el.compLeaveCount.textContent = comp.leave.length + (comp.leave.length === 1 ? ' request' : ' requests');
    el.compLeave.innerHTML = '<div class="table-wrap" style="border:0;border-radius:0"><table><thead><tr><th scope="col">Employee</th><th scope="col">Type</th><th scope="col">Dates</th><th scope="col" class="num">Days</th><th scope="col">Reason</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead><tbody>' +
      (comp.leave.length ? comp.leave.map(r => '<tr>' +
        '<td><strong>' + esc(r.e.name) + '</strong><div class="small muted">' + esc(r.e.role) + ' · ' + esc(branchName(d, r.e.branchId)) + '</div></td>' +
        '<td>' + esc(r.r.type) + '</td>' +
        '<td>' + fmtDay(r.r.from) + (r.r.to && r.r.to !== r.r.from ? ' – ' + fmtDay(r.r.to) : '') + '<div class="small muted">Requested ' + U.fmtDateTime(r.r.requestedAt) + '</div></td>' +
        '<td class="num">' + esc(String(r.r.days != null ? r.r.days : S.daysBetween(r.r.from, r.r.to || r.r.from))) + '</td>' +
        '<td>' + esc(r.r.reason || '—') + '</td>' +
        '<td><div class="row-actions"><button class="btn btn-primary btn-sm" type="button" data-leave="approved" data-emp="' + esc(r.e.id) + '" data-id="' + esc(r.r.id) + '">Approve</button>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-leave="declined" data-emp="' + esc(r.e.id) + '" data-id="' + esc(r.r.id) + '">Decline</button></div></td>' +
        '</tr>').join('') : emptyRow(6, 'No leave requests are waiting.')) + '</tbody></table></div>';
  }
  document.getElementById('compliance').addEventListener('click', async e => {
    const d = S.load();
    const v = e.target.closest('[data-emp-verify]');
    if (v) {
      const emp = S.byId(d.employees, v.getAttribute('data-emp-verify'));
      S.setEmployeeDoc(v.getAttribute('data-emp-verify'), v.getAttribute('data-doc'), 'verified');
      U.toast((emp ? emp.name + ': ' : '') + docName(d, v.getAttribute('data-doc')) + ' verified', 'ok'); refresh(); return;
    }
    const r = e.target.closest('[data-emp-request]');
    if (r) {
      const emp = S.byId(d.employees, r.getAttribute('data-emp-request'));
      U.toast('Request sent to ' + (emp ? emp.name : 'employee') + ' for ' + docName(d, r.getAttribute('data-doc')) + ' (demo: no message leaves this browser)', 'ok'); return;
    }
    const l = e.target.closest('[data-leave]');
    if (l) {
      const emp = S.byId(d.employees, l.getAttribute('data-emp'));
      const status = l.getAttribute('data-leave');
      if (status === 'declined') {
        const ok = await U.confirm({ title: 'Decline this leave request?', body: (emp ? emp.name : 'The employee') + ' sees the decision in their portal.', okLabel: 'Decline', danger: true });
        if (!ok) return;
      }
      S.setLeaveStatus(l.getAttribute('data-emp'), l.getAttribute('data-id'), status);
      U.toast('Leave ' + status + (emp ? ' for ' + emp.name : ''), status === 'approved' ? 'ok' : undefined); refresh();
    }
  });

  /* ---------- refresh everything from the store ---------- */
  function refresh(focusId) {
    renderStats(); renderRoleFilter(); renderBoard(); renderRoles(); renderCompliance();
    if (openId) renderDrawer(focusId);
  }

  function boot() {
    showTab(currentTab());
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
