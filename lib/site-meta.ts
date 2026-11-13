import type { Metadata, Viewport } from "next";

// Shared by both root layouts and the global 404. Every page stays out of search: it is an prototype.
export const baseMetadata: Metadata = {
  title: { template: "%s · Southern Food Basket", default: "Southern Food Basket" },
  robots: { index: false },
  icons: {
    icon: { url: "/assets/img/favicon-64.png", type: "image/png" },
    apple: "/assets/img/apple-touch-icon.png",
  },
};

export const baseViewport: Viewport = { themeColor: "#1D6B35" };
