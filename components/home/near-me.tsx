"use client";

import "@/styles/storefront.css";
import { useState } from "react";

/* "A store near me": one button that asks the browser where the visitor is, then marks the nearest store and writes
   the distance on every store card. The position never leaves the browser: it is used once, here, and not stored.
   The cards belong to the page (server-rendered), so this fills the <span data-km="<store id>"> each card carries
   and sets .is-nearest on the element with id `prefix + <store id>`. */

type Place = { id: string; name: string; lat: number; lng: number };

/** Straight-line distance in km (haversine). */
function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const rad = Math.PI / 180, dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function NearMe({ places, prefix = "store-" }: { places: Place[]; prefix?: string }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const find = () => {
    if (!("geolocation" in navigator)) {
      setMsg("This browser cannot share a location. The five stores are listed below.");
      return;
    }
    setBusy(true);
    setMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ranked = places
          .map((p) => ({ ...p, d: km(pos.coords.latitude, pos.coords.longitude, p.lat, p.lng) }))
          .sort((a, b) => a.d - b.d);
        ranked.forEach((p, i) => {
          const tag = document.querySelector<HTMLElement>('[data-km="' + p.id + '"]');
          if (tag) {
            tag.textContent = (i === 0 ? "Nearest to you · " : "") + (p.d < 10 ? p.d.toFixed(1) : Math.round(p.d)) + " km";
            tag.classList.add("is-on");
          }
          document.getElementById(prefix + p.id)?.classList.toggle("is-nearest", i === 0);
        });
        const first = ranked[0];
        setBusy(false);
        setMsg("Your nearest store is " + first.name + ", about " + (first.d < 10 ? first.d.toFixed(1) : Math.round(first.d)) + " km away.");
        document.getElementById(prefix + first.id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      },
      () => {
        setBusy(false);
        setMsg("We could not get your location. Pick your store from the map or the list.");
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <div className="near-me">
      <button className="btn btn-sign" type="button" onClick={find} disabled={busy}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3.2" fill="currentColor" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        Use my location
      </button>
      <p role="status">{msg}</p>
    </div>
  );
}
