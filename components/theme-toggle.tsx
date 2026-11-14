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

/* Photo and glass has its own controls (Gregg, 14 Nov 2026: "needs sliders for customization of the opacity and
   such"). They are kept in this browser and written on <html> as CSS variables that styles/staff-theme.css reads:
     photo   how strongly the photograph shows through the tint (per cent)
     card    how solid the panels are (per cent)
     blur    how much the panels frost what is behind them (px)
     sheet   how solid the sheet behind the working column is (per cent)
     pic     which photograph: "auto" follows light / dark */
const GLASS_KEY = "sfb.staffGlass";
export const GLASS_PICS = [
  { id: "auto", name: "Automatic", note: "Follows light or dark" },
  { id: "variety", name: "Mixed produce", note: "Bright" },
  { id: "market", name: "Market stall", note: "Colourful" },
  { id: "dark", name: "Dark produce", note: "Moody" },
] as const;
export type GlassPic = (typeof GLASS_PICS)[number]["id"];
export type Glass = { photo: number; card: number; blur: number; sheet: number; pic: GlassPic };
export const GLASS_DEFAULT: Glass = { photo: 45, card: 90, blur: 16, sheet: 72, pic: "auto" };
export const GLASS_RANGE = { photo: [10, 90], card: [50, 100], blur: [0, 30], sheet: [0, 100] } as const;
const GLASS_VARS = ["--glass-tint", "--glass-tint2", "--glass-card", "--glass-blur", "--glass-sheet"];

function num(v: unknown, key: keyof typeof GLASS_RANGE): number {
  const [lo, hi] = GLASS_RANGE[key];
  return typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : GLASS_DEFAULT[key];
}
let glassRaw: string | null | undefined;
let glassVal: Glass = GLASS_DEFAULT;
function readGlass(): Glass {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(GLASS_KEY);
  } catch {
    raw = null;
  }
  if (raw === glassRaw) return glassVal; // the same object while nothing changed, as useSyncExternalStore needs
  glassRaw = raw;
  glassVal = GLASS_DEFAULT;
  if (raw) {
    try {
      const o = JSON.parse(raw) as Partial<Glass>;
      glassVal = { photo: num(o.photo, "photo"), card: num(o.card, "card"), blur: num(o.blur, "blur"), sheet: num(o.sheet, "sheet"), pic: GLASS_PICS.some((p) => p.id === o.pic) ? (o.pic as GlassPic) : "auto" };
    } catch {
      /* unreadable: the standard settings */
    }
  }
  return glassVal;
}
function applyGlass(g: Glass) {
  const root = document.documentElement;
  const tint = (97 - g.photo) / 100;
  root.style.setProperty("--glass-tint", tint.toFixed(2));
  root.style.setProperty("--glass-tint2", Math.min(1, tint + 0.14).toFixed(2));
  root.style.setProperty("--glass-card", g.card + "%");
  root.style.setProperty("--glass-blur", g.blur + "px");
  root.style.setProperty("--glass-sheet", g.sheet + "%");
  if (g.pic === "auto") delete root.dataset.glassPhoto;
  else root.dataset.glassPhoto = g.pic;
}
function clearGlass() {
  const root = document.documentElement;
  GLASS_VARS.forEach((v) => root.style.removeProperty(v));
  delete root.dataset.glassPhoto;
}
function writeGlass(g: Glass) {
  try {
    localStorage.setItem(GLASS_KEY, JSON.stringify(g));
  } catch {
    /* private window: the settings last for this page only */
    glassRaw = null;
    glassVal = g;
  }
  applyGlass(g);
  listeners.forEach((l) => l());
}
/** The Photo and glass settings and their setter, for the Customize page. */
export function useStaffGlass(): [Glass, (g: Glass) => void] {
  return [useSyncExternalStore(subscribe, readGlass, () => GLASS_DEFAULT), writeGlass];
}

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
  const glass = useSyncExternalStore(subscribe, readGlass, () => GLASS_DEFAULT);
  useEffect(() => {
    applyGlass(glass);
    return clearGlass;
  }, [glass]);
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
