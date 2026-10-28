// The Grand Entrance camera's two shots, shared by the scroll camera (entrance.ts) and the pre-paint script below.

export type Shot = { cx: number; top: number; w: number; h: number };

/** The opening and final shots, in scene units, for a stage of w × h px.
 *  The camera moves the SVG's own viewBox (not a CSS transform), so the vector scene is redrawn sharp at every zoom
 *  level. The scene's sky, tree line and lot extend far beyond the 1600×1000 frame, so any screen shape gets a seamless
 *  wide shot. Door (scene units): x 736–864, y 636–712, centre (800, 674); the building's base is at y 722.
 *  Self-contained on purpose (no outer names): FIRST_FRAME inlines its source. */
export function cameraShots(w: number, h: number): { v0: Shot; vf: Shot; A: number } {
  const A = w / h;
  // opening shot: the whole front (wings may crop on phones), building base at ~76% height, sky above for the title
  const w0 = A < 0.8 ? 1180 : Math.max(1560, 1100 * A);
  const h0 = w0 / A;
  const v0 = { cx: 800, top: 722 - (A < 0.8 ? 0.8 : 0.93) * h0, w: w0, h: h0 };
  // final shot: the doorway fills ~62% of the width and at most ~52% of the height, centred at 40% from the top
  const wf = Math.max(128 / 0.62, (76 / 0.52) * A), hf = wf / A;
  const vf = { cx: 800, top: 674 - 0.4 * hf, w: wf, h: hf };
  return { v0, vf, A };
}

/** Sets the opening shot while the page is still parsing, so the scene does not jump when the camera starts after
 *  hydration (the static page ran its camera before first paint). Skipped under reduced motion, where the camera
 *  goes straight to the final shot. Fixed code, no input: the home page inlines it after the stage. */
export const FIRST_FRAME =
  "(function(shots){var s=document.getElementById('stage'),v=s&&s.querySelector('.storefront');" +
  "if(!v||matchMedia('(prefers-reduced-motion: reduce)').matches)return;" +
  "var g=shots(s.clientWidth||innerWidth||1,s.clientHeight||innerHeight||1).v0;" +
  "v.setAttribute('viewBox',[g.cx-g.w/2,g.top,g.w,g.h].map(function(n){return n.toFixed(2)}).join(' '))})(" +
  cameraShots.toString() +
  ")";
