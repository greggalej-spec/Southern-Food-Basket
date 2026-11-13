"use client";

import { useState } from "react";
import { Seg, act } from "@/components/admin/bits";
import { PLATFORM_COLOR } from "@/components/admin/chart";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Flow, Working } from "@/components/viz";
import { can } from "@/lib/access";
import { personName } from "@/lib/admin/guard";
import { plural, todayIso } from "@/lib/admin/helpers";
import { dayTT } from "@/lib/admin/tt";
import { fmtDate } from "@/lib/format";
import { PLATFORM, removePlanItem, savePlanItem, setConnected, type PlanForm } from "@/lib/ops/social";
import { useData, useSession } from "@/lib/store";
import type { PlanItem, Platform, SocialAccount } from "@/lib/types";

/* Social accounts: which accounts feed the figures, and the connection step for each. In the prototype nothing
   leaves the browser, so "connect" walks through what the real step is and then switches the account on with the
   demo figures. The real connection is read-only: the system can count, never post. */

export function SocialPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const canConnect = can(d, s, "social.connect");
  const [connecting, setConnecting] = useState<SocialAccount | null>(null);
  const [working, setWorking] = useState(false);

  async function disconnect(a: SocialAccount) {
    if (await confirm({ title: "Disconnect " + a.name + "?", body: "Its figures stop updating and leave the Marketing figures page. Nothing on the account itself changes.", okLabel: "Disconnect", danger: true }))
      act(s, "social.disconnect", a.name, () => setConnected(s, a.id, false), a.name + " disconnected.");
  }

  return (
    <div className="section-stack">
      <Flow id="social" />
      <div className="account-grid" data-tour="social-accounts">
        {(d.socialAccounts || []).map((a) => (
          <section className="panel account" key={a.id} aria-labelledby={"acc-" + a.id}>
            <div className="panel-head">
              <h2 id={"acc-" + a.id}>
                <span className="chart-key" style={{ background: PLATFORM_COLOR[a.id] }} />
                {a.name}
              </h2>
              {a.connected ? <Badge variant="ok">Connected</Badge> : <Badge variant="warn">Not connected</Badge>}
            </div>
            <div className="panel-body">
              <p className="account-handle">
                {a.url.startsWith("/") ? a.handle : (
                  <a href={a.url} target="_blank" rel="noreferrer">
                    {a.handle}
                  </a>
                )}
              </p>
              <dl className="kv">
                <dt>What it gives</dt>
                <dd>{a.gives}</dd>
                <dt>To connect</dt>
                <dd>{a.needs}</dd>
                {a.connected && a.connectedAt ? (
                  <>
                    <dt>Connected</dt>
                    <dd>{dayTT(a.connectedAt) + " by " + personName(d, a.connectedBy)}</dd>
                  </>
                ) : null}
              </dl>
              {canConnect && a.id !== "website" ? (
                a.connected ? (
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => disconnect(a)}>
                    Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => setConnecting(a)} data-tour={"connect-" + a.id}>
                    {"Connect " + a.name}
                  </button>
                )
              ) : null}
            </div>
          </section>
        ))}
      </div>
      <SideSheet open={!!connecting} onClose={() => setConnecting(null)} title={connecting ? "Connect " + connecting.name : "Connect"} sub="A walk through the real step.">
        {connecting ? (
          <div className="connect-steps">
            <ol>
              <li>
                <strong>{"Sign in on " + connecting.name + "."}</strong> In the real system this button opens {connecting.name}’s own sign-in page in a new window. The store’s password is typed there, never here.
              </li>
              <li>
                <strong>Approve read-only access.</strong> {connecting.name} lists exactly what is being asked for: the account’s figures, and nothing else.
              </li>
              <li>
                <strong>Come back here.</strong> The account shows as connected and its figures arrive overnight.
              </li>
            </ol>
            <div className="alert alert-info" role="note">
              <p>
                <strong>Prototype.</strong> No account is contacted. The button below stands in for a successful sign-in and switches on the demo figures for {connecting.name}.
              </p>
            </div>
            {working ? (
              <Working
                steps={["Opening " + connecting.name + "’s sign-in page", "Approving read-only access", "Fetching the last twelve weeks of figures"]}
                stepMs={700}
                onDone={() => {
                  setWorking(false);
                  if (act(s, "social.connect", connecting.name, () => setConnected(s, connecting.id, true), connecting.name + " connected. Its figures are on the Marketing figures page.")) setConnecting(null);
                }}
              />
            ) : (
              <button className="btn btn-primary" type="button" data-tour="connect-confirm" onClick={() => setWorking(true)}>
                Simulate a successful connection
              </button>
            )}
          </div>
        ) : null}
      </SideSheet>
    </div>
  );
}

/* ---------- content calendar ---------- */

const KINDS: PlanItem["kind"][] = ["Video", "Photo", "Carousel", "E-mail", "Website"];
const STATUS: Record<PlanItem["status"], { label: string; variant: "neutral" | "info" | "ok" }> = { idea: { label: "Idea", variant: "neutral" }, planned: { label: "Planned", variant: "info" }, posted: { label: "Posted", variant: "ok" } };
const ALL: Platform[] = ["instagram", "tiktok", "facebook", "website"];

export function PlanPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [show, setShow] = useState<"ahead" | "past">("ahead");
  const [form, setForm] = useState<{ item: PlanItem | null; seq: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [today] = useState(() => todayIso());
  const items = (d.plan || []).filter((p) => (show === "ahead" ? p.date >= today || p.status !== "posted" : p.date < today && p.status === "posted"));
  const sorted = items.slice().sort((a, b) => (show === "ahead" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  const days = Array.from(new Set(sorted.map((p) => p.date)));

  function edit(item: PlanItem | null) {
    setForm({ item, seq: (form?.seq ?? 0) + 1 });
    setOpen(true);
  }
  async function remove(p: PlanItem) {
    if (await confirm({ title: "Remove this from the calendar?", body: p.title, okLabel: "Remove", danger: true })) act(s, "plan.remove", p.title, () => removePlanItem(s, p.id), "Removed.");
  }

  return (
    <div className="section-stack">
      <Flow id="plan" />
      <div className="toolbar">
        <Seg label="Show" value={show} onChange={setShow} options={[{ id: "ahead", label: "Coming up" }, { id: "past", label: "Already out" }]} />
        <span className="grow" />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => edit(null)}>
          Add to the calendar
        </button>
      </div>
      <section className="panel" aria-label="Calendar">
        {days.length ? (
          <ol className="agenda" data-tour="plan-agenda">
            {days.map((day) => (
              <li key={day} className={day === today ? "is-today" : undefined}>
                <h3>
                  {fmtDate(day, { weekday: true, year: false })}
                  {day === today ? <span className="agenda-today"> · today</span> : null}
                </h3>
                <ul>
                  {sorted
                    .filter((p) => p.date === day)
                    .map((p) => (
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
                          <button className="link-btn small" type="button" onClick={() => edit(p)}>
                            Edit<span className="visually-hidden">{" " + p.title}</span>
                          </button>
                          <button className="link-btn small danger" type="button" onClick={() => remove(p)}>
                            Remove<span className="visually-hidden">{" " + p.title}</span>
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          <p className="panel-empty">{show === "ahead" ? "Nothing planned. Add the next post, e-mail or website change." : "Nothing has gone out yet."}</p>
        )}
      </section>
      <p className="small muted">{plural((d.plan || []).filter((p) => p.status === "idea").length, "idea") + " still to be planned."}</p>
      <SideSheet open={open} onClose={() => setOpen(false)} title={form?.item ? "Change the calendar entry" : "Add to the calendar"}>
        {form && open ? <PlanFormView key={form.seq} item={form.item} onDone={() => setOpen(false)} /> : null}
      </SideSheet>
    </div>
  );
}

function PlanFormView({ item, onDone }: { item: PlanItem | null; onDone: () => void }) {
  const s = useSession();
  const [v, setV] = useState<PlanForm>(item ? { date: item.date, platforms: item.platforms, title: item.title, kind: item.kind, status: item.status, note: item.note } : { date: todayIso(), platforms: ["instagram"], title: "", kind: "Video", status: "idea", note: "" });
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
      <button className="btn btn-primary" type="submit">
        Save
      </button>
    </form>
  );
}
