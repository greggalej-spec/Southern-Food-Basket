import type { NextConfig } from "next";

// A job id from the old ?id= query, slug characters only, so nothing else is copied into a path.
const JOB_ID = { type: "query", key: "id", value: "(?<id>[a-z0-9-]+)" } as const;

// The static site's .html addresses, which shared links and the option pages' history still use. Temporary (307), so
// pointing the alias back at the static site stays possible. The query string passes through, so ?dept= and ?next= keep
// working.
const OLD_PAGES = [
  ["/index.html", "/"],
  ["/about.html", "/about"],
  ["/departments.html", "/departments"],
  ["/locations.html", "/locations"],
  ["/specials.html", "/specials"],
  ["/wholesale.html", "/wholesale"],
  ["/careers/index.html", "/careers"],
  ["/careers/me.html", "/careers/me"],
  ["/hr/index.html", "/hr"],
  ["/admin/index.html", "/admin"],
  ["/portal/index.html", "/portal"],
  ["/portal/:page(home|schedule|leave|pay|docs|profile).html", "/portal/:page"],
  // A role page without a usable ?id= goes to the list, as careers.js did when the id matched no job.
  ["/careers/job.html", "/careers"],
  ["/careers/apply.html", "/careers"],
  // The three alternative home designs are retired; their old links land on the one home.
  ["/options/:path*", "/"],
  // Members' offers and Wholesale left the public site on 2026-11-13 (Gregg: the members' money-off is not a real
  // offer, and the wholesale tab goes). The pages stay in the code, unlinked, behind these redirects.
  ["/offers", "/events"],
  ["/offers/:slug", "/events"],
  ["/wholesale", "/"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/careers/job.html", has: [JOB_ID], destination: "/careers/:id", permanent: false },
      { source: "/careers/apply.html", has: [JOB_ID], destination: "/careers/:id/apply", permanent: false },
      ...OLD_PAGES.map(([source, destination]) => ({ source, destination, permanent: false })),
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Two root layouts (home and everything else), so the 404 for unmatched URLs is app/global-not-found.tsx.
  experimental: { globalNotFound: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
