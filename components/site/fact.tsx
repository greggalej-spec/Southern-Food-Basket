import type { Sourced } from "@/lib/types";

/** A sourced fact and where it came from (site.js factItem), on the about and wholesale pages. */
export function FactItem({ f }: { f: Sourced }) {
  return (
    <li className="fact">
      <p>{f.text}</p>
      <span className="fact-src">{"Source: " + f.source}</span>
    </li>
  );
}
