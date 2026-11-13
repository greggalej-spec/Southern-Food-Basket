"use client";

import { StoreToday } from "@/components/home/store-today";
import { useToday } from "@/components/use-today";
import { mapsDir, telHref } from "@/lib/format";
import { runningDeals } from "@/lib/ops/deals";
import { useData } from "@/lib/store";

/* The Restaurant and bakery page's two live lists, from this browser's copy of the data.
   Which stores have a restaurant and bakery: Coffee Street (San Fernando), Couva and Point Fortin, per Gregg,
   2026-11-13. The cakes and their prices are the bakery specials the company posted (lib/seed.ts → specials). */

export const RESTAURANT_STORES = ["sando", "couva", "pfortin"];

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const FORK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path {...stroke} d="M7 3v7a2 2 0 0 0 4 0V3M9 12v9M17 3c-2 2-3 4-3 7h3v11" />
  </svg>
);
const CAKE = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path {...stroke} d="M4 20h16M5 20v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M5 15c2 1.6 4 1.6 7 0s5-1.6 7 0M12 11V7M12 4.5v.5" />
  </svg>
);

export function RestaurantPlaces() {
  const d = useData();
  const list = RESTAURANT_STORES.map((id) => d.branches.find((b) => b.id === id)).filter((b) => !!b);
  return (
    <div className="rest-places">
      {list.map((b) => (
        <article className="sf-card rest-place" key={b.id} id={"rest-" + b.id}>
          <div className="cap" aria-hidden="true" />
          <h3>{b.name}</h3>
          <address>{b.address}</address>
          <ul className="rest-tags" aria-label="At this store">
            <li>
              {FORK}
              Restaurant
            </li>
            <li>
              {CAKE}
              Bakery
            </li>
          </ul>
          <p>
            <StoreToday branch={b} />
          </p>
          <div className="actions">
            <a className="btn btn-sign" href={mapsDir(b)} target="_blank" rel="noopener">
              Directions<span className="visually-hidden">{" to " + b.name + " on Google Maps, opens in a new tab"}</span>
            </a>
            {b.phone ? (
              <a className="btn btn-outline" href={telHref(b.phone)}>
                Call the store
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function BakeryShelf() {
  const d = useData();
  const today = useToday();
  const cakes = runningDeals(d.specials, today).filter((sp) => sp.dept === "bakery");
  if (!cakes.length) return null;
  return (
    <div className="rest-bake">
      {cakes.map((sp) => (
        <article className="sf-card rest-cake" key={sp.id}>
          <figure>
            <img src={"/assets/img/photos/" + sp.img + ".webp"} alt={sp.alt || sp.name} width="800" height="667" loading="lazy" decoding="async" />
          </figure>
          <div>
            <h3>{sp.name}</h3>
            <p>
              {"$" + Number(sp.price).toFixed(2)} <small>each</small>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
