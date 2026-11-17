"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToday } from "@/components/use-today";
import { dayTT } from "@/lib/admin/tt";
import { fmtDate, money } from "@/lib/format";
import { CLAIM_HOURS, SUPPLIER, VAT, lineText, payText, shortOf, suppliedOf, sums, toPack, unitLabel, zoneLabel } from "@/lib/ops/deliveries";
import { useData } from "@/lib/store";
import type { DeliveryOrder } from "@/lib/types";

/* The four papers of a delivery order, laid out as business documents: the quotation, the pick list, the delivery note
   the customer signs, and the tax invoice. The tax invoice carries what the IRD lists for one (ird.gov.tt/VAT): the
   words "Tax Invoice", a serial number and date, the supplier's name, address and VAT registration number, the
   recipient's name and address, a description of the goods, the VAT-exclusive figure, the VAT and the total. The
   same component shows them on screen (the customer's order page) and prints them (usePrintDoc). */

export type DocKind = "quote" | "pick" | "note" | "invoice";
export const DOC_TITLE: Record<DocKind, string> = { quote: "Quotation", pick: "Pick list", note: "Delivery note", invoice: "Tax Invoice" };

/** Which papers an order has at its step. */
export function docsFor(o: DeliveryOrder): DocKind[] {
  const out: DocKind[] = [];
  if (o.quote) out.push("quote");
  if (o.po && o.status !== "cancelled") out.push("pick");
  if (["checking", "ready", "done"].includes(o.status)) out.push("note");
  if (o.status === "done" && o.invoice) out.push("invoice");
  return out;
}

const day = (iso: string | undefined) => (iso ? dayTT(iso.length === 10 ? iso + "T12:00:00-04:00" : iso) : "");

export function DeliveryDoc({ o, kind }: { o: DeliveryOrder; kind: DocKind }) {
  const d = useData();
  const todayIso = useToday();
  const store = (d.branches || []).find((b) => b.id === o.branchId);
  const mode = kind === "invoice" || kind === "note" ? "invoice" : "quote";
  const t = sums(o, mode);
  const lines = kind === "quote" ? o.lines : toPack(o);
  const bill = o.billing || { name: o.company, address: o.address || "", email: o.email };
  const meta: [string, string][] =
    kind === "quote"
      ? [["Quotation no.", o.ref], ["Date", day(o.quote?.at)], ["Valid until", day(o.quote?.validUntil)], ["Payment", payText(o.quote?.payDays || 0)]]
      : kind === "invoice"
        ? [["Invoice no.", o.invoice?.no || ""], ["Date", day(o.invoice?.at)], ["Your PO", o.po?.number || ""], ["Our order", o.ref], [o.pod?.paidByCard ? "Paid" : "Payment due", o.pod?.paidByCard ? "By card, " + day(o.pod.at) : day(o.invoice?.due)]]
        : [["Order", o.ref], ["Your PO", o.po?.number || ""], ["Date", day(kind === "note" ? o.readyAt || o.checkedAt || todayIso : o.po?.at)], ["Hand-over", o.fulfil === "delivery" ? "Delivery" : "Collect at Couva"]];

  return (
    <article className={"dl-doc dl-doc-" + kind} aria-label={DOC_TITLE[kind] + " " + o.ref}>
      <header className="dl-doc-head">
        <div>
          <p className="dl-doc-from">{SUPPLIER.name}</p>
          <p>
            {SUPPLIER.store} store, {SUPPLIER.address}
            {store?.phone ? " · " + store.phone : ""}
          </p>
          <p>VAT registration no.: {SUPPLIER.vatNo || "to be added by accounts"}</p>
        </div>
        <h2>{DOC_TITLE[kind]}</h2>
      </header>

      <dl className="dl-doc-meta">
        {meta.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v || "–"}</dd>
          </div>
        ))}
      </dl>

      <div className="dl-doc-parties">
        <div>
          <h3>{kind === "quote" ? "For" : "Bill to"}</h3>
          <p>
            <strong>{bill.name}</strong>
            <br />
            {bill.address}
            <br />
            {o.contact}
          </p>
        </div>
        <div>
          <h3>{o.fulfil === "delivery" ? "Deliver to" : "Collect from"}</h3>
          <p>
            {o.fulfil === "delivery" ? (o.address || "") + " (" + zoneLabel(o.zone) + ")" : SUPPLIER.store + " store, " + SUPPLIER.address}
            {o.site && kind !== "invoice" ? (
              <>
                <br />
                <span className="dl-doc-small">Site: {o.site}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <table className="dl-doc-lines">
        <thead>
          {kind === "pick" ? (
            <tr>
              <th>Qty</th>
              <th>Item, brand, size</th>
              <th>Found</th>
              <th>Picked</th>
              <th>Checked</th>
            </tr>
          ) : kind === "note" ? (
            <tr>
              <th>Item, brand, size</th>
              <th className="num">Ordered</th>
              <th className="num">Supplied</th>
              <th>Received</th>
            </tr>
          ) : (
            <tr>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Unit price excl. VAT</th>
              <th className="num">VAT</th>
              <th className="num">Amount excl. VAT</th>
            </tr>
          )}
        </thead>
        <tbody>
          {lines.map((l) => {
            const q = mode === "invoice" ? suppliedOf(l) : l.qty;
            const u = unitLabel(l.unit, l.qty);
            const what = l.item + (l.brand ? ", " + l.brand : "") + ", " + l.size;
            if (kind === "pick")
              return (
                <tr key={l.id}>
                  <td>{l.qty + (u ? " " + u : "")}</td>
                  <td>{what}</td>
                  <td>____</td>
                  <td>☐</td>
                  <td>☐</td>
                </tr>
              );
            if (kind === "note")
              return (
                <tr key={l.id}>
                  <td>{what}</td>
                  <td className="num">{l.qty + (u ? " " + u : "")}</td>
                  <td className="num">{suppliedOf(l) + (suppliedOf(l) < l.qty ? " (short)" : "")}</td>
                  <td>☐</td>
                </tr>
              );
            if (l.price == null)
              return (
                <tr key={l.id} className="is-off">
                  <td colSpan={5}>
                    Not available: {lineText(l)}
                    {l.swap ? ". We can offer " + l.swap + "." : "."}
                  </td>
                </tr>
              );
            return (
              <tr key={l.id}>
                <td>
                  {what}
                  {kind === "invoice" && q < l.qty ? <span className="dl-doc-small"> ({l.qty} ordered, {q} supplied)</span> : null}
                </td>
                <td className="num">{q + (unitLabel(l.unit, q) ? " " + unitLabel(l.unit, q) : "")}</td>
                <td className="num">{money(l.price)}</td>
                <td className="num">{VAT[l.vat || "S"].short}</td>
                <td className="num">{money(l.price * q)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {kind === "quote" || kind === "invoice" ? (
        <dl className="dl-doc-sums">
          <div>
            <dt>Goods, excl. VAT</dt>
            <dd>{money(t.goods)}</dd>
          </div>
          <div>
            <dt>{o.fulfil === "delivery" ? "Delivery, excl. VAT (" + VAT[o.quote?.feeVat || "S"].short + ")" : "Collection"}</dt>
            <dd>{money(t.fee)}</dd>
          </div>
          <div>
            <dt>VAT</dt>
            <dd>{money(t.vat)}</dd>
          </div>
          <div className="dl-doc-total">
            <dt>Total {kind === "invoice" ? "due" : ""}</dt>
            <dd>{money(t.total)}</dd>
          </div>
        </dl>
      ) : null}

      {kind === "quote" ? (
        <p className="dl-doc-small">
          Prices hold until {day(o.quote?.validUntil)}. To accept, send your purchase order quoting {o.ref}. Nothing is packed before it arrives. {o.quote?.note || ""}
        </p>
      ) : null}
      {kind === "note" ? (
        <div className="dl-doc-sign">
          <p>Check the goods against this note. Write any shortage or damage below before you sign. Anything found later: report it within {CLAIM_HOURS} hours on our Deliveries page.</p>
          <p>Shortage or damage: ______________________________________________</p>
          <p>Received by (name): ______________________ Signature: ______________ Date and time: ____________</p>
          <p>{o.fulfil === "delivery" ? "Driver" : "Handed over by"}: ______________________</p>
          {shortOf(o).length ? <p className="dl-doc-small">Short on this order and not charged: {shortOf(o).map((l) => l.item + " (" + (l.qty - suppliedOf(l)) + ")").join(", ")}.</p> : null}
        </div>
      ) : null}
      {kind === "pick" ? <p className="dl-doc-small">Write how many you found. The person who checks this list must not be the person who picked it. Check best-before dates.</p> : null}
      {kind === "invoice" ? (
        <p className="dl-doc-small">
          Charged for what was delivered{o.pod ? ", signed for by " + o.pod.receivedBy + " on " + day(o.pod.at) : ""}. Quote {o.invoice?.no} with your payment. Problems with the goods: report within {CLAIM_HOURS} hours of delivery.
        </p>
      ) : null}
      <p className="dl-doc-demo">Prototype document from a demo order{o.quote?.at ? ", " + fmtDate(o.quote.at) : ""}.</p>
    </article>
  );
}

/** Prints one document: it is rendered straight under <body> for the moment of printing, and the print rules
 *  (styles/ops.css) show it alone. */
export function usePrintDoc() {
  const [job, setJob] = useState<{ o: DeliveryOrder; kind: DocKind } | null>(null);
  useEffect(() => {
    if (!job) return;
    const t = setTimeout(() => {
      window.print();
      setJob(null);
    }, 60);
    return () => clearTimeout(t);
  }, [job]);
  const node = job && typeof document !== "undefined" ? createPortal(<div className="dl-print">{<DeliveryDoc o={job.o} kind={job.kind} />}</div>, document.body) : null;
  return { node, print: (o: DeliveryOrder, kind: DocKind) => setJob({ o, kind }) };
}
