import type { Metadata } from "next";
import { SiteFrame } from "@/components/site-frame";
import { CommunityForm } from "@/components/site/community";

// Community and partnerships: where a school, charity, club or company asks the store for a donation, a
// sponsorship, a partnership or an in-store promotion. The form feeds the office's request pipeline (/admin#requests).

export const metadata: Metadata = {
  title: "Community and partnerships",
  description: "Ask Southern Food Basket for a donation, a sponsorship, a partnership or an in-store promotion. One short form; every request gets an answer. Prototype.",
};

export default function CommunityPage() {
  return (
    <SiteFrame css={["site"]} page="community">
      <section className="page-hero" aria-labelledby="cm-title">
        <div className="container">
          <p className="eyebrow">Community and partnerships</p>
          <h1 id="cm-title">Ask us. We answer every request.</h1>
          <p className="lede">Schools, charities, churches, mandirs, mosques, sports clubs and companies write to us for donations, sponsorships and promotions. Use this form and your request goes straight to our office.</p>
        </div>
      </section>
      <section className="section section-tight">
        <div className="container community">
          <CommunityForm />
        </div>
      </section>
    </SiteFrame>
  );
}
