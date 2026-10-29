import type { Metadata } from "next";
import Link from "next/link";
import { OffersList } from "@/components/members/offers";
import { SiteFrame } from "@/components/site-frame";

// Members' offers (PRD 9.1). The hero, the three steps and the fine print are prerendered; the offers themselves
// render once the page has hydrated, because whether each has started, ended or run out depends on the clock.

export const metadata: Metadata = {
  title: "Members’ offers",
  description: "Free codes for money off at Southern Food Basket: sign in with your e-mail, take a code, and show it at the till. Unofficial concept with demo offers.",
};

export default function OffersPage() {
  return (
    <SiteFrame active="offers" css={["site", "members"]} page="offers" banner>
      <section className="page-hero" aria-labelledby="offers-title">
        <div className="container">
          <p className="eyebrow">Free for shoppers</p>
          <h1 id="offers-title">Members’ offers</h1>
          <p className="lede">Money off at our stores for anyone who signs in with an e-mail address. Take a code here and show it at the till.</p>
        </div>
      </section>

      <section className="section offers-band" aria-labelledby="offers-now">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="offers-now">On now</h2>
              <p>Offers that are running come first. Ended ones stay here for a while, marked as ended.</p>
            </div>
            <Link className="more-link" href="/account">
              My offers
            </Link>
          </div>
          <OffersList />
        </div>
      </section>

      <section className="section offers-how" aria-labelledby="offers-how">
        <div className="container">
          <h2 id="offers-how">How members’ offers work</h2>
          <ol className="steps">
            <li>
              <p>
                <strong>Sign in with your e-mail.</strong> It is free and there is no password.
              </p>
            </li>
            <li>
              <p>
                <strong>Take your code.</strong> It is one per shopper.
              </p>
            </li>
            <li>
              <p>
                <strong>Show it at the till before you pay.</strong>
              </p>
            </li>
          </ol>
          <div className="offers-fine">
            <h3>The fine print</h3>
            <ul>
              <li>One code per shopper for each offer.</li>
              <li>A code works only at the stores named on its offer, and only until the offer ends.</li>
              <li>Codes cannot be used online. They work at the till, where the cashier checks and records them.</li>
              <li>These are demo offers on a concept site: no real discount is given.</li>
            </ul>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
