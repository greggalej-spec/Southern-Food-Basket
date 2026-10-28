import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { SEED } from "./seed";
import type { Applicant, DocRecord, DocState, Employee, LeaveRequest, LeaveStatus, Role, Seed, Session, SwapRequest } from "./types";

/* Mock data layer (no backend, demo only), ported from store.js. The seed is lib/seed.ts; this browser's edits are
   kept in localStorage and overlaid on load, and a newer seed version wins over an older local copy. File bytes are
   never stored: documents keep name, size, type, state and dates only.

   React reads it through useSyncExternalStore: the server and the first client render see the seed, then the
   browser's copy. Every write replaces the data object, so components re-render. Read helpers take the data as
   their first argument (pass what useData() returned); write helpers load and save it themselves. */

export const KEY = "sfb-data-v1";
export const SESSION_KEY = "sfb-session-v1";

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o));

let cache: Seed | null = null;
let sessionCache: Session | null | undefined; // undefined = not read yet
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
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
  if (typeof window === "undefined") return SEED;
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return (cache = clone(SEED));
    const local = JSON.parse(raw) as Seed;
    if ((local.version || 0) < SEED.version) {
      localStorage.removeItem(KEY);
      cache = clone(SEED);
    } else {
      cache = local;
    }
  } catch {
    cache = clone(SEED);
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
export function useData(): Seed {
  return useSyncExternalStore(subscribe, load, () => SEED);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, session, () => null);
}

const noSubscribe = () => () => {};
/** False on the server and during hydration, true after. Gate anything that reads the clock or the session on it. */
export function useHydrated() {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

/** ?next= is honoured only when it is a plain path inside the site. */
export function safeNext(next: string | null | undefined) {
  return next && /^\/(?![/\\])/.test(next) ? next : null;
}

/** The session when it has one of these roles. Otherwise sends the visitor to the demo sign-in, keeping the query
 *  and the tab hash so a deep link survives it, and returns null. Null until hydrated, so pages prerender empty. */
export function useRequireRole(roles: Role[]): Session | null {
  const s = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  const ok = !!s && (!roles.length || roles.includes(s.role));
  useEffect(() => {
    if (!hydrated || ok) return;
    router.replace("/portal?next=" + encodeURIComponent(location.pathname + location.search + location.hash));
  }, [hydrated, ok, router]);
  return hydrated && ok ? s : null;
}

export function currentApplicant(d: Seed, s: Session | null): Applicant | null {
  return s?.role === "applicant" ? byId(d.applicants, s.userId) : null;
}

export function currentEmployee(d: Seed, s: Session | null): Employee | null {
  return s && s.role !== "applicant" ? byId(d.employees, s.userId) : null;
}

/* lookups */
export function byId<T extends { id: string }>(list: T[] | null | undefined, id: string | null | undefined): T | null {
  return (list || []).find((x) => x.id === id) || null;
}

export function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2, 8);
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
