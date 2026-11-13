"use client";

import { useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/icon";
import { PriceSeal } from "@/components/price-seal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import {
  DEAL_FIELDS,
  checkDeal,
  dept,
  describedBy,
  dollars,
  firstError,
  isDay,
  photoLabel,
  photoLibrary,
  photoSrc,
  readDeal,
  retailDepts,
  stemOf,
  todayIso,
  type DealField,
  type DealValues,
  type Errors,
} from "@/lib/admin/helpers";
import { attempt } from "@/lib/admin/guard";
import { saveDeal } from "@/lib/admin/writes";
import { fmtDate } from "@/lib/format";
import { byId, load, useData, useSession } from "@/lib/store";
import type { Seed, Special } from "@/lib/types";

// The deal drawer from admin.js (openDealDrawer, closeDrawer): edit or add a deal, with a live preview of the
// public card. Base UI's Sheet supplies the backdrop, the focus trap, Escape and the scroll lock.

/* the public deal card, same markup as site.js dealCard (name as <p> so the preview adds no heading) */
function PreviewCard({ d, sp }: { d: Seed; sp: Omit<Special, "id"> }) {
  const price = isFinite(sp.price) && sp.price > 0 ? sp.price : 0;
  return (
    <article className="deal">
      <figure className="deal-photo">
        <img src={photoSrc(sp.img)} alt={sp.alt || sp.name} width={800} height={667} decoding="async" />
        {sp.isNew ? (
          <span className="new-corner" aria-hidden="true">
            NEW
          </span>
        ) : null}
        <PriceSeal price={price} />
      </figure>
      <div className="deal-body">
        <p className="deal-dept">{dept(d, sp.dept).short}</p>
        <p className="deal-name">{sp.name || "Deal name"}</p>
        <p className="deal-price" aria-hidden="true">
          <span className="qty">1 FOR</span>
          <span className="amt">{dollars(price)}</span>
        </p>
        <p className="deal-meta">
          <span>{"Posted " + fmtDate(sp.posted)}</span>
          {sp.couva ? (
            <span className="couva">
              <Icon name="pin" />
              Couva
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}

function ErrorText({ id, msg }: { id: string; msg?: string }) {
  return (
    <p className="error-text" id={id} hidden={!msg}>
      {msg || ""}
    </p>
  );
}

function DealForm({
  id,
  defaultDept,
  titleRef,
  nameRef,
  onClose,
  onSaved,
  onRemove,
}: {
  id: string | null;
  defaultDept: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
  nameRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSaved: (id: string) => void;
  onRemove: (id: string, opener: HTMLElement) => void;
}) {
  const d = useData();
  const s = useSession();
  // The form is filled once, from the data as it is when the drawer opens.
  const [init] = useState(() => {
    const d0 = load();
    const sp = id ? byId(d0.specials, id) : null;
    const depts = retailDepts(d0), lib = photoLibrary(d0);
    const v: DealValues = sp
      ? { name: sp.name, dept: sp.dept, price: Number(sp.price).toFixed(2), posted: sp.posted, to: sp.to || "", img: stemOf(sp.img), isNew: !!sp.isNew, couva: !!sp.couva, alt: sp.alt || "" }
      : { name: "", dept: defaultDept !== "all" ? defaultDept : depts[0]?.id || "", price: "", posted: todayIso(), to: "", img: "", isNew: false, couva: false, alt: "" };
    /* a new deal starts with its department's own photo */
    if (!sp) {
      const st = stemOf(byId(depts, v.dept)?.img);
      v.img = lib.includes(st) ? st : lib[0] || "";
    }
    v.alt = v.alt || v.name;
    return { sp, depts, lib, v, altTouched: !!(sp && sp.alt && sp.alt !== sp.name) };
  });
  const [v, setV] = useState(init.v);
  const [errors, setErrors] = useState<Errors<DealField>>({});
  const altTouched = useRef(init.altTouched);
  const formRef = useRef<HTMLFormElement>(null);
  const sp = init.sp;

  function change<K extends keyof DealValues>(key: K, value: DealValues[K]) {
    let next: DealValues = { ...v, [key]: value };
    const recheck: DealField[] = [];
    if (key === "name" && !altTouched.current) {
      next = { ...next, alt: next.name };
      recheck.push("alt");
    }
    if (key === "alt") altTouched.current = next.alt.trim() !== "";
    if ((DEAL_FIELDS as readonly string[]).includes(key)) recheck.push(key as DealField);
    setV(next);
    /* once a field has been marked invalid, re-check it as the user types */
    if (recheck.some((f) => errors[f])) {
      const e = checkDeal(next, init.lib);
      setErrors((prev) => {
        const out = { ...prev };
        recheck.forEach((f) => {
          if (prev[f]) out[f] = e[f];
        });
        return out;
      });
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = checkDeal(v, init.lib);
    flushSync(() => setErrors(errs));
    const first = firstError(DEAL_FIELDS, errs);
    if (first) {
      (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    const rec = readDeal(v);
    const r = attempt(s, sp ? "specials.edit" : "specials.add", rec.name, () => saveDeal(s, sp ? sp.id : null, rec));
    if (!r.ok) {
      toast(r.message, "bad");
      return;
    }
    onSaved(r.value);
  }

  const r = readDeal(v);
  const preview = { name: r.name, dept: r.dept, price: r.price, posted: isDay(r.posted) ? r.posted : "", img: r.img, isNew: r.isNew, couva: r.couva, alt: r.alt };

  return (
    <>
      <div className="drawer-head">
        <div>
          <SheetTitle id="drawer-title" tabIndex={-1} ref={titleRef}>
            {sp ? "Edit deal" : "Add a deal"}
          </SheetTitle>
          <p className="drawer-sub">{sp ? "Changes show on the Specials page when you save." : "The new deal goes to the top of the Specials page when you save."}</p>
        </div>
        <button className="icon-btn" type="button" id="drawer-close" aria-label="Close without saving" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="drawer-body">
        <div className="deal-preview" aria-hidden="true">
          <p className="preview-label">Preview, as shoppers see it</p>
          <div id="dp-card">
            <PreviewCard d={d} sp={preview} />
          </div>
        </div>
        <form id="deal-form" noValidate ref={formRef} onSubmit={submit}>
          <div className="field">
            <label htmlFor="df-name">Deal name</label>
            <input
              type="text"
              id="df-name"
              name="name"
              maxLength={90}
              autoComplete="off"
              ref={nameRef}
              value={v.name}
              onChange={(e) => change("name", e.target.value)}
              aria-invalid={errors.name ? "true" : undefined}
              aria-describedby={describedBy("df-name-hint", "df-name-err", errors.name)}
            />
            <p className="hint" id="df-name-hint">
              As it appears on the card, for example “Chunky veg pack”.
            </p>
            <ErrorText id="df-name-err" msg={errors.name} />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="df-dept">Department</label>
              <select id="df-dept" name="dept" value={v.dept} onChange={(e) => change("dept", e.target.value)}>
                {init.depts.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="df-price">Price in TTD</label>
              <input
                type="number"
                id="df-price"
                name="price"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={v.price}
                onChange={(e) => change("price", e.target.value)}
                aria-invalid={errors.price ? "true" : undefined}
                aria-describedby={describedBy("df-price-hint", "df-price-err", errors.price)}
              />
              <p className="hint" id="df-price-hint">
                For one item, for example 24.95.
              </p>
              <ErrorText id="df-price-err" msg={errors.price} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="df-posted">Starts</label>
              <input
                type="date"
                id="df-posted"
                name="posted"
                value={v.posted}
                onChange={(e) => change("posted", e.target.value)}
                aria-invalid={errors.posted ? "true" : undefined}
                aria-describedby={describedBy("df-posted-hint", "df-posted-err", errors.posted)}
              />
              <p className="hint" id="df-posted-hint">
                A date ahead schedules it.
              </p>
              <ErrorText id="df-posted-err" msg={errors.posted} />
            </div>
            <div className="field">
              <label htmlFor="df-to">Ends</label>
              <input
                type="date"
                id="df-to"
                name="to"
                value={v.to}
                min={v.posted}
                onChange={(e) => change("to", e.target.value)}
                aria-invalid={errors.to ? "true" : undefined}
                aria-describedby={describedBy("df-to-hint", "df-to-err", errors.to)}
              />
              <p className="hint" id="df-to-hint">
                Empty: runs until you end it.
              </p>
              <ErrorText id="df-to-err" msg={errors.to} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="df-img">Photo</label>
            <div className="photo-pick">
              <select
                id="df-img"
                name="img"
                value={v.img}
                onChange={(e) => change("img", e.target.value)}
                aria-invalid={errors.img ? "true" : undefined}
                aria-describedby={describedBy("df-img-hint", "df-img-err", errors.img)}
              >
                {init.lib.map((st) => (
                  <option key={st} value={st}>
                    {photoLabel(st)}
                  </option>
                ))}
              </select>
              <img className="admin-thumb" id="df-img-thumb" src={photoSrc(r.img)} alt="" width={64} height={64} decoding="async" />
            </div>
            <p className="hint" id="df-img-hint">
              Pick from the store’s photo library. New photos are added by the web team.
            </p>
            <ErrorText id="df-img-err" msg={errors.img} />
          </div>
          <fieldset>
            <legend>Labels on the photo</legend>
            <label className="check" htmlFor="df-new">
              <input type="checkbox" id="df-new" name="isNew" checked={v.isNew} onChange={(e) => change("isNew", e.target.checked)} />
              <span>
                Marked new <span className="muted">(red NEW corner)</span>
              </span>
            </label>
            <label className="check" htmlFor="df-couva">
              <input type="checkbox" id="df-couva" name="couva" checked={v.couva} onChange={(e) => change("couva", e.target.checked)} />
              <span>
                Tagged Couva <span className="muted">(Couva pin under the name)</span>
              </span>
            </label>
          </fieldset>
          <div className="field">
            <label htmlFor="df-alt">Photo description (alt text)</label>
            <textarea
              id="df-alt"
              name="alt"
              rows={3}
              maxLength={200}
              value={v.alt}
              onChange={(e) => change("alt", e.target.value)}
              aria-invalid={errors.alt ? "true" : undefined}
              aria-describedby={describedBy("df-alt-hint", "df-alt-err", errors.alt)}
            />
            <p className="hint" id="df-alt-hint">
              Read aloud to people who use screen readers. Say what the photo shows.
            </p>
            <ErrorText id="df-alt-err" msg={errors.alt} />
          </div>
        </form>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-primary" type="submit" form="deal-form">
          Save deal
        </button>
        <button className="btn btn-ghost" type="button" data-close="" onClick={onClose}>
          Cancel
        </button>
        {sp ? (
          <>
            <span className="spacer" aria-hidden="true"></span>
            <button className="btn btn-ghost" type="button" data-remove-drawer="" onClick={(e) => onRemove(sp.id, e.currentTarget)}>
              Remove deal
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}

// A confirm opened from the drawer takes Escape first, as admin.js left it to the open <dialog>.
const confirmOpen = () => !!document.querySelector('[data-slot="dialog-content"]:not([data-ending-style])');

export function DealDrawer({
  open,
  req,
  defaultDept,
  onClose,
  returnFocus,
  onSaved,
  onRemove,
}: {
  open: boolean;
  req: { seq: number; id: string | null } | null;
  defaultDept: string;
  onClose: () => void;
  returnFocus: () => HTMLElement | false;
  onSaved: (id: string) => void;
  onRemove: (id: string, opener: HTMLElement) => void;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        if (details.reason === "escape-key" && (details.event.defaultPrevented || confirmOpen())) {
          details.cancel();
          return;
        }
        onClose();
      }}
    >
      {/* adding: straight into the name field; editing: the title, so the phone keyboard does not cover the preview */}
      <SheetContent render={<aside />} id="drawer" aria-modal="true" initialFocus={req?.id ? titleRef : nameRef} finalFocus={returnFocus}>
        {req ? (
          <DealForm key={req.seq} id={req.id} defaultDept={defaultDept} titleRef={titleRef} nameRef={nameRef} onClose={onClose} onSaved={onSaved} onRemove={onRemove} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
