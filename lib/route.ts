import type { Branch } from "@/lib/types";

// The five stores placed from their Google Maps coordinates and joined in driving order. Shared by the home's
// "Where we are" card and /about so the two maps cannot drift apart.
const ORDER = [["couva", "r"], ["sando", "l"], ["ptown", "b"], ["penal", "r"], ["pfortin", "b"]] as const;
export const ROUTE_LABEL = { r: [12, 5, "start"], l: [-12, 5, "end"], b: [0, 24, "middle"] } as const;

export type RouteStop = { b: Branch; side: keyof typeof ROUTE_LABEL };
export type Route = { stops: RouteStop[]; d: string; pts: number[][] };

/** Stops in route order and a Catmull-Rom line through them, fitted to a 360 × 300 box; null with fewer than two. */
export function storeRoute(branches: Branch[]): Route | null {
  const stops: RouteStop[] = ORDER.flatMap(([id, side]) => {
    const b = branches.find((x) => x.id === id);
    return b && typeof b.lat === "number" ? [{ b, side }] : [];
  });
  if (stops.length < 2) return null;
  const kx = Math.cos(((stops.reduce((s, x) => s + x.b.lat, 0) / stops.length) * Math.PI) / 180);
  const xs = stops.map((s) => s.b.lng * kx), ys = stops.map((s) => -s.b.lat);
  const W = 360, H = 300, pad = 46, x0 = Math.min(...xs), y0 = Math.min(...ys), sx = Math.max(...xs) - x0, sy = Math.max(...ys) - y0;
  const sc = Math.min((W - 2 * pad) / sx, (H - 2 * pad) / sy), ox = (W - sx * sc) / 2, oy = (H - sy * sc) / 2;
  const pts = stops.map((_, i) => [ox + (xs[i] - x0) * sc, oy + (ys[i] - y0) * sc]);
  let d = "M" + pts[0].map((n) => n.toFixed(1)).join(" ");
  for (let i = 0; i < pts.length - 1; i++) { // Catmull-Rom through the stores, written as cubic Béziers
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += "C" + [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]].map((n) => n.toFixed(1)).join(" ");
  }
  return { stops, d, pts };
}
