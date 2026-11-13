import { assertCan } from "@/lib/access";
import { daysUntil, docDisplayState } from "@/lib/format";
import { MAIN_STAGES } from "@/lib/hr/hr";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { Applicant, Employee, Seed, Session } from "@/lib/types";

/* HR's People list and hiring log: everyone at every store, what needs attention on their file, and every
   application from the day it arrived. Reads take the data from useData(); anything that looks at expiry dates
   reads the clock, so call it after hydration. */

export const STATUS_LABEL: Record<NonNullable<Employee["status"]>, string> = { active: "Active", probation: "On probation", "on-leave": "On leave" };
export const statusOf = (e: Employee) => e.status || "active";

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

export function setPersonStatus(s: Session | null, id: string, status: NonNullable<Employee["status"]>) {
  update((d) => {
    const e = byId(d.employees, id);
    assertCan(d, s, "hr.people", { branchId: e?.branchId });
    if (!e) return;
    e.status = status;
    audit(d, s, "hr.person", e.name, "Status set to " + STATUS_LABEL[status].toLowerCase());
  });
}
