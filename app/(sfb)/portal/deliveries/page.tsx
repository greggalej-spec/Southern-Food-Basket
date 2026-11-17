import type { Metadata } from "next";
import { PortalDeliveries } from "@/components/portal/deliveries";

// The Couva deliveries trial (staff meeting, 17 Nov 2026), in the supervisor's own portal.

export const metadata: Metadata = {
  title: "Deliveries",
};

export default function PortalDeliveriesPage() {
  return <PortalDeliveries />;
}
