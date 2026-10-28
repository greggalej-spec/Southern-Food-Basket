import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { BranchJumps, LocationsList, StoreServices } from "@/components/site/locations";

// Ported from locations.html; the store chips, the counters and the store sections come from the data, as site.js
// locations() rendered them, and #<branch id> still lands on its store.

export const metadata: Metadata = {
  title: "Store locations",
  description:
    "Southern Food Basket stores in San Fernando, Couva, Princes Town, Penal and Point Fortin: addresses, phone numbers, opening hours and Google Maps directions. Unofficial concept by Trinovata.",
};

export default function LocationsPage() {
  return (
    <SiteFrame active="locations">
      <section className="page-hero" aria-labelledby="loc-title">
        <div className="container">
          <p className="eyebrow">Store locations</p>
          <h1 id="loc-title">Find your nearest store</h1>
          <p className="lede">Five stores across the south, all open seven days. Pick one for its address, phone number, opening hours and Google Maps directions.</p>
          <ul className="chips jump-chips" data-branch-jumps="" aria-label="Jump to a store">
            <BranchJumps />
          </ul>
        </div>
      </section>

      <section className="section section-tight" aria-labelledby="counters-title" style={{ paddingBlock: "var(--s6)" }}>
        <div className="container">
          <h2 id="counters-title" style={{ fontSize: "clamp(1.5rem,1.2rem + 1vw,2rem)" }}>
            In our stores
          </h2>
          <p className="muted">The counters the company lists on its Facebook page. Not every store has every counter, so call ahead if you need one.</p>
          <ul className="services-list" data-store-services="">
            <StoreServices />
          </ul>
        </div>
      </section>

      <div data-locations="">
        <LocationsList />
      </div>
    </SiteFrame>
  );
}
