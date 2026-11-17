"use client";

import { Fragment, useEffect } from "react";
import { AppSkeleton } from "@/components/skeleton";
import { AppShell } from "@/components/app-shell";
import type { CssName } from "@/components/scope";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/viz";
import { currentEmployee, logout, useData, useRequireRole } from "@/lib/store";
import type { Employee, LeaveStatus, Role, Seed } from "@/lib/types";

// The frame and the small renderers every employee portal page shares, from portal.js.

// Every page except the demo login needs an employee, HR or admin session (HR and admin also have "My portal").
const PORTAL_ROLES: Role[] = ["employee", "hr", "admin", "purchasing", "marketing", "owner"];

/** An employee portal page: the app shell, the role guard, and the signed-in employee's record. The body renders
 *  once both exist, which is after hydration, so it may read the clock. */
export function PortalPage({
  active,
  title,
  page,
  css = ["app", "portal"],
  children,
}: {
  active: string;
  title: string;
  page: string;
  css?: CssName[];
  children: (me: Employee, d: Seed) => React.ReactNode;
}) {
  const s = useRequireRole(PORTAL_ROLES);
  const d = useData();
  const me = currentEmployee(d, s);

  // A session whose employee record is gone: sign it out, and the guard sends the visitor to the sign-in page.
  useEffect(() => {
    if (s && !me) logout();
  }, [s, me]);

  // The body fills in after hydration, too late for the browser's own jump to #documents or #training on a full
  // load, so make that jump once it exists.
  const ready = !!me;
  useEffect(() => {
    if (ready && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, [ready]);

  return (
    <AppShell app="portal" active={active} title={title} css={css} page={page}>
      {me ? <Fragment key={me.id}>{children(me, d)}</Fragment> : <AppSkeleton />}
    </AppShell>
  );
}

const STATUS: Record<LeaveStatus, { variant: "warn" | "ok" | "bad"; label: string }> = {
  pending: { variant: "warn", label: "Pending" },
  approved: { variant: "ok", label: "Approved" },
  declined: { variant: "bad", label: "Declined" },
};

/** A leave or swap request's status. */
export function StatusBadge({ status }: { status: string }) {
  const s = Object.hasOwn(STATUS, status) ? STATUS[status as LeaveStatus] : null;
  if (s) return <Badge variant={s.variant}>{s.label}</Badge>;
  return <Badge>{String(status || "").replace(/^./, (c) => c.toUpperCase())}</Badge>;
}

/** A figure's number, counted up from zero as the tile arrives (as the office console's tiles do). Only the first
 *  number in the text counts, keeping its decimals and thousands commas: "14 days", "TTD 1,234.50". */
function Counted({ text }: { text: string }) {
  const m = /^(\D*?)(\d[\d,]*)(\.\d+)?(.*)$/.exec(text);
  if (!m) return text;
  const n = Number((m[2] + (m[3] || "")).replace(/,/g, ""));
  const dec = m[3] ? m[3].length - 1 : 0;
  const grouped = m[2].includes(",");
  const format = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouped });
  return (
    <>
      {m[1]}
      <CountUp value={n} format={format} />
      {m[4]}
    </>
  );
}

/** A stat tile. `count` counts its number up as it arrives; leave it off for dates and names. */
export function Stat({ label, value, sub, cls, count }: { label: string; value: string; sub?: string; cls?: string; count?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={"stat-value" + (cls ? " " + cls : "")}>{count ? <Counted text={value} /> : value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return (
    <li>
      <div className="grow muted">{text}</div>
    </li>
  );
}
