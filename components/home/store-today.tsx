"use client";

import { openNow, todayHours } from "@/lib/format";
import { useHydrated } from "@/lib/store";
import type { Branch } from "@/lib/types";

/** "Today 7:00 am – 9:00 pm", plus "Open now" from this device's clock. Before hydration it shows the Mon–Sat row. */
export function StoreToday({ branch }: { branch: Branch }) {
  const now = useHydrated() ? new Date() : null;
  return (
    <span>
      {"Today " + todayHours(branch, now)}
      {now && openNow(branch, now) ? (
        <>
          {" "}
          <span className="open-now">Open now</span>
        </>
      ) : null}
    </span>
  );
}
