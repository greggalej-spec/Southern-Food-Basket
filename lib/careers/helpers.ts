import { byId } from "@/lib/store";
import { fileSize } from "@/lib/format";
import type { KycDoc, Seed } from "@/lib/types";

// Ported from assets/js/careers.js: the shared helpers, the file checks used by apply and me, the application draft
// (localStorage sfb-apply-draft-<jobId>) and the step validation.

export function branchName(d: Seed, id: string | null | undefined) {
  const b = byId(d.branches, id);
  return b ? b.name : "";
}

/** Local YYYY-MM-DD. Reads the clock: call it only after hydration. */
export function todayIso() {
  const t = new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

export function ageOn(dob: string, today: string) {
  const [y, m, d] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - y;
  if (tm < m || (tm === m && td < d)) age--;
  return age;
}

/* file checks shared by apply and me */
const MIME: Record<string, string[]> = { pdf: ["application/pdf"], jpg: ["image/jpeg", "image/jpg"], png: ["image/png"] };
const MAX_BYTES = 8 * 1024 * 1024;

export function acceptAttr(formats: string[]) {
  const ext = formats.map((f) => "." + f);
  if (formats.includes("jpg")) ext.push(".jpeg");
  return ext.join(",");
}

export function formatsLabel(formats: string[]) {
  return formats.map((f) => f.toUpperCase()).join(", ");
}

export function fileProblem(file: File, doc: KycDoc) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const okExt = doc.formats.includes(ext) || (ext === "jpeg" && doc.formats.includes("jpg"));
  const okType = !file.type || doc.formats.some((f) => (MIME[f] || []).includes(file.type));
  if (!okExt || !okType) return "Choose a " + formatsLabel(doc.formats) + ' file. "' + file.name + '" is not one of those.';
  if (file.size > MAX_BYTES) return "That file is " + fileSize(file.size) + ". Choose one of 8 MB or less.";
  return null;
}

/* application draft */
export const STEPS = [
  { id: "account", label: "Account" },
  { id: "personal", label: "Personal" },
  { id: "experience", label: "Experience" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
];
export const AVAILABILITY = ["Weekdays", "Evenings", "Weekends", "Early mornings", "Any shift"];

/** File metadata only; the bytes never leave the file input. */
export type DraftDoc = { fileName?: string; size?: number; type?: string; expiry?: string; state: "uploaded" | "missing" };

export interface Draft {
  account: { name: string; email: string; phone: string };
  personal: { address: string; dob: string; national: boolean };
  experience: { summary: string; availability: string[]; startDate: string };
  docs: Record<string, DraftDoc>;
}

/** Asked fresh every time; never saved in the draft. */
export type Consent = { truth: boolean; process: boolean };

export function blankDraft(): Draft {
  return {
    account: { name: "", email: "", phone: "" },
    personal: { address: "", dob: "", national: false },
    experience: { summary: "", availability: [], startDate: "" },
    docs: {},
  };
}

const draftKey = (jobId: string) => "sfb-apply-draft-" + jobId;

export function loadDraft(jobId: string): Draft {
  let saved: Partial<Draft> | null = null;
  try {
    saved = JSON.parse(localStorage.getItem(draftKey(jobId)) || "null");
  } catch {}
  const draft: Draft = Object.assign(blankDraft(), saved || {});
  draft.docs = draft.docs || {};
  return draft;
}

export function saveDraft(jobId: string, draft: Draft) {
  try {
    localStorage.setItem(draftKey(jobId), JSON.stringify(draft));
  } catch {}
}

export function clearDraft(jobId: string) {
  try {
    localStorage.removeItem(draftKey(jobId));
  } catch {}
}

export function stepFromHash() {
  const m = /^#step-([1-5])$/.exec(location.hash);
  return m ? Number(m[1]) : 1;
}

export type FieldError = { id: string; msg: string };

/** The errors for one step, in field order. */
export function validate(n: number, draft: Draft, consent: Consent, today: string): FieldError[] {
  const errs: FieldError[] = [];
  if (n === 1) {
    const a = draft.account;
    if (!a.name.trim()) errs.push({ id: "f-name", msg: "Enter your full name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) errs.push({ id: "f-email", msg: "Enter an email address like name@example.com." });
    const digits = a.phone.replace(/\D/g, "");
    const okPhone = digits.length === 7 || (digits.length === 10 && digits.startsWith("868")) || (digits.length === 11 && digits.startsWith("1868"));
    if (!okPhone) errs.push({ id: "f-phone", msg: "Enter a Trinidad and Tobago number, for example (868) 000-0000." });
  }
  if (n === 2) {
    const p = draft.personal;
    if (!p.address.trim()) errs.push({ id: "f-address", msg: "Enter the address where you live." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob)) errs.push({ id: "f-dob", msg: "Enter your date of birth." });
    else if (ageOn(p.dob, today) < 16) errs.push({ id: "f-dob", msg: "You must be at least 16 to apply." });
    else if (ageOn(p.dob, today) > 100) errs.push({ id: "f-dob", msg: "Check the year of birth." });
  }
  if (n === 3) {
    const x = draft.experience;
    if (x.summary.trim().length < 40) errs.push({ id: "f-summary", msg: "Tell us a little more: at least 40 characters (" + x.summary.trim().length + " so far)." });
    if (!x.availability.length) errs.push({ id: "f-avail", msg: "Pick at least one option." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(x.startDate)) errs.push({ id: "f-start", msg: "Enter the earliest date you could start." });
    else if (x.startDate < today) errs.push({ id: "f-start", msg: "Choose today or a later date." });
  }
  if (n === 5) {
    const pid = draft.docs["photo-id"];
    if (!pid || !pid.fileName) errs.push({ id: "photo-id", msg: "Add your government photo ID in the Documents step before you submit." });
    if (!consent.truth) errs.push({ id: "f-true", msg: "Confirm that the information is true and complete." });
    if (!consent.process) errs.push({ id: "f-consent", msg: "Confirm that we may process these details." });
  }
  return errs;
}

/* applicant dashboard */
export const CLOSED_STAGES = ["not-selected", "withdrawn"];
