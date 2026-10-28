import type { Metadata } from "next";
import { PortalHome } from "@/components/portal/home";

// Ported from portal/home.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Home",
};

export default function PortalHomePage() {
  return <PortalHome />;
}
