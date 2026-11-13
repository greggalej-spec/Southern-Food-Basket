import { SEED } from "./seed";
import type { Branch, DocRecord, DocState } from "./types";

// Ported from ui.js and store.js. Pure functions, except the "today" helpers, which read the clock: call those only
// after hydration (useHydrated), because a prerendered page and the visitor's browser disagree about today.

export const DISCLAIMER =
  "Prototype for Southern Food Basket, by Trinovata. Store hours and phone numbers come from Google Maps, prices and photos from the company’s public Instagram; people, jobs, requests, orders and marketing figures are demo data.";

/** One unit per number. money(12.99) → "TTD 12.99"; money(12.99, "lb") → "TTD 12.99 / lb". */
export function money(v: number | string | null | undefined, per?: string) {
  if (v == null || v === "") return "";
  const s = Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return SEED.settings.currency + " " + s + (per ? " / " + per : "");
}

export function initials(name: string | null | undefined) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "SF"
  );
}

/* Dates: a bare YYYY-MM-DD is a calendar day in the viewer's timezone (never UTC midnight, which renders a day early
   in Trinidad). Month names are fixed so ICU quirks like "Sept" cannot appear. */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDay(v: string | Date) {
  if (v instanceof Date) return v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(v);
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Inclusive calendar days: daysBetween("2026-12-22", "2026-12-24") → 3. */
export function daysBetween(a: string | Date, b: string | Date) {
  const ms = startOfDay(parseDay(b)).getTime() - startOfDay(parseDay(a)).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

/** Whole calendar days from today to the date: 0 = today, negative = past. Reads the clock. */
export function daysUntil(date: string | null | undefined, today = new Date()) {
  if (!date) return null;
  const target = parseDay(date);
  if (isNaN(target.getTime())) return null;
  return Math.round((startOfDay(target).getTime() - startOfDay(today).getTime()) / 86400000);
}

/** fmtDate("2026-11-18") → "18 Nov 2026"; year: false drops the year; weekday adds "Wed ". */
export function fmtDate(iso: string | null | undefined, opts: { year?: boolean; weekday?: boolean } = {}) {
  if (!iso) return "";
  const d = parseDay(iso);
  if (isNaN(d.getTime())) return iso;
  const core = d.getDate() + " " + MONTHS[d.getMonth()] + (opts.year === false ? "" : " " + d.getFullYear());
  return (opts.weekday ? DAYS[d.getDay()] + " " : "") + core;
}

/** fmtDateTime("2026-10-16T09:15:00") → "16 Oct, 9:15 am". */
export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = parseDay(iso);
  if (isNaN(d.getTime())) return iso;
  return d.getDate() + " " + MONTHS[d.getMonth()] + ", " + clock(d.getHours(), d.getMinutes());
}

/** fmtTime("07:00") → "7:00 am". */
export function fmtTime(hhmm: string | null | undefined) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return clock(h, m);
}

function clock(h: number, m: number) {
  return ((h + 11) % 12) + 1 + ":" + String(m).padStart(2, "0") + " " + (h >= 12 ? "pm" : "am");
}

export function fileSize(bytes: number | null | undefined) {
  if (bytes == null) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/** Today's opening hours for a branch: hours[0] is Mon–Sat, hours[1] is Sunday (Google Maps listings). Pass null
 *  before hydration to get the Mon–Sat row without reading the clock. */
export function todayHours(b: Branch | null | undefined, today: Date | null) {
  const rows = b?.hours || [];
  if (!rows.length) return "";
  const row = today?.getDay() === 0 ? rows[1] || rows[0] : rows[0];
  return row ? row[1] : "";
}

/** "7:30 am" → minutes after midnight, or null when the text is not a time. */
function toMinutes(t: string) {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;
  return ((Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + Number(m[2]);
}

/** Whether today's row ("7:00 am – 9:00 pm") covers `now`, on this device's clock. */
export function openNow(b: Branch, now: Date) {
  const t = todayHours(b, now).split(/\s+[–-]\s+/);
  if (t.length !== 2) return false;
  const a = toMinutes(t[0]), z = toMinutes(t[1]), m = now.getHours() * 60 + now.getMinutes();
  return a != null && z != null && m >= a && m < z;
}

/* Google Maps links for a branch. Directions open the store's own listing (destination_place_id) so the route ends
   at the right building; the query text is the fallback when the place ID is unknown. */
function mapsQuery(b: Branch) {
  return (b.listing || "Southern Food Basket") + ", " + (b.address || b.name) + ", Trinidad and Tobago";
}

export function mapsDir(b: Branch) {
  const q = new URLSearchParams({ api: "1", destination: mapsQuery(b) });
  if (b.placeId) q.set("destination_place_id", b.placeId);
  return "https://www.google.com/maps/dir/?" + q.toString();
}

export function mapsView(b: Branch) {
  const q = new URLSearchParams({ api: "1", query: mapsQuery(b) });
  if (b.placeId) q.set("query_place_id", b.placeId);
  return "https://www.google.com/maps/search/?" + q.toString();
}

export function telHref(phone: string | null | undefined) {
  return "tel:" + String(phone || "").replace(/[^\d+]/g, "");
}

export type DocDisplayState = DocState | "expiring";

/** Label and Badge variant for each displayed document state. */
export const DOC_STATE: Record<DocDisplayState, { label: string; variant: "neutral" | "warn" | "ok" | "bad" }> = {
  missing: { label: "Not provided", variant: "neutral" },
  uploaded: { label: "Awaiting review", variant: "warn" },
  verified: { label: "Verified", variant: "ok" },
  flagged: { label: "Needs attention", variant: "bad" },
  expired: { label: "Expired", variant: "bad" },
  expiring: { label: "Expiring soon", variant: "warn" },
};

/** The state a document shows, taking expiry into account. Reads the clock for verified documents with an expiry. */
export function docDisplayState(doc: Pick<DocRecord, "state" | "expiry"> | null | undefined, today = new Date()): DocDisplayState {
  if (!doc || !doc.state || doc.state === "missing") return "missing";
  if (doc.state === "verified" && doc.expiry) {
    const days = daysUntil(doc.expiry, today);
    if (days != null && days < 0) return "expired";
    if (days != null && days <= 45) return "expiring";
  }
  return doc.state;
}
