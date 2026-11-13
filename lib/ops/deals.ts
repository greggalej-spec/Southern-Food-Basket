import { assertCan } from "@/lib/access";
import { audit, byId, uid, update } from "@/lib/store";
import type { Seed, Session, Special } from "@/lib/types";

/* A special's run. Every special has a first day (`posted`) and may have a last day (`to`); without one it runs
   until someone ends it. From those two dates and today it is scheduled, running or ended. The public pages show
   only what is running. Ended specials are never deleted by the clock: they stay as the history, grouped by the
   month they ended, and any of them can be run again as a new special, so the old record is kept. */

export type DealState = "running" | "soon" | "ended";
export const DEAL_STATE: Record<DealState, { label: string; badge: "badge-green" | "badge-warn" | "badge-plain" }> = {
  running: { label: "Running", badge: "badge-green" },
  soon: { label: "Scheduled", badge: "badge-warn" },
  ended: { label: "Ended", badge: "badge-plain" },
};

/** `today` is "YYYY-MM-DD" in Trinidad. */
export const dealState = (sp: Pick<Special, "posted" | "to">, today: string): DealState => (today < sp.posted ? "soon" : sp.to && today > sp.to ? "ended" : "running");

/** What the public pages show. Before the date is known (the first paint) only open-ended specials count. */
export const runningDeals = (list: Special[], today: string) => (today ? list.filter((sp) => dealState(sp, today) === "running") : list.filter((sp) => !sp.to));

export function dealCounts(d: Seed, today: string) {
  const c = { running: 0, soon: 0, ended: 0 };
  (d.specials || []).forEach((sp) => c[dealState(sp, today)]++);
  return c;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-11" → "November 2026". */
export const monthName = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] + " " + ym.slice(0, 4);
/** The month a special belongs to in the history: the month it ended. */
export const endMonth = (sp: Special) => (sp.to || sp.posted).slice(0, 7);

const addDays = (day: string, n: number) => new Date(Date.parse(day + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const runLength = (sp: Special) => (sp.to ? Math.round((Date.parse(sp.to + "T12:00:00Z") - Date.parse(sp.posted + "T12:00:00Z")) / 86400000) : null);

/** Ends a running special after today. It moves to the history. */
export function endDeal(s: Session | null, id: string, today: string) {
  update((d) => {
    assertCan(d, s, "specials.edit");
    const sp = byId(d.specials, id);
    if (!sp) return;
    sp.to = today < sp.posted ? sp.posted : today;
    audit(d, s, "specials.end", sp.name, "Ends " + sp.to);
  });
}

/** Runs an ended special again as a new one, starting today, for as long as it ran before. Returns the new id. */
export function rerunDeal(s: Session | null, id: string, today: string) {
  let nid = "";
  update((d) => {
    assertCan(d, s, "specials.edit");
    const sp = byId(d.specials, id);
    if (!sp) return;
    const len = runLength(sp);
    do nid = uid("sp");
    while (byId(d.specials, nid));
    const copy: Special = { ...sp, id: nid, posted: today };
    if (len != null) copy.to = addDays(today, len);
    else delete copy.to;
    delete copy.isNew;
    d.specials.unshift(copy);
    audit(d, s, "specials.rerun", sp.name, "Running again from " + today + (copy.to ? " to " + copy.to : ""));
  });
  return nid;
}
