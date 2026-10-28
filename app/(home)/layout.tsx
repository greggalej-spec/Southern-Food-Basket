import "../../styles/home.css";
import { fontVars } from "@/lib/fonts";
import { baseMetadata, baseViewport } from "@/lib/site-meta";

// The Grand Entrance is its own document, as it was in the static site: no Tailwind, no preflight, only
// styles/home.css (scoped under .ge-root on <body>) and the design switcher.
export const metadata = baseMetadata;
export const viewport = baseViewport;

// Runs before first paint so html:not(.js) rules only ever apply without JavaScript. Fixed string, no input.
const JS_CLASS = "document.documentElement.classList.add('js')";

export default function HomeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_CLASS }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- the same file the static option pages load from public/ */}
        <link rel="stylesheet" href="/assets/options-nav/options-nav.css" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- the switcher reads document.currentScript, as before */}
        <script src="/assets/options-nav/options-nav.js" data-option="d" data-root="/" />
      </head>
      <body className="ge-root">{children}</body>
    </html>
  );
}
