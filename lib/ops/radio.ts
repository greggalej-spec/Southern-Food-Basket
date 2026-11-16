import { assertCan } from "@/lib/access";
import { toTtInput, ttDay } from "@/lib/admin/tt";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { RadioKind, RadioOutcome, RadioScript, RadioSheet, RadioSpot, RadioStation, ScriptKind, Seed, Session } from "@/lib/types";

/* The radio diary. Each station sends a sheet for the month ("November 2026 Segment Times Re. Southern Food
   Basket"): a work order number, then the interviews, the office hype and the weekend hype, each as a time and a list
   of dates. Marketing pastes that sheet in once (readSheet), checks it, and every date becomes a booked segment.
   After that the work is one tap per segment: had it (and when), nobody called, or not had. The month view lays the
   segments out the way the sheet does, and the report counts them. Days and times are Trinidad's (UTC-4 all year).
   Only `nowTT` reads the clock. */

export const RADIO_KIND: Record<RadioKind, { label: string; short: string; tone: "clay" | "info" | "ok" | "warn" }> = {
  interview: { label: "Interview", short: "Interview", tone: "clay" },
  office: { label: "Office hype", short: "Office", tone: "info" },
  weekend: { label: "Weekend hype", short: "Weekend", tone: "ok" },
  other: { label: "Something extra", short: "Extra", tone: "warn" },
};
export const RADIO_KINDS: RadioKind[] = ["interview", "office", "weekend", "other"];

export type SpotState = RadioOutcome | "due" | "unlogged";

export const STATE: Record<SpotState, { label: string; tone: "ok" | "bad" | "warn" | "info" | "neutral" }> = {
  done: { label: "Had", tone: "ok" },
  nocall: { label: "Nobody called", tone: "bad" },
  missed: { label: "Not had", tone: "bad" },
  due: { label: "Coming up", tone: "neutral" },
  unlogged: { label: "Not logged", tone: "warn" },
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Trinidad's day ("YYYY-MM-DD") and time ("HH:MM") now. Call after hydration. */
export function nowTT() {
  const v = toTtInput(new Date().toISOString());
  return { day: v.slice(0, 10), time: v.slice(11, 16) };
}
export type Now = ReturnType<typeof nowTT>;

export const weekday = (day: string) => new Date(day + "T12:00:00Z").getUTCDay();
export const addDays = (day: string, n: number) => new Date(Date.parse(day + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
export const monthName = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1] + " " + month.slice(0, 4);
export function addMonths(month: string, n: number) {
  const y = Number(month.slice(0, 4)), m = Number(month.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
  return yy + "-" + String(mm + 1).padStart(2, "0");
}
export const daysIn = (month: string) => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();

/** Minutes after the booked time it went on air; negative when early. */
export function minutesLate(time: string, at: string) {
  const m = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  return m(at) - m(time);
}
export const LATE_AFTER = 10;

export function stationName(d: Seed, id: string) {
  return byId(d.radioStations, id)?.name || "A station no longer listed";
}

/** A one-word name for a calendar chip: "95 The Ultimate 1 FM" -> "Ultimate". */
export function shortName(name: string) {
  const w = name.replace(/\b\d+(\.\d+)?\b|\bFM\b|\bAM\b|\bThe\b|\bRadio\b/gi, " ").trim().split(/\s+/)[0];
  return w || name;
}

/** A sheet's segments as the sheet writes them: for each kind, each time with its dates. */
export function sheetLines(d: Seed, sheetId: string): SheetLine[] {
  const lines: SheetLine[] = [];
  (d.radioSpots || [])
    .filter((x) => x.sheetId === sheetId)
    .sort(byTime)
    .forEach((x) => {
      const n = Number(x.day.slice(8, 10));
      const l = lines.find((y) => y.kind === x.kind && y.time === x.time);
      if (l) l.days.push(n);
      else lines.push({ kind: x.kind, time: x.time, days: [n] });
    });
  const order = (k: RadioKind) => RADIO_KINDS.indexOf(k);
  return lines.sort((a, b) => order(a.kind) - order(b.kind) || a.days[0] - b.days[0]);
}

export function sheetsIn(d: Seed, month: string) {
  return (d.radioSheets || []).filter((x) => x.month === month).sort((a, b) => stationName(d, a.stationId).localeCompare(stationName(d, b.stationId)));
}

/** A segment's state: what was logged, or "Coming up" until its time, then "Not logged". */
export function spotState(sp: RadioSpot, now: Now): SpotState {
  if (sp.result) return sp.result.outcome;
  return sp.day < now.day || (sp.day === now.day && sp.time <= now.time) ? "unlogged" : "due";
}

const byTime = (a: RadioSpot, b: RadioSpot) => a.day.localeCompare(b.day) || a.time.localeCompare(b.time) || a.stationId.localeCompare(b.stationId);

export function spotsOn(d: Seed, day: string) {
  return (d.radioSpots || []).filter((s) => s.day === day).sort(byTime);
}

export function spotsBetween(d: Seed, from: string, to: string) {
  return (d.radioSpots || []).filter((s) => s.day >= from && s.day <= to).sort(byTime);
}

export type Totals = Record<SpotState, number> & { booked: number; late: number; extras: number };

/** Counts for a set of segments. "Booked" leaves out the extras, which are counted on their own. */
export function totals(list: RadioSpot[], now: Now): Totals {
  const t: Totals = { booked: 0, done: 0, nocall: 0, missed: 0, due: 0, unlogged: 0, late: 0, extras: 0 };
  list.forEach((sp) => {
    if (sp.extra) return void t.extras++;
    t.booked++;
    t[spotState(sp, now)]++;
    if (sp.result?.at && minutesLate(sp.time, sp.result.at) > LATE_AFTER) t.late++;
  });
  return t;
}

/* ---------- reading a station's sheet ---------- */

export type SheetLine = { kind: RadioKind; time: string; days: number[] };
export type SheetStation = { name: string; wo: string; lines: SheetLine[] };
export type Sheet = { month: string; stations: SheetStation[]; problems: string[] };

const KIND_WORDS: [RegExp, RadioKind][] = [
  [/[il1]nterv/i, "interview"],
  [/of+[il1]ce/i, "office"],
  [/week\s*end/i, "weekend"],
];

/** A time as a scanned sheet may give it: "4:05pm", "4.05 pm", "405pm", "1035am", "4:05 p.m.", followed by "on". */
const TIME_ON = /(\d{1,2})\s*[:.;,]?\s*(\d{2})\s*([ap])?\s*\.?\s*m\.?\s*[oe]n(?![a-z])/gi;

/** Reads the text of a station's sheet, typed, pasted from the e-mail or the Word file, or read off a picture:
 *    November 2026 Segment Times Re. Southern Food Basket
 *    WO#79948 – 95 The Ultimate 1 FM
 *    Interview:
 *    @ 4:05pm on 2nd , 5th , 10th
 *    Office Hype: @ 2:35pm on 2nd , 5th , 10th
 *  `fallbackMonth` ("2026-11") is used when the text does not name the month. A picture's small "nd" and "th" often
 *  come out as stray marks or an extra digit ("23rd" as "237"): a date bigger than the month loses its last digit. */
export function readSheet(text: string, fallbackMonth: string): Sheet {
  const problems: string[] = [];
  const named = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
  const month = named ? named[2] + "-" + String(MONTHS.findIndex((m) => m.toLowerCase() === named[1].toLowerCase()) + 1).padStart(2, "0") : fallbackMonth;
  const last = daysIn(month);
  const stations: SheetStation[] = [];
  let st: SheetStation | null = null;
  let kind: RadioKind | null = null;
  text.split(/\r?\n/).forEach((raw) => {
    const line = raw.replace(/[•●▪◦·]/g, " ").replace(/\s+/g, " ").trim();
    if (!line) return;
    // "WO#79948 – 95 The Ultimate 1 FM"; a scan may add a stray mark ("WO#£79949") or read the O as a zero
    const head = line.match(/\bW\s*[O0][^A-Za-z0-9]{0,4}(\d{4,})[^A-Za-z0-9]*(.+)$/i);
    if (head) {
      st = { wo: head[1], name: head[2].replace(/[.,;:]+$/, "").trim(), lines: [] };
      stations.push(st);
      kind = null;
      return;
    }
    const times = Array.from(line.matchAll(TIME_ON));
    const before = times.length ? line.slice(0, times[0].index) : line;
    const k = KIND_WORDS.find(([re]) => re.test(before));
    if (k) kind = k[1];
    times.forEach((m, n) => {
      if (!st) return void problems.push("A time came before any station line (WO# – station): " + line);
      if (!kind) return void problems.push("A time with no Interview, Office Hype or Weekend Hype above it: " + line);
      const hh = Number(m[1]), mm = Number(m[2]);
      if (hh < 1 || hh > 12 || mm > 59) return void problems.push("A time that could not be read: " + line);
      // no a or p read: the morning for 7 to 11 o'clock, the afternoon otherwise
      const pm = m[3] ? /p/i.test(m[3]) : hh === 12 || hh < 7;
      const h = (hh % 12) + (pm ? 12 : 0);
      const tail = line.slice((m.index || 0) + m[0].length, n + 1 < times.length ? times[n + 1].index : undefined);
      const days = Array.from(tail.matchAll(/\d{1,3}/g))
        .map((x) => {
          let v = Number(x[0]);
          while (v > last && v >= 10) v = Math.floor(v / 10);
          return v;
        })
        .filter((v) => v >= 1 && v <= last);
      if (!days.length) return void problems.push("No dates found after the time: " + line);
      (st as SheetStation).lines.push({ kind, time: String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0"), days: Array.from(new Set(days)).sort((a, b) => a - b) });
    });
  });
  if (!stations.length) problems.push("No station line found. Each station starts with its work order: WO#79948 – 95 The Ultimate 1 FM");
  return { month, stations, problems };
}

/** The station on the list a scanned name most likely means ("Vibe CT 105 EM" is "Vibe CT 105 FM"), or null. */
export function likelyStation(d: Seed, name: string) {
  const words = (v: string) => v.toLowerCase().replace(/[^a-z0-9. ]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const want = words(name);
  let best: RadioStation | null = null, score = 0;
  for (const x of d.radioStations || []) {
    const have = words(x.name);
    const hit = want.filter((w) => have.includes(w)).length / Math.max(have.length, want.length, 1);
    if (hit > score) {
      score = hit;
      best = x;
    }
  }
  return score >= 0.5 ? best : null;
}

/** Checks a month's lines for what is easy to misread: a weekend hype on a weekday, a weekday hype at the weekend. */
export function sheetWarnings(month: string, lines: SheetLine[]) {
  const out: string[] = [];
  lines.forEach((l) =>
    l.days.forEach((n) => {
      const wd = weekday(month + "-" + String(n).padStart(2, "0"));
      const weekend = wd === 0 || wd === 6;
      if (l.kind === "weekend" && !weekend) out.push("Weekend hype on " + WEEKDAYS[wd] + " " + n + ": check the date.");
      if (l.kind === "office" && weekend) out.push("Office hype on " + WEEKDAYS[wd] + " " + n + ": check the date.");
    }),
  );
  // the stations book an interview and an office hype on the same days: a day with only one of them is worth a look
  const on = (k: RadioKind) => new Set(lines.filter((l) => l.kind === k).flatMap((l) => l.days));
  const iv = on("interview"), of = on("office");
  if (iv.size && of.size) {
    const on2 = (n: number) => WEEKDAYS[weekday(month + "-" + String(n).padStart(2, "0"))] + " " + n;
    iv.forEach((n) => { if (!of.has(n)) out.push("An interview on " + on2(n) + " but no office hype that day: check the date."); });
    of.forEach((n) => { if (!iv.has(n)) out.push("An office hype on " + on2(n) + " but no interview that day: check the date."); });
  }
  return out;
}

/** How many segments a sheet holds. */
export const sheetCount = (sh: Sheet) => sh.stations.reduce((n, s) => n + s.lines.reduce((k, l) => k + l.days.length, 0), 0);

/* ---------- scripts ---------- */

export const SCRIPT_KIND: Record<ScriptKind, { label: string; hint: string }> = {
  points: { label: "Talking points", hint: "What to cover in an interview" },
  hype: { label: "Hype pack", hint: "Specials, prizes and store news for the office or weekend hype" },
  read: { label: "Live read", hint: "Words the host reads out as written" },
  ad: { label: "Ad brief", hint: "What the station needs to make or play an ad" },
};
export const SCRIPT_KINDS: ScriptKind[] = ["points", "hype", "read", "ad"];

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

export type SheetForm = { month: string; stationId: string | null; stationName: string; wo: string; source: RadioSheet["source"]; lines: SheetLine[] };

/** Saves one station's schedule for a month, from a scanned sheet or made by hand. A station not yet on the list is
 *  added. If the station already has a schedule that month, this one replaces it: a date that stays keeps what was
 *  logged on it (its time may change); a date taken off goes, unless it was already logged, in which case it stays in
 *  the history. Returns what changed. */
export function saveSheet(s: Session | null, form: SheetForm) {
  const out = { added: 0, removed: 0, kept: 0, moved: 0 };
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!/^\d{4}-\d{2}$/.test(form.month)) throw new Error("Choose the month.");
    const count = form.lines.reduce((n, l) => n + l.days.length, 0);
    if (!count) throw new Error("Add at least one time and one date.");
    if (form.lines.some((l) => !TIME.test(l.time))) throw new Error("Every line needs a time.");
    d.radioStations = d.radioStations || [];
    d.radioSheets = d.radioSheets || [];
    d.radioSpots = d.radioSpots || [];
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
    let st = form.stationId ? byId(d.radioStations, form.stationId) : d.radioStations.find((x) => norm(x.name) === norm(form.stationName)) || null;
    if (!st) {
      if (!form.stationName.trim()) throw new Error("Give the station's name.");
      st = { id: uid("st"), name: form.stationName.trim() };
      d.radioStations.push(st);
    }
    const stationId = st.id;
    const at = nowIso(), me = s?.userId || "";
    let sheet = d.radioSheets.find((x) => x.stationId === stationId && x.month === form.month) || null;
    if (sheet) Object.assign(sheet, { wo: form.wo.trim() || sheet.wo, editedBy: me, editedAt: at });
    else {
      sheet = { id: uid("rsh"), stationId, month: form.month, wo: form.wo.trim() || undefined, source: form.source, addedBy: me, addedAt: at };
      d.radioSheets.push(sheet);
    }
    const sh = sheet;
    const mine = d.radioSpots.filter((x) => x.sheetId === sh.id);
    const used = new Set<string>();
    form.lines.forEach((l) =>
      Array.from(new Set(l.days)).forEach((n) => {
        const day = form.month + "-" + String(n).padStart(2, "0");
        const same = mine.find((x) => !used.has(x.id) && x.kind === l.kind && x.day === day && x.time === l.time) || mine.find((x) => !used.has(x.id) && x.kind === l.kind && x.day === day);
        if (same) {
          used.add(same.id);
          if (same.time !== l.time) {
            same.time = l.time;
            out.moved++;
          }
          same.wo = sh.wo;
          return;
        }
        d.radioSpots.push({ id: uid("rs"), sheetId: sh.id, stationId, wo: sh.wo, kind: l.kind, day, time: l.time });
        out.added++;
      }),
    );
    d.radioSpots = d.radioSpots.filter((x) => {
      if (x.sheetId !== sh.id || used.has(x.id) || !mine.includes(x)) return true;
      if (x.result) {
        out.kept++;
        return true;
      }
      out.removed++;
      return false;
    });
    audit(d, s, mine.length ? "radio.sheet.edit" : "radio.sheet.add", st.name + ", " + monthName(form.month), (form.source === "scan" ? "Scanned sheet" : "Made by hand") + (sh.wo ? ", WO#" + sh.wo : "") + ": " + out.added + " added, " + out.moved + " moved, " + out.removed + " taken off");
  });
  return out;
}

/** Deletes a station's schedule for a month. Segments already logged stay in the history. */
export function removeSheet(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sh = byId(d.radioSheets, id);
    if (!sh) return;
    d.radioSheets = d.radioSheets.filter((x) => x.id !== id);
    d.radioSpots = (d.radioSpots || []).filter((x) => x.sheetId !== id || !!x.result);
    d.radioSpots.forEach((x) => {
      if (x.sheetId === id) delete x.sheetId;
    });
    audit(d, s, "radio.sheet.remove", stationName(d, sh.stationId) + ", " + monthName(sh.month), "Schedule deleted; logged segments kept");
  });
}

export type SpotForm = Pick<RadioSpot, "stationId" | "kind" | "day" | "time" | "title">;

/** Adds something extra that was not on a sheet (the station called us in), or changes one. */
export function saveSpot(s: Session | null, id: string | null, form: SpotForm) {
  let saved = id || "";
  update((d) => {
    assertCan(d, s, "radio.manage");
    if (!byId(d.radioStations, form.stationId)) throw new Error("Choose the station.");
    if (!DAY.test(form.day)) throw new Error("Choose the day.");
    if (!TIME.test(form.time)) throw new Error("Give the time.");
    if (!(form.title || "").trim()) throw new Error("Say what it was.");
    d.radioSpots = d.radioSpots || [];
    const cur = id ? byId(d.radioSpots, id) : null;
    const clean = { ...form, title: form.title?.trim() || undefined, extra: true as const };
    if (cur) Object.assign(cur, clean);
    else {
      saved = uid("rs");
      d.radioSpots.push({ id: saved, ...clean });
    }
    audit(d, s, cur ? "radio.spot.edit" : "radio.spot.add", clean.title || RADIO_KIND[form.kind].label, stationName(d, form.stationId) + ", " + form.day + " at " + form.time);
  });
  return saved;
}

export function removeSpot(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sp = byId(d.radioSpots, id);
    if (!sp) return;
    d.radioSpots = d.radioSpots.filter((x) => x.id !== id);
    audit(d, s, "radio.spot.remove", sp.title || RADIO_KIND[sp.kind].label, stationName(d, sp.stationId) + ", " + sp.day + " at " + sp.time + ": taken off");
  });
}

export type ResultForm = { outcome: RadioOutcome; at?: string; person?: string; scriptId?: string; note?: string };

/** Records what happened to a segment. Logging it again replaces what was there. */
export function logSpot(s: Session | null, id: string, form: ResultForm) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sp = byId(d.radioSpots, id);
    if (!sp) throw new Error("That segment is no longer on the list.");
    if (sp.day > ttDay(Date.now())) throw new Error("That day has not come yet.");
    if (form.outcome === "done" && !TIME.test(form.at || "")) throw new Error("Give the time it went on air.");
    sp.result = {
      outcome: form.outcome,
      at: form.outcome === "done" ? form.at : undefined,
      person: form.person || undefined,
      scriptId: form.outcome === "done" ? form.scriptId || undefined : undefined,
      note: form.note?.trim() || undefined,
      by: s?.userId || "",
      loggedAt: nowIso(),
    };
    audit(d, s, "radio.log", sp.title || RADIO_KIND[sp.kind].label, STATE[form.outcome].label + (sp.result.at ? " at " + sp.result.at : "") + ", " + sp.day + ", " + stationName(d, sp.stationId));
  });
}

export function clearLog(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "radio.manage");
    const sp = byId(d.radioSpots, id);
    if (!sp?.result) return;
    delete sp.result;
    audit(d, s, "radio.unlog", sp.title || RADIO_KIND[sp.kind].label, stationName(d, sp.stationId) + ", " + sp.day + ": back to not logged");
  });
}

export type ScriptForm = Omit<RadioScript, "id" | "owner" | "sentAt" | "sentBy">;

export function saveScript(s: Session | null, id: string | null, form: ScriptForm) {
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
    } else d.radioScripts.unshift({ id: uid("sc"), owner: s?.userId || "", ...clean, ...(clean.status === "sent" ? { sentAt: nowIso(), sentBy: s?.userId || "" } : {}) });
    audit(d, s, cur ? "radio.script.edit" : "radio.script.add", clean.title, SCRIPT_KIND[form.kind].label + ", the station needs it by " + form.sendBy);
  });
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
    (d.radioSpots || []).forEach((sp) => {
      if (sp.result?.scriptId === id) delete sp.result.scriptId;
    });
    audit(d, s, "radio.script.remove", sc.title, "Deleted");
  });
}
