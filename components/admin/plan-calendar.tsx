"use client";

import { useState } from "react";
import { Seg, act } from "@/components/admin/bits";
import { PLATFORM_COLOR } from "@/components/admin/chart";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Flow } from "@/components/viz";
import { plural, todayIso } from "@/lib/admin/helpers";
import { fmtDate } from "@/lib/format";
import { PLATFORM, removePlanItem, savePlanItem, type PlanForm } from "@/lib/ops/social";
import { useData, useSession } from "@/lib/store";
import type { PlanItem, Platform } from "@/lib/types";

/* The content calendar, as a calendar (Gregg, 13 Nov 2026). A month grid: step month by month, jump to any year,
   click a day to see what is on it and to add, change or remove an entry. The Year view is the history: all twelve
   months of a year at once, each showing which days had something on them, so 2026 or 2027 can be looked back over
   and any month opened. Nothing is ever dropped from the calendar: an entry that has gone out stays on its day. */

const KINDS: PlanItem["kind"][] = ["Video", "Photo", "Carousel", "E-mail", "Website"];
const STATUS: Record<PlanItem["status"], { label: string; variant: "neutral" | "info" | "ok" }> = { idea: { label: "Idea", variant: "neutral" }, planned: { label: "Planned", variant: "info" }, posted: { label: "Posted", variant: "ok" } };
const ALL: Platform[] = ["instagram", "tiktok", "facebook", "website"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => y + "-" + pad(m + 1) + "-" + pad(d);

/** The six weeks a month's grid shows, Sunday first, with the days that spill in from the months either side. */
function monthCells(y: number, m: number) {
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
  return Array.from({ length: 42 }, (_, i) => {
    const dt = new Date(Date.UTC(y, m, 1 - first + i));
    return { iso: iso(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()), day: dt.getUTCDate(), inMonth: dt.getUTCMonth() === m };
  });
}

export function PlanPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [today] = useState(() => todayIso());
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [view, setView] = useState<"month" | "year">("month");
  const [day, setDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ item: PlanItem | null; seq: number } | null>(null);

  const plan = d.plan || [];
  const byDay = new Map<string, PlanItem[]>();
  plan.forEach((p) => byDay.set(p.date, [...(byDay.get(p.date) || []), p]));
  const inMonth = (y: number, m: number) => plan.filter((p) => p.date.startsWith(y + "-" + pad(m + 1)));
  const years = (() => {
    const ys = plan.map((p) => Number(p.date.slice(0, 4)));
    const lo = Math.min(ym.y, Number(today.slice(0, 4)) - 1, ...ys), hi = Math.max(ym.y, Number(today.slice(0, 4)) + 1, ...ys);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  })();
  const scope = view === "month" ? inMonth(ym.y, ym.m) : plan.filter((p) => p.date.startsWith(String(ym.y)));
  const count = (st: PlanItem["status"]) => scope.filter((p) => p.status === st).length;

  const step = (n: number) => setYm(({ y, m }) => (view === "year" ? { y: y + n, m } : { y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  const openDay = (dayIso: string) => { setDay(dayIso); setEditing(null); };
  const addOn = (dayIso: string) => { setDay(dayIso); setEditing({ item: null, seq: (editing?.seq ?? 0) + 1 }); };
  async function remove(p: PlanItem) {
    if (await confirm({ title: "Remove this from the calendar?", body: p.title, okLabel: "Remove", danger: true })) act(s, "plan.remove", p.title, () => removePlanItem(s, p.id), "Removed.");
  }

  const dayItems = day ? byDay.get(day) || [] : [];
  const label = view === "month" ? MONTHS[ym.m] + " " + ym.y : String(ym.y);

  return (
    <div className="section-stack">
      <Flow id="plan" />
      <div className="cal-bar">
        <div className="cal-nav">
          <button className="cal-arrow" type="button" aria-label={view === "month" ? "Previous month" : "Previous year"} onClick={() => step(-1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <h2 className="cal-title" aria-live="polite">{label}</h2>
          <button className="cal-arrow" type="button" aria-label={view === "month" ? "Next month" : "Next year"} onClick={() => step(1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="btn btn-outline btn-sm" type="button" onClick={() => setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })}>
            Today
          </button>
        </div>
        <label className="cal-jump">
          <span>Year</span>
          <select value={ym.y} onChange={(e) => setYm({ ...ym, y: Number(e.target.value) })}>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        {view === "month" ? (
          <label className="cal-jump">
            <span>Month</span>
            <select value={ym.m} onChange={(e) => setYm({ ...ym, m: Number(e.target.value) })}>
              {MONTHS.map((name, i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <span className="grow" />
        <Seg label="View" value={view} onChange={setView} options={[{ id: "month", label: "Month" }, { id: "year", label: "Year" }]} />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => addOn(view === "month" && !today.startsWith(ym.y + "-" + pad(ym.m + 1)) ? iso(ym.y, ym.m, 1) : today)}>
          Add to the calendar
        </button>
      </div>

      <ul className="cal-sum" aria-label={"In " + label}>
        <li><b>{scope.length}</b> {scope.length === 1 ? "entry" : "entries"}</li>
        <li className="is-posted"><b>{count("posted")}</b> posted</li>
        <li className="is-planned"><b>{count("planned")}</b> planned</li>
        <li className="is-idea"><b>{count("idea")}</b> {count("idea") === 1 ? "idea" : "ideas"}</li>
      </ul>

      {view === "month" ? (
        <section className="panel cal-panel" aria-label={"Calendar for " + label}>
          <div className="cal-week" aria-hidden="true">
            {WEEK.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="cal-grid" data-tour="plan-agenda">
            {monthCells(ym.y, ym.m).map((c) => {
              const items = byDay.get(c.iso) || [];
              return (
                <button key={c.iso} type="button" className={"cal-day" + (c.inMonth ? "" : " is-out") + (c.iso === today ? " is-today" : "") + (items.length ? " has-items" : "")} onClick={() => (items.length ? openDay(c.iso) : addOn(c.iso))} aria-label={fmtDate(c.iso, { weekday: true }) + ", " + (items.length ? plural(items.length, "entry", "entries") : "nothing planned, add an entry")}>
                  <span className="cal-num">{c.day}</span>
                  <span className="cal-items">
                    {items.slice(0, 3).map((p) => (
                      <span key={p.id} className={"cal-chip is-" + p.status}>
                        <i style={{ background: PLATFORM_COLOR[p.platforms[0]] }} />
                        <span>{p.title}</span>
                      </span>
                    ))}
                    {items.length > 3 ? <span className="cal-more">{"+" + (items.length - 3) + " more"}</span> : null}
                  </span>
                  {items.length ? <span className="cal-count" aria-hidden="true">{items.length}</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="cal-year" aria-label={"Every month of " + ym.y}>
          {MONTHS.map((name, m) => {
            const items = inMonth(ym.y, m);
            return (
              <button key={name} type="button" className={"cal-month" + (today.startsWith(ym.y + "-" + pad(m + 1)) ? " is-now" : "")} onClick={() => { setYm({ y: ym.y, m }); setView("month"); }} aria-label={name + " " + ym.y + ", " + plural(items.length, "entry", "entries") + ". Open the month."}>
                <span className="cal-month-head">
                  <b>{name}</b>
                  <em>{items.length}</em>
                </span>
                <span className="cal-mini" aria-hidden="true">
                  {monthCells(ym.y, m).map((c) => {
                    const its = c.inMonth ? byDay.get(c.iso) || [] : [];
                    const st = its.some((p) => p.status === "planned") ? "planned" : its.some((p) => p.status === "idea") ? "idea" : its.length ? "posted" : "";
                    return <i key={c.iso} className={(c.inMonth ? "" : "is-out") + (st ? " is-" + st : "")} />;
                  })}
                </span>
                <span className="cal-month-foot">
                  {items.length ? items.filter((p) => p.status === "posted").length + " posted · " + items.filter((p) => p.status !== "posted").length + " to go" : "Nothing yet"}
                </span>
              </button>
            );
          })}
        </section>
      )}

      <p className="cal-key small">
        <span className="cal-chip is-posted"><span>Posted</span></span>
        <span className="cal-chip is-planned"><span>Planned</span></span>
        <span className="cal-chip is-idea"><span>Idea</span></span>
        <span className="muted">Click a day to see it or add to it. The Year view shows every month of any year.</span>
      </p>

      <SideSheet open={!!day} onClose={() => setDay(null)} title={day ? fmtDate(day, { weekday: true }) : "Day"} sub={editing ? (editing.item ? "Change the entry" : "Add to this day") : dayItems.length ? plural(dayItems.length, "entry", "entries") : "Nothing planned"}>
        {day && editing ? (
          <PlanFormView key={editing.seq} item={editing.item} date={day} onDone={() => setEditing(null)} onCancel={() => (dayItems.length ? setEditing(null) : setDay(null))} />
        ) : day ? (
          <div className="cal-daylist">
            {dayItems.length ? (
              <ul>
                {dayItems.map((p) => (
                  <li key={p.id}>
                    <div className="grow">
                      <strong>{p.title}</strong>
                      <span className="meta">
                        {p.kind + " · "}
                        {p.platforms.map((pl) => (
                          <span key={pl} className="agenda-plat">
                            <span className="chart-key" style={{ background: PLATFORM_COLOR[pl] }} />
                            {PLATFORM[pl].name}
                          </span>
                        ))}
                      </span>
                      {p.note ? <span className="meta">{p.note}</span> : null}
                    </div>
                    <Badge variant={STATUS[p.status].variant}>{STATUS[p.status].label}</Badge>
                    <div className="row-actions">
                      <button className="link-btn small" type="button" onClick={() => setEditing({ item: p, seq: (editing?.seq ?? 0) + 1 })}>
                        Edit<span className="visually-hidden">{" " + p.title}</span>
                      </button>
                      <button className="link-btn small danger" type="button" onClick={() => remove(p)}>
                        Remove<span className="visually-hidden">{" " + p.title}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-empty">Nothing on this day yet.</p>
            )}
            <button className="btn btn-primary" type="button" onClick={() => setEditing({ item: null, seq: (editing?.seq ?? 0) + 1 })}>
              Add to this day
            </button>
          </div>
        ) : null}
      </SideSheet>
    </div>
  );
}

function PlanFormView({ item, date, onDone, onCancel }: { item: PlanItem | null; date: string; onDone: () => void; onCancel: () => void }) {
  const s = useSession();
  const [v, setV] = useState<PlanForm>(item ? { date: item.date, platforms: item.platforms, title: item.title, kind: item.kind, status: item.status, note: item.note } : { date, platforms: ["instagram"], title: "", kind: "Video", status: date < todayIso() ? "posted" : "planned", note: "" });
  const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.title.trim()) return setErr("Say what is going out, for example “Monday specials carousel”.");
    if (!v.platforms.length) return setErr("Choose at least one place it is going.");
    if (act(s, "plan.save", v.title, () => savePlanItem(s, item?.id || null, { ...v, title: v.title.trim(), note: v.note?.trim() || undefined }), "Saved.")) onDone();
  }
  return (
    <form onSubmit={submit} noValidate>
      {err ? (
        <div className="alert alert-bad" role="alert">
          <p>{err}</p>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="pf-title">What is going out</label>
        <input id="pf-title" type="text" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} autoComplete="off" />
      </div>
      <div className="form-row cols-2">
        <div className="field">
          <label htmlFor="pf-date">Day</label>
          <input id="pf-date" type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pf-kind">Kind</label>
          <select id="pf-kind" value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value as PlanItem["kind"] })}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>
      <fieldset className="check-group">
        <legend>Where</legend>
        {ALL.map((p) => (
          <label className="check" key={p}>
            <input type="checkbox" checked={v.platforms.includes(p)} onChange={(e) => setV({ ...v, platforms: e.target.checked ? [...v.platforms, p] : v.platforms.filter((x) => x !== p) })} />
            <span>{PLATFORM[p].name}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="pf-status">Where it stands</label>
        <select id="pf-status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as PlanItem["status"] })}>
          <option value="idea">Idea</option>
          <option value="planned">Planned</option>
          <option value="posted">Posted</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="pf-note">Note</label>
        <textarea id="pf-note" rows={2} value={v.note || ""} onChange={(e) => setV({ ...v, note: e.target.value })} />
      </div>
      <div className="cluster drawer-actions">
        <button className="btn btn-primary" type="submit">
          Save
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
