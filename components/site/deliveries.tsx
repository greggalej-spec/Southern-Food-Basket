"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DOC_TITLE, DeliveryDoc, docsFor, usePrintDoc, type DocKind } from "@/components/deliveries/documents";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { useNowMinute, useToday } from "@/components/use-today";
import { plural } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { CLAIM_HOURS, PANTRY, TRACK, UNITS, ZONES, declineQuote, expired, findForCustomer, quoteDueAt, reportIssue, shortOf, submitDelivery, submitPo, zoneLabel, type DeliveryForm } from "@/lib/ops/deliveries";
import { useData } from "@/lib/store";
import type { DeliveryOrder, DeliveryUnit, FileMeta } from "@/lib/types";

/* The public side of Deliveries (/deliveries): a company sends its list and asks for a quote; then, under "Your order",
   follows it, accepts the quote with its purchase order (or declines it), prints its quotation and tax invoice, reports
   a problem within the claim window, or orders the same again. Everything writes into the Couva order list
   (lib/ops/deliveries.ts) that Narindra works from in the staff portal. In this prototype nothing is sent anywhere:
   the e-mails land in the demo outbox, and an attached file keeps only its name and size. */

export type LineDraft = { key: string; item: string; brand: string; size: string; qty: string; unit: DeliveryUnit; example?: string };

/* Row keys come from a counter, so the first row of a fresh form passes a fixed key: the server renders it too, and a
   counter would differ between the server and the browser. */
let k = 0;
export const blankLine = (more: Partial<LineDraft> = {}): LineDraft => ({ key: "ln" + ++k, item: "", brand: "", size: "", qty: "1", unit: "each", ...more });
const started = (l: LineDraft) => !!(l.item.trim() || l.brand.trim() || l.size.trim());

/** Checks the lines and returns them clean, or the first problem to show. */
export function readLines(lines: LineDraft[]): { lines: DeliveryForm["lines"]; error: string; at: string | null } {
  const out: DeliveryForm["lines"] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!started(l)) continue;
    const qty = Number(l.qty);
    if (!l.item.trim()) return { lines: [], error: "Line " + (i + 1) + ": say what the item is.", at: "item-" + l.key };
    if (!l.size.trim()) return { lines: [], error: "Line " + (i + 1) + ": add the size or pack, for example 500 ml or 24-pack, so we pack the right one.", at: "size-" + l.key };
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) return { lines: [], error: "Line " + (i + 1) + ": the quantity should be a whole number from 1 to 999.", at: "qty-" + l.key };
    out.push({ item: l.item.trim(), brand: l.brand.trim() || undefined, size: l.size.trim(), qty, unit: l.unit });
  }
  return { lines: out, error: "", at: null };
}

/** The item list: one row per line (item, brand, size, quantity, unit) and a row of the items offices ask for most,
 *  which add a line with the name filled in. Used by the public form and by staff logging a WhatsApp order. */
export function LineEditor({ lines, setLines, idPrefix, error }: { lines: LineDraft[]; setLines: (fn: (p: LineDraft[]) => LineDraft[]) => void; idPrefix: string; error?: string }) {
  const focusNext = useRef<string | null>(null);
  const set = (key: string, patch: Partial<LineDraft>) => setLines((p) => p.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  function quickAdd(p: (typeof PANTRY)[number]) {
    setLines((prev) => {
      const empty = prev.find((l) => !started(l));
      const line = { item: p.item, unit: p.unit, example: p.example, size: "", brand: "" };
      if (empty) {
        focusNext.current = idPrefix + "-size-" + empty.key;
        return prev.map((l) => (l.key === empty.key ? { ...l, ...line } : l));
      }
      const fresh = blankLine(line);
      focusNext.current = idPrefix + "-size-" + fresh.key;
      return [...prev, fresh];
    });
    requestAnimationFrame(() => {
      if (focusNext.current) document.getElementById(focusNext.current)?.focus();
      focusNext.current = null;
    });
  }

  return (
    <div className="dl-lines">
      <div className="dl-quick" role="group" aria-label="Add an item offices ask for often">
        <p>Offices often ask for:</p>
        <div className="dl-chips">
          {PANTRY.map((p) => (
            <button key={p.item} type="button" className="dl-chip" onClick={() => quickAdd(p)}>
              <span aria-hidden="true">+</span> {p.item}
            </button>
          ))}
        </div>
      </div>
      <ol className="dl-rows">
        {lines.map((l, i) => {
          const id = (f: string) => idPrefix + "-" + f + "-" + l.key;
          return (
            <li key={l.key} className="dl-row">
              <span className="dl-num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="field dl-item">
                <label htmlFor={id("item")}>Item {i + 1}</label>
                <input id={id("item")} type="text" value={l.item} onChange={(e) => set(l.key, { item: e.target.value })} placeholder="e.g. instant coffee" autoComplete="off" />
              </div>
              <div className="field dl-brand">
                <label htmlFor={id("brand")}>Brand</label>
                <input id={id("brand")} type="text" value={l.brand} onChange={(e) => set(l.key, { brand: e.target.value })} placeholder="Any" autoComplete="off" />
              </div>
              <div className="field dl-size">
                <label htmlFor={id("size")}>Size or pack</label>
                <input id={id("size")} type="text" value={l.size} onChange={(e) => set(l.key, { size: e.target.value })} placeholder={l.example ? "e.g. " + l.example : "e.g. 500 ml"} autoComplete="off" />
              </div>
              <div className="field dl-qty">
                <label htmlFor={id("qty")}>How many</label>
                <input id={id("qty")} type="number" inputMode="numeric" min={1} max={999} value={l.qty} onChange={(e) => set(l.key, { qty: e.target.value })} />
              </div>
              <div className="field dl-unit">
                <label htmlFor={id("unit")}>Of</label>
                <select id={id("unit")} value={l.unit} onChange={(e) => set(l.key, { unit: e.target.value as DeliveryUnit })}>
                  {UNITS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="dl-remove" aria-label={"Remove item " + (i + 1)} disabled={lines.length === 1 && !started(l)} onClick={() => setLines((p) => (p.length === 1 ? [blankLine()] : p.filter((x) => x.key !== l.key)))}>
                <Icon name="close" />
              </button>
            </li>
          );
        })}
      </ol>
      {error ? <p className="error-text">{error}</p> : null}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setLines((p) => [...p, blankLine()])}>
        Add another item
      </button>
    </div>
  );
}

/** A picked file's name, size and type; the file itself stays on the device in this prototype. */
export function fileMeta(f: File | undefined | null): FileMeta | undefined {
  return f ? { fileName: f.name, size: f.size, type: f.type || "application/octet-stream" } : undefined;
}
const MAX_FILE = 10 * 1024 * 1024;
const LIST_TYPES = ".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.xls,.csv,.doc,.docx";
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** "Order the same again" on a customer's order fills the request form through this event. */
export const REORDER_EVENT = "sfb-reorder";
type Reorder = { form: Partial<Form>; lines: DeliveryForm["lines"] };

type Form = Omit<DeliveryForm, "lines" | "list" | "billing"> & { billName: string; billAddress: string; billEmail: string; billSame: boolean };
const EMPTY: Form = { company: "", contact: "", phone: "", email: "", fulfil: "delivery", zone: "lisas", address: "", wantedBy: undefined, swaps: true, notes: "", site: "", payment: "account", billName: "", billAddress: "", billEmail: "", billSame: true };
type Errs = Partial<Record<"company" | "contact" | "phone" | "email" | "address" | "billAddress" | "billEmail" | "lines" | "list", string>>;

export function DeliveryRequestForm() {
  const [v, setV] = useState<Form>(EMPTY);
  const [lines, setLines] = useState<LineDraft[]>(() => [blankLine({ key: "first" })]);
  const [list, setList] = useState<FileMeta | undefined>();
  const [errs, setErrs] = useState<Errs>({});
  const [ref, setRef] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(key: K, val: Form[K]) => setV((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    const onReorder = (e: Event) => {
      const r = (e as CustomEvent<Reorder>).detail;
      setRef("");
      setV({ ...EMPTY, ...r.form });
      setLines(r.lines.map((l) => blankLine({ item: l.item, brand: l.brand || "", size: l.size, qty: String(l.qty), unit: l.unit })));
      setErrs({});
      requestAnimationFrame(() => document.getElementById("request")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      toast("Your last order is in the form. Change anything, then ask for your quote.", "ok");
    };
    window.addEventListener(REORDER_EVENT, onReorder);
    return () => window.removeEventListener(REORDER_EVENT, onReorder);
  }, []);

  function pickList(f: File | undefined) {
    if (f && f.size > MAX_FILE) {
      setErrs((e) => ({ ...e, list: "That file is over 10 MB. Send a smaller copy, or type the list below." }));
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setErrs((e) => ({ ...e, list: undefined }));
    setList(fileMeta(f));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errs = {};
    if (!v.company.trim()) er.company = "Enter your company’s name.";
    if (!v.contact.trim()) er.contact = "Enter the name of the person we should send the quote to.";
    if (!v.phone.trim()) er.phone = "Enter a phone number, in case we need to check an item.";
    if (!EMAIL.test(v.email.trim())) er.email = "Enter the e-mail address the quote should go to, like name@company.com.";
    if (v.fulfil === "delivery" && !(v.address || "").trim()) er.address = "Enter the delivery address.";
    const billAddress = v.billSame && v.fulfil === "delivery" ? (v.address || "").trim() : v.billAddress.trim();
    if (!billAddress && !er.address) er.billAddress = "Enter the address for the tax invoice.";
    if (v.billEmail.trim() && !EMAIL.test(v.billEmail.trim())) er.billEmail = "Check the accounts e-mail: it should look like accounts@company.com.";
    const read = readLines(lines);
    let focus: string | null = null;
    if (read.error) {
      er.lines = read.error;
      focus = "dr-" + read.at;
    } else if (!read.lines.length && !list) er.lines = "Add at least one item, or attach your list.";
    setErrs(er);
    const first = Object.keys(er).filter((x) => x !== "list")[0];
    if (first) {
      document.getElementById(first === "lines" ? focus || "dr-item-" + lines[0].key : "dr-" + first)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    setRef(
      submitDelivery({
        company: v.company.trim(), contact: v.contact.trim(), phone: v.phone.trim(), email: v.email.trim(), fulfil: v.fulfil, swaps: v.swaps, payment: v.payment,
        zone: v.fulfil === "delivery" ? v.zone : undefined, address: v.fulfil === "delivery" ? (v.address || "").trim() : undefined,
        site: v.fulfil === "delivery" ? (v.site || "").trim() || undefined : undefined, wantedBy: v.wantedBy,
        billing: { name: v.billName.trim() || v.company.trim(), address: billAddress, email: v.billEmail.trim() || v.email.trim() },
        notes: (v.notes || "").trim() || undefined, list, lines: read.lines,
      }),
    );
    setV(EMPTY);
    setLines([blankLine()]);
    setList(undefined);
  }

  const bad = (f: keyof Errs) => (errs[f] ? { "aria-invalid": true as const, "aria-describedby": "dr-" + f + "-e" } : {});
  const err = (f: keyof Errs) => (errs[f] ? <p className="error-text" id={"dr-" + f + "-e"}>{errs[f]}</p> : null);

  if (ref)
    return (
      <div className="card request-done" role="status">
        <span className="done-tick" aria-hidden="true">
          <Icon name="check" />
        </span>
        <h2>Thank you. Your list is with our Couva store.</h2>
        <p>
          Your reference is <strong className="request-ref">{ref}</strong>. Quote it on your purchase order.
        </p>
        <p className="muted">
          We reply with a priced quote within one working day. Follow it, accept it and print it under <a href="#track">Your order</a> with {ref} and your e-mail address. In this prototype nothing is sent: the acknowledgement is in the demo outbox, and the list is now in the staff portal’s Deliveries.
        </p>
        <div className="cluster">
          <button className="btn btn-outline" type="button" onClick={() => setRef("")}>
            Send another list
          </button>
          <Link className="link-btn" href="/outbox">
            See the acknowledgement
          </Link>
        </div>
      </div>
    );

  return (
    <form className="card request-form dl-form" onSubmit={submit} noValidate>
      <h2>Ask for a quote</h2>

      <fieldset className="dl-group">
        <legend>Your company</legend>
        <div className="form-row">
          <div className="field">
            <label htmlFor="dr-company">Company</label>
            <input id="dr-company" type="text" value={v.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" {...bad("company")} />
            {err("company")}
          </div>
          <div className="field">
            <label htmlFor="dr-contact">Your name and role</label>
            <input id="dr-contact" type="text" value={v.contact} onChange={(e) => set("contact", e.target.value)} autoComplete="name" placeholder="Name, job title" {...bad("contact")} />
            {err("contact")}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="dr-phone">Phone</label>
            <input id="dr-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" {...bad("phone")} />
            {err("phone")}
          </div>
          <div className="field">
            <label htmlFor="dr-email">E-mail for the quote</label>
            <input id="dr-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" {...bad("email")} />
            {err("email")}
          </div>
        </div>
      </fieldset>

      <fieldset className="dl-group">
        <legend>Your list</legend>
        <p className="hint">Be exact: the size and, if it matters, the brand. “Juice” could be one of twenty things; “Orange juice, 250 ml boxes, 3 cases of 24” is one.</p>
        <LineEditor lines={lines} setLines={setLines} idPrefix="dr" error={errs.lines} />
        <div className="field dl-file">
          <label htmlFor="dr-list">Or attach your own list</label>
          <input ref={fileInput} id="dr-list" type="file" accept={LIST_TYPES} onChange={(e) => pickList(e.target.files?.[0])} aria-describedby={errs.list ? "dr-list-e" : "dr-list-h"} />
          <p className="hint" id="dr-list-h">
            A spreadsheet, PDF or photo, up to 10 MB. Typed lines are quicker to quote than a photo of a handwritten list.
          </p>
          {err("list")}
        </div>
      </fieldset>

      <fieldset className="kind-pick">
        <legend>If we are out of something</legend>
        <label className={"kind-option" + (v.swaps ? " is-on" : "")}>
          <input type="radio" name="dr-swaps" checked={v.swaps} onChange={() => set("swaps", true)} />
          <span>
            <strong>Offer a similar item</strong>
            <small>Same kind and size, another brand. The quote shows every swap before you accept.</small>
          </span>
        </label>
        <label className={"kind-option" + (!v.swaps ? " is-on" : "")}>
          <input type="radio" name="dr-swaps" checked={!v.swaps} onChange={() => set("swaps", false)} />
          <span>
            <strong>Leave it off</strong>
            <small>Quote only what we have exactly as asked.</small>
          </span>
        </label>
      </fieldset>

      <fieldset className="kind-pick">
        <legend>Delivery or collection</legend>
        <label className={"kind-option" + (v.fulfil === "delivery" ? " is-on" : "")}>
          <input type="radio" name="dr-fulfil" checked={v.fulfil === "delivery"} onChange={() => set("fulfil", "delivery")} />
          <span>
            <strong>Deliver to us</strong>
            <small>A small fee by distance, shown on your quote.</small>
          </span>
        </label>
        <label className={"kind-option" + (v.fulfil === "collect" ? " is-on" : "")}>
          <input type="radio" name="dr-fulfil" checked={v.fulfil === "collect"} onChange={() => set("fulfil", "collect")} />
          <span>
            <strong>We will collect</strong>
            <small>From our Couva store, 696 Southern Main Road. No charge.</small>
          </span>
        </label>
      </fieldset>

      {v.fulfil === "delivery" ? (
        <>
          <div className="form-row">
            <div className="field">
              <label htmlFor="dr-zone">Area</label>
              <select id="dr-zone" value={v.zone} onChange={(e) => set("zone", e.target.value)}>
                {ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dr-address">Delivery address</label>
              <input id="dr-address" type="text" value={v.address || ""} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" {...bad("address")} />
              {err("address")}
            </div>
          </div>
          <div className="field">
            <label htmlFor="dr-site">Getting in and receiving</label>
            <textarea id="dr-site" rows={2} value={v.site || ""} onChange={(e) => set("site", e.target.value)} placeholder="Gate or security hut, ID or gate pass, safety boots or hi-vis, receiving hours" aria-describedby="dr-site-h" />
            <p className="hint" id="dr-site-h">
              Optional, but it saves a wasted trip. Industrial estates often have their own rules at the gate.
            </p>
          </div>
        </>
      ) : null}

      <fieldset className="dl-group">
        <legend>Invoicing</legend>
        <div className="form-row">
          <div className="field">
            <label htmlFor="dr-billName">Name on the tax invoice</label>
            <input id="dr-billName" type="text" value={v.billName} onChange={(e) => set("billName", e.target.value)} placeholder={v.company ? v.company : "Your registered company name"} aria-describedby="dr-billName-h" />
            <p className="hint" id="dr-billName-h">
              If it is not the company name above, for example “… Limited”.
            </p>
          </div>
          <div className="field">
            <label htmlFor="dr-billEmail">Accounts e-mail for invoices</label>
            <input id="dr-billEmail" type="email" value={v.billEmail} onChange={(e) => set("billEmail", e.target.value)} placeholder={v.email || "accounts@company.com"} {...bad("billEmail")} />
            {err("billEmail")}
          </div>
        </div>
        {v.fulfil === "delivery" ? (
          <label className="check dl-same">
            <input type="checkbox" checked={v.billSame} onChange={(e) => set("billSame", e.target.checked)} /> Bill to the delivery address
          </label>
        ) : null}
        {!v.billSame || v.fulfil === "collect" ? (
          <div className="field">
            <label htmlFor="dr-billAddress">Billing address</label>
            <input id="dr-billAddress" type="text" value={v.billAddress} onChange={(e) => set("billAddress", e.target.value)} autoComplete="billing street-address" {...bad("billAddress")} />
            {err("billAddress")}
          </div>
        ) : null}
        <fieldset className="kind-pick dl-pay">
          <legend>How you will pay</legend>
          <label className={"kind-option" + (v.payment === "account" ? " is-on" : "")}>
            <input type="radio" name="dr-pay" checked={v.payment === "account"} onChange={() => set("payment", "account")} />
            <span>
              <strong>On invoice</strong>
              <small>To your accounts department. The terms are on your quote.</small>
            </span>
          </label>
          <label className={"kind-option" + (v.payment === "card" ? " is-on" : "")}>
            <input type="radio" name="dr-pay" checked={v.payment === "card"} onChange={() => set("payment", "card")} />
            <span>
              <strong>By card when it arrives</strong>
              <small>Debit or credit card on our portable machine, or at the Couva counter. No cash on delivery.</small>
            </span>
          </label>
        </fieldset>
      </fieldset>

      <div className="form-row">
        <div className="field">
          <label htmlFor="dr-when">Needed by</label>
          <input id="dr-when" type="date" value={v.wantedBy || ""} onChange={(e) => set("wantedBy", e.target.value || undefined)} aria-describedby="dr-when-h" />
          <p className="hint" id="dr-when-h">
            Optional. We confirm the day on your quote.
          </p>
        </div>
        <div className="field">
          <label htmlFor="dr-notes">Anything else</label>
          <textarea id="dr-notes" rows={2} value={v.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Who receives it, anything we should know" />
        </div>
      </div>

      <button className="btn btn-sign" type="submit">
        Ask for my quote
      </button>
      <p className="hint">
        No prices or payment on this website. We use these details only to quote, deliver and invoice this order (<a href="#terms-privacy">how we use your details</a>).
      </p>
    </form>
  );
}

/* ---------- Your order: follow it, accept or decline the quote, print the papers, report a problem, order again ---------- */

export function OrderLookup() {
  const d = useData();
  const now = useNowMinute();
  const todayIso = useToday();
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [key, setKey] = useState<{ ref: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const { node, print } = usePrintDoc();
  const o = key ? findForCustomer(d, key.ref, key.email) : null;

  function look(e: React.FormEvent) {
    e.preventDefault();
    if (!/^DL-?\d{1,6}$/i.test(ref.trim())) return setError("Enter your reference, like DL-0012.");
    if (!EMAIL.test(email.trim())) return setError("Enter the e-mail address you sent your list from.");
    if (!findForCustomer(d, ref, email)) return setError("We could not match that reference and e-mail address. Check both against your acknowledgement e-mail.");
    setError("");
    setKey({ ref: ref.trim(), email: email.trim() });
  }

  return (
    <div className="card dl-track">
      {node}
      <h2>Your order</h2>
      <p className="muted">Follow an order, accept or decline your quote, print your quotation or tax invoice, or report a problem.</p>
      <form className="dl-track-find" onSubmit={look} noValidate>
        <div className="field">
          <label htmlFor="tr-ref">Reference</label>
          <input id="tr-ref" type="text" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="DL-0012" autoComplete="off" autoCapitalize="characters" />
        </div>
        <div className="field">
          <label htmlFor="tr-email">E-mail address</label>
          <input id="tr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <button className="btn btn-primary" type="submit">
          Find my order
        </button>
      </form>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
      {o && key ? <OrderView key={o.id} o={o} who={key} now={now} todayIso={todayIso} print={print} /> : null}
    </div>
  );
}

function OrderView({ o, who, now, todayIso, print }: { o: DeliveryOrder; who: { ref: string; email: string }; now: number; todayIso: string; print: (o: DeliveryOrder, k: DocKind) => void }) {
  const [po, setPo] = useState("");
  const [file, setFile] = useState<FileMeta | undefined>();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [issue, setIssue] = useState("");
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const isExpired = expired(o, todayIso);
  const withinClaim = o.status === "ready" || (o.status === "done" && !!o.pod && now > 0 && now - new Date(o.pod.at).getTime() < CLAIM_HOURS * 3600000);

  function accept(e: React.FormEvent) {
    e.preventDefault();
    if (!po.trim()) return setMsg({ text: "Enter your purchase order number.", bad: true });
    if (!file) return setMsg({ text: "Attach your purchase order: a PDF or a photo of it.", bad: true });
    if (file.size > MAX_FILE) return setMsg({ text: "That file is over 10 MB. Send a smaller copy.", bad: true });
    const er = submitPo(who.ref, who.email, po, file);
    setMsg(er ? { text: er, bad: true } : { text: "Thank you. Your order is confirmed and going to the shelves at Couva. The confirmation is in the demo outbox." });
  }
  function decline(e: React.FormEvent) {
    e.preventDefault();
    const er = declineQuote(who.ref, who.email, reason);
    setMsg(er ? { text: er, bad: true } : { text: "Thank you for letting us know. The quote is closed." });
  }
  function report(e: React.FormEvent) {
    e.preventDefault();
    const er = reportIssue(who.ref, who.email, issue);
    setMsg(er ? { text: er, bad: true } : { text: "Thank you. The Couva store will call you within one working day to put it right." });
    if (!er) setIssue("");
  }
  function again() {
    const detail: Reorder = {
      form: { company: o.company, contact: o.contact, phone: o.phone, email: o.email, fulfil: o.fulfil, zone: o.zone || "lisas", address: o.address || "", site: o.site || "", swaps: o.swaps, payment: o.payment || "account", billName: o.billing?.name || "", billEmail: o.billing?.email || "", billAddress: o.billing?.address || "", billSame: !o.billing || o.billing.address === o.address },
      lines: o.lines.map((l) => ({ item: l.item, brand: l.brand, size: l.size, qty: l.qty, unit: l.unit })),
    };
    window.dispatchEvent(new CustomEvent(REORDER_EVENT, { detail }));
  }

  const docs = docsFor(o).filter((k) => k === "quote" || k === "invoice" || k === "note");
  return (
    <section className="dl-order" aria-label={"Order " + o.ref}>
      <header className="dl-order-head">
        <div>
          <p className="eyebrow">{o.ref}</p>
          <h3>{o.company}</h3>
          <p className="muted small">
            {"Sent " + whenTT(o.receivedAt) + " · " + plural(o.lines.length, "item") + " · " + (o.fulfil === "delivery" ? "delivery to " + zoneLabel(o.zone) : "collect at Couva")}
          </p>
        </div>
      </header>

      <ol className="dl-steps-track">
        {TRACK.map((st) => {
          const on = st.statuses.includes(o.status);
          return (
            <li key={st.id} className={on ? "is-done" : undefined}>
              <span aria-hidden="true">{on ? <Icon name="check" /> : null}</span>
              {st.id === "out" ? (o.fulfil === "delivery" ? "On its way" : "Ready to collect") : st.label}
              {on ? null : <span className="visually-hidden"> (not yet)</span>}
            </li>
          );
        })}
      </ol>

      {o.status === "new" ? <p className="dl-say">We are pricing your list. Your quote is due by {whenTT(quoteDueAt(o))}.</p> : null}
      {o.status === "cancelled" ? <p className="dl-say">This order is closed. {o.cancelReason}</p> : null}
      {["accepted", "picking", "checking"].includes(o.status) ? (
        <p className="dl-say">
          Your purchase order {o.po?.number} is in and the order is being packed at Couva. {o.fulfil === "delivery" ? "We will call you to agree the delivery day and time." : "We will call you when it is ready to collect."}
          {shortOf(o).length ? " We are short on " + shortOf(o).map((l) => l.item.toLowerCase()).join(", ") + " and will not charge for what we cannot supply." : ""}
        </p>
      ) : null}
      {o.status === "ready" ? <p className="dl-say">{o.fulfil === "delivery" ? "Your order is on its way with a delivery note. Check the goods against it and write any shortage or damage on it before you sign." : "Your order is packed and waiting at our Couva store, 696 Southern Main Road. Bring your purchase order number."}</p> : null}

      {o.status === "quoted" ? (
        <div className="dl-quote-box">
          <DeliveryDoc o={o} kind="quote" />
          {isExpired ? (
            <p className="dl-say">This quote expired on {o.quote?.validUntil}. Prices may have changed: send your list again and we will re-quote.</p>
          ) : declining ? (
            <form className="dl-answer" onSubmit={decline}>
              <div className="field">
                <label htmlFor="tr-why">Why not? (optional)</label>
                <textarea id="tr-why" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="It helps us price better next time" />
              </div>
              <div className="cluster">
                <button className="btn btn-outline" type="submit">
                  Decline the quote
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setDeclining(false)}>
                  Go back
                </button>
              </div>
            </form>
          ) : (
            <form className="dl-answer" onSubmit={accept}>
              <h4>Accept this quote</h4>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="tr-po">Your purchase order number</label>
                  <input id="tr-po" type="text" value={po} onChange={(e) => setPo(e.target.value)} autoComplete="off" />
                </div>
                <div className="field">
                  <label htmlFor="tr-pofile">The purchase order</label>
                  <input id="tr-pofile" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx" onChange={(e) => setFile(fileMeta(e.target.files?.[0]))} aria-describedby="tr-pofile-h" />
                  <p className="hint" id="tr-pofile-h">
                    PDF or photo, up to 10 MB.
                  </p>
                </div>
              </div>
              <div className="cluster">
                <button className="btn btn-sign" type="submit">
                  Accept and send my PO
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setDeclining(true)}>
                  Decline
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {o.status === "done" && o.invoice ? <DeliveryDoc o={o} kind="invoice" /> : null}

      {msg ? (
        <p className={msg.bad ? "error-text" : "dl-ok"} role={msg.bad ? "alert" : "status"}>
          {msg.text}
        </p>
      ) : null}

      {withinClaim && !o.issue ? (
        <form className="dl-answer" onSubmit={report}>
          <h4>Something short, damaged or wrong?</h4>
          <p className="hint">Tell us within {CLAIM_HOURS} hours of delivery and we will replace it or credit your invoice.</p>
          <div className="field">
            <label htmlFor="tr-issue">What happened</label>
            <textarea id="tr-issue" rows={2} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Which item, how many, and what was wrong" />
          </div>
          <button className="btn btn-outline" type="submit">
            Report the problem
          </button>
        </form>
      ) : null}
      {o.issue ? <p className="dl-say">{o.issue.resolvedAt ? "Your report was sorted: " + o.issue.resolution : "We have your report of " + whenTT(o.issue.at) + " and will call you to put it right."}</p> : null}

      <div className="cluster dl-order-actions">
        {docs.map((k) => (
          <button key={k} className="btn btn-outline btn-sm" type="button" onClick={() => print(o, k)}>
            Print the {DOC_TITLE[k].toLowerCase()}
          </button>
        ))}
        {o.status === "done" || o.status === "cancelled" ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={again}>
            Order the same again
          </button>
        ) : null}
      </div>
    </section>
  );
}
