"use client";

import Link from "next/link";
import { useState } from "react";
import { Seg, Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { branchName, dollars, plural, todayIso } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { daysUntil, fmtDate } from "@/lib/format";
import { KIND, KINDS, ORG_TYPES, STAGES, VIAS, addRequestMessage, assignRequest, decideRequest, isOpen, logRequest, moveRequest, requestCounts, stage, type RequestForm } from "@/lib/ops/requests";
import { byId, useData, useSession } from "@/lib/store";
import type { CommunityRequest, FileMeta, RequestKind, RequestStatus, Seed } from "@/lib/types";

/* Partnerships, promotions and donations. Requests used to arrive as letters and WhatsApp messages, get forwarded in
   a chat and wait there. Here each one is a card that moves along a pipeline everyone with access can see; the
   thread on the card holds the notes between staff and the replies to the requester; the director says yes or no
   on the card itself. */

const TONE: Record<string, "neutral" | "warn" | "ok" | "bad" | "info"> = { info: "info", warn: "warn", ok: "ok", bad: "bad", plain: "neutral" };
const COLUMNS: { id: string; label: string; statuses: RequestStatus[] }[] = [
  { id: "new", label: "New", statuses: ["new"] },
  { id: "reviewing", label: "Being looked at", statuses: ["reviewing"] },
  { id: "with-owner", label: "With the director", statuses: ["with-owner"] },
  { id: "approved", label: "Approved, to hand over", statuses: ["approved"] },
  { id: "closed", label: "Closed", statuses: ["done", "declined"] },
];

function due(r: CommunityRequest) {
  if (!r.neededBy || !isOpen(r)) return null;
  const n = daysUntil(r.neededBy);
  if (n == null) return null;
  return n < 0 ? "Was needed " + fmtDate(r.neededBy, { year: false }) : n === 0 ? "Needed today" : "Needed in " + plural(n, "day");
}

function Card({ r, d, onOpen }: { r: CommunityRequest; d: Seed; onOpen: (id: string) => void }) {
  const when = due(r);
  const urgent = when && (daysUntil(r.neededBy) ?? 99) <= 7;
  return (
    <button type="button" className="pipe-card" onClick={() => onOpen(r.id)} data-request={r.ref}>
      <span className="pipe-kind">{KIND[r.kind].label}</span>
      <strong>{r.org}</strong>
      <span className="pipe-ask">{r.ask}</span>
      <span className="pipe-meta">
        {r.ref} · {r.branchId ? branchName(d, r.branchId) : "Head office"}
        {r.status === "declined" ? " · declined" : r.status === "done" ? " · done" : ""}
      </span>
      {when ? <span className={"pipe-due" + (urgent ? " is-soon" : "")}>{when}</span> : null}
    </button>
  );
}

export function RequestsPanel({ item }: { item: string | null }) {
  const d = useData();
  const s = useSession();
  const canLog = can(d, s, "requests.log");
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [kind, setKind] = useState<RequestKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(item);
  const [seenItem, setSeenItem] = useState(item);
  const [logging, setLogging] = useState(false);
  if (item !== seenItem) {
    setSeenItem(item);
    if (item) setOpenId(item);
  }
  const all = (d.requests || []).filter((r) => kind === "all" || r.kind === kind);
  const counts = requestCounts(d);
  const current = byId(d.requests, openId);
  const sorted = all.slice().sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  return (
    <div className="section-stack">
      <Flow id="requests" />

      <div className="stats">
        <Stat icon="bell" label="New" value={counts.new} tone={counts.new ? "warn" : undefined} />
        <Stat icon="user" label="With the director" value={counts.withOwner} tone={counts.withOwner ? "warn" : undefined} />
        <Stat icon="gift" tone="pink" label="To hand over" value={counts.approved} />
        <Stat icon="star" label="Agreed this year" value={counts.agreedThisYear} ring={{ value: counts.agreedThisYear, of: counts.agreedThisYear + counts.declined }} sub={dollars(counts.valueThisYear) + " given"} />
      </div>

      <div className="toolbar">
        <Seg label="View" value={view} onChange={setView} options={[{ id: "pipeline", label: "Pipeline" }, { id: "list", label: "List" }]} />
        <div>
          <label className="visually-hidden" htmlFor="rq-kind">
            Kind of request
          </label>
          <select id="rq-kind" value={kind} onChange={(e) => setKind(e.target.value as RequestKind | "all")}>
            <option value="all">Every kind</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND[k].label}
              </option>
            ))}
          </select>
        </div>
        <span className="grow" />
        <Link className="link-btn small" href="/community" target="_blank">
          See the public form
        </Link>
        {canLog ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setLogging(true)} data-tour="request-log">
            Log a request
          </button>
        ) : null}
      </div>

      {view === "pipeline" ? (
        <div className="pipe" data-tour="request-pipeline">
          {COLUMNS.map((c) => {
            const list = sorted.filter((r) => c.statuses.includes(r.status));
            return (
              <section className="pipe-col" key={c.id} aria-label={c.label}>
                <h3>
                  {c.label} <span className="num">{list.length}</span>
                </h3>
                {list.length ? list.map((r) => <Card key={r.id} r={r} d={d} onOpen={setOpenId} />) : <p className="pipe-empty">Nothing here.</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <div className="table-wrap flat">
            <table className="stack-table">
              <caption className="visually-hidden">Requests, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Who and what</th>
                  <th scope="col">Kind</th>
                  <th scope="col">Received</th>
                  <th scope="col">Store</th>
                  <th scope="col">Where it stands</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <button className="link-btn cell-title" type="button" onClick={() => setOpenId(r.id)}>
                        {r.org}
                      </button>
                      <span className="meta">{r.ref + " · " + r.ask}</span>
                    </th>
                    <td data-label="Kind">{KIND[r.kind].label}</td>
                    <td data-label="Received">{fmtDate(r.receivedAt) + ", " + r.via.toLowerCase()}</td>
                    <td data-label="Store">{r.branchId ? branchName(d, r.branchId) : "Head office"}</td>
                    <td data-label="Where it stands">
                      <Badge variant={TONE[stage(r.status).tone]}>{stage(r.status).label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <SideSheet open={!!current} onClose={() => setOpenId(null)} title={current ? current.org : "Request"} sub={current ? current.ref + " · " + KIND[current.kind].label + " · " + current.orgType : undefined}>
        {current ? <RequestDetail key={current.id} r={current} /> : null}
      </SideSheet>
      <SideSheet open={logging} onClose={() => setLogging(false)} title="Log a request" sub="For a letter, a WhatsApp message, an e-mail or someone at the desk.">
        {logging ? <LogForm onDone={(id) => { setLogging(false); setOpenId(id); }} /> : null}
      </SideSheet>
    </div>
  );
}

function RequestDetail({ r }: { r: CommunityRequest }) {
  const d = useData();
  const s = useSession();
  const canLog = can(d, s, "requests.log");
  const canDecide = can(d, s, "requests.decide");
  const [deciding, setDeciding] = useState<"yes" | "no" | null>(null);
  const [give, setGive] = useState(r.ask);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [msgKind, setMsgKind] = useState<"internal" | "outbound" | "inbound">("internal");
  const [msg, setMsg] = useState("");
  const st = stage(r.status);
  const staff = (d.employees || []).filter((e) => (d.grants || []).some((g) => g.userId === e.id && (g.role === "admin" || g.role === "owner" || g.role === "marketing") && !g.revokedAt));
  const who = (by: string) => (by === "requester" ? r.contact : personName(d, by));

  function decide(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(value.replace(/[$,]/g, ""));
    if (act(s, "requests.decide", r.ref, () => decideRequest(s, r.id, deciding === "yes", { give: give.trim(), value: v > 0 ? v : undefined, note: note.trim() }), deciding === "yes" ? "Approved. The office can now reply." : "Declined.")) setDeciding(null);
  }
  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    const done = msgKind === "outbound" ? (r.email ? "Reply sent. It is in the demo outbox." : "Reply kept on the card. There is no e-mail address, so phone them.") : msgKind === "inbound" ? "Their reply is on the card." : "Note added.";
    if (act(s, "requests.message", r.ref, () => addRequestMessage(s, r.id, msgKind, msg.trim()), done)) setMsg("");
  }

  return (
    <div className="request-detail">
      <p className="request-status">
        <Badge variant={TONE[st.tone]}>{st.label}</Badge> <span className="muted small">{st.explain}</span>
      </p>
      <dl className="kv">
        <dt>They ask for</dt>
        <dd>{r.ask}</dd>
        <dt>What for</dt>
        <dd>{r.purpose}</dd>
        {r.neededBy ? (
          <>
            <dt>Needed by</dt>
            <dd>{fmtDate(r.neededBy)}</dd>
          </>
        ) : null}
        <dt>Contact</dt>
        <dd>
          {r.contact}
          {r.phone ? ", " + r.phone : ""}
          {r.email ? ", " + r.email : ""}
        </dd>
        <dt>Came in</dt>
        <dd>{fmtDate(r.receivedAt) + " by " + r.via.toLowerCase() + (r.branchId ? ", " + branchName(d, r.branchId) : ", head office")}</dd>
        {r.letter ? (
          <>
            <dt>Letter</dt>
            <dd>{r.letter.fileName}</dd>
          </>
        ) : null}
        {r.give ? (
          <>
            <dt>Agreed</dt>
            <dd>
              {r.give}
              {r.value ? " (" + dollars(r.value) + ")" : ""}
            </dd>
          </>
        ) : null}
        {r.decidedBy ? (
          <>
            <dt>{r.status === "declined" ? "Declined by" : "Decided by"}</dt>
            <dd>{personName(d, r.decidedBy) + ", " + whenTT(r.decidedAt)}</dd>
          </>
        ) : null}
      </dl>

      {canLog ? (
        <div className="field request-owner">
          <label htmlFor="rq-owner">Looked after by</label>
          <select id="rq-owner" value={r.owner || ""} onChange={(e) => act(s, "requests.assign", r.ref, () => assignRequest(s, r.id, e.target.value))}>
            <option value="">Nobody yet</option>
            {staff.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="cluster request-actions" data-tour="request-actions">
        {canLog && r.status === "new" ? (
          <button className="btn btn-outline btn-sm" type="button" onClick={() => act(s, "requests.move", r.ref, () => moveRequest(s, r.id, "reviewing"), "Picked up.")}>
            Pick it up
          </button>
        ) : null}
        {canLog && (r.status === "new" || r.status === "reviewing") ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => act(s, "requests.move", r.ref, () => moveRequest(s, r.id, "with-owner"), "Sent to the director.")}>
            Send to the director
          </button>
        ) : null}
        {canDecide && r.status !== "done" && r.status !== "approved" && r.status !== "declined" && !deciding ? (
          <>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setDeciding("yes")}>
              Approve
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDeciding("no")}>
              Decline
            </button>
          </>
        ) : null}
        {canLog && r.status === "approved" ? (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => act(s, "requests.move", r.ref, () => moveRequest(s, r.id, "done"), "Marked done.")}>
            Mark as done
          </button>
        ) : null}
        {!canDecide && r.status === "with-owner" ? <p className="muted small">Only the director’s office can approve or decline.</p> : null}
      </div>

      {deciding ? (
        <form className="decide-form" onSubmit={decide}>
          <h3>{deciding === "yes" ? "Approve this request" : "Decline this request"}</h3>
          {deciding === "yes" ? (
            <>
              <div className="field">
                <label htmlFor="dc-give">What we will give or do</label>
                <textarea id="dc-give" rows={2} value={give} onChange={(e) => setGive(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="dc-value">Value in TTD</label>
                <input id="dc-value" type="text" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby="dc-value-h" />
                <p className="hint" id="dc-value-h">
                  Optional. It adds to the year’s total.
                </p>
              </div>
            </>
          ) : null}
          <div className="field">
            <label htmlFor="dc-note">{deciding === "yes" ? "Note for the office" : "Reason, for the office"}</label>
            <textarea id="dc-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="cluster">
            <button className={"btn btn-sm " + (deciding === "yes" ? "btn-primary" : "btn-danger")} type="submit">
              {deciding === "yes" ? "Approve" : "Decline"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDeciding(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <h3 className="sub-h">Notes and replies</h3>
      {r.messages.length ? (
        <ol className="thread">
          {r.messages.map((m, i) => (
            <li key={m.at + i} className={"thread-" + m.kind}>
              <p className="thread-head">
                <strong>{who(m.by)}</strong>
                <span>{m.kind === "internal" ? "Note for staff" : m.kind === "outbound" ? "Reply to the requester" : "From the requester"}</span>
                <time dateTime={m.at}>{whenTT(m.at)}</time>
              </p>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">Nothing yet. Notes between staff and replies to the requester are kept here, in order.</p>
      )}
      {canLog ? (
        <form className="thread-form" onSubmit={send}>
          <fieldset>
            <legend className="visually-hidden">What you are adding</legend>
            <div className="seg">
              {(["internal", "outbound", "inbound"] as const).map((k) => (
                <button key={k} type="button" className="btn btn-ghost btn-sm" aria-pressed={msgKind === k} onClick={() => setMsgKind(k)}>
                  {k === "internal" ? "Note for staff" : k === "outbound" ? "Reply to them" : "Record their reply"}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="visually-hidden" htmlFor="rq-msg">
            Message
          </label>
          <textarea id="rq-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={msgKind === "internal" ? "Only staff see this." : msgKind === "outbound" ? "This goes to " + (r.email || "the requester") + "." : "What they said, and how (phone, WhatsApp)."} />
          <button className="btn btn-outline btn-sm" type="submit" disabled={!msg.trim()}>
            {msgKind === "internal" ? "Add note" : msgKind === "outbound" ? "Send reply" : "Add their reply"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

const EMPTY: RequestForm = { kind: "donation", org: "", orgType: "Primary school", contact: "", phone: "", email: "", branchId: null, ask: "", purpose: "", neededBy: undefined };

function LogForm({ onDone }: { onDone: (id: string) => void }) {
  const d = useData();
  const s = useSession();
  const [v, setV] = useState<RequestForm>(EMPTY);
  const [via, setVia] = useState<CommunityRequest["via"]>("Letter");
  const [received, setReceived] = useState(() => todayIso());
  const [letter, setLetter] = useState<FileMeta | undefined>();
  const [err, setErr] = useState("");
  const set = <K extends keyof RequestForm>(k: K, val: RequestForm[K]) => setV((p) => ({ ...p, [k]: val }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.org.trim() || !v.ask.trim()) return setErr("Enter who is asking and what they are asking for.");
    let id = "";
    if (act(s, "requests.log", v.org, () => { id = logRequest(s, { ...v, org: v.org.trim(), ask: v.ask.trim(), purpose: v.purpose.trim(), via, receivedAt: received, letter }); }, "Logged.")) onDone(id);
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
          <label htmlFor="lg-kind">Kind</label>
          <select id="lg-kind" value={v.kind} onChange={(e) => set("kind", e.target.value as RequestKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND[k].label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lg-via">How it arrived</label>
          <select id="lg-via" value={via} onChange={(e) => setVia(e.target.value as CommunityRequest["via"])}>
            {VIAS.filter((x) => x !== "Website").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="lg-org">Organisation</label>
        <input id="lg-org" type="text" value={v.org} onChange={(e) => set("org", e.target.value)} autoComplete="off" />
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="lg-type">What they are</label>
          <select id="lg-type" value={v.orgType} onChange={(e) => set("orgType", e.target.value)}>
            {ORG_TYPES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lg-store">Store</label>
          <select id="lg-store" value={v.branchId || ""} onChange={(e) => set("branchId", e.target.value || null)}>
            <option value="">Head office</option>
            {d.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="lg-contact">Contact person</label>
          <input id="lg-contact" type="text" value={v.contact} onChange={(e) => set("contact", e.target.value)} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="lg-phone">Phone</label>
          <input id="lg-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="off" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lg-email">E-mail</label>
        <input id="lg-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" aria-describedby="lg-email-h" />
        <p className="hint" id="lg-email-h">
          Replies from the card go here. Leave it empty if they have none.
        </p>
      </div>
      <div className="field">
        <label htmlFor="lg-ask">What they are asking for</label>
        <textarea id="lg-ask" rows={2} value={v.ask} onChange={(e) => set("ask", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="lg-purpose">What it is for</label>
        <textarea id="lg-purpose" rows={2} value={v.purpose} onChange={(e) => set("purpose", e.target.value)} />
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="lg-received">Received</label>
          <input id="lg-received" type="date" value={received} onChange={(e) => setReceived(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lg-needed">Needed by</label>
          <input id="lg-needed" type="date" value={v.neededBy || ""} onChange={(e) => set("neededBy", e.target.value || undefined)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="lg-letter">Scan or photo of the letter</label>
        <input id="lg-letter" type="file" accept="image/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLetter({ fileName: f.name, size: f.size, type: f.type || "application/pdf" }); }} />
      </div>
      <button className="btn btn-primary" type="submit">
        Log the request
      </button>
    </form>
  );
}

export { STAGES };
