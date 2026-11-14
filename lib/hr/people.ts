import { assertCan } from "@/lib/access";
import { daysUntil, docDisplayState } from "@/lib/format";
import { MAIN_STAGES } from "@/lib/hr/hr";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { Applicant, Employee, EmployeeStatus, HrFile, HrNoteKind, HrRatingKey, Seed, Session } from "@/lib/types";

/* HR's People list and hiring log: everyone at every store, what needs attention on their file, and every
   application from the day it arrived. Reads take the data from useData(); anything that looks at expiry dates
   reads the clock, so call it after hydration. */

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  probation: "On probation",
  "on-leave": "On leave",
  suspended: "Suspended",
  notice: "Serving notice",
  left: "Left the company",
};
export const STATUS_ORDER: EmployeeStatus[] = ["active", "probation", "on-leave", "suspended", "notice", "left"];
export const statusOf = (e: Employee): EmployeeStatus => e.status || "active";
export const statusVariant = (st: EmployeeStatus) => (st === "probation" ? "info" : st === "suspended" ? "bad" : st === "notice" ? "warn" : "neutral");

/* ---------- HR's file on a person: ratings, notes and status history ---------- */

export const RATING_AREAS: { id: HrRatingKey; label: string }[] = [
  { id: "workEthic", label: "Work ethic" },
  { id: "punctuality", label: "Punctuality" },
  { id: "reliability", label: "Reliability" },
  { id: "teamwork", label: "Teamwork" },
  { id: "customers", label: "Customer service" },
  { id: "attitude", label: "Attitude" },
];
export const NOTE_KIND: Record<HrNoteKind, { label: string; variant: "neutral" | "ok" | "warn" | "bad" }> = {
  note: { label: "Note", variant: "neutral" },
  praise: { label: "Praise", variant: "ok" },
  concern: { label: "Concern", variant: "warn" },
  warning: { label: "Warning", variant: "bad" },
};

export const fileOf = (e: Employee): HrFile => e.hrFile || { notes: [], ratings: [], changes: [] };

/** The average score in each area across every rating, newest first in `latest`. */
export function ratingSummary(e: Employee) {
  const rs = [...fileOf(e).ratings].sort((a, b) => b.at.localeCompare(a.at));
  const areas = RATING_AREAS.map((a) => {
    const vals = rs.map((r) => r.scores[a.id]).filter((v): v is number => typeof v === "number");
    return { ...a, avg: vals.length ? vals.reduce((x, y) => x + y, 0) / vals.length : null, latest: vals[0] ?? null, count: vals.length };
  });
  const all = areas.filter((a) => a.avg != null);
  return { areas, overall: all.length ? all.reduce((x, a) => x + (a.avg as number), 0) / all.length : null, count: rs.length };
}

/** Everything on the file, newest first: notes, ratings and status changes in one timeline. */
export function fileHistory(e: Employee) {
  const f = fileOf(e);
  return [
    ...f.notes.map((n) => ({ at: n.at, kind: "note" as const, item: n })),
    ...f.ratings.map((r) => ({ at: r.at, kind: "rating" as const, item: r })),
    ...f.changes.map((c) => ({ at: c.at, kind: "status" as const, item: c })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

/** The words HR can search a file by: notes, comments and reasons. */
export function fileText(e: Employee) {
  const f = fileOf(e);
  return [...f.notes.map((n) => n.text), ...f.ratings.map((r) => r.comment || ""), ...f.changes.map((c) => c.reason || "")].join(" ");
}

function withFile(e: Employee) {
  e.hrFile = { notes: [], ratings: [], changes: [], ...e.hrFile };
  return e.hrFile;
}

export function addPersonNote(s: Session | null, id: string, kind: HrNoteKind, text: string) {
  update((d) => {
    const e = byId(d.employees, id);
    assertCan(d, s, "hr.people", { branchId: e?.branchId });
    if (!e || !text.trim()) return;
    const f = withFile(e);
    f.notes = [...f.notes, { id: uid("hn"), at: nowIso(), by: s?.userId || "", kind, text: text.trim() }];
    audit(d, s, "hr.person", e.name, NOTE_KIND[kind].label + " added to their file");
  });
}

export function addPersonRating(s: Session | null, id: string, scores: Partial<Record<HrRatingKey, number>>, comment: string) {
  update((d) => {
    const e = byId(d.employees, id);
    assertCan(d, s, "hr.people", { branchId: e?.branchId });
    if (!e || !Object.keys(scores).length) return;
    const f = withFile(e);
    f.ratings = [...f.ratings, { id: uid("hr"), at: nowIso(), by: s?.userId || "", scores, ...(comment.trim() ? { comment: comment.trim() } : {}) }];
    audit(d, s, "hr.person", e.name, "Rated in " + Object.keys(scores).length + " areas");
  });
}

/** The worst thing on a person's file, or null when it is in order. */
export function fileAlert(e: Employee): { label: string; variant: "warn" | "bad" } | null {
  let out: { label: string; variant: "warn" | "bad"; rank: number } | null = null;
  for (const c of e.compliance || []) {
    const st = docDisplayState(c);
    const hit = st === "expired" ? { label: "A document has expired", variant: "bad" as const, rank: 3 } : st === "missing" || st === "flagged" ? { label: "A document is missing", variant: "bad" as const, rank: 2 } : st === "expiring" || st === "uploaded" ? { label: st === "expiring" ? "A document expires soon" : "A document to check", variant: "warn" as const, rank: 1 } : null;
    if (hit && (!out || hit.rank > out.rank)) out = hit;
  }
  return out ? { label: out.label, variant: out.variant } : null;
}

export function years(startDate: string) {
  const n = daysUntil(startDate);
  if (n == null) return "";
  const days = -n;
  if (days < 0) return "Starts soon";
  if (days < 61) return days + " days";
  if (days < 365) return Math.round(days / 30.4) + " months";
  const y = Math.floor(days / 365);
  return y + (y === 1 ? " year" : " years");
}

export function headcount(d: Seed) {
  return d.branches.map((b) => ({ id: b.id, name: b.name, count: (d.employees || []).filter((e) => e.branchId === b.id).length }));
}

export const teams = (d: Seed) => Array.from(new Set((d.employees || []).map((e) => e.dept))).sort();

/** How many applications sit at each main stage, in order, plus the closed ones. */
export function funnel(d: Seed) {
  const label = (id: string) => d.stages.find((s) => s.id === id)?.label || id;
  return MAIN_STAGES.map((id) => ({ id, label: label(id), count: d.applicants.filter((a) => a.stage === id).length }));
}

export function daysInPipeline(a: Applicant) {
  const n = daysUntil(a.submittedAt.slice(0, 10));
  return n == null ? 0 : Math.max(0, -n);
}

export const lastEvent = (a: Applicant) => a.timeline[a.timeline.length - 1] || null;

export type PersonForm = Pick<Employee, "name" | "role" | "dept" | "branchId" | "startDate" | "status" | "email" | "phone">;

/** Adds someone to the staff list with an empty file: documents come from their application or are added after. */
export function addPerson(s: Session | null, form: PersonForm) {
  let id = "";
  update((d) => {
    assertCan(d, s, "hr.people", { branchId: form.branchId });
    id = uid("emp");
    const no = 500 + (d.employees || []).length;
    d.employees = [
      ...(d.employees || []),
      {
        id, ...form, employeeNo: "SFB-" + String(no).padStart(4, "0"), address: "", emergency: { name: "", relation: "", phone: "" }, bank: { bank: "", masked: "Not on file" },
        leave: { annualEntitled: 14, annualUsed: 0, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
        leaveRequests: [], swapRequests: [], shifts: [], payslips: [], training: [],
        compliance: [{ docId: "photo-id", state: "missing" }, { docId: "nis", state: "missing" }, { docId: "bir", state: "missing" }],
      },
    ];
    // A sign-in for their own portal, limited to their store.
    d.grants = [...(d.grants || []), { id: uid("g"), userId: id, role: "employee", branchIds: [form.branchId], grantedBy: s?.userId || "", grantedAt: nowIso() }];
    audit(d, s, "hr.person", form.name, "Added to the staff list at " + (byId(d.branches, form.branchId)?.name || "a store"));
  });
  return id;
}

export function setPersonStatus(s: Session | null, id: string, status: EmployeeStatus, reason = "") {
  update((d) => {
    const e = byId(d.employees, id);
    assertCan(d, s, "hr.people", { branchId: e?.branchId });
    if (!e) return;
    const from = statusOf(e);
    if (from === status) return;
    e.status = status;
    const f = withFile(e);
    f.changes = [...f.changes, { id: uid("hs"), at: nowIso(), by: s?.userId || "", from, to: status, ...(reason.trim() ? { reason: reason.trim() } : {}) }];
    audit(d, s, "hr.person", e.name, "Status set to " + STATUS_LABEL[status].toLowerCase());
  });
}
