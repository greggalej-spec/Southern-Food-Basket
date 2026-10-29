import "../../styles/home.css";
import { fontVars } from "@/lib/fonts";
import { baseMetadata, baseViewport } from "@/lib/site-meta";

// The Grand Entrance is its own document, as it was in the static site: no Tailwind, no preflight, only
// styles/home.css (scoped under .ge-root on <body>).
export const metadata = baseMetadata;
export const viewport = baseViewport;

// Runs before first paint so html:not(.js) rules only ever apply without JavaScript. Fixed string, no input.
const JS_CLASS = "document.documentElement.classList.add('js')";

export default function HomeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- fixed string above, no input */}
        <script dangerouslySetInnerHTML={{ __html: JS_CLASS }} />
      </head>
      <body className="ge-root">{children}</body>
    </html>
  );
}
