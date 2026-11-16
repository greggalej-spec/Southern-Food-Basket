import type { RadioOutcome, RadioScript, RadioSheet, RadioSpot, RadioStation, Seed } from "./types";

/* The radio diary's data (lib/ops/radio.ts). The stations, work order numbers, segments, dates and times are the
   stations' own November 2026 sheet ("November 2026 Segment Times Re. Southern Food Basket", sent to Gregg on
   16 November 2026). What happened to each segment before 16 November, who was on air, and the scripts are made up
   for the demo. */

const STATIONS: RadioStation[] = [
  { id: "st-ultimate", name: "95 The Ultimate 1 FM" },
  { id: "st-vibe", name: "Vibe CT 105 FM" },
  { id: "st-slam", name: "Slam 100.5 FM" },
];

type Line = { kind: RadioSpot["kind"]; time: string; days: number[] };

/** The sheet, as the stations sent it. */
const SHEET: { stationId: string; wo: string; lines: Line[] }[] = [
  {
    stationId: "st-ultimate",
    wo: "79948",
    lines: [
      { kind: "interview", time: "16:05", days: [2, 5, 10] },
      { kind: "interview", time: "16:10", days: [13, 18, 20] },
      { kind: "interview", time: "16:20", days: [24, 26] },
      { kind: "office", time: "14:35", days: [2, 5, 10, 13, 18, 20, 24, 26] },
      { kind: "weekend", time: "10:35", days: [7] },
      { kind: "weekend", time: "10:20", days: [14, 21, 28] },
    ],
  },
  {
    stationId: "st-vibe",
    wo: "79949",
    lines: [
      { kind: "interview", time: "16:05", days: [3, 6] },
      { kind: "interview", time: "15:35", days: [11, 25] },
      { kind: "interview", time: "16:35", days: [16, 19, 23, 27] },
      { kind: "office", time: "14:35", days: [3, 6, 11, 16, 19, 23, 25, 27] },
      { kind: "weekend", time: "09:35", days: [28] },
      { kind: "weekend", time: "10:20", days: [14, 21] },
      { kind: "weekend", time: "12:20", days: [7] },
    ],
  },
  {
    stationId: "st-slam",
    wo: "79950",
    lines: [
      { kind: "interview", time: "16:05", days: [4, 9] },
      { kind: "interview", time: "16:35", days: [12, 17] },
      { kind: "office", time: "14:35", days: [4, 9, 12, 17] },
      { kind: "weekend", time: "10:20", days: [21, 28] },
    ],
  },
];

const SHEETS: RadioSheet[] = SHEET.map((x) => ({ id: "rsh-" + x.stationId.slice(3) + "-2611", stationId: x.stationId, month: "2026-11", wo: x.wo, source: "scan", addedBy: "emp-tricia", addedAt: "2026-11-01T09:20:00-04:00" }));

/* ---------- what happened, 1 to 15 November (demo) ---------- */

const plus = (t: string, m: number) => {
  const x = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + m;
  return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
};

/** Anything other than "had, a minute or two after the time". null: nobody logged it. */
const EXCEPT: Record<string, { outcome: RadioOutcome; at?: string; note: string } | null> = {
  "ultimate 05 interview": { outcome: "nocall", note: "Waited by the phone until 4:30. Nobody called." },
  "vibe 06 interview": null,
  "vibe 11 office": { outcome: "missed", note: "The host was off sick. The station played a recorded segment instead." },
  "slam 12 interview": { outcome: "done", at: "16:49", note: "The host took the news first." },
  "ultimate 14 weekend": null,
};

const SPOTS: RadioSpot[] = [];
SHEET.forEach((x, si) =>
  x.lines.forEach((l) =>
    l.days.forEach((n) => {
      const day = "2026-11-" + String(n).padStart(2, "0");
      const sp: RadioSpot = { id: "rs-" + x.stationId.slice(3) + "-" + day.slice(8) + "-" + l.kind + "-" + l.time.replace(":", ""), sheetId: SHEETS[si].id, stationId: x.stationId, wo: x.wo, kind: l.kind, day, time: l.time };
      if (n < 16) {
        const key = x.stationId.slice(3) + " " + day.slice(8) + " " + l.kind;
        const e = key in EXCEPT ? EXCEPT[key] : { outcome: "done" as RadioOutcome, at: plus(l.time, (n + si) % 4), note: "" };
        if (e) {
          const at = e.outcome === "done" ? e.at || plus(l.time, 1) : undefined;
          sp.result = {
            outcome: e.outcome,
            at,
            person: l.kind === "interview" ? (n % 3 === 0 ? "emp-vishala" : "emp-tricia") : undefined,
            scriptId: e.outcome === "done" ? (l.kind === "interview" ? "sc-points" : n >= 9 ? "sc-flash" : undefined) : undefined,
            note: e.note || undefined,
            by: "emp-tricia",
            loggedAt: day + "T" + plus(at || l.time, 15) + ":00-04:00",
          };
        }
      }
      SPOTS.push(sp);
    }),
  ),
);
SPOTS.push({ id: "rs-vibe-09-extra", stationId: "st-vibe", kind: "other", day: "2026-11-09", time: "11:20", extra: true, title: "The producer called for a quick prize shout-out",
  result: { outcome: "done", at: "11:20", person: "emp-tricia", by: "emp-tricia", loggedAt: "2026-11-09T11:40:00-04:00" } });

const SCRIPTS: RadioScript[] = [
  { id: "sc-flash", kind: "hype", title: "Flash sale weekend: what to talk up", stationIds: [], sendBy: "2026-11-11", airFrom: "2026-11-09", airTo: "2026-11-15", status: "sent", owner: "emp-tricia", sentAt: "2026-11-11T15:20:00-04:00", sentBy: "emp-tricia",
    body: "Flash sale at all five stores, Friday to Sunday.\nTalk up: the snack specials, the fresh-cut veg packs, and the bakery.\nSay: open seven days, from Couva to Point Fortin.\nDo not quote prices on air: they change by store." },
  { id: "sc-points", kind: "points", title: "Interview talking points: November", stationIds: [], sendBy: "2026-11-01", airFrom: "2026-11-01", airTo: "2026-11-30", status: "sent", owner: "emp-tricia", sentAt: "2026-10-30T10:00:00-04:00", sentBy: "emp-tricia",
    body: "1. Good afternoon from Southern Food Basket.\n2. Five stores, from Couva to Point Fortin, open seven days.\n3. This week's specials: on the Specials page before you leave home.\n4. Members: check your offers on the website." },
  { id: "sc-xmas1", kind: "hype", title: "Christmas specials, week 1: office and weekend hype", stationIds: [], sendBy: "2026-11-16", airFrom: "2026-11-16", airTo: "2026-11-22", status: "ready", owner: "emp-tricia",
    body: "The Christmas specials book is open.\nTalk up: hams, black cake fruit, sorrel, and the butter cookies coming in on the 27th.\nTell people to check the Specials page before they leave home." },
  { id: "sc-hamper", kind: "hype", title: "Hamper giveaway: how to enter, the prize, the draw", stationIds: ["st-ultimate"], sendBy: "2026-11-14", airFrom: "2026-11-18", airTo: "2026-11-26", status: "ready", owner: "emp-tricia",
    body: "Prize: a Christmas hamper (demo).\nHow to enter: listen for the office hype on weekdays at 2:35.\nDraw: on air, Thursday 26 November.", note: "Waiting on the hamper photo from Addae." },
  { id: "sc-hiring", kind: "points", title: "Interview: hiring at the stores", stationIds: ["st-slam"], sendBy: "2026-11-16", airFrom: "2026-11-17", airTo: "2026-11-17", status: "draft", owner: "emp-tricia",
    body: "1. Jobs open now: apply on the Careers page in about ten minutes.\n2. What to bring: the documents each job lists.\n3. Five stores, close to home." },
];

export const RADIO_TIER: Partial<Seed> = { radioStations: STATIONS, radioSheets: SHEETS, radioSpots: SPOTS, radioScripts: SCRIPTS };
