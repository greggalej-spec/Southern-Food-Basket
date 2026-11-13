"use client";

import { useState } from "react";
import { Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Flow, Working } from "@/components/viz";
import { personName } from "@/lib/admin/guard";
import { dollars, plural } from "@/lib/admin/helpers";
import { dayTT } from "@/lib/admin/tt";
import { fileSize } from "@/lib/format";
import { markSelloutSent, saveSellout, selloutState, selloutValue, sheetsIn } from "@/lib/ops/specials";
import { byId, useData, useSession } from "@/lib/store";
import type { FileMeta, SelloutReport, Supplier, SupplierSheet } from "@/lib/types";

/* Sell-out reports: after a round of specials, some companies ask how many units sold. The office kept this in a
   notebook and a Google Sheet, with no way to see which were done. Here every company that asks for one shows as
   owed, compiled or sent for each book. The pages themselves come in by photo, scan or file: drop them on the report
   and they are read into the table, each figure marked as read from the page or as one to check by eye. A .csv or
   text file is read for real; a photo or PDF shows a sample reading here, and the live system sends it to a document
   reader (see the database note in SITE.md). */

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
  // What the last reading was: a photo or PDF (sample figures here) or a sheet (read for real).
  const [filled, setFilled] = useState<false | "photo" | "sheet">(false);
  const [pages, setPages] = useState<{ name: string; url: string | null }[]>([]);
  const [reading, setReading] = useState<{ sheetText: string | null; label: string } | null>(null);
  // Per row: "read" came off the page cleanly, "check" is a figure the reader was unsure of. Typing clears it.
  const [marks, setMarks] = useState<("read" | "check" | undefined)[]>([]);
  const [missed, setMissed] = useState(0);
  const [over, setOver] = useState(false);
  const lines = base.map((l, i) => ({ ...l, units: Math.max(0, Math.round(Number(units[i]) || 0)) }));
  const sumUnits = lines.reduce((n, l) => n + l.units, 0);
  const sumValue = lines.reduce((n, l) => n + (selloutValue(l) || 0), 0);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (act(s, "sellout.compile", supplier.name, () => saveSellout(s, { supplierId: supplier.id, bookId, lines, note: note.trim() || undefined, scan }), "Saved. " + sumUnits.toLocaleString("en-US") + " units recorded.")) onDone();
  }

  async function takeFiles(list: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length) return;
    setScan({ fileName: files.length === 1 ? files[0].name : files[0].name + " and " + (files.length - 1) + " more", size: files.reduce((n, f) => n + f.size, 0), type: files[0].type || "image/jpeg" });
    setPages(files.map((f) => ({ name: f.name, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null })));
    const sheet = files.find((f) => /\.(csv|tsv|txt)$/i.test(f.name) || f.type.startsWith("text/"));
    setReading({ sheetText: sheet ? await sheet.text() : null, label: files.length === 1 ? files[0].name : files.length + " pages" });
  }

  function finishRead() {
    const r = reading;
    setReading(null);
    if (!r) return;
    if (r.sheetText != null) {
      // A real reading: the first cell names the item, the last whole number on the row is the units.
      const key = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
      const next = units.slice(), mk = marks.slice();
      let miss = 0;
      const rows = r.sheetText
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => l.split(l.includes("\t") ? "\t" : l.includes(";") ? ";" : ",").map((c) => c.trim().replace(/^"|"$/g, "")));
      rows.forEach((cells) => {
        const name = key(cells[0] || "");
        const num = [...cells].reverse().find((c) => /^\s*[\d,]+\s*$/.test(c));
        if (!name || !num) return;
        const i = base.findIndex((l) => {
          const k = key(l.item);
          return k === name || k.includes(name) || name.includes(k);
        });
        if (i < 0) return void miss++;
        next[i] = num.replace(/\D/g, "");
        mk[i] = "read";
      });
      setUnits(next);
      setMarks(mk);
      setMissed(miss);
      setFilled("sheet");
    } else {
      // Stands in for the document reader: plausible figures, with one row in five flagged to check by eye.
      setUnits(base.map((l, i) => String(120 + ((l.item.length * 37 + i * 91) % 1900))));
      setMarks(base.map((_, i) => (i % 5 === 3 ? "check" : "read")));
      setMissed(0);
      setFilled("photo");
    }
  }

  const nRead = marks.filter((m) => m === "read").length, nCheck = marks.filter((m) => m === "check").length;

  return (
    <form onSubmit={save}>
      <div
        className={"scan-box" + (over ? " is-over" : "")}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); takeFiles(e.dataTransfer.files); }}
      >
        <span className="scan-icon" aria-hidden="true">
          <Icon name="camera" />
        </span>
        <div className="grow">
          <strong>Scan or upload the pages</strong>
          <span>Notebook photo, till print-out, PDF or .csv. Several at once.</span>
        </div>
        <label className="btn btn-primary btn-sm">
          Choose pages
          <input className="visually-hidden" type="file" accept="image/*,.pdf,.csv,.tsv,.txt" multiple onChange={(e) => { takeFiles(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {pages.length ? (
        <ul className="scan-pages" aria-label="Pages attached">
          {pages.map((pg) => (
            <li key={pg.name}>
              {pg.url ? <img src={pg.url} alt="" /> : <span className="scan-file"><Icon name="file" /></span>}
              <span>{pg.name}</span>
            </li>
          ))}
        </ul>
      ) : scan ? (
        <p className="hint">{"Attached: " + scan.fileName + " (" + fileSize(scan.size) + ")."}</p>
      ) : null}
      {reading ? (
        <Working
          steps={reading.sheetText != null ? ["Opening " + reading.label, "Finding the item and units columns", "Matching each row to this company’s specials"] : ["Straightening " + reading.label, "Finding the table on the page", "Reading the item names", "Reading the units", "Matching each row to this company’s specials"]}
          onDone={finishRead}
        />
      ) : null}
      {filled && !reading ? (
        <div className="scan-result" role="status">
          <span className="scan-chip is-read">{nRead + " read from the page"}</span>
          {nCheck ? <span className="scan-chip is-check">{nCheck + " to check by eye"}</span> : null}
          {missed ? <span className="scan-chip is-miss">{missed + " not on this company’s list"}</span> : null}
          {filled === "photo" ? <span className="scan-demo">Sample figures: the live system reads the photo itself.</span> : null}
        </div>
      ) : null}
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
                <td className={"num" + (marks[i] ? " is-" + marks[i] : "")}>
                  {marks[i] === "check" ? <span className="check-flag">Check</span> : null}
                  <input className="cell-input num" type="text" inputMode="numeric" aria-label={"Units sold: " + l.item + (marks[i] === "check" ? " (check this figure)" : "")} value={units[i]} onFocus={() => marks[i] && setMarks(marks.map((m, j) => (j === i ? undefined : m)))} onChange={(e) => setUnits(units.map((u, j) => (j === i ? e.target.value.replace(/[^\d]/g, "") : u)))} />
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
