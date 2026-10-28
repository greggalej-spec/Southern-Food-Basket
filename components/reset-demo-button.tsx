"use client";

import { useConfirm } from "@/components/confirm";
import { reset } from "@/lib/store";

/** Clears this browser's demo data and session, then reloads the home page. */
export function ResetDemoButton({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const { confirm } = useConfirm();
  async function onClick() {
    const ok = await confirm({
      title: "Reset demo data?",
      body: "This clears everything you changed in this browser and signs you out of the demo portals.",
      okLabel: "Reset",
      danger: true,
    });
    if (!ok) return;
    reset();
    // A full load on purpose, as before: the home page is its own document and every in-memory copy starts again.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    location.href = "/";
  }
  return (
    <button type="button" className={className} style={style} data-reset-demo onClick={onClick}>
      {children}
    </button>
  );
}
