"use client";

import { useLayoutEffect, useRef } from "react";

// Becomes true once the first page of this visit has drawn. The first page arrives without a fade (the server
// already painted it); every page after that is a navigation inside the site and fades up. Each page body is
// marked once: effects that run again on the same element (React's development double run, or Next bringing a
// kept page back on Back and Forward) do not replay the fade.
let settled = false;
const seen = new WeakSet<Element>();

/** The page body's arrival on navigation: the new <main> fades up while the header and footer around it hold
 *  still (styles/motion.css, .page-turn). A layout effect, so the class is on before the first paint and nothing
 *  flashes. The wrapper is boxless (display: contents), so it changes no layout. React's <ViewTransition> was tried
 *  first and did not start on this app's navigations, which keep the previous pages in hidden Activity trees. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || seen.has(el)) return;
    seen.add(el);
    if (settled) el.classList.add("is-new");
    settled = true;
  }, []);
  return (
    <div className="page-turn" ref={ref}>
      {children}
    </div>
  );
}
