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
      <section className="careers-hero surface-dark glass-overlay">
        <div className="container">
          <p className="eyebrow">Careers</p>
          <h1>Work close to home.</h1>
          <p className="lede">Five stores and a distribution centre across south Trinidad, hiring from the communities we serve.</p>
          <div className="cluster">
            <a className="btn btn-light" href="#roles">
              See open roles
            </a>
            <Link href="/portal">Already applied? Check your application</Link>
          </div>
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
                <strong>Screening</strong>
                <p>HR reads your application within three working days.</p>
              </li>
              <li>
                <strong>Documents (KYC)</strong>
                <p>We check your ID, BIR, NIS and references. You see what is still missing.</p>
              </li>
              <li>
                <strong>Interview</strong>
                <p>At the branch you applied to, with the team lead.</p>
              </li>
              <li>
                <strong>Offer</strong>
                <p>Pay, start date and hours in writing. Accept or decline in your dashboard.</p>
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
