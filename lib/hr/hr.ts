import { useSyncExternalStore } from "react";
import { daysUntil, docDisplayState, fmtDate, fmtDateTime, money, type DocDisplayState } from "@/lib/format";
import { addMessage, byId, currentEmployee, nowIso, setDocState, setStage, update, updateApplicant } from "@/lib/store";
import type { Applicant, ComplianceDoc, Employee, Job, KycDoc, LeaveRequest, Seed, Session, Training } from "@/lib/types";

// The HR console's helpers and writes, ported from assets/js/hr.js. Reads take the data from useData(); writes go
// through lib/store.ts. Anything that calls daysUntil or docDisplayState reads the clock: call it after hydration.

export const MAIN_STAGES = ["submitted", "screening", "kyc", "interview", "offer", "hired"];
export const CLOSED_STAGES = ["not-selected", "withdrawn"];
export const TABS = ["pipeline", "roles", "compliance"] as const;
export type HrTab = (typeof TABS)[number];
export const DRAWER_TABS = ["details", "documents", "notes", "messages", "timeline"] as const;
export type DrawerTab = (typeof DRAWER_TABS)[number];
export type ActionForm = "interview" | "offer" | null;

export const isActive = (a: Applicant) => !["hired", "not-selected", "withdrawn"].includes(a.stage);

/* ---------- tabs (#pipeline, #roles, #compliance) ---------- */
function currentTab(): HrTab {
  const h = location.hash.replace("#", "");
  return (TABS as readonly string[]).includes(h) ? (h as HrTab) : "pipeline";
}

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/** The tab named by the hash. The server and the first client render show the pipeline, as the static HTML did. */
export function useHrTab() {
  return useSyncExternalStore(subscribeHash, currentTab, () => "pipeline" as HrTab);
}

/** location.hash = id, so the sidebar links and the tabs share one history and hashchange drives both. */
export function goToTab(id: HrTab) {
  location.hash = id;
}

/* ---------- helpers ---------- */
export function branchName(d: Seed, id: string | null | undefined) {
  const b = byId(d.branches, id);
  return b ? b.name : "";
}

export function fmtDay(v: string | null | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? fmtDate(v + "T12:00:00") : fmtDate(v);
}

export function hrName(d: Seed, s: Session | null) {
  const u = currentEmployee(d, s);
  return (u && u.name) || "HR";
}

export function jobLine(d: Seed, a: Applicant) {
  const j = byId(d.jobs, a.jobId);
  return j ? j.title + " · " + branchName(d, j.branchId) : "Role removed";
}

export function firstName(a: Applicant) {
  return a.name.split(" ")[0];
}

export type DotClass = "ok" | "warn" | "bad" | "";

export function dotClass(state: DocDisplayState): DotClass {
  if (state === "verified") return "ok";
  if (state === "uploaded" || state === "expiring") return "warn";
  if (state === "flagged" || state === "expired") return "bad";
  return "";
}

export function daysLabel(dateStr: string | null | undefined) {
  const n = daysUntil(dateStr);
  if (n == null) return "";
  if (n < 0) return Math.abs(n) + (n === -1 ? " day ago" : " days ago");
  if (n === 0) return "today";
  return "in " + n + (n === 1 ? " day" : " days");
}

export function docName(d: Seed, docId: string) {
  const doc = byId(d.kycDocs, docId);
  return doc ? doc.name : docId;
}

/* ---------- compliance data (also feeds the stats) ---------- */
export type DocAlert = { e: Employee; c: ComplianceDoc; state: DocDisplayState; doc: KycDoc | null };
export type TrainingDue = { e: Employee; t: Training; days: number };
export type LeavePending = { e: Employee; r: LeaveRequest };

const DOC_ORDER: DocDisplayState[] = ["expired", "flagged", "missing", "uploaded", "expiring"];

export function complianceRows(d: Seed) {
  const docs: DocAlert[] = [];
  const training: TrainingDue[] = [];
  const leave: LeavePending[] = [];
  (d.employees || []).forEach((e) => {
    (e.compliance || []).forEach((c) => {
      const state = docDisplayState(c);
      if (["expired", "expiring", "missing", "uploaded", "flagged"].includes(state)) docs.push({ e, c, state, doc: byId(d.kycDocs, c.docId) });
    });
    (e.training || []).forEach((t) => {
      if (t.done || !t.due) return;
      const n = daysUntil(t.due);
      if (n != null && n <= 30) training.push({ e, t, days: n });
    });
    (e.leaveRequests || []).forEach((r) => {
      if (r.status === "pending") leave.push({ e, r });
    });
  });
  docs.sort((x, y) => DOC_ORDER.indexOf(x.state) - DOC_ORDER.indexOf(y.state));
  training.sort((x, y) => x.days - y.days);
  return { docs, training, leave, total: docs.length + training.length + leave.length };
}

export function activeFor(d: Seed, jobId: string) {
  return d.applicants.filter((a) => a.jobId === jobId && isActive(a)).length;
}

/* ---------- writes ---------- */
export function verifyDoc(applicantId: string, docId: string) {
  setDocState(applicantId, docId, "verified", { reason: undefined });
}

export function flagDoc(d: Seed, applicantId: string, docId: string, reason: string) {
  setDocState(applicantId, docId, "flagged", { reason });
  addMessage(applicantId, docName(d, docId) + ": " + reason, "HR");
}

export function scheduleInterview(a: Applicant, at: string, where: string, who: string) {
  updateApplicant(a.id, { interview: { at, where, with: who } });
  if (a.stage !== "interview") setStage(a.id, "interview", "Interview scheduled for " + fmtDateTime(at));
  else
    update((dd) => {
      const ap = byId(dd.applicants, a.id);
      if (ap) ap.timeline.push({ at: nowIso(), text: "Interview rescheduled for " + fmtDateTime(at) });
    });
  addMessage(a.id, "Hi " + firstName(a) + ", your interview is on " + fmtDateTime(at) + " at " + where + " with " + who + ". Bring your original documents.", "HR");
}

export function sendOffer(d: Seed, a: Applicant, job: Job | null, pay: number, payUnit: string, startDate: string) {
  updateApplicant(a.id, { offer: { pay, payUnit, startDate, sentAt: nowIso(), status: "sent" } });
  if (a.stage !== "offer") setStage(a.id, "offer", "Offer sent: " + money(pay, payUnit));
  else
    update((dd) => {
      const ap = byId(dd.applicants, a.id);
      if (ap) ap.timeline.push({ at: nowIso(), text: "Offer resent: " + money(pay, payUnit) });
    });
  addMessage(
    a.id,
    "Hi " + firstName(a) + ", we would like to offer you the " + (job ? job.title : "role") + (job ? " role at " + branchName(d, job.branchId) : "") + ": " + money(pay, payUnit) + ", starting " + fmtDay(startDate) + ". Accept or decline from your dashboard.",
    "HR",
  );
}

export function markNotSelected(a: Applicant, job: Job | null, reason: string) {
  setStage(a.id, "not-selected", reason || "no reason given");
  addMessage(
    a.id,
    "Thank you for applying for " + (job ? job.title : "this role") + ". We have not taken your application further" + (reason ? ": " + reason : ".") + (reason && !/[.!?]$/.test(reason) ? "." : "") + " We will keep your details on file for six months.",
    "HR",
  );
}

export function setJobStatus(jobId: string, status: Job["status"]) {
  update((dd) => {
    const j = byId(dd.jobs, jobId);
    if (j) j.status = status;
  });
}
