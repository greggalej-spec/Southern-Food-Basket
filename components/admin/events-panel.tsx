"use client";

import { useRef, useState } from "react";
import { Seg, Stat, act } from "@/components/admin/bits";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Flow, Working } from "@/components/viz";
import { personName } from "@/lib/admin/guard";
import { fmtDate } from "@/lib/format";
import { EVENT_KIND, EVENT_KINDS, STATE_LABEL, addFlyers, eventState, eventsByState, removeEvent, removeFlyer, saveEvent, setFlyer, shrinkImage, titleFromFile, type EventForm, type EventState } from "@/lib/ops/events";
import { useData, useSession } from "@/lib/store";
import type { EventKind, StoreEvent } from "@/lib/types";

/* Events and flyers: what the public site shows as "What's on", and the designer's flyers that lead the Specials
   page. Flyers come in several at a time (drop the files); events are short cards with a date, one sentence and up to
   three points. Everything here shows on the public pages at once: there is no separate publish step. */

const TONE = { now: "ok", soon: "warn", past: "neutral" } as const;
const KIND_TONE: Record<EventKind, "clay" | "ok" | "info" | "warn"> = { promotion: "clay", event: "ok", community: "info", notice: "warn" };
const MAX_FLYERS = 12;

export function EventsPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [today] = useState(() => new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10));
  const [show, setShow] = useState<EventState | "all">("now");
  const [edit, setEdit] = useState<StoreEvent | "new" | null>(null);
  const [busy, setBusy] = useState<{ names: string[]; items: { title: string; img: string }[] } | null>(null);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const g = eventsByState(d, today);
  const flyers = d.flyers || [];
  const list = show === "all" ? [...g.now, ...g.soon, ...g.past] : g[show];

  async function take(files: FileList | File[] | null) {
    const pics = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    if (!pics.length) return toast("Choose pictures: JPG, PNG or WebP.", "bad");
    const room = MAX_FLYERS - flyers.length;
    if (room <= 0) return toast("This prototype keeps " + MAX_FLYERS + " flyers. Delete one first.", "bad");
    try {
      const items = await Promise.all(pics.slice(0, room).map(async (f) => ({ title: titleFromFile(f.name), img: await shrinkImage(f) })));
      setBusy({ names: pics.slice(0, room).map((f) => f.name), items });
    } catch {
      toast("One of those pictures could not be read.", "bad");
    }
  }

  return (
    <div className="section-stack">
      <Flow id="events" counts={[flyers.filter((f) => f.featured).length, null, g.now.length, g.soon.length]} />
      <div className="stats">
        <Stat icon="calendar" tone="ok" label="On now" value={g.now.length} sub="Showing on the Events page" />
        <Stat icon="clock" label="Coming up" value={g.soon.length} sub={g.soon[0] ? "Next: " + g.soon[0].title : "Nothing planned"} />
        <Stat icon="camera" tone="pink" label="Flyers featured" value={flyers.filter((f) => f.featured).length} ring={{ value: flyers.filter((f) => f.featured).length, of: Math.max(flyers.length, 1) }} sub={flyers.length + " in the library"} />
        <Stat icon="check" label="Ended" value={g.past.length} sub="Kept for the record" />
      </div>

      <section className="panel" aria-labelledby="fl-h">
        <div className="panel-head">
          <h2 id="fl-h">Flyers from the designer</h2>
          <a className="link-btn small" href="/specials" target="_blank" rel="noopener">
            See them on the Specials page
          </a>
        </div>
        <div className="panel-body">
          <div
            className={"dropzone" + (over ? " is-over" : "")}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
          >
            <span className="dropzone-icon" aria-hidden="true">
              <Icon name="upload" />
            </span>
            <p>
              <strong>Drop this week’s flyers here</strong>
              <span>Several at once. JPG, PNG or WebP.</span>
            </p>
            <button className="btn btn-primary" type="button" onClick={() => file.current?.click()}>
              Choose pictures
            </button>
            <input ref={file} className="visually-hidden" type="file" accept="image/*" multiple aria-label="Choose flyer pictures" onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
          </div>
          {busy ? (
            <Working
              steps={["Reading " + (busy.names.length === 1 ? busy.names[0] : busy.names.length + " pictures"), "Making them light enough for phones", "Adding them to the Specials page"]}
              onDone={() => {
                const b = busy;
                setBusy(null);
                act(s, "flyers.add", b.items.length + " flyers", () => addFlyers(s, b.items), b.items.length === 1 ? "Flyer added and featured." : b.items.length + " flyers added and featured.");
              }}
            />
          ) : null}
          {flyers.length ? (
            <ul className="flyer-grid">
              {flyers.map((f) => (
                <li key={f.id} className={f.featured ? "is-on" : ""}>
                  <img src={f.img} alt="" loading="lazy" decoding="async" />
                  <div className="flyer-meta">
                    <strong>{f.title}</strong>
                    <span>{personName(d, f.addedBy) + " · " + fmtDate(f.addedAt.slice(0, 10), { year: false })}</span>
                  </div>
                  <div className="flyer-acts">
                    <button type="button" className={"switch" + (f.featured ? " is-on" : "")} role="switch" aria-checked={f.featured} aria-label={"Feature " + f.title + " on the Specials page"} onClick={() => act(s, "flyers.edit", f.title, () => setFlyer(s, f.id, { featured: !f.featured }))}>
                      <i />
                      <span>{f.featured ? "Featured" : "Hidden"}</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={"Delete " + f.title}
                      onClick={async () => {
                        if (await confirm({ title: "Delete this flyer?", body: f.title + " comes off the Specials page and out of the library.", okLabel: "Delete", danger: true })) act(s, "flyers.remove", f.title, () => removeFlyer(s, f.id), "Flyer deleted.");
                      }}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No flyers yet. Drop the first ones above.</p>
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="ev-h">
        <div className="panel-head">
          <h2 id="ev-h">Events and promotions</h2>
          <div className="cluster">
            <Seg label="Show" value={show} onChange={setShow} options={[{ id: "now", label: "On now", count: g.now.length }, { id: "soon", label: "Coming up", count: g.soon.length }, { id: "past", label: "Ended" }, { id: "all", label: "All" }]} />
            <button className="btn btn-primary btn-sm" type="button" onClick={() => setEdit("new")}>
              Add an event
            </button>
          </div>
        </div>
        <div className="panel-body">
          {list.length ? (
            <ul className="event-cards">
              {list.map((e) => {
                const st = eventState(e, today);
                return (
                  <li key={e.id} className={"kind-" + e.kind}>
                    <span className="event-date" aria-hidden="true">
                      <b>{Number(e.from.slice(8, 10))}</b>
                      {fmtDate(e.from, { year: false }).replace(/^\d+\s*/, "")}
                    </span>
                    <div className="grow">
                      <p className="event-tags">
                        <Badge variant={KIND_TONE[e.kind]}>{EVENT_KIND[e.kind].label}</Badge>
                        <Badge variant={TONE[st]}>{STATE_LABEL[st]}</Badge>
                      </p>
                      <strong>{e.title}</strong>
                      <span className="meta">{(e.ongoing ? "Since " + fmtDate(e.from, { year: false }) : e.from === e.to ? fmtDate(e.from, { year: false }) : fmtDate(e.from, { year: false }) + " to " + fmtDate(e.to, { year: false })) + " · " + (e.branchIds ? e.branchIds.map((id) => d.branches.find((b) => b.id === id)?.name || id).join(", ") : "All five stores")}</span>
                    </div>
                    <div className="cluster">
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => setEdit(e)}>
                        Edit
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label={"Remove " + e.title}
                        onClick={async () => {
                          if (await confirm({ title: "Remove this event?", body: e.title + " comes off the Events page.", okLabel: "Remove", danger: true })) act(s, "events.remove", e.title, () => removeEvent(s, e.id), "Removed.");
                        }}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">Nothing in this list.</p>
          )}
        </div>
      </section>

      <SideSheet open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Add an event" : edit ? edit.title : "Event"} sub="Shows on the public Events page from its first day to its last">
        {edit ? <EventEditor key={edit === "new" ? "new" : edit.id} event={edit === "new" ? null : edit} today={today} onDone={() => setEdit(null)} /> : null}
      </SideSheet>
    </div>
  );
}

function EventEditor({ event, today, onDone }: { event: StoreEvent | null; today: string; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const [v, setV] = useState<EventForm>(() => (event ? { ...event } : { kind: "promotion", title: "", from: today, to: today, branchIds: null, summary: "", points: [], featured: false }));
  const points = [0, 1, 2].map((i) => v.points?.[i] || "");
  const all = !v.branchIds;

  function save(e: React.FormEvent) {
    e.preventDefault();
    const form: EventForm = { ...v, title: v.title.trim(), summary: v.summary.trim(), points: (v.points || []).map((p) => p.trim()).filter(Boolean), time: v.time?.trim() || undefined, href: v.href?.trim() || undefined, cta: v.cta?.trim() || undefined };
    if (act(s, event ? "events.edit" : "events.add", form.title || "Event", () => saveEvent(s, event?.id || null, form), "Saved. It is on the Events page.")) onDone();
  }

  return (
    <form className="event-form" onSubmit={save}>
      <fieldset className="kind-pick">
        <legend>What is it</legend>
        {EVENT_KINDS.map((k) => (
          <button key={k} type="button" className={"kind-" + k} aria-pressed={v.kind === k} onClick={() => setV({ ...v, kind: k })}>
            <Icon name={EVENT_KIND[k].icon} />
            {EVENT_KIND[k].label}
          </button>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="ev-title-in">Name</label>
        <input id="ev-title-in" type="text" value={v.title} maxLength={60} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Christmas shop: TT$30 off TT$300" />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="ev-from">First day</label>
          <input id="ev-from" type="date" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value, to: e.target.value > v.to ? e.target.value : v.to })} />
        </div>
        <div className="field">
          <label htmlFor="ev-to">Last day</label>
          <input id="ev-to" type="date" value={v.to} min={v.from} onChange={(e) => setV({ ...v, to: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="ev-time">Time, if it matters</label>
        <input id="ev-time" type="text" value={v.time || ""} onChange={(e) => setV({ ...v, time: e.target.value })} placeholder="8:00 am to 11:00 am" />
      </div>
      <fieldset className="store-pick">
        <legend>Where</legend>
        <label>
          <input type="checkbox" checked={all} onChange={(e) => setV({ ...v, branchIds: e.target.checked ? null : [] })} />
          All five stores
        </label>
        {all
          ? null
          : d.branches.map((b) => (
              <label key={b.id}>
                <input type="checkbox" checked={(v.branchIds || []).includes(b.id)} onChange={(e) => setV({ ...v, branchIds: e.target.checked ? [...(v.branchIds || []), b.id] : (v.branchIds || []).filter((x) => x !== b.id) })} />
                {b.name}
              </label>
            ))}
      </fieldset>
      <div className="field">
        <label htmlFor="ev-sum">One sentence</label>
        <textarea id="ev-sum" rows={2} maxLength={140} value={v.summary} onChange={(e) => setV({ ...v, summary: e.target.value })} />
        <p className="hint">{140 - v.summary.length + " characters left. Keep the detail for the three points."}</p>
      </div>
      <fieldset className="points-pick">
        <legend>Up to three short points</legend>
        {points.map((p, i) => (
          <input key={i} type="text" aria-label={"Point " + (i + 1)} maxLength={48} value={p} onChange={(e) => setV({ ...v, points: points.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={["Members only", "One use per member", "Ends Christmas Eve"][i]} />
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="ev-pic">Picture</label>
        <div className="pic-pick">
          {v.img ? <img src={v.img} alt="" /> : <span className="pic-none">No picture</span>}
          <div>
            <input id="ev-pic" type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setV({ ...v, img: await shrinkImage(f, 900) }); }} />
            {(d.flyers || []).length ? (
              <select aria-label="Or use a flyer from the library" value="" onChange={(e) => e.target.value && setV({ ...v, img: e.target.value })}>
                <option value="">Or use a flyer from the library</option>
                {(d.flyers || []).map((f) => (
                  <option key={f.id} value={f.img}>
                    {f.title}
                  </option>
                ))}
              </select>
            ) : null}
            {v.img ? (
              <button className="link-btn small" type="button" onClick={() => setV({ ...v, img: undefined })}>
                Remove the picture
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={!!v.featured} onChange={(e) => setV({ ...v, featured: e.target.checked })} />
        Lead the Events page with it while it is on
      </label>
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
