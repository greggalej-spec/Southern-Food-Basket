import { byId } from "../store";
import { fmtDate, fmtTime, parseDay } from "../format";
import type { Employee, Seed, Shift } from "../types";

// Date, shift and wording helpers from portal.js. Seed dates are plain YYYY-MM-DD, read as local calendar days so a
// negative UTC offset (Trinidad is UTC-4) never shows the day before. The ones marked "reads the clock" run only after
// hydration; the portal pages render nothing before then.

const pad2 = (n: number) => String(n).padStart(2, "0");

export const isDay = (s: unknown) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

export function isoLocal(d: Date) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

export function addDays(d: Date, n: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

/** Reads the clock. */
export function todayIso() {
  return isoLocal(new Date());
}

type DayOpts = { day?: string; month?: string; weekday?: string; year?: string };

/** Keeps the Intl-style options portal.js passed and maps them onto fmtDate: { day } alone → "23"; { day, month } →
 *  "23 Oct"; add weekday → "Fri 23 Oct"; no options → "23 Oct 2026". */
export function fmtDay(iso: string | null | undefined, opts?: DayOpts) {
  if (!iso) return "";
  if (!opts) return fmtDate(iso);
  if (opts.day && !opts.month) {
    const d = parseDay(iso);
    return isNaN(d.getTime()) ? "" : String(d.getDate());
  }
  return fmtDate(iso, { year: opts.year ? undefined : false, weekday: !!opts.weekday });
}

export function weekdayShort(iso: string) {
  return parseDay(iso).toLocaleDateString("en-GB", { weekday: "short" });
}

export function cmp(a: string | null | undefined, b: string | null | undefined) {
  const x = String(a || ""), y = String(b || "");
  return x < y ? -1 : x > y ? 1 : 0;
}

export function plural(n: number, unit: string) {
  return n + " " + unit + (n === 1 ? "" : "s");
}

export function inDays(n: number | null) {
  if (n == null) return "";
  if (n < 0) return plural(-n, "day") + " ago";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  return "in " + plural(n, "day");
}

export function dateRange(from: string | null | undefined, to: string | null | undefined) {
  if (!from) return "";
  if (!to || to === from) return fmtDay(from);
  const a = parseDay(from), b = parseDay(to);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return fmtDay(from, { day: "numeric" }) + " – " + fmtDay(to);
  if (a.getFullYear() === b.getFullYear()) return fmtDay(from, { day: "numeric", month: "short" }) + " – " + fmtDay(to);
  return fmtDay(from) + " – " + fmtDay(to);
}

/* shifts */
export function mins(hhmm: string | null | undefined) {
  const p = String(hhmm || "0:0").split(":").map(Number);
  return p[0] * 60 + (p[1] || 0);
}

/** Reads the clock. */
export function nowMins() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function shiftHours(sh: Shift) {
  return Math.max(0, mins(sh.end) - mins(sh.start)) / 60;
}

export function fmtHours(h: number) {
  return (Number.isInteger(h) ? String(h) : h.toFixed(1).replace(/\.0$/, "")) + " h";
}

export function fmtMinutes(m: number | null | undefined) {
  const n = Number(m) || 0;
  return n >= 60 ? fmtHours(n / 60) : n + " min";
}

export function sortedShifts(me: Employee) {
  return (me.shifts || []).slice().sort((a, b) => cmp(a.date, b.date) || cmp(a.start, b.start));
}

/** Reads the clock. */
export function shiftEnded(sh: Shift) {
  const t = todayIso();
  return sh.date < t || (sh.date === t && mins(sh.end) <= nowMins());
}

/** Reads the clock. */
export function shiftStarted(sh: Shift) {
  const t = todayIso();
  return sh.date < t || (sh.date === t && mins(sh.start) <= nowMins());
}

export function shiftRange(sh: Shift) {
  return fmtTime(sh.start) + " – " + fmtTime(sh.end);
}

/* lookups */
export function branchName(d: Seed, id: string | null | undefined) {
  const b = byId(d.branches, id);
  return b ? b.name : "";
}

export function docName(d: Seed, docId: string) {
  const doc = byId(d.kycDocs, docId);
  return doc ? doc.name : docId;
}
