"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CHAPTERS } from "@/lib/tour-chapters";
import {
  endTour,
  fillField,
  goToStep,
  markNavigated,
  onStepPage,
  sameSession,
  serverTourState,
  setHash,
  setHidden,
  subscribeTour,
  switchAndGo,
  tourState,
  type TourStep,
} from "@/lib/tour";
import { session, useHydrated } from "@/lib/store";

/* The guided tour's card and ring, mounted once in each root layout. It shows only while a tour is running
   (lib/tour.ts). On each step it first makes sure the right person is signed in and the right page is open, then
   rings the step's element. The card never traps focus and the page under it stays usable: the visitor is meant to
   try things. */

type Rect = { top: number; left: number; width: number; height: number } | null;

const PAD = 8;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function findTarget(id: string | undefined) {
  if (!id) return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(id)}"]`);
  // the first one that is actually on screen (a closed sidebar or a hidden tab panel has no box)
  return Array.from(all).find((el) => el.getClientRects().length > 0) || null;
}

function rectOf(el: HTMLElement | null): Rect {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

const sameRect = (a: Rect, b: Rect) =>
  a === b || (!!a && !!b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5);

export function TourHost() {
  const state = useSyncExternalStore(subscribeTour, tourState, serverTourState);
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useHydrated();
  const [rect, setRect] = useState<Rect>(null);
  // keyed by step, so a new step starts clear without resetting state in an effect
  const [missingKey, setMissingKey] = useState<string | null>(null);
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const [filledKey, setFilledKey] = useState<string | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const chapter = state ? CHAPTERS.find((c) => c.id === state.chapter) : undefined;
  const step: TourStep | undefined = chapter?.steps[state!.step];
  const stepKey = state ? state.chapter + ":" + state.step : "";
  const missing = missingKey === stepKey;
  const done = doneKey === stepKey;
  const filled = filledKey === stepKey;

  // 1. Right person, right page. Once per step: a page that redirects (a guard, a sign-in) is left where it lands.
  useEffect(() => {
    if (!state || !step || state.nav === state.step) return;
    const s = session();
    if (step.as && !sameSession(step.as, s)) {
      markNavigated(state);
      switchAndGo(step.as, step.path);
      return;
    }
    markNavigated(state);
    if (onStepPage(step)) return;
    const u = new URL(step.path, location.origin);
    if (u.pathname === location.pathname && u.search === location.search && u.hash) setHash(u.hash);
    // Same page, different query: the consoles read the query once, when they load, so load the page again.
    else if (u.pathname === location.pathname) location.assign(step.path);
    else router.push(step.path);
  }, [state, step, router, pathname]);

  // 2. Find the step's element (pages fill in after hydration), bring it into view, and keep the ring on it.
  useEffect(() => {
    if (!step || state?.hidden) return;
    let raf = 0;
    let found: HTMLElement | null = null;
    let scrolled = false;
    const started = performance.now();
    const tick = () => {
      if (!found || !found.isConnected) found = findTarget(step.target);
      if (found && !scrolled) {
        scrolled = true;
        found.scrollIntoView({ block: "center", inline: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      }
      const next = rectOf(found);
      setRect((cur) => (sameRect(cur, next) ? cur : next));
      // a target that was on the page and went away is usually the "try" done (a sealed card opened, a form sent)
      if (step.target && !found && scrolled && step.try) setDoneKey(stepKey);
      else if (step.target && !found && !scrolled && performance.now() - started > 5000) setMissingKey(stepKey);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, stepKey, state?.hidden, pathname]);

  // 3. A new step: put focus on its heading, so a screen reader hears it and Tab starts from the card.
  useLayoutEffect(() => {
    if (step && !state?.hidden) headRef.current?.focus({ preventScroll: true });
  }, [step, state?.hidden]);

  // Escape hides the card (the pill keeps the place); it does not end the tour by accident.
  useEffect(() => {
    if (!state || state.hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (!cardRef.current?.contains(document.activeElement)) return;
      setHidden(state, true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state]);

  if (!mounted || !state || !chapter || !step) return null;

  const total = chapter.steps.length;
  const i = state.step;
  const last = i === total - 1;
  const nextChapter = CHAPTERS[CHAPTERS.indexOf(chapter) + 1];
  // the card sits bottom-right unless the ring is there
  const left = !!rect && rect.left + rect.width > innerWidth - 440 && rect.top + rect.height > innerHeight - 420;

  if (state.hidden) {
    return createPortal(
      <div className="tour-root">
        <button className="tour-pill" type="button" onClick={() => setHidden(state, false)}>
          Show the tour · {i + 1} of {total}
        </button>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="tour-root">
      {rect && <div className="tour-ring" style={rect} aria-hidden="true" />}
      <section ref={cardRef} className={left ? "tour-card is-left" : "tour-card"} role="dialog" aria-labelledby="tour-title" aria-describedby="tour-text">
        <div className="tour-head">
          <p className="tour-chapter">{chapter.title}</p>
          <p className="tour-count">
            {i + 1} of {total}
          </p>
        </div>
        <div className="tour-bar" aria-hidden="true">
          <span style={{ width: ((i + 1) / total) * 100 + "%" }} />
        </div>
        <div className="tour-body">
          <h2 id="tour-title" ref={headRef} tabIndex={-1}>
            {step.title}
          </h2>
          <div id="tour-text">
            {step.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {(step.try || step.fill) && (
            <div className="tour-try">
              {step.try && <p>{step.try}</p>}
              {step.fill && (
                <button className="tour-btn is-small" type="button" onClick={() => fillField(step.fill!.target, step.fill!.value) && setFilledKey(stepKey)}>
                  {filled ? "Filled in" : step.fill.label}
                </button>
              )}
            </div>
          )}
          {done ? (
            <p className="tour-missing is-done" role="status">
              Done. Press Next to carry on.
            </p>
          ) : missing ? (
            <p className="tour-missing">This part of the page is not showing yet. Carry on with Next, or open the menu to find it.</p>
          ) : null}
        </div>
        <div className="tour-foot">
          <button className="tour-link" type="button" onClick={endTour}>
            End tour
          </button>
          <button className="tour-link" type="button" onClick={() => setHidden(state, true)}>
            Hide
          </button>
          <span className="tour-spacer" />
          {i > 0 && (
            <button className="tour-btn" type="button" onClick={() => goToStep(chapter.id, i - 1)}>
              Back
            </button>
          )}
          {!last && (
            <button className="tour-btn is-primary" type="button" onClick={() => goToStep(chapter.id, i + 1)}>
              Next
            </button>
          )}
          {last && nextChapter && (
            <button className="tour-btn is-primary" type="button" onClick={() => goToStep(nextChapter.id, 0)}>
              Next: {nextChapter.title}
            </button>
          )}
          {last && !nextChapter && (
            <button
              className="tour-btn is-primary"
              type="button"
              onClick={() => {
                endTour();
                router.push("/tour");
              }}
            >
              Finish
            </button>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
