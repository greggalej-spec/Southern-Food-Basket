"use client";

import { useMemo, useState } from "react";
import { Seg, Stat, act, csvRow, download } from "@/components/admin/bits";
import { ExtraSheet, LogSheet, STATE_ICON, SpotRow, StateBadge, dayLabel, resultText, type LogTarget } from "@/components/admin/radio-log";
import { SchedulesView } from "@/components/admin/radio-sheets";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { personName } from "@/lib/admin/guard";
import { whenTT } from "@/lib/admin/tt";
import { fmtDate, fmtTime } from "@/lib/format";
import {
  LATE_AFTER, RADIO_KIND, SCRIPT_KIND, SCRIPT_KINDS, SCRIPT_STATE, STATE, WEEKDAYS, addDays, addMonths, daysIn, markSent, minutesLate, monthName, nowTT, removeScript, saveScript, scriptState, scriptsByDue,
  sheetsIn, shortName, spotState, spotsBetween, spotsOn, stationName, totals, weekday,
  type Now, type ScriptForm,
} from "@/lib/ops/radio";
import { useData, useSession } from "@/lib/store";
import type { RadioKind, RadioScript } from "@/lib/types";

/* The radio diary (lib/ops/radio.ts). Three steps, shown at the top so someone new knows the routine:
   1. each month, put in each station's schedule (Schedules: scan the sheet or make it by hand);
   2. every day, tick off each segment (Calendar: Today at the top, then the month, back as far as there is history);
   3. any time, see how it went (Reports), and keep the scripts and hype the stations need (Scripts). */

type View = "calendar" | "schedules" | "report" | "scripts";

export function RadioPanel() {
  const d = useData();
  const [now] = useState(nowTT);
  const [view, setView] = useState<View>("calendar");
  const [month, setMonth] = useState(now.day.slice(0, 7));
  const thisMonth = now.day.slice(0, 7);
  const t = totals(spotsBetween(d, thisMonth + "-01", now.day), now);
  const today = spotsOn(d, now.day);
  const scripts = scriptsByDue(d).map((sc) => scriptState(sc, now.day));
  const due = scripts.filter((x) => x === "overdue" || x === "today").length;
  const noSheet = !sheetsIn(d, thisMonth).length;

  return (
    <div className="section-stack">
      <ol className="radio-guide" aria-label="How the radio diary works">
        <li className={noSheet ? "is-todo" : "is-done"}>
          <button type="button" onClick={() => setView("schedules")}>
            <b>1</b>
            <span>
              <strong>Each month</strong>
              {noSheet ? "Put in the stations’ schedules: scan the sheet or make it by hand." : sheetsIn(d, thisMonth).length + " station schedules in for " + monthName(thisMonth).split(" ")[0] + "."}
            </span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setView("calendar")}>
            <b>2</b>
            <span>
              <strong>Every day</strong>
              Tick off each segment: had it, nobody called, or not had.
            </span>
          </button>
        </li>
        <li>
          <button type="button" onClick={() => setView("report")}>
            <b>3</b>
            <span>
              <strong>Any time</strong>
              See the month in Reports, and look back in the calendar.
            </span>
          </button>
        </li>
      </ol>

      <div className="stats">
        <Stat icon="radio" tone="ok" label="Today" value={today.filter((x) => x.result?.outcome === "done").length + " of " + today.length} sub={today.length ? today.filter((x) => spotState(x, now) === "due").length + " still to come" : "Nothing booked today"} />
        <Stat icon="check" label={"Had in " + monthName(thisMonth).split(" ")[0]} value={t.done} sub={"of " + (t.booked - t.due) + " so far"} ring={{ value: t.done, of: Math.max(t.booked - t.due, 1) }} />
        <Stat icon="close" tone={t.nocall + t.missed ? "bad" : undefined} label="Missed" value={t.nocall + t.missed} sub={t.nocall + " nobody called, " + t.missed + " not had"} />
        <Stat icon="help" tone={t.unlogged ? "warn" : undefined} label="Not logged" value={t.unlogged} sub={due ? due + " scripts due or overdue" : "Nobody said what happened"} />
      </div>

      <div className="radio-views">
        <Seg label="Show" value={view} onChange={setView} options={[{ id: "calendar", label: "Calendar" }, { id: "schedules", label: "Monthly schedules" }, { id: "report", label: "Reports" }, { id: "scripts", label: "Scripts", count: due || undefined }]} />
      </div>
      {view === "calendar" ? (
        <CalendarView now={now} month={month} setMonth={setMonth} toSchedules={() => setView("schedules")} />
      ) : view === "schedules" ? (
        <SchedulesView now={now} month={month} setMonth={setMonth} />
      ) : view === "report" ? (
        <ReportView now={now} />
      ) : (
        <ScriptsView now={now} />
      )}
    </div>
  );
}

/* ---------- calendar: today, then the month ---------- */

function cells(month: string) {
  const first = weekday(month + "-01");
  return Array.from({ length: 42 }, (_, i) => {
    const day = addDays(month + "-01", i - first);
    return { day, n: Number(day.slice(8)), inMonth: day.startsWith(month) };
  }).filter((c, i, all) => i < 35 || all.slice(35).some((x) => x.inMonth));
}

function CalendarView({ now, month, setMonth, toSchedules }: { now: Now; month: string; setMonth: (m: string) => void; toSchedules: () => void }) {
  const d = useData();
  const [log, setLog] = useState<LogTarget | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  const today = spotsOn(d, now.day);
  const grid = cells(month);
  const inView = spotsBetween(d, grid[0].day, grid[grid.length - 1].day);
  const t = totals(spotsBetween(d, month + "-01", month + "-" + daysIn(month)), now);

  return (
    <>
      <section className="panel" aria-labelledby="ra-today-h">
        <div className="panel-head">
          <h2 id="ra-today-h">{"Today, " + dayLabel(now.day)}</h2>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setExtra(now.day)}>
            + Something extra
          </button>
        </div>
        <div className="panel-body">
          {today.length ? (
            <ul className="radio-rows">
              {today.map((sp) => (
                <SpotRow key={sp.id} sp={sp} now={now} onOpen={setLog} />
              ))}
            </ul>
          ) : (
            <p className="muted">
              {"Nothing booked on the radio today."}
              {!sheetsIn(d, now.day.slice(0, 7)).length ? (
                <>
                  {" There is no schedule for " + monthName(now.day.slice(0, 7)) + " yet. "}
                  <button className="link-btn" type="button" onClick={toSchedules}>
                    Put in the stations’ schedules
                  </button>
                </>
              ) : null}
            </p>
          )}
        </div>
      </section>

      <section className="panel cal-head" aria-label="Calendar controls">
        <div className="cal-bar">
          <div className="cal-nav">
            <button className="cal-arrow" type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
              <Icon name="arrow" className="flip" />
            </button>
            <h2 className="cal-title" aria-live="polite">
              {monthName(month)}
            </h2>
            <button className="cal-arrow" type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
              <Icon name="arrow" />
            </button>
            {month !== now.day.slice(0, 7) ? (
              <button className="btn btn-outline btn-sm" type="button" onClick={() => setMonth(now.day.slice(0, 7))}>
                This month
              </button>
            ) : null}
          </div>
        </div>
        <ul className="cal-sum" aria-label={"In " + monthName(month)}>
          <li>
            <b>{t.booked}</b> booked
          </li>
          <li className="is-posted">
            <b>{t.done}</b> had
          </li>
          <li className="radio-sum-bad">
            <b>{t.nocall + t.missed}</b> missed
          </li>
          <li className="is-idea">
            <b>{t.unlogged}</b> not logged
          </li>
        </ul>
      </section>

      <section className="panel cal-panel" aria-label={"Radio calendar for " + monthName(month)}>
        <div className="cal-week" aria-hidden="true">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="cal-grid radio-cal">
          {grid.map((c) => {
            const items = inView.filter((x) => x.day === c.day);
            const bad = items.some((x) => ["nocall", "missed"].includes(spotState(x, now))), loose = items.some((x) => spotState(x, now) === "unlogged");
            return (
              <button
                key={c.day}
                type="button"
                className={"cal-day" + (c.inMonth ? "" : " is-out") + (c.day === now.day ? " is-today" : "") + (items.length ? " has-items" : "")}
                onClick={() => setOpen(c.day)}
                aria-label={dayLabel(c.day) + ", " + (items.length ? items.length + " on the radio" + (bad ? ", something missed" : loose ? ", something not logged" : "") : "nothing booked")}
              >
                <span className="cal-num">{c.n}</span>
                <span className="cal-items">
                  {items.length ? <span className="radio-cell-st">{Array.from(new Set(items.map((x) => (x.extra ? "Extra" : shortName(stationName(d, x.stationId)))))).join(", ")}</span> : null}
                  {items.slice(0, 4).map((x) => {
                    const st = spotState(x, now);
                    return (
                      <span key={x.id} className={"cal-chip radio-chip is-" + st} title={fmtTime(x.time) + " " + RADIO_KIND[x.kind].label + ", " + stationName(d, x.stationId) + ": " + STATE[st].label}>
                        <Icon name={STATE_ICON[st]} />
                        <span>{fmtTime(x.time).replace(/ (am|pm)$/, "")}</span>
                      </span>
                    );
                  })}
                  {items.length > 4 ? <span className="cal-more">{"+" + (items.length - 4) + " more"}</span> : null}
                </span>
                {items.length ? (
                  <span className={"cal-count radio-count" + (bad ? " is-bad" : loose ? " is-loose" : "")} aria-hidden="true">
                    {items.length}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <p className="cal-key small">
        <span className="cal-chip radio-chip is-done"><Icon name="check" /><span>Had</span></span>
        <span className="cal-chip radio-chip is-nocall"><Icon name="phone" /><span>Nobody called</span></span>
        <span className="cal-chip radio-chip is-missed"><Icon name="close" /><span>Not had</span></span>
        <span className="cal-chip radio-chip is-unlogged"><Icon name="help" /><span>Not logged</span></span>
        <span className="cal-chip radio-chip is-due"><Icon name="clock" /><span>Coming up</span></span>
        <span className="muted">Tap a day to see it and log it.</span>
      </p>

      <SideSheet open={!!open} onClose={() => setOpen(null)} title={open ? dayLabel(open) : "Day"} sub="Everything on the radio this day">
        {open ? (
          <div className="cal-daylist">
            {spotsOn(d, open).length ? (
              <ul className="radio-rows">
                {spotsOn(d, open).map((sp) => (
                  <SpotRow key={sp.id} sp={sp} now={now} onOpen={setLog} />
                ))}
              </ul>
            ) : (
              <p className="muted">Nothing booked this day.</p>
            )}
            {open <= now.day ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setExtra(open)}>
                + Something extra on this day
              </button>
            ) : null}
          </div>
        ) : null}
      </SideSheet>
      <LogSheet target={log} now={now} onClose={() => setLog(null)} />
      <ExtraSheet day={extra} now={now} onClose={() => setExtra(null)} />
    </>
  );
}

/* ---------- reports ---------- */

type Range = "month" | "last-month" | "7" | "custom";

function ReportView({ now }: { now: Now }) {
  const d = useData();
  const [range, setRange] = useState<Range>("month");
  const [custom, setCustom] = useState({ from: addDays(now.day, -13), to: now.day });
  const [station, setStation] = useState("all");
  const [kind, setKind] = useState<RadioKind | "all">("all");
  const m = now.day.slice(0, 7), lm = addMonths(m, -1);
  const span = range === "month" ? { from: m + "-01", to: now.day } : range === "last-month" ? { from: lm + "-01", to: lm + "-" + daysIn(lm) } : range === "7" ? { from: addDays(now.day, -6), to: now.day } : custom;
  const list = useMemo(() => spotsBetween(d, span.from, span.to < now.day ? span.to : now.day).filter((x) => (station === "all" || x.stationId === station) && (kind === "all" || x.kind === kind) && spotState(x, now) !== "due"), [d, span.from, span.to, station, kind, now]);
  const t = totals(list, now);
  const counted = t.booked;
  const missed = list.filter((x) => ["nocall", "missed", "unlogged"].includes(spotState(x, now)));
  const days = Array.from(new Set(list.map((x) => x.day))).sort().reverse();

  function csv() {
    const head = csvRow(["Day", "Weekday", "Station", "Work order", "Segment", "Booked for", "What happened", "On air at", "Minutes late", "Who was on air", "Script", "Note", "Logged by", "Logged at"]);
    const rows = list.map((x) =>
      csvRow([
        x.day, WEEKDAYS[weekday(x.day)], stationName(d, x.stationId), x.wo || "", x.extra ? "Extra: " + (x.title || "") : RADIO_KIND[x.kind].label, x.time, STATE[spotState(x, now)].label, x.result?.at || "",
        x.result?.at && !x.extra ? minutesLate(x.time, x.result.at) : "", x.result?.person ? personName(d, x.result.person) : "", x.result?.scriptId ? d.radioScripts.find((y) => y.id === x.result?.scriptId)?.title || "" : "",
        x.result?.note || "", x.result ? personName(d, x.result.by) : "", x.result ? whenTT(x.result.loggedAt) : "",
      ]),
    );
    download("radio-" + span.from + "-to-" + span.to + ".csv", [head, ...rows].join("\r\n"));
  }

  return (
    <section className="panel" aria-labelledby="ra-rep-h">
      <div className="panel-head">
        <h2 id="ra-rep-h">{"Radio report, " + fmtDate(span.from, { year: false }) + " to " + fmtDate(span.to < now.day ? span.to : now.day, { year: false })}</h2>
        <button className="btn btn-ghost btn-sm" type="button" onClick={csv} disabled={!list.length}>
          <Icon name="upload" />
          Download as a spreadsheet
        </button>
      </div>
      <div className="panel-body">
        <div className="radio-filters">
          <Seg label="Days" value={range} onChange={setRange} options={[{ id: "month", label: "This month" }, { id: "last-month", label: "Last month" }, { id: "7", label: "Last 7 days" }, { id: "custom", label: "Choose" }]} />
          {range === "custom" ? (
            <span className="cluster">
              <label className="radio-inline">
                From
                <input type="date" value={custom.from} max={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} />
              </label>
              <label className="radio-inline">
                To
                <input type="date" value={custom.to} min={custom.from} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} />
              </label>
            </span>
          ) : null}
          <span className="cluster">
            <select aria-label="Station" value={station} onChange={(e) => setStation(e.target.value)}>
              <option value="all">Every station</option>
              {d.radioStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
            <select aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value as RadioKind | "all")}>
              <option value="all">Every kind</option>
              {(["interview", "office", "weekend", "other"] as RadioKind[]).map((k) => (
                <option key={k} value={k}>
                  {RADIO_KIND[k].label}
                </option>
              ))}
            </select>
          </span>
        </div>

        <dl className="radio-totals">
          <div>
            <dt>Booked so far</dt>
            <dd>{t.booked}</dd>
          </div>
          <div className="is-done">
            <dt>Had</dt>
            <dd>
              {t.done}
              <small>{counted ? Math.round((t.done / counted) * 100) + "%" : ""}</small>
            </dd>
          </div>
          <div className="is-missed">
            <dt>Nobody called</dt>
            <dd>{t.nocall}</dd>
          </div>
          <div className="is-missed">
            <dt>Not had</dt>
            <dd>{t.missed}</dd>
          </div>
          <div className="is-unlogged">
            <dt>Not logged</dt>
            <dd>{t.unlogged}</dd>
          </div>
          <div>
            <dt>{"More than " + LATE_AFTER + " min late"}</dt>
            <dd>{t.late}</dd>
          </div>
          <div>
            <dt>Extras</dt>
            <dd>{t.extras}</dd>
          </div>
        </dl>

        {missed.length ? (
          <div className="radio-missed">
            <h3>What was missed or not logged</h3>
            <ul>
              {missed.map((x) => (
                <li key={x.id}>
                  <span className="radio-rt">{dayLabel(x.day)}</span>
                  <span className="radio-rw">
                    <strong>{stationName(d, x.stationId) + ", " + RADIO_KIND[x.kind].label.toLowerCase() + " at " + fmtTime(x.time)}</strong>
                    {x.result?.note ? <span>{x.result.note}</span> : null}
                  </span>
                  <StateBadge st={spotState(x, now)} />
                </li>
              ))}
            </ul>
          </div>
        ) : list.length ? (
          <p className="radio-note is-ok">
            <Icon name="check" />
            Everything in these days was had and logged.
          </p>
        ) : null}

        {days.length ? (
          <div className="radio-days">
            <h3 className="visually-hidden">Day by day</h3>
            {days.map((day) => {
              const rows = list.filter((x) => x.day === day);
              return (
                <section key={day} aria-label={dayLabel(day)}>
                  <h3>
                    {dayLabel(day)}
                    <span>{rows.filter((x) => x.result?.outcome === "done").length + " of " + rows.length + " had"}</span>
                  </h3>
                  <ul>
                    {rows.map((x) => (
                      <li key={x.id} className={"is-" + spotState(x, now)}>
                        <span className="radio-rt">{fmtTime(x.time)}</span>
                        <span className="radio-rw">
                          <strong>{x.extra ? x.title : stationName(d, x.stationId)}</strong>
                          <span>{(x.extra ? stationName(d, x.stationId) + " · extra" : RADIO_KIND[x.kind].label) + (x.result ? " · " + resultText(d, x) : "")}</span>
                        </span>
                        <span className="radio-ro">
                          <StateBadge st={spotState(x, now)} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="muted">Nothing booked in these days.</p>
        )}
      </div>
    </section>
  );
}

/* ---------- scripts ---------- */

function ScriptsView({ now }: { now: Now }) {
  const d = useData();
  const s = useSession();
  const [show, setShow] = useState<"open" | "sent" | "all">("open");
  const [edit, setEdit] = useState<RadioScript | "new" | null>(null);
  const all = scriptsByDue(d);
  const list = all.filter((sc) => show === "all" || (show === "sent" ? sc.status === "sent" : sc.status !== "sent"));
  if (show === "sent") list.reverse();

  async function copy(sc: RadioScript) {
    try {
      await navigator.clipboard.writeText(sc.title + "\n\n" + sc.body);
      toast("Copied. Paste it into the e-mail or WhatsApp to the station.", "ok");
    } catch {
      toast("This browser would not copy. Open Change and select the text instead.", "bad");
    }
  }

  return (
    <section className="panel" aria-labelledby="ra-sc-h">
      <div className="panel-head">
        <h2 id="ra-sc-h">Scripts and hype for the stations</h2>
        <div className="cluster">
          <Seg label="Show" value={show} onChange={setShow} options={[{ id: "open", label: "To send", count: all.filter((x) => x.status !== "sent").length }, { id: "sent", label: "Sent" }, { id: "all", label: "All" }]} />
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setEdit("new")}>
            Add a script
          </button>
        </div>
      </div>
      <div className="panel-body">
        {list.length ? (
          <ul className="radio-rows">
            {list.map((sc) => {
              const st = scriptState(sc, now.day);
              return (
                <li key={sc.id} className={"radio-row script-" + st}>
                  <span className="radio-time">
                    <span>Needed by</span>
                    <b>{fmtDate(sc.sendBy, { year: false })}</b>
                  </span>
                  <div className="grow">
                    <p className="event-tags">
                      <Badge variant="info">{SCRIPT_KIND[sc.kind].label}</Badge>
                      <Badge variant={SCRIPT_STATE[st].tone}>{SCRIPT_STATE[st].label}</Badge>
                      {sc.status === "draft" ? <Badge>Draft</Badge> : null}
                    </p>
                    <strong>{sc.title}</strong>
                    <span className="meta">
                      {(sc.stationIds.length ? sc.stationIds.map((x) => stationName(d, x)).join(", ") : "Every station") +
                        " · on air " +
                        (sc.airFrom === sc.airTo ? fmtDate(sc.airFrom, { year: false }) : fmtDate(sc.airFrom, { year: false }) + " to " + fmtDate(sc.airTo, { year: false })) +
                        (sc.sentAt ? " · sent " + whenTT(sc.sentAt) + " by " + personName(d, sc.sentBy) : "")}
                    </span>
                    <span className="radio-body">{sc.body}</span>
                    {sc.note ? <span className="radio-said">{sc.note}</span> : null}
                  </div>
                  <div className="cluster radio-acts">
                    {sc.status !== "sent" ? (
                      <button className="btn btn-primary btn-sm" type="button" onClick={() => act(s, "radio.script.sent", sc.title, () => markSent(s, sc.id), "Marked as sent.")}>
                        Mark sent
                      </button>
                    ) : null}
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => copy(sc)}>
                      Copy text
                    </button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEdit(sc)}>
                      Change
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">{show === "open" ? "Everything has gone to the stations." : "Nothing in this list."}</p>
        )}
      </div>
      <SideSheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Add a script" : edit ? edit.title : "Script"} sub="What the station needs from us, and the day they need it by">
        {edit ? <ScriptEditor key={edit === "new" ? "new" : edit.id} script={edit === "new" ? null : edit} now={now} onDone={() => setEdit(null)} /> : null}
      </SideSheet>
    </section>
  );
}

function ScriptEditor({ script, now, onDone }: { script: RadioScript | null; now: Now; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [v, setV] = useState<ScriptForm>(() =>
    script ? { kind: script.kind, title: script.title, stationIds: script.stationIds, body: script.body, sendBy: script.sendBy, airFrom: script.airFrom, airTo: script.airTo, status: script.status, note: script.note } : { kind: "points", title: "", stationIds: [], body: "", sendBy: now.day, airFrom: addDays(now.day, 1), airTo: addDays(now.day, 1), status: "draft" },
  );
  const all = !v.stationIds.length;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (act(s, script ? "radio.script.edit" : "radio.script.add", v.title || "Script", () => saveScript(s, script?.id || null, v), "Saved.")) onDone();
  }

  return (
    <form className="event-form" onSubmit={save}>
      <fieldset className="kind-pick">
        <legend>What is it</legend>
        {SCRIPT_KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={v.kind === k} onClick={() => setV({ ...v, kind: k })}>
            {SCRIPT_KIND[k].label}
          </button>
        ))}
      </fieldset>
      <p className="hint">{SCRIPT_KIND[v.kind].hint}</p>
      <div className="field">
        <label htmlFor="sc-title">Name</label>
        <input id="sc-title" type="text" maxLength={80} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Interview talking points: December" />
      </div>
      <fieldset className="store-pick">
        <legend>For which stations</legend>
        <label>
          <input type="checkbox" checked={all} onChange={(e) => setV({ ...v, stationIds: e.target.checked ? [] : d.radioStations.slice(0, 1).map((x) => x.id) })} />
          Every station
        </label>
        {all
          ? null
          : d.radioStations.map((st) => (
              <label key={st.id}>
                <input type="checkbox" checked={v.stationIds.includes(st.id)} onChange={(e) => setV({ ...v, stationIds: e.target.checked ? [...v.stationIds, st.id] : v.stationIds.filter((x) => x !== st.id) })} />
                {st.name}
              </label>
            ))}
      </fieldset>
      <div className="field">
        <label htmlFor="sc-send">The station needs it by</label>
        <input id="sc-send" type="date" value={v.sendBy} onChange={(e) => setV({ ...v, sendBy: e.target.value })} />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sc-from">First day on air</label>
          <input id="sc-from" type="date" value={v.airFrom} onChange={(e) => setV({ ...v, airFrom: e.target.value, airTo: e.target.value > v.airTo ? e.target.value : v.airTo })} />
        </div>
        <div className="field">
          <label htmlFor="sc-to">Last day on air</label>
          <input id="sc-to" type="date" min={v.airFrom} value={v.airTo} onChange={(e) => setV({ ...v, airTo: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="sc-body">The words</label>
        <textarea id="sc-body" rows={8} maxLength={2000} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} />
        <p className="hint">{"About " + Math.max(1, Math.round(v.body.split(/\s+/).filter(Boolean).length / 2.5)) + " seconds read aloud."}</p>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sc-status">Where it stands</label>
          <select id="sc-status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as ScriptForm["status"] })}>
            <option value="draft">Draft</option>
            <option value="ready">Ready to send</option>
            <option value="sent">Sent to the station</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="sc-note">Note</label>
          <input id="sc-note" type="text" maxLength={120} value={v.note || ""} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="Waiting on the photo" />
        </div>
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
        {script ? (
          <button
            className="btn btn-danger"
            type="button"
            onClick={async () => {
              if (await confirm({ title: "Delete this script?", body: script.title + " is deleted. Segments that named it keep their record without it.", okLabel: "Delete", danger: true })) {
                if (act(s, "radio.script.remove", script.title, () => removeScript(s, script.id), "Deleted.")) onDone();
              }
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
