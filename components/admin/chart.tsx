"use client";

import { useEffect, useRef, useState } from "react";
import { CountUp, VizDialog } from "@/components/viz";
import type { Platform } from "@/lib/types";

/* The console's one chart: lines over weeks, one per platform. Built by hand as SVG so it carries no library.
   Rules it keeps (the dataviz method): one y-axis; a colour belongs to a platform, never to its rank; the palette
   below passed the colour-blind and contrast checks against the card surface as an ordered set; every line is
   labelled at its end as well as in the legend; hovering shows every value for that week; a table view sits behind
   a button for anyone who would rather read numbers. */

/** In this order the set passes the checks (adjacent pairs stay apart for colour-blind readers). Each colour is a
 *  CSS variable with the light-mode value as its fallback; styles/staff-theme.css gives the dark-mode steps
 *  (#E0588B, #6990E6, #BF8628, #30A587), validated the same way against the dark card. */
export const PLATFORM_COLOR: Record<Platform, string> = { instagram: "var(--pf-instagram, #C2255F)", facebook: "var(--pf-facebook, #3A66C8)", website: "var(--pf-website, #B26A00)", tiktok: "var(--pf-tiktok, #0F8A6E)" };

export type Line = { id: Platform; name: string; points: number[] };

// Room on the left and underneath for the axis titles (what is counted, and what the steps along the bottom are).
const W = 760, H = 320, M = { l: 66, r: 112, t: 14, b: 48 };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function niceMax(v: number) {
  if (v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export const compact = (n: number) => (n >= 1000000 ? (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m" : n >= 10000 ? Math.round(n / 1000) + "k" : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n));

export function LineChart({ lines, labels, title, unit, expanded = false }: { lines: Line[]; labels: string[]; title: string; unit: string; expanded?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  // Click a week to keep its figures up after the pointer leaves; click again to let go.
  const [pin, setPin] = useState<number | null>(null);
  const [big, setBig] = useState(false);
  const at = hover ?? pin;
  const [table, setTable] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const n = labels.length;
  const max = niceMax(Math.max(1, ...lines.flatMap((l) => l.points)));
  const x = (i: number) => M.l + (n <= 1 ? 0 : (i * (W - M.l - M.r)) / (n - 1));
  const y = (v: number) => M.t + (1 - v / max) * (H - M.t - M.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);

  // End labels: keep them at least 16px apart, top to bottom, without leaving the plot.
  const ends = lines
    .map((l) => ({ id: l.id, name: l.name, v: l.points[n - 1] ?? 0, y: y(l.points[n - 1] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
  const over = ends.length ? ends[ends.length - 1].y - (H - M.b) : 0;
  if (over > 0) ends.forEach((e) => (e.y -= over));

  function onMove(e: React.PointerEvent) {
    const r = svg.current?.getBoundingClientRect();
    if (!r || n < 1) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - M.l) / (W - M.l - M.r)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <figure className="chart">
      <div className="chart-head">
        <ul className="chart-legend" aria-label="Lines on the chart">
          {lines.map((l) => (
            <li key={l.id}>
              <span className="chart-key" style={{ background: PLATFORM_COLOR[l.id] }} />
              {l.name}
            </li>
          ))}
        </ul>
        <span className="chart-actions">
          <button className="link-btn small" type="button" aria-pressed={table} onClick={() => setTable(!table)}>
            {table ? "Show the chart" : "Show as a table"}
          </button>
          {expanded ? null : (
            <button className="link-btn small" type="button" onClick={() => setBig(true)}>
              Expand
            </button>
          )}
        </span>
      </div>
      {table ? (
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Week of</th>
                {lines.map((l) => (
                  <th key={l.id} scope="col" className="num">
                    {l.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((lab, i) => (
                <tr key={lab}>
                  <th scope="row">{lab}</th>
                  {lines.map((l) => (
                    <td key={l.id} className="num">
                      {(l.points[i] ?? 0).toLocaleString("en-US")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-plot">
          <svg ref={svg} viewBox={"0 0 " + W + " " + H} role="img" aria-label={title + ". Use “Show as a table” for the numbers."} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => setPin(pin === hover ? null : hover)}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className={t === 0 ? "chart-axis" : "chart-grid"} />
                <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">
                  {compact(t)}
                </text>
              </g>
            ))}
            {labels.map((lab, i) =>
              n <= 6 || i % 2 === (n - 1) % 2 ? (
                <text key={lab} x={x(i)} y={H - M.b + 19} textAnchor="middle" className="chart-tick">
                  {lab}
                </text>
              ) : null,
            )}
            {labels.map((lab, i) => (
              <line key={"step" + lab} x1={x(i)} x2={x(i)} y1={H - M.b} y2={H - M.b + 5} className="chart-axis" />
            ))}
            <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" className="chart-axis-title">
              Week starting
            </text>
            <text transform="rotate(-90)" x={-(M.t + (H - M.t - M.b) / 2)} y={14} textAnchor="middle" className="chart-axis-title">
              {cap(unit)}
            </text>
            {at != null ? <line x1={x(at)} x2={x(at)} y1={M.t} y2={H - M.b} className="chart-cross" /> : null}
            {lines.map((l) => (
              <g key={l.id}>
                <polyline fill="none" stroke={PLATFORM_COLOR[l.id]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={l.points.map((v, i) => x(i) + "," + y(v)).join(" ")} />
                {l.points.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={PLATFORM_COLOR[l.id]} className="chart-pt" />
                ))}
                <circle cx={x(at ?? n - 1)} cy={y(l.points[at ?? n - 1] ?? 0)} r="4.5" fill={PLATFORM_COLOR[l.id]} className="chart-dot" />
              </g>
            ))}
            {ends.map((e) => (
              <text key={e.id} x={W - M.r + 10} y={e.y + 4} className="chart-end">
                {e.name + " " + compact(e.v)}
              </text>
            ))}
          </svg>
          {at != null ? (
            <div className="chart-tip" style={{ left: (x(at) / W) * 100 + "%" }} data-side={at > n / 2 ? "left" : "right"} role="status">
              <strong>{"Week of " + labels[at]}</strong>
              {lines
                .slice()
                .sort((a, b) => (b.points[at] ?? 0) - (a.points[at] ?? 0))
                .map((l) => (
                  <span key={l.id}>
                    <span className="chart-key" style={{ background: PLATFORM_COLOR[l.id] }} />
                    {l.name}
                    <b>{(l.points[at] ?? 0).toLocaleString("en-US")}</b>
                  </span>
                ))}
              <small>{unit}</small>
            </div>
          ) : null}
        </div>
      )}
      <ChartStats lines={lines} labels={labels} />
      {table || expanded ? null : <p className="chart-hint">Move across the chart for each week. Click a week to hold it.</p>}
      {big ? (
        <VizDialog title={title} onClose={() => setBig(false)}>
          <LineChart lines={lines} labels={labels} title={title} unit={unit} expanded />
        </VizDialog>
      ) : null}
    </figure>
  );
}


/** Horizontal bars for a short ranked list (pages, platforms): one hue, the value written beside each bar. Point at
 *  a bar and it grows, the others step back, and a line under it gives its rank and its share of the total; click
 *  (or Enter) keeps it open. */
export function Bars({ rows, color = "var(--green)" }: { rows: { label: string; value: number; note?: string }[]; color?: string }) {
  const [hot, setHot] = useState<number | null>(null);
  const [pin, setPin] = useState<number | null>(null);
  const on = hot ?? pin;
  // the scale ends on a round number, so the steps written under the bars are round too
  const max = niceMax(Math.max(1, ...rows.map((r) => r.value)));
  const total = rows.reduce((n, r) => n + r.value, 0);
  const rank = (v: number) => rows.filter((r) => r.value > v).length + 1;
  return (
    <ul className="hbars">
      {rows.map((r, i) => {
        const flip = () => setPin(pin === i ? null : i);
        return (
          <li
            key={r.label}
            className={on === i ? "is-hot" : on != null ? "is-dim" : ""}
            tabIndex={0}
            role="button"
            aria-pressed={pin === i}
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
            onFocus={() => setHot(i)}
            onBlur={() => setHot(null)}
            onClick={flip}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              flip();
            }}
          >
            <span className="hbar-label">
              <i className="hbar-rank">{rank(r.value)}</i>
              {r.label}
            </span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: Math.max(2, (r.value / max) * 100) + "%", background: color }} />
            </span>
            <span className="hbar-value num">
              {r.value.toLocaleString("en-US")}
              {total ? <small>{" " + Math.round((r.value / total) * 100) + "%"}</small> : null}
              {r.note ? <small>{" " + r.note}</small> : null}
            </span>
            {on === i ? <span className="row-detail">{"Number " + rank(r.value) + " of " + rows.length + " · " + (total ? Math.round((r.value / total) * 100) : 0) + "% of the total (" + total.toLocaleString("en-US") + ")"}</span> : null}
          </li>
        );
      })}
      <li className="hbar-axisrow" aria-hidden="true">
        <span className="hbar-label" />
        <span className="hbar-track hbar-scale">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <i key={t}>{compact(Math.round(max * t))}</i>
          ))}
        </span>
        <span className="hbar-value" />
      </li>
    </ul>
  );
}

/** The counters under a line chart: for each line, the latest figure counting up, how it moved on the week before,
 *  its peak and its average over the weeks shown. */
function ChartStats({ lines, labels, from = 0 }: { lines: Line[]; labels: string[]; from?: number }) {
  const n = labels.length;
  if (n < 1 || !lines.length) return null;
  return (
    <ul className="chart-stats" aria-label="The figures behind each line">
      {lines.map((l) => {
        const pts = l.points.slice(from), last = l.points[n - 1] ?? 0, prev = l.points[n - 2];
        const peak = Math.max(...pts), peakAt = from + pts.indexOf(peak);
        const avg = Math.round(pts.reduce((a, b) => a + b, 0) / Math.max(1, pts.length));
        const diff = prev == null ? null : last - prev;
        const pct = diff != null && prev ? Math.round((Math.abs(diff) / prev) * 100) : null;
        return (
          <li key={l.id}>
            <span className="cs-name">
              <span className="chart-key" style={{ background: PLATFORM_COLOR[l.id] }} />
              {l.name}
            </span>
            <b className="cs-now">
              <CountUp value={last} />
            </b>
            <span className={"cs-delta " + (diff == null || diff === 0 ? "is-flat" : diff > 0 ? "is-up" : "is-down")}>
              {diff == null ? "First week" : diff === 0 ? "No change on last week" : (diff > 0 ? "▲ " : "▼ ") + Math.abs(diff).toLocaleString("en-US") + (pct != null ? " (" + pct + "%)" : "") + " on last week"}
            </span>
            <span className="cs-more">{"Peak " + peak.toLocaleString("en-US") + ", week of " + labels[peakAt] + " · Average " + avg.toLocaleString("en-US")}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- TrendChart: the same lines, with a time frame that zooms ----------
   Choose 4, 8 or 12 weeks and the plot slides and stretches to that window, with the scale settling as it goes, so
   the eye follows where the weeks went. Each account has a chip: click it to hide or show its line, point at it to
   bring that line forward. A soft fill under each line shows volume without a second axis. */

const TW = 820, TH = 340, TM = { l: 66, r: 18, t: 16, b: 48 };

export function TrendChart({ lines, labels, span, title, unit, expanded = false }: { lines: Line[]; labels: string[]; span: number; title: string; unit: string; expanded?: boolean }) {
  const n = labels.length;
  const [off, setOff] = useState<Set<Platform>>(new Set());
  const [hot, setHot] = useState<Platform | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Click a week to keep its figures up after the pointer leaves; click again to let go.
  const [pin, setPin] = useState<number | null>(null);
  const [big, setBig] = useState(false);
  const at = hover ?? pin;
  const svg = useRef<SVGSVGElement>(null);
  const shown = lines.filter((l) => !off.has(l.id));
  const targetStart = Math.max(0, n - span);
  const targetMax = niceMax(Math.max(1, ...shown.flatMap((l) => l.points.slice(targetStart))));
  const [view, setView] = useState({ start: targetStart, max: targetMax });
  const cur = useRef(view);

  useEffect(() => {
    const from = cur.current;
    if (from.start === targetStart && from.max === targetMax) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now(), ms = reduce ? 1 : 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const v = { start: from.start + (targetStart - from.start) * e, max: from.max + (targetMax - from.max) * e };
      cur.current = v;
      setView(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetStart, targetMax]);

  const pw = TW - TM.l - TM.r, ph = TH - TM.t - TM.b;
  const x = (i: number) => TM.l + ((i - view.start) / Math.max(0.0001, n - 1 - view.start)) * pw;
  const y = (v: number) => TM.t + (1 - Math.min(1.2, v / view.max)) * ph;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * view.max);
  const first = Math.ceil(view.start - 0.001);

  function onMove(e: React.PointerEvent) {
    const r = svg.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * TW;
    const i = Math.round(view.start + ((px - TM.l) / pw) * (n - 1 - view.start));
    setHover(Math.max(first, Math.min(n - 1, i)));
  }

  return (
    <figure className="chart trend">
      <div className="trend-head">
        <div className="trend-keys" role="group" aria-label="Accounts on the chart">
          {lines.map((l) => (
            <button
              key={l.id}
              type="button"
              className="trend-key"
              aria-pressed={!off.has(l.id)}
              onPointerEnter={() => setHot(l.id)}
              onPointerLeave={() => setHot(null)}
              onClick={() => {
                const next = new Set(off);
                if (next.has(l.id)) next.delete(l.id);
                else if (next.size < lines.length - 1) next.add(l.id);
                setOff(next);
              }}
            >
              <i style={{ background: PLATFORM_COLOR[l.id] }} />
              {l.name}
              <b>{compact(l.points[at ?? n - 1] ?? 0)}</b>
            </button>
          ))}
        </div>
        {expanded ? null : (
          <button className="link-btn small" type="button" onClick={() => setBig(true)}>
            Expand
          </button>
        )}
      </div>
      <div className="chart-plot">
        <svg ref={svg} viewBox={"0 0 " + TW + " " + TH} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => setPin(pin === hover ? null : hover)}>
          <defs>
            <clipPath id="trend-clip">
              <rect x={TM.l} y={0} width={pw + 6} height={TH - TM.b + 1} />
            </clipPath>
            {lines.map((l) => (
              <linearGradient key={l.id} id={"trend-fill-" + l.id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PLATFORM_COLOR[l.id]} stopOpacity=".30" />
                <stop offset="1" stopColor={PLATFORM_COLOR[l.id]} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={TM.l} x2={TW - TM.r} y1={y(t)} y2={y(t)} className={i === 0 ? "chart-axis" : "chart-grid"} />
              <text x={TM.l - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">
                {compact(Math.round(t))}
              </text>
            </g>
          ))}
          {labels.map((lab, i) =>
            i >= first && (span <= 6 || (n - 1 - i) % 2 === 0) ? (
              <text key={lab} x={x(i)} y={TH - TM.b + 19} textAnchor="middle" className="chart-tick">
                {lab}
              </text>
            ) : null,
          )}
          {labels.map((lab, i) => (i >= first ? <line key={"step" + lab} x1={x(i)} x2={x(i)} y1={TH - TM.b} y2={TH - TM.b + 5} className="chart-axis" /> : null))}
          <text x={TM.l + pw / 2} y={TH - 6} textAnchor="middle" className="chart-axis-title">
            Week starting
          </text>
          <text transform="rotate(-90)" x={-(TM.t + ph / 2)} y={14} textAnchor="middle" className="chart-axis-title">
            {cap(unit)}
          </text>
          <g clipPath="url(#trend-clip)">
            {shown.map((l) => {
              const pts = l.points.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1));
              const cls = hot ? (hot === l.id ? "is-hot" : "is-dim") : "";
              return (
                <g key={l.id} className={cls}>
                  <path className="t-area" d={"M" + pts.join(" L") + " L" + x(n - 1).toFixed(1) + "," + y(0) + " L" + x(0).toFixed(1) + "," + y(0) + " Z"} fill={"url(#trend-fill-" + l.id + ")"} />
                  <polyline className="t-line" stroke={PLATFORM_COLOR[l.id]} points={pts.join(" ")} />
                  {l.points.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={PLATFORM_COLOR[l.id]} className="chart-pt" />
                  ))}
                  {at != null ? <circle cx={x(at)} cy={y(l.points[at] ?? 0)} r="5" fill={PLATFORM_COLOR[l.id]} className="chart-dot" /> : <circle cx={x(n - 1)} cy={y(l.points[n - 1] ?? 0)} r="4.5" fill={PLATFORM_COLOR[l.id]} className="chart-dot" />}
                </g>
              );
            })}
            {at != null ? <line x1={x(at)} x2={x(at)} y1={TM.t} y2={TH - TM.b} className="chart-cross" /> : null}
          </g>
        </svg>
        {at != null ? (
          <div className="chart-tip" style={{ left: (x(at) / TW) * 100 + "%" }} data-side={x(at) > TW / 2 ? "left" : "right"} role="status">
            <strong>{"Week of " + labels[at]}</strong>
            {shown
              .slice()
              .sort((a, b) => (b.points[at] ?? 0) - (a.points[at] ?? 0))
              .map((l) => (
                <span key={l.id}>
                  <span className="chart-key" style={{ background: PLATFORM_COLOR[l.id] }} />
                  {l.name}
                  <b>{(l.points[at] ?? 0).toLocaleString("en-US")}</b>
                </span>
              ))}
            <small>{unit}</small>
          </div>
        ) : null}
      </div>
      <ChartStats lines={shown} labels={labels} from={targetStart} />
      {expanded ? null : <p className="chart-hint">Move across the chart for each week, click a week to hold it, and click an account to hide or show its line.</p>}
      {big ? (
        <VizDialog title={title} onClose={() => setBig(false)}>
          <TrendChart lines={lines} labels={labels} span={span} title={title} unit={unit} expanded />
        </VizDialog>
      ) : null}
    </figure>
  );
}
