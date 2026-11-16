import type { RadioLog, RadioOutcome, RadioScript, RadioSlot, RadioStation, Seed } from "./types";

/* The radio diary's demo data (lib/ops/radio.ts). Everything here is made up: the company's real stations, shows and
   times are not on record, so the three stations have invented names and no frequency. Marketing replaces them with
   the real ones in the Radio section. The log runs from 26 October to the morning of 16 November 2026. */

const STATIONS: RadioStation[] = [
  { id: "st-wave", name: "South Wave FM", frequency: "", contact: "Morning Drive producer (demo)", phone: "868 555 0190", note: "Made up for the demo. Put in the real station." },
  { id: "st-cane", name: "Cane Country Radio", frequency: "", contact: "Weekend producer (demo)", email: "producer@example.com", note: "Made up for the demo. Put in the real station." },
  { id: "st-gulf", name: "Gulf City Talk", frequency: "", contact: "Community Corner host (demo)", phone: "868 555 0163", note: "Made up for the demo. Put in the real station." },
];

const SLOTS: RadioSlot[] = [
  { id: "sl-wave-am", stationId: "st-wave", kind: "call", title: "Specials call-in", show: "The Morning Drive", days: [1, 2, 3, 4, 5], time: "07:40", minutes: 5, person: "emp-tricia", from: "2026-10-05" },
  { id: "sl-wave-ad", stationId: "st-wave", kind: "ad", title: "Christmas specials ad, 30 seconds", show: "Lunchtime", days: [0, 1, 2, 3, 4, 5, 6], time: "12:05", minutes: 1, person: "emp-addae", from: "2026-11-09", to: "2026-12-24" },
  { id: "sl-cane-sat", stationId: "st-cane", kind: "read", title: "Weekend specials live read", show: "Saturday Mix", days: [6], time: "10:15", minutes: 1, person: "emp-addae", from: "2026-10-03" },
  { id: "sl-cane-prize", stationId: "st-cane", kind: "call", title: "Hamper giveaway call", show: "Drive Time", days: [2, 4], time: "17:15", minutes: 5, person: "emp-tricia", from: "2026-11-17", to: "2026-11-28" },
  { id: "sl-gulf-wed", stationId: "st-gulf", kind: "interview", title: "Community Corner: the Managing Director", show: "Community Corner", days: [3], time: "16:30", minutes: 10, person: "emp-vishala", from: "2026-10-07" },
];

const SCRIPTS: RadioScript[] = [
  { id: "rs-flash", kind: "hype", title: "Flash sale weekend: what to talk up", stationIds: [], sendBy: "2026-11-11", airFrom: "2026-11-09", airTo: "2026-11-15", status: "sent", owner: "emp-tricia", sentAt: "2026-11-11T15:20:00-04:00", sentBy: "emp-tricia",
    body: "Flash sale at all five stores, Friday to Sunday.\nTalk up: the snack specials, the fresh-cut veg packs, and the bakery.\nSay: open seven days, from Couva to Point Fortin.\nDo not quote prices on air: they change by store." },
  { id: "rs-xmas1", kind: "hype", title: "Christmas specials, week 1: what to talk up", stationIds: [], sendBy: "2026-11-13", airFrom: "2026-11-16", airTo: "2026-11-22", status: "sent", owner: "emp-tricia", sentAt: "2026-11-13T11:05:00-04:00", sentBy: "emp-tricia",
    body: "The Christmas specials book is open.\nTalk up: hams, black cake fruit, sorrel, and the butter cookies coming in on the 27th.\nTell people to check the Specials page before they leave home." },
  { id: "rs-monday", kind: "points", title: "Talking points: Monday specials call", stationIds: ["st-wave"], sendBy: "2026-11-16", airFrom: "2026-11-16", airTo: "2026-11-16", status: "ready", owner: "emp-tricia",
    body: "1. Good morning from Southern Food Basket.\n2. The Christmas specials book is open this week.\n3. Five stores, open seven days.\n4. Members: check your offers on the website." },
  { id: "rs-hamper", kind: "hype", title: "Hamper giveaway: how to enter, the prize, the draw", stationIds: ["st-cane"], sendBy: "2026-11-14", airFrom: "2026-11-17", airTo: "2026-11-28", status: "ready", owner: "emp-tricia",
    body: "Prize: a Christmas hamper (demo).\nHow to enter: listen for the call on Drive Time, Tuesdays and Thursdays.\nDraw: on air, Friday 28 November.\nThe station needs this before the first call on Tuesday.", note: "Waiting on the hamper photo from Addae." },
  { id: "rs-sat", kind: "read", title: "Saturday live read: Christmas shop", stationIds: ["st-cane"], sendBy: "2026-11-19", airFrom: "2026-11-21", airTo: "2026-11-21", status: "draft", owner: "emp-addae",
    body: "This Christmas, shop the south’s favourite: Southern Food Basket. Hams, black cake fruit and everything for the table, at five stores from Couva to Point Fortin. Open seven days. D Best 4 Less." },
  { id: "rs-ad", kind: "ad", title: "Christmas ad, 30 seconds: brief for the station", stationIds: ["st-wave"], sendBy: "2026-11-06", airFrom: "2026-11-09", airTo: "2026-12-24", status: "sent", owner: "emp-addae", sentAt: "2026-11-05T16:40:00-04:00", sentBy: "emp-addae",
    body: "Voice: warm, local. Music: parang bed.\nLines: the Christmas specials, five stores, open seven days, D Best 4 Less.\nEnd on the logo line: Southern Food Basket." },
  { id: "rs-corner", kind: "points", title: "Community Corner: hiring at the stores", stationIds: ["st-gulf"], sendBy: "2026-11-17", airFrom: "2026-11-18", airTo: "2026-11-18", status: "draft", owner: "emp-tricia",
    body: "1. Jobs open now: apply on the Careers page in about ten minutes.\n2. What to bring: the documents each job lists.\n3. Five stores, close to home." },
];

/* ---------- three weeks of log lines ---------- */

const day = (d: string, n: number) => new Date(Date.parse(d + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
const plus = (t: string, m: number) => {
  const x = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) + m;
  return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0");
};

/** What went differently from "had, a minute or two after the time". A null line means nobody logged it. */
const EXCEPT: Record<string, { outcome: RadioOutcome; at?: string; note: string } | null> = {
  "2026-10-28 sl-wave-am": { outcome: "missed", note: "Nobody called: Isabel was at the supplier meeting and nobody covered." },
  "2026-11-04 sl-gulf-wed": { outcome: "dropped", note: "The host ran long on the news. Moved us to next week." },
  "2026-11-06 sl-wave-am": { outcome: "done", at: "07:58", note: "The host took the traffic first." },
  "2026-11-10 sl-wave-am": { outcome: "missed", note: "Called at 7:40 but the line was busy. Tried twice." },
  "2026-11-12 sl-wave-am": null,
  "2026-11-13 sl-wave-ad": { outcome: "missed", note: "Not heard at 12:05. Asked the producer to check the station’s log." },
  "2026-11-14 sl-cane-sat": { outcome: "off", note: "Outside broadcast at the mall. The read moves to next Saturday." },
  "2026-11-15 sl-wave-ad": null,
};

function logs(): RadioLog[] {
  const out: RadioLog[] = [];
  for (let d = "2026-10-26"; d <= "2026-11-16"; d = day(d, 1)) {
    const wd = new Date(d + "T12:00:00Z").getUTCDay();
    SLOTS.filter((s) => s.from <= d && (!s.to || s.to >= d) && s.days.includes(wd)).forEach((s, i) => {
      if (d === "2026-11-16" && s.time > "08:00") return; // later today: not on air yet
      const key = d + " " + s.id;
      const x = key in EXCEPT ? EXCEPT[key] : { outcome: "done" as RadioOutcome, at: plus(s.time, (Number(d.slice(8)) + i) % 4), note: "" };
      if (!x) return;
      const at = x.outcome === "done" ? x.at || plus(s.time, 2) : undefined;
      const script = s.id === "sl-wave-am" ? (d >= "2026-11-16" ? "rs-monday" : d >= "2026-11-09" ? "rs-flash" : undefined) : s.id === "sl-wave-ad" ? "rs-ad" : undefined;
      out.push({
        id: "rl-" + d.slice(5).replace("-", "") + "-" + s.id.slice(3), slotId: s.id, stationId: s.stationId, kind: s.kind, day: d, outcome: x.outcome, at, person: s.person,
        scriptId: x.outcome === "done" ? script : undefined, note: x.note || undefined, loggedBy: s.person === "emp-vishala" ? "emp-tricia" : s.person, loggedAt: d + "T" + plus(at || s.time, 12) + ":00-04:00",
      });
    });
  }
  out.push({ id: "rl-1111-extra", slotId: null, stationId: "st-gulf", kind: "interview", day: "2026-11-11", outcome: "done", at: "09:15", person: "emp-jameel", title: "Christmas opening hours on the news break", note: "The producer called us that morning.", loggedBy: "emp-tricia", loggedAt: "2026-11-11T09:40:00-04:00" });
  return out.sort((a, b) => b.day.localeCompare(a.day) || (b.at || "").localeCompare(a.at || ""));
}

export const RADIO_TIER: Partial<Seed> = { radioStations: STATIONS, radioSlots: SLOTS, radioScripts: SCRIPTS, radioLogs: logs() };
