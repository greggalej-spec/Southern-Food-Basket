"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { OfferPreview } from "@/components/admin/offer-preview";
import { useConfirm } from "@/components/confirm";
import { toast } from "@/components/ui/sonner";
import { scopeOf } from "@/lib/access";
import { attempt, inScope, scopeNote } from "@/lib/admin/guard";
import { describedBy, firstError, photoSrc, stemOf, type Errors } from "@/lib/admin/helpers";
import {
  KIND_LABEL,
  PROMO_FIELDS,
  blankPromo,
  checkPromo,
  claimedCount,
  draftOf,
  valuesOf,
  type PromoField,
  type PromoValues,
} from "@/lib/admin/promo-admin";
import { PROMO_STATE, promoState, savePromo, submitPromo } from "@/lib/promo";
import { byId, useData, useSession } from "@/lib/store";

// The offer composer (promos.draft): the fields of PRD 9.2, a live preview of the public card, and Save draft or
// Save and send for approval. Editing an offer that was approved, or is waiting for approval, sends it back to draft
// (savePromo does that); the composer says so before saving.

const FIELD_ID: Record<PromoField, string> = {
  title: "pf-title",
  benefit: "pf-benefit",
  summary: "pf-summary",
  terms: "pf-term-0",
  alt: "pf-alt",
  stores: "pf-all-stores",
  starts: "pf-starts",
  ends: "pf-ends",
  perCustomer: "pf-per",
  total: "pf-total",
};
const MAX_TERMS = 8;

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <p className="error-text" id={id} hidden={!msg}>
      {msg || ""}
    </p>
  );
}

export function PromoComposer({ editId, seq, onSaved, onNew }: { editId: string | null; seq: number; onSaved: (id: string) => void; onNew: () => void }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const scope = scopeOf(d, s);
  const cur = editId ? byId(d.promotions, editId) : null;
  const init = () => (cur ? valuesOf(cur) : blankPromo(scope));
  const key = (editId || "new") + ":" + seq;
  const [loaded, setLoaded] = useState(key);
  const [v, setV] = useState<PromoValues>(init);
  const [errors, setErrors] = useState<Errors<PromoField>>({});
  // The live re-check while typing measures dates against when the composer opened; Save checks against the clock.
  const [openedAt] = useState(() => Date.now());
  if (key !== loaded) {
    // A different offer was opened (or the same one reloaded after a save): start from its saved values.
    setLoaded(key);
    setV(init());
    setErrors({});
  }

  const state = cur ? promoState(d, cur) : null;
  const outside = cur && !inScope(d, s, cur.branchIds);
  const photos = Array.from(new Map((d.specials || []).map((sp) => [stemOf(sp.img), sp] as const)).values());

  function set<K extends keyof PromoValues>(name: K, value: PromoValues[K]) {
    const next = { ...v, [name]: value };
    setV(next);
    const touched = (Object.keys(errors) as PromoField[]).filter((k) => errors[k]);
    if (touched.length) {
      const e = checkPromo(next, scope, cur ? claimedCount(d, cur.id) : 0, openedAt);
      setErrors(Object.fromEntries(touched.map((k) => [k, e[k]])) as Errors<PromoField>);
    }
  }

  function pickPhoto(stem: string) {
    const sp = photos.find((x) => stemOf(x.img) === stem);
    // Start the description from the special's own, so the field is rarely left empty.
    const next = { ...v, img: stem, alt: stem && !v.alt.trim() ? sp?.alt || sp?.name || "" : stem ? v.alt : "" };
    setV(next);
  }

  function toggleStore(id: string, on: boolean) {
    set("branchIds", on ? [...v.branchIds, id] : v.branchIds.filter((x) => x !== id));
  }

  async function save(send: boolean) {
    const errs = checkPromo(v, scope, cur ? claimedCount(d, cur.id) : 0, Date.now());
    flushSync(() => setErrors(errs));
    const first = firstError(PROMO_FIELDS, errs);
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    if (cur && cur.status === "approved") {
      const ok = await confirm({
        title: "Send " + cur.title + " back to draft?",
        body:
          "It is approved and " + PROMO_STATE[state || "scheduled"].label.toLowerCase() + ". Saving a change takes it off the Offers page, and codes shoppers already hold stop working at the till, until the owner’s office approves it again.",
        okLabel: send ? "Save and send for approval" : "Save as a draft",
      });
      if (!ok) return;
    }
    const r = attempt(s, cur ? "promo.edit" : "promo.create", v.title.trim() || "New offer", () => {
      const id = savePromo(s, editId, draftOf(v, cur?.slug || ""));
      if (send) submitPromo(s, id);
      return id;
    });
    if (!r.ok) {
      toast(r.message, "bad");
      return;
    }
    toast(send ? "Sent for approval. It shows on the owner’s office Today page." : "Saved as a draft. Shoppers see nothing until it is approved and its start time comes.", "ok");
    onSaved(r.value);
  }

  if (outside) {
    return (
      <section className="panel" aria-labelledby="pc-h" data-tour="promo-composer">
        <div className="panel-head">
          <h2 id="pc-h">{"Edit " + cur.title}</h2>
        </div>
        <div className="panel-body">
          <p>{scopeNote(d, s) + " This offer runs at other stores too, so someone with every store changes it."}</p>
          <button className="btn btn-ghost" type="button" onClick={onNew}>
            Start a new offer instead
          </button>
        </div>
      </section>
    );
  }

  const fid = (k: string) => "pf-" + k;
  const bad = (k: PromoField) => (errors[k] ? ("true" as const) : undefined);

  return (
    <section className="panel" aria-labelledby="pc-h" data-tour="promo-composer" id="promo-composer">
      <div className="panel-head">
        <h2 id="pc-h">{cur ? "Edit " + cur.title : "New offer"}</h2>
        {cur ? (
          <button className="link-btn" type="button" onClick={onNew}>
            Start a new offer instead
          </button>
        ) : null}
      </div>
      <div className="panel-body composer">
        <form
          className="composer-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
        >
          {cur && cur.status === "approved" ? (
            <div className="alert alert-warn">
              <p>
                {"This offer is approved and " + PROMO_STATE[state || "scheduled"].label.toLowerCase() + ". Saving a change sends it back to draft: it comes off the Offers page and its codes stop working at the till until it is approved again."}
              </p>
            </div>
          ) : cur && cur.status === "review" ? (
            <div className="alert alert-info">
              <p>This offer is waiting for approval. Saving a change takes it back to draft; send it again when you are done.</p>
            </div>
          ) : cur && cur.status === "rejected" && cur.reviewNote ? (
            <div className="alert alert-bad">
              <p>
                <strong>The owner’s office sent it back: </strong>
                {cur.reviewNote}
              </p>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor={fid("title")}>Name of the offer</label>
            <input id={fid("title")} type="text" maxLength={80} autoComplete="off" value={v.title} onChange={(e) => set("title", e.target.value)} aria-invalid={bad("title")} aria-describedby={describedBy(null, fid("title-err"), errors.title)} />
            <Err id={fid("title-err")} msg={errors.title} />
          </div>
          <div className="field">
            <label htmlFor={fid("benefit")}>What the shopper gets</label>
            <input
              id={fid("benefit")}
              type="text"
              maxLength={100}
              autoComplete="off"
              value={v.benefit}
              onChange={(e) => set("benefit", e.target.value)}
              aria-invalid={bad("benefit")}
              aria-describedby={describedBy(fid("benefit-hint"), fid("benefit-err"), errors.benefit)}
            />
            <p className="hint" id={fid("benefit-hint")}>
              One line, with the amount in TT$, for example “TT$15 off any 9-inch double-layer cake”.
            </p>
            <Err id={fid("benefit-err")} msg={errors.benefit} />
          </div>
          <div className="field">
            <label htmlFor={fid("summary")}>Summary</label>
            <textarea id={fid("summary")} rows={2} maxLength={200} value={v.summary} onChange={(e) => set("summary", e.target.value)} aria-invalid={bad("summary")} aria-describedby={describedBy(fid("summary-hint"), fid("summary-err"), errors.summary)} />
            <p className="hint" id={fid("summary-hint")}>
              Who it is for and where, in a sentence.
            </p>
            <Err id={fid("summary-err")} msg={errors.summary} />
          </div>

          <fieldset className="terms-set">
            <legend>Terms</legend>
            {v.terms.map((t, i) => (
              <div className="term-row" key={i}>
                <label className="visually-hidden" htmlFor={"pf-term-" + i}>
                  {"Term " + (i + 1)}
                </label>
                <input
                  id={"pf-term-" + i}
                  type="text"
                  maxLength={160}
                  autoComplete="off"
                  value={t}
                  onChange={(e) => set("terms", v.terms.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-invalid={i === 0 ? bad("terms") : undefined}
                  aria-describedby={i === 0 ? describedBy(null, fid("terms-err"), errors.terms) : undefined}
                />
                {v.terms.length > 1 ? (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => set("terms", v.terms.filter((_, j) => j !== i))}>
                    Remove<span className="visually-hidden">{" term " + (i + 1)}</span>
                  </button>
                ) : null}
              </div>
            ))}
            <Err id={fid("terms-err")} msg={errors.terms} />
            {v.terms.length < MAX_TERMS ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => set("terms", [...v.terms, ""])}>
                Add a term
              </button>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Kind of offer</legend>
            {(Object.keys(KIND_LABEL) as PromoValues["kind"][]).map((k) => (
              <label className="check" key={k}>
                <input type="radio" name="pf-kind" value={k} checked={v.kind === k} onChange={() => set("kind", k)} />
                <span>{KIND_LABEL[k]}</span>
              </label>
            ))}
            <p className="hint">Both work the same way: a signed-in shopper claims a code and shows it at the till. A flash sale is labelled as one on the Offers page, and is usually a few days long.</p>
          </fieldset>

          <div className="field">
            <label htmlFor={fid("img")}>Photo</label>
            <div className="photo-pick">
              <select id={fid("img")} value={v.img} onChange={(e) => pickPhoto(e.target.value)}>
                <option value="">No photo</option>
                {photos.map((sp) => (
                  <option key={sp.id} value={stemOf(sp.img)}>
                    {sp.name}
                  </option>
                ))}
              </select>
              {v.img ? <img className="admin-thumb" src={photoSrc(v.img)} alt="" width={64} height={64} /> : null}
            </div>
            <p className="hint">From the photos already used for specials.</p>
          </div>
          {v.img ? (
            <div className="field">
              <label htmlFor={fid("alt")}>Describe the photo</label>
              <input id={fid("alt")} type="text" maxLength={140} autoComplete="off" value={v.alt} onChange={(e) => set("alt", e.target.value)} aria-invalid={bad("alt")} aria-describedby={describedBy(fid("alt-hint"), fid("alt-err"), errors.alt)} />
              <p className="hint" id={fid("alt-hint")}>
                For people using screen readers, for example “Red velvet cake on a stand”.
              </p>
              <Err id={fid("alt-err")} msg={errors.alt} />
            </div>
          ) : null}

          <fieldset aria-describedby={describedBy(scope ? fid("stores-hint") : null, fid("stores-err"), errors.stores)}>
            <legend>Stores</legend>
            <label className="check">
              <input id={fid("all-stores")} type="checkbox" checked={v.allStores} disabled={!!scope} onChange={(e) => set("allStores", e.target.checked)} aria-invalid={bad("stores")} />
              <span>Every store</span>
            </label>
            <div className="check-grid">
              {(d.branches || []).map((b) => (
                <label className="check" key={b.id}>
                  <input type="checkbox" checked={v.allStores || v.branchIds.includes(b.id)} disabled={v.allStores || (!!scope && !scope.includes(b.id))} onChange={(e) => toggleStore(b.id, e.target.checked)} />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
            {scope ? (
              <p className="hint" id={fid("stores-hint")}>
                {scopeNote(d, s)}
              </p>
            ) : null}
            <Err id={fid("stores-err")} msg={errors.stores} />
          </fieldset>

          <div className="form-row">
            <div className="field">
              <label htmlFor={fid("starts")}>Starts</label>
              <input id={fid("starts")} type="datetime-local" value={v.starts} onChange={(e) => set("starts", e.target.value)} aria-invalid={bad("starts")} aria-describedby={describedBy(fid("time-hint"), fid("starts-err"), errors.starts)} />
              <Err id={fid("starts-err")} msg={errors.starts} />
            </div>
            <div className="field">
              <label htmlFor={fid("ends")}>Ends</label>
              <input id={fid("ends")} type="datetime-local" value={v.ends} onChange={(e) => set("ends", e.target.value)} aria-invalid={bad("ends")} aria-describedby={describedBy(fid("time-hint"), fid("ends-err"), errors.ends)} />
              <Err id={fid("ends-err")} msg={errors.ends} />
            </div>
          </div>
          <p className="hint field-note" id={fid("time-hint")}>
            Trinidad time, whatever this computer’s clock is set to.
          </p>

          <div className="form-row">
            <div className="field">
              <label htmlFor={fid("per")}>Codes per shopper</label>
              <input id={fid("per")} type="number" inputMode="numeric" min={1} max={10} value={v.perCustomer} onChange={(e) => set("perCustomer", e.target.value)} aria-invalid={bad("perCustomer")} aria-describedby={describedBy(null, fid("per-err"), errors.perCustomer)} />
              <Err id={fid("per-err")} msg={errors.perCustomer} />
            </div>
            <div className="field">
              <label htmlFor={fid("total")}>Codes in all</label>
              <input id={fid("total")} type="number" inputMode="numeric" min={1} value={v.total} onChange={(e) => set("total", e.target.value)} aria-invalid={bad("total")} aria-describedby={describedBy(fid("total-hint"), fid("total-err"), errors.total)} />
              <p className="hint" id={fid("total-hint")}>
                Leave empty for no limit. When they are all claimed, the offer shows as full.
              </p>
              <Err id={fid("total-err")} msg={errors.total} />
            </div>
          </div>

          <div className="cluster composer-actions">
            <button className="btn btn-primary" type="submit">
              Save draft
            </button>
            <button className="btn btn-outline" type="button" onClick={() => save(true)}>
              Save and send for approval
            </button>
          </div>
          <p className="hint">Someone in the owner’s office approves it. The person who drafted an offer cannot approve it.</p>
        </form>
        <div className="composer-preview">
          <OfferPreview d={d} v={v} />
        </div>
      </div>
    </section>
  );
}
