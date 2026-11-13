import { assertCan } from "@/lib/access";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { EventKind, Flyer, Seed, Session, StoreEvent, Tone } from "@/lib/types";

/* Events and flyers. An event is anything running that a customer should know about: a promotion, an in-store event,
   something for the community, or a notice such as holiday hours. It shows on the public Events page from its first
   day to its last. A flyer is a finished picture from the graphic designer; featured flyers lead the Specials page.
   Uploaded pictures are shrunk in the browser (shrinkImage) and kept with the demo data, so a handful fit. */

export const EVENT_KIND: Record<EventKind, { label: string; tone: Tone; icon: "tag" | "calendar" | "gift" | "bell" }> = {
  promotion: { label: "Promotion", tone: "bad", icon: "tag" },
  event: { label: "In store", tone: "ok", icon: "calendar" },
  community: { label: "Community", tone: "info", icon: "gift" },
  notice: { label: "Notice", tone: "warn", icon: "bell" },
};
export const EVENT_KINDS = Object.keys(EVENT_KIND) as EventKind[];

export type EventState = "now" | "soon" | "past";
/** `today` is "YYYY-MM-DD" in Trinidad. */
export const eventState = (e: Pick<StoreEvent, "from" | "to">, today: string): EventState => (today < e.from ? "soon" : today > e.to ? "past" : "now");
export const STATE_LABEL: Record<EventState, string> = { now: "On now", soon: "Coming up", past: "Ended" };

/** Days from today to the day given; negative when it has passed. */
export function daysTo(day: string, today: string) {
  return Math.round((Date.parse(day + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86400000);
}

export function eventsByState(d: Seed, today: string) {
  const list = (d.events || []).slice().sort((a, b) => a.from.localeCompare(b.from));
  return { now: list.filter((e) => eventState(e, today) === "now"), soon: list.filter((e) => eventState(e, today) === "soon"), past: list.filter((e) => eventState(e, today) === "past").reverse() };
}

export type EventForm = Omit<StoreEvent, "id">;

export function saveEvent(s: Session | null, id: string | null, form: EventForm) {
  let saved = "";
  update((d) => {
    assertCan(d, s, "events.manage");
    if (!form.title.trim()) throw new Error("Give it a name.");
    if (form.to < form.from) throw new Error("The last day is before the first day.");
    d.events = d.events || [];
    const cur = id ? byId(d.events, id) : null;
    if (cur) Object.assign(cur, form);
    else d.events.unshift({ id: uid("ev"), ...form });
    saved = cur ? cur.id : d.events[0].id;
    audit(d, s, cur ? "events.edit" : "events.add", form.title, EVENT_KIND[form.kind].label + ", " + form.from + " to " + form.to);
  });
  return saved;
}

export function removeEvent(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "events.manage");
    const cur = byId(d.events, id);
    if (!cur) return;
    d.events = d.events.filter((e) => e.id !== id);
    audit(d, s, "events.remove", cur.title, "Taken off the Events page");
  });
}

export function addFlyers(s: Session | null, items: Pick<Flyer, "title" | "img">[]) {
  update((d) => {
    assertCan(d, s, "events.manage");
    const at = nowIso();
    d.flyers = [...items.map((f) => ({ id: uid("fl"), title: f.title, img: f.img, addedBy: s?.userId || "", addedAt: at, from: at.slice(0, 10), featured: true })), ...(d.flyers || [])];
    audit(d, s, "flyers.add", items.length === 1 ? items[0].title : items.length + " flyers", "Added to the Specials page");
  });
}

export function setFlyer(s: Session | null, id: string, patch: Partial<Pick<Flyer, "featured" | "title">>) {
  update((d) => {
    assertCan(d, s, "events.manage");
    const f = byId(d.flyers, id);
    if (!f) return;
    Object.assign(f, patch);
    audit(d, s, "flyers.edit", f.title, patch.featured == null ? "Renamed" : patch.featured ? "Featured on the Specials page" : "Taken off the Specials page");
  });
}

export function removeFlyer(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "events.manage");
    const f = byId(d.flyers, id);
    if (!f) return;
    d.flyers = d.flyers.filter((x) => x.id !== id);
    audit(d, s, "flyers.remove", f.title, "Deleted");
  });
}

/** Shrinks a chosen picture to at most `max` pixels on its long side and returns it as a JPEG data URL (about
 *  100 to 200 KB), so several fit in the browser's storage. Runs in the browser only. */
export async function shrinkImage(file: File, max = 1000): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare the picture.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.74);
}

/** A file name as a title: "snacks-under-20_FINAL.png" becomes "Snacks under 20 final". */
export function titleFromFile(name: string) {
  const t = name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "Flyer";
}

/* ---------- many specials at once ---------- */

export type DealRow = { name: string; price: number | null; dept: string; problem?: string };

/** Reads pasted rows or a .csv into specials: one per line, "name, price" or "name, price, department". The
 *  department is matched on its name or short name; a line it cannot place lands in `fallback`. */
export function parseDeals(text: string, depts: { id: string; name: string; short: string }[], fallback: string): DealRow[] {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(l.includes("\t") ? "\t" : l.includes(";") ? ";" : ",").map((c) => c.trim().replace(/^"|"$/g, "")))
    .filter((c) => c[0] && !/^(item|name|product)$/i.test(c[0]))
    .map((c): DealRow => {
      const money = (c[1] || "").replace(/[^0-9.]/g, "");
      const price = money && Number.isFinite(Number(money)) && Number(money) > 0 ? Math.round(Number(money) * 100) / 100 : null;
      const want = norm(c[2] || "");
      const dept = want ? depts.find((x) => norm(x.name) === want || norm(x.short) === want || norm(x.name).includes(want) || want.includes(norm(x.short))) : undefined;
      return { name: c[0], price, dept: dept?.id || fallback, problem: price == null ? "No price" : undefined };
    });
}
