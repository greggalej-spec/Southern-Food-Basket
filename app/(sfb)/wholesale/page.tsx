import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { CustomerTypes, EnquiryForm, WholesaleLines, WholesaleSourced } from "@/components/site/wholesale";

// Ported from wholesale.html; the supply lists and the sourced records come from the data, and the trade-account
// enquiry is the same mock (site.js wholesale()).

export const metadata: Metadata = {
  title: "Wholesale and trade",
  description:
    "Wholesale and export supply from Southern Food Basket’s Princes Town trade desk: rice, peas, meats, produce, oils and paper goods by the bag, case or pallet. Trade account enquiry. Unofficial concept by Trinovata.",
};

export default function WholesalePage() {
  return (
    <SiteFrame active="wholesale">
      <section className="page-hero" aria-labelledby="ws-title">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Wholesale and trade</p>
            <h1 id="ws-title">Trade supply for the south</h1>
            <p className="lede">Case and pallet supply for mini-marts, restaurants, canteens and caterers, from the trade desk at Princes Town.</p>
            <div className="hero-actions">
              <a className="btn btn-sign" href="#enquiry">
                Ask about a trade account
              </a>{" "}
              <Link className="btn btn-outline" href="/locations#ptown">
                Princes Town store
              </Link>
            </div>
          </div>
          <figure className="photo-frame">
            <img src="/assets/img/photos/store-produce.webp" width="800" height="640" alt="The fruits and vegetables section of a Southern Food Basket store, with plantain priced at $8.95" decoding="async" />
          </figure>
        </div>
      </section>

      <section className="section section-tight" aria-labelledby="supply-title">
        <div className="container">
          <div className="split split-top">
            <div>
              <p className="eyebrow">What we supply</p>
              <h2 id="supply-title">By the bag, case or pallet</h2>
              <ul className="lines" data-wholesale-lines="">
                <WholesaleLines />
              </ul>
            </div>
            <div>
              <p className="eyebrow">Who we supply</p>
              <h2>Businesses across the south</h2>
              <ul className="lines" data-customer-types="">
                <CustomerTypes />
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section record" aria-labelledby="record-title">
        <div className="container narrow">
          <p className="eyebrow">On the record</p>
          <h2 id="record-title">What public records say</h2>
          <p className="muted">These are the only sourced facts on this site. Everything else here is a concept with demo data, and the records themselves have not been verified with the company.</p>
          <ul className="fact-list" data-wholesale-sourced="">
            <WholesaleSourced />
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="how-title">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">Three steps to a trade account</h2>
          <ol className="steps">
            <li>
              <h3>Tell us what you buy</h3>
              <p>Send the form below, or stop by the trade desk at Princes Town with a list of what you go through in a week.</p>
            </li>
            <li>
              <h3>Get a price list</h3>
              <p>We send a trade price list for your lines. Credit terms are agreed once the account is open.</p>
            </li>
            <li>
              <h3>Order, collect or take delivery</h3>
              <p>Order by phone or WhatsApp. Collect at Princes Town or take delivery across the south from the distribution centre.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="section section-tight" id="enquiry" aria-labelledby="enq-title">
        <div className="container">
          <div className="enquiry">
            <div>
              <p className="eyebrow">Trade account</p>
              <h2 id="enq-title">Enquire about a trade account</h2>
              <p className="muted">Tell us about your business and the store nearest you, and the trade desk will be in touch.</p>
              <p className="hint">Demo form: nothing is sent. Nothing you type here leaves this browser.</p>
            </div>
            <EnquiryForm />
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
