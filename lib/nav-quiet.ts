import { useSyncExternalStore } from "react";
import type { NavSignal } from "./nav-signals";

/* Turning a sidebar light off, kept in this browser (Gregg, 16 Nov 2026: "you can take it off").
     Got it     a critical light stops blinking and pulsing; it stays red until the thing itself is dealt with
     Pause      the light goes out for an hour, until tomorrow morning, or for three days, then comes back
     Done       the light goes out until something new arrives in that section (its line or count changes)
   Nothing here changes the work itself: Today still lists every item. */

export type Quiet = { until?: number; done?: string; ack?: string };
type QuietMap = Record<string, Quiet>;

const KEY = "sfb.navQuiet";
const listeners = new Set<() => void>();
let raw = "";
let parsed: QuietMap = {};

function read(): QuietMap {
  let now = "";
  try {
    now = localStorage.getItem(KEY) || "";
  } catch {}
  if (now !== raw) {
    raw = now;
    try {
      parsed = now ? (JSON.parse(now) as QuietMap) : {};
    } catch {
      parsed = {};
    }
  }
  return parsed;
}
const EMPTY: QuietMap = {};
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    removeEventListener("storage", onStorage);
  };
}

export function useQuiet() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function setQuiet(id: string, q: Quiet | null) {
  const next = { ...read() };
  if (q) next[id] = q;
  else delete next[id];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function clearQuiet() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

/** What a light says now, so "done" and "got it" hold only until it says something new. */
export const fingerprint = (s: NavSignal) => s.level + "|" + s.count + "|" + s.text;

/** Seven tomorrow morning, in this browser's time. */
export function tomorrowMorning(now: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  return d.getTime();
}

/** The lights as they should show: paused and done ones dropped, acknowledged critical ones marked to hold still.
 *  Also returns how many lights are being kept off, for the "turn them back on" line. */
export function applyQuiet(signals: Record<string, NavSignal>, quiet: QuietMap, now: number) {
  const out: Record<string, NavSignal & { acked?: boolean }> = {};
  let off = 0;
  for (const [id, sig] of Object.entries(signals)) {
    const q = quiet[id];
    const fp = fingerprint(sig);
    if (q && ((q.until && q.until > now) || q.done === fp)) {
      off++;
      continue;
    }
    out[id] = q && q.ack === fp ? { ...sig, acked: true } : sig;
  }
  return { lights: out, off };
}
