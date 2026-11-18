import { useSyncExternalStore } from "react";
import type { DeliveryUnit } from "@/lib/types";
import { catalogueItem, isGoodsType, type CatalogueItem, type CatalogueSize } from "./delivery-catalogue";

/* The customer's list while they build it on /deliveries, before it is sent for a quote. Kept in this browser only
   (sfb.dlBasket), so a reload or a look at another page does not empty it; nothing leaves the device until they ask
   for the quote. If the browser refuses storage (private window), the list lives in memory for the visit. */

export type BasketLine = {
  /** Stays the same for the life of the line, whatever is changed on it. */
  key: string;
  /** Catalogue lines carry the item's code; a list holds one line for each item and size. */
  sku?: string;
  cat?: string;
  item: string;
  brand: string;
  size: string;
  unit: DeliveryUnit;
  qty: number;
};

const KEY = "sfb.dlBasket";
const MAX_LINES = 80;
const EMPTY: BasketLine[] = [];
const listeners = new Set<() => void>();
let raw = "";
let parsed: BasketLine[] = EMPTY;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
export const clampQty = (n: number) => Math.min(999, Math.max(1, Math.floor(n) || 1));

/** What was saved is checked line by line before it is shown: only known fields, known units, sane amounts. */
function parse(s: string): BasketLine[] {
  if (!s) return EMPTY;
  try {
    const list: unknown = JSON.parse(s);
    if (!Array.isArray(list)) return EMPTY;
    const out: BasketLine[] = [];
    for (const x of list.slice(0, MAX_LINES) as Record<string, unknown>[]) {
      if (!x || typeof x !== "object") continue;
      const item = text(x.item, 80).trim();
      const key = text(x.key, 120);
      const unit = x.unit === "pack" || x.unit === "case" ? x.unit : "each";
      if (!item || !key || out.some((l) => l.key === key)) continue;
      const sku = catalogueItem(text(x.sku, 40))?.id;
      const cat = text(x.cat, 20);
      out.push({ key, item, brand: text(x.brand, 60), size: text(x.size, 60), unit, qty: clampQty(Number(x.qty)), ...(sku ? { sku } : isGoodsType(cat) ? { cat } : {}) });
    }
    return out;
  } catch {
    return EMPTY;
  }
}

function read(): BasketLine[] {
  let now = raw;
  try {
    now = localStorage.getItem(KEY) || "";
  } catch {}
  if (now !== raw) {
    raw = now;
    parsed = parse(now);
  }
  return parsed;
}

function write(lines: BasketLine[]) {
  const next = lines.length ? JSON.stringify(lines.slice(0, MAX_LINES)) : "";
  try {
    if (next) localStorage.setItem(KEY, next);
    else localStorage.removeItem(KEY);
  } catch {}
  raw = next;
  parsed = lines.length ? lines.slice(0, MAX_LINES) : EMPTY;
  listeners.forEach((cb) => cb());
}

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

/** The list, empty on the server and until the browser has read its saved copy. */
export function useBasket(): BasketLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const setBasket = (fn: (lines: BasketLine[]) => BasketLine[]) => write(fn(read()));
export const clearBasket = () => write([]);

let n = 0;
export const newKey = () => "ln-" + Date.now().toString(36) + "-" + ++n;
const same = (l: BasketLine, it: CatalogueItem, s: CatalogueSize) => l.sku === it.id && l.size === s.size;
const fresh = (it: CatalogueItem, s: CatalogueSize, qty: number): BasketLine => ({ key: newKey(), sku: it.id, item: it.name, brand: "", size: s.size, unit: s.unit, qty: clampQty(qty) });

/** How many of a catalogue item and size are on the list. */
export const qtyOf = (lines: BasketLine[], it: CatalogueItem, s: CatalogueSize) => lines.find((l) => same(l, it, s))?.qty || 0;

/** Sets how many of a catalogue item and size are on the list; none takes the line off. */
export function setItemQty(it: CatalogueItem, s: CatalogueSize, qty: number) {
  setBasket((lines) => {
    if (qty < 1) return lines.filter((l) => !same(l, it, s));
    if (lines.some((l) => same(l, it, s))) return lines.map((l) => (same(l, it, s) ? { ...l, qty: clampQty(qty) } : l));
    return [...lines, fresh(it, s, qty)];
  });
}

/** Adds to what is already there (a set, or the same item added twice). */
export function addItem(it: CatalogueItem, s: CatalogueSize, qty: number) {
  setBasket((lines) => (lines.some((l) => same(l, it, s)) ? lines.map((l) => (same(l, it, s) ? { ...l, qty: clampQty(l.qty + qty) } : l)) : [...lines, fresh(it, s, qty)]));
}

export const patchLine = (key: string, patch: Partial<Pick<BasketLine, "brand" | "qty">>) => setBasket((lines) => lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
export const removeLine = (key: string) => setBasket((lines) => lines.filter((l) => l.key !== key));

/** Changes a catalogue line to another of the item's sizes; if that size is already on the list the two become one. */
export function resizeLine(key: string, it: CatalogueItem, s: CatalogueSize) {
  setBasket((lines) => {
    const from = lines.find((l) => l.key === key);
    if (!from || from.size === s.size) return lines;
    const there = lines.find((l) => l.key !== key && same(l, it, s));
    if (there) return lines.filter((l) => l.key !== key).map((l) => (l.key === there.key ? { ...l, qty: clampQty(l.qty + from.qty) } : l));
    return lines.map((l) => (l.key === key ? { ...l, size: s.size, unit: s.unit } : l));
  });
}
