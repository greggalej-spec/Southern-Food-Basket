"use client";

import { useState } from "react";
import { Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Flow, PairBars } from "@/components/viz";
import { can, scopeOf } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { branchName, dollars, plural, todayIso } from "@/lib/admin/helpers";
import { dayTT } from "@/lib/admin/tt";
import { daysUntil, fmtDate } from "@/lib/format";
import { BULK_STAGE, addBulkOrder, advanceBulk, bulkCost, bulkTotal, bulkWaiting, lastTime, seasons, setBulkQty, type BulkForm } from "@/lib/ops/office";
import { useData, useSession } from "@/lib/store";
import type { BulkOrder, Seed } from "@/lib/types";

/* Bulk orders: the director buys turkeys, butter cookies, oil and the like once for all five stores. The numbers
   used to live in a WhatsApp group. Here each order has a row per store: the store manager gives the quantity, last
   time's figure sits beside it, and once the order is placed the record stays for next year. */

const TONE = { warn: "warn", info: "info", ok: "ok", bad: "bad", plain: "neutral" } as const;

function QtyCell({ order, branchId, qty, editable }: { order: BulkOrder; branchId: string; qty: number; editable: boolean }) {
  const s = useSession();
  const [draft, setDraft] = useState<string | null>(null);
  if (!editable) return <span className="num">{qty.toLocaleString("en-US")}</span>;
  function commit() {
    if (draft == null) return;
    const n = Math.round(Number(draft));
    setDraft(null);
    if (!isFinite(n) || n < 0) return;
    act(s, "bulk.qty", order.item, () => setBulkQty(s, order.id, branchId, n), "Saved.");
  }
  return (
    <input
      className="cell-input num"
      type="text"
      inputMode="numeric"
      aria-label={"Quantity for this store"}
      value={draft ?? String(qty)}
      onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function OrderCard({ d, o }: { d: Seed; o: BulkOrder }) {
  const s = useSession();
  const manage = can(d, s, "bulk.manage");
  const scope = scopeOf(d, s);
  const prev = lastTime(d, o);
  const stageInfo = BULK_STAGE[o.status];
  const waiting = bulkWaiting(o);
  const total = bulkTotal(o), prevTotal = prev ? bulkTotal(prev) : 0;
  const left = o.status === "collecting" ? daysUntil(o.orderBy) : null;
  const each = o.unit.replace(/ of .*/, "");
  return (
    <section className="panel bulk-order" aria-labelledby={"bo-" + o.id}>
      <div className="panel-head">
        <div className="grow">
          <h3 id={"bo-" + o.id}>{o.item}</h3>
          <p className="small muted bulk-sub">
            {o.supplierName + " · " + o.unit + " at " + dollars(o.unitCost)}
            {o.status === "collecting" ? " · stores answer by " + fmtDate(o.orderBy, { year: false }) + (left != null ? (left < 0 ? ", now overdue" : left === 0 ? ", today" : ", " + plural(left, "day") + " left") : "") : ""}
            {o.expected && o.status === "ordered" ? " · expected " + fmtDate(o.expected, { year: false }) : ""}
          </p>
        </div>
        <Badge variant={TONE[stageInfo.tone]}>{stageInfo.label}</Badge>
      </div>
      <div className="table-wrap flat">
        <table className="bulk-table">
          <caption className="visually-hidden">{"Quantities by store for " + o.item}</caption>
          <thead>
            <tr>
              <th scope="col">Store</th>
              <th scope="col" className="num">
                {"This order (" + each + "s)"}
              </th>
              <th scope="col" className="num">
                {prev ? prev.season : "Last time"}
              </th>
              <th scope="col">Given by</th>
            </tr>
          </thead>
          <tbody>
            {o.allocations.map((a) => {
              const before = prev?.allocations.find((x) => x.branchId === a.branchId)?.qty;
              const mine = manage || (can(d, s, "bulk.store", { branchId: a.branchId }) && (!scope || scope.includes(a.branchId)));
              return (
                <tr key={a.branchId}>
                  <th scope="row">{branchName(d, a.branchId)}</th>
                  <td className="num">
                    <QtyCell order={o} branchId={a.branchId} qty={a.qty} editable={mine && o.status === "collecting"} />
                  </td>
                  <td className="num">{before == null ? <span className="is-blank">—</span> : before.toLocaleString("en-US")}</td>
                  <td>{a.confirmedAt ? personName(d, a.confirmedBy) : o.status === "collecting" ? <Badge variant="warn">Waiting</Badge> : <span className="is-blank">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">All stores</th>
              <td className="num">
                <strong>{total.toLocaleString("en-US")}</strong>
              </td>
              <td className="num">{prev ? prevTotal.toLocaleString("en-US") : ""}</td>
              <td>
                <strong>{dollars(bulkCost(o))}</strong>
                {prev && prevTotal ? <span className="meta">{(total >= prevTotal ? "Up " : "Down ") + Math.abs(Math.round(((total - prevTotal) / prevTotal) * 100)) + "% on last time"}</span> : null}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {prev ? (
        <div className="bulk-chart">
          <PairBars rows={o.allocations.map((a) => ({ label: branchName(d, a.branchId), now: a.qty, then: prev.allocations.find((x) => x.branchId === a.branchId)?.qty ?? null }))} nowLabel="This order" thenLabel={prev.season} />
        </div>
      ) : null}
      {o.note || prev?.note ? <p className="bulk-note">{[o.note, prev?.note ? prev.season + ": " + prev.note : ""].filter(Boolean).join(" ")}</p> : null}
      {manage && stageInfo.next ? (
        <div className="panel-body bulk-foot">
          {waiting.length ? <p className="small muted">{"Still waiting for " + waiting.map((a) => branchName(d, a.branchId)).join(" and ") + "."}</p> : null}
          <button className={"btn btn-sm " + (waiting.length ? "btn-ghost" : "btn-primary")} type="button" onClick={() => act(s, "bulk.advance", o.item, () => advanceBulk(s, o.id), stageInfo.next!.done + ".")}>
            {stageInfo.next.label}
          </button>
          {o.orderedAt ? <span className="small muted">{"Ordered " + dayTT(o.orderedAt)}</span> : null}
        </div>
      ) : null}
    </section>
  );
}

export function BulkPanel() {
  const d = useData();
  const s = useSession();
  const manage = can(d, s, "bulk.manage");
  const all = seasons(d);
  const [season, setSeason] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const cur = season && all.includes(season) ? season : all[0];
  const orders = (d.bulkOrders || []).filter((o) => o.season === cur);
  const open = (d.bulkOrders || []).filter((o) => o.status === "collecting");
  const committed = orders.reduce((n, o) => n + bulkCost(o), 0);
  const waiting = open.reduce((n, o) => n + bulkWaiting(o).length, 0);

  return (
    <div className="section-stack">
      <Flow id="bulk" />
      <div className="toolbar">
        <div className="field-inline">
          <label htmlFor="bo-season">Season</label>
          <select id="bo-season" value={cur} onChange={(e) => setSeason(e.target.value)}>
            {all.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <span className="grow" />
        {manage ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}>
            Open a bulk order
          </button>
        ) : null}
      </div>
      <div className="stats">
        <Stat icon="boxes" label={"Orders, " + cur} value={orders.length} sub={plural(orders.filter((o) => o.status === "collecting").length, "order") + " still collecting"} />
        <Stat icon="store" label="Store answers waiting" value={waiting} tone={waiting ? "warn" : "ok"} ring={{ value: open.length * 5 - waiting, of: Math.max(open.length * 5, 1) }} />
        <Stat label={"Committed, " + cur} value={"$" + Math.round(committed).toLocaleString("en-US")} icon="wallet" tone="pink" />
      </div>
      <div className="bulk-grid" data-tour="bulk-orders">
        {orders.map((o) => (
          <OrderCard key={o.id} d={d} o={o} />
        ))}
      </div>
      <SideSheet open={adding} onClose={() => setAdding(false)} title="Open a bulk order" sub="Every store gets a row to fill in.">
        {adding ? <BulkFormView seasonHint={cur} onDone={(sea) => { setAdding(false); setSeason(sea); }} /> : null}
      </SideSheet>
    </div>
  );
}

function BulkFormView({ seasonHint, onDone }: { seasonHint: string; onDone: (season: string) => void }) {
  const s = useSession();
  const [v, setV] = useState<BulkForm>({ season: seasonHint, item: "", supplierName: "", unit: "case of 12", unitCost: 0, orderBy: todayIso(), note: "" });
  const [cost, setCost] = useState("");
  const [err, setErr] = useState("");
  const set = <K extends keyof BulkForm>(k: K, val: BulkForm[K]) => setV((p) => ({ ...p, [k]: val }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = Number(cost.replace(/[$,]/g, ""));
    if (!v.item.trim() || !v.supplierName.trim()) return setErr("Enter the item and the company it is ordered from.");
    if (!(c > 0)) return setErr("Enter the cost of one unit, for example 318.00.");
    if (act(s, "bulk.open", v.item, () => addBulkOrder(s, { ...v, item: v.item.trim(), supplierName: v.supplierName.trim(), unitCost: Math.round(c * 100) / 100, note: v.note?.trim() || undefined }), "Order opened. Stores can now give their numbers.")) onDone(v.season);
  }
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="bf-season">Season</label>
        <input id="bf-season" type="text" value={v.season} onChange={(e) => set("season", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="bf-item">Item</label>
        <input id="bf-item" type="text" value={v.item} onChange={(e) => set("item", e.target.value)} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="bf-sup">Company</label>
        <input id="bf-sup" type="text" value={v.supplierName} onChange={(e) => set("supplierName", e.target.value)} autoComplete="off" />
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="bf-unit">Unit</label>
          <input id="bf-unit" type="text" value={v.unit} onChange={(e) => set("unit", e.target.value)} aria-describedby="bf-unit-h" />
          <p className="hint" id="bf-unit-h">
            For example: case of 12.
          </p>
        </div>
        <div className="field">
          <label htmlFor="bf-cost">Cost of one unit, TTD</label>
          <input id="bf-cost" type="text" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bf-by">Stores answer by</label>
        <input id="bf-by" type="date" value={v.orderBy} onChange={(e) => set("orderBy", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="bf-note">Note</label>
        <textarea id="bf-note" rows={2} value={v.note || ""} onChange={(e) => set("note", e.target.value)} />
      </div>
      <button className="btn btn-primary" type="submit">
        Open the order
      </button>
    </form>
  );
}
