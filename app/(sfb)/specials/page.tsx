import { Suspense } from "react";
import type { Metadata } from "next";
import { FlyerWall } from "@/components/site/events";
import { SiteFrame } from "@/components/site-frame";
import { DealsNote, SpecialsBoard, SpecialsExtras, SpecialsFallback } from "@/components/site/specials";

// Ported from specials.html; the chips, the count and the deal grid come from the data, as site.js specials()
// rendered them. The board reads ?dept= and ?couva= with useSearchParams, so it sits in Suspense: the prerendered
// page shows every deal, and the query's filters apply once the page hydrates.

export const metadata: Metadata = {
  title: "Specials",
  description:
    "Southern Food Basket specials: fresh-cut veg packs, double-layer cakes, yogurts, snacks, protein snacks and body washes, with the prices as posted on the company’s Instagram. Prototype.",
};

export default function SpecialsPage() {
  return (
    <SiteFrame active="specials">
      <section className="page-hero" aria-labelledby="deals-title">
        <div className="container">
          <p className="eyebrow">1 for the price shown</p>
          <h1 id="deals-title">Specials</h1>
          <p className="lede">This week’s special prices, newest first.</p>
          <p className="note" data-deals-note="">
            <DealsNote />
          </p>
        </div>
      </section>

      <section className="section deals-band" aria-label="Deals">
        <div className="container">
          <FlyerWall />
          <Suspense fallback={<SpecialsFallback />}>
            <SpecialsBoard />
          </Suspense>
          <p className="note" style={{ marginTop: 24 }}>
            All prices in Trinidad and Tobago dollars (TTD), one item each, as posted. Photos are the company’s own.
          </p>
          <SpecialsExtras />
        </div>
      </section>
    </SiteFrame>
  );
}
