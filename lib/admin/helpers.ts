import type { Permission } from "@/lib/access";
import { parseDay } from "@/lib/format";
import { SEED } from "@/lib/seed";
import { byId } from "@/lib/store";
import type { Department, Seed, Special } from "@/lib/types";

// The small helpers at the top of admin.js, and the console's sections. Pure, except todayIso, which reads the clock
// (call it after hydration).

/** The console's sections, in sidebar order. They match the OFFICE ids in components/app-shell.tsx. "staffnews" is
 *  the Staff updates section (components/admin/staff-updates-panel.tsx). */
export const TABS = ["today", "deals", "posts", "stores", "notices", "publish", "staffnews", "promos", "codes", "newsletter", "list", "access", "audit"] as const;
export type AdminTab = (typeof TABS)[number];

/** What a section needs: any one of the list will do. Today needs nothing; it shows what the session may see. */
export const TAB_PERMS: Record<AdminTab, Permission[]> = {
  today: [],
  deals: ["specials.edit"],
  posts: ["posts.make"],
  stores: ["stores.edit"],
  notices: ["notices.post"],
  publish: ["site.publish"],
  staffnews: ["staff.updates"],
  promos: ["promos.draft", "promos.approve"],
  codes: ["codes.view"],
  newsletter: ["newsletter.view"],
  list: ["newsletter.view"],
  access: ["access.manage"],
  audit: ["audit.view"],
};

/** "#promos" and "#promos/promo-christmas" both show Promotions. Anything unknown falls back to Today. */
export function tabOf(hash: string): AdminTab {
  const h = hash.replace(/^#/, "").split("/")[0];
  return (TABS as readonly string[]).includes(h) ? (h as AdminTab) : "today";
}

/** The item after the section in the hash ("#promos/promo-christmas" -> "promo-christmas"), or null. */
export function itemOf(hash: string): string | null {
  const rest = hash.replace(/^#/, "").split("/").slice(1).join("/");
  if (!rest) return null;
  try {
    return decodeURIComponent(rest);
  } catch {
    return null;
  }
}

/** Shows a section by setting the hash, which fires hashchange. */
export function goToTab(id: AdminTab, item?: string) {
  location.hash = item ? id + "/" + encodeURIComponent(item) : id;
}

export function todayIso() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function isDay(v: string | null | undefined) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !isNaN(parseDay(String(v)).getTime());
}

export function stemOf(img: string | null | undefined) {
  return String(img || "").replace(/^.*\//, "").replace(/\.webp$/i, "");
}

export function photoSrc(stem: string) {
  return "/assets/img/photos/" + stem + ".webp";
}

export function photoLabel(stem: string) {
  const t = String(stem).replace(/-/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function dollars(v: number | string) {
  return "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dept(d: Seed, id: string): Pick<Department, "id" | "name" | "short"> {
  return byId(d.departments, id) || { id, name: id, short: id };
}

export function branchName(d: Seed, id: string) {
  const b = byId(d.branches, id);
  return b ? b.name : "A store no longer listed";
}

export function retailDepts(d: Seed) {
  return (d.departments || []).filter((x) => x.id !== "wholesale");
}

export function newestFirst(list: Special[]) {
  return list.slice().sort((a, b) => (a.posted < b.posted ? 1 : a.posted > b.posted ? -1 : 0));
}

export function plural(n: number, one: string, many?: string) {
  return n + " " + (n === 1 ? one : many || one + "s");
}

/** The photo library: every distinct photo already used by a deal or a department, in the seed or in this browser. */
export function photoLibrary(d: Seed) {
  const seen = new Set<string>();
  const add = (img: string) => {
    const st = stemOf(img);
    if (/^[a-z0-9][a-z0-9-]*$/i.test(st)) seen.add(st);
  };
  [SEED, d].forEach((src) => {
    (src.specials || []).forEach((sp) => add(sp.img));
    (src.departments || []).forEach((x) => add(x.img));
  });
  return Array.from(seen).sort();
}

/** Key-order-independent JSON, so "changed then changed back" counts as unchanged. */
export function canon(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return (
      "{" +
      Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canon(o[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v === undefined ? null : v);
}

export function cssEsc(v: string) {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, "\\$&");
}

/** The deals the table shows: newest first, filtered by department and by a search over name and department. */
export function shownDeals(d: Seed, deptId: string, query: string) {
  const q = query.trim().toLowerCase();
  return newestFirst(d.specials || []).filter(
    (sp) => (deptId === "all" || sp.dept === deptId) && (!q || (String(sp.name) + " " + dept(d, sp.dept).name).toLowerCase().indexOf(q) !== -1),
  );
}

/** aria-describedby for a field: its hint (if any) and, while it shows one, its error. */
export function describedBy(hintId: string | null, errId: string, msg: string | undefined) {
  return [hintId || "", msg ? errId : ""].filter(Boolean).join(" ") || undefined;
}

export type Errors<K extends string> = Partial<Record<K, string>>;

/* ---------- checks (the check() functions in admin.js) ---------- */

export type DealValues = {
  name: string;
  dept: string;
  price: string;
  posted: string;
  img: string;
  isNew: boolean;
  couva: boolean;
  alt: string;
};
export const DEAL_FIELDS = ["name", "price", "posted", "img", "alt"] as const;
export type DealField = (typeof DEAL_FIELDS)[number];

export function readDeal(v: DealValues) {
  const priceRaw = v.price.trim(), price = Number(priceRaw);
  return {
    name: v.name.trim().replace(/\s+/g, " "),
    dept: v.dept,
    priceRaw,
    price,
    posted: v.posted,
    img: v.img,
    isNew: v.isNew,
    couva: v.couva,
    alt: v.alt.trim().replace(/\s+/g, " "),
  };
}
export type DealRecord = ReturnType<typeof readDeal>;

export function checkDeal(v: DealValues, lib: string[]) {
  const r = readDeal(v), e: Errors<DealField> = {};
  if (!r.name) e.name = "Enter the deal name, for example “Chunky veg pack”.";
  if (!r.priceRaw || !isFinite(r.price) || r.price <= 0) e.price = "Enter a price above 0, for example 24.95.";
  else if (Math.abs(r.price * 100 - Math.round(r.price * 100)) > 1e-6) e.price = "Use no more than two decimal places, for example 24.95.";
  else if (r.price >= 100000) e.price = "Enter a price below TTD 100,000.00.";
  if (!isDay(r.posted)) e.posted = "Choose the date the deal was posted.";
  if (!lib.includes(r.img)) e.img = "Choose a photo from the list.";
  if (!r.alt) e.alt = "Describe the photo in a few words, for example “Tray of cut carrot and broccoli”.";
  return e;
}

export type StoreValues = { ms: string; sun: string; phone: string };
export const STORE_FIELDS = ["ms", "sun", "phone"] as const;
export type StoreField = (typeof STORE_FIELDS)[number];

export function checkStore(v: StoreValues) {
  const e: Errors<StoreField> = {}, ms = v.ms.trim(), sun = v.sun.trim(), ph = v.phone.trim();
  if (!ms) e.ms = "Enter the Monday to Saturday hours, for example “7:00 am – 10:00 pm”. Write “Closed” if the store is shut.";
  if (!sun) e.sun = "Enter the Sunday hours, for example “7:00 am – 7:00 pm”. Write “Closed” if the store is shut.";
  if (!/^[\d\s()+\-]{7,20}$/.test(ph)) e.phone = "Enter a phone number using digits, spaces, + or -, for example +1 868-225-4732.";
  return e;
}

export type NoticeValues = { title: string; body: string; branch: string; date: string };
export const NOTICE_FIELDS = ["title", "body", "date"] as const;
export type NoticeField = (typeof NOTICE_FIELDS)[number];

export function checkNotice(v: NoticeValues) {
  const e: Errors<NoticeField> = {}, title = v.title.trim(), body = v.body.trim();
  if (!title) e.title = "Enter a short title, for example “Public holiday rota is up”.";
  if (!body) e.body = "Write the message staff should read.";
  else if (body.length > 400) e.body = "Shorten the message to 400 characters or fewer (now " + body.length + ").";
  if (!isDay(v.date)) e.date = "Choose the date for the notice.";
  return e;
}

/** The first field, in form order, that has an error. */
export function firstError<K extends string>(names: readonly K[], errors: Errors<K>) {
  return names.find((n) => errors[n]) ?? null;
}
