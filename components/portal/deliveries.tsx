"use client";

import { DeliveriesPanel } from "@/components/admin/deliveries-panel";
import { PortalPage } from "@/components/portal/portal-page";
import { can } from "@/lib/access";
import { useSession } from "@/lib/store";

// The Couva deliveries trial in the employee portal, for someone whose access includes deliveries.handle: Narindra,
// Supervisor at Couva. The same board the Managing Directors see in the office console (#deliveries).

export function PortalDeliveries() {
  const s = useSession();
  return (
    <PortalPage active="deliveries" title="Deliveries" page="deliveries" css={["app", "portal", "admin", "ops"]}>
      {(_me, d) =>
        can(d, s, "deliveries.handle") ? (
          <>
            <div className="page-head">
              <div>
                <p className="eyebrow">Deliveries</p>
                <h1>Couva business orders</h1>
                <p className="muted">From the list a company sends to the invoice: quote within one working day, pick, check against their purchase order, deliver.</p>
              </div>
            </div>
            <DeliveriesPanel />
          </>
        ) : (
          <div className="empty">
            <p>Deliveries are run by the Couva supervisor for now. Ask the Managing Director if you need them.</p>
          </div>
        )
      }
    </PortalPage>
  );
}
