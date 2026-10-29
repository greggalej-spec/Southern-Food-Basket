"use client";

import { useRef, useState } from "react";
import { StaffUpdatesPanel } from "@/components/admin/staff-updates-panel";
import { AppShell } from "@/components/app-shell";
import { ApplicantDrawer } from "@/components/hr/applicant-drawer";
import { CompliancePanels } from "@/components/hr/compliance-panels";
import { PipelineBoard } from "@/components/hr/pipeline-board";
import { RolesTable } from "@/components/hr/roles-table";
import { TABS, complianceRows, goToTab, isActive, useHrTab, type HrTab } from "@/lib/hr/hr";
import { can } from "@/lib/access";
import { byId, useData, useRequireRole } from "@/lib/store";
import type { Seed } from "@/lib/types";

// The HR console, ported from hr/index.html and assets/js/hr.js: stats, the hash tabs and the applicant drawer.
// #updates is the Staff updates composer, shown to people with staff.updates. Role: hr. The headings, tabs and empty sections render on the server, as the static HTML did; the data
// fills in once the session is known.

const TAB_LABEL: Record<HrTab, string> = { pipeline: "Hiring pipeline", roles: "Jobs", compliance: "Compliance", updates: "Staff updates" };

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{String(value)}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

function HrStats({ d }: { d: Seed }) {
  const active = d.applicants.filter(isActive);
  const weekAgo = new Date().getTime() - 7 * 86400000;
  const thisWeek = d.applicants.filter((a) => new Date(a.submittedAt).getTime() >= weekAgo).length;
  const awaiting = active.reduce((n, a) => n + Object.keys(a.docs || {}).filter((k) => a.docs[k] && a.docs[k].state === "uploaded").length, 0);
  const comp = complianceRows(d);
  return (
    <>
      <Stat label="Open roles" value={d.jobs.filter((j) => j.status === "open").length} sub={d.jobs.length + " in total"} />
      <Stat label="Active applicants" value={active.length} sub="still in progress" />
      <Stat label="New this week" value={thisWeek} sub="submitted in the last 7 days" />
      <Stat label="Documents to check" value={awaiting} sub="uploaded, waiting for you to verify or flag" />
      <Stat label="Compliance alerts" value={comp.total} sub={comp.docs.length + " docs · " + comp.training.length + " training · " + comp.leave.length + " leave"} />
    </>
  );
}

export function HrConsole() {
  const s = useRequireRole(["hr"]);
  const d = useData();
  const hashTab = useHrTab();
  const ready = !!s;
  const updates = ready && can(d, s, "staff.updates");
  const tabs = TABS.filter((t) => t !== "updates" || updates);
  const tab: HrTab = tabs.includes(hashTab) ? hashTab : "pipeline";

  // The drawer keeps the last applicant after closing, so the content stays put while it slides out.
  const [drawer, setDrawer] = useState<{ id: string; seq: number } | null>(null);
  const [open, setOpen] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  if (open && drawer && !byId(d.applicants, drawer.id)) setOpen(false);

  function openDrawer(id: string, from: HTMLElement) {
    lastFocus.current = from;
    setDrawer({ id, seq: (drawer?.seq ?? 0) + 1 });
    setOpen(true);
  }

  // Back to the applicant's card (it may have moved column), else whatever opened the drawer.
  function returnFocus() {
    const card = drawer ? document.querySelector<HTMLElement>('.board-card[data-app-id="' + CSS.escape(drawer.id) + '"]') : null;
    return card || lastFocus.current;
  }

  return (
    <AppShell app="hr" active={tab === "updates" ? "hr-updates" : tab} title="HR console" css={["app", "careers"]}>
      <div className="page-head">
        <div>
          <p className="eyebrow">HR console</p>
          <h1>Hiring and compliance</h1>
          <p className="muted">Applications, open jobs, and the staff documents and training that need you.</p>
        </div>
      </div>

      <div className="stats" id="hr-stats">
        {ready ? <HrStats d={d} /> : null}
      </div>

      <div
        className="tabs"
        role="tablist"
        aria-label="Console sections"
        id="hr-tabs"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const i = tabs.indexOf(tab);
          const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
          goToTab(n);
          document.getElementById("tab-" + n)?.focus();
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={"tab-" + t}
            data-tab={t}
            aria-selected={t === tab}
            aria-controls={t}
            tabIndex={t === tab ? 0 : -1}
            onClick={() => {
              if (tab !== t) goToTab(t);
            }}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <section id="pipeline" role="tabpanel" aria-labelledby="tab-pipeline" hidden={tab !== "pipeline"}>
        <PipelineBoard ready={ready} onOpen={openDrawer} />
      </section>

      <section id="roles" role="tabpanel" aria-labelledby="tab-roles" hidden={tab !== "roles"}>
        <RolesTable ready={ready} />
      </section>

      <section id="compliance" role="tabpanel" aria-labelledby="tab-compliance" hidden={tab !== "compliance"}>
        <CompliancePanels ready={ready} />
      </section>

      {updates ? (
        <section id="updates" role="tabpanel" aria-labelledby="tab-updates" hidden={tab !== "updates"}>
          <StaffUpdatesPanel />
        </section>
      ) : null}

      {ready ? <ApplicantDrawer target={drawer} open={open} onClose={() => setOpen(false)} returnFocus={returnFocus} /> : null}
    </AppShell>
  );
}
