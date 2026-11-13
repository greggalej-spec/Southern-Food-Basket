"use client";

import { useEffect, useRef, useState } from "react";

/* Santa's sleigh for the Christmas front page, drawn and animated here (second version, 13 Nov 2026).
   Three reindeer run in front of the sleigh, in the direction it travels, each with four jointed legs on a gallop
   cycle and a body that rises and falls out of step with the others. The team flies a wave across the sky, tilting
   into each climb and dive, pauses off screen, then comes back the other way, smaller and higher, as if further off.

   It answers the visitor: it drifts toward the height of the pointer, and a click or tap on it gets a "Ho ho ho!",
   a burst of speed and three presents dropped from the sack. Decoration only: hidden from screen readers, and not
   shown at all under "reduce motion". Styles: styles/season.css (the "sleigh" block). */

const VB_W = 600, VB_H = 180;
const PASS_S = 15; // seconds to cross the screen
const WAIT_S = 3.5; // seconds off screen between passes

type Drop = { id: number; x: number; y: number; hue: number };

function Leg({ x, y, kind, far, delay }: { x: number; y: number; kind: "front" | "hind"; far?: boolean; delay: number }) {
  const fur = far ? "#7C4A27" : "#9A5E32";
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={"deer-leg deer-" + kind} style={{ animationDelay: delay + "s" }}>
        <path d="M0 0V21" stroke={fur} strokeWidth="7.5" strokeLinecap="round" />
        <g transform="translate(0 21)">
          <g className={"deer-shin deer-" + kind + "-shin"} style={{ animationDelay: delay + "s" }}>
            <path d="M0 0V17" stroke={fur} strokeWidth="5.5" strokeLinecap="round" />
            <path d="M-3.4 15.500h6.800l1 5h-8.800Z" fill="#2B1A12" />
          </g>
        </g>
      </g>
    </g>
  );
}

function Deer({ x, y, lead, phase }: { x: number; y: number; lead?: boolean; phase: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="deer" style={{ animationDelay: phase + "s" }}>
        <Leg x={-21} y={8} kind="hind" far delay={phase + 0.07} />
        <Leg x={19} y={9} kind="front" far delay={phase + 0.33} />
        {/* tail, body, belly */}
        <path d="M-33 -7c-9-5-11 5-3 8Z" fill="#fff" stroke="#3A1B12" strokeWidth="1.400" />
        <path d="M-34 0c0-11 14-16 34-16s32 5 34 13c1 8-9 17-32 18s-36-4-36-15Z" fill="#A9693B" stroke="#3A1B12" strokeWidth="1.800" />
        <path d="M-26 9c12 6 40 6 54-3-6 9-18 12-30 12s-20-3-24-9Z" fill="#D9B48A" />
        {/* neck and head */}
        <path d="M14-12c6-9 12-20 19-27l14 8c-7 9-12 21-15 34Z" fill="#A9693B" stroke="#3A1B12" strokeWidth="1.800" strokeLinejoin="round" />
        <path d="M37-45c5-8 19-8 26 0 5 6 4 13-3 14l-16 1c-7-2-10-9-7-15Z" fill="#B5753F" stroke="#3A1B12" strokeWidth="1.800" strokeLinejoin="round" />
        <path d="M40-47l-9-9 12 3Z" fill="#8E552C" stroke="#3A1B12" strokeWidth="1.400" strokeLinejoin="round" />
        <path d="M45-51c-1-10-5-16-12-21M43-61l8-7M39-66l-4-9M51-51c3-9 8-13 15-15M55-59l8 1" fill="none" stroke="#6E4320" strokeWidth="3.200" strokeLinecap="round" />
        <circle cx="52" cy="-42" r="2" fill="#2B1A12" />
        <circle cx="65" cy="-36" r={lead ? 4.6 : 3.4} fill={lead ? "#E11D2E" : "#2B1A12"} />
        {lead ? <circle className="deer-glow" cx="65" cy="-36" r="9" fill="#FF5A5A" opacity=".35" /> : null}
        {/* harness: collar with a bell, and the strap round the body */}
        <path d="M22-19l14 7" stroke="#C8102E" strokeWidth="6.500" strokeLinecap="round" />
        <circle className="deer-bell" cx="31" cy="-9" r="3.600" fill="#F4C542" stroke="#8A6A12" strokeWidth="1" />
        <path d="M3-16c-4 10-4 22 0 32" fill="none" stroke="#C8102E" strokeWidth="4.500" strokeLinecap="round" />
        <Leg x={-23} y={9} kind="hind" delay={phase} />
        <Leg x={21} y={10} kind="front" delay={phase + 0.26} />
      </g>
    </g>
  );
}

function Team() {
  return (
    <svg className="sleigh-art" viewBox={`0 0 ${VB_W} ${VB_H}`} overflow="visible" aria-hidden="true" focusable="false">
      {/* stardust trailing behind the runners */}
      <g className="sleigh-dust" fill="#F9DC6B">
        {[[-6, 132, 5], [-30, 120, 4], [-52, 138, 3.400], [-78, 126, 3], [-104, 136, 2.400], [-132, 124, 2], [-160, 132, 1.600]].map(([x, y, r], i) => (
          <path key={i} style={{ animationDelay: i * 0.13 + "s" }} transform={`translate(${x} ${y}) scale(${r / 4})`} d="M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z" />
        ))}
      </g>

      {/* the reins, from Santa's mitten to each collar */}
      <path className="sleigh-reins" d="M133 96C190 84 240 92 302 87M133 96C230 70 330 84 417 79M133 96C270 56 420 78 532 71" fill="none" stroke="#8A6A12" strokeWidth="1.800" />

      <Deer x={270} y={98} phase={0} />
      <Deer x={385} y={90} phase={-0.17} />
      <Deer x={500} y={82} phase={-0.34} lead />

      {/* the sleigh */}
      <g transform="translate(18 68)">
        <g className="sleigh-body">
          {/* the sack, with presents showing */}
          <rect x="24" y="-22" width="15" height="14" rx="2" fill="#F4C542" stroke="#3A1B12" strokeWidth="1.400" transform="rotate(-12 31 -15)" />
          <rect x="6" y="-14" width="14" height="13" rx="2" fill="#3B82F6" stroke="#3A1B12" strokeWidth="1.400" transform="rotate(10 13 -8)" />
          <path d="M2 14C-8-10 12-30 34-22c14 5 20 20 14 38Z" fill="#1E7A3C" stroke="#0B3D22" strokeWidth="1.800" />
          <path d="M10-6c8-8 20-10 30-4" fill="none" stroke="#0B3D22" strokeWidth="1.600" />

          {/* Santa: the arm that waves, coat, belt, head, beard, hat */}
          <g transform="translate(66 20)">
            <g className="santa-wave">
              <path d="M0 0-10-20" stroke="#C8102E" strokeWidth="9" strokeLinecap="round" />
              <circle cx="-11" cy="-23" r="5" fill="#0F5A2E" stroke="#3A1B12" strokeWidth="1.200" />
              <path d="M-4-9-8-15" stroke="#fff" strokeWidth="9.500" strokeLinecap="round" />
            </g>
          </g>
          <path d="M55 46C52 24 60 8 76 8s24 14 22 38Z" fill="#D11A36" stroke="#7D0E20" strokeWidth="1.800" />
          <path d="M76 9v36" stroke="#fff" strokeWidth="5" />
          <path d="M55 33h43" stroke="#2B1A12" strokeWidth="6" />
          <rect x="71" y="29" width="10" height="8" rx="1.500" fill="none" stroke="#F4C542" strokeWidth="2.200" />
          <path d="M90 20l22 9" stroke="#C8102E" strokeWidth="9" strokeLinecap="round" />
          <circle cx="115" cy="29" r="5.200" fill="#0F5A2E" stroke="#3A1B12" strokeWidth="1.200" />
          <circle cx="78" cy="-2" r="10.500" fill="#F3C9A5" stroke="#3A1B12" strokeWidth="1.600" />
          <circle cx="82" cy="-4" r="1.500" fill="#2B1A12" />
          <circle cx="86.500" cy="0" r="2.200" fill="#E88B7A" />
          <path d="M67 0c0 16 22 18 23 2-4 4-8 3-11 1-4 2-9 1-12-3Z" fill="#fff" stroke="#3A1B12" strokeWidth="1.400" strokeLinejoin="round" />
          <g className="santa-hat">
            <path d="M68-6c1-13 9-19 18-16l3 12Z" fill="#D11A36" stroke="#7D0E20" strokeWidth="1.600" strokeLinejoin="round" />
            <path className="santa-hat-tail" d="M74-21c-9-6-19-3-24 6" fill="none" stroke="#D11A36" strokeWidth="8" strokeLinecap="round" />
            <circle className="santa-hat-tail" cx="49" cy="-14" r="5" fill="#fff" stroke="#3A1B12" strokeWidth="1.200" />
            <rect x="65" y="-10" width="26" height="6.500" rx="3.200" fill="#fff" stroke="#3A1B12" strokeWidth="1.300" />
          </g>

          {/* the body of the sleigh, its gold trim and runners */}
          <path d="M4 8C-2 32 4 62 34 62h84c20 0 31-14 33-36 0-9-9-10-13-4-2 14-10 22-26 22H52C36 44 26 34 22 12 20 2 6 0 4 8Z" fill="#C8102E" stroke="#7D0E20" strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 12c4 22 14 32 30 32h60c16 0 24-8 26-22" fill="none" stroke="#F4C542" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 53h66" stroke="#F4C542" strokeWidth="2.400" strokeLinecap="round" opacity=".8" />
          <path d="M30 62v15M108 62v15" stroke="#E9B949" strokeWidth="4" />
          <path d="M-2 77c-10 0-13-12-4-15M-2 77h128c18 0 24-14 13-23" fill="none" stroke="#E9B949" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

export function Sleigh() {
  const run = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const boost = useRef(0);
  const [cheer, setCheer] = useState(0);
  const [fast, setFast] = useState(false);
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = run.current;
    if (!el) return;
    let raf = 0, last = performance.now(), t = 0, dir = 1, wait = 0.6, steer = 0, pointerY = -1;
    const onMove = (e: PointerEvent) => (pointerY = e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = innerWidth, h = innerHeight;
      const size = Math.max(230, Math.min(520, w * 0.42)) * (dir > 0 ? 1 : 0.7);
      el.style.width = size + "px";
      if (wait > 0) {
        wait -= dt;
        el.style.visibility = "hidden";
      } else {
        el.style.visibility = "visible";
        const speed = 1 + (boost.current > 0 ? 1.6 : 0);
        boost.current = Math.max(0, boost.current - dt);
        t += (dt / PASS_S) * speed;
        const span = w + size * 1.3;
        const x = dir > 0 ? -size * 1.15 + t * span : w + size * 0.15 - t * span;
        const base = h * (dir > 0 ? 0.2 : 0.11);
        // the pointer pulls the flight path toward its own height, gently
        const want = pointerY < 0 ? 0 : Math.max(-h * 0.08, Math.min(h * 0.14, (pointerY - h * 0.3) * 0.22));
        steer += (want - steer) * Math.min(1, dt * 1.6);
        const wave = Math.sin(t * Math.PI * 3.2);
        const y = base + wave * h * 0.045 + steer;
        // tilt into the climb or the dive: the slope of the wave
        const slope = Math.cos(t * Math.PI * 3.2) * ((h * 0.045 * Math.PI * 3.2) / span);
        const angle = Math.max(-9, Math.min(9, Math.atan(slope) * (180 / Math.PI))) * dir;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        if (tilt.current) tilt.current.style.transform = `scaleX(${dir}) rotate(${(angle * dir).toFixed(2)}deg)`;
        if (t >= 1) {
          t = 0;
          dir = -dir;
          wait = WAIT_S;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  function poke() {
    boost.current = 1.8;
    setCheer((n) => n + 1);
    setFast(true);
    setTimeout(() => setFast(false), 1800);
    const r = run.current?.getBoundingClientRect();
    if (r) {
      const made = [0, 1, 2].map((i) => ({ id: Date.now() + i, x: r.left + r.width * (0.18 + i * 0.07), y: r.top + r.height * 0.45, hue: i }));
      setDrops((d) => [...d, ...made]);
      setTimeout(() => setDrops((d) => d.filter((x) => !made.includes(x))), 2600);
    }
  }

  return (
    <>
      <div className="sleigh-run" ref={run} aria-hidden="true">
        <div className={"sleigh-tilt" + (fast ? " is-cheered" : "")} ref={tilt} onPointerDown={poke}>
          <Team />
        </div>
        {cheer ? (
          <span className="sleigh-cheer" key={"c" + cheer}>
            Ho ho ho!
          </span>
        ) : null}
      </div>
      {drops.map((p, i) => (
        <span key={p.id} className={"sleigh-drop hue-" + p.hue} style={{ left: p.x, top: p.y, animationDelay: i * 0.12 + "s" }} aria-hidden="true" />
      ))}
    </>
  );
}
