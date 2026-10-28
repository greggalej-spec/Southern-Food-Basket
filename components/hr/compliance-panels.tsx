"use client";

import { DocBadge } from "@/components/badges";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { daysBetween, fmtDateTime } from "@/lib/format";
import { branchName, complianceRows, daysLabel, docName, fmtDay } from "@/lib/hr/hr";
import { byId, setEmployeeDoc, setLeaveStatus, useData } from "@/lib/store";
import type { Employee, LeaveStatus, Seed } from "@/lib/types";

// The compliance tab from hr.js: employee documents that need action, training due within 30 days and pending
// leave. Approving or declining leave goes through setLeaveStatus, which keeps the balances right.

const FLUSH_TABLE = { border: 0, borderRadius: 0 };

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols}>
        <p className="small muted">{text}</p>
      </td>
    </tr>
  );
}

function Who({ d, e }: { d: Seed; e: Employee }) {
  return (
    <td>
      <strong>{e.name}</strong>
      <div className="small muted">{e.role + " · " + branchName(d, e.branchId)}</div>
    </td>
  );
}

const plural = (n: number, one: string, many: string) => n + (n === 1 ? one : many);

export function CompliancePanels({ ready }: { ready: boolean }) {
  const d = useData();
  const { confirm } = useConfirm();
  const comp = ready ? complianceRows(d) : null;

  function verify(empId: string, docId: string) {
    const emp = byId(d.employees, empId);
    setEmployeeDoc(empId, docId, "verified");
    toast((emp ? emp.name + ": " : "") + docName(d, docId) + " verified", "ok");
  }

  function request(empId: string, docId: string) {
    const emp = byId(d.employees, empId);
    toast("Request sent to " + (emp ? emp.name : "employee") + " for " + docName(d, docId) + " (demo: no message leaves this browser)", "ok");
  }

  async function decide(empId: string, leaveId: string, status: LeaveStatus) {
    const emp = byId(d.employees, empId);
    if (status === "declined") {
      const ok = await confirm({ title: "Decline this leave request?", body: (emp ? emp.name : "The employee") + " sees the decision in their portal.", okLabel: "Decline", danger: true });
      if (!ok) return;
    }
    setLeaveStatus(empId, leaveId, status);
    toast("Leave " + status + (emp ? " for " + emp.name : ""), status === "approved" ? "ok" : undefined);
  }

  return (
    <div className="compliance-stack">
      <section className="panel" aria-labelledby="comp-docs-h">
        <div className="panel-head">
          <h2 id="comp-docs-h">Employee documents</h2>
          <span className="small muted" id="comp-docs-count">
            {comp ? plural(comp.docs.length, " item", " items") : null}
          </span>
        </div>
        <div className="panel-body flush" id="comp-docs">
          {comp ? (
            <div className="table-wrap" style={FLUSH_TABLE}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Document</th>
                    <th scope="col">Status</th>
                    <th scope="col">Expiry</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comp.docs.length ? (
                    comp.docs.map((r) => {
                      const canVerify = r.state === "uploaded" || r.state === "flagged";
                      return (
                        <tr key={r.e.id + " " + r.c.docId}>
                          <Who d={d} e={r.e} />
                          <td>{r.doc ? r.doc.name : r.c.docId}</td>
                          <td>
                            <DocBadge state={r.state} />
                          </td>
                          <td>
                            {r.c.expiry ? (
                              <>
                                {fmtDay(r.c.expiry)}{" "}
                                <span className="small muted">{"(" + daysLabel(r.c.expiry) + ")"}</span>
                              </>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                          <td>
                            <div className="row-actions">
                              {canVerify ? (
                                <Button size="sm" data-emp-verify={r.e.id} data-doc={r.c.docId} onClick={() => verify(r.e.id, r.c.docId)}>
                                  Mark verified
                                </Button>
                              ) : null}
                              <Button variant="ghost" size="sm" data-emp-request={r.e.id} data-doc={r.c.docId} onClick={() => request(r.e.id, r.c.docId)}>
                                Request from employee
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow cols={5} text="Every employee document is verified and in date." />
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel" aria-labelledby="comp-train-h">
        <div className="panel-head">
          <h2 id="comp-train-h">Training due</h2>
          <span className="small muted" id="comp-train-count">
            {comp ? plural(comp.training.length, " item", " items") : null}
          </span>
        </div>
        <div className="panel-body flush" id="comp-train">
          {comp ? (
            <div className="table-wrap" style={FLUSH_TABLE}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Module</th>
                    <th scope="col">Due</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {comp.training.length ? (
                    comp.training.map((r) => (
                      <tr key={r.e.id + " " + r.t.id}>
                        <Who d={d} e={r.e} />
                        <td>
                          {r.t.name}
                          {r.t.minutes ? (
                            <>
                              {" "}
                              <span className="small muted">{"(" + (r.t.minutes >= 60 && r.t.minutes % 60 === 0 ? r.t.minutes / 60 + " h" : r.t.minutes + " min") + ")"}</span>
                            </>
                          ) : null}
                        </td>
                        <td>{fmtDay(r.t.due)}</td>
                        <td>{r.days < 0 ? <Badge variant="bad">{"Overdue " + daysLabel(r.t.due).replace(" ago", "")}</Badge> : <Badge variant="warn">{"Due " + daysLabel(r.t.due)}</Badge>}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={4} text="No training is overdue or due in the next 30 days." />
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <section className="panel" aria-labelledby="comp-leave-h">
        <div className="panel-head">
          <h2 id="comp-leave-h">Leave requests pending</h2>
          <span className="small muted" id="comp-leave-count">
            {comp ? plural(comp.leave.length, " request", " requests") : null}
          </span>
        </div>
        <div className="panel-body flush" id="comp-leave">
          {comp ? (
            <div className="table-wrap" style={FLUSH_TABLE}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Employee</th>
                    <th scope="col">Type</th>
                    <th scope="col">Dates</th>
                    <th scope="col" className="num">
                      Days
                    </th>
                    <th scope="col">Reason</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comp.leave.length ? (
                    comp.leave.map((r) => (
                      <tr key={r.e.id + " " + r.r.id}>
                        <Who d={d} e={r.e} />
                        <td>{r.r.type}</td>
                        <td>
                          {fmtDay(r.r.from) + (r.r.to && r.r.to !== r.r.from ? " – " + fmtDay(r.r.to) : "")}
                          <div className="small muted">{"Requested " + fmtDateTime(r.r.requestedAt)}</div>
                        </td>
                        <td className="num">{String(r.r.days != null ? r.r.days : daysBetween(r.r.from, r.r.to || r.r.from))}</td>
                        <td>{r.r.reason || "—"}</td>
                        <td>
                          <div className="row-actions">
                            <Button size="sm" data-leave="approved" data-emp={r.e.id} data-id={r.r.id} onClick={() => decide(r.e.id, r.r.id, "approved")}>
                              Approve
                            </Button>
                            <Button variant="ghost" size="sm" data-leave="declined" data-emp={r.e.id} data-id={r.r.id} onClick={() => decide(r.e.id, r.r.id, "declined")}>
                              Decline
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow cols={6} text="No leave requests are waiting." />
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
