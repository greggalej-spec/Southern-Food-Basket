"use client";

import { FactItem } from "@/components/site/fact";
import { useData } from "@/lib/store";

// The about page's lists, from this browser's copy of the data (the seed until hydration).

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** One drawing per promise, in the order the seed lists them: fresh, value, the south, community. */
const ICONS = [
  <path key="leaf" {...stroke} d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14Zm0 0 7-7" />,
  <g key="tag" {...stroke}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="8" cy="9" r="1.6" />
  </g>,
  <g key="pin" {...stroke}>
    <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </g>,
  <path key="heart" {...stroke} d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />,
];

export function AboutValues() {
  return (useData().content.values || []).map((v, i) => (
    <article className="sf-card sf-value" key={i}>
      <div className="sf-value-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          {ICONS[i % ICONS.length]}
        </svg>
      </div>
      <h3>{v.title}</h3>
      <p>{v.text}</p>
    </article>
  ));
}

export function AboutFacts() {
  return (useData().content.facts || []).map((f, i) => <FactItem f={f} key={i} />);
}
