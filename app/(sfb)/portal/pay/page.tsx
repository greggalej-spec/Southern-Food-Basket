import type { Metadata } from "next";
import { PortalPay } from "@/components/portal/pay";

// Ported from portal/pay.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Pay",
};

export default function PortalPayPage() {
  return <PortalPay />;
}
