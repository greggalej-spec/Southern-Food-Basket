import { SESSION_KEY } from "./store";
import type { Role } from "./types";

/* The guided tour's state and its moves. The tour walks a visitor through the site as different people: each step
   names a page, optionally who should be signed in, and the element to ring (a data-tour attribute on the page).
   State lives in sessionStorage, so the tour survives page loads in this tab and ends with it. */

export type TourAs = { role: Role; userId: string | null } | "signed-out";

export interface TourStep {
  /** Where the step happens: a path, with ?query or #hash when they matter. */
  path: string;
  /** The data-tour id to ring. Without one, the card stands on its own. */
  target?: string;
  /** Who should be signed in for this step. */
  as?: TourAs;
  title: string;
  body: string[];
  /** A thing to try, shown in its own box. */
  try?: string;
  /** Puts a value in a field for the visitor (the field's data-tour id); they still press the button themselves. */
  fill?: { target: string; value: string; label: string };
}

export interface TourChapter {
  id: string;
  title: string;
  /** One line for the chapter list. */
  summary: string;
  /** Who the chapter shows, for the chapter list. */
  cast: string;
  steps: TourStep[];
}

/** `nav` is the step whose page the tour has already opened, so a page that redirects is not opened again. */
export type TourState = { chapter: string; step: number; nav: number | null; hidden?: boolean };

const KEY = "sfb-tour-v1";
const listeners = new Set<() => void>();
let cache: TourState | null | undefined;

function read(): TourState | null {
  if (cache !== undefined) return cache;
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    cache = v && typeof v.chapter === "string" && Number.isInteger(v.step) ? (v as TourState) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(v: TourState | null) {
  cache = v;
  try {
    if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

export const tourState = read;
export const serverTourState = () => null;
export function subscribeTour(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function startTour(chapter: string, step = 0) {
  write({ chapter, step, nav: null });
}
export function goToStep(chapter: string, step: number) {
  write({ chapter, step, nav: null });
}
export function markNavigated(state: TourState) {
  write({ ...state, nav: state.step });
}
export function setHidden(state: TourState, hidden: boolean) {
  write({ ...state, hidden });
}
export function endTour() {
  write(null);
}

/** Whether the browser is on the step's page: same path and query, and the hash when the step names one. A query
 *  left over from the step before (?update=…) opens a different item, so it counts as another page. */
export function onStepPage(step: TourStep) {
  const u = new URL(step.path, location.origin);
  if (u.pathname !== location.pathname) return false;
  if (u.search !== location.search) return false;
  if (u.hash && u.hash !== location.hash) return false;
  return true;
}

export function sameSession(as: TourAs, s: { role: Role; userId: string | null } | null) {
  if (as === "signed-out") return !s;
  return !!s && s.role === as.role && (s.userId || null) === as.userId;
}

/** Signs in as someone else and loads the step's page in one move. It writes the session without telling the open
 *  page, then loads the next one: the open page's role guard would otherwise see the new role first and send the
 *  visitor to the sign-in page. */
export function switchAndGo(as: TourAs, href: string) {
  try {
    if (as === "signed-out") localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify({ role: as.role, userId: as.userId, at: new Date().toISOString() }));
  } catch {}
  // Same path and query: assign() would only move to the hash and keep the last person's screen, so reload.
  const u = new URL(href, location.origin);
  if (u.pathname === location.pathname && u.search === location.search) {
    history.replaceState(history.state, "", href);
    location.reload();
  } else location.assign(href);
}

/** Moves to another section of the same page (the consoles switch sections on hashchange). */
export function setHash(hash: string) {
  location.hash = hash;
}

/** Types a value into a React-controlled field the way a person would, so its onChange runs. */
export function fillField(id: string, value: string) {
  const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-tour="${CSS.escape(id)}"]`);
  const field = el && (el.matches("input, textarea") ? el : el.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea"));
  if (!field) return false;
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.focus();
  return true;
}
