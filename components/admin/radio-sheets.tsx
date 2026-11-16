"use client";

import { useEffect, useRef, useState } from "react";
import { act } from "@/components/admin/bits";
import { LogSheet, STATE_ICON, type LogTarget } from "@/components/admin/radio-log";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { personName } from "@/lib/admin/guard";
import { dayTT } from "@/lib/admin/tt";
import { fmtTime } from "@/lib/format";
import {
  RADIO_KIND, STATE, WEEKDAYS, addMonths, daysIn, likelyStation, monthName, readSheet, removeSheet, saveSheet, sheetLines, sheetWarnings, sheetsIn, spotState, stationName, totals, weekday,
  type Now, type SheetLine,
} from "@/lib/ops/radio";
import { scanPicture } from "@/lib/ops/radio-scan";
import { useData, useSession } from "@/lib/store";
import type { RadioKind, RadioSheet, Seed } from "@/lib/types";

/* The monthly schedules: one per station per month, laid out the way the station's sheet is, with each date showing
   what happened. A schedule comes in one of two ways: scan a picture of the sheet (or paste its text), check what was
   read and save; or make it by hand, tapping the dates for each time. */

type Draft = { key: string; stationId: string; stationName: string; wo: string; lines: SheetLine[] };
const NEW = "new";
const SHEET_KINDS: RadioKind[] = ["interview", "office", "weekend"];

export function SchedulesView({ now, month, setMonth }: { now: Now; month: string; setMonth: (m: string) => void }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [log, setLog] = useState<LogTarget | null>(null);
  const [scan, setScan] = useState(false);
  const [edit, setEdit] = useState<{ sheet: RadioSheet | null } | null>(null);
  const sheets = sheetsIn(d, month);
  const lastMonth = sheetsIn(d, addMonths(month, -1)).filter((x) => !sheets.some((y) => y.stationId === x.stationId));

  return (
    <section className="panel" aria-labelledby="ra-sch-h">
      <div className="panel-head">
        <div className="cal-nav">
          <button className="cal-arrow" type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <Icon name="arrow" className="flip" />
          </button>
          <h2 id="ra-sch-h" className="cal-title">
            {monthName(month)}
          </h2>
          <button className="cal-arrow" type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <Icon name="arrow" />
          </button>
        </div>
        <div className="cluster">
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setScan(true)}>
            <Icon name="camera" />
            Scan a sheet
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEdit({ sheet: null })}>
            Make one by hand
          </button>
        </div>
      </div>
      <div className="panel-body">
        {lastMonth.length ? (
          <p className="radio-note">
            <Icon name="bell" />
            {"No " + monthName(month).split(" ")[0] + " schedule yet for " + lastMonth.map((x) => stationName(d, x.stationId)).join(", ") + ". Scan their sheet when it comes, or make it by hand."}
          </p>
        ) : null}
        {sheets.length ? (
          <div className="radio-sheets">
            {sheets.map((sh) => {
              const spots = (d.radioSpots || []).filter((x) => x.sheetId === sh.id);
              const t = totals(spots, now);
              const lines = sheetLines(d, sh.id);
              return (
                <article key={sh.id} className="radio-sheet">
                  <header>
                    <div className="grow">
                      <h3>{stationName(d, sh.stationId)}</h3>
                      <p className="meta">
                        {(sh.wo ? "Work order " + sh.wo + " · " : "") + (sh.source === "scan" ? "Scanned" : "Made by hand") + " by " + personName(d, sh.addedBy) + ", " + dayTT(sh.addedAt) + (sh.editedAt ? " · changed " + dayTT(sh.editedAt) : "")}
                      </p>
                      <p className="radio-counts">{t.booked + " booked · " + t.done + " had · " + (t.nocall + t.missed) + " missed · " + t.unlogged + " not logged · " + t.due + " to come"}</p>
                    </div>
                    <span className="cluster">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEdit({ sheet: sh })}>
                        Change
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={"Delete the " + monthName(month) + " schedule for " + stationName(d, sh.stationId)}
                        onClick={async () => {
                          if (await confirm({ title: "Delete this schedule?", body: stationName(d, sh.stationId) + ", " + monthName(month) + ". Dates already logged stay in the history; the rest come off the calendar.", okLabel: "Delete", danger: true }))
                            act(s, "radio.sheet.remove", stationName(d, sh.stationId), () => removeSheet(s, sh.id), "Schedule deleted.");
                        }}
                      >
                        <Icon name="close" />
                      </button>
                    </span>
                  </header>
                  {SHEET_KINDS.filter((k) => lines.some((l) => l.kind === k)).map((k) => (
                    <div key={k} className="radio-kind">
                      <h4>{RADIO_KIND[k].label}</h4>
                      {lines
                        .filter((l) => l.kind === k)
                        .map((l) => (
                          <div key={l.time} className="radio-line">
                            <b>{fmtTime(l.time)}</b>
                            <span className="radio-dates">
                              {l.days.map((n) => {
                                const sp = spots.find((x) => x.kind === k && x.time === l.time && Number(x.day.slice(8)) === n);
                                if (!sp) return null;
                                const st = spotState(sp, now);
                                return (
                                  <button key={n} type="button" className={"radio-date is-" + st} disabled={st === "due"} onClick={() => setLog({ spot: sp, outcome: sp.result?.outcome || "done" })} aria-label={WEEKDAYS[weekday(sp.day)] + " " + n + ": " + STATE[st].label}>
                                    <span>{WEEKDAYS[weekday(sp.day)]}</span>
                                    <b>{n}</b>
                                    <Icon name={STATE_ICON[st]} />
                                  </button>
                                );
                              })}
                            </span>
                          </div>
                        ))}
                    </div>
                  ))}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="radio-empty">
            <p>
              <strong>{"No schedules for " + monthName(month) + "."}</strong>
              Each station sends its times for the month. Scan the sheet, or make the schedule by hand if there is no sheet.
            </p>
          </div>
        )}
        <p className="hint">Tap a date to log it or change what was logged. Dates still to come are greyed out.</p>
      </div>
      <LogSheet target={log} now={now} onClose={() => setLog(null)} />
      <SideSheet open={scan} onClose={() => setScan(false)} title="Scan a station's sheet" sub="A photo, a screenshot, or the text of the e-mail">
        {scan ? <ScanFlow month={month} onDone={(m) => { setScan(false); if (m) setMonth(m); }} /> : null}
      </SideSheet>
      <SideSheet open={!!edit} onClose={() => setEdit(null)} title={edit?.sheet ? "Change the schedule" : "Make a schedule by hand"} sub={edit?.sheet ? stationName(d, edit.sheet.stationId) + ", " + monthName(edit.sheet.month) : "For when there is no sheet to scan"}>
        {edit ? <ManualFlow key={edit.sheet?.id || "new"} sheet={edit.sheet} month={month} onDone={() => setEdit(null)} /> : null}
      </SideSheet>
    </section>
  );
}

/* ---------- making or changing one by hand ---------- */

function draftOf(d: Seed, sheet: RadioSheet | null): Draft {
  if (!sheet) return { key: "new", stationId: d.radioStations[0]?.id || NEW, stationName: "", wo: "", lines: [] };
  return { key: sheet.id, stationId: sheet.stationId, stationName: stationName(d, sheet.stationId), wo: sheet.wo || "", lines: sheetLines(d, sheet.id) };
}

function ManualFlow({ sheet, month: shown, onDone }: { sheet: RadioSheet | null; month: string; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const [month, setMonth] = useState(sheet?.month || shown);
  const [draft, setDraft] = useState<Draft>(() => draftOf(d, sheet));

  function save() {
    let r = { added: 0, removed: 0, kept: 0, moved: 0 };
    const name = draft.stationId === NEW ? draft.stationName : stationName(d, draft.stationId);
    if (act(s, sheet ? "radio.sheet.edit" : "radio.sheet.add", name, () => (r = saveSheet(s, { month, stationId: draft.stationId === NEW ? null : draft.stationId, stationName: draft.stationName, wo: draft.wo, source: sheet?.source || "manual", lines: draft.lines })))) {
      toast("Saved. " + summary(r), "ok");
      onDone();
    }
  }

  return (
    <div className="event-form">
      {sheet ? null : <MonthPick value={month} onChange={setMonth} />}
      <DraftEditor month={month} draft={draft} onChange={setDraft} fixedStation={!!sheet} />
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="button" onClick={save}>
          {"Save the schedule (" + count(draft) + " dates)"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const count = (x: Draft) => x.lines.reduce((n, l) => n + l.days.length, 0);
function summary(r: { added: number; removed: number; kept: number; moved: number }) {
  const out = [r.added + (r.added === 1 ? " date added" : " dates added")];
  if (r.moved) out.push(r.moved + " moved to a new time");
  if (r.removed) out.push(r.removed + " taken off");
  if (r.kept) out.push(r.kept + " already logged, kept");
  return out.join(", ") + ".";
}

function MonthPick({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const opts = Array.from({ length: 10 }, (_, i) => addMonths(value, i - 4));
  return (
    <div className="field">
      <label htmlFor="rsh-month">Month</label>
      <select id="rsh-month" value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((m) => (
          <option key={m} value={m}>
            {monthName(m)}
          </option>
        ))}
      </select>
    </div>
  );
}

/** One station's month: the station, its work order, and each time with the dates it runs, picked on a little calendar. */
function DraftEditor({ month, draft, onChange, fixedStation }: { month: string; draft: Draft; onChange: (x: Draft) => void; fixedStation?: boolean }) {
  const d = useData();
  const lines = draft.lines;
  const set = (i: number, l: Partial<SheetLine>) => onChange({ ...draft, lines: lines.map((x, j) => (j === i ? { ...x, ...l } : x)) });
  const prev = draft.stationId !== NEW ? sheetsIn(d, addMonths(month, -1)).find((x) => x.stationId === draft.stationId) : undefined;
  const existing = !fixedStation && draft.stationId !== NEW ? sheetsIn(d, month).find((x) => x.stationId === draft.stationId) : undefined;
  const warnings = sheetWarnings(month, lines);

  return (
    <div className="radio-draft">
      <div className="form-row">
        <div className="field">
          <label htmlFor={"rd-st-" + draft.key}>Station</label>
          {fixedStation ? (
            <input id={"rd-st-" + draft.key} type="text" value={draft.stationName} readOnly />
          ) : (
            <select id={"rd-st-" + draft.key} value={draft.stationId} onChange={(e) => onChange({ ...draft, stationId: e.target.value })}>
              {d.radioStations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
              <option value={NEW}>{draft.stationName && draft.stationId === NEW ? "New: " + draft.stationName : "A new station…"}</option>
            </select>
          )}
        </div>
        <div className="field">
          <label htmlFor={"rd-wo-" + draft.key}>Work order number</label>
          <input id={"rd-wo-" + draft.key} type="text" inputMode="numeric" maxLength={12} value={draft.wo} onChange={(e) => onChange({ ...draft, wo: e.target.value.replace(/[^0-9A-Za-z-]/g, "") })} placeholder="79948" />
        </div>
      </div>
      {draft.stationId === NEW && !fixedStation ? (
        <div className="field">
          <label htmlFor={"rd-name-" + draft.key}>The new station’s name</label>
          <input id={"rd-name-" + draft.key} type="text" maxLength={60} value={draft.stationName} onChange={(e) => onChange({ ...draft, stationName: e.target.value })} placeholder="95 The Ultimate 1 FM" />
        </div>
      ) : null}
      {existing ? <p className="radio-note"><Icon name="bell" />{"This station already has a " + monthName(month) + " schedule. Saving replaces it; dates already logged are kept."}</p> : null}

      {lines.map((l, i) => (
        <fieldset key={i} className="radio-dline">
          <legend className="visually-hidden">{"Time " + (i + 1)}</legend>
          <div className="radio-dline-head">
            <select aria-label="Kind" value={l.kind} onChange={(e) => set(i, { kind: e.target.value as RadioKind })}>
              {SHEET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {RADIO_KIND[k].label}
                </option>
              ))}
            </select>
            <input type="time" aria-label="Time" value={l.time} onChange={(e) => set(i, { time: e.target.value })} />
            <span className="muted">{l.days.length + (l.days.length === 1 ? " date" : " dates")}</span>
            <button className="icon-btn" type="button" aria-label="Take this time off" onClick={() => onChange({ ...draft, lines: lines.filter((_, j) => j !== i) })}>
              <Icon name="close" />
            </button>
          </div>
          <MiniMonth month={month} kind={l.kind} days={l.days} onToggle={(n) => set(i, { days: l.days.includes(n) ? l.days.filter((x) => x !== n) : [...l.days, n].sort((a, b) => a - b) })} />
        </fieldset>
      ))}
      <div className="cluster">
        {SHEET_KINDS.map((k) => (
          <button key={k} className="btn btn-ghost btn-sm" type="button" onClick={() => onChange({ ...draft, lines: [...lines, { kind: k, time: k === "office" ? "14:35" : k === "weekend" ? "10:20" : "16:05", days: [] }] })}>
            {"+ " + RADIO_KIND[k].label}
          </button>
        ))}
        {prev && !lines.length ? (
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => onChange({ ...draft, wo: draft.wo, lines: sheetLines(d, prev.id).map((l) => ({ ...l, days: [] })) })}>
            {"Start from " + monthName(prev.month).split(" ")[0] + "’s times"}
          </button>
        ) : null}
      </div>
      {warnings.length ? (
        <ul className="radio-warn">
          {warnings.map((w) => (
            <li key={w}>
              <Icon name="help" />
              {w}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** A month's dates to tap on and off, Sunday first, weekends shaded. */
function MiniMonth({ month, kind, days, onToggle }: { month: string; kind: RadioKind; days: number[]; onToggle: (n: number) => void }) {
  const first = weekday(month + "-01");
  const n = daysIn(month);
  return (
    <div className="radio-mini" role="group" aria-label={RADIO_KIND[kind].label + " dates in " + monthName(month)}>
      {WEEKDAYS.map((w) => (
        <span key={w} className="radio-mini-w" aria-hidden="true">
          {w.slice(0, 2)}
        </span>
      ))}
      {Array.from({ length: first }, (_, i) => (
        <span key={"b" + i} />
      ))}
      {Array.from({ length: n }, (_, i) => i + 1).map((x) => {
        const wd = (first + x - 1) % 7;
        return (
          <button key={x} type="button" className={wd === 0 || wd === 6 ? "is-weekend" : ""} aria-pressed={days.includes(x)} aria-label={WEEKDAYS[wd] + " " + x} onClick={() => onToggle(x)}>
            {x}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- scanning ---------- */

function ScanFlow({ month, onDone }: { month: string; onDone: (month?: string) => void }) {
  const d = useData();
  const s = useSession();
  const [step, setStep] = useState<"pick" | "reading" | "check">("pick");
  const [progress, setProgress] = useState({ label: "", share: 0 });
  const [pic, setPic] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [paste, setPaste] = useState("");
  const [sheetMonth, setSheetMonth] = useState(month);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (pic) URL.revokeObjectURL(pic); }, [pic]);

  function read(t: string) {
    const sh = readSheet(t, month);
    setText(t);
    setSheetMonth(sh.month);
    setProblems(sh.problems);
    setDrafts(
      sh.stations.map((x, i) => {
        const match = likelyStation(d, x.name);
        return { key: "s" + i, stationId: match?.id || NEW, stationName: x.name, wo: x.wo, lines: x.lines };
      }),
    );
    setStep("check");
  }

  async function take(f: File | undefined) {
    if (!f || !f.type.startsWith("image/")) return toast("Choose a picture: a photo or a screenshot of the sheet.", "bad");
    setPic(URL.createObjectURL(f));
    setStep("reading");
    try {
      read(await scanPicture(f, (label, share) => setProgress({ label, share })));
    } catch {
      setStep("pick");
      toast("The picture could not be read here. Paste the text of the sheet instead, or make the schedule by hand.", "bad");
    }
  }

  function save() {
    let added = 0;
    const done = drafts.filter((x) => count(x)).every((x) =>
      act(s, "radio.sheet.add", x.stationName, () => {
        added += saveSheet(s, { month: sheetMonth, stationId: x.stationId === NEW ? null : x.stationId, stationName: x.stationName, wo: x.wo, source: pic ? "scan" : "manual", lines: x.lines }).added;
      }),
    );
    if (done) {
      toast(added ? "Saved. " + added + " dates added to the calendar for " + monthName(sheetMonth) + "." : "Saved. The calendar already had every date on this sheet.", "ok");
      onDone(sheetMonth);
    }
  }

  if (step === "pick")
    return (
      <div className="event-form">
        <ol className="radio-steps small">
          <li>Take a photo of the sheet, or choose the picture they sent.</li>
          <li>Check what was read against the picture, and fix anything by tapping the dates.</li>
          <li>Save. Every date goes on the calendar, ready to tick off.</li>
        </ol>
        <button className="radio-drop" type="button" onClick={() => file.current?.click()}>
          <Icon name="camera" />
          <strong>Take or choose a picture</strong>
          <span>The picture is read on this device and is not kept.</span>
        </button>
        <input ref={file} className="visually-hidden" type="file" accept="image/*" aria-label="Choose a picture of the sheet" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="field">
          <label htmlFor="rsc-paste">Or paste the text of the sheet</label>
          <textarea id="rsc-paste" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"WO#79948 – 95 The Ultimate 1 FM\nInterview:\n@ 4:05pm on 2nd, 5th, 10th\nOffice Hype: @ 2:35pm on 2nd, 5th, 10th"} />
        </div>
        <div className="cluster drawer-actions">
          <button className="btn btn-primary" type="button" disabled={!paste.trim()} onClick={() => read(paste)}>
            Read the text
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => onDone()}>
            Cancel
          </button>
        </div>
      </div>
    );

  if (step === "reading")
    return (
      <div className="event-form" aria-live="polite">
        {pic ? <img className="radio-pic" src={pic} alt="The sheet being read" /> : null}
        <p>
          <strong>{progress.label || "Reading the sheet"}</strong>
        </p>
        <div className="radio-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.share * 100)}>
          <span style={{ width: Math.round(progress.share * 100) + "%" }} />
        </div>
        <p className="hint">The first time takes a little longer: the reader is fetched once, then kept.</p>
      </div>
    );

  const total = drafts.reduce((n, x) => n + count(x), 0);
  return (
    <div className="event-form">
      <p className="radio-note">
        <Icon name="help" />
        Check each station against the picture. Tap a date to add or take it off, and change any time that was misread.
      </p>
      {pic ? (
        <details className="radio-picbox" open>
          <summary>The picture</summary>
          <img className="radio-pic" src={pic} alt="The station's sheet" />
        </details>
      ) : null}
      <MonthPick value={sheetMonth} onChange={setSheetMonth} />
      {problems.length ? (
        <ul className="radio-warn">
          {problems.map((p) => (
            <li key={p}>
              <Icon name="help" />
              {p}
            </li>
          ))}
        </ul>
      ) : null}
      {drafts.map((x, i) => (
        <section key={x.key} className="radio-draft-card" aria-label={x.stationName || "Station " + (i + 1)}>
          <h3>{(x.stationId === NEW ? x.stationName || "A station" : stationName(d, x.stationId)) + " · " + count(x) + " dates"}</h3>
          <DraftEditor month={sheetMonth} draft={x} onChange={(nx) => setDrafts(drafts.map((y) => (y.key === x.key ? nx : y)))} />
          <button className="link-btn small" type="button" onClick={() => setDrafts(drafts.filter((y) => y.key !== x.key))}>
            Leave this station out
          </button>
        </section>
      ))}
      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDrafts([...drafts, { key: "s" + Date.now(), stationId: d.radioStations[0]?.id || NEW, stationName: "", wo: "", lines: [] }])}>
        + Add a station the reader missed
      </button>
      <details className="radio-picbox">
        <summary>What the reader saw</summary>
        <textarea aria-label="What the reader saw" rows={10} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => read(text)}>
          Read this text again
        </button>
      </details>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="button" disabled={!total} onClick={save}>
          {"Save " + drafts.filter((x) => count(x)).length + " schedules (" + total + " dates)"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setStep("pick")}>
          Start again
        </button>
      </div>
    </div>
  );
}
