"use client";

import Link from "next/link";
import { Icon } from "@/components/icon";
import { EmptyRow, PortalPage, Stat } from "@/components/portal/portal-page";
import { Badge } from "@/components/ui/badge";
import { daysUntil, docDisplayState, money } from "@/lib/format";
import { branchName, cmp, docName, fmtDay, fmtHours, inDays, plural, shiftEnded, shiftHours, shiftRange, sortedShifts, todayIso, weekdayShort } from "@/lib/portal/format";
import { hasRead, waitingFor } from "@/lib/staff-updates";
import type { Employee, LeaveBalance, Seed } from "@/lib/types";

// The employee home (portal/home.html, renderHome in portal.js).

type HomeAlert = { tone: "warn" | "bad"; text: string; href: string };

function complianceAlerts(me: Employee, d: Seed) {
  const out: HomeAlert[] = [];
  (me.compliance || []).forEach((c) => {
    const name = docName(d, c.docId), st = docDisplayState(c), to = "/portal/docs#documents";
    if (st === "expiring") out.push({ tone: "warn", text: name + " expires " + inDays(daysUntil(c.expiry)) + " (" + fmtDay(c.expiry) + "). Upload the renewal before then.", href: to });
    else if (st === "expired") out.push({ tone: "bad", text: name + " expired on " + fmtDay(c.expiry) + ". Upload a current one.", href: to });
    else if (st === "missing") out.push({ tone: "bad", text: name + " has not been provided.", href: to });
    else if (st === "flagged") out.push({ tone: "bad", text: name + " needs attention" + (c.reason ? ": " + c.reason : "."), href: to });
  });
  (me.training || []).filter((t) => !t.done && t.due).forEach((t) => {
    const n = daysUntil(t.due);
    if (n == null) return;
    if (n < 0) out.push({ tone: "bad", text: t.name + " training is overdue (due " + fmtDay(t.due) + ").", href: "/portal/docs#training" });
    else if (n <= 30) out.push({ tone: "warn", text: t.name + " training is due " + inDays(n) + " (" + fmtDay(t.due) + ").", href: "/portal/docs#training" });
  });
  return out;
}

function HomeBody({ me, d }: { me: Employee; d: Seed }) {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  const shifts = sortedShifts(me), today = todayIso();
  const next = shifts.find((sh) => !shiftEnded(sh));
  const lv: Partial<LeaveBalance> = me.leave || {};
  const annualLeft = Math.max(0, (lv.annualEntitled || 0) - (lv.annualUsed || 0));
  const pendingAnnual = (me.leaveRequests || []).filter((r) => r.status === "pending" && r.type === "Annual").reduce((n, r) => n + (Number(r.days) || 0), 0);
  const todo = (me.training || []).filter((t) => !t.done);
  const nextDue = todo.filter((t) => t.due).sort((a, b) => cmp(a.due, b.due))[0];
  const slips = (me.payslips || []).slice().sort((a, b) => cmp(b.paidOn || b.to, a.paidOn || a.to));
  const last = slips[0];

  const todays = shifts.find((sh) => sh.date === today);
  const todayLabel = "Today · " + fmtDay(today, { weekday: "short", day: "numeric", month: "short" });
  const upcoming = shifts.filter((sh) => sh.date > today).slice(0, 5);
  const anns = (d.announcements || []).filter((a) => !a.branchId || a.branchId === me.branchId).sort((a, b) => cmp(b.date, a.date));
  const waiting = waitingFor(d, me.id);
  const unread = waiting.filter((u) => !hasRead(u, me.id)).length;
  const toConfirm = waiting.length - unread;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 id="greeting">{greet + ", " + (String(me.name).split(/\s+/)[0] || me.name) + "."}</h1>
          <p className="muted" id="whoami">
            {me.role + " · " + branchName(d, me.branchId)}
          </p>
        </div>
      </div>
      <div className="alerts" id="alerts">
        {complianceAlerts(me, d).map((a, i) => (
          <div className={"alert alert-" + a.tone} key={i}>
            <Icon name="bell" />
            <p>
              {a.text} <Link href={a.href}>Documents &amp; training</Link>
            </p>
          </div>
        ))}
        {waiting.length ? (
          <div className="alert alert-info" data-tour="home-updates">
            <Icon name="file" />
            <p>
              {[unread ? plural(unread, "new staff update") : "", toConfirm ? plural(toConfirm, "update") + " to confirm you have read" : ""].filter(Boolean).join(" and ") + ". "}
              <Link href={"/portal/updates#" + waiting[0].id}>Read {waiting.length === 1 ? "it" : "them"}</Link>
            </p>
          </div>
        ) : null}
      </div>
      <div className="stats" id="stats">
        <Stat
          label="Next shift"
          value={next ? fmtDay(next.date, { day: "numeric", month: "short" }) : "None"}
          sub={next ? weekdayShort(next.date) + " · " + shiftRange(next) : "Nothing rostered after today"}
        />
        <Stat
          label="Annual leave left"
          value={plural(annualLeft, "day")}
          sub={(lv.annualUsed || 0) + " of " + (lv.annualEntitled || 0) + " days used" + (pendingAnnual ? " · " + plural(pendingAnnual, "day") + " pending" : "")}
        />
        <Stat label="Training to do" value={plural(todo.length, "course")} sub={nextDue ? "Next due " + fmtDay(nextDue.due) : "Nothing outstanding"} />
        <Stat
          label="Last payslip"
          value={last ? money(last.net) : "None yet"}
          sub={last ? last.period + " · net pay, paid " + fmtDay(last.paidOn) : "No payslips on file"}
          cls={last ? "money" : ""}
        />
      </div>
      <div className="two-col">
        <div className="stack stack-lg">
          <section className="panel" aria-labelledby="h-shifts" data-tour="portal-home">
            <div className="panel-head">
              <h2 id="h-shifts">Shifts</h2>
              <Link href="/portal/schedule">Full schedule</Link>
            </div>
            <div id="today-shift">
              {todays ? (
                <div className="shift-today">
                  <div>
                    <p className="eyebrow bare">{todayLabel}</p>
                    <div className="shift-time">{shiftRange(todays)}</div>
                    <div className="small">{todays.role}</div>
                  </div>
                  <Badge variant="green">{fmtHours(shiftHours(todays))}</Badge>
                </div>
              ) : (
                <div className="shift-today is-off">
                  <div>
                    <p className="eyebrow bare">{todayLabel}</p>
                    <div className="shift-time">Off today</div>
                  </div>
                </div>
              )}
            </div>
            <ul className="list" id="upcoming" aria-label="Coming up">
              {upcoming.length ? (
                upcoming.map((sh, i) => (
                  <li key={sh.date + sh.start + i}>
                    <div className="grow">
                      <strong>{weekdayShort(sh.date) + " " + fmtDay(sh.date, { day: "numeric", month: "short" })}</strong>
                      <div className="meta">{shiftRange(sh) + " · " + sh.role}</div>
                    </div>
                    <Badge plain>{fmtHours(shiftHours(sh))}</Badge>
                  </li>
                ))
              ) : (
                <EmptyRow text="No more shifts in the roster on file." />
              )}
            </ul>
          </section>
        </div>
        <div className="stack stack-lg">
          <section className="panel" aria-labelledby="h-ann">
            <div className="panel-head">
              <h2 id="h-ann">Announcements</h2>
            </div>
            <ul className="list" id="announcements">
              {anns.length ? (
                anns.map((a) => (
                  <li key={a.id}>
                    <div className="grow">
                      <strong>{a.title}</strong>
                      <div className="meta">{fmtDay(a.date) + " · " + (a.branchId ? branchName(d, a.branchId) : "All branches")}</div>
                      <p className="small ann-body">{a.body}</p>
                    </div>
                  </li>
                ))
              ) : (
                <EmptyRow text="No announcements." />
              )}
            </ul>
          </section>
          <section className="panel" aria-labelledby="h-qa">
            <div className="panel-head">
              <h2 id="h-qa">Quick actions</h2>
            </div>
            <div className="panel-body quick-actions">
              <Link className="btn btn-ghost" href="/portal/leave">
                <span data-icon="sun" aria-hidden="true">
                  <Icon name="sun" />
                </span>{" "}
                Request leave
              </Link>
              <Link className="btn btn-ghost" href="/portal/pay">
                <span data-icon="wallet" aria-hidden="true">
                  <Icon name="wallet" />
                </span>{" "}
                View payslips
              </Link>
              <Link className="btn btn-ghost" href="/portal/docs">
                <span data-icon="folder" aria-hidden="true">
                  <Icon name="folder" />
                </span>{" "}
                Documents &amp; training
              </Link>
              <Link className="btn btn-ghost" href="/portal/schedule">
                <span data-icon="calendar" aria-hidden="true">
                  <Icon name="calendar" />
                </span>{" "}
                My schedule
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export function PortalHome() {
  return (
    <PortalPage active="home" title="Home" page="home">
      {(me, d) => <HomeBody me={me} d={d} />}
    </PortalPage>
  );
}
