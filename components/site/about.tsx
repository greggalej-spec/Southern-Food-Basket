"use client";

import { FactItem } from "@/components/site/fact";
import { useData } from "@/lib/store";

// The two lists site.js about() filled in, from this browser's copy of the data (the seed until hydration).

export function AboutValues() {
  return (useData().content.values || []).map((v, i) => (
    <article className="value-card" key={i}>
      <h3>{v.title}</h3>
      <p>{v.text}</p>
    </article>
  ));
}

export function AboutFacts() {
  return (useData().content.facts || []).map((f, i) => <FactItem f={f} key={i} />);
}
