import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MeDashboard } from "@/components/careers/me-dashboard";

// Ported from careers/me.html (applicant shell); the dashboard comes from careers.js renderMe.

export const metadata: Metadata = { title: "My application" };

export default function MyApplicationPage() {
  return (
    <AppShell app="careers" active="me" title="My application" css={["app", "careers"]} page="me">
      <MeDashboard />
    </AppShell>
  );
}
