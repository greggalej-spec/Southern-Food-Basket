"use client";

import "@/styles/storefront.css";
import Link from "next/link";
import { Fit } from "@/components/fit";
import { useToday } from "@/components/use-today";
import { eventState } from "@/lib/ops/events";
import { useData } from "@/lib/store";

/* Small client pieces for the home page: the arrows that scroll a row of cards, and the careers band's poster. */

const ARROW = (d: string) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Previous and next buttons for a sideways row of cards (the element with id `target`). */
export function RailButtons({ target, label }: { target: string; label: string }) {
  const go = (dir: number) => {
    const el = document.getElementById(target);
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className="shelf-controls rail-controls" role="group" aria-label={"Scroll the " + label}>
      <button className="round" type="button" aria-label={"Previous " + label} onClick={() => go(-1)}>
        {ARROW("M15 6l-6 6 6 6")}
      </button>
      <button className="round" type="button" aria-label={"More " + label} onClick={() => go(1)}>
        {ARROW("M9 6l6 6-6 6")}
      </button>
    </div>
  );
}

/** The careers band's picture: the vacancy poster marketing has posted (an event that points at /careers and has a
 *  picture), while it is open. Nothing when there is none. */
export function HiringPoster() {
  const d = useData();
  const today = useToday();
  const e = (d.events || []).find((x) => x.img && x.href === "/careers" && eventState(x, today || x.from) !== "past");
  if (!e) return null;
  return (
    <Link className="hire-poster" href={"/events#" + e.id} aria-label={e.title + ": see the details"}>
      <Fit src={e.img as string} alt={e.title} />
    </Link>
  );
}
