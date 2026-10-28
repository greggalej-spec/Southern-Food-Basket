"use client";

import { useState } from "react";
import { DOC_STATE, docDisplayState } from "@/lib/format";
import { CLOSED_STAGES, MAIN_STAGES, branchName, dotClass, fmtDay, jobLine } from "@/lib/hr/hr";
import { requiredDocsFor, stageLabel, useData } from "@/lib/store";
import type { Applicant, Seed } from "@/lib/types";

// The hiring pipeline tab from hr.js: the role filter, the name search and the board, one column per stage plus
// "Closed". A card opens the applicant drawer.

type OpenDrawer = (id: string, from: HTMLElement) => void;

function BoardCard({ d, a, onOpen }: { d: Seed; a: Applicant; onOpen: OpenDrawer }) {
  const req = requiredDocsFor(d, a);
  const counts = { ok: 0, warn: 0, bad: 0, none: 0 };
  const dots = req.map((doc) => {
    const st = docDisplayState((a.docs || {})[doc.id]);
    const cls = dotClass(st);
    counts[cls || "none"]++;
    return <span key={doc.id} className={cls ? "docdot " + cls : "docdot"} title={doc.name + ": " + (DOC_STATE[st] || DOC_STATE.missing).label}></span>;
  });
  const summary = counts.ok + " verified, " + counts.warn + " awaiting review, " + counts.bad + " need attention, " + counts.none + " not provided";
  return (
    <button type="button" className="board-card" data-app-id={a.id} aria-haspopup="dialog" onClick={(e) => onOpen(a.id, e.currentTarget)}>
      <strong>{a.name}</strong>
      <span className="meta">{jobLine(d, a)}</span>
      <span className="meta">{"Submitted " + fmtDay(a.submittedAt) + (CLOSED_STAGES.includes(a.stage) ? " · " + stageLabel(d, a.stage) : "")}</span>
      <span className="docs" aria-hidden="true">
        {dots}
      </span>
      <span className="visually-hidden">{"Documents: " + summary}</span>
    </button>
  );
}

export function PipelineBoard({ ready, onOpen }: { ready: boolean; onOpen: OpenDrawer }) {
  const d = useData();
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  // A filter on a role that has since closed falls back to every open role, as renderRoleFilter did.
  const open = d.jobs.filter((j) => j.status === "open");
  if (roleFilter !== "all" && !open.some((j) => j.id === roleFilter)) setRoleFilter("all");

  let apps = d.applicants.filter((a) => roleFilter === "all" || a.jobId === roleFilter);
  const q = search.trim().toLowerCase();
  if (q) apps = apps.filter((a) => (a.name || "").toLowerCase().includes(q));
  apps = apps.slice().sort((x, y) => (y.submittedAt || "").localeCompare(x.submittedAt || ""));
  const cols = MAIN_STAGES.map((id) => ({ id, label: stageLabel(d, id), items: apps.filter((a) => a.stage === id) })).concat([
    { id: "closed", label: "Closed", items: apps.filter((a) => CLOSED_STAGES.includes(a.stage)) },
  ]);

  return (
    <>
      <div className="toolbar">
        <div>
          <label className="visually-hidden" htmlFor="pipe-role">
            Filter by role
          </label>
          <select id="pipe-role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All open roles</option>
            {ready
              ? open.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title + " · " + branchName(d, j.branchId)}
                  </option>
                ))
              : null}
          </select>
        </div>
        <div>
          <label className="visually-hidden" htmlFor="pipe-search">
            Search applicants by name
          </label>
          <input type="search" id="pipe-search" placeholder="Search by name" autoComplete="off" onChange={(e) => setSearch(e.target.value)} />
        </div>
        <p className="small muted" id="pipe-count" style={{ margin: 0 }} aria-live="polite">
          {ready ? apps.length + (apps.length === 1 ? " applicant" : " applicants") + (q || roleFilter !== "all" ? " match" : "") : null}
        </p>
      </div>
      <div className="board" id="board" aria-label="Applicants by stage">
        {ready
          ? cols.map((c) => (
              <section key={c.id} className="board-col" aria-labelledby={"col-" + c.id}>
                <div className="board-col-head">
                  <span id={"col-" + c.id}>{c.label}</span>
                  <span className="count" aria-label={c.items.length + " applicants"}>
                    {c.items.length}
                  </span>
                </div>
                {c.items.length ? c.items.map((a) => <BoardCard key={a.id} d={d} a={a} onOpen={onOpen} />) : <p className="board-empty">No one here.</p>}
              </section>
            ))
          : null}
      </div>
    </>
  );
}
