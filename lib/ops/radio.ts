import { assertCan } from "@/lib/access";
import { toTtInput, ttDay } from "@/lib/admin/tt";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { RadioKind, RadioLog, RadioOutcome, RadioScript, RadioSlot, RadioStation, ScriptKind, Seed, Session } from "@/lib/types";

/* The radio diary. Marketing works with the stations every day: someone phones in on the morning show, a host
   interviews a store manager, a host reads our script, a recorded ad plays. This file keeps four things:
   - the stations, and the regular segments on each (station, kind, days of the week, time, who is on air);
   - the scripts, talking points and hype packs the stations need, each with a day by which they must have them;
   - the log: one line per segment per day saying whether it was had and when, or that nobody called, or that the
     station dropped it, plus anything extra that was not on the schedule;
   - the report, worked out from the schedule and the log, so a day with no line shows as "Not logged".
   Days and times are Trinidad's (UTC-4 all year). Only `nowTT` reads the clock. */

export const RADIO_KIND: Record<RadioKind, { label: string; who: string; tone: "clay" | "info" | "ok" | "warn" }> = {
  call: { label: "Live call-in", who: "Who calls in", tone: "clay" },
  interview: { label: "Interview", who: "Who is interviewed", tone: "info" },
  read: { label: "Live read", who: "Who listens for it", tone: "ok" },
  ad: { label: "Ad spot", who: "Who listens for it", tone: "warn" },
};
export const RADIO_KINDS = Object.keys(RADIO_KIND) as RadioKind[];

/** Whether the kind is someone talking on air (a call or an interview) rather than the station playing our words. */
export const onAir = (k: RadioKind) => k === "call" || k === "interview";

export type RowState = RadioOutcome | "due" | "unlogged";

/** What a segment's state is called, in the words the team uses for that kind. */
export function stateLabel(kind: RadioKind, st: RowState) {
  switch (st) {
    case "done":
      return onAir(kind) ? "Had" : "Aired";
    case "missed":
      return onAir(kind) ? "Nobody called" : "Did not air";
    case "dropped":
      return "Station dropped it";
    case "off":
      return "Called off ahead";
    case "due":
      return "Coming up";
    case "unlogged":
      return "Not logged";
  }
}
export const STATE_TONE: Record<RowState, "ok" | "bad" | "warn" | "neutral" | "info"> = { done: "ok", missed: "bad", dropped: "warn", off: "neutral", due: "info", unlogged: "warn" };

export const SCRIPT_KIND: Record<ScriptKind, { label: string; hint: string }> = {
  read: { label: "Live read", hint: "Words the host reads out as written" },
  points: { label: "Talking points", hint: "What to cover on a call or in an interview" },
  hype: { label: "Hype pack", hint: "Specials, prizes and store news for the hosts to talk up" },
  ad: { label: "Ad brief", hint: "What the station needs to make or play the ad" },
};
export const SCRIPT_KINDS = Object.keys(SCRIPT_KIND) as ScriptKind[];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Trinidad's day ("YYYY-MM-DD") and time ("HH:MM") now. Call after hydration. */
export function nowTT() {
  const v = toTtInput(new Date().toISOString());
  return { day: v.slice(0, 10), time: v.slice(11, 16) };
}

export const weekday = (day: string) => new Date(day + "T12:00:00Z").getUTCDay();

export function addDays(day: string, n: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
}

/** Every day from `from` to `to`, oldest first (at most a year). */
export function daysBetween(from: string, to: string) {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 366; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Minutes after the scheduled time it went on air; negative when early. */
export function minutesLate(time: string, at: string) {
  const m = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  return m(at) - m(time);
}

/** "7:40 am" from "07:40". */
export function clock(t: string) {
  const h = Number(t.slice(0, 2)), m = t.slice(3, 5);
  return (h % 12 || 12) + ":" + m + " " + (h < 12 ? "am" : "pm");
}

export const LATE_AFTER = 10;

export function stationName(d: Seed, id: string) {
  return byId(d.radioStations, id)?.name || "A station no longer listed";
}

/** The regular segments that run on a day, earliest first. */
export function slotsOn(d: Seed, day: string) {
  const wd = weekday(day);
  return (d.radioSlots || []).filter((s) => s.from <= day && (!s.to || s.to >= day) && s.days.includes(wd)).sort((a, b) => a.time.localeCompare(b.time));
}

export type DayRow = { key: string; slot: RadioSlot | null; log: RadioLog | null; kind: RadioKind; stationId: string; time: string; title: string; state: RowState };

/** A day's segments with what happened to each, and the extras logged that day, in time order. A segment with no
 *  log line is "Coming up" until its time has passed, then "Not logged". */
export function dayRows(d: Seed, day: string, now: { day: string; time: string }): DayRow[] {
  const logs = (d.radioLogs || []).filter((l) => l.day === day);
  const rows: DayRow[] = slotsOn(d, day).map((slot) => {
    const log = logs.find((l) => l.slotId === slot.id) || null;
    const passed = day < now.day || (day === now.day && slot.time <= now.time);
    return { key: slot.id, slot, log, kind: slot.kind, stationId: slot.stationId, time: slot.time, title: slot.title, state: log ? log.outcome : passed ? "unlogged" : "due" };
  });
  logs
    .filter((l) => !l.slotId || !rows.some((r) => r.slot?.id === l.slotId))
    .forEach((l) => rows.push({ key: l.id, slot: l.slotId ? byId(d.radioSlots, l.slotId) : null, log: l, kind: l.kind, stationId: l.stationId, time: l.at || "", title: l.title || byId(d.radioSlots, l.slotId)?.title || "Extra", state: l.outcome }));
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}

/** Something logged that was not on the schedule. */
export const isExtra = (r: DayRow) => !r.slot || (!!r.log && !r.log.slotId);

export type ReportFilter = { stationId: string; kind: RadioKind | "all" };
export type Totals = { planned: number; done: number; missed: number; dropped: number; off: number; unlogged: number; late: number; extras: number };

/** The report for a run of days: every day's rows (newest first, days still to come left out) and the totals.
 *  The totals count the regular segments; extras are counted on their own. */
export function report(d: Seed, from: string, to: string, f: ReportFilter, now: { day: string; time: string }) {
  const last = to < now.day ? to : now.day;
  const days = from <= last ? daysBetween(from, last).reverse() : [];
  const t: Totals = { planned: 0, done: 0, missed: 0, dropped: 0, off: 0, unlogged: 0, late: 0, extras: 0 };
  const out = days.map((day) => {
    const rows = dayRows(d, day, now).filter((r) => r.state !== "due" && (f.stationId === "all" || r.stationId === f.stationId) && (f.kind === "all" || r.kind === f.kind));
    rows.forEach((r) => {
      if (isExtra(r)) return void t.extras++;
      t.planned++;
      if (r.state !== "due") t[r.state]++;
      if (r.state === "done" && r.slot && r.log?.at && minutesLate(r.slot.time, r.log.at) > LATE_AFTER) t.late++;
    });
    return { day, rows };
  });
  return { days: out, totals: t };
}

/* ---------- scripts ---------- */

export type ScriptState = "sent" | "overdue" | "today" | "soon" | "later";
export function scriptState(sc: RadioScript, today: string): ScriptState {
  if (sc.status === "sent") return "sent";
  if (sc.sendBy < today) return "overdue";
  if (sc.sendBy === today) return "today";
  return sc.sendBy <= addDays(today, 3) ? "soon" : "later";
}
export const SCRIPT_STATE: Record<ScriptState, { label: string; tone: "ok" | "bad" | "warn" | "info" | "neutral" }> = {
  sent: { label: "Sent", tone: "ok" },
  overdue: { label: "Overdue", tone: "bad" },
  today: { label: "Due today", tone: "warn" },
  soon: { label: "Due soon", tone: "info" },
  later: { label: "Later", tone: "neutral" },
};

/** Scripts on air on a day for a station: the ones a log line can name. */
export function scriptsFor(d: Seed, day: string, stationId: string) {
  return (d.radioScripts || []).filter((sc) => sc.airFrom <= day && sc.airTo >= day && (!sc.stationIds.length || sc.stationIds.includes(stationId)));
}

export function scriptsByDue(d: Seed) {
  return (d.radioScripts || []).slice().sort((a, b) => a.sendBy.localeCompare(b.sendBy) || a.title.localeCompare(b.title));
}

/* ---------- writes ---------- */

const TIME = /^\d{2}:\d{2}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type LogForm = Omit<RadioLog, "id" | "loggedBy" | "loggedAt">;

/** Records what happened to a segment on a day (one line per segment per day: logging it again replaces the line),
 *  or something extra. */
export function saveLog(s: Session | null, id: string | null, form: LogForm) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!DAY.test(form.day)) throw new Error("Choose the day.");
    if (form.day > ttDay(Date.now()) && form.outcome !== "off") throw new Error("That day has not come yet. Only a segment called off ahead can be logged for a later day.");
    if (form.outcome === "done" && !TIME.test(form.at || "")) throw new Error("Give the time it went on air.");
    if (!form.slotId && !(form.title || "").trim()) throw new Error("Say what it was.");
    if (!byId(d.radioStations, form.stationId)) throw new Error("Choose the station.");
    d.radioLogs = d.radioLogs || [];
    const clean: LogForm = { ...form, at: form.outcome === "done" ? form.at : undefined, title: form.title?.trim() || undefined, note: form.note?.trim() || undefined };
    const cur = id ? byId(d.radioLogs, id) : form.slotId ? d.radioLogs.find((l) => l.slotId === form.slotId && l.day === form.day) || null : null;
    const line = { ...clean, loggedBy: s?.userId || "", loggedAt: nowIso() };
    if (cur) Object.assign(cur, line);
    else d.radioLogs.unshift({ id: uid("rl"), ...line });
    const what = form.slotId ? byId(d.radioSlots, form.slotId)?.title || "Segment" : clean.title || "Extra";
    audit(d, s, "radio.log", what, stateLabel(form.kind, form.outcome) + (clean.at ? " at " + clock(clean.at) : "") + ", " + form.day + ", " + stationName(d, form.stationId));
  });
}

export function removeLog(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const cur = byId(d.radioLogs, id);
    if (!cur) return;
    d.radioLogs = d.radioLogs.filter((l) => l.id !== id);
    audit(d, s, "radio.unlog", cur.title || byId(d.radioSlots, cur.slotId)?.title || "Segment", "Took the log line for " + cur.day + " off");
  });
}

export type ScriptForm = Omit<RadioScript, "id" | "owner" | "sentAt" | "sentBy">;

export function saveScript(s: Session | null, id: string | null, form: ScriptForm) {
  let saved = "";
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!form.title.trim()) throw new Error("Give it a name.");
    if (!DAY.test(form.sendBy) || !DAY.test(form.airFrom) || !DAY.test(form.airTo)) throw new Error("Fill in the three dates.");
    if (form.airTo < form.airFrom) throw new Error("The last day on air is before the first.");
    d.radioScripts = d.radioScripts || [];
    const cur = id ? byId(d.radioScripts, id) : null;
    const clean = { ...form, title: form.title.trim(), body: form.body.trim(), note: form.note?.trim() || undefined };
    if (cur) {
      Object.assign(cur, clean);
      if (clean.status !== "sent") {
        delete cur.sentAt;
        delete cur.sentBy;
      } else if (!cur.sentAt) Object.assign(cur, { sentAt: nowIso(), sentBy: s?.userId || "" });
    } else d.radioScripts.unshift({ id: uid("rs"), owner: s?.userId || "", ...clean, ...(clean.status === "sent" ? { sentAt: nowIso(), sentBy: s?.userId || "" } : {}) });
    saved = cur ? cur.id : d.radioScripts[0].id;
    audit(d, s, cur ? "radio.script.edit" : "radio.script.add", clean.title, SCRIPT_KIND[form.kind].label + ", the station needs it by " + form.sendBy);
  });
  return saved;
}

/** Marks a script as sent to its stations (the e-mail or WhatsApp itself goes from the team's own phone). */
export function markSent(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sc = byId(d.radioScripts, id);
    if (!sc) return;
    Object.assign(sc, { status: "sent", sentAt: nowIso(), sentBy: s?.userId || "" });
    audit(d, s, "radio.script.sent", sc.title, "Sent to " + (sc.stationIds.length ? sc.stationIds.map((x) => stationName(d, x)).join(", ") : "every station"));
  });
}

export function removeScript(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sc = byId(d.radioScripts, id);
    if (!sc) return;
    d.radioScripts = d.radioScripts.filter((x) => x.id !== id);
    (d.radioLogs || []).forEach((l) => { if (l.scriptId === id) delete l.scriptId; });
    audit(d, s, "radio.script.remove", sc.title, "Deleted");
  });
}

export type StationForm = Omit<RadioStation, "id">;

export function saveStation(s: Session | null, id: string | null, form: StationForm) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!form.name.trim()) throw new Error("Give the station's name.");
    d.radioStations = d.radioStations || [];
    const cur = id ? byId(d.radioStations, id) : null;
    const clean = { ...form, name: form.name.trim(), frequency: form.frequency.trim(), contact: form.contact.trim(), phone: form.phone?.trim() || undefined, email: form.email?.trim() || undefined, note: form.note?.trim() || undefined };
    if (cur) Object.assign(cur, clean);
    else d.radioStations.push({ id: uid("st"), ...clean });
    audit(d, s, cur ? "radio.station.edit" : "radio.station.add", clean.name, cur ? "Changed the station's details" : "Added the station");
  });
}

export type SlotForm = Omit<RadioSlot, "id">;

export function saveSlot(s: Session | null, id: string | null, form: SlotForm) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!form.title.trim()) throw new Error("Give the segment a name.");
    if (!byId(d.radioStations, form.stationId)) throw new Error("Choose the station.");
    if (!form.days.length) throw new Error("Choose at least one day of the week.");
    if (!TIME.test(form.time)) throw new Error("Give the time it goes on air.");
    if (form.to && form.to < form.from) throw new Error("The last day is before the first.");
    d.radioSlots = d.radioSlots || [];
    const cur = id ? byId(d.radioSlots, id) : null;
    const clean = { ...form, title: form.title.trim(), show: form.show?.trim() || undefined, to: form.to || undefined, days: form.days.slice().sort() };
    if (cur) Object.assign(cur, clean);
    else d.radioSlots.push({ id: uid("sl"), ...clean });
    audit(d, s, cur ? "radio.slot.edit" : "radio.slot.add", clean.title, stationName(d, clean.stationId) + ", " + clean.days.map((x) => WEEKDAYS[x]).join(" ") + " at " + clock(clean.time));
  });
}

/** Stops a regular segment from a day on. Its past days and their log lines stay for the reports. */
export function endSlot(s: Session | null, id: string, lastDay: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sl = byId(d.radioSlots, id);
    if (!sl) return;
    sl.to = lastDay < sl.from ? sl.from : lastDay;
    audit(d, s, "radio.slot.end", sl.title, "Last day on air " + sl.to);
  });
}
