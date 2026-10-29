import { fmtTT } from "@/lib/promo";

// Trinidad time for the office console's date and time fields. Trinidad keeps UTC-4 all year (no daylight saving),
// so a field's "YYYY-MM-DDTHH:mm" is read as Trinidad time and stored with its offset, whatever the computer's own
// timezone says. Stored values look like 2026-10-27T00:00:00-04:00 (lib/types.ts Promotion.starts).

const OFFSET_MS = 4 * 60 * 60 * 1000;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A stored instant as a datetime-local value in Trinidad time, or "" when it is not a date. */
export function toTtInput(iso: string | null | undefined) {
  const t = iso ? new Date(iso).getTime() : NaN;
  return isNaN(t) ? "" : new Date(t - OFFSET_MS).toISOString().slice(0, 16);
}

/** A datetime-local value, read as Trinidad time, as a stored instant; null when it is not a full date and time. */
export function fromTtInput(v: string) {
  if (!STAMP.test(v)) return null;
  const iso = v + ":00-04:00";
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

/** A stored instant's Trinidad calendar day, "YYYY-MM-DD". */
export function ttDay(iso: string | number | Date) {
  const t = new Date(iso).getTime();
  return isNaN(t) ? "" : new Date(t - OFFSET_MS).toISOString().slice(0, 10);
}

/** A date field's day as the last minute of that day in Trinidad (how access end dates are kept). */
export function endOfTtDay(v: string) {
  if (!DAY.test(v)) return null;
  const iso = v + "T23:59:00-04:00";
  return isNaN(new Date(iso).getTime()) ? null : iso;
}

/** "30 Oct 2026, 7:00 am" in Trinidad time. */
export function whenTT(iso: string | null | undefined) {
  return iso ? fmtTT(iso, true) : "";
}

/** "30 Oct 2026" in Trinidad time. */
export function dayTT(iso: string | null | undefined) {
  return iso ? fmtTT(iso) : "";
}

/** The time of day alone, "7:00 am", in Trinidad time. */
export function clockTT(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { timeZone: "America/Port_of_Spain", hour: "numeric", minute: "2-digit", hour12: true });
}

/** Whole days from now until the instant, rounded up: 0 means it has passed or is due now. */
export function daysLeft(iso: string, now: number) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86400000));
}
