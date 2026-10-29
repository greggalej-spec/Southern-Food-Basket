// Southern Food Basket — design option D, Grand Entrance. Ported from assets/js/grand-entrance.js.
// app/(home)/page.tsx renders the whole page from the seed; this wires up its behaviour:
//   1) the arrival: scroll drives a camera from an aerial, tilted wide shot of the store front down to the front door;
//      the sliding doors open and the crew in red steps forward waving; the welcome card fades in
//   2) the top bar: mobile menu, the ink pill that follows the pointer, the section spy
//   3) the specials shelf buttons and the highlights carousel
// The physics layer is living.ts. startEntrance() returns a stop() that removes every listener, frame, timer and
// observer it started.

import { cameraShots, type Shot } from "./camera";

export type Stage = { p: () => number; vb: () => number[]; svg: SVGSVGElement };

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function startEntrance(): { stage: Stage | null; stop: () => void } {
  const ac = new AbortController(), signal = ac.signal, passive = { passive: true, signal };
  const stops: (() => void)[] = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. the arrival ---------- */
  let stage: Stage | null = null;
  const intro = $("#top"), stageEl = $("#stage"), svg = $<SVGSVGElement>(".storefront");
  const doorL = $<SVGGElement>(".door-l"), doorR = $<SVGGElement>(".door-r"), crew = $<SVGGElement>(".crew"), clouds = $<SVGGElement>(".clouds");
  const startCopy = $("#intro-start"), endCopy = $("#intro-end"), bar = $("#progress-bar"), note = $(".concept-note"), skipPill = $("#skip-intro");
  if (intro && stageEl && svg && doorL && doorR && crew && startCopy && endCopy && bar) {
    let geo: { v0: Shot; vf: Shot; A: number } | null = null, vbNow = [0, 0, 1600, 1000];
    // a hidden tab can report 0 × 0
    const measure = () => (geo = cameraShots(stageEl.clientWidth || innerWidth || 1, stageEl.clientHeight || innerHeight || 1));
    const progress = () => {
      if (reduce.matches) return 1;
      const top = intro.offsetTop, span = intro.offsetHeight - innerHeight;
      return span > 0 ? clamp((scrollY - top) / span, 0, 1) : 1;
    };
    const draw = (p: number) => {
      const { v0, vf, A } = geo || measure();
      const e = ease(clamp(p / 0.7, 0, 1));
      const vw = v0.w * Math.pow(vf.w / v0.w, e), vh = vw / A; // zoom is geometric so it feels even
      const k = (v0.w - vw) / (v0.w - vf.w || 1);             // 0 → 1 as the zoom completes
      const cx = v0.cx + (vf.cx - v0.cx) * k, top = v0.top + (vf.top - v0.top) * k;
      vbNow = [cx - vw / 2, top, vw, vh];
      svg.setAttribute("viewBox", vbNow.map((n) => n.toFixed(2)).join(" "));
      const d = ease(clamp((p - 0.62) / 0.16, 0, 1));
      doorL.style.transform = "translateX(" + (-62 * d).toFixed(2) + "px)";
      doorR.style.transform = "translateX(" + (62 * d).toFixed(2) + "px)";
      crew.style.transform = "translateY(" + (3 * (1 - d)).toFixed(2) + "px)";
      if (clouds) clouds.style.transform = "translateX(" + (-140 * p).toFixed(1) + "px)";
      stageEl.style.setProperty("--vig", (0.9 * e).toFixed(3));
      const a = 1 - clamp(p / 0.1, 0, 1);
      startCopy.style.opacity = a.toFixed(3);
      startCopy.style.visibility = a > 0.01 ? "visible" : "hidden";
      const b = clamp((p - 0.78) / 0.1, 0, 1);
      endCopy.style.opacity = b.toFixed(3);
      endCopy.style.visibility = b > 0.02 ? "visible" : "hidden";
      endCopy.style.transform = "translateX(-50%) translateY(" + (16 * (1 - b)).toFixed(1) + "px)";
      if (note) note.style.opacity = (1 - b).toFixed(3);
      if (skipPill) {
        skipPill.style.opacity = (1 - b).toFixed(3);
        skipPill.style.visibility = b < 0.98 ? "visible" : "hidden";
      }
      bar.style.width = (p * 100).toFixed(2) + "%";
    };

    // The camera trails the scroll on a critically damped spring: a flick of the wheel becomes a glide, never a jolt.
    let pView: number | null = null, vel = 0, raf = 0, lastT = 0, resizeTimer = 0;
    const frame = (now: number) => {
      raf = 0;
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      const t = progress();
      if (pView == null || reduce.matches) { pView = t; vel = 0; }
      else { vel += (60 * (t - pView) - 15.5 * vel) * dt; pView += vel * dt; }
      if (Math.abs(t - pView) < 0.0004 && Math.abs(vel) < 0.002) { pView = t; vel = 0; }
      draw(pView);
      if (pView !== t) raf = requestAnimationFrame(frame);
      else lastT = 0;
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
    stage = { p: () => pView || 0, vb: () => vbNow, svg };
    addEventListener("scroll", request, passive);
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { measure(); draw(pView ?? progress()); }, 120);
    }, { signal });
    reduce.addEventListener("change", () => { measure(); pView = null; request(); }, { signal });
    measure();
    pView = progress();
    draw(pView);
    document.fonts?.ready.then(() => { if (!signal.aborted) { measure(); draw(pView ?? progress()); } });
    stops.push(() => { cancelAnimationFrame(raf); clearTimeout(resizeTimer); });
  }

  // "Skip intro": jump straight past the animation (a smooth scroll would replay all of it)
  const inside = $("#inside");
  $$('a[href="#inside"]').forEach((a) => a.addEventListener("click", (e) => {
    if (!inside) return;
    e.preventDefault();
    inside.scrollIntoView({ behavior: "instant", block: "start" });
    inside.focus({ preventScroll: true });
  }, { signal }));

  /* ---------- 2. top bar ---------- */
  const topbar = $("#topbar"), btn = $<HTMLButtonElement>(".menu-btn"), menu = $("#mobile-menu");
  if (topbar && btn && menu) {
    const label = $(".label", btn);
    menu.inert = true;
    const setMenu = (open: boolean, refocus?: boolean) => {
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (label) label.textContent = open ? "Close" : "Menu";
      if (!open && refocus) btn.focus();
    };
    btn.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")), { signal });
    menu.addEventListener("click", (e) => { if ((e.target as Element).closest("a")) setMenu(false); }, { signal });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false, true); }, { signal });
    document.addEventListener("click", (e) => { if (menu.classList.contains("is-open") && !topbar.contains(e.target as Node)) setMenu(false); }, { signal });

    // the top bar firms up once the page moves
    const onBar = () => topbar.classList.toggle("is-scrolled", scrollY > 8);
    addEventListener("scroll", onBar, passive);
    onBar();
  }

  // desktop nav: an ink pill follows the pointer and rests on the section in view
  const nav = $(".topnav"), ink = nav && $(".ink", nav);
  if (nav && ink) {
    const links = $$<HTMLAnchorElement>("a", nav);
    let active: HTMLAnchorElement | null = null;
    const moveInk = (a: HTMLAnchorElement | null) => {
      if (!a) { nav.classList.remove("has-ink"); return; }
      ink.style.width = a.offsetWidth + "px";
      ink.style.transform = "translateX(" + a.offsetLeft + "px)";
      nav.classList.add("has-ink");
    };
    links.forEach((a) => {
      a.addEventListener("mouseenter", () => moveInk(a), { signal });
      a.addEventListener("focus", () => moveInk(a), { signal });
    });
    nav.addEventListener("mouseleave", () => moveInk(active), { signal });
    nav.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget as Node | null)) moveInk(active); }, { signal });
    const spy = links.flatMap((a) => {
      const href = a.getAttribute("href") || "", el = href.startsWith("#") ? document.getElementById(href.slice(1)) : null;
      return el ? [[a, el] as const] : [];
    });
    if (spy.length) {
      const seen = new Map<Element, boolean>();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => seen.set(en.target, en.isIntersecting));
        const hit = spy.find((p) => seen.get(p[1]));
        active = hit ? hit[0] : null;
        links.forEach((a) => a.classList.toggle("is-active", a === active));
        if (!nav.matches(":hover") && !nav.contains(document.activeElement)) moveInk(active);
      }, { rootMargin: "-45% 0px -50% 0px" });
      spy.forEach((p) => io.observe(p[1]));
      stops.push(() => io.disconnect());
    }
  }

  /* ---------- 3. the store ---------- */
  const shelf = $("#shelf");
  $$("[data-shelf]").forEach((b) => b.addEventListener("click", () => {
    shelf?.scrollBy({ left: Number(b.getAttribute("data-shelf")) * shelf.clientWidth * 0.8, behavior: reduce.matches ? "auto" : "smooth" });
  }, { signal }));

  /* ---------- highlights carousel ---------- */
  const car = $("#carousel"), track = car && $(".car-track", car), playBtn = car && $(".car-play", car);
  if (car && track && playBtn) {
    const slides = $$(".slide", track), dots = $$<HTMLButtonElement>(".car-dot", car);
    let idx = 0, paused = reduce.matches, touched = false, seen = false, st = 0;
    const show = (i: number) => {
      idx = (i + slides.length) % slides.length;
      track.scrollTo({ left: slides[idx].offsetLeft, behavior: reduce.matches ? "auto" : "smooth" });
    };
    const sync = () => {
      const i = clamp(Math.round(track.scrollLeft / (track.clientWidth || 1)), 0, slides.length - 1);
      idx = i;
      slides.forEach((s, k) => { s.inert = k !== i; });
      dots.forEach((d, k) => { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    };
    const setPlay = (on: boolean) => {
      paused = !on;
      playBtn.setAttribute("aria-label", on ? "Pause the slides" : "Play the slides");
      playBtn.classList.toggle("is-paused", !on);
    };
    track.addEventListener("scroll", () => { clearTimeout(st); st = window.setTimeout(sync, 90); }, passive);
    const stopAuto = () => { if (!touched) { touched = true; setPlay(false); } }; // the button never claims it is still playing
    (["pointerdown", "keydown", "focusin"] as const).forEach((ev) => car.addEventListener(ev, (e) => {
      if (!(e.target as Element).closest(".car-play")) stopAuto();
    }, { signal }));
    $(".car-prev", car)?.addEventListener("click", () => { stopAuto(); show(idx - 1); }, { signal });
    $(".car-next", car)?.addEventListener("click", () => { stopAuto(); show(idx + 1); }, { signal });
    dots.forEach((d, k) => d.addEventListener("click", () => { stopAuto(); show(k); }, { signal }));
    playBtn.addEventListener("click", () => { touched = false; setPlay(paused); }, { signal });
    const io = new IntersectionObserver((es) => { seen = es[0].isIntersecting; }, { threshold: 0.5 });
    io.observe(car);
    // Advances every 7 s only while it is on screen, motion is allowed and nobody has touched it.
    const auto = window.setInterval(() => { if (!paused && !touched && seen && !document.hidden) show(idx + 1); }, 7000);
    setPlay(!paused);
    sync();
    addEventListener("resize", () => { track.scrollTo({ left: slides[idx].offsetLeft, behavior: "auto" }); }, { signal });
    stops.push(() => { io.disconnect(); clearInterval(auto); clearTimeout(st); });
  }

  return {
    stage,
    stop: () => {
      ac.abort();
      stops.forEach((f) => f());
    },
  };
}
