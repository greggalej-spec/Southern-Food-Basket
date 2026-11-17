"use client";

import { useState } from "react";
import { Seg, Stat, act } from "@/components/admin/bits";
import { Bars } from "@/components/admin/chart";
import { SideSheet } from "@/components/admin/side-sheet";
import { ResourceList } from "@/components/admin/tasks-panel";
import { AppSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { plural, todayIso } from "@/lib/admin/helpers";
import { DOC_STATE, docDisplayState, fmtDate, initials } from "@/lib/format";
import { branchName } from "@/lib/hr/hr";
import { NOTE_KIND, RATING_AREAS, STATUS_LABEL, STATUS_ORDER, addPerson, addPersonNote, addPersonRating, daysInPipeline, fileAlert, fileHistory, fileText, funnel, headcount, lastEvent, ratingSummary, setPersonStatus, statusOf, statusVariant, teams, years, type PersonForm } from "@/lib/hr/people";
import { byId, stageLabel, useData, useSession } from "@/lib/store";
import type { Employee, EmployeeStatus, HrNoteKind, HrRatingKey } from "@/lib/types";

/* HR's People, Hiring log and Resources tabs. People is the whole team across the five stores, with what needs
   attention on each file. The hiring log is every application since it arrived, in one table, with the funnel
   above it. Resources are HR's own checklists and forms plus the policies staff see in their portal. */

export function PeoplePanel({ ready }: { ready: boolean }) {
  const d = useData();
  const s = useSession();
  const [store, setStore] = useState("all");
  const [team, setTeam] = useState("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"current" | "all" | EmployeeStatus>("current");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  if (!ready) return <AppSkeleton head={false} tiles={0} panels={1} />;
  const all = d.employees || [];
  const query = q.trim().toLowerCase();
  const list = all
    .filter((e) => (store === "all" || e.branchId === store) && (team === "all" || e.dept === team))
    .filter((e) => (status === "all" ? true : status === "current" ? statusOf(e) !== "left" : statusOf(e) === status))
    .filter((e) => !query || [e.name, e.role, e.dept, e.employeeNo, STATUS_LABEL[statusOf(e)], fileText(e)].join(" ").toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));
  const alerts = all.filter((e) => fileAlert(e)).length;
  const cur = byId(all, openId);
  const canEdit = can(d, s, "hr.people");

  return (
    <div className="section-stack">
      <Flow id="people" />
      <div className="stats">
        <Stat icon="users" label="People" value={all.filter((e) => statusOf(e) !== "left").length} sub="five stores" />
        <Stat icon="clock" tone="pink" label="On probation" value={all.filter((e) => e.status === "probation").length} bar={{ value: all.filter((e) => e.status === "probation").length, of: all.length }} />
        <Stat icon="sun" label="On leave" value={all.filter((e) => e.status === "on-leave").length} />
        <Stat icon="shield" label="Files to fix" value={alerts} ring={{ value: all.length - alerts, of: all.length }} tone={alerts ? "warn" : "ok"} />
      </div>
      <div className="people-grid">
        <section className="panel" aria-labelledby="ppl-h">
          <div className="panel-head">
            <h2 id="ppl-h">The team</h2>
            {canEdit ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdding(true)}>
                Add a person
              </button>
            ) : null}
          </div>
          <div className="panel-body">
            <div className="toolbar">
              <div>
                <label className="visually-hidden" htmlFor="ppl-store">
                  Store
                </label>
                <select id="ppl-store" value={store} onChange={(e) => setStore(e.target.value)}>
                  <option value="all">Every store</option>
                  {d.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="visually-hidden" htmlFor="ppl-team">
                  Team
                </label>
                <select id="ppl-team" value={team} onChange={(e) => setTeam(e.target.value)}>
                  <option value="all">Every team</option>
                  {teams(d).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="visually-hidden" htmlFor="ppl-status">
                  Status
                </label>
                <select id="ppl-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="current">Current staff</option>
                  <option value="all">Everyone, past and present</option>
                  {STATUS_ORDER.map((k) => (
                    <option key={k} value={k}>
                      {STATUS_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="toolbar-search">
                <label className="visually-hidden" htmlFor="ppl-q">
                  Search names, jobs and file notes
                </label>
                <input id="ppl-q" type="search" placeholder="Search names, jobs and notes" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <p className="small muted toolbar-count" aria-live="polite">
                {plural(list.length, "person", "people")}
              </p>
            </div>
          </div>
          <div className="table-wrap flat">
            <table className="stack-table people-table" data-tour="people-table">
              <caption className="visually-hidden">Staff, with store, time with the company and the state of their file</caption>
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Store</th>
                  <th scope="col">With us</th>
                  <th scope="col">Status</th>
                  <th scope="col">File</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => {
                  const alert = fileAlert(e);
                  const st = statusOf(e);
                  return (
                    <tr key={e.id} className="person-row" onClick={(ev) => { if (!(ev.target as HTMLElement).closest("button")) setOpenId(e.id); }}>
                      <th scope="row">
                        <span className="person-cell">
                          <span className="avatar" aria-hidden="true">
                            {initials(e.name)}
                          </span>
                          <span>
                            <button className="link-btn cell-title" type="button" onClick={() => setOpenId(e.id)} aria-label={"Open " + e.name + "’s file"}>
                              {e.name}
                            </button>
                            <span className="meta">{e.role + " · " + e.dept}</span>
                          </span>
                        </span>
                      </th>
                      <td data-label="Store">{branchName(d, e.branchId)}</td>
                      <td data-label="With us">{years(e.startDate)}</td>
                      <td data-label="Status">{st === "active" ? "Active" : <Badge variant={statusVariant(st)}>{STATUS_LABEL[st]}</Badge>}</td>
                      <td data-label="File">{alert ? <Badge variant={alert.variant}>{alert.label}</Badge> : <Badge variant="ok">In order</Badge>}</td>
                    </tr>
                  );
                })}
                {list.length ? null : (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Nobody matches. Choose every store, every team and everyone, past and present.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel" aria-labelledby="hc-h">
          <div className="panel-head">
            <h2 id="hc-h">People by store</h2>
          </div>
          <div className="panel-body">
            <Bars color="var(--teal-ink)" rows={headcount(d).map((h) => ({ label: h.name, value: h.count }))} />
            <p className="small muted">Head office staff are counted at the store they sit in.</p>
          </div>
        </section>
      </div>

      <SideSheet open={!!cur} onClose={() => setOpenId(null)} title={cur?.name || ""} sub={cur ? cur.role + " · " + branchName(d, cur.branchId) : undefined}>
        {cur ? <PersonDetail e={cur} canEdit={canEdit} /> : null}
      </SideSheet>
      <SideSheet open={adding} onClose={() => setAdding(false)} title="Add a person" sub="Someone hired outside the online application.">
        {adding ? <PersonFormView onDone={(id) => { setAdding(false); setOpenId(id); }} /> : null}
      </SideSheet>
    </div>
  );
}

function Stars({ value, label }: { value: number; label: string }) {
  const n = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? "on" : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/** A person's profile: their details, and for HR the file — status, ratings, notes and the history of all three. */
function PersonDetail({ e, canEdit }: { e: Employee; canEdit: boolean }) {
  const d = useData();
  const st = statusOf(e);
  const sum = ratingSummary(e);
  return (
    <div className="hr-file">
      <div className="file-head">
        <Badge variant={statusVariant(st)}>{STATUS_LABEL[st]}</Badge>
        {sum.overall != null ? (
          <span className="file-score">
            <Stars value={sum.overall} label={"Overall " + one(sum.overall) + " out of 5"} />
            <span className="small muted">{one(sum.overall) + " overall · " + plural(sum.count, "rating", "ratings")}</span>
          </span>
        ) : (
          <span className="small muted">Not rated yet</span>
        )}
      </div>
      <dl className="kv">
        <dt>Employee number</dt>
        <dd>{e.employeeNo}</dd>
        <dt>Team</dt>
        <dd>{e.dept}</dd>
        <dt>Started</dt>
        <dd>{fmtDate(e.startDate) + " (" + years(e.startDate) + ")"}</dd>
        <dt>Work e-mail</dt>
        <dd>{e.email || "Not set"}</dd>
        <dt>Phone</dt>
        <dd>{e.phone || "Not set"}</dd>
        <dt>Leave left</dt>
        <dd>{e.leave.annualEntitled - e.leave.annualUsed + " annual, " + (e.leave.sickEntitled - e.leave.sickUsed) + " sick"}</dd>
      </dl>
      {canEdit ? (
        <>
          <StatusForm e={e} />
          <RatingBlock e={e} />
          <NoteForm e={e} />
          <h3 className="sub-h">File history</h3>
          <FileHistory e={e} />
        </>
      ) : null}
      <h3 className="sub-h">Documents on file</h3>
      <ul className="list">
        {(e.compliance || []).map((c) => {
          const ds = docDisplayState(c);
          return (
            <li key={c.docId}>
              <div className="grow">
                <strong>{byId(d.kycDocs, c.docId)?.name || c.docId}</strong>
                {c.expiry ? <div className="meta">{"Expires " + fmtDate(c.expiry)}</div> : null}
              </div>
              <Badge variant={DOC_STATE[ds].variant}>{DOC_STATE[ds].label}</Badge>
            </li>
          );
        })}
      </ul>
      <h3 className="sub-h">Training</h3>
      {e.training.length ? (
        <ul className="list">
          {e.training.map((t) => (
            <li key={t.id}>
              <div className="grow">
                <strong>{t.name}</strong>
                <div className="meta">{t.done ? "Completed " + fmtDate(t.completedAt || "") : t.due ? "Due " + fmtDate(t.due) : ""}</div>
              </div>
              <Badge variant={t.done ? "ok" : "warn"}>{t.done ? "Done" : "To do"}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Nothing assigned.</p>
      )}
      <p className="small muted">Leave requests and documents are handled under Compliance.</p>
    </div>
  );
}

function StatusForm({ e }: { e: Employee }) {
  const s = useSession();
  const [to, setTo] = useState<EmployeeStatus>(statusOf(e));
  const [reason, setReason] = useState("");
  const changed = to !== statusOf(e);
  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!changed) return;
    if (act(s, "hr.person", e.name, () => setPersonStatus(s, e.id, to, reason), "Status changed to " + STATUS_LABEL[to].toLowerCase() + ".")) setReason("");
  }
  return (
    <form className="file-box" onSubmit={save}>
      <h3 className="sub-h">Status in the company</h3>
      <div className="field">
        <label htmlFor="pd-status">Status</label>
        <select id="pd-status" value={to} onChange={(ev) => setTo(ev.target.value as EmployeeStatus)}>
          {STATUS_ORDER.map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      {changed ? (
        <>
          <div className="field">
            <label htmlFor="pd-reason">Reason (kept on their file)</label>
            <textarea id="pd-reason" rows={2} value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="For example: passed probation review" />
          </div>
          <div className="file-actions">
            <button className="btn btn-primary btn-sm" type="submit">
              Save status
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setTo(statusOf(e)); setReason(""); }}>
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </form>
  );
}

function RatingBlock({ e }: { e: Employee }) {
  const s = useSession();
  const sum = ratingSummary(e);
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Partial<Record<HrRatingKey, number>>>({});
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!Object.keys(scores).length) return setErr("Give a score in at least one area.");
    if (act(s, "hr.person", e.name, () => addPersonRating(s, e.id, scores, comment), "Rating saved to " + e.name + "’s file.")) {
      setScores({});
      setComment("");
      setErr("");
      setOpen(false);
    }
  }
  return (
    <section className="file-box" aria-labelledby="pd-rate-h">
      <div className="file-box-head">
        <h3 className="sub-h" id="pd-rate-h">
          Ratings
        </h3>
        {open ? null : (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(true)}>
            Rate now
          </button>
        )}
      </div>
      {sum.count ? (
        <ul className="rating-list">
          {sum.areas.map((a) => (
            <li key={a.id}>
              <span className="rating-name">{a.label}</span>
              {a.avg != null ? (
                <>
                  <Stars value={a.avg} label={a.label + ": " + one(a.avg) + " out of 5"} />
                  <span className="num small muted">{one(a.avg)}</span>
                </>
              ) : (
                <span className="small muted">Not rated</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted">No ratings yet. Rate work ethic, punctuality and more from 1 (poor) to 5 (excellent).</p>
      )}
      {sum.count ? <p className="small muted">{"The average of " + plural(sum.count, "rating", "ratings") + ". Each one is kept in the file history."}</p> : null}
      {open ? (
        <form className="rate-form" onSubmit={save} noValidate>
          {err ? (
            <div className="alert alert-bad" role="alert">
              <p>{err}</p>
            </div>
          ) : null}
          <p className="small muted">1 is poor, 3 is what we expect, 5 is excellent. Leave out any area you cannot judge.</p>
          {RATING_AREAS.map((a) => (
            <div className="rate-row" key={a.id}>
              <span className="rating-name" id={"rt-" + a.id}>
                {a.label}
              </span>
              <div className="rate-pick" role="group" aria-labelledby={"rt-" + a.id}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rate-btn"
                    aria-pressed={scores[a.id] === n}
                    aria-label={a.label + " " + n + " out of 5"}
                    onClick={() => {
                      const next = { ...scores };
                      if (next[a.id] === n) delete next[a.id];
                      else next[a.id] = n;
                      setScores(next);
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="field">
            <label htmlFor="pd-rate-c">Comment (optional)</label>
            <textarea id="pd-rate-c" rows={2} value={comment} onChange={(ev) => setComment(ev.target.value)} />
          </div>
          <div className="file-actions">
            <button className="btn btn-primary btn-sm" type="submit">
              Save rating
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setOpen(false); setScores({}); setComment(""); setErr(""); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function NoteForm({ e }: { e: Employee }) {
  const s = useSession();
  const [kind, setKind] = useState<HrNoteKind>("note");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (!text.trim()) return setErr("Write the note first.");
    if (act(s, "hr.person", e.name, () => addPersonNote(s, e.id, kind, text), NOTE_KIND[kind].label + " added to " + e.name + "’s file.")) {
      setText("");
      setErr("");
      setKind("note");
    }
  }
  return (
    <form className="file-box" onSubmit={save} noValidate>
      <h3 className="sub-h">Add to their file</h3>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <Seg label="Kind of note" value={kind} onChange={setKind} options={(Object.keys(NOTE_KIND) as HrNoteKind[]).map((k) => ({ id: k, label: NOTE_KIND[k].label }))} />
      <div className="field">
        <label htmlFor="pd-note">{NOTE_KIND[kind].label}</label>
        <textarea id="pd-note" rows={3} value={text} onChange={(ev) => setText(ev.target.value)} placeholder="What happened, when, and what was agreed" />
      </div>
      <button className="btn btn-primary btn-sm" type="submit">
        Add {NOTE_KIND[kind].label.toLowerCase()}
      </button>
    </form>
  );
}

function FileHistory({ e }: { e: Employee }) {
  const d = useData();
  const items = fileHistory(e);
  if (!items.length) return <p className="small muted">Nothing on file yet. Notes, ratings and status changes appear here, newest first.</p>;
  return (
    <ol className="file-log">
      {items.map((h) => {
        const who = personName(d, h.item.by);
        const when = fmtDate(h.at.slice(0, 10));
        if (h.kind === "note") {
          const k = NOTE_KIND[h.item.kind];
          return (
            <li key={h.item.id}>
              <div className="file-log-top">
                <Badge variant={k.variant}>{k.label}</Badge>
                <span className="meta">{when + " · " + who}</span>
              </div>
              <p>{h.item.text}</p>
            </li>
          );
        }
        if (h.kind === "rating") {
          const r = h.item;
          const vals = Object.values(r.scores).filter((v): v is number => typeof v === "number");
          const avg = vals.reduce((x, y) => x + y, 0) / (vals.length || 1);
          return (
            <li key={r.id}>
              <div className="file-log-top">
                <Badge variant="info">Rating</Badge>
                <span className="meta">{when + " · " + who}</span>
              </div>
              <p>
                {RATING_AREAS.filter((a) => r.scores[a.id] != null)
                  .map((a) => a.label + " " + r.scores[a.id])
                  .join(" · ")}
                <span className="muted">{" (average " + one(avg) + ")"}</span>
              </p>
              {r.comment ? <p className="muted">{r.comment}</p> : null}
            </li>
          );
        }
        const c = h.item;
        return (
          <li key={c.id}>
            <div className="file-log-top">
              <Badge variant="neutral">Status</Badge>
              <span className="meta">{when + " · " + who}</span>
            </div>
            <p>{STATUS_LABEL[c.from] + " → " + STATUS_LABEL[c.to]}</p>
            {c.reason ? <p className="muted">{c.reason}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

function PersonFormView({ onDone }: { onDone: (id: string) => void }) {
  const d = useData();
  const s = useSession();
  const [v, setV] = useState<PersonForm>({ name: "", role: "", dept: d.jobDepts[0] || "Checkout", branchId: d.branches[0].id, startDate: todayIso(), status: "probation", email: "", phone: "" });
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.name.trim() || !v.role.trim()) return setErr("Enter the person’s name and their job.");
    let id = "";
    if (act(s, "hr.person", v.name, () => { id = addPerson(s, { ...v, name: v.name.trim(), role: v.role.trim(), email: v.email.trim(), phone: v.phone.trim() }); }, v.name.trim() + " is on the staff list.")) onDone(id);
  }
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="pf-name">Full name</label>
        <input id="pf-name" type="text" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="off" />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-role">Job</label>
          <input id="pf-role" type="text" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="pf-dept">Team</label>
          <select id="pf-dept" value={v.dept} onChange={(e) => setV({ ...v, dept: e.target.value })}>
            {Array.from(new Set([...d.jobDepts, ...teams(d)])).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-store">Store</label>
          <select id="pf-store" value={v.branchId} onChange={(e) => setV({ ...v, branchId: e.target.value })}>
            {d.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pf-start">Start date</label>
          <input id="pf-start" type="date" value={v.startDate} onChange={(e) => setV({ ...v, startDate: e.target.value })} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="pf-email">Work e-mail</label>
          <input id="pf-email" type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="pf-phone">Phone</label>
          <input id="pf-phone" type="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} autoComplete="off" />
        </div>
      </div>
      <p className="hint">They start on probation with an empty file. Their documents are added under Compliance.</p>
      <div className="drawer-actions">
        <button className="btn btn-primary" type="submit">
          Add to the team
        </button>
      </div>
    </form>
  );
}

export function HiringLog({ ready }: { ready: boolean }) {
  const d = useData();
  const [show, setShow] = useState<"all" | "open" | "closed">("all");
  if (!ready) return <AppSkeleton head={false} tiles={0} panels={1} />;
  const closed = (st: string) => ["hired", "not-selected", "withdrawn"].includes(st);
  const rows = d.applicants.filter((a) => show === "all" || (show === "closed") === closed(a.stage)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const fn = funnel(d);
  const max = Math.max(1, ...fn.map((f) => f.count));
  return (
    <div className="section-stack">
      <div className="people-grid">
        <section className="panel" aria-labelledby="log-h">
          <div className="panel-head">
            <h2 id="log-h">Every application</h2>
            <div>
              <label className="visually-hidden" htmlFor="log-show">
                Show
              </label>
              <select id="log-show" value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
                <option value="all">All applications</option>
                <option value="open">Still in progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="table-wrap flat">
            <table className="stack-table" data-tour="hiring-log">
              <caption className="visually-hidden">Applications, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Applicant</th>
                  <th scope="col">Store</th>
                  <th scope="col">Applied</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Last step</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const job = byId(d.jobs, a.jobId);
                  const last = lastEvent(a);
                  const tone = a.stage === "hired" || a.stage === "offer" ? "ok" : a.stage === "not-selected" || a.stage === "withdrawn" ? "neutral" : "info";
                  return (
                    <tr key={a.id}>
                      <th scope="row">
                        <span className="cell-title">{a.name}</span>
                        <span className="meta">{job ? job.title : "A job no longer listed"}</span>
                      </th>
                      <td data-label="Store">{job ? branchName(d, job.branchId) : ""}</td>
                      <td data-label="Applied">
                        {fmtDate(a.submittedAt.slice(0, 10))}
                        <span className="meta">{closed(a.stage) ? "" : plural(daysInPipeline(a), "day") + " in progress"}</span>
                      </td>
                      <td data-label="Stage">
                        <Badge variant={tone}>{stageLabel(d, a.stage)}</Badge>
                      </td>
                      <td data-label="Last step">
                        {last ? last.text : ""}
                        {last ? <span className="meta">{fmtDate(last.at.slice(0, 10))}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel" aria-labelledby="fn-h">
          <div className="panel-head">
            <h2 id="fn-h">Where applications stand</h2>
          </div>
          <div className="panel-body">
            <ol className="funnel">
              {fn.map((f) => (
                <li key={f.id} className="has-tip" tabIndex={0} data-tip={f.label + ": " + f.count + "\n" + Math.round((f.count / Math.max(1, fn.reduce((a, x) => a + x.count, 0))) * 100) + "% of all applications"}>
                  <span>{f.label}</span>
                  <span>
                    <span className="funnel-bar" style={{ width: Math.max(3, (f.count / max) * 100) + "%" }} />
                  </span>
                  <strong className="num">{f.count}</strong>
                </li>
              ))}
            </ol>
            <p className="small muted">{plural(d.applicants.filter((a) => a.stage === "not-selected").length, "application") + " closed as not selected."}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function HrResources({ ready }: { ready: boolean }) {
  const d = useData();
  const s = useSession();
  if (!ready) return <AppSkeleton head={false} tiles={0} panels={1} />;
  return (
    <div className="section-stack">
      <ResourceList d={d} area={["hr"]} canEdit={can(d, s, "hr.people")} />
      <section className="panel" aria-labelledby="pol-h">
        <div className="panel-head">
          <h2 id="pol-h">Policies staff can read</h2>
          <span className="small muted">Shown in every employee’s portal</span>
        </div>
        <ul className="list">
          {(d.policies || []).map((p) => (
            <li key={p.id}>
              <div className="grow">
                <strong>{p.title}</strong>
                <p className="row-line muted">{p.summary}</p>
                <div className="meta">{"Updated " + fmtDate(p.updated)}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
