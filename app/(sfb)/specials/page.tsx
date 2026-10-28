import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { DealsNote, SpecialsBoard, SpecialsFallback } from "@/components/site/specials";

// Ported from specials.html; the chips, the count and the deal grid come from the data, as site.js specials()
// rendered them. The board reads ?dept= and ?couva= with useSearchParams, so it sits in Suspense: the prerendered
// page shows every deal, and the query's filters apply once the page hydrates.

export const metadata: Metadata = {
  title: "Specials",
  description:
    "Southern Food Basket specials: fresh-cut veg packs, double-layer cakes, yogurts, snacks, protein snacks and body washes, with the prices as posted on the company’s Instagram. Unofficial concept by Trinovata.",
};

export default function SpecialsPage() {
  return (
    <SiteFrame active="specials">
      <section className="page-hero" aria-labelledby="deals-title">
        <div className="container">
          <p className="eyebrow">1 for the price shown</p>
          <h1 id="deals-title">Specials</h1>
          <p className="lede">Everything we have put up with a special price, newest first. Pick a department, or show only the posts tagged at our Couva store.</p>
          <p className="note" data-deals-note="">
            <DealsNote />
          </p>
        </div>
      </section>

      <section className="section deals-band" aria-label="Deals">
        <div className="container">
          <Suspense fallback={<SpecialsFallback />}>
            <SpecialsBoard />
          </Suspense>
          <p className="note" style={{ marginTop: 24 }}>
            All prices in Trinidad and Tobago dollars (TTD), one item each, as posted. Photos are the company’s own.
          </p>
        </div>
      </section>
    </SiteFrame>
  );
}
