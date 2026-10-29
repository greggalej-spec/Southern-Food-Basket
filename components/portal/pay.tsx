"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { PortalPage } from "@/components/portal/portal-page";
import { money } from "@/lib/format";
import { branchName, cmp, dateRange, fmtDay } from "@/lib/portal/format";
import type { Employee, PayLine, Seed } from "@/lib/types";

// Payslips: the period list and the printable slip (portal/pay.html, renderPay in portal.js). Printing hides the
// shell, the page head and the list through the [data-page="pay"] print rules in styles/portal.css and tokens.css.

function MoneyTable({ title, rows, totalLabel, total }: { title: string; rows: PayLine[]; totalLabel: string; total: number }) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">{title}</th>
          <th scope="col" className="num">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {(rows || []).length ? (
          rows.map((r, i) => (
            <tr key={r.label + i}>
              <td>{r.label}</td>
              <td className="num">{money(r.amount)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="muted">
              None
            </td>
          </tr>
        )}
      </tbody>
      <tfoot>
        <tr>
          <td>{totalLabel}</td>
          <td className="num">{money(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

const sum = (rows: PayLine[]) => (rows || []).reduce((n, r) => n + (Number(r.amount) || 0), 0);

function PayBody({ me, d }: { me: Employee; d: Seed }) {
  const slips = (me.payslips || []).slice().sort((a, b) => cmp(b.paidOn || b.to, a.paidOn || a.to));
  const [selected, setSelected] = useState<string | null>(slips.length ? slips[0].id : null);
  const p = slips.find((x) => x.id === selected);
  const earn = p ? sum(p.earnings) : 0, ded = p ? sum(p.deductions) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Pay</h1>
          <p className="muted">Your payslips. Pick a period to view it or print it.</p>
        </div>
      </div>
      <div className="pay-grid">
        <aside className="panel pay-aside" aria-labelledby="h-ps">
          <div className="panel-head">
            <h2 id="h-ps">Payslips</h2>
          </div>
          <ul className="payslip-list" id="payslip-list">
            {slips.length ? (
              slips.map((s) => (
                <li key={s.id}>
                  <button className="payslip-item" type="button" data-slip={s.id} aria-pressed={s.id === selected} onClick={() => setSelected(s.id)}>
                    <strong>{s.period}</strong>
                    <span className="meta">{"Paid " + fmtDay(s.paidOn)}</span>
                    <span className="amt num">{money(s.net)}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="panel-body muted">No payslips yet.</li>
            )}
          </ul>
        </aside>
        <section id="payslip" aria-label="Selected payslip" aria-live="polite" data-tour="portal-pay">
          {p ? (
            <article className="payslip" aria-labelledby="ps-title">
              <div className="payslip-head">
                <div>
                  <p className="eyebrow bare">Payslip</p>
                  <h2 id="ps-title" className="payslip-title">
                    {p.period}
                  </h2>
                  <p className="muted small payslip-dates">{dateRange(p.from, p.to) + " · paid " + fmtDay(p.paidOn)}</p>
                </div>
                <div className="payslip-org">
                  <img className="sfb-mark" src="/assets/img/sfb-mark.svg" alt="" width="96" height="96" decoding="async" />
                  <div>
                    <strong>Southern Food Basket</strong>
                    <div className="small muted">Demo payslip, not a real document</div>
                  </div>
                </div>
              </div>
              <dl className="kv payslip-kv">
                <dt>Name</dt>
                <dd>{me.name}</dd>
                <dt>Employee no.</dt>
                <dd>{me.employeeNo}</dd>
                <dt>Role</dt>
                <dd>{me.role}</dd>
                <dt>Branch</dt>
                <dd>{branchName(d, me.branchId)}</dd>
              </dl>
              <div className="payslip-tables">
                <MoneyTable title="Earnings" rows={p.earnings} totalLabel="Total earnings" total={earn} />
                <MoneyTable title="Deductions" rows={p.deductions} totalLabel="Total deductions" total={ded} />
              </div>
              <div className="payslip-totals">
                <div>
                  <span>Gross pay</span>
                  <strong className="num">{money(p.gross)}</strong>
                </div>
                <div>
                  <span>Total deductions</span>
                  <strong className="num">{money(ded)}</strong>
                </div>
                <div className="payslip-net">
                  <span>Net pay</span>
                  <strong className="net num">{money(p.net)}</strong>
                </div>
              </div>
              <div className="cluster no-print payslip-actions">
                <button className="btn btn-ghost" type="button" id="print-slip" onClick={() => window.print()}>
                  <Icon name="file" /> Print or save as PDF
                </button>
              </div>
              <p className="hint">Demo figures. Deductions are illustrative, not a statement of Trinidad and Tobago payroll rules.</p>
            </article>
          ) : (
            <div className="empty">No payslips yet. Your first payslip appears here after the first pay run.</div>
          )}
        </section>
      </div>
    </>
  );
}

export function PortalPay() {
  return (
    <PortalPage active="pay" title="Pay" page="pay">
      {(me, d) => <PayBody me={me} d={d} />}
    </PortalPage>
  );
}
