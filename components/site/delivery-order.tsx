"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LineThumb } from "@/components/deliveries/line-thumb";
import { Icon } from "@/components/icon";
import { Pic } from "@/components/pic";
import { EMAIL, EMPTY_DETAILS, LIST_TYPES, MAX_FILE, REORDER_EVENT, fileMeta, type DetailsForm, type Reorder } from "@/components/site/delivery-shared";
import { toast } from "@/components/ui/sonner";
import { plural } from "@/lib/admin/helpers";
import { fileSize } from "@/lib/format";
import { addItem, clampQty, clearBasket, newKey, patchLine, qtyOf, removeLine, resizeLine, setBasket, setItemQty, useBasket, type BasketLine } from "@/lib/ops/delivery-basket";
import { GOODS_SETS, GOODS_TYPES, catalogueItem, groupLines, isGoodsType, itemOfLine, itemsOfType, photoOf, sizeLabel, type CatalogueItem, type GoodsSet } from "@/lib/ops/delivery-catalogue";
import { UNITS, ZONES, submitDelivery, unitLabel, type DeliveryForm } from "@/lib/ops/deliveries";
import type { DeliveryUnit, FileMeta } from "@/lib/types";

/* Ordering on /deliveries, in three steps the way a supermarket's delivery site works, without prices or payment:
     1 Choose items    pictures by type of good, each with its usual sizes and a quantity; ready-made sets; a line of
                       the customer's own for anything not shown, or their own list attached
     2 Check your list grouped by type: change a size or an amount, name a brand, take a line off
     3 Delivery and invoice  who and where, the tax invoice's details, how they will pay
   The list is kept in the browser until it is sent (lib/ops/delivery-basket.ts). Sending it writes the same quote
   request as before (submitDelivery), which Narindra prices in the staff portal. */

type Step = "shop" | "review" | "details";
const STEPS: { id: Step; label: string }[] = [
  { id: "shop", label: "Choose items" },
  { id: "review", label: "Check your list" },
  { id: "details", label: "Delivery and invoice" },
];
const SETS = "sets";
const OWN = "own";
const SET_COVER = ["coffee-instant", "water-small", "toilet-paper", "disinfectant"];

type HeadRef = React.RefObject<HTMLHeadingElement | null>;

/** A quantity: one fewer, the number (which can be typed), one more. Clearing the box to type does not change it. */
function Stepper({ value, min, label, onChange, inputRef }: { value: number; min: 0 | 1; label: string; onChange: (n: number) => void; inputRef?: React.Ref<HTMLInputElement> }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="dv-step" role="group" aria-label={label}>
      <button type="button" aria-label={min === 0 && value <= 1 ? "Take it off the list" : "One fewer"} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        min={1}
        max={999}
        aria-label="How many"
        value={text ?? String(value)}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (Number.isInteger(n) && n >= 1 && n <= 999) onChange(n);
        }}
        onBlur={() => setText(null)}
      />
      <button type="button" aria-label="One more" disabled={value >= 999} onClick={() => onChange(Math.min(999, value + 1))}>
        +
      </button>
    </div>
  );
}

/** Lines of an earlier order, back on the list: catalogue items keep their picture, anything else is the customer's own. */
function fromOrder(lines: DeliveryForm["lines"]): BasketLine[] {
  const out: BasketLine[] = [];
  for (const l of lines) {
    const it = itemOfLine(l);
    const twin = it ? out.find((x) => x.sku === it.id && x.size === l.size && x.brand === (l.brand || "")) : undefined;
    if (twin) twin.qty = clampQty(twin.qty + l.qty);
    else out.push({ key: newKey(), item: it?.name || l.item, brand: l.brand || "", size: l.size, unit: l.unit, qty: clampQty(l.qty), ...(it ? { sku: it.id } : isGoodsType(l.cat) ? { cat: l.cat } : {}) });
  }
  return out;
}

/** "Any" typed into the brand box means no brand was asked for. */
const brandOf = (b: string) => (/^any( brand)?$/i.test(b.trim()) ? undefined : b.trim() || undefined);

const describe = (l: BasketLine) => {
  const it = itemOfLine(l);
  const known = it?.sizes.some((s) => s.size === l.size);
  return known ? sizeLabel(it, l.size) : l.size + (unitLabel(l.unit, l.qty) ? ", " + unitLabel(l.unit, l.qty) : "");
};

export function DeliveryOrder() {
  const basket = useBasket();
  const [step, setStep] = useState<Step>("shop");
  const [list, setList] = useState<FileMeta | undefined>();
  const [v, setV] = useState<DetailsForm>(EMPTY_DETAILS);
  const [done, setDone] = useState<{ ref: string; lines: BasketLine[]; list?: FileMeta } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);

  const arrive = () =>
    requestAnimationFrame(() => {
      root.current?.scrollIntoView({ block: "start" });
      head.current?.focus({ preventScroll: true });
    });
  function go(to: Step) {
    setStep(to);
    arrive();
  }

  useEffect(() => {
    const onReorder = (e: Event) => {
      const r = (e as CustomEvent<Reorder>).detail;
      setBasket(() => fromOrder(r.lines));
      setDone(null);
      setList(undefined);
      setV({ ...EMPTY_DETAILS, ...r.form });
      setStep("review");
      requestAnimationFrame(() => {
        root.current?.scrollIntoView({ block: "start" });
        head.current?.focus({ preventScroll: true });
      });
      toast("Your last order is on your list. Change anything, then ask for your quote.", "ok");
    };
    window.addEventListener(REORDER_EVENT, onReorder);
    return () => window.removeEventListener(REORDER_EVENT, onReorder);
  }, []);

  function send(billAddress: string) {
    const ref = submitDelivery({
      company: v.company.trim(), contact: v.contact.trim(), phone: v.phone.trim(), email: v.email.trim(), fulfil: v.fulfil, swaps: v.swaps, payment: v.payment,
      zone: v.fulfil === "delivery" ? v.zone : undefined, address: v.fulfil === "delivery" ? (v.address || "").trim() : undefined,
      site: v.fulfil === "delivery" ? (v.site || "").trim() || undefined : undefined, wantedBy: v.wantedBy,
      billing: { name: v.billName.trim() || v.company.trim(), address: billAddress, email: v.billEmail.trim() || v.email.trim() },
      notes: (v.notes || "").trim() || undefined, list,
      lines: basket.map((l) => ({ item: l.item, brand: brandOf(l.brand), size: l.size, qty: l.qty, unit: l.unit, sku: l.sku, cat: l.cat })),
    });
    setDone({ ref, lines: basket, list });
    clearBasket();
    setV(EMPTY_DETAILS);
    setList(undefined);
    setStep("shop");
    arrive();
  }

  if (done)
    return (
      <div className="dv-order" ref={root}>
        <Sent done={done} headRef={head} onAgain={() => setDone(null)} />
      </div>
    );

  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="dv-order" ref={root}>
      <ol className="dv-stages" aria-label="The steps to ask for a quote">
        {STEPS.map((s, i) => {
          const state = i < at ? "done" : i === at ? "now" : "next";
          const body = (
            <>
              <span className="dv-stage-n" aria-hidden="true">
                {state === "done" ? <Icon name="check" /> : i + 1}
              </span>
              <span>
                <span className="visually-hidden">{"Step " + (i + 1) + ": "}</span>
                {s.label}
                {state === "done" ? <span className="visually-hidden"> (done, go back)</span> : null}
              </span>
            </>
          );
          return (
            <li key={s.id} className={"is-" + state} aria-current={state === "now" ? "step" : undefined}>
              {state === "done" ? (
                <button type="button" onClick={() => go(s.id)}>
                  {body}
                </button>
              ) : (
                <span>{body}</span>
              )}
            </li>
          );
        })}
      </ol>

      {step === "shop" ? <Shop basket={basket} list={list} onList={setList} onNext={() => go("review")} headRef={head} /> : null}
      {step === "review" ? (
        <Review basket={basket} list={list} onList={setList} swaps={v.swaps} onSwaps={(swaps) => setV((p) => ({ ...p, swaps }))} onBack={() => go("shop")} onNext={() => go("details")} headRef={head} />
      ) : null}
      {step === "details" ? <Details v={v} setV={setV} basket={basket} list={list} onBack={() => go("review")} onSend={send} headRef={head} /> : null}
    </div>
  );
}

/* ---------- step 1: choose items ---------- */

function Shop({ basket, list, onList, onNext, headRef }: { basket: BasketLine[]; list?: FileMeta; onList: (f?: FileMeta) => void; onNext: () => void; headRef: HeadRef }) {
  const [type, setType] = useState<string>(GOODS_TYPES[0].id);
  const ready = basket.length > 0 || !!list;
  const ownCount = basket.filter((l) => !itemOfLine(l)).length + (list ? 1 : 0);
  const inType = (t: string) => basket.filter((l) => itemOfLine(l)?.type === t).length;
  const now = GOODS_TYPES.find((t) => t.id === type);

  function addSet(set: GoodsSet) {
    for (const [id, size, qty] of set.lines) {
      const it = catalogueItem(id);
      if (it) addItem(it, it.sizes[size] || it.sizes[0], qty);
    }
    toast(set.name + " is on your list: " + plural(set.lines.length, "item") + ". Change any amount when you check your list.", "ok");
  }

  const tile = (id: string, label: string, pic: React.ReactNode, n: number) => (
    <button key={id} type="button" className={"dv-type" + (type === id ? " is-on" : "")} aria-pressed={type === id} onClick={() => setType(id)}>
      <span className="dv-type-pic">{pic}</span>
      <span className="dv-type-name">{label}</span>
      {n ? (
        <span className="dv-type-n">
          {n}
          <span className="visually-hidden"> on your list</span>
        </span>
      ) : null}
    </button>
  );

  return (
    <>
      <div className="dv-shop">
        <div className="dv-shop-main">
          <h2 className="dv-h" tabIndex={-1} ref={headRef}>
            Choose what you need
          </h2>
          <p className="dv-lead">Pick a type of item, then add what you need. There are no prices here: we price your list and reply with a quotation within one working day.</p>

          <div className="dv-types" role="group" aria-label="Types of items">
            {GOODS_TYPES.map((t) => tile(t.id, t.short, <img src={photoOf(t.cover)} alt="" loading="lazy" decoding="async" />, inType(t.id)))}
            {tile(
              SETS,
              "Ready-made sets",
              <span className="dv-type-four">
                {SET_COVER.map((id) => (
                  <img key={id} src={photoOf(id)} alt="" loading="lazy" decoding="async" />
                ))}
              </span>,
              0,
            )}
            {tile(OWN, "Something else", <Icon name="tasks" />, ownCount)}
          </div>

          {now ? (
            <section aria-labelledby="dv-type-h">
              <h3 id="dv-type-h" className="dv-h3">
                {now.name}
              </h3>
              <ul className="dv-grid">
                {itemsOfType(now.id).map((it) => (
                  <ItemCard key={it.id} it={it} basket={basket} />
                ))}
              </ul>
              <p className="hint">
                Pictures show the kind of item, not the brand. Want a certain brand or another size? Say so when you check your list, or add it under{" "}
                <button type="button" className="link-btn" onClick={() => setType(OWN)}>
                  Something else
                </button>
                .
              </p>
            </section>
          ) : null}

          {type === SETS ? (
            <section aria-labelledby="dv-type-h">
              <h3 id="dv-type-h" className="dv-h3">
                Ready-made sets
              </h3>
              <p className="hint dv-sub">A list to start from. Add one, then change any amount or take things off.</p>
              <ul className="dv-sets">
                {GOODS_SETS.map((set) => (
                  <li key={set.id} className="dv-set">
                    <div className="dv-set-pics" aria-hidden="true">
                      {set.lines.slice(0, 4).map(([id]) => (
                        <img key={id} src={photoOf(id)} alt="" loading="lazy" decoding="async" />
                      ))}
                    </div>
                    <div className="dv-set-text">
                      <h4>{set.name}</h4>
                      <p>{set.blurb}</p>
                      <ul>
                        {set.lines.map(([id, size, qty]) => {
                          const it = catalogueItem(id);
                          const label = it ? (it.sizes[size] || it.sizes[0]).label : "";
                          return it ? <li key={id}>{qty + " × " + it.name + ", " + label.charAt(0).toLowerCase() + label.slice(1)}</li> : null;
                        })}
                      </ul>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => addSet(set)}>
                        Add the set
                        <span className="visually-hidden">{": " + set.name}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {type === OWN ? <OwnItem list={list} onList={onList} /> : null}
        </div>

        <aside className="dv-cart" aria-label="Your list so far">
          <h3 className="dv-h3">
            Your list
            {basket.length ? <span className="dv-count">{basket.length}</span> : null}
          </h3>
          {ready ? (
            <ul>
              {basket.map((l) => (
                <li key={l.key}>
                  <LineThumb line={l} />
                  <div>
                    <strong>{l.item}</strong>
                    <span>{describe(l)}</span>
                  </div>
                  <span className="dv-x">{"× " + l.qty}</span>
                </li>
              ))}
              {list ? (
                <li>
                  <span className="dv-thumb dv-thumb-own" aria-hidden="true">
                    <Icon name="file" />
                  </span>
                  <div>
                    <strong>Your own list</strong>
                    <span>{list.fileName}</span>
                  </div>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="muted">Nothing yet. Add items, or start from a ready-made set.</p>
          )}
          <button type="button" className="btn btn-sign" disabled={!ready} onClick={onNext}>
            Check your list
          </button>
          <p className="hint">Nothing is ordered until you accept our quotation.</p>
        </aside>
      </div>

      {ready ? (
        <div className="dv-bar">
          <span>
            <strong>{basket.length ? plural(basket.length, "item") : "Your own list"}</strong>
            {basket.length && list ? " and your own list" : ""}
          </span>
          <button type="button" className="btn btn-sign btn-sm" onClick={onNext}>
            Check your list
          </button>
        </div>
      ) : null}
    </>
  );
}

function ItemCard({ it, basket }: { it: CatalogueItem; basket: BasketLine[] }) {
  const [si, setSi] = useState(0);
  const size = it.sizes[si];
  const qty = qtyOf(basket, it, size);
  const total = basket.filter((l) => l.sku === it.id).reduce((n, l) => n + l.qty, 0);
  const addBtn = useRef<HTMLButtonElement>(null);
  const qtyBox = useRef<HTMLInputElement>(null);
  const what = it.name + ", " + size.label;

  return (
    <li className={"dv-item" + (total ? " is-in" : "")}>
      <Pic src={photoOf(it.id)} alt={it.alt} ar="1 / 1" />
      {total ? (
        <span className="dv-in">
          <Icon name="check" /> {total} on your list
        </span>
      ) : null}
      <h4>{it.name}</h4>
      {it.sizes.length > 1 ? (
        <select aria-label={"Size of " + it.name} value={si} onChange={(e) => setSi(Number(e.target.value))}>
          {it.sizes.map((s, i) => (
            <option key={s.size} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      ) : (
        <p className="dv-size">{size.label}</p>
      )}
      {qty ? (
        <Stepper
          value={qty}
          min={0}
          label={"How many: " + what}
          inputRef={qtyBox}
          onChange={(n) => {
            setItemQty(it, size, n);
            if (n < 1) requestAnimationFrame(() => addBtn.current?.focus());
          }}
        />
      ) : (
        <button
          ref={addBtn}
          type="button"
          className="btn btn-outline btn-sm dv-add"
          onClick={() => {
            setItemQty(it, size, 1);
            requestAnimationFrame(() => qtyBox.current?.focus());
          }}
        >
          <span aria-hidden="true">+</span> Add
          <span className="visually-hidden">{" " + what}</span>
        </button>
      )}
    </li>
  );
}

/** Anything the pictures do not show: one line at a time, or the customer's own list as a file. */
function OwnItem({ list, onList }: { list?: FileMeta; onList: (f?: FileMeta) => void }) {
  const blank = { item: "", cat: "", brand: "", size: "", qty: "1", unit: "each" as DeliveryUnit };
  const [f, setF] = useState(blank);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof blank>(k: K, val: (typeof blank)[K]) => setF((p) => ({ ...p, [k]: val }));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(f.qty);
    const fail = (msg: string, id: string) => {
      setError(msg);
      document.getElementById(id)?.focus();
    };
    if (!f.item.trim()) return fail("Say what the item is.", "ow-item");
    if (!f.size.trim()) return fail("Add the size or pack, for example 500 ml or 24-pack, so we pack the right one.", "ow-size");
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) return fail("How many should be a whole number from 1 to 999.", "ow-qty");
    setError("");
    const item = f.item.trim().slice(0, 80);
    setBasket((lines) => [...lines, { key: newKey(), item, brand: f.brand.trim().slice(0, 60), size: f.size.trim().slice(0, 60), unit: f.unit, qty, ...(isGoodsType(f.cat) ? { cat: f.cat } : {}) }]);
    setF(blank);
    toast(item + " is on your list.", "ok");
    document.getElementById("ow-item")?.focus();
  }

  function pick(file: File | undefined) {
    if (file && file.size > MAX_FILE) {
      setFileError("That file is over 10 MB. Send a smaller copy, or add the items one at a time.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFileError("");
    onList(fileMeta(file));
  }

  return (
    <section aria-labelledby="dv-type-h" className="dv-own">
      <h3 id="dv-type-h" className="dv-h3">
        Something else
      </h3>
      <p className="hint dv-sub">For anything the pictures do not show. Be exact: “Juice” could be one of twenty things; “Orange juice, 250 ml boxes, 3 cases” is one.</p>
      <form className="dv-own-form" onSubmit={add} noValidate>
        <div className="field dv-own-item">
          <label htmlFor="ow-item">What do you need?</label>
          <input id="ow-item" type="text" value={f.item} onChange={(e) => set("item", e.target.value)} placeholder="e.g. decaf coffee" autoComplete="off" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="ow-cat">Type of item</label>
          <select id="ow-cat" value={f.cat} onChange={(e) => set("cat", e.target.value)}>
            <option value="">Not sure</option>
            {GOODS_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ow-brand">Brand</label>
          <input id="ow-brand" type="text" value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Any" autoComplete="off" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="ow-size">Size or pack</label>
          <input id="ow-size" type="text" value={f.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 500 ml" autoComplete="off" maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="ow-qty">How many</label>
          <input id="ow-qty" type="number" inputMode="numeric" min={1} max={999} value={f.qty} onChange={(e) => set("qty", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ow-unit">Of</label>
          <select id="ow-unit" value={f.unit} onChange={(e) => set("unit", e.target.value as DeliveryUnit)}>
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="error-text dv-own-wide" role="alert">
            {error}
          </p>
        ) : null}
        <button className="btn btn-outline dv-own-wide" type="submit">
          <span aria-hidden="true">+</span> Add to my list
        </button>
      </form>

      <div className="field dv-own-file">
        <label htmlFor="ow-list">Or attach your own list</label>
        <input ref={fileInput} id="ow-list" type="file" accept={LIST_TYPES} onChange={(e) => pick(e.target.files?.[0])} aria-describedby={fileError ? "ow-list-e" : "ow-list-h"} />
        <p className="hint" id="ow-list-h">
          A spreadsheet, PDF or photo, up to 10 MB. {list ? "Attached: " + list.fileName + "." : "Typed lines are quicker to quote than a photo of a handwritten list."}
        </p>
        {fileError ? (
          <p className="error-text" id="ow-list-e" role="alert">
            {fileError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- step 2: check your list ---------- */

function Review({ basket, list, onList, swaps, onSwaps, onBack, onNext, headRef }: { basket: BasketLine[]; list?: FileMeta; onList: (f?: FileMeta) => void; swaps: boolean; onSwaps: (on: boolean) => void; onBack: () => void; onNext: () => void; headRef: HeadRef }) {
  const groups = groupLines(basket);
  if (!basket.length && !list)
    return (
      <div className="card dv-empty">
        <h2 className="dv-h" tabIndex={-1} ref={headRef}>
          Your list is empty
        </h2>
        <p className="muted">Add at least one item, or attach your own list.</p>
        <button type="button" className="btn btn-sign" onClick={onBack}>
          Choose items
        </button>
      </div>
    );

  return (
    <div className="dv-review">
      <h2 className="dv-h" tabIndex={-1} ref={headRef}>
        Check your list
      </h2>
      <p className="dv-lead">
        {basket.length ? plural(basket.length, "item") + " in " + plural(groups.length, "group") + ". " : ""}Change a size or an amount, name a brand if it matters, or take a line off.
      </p>

      {groups.map((g) => (
        <section key={g.type.id} className="dv-group" aria-label={g.type.name}>
          <h3>
            {g.type.name} <span>{plural(g.lines.length, "item")}</span>
          </h3>
          <ul className="dv-lines">
            {g.lines.map((l) => (
              <ReviewRow key={l.key} l={l} />
            ))}
          </ul>
        </section>
      ))}

      {list ? (
        <div className="dv-attached">
          <span className="dv-thumb dv-thumb-own" aria-hidden="true">
            <Icon name="file" />
          </span>
          <div>
            <strong>Your own list is attached</strong>
            <span>{list.fileName + " · " + fileSize(list.size)}</span>
          </div>
          <button type="button" className="dl-remove" aria-label="Remove the attached list" onClick={() => onList(undefined)}>
            <Icon name="close" />
          </button>
        </div>
      ) : null}

      <fieldset className="kind-pick dv-swaps">
        <legend>If we are out of something</legend>
        <label className={"kind-option" + (swaps ? " is-on" : "")}>
          <input type="radio" name="dv-swaps" checked={swaps} onChange={() => onSwaps(true)} />
          <span>
            <strong>Offer a similar item</strong>
            <small>Same kind and size, another brand. The quotation shows every swap before you accept.</small>
          </span>
        </label>
        <label className={"kind-option" + (!swaps ? " is-on" : "")}>
          <input type="radio" name="dv-swaps" checked={!swaps} onChange={() => onSwaps(false)} />
          <span>
            <strong>Leave it off</strong>
            <small>Quote only what we have exactly as asked.</small>
          </span>
        </label>
      </fieldset>

      <div className="dv-nav">
        <button type="button" className="btn btn-outline" onClick={onBack}>
          Add more items
        </button>
        <button type="button" className="btn btn-sign" onClick={onNext}>
          Next: delivery and invoice
        </button>
      </div>
    </div>
  );
}

function ReviewRow({ l }: { l: BasketLine }) {
  const it = itemOfLine(l);
  const known = !!it?.sizes.some((s) => s.size === l.size);
  const id = "rv-" + l.key;
  const pick = it && (it.sizes.length > 1 || !known);
  return (
    <li className={"dv-line" + (pick ? "" : " no-size")}>
      <LineThumb line={l} />
      <div className="dv-line-name">
        <strong>{l.item}</strong>
        {pick ? null : <span>{describe(l)}</span>}
      </div>
      {pick ? (
        <div className="dv-line-size">
          <label htmlFor={id + "-s"}>Size</label>
          <select
            id={id + "-s"}
            value={l.size}
            onChange={(e) => {
              const s = it.sizes.find((x) => x.size === e.target.value);
              if (s) resizeLine(l.key, it, s);
            }}
          >
            {known ? null : <option value={l.size}>{l.size}</option>}
            {it.sizes.map((s) => (
              <option key={s.size} value={s.size}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="dv-line-brand">
        <label htmlFor={id + "-b"}>Brand</label>
        <input id={id + "-b"} type="text" value={l.brand} placeholder="Any brand" autoComplete="off" maxLength={60} onChange={(e) => patchLine(l.key, { brand: e.target.value })} />
      </div>
      <div className="dv-line-qty">
        <span className="dv-lbl" aria-hidden="true">
          How many
        </span>
        <Stepper value={l.qty} min={1} label={"How many: " + l.item + ", " + describe(l)} onChange={(n) => patchLine(l.key, { qty: n })} />
      </div>
      <button type="button" className="dl-remove dv-line-x" aria-label={"Take " + l.item + " off the list"} onClick={() => removeLine(l.key)}>
        <Icon name="close" />
      </button>
    </li>
  );
}

/* ---------- step 3: delivery and invoice ---------- */

type Errs = Partial<Record<"company" | "contact" | "phone" | "email" | "address" | "billAddress" | "billEmail", string>>;

function Details({ v, setV, basket, list, onBack, onSend, headRef }: { v: DetailsForm; setV: React.Dispatch<React.SetStateAction<DetailsForm>>; basket: BasketLine[]; list?: FileMeta; onBack: () => void; onSend: (billAddress: string) => void; headRef: HeadRef }) {
  const [errs, setErrs] = useState<Errs>({});
  const set = <K extends keyof DetailsForm>(key: K, val: DetailsForm[K]) => setV((p) => ({ ...p, [key]: val }));
  const groups = groupLines(basket);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!basket.length && !list) {
      toast("Your list is empty. Add at least one item, or attach your list.", "bad");
      return onBack();
    }
    const er: Errs = {};
    if (!v.company.trim()) er.company = "Enter your company’s name.";
    if (!v.contact.trim()) er.contact = "Enter the name of the person we should send the quotation to.";
    if (!v.phone.trim()) er.phone = "Enter a phone number, in case we need to check an item.";
    if (!EMAIL.test(v.email.trim())) er.email = "Enter the e-mail address the quotation should go to, like name@company.com.";
    if (v.fulfil === "delivery" && !(v.address || "").trim()) er.address = "Enter the delivery address.";
    const billAddress = v.billSame && v.fulfil === "delivery" ? (v.address || "").trim() : v.billAddress.trim();
    if (!billAddress && !er.address) er.billAddress = "Enter the address for the tax invoice.";
    if (v.billEmail.trim() && !EMAIL.test(v.billEmail.trim())) er.billEmail = "Check the accounts e-mail: it should look like accounts@company.com.";
    setErrs(er);
    const first = Object.keys(er)[0];
    if (first) {
      document.getElementById("dr-" + first)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    onSend(billAddress);
  }

  const bad = (f: keyof Errs) => (errs[f] ? { "aria-invalid": true as const, "aria-describedby": "dr-" + f + "-e" } : {});
  const err = (f: keyof Errs) => (errs[f] ? <p className="error-text" id={"dr-" + f + "-e"}>{errs[f]}</p> : null);

  return (
    <div className="dv-details">
      <form className="card request-form dl-form" onSubmit={submit} noValidate>
        <h2 className="dv-h" tabIndex={-1} ref={headRef}>
          Delivery and invoice
        </h2>

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
              <label htmlFor="dr-email">E-mail for the quotation</label>
              <input id="dr-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" {...bad("email")} />
              {err("email")}
            </div>
          </div>
        </fieldset>

        <fieldset className="kind-pick">
          <legend>Delivery or collection</legend>
          <label className={"kind-option" + (v.fulfil === "delivery" ? " is-on" : "")}>
            <input type="radio" name="dr-fulfil" checked={v.fulfil === "delivery"} onChange={() => set("fulfil", "delivery")} />
            <span>
              <strong>Deliver to us</strong>
              <small>A small fee by distance, shown on your quotation.</small>
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
                <small>To your accounts department. The terms are on your quotation.</small>
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
              Optional. We confirm the day on your quotation.
            </p>
          </div>
          <div className="field">
            <label htmlFor="dr-notes">Anything else</label>
            <textarea id="dr-notes" rows={2} value={v.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Who receives it, anything we should know" />
          </div>
        </div>

        <div className="dv-nav">
          <button type="button" className="btn btn-outline" onClick={onBack}>
            Back to my list
          </button>
          <button className="btn btn-sign" type="submit">
            Ask for my quote
          </button>
        </div>
        <p className="hint">
          No prices or payment on this website. We use these details only to quote, deliver and invoice this order (<a href="#terms-privacy">how we use your details</a>).
        </p>
      </form>

      <aside className="dv-cart dv-cart-brief" aria-label="Your list">
        <h3 className="dv-h3">
          Your list
          {basket.length ? <span className="dv-count">{basket.length}</span> : null}
        </h3>
        <ul>
          {groups.map((g) => (
            <li key={g.type.id} className="dv-brief">
              <div className="dv-brief-pics" aria-hidden="true">
                {g.lines.slice(0, 3).map((l) => (
                  <LineThumb key={l.key} line={l} />
                ))}
              </div>
              <div>
                <strong>{g.type.name}</strong>
                <span>{g.lines.map((l) => l.qty + " × " + l.item).join(", ")}</span>
              </div>
            </li>
          ))}
          {list ? (
            <li className="dv-brief">
              <div className="dv-brief-pics" aria-hidden="true">
                <span className="dv-thumb dv-thumb-own">
                  <Icon name="file" />
                </span>
              </div>
              <div>
                <strong>Your own list</strong>
                <span>{list.fileName}</span>
              </div>
            </li>
          ) : null}
        </ul>
        <button type="button" className="btn btn-outline btn-sm" onClick={onBack}>
          Change my list
        </button>
      </aside>
    </div>
  );
}

/* ---------- sent ---------- */

function Sent({ done, headRef, onAgain }: { done: { ref: string; lines: BasketLine[]; list?: FileMeta }; headRef: HeadRef; onAgain: () => void }) {
  return (
    <div className="card request-done dv-sent" role="status">
      <span className="done-tick" aria-hidden="true">
        <Icon name="check" />
      </span>
      <h2 tabIndex={-1} ref={headRef}>
        Thank you. Your list is with our Couva store.
      </h2>
      <p>
        Your reference is <strong className="request-ref">{done.ref}</strong>. Quote it on your purchase order.
      </p>
      <p className="muted">
        We reply with a priced quotation within one working day. Follow it, accept it and print it under <a href="#track">Your order</a> with {done.ref} and your e-mail address. In this prototype nothing is sent: the acknowledgement is in the demo outbox, and the list is now in the staff portal’s Deliveries.
      </p>
      {done.lines.length ? (
        <ul className="dv-sent-lines" aria-label="What you asked for">
          {done.lines.map((l) => (
            <li key={l.key}>
              <LineThumb line={l} />
              <span>{l.qty + " × " + l.item}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {done.list ? <p className="muted">{"Attached: " + done.list.fileName}</p> : null}
      <div className="cluster">
        <button className="btn btn-outline" type="button" onClick={onAgain}>
          Start another list
        </button>
        <Link className="link-btn" href="/outbox">
          See the acknowledgement
        </Link>
      </div>
    </div>
  );
}
