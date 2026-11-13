"use client";

import { useEffect, useRef } from "react";

/* Falling snow for the Christmas look, drawn on one canvas (second version, 13 Nov 2026).
   Three depths give it distance: small slow flakes far away, larger faster ones close by, and the nearest drawn as
   six-armed crystals that turn as they fall. A slow breeze swings the whole fall left and right, and the visitor
   makes weather: moving the pointer sideways blows the snow that way, and flakes near the pointer swirl around it.
   It never takes a click, stops when the tab is hidden, and does not run under "reduce motion". */

type Flake = { x: number; y: number; r: number; vy: number; sway: number; phase: number; depth: 0 | 1 | 2; spin: number };

export function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0, h = 0, raf = 0, last = performance.now(), time = 0, gust = 0;
    let flakes: Flake[] = [];
    const pointer = { x: -999, y: -999, lastX: -999 };

    const make = (anywhere: boolean): Flake => {
      const roll = Math.random();
      const depth: 0 | 1 | 2 = roll < 0.5 ? 0 : roll < 0.85 ? 1 : 2;
      const r = depth === 0 ? 0.9 + Math.random() * 0.9 : depth === 1 ? 1.8 + Math.random() * 1.4 : 3.4 + Math.random() * 2.6;
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : -10 - Math.random() * 40, r, vy: (depth === 0 ? 20 : depth === 1 ? 38 : 62) * (0.8 + Math.random() * 0.5), sway: 8 + Math.random() * 22, phase: Math.random() * 6.28, depth, spin: (Math.random() - 0.5) * 1.6 };
    };

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = Math.max(50, Math.min(170, Math.floor((w * h) / 10500)));
      flakes = Array.from({ length: want }, () => make(true));
    };

    const onMove = (e: PointerEvent) => {
      if (pointer.lastX > -900) gust = Math.max(-160, Math.min(160, gust + (e.clientX - pointer.lastX) * 1.4));
      pointer.lastX = e.clientX;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };

    const crystal = (f: Flake, rot: number) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(rot);
      ctx.lineWidth = Math.max(1, f.r * 0.28);
      ctx.lineCap = "round";
      for (let a = 0; a < 3; a++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(-f.r, 0);
        ctx.lineTo(f.r, 0);
        ctx.moveTo(f.r * 0.55, 0);
        ctx.lineTo(f.r * 0.8, f.r * 0.28);
        ctx.moveTo(f.r * 0.55, 0);
        ctx.lineTo(f.r * 0.8, -f.r * 0.28);
        ctx.moveTo(-f.r * 0.55, 0);
        ctx.lineTo(-f.r * 0.8, f.r * 0.28);
        ctx.moveTo(-f.r * 0.55, 0);
        ctx.lineTo(-f.r * 0.8, -f.r * 0.28);
        ctx.stroke();
      }
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      gust *= Math.pow(0.25, dt); // a pointer-made gust dies away in a couple of seconds
      const breeze = Math.sin(time * 0.23) * 14 + Math.sin(time * 0.61) * 6 + gust;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        const near = (f.depth + 1) / 3;
        f.y += f.vy * dt;
        f.x += (breeze * near + Math.sin(time * 0.9 + f.phase) * f.sway * 0.35) * dt;
        // swirl round the pointer
        const dx = f.x - pointer.x, dy = f.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 110 * 110 && d2 > 1) {
          const d = Math.sqrt(d2), push = ((110 - d) / 110) * 90 * near * dt;
          f.x += (dx / d) * push - (dy / d) * push * 0.6;
          f.y += (dy / d) * push * 0.5;
        }
        if (f.y > h + 12) Object.assign(f, make(false));
        if (f.x < -14) f.x = w + 12;
        else if (f.x > w + 14) f.x = -12;

        const alpha = f.depth === 0 ? 0.55 : f.depth === 1 ? 0.8 : 0.95;
        // a cool shadow first, so white snow shows on the cream pages as well as on the sky
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = "#9DBBD6";
        ctx.strokeStyle = "#9DBBD6";
        if (f.depth === 2 && f.r > 4.2) {
          f.y += 1.2;
          crystal(f, time * f.spin + f.phase);
          f.y -= 1.2;
        } else {
          ctx.beginPath();
          ctx.arc(f.x, f.y + f.r * 0.35, f.r * 1.08, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FFFFFF";
        if (f.depth === 2 && f.r > 4.2) crystal(f, time * f.spin + f.phase);
        else {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const onVisible = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return <canvas ref={ref} className="snow-canvas" aria-hidden="true" />;
}
