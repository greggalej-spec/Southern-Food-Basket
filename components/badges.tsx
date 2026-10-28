"use client";

import { Badge } from "@/components/ui/badge";
import { DOC_STATE, type DocDisplayState } from "@/lib/format";
import { useData } from "@/lib/store";

/** An applicant's hiring stage, in the stage's own tone. */
export function StageBadge({ stage }: { stage: string }) {
  const s = useData().stages.find((x) => x.id === stage) ?? { label: stage, tone: "plain" as const };
  return s.tone === "plain" ? <Badge plain>{s.label}</Badge> : <Badge variant={s.tone}>{s.label}</Badge>;
}

/** A document's displayed state (see docDisplayState). */
export function DocBadge({ state }: { state: DocDisplayState }) {
  const s = DOC_STATE[state] ?? DOC_STATE.missing;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
