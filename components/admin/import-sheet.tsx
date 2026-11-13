"use client";

import { useRef, useState } from "react";
import { act, csvRow, download } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { Working } from "@/components/viz";
import { plural } from "@/lib/admin/helpers";
import { fileSize } from "@/lib/format";
import { GENERAL, HOUSE, importSheets, planWorkbook, readWorkbook, rowsToLines, sameName, textToRows, type Incoming, type WorkbookPlan } from "@/lib/ops/specials";
import { useData, useSession } from "@/lib/store";
import type { SpecialsBook, SupplierLine, SupplierSheet } from "@/lib/types";

/* Bringing specials in. Three ways, all ending in the same table for a person to check:
   - a whole workbook (.xlsx) laid out the office's way: every company tab becomes a sheet, the key tab flags lines;
   - one company's rows: a .csv or .txt file, or text pasted from Excel, an e-mail or a WhatsApp message;
   - a PDF, a Word file or a photo. Reading those needs the document reader that is switched on with the real
     system, so the prototype shows what it returns using a sample, and says so.
   The file is read in the browser. Nothing is uploaded, and only its name and size are kept. */

type Source = NonNullable<SupplierSheet["source"]>;
type Read =
  | { kind: "workbook"; file: Source; plan: WorkbookPlan; general: SupplierLine[] }
  | { kind: "single"; file: Source | null; lines: SupplierLine[]; guess: string; sample?: boolean };

const SAMPLE_ROWS = [
  ["SAMPLE FOODS LTD", "COUNT", "CASE PRICE", "VAT", "SPECIALS", "NOTES"],
  ["Sorrel drink 2 L", "6", "", "VAT", "2 for 29.95", "16 Nov - 31 Dec"],
  ["Ginger beer 2 L", "6", "", "VAT", "2 for 29.95", "16 Nov - 31 Dec"],
  ["Fruit cake mix 1 kg", "12", "", "", "34.95", "16 Nov - 24 Dec"],
  ["Cherries in syrup 280 g", "24", "", "", "2 for 31.95", "16 Nov - 24 Dec"],
  ["Ponche de creme 750 ml", "12", "", "VAT", "64.95", "1 Dec - 31 Dec"],
];
const SAMPLE_TEXT = "Christmas specials 16 Nov to 31 Dec\nSorrel drink 2L - 2 for 29.95\nGinger beer 2L - 2 for 29.95\nFruit cake mix 1kg 34.95\nCherries in syrup 280g 2 for 31.95\nPonche de creme 750ml 64.95";

const meta = (f: File, via: Source["via"]): Source => ({ fileName: f.name, size: f.size, type: f.type || "application/octet-stream", via });

export function ImportSheet({ open, onClose, book, supplierId, onDone }: { open: boolean; onClose: () => void; book: SpecialsBook; supplierId: string | null; onDone: (supplierId: string | null) => void }) {
  const d = useData();
  const s = useSession();
  const [read, setShown] = useState<Read | null>(null);
  // What was read, held back while the steps play so a person can see what the system did.
  const [pending, setPending] = useState<Read | null>(null);
  const setRead = (r: Read | null) => (r ? setPending(r) : (setPending(null), setShown(null)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [via, setVia] = useState<Source["via"]>("WhatsApp");
  const [company, setCompany] = useState(supplierId || "");
  const [newName, setNewName] = useState("");
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const suppliers = (d.suppliers || []).filter((x) => x.id !== GENERAL).slice().sort((a, b) => a.name.localeCompare(b.name));

  function reset() {
    setRead(null);
    setError("");
    setText("");
    setSkip(new Set());
    setNewName("");
    if (fileRef.current) fileRef.current.value = "";
  }
  function close() {
    reset();
    onClose();
  }

  function guessCompany(name: string) {
    const hit = suppliers.find((x) => sameName(x.name, name));
    if (hit) setCompany(hit.id);
    else if (!supplierId) {
      setCompany("new");
      setNewName(name === name.toUpperCase() ? name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : name);
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError("");
    setBusy(true);
    try {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      if (ext === "xlsx" || ext === "xlsm") {
        const tabs = await readWorkbook(f);
        if (tabs.length > 2) {
          const { plan, general } = planWorkbook(tabs);
          setRead({ kind: "workbook", file: meta(f, "Workbook"), plan, general });
          setSkip(new Set(plan.filter((p) => !p.lines.length).map((p) => p.tab)));
        } else {
          const rows = tabs[0]?.rows || [];
          const guess = rows[0]?.[0] || "";
          setRead({ kind: "single", file: meta(f, via), lines: rowsToLines(rows), guess });
          guessCompany(guess);
        }
      } else if (ext === "csv" || ext === "txt" || ext === "tsv") {
        const rows = textToRows(await f.text());
        const headed = /special|saving/i.test(rows[0]?.join(" ") || "");
        setRead({ kind: "single", file: meta(f, via), lines: rowsToLines(rows), guess: headed ? rows[0][0] : "" });
        if (headed) guessCompany(rows[0][0]);
      } else {
        // PDF, Word, photo: the prototype has no document reader, so it shows the sample and says so.
        setRead({ kind: "single", file: meta(f, ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "heic" ? "Scan" : via), lines: rowsToLines(SAMPLE_ROWS), guess: "", sample: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "That file could not be read.");
    } finally {
      setBusy(false);
    }
  }

  function readText() {
    const rows = textToRows(text);
    const lines = rowsToLines(rows).filter((l) => l.special || l.casePrice != null);
    if (!lines.length) {
      setError("No specials found in that text. Each line needs an item and a price, for example “Fruta 1L 2 for 19.95”.");
      return;
    }
    setError("");
    setRead({ kind: "single", file: null, lines, guess: "" });
  }

  function bringIn() {
    if (!read) return;
    let incoming: Incoming[];
    let source: SupplierSheet["source"];
    let focus: string | null = null;
    if (read.kind === "workbook") {
      incoming = read.plan.filter((p) => !skip.has(p.tab) && p.lines.length).map((p) => (p.house ? { supplierId: HOUSE, lines: p.lines } : { supplierName: p.supplierName, lines: p.lines }));
      if (read.general.length) incoming.push({ supplierId: GENERAL, lines: read.general });
      source = read.file;
    } else {
      if (!company || (company === "new" && !newName.trim())) {
        setError("Choose the company these specials are from.");
        return;
      }
      incoming = [company === "new" ? { supplierName: newName.trim(), lines: read.lines } : { supplierId: company, lines: read.lines }];
      source = read.file || { fileName: "Pasted text", size: text.length, type: "text/plain", via: via === "Workbook" ? "Typed in" : via };
      focus = company === "new" ? null : company;
    }
    let result = { sheets: 0, lines: 0 };
    const ok = act(s, "suppliers.import", book.title, () => {
      result = importSheets(s, book.id, incoming, source);
    });
    if (!ok) return;
    toast(plural(result.sheets, "sheet") + " and " + plural(result.lines, "line") + " brought into " + book.title + ". " + (result.sheets === 1 ? "It is" : "They are") + " marked “To check”.", "ok");
    reset();
    onDone(focus);
  }

  const wbCount = read?.kind === "workbook" ? read.plan.filter((p) => !skip.has(p.tab) && p.lines.length) : [];

  return (
    <SideSheet
      open={open}
      onClose={close}
      title={"Bring specials into " + book.title}
      sub="Read here in your browser. Nothing is uploaded."
      footer={
        read ? (
          <>
            <button className="btn btn-primary" type="button" onClick={bringIn} data-tour="import-go">
              {read.kind === "workbook" ? "Bring in " + plural(wbCount.length, "sheet") : "Bring in " + plural(read.lines.length, "line")}
            </button>
            <button className="btn btn-ghost" type="button" onClick={reset}>
              Start again
            </button>
          </>
        ) : undefined
      }
    >
      {error ? (
        <div className="alert alert-bad" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {pending ? (
        <Working
          steps={pending.kind === "workbook" ? ["Opening the workbook", "Finding the company tabs", "Reading items, counts and specials", "Matching the key specials"] : pending.sample ? ["Opening the file", "Reading the page", "Laying it out in the six columns"] : ["Reading the lines", "Finding items and specials", "Laying them out in the six columns"]}
          onDone={() => {
            setShown(pending);
            setPending(null);
          }}
        />
      ) : !read ? (
        <div className="import-ways">
          <section>
            <h3>A file</h3>
            <p className="muted small">An Excel workbook with a tab for each company brings in every company at once. A .csv or .txt file brings in one company.</p>
            <label className="dropzone" data-tour="import-file">
              <Icon name="upload" />
              <span>{busy ? "Reading the file…" : "Choose a file"}</span>
              <small>.xlsx, .csv or .txt. A PDF, Word file or photo shows a sample reading.</small>
              <input ref={fileRef} type="file" className="visually-hidden" accept=".xlsx,.xlsm,.csv,.tsv,.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <button
              className="link-btn small"
              type="button"
              onClick={() => download("sample-supplier-sheet.csv", SAMPLE_ROWS.map(csvRow).join("\r\n"))}
            >
              Download a sample sheet to try
            </button>
          </section>
          <section>
            <h3>Pasted text</h3>
            <p className="muted small">Copy rows from Excel, or the specials from an e-mail or a WhatsApp message, and paste them here. One special to a line.</p>
            <div className="field">
              <label htmlFor="imp-text">The specials</label>
              <textarea id="imp-text" rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Fruta 1L 2 for 19.95\nChubby 250ml 3 cases for 110"} data-tour="import-text" />
            </div>
            <div className="field">
              <label htmlFor="imp-via">How it reached you</label>
              <select id="imp-via" value={via} onChange={(e) => setVia(e.target.value as Source["via"])}>
                <option>WhatsApp</option>
                <option>E-mail</option>
                <option>Typed in</option>
              </select>
            </div>
            <div className="cluster">
              <button className="btn btn-outline btn-sm" type="button" onClick={readText} disabled={!text.trim()}>
                Read the text
              </button>
              <button className="link-btn small" type="button" onClick={() => setText(SAMPLE_TEXT)}>
                Paste a sample message
              </button>
            </div>
          </section>
        </div>
      ) : read.kind === "workbook" ? (
        <div>
          <p>
            <strong>{read.file.fileName}</strong> <span className="muted">({fileSize(read.file.size)})</span> has {plural(read.plan.length, "company tab")}:{" "}
            {plural(read.plan.filter((p) => p.lines.length).length, "tab")} with specials and {read.plan.filter((p) => !p.lines.length).length} empty.
            {read.general.length ? " The key specials tab flagged its matches; " + plural(read.general.length, "key line") + " not on any company tab go on the general list." : ""}
          </p>
          <p className="muted small">Untick a tab to leave it out. A company that already has a sheet in this book gets its lines replaced.</p>
          <ul className="import-tabs">
            {read.plan.map((p) => (
              <li key={p.tab}>
                <label className="check">
                  <input
                    type="checkbox"
                    disabled={!p.lines.length}
                    checked={!skip.has(p.tab) && !!p.lines.length}
                    onChange={(e) => {
                      const next = new Set(skip);
                      if (e.target.checked) next.delete(p.tab);
                      else next.add(p.tab);
                      setSkip(next);
                    }}
                  />
                  <span>
                    {p.house ? "SFB own lines" : p.supplierName}
                    <small className="muted">{p.lines.length ? " · " + plural(p.lines.length, "line") + (p.lines.some((l) => l.key) ? ", " + p.lines.filter((l) => l.key).length + " key" : "") : " · nothing on this tab yet"}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          {read.sample ? (
            <div className="alert alert-info" role="note">
              <p>
                <strong>Sample reading.</strong> Reading a PDF, a Word file or a photo needs the document reader, which is switched on when the system is built for real. These lines are a sample of what it returns for <strong>{read.file?.fileName}</strong>; the
                steps after this one are the real ones.
              </p>
            </div>
          ) : (
            <p>
              {plural(read.lines.length, "line")} read{read.file ? " from " + read.file.fileName : " from the text"}. Check the company, then bring them in. You can correct any line afterwards.
            </p>
          )}
          <div className="field">
            <label htmlFor="imp-company">Company</label>
            <select id="imp-company" value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="">Choose a company</option>
              {suppliers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
              <option value="new">A new company…</option>
            </select>
          </div>
          {company === "new" ? (
            <div className="field">
              <label htmlFor="imp-new">Company name</label>
              <input id="imp-new" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} autoComplete="off" />
            </div>
          ) : null}
          <div className="table-wrap import-preview">
            <table>
              <caption className="visually-hidden">The lines that were read</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Count</th>
                  <th scope="col" className="num">
                    Case price
                  </th>
                  <th scope="col">Special</th>
                </tr>
              </thead>
              <tbody>
                {read.lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.item}
                      {l.valid ? <span className="meta">{l.valid}</span> : null}
                    </td>
                    <td>{l.count || "—"}</td>
                    <td className="num">{l.casePrice == null ? <span className="is-blank">To add</span> : l.casePrice.toFixed(2)}</td>
                    <td>{l.special || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SideSheet>
  );
}
