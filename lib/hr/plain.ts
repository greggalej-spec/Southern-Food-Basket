import type { DocDisplayState } from "@/lib/format";
import type { Seed } from "@/lib/types";

// The plain words for hiring, in one place. The seed keeps its short stage ids and labels (the timeline is written
// with them, so they stay as they are); every screen shows these instead. Applicants see `label` and `hint`. HR sees
// `hr`, which keeps the technical term in brackets where there is one. Every time estimate says "typical": they are
// demo figures until the store confirms its own. Pure data, safe to import on the public careers pages.

export interface StageCopy {
  /** What the applicant sees. */
  label: string;
  /** One line: what happens at this stage and how long it usually takes. */
  hint: string;
  /** HR's name for the stage. */
  hr: string;
}

export const STAGE_COPY: Record<string, StageCopy> = {
  submitted: {
    label: "Application received",
    hint: "We have your application. HR usually starts reading it within 3 working days (typical).",
    hr: "New",
  },
  screening: {
    label: "Under review",
    hint: "HR reads your application against what the job needs. This usually takes 2 to 5 working days (typical).",
    hr: "Under review (screening)",
  },
  kyc: {
    label: "Document check",
    hint: "We check that each document is clear, current and in your name. Usually 2 to 3 working days (typical) once they are all in.",
    hr: "Document check (KYC)",
  },
  interview: {
    label: "Interview",
    hint: "A talk at the store with the team lead, usually about 30 minutes (typical). The time and place appear on this page.",
    hr: "Interview",
  },
  offer: {
    label: "Decision",
    hint: "HR writes to you here with the decision, usually within a week of your interview (typical).",
    hr: "Offer",
  },
  hired: {
    label: "Starting work",
    hint: "You accept the offer and HR calls you to confirm your first day.",
    hr: "Hired",
  },
  "not-selected": {
    label: "Application closed",
    hint: "HR has written to you with the decision.",
    hr: "Not selected",
  },
  withdrawn: {
    label: "Withdrawn",
    hint: "This application is closed.",
    hr: "Withdrawn",
  },
};

/** HR's plain label for a stage id, falling back to the seed's own label. */
export function hrStageLabel(d: Seed, id: string) {
  return STAGE_COPY[id]?.hr ?? d.stages.find((x) => x.id === id)?.label ?? id;
}

/** The applicant's label for a stage id. */
export function applicantStageLabel(id: string) {
  return STAGE_COPY[id]?.label ?? id;
}

/** The stage id behind a seed label, as the timeline writes it ("Moved to KYC review"). */
export function stageIdForLabel(d: Seed, label: string) {
  return d.stages.find((x) => x.label === label)?.id ?? null;
}

/** One plain line per document: what it is and why we ask. Shown to applicants instead of the seed's description. */
export const DOC_PLAIN: Record<string, string> = {
  "photo-id": "A current National ID card, Driver’s Permit or Passport, so we know who you are.",
  bir: "The letter or card with your Board of Inland Revenue (BIR) file number, so your pay is taxed correctly.",
  nis: "Your National Insurance (NIS) card or letter, so we can pay your NIS contributions.",
  coc: "A police Certificate of Character from the Trinidad and Tobago Police Service, dated in the last six months.",
  address: "A utility bill or bank statement from the last three months that shows your name and address.",
  refs: "The names and phone numbers of two people who know your work, such as a past manager or teacher.",
  bank: "A bank letter or voided cheque, so your pay goes to your account. We hide the account number once it is checked.",
  "food-badge": "Your Ministry of Health Food Handler’s Badge. Food jobs need it before your first day.",
  "work-permit": "Only if you are not a national of Trinidad and Tobago and do not hold a CARICOM skills certificate.",
};

/** What a document's state means to the applicant. `variant` is the badge tone; each always carries its words. */
export const DOC_STATE_PLAIN: Record<DocDisplayState, { label: string; variant: "neutral" | "info" | "ok" | "warn" }> = {
  missing: { label: "Not added yet", variant: "neutral" },
  uploaded: { label: "Received, checking", variant: "info" },
  verified: { label: "Checked", variant: "ok" },
  flagged: { label: "Needs a new copy", variant: "warn" },
  expired: { label: "Expired", variant: "warn" },
  expiring: { label: "Expires soon", variant: "warn" },
};

/** The key under the applicant's document list. */
export const DOC_LEGEND: { label: string; text: string }[] = [
  { label: "Received, checking", text: "we have it and HR will look at it soon." },
  { label: "Checked", text: "it is fine. Nothing more to do." },
  { label: "Needs a new copy", text: "HR could not accept this one. Read their note under it, then upload a new copy." },
];
