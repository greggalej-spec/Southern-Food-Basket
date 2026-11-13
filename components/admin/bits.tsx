"use client";

import { toast } from "@/components/ui/sonner";
import { Icon, type IconName } from "@/components/icon";
import { useState } from "react";
import { CountUp, Ring, Spark, VizDialog } from "@/components/viz";
import { attempt } from "@/lib/admin/guard";
import type { Session } from "@/lib/types";

// Small pieces the newer console sections share: a figure tile, a segmented filter, and
// the one-line way to run a write (refusals become a toast and a line in the audit log).

/** Runs a write. Returns true when it went through; a refusal shows its reason and is logged. */
export function act(s: Session | null, action: string, target: string, fn: () => unknown, done?: string) {
  const r = attempt(s, action, target, fn);
  if (!r.ok) {
    toast(r.message, "bad");
    return false;
  }
  if (done) toast(done, "ok");
  return true;
}

/** A figure card: an icon, the number (it counts up), two or three words, and optionally one small picture of it:
 *  a sparkline, a ring (a share of a whole) or a bar. `sub` is the one line under it; keep it short. The whole card
 *  is a button: click it (or press Enter) and it opens large, with the picture drawn big and the figures behind it
 *  spelled out. */
export function Stat({
  label,
  value,
  sub,
  tone,
  icon = "chart",
  spark,
  ring,
  bar,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "warn" | "bad" | "ok" | "pink";
  icon?: IconName;
  spark?: number[];
  ring?: { value: number; of: number };
  bar?: { value: number; of: number };
}) {
  const [open, setOpen] = useState(false);
  const part = ring || bar;
  const sparkColor = tone === "pink" || tone === "ok" ? "#FFFFFF" : tone === "warn" ? "#20141A" : "var(--bar, #1D6B35)";
  return (
    <>
      <div
        className={"kpi" + (tone ? " is-" + tone : "")}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        title="Open this figure"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          setOpen(true);
        }}
      >
        <span className="kpi-icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <span className="kpi-more" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
          </svg>
        </span>
        <div className="kpi-value">{typeof value === "number" ? <CountUp value={value} /> : value}</div>
        <div className="kpi-label">{label}</div>
        {spark || ring ? (
          <div className="kpi-visual">
            {ring ? <Ring value={ring.value} of={Math.max(ring.of, 1)} label={label} tone={tone === "pink" ? "clay" : tone === "warn" ? "gold" : "green"} size={76} interactive={false} /> : spark ? <Spark points={spark} label={label + ", recent weeks"} color={sparkColor} /> : null}
          </div>
        ) : null}
        {bar ? (
          <div className="kpi-bar" role="img" aria-label={bar.value + " of " + bar.of}>
            <span style={{ width: Math.max(2, Math.min(100, (bar.value / Math.max(bar.of, 1)) * 100)) + "%" }} />
          </div>
        ) : null}
        {sub ? <div className="kpi-hint">{sub}</div> : null}
      </div>
      {open ? (
        <VizDialog title={label} onClose={() => setOpen(false)}>
          <div className="viz-split">
            <div>
              <div className="viz-big num">{typeof value === "number" ? value.toLocaleString("en-US") : value}</div>
              {sub ? <p className="viz-sub">{sub}</p> : null}
            </div>
            {ring ? <Ring value={ring.value} of={Math.max(ring.of, 1)} label={label} tone="green" size={168} /> : null}
          </div>
          {bar ? (
            <div className="viz-bar" role="img" aria-label={bar.value + " of " + bar.of}>
              <span style={{ width: Math.max(2, Math.min(100, (bar.value / Math.max(bar.of, 1)) * 100)) + "%" }} />
            </div>
          ) : null}
          {part ? (
            <ul className="viz-facts">
              <li>
                <span>Counted</span>
                <b className="num">{part.value.toLocaleString("en-US")}</b>
              </li>
              <li>
                <span>Out of</span>
                <b className="num">{part.of.toLocaleString("en-US")}</b>
              </li>
              <li>
                <span>Share</span>
                <b className="num">{(part.of ? Math.round((part.value / part.of) * 100) : 0) + "%"}</b>
              </li>
              <li>
                <span>Still to go</span>
                <b className="num">{Math.max(0, part.of - part.value).toLocaleString("en-US")}</b>
              </li>
            </ul>
          ) : null}
          {spark && spark.length > 1 ? (
            <>
              <Spark points={spark} label={label + ", recent weeks"} color="var(--bar, #1D6B35)" />
              <ul className="viz-facts">
                <li>
                  <span>This week</span>
                  <b className="num">{spark[spark.length - 1].toLocaleString("en-US")}</b>
                </li>
                <li>
                  <span>Highest</span>
                  <b className="num">{Math.max(...spark).toLocaleString("en-US")}</b>
                </li>
                <li>
                  <span>Lowest</span>
                  <b className="num">{Math.min(...spark).toLocaleString("en-US")}</b>
                </li>
                <li>
                  <span>Average</span>
                  <b className="num">{Math.round(spark.reduce((a, v) => a + v, 0) / spark.length).toLocaleString("en-US")}</b>
                </li>
                <li>
                  <span>{"Since " + (spark.length - 1) + " weeks ago"}</span>
                  <b className="num">{spark[0] ? (spark[spark.length - 1] >= spark[0] ? "▲ " : "▼ ") + Math.round((Math.abs(spark[spark.length - 1] - spark[0]) / spark[0]) * 100) + "%" : "n/a"}</b>
                </li>
              </ul>
              <p className="chart-hint">Move along the line, or use the arrow keys, for each week.</p>
            </>
          ) : null}
          {!part && !spark ? <p className="viz-sub">A live count. It moves as the work is done; nothing here is typed in by hand.</p> : null}
        </VizDialog>
      ) : null}
    </>
  );
}

/** A row of toggle buttons that picks one view or filter. */
export function Seg<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className="btn btn-ghost btn-sm" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.label}
          {o.count != null ? <span className="num seg-count">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** "+12%" in words a reader cannot misread: up 12%, down 4%, or level. */
export function Change({ value }: { value: number | null }) {
  if (value == null) return null;
  const pct = Math.round(Math.abs(value) * 100);
  const dir = pct === 0 ? "level" : value > 0 ? "up" : "down";
  return (
    <span className={"delta delta-" + dir}>
      {dir === "level" ? "Level" : (dir === "up" ? "▲ " : "▼ ") + pct + "%"}
      <span className="visually-hidden">{dir === "level" ? " with the period before" : dir === "up" ? " up on the period before" : " down on the period before"}</span>
    </span>
  );
}

/** Offers a file the page made itself (a CSV) as a download. */
export function download(name: string, text: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One CSV line. Every cell is quoted, and a cell a spreadsheet would run as a formula is defused with a leading
 *  apostrophe, as the mailing-list export does. */
export function csvRow(cells: (string | number | null | undefined)[]) {
  return cells
    .map((c) => {
      let v = c == null ? "" : String(c);
      if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = "'" + v;
      return '"' + v.replace(/"/g, '""') + '"';
    })
    .join(",");
}
