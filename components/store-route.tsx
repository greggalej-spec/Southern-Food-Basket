import type { CSSProperties } from "react";
import { ROUTE_LABEL, type Route } from "@/lib/route";

// The route drawing from the home's "Where we are" card: pink and green line, a ring per store, a north arrow.
// Decorative; each page lists the stores as links beside it.
export function StoreRouteMap({ route, id }: { route: Route; id?: string }) {
  return (
    <svg className="route" id={id} viewBox="0 0 360 300" aria-hidden="true" focusable="false">
      <path className="route-pink" d={route.d} pathLength={1} />
      <path className="route-green" d={route.d} pathLength={1} />
      {route.stops.map((s, i) => {
        const l = ROUTE_LABEL[s.side], p = route.pts[i];
        return (
          <g key={s.b.id} className="route-stop" style={{ "--i": String(i) } as CSSProperties}>
            <circle cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="7" />
            <text x={(p[0] + l[0]).toFixed(1)} y={(p[1] + l[1]).toFixed(1)} textAnchor={l[2]}>
              {s.b.name}
            </text>
          </g>
        );
      })}
      <g className="route-north">
        <path d="M22 34 L30 14 L38 34 L30 29Z" />
        <text x="30" y="50" textAnchor="middle">
          N
        </text>
      </g>
    </svg>
  );
}
