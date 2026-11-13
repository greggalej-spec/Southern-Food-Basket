import type { Metadata } from "next";
import Link from "next/link";
import { FlowsPage } from "@/components/flows-page";
import { SiteFrame } from "@/components/site-frame";

// Every department's process as a moving diagram, on one page. The diagrams are components/viz.tsx <Flow>, fed by
// lib/flows.ts, the same script as the guides inside the staff screens.

export const metadata: Metadata = {
  title: "How it all flows",
  description: "Every process in the Southern Food Basket system as a diagram: supplier specials, requests, bulk orders, marketing figures, the website’s seasons, hiring and sign-in. Prototype.",
};

export default function HowItWorksPage() {
  return (
    <SiteFrame css={["site", "app", "ops"]} page="how-it-works" banner>
      <section className="section">
        <div className="container">
          <p className="eyebrow">How it all flows</p>
          <h1>One system, every department</h1>
          <p className="lede">Each diagram below is a job the business does today by WhatsApp, notebook or spreadsheet, and how it moves once it is in one place. They run by themselves; point at a step to hold it, or click one to read it.</p>
          <p>
            <Link className="btn btn-sign" href="/portal">
              Sign in and try it
            </Link>{" "}
            <Link className="btn btn-outline" href="/tour">
              Take the guided tour
            </Link>
          </p>
          <FlowsPage />
        </div>
      </section>
    </SiteFrame>
  );
}
