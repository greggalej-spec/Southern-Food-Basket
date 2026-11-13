"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Sleigh } from "@/components/season/sleigh";
import { Snow } from "@/components/season/snow";
import { activeSeason } from "@/lib/ops/site";
import { ART, artUri } from "@/lib/season-art";
import { useData, useHydrated } from "@/lib/store";
import type { SeasonId } from "@/lib/types";

/* Dresses the public pages in whatever the website studio has set: the season (a data-season attribute that
   styles/season.css answers to), the strip above the header (the notice and the season's greeting), and the home
   page bands that are switched off. Staff screens are never dressed: the season is for shoppers.

   Christmas brings its own moving parts, drawn in lib/season-art.ts: snow falling over every public page, Santa's
   sleigh crossing the sky on the front page, and three gifts in the corner that shake when touched. All of it is
   decoration: hidden from screen readers, never in the way of a click, and still under "reduce motion".

   The studio previews a look without saving it by adding ?season=christmas (and &lights=0, &greeting=…) to a page's
   address; this reads those too. Mounted once in each root layout. */

const STAFF = /^\/(admin|hr|portal|outbox|tour|how-it-works)(\/|$)|^\/careers\/me/;
const SEASON_IDS: SeasonId[] = ["none", "christmas", "divali"];

// The clock is read once, in the browser. The server render (and the prerender) sees 0 and dresses nothing.
let clientNow = 0;
const readNow = () => (clientNow ||= Date.now());
const noSubscribe = () => () => {};

function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
}

const X = ART.christmas;
const U = { cane: artUri(X.cane), ginger: artUri(X.ginger), reindeer: artUri(X.reindeer), present: artUri(X.present), stocking: artUri(X.stocking), hat: artUri(X.hat) };

const GIFTS = [
  { id: "present", src: U.present, label: "Shake the present" },
  { id: "stocking", src: U.stocking, label: "Shake the stocking" },
  { id: "ginger", src: U.ginger, label: "Wave at the gingerbread man" },
];

export function SeasonLayer() {
  const d = useData();
  const hydrated = useHydrated();
  const path = usePathname() || "/";
  const search = useSyncExternalStore(subscribeUrl, () => location.search, () => "");
  const now = useSyncExternalStore(noSubscribe, readNow, () => 0);
  const strip = useRef<HTMLDivElement>(null);
  const [shaken, setShaken] = useState<string | null>(null);

  const q = new URLSearchParams(search);
  const asked = q.get("season") as SeasonId | null;
  const preview = asked && SEASON_IDS.includes(asked) ? asked : null;
  const staff = STAFF.test(path);
  const site = d.site;
  const season: SeasonId = !hydrated || staff ? "none" : preview || activeSeason(site, now);
  const lights = preview ? q.get("lights") !== "0" : site?.season.lights !== false;
  const greeting = season === "none" ? "" : preview && q.has("greeting") ? q.get("greeting") || "" : site?.season.greeting || "";
  const notice = hydrated && !staff && site?.notice.on && site.notice.text ? site.notice : null;
  const hidden = hydrated && !staff ? (site?.hiddenBands || []).join(" ") : "";
  const hasStrip = !!notice || !!greeting;
  const xmas = season === "christmas";

  useEffect(() => {
    const root = document.documentElement;
    if (season === "none") delete root.dataset.season;
    else root.dataset.season = season;
    if (lights) delete root.dataset.lights;
    else root.dataset.lights = "0";
    if (hidden) root.dataset.hide = hidden;
    else delete root.dataset.hide;
    // The stylesheet places these on cards, headings and the footer.
    const vars: [string, string][] = [["--xmas-cane", U.cane], ["--xmas-ginger", U.ginger], ["--xmas-reindeer", U.reindeer], ["--xmas-present", U.present], ["--xmas-stocking", U.stocking], ["--xmas-hat", U.hat]];
    vars.forEach(([k, v]) => (season === "christmas" ? root.style.setProperty(k, 'url("' + v + '")') : root.style.removeProperty(k)));
  }, [season, lights, hidden]);

  // The strip is fixed above the header; the page makes room for however tall it turns out to be.
  useEffect(() => {
    const root = document.documentElement;
    const el = strip.current;
    if (!el) {
      root.style.removeProperty("--site-top");
      return;
    }
    const set = () => root.style.setProperty("--site-top", el.offsetHeight + "px");
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--site-top");
    };
  }, [hasStrip]);

  function shake(id: string) {
    setShaken(id);
    setTimeout(() => setShaken((cur) => (cur === id ? null : cur)), 900);
  }

  if (!hasStrip && !xmas) return null;
  return (
    <>
      {hasStrip ? (
        <div className="site-top" ref={strip}>
          {notice ? (
            <p className="site-notice" role="status">
              <span>{notice.text}</span>
              {notice.href && notice.linkLabel ? <Link href={notice.href}>{notice.linkLabel}</Link> : null}
            </p>
          ) : null}
          {greeting ? (
            <p className={"site-greeting" + (xmas ? " is-xmas" : "")}>
              {xmas ? (
                <span className="greet-art" aria-hidden="true">
                  <img src={U.reindeer} alt="" width="26" height="26" />
                  <img src={U.cane} alt="" width="22" height="22" />
                </span>
              ) : null}
              <span>{greeting}</span>
              {xmas ? (
                <span className="greet-art" aria-hidden="true">
                  <img src={U.present} alt="" width="22" height="22" />
                  <img src={U.stocking} alt="" width="24" height="24" />
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {xmas && lights ? <Snow /> : null}

      {xmas && path === "/" ? <Sleigh /> : null}

      {xmas ? (
        <div className="season-gifts">
          {GIFTS.map((g) => (
            <button key={g.id} type="button" className={shaken === g.id ? "is-shaken" : undefined} aria-label={g.label} onClick={() => shake(g.id)}>
              <img src={g.src} alt="" width="44" height="44" />
              <span className="gift-burst" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <i key={n} style={{ ["--a" as string]: n * 60 + "deg" } as React.CSSProperties} />
                ))}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
