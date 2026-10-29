import { Alfa_Slab_One, Atkinson_Hyperlegible_Next, Caprasimo } from "next/font/google";

// DESIGN.md: Caprasimo for display, Atkinson Hyperlegible Next for everything you read, Alfa Slab One for prices only.
// The variables feed --display, --ui and --price (--slab on the home) in the ported stylesheets.
const caprasimo = Caprasimo({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-caprasimo" });
// next/font has no metrics for this face, so no size-adjusted fallback. Naming the fallbacks (the same ones --ui lists)
// is what stops Turbopack looking for metrics and warning on every build; adjustFontFallback: false alone does not.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-atkinson",
  adjustFontFallback: false,
  fallback: ["Atkinson Hyperlegible", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
});
const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-alfa" });

export const fontVars = `${caprasimo.variable} ${atkinson.variable} ${alfa.variable}`;
