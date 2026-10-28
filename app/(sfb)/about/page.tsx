import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { AboutFacts, AboutValues } from "@/components/site/about";

// Ported from about.html; the values and the sourced facts come from the data, as site.js about() rendered them.

export const metadata: Metadata = {
  title: "About us",
  description:
    "About Southern Food Basket, a supermarket and wholesale business in south Trinidad, with the public records this concept draws on. Unofficial concept by Trinovata.",
};

export default function AboutPage() {
  return (
    <SiteFrame active="about">
      <section className="page-hero" aria-labelledby="about-title">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">About us</p>
            <h1 id="about-title">A grocer for the south</h1>
            <p className="lede">
              Southern Food Basket sells groceries, fresh produce, cakes and everyday goods from five stores in San Fernando, Couva, Princes Town, Penal and Point Fortin, and supplies shops and caterers in bulk. The stores carry an in-house bakery, a restaurant, a butcher shop and a pharmacy alongside the grocery.
            </p>
            <p>On Instagram the store is known for its “1 FOR · TRY ME” posts, its ready-cut veg packs and double-layer cakes, and the pink-and-green flags on the music truck.</p>
          </div>
          <figure className="photo-frame">
            <img src="/assets/img/photos/team-flags.webp" width="800" height="600" alt="Southern Food Basket staff in red shirts holding the company’s pink and green flags" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">What we stand for</p>
              <h2 id="values-title">How we try to run the store</h2>
            </div>
          </div>
          <div className="value-grid" data-values="">
            <AboutValues />
          </div>
        </div>
      </section>

      <section className="section record" aria-labelledby="record-title">
        <div className="container narrow">
          <p className="eyebrow">On the record</p>
          <h2 id="record-title">What public sources say</h2>
          <p className="muted">These are the sourced facts this concept uses. They come from public directories and the company’s own Instagram, and have not been checked with the company.</p>
          <ul className="fact-list" data-facts="">
            <AboutFacts />
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="concept-title">
        <div className="container narrow">
          <div className="concept-box">
            <h2 id="concept-title">About this concept</h2>
            <p>
              This website is an unsolicited prototype by{" "}
              <a href="https://trinovata.com" target="_blank" rel="noopener">
                Trinovata Technologies<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
              . It is not affiliated with Southern Food Basket Ltd.
            </p>
            <p>The logo, product photos and special prices come from the company’s public Instagram. Opening hours, phone numbers, jobs, staff, applicants, payslips and documents are invented demo data. Nothing you enter on this site leaves your browser.</p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
