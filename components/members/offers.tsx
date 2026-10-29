"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CodeTicket, ticketFor } from "@/components/members/code-ticket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currentCustomer, useShopperTier, walletFor } from "@/lib/account";
import { isStaff } from "@/lib/access";
import { claimCode, fmtTT, promoBySlug, promoState, promoStats, publicPromos, storesLabel, type PromoState } from "@/lib/promo";
import { useData, useHydrated, useSession } from "@/lib/store";
import type { Promotion, Seed } from "@/lib/types";

// The shopper side of members' offers (PRD 9.1 and 9.2): the list at /offers and one offer at /offers/<slug>, with
// the panel that hands out a code. Everything here reads the clock (has the offer started, ended, run out?), so it
// renders after hydration; the prerendered page carries only the frame. That also keeps a scheduled or draft
// promotion out of the HTML: publicPromos() only ever returns offers that have started.

type PublicState = Extract<PromoState, "live" | "full" | "ended">;

const PUBLIC_STATE: Record<PublicState, { label: string; variant: "ok" | "warn" | "neutral" }> = {
  live: { label: "On now", variant: "ok" },
  full: { label: "All codes taken", variant: "warn" },
  ended: { label: "Ended", variant: "neutral" },
};

const ORDER: Record<PublicState, number> = { live: 0, full: 1, ended: 2 };
const time = (iso: string) => new Date(iso).getTime();

function asPublic(s: PromoState): PublicState {
  return s === "live" || s === "full" ? s : "ended";
}

function StateBadge({ state }: { state: PublicState }) {
  const st = PUBLIC_STATE[state];
  return <Badge variant={st.variant}>{st.label}</Badge>;
}

function photo(p: Promotion) {
  return "/assets/img/photos/" + p.img + ".webp";
}

/** "Until 15 Nov 2026", or when it ended. */
function dateLine(p: Promotion, state: PublicState) {
  return state === "ended" ? "Ended " + fmtTT(p.ends) : "Until " + fmtTT(p.ends);
}

/** "Only 12 codes left": shown only while it helps, when the offer is live and close to running out. */
function leftLine(d: Seed, p: Promotion, state: PublicState) {
  if (state !== "live" || p.limits.total === null) return null;
  const left = promoStats(d, p).left;
  if (left === null || left > Math.max(20, Math.round(p.limits.total * 0.1))) return null;
  return "Only " + left + (left === 1 ? " code" : " codes") + " left.";
}

/* ---------- /offers ---------- */

export function OffersList() {
  const d = useData();
  const hydrated = useHydrated();
  if (!hydrated) return <div className="offer-list-wait" aria-busy="true" data-tour="offers-list" />;

  const now = new Date();
  const list = publicPromos(d, now)
    .map((p) => ({ p, state: asPublic(promoState(d, p, now)) }))
    .sort((a, b) => ORDER[a.state] - ORDER[b.state] || (a.state === "ended" ? time(b.p.ends) - time(a.p.ends) : time(a.p.ends) - time(b.p.ends)));

  if (!list.length) {
    return (
      <div className="empty" data-tour="offers-list">
        <p>No members’ offers are running right now. New ones go up here first, and in the weekly e-mail.</p>
        <Link className="btn btn-outline btn-sm" href="/specials#newsletter">
          Get the weekly e-mail
        </Link>
      </div>
    );
  }

  return (
    <ul className="offer-list" data-tour="offers-list">
      {list.map(({ p, state }) => {
        const href = "/offers/" + encodeURIComponent(p.slug);
        const left = leftLine(d, p, state);
        return (
          <li key={p.id}>
            <article className={"offer-card" + (state === "ended" ? " is-ended" : "") + (p.img ? "" : " no-photo")}>
              {p.img ? (
                <figure className="offer-photo">
                  <img src={photo(p)} alt={p.alt || ""} width="800" height="667" loading="lazy" decoding="async" />
                </figure>
              ) : null}
              <div className="offer-body">
                <div className="offer-head">
                  <p className="offer-title">{p.title}</p>
                  <StateBadge state={state} />
                </div>
                <h3 className="offer-benefit">
                  <Link href={href}>{p.benefit}</Link>
                </h3>
                <p className="offer-meta">
                  <span>
                    <Icon name="pin" />
                    {storesLabel(d, p.branchIds)}
                  </span>
                  <span>
                    <Icon name="calendar" />
                    {dateLine(p, state)}
                  </span>
                </p>
                {left ? <p className="offer-left">{left}</p> : null}
                <p className="offer-more">
                  <Link className={state === "live" ? "btn btn-sign" : "btn btn-outline"} href={href} aria-label={(state === "live" ? "Take your code: " : "See the offer: ") + p.benefit}>
                    {state === "live" ? "Take your code" : "See the offer"}
                    <Icon name="arrow" />
                  </Link>
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- /offers/<slug> ---------- */

function OfferNotFound() {
  return (
    <section className="section">
      <div className="container narrow">
        <div className="empty offer-missing">
          <h1>We could not find that offer</h1>
          <p>It may have ended a while ago, or the link may be mistyped. The offers running now are on the members’ offers page.</p>
          <Link className="btn btn-sign" href="/offers">
            See members’ offers
          </Link>
        </div>
      </div>
    </section>
  );
}

export function OfferDetail({ slug }: { slug: string }) {
  const d = useData();
  const hydrated = useHydrated();
  const now = hydrated ? new Date() : null;
  const p = now ? promoBySlug(d, slug, now) : null;
  const title = (p ? p.benefit + " · Members’ offers" : "Offer not found") + " · Southern Food Basket";
  useEffect(() => {
    if (hydrated) document.title = title;
  }, [hydrated, title]);

  if (!now) return <div className="offer-wait" aria-busy="true" />;
  if (!p) return <OfferNotFound />;

  const state = asPublic(promoState(d, p, now));
  return (
    <>
      <section className="page-hero" aria-labelledby="offer-title">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/offers">Members’ offers</Link> / {p.title}
          </p>
          <div className={p.img ? "page-hero-grid" : undefined}>
            <div>
              <p className="eyebrow">{p.title}</p>
              <h1 id="offer-title">{p.benefit}</h1>
              <p className="lede">{p.summary}</p>
              <p className="offer-meta">
                <StateBadge state={state} />
                <span>
                  <Icon name="pin" />
                  {storesLabel(d, p.branchIds)}
                </span>
                <span>
                  <Icon name="calendar" />
                  {dateLine(p, state)}
                </span>
              </p>
            </div>
            {p.img ? (
              <figure className="photo-frame">
                <img src={photo(p)} alt={p.alt || ""} width="800" height="667" decoding="async" />
              </figure>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section" aria-label="Your code and the small print">
        <div className="container offer-layout">
          <div className="card offer-claim" data-tour="offer-claim">
            <ClaimPanel p={p} state={state} />
          </div>
          <div className="offer-terms">
            <h2>Before you shop</h2>
            <dl className="offer-facts">
              <dt>Stores</dt>
              <dd>{storesLabel(d, p.branchIds)}</dd>
              <dt>Dates</dt>
              <dd>{fmtTT(p.starts) + " to " + fmtTT(p.ends)}</dd>
              <dt>Codes</dt>
              <dd>{p.limits.perCustomer === 1 ? "One per shopper" : p.limits.perCustomer + " per shopper"}</dd>
              <dt>Online</dt>
              <dd>Cannot be used online. Show the code at the till.</dd>
            </dl>
            {p.terms.length ? (
              <>
                <h3>The small print</h3>
                <ul className="offer-small-print">
                  {p.terms.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="note">Demo offer on a concept site: no real discount is given.</p>
          </div>
        </div>
      </section>
    </>
  );
}

/** Signed out: a link to sign in that comes back here. Signed in: take a code, or the code already held. */
function ClaimPanel({ p, state }: { p: Promotion; state: PublicState }) {
  const d = useData();
  const s = useSession();
  useShopperTier(s);
  const me = currentCustomer(d, s);
  const held = me ? walletFor(d, me).find((w) => w.entitlement?.promoId === p.id && w.entitlement.status !== "void") : undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [took, setTook] = useState(false);
  const ticket = useRef<HTMLElement>(null);

  // A code just handed out: move focus to it, so a screen reader reads it out and the page shows it.
  useEffect(() => {
    if (took) ticket.current?.focus();
  }, [took]);

  async function take() {
    setBusy(true);
    setError(null);
    const r = await claimCode(s, p.id);
    setBusy(false);
    if (r.ok) setTook(true);
    else setError(r.message);
  }

  if (held) {
    const t = ticketFor(d, held, new Date());
    return (
      <>
        <h2 id="claim-title">Your code</h2>
        {took ? (
          <p className="claim-done" role="status">
            <Icon name="check" />
            Your code is ready. It is saved in My offers too.
          </p>
        ) : (
          <p>You have taken your code for this offer. It is also in My offers.</p>
        )}
        <CodeTicket {...t} tour="offer-code" ref={ticket} />
        <p className="claim-actions">
          <Link className="btn btn-outline" href="/account">
            Open My offers
          </Link>
        </p>
      </>
    );
  }

  if (state === "ended") {
    return (
      <>
        <h2 id="claim-title">This offer has ended</h2>
        <p>{"It ended on " + fmtTT(p.ends) + ". Codes for it no longer work at the till."}</p>
        <Link className="btn btn-outline" href="/offers">
          See the offers on now
        </Link>
      </>
    );
  }

  if (state === "full") {
    return (
      <>
        <h2 id="claim-title">Every code has been taken</h2>
        <p>All the codes for this offer have gone. New offers go up on this site first, and in the weekly e-mail.</p>
        <Link className="btn btn-outline" href="/offers">
          See the other offers
        </Link>
      </>
    );
  }

  const left = leftLine(d, p, state);
  if (!me) {
    const next = "/offers/" + encodeURIComponent(p.slug);
    return (
      <>
        <h2 id="claim-title">Take your code</h2>
        <p>Sign in with your e-mail. It is free and there is no password. Then take your code and show it at the till before you pay.</p>
        {s && isStaff(s.role) ? <p className="note">You are signed in to the staff portal. Codes are for shopper accounts, so sign in with your own e-mail.</p> : null}
        {left ? <p className="offer-left">{left}</p> : null}
        <Link className="btn btn-sign" href={"/account/sign-in?next=" + encodeURIComponent(next)}>
          Sign in to take your code
        </Link>
      </>
    );
  }

  return (
    <>
      <h2 id="claim-title">Take your code</h2>
      <p>{"One code per shopper. Show it at the till before you pay, at " + storesLabel(d, p.branchIds).replace(/^All five stores$/, "any of our five stores") + "."}</p>
      {left ? <p className="offer-left">{left}</p> : null}
      <Button variant="sign" type="button" onClick={take} disabled={busy}>
        {busy ? "Getting your code" : "Take my code"}
      </Button>
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
