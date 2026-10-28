"use client";

import { AppShell } from "@/components/app-shell";
import { useRequireRole } from "@/lib/store";

// Temporary check page for the app shell and the role guard; deleted before the preview deploy.
export default function AppCheck() {
  const s = useRequireRole(["employee", "hr", "admin"]);
  return (
    <AppShell app="hr" active="roles" title="HR console" css={["app", "careers"]}>
      <div className="container">{s ? <p>Signed in as {s.role}.</p> : null}</div>
    </AppShell>
  );
}
