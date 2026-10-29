"use client";

import { useRef } from "react";
import { Icon } from "@/components/icon";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// The console's drawer for one record (an offer, a subscriber's consent history, a person's access), built like the
// deal drawer: a heading that takes focus, a close button, the body, and an optional row of actions at the foot.

// A confirm opened from the drawer takes Escape first.
const confirmOpen = () => !!document.querySelector('[data-slot="dialog-content"]:not([data-ending-style])');

export function SideSheet({
  open,
  onClose,
  title,
  sub,
  footer,
  finalFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
  /** Where focus goes once the drawer has closed; false leaves it to the page. */
  finalFocus?: () => HTMLElement | false;
  children: React.ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        if (details.reason === "escape-key" && (details.event.defaultPrevented || confirmOpen())) {
          details.cancel();
          return;
        }
        onClose();
      }}
    >
      <SheetContent render={<aside />} aria-modal="true" initialFocus={titleRef} finalFocus={finalFocus}>
        <div className="drawer-head">
          <div className="grow">
            <SheetTitle tabIndex={-1} ref={titleRef}>
              {title}
            </SheetTitle>
            {sub ? <div className="drawer-sub">{sub}</div> : null}
          </div>
          <button className="icon-btn" type="button" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-foot">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
