import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { AboutFacts, AboutValues } from "@/components/site/about";
import { StoreRouteMap } from "@/components/store-route";
import { storeRoute } from "@/lib/route";
import { SEED } from "@/lib/seed";

// The home's "Who" band in full (DESIGN.md "One design"): the same memorial card, family card and route map, then
// what the home leaves out: every store linked to its listing, how the stores run, the community, the sourced record.

export const metadata: Metadata = {
  title: "About us",
  description:
    "About Southern Food Basket, a family supermarket and wholesale business in south Trinidad, with the public records this concept draws on. Unofficial concept by Trinovata.",
};

const route = storeRoute(SEED.branches);
const community = SEED.content.community;

export default function AboutPage() {
  return (
    <SiteFrame active="about">
      <section className="page-hero" aria-labelledby="about-title">
        <div className="container">
          <p className="eyebrow">About us</p>
          <h1 id="about-title">A family grocer for the south</h1>
          <p className="lede">
            Southern Food Basket sells groceries, fresh produce, cakes and everyday goods from five stores in San Fernando, Couva, Princes Town, Penal and Point Fortin, and supplies shops and caterers in bulk. The stores carry an in-house bakery, a restaurant, a butcher shop and a pharmacy alongside the grocery.
          </p>
          <p>On Instagram the store is known for its “1 FOR · TRY ME” posts, its ready-cut veg packs and double-layer cakes, and the pink-and-green flags on the music truck.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="who-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Who is Southern Food Basket?</p>
              <h2 id="who-title">The family and the five stores</h2>
            </div>
          </div>
          <div className="who">
            <article className="who-card who-founder">
              <div className="who-arch" aria-hidden="true">
                <span>NM</span>
              </div>
              <p className="who-role">In loving memory</p>
              <h3>Nazim Mohammed</h3>
              <p>Father of the family behind Southern Food Basket, and principal of Southern Food Basket Limited, Princes Town.</p>
              <p className="who-small">His story and photograph will go here in the family&apos;s own words, when they are ready to share them.</p>
            </article>
            <article className="who-card who-family">
              <p className="who-year" aria-hidden="true">
                1998
              </p>
              <h3>A family business</h3>
              <p>Southern Food Basket is a family business, serving the south since 1998: groceries, fresh-cut veg, double-layer cakes and wholesale.</p>
              <p className="who-small">The team in red runs the shop floor, and the pink-and-green flags go out on the music truck.</p>
              <p className="source-line">Founded 1998 per the Del Risco company record; an exporter directory gives 2000.</p>
            </article>
            <article className="who-card who-where">
              <h3>Where we are</h3>
              {route ? <StoreRouteMap route={route} /> : null}
              <ol className="route-list" aria-label="Our five stores">
                {route?.stops.map((s) => (
                  <li key={s.b.id}>
                    <Link href={"/locations#" + s.b.id}>{s.b.name}</Link>
                  </li>
                ))}
              </ol>
              <p className="who-small">Each store placed from its Google Maps listing; the line joins them in order.</p>
              <Link className="more-link" href="/locations">
                Hours, phone numbers and directions
              </Link>
            </article>
          </div>
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

      {community ? (
        <section className="section section-tight" aria-labelledby="community-title">
          <div className="container split community">
            <figure className="photo-frame">
              <img src={community.img} width="800" height="600" alt={community.alt} loading="lazy" decoding="async" />
            </figure>
            <div>
              <p className="eyebrow">In the south</p>
              <h2 id="community-title">{community.title}</h2>
              <p className="lede">{community.text}</p>
              <span className="source-line">{"Source: " + community.source}</span>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section record" aria-labelledby="record-title">
        <div className="container narrow">
          <p className="eyebrow">On the record</p>
          <h2 id="record-title">What public sources say</h2>
          <p className="muted">These facts come from public directories and have not been checked with the company.</p>
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
            <p>The logo, product photos and special prices come from the company’s public Instagram, and store addresses, hours and phone numbers from each store’s Google Maps listing. Jobs, staff, applicants, payslips and documents are invented demo data. Nothing you enter on this site leaves your browser.</p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
