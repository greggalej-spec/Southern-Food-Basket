"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/icon";

/* The Deliveries page as a small portal: three tabs under the page heading, one job each.
     Order supplies   the three order steps (delivery-order.tsx)
     Your order       follow, accept, print, report (deliveries.tsx)
     How it works     the steps, the paperwork and the ordering terms
   The tab follows the address (#order, #track, #how), so links in e-mails and on the page open the right one; the
   panels stay mounted, so a list half built or an order looked up is still there when you come back to its tab. */

const TABS: { id: string; label: string; icon: IconName; also: string[] }[] = [
  { id: "order", label: "Order supplies", icon: "basket", also: ["request"] },
  { id: "track", label: "Your order", icon: "truck", also: [] },
  { id: "how", label: "How it works", icon: "help", also: ["terms", "terms-privacy"] },
];

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  addEventListener("hashchange", cb);
  return () => {
    listeners.delete(cb);
    removeEventListener("hashchange", cb);
  };
}
const readHash = () => location.hash.slice(1);

export function DeliveryPortal({ order, track, how }: { order: React.ReactNode; track: React.ReactNode; how: React.ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const tab = (TABS.find((t) => t.id === hash || t.also.includes(hash)) || TABS[0]).id;
  const byClick = useRef(false);
  const bar = useRef<HTMLDivElement>(null);

  // A link to #track or #terms-privacy lands on a panel that was hidden when the browser looked for it, so bring it
  // into view once it is showing. A click on a tab changes the address too, but must not move the page.
  useEffect(() => {
    if (byClick.current) {
      byClick.current = false;
      return;
    }
    if (hash) (document.getElementById(hash) || bar.current)?.scrollIntoView({ block: "start" });
  }, [hash]);

  function show(id: string) {
    byClick.current = true;
    history.replaceState(null, "", "#" + id);
    listeners.forEach((cb) => cb());
  }
  function onKey(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(TABS.findIndex((t) => t.id === tab) + step + TABS.length) % TABS.length];
    show(next.id);
    document.getElementById("dv-tab-" + next.id)?.focus();
  }

  const panes: Record<string, React.ReactNode> = { order, track, how };
  return (
    <div className="dv-portal">
      <div className="dv-tabs" role="tablist" aria-label="Deliveries" ref={bar} onKeyDown={onKey}>
        {TABS.map((t) => (
          <button key={t.id} id={"dv-tab-" + t.id} type="button" role="tab" className="dv-tab" aria-selected={tab === t.id} aria-controls={t.id} tabIndex={tab === t.id ? 0 : -1} onClick={() => show(t.id)}>
            <Icon name={t.icon} />
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div key={t.id} id={t.id} role="tabpanel" aria-labelledby={"dv-tab-" + t.id} hidden={tab !== t.id} className="dv-pane">
          {panes[t.id]}
        </div>
      ))}
    </div>
  );
}
