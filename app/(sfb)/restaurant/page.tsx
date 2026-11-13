import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { BakeryShelf, RestaurantPlaces } from "@/components/site/restaurant";

// Restaurant and bakery: the three stores that have them (Coffee Street, Couva, Point Fortin), the bakery's cakes at
// their posted prices, and a board that waits for each kitchen's menu. Nothing on the menu is invented: until the
// kitchens send their menus and photographs, the board says what is certain and no more.

export const metadata: Metadata = {
  title: "Restaurant and bakery",
  description: "The restaurant and in-house bakery at Southern Food Basket’s Coffee Street, Couva and Point Fortin stores. Prototype.",
};

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const TICK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path {...stroke} d="M5 12.5 10 17.5 19 7" />
  </svg>
);

export default function RestaurantPage() {
  return (
    <SiteFrame active="restaurant">
      <section className="page-hero about-hero" aria-labelledby="rest-title">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Restaurant and bakery</p>
            <h1 id="rest-title">Fresh from our kitchen and our ovens</h1>
            <p className="lede">Three of our stores have a restaurant and an in-house bakery: Coffee Street in San Fernando, Couva and Point Fortin. Come for the shopping, stay for a plate, and take a cake home.</p>
            <div className="cluster">
              <a className="btn btn-sign" href="#rest-where">
                Where to find us
              </a>
              <a className="btn btn-outline" href="#rest-bakery">
                From the bakery
              </a>
            </div>
          </div>
          <figure className="sf-window">
            <img src="/assets/img/photos/cake-red-velvet.webp" width="800" height="667" alt="A 9-inch red velvet cake with white frosting in a clear cake box" decoding="async" />
            <figcaption>Double-layer red velvet, from our bakery.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section sf-glassroom" id="rest-where" aria-labelledby="rest-where-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Three stores</p>
              <h2 id="rest-where-title">Where to find us</h2>
            </div>
          </div>
          <RestaurantPlaces />
        </div>
      </section>

      <section className="section" id="rest-bakery" aria-labelledby="rest-bakery-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">From the bakery</p>
              <h2 id="rest-bakery-title">Double-layer cakes, baked in store</h2>
              <p className="lede">Sponge, chocolate, coconut, almond crumble and red velvet, in 7-inch and 9-inch sizes.</p>
            </div>
          </div>
          <BakeryShelf />
        </div>
      </section>

      <section className="section sf-glassroom" aria-labelledby="rest-kitchen-title">
        <div className="container rest-kitchen">
          <div>
            <p className="eyebrow">From the kitchen</p>
            <h2 id="rest-kitchen-title">A plate while you shop</h2>
            <p className="lede">The restaurant is inside the store, a few steps from the bakery. Sit down to a meal, or take one home with the groceries.</p>
            <p className="rest-note">Each kitchen’s menu and photographs will be added here.</p>
            <div className="cluster">
              <Link className="btn btn-outline" href="/locations">
                A store near me
              </Link>
            </div>
          </div>
          <div className="rest-board">
            <h3>At a glance</h3>
            <p>What you will find at Coffee Street, Couva and Point Fortin.</p>
            <ul>
              <li>
                {TICK}
                Restaurant inside the store
              </li>
              <li>
                {TICK}
                In-house bakery, with cakes in two sizes
              </li>
              <li>
                {TICK}
                Open seven days a week
              </li>
            </ul>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
