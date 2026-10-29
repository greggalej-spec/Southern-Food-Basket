"use client";

import { photoSrc } from "@/lib/admin/helpers";
import { storeNames } from "@/lib/admin/guard";
import type { CampaignValues } from "@/lib/admin/campaign-admin";
import { money } from "@/lib/format";
import { TOPICS } from "@/lib/newsletter";
import { fmtTT, storesLabel } from "@/lib/promo";
import { byId } from "@/lib/store";
import type { Seed } from "@/lib/types";

// The newsletter as a subscriber would get it: the inbox line, the brand header, the opening, the specials with their
// prices, the offer, and the footer that says why they get it and how to stop. In the real e-mail the two footer
// links carry the subscriber's own token (lib/newsletter.ts deliver()); here they are shown, not linked.

export function whyLine(d: Seed, v: Pick<CampaignValues, "allStores" | "branches" | "topics">) {
  const topics = TOPICS.filter((t) => v.topics.includes(t.id)).map((t) => t.label.charAt(0).toLowerCase() + t.label.slice(1));
  const what = topics.length ? topics.join(" or ") : "e-mails from us";
  const where = v.allStores || !v.branches.length ? "" : " at " + storeNames(d, v.branches);
  return "You get this because you signed up for Southern Food Basket’s e-mails, confirmed your address, and asked for " + what + where + ".";
}

export function EmailPreview({ d, v }: { d: Seed; v: CampaignValues }) {
  const specials = v.specialIds.map((id) => byId(d.specials, id)).filter((x) => !!x);
  const offer = v.promoId ? byId(d.promotions, v.promoId) : null;
  const paras = v.intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <figure className="email-preview">
      <figcaption className="preview-label">The e-mail, as subscribers get it</figcaption>
      <div className="email-inbox">
        <span className="email-from">Southern Food Basket</span>
        <strong className={v.subject.trim() ? "" : "is-blank"}>{v.subject.trim() || "Subject line"}</strong>
        <span className="email-pre">{v.preheader.trim() || "The preview line shows here in most inboxes."}</span>
      </div>
      <div className="email">
        <div className="email-brand">
          <img src="/assets/img/sfb-mark.svg" alt="" width={36} height={36} />
          <span>Southern Food Basket</span>
        </div>
        <div className="email-body">
          {paras.length ? paras.map((p, i) => <p key={i}>{p}</p>) : <p className="is-blank">Your opening lines show here.</p>}
          {specials.length ? (
            <>
              <h4>This week’s specials</h4>
              <ul className="email-specials">
                {specials.map((sp) => (
                  <li key={sp.id}>
                    <img src={photoSrc(sp.img)} alt={sp.alt || ""} width={56} height={56} loading="lazy" decoding="async" />
                    <span className="grow">{sp.name}</span>
                    <strong className="num">{money(sp.price)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {offer ? (
            <div className="email-offer">
              <p className="deal-dept">Members’ offer</p>
              <strong>{offer.title}</strong>
              <p>{offer.benefit}</p>
              <p className="small">{fmtTT(offer.starts) + " to " + fmtTT(offer.ends) + " · " + storesLabel(d, offer.branchIds)}</p>
              <span className="btn btn-sign btn-sm" aria-hidden="true">
                Get my code
              </span>
            </div>
          ) : null}
        </div>
        <div className="email-foot">
          <p>{whyLine(d, v)}</p>
          <p>
            <span className="email-link">Change what you get</span>
            {" · "}
            <span className="email-link">Unsubscribe</span>
          </p>
          {specials.length && d.settings?.dealsNote ? <p>{d.settings.dealsNote}</p> : null}
        </div>
      </div>
    </figure>
  );
}
