"use client";

import { useEffect, useSyncExternalStore } from "react";

/* The staff side's light / dark switch (styles/staff-theme.css). Light is Option A, dark is Option B. The choice is
   kept in this browser. While a staff screen is open the choice is written on <html>, so sheets and dialogs (which
   render outside the shell) wear it too; it is taken off again when the staff screen closes, so public pages never
   see it. */

const KEY = "sfb.staffTheme";
type Theme = "light" | "dark";

/* The console's background, chosen on the Customize page (Gregg, 14 Nov 2026). Each one is a page colour that the
   cards stand out against, in light and in dark; "glass" is the produce photograph with frosted panels, which is no
   longer the default. The colours themselves are in styles/staff-theme.css (html[data-staff-skin]). */
const SKIN_KEY = "sfb.staffSkin";
export const SKINS = [
  { id: "classic", name: "Classic", note: "Warm page, white cards", light: "#F3E3D7", dark: "#06180D" },
  { id: "sand", name: "Sand", note: "Tan page, white cards", light: "#E4D5BA", dark: "#211B10" },
  { id: "sage", name: "Sage", note: "Soft green page", light: "#D1E2D3", dark: "#04130A" },
  { id: "blush", name: "Blush", note: "Pink page", light: "#F5D3DD", dark: "#2B0F1C" },
  { id: "sky", name: "Sky", note: "Blue page", light: "#C8DAEA", dark: "#0B1929" },
  { id: "stone", name: "Stone", note: "Grey page", light: "#DCDCE2", dark: "#141519" },
  { id: "glass", name: "Photo and glass", note: "Produce photo, frosted panels", light: "#FFF6F1", dark: "#0B2E19" },
] as const;
export type Skin = (typeof SKINS)[number]["id"];
function readSkin(): Skin {
  try {
    const v = localStorage.getItem(SKIN_KEY);
    return SKINS.some((k) => k.id === v) ? (v as Skin) : "classic";
  } catch {
    return "classic";
  }
}
function writeSkin(k: Skin) {
  try {
    localStorage.setItem(SKIN_KEY, k);
  } catch {
    /* private window: the choice lasts for this page only */
  }
  document.documentElement.dataset.staffSkin = k;
  listeners.forEach((l) => l());
}
/** The console background and its setter, for the Customize page. */
export function useStaffSkin(): [Skin, (k: Skin) => void] {
  return [useSyncExternalStore(subscribe, readSkin, () => "classic" as Skin), writeSkin];
}
const listeners = new Set<() => void>();

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
function write(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private window: the choice lasts for this page only */
  }
  document.documentElement.dataset.staffTheme = t;
  listeners.forEach((l) => l());
}

/** The staff theme and its setter, for the Customize page. The top bar's switch and this stay in step. */
export function useStaffTheme(): [Theme, (t: Theme) => void] {
  return [useSyncExternalStore(subscribe, read, () => "light" as Theme), write];
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const skin = useSyncExternalStore(subscribe, readSkin, () => "classic" as Skin);
  useEffect(() => {
    document.documentElement.dataset.staffTheme = theme;
    document.documentElement.dataset.staffSkin = skin;
    return () => {
      delete document.documentElement.dataset.staffTheme;
      delete document.documentElement.dataset.staffSkin;
    };
  }, [theme, skin]);
  const dark = theme === "dark";
  return (
    <button type="button" className="theme-toggle" aria-pressed={dark} onClick={() => write(dark ? "light" : "dark")} title={dark ? "Switch to light mode" : "Switch to dark mode"}>
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
        </svg>
      )}
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
