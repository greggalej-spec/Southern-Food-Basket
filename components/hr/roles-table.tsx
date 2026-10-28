"use client";

import { useEffect, useRef } from "react";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { activeFor, branchName, fmtDay, setJobStatus } from "@/lib/hr/hr";
import { byId, useData } from "@/lib/store";

// The roles tab from hr.js: every job, open ones first, with its active applicants and the close/reopen toggle.

export function RolesTable({ ready }: { ready: boolean }) {
  const d = useData();
  const { confirm } = useConfirm();
  // The toggle keeps focus after its row re-sorts.
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    if (!refocus.current) return;
    document.querySelector<HTMLElement>('[data-toggle-job="' + CSS.escape(refocus.current) + '"]')?.focus();
    refocus.current = null;
  });

  async function toggle(id: string) {
    const job = byId(d.jobs, id);
    if (!job) return;
    if (job.status === "open") {
      const active = activeFor(d, job.id);
      if (active) {
        const ok = await confirm({
          title: "Close " + job.title + "?",
          body: active + (active === 1 ? " active applicant stays" : " active applicants stay") + " in the pipeline, but the role disappears from the careers page and no one else can apply.",
          okLabel: "Close role",
          danger: true,
        });
        if (!ok) return;
      }
      refocus.current = job.id;
      setJobStatus(job.id, "closed");
      toast(job.title + " closed");
    } else {
      refocus.current = job.id;
      setJobStatus(job.id, "open");
      toast(job.title + " reopened", "ok");
    }
  }

  const jobs = d.jobs.slice().sort((x, y) => (x.status === y.status ? (y.posted || "").localeCompare(x.posted || "") : x.status === "open" ? -1 : 1));
  return (
    <div className="table-wrap">
      <table id="roles-table">
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">Branch</th>
            <th scope="col">Type</th>
            <th scope="col">Posted</th>
            <th scope="col" className="num">
              Active applicants
            </th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody id="roles-body">
          {ready
            ? jobs.map((j) => {
                const verb = j.status === "open" ? "Close" : "Reopen";
                return (
                  <tr key={j.id}>
                    <td>
                      <strong>{j.title}</strong>
                      <div className="small muted">{j.dept}</div>
                    </td>
                    <td>{branchName(d, j.branchId)}</td>
                    <td>{j.type}</td>
                    <td>{fmtDay(j.posted)}</td>
                    <td className="num">{activeFor(d, j.id)}</td>
                    <td>{j.status === "open" ? <Badge variant="ok">Open</Badge> : <Badge>Closed</Badge>}</td>
                    <td>
                      <Button variant="ghost" size="sm" data-toggle-job={j.id} aria-label={verb + " " + j.title + ", " + branchName(d, j.branchId)} onClick={() => toggle(j.id)}>
                        {verb}
                      </Button>
                    </td>
                  </tr>
                );
              })
            : null}
        </tbody>
      </table>
    </div>
  );
}
