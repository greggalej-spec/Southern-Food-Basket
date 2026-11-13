import { assertCan } from "@/lib/access";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { FileMeta, Seed, SelloutReport, Session, SpecialsBook, Supplier, SupplierLine, SupplierSheet } from "@/lib/types";

/* Supplier specials: the office workbook, as a system. A book is one round ("Divali 2026"); inside it each company has
   a sheet in the six columns the office already uses (item, count, case price, VAT, special, notes). This file reads
   what the companies send, works out what the workbook left to the reader (unit cost, margin at the special), and holds
   every write. Each write checks access first and is audited. */

/** VAT in Trinidad and Tobago, applied to a case price when the line's VAT column says Y. */
export const VAT_RATE = 0.125;

/* ---------- reading what is written in the cells ---------- */

export type ParsedSpecial = { qty: number; price: number; per: "each" | "lb" | "case" | "bale" | "pack" };

const PER: Record<string, ParsedSpecial["per"]> = { lb: "lb", lbs: "lb", case: "case", cases: "case", bale: "bale", bales: "bale", "6-pack": "pack", "6pk": "pack", pack: "pack" };

/** "3 FOR 24.95" → 3 for 24.95 each-priced; "7.95 PER LB" → 1 lb for 7.95; "19.95" → 1 for 19.95. Null when it is
 *  not a plain price ("save 5", "Buy 300 bales, receive 60 free"). */
export function parseSpecial(text: string): ParsedSpecial | null {
  const t = String(text || "").toLowerCase().replace(/[$,]/g, "").replace(/\s+/g, " ").trim();
  let m = t.match(/^(\d+(?:\.\d+)?) ?(lbs?|cases?|bales?)? ?for (\d+(?:\.\d+)?)$/);
  if (m) return { qty: Number(m[1]), price: Number(m[3]), per: m[2] ? PER[m[2]] : "each" };
  m = t.match(/^(\d+(?:\.\d+)?) ?(?:per|\/) ?(lbs?|case|bale|6-?pack|6pk)$/);
  if (m) return { qty: 1, price: Number(m[1]), per: PER[m[2].replace("6pack", "6-pack")] || "each" };
  m = t.match(/^(\d+(?:\.\d+)?)(?: (?:each|retail))?$/);
  if (m) return { qty: 1, price: Number(m[1]), per: "each" };
  return null;
}

const UNIT = "(?:g|kg|ml|l|lt|ltr|oz|lbs?|ct|pk)";
const PACK = new RegExp("(\\d+(?:\\.\\d+)?) ?(" + UNIT + ")? ?x ?(\\d+(?:\\.\\d+)?) ?(" + UNIT + ")?(?![a-z0-9])");

function unitsFrom(text: string): number | null {
  const t = String(text || "").toLowerCase().trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(PACK);
  if (!m) return null;
  if (m[2] && !m[4]) return Number(m[3]);
  if (m[4] && !m[2]) return Number(m[1]);
  return null;
}

/** How many units are in a case: the count column when it says ("24", "12 X 454G"), else the item ("…24x250ml"). */
export function unitsPerCase(l: Pick<SupplierLine, "count" | "item">): number | null {
  const n = unitsFrom(l.count) ?? unitsFrom(l.item);
  return n && n >= 2 && n <= 72 ? n : null;
}

export type Economics = { units: number; unitCost: number; sell: number; margin: number };

/** Unit cost and the margin at the special, when the line gives enough to work them out: a case price, a count and
 *  a per-item special. An estimate: it assumes the case price is before VAT and the shelf price includes it. */
export function economics(l: SupplierLine): Economics | null {
  const sp = parseSpecial(l.special);
  const units = unitsPerCase(l);
  if (!sp || sp.per !== "each" || !units || l.casePrice == null || l.casePrice <= 0) return null;
  const unitCost = (l.casePrice / units) * (l.vat === "Y" ? 1 + VAT_RATE : 1);
  const sell = sp.price / sp.qty;
  if (!(sell > 0)) return null;
  return { units, unitCost, sell, margin: (sell - unitCost) / sell };
}

/** What a line still needs before the sheet can be marked checked. */
export function gaps(l: SupplierLine): string[] {
  const g: string[] = [];
  if (!l.special.trim()) g.push("special");
  if (l.casePrice == null) g.push("case price");
  return g;
}

export const sheetGaps = (sh: SupplierSheet) => sh.lines.filter((l) => l.casePrice == null).length;

/* ---------- reading a workbook (.xlsx) in the browser: no upload, nothing leaves the page ---------- */

export type Tab = { name: string; rows: string[][] };

const u16 = (b: DataView, o: number) => b.getUint16(o, true);
const u32 = (b: DataView, o: number) => b.getUint32(o, true);

async function inflate(data: Uint8Array<ArrayBuffer>) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Opens a zip and returns a reader for the files inside it. An .xlsx is a zip of XML files. */
async function openZip(buf: ArrayBuffer) {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) {
    if (u32(v, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This file is not an Excel workbook (.xlsx).");
  const count = u16(v, eocd + 10);
  let p = u32(v, eocd + 16);
  const entries = new Map<string, { method: number; size: number; offset: number }>();
  const dec = new TextDecoder();
  for (let i = 0; i < count && u32(v, p) === 0x02014b50; i++) {
    const nameLen = u16(v, p + 28), extra = u16(v, p + 30), comment = u16(v, p + 32);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    entries.set(name, { method: u16(v, p + 10), size: u32(v, p + 20), offset: u32(v, p + 42) });
    p += 46 + nameLen + extra + comment;
  }
  return async (name: string) => {
    const e = entries.get(name);
    if (!e) return null;
    const start = e.offset + 30 + u16(v, e.offset + 26) + u16(v, e.offset + 28);
    const raw = new Uint8Array(buf.slice(start, start + e.size));
    return dec.decode(e.method === 0 ? raw : await inflate(raw));
  };
}

const xml = (text: string) => new DOMParser().parseFromString(text, "application/xml");
const COLS = 8;

function colIndex(ref: string) {
  let n = 0;
  for (const ch of ref) {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) n = n * 26 + (c - 64);
    else break;
  }
  return n - 1;
}

/** Every tab of a workbook as rows of text, first eight columns. Throws a plain sentence when it cannot read it. */
export async function readWorkbook(file: File): Promise<Tab[]> {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot open Excel files. Use a current Chrome, Edge, Firefox or Safari, or paste the rows instead.");
  const read = await openZip(await file.arrayBuffer());
  const wbText = await read("xl/workbook.xml");
  const relText = await read("xl/_rels/workbook.xml.rels");
  if (!wbText || !relText) throw new Error("This file is not an Excel workbook (.xlsx). Older .xls files need to be saved as .xlsx first.");
  const sharedText = await read("xl/sharedStrings.xml");
  const shared = sharedText ? Array.from(xml(sharedText).getElementsByTagName("si"), (si) => Array.from(si.getElementsByTagName("t"), (t) => t.textContent || "").join("")) : [];
  const rels = new Map(Array.from(xml(relText).getElementsByTagName("Relationship"), (r) => [r.getAttribute("Id") || "", r.getAttribute("Target") || ""]));
  const tabs: Tab[] = [];
  for (const sh of Array.from(xml(wbText).getElementsByTagName("sheet"))) {
    const target = rels.get(sh.getAttribute("r:id") || "") || "";
    const text = await read("xl/" + target.replace(/^\/?(xl\/)?/, ""));
    if (!text) continue;
    const rows: string[][] = [];
    for (const row of Array.from(xml(text).getElementsByTagName("row"))) {
      const cells = Array<string>(COLS).fill("");
      for (const c of Array.from(row.getElementsByTagName("c"))) {
        const i = colIndex(c.getAttribute("r") || "");
        if (i < 0 || i >= COLS) continue;
        const t = c.getAttribute("t");
        const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
        const raw = t === "s" ? shared[Number(v)] || "" : t === "inlineStr" ? Array.from(c.getElementsByTagName("t"), (x) => x.textContent || "").join("") : v;
        cells[i] = raw.replace(/\s+/g, " ").trim();
      }
      if (cells.some(Boolean)) rows.push(cells);
    }
    tabs.push({ name: sh.getAttribute("name") || "Sheet", rows });
  }
  return tabs;
}

/* ---------- rows of text → lines ---------- */

const num = (t: string) => (/^-?\d+(\.\d+)?$/.test(t.trim()) ? Number(t) : null);
const tidy = (t: string) => {
  const n = num(t);
  return n == null ? t.trim() : Number.isInteger(n) ? String(n) : String(n);
};
const DATEISH = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|divali|stocks last)/i;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Excel keeps a date as a day count; a notes cell holding one reads "46387". */
function excelDay(n: number) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000);
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}

type ColMap = { count: number; case: number; vat: number; special: number; notes: number };
const DEFAULT_COLS: ColMap = { count: 1, case: 2, vat: 3, special: 4, notes: 5 };

/** Finds the office's columns from a header row ("COUNT | CASE PRICE | VAT | SPECIALS | NOTES"), or null. */
function headerCols(row: string[]): ColMap | null {
  const at = (re: RegExp) => row.findIndex((c, i) => i > 0 && re.test(c));
  const special = at(/special|saving/i);
  if (special < 0) return null;
  const pick = (i: number, d: number) => (i < 0 ? d : i);
  return { count: pick(at(/count|min order|pack/i), 1), case: pick(at(/case|reg price|cost|rebate/i), 2), vat: pick(at(/^vat$/i), 3), special, notes: pick(at(/note/i), 5) };
}

function rowToLine(r: string[], cols: ColMap, group: string | null): SupplierLine {
  let item = r[0].trim();
  let count = tidy(r[cols.count] || ""), caseText = (r[cols.case] || "").trim(), vatText = (r[cols.vat] || "").trim();
  const special = (r[cols.special] || "").trim(), notes = (r[cols.notes] || "").trim();
  // Some sheets slide one column over: the size sits under CASE PRICE and the price under VAT.
  if (num(caseText) == null && /\d ?(g|kg|ml|lbs?|oz)\b/i.test(caseText) && num(vatText) != null) {
    item += " " + caseText;
    caseText = vatText;
    vatText = "";
  }
  const l: SupplierLine = { id: uid("ln"), item, count, casePrice: num(caseText), vat: "", special: num(special) != null ? Number(special).toFixed(2) : special };
  const extra: string[] = [];
  if (l.casePrice == null && caseText) extra.push("Case price as written: " + caseText);
  if (/^(vat|y|yes)$/i.test(vatText)) l.vat = "Y";
  else if (/^(n|no)$/i.test(vatText)) l.vat = "N";
  else if (vatText && num(vatText) == null) l.deal = vatText;
  const n = num(notes);
  if (n != null && n > 40000) l.valid = "to " + excelDay(n);
  else if (notes && n == null && DATEISH.test(notes) && notes.length < 40) l.valid = notes.toLowerCase();
  else if (notes) extra.push(notes);
  if (r[6]?.trim()) extra.push(r[6].trim());
  if (extra.length) l.note = extra.join("; ");
  if (group) l.group = group;
  if (count === "" && l.casePrice == null && !special) count = "";
  return l;
}

/** A tab's rows as lines. A row with only a name is a heading for the rows under it ("SAUCES"). */
export function rowsToLines(rows: string[][]): SupplierLine[] {
  const head = rows.length ? headerCols(rows[0]) : null;
  const cols = head || DEFAULT_COLS;
  const out: SupplierLine[] = [];
  let group: string | null = null;
  for (const r of head ? rows.slice(1) : rows) {
    if (!r[0]?.trim()) continue;
    if (!r.slice(1, 6).some((c) => c?.trim())) {
      const g = r[0].trim().toLowerCase();
      group = g.charAt(0).toUpperCase() + g.slice(1);
      continue;
    }
    out.push(rowToLine(r, cols, group));
  }
  return out;
}

/** Pasted text as rows: a copy from Excel (tabs), a CSV, or one special per line as it comes in a WhatsApp message
 *  ("Fruta 1L 2 for 19.95"). */
export function textToRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/^[\s•*\-–]+/, "").trimEnd()).filter((l) => l.trim());
  const pad = (cells: string[]) => [...cells.map((c) => c.trim()), ...Array(COLS).fill("")].slice(0, COLS);
  return lines.map((line) => {
    if (line.includes("\t")) return pad(line.split("\t"));
    if (line.split(",").length >= 4) return pad(line.split(","));
    const m = line.match(/^(.*?)[\s:–-]+((?:\d+(?:\.\d+)? ?(?:lbs?|cases?|bales?)? ?for ?)?\$?\d+(?:\.\d{1,2})?(?: ?(?:per|\/) ?(?:lb|case|bale))?(?: each)?)$/i);
    return m && m[1].trim() ? pad([m[1], "", "", "", m[2]]) : pad([line]);
  });
}

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
export const sameName = (a: string, b: string) => norm(a) === norm(b);

export type WorkbookPlan = { tab: string; supplierName: string; lines: SupplierLine[]; house: boolean }[];

/** A workbook laid out the office's way: an optional first tab of key specials, then one tab per company. The key
 *  tab's rows flag the matching lines; any it lists that no company tab has go on the general list. */
export function planWorkbook(tabs: Tab[]): { plan: WorkbookPlan; general: SupplierLine[] } {
  const keyTab = tabs.length > 2 && /special/i.test(tabs[0].name) ? tabs[0] : null;
  const plan: WorkbookPlan = (keyTab ? tabs.slice(1) : tabs).map((t) => {
    const named = (t.rows[0]?.[0] || t.name).replace(/\s+\d{1,2}(st|nd|rd|th)?\s.*$/i, "").trim() || t.name;
    return { tab: t.name, supplierName: named, lines: rowsToLines(t.rows), house: /^sfb$/i.test(t.name.trim()) };
  });
  const general: SupplierLine[] = [];
  if (keyTab) {
    const all = plan.flatMap((p) => p.lines);
    for (const l of rowsToLines(keyTab.rows)) {
      const k = norm(l.item);
      const hit = all.find((x) => norm(x.item) === k) || (k.length > 8 ? all.find((x) => norm(x.item).includes(k) || k.includes(norm(x.item))) : undefined);
      if (hit) hit.key = true;
      else general.push({ ...l, key: true });
    }
  }
  return { plan, general };
}

/* ---------- lookups ---------- */

export const HOUSE = "sup-sfb";
export const GENERAL = "sup-general";

export function supplierName(d: Seed, id: string) {
  return byId(d.suppliers, id)?.name || "A company no longer listed";
}

export function sheetsIn(d: Seed, bookId: string) {
  return (d.supplierSheets || []).filter((s) => s.bookId === bookId);
}

/** The key specials sheet: every flagged line in the book, with the company it came from. */
export function keyLines(d: Seed, bookId: string) {
  return sheetsIn(d, bookId).flatMap((sh) => sh.lines.filter((l) => l.key).map((line) => ({ line, sheet: sh })));
}

/** The companies that owe a sell-out report for a book: they ask for one, they had a sheet in it, and none is in. */
export function selloutState(d: Seed, bookId: string) {
  return (d.suppliers || [])
    .filter((s) => s.wantsSellout)
    .map((s) => {
      const sheet = sheetsIn(d, bookId).find((x) => x.supplierId === s.id) || null;
      const report = (d.sellouts || []).find((r) => r.bookId === bookId && r.supplierId === s.id) || null;
      return { supplier: s, sheet, report, state: report ? report.status : sheet ? ("owed" as const) : ("none" as const) };
    });
}

/* ---------- writes ---------- */

const who = (s: Session | null) => s?.userId || "";

export function addBook(s: Session | null, rec: Pick<SpecialsBook, "title" | "from" | "to">) {
  let id = "";
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    id = uid("book");
    d.specialsBooks = [{ id, ...rec, status: "open", createdAt: nowIso() }, ...(d.specialsBooks || [])];
    audit(d, s, "suppliers.book", rec.title, "Opened a new specials book");
  });
  return id;
}

export function setBookStatus(s: Session | null, bookId: string, status: SpecialsBook["status"]) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const b = byId(d.specialsBooks, bookId);
    if (!b) return;
    b.status = status;
    audit(d, s, "suppliers.book", b.title, status === "closed" ? "Closed the book. It stays on record." : "Reopened the book");
  });
}

export function addSupplier(s: Session | null, rec: Pick<Supplier, "name" | "channel" | "wantsSellout" | "rep" | "phone">) {
  let id = "";
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    if ((d.suppliers || []).some((x) => sameName(x.name, rec.name))) throw new Error(rec.name + " is already on the list.");
    id = uid("sup");
    d.suppliers = [...(d.suppliers || []), { id, ...rec, addedAt: nowIso().slice(0, 10) }];
    audit(d, s, "suppliers.company", rec.name, "Added a company");
  });
  return id;
}

function findOrAddSupplier(d: Seed, name: string) {
  const hit = (d.suppliers || []).find((x) => sameName(x.name, name));
  if (hit) return hit.id;
  const id = uid("sup");
  const nice = name === name.toUpperCase() ? name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : name;
  d.suppliers = [...(d.suppliers || []), { id, name: nice, rep: "", phone: "", channel: "WhatsApp", wantsSellout: false, addedAt: nowIso().slice(0, 10) }];
  return id;
}

export type Incoming = { supplierId?: string; supplierName?: string; lines: SupplierLine[] };

/** Files sheets into a book: one per company. A company that already has a sheet in the book gets its lines
 *  replaced, and the sheet goes back to "to check". Returns how many sheets and lines went in. */
export function importSheets(s: Session | null, bookId: string, incoming: Incoming[], source: SupplierSheet["source"]) {
  let sheets = 0, lines = 0;
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const book = byId(d.specialsBooks, bookId);
    if (!book) throw new Error("That specials book is no longer there.");
    d.supplierSheets = d.supplierSheets || [];
    for (const inc of incoming) {
      if (!inc.lines.length) continue;
      const supplierId = inc.supplierId || findOrAddSupplier(d, inc.supplierName || "New company");
      const fresh = inc.lines.map((l) => ({ ...l, id: uid("ln") }));
      const cur = d.supplierSheets.find((x) => x.bookId === bookId && x.supplierId === supplierId);
      if (cur) Object.assign(cur, { lines: fresh, source, importedAt: nowIso(), importedBy: who(s), status: "to-check", checkedAt: undefined, checkedBy: undefined });
      else d.supplierSheets.unshift({ id: uid("sh"), bookId, supplierId, source, importedAt: nowIso(), importedBy: who(s), status: "to-check", lines: fresh });
      sheets++;
      lines += fresh.length;
    }
    audit(d, s, "suppliers.import", book.title, "Brought in " + sheets + (sheets === 1 ? " sheet, " : " sheets, ") + lines + " lines" + (source ? " from " + source.via.toLowerCase() : ""));
  });
  return { sheets, lines };
}

function sheetOf(d: Seed, sheetId: string) {
  const sh = byId(d.supplierSheets, sheetId);
  if (!sh) throw new Error("That sheet is no longer there.");
  return sh;
}

export function saveLine(s: Session | null, sheetId: string, lineId: string | null, patch: Omit<SupplierLine, "id">) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const sh = sheetOf(d, sheetId);
    const cur = lineId ? sh.lines.find((l) => l.id === lineId) : null;
    if (cur) Object.assign(cur, patch);
    else sh.lines.push({ id: uid("ln"), ...patch });
    audit(d, s, cur ? "suppliers.edit" : "suppliers.add", patch.item, supplierName(d, sh.supplierId) + (cur ? ": changed the line" : ": added a line"));
  });
}

/** The one cell the office fills in most: the case price. */
export function setCasePrice(s: Session | null, sheetId: string, lineId: string, casePrice: number | null) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const sh = sheetOf(d, sheetId);
    const l = sh.lines.find((x) => x.id === lineId);
    if (!l || l.casePrice === casePrice) return;
    l.casePrice = casePrice;
    audit(d, s, "suppliers.edit", l.item, supplierName(d, sh.supplierId) + ": case price " + (casePrice == null ? "cleared" : "set to " + casePrice.toFixed(2)));
  });
}

export function toggleKey(s: Session | null, sheetId: string, lineId: string) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const sh = sheetOf(d, sheetId);
    const l = sh.lines.find((x) => x.id === lineId);
    if (!l) return;
    if (l.key) delete l.key;
    else l.key = true;
    audit(d, s, "suppliers.key", l.item, l.key ? "Put on the key specials sheet" : "Taken off the key specials sheet");
  });
}

export function removeLine(s: Session | null, sheetId: string, lineId: string) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const sh = sheetOf(d, sheetId);
    const l = sh.lines.find((x) => x.id === lineId);
    sh.lines = sh.lines.filter((x) => x.id !== lineId);
    if (l) audit(d, s, "suppliers.remove", l.item, supplierName(d, sh.supplierId) + ": removed the line");
  });
}

export function setSheetChecked(s: Session | null, sheetId: string, checked: boolean) {
  update((d) => {
    assertCan(d, s, "suppliers.edit");
    const sh = sheetOf(d, sheetId);
    sh.status = checked ? "checked" : "to-check";
    sh.checkedAt = checked ? nowIso() : undefined;
    sh.checkedBy = checked ? who(s) : undefined;
    audit(d, s, "suppliers.check", supplierName(d, sh.supplierId), checked ? "Marked the sheet checked" : "Sent the sheet back to be checked");
  });
}

/* sell-out reports */

export function saveSellout(s: Session | null, rec: Pick<SelloutReport, "supplierId" | "bookId" | "lines" | "note"> & { scan?: FileMeta }) {
  update((d) => {
    assertCan(d, s, "sellout.log");
    d.sellouts = d.sellouts || [];
    const cur = d.sellouts.find((r) => r.bookId === rec.bookId && r.supplierId === rec.supplierId);
    const units = rec.lines.reduce((n, l) => n + l.units, 0);
    if (cur) Object.assign(cur, rec, { compiledAt: nowIso(), compiledBy: who(s) });
    else d.sellouts.unshift({ id: uid("so"), status: "compiled", compiledAt: nowIso(), compiledBy: who(s), ...rec });
    audit(d, s, "sellout.compile", supplierName(d, rec.supplierId) + ", " + (byId(d.specialsBooks, rec.bookId)?.title || ""), "Recorded " + units.toLocaleString("en-US") + " units");
  });
}

export function markSelloutSent(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "sellout.log");
    const r = byId(d.sellouts, id);
    if (!r) return;
    r.status = "sent";
    r.sentAt = nowIso();
    audit(d, s, "sellout.send", supplierName(d, r.supplierId) + ", " + (byId(d.specialsBooks, r.bookId)?.title || ""), "Marked as sent to the company");
  });
}

/** The value of a sell-out line at its special, when the special is a plain price. */
export function selloutValue(l: { units: number; special: string }) {
  const sp = parseSpecial(l.special);
  return sp && sp.per === "each" ? (l.units * sp.price) / sp.qty : null;
}
