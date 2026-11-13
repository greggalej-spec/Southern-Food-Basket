import { Fragment, type CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { HomeLive } from "@/components/home/home-live";
import { NearMe } from "@/components/home/near-me";
import { StoreToday } from "@/components/home/store-today";
import { PriceSeal } from "@/components/price-seal";
import { StoreMap } from "@/components/site/store-map";
import { SocialLinks } from "@/components/social-links";
import { fmtDate, mapsDir, telHref } from "@/lib/format";
import { FIRST_FRAME } from "@/lib/home/camera";
import { SEED } from "@/lib/seed";
import type { Department } from "@/lib/types";
import { SCENE } from "./scene";

// The Grand Entrance (design option D), ported from tools/grand-entrance/index.template.html. Everything the static
// page filled in with innerHTML (shelf, ticker, departments, stores, the route map, socials) is rendered here from the
// seed, as the old script read it; lib/home/entrance.ts and living.ts add the camera, controls and physics after
// hydration (components/home/home-live.tsx).

export const metadata: Metadata = {
  title: { absolute: "Southern Food Basket · Supermarket, bakery and restaurant in south Trinidad" },
  description:
    "Southern Food Basket: five supermarkets across south Trinidad, serving the south since 1991. Specials, events, store hours and careers. Prototype.",
};

const D = SEED, S = SEED.settings;
const SCENE_HTML = SCENE + "<script>" + FIRST_FRAME + "</script>";
const vars = (v: Record<string, string>) => v as CSSProperties;
const dollars = (v: number) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dept = (id: string) => D.departments.find((x) => x.id === id) || { short: id, name: id };

/* ---------- icons (the home page's own set, as drawn in the template) ---------- */
const chev = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PREV = chev("M15 6l-6 6 6 6"), NEXT = chev("M9 6l6 6-6 6");
const CLOCK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const PHONE = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
/** A headline that rises word by word (living.ts adds the motion): screen readers get the sentence once, untouched. */
function Words({ text }: { text: string }) {
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {text.split(/\s+/).map((w, i) => (
          <Fragment key={i}>
            <span className="wm">
              <span style={vars({ "--i": String(i) })}>{w}</span>
            </span>{" "}
          </Fragment>
        ))}
      </span>
    </>
  );
}

const Eyebrow = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <p className={light ? "eyebrow light" : "eyebrow"}>
    <span className="fan" aria-hidden="true" />
    {children}
  </p>
);

const NAV = [
  ["/careers", "Careers"],
  ["#deals", "Specials"],
  ["/events", "Events & promotions"],
  ["/restaurant", "Restaurant & bakery"],
  ["#stores", "A store near me"],
  ["#aisles", "Departments"],
  ["#who", "About us"],
  ["/portal", "Staff portal"],
] as const;

// The first two are running now, from the company's own posts (lib/seed-events.ts says where each came from).
const SLIDES: { img: string; src?: string; h: number; alt: string; eyebrow: string; title: string; text: string; cta: [string, string, string] }[] = [
  { img: "flash", src: "/assets/img/social/flash-slide.webp", h: 533, alt: "Flash Sale flyer: Central Farms duck, 4 lbs for $89.95, and Anchor cheddar cheese 250 g, 2 for $39.95", eyebrow: "On now · 13 to 15 November", title: "Flash Sale, three days only", text: "Big savings on everyday essentials at all five stores, Friday to Sunday.", cta: ["btn btn-outline", "/specials", "See the flyers"] },
  { img: "escape", src: "/assets/img/social/escape-on-wheels.webp", h: 800, alt: "Escape on Wheels with a BYD Song Pro, for the 35th anniversary: shop, enter, win", eyebrow: "35 Years of Rewards", title: "Win a BYD Song Pro", text: "Spend $300 for an entry form, fill it out and drop it in the box at any store.", cta: ["btn btn-glass", "/events", "How to enter"] },
  { img: "veg-stir-fry", h: 667, alt: "A tray of cut stir fry vegetables", eyebrow: "Fresh and cut veg", title: "Ready-cut veg packs", text: "Chunky, stir fry and chow mein packs, cut and ready to cook, beside the whole produce.", cta: ["btn btn-outline", "/departments#fresh", "Fresh and cut veg"] },
  { img: "cake-red-velvet", h: 667, alt: "A 9-inch red velvet cake in a clear cake box", eyebrow: "Restaurant and bakery", title: "Double-layer cakes", text: "Sponge, chocolate, coconut, almond crumble and red velvet, from our in-house bakery.", cta: ["btn btn-outline", "/restaurant", "Restaurant and bakery"] },
  { img: "flags-car", h: 600, alt: "Southern Food Basket flags flying from a vehicle on the road", eyebrow: "Five stores", title: "Look for the pink and green flags", text: "Couva, San Fernando, Princes Town, Penal and Point Fortin.", cta: ["btn btn-glass", "#stores", "A store near me"] },
];

/* ---------- specials ---------- */
// Newest first, as the old script sorted them (its comparator never returns 0; kept so ties land in the same order).
// The home page is built once, so it cannot know today's date: it shows the specials with no end date.
const OPEN = D.specials.filter((s) => !s.to);
const DEALS = OPEN.slice().sort((a, b) => (a.posted < b.posted ? 1 : -1)).slice(0, 12);

/* ---------- departments: a coloured tile each, the quickest layout to scan on a phone ---------- */
const TILE: Record<string, string> = { fresh: "#1D6B35", bakery: "#C81A35", chilled: "#1C6863", snacks: "#B8195A", health: "#123F22", care: "#164F4B" };
const DEPTS = D.departments.filter((x) => x.id !== "wholesale");
const countOf = (id: string) => OPEN.filter((s) => s.dept === id).length;

function DeptCard({ x }: { x: Department }) {
  const n = countOf(x.id);
  return (
    <a className="dc" href={"/departments#" + x.id} style={vars({ "--tile": TILE[x.id] || "#1D6B35" })}>
      <span className="dc-photo">
        <img src={x.img} alt="" width="800" height="600" loading="lazy" />
      </span>
      <strong className="dc-name">{x.name}</strong>
      <span className="dc-go">
        {n ?<span className="dc-count">{n + (n === 1 ? " special" : " specials")}</span> : null}
        {NEXT}
      </span>
    </a>
  );
}


export default function HomePage() {
  return (
    <>
      <a className="skip" href="#inside">
        Skip the welcome animation
      </a>

      <header className="topbar" id="topbar">
        <a className="brand" href="#top" aria-label="Southern Food Basket, top of page">
          <img src="/assets/img/sfb-logo.svg" width="861" height="393" alt="Southern Food Basket" />
        </a>
        <nav className="topnav" aria-label="Main">
          <span className="ink" aria-hidden="true" />
          {NAV.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <nav className="quick" aria-label="Quick links">
          <Link className="quick-jobs" href="/careers">
            Careers
          </Link>
          <a className="quick-stores" href="#stores">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.4" fill="currentColor" />
            </svg>
            <span className="qs-label">Stores</span>
          </a>
        </nav>
        <button className="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu">
          <span className="bars" aria-hidden="true" />
          <span className="label">Menu</span>
        </button>
        <nav className="mobile-menu" id="mobile-menu" aria-label="Main">
          {NAV.map(([href, label], i) => (
            <a key={href} href={href} style={vars({ "--i": String(i) })}>
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="intro" id="top" aria-label="Welcome to Southern Food Basket">
        <div className="stage" id="stage">
          {/* The scene is generated markup (scene.ts). FIRST_FRAME rides inside it so it runs as the HTML parses, before
              first paint, and sets the opening viewBox; React never sees it as a <script> element (which it would
              refuse to run on a client render). The server and client copies differ on purpose from then on. */}
          {/* eslint-disable-next-line react/no-danger -- generated scene and a fixed script, no input */}
          <div className="camera" id="camera" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: SCENE_HTML }} />
          <div className="vignette" aria-hidden="true" />
          <div className="intro-copy intro-start" id="intro-start">
            <p className="kicker">Five stores across south Trinidad</p>
            <h1>
              Welcome to <span>Southern Food Basket</span>
            </h1>
          </div>
          <div className="intro-copy intro-end" id="intro-end">
            <h2>Come on in.</h2>
            <p>The team in red is ready for you at all five stores, seven days a week.</p>
            <div className="intro-actions">
              <Link className="btn btn-sign" href="/careers">
                See open jobs
              </Link>
              <a className="btn btn-outline" href="#deals">
                See the specials
              </a>
              <a className="btn btn-glass" href="#stores">
                Find your store
              </a>
            </div>
          </div>
          <p className="concept-note">Prototype. Final visuals and drone footage are added when the project begins.</p>
          <a className="skip-pill" id="skip-intro" href="#inside">
            Skip intro
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l6 6 6-6M6 12l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <div className="progress" aria-hidden="true">
            <span id="progress-bar" />
          </div>
        </div>
      </section>

      <main id="inside" tabIndex={-1}>
        <a className="ticker" href="#deals">
          <span className="visually-hidden">See this week&apos;s specials</span>
          <span className="ticker-tag" aria-hidden="true">
            Specials
          </span>
          <span className="ticker-win" aria-hidden="true">
            {/* the same specials twice, so the drift can loop; decorative, the shelf carries the content */}
            <span className="ticker-track" id="ticker">
              {[0, 1].flatMap((copy) =>
                DEALS.map((sp) => (
                  <Fragment key={copy + sp.id}>
                    <span className="tk-item">
                      <span className="tk-qty">1 FOR</span>
                      <span className="tk-price">{dollars(sp.price)}</span>
                      {sp.name}
                    </span>
                    <span className="tk-flag" />
                  </Fragment>
                )),
              )}
            </span>
          </span>
        </a>

        <section className="band band-carousel" id="highlights" aria-labelledby="hl-title">
          <div className="wrap">
            <h2 className="visually-hidden" id="hl-title">
              At Southern Food Basket
            </h2>
            <div className="carousel" id="carousel" aria-roledescription="carousel" aria-label="Highlights">
              <div className="car-track">
                {SLIDES.map((s, i) => (
                  <article key={s.img} className="slide" role="group" aria-roledescription="slide" aria-label={i + 1 + " of " + SLIDES.length}>
                    <figure className="slide-photo">
                      <img src={s.src || "/assets/img/photos/" + s.img + ".webp"} width="800" height={s.h} alt={s.alt} loading={i ? "lazy" : undefined} />
                    </figure>
                    <div className="slide-copy">
                      <Eyebrow>{s.eyebrow}</Eyebrow>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                      <a className={s.cta[0]} href={s.cta[1]}>
                        {s.cta[2]}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
              <div className="car-controls">
                <button className="round car-prev" type="button" aria-label="Previous slide">
                  {PREV}
                </button>
                <div className="car-dots">
                  {SLIDES.map((s, i) => (
                    <button key={s.img} type="button" className="car-dot" aria-label={"Slide " + (i + 1) + ": " + s.title} />
                  ))}
                </div>
                <button className="round car-play" type="button" aria-label="Pause the slides">
                  <svg className="i-pause" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 6v12M15 6v12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                  </svg>
                  <svg className="i-play" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5Z" fill="currentColor" />
                  </svg>
                </button>
                <button className="round car-next" type="button" aria-label="Next slide">
                  {NEXT}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="band band-deals" id="deals" aria-labelledby="deals-title">
          {/* bunting over the shelf: living.ts strings it here (decorative; drag it, it swings back) */}
          <div className="bunting" aria-hidden="true">
            <svg className="bunting-svg" focusable="false" />
          </div>
          <div className="wrap">
            <div className="section-head">
              <div>
                <Eyebrow>Specials</Eyebrow>
                <h2 id="deals-title">
                  <Words text="On the shelf right now" />
                </h2>
                <p className="note" id="deals-note">
                  {S.dealsNote}
                </p>
              </div>
              <div className="shelf-controls" aria-label="Scroll the specials">
                <button className="round" type="button" data-shelf="-1" aria-label="Previous specials">
                  {PREV}
                </button>
                <button className="round" type="button" data-shelf="1" aria-label="More specials">
                  {NEXT}
                </button>
              </div>
            </div>
            <div className="shelf" id="shelf" tabIndex={0} aria-label="Specials, scroll sideways">
              {DEALS.map((sp) => (
                <article key={sp.id} className="deal">
                  <figure className="deal-photo">
                    <img src={"/assets/img/photos/" + sp.img + ".webp"} alt={sp.alt || sp.name} width="800" height="667" loading="lazy" />
                    {sp.isNew ? (
                      <span className="new-corner" aria-hidden="true">
                        NEW
                      </span>
                    ) : null}
                    <PriceSeal price={sp.price} />
                  </figure>
                  <div className="deal-body">
                    <p className="deal-dept">{dept(sp.dept).short}</p>
                    <h3 className="deal-name">{sp.name}</h3>
                    <p className="visually-hidden">{"Price TTD " + Number(sp.price).toFixed(2) + " each."}</p>
                    <p className="deal-meta">{"Posted " + fmtDate(sp.posted) + (sp.couva ? " · Couva" : "")}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="more">
              <Link href="/specials">All specials, with filters</Link>
            </p>
          </div>
        </section>

        <section className="band band-careers" id="careers" aria-labelledby="careers-title">
          <div className="ribbon" aria-hidden="true" />
          <div className="wrap careers careers-solo">
            <div>
              <Eyebrow>Careers</Eyebrow>
              <h2 id="careers-title">
                <Words text="Be a part of the family, join the team!" />
              </h2>
              <p className="lede">Shop floor, bakery, warehouse and office jobs across five stores, with one online application for all of them.</p>
              <ul className="why" id="why">
                {D.content.careersWhy.slice(0, 3).map((w) => (
                  <li key={w.title}>
                    <div>
                      <strong>{w.title}</strong>
                      <p>{w.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="row">
                <Link className="btn btn-sign" href="/careers">
                  See open jobs
                </Link>
                <Link className="btn btn-outline" href="/portal">
                  Staff portal
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="band band-who" id="who" aria-labelledby="who-title">
          <div className="ribbon" aria-hidden="true" />
          <div className="wrap">
            <div className="section-head">
              <div>
                <Eyebrow>Our story</Eyebrow>
                <h2 id="who-title">
                  <Words text="A family grocer for the south" />
                </h2>
              </div>
            </div>
            <div className="who">
              <article className="who-card who-founder">
                <div className="who-arch" aria-hidden="true">
                  <span>NM</span>
                </div>
                <p className="who-role">In loving memory</p>
                <h3>Nazim Mohammed</h3>
                <p>Father of the family behind Southern Food Basket.</p>
                <p className="who-small">A place is kept here for his photograph and his story, in the family’s own words.</p>
              </article>
              <article className="who-card who-family">
                <p className="who-year" aria-hidden="true">
                  1991
                </p>
                <h3>A family business</h3>
                <p>Southern Food Basket has been family-run since 1991. Today there are five stores across the south, and this year we are celebrating 35 Years of Rewards.</p>
                <p className="who-small">The team in red runs the shop floor, and the pink-and-green flags go out on the music truck.</p>
              </article>
              <article className="who-card who-where">
                <h3>Where we are</h3>
                <figure className="sf-window">
                  <img src="/assets/img/social/store-front.webp" width="640" height="640" alt="The red Southern Food Basket lettering on the teal glass front of a store" loading="lazy" decoding="async" />
                </figure>
                <p className="who-small">San Fernando, Couva, Princes Town, Penal and Point Fortin. Look for the red letters on the glass.</p>
                <p className="more">
                  <a href="#stores">A store near me</a>
                </p>
              </article>
            </div>
            <p className="more">
              <Link href="/about">More about our family and our stores</Link>
            </p>
          </div>
        </section>

        <section className="band band-aisles" id="aisles" aria-labelledby="aisles-title">
          <div className="ribbon" aria-hidden="true" />
          <div className="wrap">
            <div className="section-head">
              <div>
                <Eyebrow>Departments</Eyebrow>
                <h2 id="aisles-title">
                  <Words text="Everything under one glass roof" />
                </h2>
              </div>
            </div>
            <div className="dept" id="dept">
              {DEPTS.map((x) => (
                <DeptCard key={x.id} x={x} />
              ))}
            </div>
            <ul className="counters" id="counters" aria-label="In our stores">
              {D.storeServices.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="more more-pair">
              <Link href="/departments">Every department, with its specials</Link>
              <Link href="/restaurant">Our restaurant and bakery</Link>
            </p>
          </div>
        </section>

        <section className="band band-stores" id="stores" aria-labelledby="stores-title">
          <div className="facade-top" aria-hidden="true" />
          <div className="wrap">
            <div className="section-head">
              <div>
                <Eyebrow light>Five stores, one welcome</Eyebrow>
                <h2 id="stores-title">
                  <Words text="A store near me" />
                </h2>
                <p className="note light">Five stores across the south, open seven days a week.</p>
              </div>
            </div>
            <NearMe places={D.branches.map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng }))} />
            <div className="near-map">
              <StoreMap id="stores-map" />
            </div>
            <div className="stores" id="store-grid">
              {D.branches.map((b) => (
                <article key={b.id} className="store" id={"store-" + b.id}>
                  <div className="cap" aria-hidden="true" />
                  <h3>{b.name}</h3>
                  <address>{b.address}</address>
                  <span className="store-km" data-km={b.id} />
                  <p className="row-i">
                    {CLOCK}
                    <StoreToday branch={b} />
                  </p>
                  <details className="store-week">
                    <summary>
                      See all times<span className="visually-hidden">{" for " + b.name}</span>
                    </summary>
                    <dl>
                      {b.hours.map(([days, time]) => (
                        <div key={days}>
                          <dt>{days}</dt>
                          <dd>{time}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  {b.phone ? (
                    <p className="row-i">
                      {PHONE}
                      <a href={telHref(b.phone)}>{b.phone}</a>
                    </p>
                  ) : null}
                  <div className="actions">
                    <a className="btn btn-sign" href={mapsDir(b)} target="_blank" rel="noopener">
                      Directions<span className="visually-hidden">{" to " + b.name + " on Google Maps, opens in a new tab"}</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <p className="more">
              <Link className="btn btn-outline" href="/locations">
                Every store, with its full hours
              </Link>
            </p>
          </div>
        </section>

        <section className="social-band" aria-labelledby="social-title">
          <div className="wrap social">
            <div>
              <h2 id="social-title">
                <Words text="Follow Southern Food Basket" />
              </h2>
              <p>New specials, competitions and store news, as we post them.</p>
            </div>
            <SocialLinks settings={S} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="facade-top" aria-hidden="true" />
        <div className="wrap footer-grid">
          <div>
            <img className="footer-logo" src="/assets/img/sfb-logo.svg" width="861" height="393" alt="Southern Food Basket" />
            <p>We’ve got the food for your basket.</p>
            <p id="footer-phone">{S.phone ? <a href={telHref(S.phone)}>{S.phone}</a> : null}</p>
          </div>
          <div>
            <h3>Our stores</h3>
            <ul id="footer-stores">
              {D.branches.map((b) => (
                <li className="footer-branch" key={b.id}>
                  <Link href={"/locations#" + b.id}>{b.name}</Link>
                  <span>{b.short || b.address}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* The same two menus as the inner pages' footer (components/site-footer.tsx). */}
          <div>
            <h3>Shop</h3>
            <ul>
              <li><Link href="/specials">Specials</Link></li>
              <li><Link href="/events">Events and promotions</Link></li>
              <li><Link href="/departments">Departments</Link></li>
              <li><Link href="/restaurant">Restaurant and bakery</Link></li>
              <li><Link href="/locations">A store near me</Link></li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/community">Community and partnerships</Link></li>
              <li><Link href="/portal">Staff portal</Link></li>
              <li><Link href="/tour">Guided tour of this prototype</Link></li>
              <li><Link href="/how-it-works">How the system works</Link></li>
            </ul>
          </div>
        </div>
        <div className="wrap footer-social">
          <span>Follow us</span>
          <SocialLinks settings={S} compact />
        </div>
        <div className="wrap legal">
          <p>
            Prototype for Southern Food Basket. Store hours and phone numbers come from Google Maps; prices and photos from the company&apos;s public Instagram. The opening animation is an illustration.
          </p>
        </div>
      </footer>

      <HomeLive />
    </>
  );
}
