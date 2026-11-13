"use client";

import { useState } from "react";
import { Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { personName } from "@/lib/admin/guard";
import { dollars, plural } from "@/lib/admin/helpers";
import { dayTT } from "@/lib/admin/tt";
import { fileSize } from "@/lib/format";
import { markSelloutSent, saveSellout, selloutState, selloutValue, sheetsIn } from "@/lib/ops/specials";
import { byId, useData, useSession } from "@/lib/store";
import type { FileMeta, SelloutReport, Supplier, SupplierSheet } from "@/lib/types";

/* Sell-out reports: after a round of specials, some companies ask how many units sold. The office kept this in a
   notebook and a Google Sheet, with no way to see which were done. Here every company that asks for one shows as
   owed, compiled or sent for each book, and a photo of the notebook page can ride along as the record. */

type Row = ReturnType<typeof selloutState>[number];

const STATE: Record<Row["state"], { label: string; variant: "warn" | "info" | "ok" | "neutral" }> = {
  owed: { label: "Owed", variant: "warn" },
  compiled: { label: "Compiled, not sent", variant: "info" },
  sent: { label: "Sent", variant: "ok" },
  none: { label: "No specials this round", variant: "neutral" },
};

const total = (r: SelloutReport | null) => (r ? r.lines.reduce((n, l) => n + l.units, 0) : 0);
const value = (r: SelloutReport | null) => (r ? r.lines.reduce((n, l) => n + (selloutValue(l) || 0), 0) : 0);

export function SelloutPanel() {
  const d = useData();
  const s = useSession();
  const books = d.specialsBooks || [];
  const [bookSel, setBookSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ supplier: Supplier; sheet: SupplierSheet | null; report: SelloutReport | null; seq: number } | null>(null);
  const [open, setOpen] = useState(false);
  // The round most likely to be owed: the open book with the most sheets.
  const book = byId(books, bookSel) || books.slice().sort((a, b) => sheetsIn(d, b.id).length - sheetsIn(d, a.id).length)[0];
  if (!book) return <div className="empty"><p>No specials book yet.</p></div>;
  const rows = selloutState(d, book.id).sort((a, b) => "owed compiled sent none".indexOf(a.state) - "owed compiled sent none".indexOf(b.state));
  const count = (st: Row["state"]) => rows.filter((r) => r.state === st).length;

  function openForm(r: Row) {
    setForm({ supplier: r.supplier, sheet: r.sheet, report: r.report, seq: (form?.seq ?? 0) + 1 });
    setOpen(true);
  }

  return (
    <div className="section-stack">
      <Flow id="sellout" />
      <div className="toolbar">
        <div className="field-inline">
          <label htmlFor="so-book">Specials book</label>
          <select id="so-book" value={book.id} onChange={(e) => setBookSel(e.target.value)}>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="stats">
        <Stat icon="clock" label="Owed" value={count("owed")} tone={count("owed") ? "warn" : "ok"} bar={{ value: count("owed"), of: rows.length }} />
        <Stat icon="tasks" tone="pink" label="Compiled, to send" value={count("compiled")} bar={{ value: count("compiled"), of: rows.length }} />
        <Stat icon="check" label="Sent" value={count("sent")} tone="ok" bar={{ value: count("sent"), of: rows.length }} />
      </div>
      <section className="panel" aria-labelledby="so-h">
        <div className="panel-head">
          <h2 id="so-h">{"Reports for " + book.title}</h2>
          <span className="small muted">{plural(rows.length, "company asks", "companies ask") + " for one"}</span>
        </div>
        <div className="table-wrap flat">
          <table className="stack-table" data-tour="sellout-table">
            <caption className="visually-hidden">Sell-out reports by company</caption>
            <thead>
              <tr>
                <th scope="col">Company</th>
                <th scope="col">Where it stands</th>
                <th scope="col" className="num">
                  Units sold
                </th>
                <th scope="col" className="num">
                  Value at the special
                </th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.supplier.id}>
                  <th scope="row">
                    <span className="cell-title">{r.supplier.name}</span>
                    <span className="meta">
                      {r.sheet ? plural(r.sheet.lines.length, "line") + " on special" : "Nothing from them in this book"}
                      {r.report?.scan ? " · record attached" : ""}
                    </span>
                  </th>
                  <td data-label="Where it stands">
                    <Badge variant={STATE[r.state].variant}>{STATE[r.state].label}</Badge>
                    {r.report ? <span className="meta">{(r.report.status === "sent" ? "Sent " + dayTT(r.report.sentAt) : "Compiled " + dayTT(r.report.compiledAt)) + " by " + personName(d, r.report.compiledBy)}</span> : null}
                  </td>
                  <td className="num" data-label="Units sold">
                    {r.report ? total(r.report).toLocaleString("en-US") : "—"}
                  </td>
                  <td className="num" data-label="Value at the special">
                    {r.report && value(r.report) ? dollars(value(r.report)) : "—"}
                  </td>
                  <td className="actions-cell">
                    {r.state === "none" ? null : (
                      <div className="row-actions">
                        <button className={"btn btn-sm " + (r.state === "owed" ? "btn-primary" : "btn-ghost")} type="button" onClick={() => openForm(r)}>
                          {r.state === "owed" ? "Record it" : "Open"}
                          <span className="visually-hidden">{": " + r.supplier.name}</span>
                        </button>
                        {r.state === "compiled" && r.report ? (
                          <button className="btn btn-ghost btn-sm" type="button" onClick={() => act(s, "sellout.send", r.supplier.name, () => markSelloutSent(s, r.report!.id), "Marked as sent.")}>
                            Mark as sent
                          </button>
                        ) : null}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SideSheet open={open} onClose={() => setOpen(false)} title={form ? "Sell-out: " + form.supplier.name : "Sell-out"} sub={book.title}>
        {form ? <SelloutForm key={form.seq} bookId={book.id} {...form} onDone={() => setOpen(false)} /> : null}
      </SideSheet>
    </div>
  );
}

function SelloutForm({ bookId, supplier, sheet, report, onDone }: { bookId: string; supplier: Supplier; sheet: SupplierSheet | null; report: SelloutReport | null; onDone: () => void }) {
  const s = useSession();
  const base = report ? report.lines : (sheet?.lines || []).filter((l) => l.special).map((l) => ({ item: l.item, special: l.special, units: 0 }));
  const [units, setUnits] = useState<string[]>(base.map((l) => (l.units ? String(l.units) : "")));
  const [scan, setScan] = useState<FileMeta | undefined>(report?.scan);
  const [note, setNote] = useState(report?.note || "");
  const [filled, setFilled] = useState(false);
  const lines = base.map((l, i) => ({ ...l, units: Math.max(0, Math.round(Number(units[i]) || 0)) }));
  const sumUnits = lines.reduce((n, l) => n + l.units, 0);
  const sumValue = lines.reduce((n, l) => n + (selloutValue(l) || 0), 0);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (act(s, "sellout.compile", supplier.name, () => saveSellout(s, { supplierId: supplier.id, bookId, lines, note: note.trim() || undefined, scan }), "Saved. " + sumUnits.toLocaleString("en-US") + " units recorded.")) onDone();
  }

  // Stands in for reading the page: fills plausible units so the rest of the flow can be seen. Clearly a demo.
  function demoFill() {
    setUnits(base.map((l, i) => String(120 + ((l.item.length * 37 + i * 91) % 1900))));
    setFilled(true);
  }

  return (
    <form onSubmit={save}>
      <div className="field">
        <label htmlFor="so-scan">Notebook page or till print-out</label>
        <input id="so-scan" type="file" accept="image/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) setScan({ fileName: f.name, size: f.size, type: f.type || "image/jpeg" }); }} />
        <p className="hint">{scan ? "Attached: " + scan.fileName + " (" + fileSize(scan.size) + "). Only its name is kept in this prototype." : "Optional. Take a photo of the page so the record is kept with the report."}</p>
        {scan ? (
          <p className="hint">
            <button className="link-btn" type="button" onClick={demoFill}>
              Demo: fill the units from the page
            </button>
            {filled ? " Filled with sample numbers. With the document reader switched on, these come from the photo." : ""}
          </p>
        ) : null}
      </div>
      <div className="table-wrap">
        <table className="units-table">
          <caption className="visually-hidden">Units sold for each line</caption>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Special</th>
              <th scope="col" className="num">
                Units sold
              </th>
            </tr>
          </thead>
          <tbody>
            {base.map((l, i) => (
              <tr key={l.item + i}>
                <th scope="row">{l.item}</th>
                <td>{l.special}</td>
                <td className="num">
                  <input className="cell-input num" type="text" inputMode="numeric" aria-label={"Units sold: " + l.item} value={units[i]} onChange={(e) => setUnits(units.map((u, j) => (j === i ? e.target.value.replace(/[^\d]/g, "") : u)))} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                Total{sumValue ? " · " + dollars(sumValue) + " at the special" : ""}
              </th>
              <td className="num">
                <strong>{sumUnits.toLocaleString("en-US")}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="field">
        <label htmlFor="so-note">Note for the company</label>
        <textarea id="so-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit" disabled={!base.length}>
          Save report
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
