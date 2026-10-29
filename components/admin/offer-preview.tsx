"use client";

import { Icon } from "@/components/icon";
import { photoSrc } from "@/lib/admin/helpers";
import { KIND_LABEL, type PromoValues } from "@/lib/admin/promo-admin";
import { fromTtInput } from "@/lib/admin/tt";
import { fmtTT, storesLabel } from "@/lib/promo";
import type { Seed } from "@/lib/types";

// The composer's live preview: the offer as a shopper sees it on the Offers page, built from the form as typed.
// Empty fields show what goes there, in the muted colour, so the card keeps its shape while it is being written.

export function OfferPreview({ d, v }: { d: Seed; v: PromoValues }) {
  const starts = fromTtInput(v.starts), ends = fromTtInput(v.ends);
  const terms = v.terms.map((t) => t.trim()).filter(Boolean);
  const dates = starts && ends ? fmtTT(starts) + " to " + fmtTT(ends) : "Dates not set";
  const stores = v.allStores ? null : v.branchIds;
  return (
    <figure className="offer-preview">
      <figcaption className="preview-label">How shoppers will see it</figcaption>
      <article className="deal offer-card">
        {v.img ? (
          <div className="deal-photo">
            <img src={photoSrc(v.img)} alt={v.alt.trim()} width={600} height={500} decoding="async" />
          </div>
        ) : null}
        <div className="deal-body">
          <p className="deal-dept">{KIND_LABEL[v.kind]}</p>
          <h3 className={"deal-name" + (v.title.trim() ? "" : " is-blank")}>{v.title.trim() || "The offer’s name"}</h3>
          <p className={"offer-benefit" + (v.benefit.trim() ? "" : " is-blank")}>{v.benefit.trim() || "What the shopper gets"}</p>
          {v.summary.trim() ? <p className="offer-summary">{v.summary.trim()}</p> : null}
          <p className="deal-meta">
            <Icon name="pin" />
            {stores && !stores.length ? "No store chosen" : storesLabel(d, stores)}
          </p>
          <p className="deal-meta">
            <Icon name="calendar" />
            {dates}
          </p>
          {terms.length ? (
            <ul className="offer-terms">
              {terms.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
          <span className="btn btn-sign btn-sm offer-cta" aria-hidden="true">
            Get my code
          </span>
        </div>
      </article>
    </figure>
  );
}
