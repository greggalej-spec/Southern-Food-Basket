import { buildQueue, URGENT_DAYS, type QueueItem } from "@/lib/admin/today";
import { daysUntil, docDisplayState } from "@/lib/format";
import { complianceRows } from "@/lib/hr/hr";
import { hasRead, waitingFor } from "@/lib/staff-updates";
import { currentEmployee } from "@/lib/store";
import type { Role, Seed, Session } from "@/lib/types";

/* The sidebar's lights (Gregg, 16 Nov 2026): each menu entry shows how things stand in that section.
     no light   everything is fine
     done       green: something finished that is worth a look (a report compiled, codes taken today)
     moving     blue, turning: under way, in someone else's hands or on a timer (stores still answering, an e-mail
                queued, an offer about to start)
     pending    yellow: new or unchecked, waiting for you
     urgent     red: due within two days, or late
     critical   red and blinking, and the whole entry pulses: stock, safety or trading at risk now
   The office console reads them off the Today queue (lib/admin/today.ts), so a light always matches a line there;
   the portal and HR read their own records. The clock is read, so call this after hydration. */

export type SignalLevel = "critical" | "urgent" | "pending" | "moving" | "done";
/** `critical` counts the critical items behind the light (the edge swell shows the number). */
export type NavSignal = { level: SignalLevel; count: number; critical: number; text: string };

export const SIGNAL_RANK: Record<SignalLevel, number> = { critical: 0, urgent: 1, pending: 2, moving: 3, done: 4 };
export const SIGNAL_WORD: Record<SignalLevel, string> = { critical: "Critical", urgent: "Urgent", pending: "Waiting for you", moving: "Under way", done: "Done, worth a look" };

export function levelOf(it: QueueItem): SignalLevel {
  if (it.urgency) return it.urgency;
  if (it.signal) return it.signal;
  return it.tone === "bad" || it.tone === "warn" || it.tone === "plain" ? "pending" : "done";
}

type Out = Record<string, NavSignal>;
function put(out: Out, id: string, level: SignalLevel, text: string) {
  const cur = out[id];
  const crit = level === "critical" ? 1 : 0;
  if (!cur) out[id] = { level, count: 1, critical: crit, text };
  else {
    cur.count++;
    cur.critical += crit;
    if (SIGNAL_RANK[level] < SIGNAL_RANK[cur.level]) Object.assign(cur, { level, text });
  }
}

const OFFICE_ROLES: Role[] = ["admin", "purchasing", "marketing", "owner"];

/** The light for each menu entry this session can see, keyed by the entry's id (components/app-shell.tsx). */
export function navSignals(d: Seed, s: Session | null, now: number): Out {
  const out: Out = {};
  if (!s) return out;
  if (OFFICE_ROLES.includes(s.role)) {
    for (const it of buildQueue(d, s, now)) {
      const lv = levelOf(it);
      put(out, it.link.tab, lv, it.text);
      put(out, "today", lv, it.text);
    }
  }
  if (s.role === "hr") {
    const comp = complianceRows(d);
    if (comp.docs.length) put(out, "compliance", "pending", comp.docs.length + " documents need checking.");
    if (comp.leave.length) put(out, "compliance", "pending", comp.leave.length + " leave requests are waiting.");
    const fresh = d.applicants.filter((a) => a.stage === "submitted").length;
    if (fresh) put(out, "pipeline", "pending", fresh + " new applications have not been opened.");
  }
  // every staff role has My portal
  const me = currentEmployee(d, s);
  if (me) {
    const today = new Date(now);
    (me.compliance || []).forEach((c) => {
      const st = docDisplayState(c, today);
      const n = daysUntil(c.expiry, today);
      if (st === "expired" || st === "missing") put(out, "docs", "urgent", "A document is out of date or missing.");
      else if (st === "expiring") put(out, "docs", n != null && n <= URGENT_DAYS ? "urgent" : "pending", "A document expires soon.");
      else if (st === "flagged") put(out, "docs", "pending", "A document needs attention.");
    });
    (me.training || [])
      .filter((t) => !t.done && t.due)
      .forEach((t) => {
        const n = daysUntil(t.due, today);
        if (n == null || n > 30) return;
        put(out, "docs", n <= URGENT_DAYS ? "urgent" : "pending", t.name + " training is due.");
      });
    const waiting = waitingFor(d, me.id);
    const unread = waiting.filter((u) => !hasRead(u, me.id)).length;
    if (waiting.length) put(out, "updates", "pending", unread ? unread + " staff updates to read." : "A staff update to confirm.");
    if ((me.leaveRequests || []).some((r) => r.status === "pending")) put(out, "leave", "moving", "A leave request is with HR.");
  }
  return out;
}
