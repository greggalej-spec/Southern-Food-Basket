import { useSyncExternalStore } from "react";
import { daysUntil, docDisplayState, fmtDate, fmtDateTime, money, type DocDisplayState } from "@/lib/format";
import { assertCan } from "@/lib/access";
import { defaultLetter } from "@/lib/hr/outcome";
import { mail } from "@/lib/newsletter";
import { addMessage, audit, byId, currentEmployee, load, nowIso, session, setDocState, setStage, stageLabel, update, updateApplicant } from "@/lib/store";
import type { Applicant, ComplianceDoc, Employee, Job, KycDoc, LeaveRequest, Outcome, Seed, Session, Training } from "@/lib/types";

// The HR console's helpers and writes, ported from assets/js/hr.js. Reads take the data from useData(); writes go
// through lib/store.ts. Anything that calls daysUntil or docDisplayState reads the clock: call it after hydration.

export const MAIN_STAGES = ["submitted", "screening", "kyc", "interview", "offer", "hired"];
export const CLOSED_STAGES = ["not-selected", "withdrawn"];
/** "updates" is the Staff updates composer (components/admin/staff-updates-panel.tsx), shown with staff.updates. */
export const TABS = ["pipeline", "roles", "log", "people", "compliance", "resources", "updates"] as const;
export type HrTab = (typeof TABS)[number];
export const DRAWER_TABS = ["details", "documents", "notes", "messages", "timeline"] as const;
export type DrawerTab = (typeof DRAWER_TABS)[number];
export type ActionForm = "interview" | "decision" | null;

export const isActive = (a: Applicant) => !["hired", "not-selected", "withdrawn"].includes(a.stage);

/* ---------- tabs (#pipeline, #roles, #log, #people, #compliance, #resources, #updates) ---------- */
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

/* ---------- decisions (PRD 6.6, 8.3) ----------
   A decision reaches the applicant sealed: an e-mail and a card that say only "An update on your application". The
   letter is an HR message written at the same instant as the outcome; lib/hr/outcome.ts keeps it, and anything newer,
   out of the applicant's view until they open the card (outcome.openedAt). HR's own reason never leaves HR: it goes
   to the notes, not the letter, the timeline or the audit log. */

export type DecisionInput = {
  /** The letter, exactly as the applicant will read it. */
  message: string;
  /** HR only. Saved as an internal note. */
  reason?: string;
  /** Who signs the letter; defaults to the signed-in HR person. */
  from?: string;
};

export const UPDATE_SUBJECT = "There's an update on your application";

/** The notification e-mail. It names the job and says there is an update: never the outcome. */
export function updateMailBody(first: string, title: string, store: string) {
  return [
    "Hi " + first + ",",
    "There is an update on your application for " + title + (store ? " at " + store : "") + ".",
    "Sign in to your applicant page to read it, whenever you are ready.",
    "Southern Food Basket HR",
  ];
}

function decide(a: Applicant, job: Job | null, kind: Outcome["kind"], input: DecisionInput, offer?: { pay: number; payUnit: string; startDate: string }) {
  const s = session();
  assertCan(load(), s, "hr.pipeline", { branchId: job?.branchId });
  update((dd) => {
    const ap = byId(dd.applicants, a.id);
    if (!ap) return;
    const at = nowIso();
    const from = input.from || hrName(dd, s);
    const prev = ap.outcome;
    const resend = kind === "offer" && ap.stage === "offer";
    if (prev && !prev.openedAt) retractLetter(ap, prev, from);
    if (offer) ap.offer = { ...offer, sentAt: at, status: "sent" };
    ap.stage = kind === "offer" ? "offer" : "not-selected";
    ap.outcome = { kind, at };
    ap.messages.push({ at, from, text: input.message.trim() });
    const terms = offer ? money(offer.pay, offer.payUnit) + ", starting " + fmtDay(offer.startDate) : "";
    ap.timeline.push({ at, text: resend ? "Offer resent — " + terms : "Moved to " + stageLabel(dd, ap.stage) + (terms ? " — " + terms : "") });
    if (input.reason && input.reason.trim()) ap.notes.push({ at, author: from, text: "Decision reason (HR only): " + input.reason.trim() });
    const title = job ? job.title : "a job";
    mail(dd, {
      to: ap.email,
      kind: "transactional",
      subject: UPDATE_SUBJECT,
      body: updateMailBody(firstName(ap), title, job ? branchName(dd, job.branchId) : ""),
      action: { label: "Open your update", href: "/careers/me" },
    });
    audit(
      dd,
      s,
      "hr.decision",
      ap.name + " · " + title,
      (kind === "offer" ? (resend ? "Offer resent" : "Offer sent") + " (" + terms + ")" : "Not selected") +
        "; update e-mail sent" +
        (prev ? "; replaces the update of " + fmtDateTime(prev.at) : ""),
    );
  });
}

/** An unopened letter that is being replaced never reaches the applicant: HR keeps it as a note. */
function retractLetter(ap: Applicant, prev: Outcome, by: string) {
  const letter = ap.messages.find((m) => m.at === prev.at);
  if (!letter) return;
  ap.messages = ap.messages.filter((m) => m !== letter);
  ap.notes.push({ at: nowIso(), author: by, text: "Unopened letter of " + fmtDateTime(prev.at) + ", replaced before the applicant read it:\n\n" + letter.text });
}

function letterFor(d: Seed, a: Applicant, job: Job | null, kind: Outcome["kind"], from: string) {
  return defaultLetter(kind, { first: firstName(a), job: job ? job.title : "this", store: job ? branchName(d, job.branchId) : "", from, interviewed: !!a.interview });
}

/** Sends (or resends) an offer as a sealed update. Without a message, HR's template is used. */
export function sendOffer(d: Seed, a: Applicant, job: Job | null, pay: number, payUnit: string, startDate: string, input?: Partial<DecisionInput>) {
  const message = input?.message || letterFor(d, a, job, "offer", input?.from || hrName(d, session()));
  decide(a, job, "offer", { ...input, message }, { pay, payUnit, startDate });
}

/** Closes the application as not selected, as a sealed update. `reason` is HR's own and stays in the notes. */
export function markNotSelected(d: Seed, a: Applicant, job: Job | null, reason: string, input?: Partial<Omit<DecisionInput, "reason">>) {
  const message = input?.message || letterFor(d, a, job, "not-selected", input?.from || hrName(d, session()));
  decide(a, job, "not-selected", { ...input, message, reason });
}

/** The applicant opens their update. Sets openedAt once; opening again changes nothing. */
export function openOutcome(applicantId: string) {
  update((dd) => {
    const ap = byId(dd.applicants, applicantId);
    if (!ap || !ap.outcome || ap.outcome.openedAt) return;
    const at = nowIso();
    ap.outcome.openedAt = at;
    ap.timeline.push({ at, text: "Update opened by the applicant" });
    audit(dd, { role: "applicant", userId: applicantId }, "careers.update-opened", "Application update", "Opened by the applicant");
  });
}

/** Ported from the dashboard's own accept: the offer is accepted and the applicant moves to Hired. */
export function acceptOffer(applicantId: string) {
  update((dd) => {
    const ap = byId(dd.applicants, applicantId);
    if (!ap || !ap.offer) return;
    const at = nowIso();
    ap.offer = Object.assign({}, ap.offer, { status: "accepted", respondedAt: at });
    ap.stage = "hired";
    ap.timeline.push({ at, text: "Moved to " + stageLabel(dd, "hired") + " — Offer accepted by applicant" });
    audit(dd, { role: "applicant", userId: applicantId }, "careers.offer-accepted", "Job offer", "Accepted by the applicant");
  });
}

/** Declining closes the application (stage "withdrawn"), so HR's board shows it as closed. The reason is optional and
 *  goes to HR as a message from the applicant. */
export function declineOffer(applicantId: string, reason?: string) {
  update((dd) => {
    const ap = byId(dd.applicants, applicantId);
    if (!ap || !ap.offer) return;
    const at = nowIso();
    ap.offer = Object.assign({}, ap.offer, { status: "declined", respondedAt: at });
    ap.stage = "withdrawn";
    ap.timeline.push({ at, text: "Moved to " + stageLabel(dd, "withdrawn") + " — offer declined by applicant" });
    if (reason && reason.trim()) ap.messages.push({ at, from: ap.name, text: "Why I declined: " + reason.trim() });
    audit(dd, { role: "applicant", userId: applicantId }, "careers.offer-declined", "Job offer", "Declined by the applicant");
  });
}

/** Would moving to this stage withdraw the decision already sent? An offer holds through "hired"; a not-selected
 *  decision holds only while the stage is "not-selected". */
export function movesAwayFromDecision(a: Applicant, stage: string) {
  if (!a.outcome) return false;
  return a.outcome.kind === "offer" ? !["offer", "hired"].includes(stage) : stage !== "not-selected";
}

/** HR's stage list. Decisions are not made here (the Decision step makes them). Moving away from a decision
 *  withdraws it, and a letter the applicant has not opened is kept back from them. */
export function moveStage(a: Applicant, stage: string, who: string) {
  const s = session();
  const job = byId(load().jobs, a.jobId);
  assertCan(load(), s, "hr.pipeline", { branchId: job?.branchId });
  update((dd) => {
    const ap = byId(dd.applicants, a.id);
    if (!ap || ap.stage === stage) return;
    const at = nowIso();
    if (ap.outcome && movesAwayFromDecision(ap, stage)) {
      const prev = ap.outcome;
      if (!prev.openedAt) retractLetter(ap, prev, who);
      ap.timeline.push({ at, text: (prev.openedAt ? "Decision withdrawn by " : "Unopened decision withdrawn by ") + who });
      delete ap.outcome;
      audit(dd, s, "hr.decision-withdrawn", ap.name, (prev.kind === "offer" ? "Offer" : "Not selected") + " of " + fmtDateTime(prev.at) + (prev.openedAt ? ", already opened" : ", not opened"));
    }
    ap.stage = stage;
    ap.timeline.push({ at, text: "Moved to " + stageLabel(dd, stage) + " — by " + who });
  });
}

export function setJobStatus(jobId: string, status: Job["status"]) {
  update((dd) => {
    const j = byId(dd.jobs, jobId);
    if (j) j.status = status;
  });
}
