/* Southern Food Basket — mock data layer (no backend, demo only).
   Seed lives on window.SFB_DATA (data/seed.js). Any edits are kept in localStorage and
   overlaid on load. A newer seed version wins over an older local copy. File bytes are
   never stored: documents keep name, size, type, state and dates only. */
(function () {
  const KEY = 'sfb-data-v1';
  const SESSION_KEY = 'sfb-session-v1';

  function seed() {
    return window.SFB_DATA || { version: 0, settings: {} };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  let cache = null;
  function load(force) {
    if (cache && !force) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { cache = clone(seed()); return cache; }
      const local = JSON.parse(raw);
      if ((local.version || 0) < (seed().version || 0)) {
        localStorage.removeItem(KEY);
        cache = clone(seed());
      } else {
        cache = local;
      }
    } catch (e) {
      cache = clone(seed());
    }
    return cache;
  }
  function save(data) {
    cache = data || cache;
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* quota or private mode: demo keeps working in memory */ }
    return cache;
  }
  function update(fn) { const d = load(); fn(d); return save(d); }
  /* clears every key this site writes (data, session, application drafts, banner), by prefix */
  function reset() {
    try {
      [localStorage, sessionStorage].forEach(st => {
        for (let i = st.length - 1; i >= 0; i--) { const k = st.key(i); if (k && k.indexOf('sfb-') === 0) st.removeItem(k); }
      });
    } catch (e) {}
    cache = null;
  }

  /* money: one unit per number. money(12.99) -> "TTD 12.99"; money(12.99, 'lb') -> "TTD 12.99 / lb" */
  function money(v, per) {
    if (v == null || v === '') return '';
    const cur = (load().settings || {}).currency || 'TTD';
    const n = Number(v);
    const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return cur + ' ' + s + (per ? ' / ' + per : '');
  }

  /* session (demo roles only) */
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }
  function login(role, userId) {
    const s = { role, userId: userId || null, at: new Date().toISOString() };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function logout() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }
  /* requireRole(['hr']) redirects to the demo login when the session does not match. */
  function requireRole(roles, root) {
    const s = session();
    if (!s || (roles && roles.length && !roles.includes(s.role))) {
      const r = root || (document.documentElement.getAttribute('data-root') || './');
      /* keep the query and the tab hash so a deep link survives the demo sign-in */
      const next = encodeURIComponent(location.pathname.split('/').slice(-2).join('/') + location.search + location.hash);
      location.replace(r + 'portal/index.html?next=' + next);
      return null;
    }
    return s;
  }
  function currentUser() {
    const s = session(); if (!s) return null;
    const d = load();
    if (s.role === 'applicant') return byId(d.applicants, s.userId);
    if (s.role === 'employee' || s.role === 'hr') return byId(d.employees, s.userId);
    return null;
  }

  /* lookups */
  function byId(list, id) { return (list || []).find(x => x.id === id) || null; }
  function uid(prefix) { return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 8); }
  function nowIso() { return new Date().toISOString(); }

  function jobs(filter) {
    const d = load();
    return d.jobs.filter(j => {
      if (!filter) return true;
      if (filter.status && j.status !== filter.status) return false;
      if (filter.branchId && filter.branchId !== 'all' && j.branchId !== filter.branchId) return false;
      if (filter.dept && filter.dept !== 'all' && j.dept !== filter.dept) return false;
      return true;
    });
  }
  function applicantsFor(jobId) { return load().applicants.filter(a => !jobId || a.jobId === jobId); }

  function addApplicant(obj) {
    const a = Object.assign({
      id: uid('app'), stage: 'submitted', submittedAt: nowIso(), docs: {}, notes: [], messages: [],
      timeline: [{ at: nowIso(), text: 'Application submitted' }]
    }, obj);
    update(d => { d.applicants.unshift(a); });
    return a;
  }
  function updateApplicant(id, patch) {
    let out = null;
    update(d => { const a = byId(d.applicants, id); if (a) { Object.assign(a, patch); out = a; } });
    return out;
  }
  function setStage(id, stage, note) {
    return update(d => {
      const a = byId(d.applicants, id); if (!a) return;
      a.stage = stage;
      a.timeline.push({ at: nowIso(), text: 'Moved to ' + stageLabel(stage) + (note ? ' — ' + note : '') });
    });
  }
  function stageLabel(stage) {
    const s = (load().stages || []).find(x => x.id === stage);
    return s ? s.label : stage;
  }
  /* setDocState(applicantId, 'photo-id', 'uploaded', { fileName, size, type, expiry }) — never bytes */
  function setDocState(applicantId, docId, state, extra) {
    return update(d => {
      const a = byId(d.applicants, applicantId); if (!a) return;
      a.docs = a.docs || {};
      const prev = a.docs[docId] || {};
      a.docs[docId] = Object.assign({}, prev, extra || {}, { state, updatedAt: nowIso() });
      delete a.docs[docId].bytes; delete a.docs[docId].dataUrl;
      const doc = byId(d.kycDocs, docId);
      a.timeline.push({ at: nowIso(), text: (doc ? doc.name : docId) + ': ' + state + (extra && extra.reason ? ' — ' + extra.reason : '') });
    });
  }
  function addNote(applicantId, text, author) {
    return update(d => { const a = byId(d.applicants, applicantId); if (a) a.notes.push({ at: nowIso(), text, author: author || 'HR' }); });
  }
  function addMessage(applicantId, text, from) {
    return update(d => { const a = byId(d.applicants, applicantId); if (a) a.messages.push({ at: nowIso(), text, from: from || 'HR' }); });
  }
  /* which KYC docs a given applicant needs: the job's list, minus conditional ones they do not match */
  function requiredDocsFor(applicant) {
    const d = load();
    const job = byId(d.jobs, applicant.jobId);
    const ids = job ? job.kyc : d.kycDocs.map(x => x.id);
    return ids.map(id => byId(d.kycDocs, id)).filter(Boolean).filter(doc => {
      /* the apply form passes { nonNational }; stored applicants keep it under personal */
      if (doc.id === 'work-permit') return applicant.nonNational === true || !!(applicant.personal && applicant.personal.nonNational === true);
      return true;
    });
  }

  /* employees */
  function updateEmployee(id, fn) { return update(d => { const e = byId(d.employees, id); if (e) fn(e, d); }); }
  function requestLeave(employeeId, req) {
    const r = Object.assign({ id: uid('lv'), status: 'pending', requestedAt: nowIso() }, req);
    updateEmployee(employeeId, e => { e.leaveRequests = e.leaveRequests || []; e.leaveRequests.unshift(r); });
    return r;
  }
  /* approving leave moves its days into the used balance; un-approving moves them back */
  const LEAVE_KEY = { Annual: 'annualUsed', Sick: 'sickUsed', Casual: 'casualUsed' };
  function setLeaveStatus(employeeId, leaveId, status) {
    return updateEmployee(employeeId, e => {
      const r = (e.leaveRequests || []).find(x => x.id === leaveId); if (!r) return;
      const key = LEAVE_KEY[r.type], days = Number(r.days) || 0;
      if (key && e.leave) {
        if (r.status !== 'approved' && status === 'approved') e.leave[key] = (e.leave[key] || 0) + days;
        if (r.status === 'approved' && status !== 'approved') e.leave[key] = Math.max(0, (e.leave[key] || 0) - days);
      }
      r.status = status;
    });
  }
  /* a bare YYYY-MM-DD is a local calendar day, never UTC midnight */
  function parseDay(v) {
    if (v instanceof Date) return v;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) { const p = v.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
    return new Date(v);
  }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  /* inclusive calendar days: daysBetween('2026-12-22', '2026-12-24') -> 3 */
  function daysBetween(a, b) {
    const ms = startOfDay(parseDay(b)) - startOfDay(parseDay(a)); return Math.max(1, Math.round(ms / 86400000) + 1);
  }
  function setTrainingDone(employeeId, trainingId, done) {
    return updateEmployee(employeeId, e => { const t = (e.training || []).find(x => x.id === trainingId); if (t) { t.done = !!done; t.completedAt = done ? nowIso() : null; } });
  }
  /* employee compliance docs (food badge, ID, etc.) share the kycDocs vocabulary */
  function setEmployeeDoc(employeeId, docId, state, extra) {
    return updateEmployee(employeeId, e => {
      e.compliance = e.compliance || [];
      let c = e.compliance.find(x => x.docId === docId);
      if (!c) { c = { docId }; e.compliance.push(c); }
      Object.assign(c, extra || {}, { state, updatedAt: nowIso() });
      delete c.bytes; delete c.dataUrl;
    });
  }
  /* whole calendar days from today to the date: 0 = today, negative = past; stable all day long */
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const target = parseDay(dateStr); if (isNaN(target)) return null;
    return Math.round((startOfDay(target) - startOfDay(new Date())) / 86400000);
  }
  function requestSwap(employeeId, shiftDate, note) {
    const r = { id: uid('sw'), shiftDate, note: note || '', status: 'pending', requestedAt: nowIso() };
    updateEmployee(employeeId, e => { e.swapRequests = e.swapRequests || []; e.swapRequests.unshift(r); });
    return r;
  }

  window.SFBStore = {
    KEY, SESSION_KEY, load, save, update, reset, money,
    session, login, logout, requireRole, currentUser,
    byId, uid, nowIso, parseDay, startOfDay, jobs, applicantsFor, addApplicant, updateApplicant, setStage, stageLabel,
    setDocState, addNote, addMessage, requiredDocsFor,
    updateEmployee, requestLeave, setLeaveStatus, daysBetween, setTrainingDone, setEmployeeDoc, daysUntil, requestSwap
  };
})();
