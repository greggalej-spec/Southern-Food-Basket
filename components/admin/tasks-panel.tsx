"use client";

import { useState } from "react";
import { Seg, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { can, isStaff } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { plural, todayIso } from "@/lib/admin/helpers";
import { daysUntil, fmtDate } from "@/lib/format";
import { AREA_LABEL, addTask, saveResource, setTaskDone, tasksFor, type ResourceForm, type TaskForm } from "@/lib/ops/office";
import { useData, useSession } from "@/lib/store";
import type { Area, ResourceDoc, Seed, Task } from "@/lib/types";

/* Tasks and resources. Tasks are how work is handed over: who, what, by when. Whoever hands them out sees
   everyone's; everyone else sees their own. Resources are the letters, checklists and guides the office reuses,
   kept as text so they can be opened, copied and changed here. */

function dueText(t: Task) {
  const n = daysUntil(t.due);
  if (t.status === "done" || n == null) return fmtDate(t.due, { year: false });
  return n < 0 ? "Overdue since " + fmtDate(t.due, { year: false }) : n === 0 ? "Due today" : n === 1 ? "Due tomorrow" : "Due " + fmtDate(t.due, { year: false });
}

export function ResourceList({ d, area, canEdit }: { d: Seed; area: ResourceDoc["area"][]; canEdit: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ doc: ResourceDoc | null; seq: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const docs = (d.resources || []).filter((r) => area.includes(r.area));
  const cur = docs.find((r) => r.id === openId) || null;
  return (
    <section className="panel" aria-labelledby="res-h">
      <div className="panel-head">
        <h2 id="res-h">Templates, checklists and guides</h2>
        {canEdit ? (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setEditing({ doc: null, seq: (editing?.seq ?? 0) + 1 }); setEditOpen(true); }}>
            Add a document
          </button>
        ) : null}
      </div>
      <ul className="list resource-list">
        {docs.map((r) => (
          <li key={r.id}>
            <div className="grow">
              <strong>{r.title}</strong>
              <p className="row-line muted">{r.summary}</p>
              <div className="meta">{r.kind + (area.length > 1 ? " · " + AREA_LABEL[r.area as Area] : "") + " · updated " + fmtDate(r.updated)}</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpenId(r.id)}>
              Open<span className="visually-hidden">{": " + r.title}</span>
            </button>
          </li>
        ))}
        {docs.length ? null : <li className="empty-row">No documents yet.</li>}
      </ul>
      <SideSheet
        open={!!cur}
        onClose={() => setOpenId(null)}
        title={cur?.title || ""}
        sub={cur ? cur.kind + " · updated " + fmtDate(cur.updated) : undefined}
        footer={
          cur ? (
            <>
              <button className="btn btn-outline" type="button" onClick={() => { navigator.clipboard?.writeText(cur.body.join("\n\n")); }}>
                Copy the text
              </button>
              {canEdit ? (
                <button className="btn btn-ghost" type="button" onClick={() => { setEditing({ doc: cur, seq: (editing?.seq ?? 0) + 1 }); setOpenId(null); setEditOpen(true); }}>
                  Change it
                </button>
              ) : null}
            </>
          ) : undefined
        }
      >
        {cur ? (
          <div className="doc-body">
            {cur.kind === "Checklist" || cur.kind === "Form" || cur.kind === "Guide" ? (
              <ul>
                {cur.body.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            ) : (
              cur.body.map((p) => <p key={p}>{p}</p>)
            )}
          </div>
        ) : null}
      </SideSheet>
      <SideSheet open={editOpen} onClose={() => setEditOpen(false)} title={editing?.doc ? "Change the document" : "Add a document"}>
        {editing && editOpen ? <ResourceFormView key={editing.seq} doc={editing.doc} areas={area} onDone={() => setEditOpen(false)} /> : null}
      </SideSheet>
    </section>
  );
}

function ResourceFormView({ doc, areas, onDone }: { doc: ResourceDoc | null; areas: ResourceDoc["area"][]; onDone: () => void }) {
  const s = useSession();
  const [v, setV] = useState<ResourceForm>(doc ? { area: doc.area, kind: doc.kind, title: doc.title, summary: doc.summary, body: doc.body } : { area: areas[0], kind: "Template", title: "", summary: "", body: [] });
  const [body, setBody] = useState((doc?.body || []).join("\n"));
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lines = body.split(/\n+/).map((x) => x.trim()).filter(Boolean);
    if (!v.title.trim() || !lines.length) return setErr("Give the document a title and some text.");
    if (act(s, "resources.save", v.title, () => saveResource(s, doc?.id || null, { ...v, title: v.title.trim(), summary: v.summary.trim(), body: lines }), "Saved.")) onDone();
  }
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="rs-kind">Kind</label>
          <select id="rs-kind" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as ResourceDoc["kind"] })}>
            {["Template", "Form", "Contact list", "Guide", "Checklist"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        {areas.length > 1 ? (
          <div className="field">
            <label htmlFor="rs-area">For</label>
            <select id="rs-area" value={v.area} onChange={(e) => setV({ ...v, area: e.target.value as ResourceDoc["area"] })}>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABEL[a]}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="rs-title">Title</label>
        <input id="rs-title" type="text" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="rs-sum">What it is for</label>
        <input id="rs-sum" type="text" value={v.summary} onChange={(e) => setV({ ...v, summary: e.target.value })} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="rs-body">The text</label>
        <textarea id="rs-body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} aria-describedby="rs-body-h" />
        <p className="hint" id="rs-body-h">
          One paragraph or checklist item to a line.
        </p>
      </div>
      <button className="btn btn-primary" type="submit">
        Save document
      </button>
    </form>
  );
}

export function TasksPanel() {
  const d = useData();
  const s = useSession();
  const assign = can(d, s, "tasks.assign");
  const [show, setShow] = useState<"open" | "done">("open");
  const [adding, setAdding] = useState(false);
  const mine = tasksFor(d, s);
  const list = mine.filter((t) => t.status === show).sort((a, b) => (show === "open" ? a.due.localeCompare(b.due) : String(b.doneAt).localeCompare(String(a.doneAt))));
  const overdue = mine.filter((t) => t.status === "open" && (daysUntil(t.due) ?? 0) < 0).length;
  const areas: ResourceDoc["area"][] = can(d, s, "analytics.view") && !assign ? ["marketing"] : assign ? ["admin", "marketing"] : ["admin"];

  return (
    <div className="section-stack">
      <Flow id="tasks" />
      <section className="panel" aria-labelledby="tk-h">
        <div className="panel-head">
          <h2 id="tk-h">{assign ? "Everyone’s tasks" : "Your tasks"}</h2>
          <div className="cluster">
            <Seg label="Show" value={show} onChange={setShow} options={[{ id: "open", label: "To do", count: mine.filter((t) => t.status === "open").length }, { id: "done", label: "Done" }]} />
            {assign ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}>
                Hand out a task
              </button>
            ) : null}
          </div>
        </div>
        {overdue && show === "open" ? <p className="sheet-note">{plural(overdue, "task is", "tasks are") + " overdue."}</p> : null}
        <ul className="list task-list" data-tour="task-list">
          {list.map((t) => {
            const late = t.status === "open" && (daysUntil(t.due) ?? 0) < 0;
            return (
              <li key={t.id}>
                <label className="check task-check">
                  <input type="checkbox" checked={t.status === "done"} onChange={(e) => act(s, "tasks.done", t.title, () => setTaskDone(s, t.id, e.target.checked), e.target.checked ? "Ticked off." : "Reopened.")} />
                  <span className="visually-hidden">{"Done: " + t.title}</span>
                </label>
                <div className="grow">
                  <strong>{t.title}</strong>
                  {t.detail ? <p className="row-line muted">{t.detail}</p> : null}
                  <div className="meta">{AREA_LABEL[t.area] + " · " + personName(d, t.assignedTo) + (t.assignedBy !== t.assignedTo ? ", from " + personName(d, t.assignedBy) : "")}</div>
                </div>
                {late ? <Badge variant="bad">{dueText(t)}</Badge> : <span className="small muted task-due">{dueText(t)}</span>}
              </li>
            );
          })}
          {list.length ? null : <li className="empty-row">{show === "open" ? "Nothing to do. Tasks handed to you show here." : "Nothing ticked off yet."}</li>}
        </ul>
      </section>
      <ResourceList d={d} area={areas} canEdit={can(d, s, "resources.edit")} />
      <SideSheet open={adding} onClose={() => setAdding(false)} title="Hand out a task">
        {adding ? <TaskFormView onDone={() => setAdding(false)} /> : null}
      </SideSheet>
    </div>
  );
}

function TaskFormView({ onDone }: { onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const people = (d.employees || []).filter((e) => (d.grants || []).some((g) => g.userId === e.id && isStaff(g.role) && g.role !== "employee" && !g.revokedAt)).sort((a, b) => a.name.localeCompare(b.name));
  const [v, setV] = useState<TaskForm>({ title: "", detail: "", area: "admin", assignedTo: people[0]?.id || "", due: todayIso() });
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || !v.assignedTo) return setErr("Say what needs doing and who it is for.");
    if (act(s, "tasks.assign", v.title, () => addTask(s, { ...v, title: v.title.trim(), detail: v.detail.trim() }), "Handed to " + personName(d, v.assignedTo) + ".")) onDone();
  }
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="tf-title">What needs doing</label>
        <input id="tf-title" type="text" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} autoComplete="off" />
      </div>
      <div className="field">
        <label htmlFor="tf-detail">Details</label>
        <textarea id="tf-detail" rows={2} value={v.detail} onChange={(e) => setV({ ...v, detail: e.target.value })} />
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="tf-who">For</label>
          <select id="tf-who" value={v.assignedTo} onChange={(e) => setV({ ...v, assignedTo: e.target.value })}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name + ", " + p.role}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tf-due">Due</label>
          <input id="tf-due" type="date" value={v.due} onChange={(e) => setV({ ...v, due: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="tf-area">Area</label>
        <select id="tf-area" value={v.area} onChange={(e) => setV({ ...v, area: e.target.value as Area })}>
          {(Object.keys(AREA_LABEL) as Area[]).map((a) => (
            <option key={a} value={a}>
              {AREA_LABEL[a]}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="submit">
        Hand it over
      </button>
    </form>
  );
}
