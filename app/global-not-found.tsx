import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { fontVars } from "@/lib/fonts";

export const metadata: Metadata = { title: "Page not found · Southern Food Basket", robots: { index: false } };

// Unmatched URLs skip both root layouts, so this page brings its own document, styles and fonts.
export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <main className="container section">
          <p className="eyebrow">Page not found</p>
          <h1>That page isn’t on the shelf.</h1>
          <p className="lede">The link may be old, or the page may have moved.</p>
          <p className="cluster">
            <Link className="btn btn-primary" href="/">Go to the home page</Link>
            <Link className="btn btn-ghost" href="/specials">See this week’s specials</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
