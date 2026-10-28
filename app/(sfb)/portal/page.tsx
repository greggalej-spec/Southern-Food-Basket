import type { Metadata } from "next";
import { PortalLogin } from "@/components/portal/login";

// Ported from portal/index.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Staff portal",
};

export default function PortalLoginPage() {
  return <PortalLogin />;
}
