"use client";

import { useMemo, useState } from "react";
import { Seg, Stat, act, csvRow, download } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon, type IconName } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { personName } from "@/lib/admin/guard";
import { whenTT } from "@/lib/admin/tt";
import { fmtDate, fmtTime } from "@/lib/format";
import {
  LATE_AFTER,
  RADIO_KIND,
  isExtra,
  RADIO_KINDS,
  SCRIPT_KIND,
  SCRIPT_KINDS,
  SCRIPT_STATE,
  STATE_TONE,
  WEEKDAYS,
  addDays,
  dayRows,
  endSlot,
  markSent,
  minutesLate,
  nowTT,
  onAir,
  removeLog,
  removeScript,
  report,
  saveLog,
  saveScript,
  saveSlot,
  saveStation,
  scriptState,
  scriptsByDue,
  scriptsFor,
  slotsOn,
  stateLabel,
  stationName,
  weekday,
  type DayRow,
  type LogForm,
  type ReportFilter,
  type RowState,
  type ScriptForm,
  type SlotForm,
  type StationForm,
} from "@/lib/ops/radio";
import { useData, useSession } from "@/lib/store";
import type {
  RadioKind,
  RadioOutcome,
  RadioScript,
  RadioSlot,
  RadioStation,
  Seed,
} from "@/lib/types";

/* The radio diary (lib/ops/radio.ts), in four views:
   - On air: one day's segments, each logged as had (and when), nobody called, dropped by the station, or called off;
   - Scripts: what the stations need from us and by when, like the content calendar's due dates;
   - Reports: any run of days, day by day, with the misses and the days nobody logged, and a CSV to send on;
   - Stations: the stations and the regular segments on each. */

type View = "day" | "scripts" | "report" | "stations";
const STATE_ICON: Record<RowState, IconName> = {
  done: "check",
  missed: "close",
  dropped: "close",
  off: "calendar",
  due: "clock",
  unlogged: "help",
};
const dayLabel = (day: string) => fmtDate(day, { weekday: true, year: false });

function daysText(days: number[]) {
  const k = days.slice().sort().join("");
  if (k === "0123456") return "Every day";
  if (k === "12345") return "Mon to Fri";
  if (k === "06") return "Weekends";
  return days
    .slice()
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((x) => WEEKDAYS[x])
    .join(", ");
}

/** People who can be on air or log a line: everyone with live office access, and whoever is already named. */
function officePeople(d: Seed, keep?: string) {
  const ids = new Set(
    (d.grants || [])
      .filter(
        (g) => !g.revokedAt && ["marketing", "owner", "admin"].includes(g.role),
      )
      .map((g) => g.userId),
  );
  if (keep) ids.add(keep);
  return Array.from(ids)
    .map((id) => ({ id, name: personName(d, id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function RadioPanel() {
  const d = useData();
  const [now] = useState(nowTT);
  const [view, setView] = useState<View>("day");
  const week = report(
    d,
    addDays(now.day, -6),
    now.day,
    { stationId: "all", kind: "all" },
    now,
  ).totals;
  const todays = dayRows(d, now.day, now).filter((r) => r.slot);
  const scripts = scriptsByDue(d).map((sc) => scriptState(sc, now.day));
  const late = scripts.filter((x) => x === "overdue").length,
    dueToday = scripts.filter((x) => x === "today").length;

  return (
    <div className="section-stack">
      <div className="stats">
        <Stat
          icon="radio"
          tone="ok"
          label="On air today"
          value={
            todays.filter((r) => r.state === "done").length +
            " of " +
            todays.length
          }
          sub={
            todays.filter((r) => r.state === "due").length + " still to come"
          }
          ring={{
            value: todays.filter((r) => r.state === "done").length,
            of: Math.max(todays.length, 1),
          }}
        />
        <Stat
          icon="close"
          tone={week.missed + week.dropped ? "bad" : undefined}
          label="Missed, last 7 days"
          value={week.missed + week.dropped}
          sub={
            week.missed +
            " nobody called, " +
            week.dropped +
            " dropped by the station"
          }
        />
        <Stat
          icon="help"
          tone={week.unlogged ? "warn" : undefined}
          label="Not logged"
          value={week.unlogged}
          sub="Last 7 days, nobody said what happened"
        />
        <Stat
          icon="file"
          tone={late ? "bad" : dueToday ? "warn" : undefined}
          label="Scripts to send"
          value={late + dueToday}
          sub={late + " overdue, " + dueToday + " due today"}
        />
      </div>
      <div className="radio-views">
        <Seg
          label="Show"
          value={view}
          onChange={setView}
          options={[
            { id: "day", label: "On air" },
            {
              id: "scripts",
              label: "Scripts",
              count: late + dueToday || undefined,
            },
            { id: "report", label: "Reports" },
            { id: "stations", label: "Stations" },
          ]}
        />
      </div>
      {view === "day" ? (
        <DayView now={now} />
      ) : view === "scripts" ? (
        <ScriptsView now={now} />
      ) : view === "report" ? (
        <ReportView now={now} />
      ) : (
        <StationsView now={now} />
      )}
    </div>
  );
}

/* ---------- on air: one day ---------- */

type LogTarget = { row: DayRow | null; day: string; outcome: RadioOutcome };

function DayView({ now }: { now: { day: string; time: string } }) {
  const d = useData();
  const [day, setDay] = useState(now.day);
  const [log, setLog] = useState<LogTarget | null>(null);
  const rows = dayRows(d, day, now);
  const done = rows.filter((r) => r.state === "done").length;

  return (
    <section className="panel" aria-labelledby="ra-day-h">
      <div className="panel-head">
        <h2 id="ra-day-h">
          {day === now.day
            ? "On air today, " + dayLabel(day)
            : "On air " + dayLabel(day)}
        </h2>
        <div className="cluster">
          <span className="radio-daynav">
            <button
              className="icon-btn"
              type="button"
              aria-label="The day before"
              onClick={() => setDay(addDays(day, -1))}
            >
              <Icon name="arrow" className="flip" />
            </button>
            <input
              type="date"
              aria-label="Day"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
            />
            <button
              className="icon-btn"
              type="button"
              aria-label="The day after"
              onClick={() => setDay(addDays(day, 1))}
            >
              <Icon name="arrow" />
            </button>
          </span>
          {day !== now.day ? (
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => setDay(now.day)}
            >
              Today
            </button>
          ) : null}
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={day > now.day}
            onClick={() => setLog({ row: null, day, outcome: "done" })}
          >
            Log something extra
          </button>
        </div>
      </div>
      <div className="panel-body">
        {rows.length ? (
          <>
            <p className="muted radio-sum">
              {day > now.day
                ? rows.length + " on the schedule."
                : done +
                  " of " +
                  rows.length +
                  " had or aired" +
                  (rows.some((r) => r.state === "unlogged")
                    ? ". Some still need logging."
                    : ".")}
            </p>
            <ul className="radio-rows">
              {rows.map((r) => (
                <RadioRow
                  key={r.key}
                  r={r}
                  future={day > now.day}
                  onLog={(outcome) => setLog({ row: r, day, outcome })}
                />
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">Nothing on the schedule this day.</p>
        )}
      </div>
      <SideSheet
        open={!!log}
        onClose={() => setLog(null)}
        title={log?.row ? log.row.title : "Log something extra"}
        sub={
          log
            ? dayLabel(log.day) +
              (log.row
                ? " · " +
                  stationName(d, log.row.stationId) +
                  " · " +
                  fmtTime(log.row.time)
                : "")
            : undefined
        }
      >
        {log ? (
          <LogEditor
            key={(log.row?.key || "extra") + log.day}
            target={log}
            now={now}
            onDone={() => setLog(null)}
          />
        ) : null}
      </SideSheet>
    </section>
  );
}

function RadioRow({
  r,
  future,
  onLog,
}: {
  r: DayRow;
  future: boolean;
  onLog: (o: RadioOutcome) => void;
}) {
  const d = useData();
  const station = byStation(d, r.stationId);
  const off =
    r.log?.at && r.slot && r.log.slotId
      ? minutesLate(r.slot.time, r.log.at)
      : 0;
  const person = r.log?.person || r.slot?.person;
  return (
    <li className={"radio-row is-" + r.state}>
      <span className="radio-time">
        <b>{r.time ? fmtTime(r.time) : "—"}</b>
        {!isExtra(r) && r.slot ? (
          <span>{r.slot.minutes + " min"}</span>
        ) : (
          <span>Extra</span>
        )}
      </span>
      <div className="grow">
        <p className="event-tags">
          <Badge variant={RADIO_KIND[r.kind].tone}>
            {RADIO_KIND[r.kind].label}
          </Badge>
          <Badge variant={STATE_TONE[r.state]}>
            <Icon name={STATE_ICON[r.state]} />
            {stateLabel(r.kind, r.state)}
          </Badge>
        </p>
        <strong>{r.title}</strong>
        <span className="meta">
          {[station?.name, r.slot?.show, person ? personName(d, person) : ""]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {r.log ? (
          <span className="radio-said">
            {r.log.outcome === "done" && r.log.at
              ? (onAir(r.kind) ? "On air at " : "Aired at ") +
                fmtTime(r.log.at) +
                (r.log.slotId
                  ? off > LATE_AFTER
                    ? ", " + off + " min late"
                    : off < -LATE_AFTER
                      ? ", " + -off + " min early"
                      : ", on time"
                  : "") +
                ". "
              : ""}
            {r.log.scriptId
              ? "Script: " +
                (d.radioScripts.find((x) => x.id === r.log?.scriptId)?.title ||
                  "deleted") +
                ". "
              : ""}
            {r.log.note || ""}
            <em>
              {" Logged by " +
                personName(d, r.log.loggedBy) +
                ", " +
                whenTT(r.log.loggedAt) +
                "."}
            </em>
          </span>
        ) : null}
      </div>
      <div className="cluster radio-acts">
        {r.log ? (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => onLog(r.log!.outcome)}
          >
            Change
          </button>
        ) : future ? (
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => onLog("off")}
          >
            Call it off
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              onClick={() => onLog("done")}
            >
              {onAir(r.kind) ? "Had it" : "Aired"}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => onLog("missed")}
            >
              {onAir(r.kind) ? "Not had" : "Did not air"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** The script a segment used last time, while it is still on air; or the only script on air for the station. */
function usualScript(d: Seed, slotId: string, stationId: string, day: string) {
  const on = scriptsFor(d, day, stationId);
  const last = (d.radioLogs || [])
    .filter((l) => l.slotId === slotId && l.scriptId && l.day < day)
    .sort((a, b) => b.day.localeCompare(a.day))[0];
  if (last && on.some((x) => x.id === last.scriptId)) return last.scriptId;
  return on.length === 1 ? on[0].id : undefined;
}

const byStation = (d: Seed, id: string) =>
  (d.radioStations || []).find((s) => s.id === id) || null;

function LogEditor({
  target,
  now,
  onDone,
}: {
  target: LogTarget;
  now: { day: string; time: string };
  onDone: () => void;
}) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const { row, day } = target;
  const cur = row?.log || null;
  const firstStation = d.radioStations[0]?.id || "";
  const [v, setV] = useState<LogForm>(() =>
    cur
      ? {
          slotId: cur.slotId,
          stationId: cur.stationId,
          kind: cur.kind,
          day: cur.day,
          outcome: target.outcome,
          at: cur.at,
          person: cur.person,
          scriptId: cur.scriptId,
          title: cur.title,
          note: cur.note,
        }
      : {
          slotId: row?.slot?.id || null,
          stationId: row?.stationId || firstStation,
          kind: row?.kind || "interview",
          day,
          outcome: target.outcome,
          // the booked time, or now when it is being logged within half an hour of it
          at: row?.slot
            ? day === now.day &&
              minutesLate(row.slot.time, now.time) >= 0 &&
              minutesLate(row.slot.time, now.time) <= 30
              ? now.time
              : row.slot.time
            : day === now.day
              ? now.time
              : "",
          person: row?.slot?.person || s?.userId || undefined,
          scriptId: row?.slot
            ? usualScript(d, row.slot.id, row.stationId, day)
            : undefined,
        },
  );
  const scripts = scriptsFor(d, day, v.stationId);
  const outcomes: RadioOutcome[] =
    day > now.day ? ["off"] : ["done", "missed", "dropped", "off"];

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      act(
        s,
        "radio.log",
        row?.title || v.title || "Radio",
        () => saveLog(s, cur?.id || null, v),
        "Logged: " +
          stateLabel(v.kind, v.outcome).toLowerCase() +
          (v.outcome === "done" && v.at ? " at " + fmtTime(v.at) : "") +
          ".",
      )
    )
      onDone();
  }

  return (
    <form className="event-form" onSubmit={save}>
      {row ? null : (
        <>
          <div className="field">
            <label htmlFor="rl-title">What was it</label>
            <input
              id="rl-title"
              type="text"
              maxLength={80}
              value={v.title || ""}
              onChange={(e) => setV({ ...v, title: e.target.value })}
              placeholder="The host called about the Christmas hours"
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="rl-st">Station</label>
              <select
                id="rl-st"
                value={v.stationId}
                onChange={(e) =>
                  setV({ ...v, stationId: e.target.value, scriptId: undefined })
                }
              >
                {d.radioStations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rl-kind">Kind</label>
              <select
                id="rl-kind"
                value={v.kind}
                onChange={(e) =>
                  setV({ ...v, kind: e.target.value as RadioKind })
                }
              >
                {RADIO_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {RADIO_KIND[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
      <fieldset className="kind-pick">
        <legend>What happened</legend>
        {outcomes.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={v.outcome === o}
            onClick={() => setV({ ...v, outcome: o })}
          >
            <Icon name={STATE_ICON[o]} />
            {stateLabel(v.kind, o)}
          </button>
        ))}
      </fieldset>
      {v.outcome === "done" ? (
        <div className="form-row">
          <div className="field">
            <label htmlFor="rl-at">
              {onAir(v.kind) ? "Time it went on air" : "Time it aired"}
            </label>
            <input
              id="rl-at"
              type="time"
              required
              value={v.at || ""}
              onChange={(e) => setV({ ...v, at: e.target.value })}
            />
            {row?.slot && v.at ? (
              <p className="hint">
                {"Booked for " +
                  fmtTime(row.slot.time) +
                  (minutesLate(row.slot.time, v.at) > LATE_AFTER
                    ? ": " + minutesLate(row.slot.time, v.at) + " min late."
                    : ".")}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="rl-who">{RADIO_KIND[v.kind].who}</label>
            <select
              id="rl-who"
              value={v.person || ""}
              onChange={(e) =>
                setV({ ...v, person: e.target.value || undefined })
              }
            >
              <option value="">Not recorded</option>
              {officePeople(d, v.person).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      {v.outcome === "done" ? (
        <div className="field">
          <label htmlFor="rl-script">Script or talking points used</label>
          <select
            id="rl-script"
            value={v.scriptId || ""}
            onChange={(e) =>
              setV({ ...v, scriptId: e.target.value || undefined })
            }
          >
            <option value="">None</option>
            {scripts.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="rl-note">
          {v.outcome === "done" ? "Note, if any" : "What happened"}
        </label>
        <textarea
          id="rl-note"
          rows={3}
          maxLength={240}
          value={v.note || ""}
          onChange={(e) => setV({ ...v, note: e.target.value })}
          placeholder={
            v.outcome === "missed"
              ? "Nobody covered the call while Isabel was at the meeting"
              : v.outcome === "dropped"
                ? "The host ran long on the news"
                : v.outcome === "off"
                  ? "Public holiday: the show is off"
                  : "The host asked about the hampers"
          }
        />
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
        {cur ? (
          <button
            className="btn btn-danger"
            type="button"
            onClick={async () => {
              if (
                await confirm({
                  title: "Take this log line off?",
                  body: "The day shows as not logged again.",
                  okLabel: "Take it off",
                  danger: true,
                })
              ) {
                if (
                  act(
                    s,
                    "radio.unlog",
                    row?.title || "Radio",
                    () => removeLog(s, cur.id),
                    "Log line taken off.",
                  )
                )
                  onDone();
              }
            }}
          >
            Take the line off
          </button>
        ) : null}
      </div>
    </form>
  );
}

/* ---------- scripts ---------- */

function ScriptsView({ now }: { now: { day: string; time: string } }) {
  const d = useData();
  const s = useSession();
  const [show, setShow] = useState<"open" | "sent" | "all">("open");
  const [edit, setEdit] = useState<RadioScript | "new" | null>(null);
  const all = scriptsByDue(d);
  const list = all.filter(
    (sc) =>
      show === "all" ||
      (show === "sent" ? sc.status === "sent" : sc.status !== "sent"),
  );
  if (show === "sent") list.reverse();

  async function copy(sc: RadioScript) {
    try {
      await navigator.clipboard.writeText(sc.title + "\n\n" + sc.body);
      toast(
        "Copied. Paste it into the e-mail or WhatsApp to the station.",
        "ok",
      );
    } catch {
      toast(
        "This browser would not copy. Select the text in Edit instead.",
        "bad",
      );
    }
  }

  return (
    <section className="panel" aria-labelledby="ra-sc-h">
      <div className="panel-head">
        <h2 id="ra-sc-h">Scripts and hype for the stations</h2>
        <div className="cluster">
          <Seg
            label="Show"
            value={show}
            onChange={setShow}
            options={[
              {
                id: "open",
                label: "To send",
                count: all.filter((x) => x.status !== "sent").length,
              },
              { id: "sent", label: "Sent" },
              { id: "all", label: "All" },
            ]}
          />
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => setEdit("new")}
          >
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
                      <Badge variant={SCRIPT_STATE[st].tone}>
                        {SCRIPT_STATE[st].label}
                      </Badge>
                      {sc.status === "draft" ? <Badge>Draft</Badge> : null}
                    </p>
                    <strong>{sc.title}</strong>
                    <span className="meta">
                      {(sc.stationIds.length
                        ? sc.stationIds.map((x) => stationName(d, x)).join(", ")
                        : "Every station") +
                        " · on air " +
                        (sc.airFrom === sc.airTo
                          ? fmtDate(sc.airFrom, { year: false })
                          : fmtDate(sc.airFrom, { year: false }) +
                            " to " +
                            fmtDate(sc.airTo, { year: false })) +
                        (sc.sentAt
                          ? " · sent " +
                            fmtDate(sc.sentAt.slice(0, 10), { year: false }) +
                            " by " +
                            personName(d, sc.sentBy)
                          : "")}
                    </span>
                    <span className="radio-body">{sc.body}</span>
                    {sc.note ? (
                      <span className="radio-said">{sc.note}</span>
                    ) : null}
                  </div>
                  <div className="cluster radio-acts">
                    {sc.status !== "sent" ? (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={() =>
                          act(
                            s,
                            "radio.script.sent",
                            sc.title,
                            () => markSent(s, sc.id),
                            "Marked as sent.",
                          )
                        }
                      >
                        Mark sent
                      </button>
                    ) : null}
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => copy(sc)}
                    >
                      Copy text
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => setEdit(sc)}
                    >
                      Edit
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">
            {show === "open"
              ? "Everything has gone to the stations."
              : "Nothing in this list."}
          </p>
        )}
      </div>
      <SideSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit === "new" ? "Add a script" : edit ? edit.title : "Script"}
        sub="What the station needs from us, and the day they need it by"
      >
        {edit ? (
          <ScriptEditor
            key={edit === "new" ? "new" : edit.id}
            script={edit === "new" ? null : edit}
            now={now}
            onDone={() => setEdit(null)}
          />
        ) : null}
      </SideSheet>
    </section>
  );
}

function ScriptEditor({
  script,
  now,
  onDone,
}: {
  script: RadioScript | null;
  now: { day: string; time: string };
  onDone: () => void;
}) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [v, setV] = useState<ScriptForm>(() =>
    script
      ? {
          kind: script.kind,
          title: script.title,
          stationIds: script.stationIds,
          body: script.body,
          sendBy: script.sendBy,
          airFrom: script.airFrom,
          airTo: script.airTo,
          status: script.status,
          note: script.note,
        }
      : {
          kind: "points",
          title: "",
          stationIds: [],
          body: "",
          sendBy: now.day,
          airFrom: addDays(now.day, 1),
          airTo: addDays(now.day, 1),
          status: "draft",
        },
  );
  const all = !v.stationIds.length;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      act(
        s,
        script ? "radio.script.edit" : "radio.script.add",
        v.title || "Script",
        () => saveScript(s, script?.id || null, v),
        "Saved.",
      )
    )
      onDone();
  }

  return (
    <form className="event-form" onSubmit={save}>
      <fieldset className="kind-pick">
        <legend>What is it</legend>
        {SCRIPT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={v.kind === k}
            onClick={() => setV({ ...v, kind: k })}
          >
            {SCRIPT_KIND[k].label}
          </button>
        ))}
      </fieldset>
      <p className="hint">{SCRIPT_KIND[v.kind].hint}</p>
      <div className="field">
        <label htmlFor="rs-title">Name</label>
        <input
          id="rs-title"
          type="text"
          maxLength={80}
          value={v.title}
          onChange={(e) => setV({ ...v, title: e.target.value })}
          placeholder="Talking points: Monday specials call"
        />
      </div>
      <fieldset className="store-pick">
        <legend>For which stations</legend>
        <label>
          <input
            type="checkbox"
            checked={all}
            onChange={(e) =>
              setV({
                ...v,
                stationIds: e.target.checked
                  ? []
                  : d.radioStations.slice(0, 1).map((x) => x.id),
              })
            }
          />
          Every station
        </label>
        {all
          ? null
          : d.radioStations.map((st) => (
              <label key={st.id}>
                <input
                  type="checkbox"
                  checked={v.stationIds.includes(st.id)}
                  onChange={(e) =>
                    setV({
                      ...v,
                      stationIds: e.target.checked
                        ? [...v.stationIds, st.id]
                        : v.stationIds.filter((x) => x !== st.id),
                    })
                  }
                />
                {st.name}
              </label>
            ))}
      </fieldset>
      <div className="field">
        <label htmlFor="rs-send">The station needs it by</label>
        <input
          id="rs-send"
          type="date"
          value={v.sendBy}
          onChange={(e) => setV({ ...v, sendBy: e.target.value })}
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="rs-from">First day on air</label>
          <input
            id="rs-from"
            type="date"
            value={v.airFrom}
            onChange={(e) =>
              setV({
                ...v,
                airFrom: e.target.value,
                airTo: e.target.value > v.airTo ? e.target.value : v.airTo,
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="rs-to">Last day on air</label>
          <input
            id="rs-to"
            type="date"
            min={v.airFrom}
            value={v.airTo}
            onChange={(e) => setV({ ...v, airTo: e.target.value })}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="rs-body">The words</label>
        <textarea
          id="rs-body"
          rows={8}
          maxLength={2000}
          value={v.body}
          onChange={(e) => setV({ ...v, body: e.target.value })}
        />
        <p className="hint">
          {"About " +
            Math.max(
              1,
              Math.round(v.body.split(/\s+/).filter(Boolean).length / 2.5),
            ) +
            " seconds read aloud."}
        </p>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="rs-status">Where it stands</label>
          <select
            id="rs-status"
            value={v.status}
            onChange={(e) =>
              setV({ ...v, status: e.target.value as ScriptForm["status"] })
            }
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready to send</option>
            <option value="sent">Sent to the station</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rs-note">Note</label>
          <input
            id="rs-note"
            type="text"
            maxLength={120}
            value={v.note || ""}
            onChange={(e) => setV({ ...v, note: e.target.value })}
            placeholder="Waiting on the photo"
          />
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
              if (
                await confirm({
                  title: "Delete this script?",
                  body:
                    script.title +
                    " is deleted. Log lines that named it keep their record without it.",
                  okLabel: "Delete",
                  danger: true,
                })
              ) {
                if (
                  act(
                    s,
                    "radio.script.remove",
                    script.title,
                    () => removeScript(s, script.id),
                    "Deleted.",
                  )
                )
                  onDone();
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

/* ---------- reports ---------- */

type Range = "7" | "week" | "month" | "last-month" | "custom";

function rangeOf(
  r: Range,
  today: string,
  custom: { from: string; to: string },
) {
  if (r === "7") return { from: addDays(today, -6), to: today };
  if (r === "week")
    return { from: addDays(today, -((weekday(today) + 6) % 7)), to: today };
  if (r === "month") return { from: today.slice(0, 8) + "01", to: today };
  if (r === "last-month") {
    const first = today.slice(0, 8) + "01",
      end = addDays(first, -1);
    return { from: end.slice(0, 8) + "01", to: end };
  }
  return custom;
}

function ReportView({ now }: { now: { day: string; time: string } }) {
  const d = useData();
  const [range, setRange] = useState<Range>("7");
  const [custom, setCustom] = useState({
    from: addDays(now.day, -13),
    to: now.day,
  });
  const [f, setF] = useState<ReportFilter>({ stationId: "all", kind: "all" });
  const span = rangeOf(range, now.day, custom);
  const rep = useMemo(
    () => report(d, span.from, span.to, f, now),
    [d, span.from, span.to, f, now],
  );
  const t = rep.totals;
  const counted = t.planned - t.off;
  const pct = counted ? Math.round((t.done / counted) * 100) : 0;

  function csv() {
    const head = csvRow([
      "Day",
      "Weekday",
      "Booked for",
      "Station",
      "Show",
      "Segment",
      "Kind",
      "What happened",
      "On air at",
      "Minutes late",
      "Who",
      "Script",
      "Note",
      "Logged by",
      "Logged at",
    ]);
    const lines = rep.days.flatMap(({ day, rows }) =>
      rows.map((r) =>
        csvRow([
          day,
          WEEKDAYS[weekday(day)],
          !isExtra(r) && r.slot ? r.slot.time : "",
          stationName(d, r.stationId),
          r.slot?.show || "",
          r.title,
          RADIO_KIND[r.kind].label,
          stateLabel(r.kind, r.state),
          r.log?.at || "",
          r.log?.at && r.slot && r.log.slotId
            ? minutesLate(r.slot.time, r.log.at)
            : "",
          r.log?.person
            ? personName(d, r.log.person)
            : r.slot
              ? personName(d, r.slot.person)
              : "",
          r.log?.scriptId
            ? d.radioScripts.find((x) => x.id === r.log?.scriptId)?.title || ""
            : "",
          r.log?.note || "",
          r.log ? personName(d, r.log.loggedBy) : "",
          r.log ? whenTT(r.log.loggedAt) : "",
        ]),
      ),
    );
    download(
      "radio-report-" + span.from + "-to-" + span.to + ".csv",
      [head, ...lines].join("\r\n"),
    );
  }

  return (
    <section className="panel" aria-labelledby="ra-rep-h">
      <div className="panel-head">
        <h2 id="ra-rep-h">
          {"Radio report, " +
            fmtDate(span.from, { year: false }) +
            " to " +
            fmtDate(span.to, { year: false })}
        </h2>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={csv}
          disabled={!rep.days.length}
        >
          <Icon name="upload" />
          Download as a spreadsheet
        </button>
      </div>
      <div className="panel-body">
        <div className="radio-filters">
          <Seg
            label="Days"
            value={range}
            onChange={setRange}
            options={[
              { id: "7", label: "Last 7 days" },
              { id: "week", label: "This week" },
              { id: "month", label: "This month" },
              { id: "last-month", label: "Last month" },
              { id: "custom", label: "Choose" },
            ]}
          />
          {range === "custom" ? (
            <span className="cluster">
              <label className="radio-inline">
                From
                <input
                  type="date"
                  value={custom.from}
                  max={custom.to}
                  onChange={(e) =>
                    e.target.value &&
                    setCustom({ ...custom, from: e.target.value })
                  }
                />
              </label>
              <label className="radio-inline">
                To
                <input
                  type="date"
                  value={custom.to}
                  min={custom.from}
                  onChange={(e) =>
                    e.target.value &&
                    setCustom({ ...custom, to: e.target.value })
                  }
                />
              </label>
            </span>
          ) : null}
          <span className="cluster">
            <select
              aria-label="Station"
              value={f.stationId}
              onChange={(e) => setF({ ...f, stationId: e.target.value })}
            >
              <option value="all">Every station</option>
              {d.radioStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Kind"
              value={f.kind}
              onChange={(e) =>
                setF({ ...f, kind: e.target.value as ReportFilter["kind"] })
              }
            >
              <option value="all">Every kind</option>
              {RADIO_KINDS.map((k) => (
                <option key={k} value={k}>
                  {RADIO_KIND[k].label}
                </option>
              ))}
            </select>
          </span>
        </div>

        <dl className="radio-totals">
          <div>
            <dt>Booked</dt>
            <dd>{t.planned}</dd>
          </div>
          <div className="is-done">
            <dt>Had or aired</dt>
            <dd>
              {t.done}
              <small>{counted ? pct + "%" : ""}</small>
            </dd>
          </div>
          <div className="is-missed">
            <dt>Nobody called or did not air</dt>
            <dd>{t.missed}</dd>
          </div>
          <div className="is-dropped">
            <dt>Dropped by the station</dt>
            <dd>{t.dropped}</dd>
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
            <dt>Called off ahead</dt>
            <dd>{t.off}</dd>
          </div>
          <div>
            <dt>Extras</dt>
            <dd>{t.extras}</dd>
          </div>
        </dl>

        {rep.days.length ? (
          <>
            <ol
              className="radio-strip"
              aria-label="Each day at a glance"
              ref={(el) => {
                // newest day in view on a narrow screen
                if (el) el.scrollLeft = el.scrollWidth;
              }}
            >
              {rep.days
                .slice()
                .reverse()
                .slice(-31)
                .map(({ day, rows }) => {
                  const st: RowState | "none" = !rows.length
                    ? "none"
                    : rows.some(
                          (r) => r.state === "missed" || r.state === "dropped",
                        )
                      ? "missed"
                      : rows.some((r) => r.state === "unlogged")
                        ? "unlogged"
                        : rows.every((r) => r.state === "off")
                          ? "off"
                          : "done";
                  const text = !rows.length
                    ? "nothing booked"
                    : st === "missed"
                      ? "something was missed"
                      : st === "unlogged"
                        ? "something not logged"
                        : st === "off"
                          ? "called off"
                          : "all had";
                  return (
                    <li
                      key={day}
                      className={"is-" + st}
                      title={dayLabel(day) + ": " + text}
                    >
                      <span>{WEEKDAYS[weekday(day)].slice(0, 2)}</span>
                      <b>{Number(day.slice(8))}</b>
                      {st === "none" ? (
                        <i aria-hidden="true">·</i>
                      ) : (
                        <Icon name={STATE_ICON[st]} />
                      )}
                      <span className="visually-hidden">{text}</span>
                    </li>
                  );
                })}
            </ol>
            <div className="radio-days">
              {rep.days.map(({ day, rows }) => (
                <section key={day} aria-label={dayLabel(day)}>
                  <h3>
                    {dayLabel(day)}
                    <span>
                      {rows.length
                        ? rows.filter((r) => r.state === "done").length +
                          " of " +
                          rows.length +
                          " had or aired"
                        : "Nothing booked"}
                    </span>
                  </h3>
                  {rows.length ? (
                    <ul>
                      {rows.map((r) => (
                        <li key={r.key} className={"is-" + r.state}>
                          <span className="radio-rt">
                            {!isExtra(r) && r.slot
                              ? fmtTime(r.slot.time)
                              : "Extra"}
                          </span>
                          <span className="radio-rw">
                            <strong>{r.title}</strong>
                            <span>
                              {stationName(d, r.stationId) +
                                " · " +
                                RADIO_KIND[r.kind].label}
                            </span>
                          </span>
                          <span className="radio-ro">
                            <Badge variant={STATE_TONE[r.state]}>
                              <Icon name={STATE_ICON[r.state]} />
                              {stateLabel(r.kind, r.state)}
                            </Badge>
                            {r.log?.at ? (
                              <span>
                                {"at " +
                                  fmtTime(r.log.at) +
                                  (r.slot &&
                                  r.log.slotId &&
                                  minutesLate(r.slot.time, r.log.at) >
                                    LATE_AFTER
                                    ? ", " +
                                      minutesLate(r.slot.time, r.log.at) +
                                      " min late"
                                    : "")}
                              </span>
                            ) : null}
                            {r.log?.note ? <em>{r.log.note}</em> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Those days have not come yet.</p>
        )}
      </div>
    </section>
  );
}

/* ---------- stations and their regular segments ---------- */

function StationsView({ now }: { now: { day: string; time: string } }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [station, setStation] = useState<RadioStation | "new" | null>(null);
  const [slot, setSlot] = useState<RadioSlot | "new" | null>(null);
  const tomorrow = addDays(now.day, 1);

  return (
    <section className="panel" aria-labelledby="ra-st-h">
      <div className="panel-head">
        <h2 id="ra-st-h">Stations and regular segments</h2>
        <div className="cluster">
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => setStation("new")}
          >
            Add a station
          </button>
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={!d.radioStations.length}
            onClick={() => setSlot("new")}
          >
            Add a segment
          </button>
        </div>
      </div>
      <div className="panel-body">
        {d.radioStations.length ? (
          <ul className="radio-stations">
            {d.radioStations.map((st) => {
              const slots = (d.radioSlots || [])
                .filter((x) => x.stationId === st.id)
                .sort(
                  (a, b) =>
                    Number(!!a.to && a.to < now.day) -
                      Number(!!b.to && b.to < now.day) ||
                    a.time.localeCompare(b.time),
                );
              return (
                <li key={st.id}>
                  <div className="radio-st-head">
                    <span className="radio-st-icon" aria-hidden="true">
                      <Icon name="radio" />
                    </span>
                    <div className="grow">
                      <strong>
                        {st.name + (st.frequency ? " " + st.frequency : "")}
                      </strong>
                      <span className="meta">
                        {st.contact}
                        {st.phone ? (
                          <>
                            {" · "}
                            <a href={"tel:" + st.phone.replace(/\s+/g, "")}>
                              {st.phone}
                            </a>
                          </>
                        ) : null}
                        {st.email ? (
                          <>
                            {" · "}
                            <a href={"mailto:" + st.email}>{st.email}</a>
                          </>
                        ) : null}
                      </span>
                      {st.note ? (
                        <span className="radio-said">{st.note}</span>
                      ) : null}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => setStation(st)}
                    >
                      Edit
                    </button>
                  </div>
                  {slots.length ? (
                    <ul className="radio-slots">
                      {slots.map((x) => {
                        const ended = !!x.to && x.to < now.day,
                          soon = x.from > now.day;
                        return (
                          <li key={x.id} className={ended ? "is-ended" : ""}>
                            <span className="radio-rt">{fmtTime(x.time)}</span>
                            <span className="radio-rw">
                              <strong>{x.title}</strong>
                              <span>
                                {[
                                  daysText(x.days),
                                  RADIO_KIND[x.kind].label,
                                  x.show,
                                  personName(d, x.person),
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            <Badge
                              variant={ended ? "neutral" : soon ? "info" : "ok"}
                            >
                              {ended
                                ? "Ended " + fmtDate(x.to, { year: false })
                                : soon
                                  ? "Starts " + fmtDate(x.from, { year: false })
                                  : x.to
                                    ? "Until " + fmtDate(x.to, { year: false })
                                    : "Running"}
                            </Badge>
                            <span className="cluster">
                              <button
                                className="btn btn-ghost btn-sm"
                                type="button"
                                onClick={() => setSlot(x)}
                              >
                                Edit
                              </button>
                              {ended ? null : (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  type="button"
                                  onClick={async () => {
                                    if (
                                      await confirm({
                                        title: "Stop this segment?",
                                        body:
                                          x.title +
                                          " comes off the schedule after today. Its past days and their log lines stay in the reports.",
                                        okLabel: "Stop it",
                                        danger: true,
                                      })
                                    )
                                      act(
                                        s,
                                        "radio.slot.end",
                                        x.title,
                                        () => endSlot(s, x.id, now.day),
                                        "Stopped after today.",
                                      );
                                  }}
                                >
                                  Stop
                                </button>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted radio-none">
                      No regular segments on this station.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">No stations yet. Add the first one.</p>
        )}
        <p className="hint">
          {"Coming up tomorrow: " +
            (slotsOn(d, tomorrow)
              .map((x) => fmtTime(x.time) + " " + x.title)
              .join(", ") || "nothing booked") +
            "."}
        </p>
      </div>
      <SideSheet
        open={!!station}
        onClose={() => setStation(null)}
        title={
          station === "new"
            ? "Add a station"
            : station
              ? station.name
              : "Station"
        }
      >
        {station ? (
          <StationEditor
            key={station === "new" ? "new" : station.id}
            station={station === "new" ? null : station}
            onDone={() => setStation(null)}
          />
        ) : null}
      </SideSheet>
      <SideSheet
        open={!!slot}
        onClose={() => setSlot(null)}
        title={
          slot === "new"
            ? "Add a regular segment"
            : slot
              ? slot.title
              : "Segment"
        }
        sub="The same station, kind and time on set days of the week"
      >
        {slot ? (
          <SlotEditor
            key={slot === "new" ? "new" : slot.id}
            slot={slot === "new" ? null : slot}
            now={now}
            onDone={() => setSlot(null)}
          />
        ) : null}
      </SideSheet>
    </section>
  );
}

function StationEditor({
  station,
  onDone,
}: {
  station: RadioStation | null;
  onDone: () => void;
}) {
  const s = useSession();
  const [v, setV] = useState<StationForm>(() =>
    station
      ? {
          name: station.name,
          frequency: station.frequency,
          contact: station.contact,
          phone: station.phone,
          email: station.email,
          note: station.note,
        }
      : { name: "", frequency: "", contact: "" },
  );
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      act(
        s,
        station ? "radio.station.edit" : "radio.station.add",
        v.name || "Station",
        () => saveStation(s, station?.id || null, v),
        "Saved.",
      )
    )
      onDone();
  }
  return (
    <form className="event-form" onSubmit={save}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="st-name">Station</label>
          <input
            id="st-name"
            type="text"
            maxLength={60}
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="st-freq">Frequency</label>
          <input
            id="st-freq"
            type="text"
            maxLength={20}
            value={v.frequency}
            onChange={(e) => setV({ ...v, frequency: e.target.value })}
            placeholder="98.1 FM"
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="st-contact">Who we deal with</label>
        <input
          id="st-contact"
          type="text"
          maxLength={80}
          value={v.contact}
          onChange={(e) => setV({ ...v, contact: e.target.value })}
          placeholder="The morning show producer"
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="st-phone">Phone</label>
          <input
            id="st-phone"
            type="tel"
            maxLength={30}
            value={v.phone || ""}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="st-email">E-mail</label>
          <input
            id="st-email"
            type="email"
            maxLength={80}
            value={v.email || ""}
            onChange={(e) => setV({ ...v, email: e.target.value })}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="st-note">Note</label>
        <textarea
          id="st-note"
          rows={2}
          maxLength={200}
          value={v.note || ""}
          onChange={(e) => setV({ ...v, note: e.target.value })}
        />
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function SlotEditor({
  slot,
  now,
  onDone,
}: {
  slot: RadioSlot | null;
  now: { day: string; time: string };
  onDone: () => void;
}) {
  const d = useData();
  const s = useSession();
  const [v, setV] = useState<SlotForm>(() =>
    slot
      ? {
          stationId: slot.stationId,
          kind: slot.kind,
          title: slot.title,
          show: slot.show,
          days: slot.days,
          time: slot.time,
          minutes: slot.minutes,
          person: slot.person,
          from: slot.from,
          to: slot.to,
        }
      : {
          stationId: d.radioStations[0]?.id || "",
          kind: "call",
          title: "",
          show: "",
          days: [1, 2, 3, 4, 5],
          time: "07:30",
          minutes: 5,
          person: s?.userId || "",
          from: now.day,
        },
  );
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (
      act(
        s,
        slot ? "radio.slot.edit" : "radio.slot.add",
        v.title || "Segment",
        () => saveSlot(s, slot?.id || null, v),
        "Saved. It is on the schedule.",
      )
    )
      onDone();
  }
  return (
    <form className="event-form" onSubmit={save}>
      <fieldset className="kind-pick">
        <legend>What is it</legend>
        {RADIO_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={v.kind === k}
            onClick={() => setV({ ...v, kind: k })}
          >
            {RADIO_KIND[k].label}
          </button>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="sl-title">Name</label>
        <input
          id="sl-title"
          type="text"
          maxLength={60}
          value={v.title}
          onChange={(e) => setV({ ...v, title: e.target.value })}
          placeholder="Specials call-in"
        />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sl-st">Station</label>
          <select
            id="sl-st"
            value={v.stationId}
            onChange={(e) => setV({ ...v, stationId: e.target.value })}
          >
            {d.radioStations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sl-show">Show and host</label>
          <input
            id="sl-show"
            type="text"
            maxLength={60}
            value={v.show || ""}
            onChange={(e) => setV({ ...v, show: e.target.value })}
            placeholder="The Morning Drive"
          />
        </div>
      </div>
      <fieldset className="store-pick">
        <legend>Days of the week</legend>
        {[1, 2, 3, 4, 5, 6, 0].map((x) => (
          <label key={x}>
            <input
              type="checkbox"
              checked={v.days.includes(x)}
              onChange={(e) =>
                setV({
                  ...v,
                  days: e.target.checked
                    ? [...v.days, x]
                    : v.days.filter((y) => y !== x),
                })
              }
            />
            {WEEKDAYS[x]}
          </label>
        ))}
      </fieldset>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sl-time">Time on air</label>
          <input
            id="sl-time"
            type="time"
            value={v.time}
            onChange={(e) => setV({ ...v, time: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="sl-min">Minutes</label>
          <input
            id="sl-min"
            type="number"
            min={1}
            max={120}
            value={v.minutes}
            onChange={(e) =>
              setV({ ...v, minutes: Math.max(1, Number(e.target.value) || 1) })
            }
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="sl-who">{RADIO_KIND[v.kind].who}</label>
        <select
          id="sl-who"
          value={v.person}
          onChange={(e) => setV({ ...v, person: e.target.value })}
        >
          {officePeople(d, v.person).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sl-from">First day</label>
          <input
            id="sl-from"
            type="date"
            value={v.from}
            onChange={(e) => setV({ ...v, from: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="sl-to">Last day, if it ends</label>
          <input
            id="sl-to"
            type="date"
            min={v.from}
            value={v.to || ""}
            onChange={(e) => setV({ ...v, to: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
