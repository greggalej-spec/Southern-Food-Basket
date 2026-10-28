import type { Metadata } from "next";
import { PortalDocs } from "@/components/portal/docs";

// Ported from portal/docs.html; the page itself is a client component (components/portal), as portal.js ran in the page.

export const metadata: Metadata = {
  title: "Documents & training",
};

export default function PortalDocsPage() {
  return <PortalDocs />;
}
