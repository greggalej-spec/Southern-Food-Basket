"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { DOC_TITLE, docsFor, usePrintDoc, type DocKind } from "@/components/deliveries/documents";
import { LineThumb } from "@/components/deliveries/line-thumb";
import { LineEditor, blankLine, fileMeta, readLines, type LineDraft } from "@/components/site/deliveries";
import { Badge } from "@/components/ui/badge";
import { useNowMinute, useToday } from "@/components/use-today";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { plural } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { fileSize, fmtDate, money } from "@/lib/format";
import { groupLines, itemOfLine, photoOf } from "@/lib/ops/delivery-catalogue";
import {
  PAY_DAYS, QUOTE_DAYS, VAT, VIAS, ZONES, addDeliveryMessage, cancelDelivery, deliveryCounts, expired, finishCheck, finishPicking, lineText, logDelivery, markDelivered, nextInvoiceNo,
  payText, quoteDueAt, recordPo, resolveIssue, sendQuote, stage, startPicking, suppliedOf, sums, tickLine, toPack, zoneLabel, type DeliveryForm,
} from "@/lib/ops/deliveries";
import { byId, useData, useSession } from "@/lib/store";
import type { DeliveryOrder, DeliveryStatus, FileMeta, Seed, VatCode } from "@/lib/types";

/* Deliveries: the Couva trial's board, for Narindra (Supervisor, Couva) in his employee portal and for the Managing
   Directors in the office console. Each business order is a card that moves from the list they sent, to the quotation,
   to their purchase order, to the shelves, to a second person's check, out of the door with a delivery note, and to
   the tax invoice. The drawer on each card holds the step's one job, the order's papers to print, and the thread of
   notes and replies, as the community requests do. */

const TONE: Record<string, "neutral" | "warn" | "ok" | "bad" | "info"> = { info: "info", warn: "warn", ok: "ok", bad: "bad", plain: "neutral" };
const COLUMNS: { id: string; label: string; statuses: DeliveryStatus[] }[] = [
  { id: "new", label: "Waiting for a quote", statuses: ["new"] },
  { id: "quoted", label: "Quote sent", statuses: ["quoted"] },
  { id: "pick", label: "To pick", statuses: ["accepted", "picking"] },
  { id: "check", label: "To check", statuses: ["checking"] },
  { id: "ready", label: "Out or ready", statuses: ["ready"] },
  { id: "closed", label: "Closed", statuses: ["done", "cancelled"] },
];
const invoiceMode = (o: DeliveryOrder) => (["checking", "ready", "done"].includes(o.status) ? "invoice" : "quote");

function dueLine(o: DeliveryOrder, now: number, today: string): { text: string; late?: boolean } | null {
  if (o.issue && !o.issue.resolvedAt) return { text: "Problem reported " + whenTT(o.issue.at), late: true };
  if (o.status === "new") {
    const due = quoteDueAt(o);
    const late = now > 0 && new Date(due).getTime() < now;
    return { text: (late ? "Quote late: was due " : "Quote due by ") + whenTT(due), late };
  }
  if (o.status === "quoted" && o.quote) return expired(o, today) ? { text: "Quote expired " + fmtDate(o.quote.validUntil, { year: false }), late: true } : { text: "Prices hold to " + fmtDate(o.quote.validUntil, { year: false }) };
  if (o.status === "picking") return { text: "Being picked" };
  if (o.status === "ready") return { text: o.fulfil === "delivery" ? "Out for delivery" : "Waiting to be collected" };
  return null;
}

function Card({ o, now, today, onOpen }: { o: DeliveryOrder; now: number; today: string; onOpen: (id: string) => void }) {
  const due = dueLine(o, now, today);
  return (
    <button type="button" className="pipe-card" onClick={() => onOpen(o.id)} data-order={o.ref}>
      <span className="pipe-kind">{o.fulfil === "delivery" ? "Delivery" : "Collect at Couva"}</span>
      <strong>{o.company}</strong>
      <CardPics o={o} />
      <span className="pipe-ask">
        {plural(o.lines.length, "item")}: {o.lines.slice(0, 3).map((l) => l.item.toLowerCase()).join(", ") + (o.lines.length > 3 ? "…" : "")}
      </span>
      <span className="pipe-meta">
        {o.ref} · {o.via.toLowerCase()}
        {o.quote ? " · " + money(sums(o, invoiceMode(o)).total) : ""}
        {o.status === "cancelled" ? " · closed" : o.invoice ? " · " + o.invoice.no : ""}
      </span>
      {due ? <span className={"pipe-due" + (due.late ? " is-late" : "")}>{due.text}</span> : null}
    </button>
  );
}

/** The first few things on the order, as pictures: what kind of order it is, at a glance. Decorative; the card's
 *  text names the items. Plain images, because the card is a button. */
function CardPics({ o }: { o: DeliveryOrder }) {
  const ids = [...new Set(o.lines.flatMap((l) => itemOfLine(l)?.id || []))];
  if (!ids.length) return null;
  return (
    <span className="dl-card-pics" aria-hidden="true">
      {ids.slice(0, 4).map((id) => (
        <img key={id} src={photoOf(id)} alt="" loading="lazy" decoding="async" />
      ))}
      {ids.length > 4 ? <span>{"+" + (ids.length - 4)}</span> : null}
    </span>
  );
}

export function DeliveriesPanel({ item = null }: { item?: string | null }) {
  const d = useData();
  const s = useSession();
  const mayLog = can(d, s, "deliveries.handle", { branchId: "couva" });
  const now = useNowMinute();
  const today = useToday();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [openId, setOpenId] = useState<string | null>(item);
  const [seenItem, setSeenItem] = useState(item);
  const [logging, setLogging] = useState(false);
  const { node, print } = usePrintDoc();
  if (item !== seenItem) {
    setSeenItem(item);
    if (item) setOpenId(item);
  }
  const all = (d.deliveries || []).slice().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  const counts = deliveryCounts(d, now);
  const current = byId(d.deliveries, openId);
  const lead = byId(d.employees, "emp-narindra");
  const problems = all.filter((o) => o.issue && !o.issue.resolvedAt);

  return (
    <div className="section-stack dl-board">
      {node}
      <div className="dl-lead">
        <p>
          <strong>Couva trial</strong>
          {lead ? ", looked after by " + lead.name + " (" + lead.role + ")" : ""}. Lists come in from the website, WhatsApp and e-mail. <span className="muted">Demo orders: the companies, lists, prices and VAT codes are invented.</span>
        </p>
      </div>

      {problems.length ? (
        <div className="dl-alert" role="status">
          <strong>{plural(problems.length, "problem")} reported by customers:</strong>{" "}
          {problems.map((o, i) => (
            <span key={o.id}>
              {i ? ", " : ""}
              <button type="button" className="link-btn" onClick={() => setOpenId(o.id)}>
                {o.ref + " " + o.company}
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="stats">
        <Stat icon="bell" label="Waiting for a quote" value={counts.new} tone={counts.late ? "bad" : counts.new ? "warn" : undefined} sub={counts.late ? counts.late + " past 24 hours" : "Reply within 24 hours"} />
        <Stat icon="file" label="Quotes out" value={counts.quoted} sub="Waiting for a PO" />
        <Stat icon="boxes" label="Picking and checking" value={counts.inWork} tone={counts.inWork ? "pink" : undefined} />
        <Stat icon="truck" label="Out or ready" value={counts.ready} sub={money(counts.invoiced) + " invoiced"} />
      </div>

      <div className="toolbar">
        <Seg label="View" value={view} onChange={setView} options={[{ id: "pipeline", label: "Pipeline" }, { id: "list", label: "List" }]} />
        <span className="grow" />
        <Link className="link-btn small" href="/deliveries" target="_blank">
          See the public page
        </Link>
        {mayLog ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setLogging(true)}>
            Log an order
          </button>
        ) : null}
      </div>

      {view === "pipeline" ? (
        <div className="pipe">
          {COLUMNS.map((c) => {
            const list = all.filter((o) => c.statuses.includes(o.status));
            return (
              <section className="pipe-col" key={c.id} aria-label={c.label}>
                <h3>
                  {c.label} <span className="num">{list.length}</span>
                </h3>
                {list.length ? list.map((o) => <Card key={o.id} o={o} now={now} today={today} onOpen={setOpenId} />) : <p className="pipe-empty">Nothing here.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <div className="table-wrap flat">
            <table className="stack-table">
              <caption className="visually-hidden">Delivery orders, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Company and list</th>
                  <th scope="col">Came in</th>
                  <th scope="col">Hand-over</th>
                  <th scope="col">Total incl. VAT</th>
                  <th scope="col">Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {all.map((o) => (
                  <tr key={o.id}>
                    <th scope="row">
                      <button className="link-btn cell-title" type="button" onClick={() => setOpenId(o.id)}>
                        {o.company}
                      </button>
                      <span className="meta">{o.ref + " · " + plural(o.lines.length, "item") + (o.po ? " · PO " + o.po.number : "")}</span>
                    </th>
                    <td data-label="Came in">{whenTT(o.receivedAt) + ", " + o.via.toLowerCase()}</td>
                    <td data-label="Hand-over">{o.fulfil === "delivery" ? zoneLabel(o.zone) : "Collect at Couva"}</td>
                    <td data-label="Total incl. VAT">{o.quote ? money(sums(o, invoiceMode(o)).total) : "Not quoted"}</td>
                    <td data-label="Where it stands">
                      <Badge variant={TONE[stage(o.status).tone]}>{stage(o.status).label}</Badge>
                      {o.issue && !o.issue.resolvedAt ? (
                        <>
                          {" "}
                          <Badge variant="bad">Problem reported</Badge>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SideSheet open={!!current} onClose={() => setOpenId(null)} title={current ? current.company : "Order"} sub={current ? current.ref + " · " + (current.fulfil === "delivery" ? "delivery, " + zoneLabel(current.zone) : "collect at Couva") : undefined}>
        {current ? <OrderDetail key={current.id + current.status} o={current} d={d} now={now} today={today} onPrint={(k) => print(current, k)} /> : null}
      </SideSheet>
      <SideSheet open={logging} onClose={() => setLogging(false)} title="Log an order" sub="For a list that came by WhatsApp, e-mail, phone or at the desk.">
        {logging ? (
          <LogForm
            onDone={(id) => {
              setLogging(false);
              setOpenId(id);
            }}
          />
        ) : null}
      </SideSheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}

function OrderDetail({ o, d, now, today, onPrint }: { o: DeliveryOrder; d: Seed; now: number; today: string; onPrint: (k: DocKind) => void }) {
  const s = useSession();
  const mayAct = can(d, s, "deliveries.handle", { branchId: o.branchId });
  const st = stage(o.status);
  const due = dueLine(o, now, today);
  const who = (by: string) => (by === "requester" ? o.contact : personName(d, by));
  const t = sums(o, invoiceMode(o));
  const docs = docsFor(o);

  return (
    <div className="request-detail dl-detail">
      <p className="request-status">
        <Badge variant={TONE[st.tone]}>{st.label}</Badge> <span className="muted small">{st.explain}</span>
      </p>
      {due?.late && !o.issue ? <p className="dl-late">{due.text}. {o.status === "new" ? "Reply today, or call them to say when." : "Re-quote it or close it."}</p> : null}
      {mayAct && o.issue && !o.issue.resolvedAt ? <IssueStep o={o} /> : null}

      <dl className="kv">
        <Row k="Contact" v={o.contact + (o.phone ? ", " + o.phone : "") + (o.email ? ", " + o.email : "")} />
        <Row k="Came in" v={whenTT(o.receivedAt) + " by " + o.via.toLowerCase()} />
        <Row k="Hand-over" v={o.fulfil === "delivery" ? "Deliver to " + (o.address || "an address to confirm") + ((o.address || "").includes(zoneLabel(o.zone)) ? "" : " (" + zoneLabel(o.zone) + ")") : "They collect at Couva"} />
        {o.site ? <Row k="Getting in" v={o.site} /> : null}
        {o.wantedBy ? <Row k="Needed by" v={fmtDate(o.wantedBy)} /> : null}
        <Row k="Swaps" v={o.swaps ? "Allowed: offer a similar item" : "Not allowed: leave it off"} />
        <Row k="Invoice to" v={o.billing ? o.billing.name + ", " + o.billing.address + (o.billing.email ? ", " + o.billing.email : "") : "Not given: ask for the registered name and address before invoicing"} />
        <Row k="Pays" v={(o.payment === "card" ? "By card on " + (o.fulfil === "delivery" ? "delivery" : "collection") : "On invoice") + (o.quote ? ", " + payText(o.quote.payDays) : "")} />
        {o.list ? <Row k="Their list" v={o.list.fileName + " (" + fileSize(o.list.size) + ")"} /> : null}
        {o.notes ? <Row k="Notes" v={o.notes} /> : null}
        {o.quote ? <Row k="Quote" v={money(sums(o).total) + " incl. VAT, by " + personName(d, o.quote.by) + ", " + whenTT(o.quote.at) + "; prices hold to " + fmtDate(o.quote.validUntil)} /> : null}
        {o.po ? <Row k="Purchase order" v={o.po.number + ", " + o.po.via.toLowerCase() + ", " + whenTT(o.po.at) + (o.po.file ? " (" + o.po.file.fileName + ")" : "")} /> : null}
        {o.pickedBy ? <Row k="Picked by" v={personName(d, o.pickedBy) + (o.pickedAt ? ", " + whenTT(o.pickedAt) : "")} /> : null}
        {o.checkedBy ? <Row k="Checked by" v={personName(d, o.checkedBy) + (o.checkedAt ? ", " + whenTT(o.checkedAt) : "")} /> : null}
        {o.handover ? <Row k="Out with" v={o.handover} /> : null}
        {o.pod ? <Row k="Signed for by" v={o.pod.receivedBy + ", " + whenTT(o.pod.at) + (o.pod.notes ? ". Noted: " + o.pod.notes : "") + (o.pod.paidByCard ? ". Paid by card." : "")} /> : null}
        {o.invoice ? <Row k="Tax invoice" v={o.invoice.no + ", " + money(t.total) + (o.pod?.paidByCard ? ", paid" : ", due " + fmtDate(o.invoice.due))} /> : null}
        {o.issue?.resolvedAt ? <Row k="Problem" v={o.issue.text + " Sorted: " + o.issue.resolution} /> : null}
        {o.cancelReason ? <Row k="Closed because" v={o.cancelReason} /> : null}
      </dl>

      {docs.length ? (
        <div className="dl-docs" role="group" aria-label="Print this order’s papers">
          <span className="small muted">Print:</span>
          {docs.map((k) => (
            <button key={k} className="btn btn-outline btn-sm" type="button" onClick={() => onPrint(k)}>
              {DOC_TITLE[k]}
            </button>
          ))}
        </div>
      ) : null}

      {!mayAct ? <p className="muted small">Only someone with access to Couva deliveries can move this order on.</p> : null}
      {mayAct && (o.status === "new" || (o.status === "quoted" && expired(o, today))) ? <QuoteForm o={o} today={today} /> : null}
      {mayAct && o.status === "quoted" && !expired(o, today) ? <PoStep o={o} /> : null}
      {mayAct && o.status === "accepted" ? <PickStart o={o} d={d} onPrint={() => onPrint("pick")} /> : null}
      {mayAct && (o.status === "picking" || o.status === "checking") ? <Ticks o={o} d={d} onPrint={() => onPrint("note")} /> : null}
      {mayAct && o.status === "ready" ? <DoneStep o={o} d={d} /> : null}
      {o.status !== "new" ? <LinesTable o={o} /> : null}
      {mayAct && (o.status === "new" || o.status === "quoted" || o.status === "accepted") ? <CloseStep o={o} /> : null}
      <Thread o={o} who={who} mayAct={mayAct} />
    </div>
  );
}

/** The order as quoted, or as supplied once picked: each line before VAT, its VAT, and the totals. A list rather than a
 *  table, so it fits the drawer and a phone without scrolling sideways. */
function LinesTable({ o }: { o: DeliveryOrder }) {
  const mode = invoiceMode(o);
  const t = sums(o, mode);
  return (
    <section className="dl-items" aria-label={mode === "invoice" ? "The order, as supplied" : "The order, as quoted"}>
      <h3 className="sub-h">{mode === "invoice" ? "The order, as supplied" : "The order, as quoted"}</h3>
      {groupLines(o.lines).map((g) => (
        <div key={g.type.id} className="dl-items-group">
          <h4>
            {g.type.name} <span>{plural(g.lines.length, "line")}</span>
          </h4>
          <ul>
            {g.lines.map((l) => {
              const q = mode === "invoice" ? suppliedOf(l) : l.qty;
              return (
                <li key={l.id} className={l.price === null ? "is-off" : undefined}>
                  <LineThumb line={l} />
                  <div>
                    <strong>{lineText(l, q)}</strong>
                    {l.price != null ? <span className="meta">{money(l.price) + " each excl. VAT · " + VAT[l.vat || "S"].label}</span> : <span className="meta">{"Not available" + (l.swap ? ". Offered: " + l.swap : "")}</span>}
                    {l.price != null && q < l.qty ? <span className="meta dl-short">{"Short: " + q + " of " + l.qty + " supplied"}</span> : null}
                  </div>
                  <span className="dl-amt">{l.price != null ? money(l.price * q) : "–"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <dl className="dl-totals">
        <div>
          <dt>Goods, excl. VAT</dt>
          <dd>{money(t.goods)}</dd>
        </div>
        <div>
          <dt>{o.fulfil === "delivery" ? "Delivery, excl. VAT" : "Collection"}</dt>
          <dd>{money(t.fee)}</dd>
        </div>
        <div>
          <dt>VAT</dt>
          <dd>{money(t.vat)}</dd>
        </div>
        <div className="dl-grand">
          <dt>Total</dt>
          <dd>{money(t.total)}</dd>
        </div>
      </dl>
    </section>
  );
}

function addDays(day: string, n: number) {
  const t = new Date(day + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Step 1: price every line (or mark it as one we cannot supply), set its VAT, the fee and the terms, and send. */
function QuoteForm({ o, today }: { o: DeliveryOrder; today: string }) {
  const s = useSession();
  const zoneFee = o.fulfil === "delivery" ? (ZONES.find((z) => z.id === o.zone)?.fee ?? null) : 0;
  const [have, setHave] = useState<Record<string, boolean>>(() => Object.fromEntries(o.lines.map((l) => [l.id, l.price !== null])));
  const [price, setPrice] = useState<Record<string, string>>(() => Object.fromEntries(o.lines.map((l) => [l.id, l.price != null ? String(l.price) : ""])));
  const [vat, setVat] = useState<Record<string, VatCode>>(() => Object.fromEntries(o.lines.map((l) => [l.id, l.vat || "S"])));
  const [swap, setSwap] = useState<Record<string, string>>(() => Object.fromEntries(o.lines.map((l) => [l.id, l.swap || ""])));
  const [incl, setIncl] = useState(o.status === "new");
  const [fee, setFee] = useState(o.quote ? String(o.quote.fee) : zoneFee != null ? String(zoneFee) : "");
  const [feeVat, setFeeVat] = useState<VatCode>(o.quote?.feeVat || "S");
  const [payDays, setPayDays] = useState(o.quote?.payDays ?? (o.payment === "card" ? 0 : 30));
  const [valid, setValid] = useState("");
  const [note, setNote] = useState(o.quote?.note || "");
  const validUntil = valid || (today ? addDays(today, QUOTE_DAYS) : "");
  const num = (v: string) => Number(v.replace(/[$,\s]/g, ""));
  /** What is typed, before VAT: a shelf price includes the line's VAT, so take it off. */
  const ex = (id: string) => {
    const n = num(price[id] || "");
    return incl ? Math.round((n / (1 + VAT[vat[id]].rate)) * 100) / 100 : n;
  };
  const preview = { lines: o.lines.map((l) => ({ ...l, price: have[l.id] && num(price[l.id] || "") > 0 ? ex(l.id) : null, vat: vat[l.id] })), quote: { at: "", by: "", fee: o.fulfil === "delivery" ? num(fee || "0") || 0 : 0, feeVat, validUntil, payDays } };
  const t = sums(preview);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const prices: Record<string, number | null> = {};
    for (const l of o.lines) {
      if (!have[l.id]) prices[l.id] = null;
      else if (!(num(price[l.id] || "") > 0)) {
        document.getElementById("qp-" + l.id)?.focus();
        return act(s, "deliveries.quote", o.ref, () => {
          throw new Error("Enter the price for " + l.item.toLowerCase() + ", or untick “We have it”.");
        });
      } else prices[l.id] = ex(l.id);
    }
    if (o.fulfil === "delivery" && (fee.trim() === "" || !(num(fee) >= 0))) {
      document.getElementById("qp-fee")?.focus();
      return act(s, "deliveries.quote", o.ref, () => {
        throw new Error("Enter the delivery fee for this address.");
      });
    }
    act(s, "deliveries.quote", o.ref, () => sendQuote(s, o.id, { prices, vat, swaps: swap, fee: o.fulfil === "delivery" ? num(fee) : 0, feeVat, validUntil, payDays, note }), o.email ? "Quotation sent. It is in the demo outbox." : "Quotation saved. There is no e-mail address, so send it by WhatsApp.");
  }

  return (
    <form className="decide-form dl-quote" onSubmit={send}>
      <h3>{o.status === "quoted" ? "Re-quote: the last one expired" : "Write the quotation"}</h3>
      <p className="muted small">
        Price each line, choose its VAT as the till has it, and untick what Couva does not have{o.swaps ? " (say what you can offer instead)" : ": they asked for no swaps"}.
      </p>
      <label className="dl-have">
        <input type="checkbox" checked={incl} onChange={(e) => setIncl(e.target.checked)} /> The prices I type include VAT (shelf prices)
      </label>
      <ol className="dl-qlines">
        {o.lines.map((l) => (
          <li key={l.id} className={have[l.id] ? undefined : "is-off"}>
            <div className="dl-qhead">
              <LineThumb line={l} />
              <p className="dl-qtext">{lineText(l)}</p>
            </div>
            <label className="dl-have">
              <input type="checkbox" checked={!!have[l.id]} onChange={(e) => setHave((p) => ({ ...p, [l.id]: e.target.checked }))} /> We have it
            </label>
            {have[l.id] ? (
              <div className="dl-qrow">
                <div className="field dl-price">
                  <label htmlFor={"qp-" + l.id}>{incl ? "Price each, incl. VAT" : "Price each, excl. VAT"}</label>
                  <input id={"qp-" + l.id} type="text" inputMode="decimal" value={price[l.id] || ""} onChange={(e) => setPrice((p) => ({ ...p, [l.id]: e.target.value }))} />
                </div>
                <div className="field dl-vat">
                  <label htmlFor={"qv-" + l.id}>VAT</label>
                  <select id={"qv-" + l.id} value={vat[l.id]} onChange={(e) => setVat((p) => ({ ...p, [l.id]: e.target.value as VatCode }))}>
                    {(Object.keys(VAT) as VatCode[]).map((c) => (
                      <option key={c} value={c}>
                        {VAT[c].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : o.swaps ? (
              <div className="field dl-price">
                <label htmlFor={"qs-" + l.id}>Offer instead</label>
                <input id={"qs-" + l.id} type="text" value={swap[l.id] || ""} onChange={(e) => setSwap((p) => ({ ...p, [l.id]: e.target.value }))} placeholder="Item, size and price" />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <div className="form-row">
        {o.fulfil === "delivery" ? (
          <div className="field">
            <label htmlFor="qp-fee">Delivery fee, excl. VAT</label>
            <input id="qp-fee" type="text" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} aria-describedby="qp-fee-h" />
            <p className="hint" id="qp-fee-h">
              {zoneFee != null ? zoneLabel(o.zone) + ": " + money(zoneFee) + " (demo rate)." : "No set rate for this area: price it by distance."}
            </p>
          </div>
        ) : null}
        {o.fulfil === "delivery" ? (
          <div className="field">
            <label htmlFor="qp-feevat">VAT on delivery</label>
            <select id="qp-feevat" value={feeVat} onChange={(e) => setFeeVat(e.target.value as VatCode)} aria-describedby="qp-feevat-h">
              {(Object.keys(VAT) as VatCode[]).map((c) => (
                <option key={c} value={c}>
                  {VAT[c].label}
                </option>
              ))}
            </select>
            <p className="hint" id="qp-feevat-h">
              Check with accounts if unsure.
            </p>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="qp-valid">Prices hold until</label>
          <input id="qp-valid" type="date" value={validUntil} min={today || undefined} onChange={(e) => setValid(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="qp-pay">Payment</label>
          <select id="qp-pay" value={payDays} onChange={(e) => setPayDays(Number(e.target.value))} aria-describedby="qp-pay-h">
            {PAY_DAYS.map((n) => (
              <option key={n} value={n}>
                {n ? n + " days from the invoice" : "On delivery or collection"}
              </option>
            ))}
          </select>
          <p className="hint" id="qp-pay-h">
            They asked to pay {o.payment === "card" ? "by card when it arrives" : "on invoice"}.
          </p>
        </div>
      </div>
      <div className="field">
        <label htmlFor="qp-note">Note on the quotation</label>
        <textarea id="qp-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example, delivery Thursday morning" />
      </div>
      <p className="dl-sum">
        Goods {money(t.goods)} + {o.fulfil === "delivery" ? "delivery " + money(t.fee) : "collection free"} + VAT {money(t.vat)} = <strong>{money(t.total)}</strong>
      </p>
      <button className="btn btn-primary btn-sm" type="submit">
        Send the quotation
      </button>
    </form>
  );
}

/** Step 2: their purchase order, when it comes by e-mail or by hand rather than through the website. */
function PoStep({ o }: { o: DeliveryOrder }) {
  const s = useSession();
  const [number, setNumber] = useState("");
  const [via, setVia] = useState("E-mail");
  const [file, setFile] = useState<FileMeta | undefined>();
  return (
    <form
      className="decide-form"
      onSubmit={(e) => {
        e.preventDefault();
        act(s, "deliveries.po", o.ref, () => recordPo(s, o.id, number, via, file), "Purchase order recorded. Next: the pick list.");
      }}
    >
      <h3>Their purchase order</h3>
      <p className="muted small">They can accept online under Your order with {o.ref}. If the PO came by e-mail or by hand, record it here.</p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="po-n">PO number</label>
          <input id="po-n" type="text" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="po-via">Came by</label>
          <select id="po-via" value={via} onChange={(e) => setVia(e.target.value)}>
            {["E-mail", "WhatsApp", "By hand"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="po-f">The purchase order</label>
        <input id="po-f" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={(e) => setFile(fileMeta(e.target.files?.[0]))} />
      </div>
      <button className="btn btn-primary btn-sm" type="submit">
        Record the purchase order
      </button>
    </form>
  );
}

/** Step 3: print the pick list and hand it to someone who did not write the quote. */
function PickStart({ o, d, onPrint }: { o: DeliveryOrder; d: Seed; onPrint: () => void }) {
  const s = useSession();
  const people = (d.employees || []).filter((e) => e.branchId === o.branchId && e.status !== "left");
  const [picker, setPicker] = useState("");
  return (
    <form
      className="decide-form"
      onSubmit={(e) => {
        e.preventDefault();
        act(s, "deliveries.pick", o.ref, () => startPicking(s, o.id, picker), "Picking started.");
      }}
    >
      <h3>Pick it</h3>
      <p className="muted small">Print the pick list and give it to the picker. The person who wrote the quote does not pick.</p>
      <div className="field">
        <label htmlFor="pk-who">Picker</label>
        <select id="pk-who" value={picker} onChange={(e) => setPicker(e.target.value)}>
          <option value="">Choose a person at Couva</option>
          {people.map((e) => (
            <option key={e.id} value={e.id} disabled={e.id === o.quote?.by}>
              {e.name + ", " + e.role + (e.id === o.quote?.by ? " (wrote the quote)" : "")}
            </option>
          ))}
        </select>
      </div>
      <div className="cluster">
        <button className="btn btn-outline btn-sm" type="button" onClick={onPrint}>
          Print the pick list
        </button>
        <button className="btn btn-primary btn-sm" type="submit">
          Start picking
        </button>
      </div>
    </form>
  );
}

/** Steps 4 and 5: count each line at the shelf (noting anything short), then a second person ticks it again against
 *  the purchase order, best-before dates included. */
function Ticks({ o, d, onPrint }: { o: DeliveryOrder; d: Seed; onPrint: () => void }) {
  const s = useSession();
  const field = o.status === "picking" ? "picked" : "checked";
  // By type of good, the way the pick list is printed, so the picker walks the store once.
  const lines = groupLines(toPack(o)).flatMap((g) => g.lines);
  const left = lines.filter((l) => !l[field]).length;
  const [found, setFound] = useState<Record<string, string>>(() => Object.fromEntries(lines.map((l) => [l.id, String(suppliedOf(l))])));
  const [handover, setHandover] = useState(o.fulfil === "delivery" ? "Panel van" : "");
  const isPicker = !!s?.userId && s.userId === o.pickedBy;
  const tick = (id: string, on: boolean, n?: string) => act(s, "deliveries.tick", o.ref, () => tickLine(s, o.id, id, field, on, field === "picked" ? Number(n ?? found[id]) : undefined));
  return (
    <div className="decide-form">
      <h3>{field === "picked" ? "Picking: count each line into the crate" : "Check against PO " + (o.po?.number || "")}</h3>
      <p className="muted small">
        {field === "picked"
          ? "Ticking for " + personName(d, o.pickedBy) + ". Size and brand as on the line. If there are fewer on the shelf, change Found: the customer is told and only charged for what goes."
          : isPicker
            ? "You picked this order, so someone else must check it."
            : "Count each line against the purchase order: item, size, brand, quantity and best-before date. Picked by " + personName(d, o.pickedBy) + "."}
      </p>
      <ul className="dl-ticks">
        {lines.map((l) => (
          <li key={l.id}>
            <label>
              <input type="checkbox" checked={!!l[field]} disabled={field === "checked" && isPicker} onChange={(e) => tick(l.id, e.target.checked)} />
              <LineThumb line={l} />
              <span>
                {lineText(l)}
                {field === "checked" && suppliedOf(l) < l.qty ? <strong className="dl-short"> Short: {suppliedOf(l)} going</strong> : null}
              </span>
            </label>
            {field === "picked" ? (
              <span className="dl-found">
                <label htmlFor={"fd-" + l.id}>Found</label>
                <input
                  id={"fd-" + l.id}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={l.qty}
                  value={found[l.id] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFound((p) => ({ ...p, [l.id]: v }));
                    if (l.picked && v !== "") tick(l.id, true, v);
                  }}
                />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {field === "checked" && o.fulfil === "delivery" ? (
        <div className="field">
          <label htmlFor="ck-out">Going out with</label>
          <input id="ck-out" type="text" value={handover} onChange={(e) => setHandover(e.target.value)} aria-describedby="ck-out-h" />
          <p className="hint" id="ck-out-h">
            The van, and two people for heavy cases. Card machine on board for card customers: no cash on delivery.
          </p>
        </div>
      ) : null}
      <p className="small">{left ? plural(left, "line") + " to tick" : "Every line ticked."}</p>
      <div className="cluster">
        {field === "checked" ? (
          <button className="btn btn-outline btn-sm" type="button" onClick={onPrint}>
            Print the delivery note
          </button>
        ) : null}
        <button
          className="btn btn-primary btn-sm"
          type="button"
          disabled={field === "checked" && isPicker}
          onClick={() =>
            field === "picked"
              ? act(s, "deliveries.picked", o.ref, () => finishPicking(s, o.id), "Picked. Now someone else checks it.")
              : act(s, "deliveries.checked", o.ref, () => finishCheck(s, o.id, handover), o.fulfil === "delivery" ? "Checked and out for delivery." : "Checked. Ready to collect.")
          }
        >
          {field === "picked" ? "Finished picking" : o.fulfil === "delivery" ? "Checked: send it out" : "Checked: ready to collect"}
        </button>
      </div>
    </div>
  );
}

/** Step 6: signed for (proof of delivery) and the tax invoice. */
function DoneStep({ o, d }: { o: DeliveryOrder; d: Seed }) {
  const s = useSession();
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [inv, setInv] = useState(() => nextInvoiceNo(d));
  const [card, setCard] = useState(o.payment === "card");
  const t = sums(o, "invoice");
  return (
    <form
      className="decide-form"
      onSubmit={(e) => {
        e.preventDefault();
        act(s, "deliveries.done", o.ref, () => markDelivered(s, o.id, { receivedBy, notes, invoiceNo: inv, paidByCard: card }), "Signed for and invoiced. The tax invoice is in the demo outbox.");
      }}
    >
      <h3>{o.fulfil === "delivery" ? "Delivered?" : "Collected?"}</h3>
      <p className="muted small">From the signed delivery note. The tax invoice charges what was supplied: {money(t.total)} including VAT.</p>
      <div className="form-row">
        <div className="field">
          <label htmlFor="dn-who">Signed for by</label>
          <input id="dn-who" type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Name on the delivery note" />
        </div>
        <div className="field">
          <label htmlFor="dn-inv">Tax invoice number</label>
          <input id="dn-inv" type="text" value={inv} onChange={(e) => setInv(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="dn-notes">Written on the delivery note</label>
        <textarea id="dn-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any shortage or damage they noted, or leave empty" />
      </div>
      <label className="dl-have">
        <input type="checkbox" checked={card} onChange={(e) => setCard(e.target.checked)} /> Paid by card at the hand-over
      </label>
      <button className="btn btn-primary btn-sm" type="submit">
        {o.fulfil === "delivery" ? "Delivered and invoiced" : "Collected and invoiced"}
      </button>
    </form>
  );
}

/** A problem the customer reported after delivery: say how it was put right. */
function IssueStep({ o }: { o: DeliveryOrder }) {
  const s = useSession();
  const [text, setText] = useState("");
  return (
    <form
      className="decide-form dl-issue"
      onSubmit={(e) => {
        e.preventDefault();
        act(s, "deliveries.issue", o.ref, () => resolveIssue(s, o.id, text), "Marked sorted. They have been told.");
      }}
    >
      <h3>Problem reported {whenTT(o.issue?.at)}</h3>
      <p>{o.issue?.text}</p>
      <div className="field">
        <label htmlFor="is-fix">How it was put right</label>
        <textarea id="is-fix" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="For example, replacement delivered 18 Nov, or credit note CV-CN-0001" />
      </div>
      <button className="btn btn-primary btn-sm" type="submit">
        Mark sorted
      </button>
    </form>
  );
}

function CloseStep({ o }: { o: DeliveryOrder }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open)
    return (
      <p>
        <button className="link-btn small" type="button" onClick={() => setOpen(true)}>
          Close without an order
        </button>
      </p>
    );
  return (
    <form
      className="decide-form"
      onSubmit={(e) => {
        e.preventDefault();
        act(s, "deliveries.cancel", o.ref, () => cancelDelivery(s, o.id, reason), "Closed.");
      }}
    >
      <h3>Close without an order</h3>
      <div className="field">
        <label htmlFor="cl-why">Why</label>
        <textarea id="cl-why" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, they bought elsewhere; nothing on the list in stock" />
      </div>
      <div className="cluster">
        <button className="btn btn-danger btn-sm" type="submit">
          Close it
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>
          Keep it open
        </button>
      </div>
    </form>
  );
}

function Thread({ o, who, mayAct }: { o: DeliveryOrder; who: (by: string) => string; mayAct: boolean }) {
  const s = useSession();
  const [msgKind, setMsgKind] = useState<"internal" | "outbound" | "inbound">("internal");
  const [msg, setMsg] = useState("");
  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    const done = msgKind === "outbound" ? (o.email ? "Reply sent. It is in the demo outbox." : "Reply kept on the order. There is no e-mail address, so call them.") : msgKind === "inbound" ? "Their reply is on the order." : "Note added.";
    if (act(s, "deliveries.message", o.ref, () => addDeliveryMessage(s, o.id, msgKind, msg.trim()), done)) setMsg("");
  }
  return (
    <>
      <h3 className="sub-h">Notes and replies</h3>
      {o.messages.length ? (
        <ol className="thread">
          {o.messages.map((m, i) => (
            <li key={m.at + i} className={"thread-" + m.kind}>
              <p className="thread-head">
                <strong>{who(m.by)}</strong>
                <span>{m.kind === "internal" ? "Note for staff" : m.kind === "outbound" ? "To the customer" : "From the customer"}</span>
                <time dateTime={m.at}>{whenTT(m.at)}</time>
              </p>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">Nothing yet. Notes between staff and messages with the customer are kept here, in order.</p>
      )}
      {mayAct ? (
        <form className="thread-form" onSubmit={send}>
          <fieldset>
            <legend className="visually-hidden">What you are adding</legend>
            <div className="seg">
              {(["internal", "outbound", "inbound"] as const).map((k) => (
                <button key={k} type="button" className="btn btn-ghost btn-sm" aria-pressed={msgKind === k} onClick={() => setMsgKind(k)}>
                  {k === "internal" ? "Note for staff" : k === "outbound" ? "Message them" : "Record their reply"}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="visually-hidden" htmlFor="dv-msg">
            Message
          </label>
          <textarea id="dv-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={msgKind === "internal" ? "Only staff see this." : msgKind === "outbound" ? "This goes to " + (o.email || "the customer") + "." : "What they said, and how (phone, WhatsApp)."} />
          <button className="btn btn-outline btn-sm" type="submit" disabled={!msg.trim()}>
            {msgKind === "internal" ? "Add note" : msgKind === "outbound" ? "Send message" : "Add their reply"}
          </button>
        </form>
      ) : null}
    </>
  );
}

type LogFields = Omit<DeliveryForm, "lines" | "list" | "billing"> & { via: DeliveryOrder["via"]; billAddress: string };
const EMPTY_LOG: LogFields = { company: "", contact: "", phone: "", email: "", fulfil: "delivery", zone: "lisas", address: "", swaps: true, notes: "", via: "WhatsApp", payment: "account", billAddress: "" };

/** A list that came by WhatsApp, e-mail, phone or at the desk, typed in so it joins the same board. */
function LogForm({ onDone }: { onDone: (id: string) => void }) {
  const s = useSession();
  const [v, setV] = useState<LogFields>(EMPTY_LOG);
  const [lines, setLines] = useState<LineDraft[]>(() => [blankLine({ key: "first" })]);
  const [error, setError] = useState("");
  const set = <K extends keyof LogFields>(k: K, val: LogFields[K]) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const read = readLines(lines);
    const er = !v.company.trim() ? "Enter the company." : !v.contact.trim() ? "Enter who sent it." : !v.phone.trim() && !v.email.trim() ? "Enter a phone number or an e-mail address." : read.error || (!read.lines.length ? "Type at least one line from their list." : "");
    setError(er);
    if (er) return;
    const { billAddress, ...rest } = v;
    const bill = billAddress.trim() || (v.fulfil === "delivery" ? (v.address || "").trim() : "");
    let id = "";
    if (
      act(
        s, "deliveries.log", v.company,
        () => (id = logDelivery(s, { ...rest, company: v.company.trim(), contact: v.contact.trim(), phone: v.phone.trim(), email: v.email.trim(), zone: v.fulfil === "delivery" ? v.zone : undefined, address: v.fulfil === "delivery" ? (v.address || "").trim() : undefined, billing: bill ? { name: v.company.trim(), address: bill, email: v.email.trim() } : undefined, notes: (v.notes || "").trim() || undefined, lines: read.lines })),
        "Order logged. Quote it within 24 hours.",
      )
    )
      onDone(id);
  }

  return (
    <form className="dl-log" onSubmit={submit} noValidate>
      <div className="form-row">
        <div className="field">
          <label htmlFor="lg-company">Company</label>
          <input id="lg-company" type="text" value={v.company} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lg-via">Came by</label>
          <select id="lg-via" value={v.via} onChange={(e) => set("via", e.target.value as DeliveryOrder["via"])}>
            {VIAS.filter((x) => x !== "Website").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="lg-contact">Who sent it</label>
        <input id="lg-contact" type="text" value={v.contact} onChange={(e) => set("contact", e.target.value)} />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="lg-phone">Phone</label>
          <input id="lg-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lg-email">E-mail</label>
          <input id="lg-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="lg-fulfil">Hand-over</label>
          <select id="lg-fulfil" value={v.fulfil} onChange={(e) => set("fulfil", e.target.value as LogFields["fulfil"])}>
            <option value="delivery">Deliver to them</option>
            <option value="collect">They collect at Couva</option>
          </select>
        </div>
        {v.fulfil === "delivery" ? (
          <div className="field">
            <label htmlFor="lg-zone">Area</label>
            <select id="lg-zone" value={v.zone} onChange={(e) => set("zone", e.target.value)}>
              {ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {v.fulfil === "delivery" ? (
        <div className="field">
          <label htmlFor="lg-address">Delivery address</label>
          <input id="lg-address" type="text" value={v.address || ""} onChange={(e) => set("address", e.target.value)} />
        </div>
      ) : null}
      <div className="form-row">
        <div className="field">
          <label htmlFor="lg-pay">They pay</label>
          <select id="lg-pay" value={v.payment} onChange={(e) => set("payment", e.target.value as LogFields["payment"])}>
            <option value="account">On invoice</option>
            <option value="card">By card when it arrives</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="lg-bill">Billing address</label>
          <input id="lg-bill" type="text" value={v.billAddress} onChange={(e) => set("billAddress", e.target.value)} placeholder={v.fulfil === "delivery" ? "Same as delivery" : "For the tax invoice"} />
        </div>
      </div>
      <LineEditor lines={lines} setLines={setLines} idPrefix="lg" />
      <label className="dl-have">
        <input type="checkbox" checked={v.swaps} onChange={(e) => set("swaps", e.target.checked)} /> They allow swaps for a similar item
      </label>
      <div className="field">
        <label htmlFor="lg-notes">Notes</label>
        <textarea id="lg-notes" rows={2} value={v.notes || ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn-primary btn-sm" type="submit">
        Log the order
      </button>
    </form>
  );
}
