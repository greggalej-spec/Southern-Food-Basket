import type { Metadata } from "next";
import { PortalProfile } from "@/components/portal/profile";

// Ported from portal/profile.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Profile",
};

export default function PortalProfilePage() {
  return <PortalProfile />;
}
