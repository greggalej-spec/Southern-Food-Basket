import "../globals.css";
import { fontVars } from "@/lib/fonts";
import { baseMetadata, baseViewport } from "@/lib/site-meta";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm";
import { FeedbackButton } from "@/components/feedback-button";
import { SeasonLayer } from "@/components/season-layer";
import { TourHost } from "@/components/tour/tour-host";

// Root layout for every page except the home. Navigating between the two root layouts is a full page load,
// which is what the static site did; it also keeps each document on its own stylesheets.
// data-scroll-behavior tells Next that tokens.css makes <html> scroll smoothly, so it jumps to the top on a page change
// instead of easing there from the old position. In-page hash links stay smooth.
export const metadata = baseMetadata;
export const viewport = baseViewport;

export default function SiteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars} data-scroll-behavior="smooth">
      <body>
        <SeasonLayer />
        <ConfirmProvider>{children}</ConfirmProvider>
        <FeedbackButton />
        <Toaster />
        <TourHost />
      </body>
    </html>
  );
}
