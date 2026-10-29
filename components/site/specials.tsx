"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icon";
import { NewsletterSignup } from "@/components/members/newsletter-signup";
import { PriceSeal } from "@/components/price-seal";
import { fmtDate, money } from "@/lib/format";
import { dealsIn, dept, dollars, newestFirst } from "@/lib/site/deals";
import { useData } from "@/lib/store";
import type { Seed, Special } from "@/lib/types";

// site.js specials(): the department chips, the Couva box and the deal grid, from this browser's copy of the data.
// The filters live in the address bar (?dept=<id>&couva=1), written with history.replaceState as before.

type Filters = { dept: string; couva: boolean };
const ALL: Filters = { dept: "all", couva: false };

/** The filters the query asks for. */
function fromQuery(q: { get(name: string): string | null }): Filters {
  return { dept: q.get("dept") || "all", couva: q.get("couva") === "1" };
}

/** The filters in force: a department without deals falls back to all of them. */
function inForce(d: Seed, f: Filters): Filters {
  const ok = f.dept !== "all" && d.departments.some((x) => x.id === f.dept && dealsIn(d, x.id).length);
  return { dept: ok ? f.dept : "all", couva: f.couva };
}

/** Puts the filters in the address bar, keeping any other query and the hash. */
function writeUrl(st: Filters) {
  const q = new URLSearchParams(location.search);
  if (st.dept !== "all") q.set("dept", st.dept);
  else q.delete("dept");
  if (st.couva) q.set("couva", "1");
  else q.delete("couva");
  const s = q.toString();
  const url = location.pathname + (s ? "?" + s : "") + location.hash;
  if (url === location.pathname + location.search + location.hash) return;
  try {
    history.replaceState(null, "", url);
  } catch {}
}

function DealCard({ sp, deptShort }: { sp: Special; deptShort: string }) {
  return (
    <article className="deal">
      <figure className="deal-photo">
        <img src={"/assets/img/photos/" + sp.img + ".webp"} alt={sp.alt || sp.name} width="800" height="667" loading="lazy" decoding="async" />
        {sp.isNew ? (
          <span className="new-corner" aria-hidden="true">
            NEW
          </span>
        ) : null}
        <PriceSeal price={sp.price} />
      </figure>
      <div className="deal-body">
        <p className="deal-dept">{deptShort}</p>
        <h2 className="deal-name">{sp.name}</h2>
        <p className="deal-price" aria-hidden="true">
          <span className="qty">1 FOR</span>
          <span className="amt">{dollars(sp.price)}</span>
        </p>
        <p className="visually-hidden">{(sp.isNew ? "New product. " : "") + "Price " + money(sp.price) + " each."}</p>
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

/** The note under the heading: when the prices were posted. */
export function DealsNote() {
  return useData().settings.dealsNote || "";
}

/** The toolbar and the grid for one set of filters (already in force). Without onChange it is the first paint. */
function DealsBoard({ state, onChange }: { state: Filters; onChange?: (f: Filters) => void }) {
  const d = useData();
  const list = newestFirst(d.specials || []);
  const depts = d.departments.filter((x) => dealsIn(d, x.id).length);
  const shown = list.filter((sp) => (state.dept === "all" || sp.dept === state.dept) && (!state.couva || sp.couva));
  const what = state.dept === "all" ? "deals" : dept(d, state.dept).name.toLowerCase() + " deals";
  const set = (f: Filters) => onChange?.(f);

  return (
    <>
      <div className="deals-toolbar">
        <ul className="chips" data-deal-filters="" aria-label="Filter by department">
          {[{ id: "all", short: "All deals" }, ...depts].map((x) => (
            <li key={x.id}>
              <button type="button" className="chip" data-dept={x.id} aria-pressed={state.dept === x.id} onClick={() => set({ ...state, dept: x.id })}>
                {x.short} <span className="count">{"(" + (x.id === "all" ? list.length : dealsIn(d, x.id).length) + ")"}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="filters-row">
          <p className="deals-count" data-deals-count="" role="status" aria-live="polite">
            {shown.length + " " + (shown.length === 1 ? what.replace(/s$/, "") : what) + (state.couva ? " tagged Couva" : "")}
          </p>
          <label className="check" htmlFor="f-couva">
            <input id="f-couva" type="checkbox" checked={state.couva} onChange={(e) => set({ ...state, couva: e.currentTarget.checked })} /> Only posts tagged Couva
          </label>
        </div>
      </div>
      <div className="deal-grid" data-deals-grid="">
        {shown.length ? (
          shown.map((sp) => <DealCard sp={sp} deptShort={dept(d, sp.dept).short} key={sp.id} />)
        ) : (
          <div className="empty">
            <p>No Couva-tagged posts in this department yet.</p>
            <button className="btn btn-ghost btn-sm" type="button" data-show-all="" onClick={() => set(ALL)}>
              Show every deal
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/** Under the deals and their price note: the way to members' offers, and the weekly e-mail sign-up
 *  (/specials#newsletter). Static, and free of the shopper tiers: whether an offer is live is the offers page's business. */
export function SpecialsExtras() {
  return (
    <div className="specials-extras">
      <div className="offers-callout">
        <div>
          <p className="eyebrow bare">Members’ offers</p>
          <h2>A free code for money off</h2>
          <p>Sign in with your e-mail, take a code, and show it at the till before you pay. No password, and no card to carry.</p>
        </div>
        <Link className="btn btn-sign" href="/offers">
          See members’ offers
          <Icon name="arrow" />
        </Link>
      </div>
      <NewsletterSignup source="Specials page" id="newsletter" />
    </div>
  );
}

/** The prerendered first paint, before the query is known (the Suspense fallback): every deal. */
export function SpecialsFallback() {
  return <DealsBoard state={ALL} />;
}

/** The live board. It starts from the query and follows it when a link, Back or Forward changes it; Next's router
 *  handles popstate, so the old popstate listener is not needed. */
export function SpecialsBoard() {
  const d = useData();
  const params = useSearchParams();
  const search = params.toString();
  const [asked, setAsked] = useState(() => fromQuery(params));
  const [seen, setSeen] = useState(search);
  if (search !== seen) {
    setSeen(search);
    setAsked(fromQuery(params));
  }
  const state = inForce(d, asked);

  useEffect(() => {
    // site.js rewrote the address after every render, which also drops a ?dept= without deals. A task later: Next's
    // router patches history.replaceState in its own effect, which runs after this one on the first render, and only
    // the patched call keeps useSearchParams and the router's history entry in step.
    const t = setTimeout(() => writeUrl({ dept: state.dept, couva: state.couva }), 0);
    return () => clearTimeout(t);
  }, [state.dept, state.couva]);

  return <DealsBoard state={state} onChange={setAsked} />;
}
