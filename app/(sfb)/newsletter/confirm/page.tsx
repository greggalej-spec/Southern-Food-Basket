import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsletterConfirm, NewsletterWaiting } from "@/components/members/newsletter-pages";
import { SiteFrame } from "@/components/site-frame";

// The link in the confirmation e-mail (double opt-in). ?token= is read inside Suspense.

export const metadata: Metadata = { title: "Confirm your e-mail" };

export default function NewsletterConfirmPage() {
  return (
    <SiteFrame css={["site", "members"]} page="newsletter-confirm">
      <Suspense fallback={<NewsletterWaiting />}>
        <NewsletterConfirm />
      </Suspense>
    </SiteFrame>
  );
}
