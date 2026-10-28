"use client";

import { useRef, useState } from "react";
import { PortalPage, StatusBadge } from "@/components/portal/portal-page";
import { toast } from "@/components/ui/sonner";
import { daysBetween } from "@/lib/format";
import { cmp, dateRange, plural } from "@/lib/portal/format";
import { requestLeave } from "@/lib/store";
import type { Employee, LeaveBalance, LeaveType } from "@/lib/types";

// Leave balances, the request form and request history (portal/leave.html, renderLeave in portal.js).

const TYPES: [LeaveType, "annual" | "sick" | "casual"][] = [
  ["Annual", "annual"],
  ["Sick", "sick"],
  ["Casual", "casual"],
];

function balances(me: Employee) {
  const lv: Partial<LeaveBalance> = me.leave || {};
  return TYPES.map(([label, key]) => {
    const ent = Number(lv[`${key}Entitled`]) || 0, used = Number(lv[`${key}Used`]) || 0;
    return { label, ent, used, left: Math.max(0, ent - used) };
  });
}

type Field = "from" | "to";

function LeaveBody({ me }: { me: Employee }) {
  const [type, setType] = useState<LeaveType>("Annual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<{ msg: string; field: Field } | null>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const bals = balances(me);
  const remainingFor = (label: string) => bals.find((x) => x.label === label)?.left ?? 0;

  // preview(): the day count and the over-balance warning for the dates as they stand.
  let daysLine = "", warn = "";
  if (from && to && to >= from) {
    const n = daysBetween(from, to), left = remainingFor(type);
    daysLine = plural(n, "day") + " requested · " + plural(left, "day") + " of " + type.toLowerCase() + " leave left";
    if (n > left) warn = "This is " + plural(n - left, "day") + " more than your remaining " + type.toLowerCase() + " leave. You can still send it; your manager decides.";
  }

  function fail(msg: string, field: Field) {
    setError({ msg, field });
    (field === "from" ? fromRef : toRef).current?.focus();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!from) return fail("Choose a start date.", "from");
    if (!to) return fail("Choose an end date.", "to");
    if (to < from) return fail("The end date must be on or after the start date.", "to");
    const days = daysBetween(from, to);
    requestLeave(me.id, { type, from, to, days, reason: reason.trim().slice(0, 200) });
    toast("Leave request sent: " + plural(days, "day") + " " + type.toLowerCase() + ", " + dateRange(from, to) + ".", "ok");
    setType("Annual");
    setFrom("");
    setTo("");
    setReason("");
  }

  const reqs = (me.leaveRequests || []).slice().sort((a, b) => cmp(b.requestedAt, a.requestedAt));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Leave</h1>
          <p className="muted">Your balances for this leave year, a request form, and the status of every request.</p>
        </div>
      </div>
      <div className="two-col">
        <div className="stack stack-lg">
          <section className="panel" aria-labelledby="h-req">
            <div className="panel-head">
              <h2 id="h-req">Request leave</h2>
            </div>
            <form className="panel-body" id="leave-form" noValidate onSubmit={submit}>
              <div className="field">
                <label htmlFor="lv-type">Type</label>
                <select
                  id="lv-type"
                  name="type"
                  required
                  value={type}
                  onChange={(e) => {
                    setError(null);
                    setType(e.target.value as LeaveType);
                  }}
                >
                  <option value="Annual">Annual</option>
                  <option value="Sick">Sick</option>
                  <option value="Casual">Casual</option>
                </select>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="lv-from">From</label>
                  <input
                    ref={fromRef}
                    type="date"
                    id="lv-from"
                    name="from"
                    required
                    value={from}
                    aria-invalid={error?.field === "from" ? true : undefined}
                    onChange={(e) => {
                      setError(null);
                      setFrom(e.target.value);
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="lv-to">To</label>
                  <input
                    ref={toRef}
                    type="date"
                    id="lv-to"
                    name="to"
                    required
                    min={from || undefined}
                    value={to}
                    aria-invalid={error?.field === "to" ? true : undefined}
                    onChange={(e) => {
                      setError(null);
                      setTo(e.target.value);
                    }}
                  />
                </div>
              </div>
              <p className="hint" id="lv-days" aria-live="polite">
                {daysLine}
              </p>
              <p className="alert alert-warn small" id="lv-warn" hidden={!warn}>
                {warn}
              </p>
              <div className="field">
                <label htmlFor="lv-reason">
                  Reason <span className="muted">(optional)</span>
                </label>
                <textarea id="lv-reason" name="reason" maxLength={200} placeholder="A line for your manager" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <p className="error-text" id="lv-error" role="alert" hidden={!error}>
                {error?.msg}
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  Send request
                </button>
              </div>
              <p className="hint">Requests go to your branch manager. In this demo HR approves them in the HR console.</p>
            </form>
          </section>
          <section className="panel" aria-labelledby="h-hist">
            <div className="panel-head">
              <h2 id="h-hist">Requests</h2>
            </div>
            <div id="leave-history">
              {reqs.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Dates</th>
                        <th scope="col" className="num">
                          Days
                        </th>
                        <th scope="col">Reason</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqs.map((r) => (
                        <tr key={r.id}>
                          <td>{r.type}</td>
                          <td>{dateRange(r.from, r.to)}</td>
                          <td className="num">{plural(Number(r.days) || 0, "day")}</td>
                          <td>{r.reason ? r.reason : <span className="muted">—</span>}</td>
                          <td>
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">No leave requests yet.</div>
              )}
            </div>
          </section>
        </div>
        <aside className="leave-aside">
          <section className="panel" aria-labelledby="h-bal">
            <div className="panel-head">
              <h2 id="h-bal">Balances</h2>
            </div>
            <div className="panel-body bars" id="bars">
              {bals.map((b) => {
                const pct = b.ent ? Math.min(100, Math.round((b.used / b.ent) * 100)) : 0;
                return (
                  <div className="bar" key={b.label}>
                    <div className="bar-head">
                      <span>
                        <strong>{b.label}</strong>
                        {" · " + b.used + " of " + b.ent + " days used"}
                      </span>
                      <span className="num">{plural(b.left, "day") + " left"}</span>
                    </div>
                    <div className="bar-track" role="img" aria-label={b.label + " leave: " + b.used + " of " + b.ent + " days used"}>
                      <div className={"bar-fill" + (b.ent && b.left === 0 ? " is-full" : "")} style={{ width: pct + "%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

export function PortalLeave() {
  return (
    <PortalPage active="leave" title="Leave" page="leave">
      {(me) => <LeaveBody me={me} />}
    </PortalPage>
  );
}
