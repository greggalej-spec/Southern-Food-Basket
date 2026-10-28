"use client";

import { useState } from "react";
import { useConfirm } from "@/components/confirm";
import { EmptyRow, PortalPage, StatusBadge } from "@/components/portal/portal-page";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { fmtDate, parseDay } from "@/lib/format";
import { addDays, branchName, cmp, dateRange, fmtDay, fmtHours, isoLocal, shiftHours, shiftRange, shiftStarted, sortedShifts, todayIso, weekdayShort } from "@/lib/portal/format";
import { requestSwap } from "@/lib/store";
import type { Employee, Seed, Shift } from "@/lib/types";

// The week view and shift swaps (portal/schedule.html, renderSchedule in portal.js).

function ScheduleBody({ me, d }: { me: Employee; d: Seed }) {
  const { prompt } = useConfirm();
  const [offset, setOffset] = useState(0);
  const shifts = sortedShifts(me), today = todayIso();
  const byDate: Record<string, Shift> = {};
  shifts.forEach((sh) => {
    byDate[sh.date] = sh;
  });

  const t = parseDay(today);
  const monday = addDays(t, -((t.getDay() + 6) % 7) + offset * 7);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) days.push(isoLocal(addDays(monday, i)));
  const total = days.reduce((n, iso) => n + (byDate[iso] ? shiftHours(byDate[iso]) : 0), 0);
  const any = days.some((iso) => byDate[iso]);

  const reqs = (me.swapRequests || []).slice().sort((a, b) => cmp(b.requestedAt, a.requestedAt));
  const pending: Record<string, boolean> = {};
  reqs.filter((r) => r.status === "pending").forEach((r) => {
    pending[r.shiftDate] = true;
  });
  const upcoming = shifts.filter((sh) => !shiftStarted(sh));

  async function askSwap(date: string) {
    const sh = byDate[date];
    if (!sh) return;
    const noteText = await prompt({
      title: "Request a swap",
      body: "Shift: " + weekdayShort(date) + " " + fmtDay(date) + ", " + shiftRange(sh) + ". Your branch manager confirms cover before anything changes.",
      label: "Note for your manager",
      placeholder: "Who could cover, or why you need the swap",
      okLabel: "Send request",
    });
    if (noteText === null) return;
    requestSwap(me.id, date, noteText);
    toast("Swap request sent for " + fmtDay(date) + ".", "ok");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Schedule</h1>
          <p className="muted" id="sched-sub">
            {me.role + " · " + branchName(d, me.branchId)}
          </p>
        </div>
      </div>
      <div className="toolbar" role="group" aria-label="Choose a week">
        <button className="btn btn-ghost btn-sm" type="button" id="wk-prev" onClick={() => setOffset(offset - 1)}>
          Previous week
        </button>
        <button className="btn btn-ghost btn-sm" type="button" id="wk-this" aria-pressed={offset === 0} onClick={() => setOffset(0)}>
          This week
        </button>
        <button className="btn btn-ghost btn-sm" type="button" id="wk-next" onClick={() => setOffset(offset + 1)}>
          Next week
        </button>
        <span className="week-label" id="wk-label" aria-live="polite">
          {fmtDay(days[0], { day: "numeric", month: "short" }) + " – " + fmtDay(days[6])}
        </span>
        <span className="spacer" />
        <Badge variant="green" id="wk-hours">
          {fmtHours(total) + (offset === 0 ? " this week" : " that week")}
        </Badge>
      </div>
      <ol className="week" id="week" aria-label="Shifts for the chosen week">
        {days.map((iso) => {
          const sh = byDate[iso];
          const isToday = iso === today;
          return (
            <li key={iso} className={"day" + (isToday ? " is-today" : "")} aria-current={isToday ? "date" : undefined}>
              <div className="day-name">
                {weekdayShort(iso)}
                {isToday ? (
                  <>
                    {" "}
                    <span className="today-tag">Today</span>
                  </>
                ) : null}
              </div>
              <div className="day-date">{fmtDay(iso, { day: "numeric", month: "short" })}</div>
              {sh ? (
                <div className="shift">
                  {shiftRange(sh)}
                  <small>{sh.role + " · " + fmtHours(shiftHours(sh))}</small>
                </div>
              ) : (
                <div className="off">Off</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="muted week-note" id="week-note" hidden={any}>
        {any ? "" : "No shifts are rostered for this week." + (shifts.length ? " The roster on file runs " + dateRange(shifts[0].date, shifts[shifts.length - 1].date) + "." : "")}
      </p>
      <div className="two-col">
        <section className="panel" aria-labelledby="h-swap">
          <div className="panel-head">
            <h2 id="h-swap">Swap requests</h2>
          </div>
          <div className="panel-intro">
            <p className="small muted">Ask to swap an upcoming shift. Your branch manager confirms cover before anything changes.</p>
          </div>
          <ul className="list list-actions" id="swap-shifts">
            {upcoming.length ? (
              upcoming.map((sh, i) => (
                <li key={sh.date + sh.start + i}>
                  <div className="grow">
                    <strong>{weekdayShort(sh.date) + " " + fmtDay(sh.date)}</strong>
                    <div className="meta">{shiftRange(sh) + " · " + sh.role}</div>
                  </div>
                  <div className="actions">
                    {pending[sh.date] ? (
                      <Badge variant="warn">Swap requested</Badge>
                    ) : (
                      <button className="btn btn-ghost btn-sm" type="button" data-swap={sh.date} onClick={() => askSwap(sh.date)}>
                        Request swap
                      </button>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <EmptyRow text="No upcoming shifts to swap." />
            )}
          </ul>
        </section>
        <section className="panel" aria-labelledby="h-myswaps">
          <div className="panel-head">
            <h2 id="h-myswaps">Your requests</h2>
          </div>
          <ul className="list" id="my-swaps">
            {reqs.length ? (
              reqs.map((r) => (
                <li key={r.id}>
                  <div className="grow">
                    <strong>{weekdayShort(r.shiftDate) + " " + fmtDay(r.shiftDate)}</strong>
                    <div className="meta">{(r.note ? r.note + " · " : "") + "requested " + fmtDate(r.requestedAt)}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))
            ) : (
              <EmptyRow text="No swap requests yet." />
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export function PortalSchedule() {
  return (
    <PortalPage active="schedule" title="Schedule" page="schedule">
      {(me, d) => <ScheduleBody me={me} d={d} />}
    </PortalPage>
  );
}
