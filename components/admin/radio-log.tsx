"use client";

import { useState } from "react";
import { act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { Icon, type IconName } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { personName } from "@/lib/admin/guard";
import { whenTT } from "@/lib/admin/tt";
import { fmtDate, fmtTime } from "@/lib/format";
import { LATE_AFTER, RADIO_KIND, STATE, clearLog, logSpot, minutesLate, removeSpot, saveSpot, scriptsFor, spotState, stationName, type Now, type ResultForm, type SpotState } from "@/lib/ops/radio";
import { useData, useSession } from "@/lib/store";
import type { RadioOutcome, RadioSpot, Seed } from "@/lib/types";

/* Logging one radio segment: the row that shows it, with one tap for each thing that can happen, and the small form
   behind "Had it" and "Not had". Shared by Today, the calendar's day view and the monthly schedules. */

export const STATE_ICON: Record<SpotState, IconName> = { done: "check", nocall: "phone", missed: "close", due: "clock", unlogged: "help" };
export const dayLabel = (day: string) => fmtDate(day, { weekday: true, year: false });

/** People who can be on air: everyone with live office access, and whoever is already named. */
export function officePeople(d: Seed, keep?: string) {
  const ids = new Set((d.grants || []).filter((g) => !g.revokedAt && ["marketing", "owner", "admin"].includes(g.role)).map((g) => g.userId));
  if (keep) ids.add(keep);
  return Array.from(ids).map((id) => ({ id, name: personName(d, id) })).sort((a, b) => a.name.localeCompare(b.name));
}

export function StateBadge({ st }: { st: SpotState }) {
  return (
    <Badge variant={STATE[st].tone}>
      <Icon name={STATE_ICON[st]} />
      {STATE[st].label}
    </Badge>
  );
}

/** What was logged, in one sentence: "On air at 4:07 pm, 2 min after the booked time. Isabel. Logged by Isabel, …". */
export function resultText(d: Seed, sp: RadioSpot) {
  const r = sp.result;
  if (!r) return "";
  const late = r.at ? minutesLate(sp.time, r.at) : 0;
  return [
    r.outcome === "done" && r.at ? "On air at " + fmtTime(r.at) + (sp.extra ? "" : late > LATE_AFTER ? ", " + late + " min late" : late < -LATE_AFTER ? ", " + -late + " min early" : ", on time") + "." : "",
    r.person ? personName(d, r.person) + " on air." : "",
    r.scriptId ? "Script: " + (d.radioScripts.find((x) => x.id === r.scriptId)?.title || "deleted") + "." : "",
    r.note || "",
  ]
    .filter(Boolean)
    .join(" ");
}

export type LogTarget = { spot: RadioSpot; outcome: RadioOutcome };

/** One segment with its buttons. `onOpen` opens the form; "Nobody called" is logged at once. */
export function SpotRow({ sp, now, onOpen, showDay }: { sp: RadioSpot; now: Now; onOpen: (t: LogTarget) => void; showDay?: boolean }) {
  const d = useData();
  const s = useSession();
  const st = spotState(sp, now);
  const future = sp.day > now.day;
  return (
    <li className={"radio-row is-" + st}>
      <span className="radio-time">
        {showDay ? <span>{dayLabel(sp.day)}</span> : null}
        <b>{fmtTime(sp.time)}</b>
      </span>
      <div className="grow">
        <p className="event-tags">
          <Badge variant={RADIO_KIND[sp.kind].tone}>{RADIO_KIND[sp.kind].label}</Badge>
          <StateBadge st={st} />
        </p>
        <strong>{sp.extra ? sp.title : stationName(d, sp.stationId)}</strong>
        <span className="meta">{sp.extra ? stationName(d, sp.stationId) + " · not on the sheet" : sp.wo ? "Work order " + sp.wo : "Added by hand"}</span>
        {sp.result ? (
          <span className="radio-said">
            {resultText(d, sp)}
            <em>{" Logged by " + personName(d, sp.result.by) + ", " + whenTT(sp.result.loggedAt) + "."}</em>
          </span>
        ) : null}
      </div>
      <div className="cluster radio-acts">
        {sp.result ? (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => onOpen({ spot: sp, outcome: sp.result!.outcome })}>
            Change
          </button>
        ) : future ? null : (
          <>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => onOpen({ spot: sp, outcome: "done" })}>
              <Icon name="check" />
              Had it
            </button>
            {st === "due" ? null : (
              <>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => act(s, "radio.log", stationName(d, sp.stationId), () => logSpot(s, sp.id, { outcome: "nocall" }), "Logged: nobody called.")}>
                  Nobody called
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => onOpen({ spot: sp, outcome: "missed" })}>
                  Not had
                </button>
              </>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** The form behind a row: what happened, when, who, which script, and a note. */
export function LogSheet({ target, now, onClose }: { target: LogTarget | null; now: Now; onClose: () => void }) {
  const d = useData();
  return (
    <SideSheet open={!!target} onClose={onClose} title={target ? (target.spot.extra ? target.spot.title || "Something extra" : stationName(d, target.spot.stationId)) : "Log it"} sub={target ? RADIO_KIND[target.spot.kind].label + " · " + dayLabel(target.spot.day) + " · booked for " + fmtTime(target.spot.time) : undefined}>
      {target ? <LogForm key={target.spot.id + target.outcome} target={target} now={now} onDone={onClose} /> : null}
    </SideSheet>
  );
}

function LogForm({ target, now, onDone }: { target: LogTarget; now: Now; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const sp = target.spot;
  const r = sp.result;
  const scripts = scriptsFor(d, sp.day, sp.stationId);
  // talking points for an interview, a hype pack for the office and weekend hype
  const fit = scripts.filter((x) => x.kind === (sp.kind === "interview" ? "points" : "hype"));
  const usual = fit.length === 1 ? fit[0].id : scripts.length === 1 ? scripts[0].id : undefined;
  // the booked time, or now when it is being logged within half an hour of it
  const soon = sp.day === now.day && minutesLate(sp.time, now.time) >= 0 && minutesLate(sp.time, now.time) <= 30;
  const [v, setV] = useState<ResultForm>(() => ({
    outcome: target.outcome,
    at: r?.at || (soon ? now.time : sp.time),
    person: r?.person || (sp.kind === "interview" ? s?.userId || undefined : undefined),
    scriptId: r?.scriptId || usual,
    note: r?.note,
  }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (act(s, "radio.log", stationName(d, sp.stationId), () => logSpot(s, sp.id, v), "Logged: " + STATE[v.outcome].label.toLowerCase() + (v.outcome === "done" && v.at ? " at " + fmtTime(v.at) : "") + ".")) onDone();
  }

  return (
    <form className="event-form" onSubmit={save}>
      <fieldset className="kind-pick">
        <legend>What happened</legend>
        {(["done", "nocall", "missed"] as RadioOutcome[]).map((o) => (
          <button key={o} type="button" aria-pressed={v.outcome === o} onClick={() => setV({ ...v, outcome: o })}>
            <Icon name={STATE_ICON[o]} />
            {STATE[o].label}
          </button>
        ))}
      </fieldset>
      {v.outcome === "done" ? (
        <>
          <div className="form-row">
            <div className="field">
              <label htmlFor="rl-at">Time it went on air</label>
              <input id="rl-at" type="time" required value={v.at || ""} onChange={(e) => setV({ ...v, at: e.target.value })} />
              {v.at && !sp.extra ? <p className="hint">{"Booked for " + fmtTime(sp.time) + (minutesLate(sp.time, v.at) > LATE_AFTER ? ": " + minutesLate(sp.time, v.at) + " min late." : ".")}</p> : null}
            </div>
            <div className="field">
              <label htmlFor="rl-who">Who was on air</label>
              <select id="rl-who" value={v.person || ""} onChange={(e) => setV({ ...v, person: e.target.value || undefined })}>
                <option value="">The host only</option>
                {officePeople(d, v.person).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="rl-script">Script or talking points used</label>
            <select id="rl-script" value={v.scriptId || ""} onChange={(e) => setV({ ...v, scriptId: e.target.value || undefined })}>
              <option value="">None</option>
              {scripts.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.title}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}
      <div className="field">
        <label htmlFor="rl-note">{v.outcome === "done" ? "Note, if any" : "What happened"}</label>
        <textarea
          id="rl-note"
          rows={3}
          maxLength={240}
          value={v.note || ""}
          onChange={(e) => setV({ ...v, note: e.target.value })}
          placeholder={v.outcome === "nocall" ? "Waited by the phone until 4:30" : v.outcome === "missed" ? "The host was off sick" : "The host asked about the hampers"}
        />
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
        {sp.extra ? (
          <button className="btn btn-danger" type="button" onClick={() => act(s, "radio.spot.remove", sp.title || "Something extra", () => removeSpot(s, sp.id), "Deleted.") && onDone()}>
            Delete this extra
          </button>
        ) : r ? (
          <button className="btn btn-danger" type="button" onClick={() => act(s, "radio.unlog", stationName(d, sp.stationId), () => clearLog(s, sp.id), "Back to not logged.") && onDone()}>
            Clear what was logged
          </button>
        ) : null}
      </div>
    </form>
  );
}

/** Something the station asked for that was not on its sheet, logged as had. */
export function ExtraSheet({ day, now, onClose }: { day: string | null; now: Now; onClose: () => void }) {
  return (
    <SideSheet open={!!day} onClose={onClose} title="Something extra" sub={day ? dayLabel(day) + " · not on the station's sheet" : undefined}>
      {day ? <ExtraForm key={day} day={day} now={now} onDone={onClose} /> : null}
    </SideSheet>
  );
}

function ExtraForm({ day, now, onDone }: { day: string; now: Now; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const [v, setV] = useState({ stationId: d.radioStations[0]?.id || "", title: "", time: day === now.day ? now.time : "12:00", person: s?.userId || "" });
  function save(e: React.FormEvent) {
    e.preventDefault();
    let id = "";
    const ok = act(s, "radio.spot.add", v.title || "Something extra", () => {
      id = saveSpot(s, null, { stationId: v.stationId, kind: "other", day, time: v.time, title: v.title });
      logSpot(s, id, { outcome: "done", at: v.time, person: v.person || undefined });
    }, "Logged.");
    if (ok) onDone();
  }
  return (
    <form className="event-form" onSubmit={save}>
      <div className="field">
        <label htmlFor="rx-title">What was it</label>
        <input id="rx-title" type="text" maxLength={80} required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="The producer called for a prize shout-out" />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="rx-st">Station</label>
          <select id="rx-st" value={v.stationId} onChange={(e) => setV({ ...v, stationId: e.target.value })}>
            {d.radioStations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rx-at">Time it went on air</label>
          <input id="rx-at" type="time" required value={v.time} onChange={(e) => setV({ ...v, time: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="rx-who">Who was on air</label>
        <select id="rx-who" value={v.person} onChange={(e) => setV({ ...v, person: e.target.value })}>
          <option value="">The host only</option>
          {officePeople(d, v.person).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit" disabled={!d.radioStations.length}>
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
