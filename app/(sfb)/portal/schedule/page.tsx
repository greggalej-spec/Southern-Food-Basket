import type { Metadata } from "next";
import { PortalSchedule } from "@/components/portal/schedule";

// Ported from portal/schedule.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Schedule",
};

export default function PortalSchedulePage() {
  return <PortalSchedule />;
}
