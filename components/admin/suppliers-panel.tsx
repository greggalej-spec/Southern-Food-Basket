"use client";

import { Fragment, useState } from "react";
import { Seg, Stat, act, csvRow, download } from "@/components/admin/bits";
import { ImportSheet } from "@/components/admin/import-sheet";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { dollars, plural } from "@/lib/admin/helpers";
import { dayTT } from "@/lib/admin/tt";
import { fmtDate } from "@/lib/format";
import { GENERAL, HOUSE, addBook, addSupplier, economics, keyLines, removeLine, saveLine, setBookStatus, setCasePrice, setSheetChecked, sheetGaps, sheetsIn, supplierName, toggleKey } from "@/lib/ops/specials";
import { byId, useData, useSession } from "@/lib/store";
import type { Seed, SpecialsBook, SupplierLine, SupplierSheet } from "@/lib/types";

/* Supplier specials. The office keeps one Excel workbook per round today: a key specials tab, an SFB tab, and a tab
   for each company, all in the same six columns. This is that workbook with the retyping taken out: a company's file
   is read into its sheet, the case price is the one cell left to fill, a star puts a line on the key sheet, and the
   unit cost and margin are worked out. Closed books stay on record. */

type View = "companies" | "key" | "find";

function defaultBook(d: Seed) {
  const open = (d.specialsBooks || []).filter((b) => b.status === "open");
  return open.slice().sort((a, b) => sheetsIn(d, b.id).length - sheetsIn(d, a.id).length)[0] || d.specialsBooks?.[0] || null;
}

function Margin({ l }: { l: SupplierLine }) {
  const e = economics(l);
  if (!e) return <span className="is-blank">—</span>;
  const pct = Math.round(e.margin * 100);
  return e.margin < 0 ? <Badge variant="bad">{"Below cost, " + pct + "%"}</Badge> : <span className="num">{pct + "%"}</span>;
}

function UnitCost({ l }: { l: SupplierLine }) {
  const e = economics(l);
  return e ? <span className="num">{dollars(e.unitCost)}</span> : <span className="is-blank">—</span>;
}

/** The case price cell: type the price and move on. It saves when you leave the cell or press Enter. */
function CaseCell({ sheet, line, canEdit }: { sheet: SupplierSheet; line: SupplierLine; canEdit: boolean }) {
  const s = useSession();
  const [draft, setDraft] = useState<string | null>(null);
  if (!canEdit) return line.casePrice == null ? <span className="is-blank">Not entered</span> : <span className="num">{line.casePrice.toFixed(2)}</span>;
  const shown = draft ?? (line.casePrice == null ? "" : line.casePrice.toFixed(2));
  function commit() {
    if (draft == null) return;
    const t = draft.trim().replace(/[$,]/g, "");
    setDraft(null);
    if (t === "") {
      if (line.casePrice != null) act(s, "suppliers.edit", line.item, () => setCasePrice(s, sheet.id, line.id, null));
      return;
    }
    const n = Number(t);
    if (!isFinite(n) || n <= 0) return;
    act(s, "suppliers.edit", line.item, () => setCasePrice(s, sheet.id, line.id, Math.round(n * 100) / 100));
  }
  return (
    <input
      className={"cell-input num" + (line.casePrice == null && draft == null ? " is-empty" : "")}
      type="text"
      inputMode="decimal"
      aria-label={"Case price for " + line.item}
      placeholder="Add"
      value={shown}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(null);
      }}
    />
  );
}

const BLANK: Omit<SupplierLine, "id"> = { item: "", count: "", casePrice: null, vat: "", special: "" };

function LineDrawer({ target, open, onClose, sheet }: { target: { id: string | null; seq: number } | null; open: boolean; onClose: () => void; sheet: SupplierSheet | null }) {
  const s = useSession();
  const cur = (target?.id && sheet?.lines.find((l) => l.id === target.id)) || null;
  return (
    <SideSheet open={open} onClose={onClose} title={cur ? "Change this line" : "Add a line"} sub={sheet ? undefined : undefined}>
      {sheet && target ? <LineForm key={target.seq} init={cur ? { ...cur } : { ...BLANK }} onSave={(v) => { if (act(s, "suppliers.edit", v.item, () => saveLine(s, sheet.id, cur?.id || null, v), cur ? "Saved." : "Added to the sheet.")) onClose(); }} onCancel={onClose} /> : null}
    </SideSheet>
  );
}

function LineForm({ init, onSave, onCancel }: { init: Omit<SupplierLine, "id">; onSave: (v: Omit<SupplierLine, "id">) => void; onCancel: () => void }) {
  const [v, setV] = useState({ ...init, caseText: init.casePrice == null ? "" : String(init.casePrice) });
  const [err, setErr] = useState("");
  const set = (k: keyof typeof v, val: string | boolean) => setV((p) => ({ ...p, [k]: val }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ct = v.caseText.trim().replace(/[$,]/g, "");
    if (!v.item.trim()) return setErr("Enter the item, for example “Fruta 1 L”.");
    if (ct && !(Number(ct) > 0)) return setErr("Enter the case price as a number, for example 108.00, or leave it empty.");
    const out: Omit<SupplierLine, "id"> = { item: v.item.trim(), count: v.count.trim(), casePrice: ct ? Math.round(Number(ct) * 100) / 100 : null, vat: v.vat, special: v.special.trim() };
    if (v.deal?.trim()) out.deal = v.deal.trim();
    if (v.valid?.trim()) out.valid = v.valid.trim();
    if (v.note?.trim()) out.note = v.note.trim();
    if (v.group?.trim()) out.group = v.group.trim();
    if (v.key) out.key = true;
    onSave(out);
  }
  const text = (id: string, label: string, k: "item" | "count" | "caseText" | "special" | "deal" | "valid" | "note" | "group", hint?: string) => (
    <div className="field">
      <label htmlFor={"ln-" + id}>{label}</label>
      <input id={"ln-" + id} type="text" autoComplete="off" value={(v[k] as string) || ""} onChange={(e) => set(k, e.target.value)} aria-describedby={hint ? "ln-" + id + "-h" : undefined} />
      {hint ? (
        <p className="hint" id={"ln-" + id + "-h"}>
          {hint}
        </p>
      ) : null}
    </div>
  );
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      {text("item", "Item", "item")}
      <div className="form-row cols-2">
        {text("count", "Count", "count", "Units in a case: 24, or 12 X 454G.")}
        {text("case", "Case price", "caseText", "Before VAT. Leave empty if you do not have it yet.")}
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="ln-vat">VAT</label>
          <select id="ln-vat" value={v.vat} onChange={(e) => set("vat", e.target.value)}>
            <option value="">Not marked</option>
            <option value="Y">Yes, VAT applies</option>
            <option value="N">No VAT</option>
          </select>
        </div>
        {text("special", "Special", "special", "As it goes on the shelf: 3 FOR 24.95, 7.95 PER LB, 19.95.")}
      </div>
      {text("valid", "Runs", "valid", "The dates as the company gave them.")}
      {text("deal", "Trade deal", "deal", "For example: buy 10 cases, get 1 free.")}
      {text("note", "Notes", "note")}
      {text("group", "Heading on the sheet", "group", "For example: Sauces.")}
      <label className="check">
        <input type="checkbox" checked={!!v.key} onChange={(e) => set("key", e.target.checked)} />
        <span>On the key specials sheet</span>
      </label>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save line
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SheetTable({ d, sheet, canEdit, onEdit }: { d: Seed; sheet: SupplierSheet; canEdit: boolean; onEdit: (id: string | null) => void }) {
  const s = useSession();
  const { confirm } = useConfirm();
  let lastGroup: string | undefined;
  async function remove(l: SupplierLine) {
    if (await confirm({ title: "Remove this line?", body: l.item + " comes off " + supplierName(d, sheet.supplierId) + "’s sheet.", okLabel: "Remove line", danger: true })) act(s, "suppliers.remove", l.item, () => removeLine(s, sheet.id, l.id), "Removed.");
  }
  return (
    <div className="table-wrap flat">
      <table className="sheet-table" data-tour="sheet-table">
        <caption className="visually-hidden">{supplierName(d, sheet.supplierId) + ": specials, with case price, unit cost and margin"}</caption>
        <thead>
          <tr>
            <th scope="col" className="col-key">
              <span className="visually-hidden">Key special</span>
            </th>
            <th scope="col">Item</th>
            <th scope="col">Count</th>
            <th scope="col" className="num">
              Case price
            </th>
            <th scope="col">VAT</th>
            <th scope="col">Special</th>
            <th scope="col" className="num">
              Unit cost
            </th>
            <th scope="col" className="num">
              Margin
            </th>
            {canEdit ? (
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sheet.lines.length ? (
            sheet.lines.map((l) => {
              const head = l.group !== lastGroup ? l.group : undefined;
              lastGroup = l.group;
              return (
                <Fragment key={l.id}>
                  {head ? (
                    <tr className="group-row">
                      <th colSpan={canEdit ? 9 : 8} scope="colgroup">
                        {head}
                      </th>
                    </tr>
                  ) : null}
                  <tr>
                    <td className="col-key">
                      {canEdit ? (
                        <button className={"star-btn" + (l.key ? " is-on" : "")} type="button" aria-pressed={!!l.key} aria-label={(l.key ? "Take off" : "Put on") + " the key specials sheet: " + l.item} onClick={() => act(s, "suppliers.key", l.item, () => toggleKey(s, sheet.id, l.id))}>
                          <Icon name="star" />
                        </button>
                      ) : l.key ? (
                        <span className="star-btn is-on" role="img" aria-label="Key special">
                          <Icon name="star" />
                        </span>
                      ) : null}
                    </td>
                    <th scope="row">
                      <span className="cell-title">{l.item}</span>
                      {l.valid || l.deal || l.note ? <span className="meta">{[l.valid ? "Runs " + l.valid : "", l.deal, l.note].filter(Boolean).join(" · ")}</span> : null}
                    </th>
                    <td data-label="Count">{l.count || <span className="is-blank">—</span>}</td>
                    <td className="num" data-label="Case price">
                      <CaseCell sheet={sheet} line={l} canEdit={canEdit} />
                    </td>
                    <td data-label="VAT">{l.vat === "Y" ? "Yes" : l.vat === "N" ? "No" : <span className="is-blank">—</span>}</td>
                    <td data-label="Special" className="special-cell">
                      {l.special || <span className="is-blank">—</span>}
                    </td>
                    <td className="num" data-label="Unit cost">
                      <UnitCost l={l} />
                    </td>
                    <td className="num" data-label="Margin">
                      <Margin l={l} />
                    </td>
                    {canEdit ? (
                      <td className="actions-cell">
                        <button className="link-btn small" type="button" onClick={() => onEdit(l.id)}>
                          Edit<span className="visually-hidden">{" " + l.item}</span>
                        </button>
                        <button className="link-btn small danger" type="button" onClick={() => remove(l)}>
                          Remove<span className="visually-hidden">{" " + l.item}</span>
                        </button>
                      </td>
                    ) : null}
                  </tr>
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={canEdit ? 9 : 8} className="empty-cell">
                No lines on this sheet yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SuppliersPanel() {
  const d = useData();
  const s = useSession();
  const canEdit = can(d, s, "suppliers.edit");
  const [bookSel, setBookSel] = useState<string | null>(null);
  const [view, setView] = useState<View>("companies");
  const [supSel, setSupSel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [line, setLine] = useState<{ id: string | null; seq: number } | null>(null);
  const [lineOpen, setLineOpen] = useState(false);
  const [bookForm, setBookForm] = useState(false);
  const [companyForm, setCompanyForm] = useState(false);

  const books = d.specialsBooks || [];
  const book = byId(books, bookSel) || defaultBook(d);
  if (!book) {
    return (
      <div className="empty">
        <p>No specials book yet.</p>
      </div>
    );
  }
  const sheets = sheetsIn(d, book.id);
  const bySupplier = new Map(sheets.map((sh) => [sh.supplierId, sh]));
  const withSheet = sheets
    .slice()
    .sort((a, b) => (a.status === b.status ? supplierName(d, a.supplierId).localeCompare(supplierName(d, b.supplierId)) : a.status === "to-check" ? -1 : 1));
  const without = (d.suppliers || []).filter((x) => !bySupplier.has(x.id) && x.id !== GENERAL && x.id !== HOUSE).sort((a, b) => a.name.localeCompare(b.name));
  const current = (supSel && (bySupplier.get(supSel) || null)) || (supSel ? null : withSheet[0] || null);
  const currentSupplier = supSel || current?.supplierId || null;
  const keys = keyLines(d, book.id);
  const allLines = sheets.flatMap((sh) => sh.lines.map((l) => ({ line: l, sheet: sh })));
  const missing = sheets.reduce((n, sh) => n + sheetGaps(sh), 0);
  const toCheck = sheets.filter((sh) => sh.status === "to-check").length;
  const q = query.trim().toLowerCase();
  const found = q ? allLines.filter((x) => (x.line.item + " " + supplierName(d, x.sheet.supplierId)).toLowerCase().includes(q)) : [];

  function openLine(id: string | null) {
    setLine({ id, seq: (line?.seq ?? 0) + 1 });
    setLineOpen(true);
  }

  function exportKey() {
    const rows = [["Item", "Company", "Count", "Case price", "VAT", "Special", "Unit cost", "Margin %", "Runs", "Notes"].map(String)];
    keys.forEach(({ line: l, sheet: sh }) => {
      const e = economics(l);
      rows.push([l.item, supplierName(d, sh.supplierId), l.count, l.casePrice == null ? "" : l.casePrice.toFixed(2), l.vat, l.special, e ? e.unitCost.toFixed(2) : "", e ? String(Math.round(e.margin * 100)) : "", l.valid || "", [l.deal, l.note].filter(Boolean).join("; ")]);
    });
    download("key-specials-" + book!.title.toLowerCase().replace(/\s+/g, "-") + ".csv", rows.map(csvRow).join("\r\n"));
  }

  return (
    <div className="section-stack">
      <Flow id="suppliers" />

      <div className="toolbar book-bar">
        <div className="field-inline">
          <label htmlFor="book-sel">Specials book</label>
          <select id="book-sel" value={book.id} onChange={(e) => { setBookSel(e.target.value); setSupSel(null); }} data-tour="book-select">
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title + (b.status === "closed" ? " (closed)" : "")}
              </option>
            ))}
          </select>
        </div>
        <p className="book-dates small muted">
          {fmtDate(book.from, { year: false }) + " to " + fmtDate(book.to)} {book.status === "closed" ? <Badge>Closed, on record</Badge> : <Badge variant="ok">Open</Badge>}
        </p>
        {canEdit ? (
          <div className="cluster book-actions">
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setImporting(true)} disabled={book.status === "closed"} data-tour="import-open">
              <Icon name="upload" />
              Bring in specials
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setBookForm(true)}>
              New book
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => act(s, "suppliers.book", book.title, () => setBookStatus(s, book.id, book.status === "open" ? "closed" : "open"), book.status === "open" ? "Closed. The book stays on record." : "Reopened.")}>
              {book.status === "open" ? "Close this book" : "Reopen"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="stats">
        <Stat icon="store" label="Companies in" value={sheets.filter((x) => x.supplierId !== GENERAL && x.supplierId !== HOUSE).length} bar={{ value: sheets.filter((x) => x.supplierId !== GENERAL && x.supplierId !== HOUSE).length, of: (d.suppliers || []).filter((x) => x.id !== GENERAL && x.id !== HOUSE).length }} sub={"of " + (d.suppliers || []).filter((x) => x.id !== GENERAL && x.id !== HOUSE).length + " companies"} />
        <Stat icon="tag" tone="pink" label="Specials" value={allLines.length} sub={plural(keys.length, "key special")} />
        <Stat icon="wallet" label="Case prices to add" value={missing} ring={{ value: allLines.length - missing, of: allLines.length }} tone={missing ? "warn" : "ok"} />
        <Stat icon="check" label="Sheets to check" value={toCheck} ring={{ value: sheets.length - toCheck, of: sheets.length }} tone={toCheck ? "warn" : "ok"} />
      </div>

      <Seg
        label="View"
        value={view}
        onChange={setView}
        options={[
          { id: "companies", label: "By company" },
          { id: "key", label: "Key specials", count: keys.length },
          { id: "find", label: "Find an item" },
        ]}
      />

      {view === "companies" ? (
        <div className="sheet-layout">
          <nav className="panel company-list" aria-label="Companies">
            <ul>
              {withSheet.map((sh) => {
                const gaps = sheetGaps(sh);
                return (
                  <li key={sh.id}>
                    <button type="button" aria-current={currentSupplier === sh.supplierId ? "true" : undefined} onClick={() => setSupSel(sh.supplierId)}>
                      <span className="company-name">{supplierName(d, sh.supplierId)}</span>
                      <span className="company-meta">
                        {plural(sh.lines.length, "line")}
                        {sh.status === "to-check" ? " · to check" : ""}
                        {gaps ? " · " + gaps + " without a case price" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <details className="company-rest">
              <summary>{"No specials yet (" + without.length + ")"}</summary>
              <ul>
                {without.map((x) => (
                  <li key={x.id}>
                    <button type="button" aria-current={currentSupplier === x.id ? "true" : undefined} onClick={() => setSupSel(x.id)}>
                      <span className="company-name">{x.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
            {canEdit ? (
              <button className="btn btn-ghost btn-sm company-add" type="button" onClick={() => setCompanyForm(true)}>
                Add a company
              </button>
            ) : null}
          </nav>

          <section className="panel" aria-labelledby="sheet-h">
            {current ? (
              <>
                <div className="panel-head sheet-head">
                  <div className="grow">
                    <h2 id="sheet-h">{supplierName(d, current.supplierId)}</h2>
                    <p className="small muted sheet-source">
                      {current.source ? current.source.fileName + ", " + current.source.via.toLowerCase() : "Typed in"}
                      {" · read " + dayTT(current.importedAt) + " by " + personName(d, current.importedBy)}
                    </p>
                  </div>
                  {current.status === "checked" ? <Badge variant="ok">Checked</Badge> : <Badge variant="warn">To check</Badge>}
                  {canEdit ? (
                    <div className="cluster">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => openLine(null)}>
                        Add a line
                      </button>
                      <button
                        className={"btn btn-sm " + (current.status === "checked" ? "btn-ghost" : "btn-primary")}
                        type="button"
                        data-tour="sheet-check"
                        onClick={() => act(s, "suppliers.check", supplierName(d, current.supplierId), () => setSheetChecked(s, current.id, current.status !== "checked"), current.status === "checked" ? "Back to “To check”." : "Marked checked.")}
                      >
                        {current.status === "checked" ? "Reopen for checking" : "Mark as checked"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {sheetGaps(current) && current.status !== "checked" ? (
                  <p className="sheet-note">{plural(sheetGaps(current), "line has", "lines have") + " no case price yet. Type it into the cell; it saves when you move on."}</p>
                ) : null}
                <SheetTable d={d} sheet={current} canEdit={canEdit && book.status === "open"} onEdit={openLine} />
              </>
            ) : (
              <div className="panel-body">
                <h2 id="sheet-h" className="admin-h2">
                  {currentSupplier ? supplierName(d, currentSupplier) : "No company chosen"}
                </h2>
                <p className="muted">{currentSupplier ? "Nothing from this company in " + book.title + " yet." : "Choose a company from the list."}</p>
                {canEdit && currentSupplier && book.status === "open" ? (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => setImporting(true)}>
                    Bring in their specials
                  </button>
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {view === "key" ? (
        <section className="panel" aria-labelledby="key-h">
          <div className="panel-head">
            <h2 id="key-h">{"Key specials, " + book.title}</h2>
            <button className="btn btn-ghost btn-sm" type="button" onClick={exportKey} disabled={!keys.length}>
              Download for Excel
            </button>
          </div>
          <LinesTable d={d} rows={keys} empty="No key specials yet. Star a line on a company’s sheet and it appears here." />
        </section>
      ) : null}

      {view === "find" ? (
        <section className="panel" aria-labelledby="find-h">
          <div className="panel-head">
            <h2 id="find-h">Find an item</h2>
            <span className="small muted">{q ? plural(found.length, "line") : "Across every company in " + book.title}</span>
          </div>
          <div className="panel-body">
            <label className="visually-hidden" htmlFor="find-q">
              Search items and companies
            </label>
            <input id="find-q" type="search" placeholder="Search items and companies, for example “margarine”" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {q ? <LinesTable d={d} rows={found} empty="Nothing matches. Check the spelling, or search by the company’s name." /> : null}
        </section>
      ) : null}

      {importing ? (
        <ImportSheet
          open={importing}
          onClose={() => setImporting(false)}
          book={book}
          supplierId={view === "companies" ? currentSupplier : null}
          onDone={(id) => {
            setImporting(false);
            setView("companies");
            if (id) setSupSel(id);
          }}
        />
      ) : null}
      <LineDrawer target={line} open={lineOpen} onClose={() => setLineOpen(false)} sheet={current} />
      <BookDrawer open={bookForm} onClose={() => setBookForm(false)} onAdded={(id) => { setBookSel(id); setSupSel(null); }} />
      <CompanyDrawer open={companyForm} onClose={() => setCompanyForm(false)} onAdded={(id) => setSupSel(id)} />
    </div>
  );
}

function LinesTable({ d, rows, empty }: { d: Seed; rows: { line: SupplierLine; sheet: SupplierSheet }[]; empty: string }) {
  return (
    <div className="table-wrap flat">
      <table className="sheet-table stack-table">
        <caption className="visually-hidden">Specials with the company each came from</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Company</th>
            <th scope="col" className="num">
              Case price
            </th>
            <th scope="col">Special</th>
            <th scope="col" className="num">
              Unit cost
            </th>
            <th scope="col" className="num">
              Margin
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map(({ line: l, sheet: sh }) => (
              <tr key={l.id}>
                <th scope="row">
                  <span className="cell-title">{l.item}</span>
                  {l.valid ? <span className="meta">{"Runs " + l.valid}</span> : null}
                </th>
                <td data-label="Company">{supplierName(d, sh.supplierId)}</td>
                <td className="num" data-label="Case price">
                  {l.casePrice == null ? <span className="is-blank">Not entered</span> : l.casePrice.toFixed(2)}
                </td>
                <td data-label="Special" className="special-cell">
                  {l.special || "—"}
                </td>
                <td className="num" data-label="Unit cost">
                  <UnitCost l={l} />
                </td>
                <td className="num" data-label="Margin">
                  <Margin l={l} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="empty-cell">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BookDrawer({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const s = useSession();
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setErr("Name the book, for example “Easter 2027” or “January 2027”.");
    if (!from || !to || to < from) return setErr("Choose the first and last day of the round, in that order.");
    let id = "";
    if (act(s, "suppliers.book", title, () => { id = addBook(s, { title: title.trim(), from, to }); }, "Book opened.")) {
      setTitle("");
      setFrom("");
      setTo("");
      setErr("");
      onAdded(id);
      onClose();
    }
  }
  return (
    <SideSheet open={open} onClose={onClose} title="Open a new specials book" sub="One book for each round: a season or a month.">
      <form onSubmit={submit} noValidate>
        {err ? (
          <div className="alert alert-bad" role="alert">
            <p>{err}</p>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="bk-title">Name</label>
          <input id="bk-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
        </div>
        <div className="form-row cols-2">
          <div className="field">
            <label htmlFor="bk-from">First day</label>
            <input id="bk-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bk-to">Last day</label>
            <input id="bk-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          Open the book
        </button>
      </form>
    </SideSheet>
  );
}

function CompanyDrawer({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const s = useSession();
  const [name, setName] = useState("");
  const [rep, setRep] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"WhatsApp" | "E-mail" | "Rep visit">("WhatsApp");
  const [wants, setWants] = useState(false);
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Enter the company’s name.");
    let id = "";
    if (act(s, "suppliers.company", name, () => { id = addSupplier(s, { name: name.trim(), rep: rep.trim(), phone: phone.trim(), channel, wantsSellout: wants }); }, name.trim() + " added.")) {
      setName("");
      setRep("");
      setPhone("");
      setWants(false);
      setErr("");
      onAdded(id);
      onClose();
    }
  }
  return (
    <SideSheet open={open} onClose={onClose} title="Add a company" sub="It gets its own sheet in every book from now on.">
      <form onSubmit={submit} noValidate>
        {err ? (
          <div className="alert alert-bad" role="alert">
            <p>{err}</p>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="co-name">Company</label>
          <input id="co-name" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </div>
        <div className="form-row cols-2">
          <div className="field">
            <label htmlFor="co-rep">Sales rep</label>
            <input id="co-rep" type="text" value={rep} onChange={(e) => setRep(e.target.value)} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="co-phone">Phone</label>
            <input id="co-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="co-channel">How their specials arrive</label>
          <select id="co-channel" value={channel} onChange={(e) => setChannel(e.target.value as typeof channel)}>
            <option>WhatsApp</option>
            <option>E-mail</option>
            <option>Rep visit</option>
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={wants} onChange={(e) => setWants(e.target.checked)} />
          <span>They ask for a sell-out report after each round</span>
        </label>
        <div className="drawer-actions">
          <button className="btn btn-primary" type="submit">
            Add company
          </button>
        </div>
      </form>
    </SideSheet>
  );
}

export type { SpecialsBook };
