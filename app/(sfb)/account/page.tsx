import type { Metadata } from "next";
import { AccountPage } from "@/components/members/account";
import { SiteFrame } from "@/components/site-frame";

// The shopper's account: My offers, details and the ways out. A client page behind the shopper sign-in.

export const metadata: Metadata = { title: "My offers" };

export default function MyOffersPage() {
  return (
    <SiteFrame css={["site", "members"]} page="account" banner>
      <AccountPage />
    </SiteFrame>
  );
}
