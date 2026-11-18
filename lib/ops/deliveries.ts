import { assertCan } from "@/lib/access";
import { money } from "@/lib/format";
import { mail } from "@/lib/newsletter";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { DeliveryLine, DeliveryOrder, DeliveryStatus, DeliveryUnit, FileMeta, Seed, Session, Tone, VatCode } from "@/lib/types";
import { CATALOGUE, catalogueItem, isGoodsType } from "./delivery-catalogue";
import { CLAIM_HOURS, REPLY_HOURS, SUPPLIER, VAT, payText } from "./delivery-terms";

/* Deliveries: the business quote service agreed at the staff meeting of 17 Nov 2026, run from Couva as a trial and
   looked after by Narindra, Supervisor at Couva.

   The document chain follows ordinary business-to-business practice (researched 17 Nov 2026, see SITE.md):
   request for a quote -> quotation (VAT shown, valid to a date) -> the customer's purchase order -> pick list ->
   delivery note, signed at the door with any shortage or damage written on it -> tax invoice quoting the PO number,
   paid by card at the door or on account. Problems found after delivery are reported within 24 hours.

   The rules the meeting set, which the writes below enforce:
   - the person who wrote the quote does not pick the order ("the person signing the quotation shouldn't be the person
     picking up the goods");
   - the checker is not the picker, and every line is ticked twice before it leaves;
   - a purchase order is only taken against a quote that went out and has not expired;
   - the customer is only invoiced for what was supplied.
   Every staff write checks access (deliveries.handle, for the order's store) and is audited. In this prototype nothing
   is sent: e-mails land in the demo outbox. */

export const STAGES: { id: DeliveryStatus; label: string; tone: Tone; explain: string }[] = [
  { id: "new", label: "Waiting for a quote", tone: "info", explain: "Just in. Price every line and send the quote within one working day." },
  { id: "quoted", label: "Quote sent", tone: "plain", explain: "Waiting for them to accept it with their purchase order." },
  { id: "accepted", label: "PO received", tone: "warn", explain: "They accepted. Print the pick list and hand it to the picker." },
  { id: "picking", label: "Being picked", tone: "warn", explain: "At the shelves. Count each line into the crate; note anything short." },
  { id: "checking", label: "To check", tone: "warn", explain: "A second person checks every line against the purchase order, best-before dates included." },
  { id: "ready", label: "Out or ready", tone: "ok", explain: "Out for delivery with the delivery note, or packed and waiting to be collected." },
  { id: "done", label: "Delivered and invoiced", tone: "plain", explain: "Signed for and invoiced." },
  { id: "cancelled", label: "Closed, no order", tone: "bad", explain: "No order came of it." },
];

export const stage = (id: DeliveryStatus) => STAGES.find((x) => x.id === id) || STAGES[0];
export const isOpen = (o: DeliveryOrder) => o.status !== "done" && o.status !== "cancelled";

export { CLAIM_HOURS, PAY_DAYS, QUOTE_DAYS, REPLY_HOURS, SUPPLIER, VAT, VAT_RATE, ZONES, payText, zoneLabel } from "./delivery-terms";

export const UNITS: { id: DeliveryUnit; label: string }[] = [
  { id: "each", label: "each" },
  { id: "pack", label: "packs" },
  { id: "case", label: "cases" },
];
export const unitLabel = (u: DeliveryUnit, n: number) => (u === "each" ? "" : n === 1 ? u : u + "s");

/** The standard items, for the quick-add row staff use when they type in an order that came by WhatsApp or phone:
 *  generic names with an example size. The customer says the exact size and brand, and the quote confirms what Couva has. */
export const PANTRY: { item: string; unit: DeliveryUnit; example: string; sku: string }[] = CATALOGUE.map((c) => ({ item: c.name, unit: c.sizes[0].unit, example: c.sizes[0].size, sku: c.id }));

export const VIAS: DeliveryOrder["via"][] = ["WhatsApp", "E-mail", "Phone", "Walk-in", "Website"];

/** A line as the customer writes it: "6 × Instant coffee, Nescafé, 200 g jar". */
export function lineText(l: Pick<DeliveryLine, "item" | "brand" | "size" | "qty" | "unit">, qty = l.qty) {
  const u = unitLabel(l.unit, qty);
  return qty + (u ? " " + u : "") + " × " + l.item + (l.brand ? ", " + l.brand : "") + (l.size ? ", " + l.size : "");
}

/** How many of a line go out: all of them, unless the picker found fewer. */
export const suppliedOf = (l: DeliveryLine) => (l.supplied != null ? l.supplied : l.qty);
export const shortOf = (o: DeliveryOrder) => o.lines.filter((l) => l.price != null && l.supplied != null && l.supplied < l.qty);
const cents = (n: number) => Math.round(n * 100) / 100;

/** The money on a quote ("quote": what was asked for) or an invoice ("invoice": what was supplied): each line before
 *  VAT, the VAT on the standard-rated lines and the delivery fee, and the total. */
export function sums(o: Pick<DeliveryOrder, "lines" | "quote">, mode: "quote" | "invoice" = "quote") {
  let net = 0;
  let vat = 0;
  for (const l of o.lines) {
    if (l.price == null) continue;
    const q = mode === "invoice" ? suppliedOf(l as DeliveryLine) : l.qty;
    const line = cents(l.price * q);
    net += line;
    vat += line * VAT[l.vat || "S"].rate;
  }
  const fee = o.quote?.fee || 0;
  const feeVat = fee * VAT[o.quote?.feeVat || "S"].rate;
  const goods = cents(net);
  const tax = cents(vat + feeVat);
  return { goods, fee, vat: tax, total: cents(goods + fee + tax), missing: o.lines.filter((l) => l.price === null).length };
}

/** The promise on the public page: a quote within 24 hours of the request. */
export function quoteDueAt(o: Pick<DeliveryOrder, "receivedAt">) {
  return new Date(new Date(o.receivedAt).getTime() + REPLY_HOURS * 3600 * 1000).toISOString();
}

const today = () => nowIso().slice(0, 10);
export const expired = (o: DeliveryOrder, day: string) => o.status === "quoted" && !!o.quote && !!day && o.quote.validUntil < day;

/** Starts after the demo orders (DL-0007), so a request sent from a public page, which has no demo orders loaded,
 *  never takes a reference the staff screens already show. */
function nextRef(d: Seed) {
  const max = (d.deliveries || []).reduce((n, o) => Math.max(n, Number(String(o.ref).replace(/\D/g, "")) || 0), 7);
  return "DL-" + String(max + 1).padStart(4, "0");
}

/** The next tax invoice number in the Couva series. */
export function nextInvoiceNo(d: Seed) {
  const max = (d.deliveries || []).reduce((n, o) => Math.max(n, Number(String(o.invoice?.no || "").replace(/\D/g, "")) || 0), 0);
  return "CV-INV-" + String(max + 1).padStart(4, "0");
}

export type DeliveryForm = Pick<DeliveryOrder, "company" | "contact" | "phone" | "email" | "fulfil" | "zone" | "address" | "wantedBy" | "swaps" | "notes" | "list" | "billing" | "site" | "payment"> & {
  lines: Omit<DeliveryLine, "id">[];
};

/** Keeps only what a new line may carry. The picture code and the type must be ones the catalogue knows. */
const clean = (lines: DeliveryForm["lines"]): DeliveryLine[] =>
  lines.map((l) => ({
    id: uid("dl"), item: l.item.trim(), brand: l.brand?.trim() || undefined, size: l.size.trim(), qty: l.qty, unit: l.unit,
    ...(catalogueItem(l.sku) ? { sku: l.sku } : isGoodsType(l.cat) ? { cat: l.cat } : {}),
  }));

/** The public form on /deliveries. No sign-in: it adds the request for Couva, "sends" an acknowledgement to the demo
 *  outbox and returns the reference the customer is shown. */
export function submitDelivery(form: DeliveryForm) {
  let ref = "";
  update((d) => {
    ref = nextRef(d);
    const o: DeliveryOrder = { ...form, id: uid("dv"), ref, via: "Website", branchId: "couva", receivedAt: nowIso(), lines: clean(form.lines), status: "new", owner: "emp-narindra", messages: [] };
    d.deliveries = [o, ...(d.deliveries || [])];
    mail(d, {
      to: form.email, kind: "transactional", subject: "We have your list (" + ref + ")",
      body: [
        "Thank you, " + form.contact + ". Your list for " + form.company + " is with our Couva store.",
        "We will reply with a priced quote within one working day. Nothing is ordered until you accept the quote with your purchase order, quoting " + ref + ".",
        "Your list: " + o.lines.map((l) => lineText(l)).join("; ") + ".",
        "Follow your order at any time on our Deliveries page with " + ref + " and this e-mail address.",
      ],
    });
    audit(d, null, "deliveries.submit", ref + " " + form.company, "Quote request came in through the website");
  });
  return ref;
}

/** The customer's view: their order, found by its reference and the e-mail address it was sent from. Read only. */
export function findForCustomer(d: Seed, ref: string, email: string): DeliveryOrder | null {
  const r = ref.trim().toUpperCase().replace(/^DL-?/, "DL-");
  const e = email.trim().toLowerCase();
  return (d.deliveries || []).find((x) => x.ref.toUpperCase() === r && !!e && (x.email.toLowerCase() === e || x.billing?.email.toLowerCase() === e)) || null;
}

function customerOrder(d: Seed, ref: string, email: string) {
  const o = findForCustomer(d, ref, email);
  if (!o) throw new Error("We could not match that reference and e-mail address. Use the reference on your quote and the address it was sent to.");
  return o;
}

/** Accepting the quote: the customer sends the purchase order for it. The e-mail must be the one the quote went to, so
 *  a stranger with a reference cannot place an order. Returns an error to show, or "". */
export function submitPo(ref: string, email: string, number: string, file?: FileMeta) {
  let error = "";
  update((d) => {
    try {
      const o = customerOrder(d, ref, email);
      if (o.status === "new") throw new Error("We have not sent the quote for " + o.ref + " yet. You will have it within one working day of your request.");
      if (o.status === "cancelled") throw new Error("That quote is closed. Send us a new list and we will quote again.");
      if (o.status !== "quoted") throw new Error("We already have the purchase order for " + o.ref + ".");
      if (o.quote && o.quote.validUntil < today()) throw new Error("This quote expired on " + o.quote.validUntil + ". Reply to it or send your list again and we will re-quote.");
      if (!number.trim()) throw new Error("Enter your purchase order number.");
      o.po = { number: number.trim(), at: nowIso(), via: "Website", file };
      o.status = "accepted";
      o.messages.push({ at: nowIso(), by: "requester", kind: "inbound", text: "Accepted the quote with purchase order " + o.po.number + (file ? " (" + file.fileName + ")" : "") + "." });
      mail(d, {
        to: o.email, kind: "transactional", subject: "Order confirmed: " + o.ref + ", your PO " + o.po.number,
        body: ["Thank you. We have your purchase order " + o.po.number + " for quote " + o.ref + " (" + money(sums(o).total) + " including VAT).", o.fulfil === "delivery" ? "We will call you to agree the delivery day and time." : "We will call you when it is packed and ready to collect at Couva.", "Your tax invoice will quote " + o.po.number + "."],
      });
      audit(d, null, "deliveries.po", o.ref + " " + o.company, "Quote accepted with purchase order " + o.po.number + " through the website");
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  });
  return error;
}

/** The customer says no to the quote. Returns an error to show, or "". */
export function declineQuote(ref: string, email: string, reason: string) {
  let error = "";
  update((d) => {
    try {
      const o = customerOrder(d, ref, email);
      if (o.status !== "quoted") throw new Error("Only a quote waiting for an answer can be declined.");
      o.status = "cancelled";
      o.cancelReason = "They declined the quote" + (reason.trim() ? ": " + reason.trim() : ".");
      o.messages.push({ at: nowIso(), by: "requester", kind: "inbound", text: "Declined the quote." + (reason.trim() ? " " + reason.trim() : "") });
      audit(d, null, "deliveries.decline", o.ref + " " + o.company, "Quote declined through the website");
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  });
  return error;
}

/** A shortage, damage or wrong item found after delivery, reported by the customer within the claim window. */
export function reportIssue(ref: string, email: string, text: string) {
  let error = "";
  update((d) => {
    try {
      const o = customerOrder(d, ref, email);
      if (o.status !== "done" && o.status !== "ready") throw new Error("You can report a problem once the order has been delivered or collected.");
      if (!text.trim()) throw new Error("Say what is wrong: which item, how many, and what happened.");
      o.issue = { at: nowIso(), text: text.trim() };
      o.messages.push({ at: nowIso(), by: "requester", kind: "inbound", text: "Reported a problem: " + text.trim() });
      mail(d, { to: o.email, kind: "transactional", subject: "We have your report on " + o.ref, body: ["Thank you for telling us. The Couva store will call you within one working day to put it right: a replacement or a credit on your invoice."] });
      audit(d, null, "deliveries.issue", o.ref + " " + o.company, "Customer reported a problem after delivery");
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  });
  return error;
}

function find(d: Seed, s: Session | null, id: string) {
  const o = byId(d.deliveries, id);
  if (!o) throw new Error("That order is no longer there.");
  assertCan(d, s, "deliveries.handle", { branchId: o.branchId });
  return o;
}

const title = (o: DeliveryOrder) => o.ref + " " + o.company;
const note = (o: DeliveryOrder, s: Session | null, text: string) => o.messages.push({ at: nowIso(), by: s?.userId || "", kind: "internal", text });

/** An order that came by WhatsApp, e-mail, phone or at the desk, typed in by staff. */
export function logDelivery(s: Session | null, form: DeliveryForm & { via: DeliveryOrder["via"] }) {
  let id = "";
  update((d) => {
    assertCan(d, s, "deliveries.handle", { branchId: "couva" });
    id = uid("dv");
    const ref = nextRef(d);
    d.deliveries = [{ ...form, id, ref, branchId: "couva", receivedAt: nowIso(), lines: clean(form.lines), status: "new", owner: s?.userId || undefined, messages: [] }, ...(d.deliveries || [])];
    audit(d, s, "deliveries.log", ref + " " + form.company, "Logged a quote request that came by " + form.via.toLowerCase());
  });
  return id;
}

export type QuoteInput = { prices: Record<string, number | null>; vat: Record<string, VatCode>; swaps: Record<string, string>; fee: number; feeVat: VatCode; validUntil: string; payDays: number; note: string };

/** Prices every line before VAT (null = cannot supply), sets each line's VAT, adds the delivery fee and sends the quote. */
export function sendQuote(s: Session | null, id: string, q: QuoteInput) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "new" && o.status !== "quoted") throw new Error("This order is past the quote.");
    if (!q.validUntil || q.validUntil < today()) throw new Error("Give the quote a date its prices hold until, from today on.");
    o.lines.forEach((l) => {
      if (!(l.id in q.prices)) throw new Error("Give every line a price, or mark it as one we cannot supply.");
      l.price = q.prices[l.id];
      l.vat = l.price === null ? undefined : q.vat[l.id] || "S";
      l.swap = q.swaps[l.id]?.trim() || undefined;
    });
    if (o.lines.every((l) => l.price === null)) throw new Error("Nothing on this list can be supplied. Close it instead and tell them why.");
    o.quote = { at: nowIso(), by: s?.userId || "", fee: o.fulfil === "delivery" ? q.fee : 0, feeVat: q.feeVat, validUntil: q.validUntil, payDays: q.payDays, note: q.note.trim() || undefined };
    o.status = "quoted";
    if (!o.owner && s?.userId) o.owner = s.userId;
    const t = sums(o);
    const body = [
      "Here is your quotation " + o.ref + " from " + SUPPLIER.name + ", " + SUPPLIER.store + ". Prices are before VAT; VAT is shown line by line.",
      ...o.lines.map((l) => (l.price == null ? "Not available: " + lineText(l) + (l.swap ? ". We can offer " + l.swap + " instead." : ".") : lineText(l) + ": " + money(l.price) + " each (" + VAT[l.vat || "S"].label + "), " + money(l.price * l.qty))),
      "Goods " + money(t.goods) + (o.fulfil === "delivery" ? ", delivery " + money(t.fee) : ", collection free") + ", VAT " + money(t.vat) + ". Total " + money(t.total) + ".",
      "Prices hold until " + o.quote.validUntil + ". Payment: " + payText(o.quote.payDays) + ".",
      "To accept, open your order on our Deliveries page with " + o.ref + " and add your purchase order, or reply with it.",
      ...(o.quote.note ? [o.quote.note] : []),
    ];
    if (o.email) mail(d, { to: o.email, kind: "transactional", subject: "Quotation " + o.ref + ": " + money(t.total) + " incl. VAT", body });
    o.messages.push({ at: nowIso(), by: s?.userId || "", kind: "outbound", text: "Quote sent: " + money(t.total) + " including VAT" + (t.missing ? ", " + t.missing + " line" + (t.missing === 1 ? "" : "s") + " we cannot supply" : "") + "." });
    audit(d, s, "deliveries.quote", title(o), "Sent the quote, " + money(t.total));
  });
}

/** A purchase order that came by e-mail or by hand, recorded by staff. */
export function recordPo(s: Session | null, id: string, number: string, via: string, file?: FileMeta) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "quoted") throw new Error("A purchase order goes against a quote that has been sent.");
    if (!number.trim()) throw new Error("Enter their purchase order number.");
    o.po = { number: number.trim(), at: nowIso(), via, file };
    o.status = "accepted";
    note(o, s, "Purchase order " + o.po.number + " received by " + via.toLowerCase() + ".");
    audit(d, s, "deliveries.po", title(o), "Recorded purchase order " + o.po.number);
  });
}

/** Hands the pick list to someone. Not the person who wrote the quote. */
export function startPicking(s: Session | null, id: string, picker: string) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "accepted") throw new Error("Only an order with its purchase order in can be picked.");
    if (!picker) throw new Error("Choose who is picking it.");
    if (picker === o.quote?.by) throw new Error("The person who wrote the quote does not pick the order. Choose someone else.");
    o.pickedBy = picker;
    o.status = "picking";
    note(o, s, "Pick list given to " + (byId(d.employees, picker)?.name || "the picker") + ".");
    audit(d, s, "deliveries.pick", title(o), "Picking started");
  });
}

/** Ticks one line at the shelf (picked, with how many were found) or at the check (checked). */
export function tickLine(s: Session | null, id: string, lineId: string, field: "picked" | "checked", on: boolean, found?: number) {
  update((d) => {
    const o = find(d, s, id);
    if ((field === "picked" && o.status !== "picking") || (field === "checked" && o.status !== "checking")) throw new Error("This line cannot be ticked at this step.");
    const l = o.lines.find((x) => x.id === lineId);
    if (!l) throw new Error("That line is no longer on the order.");
    if (field === "picked" && found != null) {
      if (!Number.isInteger(found) || found < 0 || found > l.qty) throw new Error("Found should be a whole number from 0 to " + l.qty + ".");
      l.supplied = found < l.qty ? found : undefined;
    }
    l[field] = on;
    audit(d, s, "deliveries.tick", title(o), (on ? "Ticked " : "Unticked ") + lineText(l, suppliedOf(l)) + " as " + field);
  });
}

/** What goes in the crate: lines the quote priced. */
export const toPack = (o: DeliveryOrder) => o.lines.filter((l) => l.price != null);

/** Picking done. Anything short is written on the order and the customer is told before it leaves. */
export function finishPicking(s: Session | null, id: string) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "picking") throw new Error("This order is not being picked.");
    const left = toPack(o).filter((l) => !l.picked).length;
    if (left) throw new Error(left + " line" + (left === 1 ? " is" : "s are") + " not ticked yet. Count each one into the crate.");
    if (toPack(o).every((l) => suppliedOf(l) === 0)) throw new Error("Nothing on this order was found. Call the customer, then close it or wait for stock.");
    o.pickedAt = nowIso();
    o.status = "checking";
    const short = shortOf(o);
    note(o, s, "Picked. Waiting for the check against the purchase order." + (short.length ? " Short: " + short.map((l) => l.item + " (" + suppliedOf(l) + " of " + l.qty + ")").join(", ") + "." : ""));
    if (short.length && o.email) {
      const text = "We are short on part of " + o.ref + ": " + short.map((l) => lineText(l) + ", we have " + suppliedOf(l)).join("; ") + ". The rest is on its way, and your invoice will only charge what we deliver.";
      mail(d, { to: o.email, kind: "transactional", subject: "Part of your order " + o.ref + " is short", body: [text] });
      o.messages.push({ at: nowIso(), by: s?.userId || "", kind: "outbound", text });
    }
    audit(d, s, "deliveries.picked", title(o), "Picking finished" + (short.length ? ", " + short.length + " short" : ""));
  });
}

/** The second check, by the signed-in person, who must not be the picker. */
export function finishCheck(s: Session | null, id: string, handover: string) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "checking") throw new Error("This order is not waiting for a check.");
    if (s?.userId && s.userId === o.pickedBy) throw new Error("You picked this order, so someone else must check it.");
    const left = toPack(o).filter((l) => !l.checked).length;
    if (left) throw new Error(left + " line" + (left === 1 ? " is" : "s are") + " not checked against the purchase order yet.");
    o.checkedBy = s?.userId || "";
    o.checkedAt = nowIso();
    o.readyAt = nowIso();
    o.handover = handover.trim() || undefined;
    o.status = "ready";
    note(o, s, "Checked against purchase order " + (o.po?.number || "") + ", best-before dates included. " + (o.fulfil === "delivery" ? "Out for delivery" + (o.handover ? ": " + o.handover : "") + "." : "Packed and waiting to be collected."));
    if (o.email) mail(d, { to: o.email, kind: "transactional", subject: (o.fulfil === "delivery" ? "On its way: " : "Ready to collect: ") + o.ref, body: [o.fulfil === "delivery" ? "Your order " + o.ref + " has left our Couva store with its delivery note." : "Your order " + o.ref + " is packed and waiting at our Couva store. Please bring your purchase order number.", "Check the goods against the delivery note and write any shortage or damage on it before you sign."] });
    audit(d, s, "deliveries.checked", title(o), "Checked and " + (o.fulfil === "delivery" ? "sent out" : "ready to collect"));
  });
}

/** Signed for at the door (proof of delivery) and invoiced for what was supplied. */
export function markDelivered(s: Session | null, id: string, h: { receivedBy: string; notes: string; invoiceNo: string; paidByCard: boolean }) {
  update((d) => {
    const o = find(d, s, id);
    if (o.status !== "ready") throw new Error("Only an order that is out or ready can be marked delivered.");
    if (!h.receivedBy.trim()) throw new Error("Enter the name of the person who signed the delivery note.");
    if (!h.invoiceNo.trim()) throw new Error("Enter the invoice number.");
    if ((d.deliveries || []).some((x) => x.id !== o.id && x.invoice?.no === h.invoiceNo.trim())) throw new Error("That invoice number is already used.");
    const at = nowIso();
    const days = o.quote?.payDays || 0;
    const due = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    o.pod = { receivedBy: h.receivedBy.trim(), at, notes: h.notes.trim() || undefined, paidByCard: h.paidByCard || undefined };
    o.invoice = { no: h.invoiceNo.trim(), at, due };
    o.doneAt = at;
    o.status = "done";
    const t = sums(o, "invoice");
    note(o, s, (o.fulfil === "delivery" ? "Delivered" : "Collected") + ", signed for by " + o.pod.receivedBy + "." + (o.pod.notes ? " Noted at hand-over: " + o.pod.notes : "") + " Tax invoice " + o.invoice.no + ", " + money(t.total) + (h.paidByCard ? ", paid by card." : ", due " + due + "."));
    const to = o.billing?.email || o.email;
    if (to) mail(d, { to, kind: "transactional", subject: "Tax invoice " + o.invoice.no + " for your PO " + (o.po?.number || o.ref), body: ["Tax invoice " + o.invoice.no + " for " + o.company + ", order " + o.ref + ", your purchase order " + (o.po?.number || "") + ".", "Goods " + money(t.goods) + ", delivery " + money(t.fee) + ", VAT " + money(t.vat) + ". Total " + money(t.total) + ".", h.paidByCard ? "Paid by card on " + (o.fulfil === "delivery" ? "delivery" : "collection") + ". Thank you." : "Payment due " + due + ".", "Found a problem with the goods? Report it within " + CLAIM_HOURS + " hours on our Deliveries page."] });
    audit(d, s, "deliveries.done", title(o), (o.fulfil === "delivery" ? "Delivered" : "Collected") + ", invoice " + o.invoice.no);
  });
}

/** Closes a problem the customer reported: what was done about it (a replacement, a credit note). */
export function resolveIssue(s: Session | null, id: string, resolution: string) {
  update((d) => {
    const o = find(d, s, id);
    if (!o.issue || o.issue.resolvedAt) throw new Error("There is no open problem on this order.");
    if (!resolution.trim()) throw new Error("Say how it was put right, for example a credit note number or a replacement.");
    o.issue.resolvedAt = nowIso();
    o.issue.resolution = resolution.trim();
    note(o, s, "Problem sorted: " + o.issue.resolution);
    if (o.email) mail(d, { to: o.email, kind: "transactional", subject: "Your report on " + o.ref + " is sorted", body: [o.issue.resolution] });
    audit(d, s, "deliveries.issue", title(o), "Problem sorted");
  });
}

export function cancelDelivery(s: Session | null, id: string, reason: string) {
  update((d) => {
    const o = find(d, s, id);
    if (!isOpen(o)) throw new Error("This order is already closed.");
    if (!reason.trim()) throw new Error("Say why it is closing.");
    o.cancelReason = reason.trim();
    o.status = "cancelled";
    note(o, s, "Closed: " + o.cancelReason);
    audit(d, s, "deliveries.cancel", title(o), "Closed without an order");
  });
}

/** Adds to the thread, as the community requests do: a note for staff, a reply (to the demo outbox) or their reply. */
export function addDeliveryMessage(s: Session | null, id: string, kind: "internal" | "outbound" | "inbound", text: string) {
  update((d) => {
    const o = find(d, s, id);
    o.messages.push({ at: nowIso(), by: kind === "inbound" ? "requester" : s?.userId || "", kind, text });
    if (kind === "outbound" && o.email) mail(d, { to: o.email, kind: "transactional", subject: "Your order " + o.ref + " from Southern Food Basket", body: [text] });
    audit(d, s, "deliveries.message", title(o), kind === "internal" ? "Added a note" : kind === "outbound" ? "Replied to the customer" : "Recorded their reply");
  });
}

export function deliveryCounts(d: Seed, now: number) {
  const list = d.deliveries || [];
  const by = (st: DeliveryStatus) => list.filter((o) => o.status === st).length;
  return {
    new: by("new"),
    late: list.filter((o) => o.status === "new" && now > 0 && new Date(quoteDueAt(o)).getTime() < now).length,
    quoted: by("quoted"),
    inWork: by("accepted") + by("picking") + by("checking"),
    ready: by("ready"),
    done: by("done"),
    issues: list.filter((o) => o.issue && !o.issue.resolvedAt).length,
    invoiced: list.filter((o) => o.status === "done").reduce((n, o) => n + sums(o, "invoice").total, 0),
  };
}

/** The customer's view of where an order is, in their words. */
export const TRACK: { id: string; label: string; statuses: DeliveryStatus[] }[] = [
  { id: "list", label: "List received", statuses: ["new", "quoted", "accepted", "picking", "checking", "ready", "done"] },
  { id: "quote", label: "Quote sent", statuses: ["quoted", "accepted", "picking", "checking", "ready", "done"] },
  { id: "po", label: "Purchase order received", statuses: ["accepted", "picking", "checking", "ready", "done"] },
  { id: "pack", label: "Packed and checked", statuses: ["ready", "done"] },
  { id: "out", label: "On its way or ready", statuses: ["ready", "done"] },
  { id: "done", label: "Delivered and invoiced", statuses: ["done"] },
];
