import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { BranchJumps, LocationsList, StoreServices } from "@/components/site/locations";
import { StoreMap } from "@/components/site/store-map";
import { NearMe } from "@/components/home/near-me";
import { SEED } from "@/lib/seed";

// Ported from locations.html; the store chips, the counters and the store sections come from the data, as site.js
// locations() rendered them, and #<branch id> still lands on its store.

export const metadata: Metadata = {
  title: "Store locations",
  description:
    "Southern Food Basket stores in San Fernando, Couva, Princes Town, Penal and Point Fortin: addresses, phone numbers, opening hours and Google Maps directions. Prototype.",
};

export default function LocationsPage() {
  return (
    <SiteFrame active="locations">
      <section className="page-hero" aria-labelledby="loc-title">
        <div className="container">
          <p className="eyebrow">Five stores across the south</p>
          <h1 id="loc-title">A store near me</h1>
          <p className="lede">Five stores across the south, all open seven days. Pick one for its address, phone number, opening hours and Google Maps directions.</p>
          <ul className="chips jump-chips" data-branch-jumps="" aria-label="Jump to a store">
            <BranchJumps />
          </ul>
        </div>
      </section>

      <section className="map-section" aria-labelledby="map-title">
        <div className="container">
          <h2 id="map-title" className="visually-hidden">
            Our stores on the map
          </h2>
          <NearMe prefix="" places={SEED.branches.map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng }))} />
          <StoreMap id="store-map" />
          <p className="map-note">Tap a pin for today’s hours and directions. Click the map once to zoom with the wheel.</p>
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
