import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { TourPicker } from "@/components/tour/tour-picker";

// The guided tour's start page. The tour itself is components/tour/tour-host.tsx, mounted in both root layouts.

export const metadata: Metadata = {
  title: "Guided tour",
  description: "A guided walk through the Southern Food Basket concept: the shop, members’ codes, the weekly e-mail, hiring and staff access. Prototype.",
};

export default function TourPage() {
  return (
    <SiteFrame banner>
      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">Guided tour</p>
          <h1>See it as each person does</h1>
          <div className="tour-intro">
            <p className="lede">
              The tour opens each part of the site as the person who would use it: a shopper, a cashier, marketing, HR, an applicant and the owner’s office. It signs you in and out as it goes.
            </p>
            <p className="muted">
              Each step rings one thing on the page and says what it is for. The page stays yours to use: try things, then press Next. Hide the card at any time; the tour keeps your place in this tab.
            </p>
          </div>
          <TourPicker />
        </div>
      </section>
    </SiteFrame>
  );
}
