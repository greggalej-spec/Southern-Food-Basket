import type { Metadata } from "next";
import { Suspense } from "react";
import { NewsletterPreferences, NewsletterWaiting } from "@/components/members/newsletter-pages";
import { SiteFrame } from "@/components/site-frame";

// The "change what you get" link in every weekly e-mail: stores, topics, and a one-click unsubscribe. No sign-in.

export const metadata: Metadata = { title: "E-mail preferences" };

export default function NewsletterPreferencesPage() {
  return (
    <SiteFrame css={["site", "members"]} page="newsletter-preferences">
      <Suspense fallback={<NewsletterWaiting />}>
        <NewsletterPreferences />
      </Suspense>
    </SiteFrame>
  );
}
