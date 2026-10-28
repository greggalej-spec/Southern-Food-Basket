import "../globals.css";
import { fontVars } from "@/lib/fonts";
import { baseMetadata, baseViewport } from "@/lib/site-meta";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm";

// Root layout for every page except the home. Navigating between the two root layouts is a full page load,
// which is what the static site did; it also keeps each document on its own stylesheets.
export const metadata = baseMetadata;
export const viewport = baseViewport;

export default function SiteRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVars}>
      <body>
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster />
      </body>
    </html>
  );
}
