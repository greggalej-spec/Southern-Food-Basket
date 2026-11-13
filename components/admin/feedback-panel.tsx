"use client";

import { useState } from "react";
import { Seg, Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { personName } from "@/lib/admin/guard";
import { branchName } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { FB_KIND, FB_STATUS, addFeedbackMessage, assignFeedback, feedbackCounts, setFeedbackStatus } from "@/lib/ops/feedback";
import { byId, useData, useSession } from "@/lib/store";
import type { FeedbackTicket } from "@/lib/types";

/* Customer feedback: what shoppers send through the Feedback button on the public site. One list for customer
   service, complaints first, each ticket with its own thread (notes for staff, replies to the customer, what the
   customer said back). Replies go out by e-mail when the customer left an address; otherwise the card says to call. */

const TONE = { warn: "warn", info: "info", ok: "ok", bad: "bad", plain: "neutral" } as const;
const KIND_TONE: Record<FeedbackTicket["kind"], "bad" | "ok" | "info" | "clay"> = { complaint: "bad", compliment: "ok", question: "info", suggestion: "clay" };
type Show = "open" | "complaint" | "resolved" | "all";

export function FeedbackPanel({ item }: { item: string | null }) {
  const d = useData();
  const [show, setShow] = useState<Show>("open");
  const [openId, setOpenId] = useState<string | null>(item);
  const c = feedbackCounts(d);
  const rank = (t: FeedbackTicket) => (t.status === "resolved" ? 3 : t.kind === "complaint" ? 0 : t.status === "new" ? 1 : 2);
  const list = (d.feedback || [])
    .filter((t) => (show === "all" ? true : show === "resolved" ? t.status === "resolved" : show === "complaint" ? t.kind === "complaint" && t.status !== "resolved" : t.status !== "resolved"))
    .sort((a, b) => rank(a) - rank(b) || b.receivedAt.localeCompare(a.receivedAt));
  const cur = byId(d.feedback, openId);

  return (
    <div className="section-stack">
      <Flow id="feedback" counts={[null, c.new, c.handling, null, c.resolved]} />
      <div className="stats">
        <Stat icon="bell" label="New" value={c.new} tone={c.new ? "warn" : "ok"} />
        <Stat icon="shield" label="Complaints open" value={c.complaints} tone={c.complaints ? "warn" : "ok"} />
        <Stat icon="file" tone="pink" label="Waiting for a reply" value={c.wantsReply} />
        <Stat icon="star" tone="ok" label="Compliments" value={c.compliments} ring={{ value: c.resolved, of: c.all }} sub={c.resolved + " of " + c.all + " tickets resolved"} />
      </div>
      <div className="toolbar">
        <Seg label="Show" value={show} onChange={setShow} options={[{ id: "open", label: "Open", count: c.new + c.handling }, { id: "complaint", label: "Complaints", count: c.complaints }, { id: "resolved", label: "Resolved" }, { id: "all", label: "All" }]} />
      </div>
      <section className="panel">
        <div className="table-wrap flat">
          <table className="stack-table band-table" data-tour="feedback-table">
            <caption className="visually-hidden">Customer feedback tickets</caption>
            <thead>
              <tr>
                <th scope="col">Message</th>
                <th scope="col">Kind</th>
                <th scope="col">Store</th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.length ? (
                list.map((t) => (
                  <tr key={t.id}>
                    <th scope="row">
                      <button className="link-btn cell-title" type="button" onClick={() => setOpenId(t.id)}>
                        {t.name || "A customer"}
                        {t.wantsReply && t.status !== "resolved" ? " · wants a reply" : ""}
                      </button>
                      <span className="meta">{t.ref + " · " + (t.message.length > 90 ? t.message.slice(0, 90) + "…" : t.message)}</span>
                    </th>
                    <td data-label="Kind">
                      <Badge variant={KIND_TONE[t.kind]}>{FB_KIND[t.kind].label}</Badge>
                    </td>
                    <td data-label="Store">{t.branchId ? branchName(d, t.branchId) : "Not one store"}</td>
                    <td data-label="Received">{whenTT(t.receivedAt)}</td>
                    <td data-label="Status">
                      <Badge variant={TONE[FB_STATUS[t.status].tone]}>{FB_STATUS[t.status].label}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    Nothing here. Messages sent with the Feedback button on the website arrive in this list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <SideSheet open={!!cur} onClose={() => setOpenId(null)} title={cur ? cur.name || "A customer" : "Ticket"} sub={cur ? cur.ref + " · " + FB_KIND[cur.kind].label + " · " + (cur.branchId ? branchName(d, cur.branchId) : "not one store") : undefined}>
        {cur ? <Ticket key={cur.id} t={cur} /> : null}
      </SideSheet>
    </div>
  );
}

function Ticket({ t }: { t: FeedbackTicket }) {
  const d = useData();
  const s = useSession();
  const [kind, setKind] = useState<"internal" | "outbound" | "inbound">(t.wantsReply ? "outbound" : "internal");
  const [msg, setMsg] = useState("");
  const [fix, setFix] = useState("");
  const staff = (d.employees || []).filter((e) => (d.grants || []).some((g) => g.userId === e.id && (g.role === "admin" || g.role === "owner") && !g.revokedAt));
  const who = (by: string) => (by === "requester" ? t.name || "The customer" : personName(d, by));
  const canMail = t.contact.includes("@");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    const done = kind === "outbound" ? (canMail ? "Reply sent. It is in the demo outbox." : "Reply kept on the ticket. No e-mail address, so call them.") : kind === "inbound" ? "Their reply is on the ticket." : "Note added.";
    if (act(s, "feedback.message", t.ref, () => addFeedbackMessage(s, t.id, kind, msg.trim()), done)) setMsg("");
  }

  return (
    <div className="request-detail">
      <p className="request-status">
        <Badge variant={TONE[FB_STATUS[t.status].tone]}>{FB_STATUS[t.status].label}</Badge> <span className="muted small">{"Received " + whenTT(t.receivedAt)}</span>
      </p>
      <blockquote className="fb-quote">{t.message}</blockquote>
      <dl className="kv">
        <dt>Reach them</dt>
        <dd>{t.contact || "No contact given"}</dd>
        <dt>Reply wanted</dt>
        <dd>{t.wantsReply ? "Yes" : "No"}</dd>
        {t.resolution ? (
          <>
            <dt>How it ended</dt>
            <dd>{t.resolution}</dd>
          </>
        ) : null}
      </dl>
      <div className="field request-owner">
        <label htmlFor="fb-owner">Looked after by</label>
        <select id="fb-owner" value={t.assignedTo || ""} onChange={(e) => act(s, "feedback.assign", t.ref, () => assignFeedback(s, t.id, e.target.value))}>
          <option value="">Nobody yet</option>
          {staff.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
      <div className="cluster request-actions">
        {t.status === "new" ? (
          <button className="btn btn-outline btn-sm" type="button" onClick={() => act(s, "feedback.status", t.ref, () => setFeedbackStatus(s, t.id, "in-progress"), "Picked up.")}>
            Pick it up
          </button>
        ) : null}
        {t.status !== "resolved" ? (
          <>
            <input type="text" className="fb-fix" aria-label="How it was resolved" placeholder="How it was resolved (optional)" value={fix} onChange={(e) => setFix(e.target.value)} />
            <button className="btn btn-primary btn-sm" type="button" onClick={() => act(s, "feedback.status", t.ref, () => setFeedbackStatus(s, t.id, "resolved", fix.trim() || undefined), "Marked resolved.")}>
              Mark resolved
            </button>
          </>
        ) : (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => act(s, "feedback.status", t.ref, () => setFeedbackStatus(s, t.id, "in-progress"), "Reopened.")}>
            Reopen
          </button>
        )}
      </div>
      <h3 className="sub-h">Notes and replies</h3>
      {t.messages.length ? (
        <ol className="thread">
          {t.messages.map((m, i) => (
            <li key={m.at + i} className={"thread-" + m.kind}>
              <p className="thread-head">
                <strong>{who(m.by)}</strong>
                <span>{m.kind === "internal" ? "Note for staff" : m.kind === "outbound" ? "Reply to the customer" : "From the customer"}</span>
                <time dateTime={m.at}>{whenTT(m.at)}</time>
              </p>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted small">Nothing yet.</p>
      )}
      <form className="thread-form" onSubmit={send}>
        <div className="seg">
          {(["internal", "outbound", "inbound"] as const).map((k) => (
            <button key={k} type="button" className="btn btn-ghost btn-sm" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k === "internal" ? "Note for staff" : k === "outbound" ? "Reply to them" : "Record their reply"}
            </button>
          ))}
        </div>
        <label className="visually-hidden" htmlFor="fb-msg">
          Message
        </label>
        <textarea id="fb-msg" rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={kind === "outbound" ? (canMail ? "This goes to " + t.contact + "." : "No e-mail address: write what you told them on the phone.") : kind === "inbound" ? "What they said." : "Only staff see this."} />
        <button className="btn btn-outline btn-sm" type="submit" disabled={!msg.trim()}>
          {kind === "internal" ? "Add note" : kind === "outbound" ? "Send reply" : "Add their reply"}
        </button>
      </form>
    </div>
  );
}
