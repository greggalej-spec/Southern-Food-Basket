import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeleton";
import { SignInForm } from "@/components/members/sign-in";
import { SiteFrame } from "@/components/site-frame";

// The shopper's sign-in: an e-mail address, then a one-time link. The form reads ?next= with useSearchParams, so it
// sits in Suspense under the prerendered hero.

export const metadata: Metadata = { title: "Sign in · Members’ offers" };

export default function ShopperSignInPage() {
  return (
    <SiteFrame active="offers" css={["site", "members"]} page="sign-in" banner>
      <section className="page-hero" aria-labelledby="signin-title">
        <div className="container narrow">
          <p className="eyebrow">Members’ offers</p>
          <h1 id="signin-title">Sign in</h1>
          <p className="lede">Type your e-mail address and we send you a link to sign in. It is free, and there is no password to remember.</p>
        </div>
      </section>
      <section className="section signin-band">
        <div className="container narrow">
          <Suspense fallback={<FormSkeleton fields={1} className="card signin-card" />}>
            <SignInForm />
          </Suspense>
        </div>
      </section>
    </SiteFrame>
  );
}
