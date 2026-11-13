"use client";

import "@/styles/storefront.css";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Fit } from "@/components/fit";
import { span, stores } from "@/components/site/events";
import { useToday } from "@/components/use-today";
import { eventState } from "@/lib/ops/events";
import { useData } from "@/lib/store";
import type { StoreEvent } from "@/lib/types";

/* The two parts of the home page that marketing runs from the office console (Events and flyers):
     Spotlight   the main promotion, one big banner, for the event ticked "main promotion" while it is on
     Highlights  the slides: every event ticked "show it in the home page slides" that is on or coming, then the
                 standing slides the page passes in
   Both read this browser's copy of the data, so a change saved in the console shows here at once. Pictures are
   shown whole (components/fit.tsx). */

export type Slide = { key: string; src: string; alt: string; eyebrow: string; title: string; text: string; btn: string; href: string; cta: string };

const live = (e: StoreEvent, today: string) => eventState(e, today || e.from) !== "past";

export function Spotlight() {
  const d = useData();
  const today = useToday();
  const e = (d.events || []).find((x) => x.spotlight && eventState(x, today || x.from) === "now");
  if (!e) return null;
  return (
    <section className="band band-spot" aria-labelledby="spot-title">
      <div className="wrap">
        <article className="spot">
          {e.img ? <Fit as="div" className="spot-pic" src={e.img} alt={e.title} eager /> : null}
          <div className="spot-body">
            <p className="spot-tag">
              <i aria-hidden="true" />
              On now
            </p>
            <h2 id="spot-title">{e.title}</h2>
            <p>{e.summary}</p>
            {e.points?.length ? (
              <ol className="spot-steps">
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            ) : null}
            <div className="spot-foot">
              <Link className="btn btn-sign" href={e.href || "/events"}>
                {e.cta || "See details"}
              </Link>
              {stores(d, e).map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

const QUERY = "(prefers-reduced-motion: reduce)";
const subReduce = (cb: () => void) => {
  const m = matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function Highlights({ standing }: { standing: Slide[] }) {
  const d = useData();
  const today = useToday();
  const reduce = useSyncExternalStore(subReduce, () => matchMedia(QUERY).matches, () => false);
  const fromEvents: Slide[] = (d.events || [])
    .filter((e) => e.featured && e.img && !e.spotlight && live(e, today))
    .slice(0, 4)
    .map((e) => ({
      key: e.id,
      src: e.img as string,
      alt: e.title,
      eyebrow: (eventState(e, today || e.from) === "now" ? "On now" : "Coming up") + (e.ongoing ? "" : " · " + span(e)),
      title: e.title,
      text: e.summary,
      btn: "btn btn-outline",
      href: e.href || "/events",
      cta: e.cta || "See details",
    }));
  const slides = [...fromEvents, ...standing];
  const n = slides.length;

  const box = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [stopped, setStopped] = useState(false);
  const at = useRef(0), seen = useRef(false);
  const playing = !reduce && !stopped;

  const show = (i: number) => {
    const el = track.current;
    if (!el || !n) return;
    el.scrollTo({ left: el.clientWidth * (((i % n) + n) % n), behavior: reduce ? "auto" : "smooth" });
  };

  useEffect(() => {
    const el = track.current, wrap = box.current;
    if (!el || !wrap) return;
    let t = 0;
    const onScroll = () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / (el.clientWidth || 1))));
        at.current = i;
        setIdx(i);
      }, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver((es) => { seen.current = es[0].isIntersecting; }, { threshold: 0.5 });
    io.observe(wrap);
    const onResize = () => el.scrollTo({ left: el.clientWidth * at.current, behavior: "auto" });
    addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
      io.disconnect();
      removeEventListener("resize", onResize);
    };
  }, [n]);

  // moves on every 7 s, only while it is on screen, motion is allowed and nobody has touched it
  useEffect(() => {
    if (!playing || n < 2) return;
    const id = window.setInterval(() => {
      const el = track.current;
      if (el && seen.current && !document.hidden) el.scrollTo({ left: el.clientWidth * ((at.current + 1) % n), behavior: "smooth" });
    }, 7000);
    return () => clearInterval(id);
  }, [playing, n]);

  if (!n) return null;
  const touch = (e: React.SyntheticEvent) => {
    if (!(e.target as Element).closest(".car-play")) setStopped(true);
  };

  return (
    <div className="carousel" ref={box} aria-roledescription="carousel" aria-label="Highlights" onPointerDown={touch} onKeyDown={touch} onFocus={touch}>
      <div className="car-track" ref={track}>
        {slides.map((s, k) => (
          <article key={s.key} className="slide" role="group" aria-roledescription="slide" aria-label={k + 1 + " of " + n} inert={k !== idx}>
            <Fit as="figure" className="slide-photo" src={s.src} alt={s.alt} eager={k === 0} />
            <div className="slide-copy">
              <p className="eyebrow">
                <span className="fan" aria-hidden="true" />
                {s.eyebrow}
              </p>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <a className={s.btn} href={s.href}>
                {s.cta}
              </a>
            </div>
          </article>
        ))}
      </div>
      {n > 1 ? (
        <div className="car-controls">
          <button className="round car-prev" type="button" aria-label="Previous slide" onClick={() => show(idx - 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="car-dots">
            {slides.map((s, k) => (
              <button key={s.key} type="button" className="car-dot" aria-label={"Slide " + (k + 1) + ": " + s.title} aria-current={k === idx ? "true" : undefined} onClick={() => show(k)} />
            ))}
          </div>
          <button className={playing ? "round car-play" : "round car-play is-paused"} type="button" aria-label={playing ? "Pause the slides" : "Play the slides"} onClick={() => setStopped(playing)}>
            <svg className="i-pause" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6v12M15 6v12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <svg className="i-play" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5Z" fill="currentColor" />
            </svg>
          </button>
          <button className="round car-next" type="button" aria-label="Next slide" onClick={() => show(idx + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
