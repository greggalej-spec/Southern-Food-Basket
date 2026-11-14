"use client";

import "@/styles/public-extras.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Fit } from "@/components/fit";
import { EVENT_KIND, EVENT_KINDS, STATE_LABEL, daysTo, eventState, eventsByState } from "@/lib/ops/events";
import { useData } from "@/lib/store";
import type { EventKind, Flyer, Seed, StoreEvent } from "@/lib/types";

/* The public Events page ("What's on") and the flyer wall on the Specials page. Built to be scanned, not read: a
   date block, a coloured kind chip, one sentence, at most three short points and one button per event. Events sort
   themselves into "On now", "Coming up" and "Earlier" from their dates. */

const noSub = () => () => {};
/** Today in Trinidad as "YYYY-MM-DD"; empty on the server, so the first paint does not guess the date. */
function useToday() {
  return useSyncExternalStore(noSub, () => new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10), () => "");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dm = (day: string) => Number(day.slice(8, 10)) + " " + MONTHS[Number(day.slice(5, 7)) - 1];
export const span = (e: Pick<StoreEvent, "from" | "to" | "ongoing">) => (e.ongoing ? "Since " + dm(e.from) : e.from === e.to ? dm(e.from) : e.from.slice(0, 7) === e.to.slice(0, 7) ? Number(e.from.slice(8, 10)) + " to " + dm(e.to) : dm(e.from) + " to " + dm(e.to));
const days = (n: number) => (n === 1 ? "1 day" : n + " days");

function when(e: StoreEvent, today: string) {
  if (!today) return "";
  const st = eventState(e, today);
  if (st === "past") return "Ended " + dm(e.to);
  if (st === "soon") return "Starts in " + days(daysTo(e.from, today));
  if (e.ongoing) return "";
  const left = daysTo(e.to, today);
  return left === 0 ? "Last day today" : days(left) + " left";
}

export function stores(d: Seed, e: StoreEvent) {
  if (!e.branchIds) return ["All five stores"];
  return e.branchIds.map((id) => d.branches.find((b) => b.id === id)?.name || id);
}

function EventCard({ e, today, lead = false }: { e: StoreEvent; today: string; lead?: boolean }) {
  const d = useData();
  const st = today ? eventState(e, today) : null;
  return (
    <article className={"ev-card ev-" + e.kind + (lead ? " is-lead" : "") + (st ? " is-" + st : "")} id={e.id}>
      {e.img ? <Fit as="div" className="ev-pic" src={e.img} /> : null}
      <div className="ev-date" aria-hidden="true">
        <b>{Number(e.from.slice(8, 10))}</b>
        <span>{MONTHS[Number(e.from.slice(5, 7)) - 1]}</span>
      </div>
      <div className="ev-body">
        <p className="ev-tags">
          <span className="ev-kind">{EVENT_KIND[e.kind].label}</span>
          {st ? <span className={"ev-state is-" + st}>{STATE_LABEL[st]}</span> : null}
        </p>
        <h3>{e.title}</h3>
        <p className="ev-when">
          <strong>{span(e)}</strong>
          {e.time ? " · " + e.time : ""}
          {st && st !== "past" && when(e, today) ? <em>{when(e, today)}</em> : null}
        </p>
        <p className="ev-sum">{e.summary}</p>
        {e.points?.length ? (
          <ul className="ev-points">
            {e.points.slice(0, 3).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : null}
        <p className="ev-foot">
          {stores(d, e).map((n) => (
            <span className="ev-store" key={n}>
              {n}
            </span>
          ))}
          {e.href && st !== "past" ? (
            <Link className="ev-cta" href={e.href}>
              {e.cta || "More"}
            </Link>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export function EventsBoard() {
  const d = useData();
  const today = useToday();
  const [kind, setKind] = useState<"all" | EventKind>("all");
  const [store, setStore] = useState("all");
  const match = (e: StoreEvent) => (kind === "all" || e.kind === kind) && (store === "all" || !e.branchIds || e.branchIds.includes(store));
  const g = eventsByState(d, today || "0000-00-00");
  const now = g.now.filter(match), soon = g.soon.filter(match), past = g.past.filter(match);
  const lead = now.find((e) => e.featured && e.img) || now.find((e) => e.img) || null;
  const live = [...g.now, ...g.soon];

  return (
    <div className="ev-board">
      <div className="ev-filters">
        <div className="ev-chips" role="group" aria-label="Show a kind of event">
          <button type="button" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
            Everything <b>{live.length}</b>
          </button>
          {EVENT_KINDS.map((k) => (
            <button key={k} type="button" className={"ev-chip-" + k} aria-pressed={kind === k} onClick={() => setKind(kind === k ? "all" : k)}>
              {EVENT_KIND[k].label} <b>{live.filter((e) => e.kind === k).length}</b>
            </button>
          ))}
        </div>
        <label className="ev-store-pick">
          <span>Store</span>
          <select value={store} onChange={(e) => setStore(e.target.value)}>
            <option value="all">All stores</option>
            {d.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section aria-labelledby="ev-now-h">
        <h2 id="ev-now-h" className="ev-h">
          <span className="ev-dot is-now" aria-hidden="true" />
          On now
          <small>{now.length}</small>
        </h2>
        {now.length ? (
          <div className="ev-grid">
            {lead ? <EventCard e={lead} today={today} lead /> : null}
            {now
              .filter((e) => e !== lead)
              .map((e) => (
                <EventCard key={e.id} e={e} today={today} />
              ))}
          </div>
        ) : (
          <p className="ev-none">Nothing running that matches. Try “Everything” or another store.</p>
        )}
      </section>

      {soon.length ? (
        <section aria-labelledby="ev-soon-h">
          <h2 id="ev-soon-h" className="ev-h">
            <span className="ev-dot is-soon" aria-hidden="true" />
            Coming up
            <small>{soon.length}</small>
          </h2>
          <div className="ev-grid">
            {soon.map((e) => (
              <EventCard key={e.id} e={e} today={today} />
            ))}
          </div>
        </section>
      ) : null}

      {past.length ? (
        <details className="ev-past">
          <summary>{"Earlier (" + past.length + ")"}</summary>
          <div className="ev-grid">
            {past.map((e) => (
              <EventCard key={e.id} e={e} today={today} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

/* ---------- the flyer wall: the designer's finished flyers, leading the Specials page ---------- */

export function FlyerWall({ rail = false, careers = false }: { rail?: boolean; careers?: boolean }) {
  const d = useData();
  const today = useToday();
  const [open, setOpen] = useState<Flyer | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  // the Specials page shows the featured flyers; the Careers page shows the job flyers
  const list = (d.flyers || []).filter((f) => (careers ? f.careers : f.featured) && (!today || !f.to || f.to >= today));
  useEffect(() => {
    const el = dlg.current;
    if (open && el && !el.open) el.showModal();
  }, [open]);
  if (!list.length) return null;
  return (
    <section className="flyers" aria-labelledby="flyers-h">
      <div className="flyers-head">
        <h2 id="flyers-h">{careers ? "Now hiring" : "This week’s flyers"}</h2>
        <p>Tap one to see it large.</p>
      </div>
      <ul className={rail ? "flyer-row is-rail" : "flyer-row"}>
        {list.map((f) => (
          <li key={f.id}>
            <button type="button" className="flyer" onClick={() => setOpen(f)}>
              <Fit src={f.img} />
              <span>
                <b>{f.title}</b>
                <small>{f.to ? (careers ? "Apply by " : "Until ") + dm(f.to) : careers ? "Open now" : "Running now"}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open ? (
        <dialog
          ref={dlg}
          className="flyer-view"
          aria-label={open.title}
          onClose={() => setOpen(null)}
          onClick={(e) => {
            if (e.target === dlg.current) dlg.current?.close();
          }}
        >
          <img src={open.img} alt={open.title} />
          <div>
            <b>{open.title}</b>
            <button type="button" onClick={() => dlg.current?.close()}>
              Close
            </button>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}

