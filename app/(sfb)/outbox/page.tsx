import type { Metadata } from "next";
import { Suspense } from "react";
import { Outbox, OutboxWaiting } from "@/components/members/outbox";
import { SiteFrame } from "@/components/site-frame";

// The demo outbox: this site's e-mails, shown for one address at a time. ?to= is read inside Suspense.

export const metadata: Metadata = { title: "Demo outbox" };

export default function OutboxPage() {
  return (
    <SiteFrame css={["site", "members"]} page="outbox" banner>
      <section className="page-hero" aria-labelledby="outbox-title">
        <div className="container narrow">
          <p className="eyebrow">Demo</p>
          <h1 id="outbox-title">Demo outbox</h1>
          <p className="lede">Sign-in links, sign-up confirmations and newsletters land here. Type your address to see the ones sent to you.</p>
          <p className="note outbox-note">Demo outbox: this site sends no e-mail. In production these go out through an e-mail provider.</p>
        </div>
      </section>
      <section className="section outbox-band">
        <div className="container narrow">
          <Suspense fallback={<OutboxWaiting />}>
            <Outbox />
          </Suspense>
        </div>
      </section>
    </SiteFrame>
  );
}
