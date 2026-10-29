"use client";

import { useEffect, useState } from "react";
import { PortalPage } from "@/components/portal/portal-page";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { fmtDate } from "@/lib/format";
import { acknowledgeStaffUpdate, hasAcked, hasRead, markStaffUpdateRead, sendDueStaffUpdates, updatesFor, waitingFor } from "@/lib/staff-updates";
import { byId, session } from "@/lib/store";
import type { Employee, Seed, StaffUpdate } from "@/lib/types";

// The staff updates a person was sent: the internal newsletter (lib/staff-updates.ts). Opening one marks it read;
// an update that asks for it has an "I have read this" button, which is the record that this person was told.

function from(d: Seed, u: StaffUpdate) {
  const e = byId(d.employees, u.sentBy);
  return e ? e.name + ", " + e.role : "The office";
}

function State({ u, me }: { u: StaffUpdate; me: string }) {
  if (!hasRead(u, me)) return <Badge variant="info">New</Badge>;
  if (u.needsAck && !hasAcked(u, me)) return <Badge variant="warn">Please confirm</Badge>;
  if (u.needsAck) return <Badge variant="ok">Confirmed</Badge>;
  return null;
}

function Update({ u, me, d, open, onToggle }: { u: StaffUpdate; me: Employee; d: Seed; open: boolean; onToggle: () => void }) {
  const ack = u.acks.find((a) => a.employeeId === me.id);
  return (
    <li id={u.id} className={"su-item" + (open ? " is-open" : "")}>
      <div className="grow">
        <div className="su-head">
          <strong id={u.id + "-subject"}>{u.subject}</strong>
          <State u={u} me={me.id} />
        </div>
        <div className="meta">{from(d, u) + " · " + fmtDate(u.sentAt)}</div>
        {!open && u.summary ? <p className="small su-summary">{u.summary}</p> : null}
        {open ? (
          <div className="su-body" id={u.id + "-body"}>
            {u.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {u.needsAck ? (
              ack ? (
                <p className="su-acked">You confirmed you read this on {fmtDate(ack.at)}.</p>
              ) : (
                <div className="su-ack">
                  <p className="small">The office asked everyone on this update to confirm they have read it.</p>
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    data-tour="update-ack"
                    onClick={() => {
                      try {
                        acknowledgeStaffUpdate(session(), u.id);
                        toast("Thank you. The office can see you have read it.", "ok");
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "That did not save. Try again.", "bad");
                      }
                    }}
                  >
                    I have read this
                  </button>
                </div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
      <button
        className="btn btn-ghost btn-sm"
        type="button"
        aria-expanded={open}
        aria-controls={open ? u.id + "-body" : undefined}
        aria-describedby={u.id + "-subject"}
        onClick={onToggle}
      >
        {open ? "Close" : "Read"}
      </button>
    </li>
  );
}

function UpdatesBody({ me, d }: { me: Employee; d: Seed }) {
  const list = updatesFor(d, me.id);
  const waiting = waitingFor(d, me.id);
  const needAck = waiting.filter((u) => u.needsAck && !hasAcked(u, me.id)).length;
  // opened from an e-mail link (/portal/updates#su-…) or the home page: that one starts open
  const [openId, setOpenId] = useState<string | null>(() => (typeof location !== "undefined" ? location.hash.slice(1) || null : null));

  useEffect(() => {
    sendDueStaffUpdates();
  }, []);

  // reading counts once the update is open on screen
  const openIsMine = !!openId && list.some((u) => u.id === openId);
  useEffect(() => {
    if (openId && openIsMine) markStaffUpdateRead(session(), openId);
  }, [openId, openIsMine]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Staff updates</h1>
          <p className="muted">
            News from the office and your store. Each one also went to your work address, {me.email}.
          </p>
        </div>
      </div>
      {needAck ? (
        <p className="alert alert-warn" role="status">
          {needAck === 1 ? "One update asks you to confirm you have read it." : needAck + " updates ask you to confirm you have read them."}
        </p>
      ) : null}
      <section className="panel" aria-labelledby="h-updates" data-tour="portal-updates">
        <div className="panel-head">
          <h2 id="h-updates">{waiting.length ? waiting.length + (waiting.length === 1 ? " needs you" : " need you") + " · " + list.length + " in all" : list.length ? "All read" : "Updates"}</h2>
        </div>
        <ul className="list" id="updates">
          {list.length ? (
            list.map((u) => <Update key={u.id} u={u} me={me} d={d} open={openId === u.id} onToggle={() => setOpenId(openId === u.id ? null : u.id)} />)
          ) : (
            <li>
              <div className="grow muted">No updates yet. When the office sends one, it arrives here and at your work address.</div>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}

export function PortalUpdates() {
  return (
    <PortalPage active="updates" title="Staff updates" page="updates">
      {(me, d) => <UpdatesBody me={me} d={d} />}
    </PortalPage>
  );
}
