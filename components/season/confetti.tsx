"use client";

import { useEffect, useRef } from "react";

/* The falling layer for Carnival and Easter, on one canvas (the Christmas snow has its own, components/season/snow.tsx).
   Carnival: paper confetti in the season's colours, tumbling as it falls. Easter: soft petals that drift and rock.
   It never takes a click, stops when the tab is hidden, and does not run under "reduce motion". */

type Bit = { x: number; y: number; w: number; h: number; vy: number; vx: number; a: number; va: number; flip: number; vf: number; c: string };

const LOOKS = {
  carnival: { colours: ["#E3336F", "#2F918A", "#FFD21A", "#8E1556", "#F26A2E", "#FFFFFF"], per: 16000, speed: [46, 96], size: [6, 12], petal: false },
  easter: { colours: ["#F4A6C0", "#FFFFFF", "#FFE9A8", "#BFE3F4", "#F9C9DA"], per: 26000, speed: [22, 46], size: [7, 12], petal: true },
} as const;

export function Confetti({ look }: { look: keyof typeof LOOKS }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const L = LOOKS[look];
    let w = 0, h = 0, raf = 0, last = performance.now(), bits: Bit[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    const make = (anywhere: boolean): Bit => {
      const s = rnd(L.size[0], L.size[1]);
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : -20 - Math.random() * 60,
        w: s, h: L.petal ? s * 0.62 : s * rnd(0.4, 0.7),
        vy: rnd(L.speed[0], L.speed[1]), vx: rnd(-14, 14),
        a: Math.random() * Math.PI * 2, va: rnd(-2.4, 2.4), flip: Math.random() * Math.PI * 2, vf: rnd(2, 5),
        c: L.colours[Math.floor(Math.random() * L.colours.length)],
      };
    };

    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = innerWidth;
      h = innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const want = Math.max(24, Math.min(110, Math.floor((w * h) / L.per)));
      bits = Array.from({ length: want }, () => make(true));
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < bits.length; i++) {
        const b = bits[i];
        b.y += b.vy * dt;
        b.x += (b.vx + Math.sin(b.flip) * 18) * dt;
        b.a += b.va * dt;
        b.flip += b.vf * dt;
        if (b.y > h + 20) bits[i] = make(false);
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.a);
        ctx.scale(1, L.petal ? 1 : Math.cos(b.flip)); // paper turns edge-on as it tumbles
        ctx.globalAlpha = L.petal ? 0.85 : 0.95;
        ctx.fillStyle = b.c;
        if (L.petal) {
          ctx.beginPath();
          ctx.ellipse(0, 0, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
    };
    resize();
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [look]);

  return <canvas ref={ref} className="snow-canvas" aria-hidden="true" />;
}
