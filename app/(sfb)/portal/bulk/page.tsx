import type { Metadata } from "next";
import { PortalBulk } from "@/components/portal/bulk";

// A store manager's bulk orders: the same screen as the office's (components/admin/bulk-panel.tsx), inside the
// employee portal, where only his own store's row can be changed.

export const metadata: Metadata = {
  title: "Bulk orders",
};

export default function PortalBulkPage() {
  return <PortalBulk />;
}
