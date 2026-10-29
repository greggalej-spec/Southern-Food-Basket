import type { Metadata } from "next";
import Link from "next/link";
import { RolesBoard, WhyCards } from "@/components/careers/roles-board";
import { SiteFrame } from "@/components/site-frame";

// Ported from careers/index.html; the why cards, filters and role list come from careers.js renderIndex.

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at Southern Food Basket across San Fernando, Princes Town and Penal. Unofficial concept with demo data.",
};

export default function CareersPage() {
  return (
    <SiteFrame active="careers" css={["careers"]} page="index" banner>
      {/* the home's careers band, in full: the team in the arched window (fanlight = people) and the family's line */}
      <section className="page-hero" aria-labelledby="careers-title">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Careers</p>
            <h1 id="careers-title">Be a part of the family, join the team!</h1>
            <p className="lede">Shop floor, bakery, warehouse and office jobs across five stores, with one online application for all of them.</p>
            <div className="cluster">
              <a className="btn btn-sign" href="#roles">
                See open jobs
              </a>
              <Link className="btn btn-outline" href="/portal">
                Check my application
              </Link>
            </div>
          </div>
          <figure className="arch-photo">
            <img src="/assets/img/photos/team-flags.webp" width="800" height="600" alt="Southern Food Basket staff in red shirts holding the company's pink and green flags" />
          </figure>
        </div>
      </section>

      <section className="section" aria-labelledby="why-h">
        <div className="container">
          <p className="eyebrow">Why work here</p>
          <h2 id="why-h">What you can count on</h2>
          <WhyCards />
        </div>
      </section>

      <section className="section section-tight" id="roles" aria-labelledby="roles-h">
        <div className="container">
          <div className="roles-head">
            <p className="eyebrow">Open roles</p>
            <h2 id="roles-h">Who we are hiring now</h2>
          </div>
          <RolesBoard />
        </div>
      </section>

      <section className="section section-tight" aria-labelledby="how-h">
        <div className="container">
          <div className="how-strip">
            <h2 id="how-h">How hiring works</h2>
            <ol>
              <li>
                <strong>Apply</strong>
                <p>Five short steps online. Save and come back any time.</p>
              </li>
              <li>
                <strong>Under review</strong>
                <p>HR reads your application, usually within three working days.</p>
              </li>
              <li>
                <strong>Document check</strong>
                <p>We check your ID, BIR, NIS and references. You see what is still missing, and what to do about it.</p>
              </li>
              <li>
                <strong>Interview</strong>
                <p>At the store you applied to, with the team lead.</p>
              </li>
              <li>
                <strong>Decision</strong>
                <p>We e-mail you that there is an update, and you open it in your dashboard. An offer comes with the pay and start date in writing.</p>
              </li>
            </ol>
            <p className="how-foot">
              {"Already applied? "}
              <Link href="/portal">Check your application</Link>
              {" (demo login)."}
            </p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
