"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { can, scopeOf } from "@/lib/access";
import { fromTtInput, toTtInput, whenTT } from "@/lib/admin/tt";
import { fmtDate } from "@/lib/format";
import {
  LIMITS,
  UPDATE_STATE,
  paragraphs,
  receipts,
  remindStaffUpdate,
  saveStaffUpdate,
  scheduleStaffUpdate,
  sendDueStaffUpdates,
  sendStaffTest,
  sendStaffUpdateNow,
  staffAudience,
  teamsOf,
  updatesForSender,
  type StaffUpdateDraft,
} from "@/lib/staff-updates";
import { byId, session, useData, useSession } from "@/lib/store";
import type { Seed, Session, StaffUpdate } from "@/lib/types";

/* Staff updates in the office console and the HR console: the internal newsletter (lib/staff-updates.ts). A list of
   updates on one side; the selected one on the other, as an editor until it is sent and as read receipts after.
   Every write goes through lib/staff-updates.ts, which checks access again: this screen only shapes what is offered. */

const NEW = "new";

function errText(e: unknown) {
  return e instanceof Error ? e.message : "That did not save. Try again.";
}

function plural(n: number, one: string, many = one + "s") {
  return n + " " + (n === 1 ? one : many);
}

function audienceLine(d: Seed, a: StaffUpdate["audience"]) {
  const stores = a.branches ? a.branches.map((id) => byId(d.branches, id)?.name || id).join(", ") : "Every store";
  const teams = a.teams ? a.teams.join(", ") : "every team";
  return stores + " · " + teams;
}

function statusLine(d: Seed, u: StaffUpdate) {
  if (u.status === "sent") {
    const r = receipts(d, u);
    return "Sent " + fmtDate(u.sentAt) + " to " + plural(r.total, "person", "people") + " · " + (u.needsAck ? r.acked + " confirmed" : r.read + " read");
  }
  if (u.status === "scheduled") return "Goes out " + whenTT(u.scheduledFor);
  return "Draft by " + (byId(d.employees, u.createdBy)?.name || "the office");
}

/** The e-mail as staff will get it. */
function MailPreview({ subject, summary, body, needsAck, count }: { subject: string; summary: string; body: string[]; needsAck: boolean; count: number }) {
  return (
    <figure className="su-mail" aria-label="E-mail preview">
      <figcaption className="su-mail-head">
        <span>
          <b>From</b> Southern Food Basket staff updates
        </span>
        <span>
          <b>To</b> {count ? plural(count, "work address", "work addresses") : "nobody yet"}
        </span>
        <span>
          <b>Subject</b> {subject || "(no subject yet)"}
        </span>
      </figcaption>
      <div className="su-mail-body">
        {summary ? <p className="su-mail-summary">{summary}</p> : null}
        {body.length ? body.map((p, i) => <p key={i}>{p}</p>) : <p className="muted">The update appears here as you write it.</p>}
        <span className="su-mail-btn">{needsAck ? "Read it and confirm in your staff portal" : "Read it in your staff portal"}</span>
        <p className="su-mail-foot">Sent to your work address because you work at Southern Food Basket. Staff updates are work messages, so they have no unsubscribe link.</p>
      </div>
    </figure>
  );
}

function Editor({ d, s, u, onSaved }: { d: Seed; s: Session | null; u: StaffUpdate | null; onSaved: (id: string) => void }) {
  const { confirm } = useConfirm();
  const scope = scopeOf(d, s);
  const stores = (d.branches || []).filter((b) => !scope || scope.includes(b.id));
  const teams = teamsOf(d);

  const [subject, setSubject] = useState(u?.subject || "");
  const [summary, setSummary] = useState(u?.summary || "");
  const [text, setText] = useState((u?.body || []).join("\n\n"));
  const [needsAck, setNeedsAck] = useState(!!u?.needsAck);
  const [allStores, setAllStores] = useState(!scope && (!u || !u.audience.branches));
  const [branches, setBranches] = useState<string[]>(u?.audience.branches || scope || []);
  const [allTeams, setAllTeams] = useState(!u || !u.audience.teams);
  const [pickTeams, setPickTeams] = useState<string[]>(u?.audience.teams || []);
  const [when, setWhen] = useState(toTtInput(u?.scheduledFor));
  const [error, setError] = useState<string | null>(null);

  const draft: StaffUpdateDraft = {
    subject,
    summary,
    body: paragraphs(text),
    needsAck,
    audience: { branches: allStores ? null : branches, teams: allTeams ? null : pickTeams },
  };
  const people = staffAudience(d, draft.audience);
  const scheduled = u?.status === "scheduled";

  function toggle(list: string[], v: string, on: boolean) {
    return on ? Array.from(new Set([...list, v])) : list.filter((x) => x !== v);
  }

  /** Saves the draft first, so a test or a send always uses what is on screen. */
  function save(quiet = false) {
    setError(null);
    try {
      const id = saveStaffUpdate(session(), u?.id || null, draft);
      if (!quiet) toast("Draft saved.", "ok");
      onSaved(id);
      return id;
    } catch (e) {
      setError(errText(e));
      return null;
    }
  }

  function test() {
    const id = save(true);
    if (!id) return;
    try {
      toast("Test sent to " + sendStaffTest(session(), id) + ". It is in the demo outbox.", "ok");
    } catch (e) {
      setError(errText(e));
    }
  }

  function schedule() {
    const at = fromTtInput(when);
    if (!at) return setError("Pick a date and time to send it.");
    const id = save(true);
    if (!id) return;
    try {
      scheduleStaffUpdate(session(), id, at);
      toast("Scheduled for " + whenTT(at) + ".", "ok");
    } catch (e) {
      setError(errText(e));
    }
  }

  function unschedule() {
    if (!u) return;
    try {
      scheduleStaffUpdate(session(), u.id, null);
      toast("Back to draft. Nothing will go out until you send or schedule it.", "ok");
    } catch (e) {
      setError(errText(e));
    }
  }

  async function sendNow() {
    if (!people.length) return setError("Nobody matches those stores and teams.");
    const ok = await confirm({
      title: "Send this update now?",
      body: "It goes to " + plural(people.length, "person", "people") + " at their work addresses and into their staff portal. A sent update cannot be changed.",
      okLabel: "Send to " + plural(people.length, "person", "people"),
    });
    if (!ok) return;
    const id = save(true);
    if (!id) return;
    try {
      const n = sendStaffUpdateNow(session(), id);
      toast("Sent to " + plural(n, "person", "people") + ".", "ok");
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <section className="panel" aria-labelledby="su-edit-h" data-tour="staff-composer">
      <div className="panel-head">
        <h2 id="su-edit-h">{u ? (scheduled ? "Scheduled update" : "Draft update") : "New staff update"}</h2>
        {u ? <Badge variant={UPDATE_STATE[u.status].tone}>{UPDATE_STATE[u.status].label}</Badge> : null}
      </div>
      <form
        className="panel-body su-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label htmlFor="su-subject">Subject</label>
          <input id="su-subject" value={subject} maxLength={LIMITS.subject} onChange={(e) => setSubject(e.target.value)} placeholder="Christmas leave requests open 4 November" />
        </div>
        <div className="field">
          <label htmlFor="su-summary">One-line summary</label>
          <input id="su-summary" value={summary} maxLength={LIMITS.summary} aria-describedby="su-summary-hint" onChange={(e) => setSummary(e.target.value)} />
          <p className="hint" id="su-summary-hint">
            What people see in their inbox before they open it.
          </p>
        </div>
        <div className="field">
          <label htmlFor="su-body">The update</label>
          <textarea id="su-body" rows={8} value={text} maxLength={LIMITS.body} aria-describedby="su-body-hint" onChange={(e) => setText(e.target.value)} />
          <p className="hint" id="su-body-hint">
            Plain words, one point per paragraph. A blank line starts a new paragraph.
          </p>
        </div>
        <label className="check">
          <input type="checkbox" checked={needsAck} onChange={(e) => setNeedsAck(e.target.checked)} />
          <span>
            Ask everyone to confirm they have read it
            <span className="hint su-block">For a new rule, a safety change or a policy. You will see who has not confirmed, and can remind only them.</span>
          </span>
        </label>

        <fieldset className="su-who" data-tour="staff-audience">
          <legend>Who gets it</legend>
          <div className="su-who-group" role="group" aria-labelledby="su-stores-l">
            <p className="su-who-label" id="su-stores-l">
              Stores
            </p>
            {scope ? (
              <p className="hint su-block">Your access covers {stores.map((b) => b.name).join(", ")}, so you can send only to staff there.</p>
            ) : (
              <label className="check">
                <input type="checkbox" checked={allStores} onChange={(e) => setAllStores(e.target.checked)} />
                <span>Every store</span>
              </label>
            )}
            {!allStores
              ? stores.map((b) => (
                  <label className="check" key={b.id}>
                    <input type="checkbox" checked={branches.includes(b.id)} onChange={(e) => setBranches(toggle(branches, b.id, e.target.checked))} />
                    <span>{b.name}</span>
                  </label>
                ))
              : null}
          </div>
          <div className="su-who-group" role="group" aria-labelledby="su-teams-l">
            <p className="su-who-label" id="su-teams-l">
              Teams
            </p>
            <label className="check">
              <input type="checkbox" checked={allTeams} onChange={(e) => setAllTeams(e.target.checked)} />
              <span>Every team</span>
            </label>
            {!allTeams
              ? teams.map((t) => (
                  <label className="check" key={t}>
                    <input type="checkbox" checked={pickTeams.includes(t)} onChange={(e) => setPickTeams(toggle(pickTeams, t, e.target.checked))} />
                    <span>{t}</span>
                  </label>
                ))
              : null}
          </div>
          <div className="su-count" aria-live="polite">
            <strong>{people.length ? "Goes to " + plural(people.length, "person", "people") : "Nobody matches yet"}</strong>
            {people.length ? (
              <details>
                <summary>Show who</summary>
                <ul>
                  {people.map((e) => (
                    <li key={e.id}>{e.name + " · " + e.role + ", " + (byId(d.branches, e.branchId)?.name || "")}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        </fieldset>

        <MailPreview subject={subject} summary={summary} body={draft.body} needsAck={needsAck} count={people.length} />

        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}

        <div className="su-actions">
          <button className="btn btn-ghost" type="submit">
            Save draft
          </button>
          <button className="btn btn-ghost" type="button" onClick={test}>
            Send a test to me
          </button>
          <span className="su-spacer" />
          <button className="btn btn-primary" type="button" onClick={sendNow} disabled={!people.length}>
            Send now
          </button>
        </div>
        <div className="su-schedule">
          <div className="field">
            <label htmlFor="su-when">Or send it later (Trinidad time)</label>
            <input id="su-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <button className="btn btn-ghost" type="button" onClick={schedule}>
            {scheduled ? "Change the time" : "Schedule"}
          </button>
          {scheduled ? (
            <button className="btn btn-ghost" type="button" onClick={unschedule}>
              Back to draft
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function Sent({ d, u }: { d: Seed; u: StaffUpdate }) {
  const r = receipts(d, u);
  const waiting = u.needsAck ? r.unconfirmed : r.unread;
  const by = byId(d.employees, u.sentBy);
  return (
    <section className="panel" aria-labelledby="su-sent-h" data-tour="staff-receipts">
      <div className="panel-head">
        <h2 id="su-sent-h">{u.subject}</h2>
        <Badge variant="ok">Sent</Badge>
      </div>
      <div className="panel-body su-form">
        <dl className="kv">
          <dt>Sent</dt>
          <dd>{whenTT(u.sentAt) + (by ? " by " + by.name : " on schedule")}</dd>
          <dt>To</dt>
          <dd>{audienceLine(d, u.audience) + " (" + plural(r.total, "person", "people") + ")"}</dd>
          <dt>Opened</dt>
          <dd>{r.read + " of " + r.total}</dd>
          {u.needsAck ? (
            <>
              <dt>Confirmed</dt>
              <dd>{r.acked + " of " + r.total}</dd>
            </>
          ) : null}
        </dl>
        {waiting.length ? (
          <div className="su-waiting">
            <p>
              <strong>{u.needsAck ? "Not confirmed yet" : "Not opened yet"}</strong>
            </p>
            <ul>
              {waiting.map((e) => (
                <li key={e.id}>{e.name + " · " + (byId(d.branches, e.branchId)?.name || "")}</li>
              ))}
            </ul>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => {
                try {
                  const n = remindStaffUpdate(session(), u.id);
                  toast("Reminder sent to " + plural(n, "person", "people") + ". Nobody else was e-mailed.", "ok");
                } catch (e) {
                  toast(errText(e), "bad");
                }
              }}
            >
              {"Remind " + (waiting.length === 1 ? "them" : "these " + waiting.length)}
            </button>
          </div>
        ) : (
          <p className="alert alert-ok">{u.needsAck ? "Everyone has confirmed they read it." : "Everyone has opened it."}</p>
        )}
        <MailPreview subject={u.subject} summary={u.summary} body={u.body} needsAck={u.needsAck} count={r.total} />
      </div>
    </section>
  );
}

/** `heading`: false where the page already names the section (the office console's section head). */
export function StaffUpdatesPanel({ heading = true }: { heading?: boolean }) {
  const d = useData();
  const s = useSession();
  // ?update=<id> opens one (the guided tour links to a sent update this way)
  const [selected, setSelected] = useState<string>(() => (typeof location !== "undefined" && new URLSearchParams(location.search).get("update")) || NEW);

  useEffect(() => {
    sendDueStaffUpdates();
  }, []);

  if (!can(d, s, "staff.updates")) return null;

  const order = { draft: 0, scheduled: 1, sent: 2 } as const;
  const list = updatesForSender(d, s)
    .slice()
    .sort((a, b) => order[a.status] - order[b.status] || String(b.sentAt || b.createdAt).localeCompare(String(a.sentAt || a.createdAt)));
  const current = selected === NEW ? null : list.find((u) => u.id === selected) || null;

  const newButton = (
    <button className="btn btn-primary" type="button" onClick={() => setSelected(NEW)}>
      New update
    </button>
  );

  return (
    <div className="su-panel">
      {heading ? (
        <div className="page-head">
          <div>
            <h2 className="admin-h2">Staff updates</h2>
            <p className="muted">The internal newsletter. It goes to staff work addresses and into their portal, never to the shoppers’ list.</p>
          </div>
          {newButton}
        </div>
      ) : (
        <div className="su-bar">
          {can(d, s, "notices.post") ? (
            <p className="muted small">
              For a one-line notice on the staff home page, use <a href="#notices">Staff notices</a>.
            </p>
          ) : null}
          {newButton}
        </div>
      )}
      <div className="su-layout">
        <section className="panel" aria-labelledby="su-list-h">
          <div className="panel-head">
            <h3 id="su-list-h">{plural(list.length, "update")}</h3>
          </div>
          <ul className="list">
            {list.length ? (
              list.map((u) => (
                <li key={u.id} className={u.id === selected ? "is-current" : undefined}>
                  <div className="grow">
                    <strong>{u.subject}</strong>
                    <div className="meta">{statusLine(d, u)}</div>
                    <div className="meta">{audienceLine(d, u.audience)}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" type="button" aria-current={u.id === selected ? "true" : undefined} onClick={() => setSelected(u.id)}>
                    Open<span className="visually-hidden">{": " + u.subject}</span>
                  </button>
                </li>
              ))
            ) : (
              <li>
                <div className="grow muted">No updates yet. Write the first one on the right.</div>
              </li>
            )}
          </ul>
        </section>
        {current && current.status === "sent" ? (
          <Sent d={d} u={current} />
        ) : (
          <Editor key={current ? current.id + current.status : NEW} d={d} s={s} u={current} onSaved={setSelected} />
        )}
      </div>
    </div>
  );
}
