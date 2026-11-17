"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";
import { flow, type FlowDef } from "@/lib/flows";

/* The moving parts the dashboards share: the animated flow of a process, figures that count up, progress rings,
   sparklines, and the step-by-step "working on it" sequence. Every one answers the pointer and the keyboard: a ring
   shows its share, a sparkline reads out each point, a row of bars spells out its figures, and a figure card opens
   large (VizDialog). All of it is CSS and a few lines of state: no animation library. Under "reduce motion" nothing plays by itself: flows hold still and step when clicked,
   figures show their final value, rings and bars are simply full. Styles: styles/ops.css (the "viz" block). */

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduce(cb: () => void) {
  const mq = matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduce, () => matchMedia(REDUCE).matches, () => true);
}

/* ---------- useSwap: content that changes in place blurs out, then the new content blurs in ----------
   For anything that stays on screen while what it says changes: a ring's figure on hover, the donut's middle, a
   section banner when the tab changes. The old content fades and blurs to nothing (130 ms), the new content takes
   its place and sharpens in (260 ms), like a skeleton resolving. A change that lands mid-swap carries on from
   where the motion is, so a quick in-and-out never jumps. Reduced motion: the content simply changes. */

const SWAP_OUT: Keyframe = { opacity: 0, filter: "blur(5px)", transform: "translateY(-3px)" };
const SWAP_IN: Keyframe[] = [
  { opacity: 0, filter: "blur(5px)", transform: "translateY(4px)" },
  { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
];

/** Returns the value to draw and a ref for the element whose content changes. `pick` names the parts to animate
 *  when the element itself must stay still (a banner keeps its colour; only its text and figure swap); pass a
 *  function defined outside the component, so it stays the same between renders. */
export function useSwap<V, T extends Element = Element>(value: V, pick?: (el: T) => Element[]) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const ref = useRef<T>(null);
  const shownRef = useRef(value);
  const running = useRef<Animation[]>([]);
  useEffect(() => {
    if (Object.is(value, shownRef.current)) return;
    shownRef.current = value;
    const el = ref.current;
    if (reduce || !el || typeof el.animate !== "function") {
      queueMicrotask(() => setShown(value));
      return;
    }
    const parts = pick ? pick(el) : [el];
    // freeze whatever is mid-flight where it is, so the next leg starts from there
    running.current.forEach((a) => {
      try {
        a.commitStyles();
      } catch {}
      a.cancel();
    });
    const clear = (p: Element) => {
      const st = (p as HTMLElement).style;
      if (!st) return;
      st.removeProperty("opacity");
      st.removeProperty("filter");
      st.removeProperty("transform");
    };
    const outs = parts.map((p) => p.animate([SWAP_OUT], { duration: 130, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "forwards" }));
    running.current = outs;
    Promise.all(outs.map((a) => a.finished)).then(
      () => {
        // a newer change took over while this one was leaving: it carries on from here
        if (!Object.is(shownRef.current, value)) return;
        setShown(value);
        requestAnimationFrame(() => {
          if (!Object.is(shownRef.current, value)) return;
          parts.forEach(clear);
          outs.forEach((a) => a.cancel());
          running.current = parts.map((p) => p.animate(SWAP_IN, { duration: 260, easing: "cubic-bezier(.22, .8, .3, 1)" }));
        });
      },
      () => {},
    );
  }, [value, reduce, pick]);
  return [reduce ? value : shown, ref] as const;
}

/* ---------- Flow: a process as a row of stages with a parcel travelling through them ---------- */

const KEY = "sfb-flow-";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function isClosed(id: string) {
  try {
    return localStorage.getItem(KEY + id) !== "open";
  } catch {
    return false;
  }
}
function setClosed(id: string, closed: boolean) {
  try {
    if (closed) localStorage.removeItem(KEY + id);
    else localStorage.setItem(KEY + id, "open");
  } catch {}
  listeners.forEach((l) => l());
}

const STEP_MS = 2600;

/** The guide at the top of a section, and the diagrams on /how-it-works. `counts` puts a live number on a stage
 *  (how many items sit there now); null leaves a stage bare. `always` keeps it open with no hide button. */
export function Flow({ id, def, counts, always = false }: { id?: string; def?: FlowDef; counts?: (number | null)[]; always?: boolean }) {
  const f = def || (id ? flow(id) : undefined);
  const closed = useSyncExternalStore(subscribe, () => (always || !f ? false : isClosed(f.id)), () => false);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const n = f?.stages.length || 0;

  useEffect(() => {
    if (reduce || held || closed || n < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), STEP_MS);
    return () => clearInterval(t);
  }, [reduce, held, closed, n]);

  if (!f) return null;
  const st = f.stages[Math.min(active, n - 1)];

  if (closed) {
    return (
      <button className="flow-reopen" type="button" onClick={() => setClosed(f.id, false)}>
        <Icon name="help" />
        Show how this works
      </button>
    );
  }

  return (
    <section className="flow" aria-label={f.title} data-tour={"flow-" + f.id} onPointerEnter={() => setHeld(true)} onPointerLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <header className="flow-head">
        <h2>{f.title}</h2>
        {always ? null : (
          <button className="link-btn small" type="button" onClick={() => setClosed(f.id, true)}>
            Hide
          </button>
        )}
      </header>
      <ol className="flow-track" style={{ "--n": n } as React.CSSProperties}>
        {f.stages.map((s, i) => {
          const state = i === active ? "is-active" : i < active ? "is-done" : "";
          const count = counts?.[i];
          return (
            <li key={s.label} className={"flow-stage " + state}>
              {i > 0 ? <span className={"flow-link" + (i === active && !reduce ? " is-flowing" : "") + (i <= active ? " is-done" : "")} aria-hidden="true" /> : null}
              <button type="button" className="flow-node" aria-current={i === active ? "step" : undefined} onClick={() => setActive(i)}>
                <span className="flow-dot">
                  <Icon name={s.icon} />
                  {count != null ? <span className="flow-count num">{count}</span> : null}
                </span>
                <span className="flow-label">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flow-detail" key={active}>
        <p className="flow-who">
          <span className="flow-step num">{active + 1 + " of " + n}</span>
          {st.who}
        </p>
        <p className="flow-text">{st.text}</p>
      </div>
      {f.tryIt && !always ? (
        <details className="flow-try">
          <summary>Try it yourself</summary>
          <p>{f.tryIt.charAt(0).toUpperCase() + f.tryIt.slice(1)}</p>
        </details>
      ) : null}
    </section>
  );
}

/* ---------- CountUp: a figure that runs up to its value when it appears or changes ---------- */

export function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString("en-US"), ms = 900 }: { value: number; format?: (n: number) => string; ms?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now(), a = from.current, b = value;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = a + (b - a) * eased;
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms, reduce]);
  return <span className="num">{format(reduce ? value : shown)}</span>;
}

/* ---------- VizDialog: the expanded view of a figure or a chart ---------- */

/** A figure or chart opened large. The browser's own <dialog>: it sits above everything, Escape closes it, focus is
 *  held inside, and a click on the dimmed page behind closes it too. */
export function VizDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="viz-dialog"
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" className="viz-x" aria-label="Close" onClick={() => ref.current?.close()}>
          ×
        </button>
      </header>
      <div className="viz-body">{children}</div>
    </dialog>
  );
}

const toggleKey = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  fn();
};

/* ---------- Ring: a share of a whole, drawn round a circle, with the figure in the middle ---------- */

const RING_R = 40, RING_C = 2 * Math.PI * RING_R;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const easeIn = (x: number) => x * x * x;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** The arc as drawn: where its tail and head sit, as fractions of the way round from the top. They may run past 1
 *  while it travels a lap; the drawing wraps them. */
type Arc = { t: number; h: number };

/** Point at it (or focus it) and the ring redraws and shows the share as a percentage with what is left; click or
 *  press Enter to keep it that way. `interactive={false}` is for a ring inside a card that is itself a button: it
 *  still answers the pointer but takes no focus or click of its own.
 *
 *  The arc is moved frame by frame from wherever it is drawn at that moment, so nothing ever jumps: it sweeps in from
 *  empty when it appears, eases to a new value when the figure changes, and on hover it either bounces back to zero
 *  and out again (when it is more than half full) or carries on round the circle, the head running ahead and the tail
 *  catching up, until it lands back on its value (when it is half full or less). Leaving mid-way lets it finish. */
export function Ring({ value, of, label, tone = "green", size = 96, interactive = true }: { value: number; of: number; label: string; tone?: "green" | "clay" | "teal" | "gold"; size?: number; interactive?: boolean }) {
  const [hot, setHot] = useState(false);
  const [pin, setPin] = useState(false);
  const on = hot || pin;
  const reduce = useReducedMotion();
  const share = of > 0 ? Math.max(0, Math.min(1, value / of)) : 0;
  const pct = Math.round(share * 100);
  const r = RING_R, c = RING_C;
  const restDash = share * c + " " + (c - share * c);
  // the three lines in the middle swap with a blur instead of jumping (useSwap)
  const [big, bigRef] = useSwap<string, SVGTextElement>(on ? pct + "%" : String(value));
  const [mid, midRef] = useSwap<string, SVGTextElement>(on ? Math.max(0, of - value) + " to go" : "of " + of);
  const [low, lowRef] = useSwap<string, SVGTextElement>(on ? "" : pct + "%");

  const fill = useRef<SVGCircleElement>(null);
  const arc = useRef<Arc>({ t: 0, h: 0 });
  const frame = useRef(0);
  // Draws an arc and remembers it, so the next motion starts from exactly here.
  const draw = (s: Arc) => {
    const el = fill.current;
    if (!el) return;
    const len = Math.max(0, Math.min(1, s.h - s.t)) * c;
    el.style.strokeDasharray = len.toFixed(2) + " " + (c - len + 0.01).toFixed(2);
    el.style.strokeDashoffset = (-(((s.t % 1) + 1) % 1) * c).toFixed(2);
    arc.current = s;
  };
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });
  // Runs a motion from the arc as it stands: `to(from, p)` gives the arc at progress p (0 to 1).
  const run = useRef((to: (from: Arc, p: number) => Arc, ms: number, rest: Arc) => {
    cancelAnimationFrame(frame.current);
    const from = arc.current;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      drawRef.current(p < 1 ? to(from, p) : rest);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  });
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Appearing, or the figure changing: ease from the arc as drawn to the new value. A layout effect, so the first
  // frame on screen is the arc as remembered (empty, the first time), never the finished ring flashing first.
  useLayoutEffect(() => {
    const rest = { t: 0, h: share };
    if (reduce) {
      cancelAnimationFrame(frame.current);
      drawRef.current(rest);
      return;
    }
    drawRef.current(arc.current);
    run.current((f, p) => {
      const e = easeOut(p);
      // a tail mid-lap finishes its lap rather than running backwards
      const t = f.t % 1 === 0 ? f.t : Math.ceil(f.t);
      return { t: mix(f.t, t, e), h: mix(f.h, t + share, e) };
    }, 1100, rest);
  }, [share, reduce]);

  // Pointing at it: bounce back to zero and out again, or go round, depending on how full it is right now.
  useEffect(() => {
    if (!on || reduce) return;
    const rest = { t: 0, h: share };
    const now = arc.current;
    const len = now.h - now.t;
    if (len > 0.5) {
      run.current((f, p) => {
        const lap = f.t % 1 === 0 ? f.t : Math.ceil(f.t);
        if (p < 0.42) {
          const e = easeInOut(p / 0.42);
          return { t: f.t, h: mix(f.h, f.t, e) };
        }
        const e = easeOut((p - 0.42) / 0.58);
        return { t: mix(f.t, lap, e), h: mix(f.t, lap + share, e) };
      }, 1000, rest);
    } else {
      run.current((f, p) => {
        const lap = Math.floor(f.t) + 1;
        return { t: mix(f.t, lap, easeIn(p)), h: mix(f.h, lap + share, easeOut(p)) };
      }, 1150, rest);
    }
  }, [on, reduce, share]);
  const own = interactive ? { tabIndex: 0, role: "button", "aria-pressed": pin, onClick: () => setPin(!pin), onKeyDown: toggleKey(() => setPin(!pin)), onFocus: () => setHot(true), onBlur: () => setHot(false) } : {};
  return (
    <figure className={"gauge gauge-" + tone + (on ? " is-hot" : "")} style={{ width: size }} aria-label={label + ": " + value + " of " + of + ", " + pct + " percent"} onPointerEnter={() => setHot(true)} onPointerLeave={() => setHot(false)} {...own}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1="50" y1="1.5" x2="50" y2="5" transform={"rotate(" + i * 36 + " 50 50)"} className="gauge-tick" />
        ))}
        <circle cx="50" cy="50" r={r} className="gauge-track" />
        <circle ref={fill} cx="50" cy="50" r={r} className="gauge-fill is-driven" style={{ strokeDasharray: restDash, strokeDashoffset: 0 }} transform="rotate(-90 50 50)" />
        <text ref={bigRef} x="50" y="48" textAnchor="middle" className="gauge-value">
          {big}
        </text>
        <text ref={midRef} x="50" y="64" textAnchor="middle" className="gauge-of">
          {mid}
        </text>
        <text ref={lowRef} x="50" y="76" textAnchor="middle" className="gauge-pct">
          {low}
        </text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/* ---------- Spark: the shape of a short series, no axes ---------- */

/** Move along it (or use the arrow keys) and a dot follows the line with that point's value. `names` labels the
 *  points; without it they read "this week", "1 week ago" and so on. */
export function Spark({ points, color = "var(--green)", label, names }: { points: number[]; color?: string; label: string; names?: string[] }) {
  const [at, setAt] = useState<number | null>(null);
  if (points.length < 2) return null;
  const last = points.length - 1;
  const max = Math.max(...points), min = Math.min(...points), span = max - min || 1;
  const x = (i: number) => 2 + (i * 96) / last;
  const y = (v: number) => 26 - ((v - min) / span) * 22;
  const d = points.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  const name = (i: number) => names?.[i] ?? (i === last ? "This week" : last - i === 1 ? "1 week ago" : last - i + " weeks ago");
  const clamp = (i: number) => Math.max(0, Math.min(last, i));
  return (
    <span
      className={"spark-wrap" + (at != null ? " is-hot" : "")}
      tabIndex={0}
      role="img"
      aria-label={label + ". Latest " + points[last].toLocaleString("en-US") + ", highest " + max.toLocaleString("en-US") + ", lowest " + min.toLocaleString("en-US") + "."}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setAt(clamp(Math.round(((e.clientX - r.left) / Math.max(1, r.width)) * last)));
      }}
      onPointerLeave={() => setAt(null)}
      onBlur={() => setAt(null)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        setAt(clamp((at ?? last) + (e.key === "ArrowLeft" ? -1 : 1)));
      }}
    >
      <span className="spark-plot">
        <svg className="spark" viewBox="0 0 100 30" aria-hidden="true" preserveAspectRatio="none">
          <line className="spark-base" x1="2" x2="98" y1="29" y2="29" />
          <polygon className="spark-area" points={d + " 98,29 2,29"} fill={color} />
          <polyline className="spark-line" points={d} fill="none" stroke={color} pathLength={1} />
        </svg>
        {/* always drawn, so they fade in and out and glide between points instead of popping (styles/ops.css) */}
        <i className="spark-dot" style={{ left: x(at ?? last) + "%", top: (y(points[at ?? last]) / 30) * 100 + "%", background: color }} />
        <b className="spark-tip" style={{ left: x(at ?? last) + "%" }} data-side={(at ?? last) > last / 2 ? "left" : "right"} aria-hidden={at == null}>
          {name(at ?? last) + ": " + points[at ?? last].toLocaleString("en-US")}
        </b>
      </span>
      <span className="spark-scale" aria-hidden="true">
        <small>{"Low " + min.toLocaleString("en-US")}</small>
        <small>{"High " + max.toLocaleString("en-US")}</small>
      </span>
    </span>
  );
}

/* ---------- Working: what the system is doing, one step at a time ---------- */

/** Shows each step with a spinner, then a tick, then calls onDone. The work itself has usually finished already;
 *  the sequence is there so a person can see what was done on their behalf. */
export function Working({ steps, onDone, stepMs = 520 }: { steps: string[]; onDone: () => void; stepMs?: number }) {
  const reduce = useReducedMotion();
  const [at, setAt] = useState(0);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (at >= steps.length) {
      const t = setTimeout(() => done.current(), reduce ? 0 : 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setAt((a) => a + 1), reduce ? 60 : stepMs);
    return () => clearTimeout(t);
  }, [at, steps.length, stepMs, reduce]);
  return (
    <ol className="working" role="status" aria-live="polite">
      {steps.map((s, i) => (
        <li key={s} className={i < at ? "is-done" : i === at ? "is-now" : ""}>
          <span className="working-mark" aria-hidden="true">
            {i < at ? <Icon name="check" /> : null}
          </span>
          {s}
        </li>
      ))}
    </ol>
  );
}

/* ---------- PairBars: this time against last time, per row ---------- */

/** Point at a row and the others step back while it spells out both figures and the difference; click (or Enter)
 *  keeps that row open. */
/** The next round number up (1, 2, 2.5, 5 or 10 times a power of ten), so a scale's steps read cleanly. */
function roundUp(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, v))));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export function PairBars({ rows, nowLabel, thenLabel }: { rows: { label: string; now: number; then: number | null }[]; nowLabel: string; thenLabel: string }) {
  const [hot, setHot] = useState<number | null>(null);
  const [pin, setPin] = useState<number | null>(null);
  const on = hot ?? pin;
  const max = roundUp(Math.max(1, ...rows.flatMap((r) => [r.now, r.then || 0])));
  const detail = (r: { now: number; then: number | null }) => {
    if (r.then == null) return nowLabel + ": " + r.now.toLocaleString("en-US") + ". Nothing to compare it with.";
    const diff = r.now - r.then;
    const pct = r.then ? " (" + Math.round((Math.abs(diff) / r.then) * 100) + "%)" : "";
    return nowLabel + ": " + r.now.toLocaleString("en-US") + " · " + thenLabel + ": " + r.then.toLocaleString("en-US") + " · " + (diff === 0 ? "no change" : (diff > 0 ? "up " : "down ") + Math.abs(diff).toLocaleString("en-US") + pct);
  };
  return (
    <div className="pairbars">
      <ul>
        {rows.map((r, i) => {
          const flip = () => setPin(pin === i ? null : i);
          return (
            <li key={r.label} className={on === i ? "is-hot" : on != null ? "is-dim" : ""} tabIndex={0} role="button" aria-pressed={pin === i} onPointerEnter={() => setHot(i)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} onClick={flip} onKeyDown={toggleKey(flip)}>
              <span className="pair-label">{r.label}</span>
              <span className="pair-tracks">
                <span className="pair-bar pair-now" style={{ width: Math.max(1.5, (r.now / max) * 100) + "%" }} />
                {r.then != null ? <span className="pair-bar pair-then" style={{ width: Math.max(1.5, (r.then / max) * 100) + "%" }} /> : null}
              </span>
              <span className="pair-value num">
                {r.now.toLocaleString("en-US")}
                {r.then != null ? <small>{" / " + r.then.toLocaleString("en-US")}</small> : null}
                {r.then != null && r.then !== r.now ? <em className={r.now > r.then ? "is-up" : "is-down"}>{(r.now > r.then ? "▲ " : "▼ ") + Math.abs(r.now - r.then).toLocaleString("en-US")}</em> : null}
              </span>
              {on === i ? <span className="row-detail">{detail(r)}</span> : null}
            </li>
          );
        })}
        <li className="pair-axisrow" aria-hidden="true">
          <span className="pair-label" />
          <span className="pair-tracks pair-scale">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <i key={t}>{Math.round(max * t).toLocaleString("en-US")}</i>
            ))}
          </span>
          <span className="pair-value" />
        </li>
      </ul>
      <p className="pair-legend small muted">
        <span className="pair-key pair-now" /> {nowLabel}
        <span className="pair-key pair-then" /> {thenLabel}
      </p>
    </div>
  );
}
