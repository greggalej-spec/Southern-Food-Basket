"use client";

import { createContext, useContext, useState } from "react";

// Stands in for the static site's <body data-…>: it names the stylesheets a page loaded (data-css, matched by the
// :where([data-css~="…"]) prefixes in styles/*.css) and carries data-page. Dialogs and sheets portal into it, so
// their contents get the same page CSS.
// It must stay a real box (no display: contents): on navigation Next scrolls the new page's first element into view
// and skips boxless ones, so a boxless Scope left each new page at the previous page's scroll position.
// undefined = no Scope above (Base UI falls back to document.body); null = Scope not mounted yet (Base UI waits).
const ScopeContext = createContext<HTMLElement | null | undefined>(undefined);

export type CssName = "site" | "app" | "careers" | "portal" | "admin";

export function Scope({ css, page, children }: { css: CssName[]; page?: string; children: React.ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setNode} data-css={css.join(" ")} data-page={page}>
      <ScopeContext.Provider value={node}>{children}</ScopeContext.Provider>
    </div>
  );
}

/** Portal container for shadcn popups: the nearest Scope, or undefined (document.body) outside one. */
export function usePortalContainer() {
  return useContext(ScopeContext);
}
