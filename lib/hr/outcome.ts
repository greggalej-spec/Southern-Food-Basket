import { CLOSED_STAGES } from "@/lib/careers/helpers";
import { DOC_STATE_PLAIN, STAGE_COPY, stageIdForLabel } from "@/lib/hr/plain";
import { byId, requiredDocsFor } from "@/lib/store";
import type { Applicant, DocState, Message, Outcome, Seed, TimelineEntry } from "@/lib/types";

/* What an applicant sees of an HR decision, and nothing more. Read-only helpers shared by the applicant dashboard and
   HR's preview, so the preview is the same page the applicant gets.

   The seal: while an outcome is not opened, everything dated at or after outcome.at (messages and timeline entries)
   stays out of the applicant's view, and the tracker shows a neutral "Decision" step. Offer and not-selected look the
   same until the applicant opens the update. The letter itself is the HR message sent at the same instant as the
   outcome (lib/hr/hr.ts writes both with one timestamp). */

/** Demo retention for a closed application and its documents. The store sets the real period. */
export const RETENTION_DAYS = 180;

export const DECISION_STAGES = ["offer", "not-selected"];

const t = (iso: string | null | undefined) => {
  const n = new Date(iso || "").getTime();
  return isNaN(n) ? 0 : n;
};

export const isSealed = (a: Applicant) => !!a.outcome && !a.outcome.openedAt;

/** The HR letter that came with the decision, if one was written with it. Seeded decisions have none. */
export function outcomeLetter(a: Applicant): Message | null {
  const o = a.outcome;
  if (!o) return null;
  return (a.messages || []).find((m) => m.at === o.at) || null;
}

/** "Faith" from "Faith"; null when the sender is just "HR". */
export function senderFirst(from: string | null | undefined) {
  const f = String(from || "").trim();
  if (!f || f === "HR") return null;
  return f.split(" ")[0];
}

/** "Faith from HR" or "the HR team". */
export function hrWho(from: string | null | undefined) {
  const first = senderFirst(from);
  return first ? first + " from HR" : "the HR team";
}

export const firstNameOf = (name: string) => String(name || "").split(" ")[0];

/** HR's starting text for the letter. HR edits it before sending; the applicant sees exactly what HR sends. */
export function defaultLetter(kind: Outcome["kind"], p: { first: string; job: string; store: string; from: string; interviewed: boolean }) {
  const named = !!senderFirst(p.from);
  const sign = (named ? p.from + "\n" : "") + "HR, Southern Food Basket";
  const me = named ? "me" : "us";
  if (kind === "offer")
    return [
      "Hi " + p.first + ",",
      (p.interviewed ? "Thank you for coming in to meet us. " : "Thank you for applying. ") +
        "We would like to offer you the " +
        p.job +
        " job" +
        (p.store ? " at our " + p.store + " store" : "") +
        ".",
      "The pay, the start date and what happens next are below. Take your time to read them, and if anything is unclear, call or write to " + me + " before you decide.",
      sign,
    ].join("\n\n");
  return [
    "Hi " + p.first + ",",
    "We have read your application carefully, and we have decided not to offer you the " + p.job + " job" + (p.store ? " at " + p.store : "") + ".",
    "We know this is not the news you hoped for. If you would like to talk it through, call or write to " + me + ".",
    sign,
  ].join("\n\n");
}

/** Everything the decision card shows. `draft` lets HR's preview show a decision before it is sent. */
export interface OutcomeView {
  kind: Outcome["kind"];
  at: string;
  openedAt?: string;
  from: string;
  letter: string;
  first: string;
  jobTitle: string;
  store: string;
  storeAddress: string;
  jobType: string;
  offer: { pay: number; payUnit: string; startDate: string; status: string; respondedAt?: string } | null;
  bring: string[];
  others: { id: string; title: string; store: string; dept: string }[];
  deleteOn: string;
  contact: { email: string; phone: string };
}

export type OutcomeDraft = {
  kind: Outcome["kind"];
  at: string;
  from: string;
  letter: string;
  offer?: { pay: number; payUnit: string; startDate: string };
};

export function outcomeView(d: Seed, a: Applicant, draft?: OutcomeDraft): OutcomeView | null {
  const o = draft ? { kind: draft.kind, at: draft.at } : a.outcome;
  if (!o) return null;
  const job = byId(d.jobs, a.jobId);
  const branch = job ? byId(d.branches, job.branchId) : null;
  const store = branch ? branch.name : "";
  const letterMsg = draft ? null : outcomeLetter(a);
  const from = draft ? draft.from : letterMsg?.from || "HR";
  const jobTitle = job ? job.title : "this";
  const letter = draft
    ? draft.letter
    : letterMsg?.text || defaultLetter(o.kind, { first: firstNameOf(a.name), job: jobTitle, store, from, interviewed: !!a.interview });
  const src = draft ? draft.offer : a.offer;
  const offer = src
    ? {
        pay: src.pay,
        payUnit: src.payUnit,
        startDate: src.startDate,
        status: draft ? "sent" : a.offer?.status || "sent",
        respondedAt: draft ? undefined : a.offer?.respondedAt,
      }
    : null;
  const others = d.jobs
    .filter((j) => j.status === "open" && j.id !== a.jobId && job && (j.branchId === job.branchId || j.dept === job.dept))
    .map((j) => ({ id: j.id, title: j.title, store: byId(d.branches, j.branchId)?.name || "", dept: j.dept }));
  return {
    kind: o.kind,
    at: o.at,
    openedAt: draft ? undefined : a.outcome?.openedAt,
    from,
    letter,
    first: firstNameOf(a.name),
    jobTitle,
    store,
    storeAddress: branch ? branch.address : "",
    jobType: job ? job.type : "",
    offer,
    bring: requiredDocsFor(d, a).map((doc) => doc.name),
    others,
    deleteOn: new Date(t(o.at) + RETENTION_DAYS * 86400000).toISOString(),
    contact: { email: d.settings.careersEmail, phone: d.settings.phone },
  };
}

/* ---------- the applicant's messages and timeline ---------- */

/** Messages the applicant may read now: anything from the decision on waits until the update is opened. */
export function applicantMessages(a: Applicant): Message[] {
  const o = a.outcome;
  const list = a.messages || [];
  if (!o || o.openedAt) return list;
  const from = t(o.at);
  return list.filter((m) => t(m.at) < from);
}

const MOVED = /^Moved to (.+?)(?: — (.*))?$/;
const DOC = /^(.+?): (missing|uploaded|verified|flagged|expired)(?: — (.*))?$/;

/** One timeline line in the applicant's words, or null to leave it out. */
function plainEntry(d: Seed, a: Applicant, e: TimelineEntry): string | null {
  const text = e.text || "";
  const opened = !!a.outcome?.openedAt;
  const m = MOVED.exec(text);
  if (m) {
    const id = stageIdForLabel(d, m[1]);
    const note = (m[2] || "").toLowerCase();
    if (!id) return text;
    // A decision is shown once its update is opened. Without an outcome (older data) only the current one shows.
    if (DECISION_STAGES.includes(id) && !(a.outcome ? opened : a.stage === id)) return null;
    if (id === "screening") return "Your application is under review";
    if (id === "kyc") return "Document check started";
    if (id === "interview") return "Moved to the interview stage";
    if (id === "offer") return "Offer made";
    if (id === "not-selected") return "Decision: application closed";
    if (id === "hired") return note.includes("accepted by applicant") ? "You accepted the offer" : "Hired";
    if (id === "withdrawn") return note.includes("declined") ? "You declined the offer. This application is closed." : "Application withdrawn";
    return "Moved to " + (STAGE_COPY[id]?.label || m[1]);
  }
  if (/^Offer resent/.test(text)) return opened ? "Offer updated" : null;
  if (text === "Update opened by the applicant") return "You opened the update";
  if (/^Unopened decision withdrawn/.test(text)) return null;
  if (/^Decision withdrawn/.test(text)) return "HR reopened your application";
  if (text === "Offer declined by applicant") return "You declined the offer";
  if (text === "Application submitted") return "Application sent";
  const doc = DOC.exec(text);
  if (doc) {
    const label = DOC_STATE_PLAIN[doc[2] as DocState]?.label || doc[2];
    return doc[1] + ": " + label.toLowerCase() + (doc[2] === "flagged" && doc[3] ? " — " + doc[3] : "");
  }
  return text;
}

/** The applicant's timeline, newest first, in plain words. While sealed, one neutral line stands for the decision. */
export function applicantTimeline(d: Seed, a: Applicant): TimelineEntry[] {
  const o = a.outcome;
  const sealed = isSealed(a);
  const from = o ? t(o.at) : 0;
  const out: TimelineEntry[] = [];
  (a.timeline || []).forEach((e) => {
    if (sealed && t(e.at) >= from) return;
    const text = plainEntry(d, a, e);
    if (text) out.push({ at: e.at, text });
  });
  if (sealed && o) out.push({ at: o.at, text: "HR sent you an update on your application" });
  return out.sort((x, y) => t(y.at) - t(x.at));
}

/* ---------- the applicant's tracker ---------- */

export type StepState = "done" | "current" | "todo" | "skipped" | "closed";
export interface Step {
  id: string;
  label: string;
  hint: string;
  state: StepState;
  at?: string | null;
}

const PRE = ["submitted", "screening", "kyc", "interview"];

/** The stage steps the applicant sees: four steps to the interview, then "Decision" and "Starting work". While an
 *  update is sealed, the decision step only says one is waiting; a closed application ends on one neutral row. */
export function applicantSteps(d: Seed, a: Applicant): Step[] {
  const o = a.outcome;
  const sealed = isSealed(a);
  const from = o ? t(o.at) : Infinity;
  const reached = new Map<string, string>([["submitted", a.submittedAt]]);
  (a.timeline || []).forEach((e) => {
    if (sealed && t(e.at) >= from) return;
    const m = MOVED.exec(e.text || "");
    const id = m ? stageIdForLabel(d, m[1]) : null;
    if (id && !reached.has(id)) reached.set(id, e.at);
  });
  const stage = a.stage;
  const declined = a.offer?.status === "declined";
  const mode = sealed
    ? "waiting"
    : stage === "hired"
      ? "hired"
      : stage === "offer"
        ? "offer"
        : CLOSED_STAGES.includes(stage)
          ? "closed"
          : "active";
  const idx = PRE.indexOf(stage);
  const steps: Step[] = PRE.map((id, i) => {
    const c = STAGE_COPY[id];
    let state: StepState;
    if (mode === "active") state = i < idx ? "done" : i === idx ? "current" : "todo";
    else state = reached.has(id) ? "done" : "skipped";
    return { id, label: c.label, hint: c.hint, state, at: state === "done" || state === "current" ? reached.get(id) || null : null };
  });
  if (mode === "closed") {
    const closedAt = reached.get(stage) || o?.at || null;
    if (stage === "withdrawn")
      steps.push({
        id: "withdrawn",
        label: declined ? "Offer declined" : "Withdrawn",
        hint: declined ? "You declined the offer, so this application is closed." : "You closed this application.",
        state: "closed",
        at: closedAt,
      });
    else steps.push({ id: stage, label: "Application closed", hint: "Read the decision at the top of this page.", state: "closed", at: o?.at || closedAt });
    return steps;
  }
  const decided = mode === "offer" || mode === "hired";
  steps.push({
    id: "decision",
    label: decided ? "Offer made" : STAGE_COPY.offer.label,
    hint: mode === "waiting" ? "An update is waiting for you at the top of this page." : decided ? "Read your offer at the top of this page." : STAGE_COPY.offer.hint,
    state: mode === "waiting" ? "current" : decided ? "done" : "todo",
    at: mode === "waiting" ? o?.at : decided ? o?.at || reached.get("offer") || null : null,
  });
  steps.push({
    id: "hired",
    label: STAGE_COPY.hired.label,
    hint: mode === "offer" ? "Accept the offer to confirm your first day." : STAGE_COPY.hired.hint,
    state: mode === "hired" ? "done" : mode === "offer" ? "current" : "todo",
    at: mode === "hired" ? reached.get("hired") || null : null,
  });
  return steps;
}

/** The badge beside the job title. Neutral while an update is sealed, whatever it says. */
export function applicantBadge(a: Applicant): { label: string; tone: "info" | "ok" | "plain" } {
  if (isSealed(a)) return { label: "Update waiting", tone: "info" };
  switch (a.stage) {
    case "offer":
      return a.offer?.status === "declined" ? { label: "Offer declined", tone: "plain" } : { label: "Offer made", tone: "ok" };
    case "hired":
      return { label: "Offer accepted", tone: "ok" };
    case "not-selected":
      return { label: "Application closed", tone: "plain" };
    case "withdrawn":
      return { label: a.offer?.status === "declined" ? "Offer declined" : "Withdrawn", tone: "plain" };
    default:
      return { label: STAGE_COPY[a.stage]?.label || a.stage, tone: "info" };
  }
}

/** True while the applicant's view should act as an open application: sealed updates behave the same either way. */
export function applicantClosed(a: Applicant) {
  return !isSealed(a) && CLOSED_STAGES.includes(a.stage);
}
