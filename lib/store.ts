import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { sessionValid } from "./access";
import { SEED } from "./seed";
import type { Applicant, AuditEvent, DocRecord, DocState, Employee, LeaveRequest, LeaveStatus, Role, Seed, Session, Subscriber, SwapRequest } from "./types";

/* Mock data layer (no backend, demo only), ported from store.js. The seed is lib/seed.ts; this browser's edits are
   kept in localStorage and overlaid on load, and a newer seed version wins over an older local copy. File bytes are
   never stored: documents keep name, size, type, state and dates only.

   The seed comes in tiers. lib/seed.ts is public. The "members" and "staff" tiers (lib/seed-private.ts) join only
   when a page imports lib/private.ts or lib/members.ts, so the public pages' scripts never carry them. A tier's
   collections are merged by id into what the browser already holds, so a write made on a public page (a new
   application, a sign-up) survives the merge.

   React reads it through useSyncExternalStore: the server and the first client render see the seed, then the
   browser's copy. Every write replaces the data object, so components re-render. Read helpers take the data as
   their first argument (pass what useData() returned); write helpers load and save it themselves. */

export const KEY = "sfb-data-v1";
export const SESSION_KEY = "sfb-session-v1";

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

let cache: Seed | null = null;
let sessionCache: Session | null | undefined; // undefined = not read yet
const listeners = new Set<() => void>();
const tiers = new Map<string, Partial<Seed>>();
let base: Seed = SEED;

function emit() {
  listeners.forEach((l) => l());
}

type Rows = { id: string }[];

/* A sign-up made on a page without the mailing tier cannot see a seeded address, so it adds a second row for it.
   On merge the seeded row keeps its id and takes the sign-up only where subscribe() would have (an active or
   suppressed address stays as it is); the browser's row is dropped and its consent records follow the seeded one. */
function foldSubscribers(data: Seed, seeded: Subscriber[]) {
  const byEmail = new Map(seeded.map((r) => [r.email, r]));
  data.subscribers = (data.subscribers || []).filter((r) => {
    const t = byEmail.get(r.email);
    if (!t || t.id === r.id) return true;
    if (t.status !== "active" && t.status !== "suppressed") {
      Object.assign(t, { status: r.status, branches: r.branches, topics: r.topics, source: r.source, token: r.token, unsubscribedAt: r.unsubscribedAt });
    }
    (data.consents || []).forEach((c) => {
      if (c.subscriberId === r.id) c.subscriberId = t.id;
    });
    return false;
  });
}

/** Adds a tier's rows to data, keeping rows data already has (same id) as they are. */
function mergeTier(data: Seed, name: string, part: Partial<Seed>) {
  if (part.subscribers) foldSubscribers(data, part.subscribers);
  const out = data as unknown as Record<string, unknown>;
  for (const [k, rows] of Object.entries(part)) {
    const have = (out[k] as Rows | undefined) || [];
    const ids = new Set(have.map((r) => r.id));
    out[k] = [...have, ...(rows as Rows).filter((r) => !ids.has(r.id))];
  }
  data._tiers = [...(data._tiers || []), name];
  return data;
}

/** Joins a private tier to the data. Called once, at import, by lib/private.ts and lib/members.ts. */
export function registerTier(name: string, part: Partial<Seed>) {
  if (tiers.has(name)) return;
  tiers.set(name, part);
  base = mergeTier(clone(base), name, clone(part));
  if (cache && !(cache._tiers || []).includes(name)) save(mergeTier(clone(cache), name, clone(part)));
}

// Another tab wrote (or reset) the demo: drop what this tab holds and re-read.
function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== KEY && e.key !== SESSION_KEY) return;
  cache = null;
  sessionCache = undefined;
  emit();
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

/** The current data. On the server this is the seed itself: read it, never change it. */
export function load(): Seed {
  if (typeof window === "undefined") return base;
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return (cache = clone(base));
    const local = JSON.parse(raw) as Seed;
    if ((local.version || 0) < SEED.version) {
      localStorage.removeItem(KEY);
      cache = clone(base);
    } else {
      let c = local;
      // Tiers this page has that the saved copy has not merged yet (it was saved on a page without them).
      tiers.forEach((part, name) => {
        if (!(c._tiers || []).includes(name)) c = mergeTier(c, name, clone(part));
      });
      cache = c;
    }
  } catch {
    cache = clone(base);
  }
  return cache;
}

export function save(data: Seed) {
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode: the demo keeps working in memory */
  }
  emit();
  return data;
}

/** Change a copy of the data and save it. */
export function update(fn: (d: Seed) => void) {
  const d = clone(load());
  fn(d);
  return save(d);
}

/** Clears every key this site writes (data, session, application drafts, banner), by prefix. */
export function reset() {
  try {
    [localStorage, sessionStorage].forEach((st) => {
      for (let i = st.length - 1; i >= 0; i--) {
        const k = st.key(i);
        if (k && k.startsWith("sfb-")) st.removeItem(k);
      }
    });
  } catch {}
  cache = null;
  sessionCache = undefined;
  emit();
}

/* session (demo roles only) */
export function session(): Session | null {
  if (typeof window === "undefined") return null;
  if (sessionCache === undefined) {
    try {
      sessionCache = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      sessionCache = null;
    }
  }
  return sessionCache ?? null;
}

export function login(role: Role, userId?: string | null) {
  const s: Session = { role, userId: userId || null, at: nowIso() };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {}
  sessionCache = s;
  emit();
  return s;
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  sessionCache = null;
  emit();
}

/* hooks */
const serverData = () => base;

export function useData(): Seed {
  return useSyncExternalStore(subscribe, load, serverData);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, session, () => null);
}

const noSubscribe = () => () => {};
/** False on the server and during hydration, true after. Gate anything that reads the clock or the session on it. */
export function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

const NEXT_BASE = "http://sfb.invalid";

/** ?next= is honoured only when it is a path inside the site. It is parsed, not pattern-matched: the URL parser drops
 *  tabs and newlines (`/\t/evil.example`) and resolves dot segments (`/.//evil.example` becomes `//evil.example`), and
 *  either would leave a protocol-relative link to another site. */
export function safeNext(next: string | null | undefined) {
  if (!next || next[0] !== "/") return null;
  let u: URL;
  try {
    u = new URL(next, NEXT_BASE);
  } catch {
    return null;
  }
  if (u.origin !== NEXT_BASE || u.pathname.startsWith("//")) return null;
  return u.pathname + u.search + u.hash;
}

/** The session when it has one of these roles and is still valid (a staff role needs a live grant: lib/access.ts).
 *  Otherwise sends the visitor to the sign-in page (the staff one unless signIn says otherwise), keeping the query
 *  and the tab hash so a deep link survives it, and returns null. Null until hydrated, so pages prerender empty. */
export function useRequireRole(roles: Role[], signIn = "/portal"): Session | null {
  const s = useSession();
  const d = useData();
  const hydrated = useHydrated();
  const router = useRouter();
  const ok = !!s && (!roles.length || roles.includes(s.role)) && sessionValid(d, s);
  useEffect(() => {
    if (!hydrated || ok) return;
    router.replace(signIn + "?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
  }, [hydrated, ok, router, signIn]);
  return hydrated && ok ? s : null;
}

/* audit log */
const AUDIT_CAP = 400;

/** Appends to the audit log inside an update(). Never pass a full code, an e-mail address or a document. */
export function audit(d: Seed, s: Pick<Session, "role" | "userId"> | null, action: string, target: string, detail: string, ok = true) {
  const ev: AuditEvent = { id: uid("au"), at: nowIso(), actor: s?.userId || "guest", role: s?.role || "guest", action, target, detail, ok };
  d.audit = [ev, ...(d.audit || [])].slice(0, AUDIT_CAP);
}

export function currentApplicant(d: Seed, s: Session | null): Applicant | null {
  return s?.role === "applicant" ? byId(d.applicants, s.userId) : null;
}

export function currentEmployee(d: Seed, s: Session | null): Employee | null {
  return s && s.role !== "applicant" && s.role !== "customer" ? byId(d.employees, s.userId) : null;
}

/* lookups */
export function byId<T extends { id: string }>(list: T[] | null | undefined, id: string | null | undefined): T | null {
  return (list || []).find((x) => x.id === id) || null;
}

/** True when saving `next` over `cur` would change something. Screens save before a test send, so an untouched
 *  draft must not log an edit. */
export function differs<T extends object>(cur: T, next: Partial<T>) {
  return (Object.keys(next) as (keyof T)[]).some((k) => JSON.stringify(cur[k]) !== JSON.stringify(next[k]));
}

/** A random id from crypto, not Math.random, so ids that end up in links (tokens, claims) cannot be guessed. */
export function uid(prefix = "id", bytes = 6) {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return prefix + "-" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function nowIso() {
  return new Date().toISOString();
}

export function jobs(d: Seed, filter?: { status?: string; branchId?: string; dept?: string }) {
  return d.jobs.filter((j) => {
    if (!filter) return true;
    if (filter.status && j.status !== filter.status) return false;
    if (filter.branchId && filter.branchId !== "all" && j.branchId !== filter.branchId) return false;
    if (filter.dept && filter.dept !== "all" && j.dept !== filter.dept) return false;
    return true;
  });
}

export function applicantsFor(d: Seed, jobId?: string) {
  return d.applicants.filter((a) => !jobId || a.jobId === jobId);
}

export function stageLabel(d: Seed, stage: string) {
  return d.stages.find((x) => x.id === stage)?.label ?? stage;
}

/** Which KYC docs an applicant needs: the job's list, minus the work permit unless they are not a national. The
 *  apply form passes { nonNational }; stored applicants keep it under personal. */
export function requiredDocsFor(d: Seed, applicant: { jobId: string; nonNational?: boolean; personal?: { nonNational?: boolean } }) {
  const job = byId(d.jobs, applicant.jobId);
  const ids = job ? job.kyc : d.kycDocs.map((x) => x.id);
  return ids
    .map((id) => byId(d.kycDocs, id))
    .filter((doc) => doc !== null)
    .filter((doc) => doc.id !== "work-permit" || applicant.nonNational === true || applicant.personal?.nonNational === true);
}

/* applicants */
type NewApplicant = Omit<Applicant, "id" | "stage" | "submittedAt" | "docs" | "notes" | "messages" | "timeline"> & Partial<Applicant>;

export function addApplicant(obj: NewApplicant) {
  const a: Applicant = {
    id: uid("app"),
    stage: "submitted",
    submittedAt: nowIso(),
    docs: {},
    notes: [],
    messages: [],
    timeline: [{ at: nowIso(), text: "Application submitted" }],
    ...obj,
  };
  update((d) => {
    d.applicants.unshift(a);
  });
  return a;
}

export function updateApplicant(id: string, patch: Partial<Applicant>) {
  let out: Applicant | null = null;
  update((d) => {
    const a = byId(d.applicants, id);
    if (a) out = Object.assign(a, patch);
  });
  return out as Applicant | null;
}

export function setStage(id: string, stage: string, note?: string) {
  return update((d) => {
    const a = byId(d.applicants, id);
    if (!a) return;
    a.stage = stage;
    a.timeline.push({ at: nowIso(), text: "Moved to " + stageLabel(d, stage) + (note ? " — " + note : "") });
  });
}

type DocExtra = Partial<Omit<DocRecord, "state" | "updatedAt">>;

/** setDocState(applicantId, "photo-id", "uploaded", { fileName, size, type, expiry }): never bytes. */
export function setDocState(applicantId: string, docId: string, state: DocState, extra?: DocExtra) {
  return update((d) => {
    const a = byId(d.applicants, applicantId);
    if (!a) return;
    a.docs = a.docs || {};
    a.docs[docId] = stripBytes({ ...a.docs[docId], ...extra, state, updatedAt: nowIso() });
    const doc = byId(d.kycDocs, docId);
    a.timeline.push({ at: nowIso(), text: (doc ? doc.name : docId) + ": " + state + (extra?.reason ? " — " + extra.reason : "") });
  });
}

export function addNote(applicantId: string, text: string, author = "HR") {
  return update((d) => {
    byId(d.applicants, applicantId)?.notes.push({ at: nowIso(), text, author });
  });
}

export function addMessage(applicantId: string, text: string, from = "HR") {
  return update((d) => {
    byId(d.applicants, applicantId)?.messages.push({ at: nowIso(), text, from });
  });
}

/* employees */
export function updateEmployee(id: string, fn: (e: Employee, d: Seed) => void) {
  return update((d) => {
    const e = byId(d.employees, id);
    if (e) fn(e, d);
  });
}

export function requestLeave(employeeId: string, req: Omit<LeaveRequest, "id" | "status" | "requestedAt">) {
  const r: LeaveRequest = { id: uid("lv"), status: "pending", requestedAt: nowIso(), ...req };
  updateEmployee(employeeId, (e) => {
    e.leaveRequests = e.leaveRequests || [];
    e.leaveRequests.unshift(r);
  });
  return r;
}

/** Approving leave moves its days into the used balance; un-approving moves them back. */
const LEAVE_KEY = { Annual: "annualUsed", Sick: "sickUsed", Casual: "casualUsed" } as const;

export function setLeaveStatus(employeeId: string, leaveId: string, status: LeaveStatus) {
  return updateEmployee(employeeId, (e) => {
    const r = (e.leaveRequests || []).find((x) => x.id === leaveId);
    if (!r) return;
    const key = LEAVE_KEY[r.type];
    const days = Number(r.days) || 0;
    if (key && e.leave) {
      if (r.status !== "approved" && status === "approved") e.leave[key] = (e.leave[key] || 0) + days;
      if (r.status === "approved" && status !== "approved") e.leave[key] = Math.max(0, (e.leave[key] || 0) - days);
    }
    r.status = status;
  });
}

export function setTrainingDone(employeeId: string, trainingId: string, done: boolean) {
  return updateEmployee(employeeId, (e) => {
    const t = (e.training || []).find((x) => x.id === trainingId);
    if (t) {
      t.done = !!done;
      t.completedAt = done ? nowIso() : null;
    }
  });
}

/** Employee compliance docs (food badge, ID, etc.) share the kycDocs vocabulary. */
export function setEmployeeDoc(employeeId: string, docId: string, state: DocState, extra?: DocExtra) {
  return updateEmployee(employeeId, (e) => {
    e.compliance = e.compliance || [];
    let c = e.compliance.find((x) => x.docId === docId);
    if (!c) {
      c = { docId, state };
      e.compliance.push(c);
    }
    Object.assign(c, extra, { state, updatedAt: nowIso() });
    stripBytes(c);
  });
}

export function requestSwap(employeeId: string, shiftDate: string, note?: string) {
  const r: SwapRequest = { id: uid("sw"), shiftDate, note: note || "", status: "pending", requestedAt: nowIso() };
  updateEmployee(employeeId, (e) => {
    e.swapRequests = e.swapRequests || [];
    e.swapRequests.unshift(r);
  });
  return r;
}

// A file reader's result must never reach the store, whatever a caller passes in.
function stripBytes<T extends object>(o: T): T {
  delete (o as { bytes?: unknown }).bytes;
  delete (o as { dataUrl?: unknown }).dataUrl;
  return o;
}
