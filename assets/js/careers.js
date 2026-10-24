/* Southern Food Basket — careers: open roles, role detail, five-step application, applicant dashboard.
   Branches on <body data-page="index|job|apply|me">. State lives in SFBStore; the application draft lives in
   localStorage under sfb-apply-draft-<jobId>. File bytes are never stored: previews are object URLs in memory. */
(function () {
  const U = window.SFBUI, S = window.SFBStore;
  const esc = U.esc, icon = U.icon;
  const page = document.body.getAttribute('data-page');

  /* ---------- shared helpers ---------- */
  function branchName(d, id) { const b = S.byId(d.branches, id); return b ? b.name : ''; }
  /* date-only strings ("2026-10-12") are parsed as UTC midnight by new Date(); pin them to local noon so the day is right in UTC-4 */
  function fmtDay(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? U.fmtDate(v + 'T12:00:00') : U.fmtDate(v); }
  /* "TTD 4,200 – 4,800 / month": one currency, one unit for the whole range */
  function todayIso() { const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function ageOn(dob, today) {
    const [y, m, d] = dob.split('-').map(Number); const [ty, tm, td] = today.split('-').map(Number);
    let age = ty - y; if (tm < m || (tm === m && td < d)) age--; return age;
  }
  function metaItem(ic, text) { return '<li>' + icon(ic) + '<span>' + esc(text) + '</span></li>'; }

  /* file checks shared by apply.html and me.html */
  const MIME = { pdf: ['application/pdf'], jpg: ['image/jpeg', 'image/jpg'], png: ['image/png'] };
  const MAX_BYTES = 8 * 1024 * 1024;
  function acceptAttr(formats) {
    const ext = formats.map(f => '.' + f); if (formats.includes('jpg')) ext.push('.jpeg'); return ext.join(',');
  }
  function formatsLabel(formats) { return formats.map(f => f.toUpperCase()).join(', '); }
  function fileProblem(file, doc) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const okExt = doc.formats.includes(ext) || (ext === 'jpeg' && doc.formats.includes('jpg'));
    const okType = !file.type || doc.formats.some(f => (MIME[f] || []).includes(file.type));
    if (!okExt || !okType) return 'Choose a ' + formatsLabel(doc.formats) + ' file. "' + file.name + '" is not one of those.';
    if (file.size > MAX_BYTES) return 'That file is ' + U.fileSize(file.size) + '. Choose one of 8 MB or less.';
    return null;
  }
  /* in-memory previews: docId -> object URL. Never persisted. */
  const previews = {};
  function setPreview(docId, file) {
    if (previews[docId]) { try { URL.revokeObjectURL(previews[docId]); } catch (e) {} delete previews[docId]; }
    if (file && /^image\//.test(file.type)) previews[docId] = URL.createObjectURL(file);
  }
  function thumbHtml(meta, docId) {
    if (!meta || !meta.fileName) return '';
    if (previews[docId]) return '<img class="doc-preview" src="' + esc(previews[docId]) + '" alt="Preview of ' + esc(meta.fileName) + '">';
    return '<span class="doc-ph" aria-hidden="true">' + icon('file') + '</span>';
  }
  function fileMetaHtml(meta) {
    if (!meta || !meta.fileName) return '';
    const bits = ['<span>' + esc(meta.fileName) + '</span>'];
    if (meta.size != null) bits.push('<span>' + esc(U.fileSize(meta.size)) + '</span>');
    if (meta.expiry) bits.push('<span>Expires ' + fmtDay(meta.expiry) + '</span>');
    return '<div class="doc-file">' + bits.join('<span aria-hidden="true">·</span>') + '</div>';
  }
  function uploadBtnHtml(doc, label) {
    return '<label class="btn btn-ghost btn-sm file-btn">' + icon('upload') + '<span>' + esc(label || 'Upload') + '</span>' +
      '<input type="file" accept="' + esc(acceptAttr(doc.formats)) + '" data-doc-file="' + esc(doc.id) + '" aria-label="' + esc(label || 'Upload') + ' ' + esc(doc.name) + '"></label>';
  }
  /* wires file inputs, expiry inputs and remove buttons inside `scope` (apply.html step 4 and me.html).
     onChange(docId, metaOrNull) — meta is { fileName, size, type, expiry, state }; bytes never leave the input.
     getMeta(docId) returns the stored metadata. opts.expiryOnly(docId, value) handles an expiry edit on its own. */
  function wireDocInputs(scope, onChange, getMeta, opts) {
    opts = opts || {};
    scope.querySelectorAll('[data-doc-file]').forEach(input => input.addEventListener('change', () => {
      const docId = input.getAttribute('data-doc-file');
      const doc = S.byId(S.load().kycDocs, docId);
      const file = input.files && input.files[0];
      if (!file || !doc) return;
      const row = input.closest('.doc-row');
      const problem = fileProblem(file, doc);
      row.querySelectorAll('.error-text').forEach(e => e.remove());
      if (problem) {
        const p = document.createElement('p'); p.className = 'error-text'; p.setAttribute('role', 'alert'); p.textContent = problem;
        row.querySelector('.doc-text').appendChild(p);
        U.toast(problem, 'bad'); input.value = ''; return;
      }
      const expiryEl = row.querySelector('[data-doc-expiry]');
      const prev = getMeta(docId) || {};
      setPreview(docId, file);
      onChange(docId, { fileName: file.name, size: file.size, type: file.type || '', expiry: (expiryEl && expiryEl.value) || prev.expiry || '', state: 'uploaded' });
    }));
    scope.querySelectorAll('[data-doc-expiry]').forEach(input => input.addEventListener('change', () => {
      const docId = input.getAttribute('data-doc-expiry');
      if (opts.expiryOnly) { opts.expiryOnly(docId, input.value); return; }
      const prev = getMeta(docId);
      if (prev && prev.fileName) onChange(docId, Object.assign({}, prev, { expiry: input.value }));
      else onChange(docId, input.value ? { expiry: input.value, state: 'missing' } : null);
    }));
    scope.querySelectorAll('[data-doc-remove]').forEach(btn => btn.addEventListener('click', () => {
      const docId = btn.getAttribute('data-doc-remove'); setPreview(docId, null); onChange(docId, null);
    }));
  }

  /* =========================================================
     careers/index.html — open roles
     ========================================================= */
  function renderIndex() {
    const d = S.load();
    const why = document.getElementById('why-grid');
    why.innerHTML = (d.content.careersWhy || []).map(w => '<article class="card"><h3>' + esc(w.title) + '</h3><p style="margin:0">' + esc(w.text) + '</p></article>').join('');

    const bSel = document.getElementById('f-branch'), dSel = document.getElementById('f-dept');
    bSel.innerHTML = '<option value="all">All branches</option>' + d.branches.map(b => '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>').join('');
    dSel.innerHTML = '<option value="all">All departments</option>' + (d.jobDepts || []).map(x => '<option value="' + esc(x) + '">' + esc(x) + '</option>').join('');

    const params = new URLSearchParams(location.search);
    const b0 = params.get('branch'), d0 = params.get('dept');
    bSel.value = d.branches.some(b => b.id === b0) ? b0 : 'all';
    dSel.value = (d.jobDepts || []).includes(d0) ? d0 : 'all';

    const list = document.getElementById('role-list'), count = document.getElementById('roles-count');
    function renderList() {
      const branchId = bSel.value, dept = dSel.value;
      const jobs = S.jobs({ status: 'open', branchId, dept }).slice().sort((a, b) => (b.posted || '').localeCompare(a.posted || ''));
      count.textContent = jobs.length === 0 ? 'No open roles match these filters.' : jobs.length + (jobs.length === 1 ? ' open role' : ' open roles');
      if (!jobs.length) {
        list.innerHTML = '<div class="empty" style="grid-column:1/-1"><p>No open roles match these filters. Try another branch or department, or check back next week.</p>' +
          '<button class="btn btn-ghost btn-sm" type="button" id="clear-filters">Show all roles</button></div>';
        document.getElementById('clear-filters').addEventListener('click', () => { bSel.value = 'all'; dSel.value = 'all'; apply(); });
        return;
      }
      list.innerHTML = jobs.map(j => {
        const branch = branchName(d, j.branchId);
        return '<article class="card job-card">' +
          '<div><p class="eyebrow">' + esc(j.dept) + '</p><h3>' + esc(j.title) + '</h3></div>' +
          '<ul class="role-meta">' + metaItem('pin', branch) + metaItem('briefcase', j.type) + metaItem('clock', j.shift) + '</ul>' +
          '<div class="role-foot"><span class="role-pay-note">Pay discussed at interview</span>' +
          '<a class="btn btn-primary btn-sm" href="job.html?id=' + encodeURIComponent(j.id) + '" aria-label="View role: ' + esc(j.title) + ', ' + esc(branch) + '">View role ' + icon('arrow') + '</a></div>' +
          '<p class="role-posted">Posted ' + fmtDay(j.posted) + '</p>' +
          '</article>';
      }).join('');
    }
    function apply() {
      const p = new URLSearchParams();
      if (bSel.value !== 'all') p.set('branch', bSel.value);
      if (dSel.value !== 'all') p.set('dept', dSel.value);
      const q = p.toString();
      try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {}
      renderList();
    }
    bSel.addEventListener('change', apply);
    dSel.addEventListener('change', apply);
    document.getElementById('roles-filter').addEventListener('submit', e => { e.preventDefault(); apply(); });
    renderList();
  }

  /* =========================================================
     careers/job.html?id= — role detail
     ========================================================= */
  function renderJob() {
    const d = S.load();
    const id = U.qs('id');
    const job = S.byId(d.jobs, id);
    const root = document.getElementById('job-main');
    if (!job || job.status !== 'open') {
      document.title = 'Role not found · Careers · Southern Food Basket';
      root.innerHTML = '<div class="empty"><h2 style="font-size:1.5rem">' + (job ? 'This role is no longer open' : 'We could not find that role') + '</h2>' +
        '<p style="margin-inline:auto">' + (job ? 'Applications for ' + esc(job.title) + ' at ' + esc(branchName(d, job.branchId)) + ' have closed.' : 'The link may be out of date.') + ' The roles we are hiring for now are listed on the careers page.</p>' +
        '<a class="btn btn-primary" href="index.html">See open roles</a></div>';
      return;
    }
    document.title = job.title + ' · Careers · Southern Food Basket';
    const branch = branchName(d, job.branchId);
    const needs = (job.kyc || []).map(k => S.byId(d.kycDocs, k)).filter(Boolean);
    const list = items => '<ul>' + items.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>';
    root.innerHTML =
      '<a class="back-link" href="index.html">' + icon('arrow') + ' Back to roles</a>' +
      '<div class="job-head"><p class="eyebrow">' + esc(job.dept) + ' · ' + esc(branch) + '</p><h1>' + esc(job.title) + '</h1>' +
      '<ul class="role-meta">' + metaItem('pin', branch) + metaItem('briefcase', job.type) + metaItem('clock', job.shift) + '</ul></div>' +
      '<div class="job-layout">' +
        '<div class="job-body">' +
          '<h2>The role</h2><p>' + esc(job.summary) + '</p>' +
          '<h2>What you will do</h2>' + list(job.responsibilities || []) +
          '<h2>What we are looking for</h2>' + list(job.requirements || []) +
          '<h2>How hiring works</h2><p>Apply online in five steps, then screening, a documents check, an interview at the branch and a written offer. You can follow every stage in your application dashboard.</p>' +
        '</div>' +
        '<aside class="job-aside" aria-label="Role summary">' +
          '<div class="card">' +
            '<dl class="kv">' +
              '<dt>Branch</dt><dd>' + esc(branch) + '</dd>' +
              '<dt>Type</dt><dd>' + esc(job.type) + '</dd>' +
              '<dt>Shift</dt><dd>' + esc(job.shift) + '</dd>' +
              '<dt>Pay</dt><dd>Discussed after your interview</dd>' +
              '<dt>Posted</dt><dd>' + fmtDay(job.posted) + '</dd>' +
            '</dl>' +
            '<a class="btn btn-accent" href="apply.html?id=' + encodeURIComponent(job.id) + '">Apply for this role</a>' +
            '<a class="btn btn-ghost" href="index.html">Back to roles</a>' +
          '</div>' +
          '<div class="card"><h3 style="font-size:1.125rem">Documents you will need</h3>' +
            '<p class="small muted">You can apply first and add any you do not have yet from your dashboard.</p>' +
            '<ul class="need-list">' + needs.map(doc =>
              '<li>' + icon(doc.conditional ? 'file' : 'check') + '<div><strong>' + esc(doc.name) + '</strong><span class="muted">' + esc(doc.desc) + '</span>' +
              (doc.conditional ? '<span class="badge badge-plain">Only if it applies to you</span>' : '') + '</div></li>').join('') +
            '</ul></div>' +
        '</aside>' +
      '</div>';
  }

  /* =========================================================
     careers/apply.html?id= — five-step application
     ========================================================= */
  const STEPS = [
    { id: 'account', label: 'Account' },
    { id: 'personal', label: 'Personal' },
    { id: 'experience', label: 'Experience' },
    { id: 'documents', label: 'Documents' },
    { id: 'review', label: 'Review' }
  ];
  const AVAILABILITY = ['Weekdays', 'Evenings', 'Weekends', 'Early mornings', 'Any shift'];
  function draftKey(jobId) { return 'sfb-apply-draft-' + jobId; }
  function loadDraft(jobId) { try { return JSON.parse(localStorage.getItem(draftKey(jobId)) || 'null'); } catch (e) { return null; } }
  function saveDraft(jobId, draft) { try { localStorage.setItem(draftKey(jobId), JSON.stringify(draft)); } catch (e) {} }
  function clearDraft(jobId) { try { localStorage.removeItem(draftKey(jobId)); } catch (e) {} }
  function blankDraft() {
    return { account: { name: '', email: '', phone: '' }, personal: { address: '', dob: '', national: false }, experience: { summary: '', availability: [], startDate: '' }, docs: {} };
  }

  function renderApply() {
    const d = S.load();
    const jobId = U.qs('id');
    const job = S.byId(d.jobs, jobId);
    const root = document.getElementById('apply-root');
    if (!job || job.status !== 'open') {
      root.innerHTML = '<div class="empty"><h2 style="font-size:1.5rem">' + (job ? 'This role is no longer open' : 'We could not find that role') + '</h2>' +
        '<p style="margin-inline:auto">Pick a role from the careers page to start an application.</p><a class="btn btn-primary" href="index.html">See open roles</a></div>';
      return;
    }
    document.title = 'Apply: ' + job.title + ' · Southern Food Basket';
    const branch = branchName(d, job.branchId);

    let draft = Object.assign(blankDraft(), loadDraft(jobId) || {});
    draft.docs = draft.docs || {};
    let step = stepFromHash();
    const consent = { truth: false, process: false }; /* asked fresh every time; never saved in the draft */

    root.innerHTML =
      '<div class="apply-head"><p class="eyebrow">Apply</p><h1>' + esc(job.title) + '</h1>' +
      '<p class="muted">' + esc(branch) + ' · ' + esc(job.type) + ' &nbsp;·&nbsp; <a href="job.html?id=' + encodeURIComponent(job.id) + '">Role details</a></p></div>' +
      '<div class="card apply-card">' +
        '<ol class="stepper" id="stepper" aria-label="Application steps"></ol>' +
        '<form id="apply-form" novalidate><div id="step-panel"></div><div class="step-nav" id="step-nav"></div></form>' +
      '</div>';
    const stepper = document.getElementById('stepper'), panel = document.getElementById('step-panel'), nav = document.getElementById('step-nav'), form = document.getElementById('apply-form');

    function stepFromHash() { const m = /^#step-([1-5])$/.exec(location.hash); return m ? Number(m[1]) : 1; }
    function go(n) {
      if (stepFromHash() === n) { step = n; render(true); } else location.hash = 'step-' + n;
    }
    /* a hash change is always user navigation (Continue, Back, stepper, Edit links); reload is not */
    window.addEventListener('hashchange', () => { step = stepFromHash(); render(true); });

    function save() { saveDraft(jobId, draft); }
    function requiredDocs() { return S.requiredDocsFor({ jobId, nonNational: !draft.personal.national }); }

    /* ---- validation: returns [{ id, msg }] ---- */
    function validate(n) {
      const errs = [];
      const today = todayIso();
      if (n === 1) {
        const a = draft.account;
        if (!a.name.trim()) errs.push({ id: 'f-name', msg: 'Enter your full name.' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) errs.push({ id: 'f-email', msg: 'Enter an email address like name@example.com.' });
        const digits = a.phone.replace(/\D/g, '');
        const okPhone = digits.length === 7 || (digits.length === 10 && digits.startsWith('868')) || (digits.length === 11 && digits.startsWith('1868'));
        if (!okPhone) errs.push({ id: 'f-phone', msg: 'Enter a Trinidad and Tobago number, for example (868) 000-0000.' });
      }
      if (n === 2) {
        const p = draft.personal;
        if (!p.address.trim()) errs.push({ id: 'f-address', msg: 'Enter the address where you live.' });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob)) errs.push({ id: 'f-dob', msg: 'Enter your date of birth.' });
        else if (ageOn(p.dob, today) < 16) errs.push({ id: 'f-dob', msg: 'You must be at least 16 to apply.' });
        else if (ageOn(p.dob, today) > 100) errs.push({ id: 'f-dob', msg: 'Check the year of birth.' });
      }
      if (n === 3) {
        const x = draft.experience;
        if (x.summary.trim().length < 40) errs.push({ id: 'f-summary', msg: 'Tell us a little more: at least 40 characters (' + x.summary.trim().length + ' so far).' });
        if (!x.availability.length) errs.push({ id: 'f-avail', msg: 'Pick at least one option.' });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(x.startDate)) errs.push({ id: 'f-start', msg: 'Enter the earliest date you could start.' });
        else if (x.startDate < today) errs.push({ id: 'f-start', msg: 'Choose today or a later date.' });
      }
      if (n === 5) {
        const pid = draft.docs['photo-id'];
        if (!pid || !pid.fileName) errs.push({ id: 'photo-id', step: 4, msg: 'Add your government photo ID in the Documents step before you submit.' });
        if (!consent.truth) errs.push({ id: 'f-true', msg: 'Confirm that the information is true and complete.' });
        if (!consent.process) errs.push({ id: 'f-consent', msg: 'Confirm that we may process these details.' });
      }
      return errs;
    }
    function showErrors(errs) {
      panel.querySelectorAll('.error-text').forEach(e => e.remove());
      panel.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
      let first = null;
      errs.forEach(err => {
        const field = panel.querySelector('#' + err.id);
        const host = panel.querySelector('[data-err="' + err.id + '"]') || (field && field.closest('.field, .check, fieldset')) || null;
        if (field && /^(INPUT|SELECT|TEXTAREA)$/.test(field.tagName)) field.setAttribute('aria-invalid', 'true');
        const p = document.createElement('p'); p.className = 'error-text'; p.setAttribute('role', 'alert'); p.textContent = err.msg;
        (host || panel).appendChild(p);
        if (!first) first = field || host;
      });
      if (first && typeof first.focus === 'function') first.focus({ preventScroll: false });
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center' });
    }

    /* ---- render ---- */
    function render(nav) {
      stepper.innerHTML = STEPS.map((s, i) => {
        const n = i + 1, cls = n < step ? 'is-done' : n === step ? 'is-current' : '';
        const inner = n + '. <span>' + esc(s.label) + '</span>';
        return '<li class="' + cls + '"' + (n === step ? ' aria-current="step"' : '') + '>' +
          (n < step ? '<button type="button" data-go="' + n + '" aria-label="Back to step ' + n + ': ' + esc(s.label) + '">' + inner + '</button>' : inner) + '</li>';
      }).join('');
      stepper.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(Number(b.getAttribute('data-go')))));

      if (step === 1) renderAccount(); else if (step === 2) renderPersonal(); else if (step === 3) renderExperience(); else if (step === 4) renderDocuments(); else renderReview();
      renderNav();
      const h = panel.querySelector('.step-title');
      if (h && nav) { h.focus({ preventScroll: true }); root.scrollIntoView({ block: 'start' }); }
    }
    function renderNav() {
      nav.innerHTML =
        (step > 1 ? '<button class="btn btn-ghost" type="button" id="prev-btn">Back</button>' : '<a class="btn btn-ghost" href="job.html?id=' + encodeURIComponent(job.id) + '">Cancel</a>') +
        '<span class="spacer"></span>' +
        (step < 5 ? '<button class="btn btn-primary" type="submit">Continue ' + icon('arrow') + '</button>' : '<button class="btn btn-accent" type="submit" id="submit-btn">Submit application</button>');
      const prev = document.getElementById('prev-btn');
      if (prev) prev.addEventListener('click', () => { save(); go(step - 1); });
    }
    function field(id, label, input, hint) {
      return '<div class="field" data-err="' + esc(id) + '"><label for="' + esc(id) + '">' + label + '</label>' + input + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
    }
    function bind(sel, fn) { panel.querySelectorAll(sel).forEach(el => { el.addEventListener('input', () => { fn(el); save(); }); el.addEventListener('change', () => { fn(el); save(); }); }); }

    function renderAccount() {
      const a = draft.account;
      panel.innerHTML =
        '<h2 class="step-title" tabindex="-1">Your details</h2><p class="step-intro">How we reach you about this application.</p>' +
        '<p class="demo-note">Demo: no account is created and nothing is sent.</p>' +
        field('f-name', 'Full name', '<input type="text" id="f-name" autocomplete="name" value="' + esc(a.name) + '" required>') +
        '<div class="form-row">' +
        field('f-email', 'Email', '<input type="email" id="f-email" autocomplete="email" value="' + esc(a.email) + '" required>') +
        field('f-phone', 'Phone', '<input type="tel" id="f-phone" autocomplete="tel" value="' + esc(a.phone) + '" placeholder="(868) 000-0000" required>') +
        '</div>';
      bind('#f-name', el => { a.name = el.value; });
      bind('#f-email', el => { a.email = el.value; });
      bind('#f-phone', el => { a.phone = el.value; });
    }
    function renderPersonal() {
      const p = draft.personal;
      panel.innerHTML =
        '<h2 class="step-title" tabindex="-1">About you</h2><p class="step-intro">Where you live, your age and your right to work. This decides which documents we ask for.</p>' +
        field('f-address', 'Home address', '<input type="text" id="f-address" autocomplete="street-address" value="' + esc(p.address) + '" required>', 'Street, village or town.') +
        field('f-dob', 'Date of birth', '<input type="date" id="f-dob" autocomplete="bday" value="' + esc(p.dob) + '" max="' + todayIso() + '" required>', 'You must be at least 16.') +
        '<div class="field" data-err="f-national"><label class="check"><input type="checkbox" id="f-national"' + (p.national ? ' checked' : '') + '><span>I am a national of Trinidad and Tobago or hold a CARICOM skills certificate</span></label>' +
        '<p class="hint">Leave this unticked if neither applies; we will then ask for a work permit in the Documents step.</p></div>';
      bind('#f-address', el => { p.address = el.value; });
      bind('#f-dob', el => { p.dob = el.value; });
      bind('#f-national', el => { p.national = el.checked; });
    }
    function renderExperience() {
      const x = draft.experience;
      panel.innerHTML =
        '<h2 class="step-title" tabindex="-1">Experience and availability</h2><p class="step-intro">A few lines about your work so far and when you can work.</p>' +
        field('f-summary', 'Your experience', '<textarea id="f-summary" rows="5" required minlength="40">' + esc(x.summary) + '</textarea>', 'At least 40 characters. Jobs, training, or anything that shows you can do this role. <span id="summary-count">' + x.summary.trim().length + '</span> characters so far.') +
        '<fieldset data-err="f-avail" id="f-avail"><legend>Availability</legend><div class="avail">' +
        AVAILABILITY.map((opt, i) => '<label class="check"><input type="checkbox" name="avail" value="' + esc(opt) + '" id="avail-' + i + '"' + (x.availability.includes(opt) ? ' checked' : '') + '><span>' + esc(opt) + '</span></label>').join('') +
        '</div></fieldset>' +
        field('f-start', 'Earliest start date', '<input type="date" id="f-start" value="' + esc(x.startDate) + '" min="' + todayIso() + '" required>');
      bind('#f-summary', el => { x.summary = el.value; const c = document.getElementById('summary-count'); if (c) c.textContent = el.value.trim().length; });
      bind('input[name="avail"]', () => { x.availability = Array.from(panel.querySelectorAll('input[name="avail"]:checked')).map(i => i.value); });
      bind('#f-start', el => { x.startDate = el.value; });
    }
    function docRowHtml(doc) {
      const meta = draft.docs[doc.id];
      const has = !!(meta && meta.fileName);
      const state = has ? 'uploaded' : 'missing';
      const required = doc.id === 'photo-id';
      return '<div class="doc-row" data-doc="' + esc(doc.id) + '">' +
        '<div class="doc-main">' + thumbHtml(meta, doc.id) + '<div class="doc-text">' +
          '<div class="doc-name">' + esc(doc.name) + (required ? ' <span class="small muted" style="font-weight:500">(required to submit)</span>' : '') + '</div>' +
          '<div class="doc-desc">' + esc(doc.desc) + ' Accepted: ' + esc(formatsLabel(doc.formats)) + '.</div>' +
          fileMetaHtml(meta) +
          (doc.expires ? '<label class="doc-expiry">Expiry date <input type="date" data-doc-expiry="' + esc(doc.id) + '" value="' + esc((meta && meta.expiry) || '') + '" min="' + todayIso() + '"></label>' : '') +
        '</div></div>' +
        U.docBadge(state) +
        '<div class="doc-actions">' + uploadBtnHtml(doc, has ? 'Replace' : 'Upload') +
          (has ? '<button class="btn btn-ghost btn-sm" type="button" data-doc-remove="' + esc(doc.id) + '">Remove</button>' : '') +
        '</div></div>';
    }
    function renderDocuments() {
      const req = requiredDocs();
      const pid = draft.docs['photo-id'];
      panel.innerHTML =
        '<h2 class="step-title" tabindex="-1">Documents (KYC)</h2><p class="step-intro">Upload what you have now. Anything missing stays on your list and you can add it from your dashboard after you apply.</p>' +
        '<div class="doc-list" id="doc-list">' + req.map(docRowHtml).join('') +
        '<div class="doc-foot"><p class="hint">Files are previewed in your browser only. In this demo nothing is uploaded or stored.</p></div></div>' +
        (!pid || !pid.fileName ? '<div class="alert alert-warn" style="margin-top:var(--s4)">' + icon('shield') + '<span>Your government photo ID is required before you can submit. The other documents can wait.</span></div>' : '');
      wireDocInputs(panel, (docId, meta) => {
        if (meta) draft.docs[docId] = meta; else delete draft.docs[docId];
        save(); renderDocuments();
        const input = panel.querySelector('[data-doc="' + docId + '"] [data-doc-file]'); if (input) input.focus();
      }, docId => (draft.docs[docId] || {}), {
        /* an expiry edit saves in place; no re-render, so the date input keeps focus */
        expiryOnly: (docId, value) => {
          if (draft.docs[docId]) draft.docs[docId].expiry = value;
          else if (value) draft.docs[docId] = { expiry: value, state: 'missing' };
          save();
        }
      });
    }
    function renderReview() {
      const a = draft.account, p = draft.personal, x = draft.experience;
      const req = requiredDocs();
      const edit = n => '<a href="#step-' + n + '" class="small">Edit</a>';
      const kv = pairs => '<dl class="review-kv">' + pairs.map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + (v || '<span class="muted">Not given</span>') + '</dd>').join('') + '</dl>';
      panel.innerHTML =
        '<h2 class="step-title" tabindex="-1">Review and submit</h2><p class="step-intro">Check everything once more. You can change any step before you submit.</p>' +
        '<section class="review-section"><div class="review-head"><h3>Your details</h3>' + edit(1) + '</div>' + kv([['Name', esc(a.name)], ['Email', esc(a.email)], ['Phone', esc(a.phone)]]) + '</section>' +
        '<section class="review-section"><div class="review-head"><h3>About you</h3>' + edit(2) + '</div>' + kv([['Address', esc(p.address)], ['Date of birth', p.dob ? fmtDay(p.dob) : ''], ['Right to work', p.national ? 'National of Trinidad and Tobago or CARICOM skills certificate' : 'Work permit needed']]) + '</section>' +
        '<section class="review-section"><div class="review-head"><h3>Experience and availability</h3>' + edit(3) + '</div>' + kv([['Experience', x.summary ? '<span class="summary-text">' + esc(x.summary) + '</span>' : ''], ['Availability', esc(x.availability.join(', '))], ['Earliest start', x.startDate ? fmtDay(x.startDate) : '']]) + '</section>' +
        '<section class="review-section"><div class="review-head"><h3>Documents</h3>' + edit(4) + '</div><ul class="review-docs">' +
          req.map(doc => { const m = draft.docs[doc.id]; const has = m && m.fileName; return '<li><span>' + esc(doc.name) + (has ? ' <span class="muted small">' + esc(m.fileName) + '</span>' : '') + '</span>' + U.docBadge(has ? 'uploaded' : 'missing') + '</li>'; }).join('') +
        '</ul>' + (!(draft.docs['photo-id'] && draft.docs['photo-id'].fileName) ? '<div class="alert alert-warn" style="margin-top:var(--s3)" data-err="photo-id">' + icon('shield') + '<span>Government photo ID is required. <a href="#step-4">Add it in the Documents step</a>.</span></div>' : '') + '</section>' +
        '<div class="consent">' +
          '<label class="check" data-err="f-true"><input type="checkbox" id="f-true"' + (consent.truth ? ' checked' : '') + '><span>The information I have given is true and complete.</span></label>' +
          '<label class="check" data-err="f-consent"><input type="checkbox" id="f-consent"' + (consent.process ? ' checked' : '') + '><span>I consent to Southern Food Basket processing these details to assess my application (demo).</span></label>' +
        '</div>' +
        '<p class="hint">Submitting creates a demo application in this browser only and signs you in to the applicant dashboard.</p>';
      panel.querySelector('#f-true').addEventListener('change', e => { consent.truth = e.target.checked; });
      panel.querySelector('#f-consent').addEventListener('change', e => { consent.process = e.target.checked; });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      save();
      if (step < 5) {
        const errs = validate(step);
        if (errs.length) { showErrors(errs); return; }
        go(step + 1); return;
      }
      for (let n = 1; n <= 3; n++) { const errs = validate(n); if (errs.length) { U.toast('Step ' + n + ' needs attention.', 'bad'); go(n); setTimeout(() => showErrors(errs), 50); return; } }
      const errs = validate(5);
      if (errs.length) { showErrors(errs); return; }
      submitApplication();
    });

    function submitApplication() {
      const a = draft.account, p = draft.personal, x = draft.experience;
      const docs = {};
      Object.keys(draft.docs).forEach(id => {
        const m = draft.docs[id];
        if (!m || !m.fileName) return;
        docs[id] = { fileName: m.fileName, size: m.size, type: m.type || '', state: 'uploaded', updatedAt: S.nowIso() };
        if (m.expiry) docs[id].expiry = m.expiry;
      });
      const app = S.addApplicant({
        name: a.name.trim(), email: a.email.trim(), phone: a.phone.trim(), jobId,
        personal: { address: p.address.trim(), dob: p.dob, nonNational: !p.national },
        experience: { summary: x.summary.trim(), availability: x.availability.slice(), startDate: x.startDate },
        docs
      });
      S.login('applicant', app.id);
      clearDraft(jobId);
      U.toast('Application submitted', 'ok');
      location.href = 'me.html?submitted=1';
    }

    render();
  }

  /* =========================================================
     careers/me.html — applicant dashboard (app shell, role applicant)
     ========================================================= */
  const MAIN_STAGES = ['submitted', 'screening', 'kyc', 'interview', 'offer', 'hired'];
  const CLOSED_STAGES = ['not-selected', 'withdrawn'];

  function renderMe() {
    const s = S.requireRole(['applicant']); if (!s) return;
    const main = document.getElementById('me-main');
    const submitted = U.qs('submitted') === '1';
    if (submitted) { try { history.replaceState(null, '', location.pathname); } catch (e) {} }
    let showThanks = submitted;

    function render() {
      const d = S.load();
      const a = S.currentUser();
      if (!a) {
        main.innerHTML = '<div class="empty"><h2 style="font-size:1.5rem">No application found</h2><p style="margin-inline:auto">This demo session is not linked to an application. Browse the open roles to start one, or switch role from the demo login.</p>' +
          '<p><a class="btn btn-primary" href="index.html">Browse roles</a> <a class="btn btn-ghost" href="../portal/index.html">Demo login</a></p></div>';
        return;
      }
      const job = S.byId(d.jobs, a.jobId);
      const branch = job ? branchName(d, job.branchId) : '';
      const closed = CLOSED_STAGES.includes(a.stage);
      const req = S.requiredDocsFor(a);
      const docs = a.docs || {};
      const verified = req.filter(doc => U.docDisplayState(docs[doc.id]) === 'verified').length;

      /* tracker */
      const reached = new Set(['submitted']);
      (a.timeline || []).forEach(t => { const m = /^Moved to (.+?)( —|$)/.exec(t.text || ''); if (m) { const st = (d.stages || []).find(x => x.label === m[1]); if (st) reached.add(st.id); } });
      const curIdx = MAIN_STAGES.indexOf(a.stage);
      const whenFor = id => {
        if (id === 'submitted') return a.submittedAt;
        const label = S.stageLabel(id); const t = (a.timeline || []).find(x => (x.text || '').startsWith('Moved to ' + label)); return t ? t.at : null;
      };
      const tracker = MAIN_STAGES.map((id, i) => {
        let cls = '';
        if (closed) cls = reached.has(id) ? 'is-done' : '';
        else if (i < curIdx || (i === curIdx && id === 'hired')) cls = 'is-done'; else if (i === curIdx) cls = 'is-current';
        const when = whenFor(id);
        const hint = { submitted: 'We have your application.', screening: 'HR reads your application.', kyc: 'We check your documents.', interview: 'At the branch, with the team lead.', offer: 'Pay and start date in writing.', hired: 'Welcome to the team.' }[id];
        return '<li class="' + cls + '"><span class="dot" aria-hidden="true">' + (cls === 'is-done' ? icon('check') : '') + '</span><div><strong>' + esc(S.stageLabel(id)) + (cls === 'is-current' ? ' <span class="visually-hidden">(current)</span>' : '') + '</strong>' +
          '<span class="meta">' + (when && cls ? U.fmtDateTime(when) : esc(hint)) + '</span></div></li>';
      }).join('') + (closed ? '<li class="is-bad"><span class="dot" aria-hidden="true">' + icon('close') + '</span><div><strong>' + esc(S.stageLabel(a.stage)) + '</strong><span class="meta">' + U.fmtDateTime(whenFor(a.stage) || ((a.timeline || []).slice(-1)[0] || {}).at) + '</span></div></li>' : '');

      /* documents */
      const docRows = req.map(doc => {
        const m = docs[doc.id]; const state = U.docDisplayState(m); const has = !!(m && m.fileName);
        const canUpload = !closed && (state === 'missing' || state === 'flagged' || state === 'expired');
        return '<div class="doc-row" data-doc="' + esc(doc.id) + '">' +
          '<div class="doc-main">' + thumbHtml(m, doc.id) + '<div class="doc-text">' +
            '<div class="doc-name">' + esc(doc.name) + '</div><div class="doc-desc">' + esc(doc.desc) + '</div>' + fileMetaHtml(m) +
            (canUpload && doc.expires ? '<label class="doc-expiry">Expiry date <input type="date" data-doc-expiry="' + esc(doc.id) + '" value="' + esc((m && m.expiry) || '') + '"></label>' : '') +
          '</div></div>' +
          U.docBadge(state) +
          (canUpload ? '<div class="doc-actions">' + uploadBtnHtml(doc, has ? 'Replace' : 'Upload') + '</div>' : '<div class="doc-actions"></div>') +
          (state === 'flagged' && m && m.reason ? '<div class="doc-reason">' + esc(m.reason) + '</div>' : '') +
          (state === 'expired' ? '<div class="doc-reason">This document has expired. Upload a current one.</div>' : '') +
          '</div>';
      }).join('');

      /* right column */
      const messages = (a.messages || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''));
      const msgHtml = messages.length ? '<ul class="list">' + messages.map(m => '<li><div class="grow"><strong>' + esc(m.from) + '</strong><div class="meta">' + U.fmtDateTime(m.at) + '</div><p style="margin:6px 0 0;font-size:.9375rem">' + esc(m.text) + '</p></div></li>').join('') + '</ul>'
        : '<div class="panel-body"><p class="muted" style="margin:0">No messages yet. HR will write here when they need something from you.</p></div>';
      const interview = a.interview ? '<div class="card"><p class="eyebrow">Interview</p><h3 style="font-size:1.25rem">' + U.fmtDateTime(a.interview.at) + '</h3><dl class="kv"><dt>Where</dt><dd>' + esc(a.interview.where) + '</dd><dt>With</dt><dd>' + esc(a.interview.with) + '</dd></dl></div>' : '';
      let offer = '';
      if (a.offer) {
        const o = a.offer;
        const status = o.status === 'accepted' ? '<span class="badge badge-ok">Accepted</span>' : o.status === 'declined' ? '<span class="badge badge-bad">Declined</span>' : '<span class="badge badge-info">Awaiting your reply</span>';
        offer = '<div class="card offer-card"><div class="badge-row" style="justify-content:space-between"><p class="eyebrow" style="margin:0">Offer</p>' + status + '</div>' +
          '<p class="offer-pay" style="margin-top:var(--s3)">' + esc(S.money(o.pay, o.payUnit)) + '</p>' +
          '<dl class="kv"><dt>Role</dt><dd>' + esc(job ? job.title : '') + '</dd><dt>Branch</dt><dd>' + esc(branch) + '</dd><dt>Start date</dt><dd>' + fmtDay(o.startDate) + '</dd><dt>Sent</dt><dd>' + U.fmtDateTime(o.sentAt) + '</dd></dl>' +
          (o.status === 'sent' && !closed ? '<div class="actions"><button class="btn btn-primary" type="button" id="offer-accept">Accept offer</button><button class="btn btn-ghost" type="button" id="offer-decline">Decline</button></div>' : '') +
          '</div>';
      }
      const timeline = (a.timeline || []).slice().sort((x, y) => (y.at || '').localeCompare(x.at || ''));
      const timelineHtml = '<ol class="timeline">' + timeline.map(t => '<li><time datetime="' + esc(t.at) + '">' + U.fmtDateTime(t.at) + '</time>' + esc(t.text) + '</li>').join('') + '</ol>';
      const canWithdraw = !closed && a.stage !== 'hired';

      main.innerHTML =
        (showThanks ? '<p class="alert alert-ok" style="margin-bottom:var(--s5)">' + icon('check') + '<span>Thanks, your application is in. We will write to you here when it moves.</span></p>' : '') +
        '<div class="page-head me-head"><div><p class="eyebrow" style="margin-bottom:6px">My application</p><h1>' + esc(job ? job.title : 'Application') + '</h1>' +
        '<p class="muted">' + esc(branch) + (job ? ' · ' + esc(job.type) : '') + ' · Applied ' + fmtDay(a.submittedAt) + '</p></div><div>' + U.stageBadge(a.stage) + '</div></div>' +
        '<div class="two-col">' +
          '<div class="stack" style="--stack:var(--s5)">' +
            '<section class="panel" aria-labelledby="status-h"><div class="panel-head"><h2 id="status-h">Status</h2></div><div class="panel-body"><ol class="tracker">' + tracker + '</ol></div></section>' +
            '<section class="panel" aria-labelledby="docs-h"><div class="panel-head"><h2 id="docs-h">Documents</h2><span class="small muted">' + verified + ' of ' + req.length + ' verified</span></div>' +
              '<div class="panel-body flush">' + docRows + '<div class="doc-foot"><p class="hint">Files are previewed in your browser only. In this demo nothing is uploaded or stored.</p></div></div></section>' +
          '</div>' +
          '<div class="stack" style="--stack:var(--s5)">' +
            '<section class="panel" aria-labelledby="msg-h"><div class="panel-head"><h2 id="msg-h">Messages</h2></div>' + msgHtml + '</section>' +
            interview + offer +
            '<section class="panel" aria-labelledby="tl-h"><div class="panel-head"><h2 id="tl-h">Timeline</h2></div><div class="panel-body">' + timelineHtml + '</div></section>' +
            (canWithdraw ? '<p class="withdraw-row"><button class="link-btn" type="button" id="withdraw-btn">Withdraw application</button></p>' : '') +
          '</div>' +
        '</div>';
      showThanks = false;

      /* wiring */
      wireDocInputs(main, (docId, meta) => {
        if (!meta || !meta.fileName) return;
        /* metadata only; `reason: undefined` clears an old flag reason and is dropped by JSON */
        S.setDocState(a.id, docId, 'uploaded', { fileName: meta.fileName, size: meta.size, type: meta.type, expiry: meta.expiry || undefined, reason: undefined });
        U.toast('Document added. HR will review it.', 'ok');
        render();
        const badge = main.querySelector('[data-doc="' + docId + '"] .badge');
        if (badge) { badge.setAttribute('tabindex', '-1'); badge.focus(); }
      }, docId => ((S.currentUser() || {}).docs || {})[docId], {
        expiryOnly: (docId, value) => { S.update(dd => { const ap = S.byId(dd.applicants, a.id); if (ap && ap.docs && ap.docs[docId]) ap.docs[docId].expiry = value; }); }
      });
      const acc = document.getElementById('offer-accept'), dec = document.getElementById('offer-decline'), wd = document.getElementById('withdraw-btn');
      if (acc) acc.addEventListener('click', async () => {
        const ok = await U.confirm({ title: 'Accept this offer?', body: S.money(a.offer.pay, a.offer.payUnit) + ', starting ' + fmtDay(a.offer.startDate) + '. HR will be told and your start date is confirmed.', okLabel: 'Accept offer' });
        if (!ok) return;
        S.updateApplicant(a.id, { offer: Object.assign({}, a.offer, { status: 'accepted', respondedAt: S.nowIso() }) });
        S.setStage(a.id, 'hired', 'Offer accepted by applicant');
        U.toast('Offer accepted. Welcome to the team.', 'ok'); render();
      });
      if (dec) dec.addEventListener('click', async () => {
        const ok = await U.confirm({ title: 'Decline this offer?', body: 'HR will be told. You can still be considered for other roles.', okLabel: 'Decline offer', danger: true });
        if (!ok) return;
        S.updateApplicant(a.id, { offer: Object.assign({}, a.offer, { status: 'declined', respondedAt: S.nowIso() }) });
        S.update(dd => { const ap = S.byId(dd.applicants, a.id); if (ap) ap.timeline.push({ at: S.nowIso(), text: 'Offer declined by applicant' }); });
        U.toast('Offer declined.'); render();
      });
      if (wd) wd.addEventListener('click', async () => {
        const ok = await U.confirm({ title: 'Withdraw your application?', body: 'Your application for ' + (job ? job.title : 'this role') + ' is closed and HR is told. You can apply again for another role.', okLabel: 'Withdraw', danger: true });
        if (!ok) return;
        S.setStage(a.id, 'withdrawn', 'Withdrawn by applicant');
        U.toast('Application withdrawn.'); render();
      });
    }
    render();
  }

  function boot() {
    if (page === 'index') renderIndex();
    else if (page === 'job') renderJob();
    else if (page === 'apply') renderApply();
    else if (page === 'me') renderMe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
