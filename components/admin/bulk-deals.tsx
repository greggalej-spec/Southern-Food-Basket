"use client";

import { useState } from "react";
import { act } from "@/components/admin/bits";
import { Working, VizDialog } from "@/components/viz";
import { retailDepts } from "@/lib/admin/helpers";
import { saveDeal } from "@/lib/admin/writes";
import { money } from "@/lib/format";
import { parseDeals, type DealRow } from "@/lib/ops/events";
import { nowIso, useData, useSession } from "@/lib/store";

/* Many specials at once. Paste the week's list (or choose a .csv saved from Excel): one special per line, "name,
   price" or "name, price, department". The list is shown as a table to check before anything is added; a line with
   no price is left out. Each new special takes its department's photo until a flyer or its own photo replaces it. */

const SAMPLE = "Red velvet cake, 89.95, Cakes\nChobani Flip 150 g, 14.95, Chilled\nLay’s limited flavours, 12.95, Snacks\nDove body wash 650 ml, 34.95, Personal care\nStir-fry pack, 11.95, Fresh and cut veg";

export function BulkDeals({ onClose }: { onClose: () => void }) {
  const d = useData();
  const s = useSession();
  const depts = retailDepts(d);
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const rows: DealRow[] = text.trim() ? parseDeals(text, depts, depts[0]?.id || "") : [];
  const good = rows.filter((r) => r.price != null);
  const stem = (deptId: string) => (depts.find((x) => x.id === deptId)?.img || "").replace(/^.*\//, "").replace(/\.[a-z]+$/, "") || "snacks-basket";

  function add() {
    const today = nowIso().slice(0, 10);
    const ok = act(
      s,
      "specials.bulk",
      good.length + " specials",
      () => good.forEach((r) => saveDeal(s, null, { name: r.name, dept: r.dept, priceRaw: String(r.price), price: r.price as number, img: stem(r.dept), posted: today, alt: r.name, isNew: true, couva: false })),
      good.length + " specials added. They are on the Specials page.",
    );
    if (ok) onClose();
  }

  return (
    <VizDialog title="Add many specials at once" onClose={onClose}>
      <div className="bulk-deals">
        <ol className="mini-steps" aria-label="How it works">
          <li>
            <b>1</b>Paste the list
          </li>
          <li>
            <b>2</b>Check the table
          </li>
          <li>
            <b>3</b>Add them all
          </li>
        </ol>
        <div className="field">
          <label htmlFor="bd-text">The week’s specials, one per line</label>
          <textarea id="bd-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Name, price, department\n" + SAMPLE.split("\n").slice(0, 2).join("\n")} />
          <p className="hint cluster">
            <label className="link-btn">
              Choose a .csv file
              <input className="visually-hidden" type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setText(await f.text()); e.target.value = ""; }} />
            </label>
            <button className="link-btn" type="button" onClick={() => setText(SAMPLE)}>
              Use a sample list
            </button>
          </p>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">Specials read from the list</caption>
              <thead>
                <tr>
                  <th scope="col">Special</th>
                  <th scope="col" className="num">
                    Price
                  </th>
                  <th scope="col">Department</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name + i} className={r.problem ? "is-problem" : ""}>
                    <th scope="row">{r.name}</th>
                    <td className="num">{r.price != null ? money(r.price) : r.problem}</td>
                    <td>{depts.find((x) => x.id === r.dept)?.short || "Other"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {working ? <Working steps={["Checking each price", "Placing each one in its department", "Putting them on the Specials page"]} onDone={add} /> : null}
        <div className="cluster drawer-actions">
          <button className="btn btn-primary" type="button" disabled={!good.length || working} onClick={() => setWorking(true)}>
            {good.length ? "Add " + good.length + (good.length === 1 ? " special" : " specials") : "Add specials"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          {rows.length > good.length ? <span className="small muted">{rows.length - good.length + " without a price will be left out."}</span> : null}
        </div>
      </div>
    </VizDialog>
  );
}
