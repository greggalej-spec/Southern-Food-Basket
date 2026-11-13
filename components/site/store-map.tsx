"use client";

import "leaflet/dist/leaflet.css";
import "@/styles/public-extras.css";
import { useEffect, useRef, useState } from "react";
import { mapsDir, telHref, todayHours } from "@/lib/format";
import { useData } from "@/lib/store";
import type { Branch } from "@/lib/types";

/* The store map: a real map of Trinidad with the five stores pinned where their Google Maps listings put them.
   Leaflet draws it over OpenStreetMap tiles, so it needs no account or key in the prototype (a production site
   would take its tiles from a paid provider, or swap this for Google Maps using the place IDs already in the data).
   The buttons beside the map fly to a store and open its card; "Whole island" pulls back out. The wheel only zooms
   after a click, so the map never traps a scrolling page. Everything in a pin's card is set as text, never markup. */

type Leaflet = typeof import("leaflet");

/** Trinidad, corner to corner: what the full map shows when it opens, so the island is the picture and the stores sit on it. */
const ISLAND: [[number, number], [number, number]] = [
  [10.03, -61.95],
  [10.86, -60.9],
];

function card(b: Branch) {
  const el = document.createElement("div");
  el.className = "map-card";
  const add = (tag: string, text: string, cls?: string) => {
    const n = document.createElement(tag);
    n.textContent = text;
    if (cls) n.className = cls;
    el.appendChild(n);
    return n;
  };
  add("strong", b.name);
  add("span", b.address);
  add("span", "Today: " + todayHours(b, new Date()), "map-hours");
  const row = document.createElement("div");
  row.className = "map-links";
  const dir = document.createElement("a");
  dir.href = mapsDir(b);
  dir.target = "_blank";
  dir.rel = "noopener";
  dir.textContent = "Directions";
  const tel = document.createElement("a");
  tel.href = telHref(b.phone);
  tel.textContent = "Call";
  row.append(dir, tel);
  el.appendChild(row);
  return el;
}

export function StoreMap({ compact = false, id }: { compact?: boolean; id?: string }) {
  const d = useData();
  const box = useRef<HTMLDivElement>(null);
  const api = useRef<{ fly: (bid: string | null) => void } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const branches = d.branches.filter((b) => typeof b.lat === "number");
  const key = branches.map((b) => b.id + b.lat + b.lng).join("|");

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let dead = false;
    (async () => {
      const L: Leaflet = (await import("leaflet")).default;
      if (dead || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false, zoomControl: !compact, attributionControl: true, zoomSnap: 0.25 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      // The full map opens on the whole island. The small one (home and About) opens on the five stores: at island
      // scale in that box the pins would sit on top of each other.
      const bounds = compact ? L.latLngBounds(branches.map((b) => [b.lat, b.lng] as [number, number])) : L.latLngBounds(ISLAND);
      const pad: [number, number] = compact ? [56, 56] : [6, 6];
      const home = () => map?.flyToBounds(bounds, { padding: pad, maxZoom: 11, duration: 1.1 });
      map.fitBounds(bounds, { padding: pad, maxZoom: 11 });
      const markers = new Map<string, import("leaflet").Marker>();
      branches.forEach((b, i) => {
        const icon = L.divIcon({ className: "map-pin-wrap", html: '<span class="map-pin" style="animation-delay:' + i * 120 + 'ms"><b>' + (i + 1) + "</b></span>", iconSize: [38, 48], iconAnchor: [19, 46], popupAnchor: [0, -42] });
        const m = L.marker([b.lat, b.lng], { icon, title: b.name, alt: b.name + " store" }).addTo(map!);
        m.bindPopup(card(b), { closeButton: true, minWidth: 210 });
        m.on("popupopen", () => setCurrent(b.id));
        m.on("popupclose", () => setCurrent((c) => (c === b.id ? null : c)));
        markers.set(b.id, m);
      });
      // Name each pin. A name goes to the right of its pin unless another pin is in the way there; then it goes left.
      const label = () => {
        if (!map) return;
        const at = new Map(branches.map((b) => [b.id, map!.latLngToContainerPoint([b.lat, b.lng])]));
        branches.forEach((b) => {
          const me = at.get(b.id)!;
          const blocked = branches.some((o) => {
            if (o.id === b.id) return false;
            const p = at.get(o.id)!;
            return p.x - me.x > 0 && p.x - me.x < 130 && Math.abs(p.y - me.y) < 30;
          });
          const m = markers.get(b.id)!;
          m.unbindTooltip();
          m.bindTooltip(b.name, { permanent: true, direction: blocked ? "left" : "right", offset: [blocked ? -14 : 14, -26], className: "map-label" });
        });
      };
      label();
      map.on("zoomend", label);
      map.on("click", () => map?.scrollWheelZoom.enable());
      api.current = {
        fly: (bid) => {
          if (!map) return;
          const m = bid ? markers.get(bid) : null;
          if (!m) {
            map.closePopup();
            home();
            return;
          }
          map.flyTo(m.getLatLng(), 14, { duration: 1.2 });
          setTimeout(() => m.openPopup(), 900);
        },
      };
    })();
    return () => {
      dead = true;
      api.current = null;
      map?.remove();
    };
    // the map is rebuilt only when a store moves or the list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, compact]);

  return (
    <div className={"store-map" + (compact ? " is-compact" : "")} id={id}>
      <div className="map-box" ref={box} role="application" aria-label="Map of Trinidad showing the five Southern Food Basket stores" />
      <div className="map-stores" role="group" aria-label="Show a store on the map">
        <button type="button" aria-pressed={current === null} onClick={() => api.current?.fly(null)}>
          {compact ? "All five stores" : "Whole island"}
        </button>
        {branches.map((b, i) => (
          <button key={b.id} type="button" aria-pressed={current === b.id} onClick={() => api.current?.fly(b.id)}>
            <b>{i + 1}</b>
            {b.name}
          </button>
        ))}
      </div>
    </div>
  );
}
