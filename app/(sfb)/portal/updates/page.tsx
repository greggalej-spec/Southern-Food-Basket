import type { Metadata } from "next";
import { PortalUpdates } from "@/components/portal/updates";

// Staff updates, the internal newsletter (lib/staff-updates.ts). The page itself is a client component, as the other
// portal pages are.

export const metadata: Metadata = {
  title: "Staff updates",
};

export default function PortalUpdatesPage() {
  return <PortalUpdates />;
}
