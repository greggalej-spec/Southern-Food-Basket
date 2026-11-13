"use client";

import { BulkPanel } from "@/components/admin/bulk-panel";
import { PortalPage } from "@/components/portal/portal-page";
import { can } from "@/lib/access";
import { useSession } from "@/lib/store";

// Bulk orders for someone whose access includes "give your store's quantity" (bulk.store): a store manager. The
// panel itself decides which rows can be typed into; setBulkQty checks it again when a number is saved.

export function PortalBulk() {
  const s = useSession();
  return (
    <PortalPage active="bulk" title="Bulk orders" page="bulk" css={["app", "portal", "admin", "ops"]}>
      {(_me, d) =>
        can(d, s, "bulk.store") || can(d, s, "bulk.manage") ? (
          <>
            <div className="page-head">
              <div>
                <p className="eyebrow">Bulk orders</p>
                <h1>Your store’s numbers</h1>
                <p className="muted">Type how much your store needs. Last time’s figure is beside each box.</p>
              </div>
            </div>
            <BulkPanel />
          </>
        ) : (
          <div className="empty">
            <p>Bulk orders are for store managers and the office. Ask the owner’s office if you need them.</p>
          </div>
        )
      }
    </PortalPage>
  );
}
