"use client";

import { useSyncExternalStore } from "react";
import { DISCLAIMER } from "@/lib/format";

// Dismissed for the rest of this browser session (sessionStorage), as on the static site. The server render shows
// it; a visitor who already dismissed it sees it go at hydration.
const KEY = "sfb-banner-dismissed";
const listeners = new Set<() => void>();

function dismissed() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function dismiss() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
  listeners.forEach((l) => l());
}

export function ConceptBanner() {
  const hidden = useSyncExternalStore(subscribe, dismissed, () => false);
  if (hidden) return null;
  return (
    <div className="concept-banner" role="note">
      <div className="container">
        <p>
          <strong>Demo.</strong> {DISCLAIMER} Nothing you enter leaves this browser.
        </p>
        <button type="button" onClick={dismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
