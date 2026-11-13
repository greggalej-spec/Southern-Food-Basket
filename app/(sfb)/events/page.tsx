import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { EventsBoard } from "@/components/site/events";

// "What's on": every promotion, in-store event, community drive and notice that is running or coming, sorted by date.
// The office adds them in the console (Events and flyers); nothing here is typed into the page.

export const metadata: Metadata = {
  title: "Events and promotions",
  description: "Promotions, in-store events, community drives and notices at Southern Food Basket’s five stores in south Trinidad. Prototype.",
};

export default function EventsPage() {
  return (
    <SiteFrame active="events">
      <section className="page-hero" aria-labelledby="ev-title">
        <div className="container">
          <p className="eyebrow">At our stores</p>
          <h1 id="ev-title">Events and promotions</h1>
          <p className="lede">Sales, competitions and celebrations at our five stores, straight from our own posts.</p>
        </div>
      </section>
      <section className="section ev-section" aria-label="Events">
        <div className="container">
          <EventsBoard />
        </div>
      </section>
    </SiteFrame>
  );
}
