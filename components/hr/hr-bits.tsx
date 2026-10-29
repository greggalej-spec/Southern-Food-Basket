"use client";

import { Badge } from "@/components/ui/badge";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { hrStageLabel } from "@/lib/hr/plain";
import { useData } from "@/lib/store";
import type { Applicant } from "@/lib/types";

/** A stage badge in HR's words ("Document check (KYC)"). "Not selected" is a closed file, not an error, so it is
 *  neutral rather than red. */
export function HrStageBadge({ stage }: { stage: string }) {
  const d = useData();
  const tone = stage === "not-selected" ? "plain" : (d.stages.find((x) => x.id === stage)?.tone ?? "plain");
  const label = hrStageLabel(d, stage);
  return tone === "plain" ? <Badge plain>{label}</Badge> : <Badge variant={tone}>{label}</Badge>;
}

/** Where a sent decision stands, in one line: sent, opened or not, and the reply to an offer. */
export function decisionLine(a: Applicant, opts: { short?: boolean } = {}) {
  const o = a.outcome;
  if (!o) return null;
  const what = o.kind === "offer" ? "Offer" : "Not selected";
  const sent = what + " sent " + (opts.short ? fmtDate(o.at, { year: false }) : fmtDateTime(o.at));
  if (!o.openedAt) return { sealed: true, text: sent + " · not opened yet" };
  const reply =
    o.kind === "offer" && a.offer?.status === "accepted"
      ? " · accepted"
      : o.kind === "offer" && a.offer?.status === "declined"
        ? " · declined"
        : "";
  return { sealed: false, text: sent + " · opened " + (opts.short ? fmtDate(o.openedAt, { year: false }) : fmtDateTime(o.openedAt)) + reply };
}

/** The drawer header's decision status. */
export function DecisionStatus({ a }: { a: Applicant }) {
  const line = decisionLine(a);
  if (!line) return null;
  return (
    <p className={"decision-status" + (line.sealed ? " is-sealed" : " is-opened")} data-tour="hr-decision-status">
      <span className="decision-dot" aria-hidden="true" />
      <span>{line.text}</span>
    </p>
  );
}
