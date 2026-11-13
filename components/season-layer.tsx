"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Confetti } from "@/components/season/confetti";
import { Sleigh } from "@/components/season/sleigh";
import { Snow } from "@/components/season/snow";
import { activeSeason } from "@/lib/ops/site";
import { ART, artUri } from "@/lib/season-art";
import { KITS, KIT_VARS } from "@/lib/season-kits";
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
const SEASON_IDS: SeasonId[] = ["none", "christmas", "divali", "carnival", "easter", "newyear", "valentine", "mothers", "fathers", "independence", "republic", "eid"];

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

type Gift = { id: string; src: string; label: string };
const C = ART.carnival, E = ART.easter;
/** The three things in the corner that answer a touch, per season. */
const GIFTS: Partial<Record<SeasonId, Gift[]>> = {
  christmas: [
    { id: "present", src: U.present, label: "Shake the present" },
    { id: "stocking", src: U.stocking, label: "Shake the stocking" },
    { id: "ginger", src: U.ginger, label: "Wave at the gingerbread man" },
  ],
  carnival: [
    { id: "pan", src: artUri(C.pan), label: "Play the steelpan" },
    { id: "shak", src: artUri(C.shak), label: "Shake the shak-shak" },
    { id: "mask", src: artUri(C.mask), label: "Tap the mask" },
  ],
  easter: [
    { id: "egg", src: artUri(E.egg), label: "Tap the egg" },
    { id: "bunny", src: artUri(E.bunny), label: "Pat the bunny" },
    { id: "chick", src: artUri(E.chick), label: "Wake the chick" },
  ],
};
/** Carnival and Easter hand their ornament to the stylesheet as the shared season variables. */
const ORNAMENT: Partial<Record<SeasonId, { mark: string; seal: string; lights: string }>> = {
  carnival: { mark: artUri(C.mask), seal: artUri(C.feather), lights: artUri(C.flags) },
  easter: { mark: artUri(E.egg), seal: artUri(E.chick), lights: artUri(E.eggs) },
};
const KITE = artUri(E.kite);
/** What falls over the page for the two seasons drawn in lib/season-art.ts; the kits carry their own. */
const FALLING: Partial<Record<SeasonId, { colours: readonly string[]; petal?: boolean }>> = {
  carnival: { colours: ["#E3336F", "#2F918A", "#FFD21A", "#8E1556", "#F26A2E", "#FFFFFF"] },
  easter: { colours: ["#F4A6C0", "#FFFFFF", "#FFE9A8", "#BFE3F4", "#F9C9DA"], petal: true },
};

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
    // a kit season (lib/season-kits.ts) brings its colours as variables, on <html> and on the home page's <body>
    const kit = KITS[season];
    KIT_VARS.forEach((k) => { root.style.removeProperty(k); document.body.style.removeProperty(k); });
    if (kit) {
      root.dataset.seasonKit = "1";
      Object.entries(kit.vars).forEach(([k, v]) => { root.style.setProperty(k, v); document.body.style.setProperty(k, v); });
    } else delete root.dataset.seasonKit;
    const orn = ORNAMENT[season] || (kit ? { mark: kit.mark, seal: kit.seal, lights: kit.strip } : undefined);
    const set = (k: string, v: string | null) => (v ? root.style.setProperty(k, v) : root.style.removeProperty(k));
    set("--season-mark", orn ? 'url("' + orn.mark + '")' : null);
    set("--season-seal", orn ? 'url("' + orn.seal + '")' : null);
    set("--season-lights-a", orn ? 'url("' + orn.lights + '")' : null);
    set("--season-lights-b", orn ? "none" : null);
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

  const gifts = GIFTS[season] || KITS[season]?.gifts;
  const falling = FALLING[season] || KITS[season]?.falling;
  if (!hasStrip && !xmas && !gifts) return null;
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

      {falling && lights ? <Confetti colours={falling.colours} petal={falling.petal} /> : null}

      {season === "easter" && path === "/" ? (
        <div className="season-kites" aria-hidden="true">
          <img src={KITE} alt="" width="64" height="64" />
          <img src={KITE} alt="" width="46" height="46" />
          <img src={KITE} alt="" width="54" height="54" />
        </div>
      ) : null}

      {gifts ? (
        <div className={"season-gifts is-" + season} key={season}>
          {gifts.map((g) => (
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
