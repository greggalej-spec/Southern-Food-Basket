import type { Metadata } from "next";
import { PortalLeave } from "@/components/portal/leave";

// Ported from portal/leave.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Leave",
};

export default function PortalLeavePage() {
  return <PortalLeave />;
}
