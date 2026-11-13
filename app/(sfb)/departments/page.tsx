import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site-frame";
import { DeptJumps, DeptSections } from "@/components/site/departments";
import { SEED } from "@/lib/seed";

// Ported from departments.html; the jump chips and the department sections come from the data, as site.js
// departments() rendered them, and #<department id> still lands on its section.

export const metadata: Metadata = {
  title: "Departments",
  description:
    "What is in store at Southern Food Basket: fresh produce and cut veg, cakes, dairy and chilled, snacks, health and fitness, personal care, and bulk wholesale. Prototype.",
};

export default function DepartmentsPage() {
  return (
    <SiteFrame active="departments">
      <section className="page-hero" aria-labelledby="dept-page-title">
        <div className="container">
          <p className="eyebrow">In store</p>
          <h1 id="dept-page-title">Departments</h1>
          <p className="lede">What you will find on the shelves, described from the company’s own posts, with the recent special prices for each department.</p>
          <ul className="chips jump-chips" data-dept-jumps="" aria-label="Jump to a department">
            <DeptJumps />
          </ul>
        </div>
      </section>

      <div data-dept-sections="">
        <DeptSections />
      </div>

      {/* the home's counters strip, with where it comes from and where each store's own list lives */}
      <section className="section section-tight record" aria-labelledby="counters-title">
        <div className="container">
          <p className="eyebrow">In our stores</p>
          <h2 id="counters-title">The counters</h2>
          <p className="muted">Not every store has every counter. Each store&apos;s entry on the store page lists what its own listing and reviews show.</p>
          <ul className="counters">
            {SEED.storeServices.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <span className="source-line">Source: the company&apos;s Facebook page.</span>
          <Link className="more-link" href="/locations">
            What each store has
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}
