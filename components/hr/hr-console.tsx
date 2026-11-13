"use client";

import { useRef, useState } from "react";
import { Stat } from "@/components/admin/bits";
import { StaffUpdatesPanel } from "@/components/admin/staff-updates-panel";
import { AppShell } from "@/components/app-shell";
import { ApplicantDrawer } from "@/components/hr/applicant-drawer";
import { CompliancePanels } from "@/components/hr/compliance-panels";
import { HiringLog, HrResources, PeoplePanel } from "@/components/hr/people-panel";
import { PipelineBoard } from "@/components/hr/pipeline-board";
import { RolesTable } from "@/components/hr/roles-table";
import { Flow } from "@/components/viz";
import { TABS, complianceRows, goToTab, isActive, useHrTab, type HrTab } from "@/lib/hr/hr";
import { can } from "@/lib/access";
import { byId, useData, useRequireRole } from "@/lib/store";
import type { Seed } from "@/lib/types";

// The HR console, ported from hr/index.html and assets/js/hr.js: stats, the hash tabs and the applicant drawer.
// #updates is the Staff updates composer, shown to people with staff.updates. Role: hr. The headings, tabs and empty sections render on the server, as the static HTML did; the data
// fills in once the session is known.

const TAB_LABEL: Record<HrTab, string> = { pipeline: "Hiring pipeline", roles: "Jobs", log: "Hiring log", people: "People", compliance: "Compliance", resources: "Resources", updates: "Staff updates" };

function HrStats({ d }: { d: Seed }) {
  const active = d.applicants.filter(isActive);
  const weekAgo = new Date().getTime() - 7 * 86400000;
  const thisWeek = d.applicants.filter((a) => new Date(a.submittedAt).getTime() >= weekAgo).length;
  const awaiting = active.reduce((n, a) => n + Object.keys(a.docs || {}).filter((k) => a.docs[k] && a.docs[k].state === "uploaded").length, 0);
  const comp = complianceRows(d);
  return (
    <>
      <Stat icon="briefcase" label="Open roles" value={d.jobs.filter((j) => j.status === "open").length} bar={{ value: d.jobs.filter((j) => j.status === "open").length, of: d.jobs.length }} />
      <Stat icon="users" tone="pink" label="Applicants in progress" value={active.length} />
      <Stat icon="file" label="New this week" value={thisWeek} />
      <Stat icon="shield" label="Documents to check" value={awaiting} tone={awaiting ? "warn" : "ok"} />
      <Stat icon="bell" label="Compliance alerts" value={comp.total} tone={comp.total ? "warn" : "ok"} sub={comp.docs.length + " docs · " + comp.training.length + " training · " + comp.leave.length + " leave"} />
    </>
  );
}

export function HrConsole() {
  const s = useRequireRole(["hr"]);
  const d = useData();
  const hashTab = useHrTab();
  const ready = !!s;
  const updates = ready && can(d, s, "staff.updates");
  const people = ready && can(d, s, "hr.people");
  const tabs = TABS.filter((t) => (t !== "updates" || updates) && ((t !== "people" && t !== "resources") || people));
  const count = (stage: string) => d.applicants.filter((a) => a.stage === stage).length;
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
    <AppShell app="hr" active={tab === "updates" ? "hr-updates" : tab} title="HR console" css={["app", "careers", "admin", "ops"]}>
      <div className="page-head">
        <div>
          <p className="eyebrow">HR console</p>
          <h1>Hiring and people</h1>
          <p className="muted">Applications, open jobs, the team at all five stores, and the documents and training that need you.</p>
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
        {ready ? <Flow id="hiring" counts={[d.jobs.filter((j) => j.status === "open").length, count("submitted") + count("screening"), count("kyc"), count("interview"), count("offer"), count("hired")]} /> : null}
        <PipelineBoard ready={ready} onOpen={openDrawer} />
      </section>

      <section id="roles" role="tabpanel" aria-labelledby="tab-roles" hidden={tab !== "roles"}>
        <RolesTable ready={ready} />
      </section>

      <section id="log" role="tabpanel" aria-labelledby="tab-log" hidden={tab !== "log"}>
        {tab === "log" ? <HiringLog ready={ready} /> : null}
      </section>

      {people ? (
        <section id="people" role="tabpanel" aria-labelledby="tab-people" hidden={tab !== "people"}>
          {tab === "people" ? <PeoplePanel ready={ready} /> : null}
        </section>
      ) : null}

      {people ? (
        <section id="resources" role="tabpanel" aria-labelledby="tab-resources" hidden={tab !== "resources"}>
          {tab === "resources" ? <HrResources ready={ready} /> : null}
        </section>
      ) : null}

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
