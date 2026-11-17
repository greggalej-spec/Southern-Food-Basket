"use client";

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "@/components/viz";

/* Something critical while the sidebar is shut (Gregg, 16 Nov 2026): the sidebar's own skin swells out of the left
   edge of the screen, the same dark green, like something pushing up from underneath. The swell has a broad base whose
   flanks curve out from the edge, as a shield volcano does. It pushes once when it appears (stretching wider and
   taller, a red light glowing under it, until the badge bursts out and the skin snaps back with a wobble), then rests,
   and pushes again only every ten seconds while nobody touches it.

   It is a thing you can handle, not a loop:
     tap                      opens the menu at the critical entry
     pull it outward          the skin stretches with the finger; let go far enough out and the menu opens
     slide it back in, or     it sinks under the skin and stays gone until something new turns critical
       press and hold
     let go anywhere else     it springs back to rest
   The badge carries how many critical things there are. Drawn frame by frame (SVG path), so it runs the same in every
   browser; under reduced motion it holds still, and tapping, pulling and sliding still work. */

const W = 110, HGT = 240, CY = HGT / 2;
const REST = { h: 11, l: 104 };
const PEAK = { h: 34, l: 186 };
const STRETCH = 1900, POP = 220, SNAP = 1400;
const PUSH = STRETCH + POP + SNAP;
const EVERY = 10000; // between pushes, untouched
const FIRST = 700; // the first push, after it appears
const HOLD = 650; // press and hold to put it away
const OPEN_AT = 44; // pulled this far out, it opens the menu
const AWAY_AT = -26; // slid this far in, it goes

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** The swell's outline: it leaves the edge with its flanks lying along it (concave), rises to a round crest. */
function outline(h: number, l: number) {
  const top = CY - l / 2, bot = CY + l / 2;
  return `M0,${top - 4} L0,${top} C0,${top + l * 0.3} ${h},${CY - l * 0.17} ${h},${CY} C${h},${CY + l * 0.17} 0,${bot - l * 0.3} 0,${bot} L0,${bot + 4} Z`;
}

type Frame = { h: number; l: number; badge: number; glow: number };

/** One push, t ms in: stretch, burst, snap back. */
function push(t: number): Frame {
  if (t < STRETCH) {
    const e = easeInOut(t / STRETCH);
    const sink = Math.min(1, t / 320); // the badge sinks back under while the skin gathers
    return { h: REST.h + (PEAK.h - REST.h) * e, l: REST.l + (PEAK.l - REST.l) * e, badge: 1 - sink, glow: 0.25 + 0.75 * e };
  }
  if (t < STRETCH + POP) {
    const p = (t - STRETCH) / POP;
    return { h: PEAK.h + 6 * Math.sin(p * Math.PI), l: PEAK.l, badge: Math.min(1, p * 1.4), glow: 1 - p };
  }
  if (t < PUSH) {
    const s = (t - STRETCH - POP) / 1000;
    const k = Math.exp(-4.6 * s) * Math.cos(13 * s);
    return { h: REST.h + (PEAK.h - REST.h) * k, l: REST.l + (PEAK.l - REST.l) * Math.max(-0.15, k), badge: 1, glow: 0 };
  }
  return { ...REST, badge: 1, glow: 0 };
}

export function EdgeBump({ count, label, onOpen, onDismiss }: { count: number; label: string; onOpen: () => void; onDismiss: () => void }) {
  const reduce = useReducedMotion();
  const path = useRef<SVGPathElement>(null);
  const glow = useRef<SVGCircleElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  const id = useId().replace(/:/g, "");
  // what the swell is doing, read by the frame loop and the pointer handlers
  const st = useRef({
    mode: "loop" as "loop" | "drag" | "spring" | "sink",
    since: 0, // when this mode began
    from: { ...REST, badge: 1, glow: 0 } as Frame, // where a spring or a sink starts
    now: { ...REST, badge: 1, glow: 0 } as Frame, // what is drawn
    x0: 0, // where the pointer went down
    dx: 0,
    moved: false,
    holdTimer: 0 as ReturnType<typeof setTimeout> | 0,
    gone: false,
  });
  const cb = useRef({ onOpen, onDismiss });
  useEffect(() => {
    cb.current = { onOpen, onDismiss };
  });

  useEffect(() => {
    const s = st.current;
    const draw = (f: Frame) => {
      s.now = f;
      path.current?.setAttribute("d", outline(Math.max(0, f.h), Math.max(40, f.l)));
      if (glow.current) {
        glow.current.setAttribute("cx", String(Math.max(0, f.h - 10)));
        glow.current.style.opacity = String(f.glow);
      }
      if (badge.current) {
        const scale = 0.4 + 0.6 * f.badge;
        badge.current.style.transform = "translate(" + (Math.max(0, f.h) + 6).toFixed(1) + "px, -50%) scale(" + scale.toFixed(3) + ")";
        badge.current.style.opacity = f.badge.toFixed(3);
      }
    };
    let frame = 0;
    // pushes run in the last PUSH ms of every ten seconds; start the clock so the first comes soon after it appears
    s.since = performance.now() - (EVERY - PUSH - FIRST);
    const tick = (now: number) => {
      const t = now - s.since;
      if (s.mode === "loop") {
        // rest, and push once every ten seconds
        const w = t % EVERY;
        draw(!reduce && w > EVERY - PUSH ? push(w - (EVERY - PUSH)) : { ...REST, badge: 1, glow: 0 });
      } else if (s.mode === "spring") {
        const k = reduce ? 0 : Math.exp(-6 * (t / 1000)) * Math.cos(15 * (t / 1000));
        draw({ h: REST.h + (s.from.h - REST.h) * k, l: REST.l + (s.from.l - REST.l) * k, badge: Math.min(1, s.from.badge + t / 200), glow: 0 });
        if (t > 900 || reduce) {
          s.mode = "loop";
          s.since = now + PUSH; // a full ten seconds of rest after being handled
        }
      } else if (s.mode === "sink") {
        const p = reduce ? 1 : Math.min(1, t / 380);
        const e = p * p;
        draw({ h: s.from.h * (1 - e) - 4 * e, l: s.from.l * (1 - 0.5 * e), badge: Math.max(0, s.from.badge - p * 1.6), glow: 0 });
        if (p >= 1 && !s.gone) {
          s.gone = true;
          cb.current.onDismiss();
        }
      }
      // in "drag" the pointer handlers draw
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  const drawDrag = (dx: number) => {
    const s = st.current;
    s.dx = dx;
    // outward it stretches with growing resistance; inward it flattens into the edge
    const h = dx >= 0 ? REST.h + Math.min(60, dx * 0.7 - Math.max(0, dx - 40) * 0.35) : Math.max(-2, REST.h + dx * 0.45);
    const f = { h, l: REST.l + (dx >= 0 ? Math.min(90, dx * 1.1) : dx * 0.6), badge: dx < 0 ? Math.max(0.3, 1 + dx / 60) : 1, glow: 0 };
    s.now = f;
    path.current?.setAttribute("d", outline(Math.max(0, f.h), Math.max(40, f.l)));
    if (badge.current) {
      badge.current.style.transform = "translate(" + (Math.max(0, f.h) + 6).toFixed(1) + "px, -50%) scale(" + (0.4 + 0.6 * f.badge).toFixed(3) + ")";
      badge.current.style.opacity = f.badge.toFixed(3);
    }
  };
  const go = (mode: "spring" | "sink") => {
    const s = st.current;
    if (s.holdTimer) clearTimeout(s.holdTimer);
    s.holdTimer = 0;
    s.from = { ...s.now };
    s.mode = mode;
    s.since = performance.now();
  };

  return (
    <button
      type="button"
      className="nav-bump"
      aria-label={label + ". Tap to open the menu there; slide it back into the edge, or press and hold, to put it away."}
      // the keyboard: Enter or Space opens the menu (a pointer tap is handled below)
      onClick={(e) => {
        if (e.detail === 0) cb.current.onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") go("sink");
      }}
      onPointerDown={(e) => {
        const s = st.current;
        if (s.mode === "sink") return;
        e.currentTarget.setPointerCapture(e.pointerId);
        s.mode = "drag";
        s.x0 = e.clientX;
        s.dx = 0;
        s.moved = false;
        drawDrag(0);
        // pressing and holding still puts it away
        s.holdTimer = setTimeout(() => {
          if (st.current.mode === "drag" && !st.current.moved) go("sink");
        }, HOLD);
      }}
      onPointerMove={(e) => {
        const s = st.current;
        if (s.mode !== "drag") return;
        const dx = e.clientX - s.x0;
        if (Math.abs(dx) > 6) s.moved = true;
        drawDrag(dx);
      }}
      onPointerUp={() => {
        const s = st.current;
        if (s.mode !== "drag") return;
        if (s.dx <= AWAY_AT) go("sink");
        else if (s.dx >= OPEN_AT || !s.moved) {
          go("spring");
          cb.current.onOpen();
        } else go("spring");
      }}
      onPointerCancel={() => {
        if (st.current.mode === "drag") go("spring");
      }}
    >
      <svg viewBox={`0 0 ${W} ${HGT}`} width={W} height={HGT} aria-hidden="true">
        <defs>
          <linearGradient id={"skin" + id} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--bump-skin-deep, #0B2E19)" />
            <stop offset="1" stopColor="var(--bump-skin, #1A5230)" />
          </linearGradient>
          {/* the light under the skin: soft, so it reads as glowing through rather than sitting on top */}
          <radialGradient id={"glow" + id}>
            <stop offset="0" stopColor="#FF3B30" stopOpacity=".75" />
            <stop offset=".55" stopColor="#FF3B30" stopOpacity=".28" />
            <stop offset="1" stopColor="#FF3B30" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path ref={path} className="nav-bump-skin" d={outline(REST.h, REST.l)} fill={"url(#skin" + id + ")"} />
        <circle ref={glow} cx="0" cy={CY} r="22" fill={"url(#glow" + id + ")"} style={{ opacity: 0 }} />
      </svg>
      <span ref={badge} className="nav-bump-badge">
        <b>{count}</b>
      </span>
    </button>
  );
}
