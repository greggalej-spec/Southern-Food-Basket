import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsletterUnsubscribe, NewsletterWaiting } from "@/components/members/newsletter-pages";
import { SiteFrame } from "@/components/site-frame";

// The one-click unsubscribe link: no sign-in and no "are you sure". Undo is on the preferences page.

export const metadata: Metadata = { title: "Unsubscribe" };

export default function NewsletterUnsubscribePage() {
  return (
    <SiteFrame css={["site", "members"]} page="newsletter-unsubscribe">
      <Suspense fallback={<NewsletterWaiting />}>
        <NewsletterUnsubscribe />
      </Suspense>
    </SiteFrame>
  );
}
