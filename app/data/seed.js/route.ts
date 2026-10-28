import { SEED } from "@/lib/seed";

// The design options in public/options/ are the static pages as they were, and read the seed from this script as
// window.SFB_DATA. It is built from lib/seed.ts so the seed has one copy; their image paths stay relative to the site
// root, as in the old data/seed.js. Prerendered at build time: it reads nothing from the request.
export async function GET() {
  const json = JSON.stringify(SEED).replaceAll('"/assets/', '"assets/');
  return new Response("window.SFB_DATA = " + json + ";\n", {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
}
