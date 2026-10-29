import type { Metadata } from "next";
import { PortalTill } from "@/components/portal/till";

// The till code check; the page itself is a client component (components/portal), like the other portal pages.

export const metadata: Metadata = {
  title: "Check a code",
};

export default function PortalTillPage() {
  return <PortalTill />;
}
