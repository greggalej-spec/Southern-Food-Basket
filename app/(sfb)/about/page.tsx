import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { AboutValues } from "@/components/site/about";
import { StoreMap } from "@/components/site/store-map";
import { SEED } from "@/lib/seed";

// The company's own story, told the way a supermarket tells it: the family, the 35 years, what it stands for, where
// it is and how to follow it. The wording leans on the company's own lines ("D Best 4 Less", "35 Years of Rewards",
// the Facebook intro's list of counters). No source notes on the page: SITE.md keeps where each fact came from.

export const metadata: Metadata = {
  title: "About us",
  description: "Southern Food Basket, est. 1991: five supermarkets across the south of Trinidad, from Couva to Point Fortin. Prototype.",
};

const community = SEED.content.community;
const YEARS = 2026 - SEED.settings.founded;

const STATS = [
  [String(SEED.settings.founded), "The year we opened"],
  [String(YEARS), "Years serving the south"],
  [String(SEED.branches.length), "Stores, Couva to Point Fortin"],
  ["7", "Days a week, every week"],
] as const;

export default function AboutPage() {
  return (
    <SiteFrame active="about">
      <section className="page-hero about-hero" aria-labelledby="about-title">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">About us</p>
            <h1 id="about-title">Southern Food Basket, est. {SEED.settings.founded}</h1>
            <p className="lede">
              For {YEARS} years Southern Food Basket has put good food on tables across the south of Trinidad. Fresh produce, an in-house bakery and restaurant, a butcher shop, a pharmacy and a household department, all under one roof.
            </p>
            <p className="about-tag">
              Here you get <b>D Best 4 Less</b>
            </p>
            <div className="cluster">
              <Link className="btn btn-sign" href="/locations">
                A store near me
              </Link>
              <Link className="btn btn-outline" href="/events">
                Events and promotions
              </Link>
            </div>
          </div>
          <figure className="sf-window">
            <img src="/assets/img/social/store-front.webp" width="640" height="640" alt="The red Southern Food Basket lettering on the teal glass front of a store" decoding="async" />
            <figcaption>Look for the red letters on the glass.</figcaption>
          </figure>
        </div>
      </section>

      <section className="about-stats" aria-label="Southern Food Basket in numbers">
        <div className="container">
          <ul className="sf-stats">
            {STATS.map(([n, label]) => (
              <li className="sf-stat" key={label}>
                <b>{n}</b>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section sf-glassroom" aria-labelledby="who-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Our story</p>
              <h2 id="who-title">A family, and five stores</h2>
            </div>
          </div>
          <div className="who">
            <article className="who-card who-founder">
              <div className="who-arch has-photo">
                <img src="/assets/img/people/nazim-mohammed.webp" width="325" height="390" alt="Mr. Nazim Jameel Mohammed" decoding="async" />
              </div>
              <p className="who-role">In loving memory</p>
              <h3>Mr. Nazim Jameel Mohammed</h3>
              <p>Director of Southern Food Basket and Food Basket Marketplace.</p>
            </article>
            <article className="who-card who-family">
              <p className="who-year" aria-hidden="true">
                {SEED.settings.founded}
              </p>
              <h3>A family business</h3>
              <p>Southern Food Basket has been family-run since {SEED.settings.founded}. Today there are five stores across the south, and this year we are celebrating {YEARS} Years of Rewards with our customers.</p>
              <p className="who-small">You will know us by the team in red on the shop floor, and by the pink-and-green flags on the road.</p>
            </article>
            <article className="who-card who-where">
              <h3>Where we are</h3>
              <StoreMap compact />
              <p className="who-small">San Fernando, Couva, Princes Town, Penal and Point Fortin. Tap a pin for today’s hours and directions.</p>
              <Link className="more-link" href="/locations">
                A store near me
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
              <h2 id="values-title">Our promise to every shopper</h2>
            </div>
          </div>
          <div className="sf-values">
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
              <Link className="btn btn-outline" href="/events">
                See what is happening
              </Link>
            </div>
          </div>
        </section>
      ) : null}

    </SiteFrame>
  );
}
