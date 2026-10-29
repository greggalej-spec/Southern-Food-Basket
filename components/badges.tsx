"use client";

import { Badge } from "@/components/ui/badge";
import { DOC_STATE, type DocDisplayState } from "@/lib/format";

/** A document's displayed state (see docDisplayState). Staff and HR wording; applicants get lib/hr/plain.ts. */
export function DocBadge({ state }: { state: DocDisplayState }) {
  const s = DOC_STATE[state] ?? DOC_STATE.missing;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
