import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icon";
import { SiteFrame } from "@/components/site-frame";
import { DeliveryRequestForm, OrderLookup } from "@/components/site/deliveries";
import { CLAIM_HOURS, QUOTE_DAYS, REPLY_HOURS, ZONES } from "@/lib/ops/delivery-terms";
import { SEED } from "@/lib/seed";

// Deliveries for businesses: the quote service agreed at the staff meeting of 17 Nov 2026, run from Couva as a trial.
// A company sends its list, gets a priced quote within one working day, accepts it with its purchase order, and the
// order is picked, checked against the PO, delivered with a delivery note to sign, and invoiced with a tax invoice.
// No prices or payments on the site. The forms feed the staff portal's Deliveries board (/portal/deliveries), which
// Narindra, Supervisor at Couva, looks after. The terms below are PROPOSED (lib/ops/deliveries.ts holds the numbers);
// the directors confirm them before this goes live. Research behind them: SITE.md, "Deliveries".

export const metadata: Metadata = {
  title: "Deliveries for businesses",
  description: "Coffee, tea, sugar, water, drinks and cleaning supplies for offices at Point Lisas and around Couva. Send your list, get a priced quote with VAT within one working day, accept it with your purchase order, and get a delivery note and tax invoice. Prototype.",
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "file", title: "Send your list", text: "Each item with its size and how many. Type it in or attach your own list." },
  { icon: "clock", title: "Get your quotation", text: "By e-mail within one working day: prices before VAT, the VAT, any swaps and the delivery fee." },
  { icon: "check", title: "Accept with your PO", text: "Online under Your order, or by reply. Nothing is packed before your purchase order arrives." },
  { icon: "boxes", title: "Picked and checked", text: "Picked at Couva, then checked line by line against your PO by a second person, best-before dates included." },
  { icon: "truck", title: "Delivered and invoiced", text: "Sign the delivery note at the door; your tax invoice quotes your PO and charges only what was delivered." },
];

const couva = SEED.branches.find((b) => b.id === "couva");
const fees = ZONES.filter((z) => z.fee != null).map((z) => z.label).join(" and ");

/** The terms, as questions a buyer asks. PROPOSED: see the comment at the top. */
const TERMS: { id: string; q: string; a: React.ReactNode }[] = [
  { id: "who", q: "Who can order?", a: <p>During the trial, businesses at Point Lisas Industrial Estate and around Couva: offices, sites, canteens and workshops. Orders are filled from our Couva store, 696 Southern Main Road.</p> },
  { id: "quote", q: "How soon will I have my quotation?", a: <p>Within {REPLY_HOURS} hours of your list, on working days. It comes by e-mail and is also under Your order on this page.</p> },
  {
    id: "prices", q: "Are the prices on the quotation final?",
    a: (
      <p>
        Yes, until the date on the quotation, usually {QUOTE_DAYS} days. Prices are shown before VAT, with each line’s VAT treatment: 12.5% standard rate, zero-rated or exempt, as the law has it for that item. If we are out of something and you allowed swaps, the quotation names the swap and its price before you accept.
      </p>
    ),
  },
  { id: "accept", q: "How do I accept?", a: <p>Open Your order with your reference and e-mail address, enter your purchase order number and attach the PO. Or reply to the quotation with it. Your PO number goes on the delivery note and the tax invoice, so your accounts team can match all three.</p> },
  {
    id: "when", q: "When will it arrive?",
    a: (
      <p>
        Once your PO is in, we call to agree the day and a time window. Tell us how to get in: the gate, any pass or ID, safety boots or hi-vis, and your receiving hours. We do not deliver while the estate barriers are closed for public holidays. Heavy orders go with two people on our van.
      </p>
    ),
  },
  { id: "fee", q: "What does delivery cost?", a: <p>A small fee by distance for {fees}, shown on your quotation before you accept. Elsewhere we price it by distance. Collecting from our Couva store is free.</p> },
  {
    id: "pay", q: "How do I pay?",
    a: (
      <p>
        On invoice to your accounts department, on the terms printed on your quotation, or by debit or credit card when the goods arrive. No payment is taken on this website, and we do not take cash on delivery.
      </p>
    ),
  },
  {
    id: "papers", q: "What paperwork will I get?",
    a: (
      <p>
        A quotation; a delivery note with the goods, which you check and sign; and a tax invoice showing our VAT registration number, your company name and address, each item, the amount before VAT, the VAT and the total. You can print the quotation and the tax invoice from Your order.
      </p>
    ),
  },
  {
    id: "wrong", q: "What if something is short, damaged or wrong?",
    a: (
      <p>
        Check the goods against the delivery note and write any shortage or damage on it before you sign. If you find something later, report it under Your order within {CLAIM_HOURS} hours of delivery and we will replace it or credit your invoice. If we are short when we pick, we tell you before it leaves and you are only invoiced for what we deliver.
      </p>
    ),
  },
  { id: "dates", q: "What about best-before dates?", a: <p>Every line is checked twice before it leaves, best-before dates included.</p> },
  {
    id: "privacy", q: "How do you use my details?",
    a: (
      <p id="terms-privacy">
        Only to quote, deliver and invoice your orders, and to contact you about them. We keep them with the order records for our accounts and do not add you to any mailing list unless you sign up yourself.
      </p>
    ),
  },
];

export default function DeliveriesPage() {
  return (
    <SiteFrame active="deliveries" page="deliveries">
      <section className="page-hero" aria-labelledby="dv-title">
        <div className="container">
          <p className="eyebrow">Deliveries for businesses</p>
          <h1 id="dv-title">Your office supplies, from our Couva store</h1>
          <p className="lede">Coffee, tea, sugar, creamer, water, drinks and cleaning supplies for offices and sites at Point Lisas and around Couva. Send us your list and we reply with a priced quotation within one working day.</p>
          <div className="hero-actions">
            <a className="btn btn-sign" href="#request">
              Ask for a quote
            </a>{" "}
            <a className="btn btn-outline" href="#track">
              Your order
            </a>
          </div>
          <p className="dl-trial">
            <Icon name="store" /> A trial from our Couva store, for businesses first.
          </p>
        </div>
      </section>

      <section className="section section-tight" aria-labelledby="dv-how">
        <div className="container">
          <h2 id="dv-how" className="dl-h2">
            How it works
          </h2>
          <ol className="how-steps dl-steps" aria-label="How it works">
            {STEPS.map((st, i) => (
              <li key={st.title}>
                <span className="how-num" aria-hidden="true">
                  <Icon name={st.icon} />
                </span>
                <div>
                  <strong>{i + 1 + ". " + st.title}</strong>
                  <p>{st.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-tight" id="request" aria-label="Ask for a quote">
        <div className="container dl-page">
          <DeliveryRequestForm />
          <aside className="dl-notes" aria-label="Good to know">
            <div className="dl-note">
              <span className="how-num" aria-hidden="true">
                <Icon name="tag" />
              </span>
              <div>
                <strong>Priced for you</strong>
                <p>No prices online. Every quotation shows prices before VAT, the VAT and how long the prices hold.</p>
              </div>
            </div>
            <div className="dl-note">
              <span className="how-num" aria-hidden="true">
                <Icon name="wallet" />
              </span>
              <div>
                <strong>On invoice or by card</strong>
                <p>No payment on the website and no cash on delivery.</p>
              </div>
            </div>
            <div className="dl-note">
              <span className="how-num" aria-hidden="true">
                <Icon name="file" />
              </span>
              <div>
                <strong>Proper paperwork</strong>
                <p>Quotation, a delivery note to sign, and a tax invoice that quotes your PO.</p>
              </div>
            </div>
            <p className="hint">
              Questions about an order: use the feedback button and choose “Delivery or order”{couva?.phone ? ", or call our Couva store on " + couva.phone : ""}. Give your DL- reference.
            </p>
          </aside>
        </div>
      </section>

      <section className="section section-tight" id="track" aria-label="Your order">
        <div className="container dl-page">
          <OrderLookup />
        </div>
      </section>

      <section className="section section-tight" id="terms" aria-labelledby="dv-terms">
        <div className="container dl-page">
          <div className="dl-terms">
            <h2 id="dv-terms" className="dl-h2">
              Ordering terms
            </h2>
            {TERMS.map((t) => (
              <details key={t.id} className="dl-term">
                <summary>{t.q}</summary>
                {t.a}
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
