import type { Metadata } from "next";
import { Suspense } from "react";
import { Verify, VerifyWaiting } from "@/components/members/sign-in";
import { SiteFrame } from "@/components/site-frame";

// Where a sign-in link lands: it is used once, then the shopper goes on to ?next= (inside their area) or My offers.

export const metadata: Metadata = { title: "Signing in · Members’ offers" };

export default function VerifyPage() {
  return (
    <SiteFrame active="offers" css={["site", "members"]} page="verify" banner>
      <Suspense fallback={<VerifyWaiting />}>
        <Verify />
      </Suspense>
    </SiteFrame>
  );
}
