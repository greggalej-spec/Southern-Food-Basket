import type { Special } from "@/lib/types";
import { dollars, photoSrc, stemOf } from "./helpers";

// Ported from admin.js, section 2: the post maker draws the company's own Instagram format, 1080 × 1350 PNG.
// Browser-only: call these from effects and event handlers.

export const W = 1080, H = 1350;
const C = { red: "#D3202D", yellow: "#FFD21A", ink: "#2A1A1F", flour: "#FFFDFA", clay: "#B8195A", wash: "#F8EEE6" };
const SANS = '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif';
const SLAB = '"Alfa Slab One", "Rockwell Extra Bold", Rockwell, Georgia, serif';
const DISPLAY = '"Caprasimo", "Cooper Black", Georgia, serif';
const FONT_TESTS = ['800 80px "Atkinson Hyperlegible Next"', '400 70px "Alfa Slab One"', '400 64px "Caprasimo"'];
let fontsPromise: Promise<unknown> | null = null, logoPromise: Promise<HTMLImageElement | null> | null = null;
let svgLogoBlocked = false;
const photoCache: Record<string, Promise<HTMLImageElement>> = {};

function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = !document.fonts
      ? Promise.resolve()
      : document.fonts.ready
          .then(() => Promise.all(FONT_TESTS.map((f) => document.fonts.load(f).catch(() => null))))
          .then(() => document.fonts.ready)
          .catch(() => null);
  }
  return fontsPromise;
}
function fontsMissing() {
  if (!document.fonts || !document.fonts.check) return false;
  return FONT_TESTS.some((f) => {
    try {
      return !document.fonts.check(f);
    } catch {
      return false;
    }
  });
}
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onerror = () => reject(new Error("Could not load " + src));
    img.onload = () => {
      /* an SVG with only a viewBox can report no natural size; some browsers then refuse to draw it */
      const done = () => (img.naturalWidth && img.naturalHeight ? resolve(img) : reject(new Error("No natural size " + src)));
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    img.src = src;
  });
}
/* the lead may swap in an SVG logo later: try it first, fall back to the WebP */
function loadLogo() {
  if (!logoPromise) {
    const webp = () => loadImage("/assets/img/sfb-logo.webp");
    logoPromise = (svgLogoBlocked ? webp() : loadImage("/assets/img/sfb-logo.svg").catch(webp)).catch(() => null);
  }
  return logoPromise;
}
function loadPhoto(stem: string) {
  if (!photoCache[stem]) {
    photoCache[stem] = loadImage(photoSrc(stem));
    photoCache[stem].catch(() => {
      delete photoCache[stem];
    }); /* let a failed photo retry on the next draw */
  }
  return photoCache[stem];
}

/* drawing helpers */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function spacing(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px";
}
/* text centred on (cx, cy) by its ink, so caps sit in the middle of a pill or band whatever the font metrics */
function inkCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, ls: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || 0, desc = m.actualBoundingBoxDescent || 0;
  ctx.fillText(text, cx + (ls ? ls / 2 : 0), cy + (asc - desc) / 2);
}
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = String(text).split(/\s+/).filter(Boolean), lines: string[] = [];
  let line = "";
  words.forEach((w) => {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, fx: number) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const scale = Math.max(W / iw, H / ih), dw = iw * scale, dh = ih * scale;
  /* the position slider moves along whichever axis overflows (sideways for the store's landscape photos) */
  const dx = dw > W + 1 ? (W - dw) * fx : (W - dw) / 2;
  const dy = dh > H + 1 ? (H - dh) * fx : (H - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement) {
  const nw = logo.naturalWidth || 386, nh = logo.naturalHeight || 176;
  let w = 400, h = (w * nh) / nw;
  if (h > 220) {
    h = 220;
    w = (h * nw) / nh;
  }
  ctx.save();
  ctx.shadowColor = "rgba(42,26,31,.35)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(logo, 44, 44, w, h);
  ctx.restore();
  return 44 + h;
}
/* the price seal, the same geometry as SFBUI.seal: an 18-bump scallop (viewBox 0–100), "1 FOR",
   the yellow price pill and the red TRY ME banner. CSS sizes it in cqi of the card (seal = 40cqi),
   so u = size / 40 is one cqi here. Drawn offscreen first so the drop shadow falls on the whole seal at once. */
function drawSeal(ctx: CanvasRenderingContext2D, price: number, x: number, y: number, size: number) {
  const u = size / 40, k = size / 100;
  const off = document.createElement("canvas");
  const ox = Math.round(size * 0.1), oy = Math.round(size * 0.06);
  off.width = Math.ceil(size * 1.2);
  off.height = Math.ceil(size * 1.12);
  const g = off.getContext("2d");
  if (!g) return;
  g.translate(ox, oy);
  /* scallop */
  const n = 18, rIn = 41, rOut = 53, c = 50, step = (Math.PI * 2) / n;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a0 = i * step - Math.PI / 2, a1 = (i + 1) * step - Math.PI / 2, am = (i + 0.5) * step - Math.PI / 2;
    if (i === 0) g.moveTo((c + rIn * Math.cos(a0)) * k, (c + rIn * Math.sin(a0)) * k);
    g.quadraticCurveTo((c + rOut * Math.cos(am)) * k, (c + rOut * Math.sin(am)) * k, (c + rIn * Math.cos(a1)) * k, (c + rIn * Math.sin(a1)) * k);
  }
  g.closePath();
  g.fillStyle = C.red;
  g.fill();
  /* dashed inner ring */
  g.save();
  g.beginPath();
  g.arc(c * k, c * k, 35 * k, 0, Math.PI * 2);
  g.strokeStyle = "rgba(255,255,255,.35)";
  g.lineWidth = k;
  g.setLineDash([2 * k, 2 * k]);
  g.stroke();
  g.restore();
  /* "1 FOR" over the price pill, centred and nudged up 7% like .seal-in */
  const qtySize = 7.4 * u, gap = 1.2 * u, padY = 1.4 * u, padX = 2.6 * u;
  let priceSize = 6.4 * u;
  const amt = dollars(price);
  g.font = "400 " + priceSize + "px " + SLAB;
  spacing(g, 0);
  let tw = g.measureText(amt).width;
  const maxPill = size * 0.84;
  if (tw + 2 * padX > maxPill) {
    priceSize *= (maxPill - 2 * padX) / tw;
    g.font = "400 " + priceSize + "px " + SLAB;
    tw = g.measureText(amt).width;
  }
  const pillH = priceSize + 2 * padY, pillW = tw + 2 * padX;
  const blockH = qtySize + gap + pillH;
  const top = c * k - blockH / 2 - blockH * 0.07;
  g.fillStyle = "#fff";
  g.font = "800 " + qtySize + "px " + SANS;
  spacing(g, qtySize * 0.02);
  inkCentered(g, "1 FOR", c * k, top + qtySize / 2, qtySize * 0.02);
  spacing(g, 0);
  const pillY = top + qtySize + gap;
  roundRect(g, c * k - pillW / 2, pillY, pillW, pillH, pillH / 2);
  g.fillStyle = C.yellow;
  g.fill();
  g.fillStyle = C.ink;
  g.font = "400 " + priceSize + "px " + SLAB;
  inkCentered(g, amt, c * k, pillY + pillH / 2, 0);
  /* TRY ME banner: left/right -5%, bottom 4%, clip-path polygon(2% 8%, 100% 0, 98% 92%, 0 100%) */
  const trySize = 4.6 * u, bw = size * 1.1, bh = trySize + 1.6 * u + 1.8 * u;
  const bx = -size * 0.05, by = size * 0.96 - bh;
  g.beginPath();
  g.moveTo(bx + bw * 0.02, by + bh * 0.08);
  g.lineTo(bx + bw, by);
  g.lineTo(bx + bw * 0.98, by + bh * 0.92);
  g.lineTo(bx, by + bh);
  g.closePath();
  g.fillStyle = C.red;
  g.fill();
  g.fillStyle = "#fff";
  g.font = "400 " + trySize + "px " + SLAB;
  spacing(g, trySize * 0.08);
  inkCentered(g, "TRY ME", bx + bw / 2, by + 1.6 * u + trySize / 2, trySize * 0.08);
  /* composite with one drop shadow, as filter: drop-shadow() does on the card */
  ctx.save();
  ctx.shadowColor = "rgba(42,26,31,.3)";
  ctx.shadowOffsetY = size * 0.02;
  ctx.shadowBlur = size * 0.04;
  ctx.drawImage(off, x - ox, y - oy);
  ctx.restore();
}
/* "NEW PRODUCT" ribbon across the top-right corner, as on the company's posts */
function drawNewRibbon(ctx: CanvasRenderingContext2D) {
  const dist = 270, band = 84;
  ctx.save();
  ctx.translate(W, 0);
  ctx.rotate(Math.PI / 4);
  ctx.shadowColor = "rgba(42,26,31,.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = C.red;
  ctx.fillRect(-dist * 2, dist - band / 2, dist * 4, band);
  ctx.shadowColor = "transparent";
  let size = 46;
  ctx.font = "400 " + size + "px " + SLAB;
  spacing(ctx, size * 0.08);
  const room = 2 * (dist - band / 2) - 72; /* the visible length of the band's inner edge, less a margin */
  const tw = ctx.measureText("NEW PRODUCT").width;
  if (tw > room) {
    size *= room / tw;
    ctx.font = "400 " + size + "px " + SLAB;
    spacing(ctx, size * 0.08);
  }
  ctx.fillStyle = "#fff";
  inkCentered(ctx, "NEW PRODUCT", 0, dist, size * 0.08);
  ctx.restore();
}
function drawHeadline(ctx: CanvasRenderingContext2D, text: string, top: number, roomForRibbon: boolean) {
  const x = 48, padX = 32, padY = 24, maxW = (roomForRibbon ? 820 : W - 96) - padX * 2;
  let size = 62, lines: string[];
  do {
    ctx.font = "400 " + size + "px " + DISPLAY;
    lines = wrapLines(ctx, text, maxW);
    if (lines.length <= 3) break;
    size -= 4;
  } while (size >= 44);
  if (lines.length > 3) {
    lines = lines.slice(0, 3);
    lines[2] = lines[2].replace(/\s*\S+$/, "") + "…";
  }
  const lh = Math.round(size * 1.12);
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const boxW = Math.min(textW, maxW) + padX * 2, boxH = lines.length * lh + padY * 2;
  ctx.save();
  ctx.shadowColor = "rgba(42,26,31,.25)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, top, boxW, boxH, 18);
  ctx.fillStyle = C.flour;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  spacing(ctx, 0);
  lines.forEach((l, i) => ctx.fillText(l, x + padX, top + padY + lh * i + lh / 2));
}
function drawCouva(ctx: CanvasRenderingContext2D) {
  const text = "Couva", fs = 40, iconSize = 42, padX = 26, gap = 10, h = 78;
  ctx.save();
  ctx.font = "800 " + fs + "px " + SANS;
  spacing(ctx, 0);
  const tw = ctx.measureText(text).width;
  const w = padX + iconSize + gap + tw + padX, x = W - 56 - w, y = H - 56 - h;
  ctx.shadowColor = "rgba(42,26,31,.3)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = C.flour;
  ctx.fill();
  ctx.shadowColor = "transparent";
  /* the site's pin icon (24-unit grid), filled */
  ctx.save();
  ctx.translate(x + padX, y + (h - iconSize) / 2);
  ctx.scale(iconSize / 24, iconSize / 24);
  ctx.fillStyle = C.clay;
  ctx.fill(new Path2D("M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z"));
  ctx.beginPath();
  ctx.arc(12, 9.5, 2.6, 0, Math.PI * 2);
  ctx.fillStyle = C.flour;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = C.clay;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const m = ctx.measureText(text);
  ctx.fillText(text, x + padX + iconSize + gap, y + h / 2 + ((m.actualBoundingBoxAscent || fs * 0.7) - (m.actualBoundingBoxDescent || 0)) / 2);
  ctx.restore();
}

export function captionFor(sp: Special) {
  return [
    (sp.isNew ? "NEW PRODUCT · " : "") + "1 FOR " + dollars(sp.price) + " · TRY ME",
    sp.name + ", now at Southern Food Basket" + (sp.couva ? " Couva" : "") + ".",
    "#southernfoodbasket #trinidad" + (sp.couva ? " #couva" : ""),
  ].join("\n");
}

export function focusText(v: number) {
  return v <= 20 ? "Left side" : v >= 80 ? "Right side" : v < 45 ? "Left of centre" : v > 55 ? "Right of centre" : "Centre";
}

export type PostStatus = { msg: string; bad: boolean };
/** What one finished draw hands back to the page: the canvas label, the status line and the download (null = disabled). */
export type DrawResult = { label: string; status: PostStatus; download: { url: string; name: string } | null };

export const EMPTY_POST: DrawResult = {
  label: "Empty post preview",
  status: { msg: "There are no deals to make a post from. Add one under Specials first.", bad: true },
  download: null,
};

/** drawPost(): draws sp onto the canvas. Resolves null when a newer draw (isCurrent() false) has taken over. */
export async function drawPost(
  canvas: HTMLCanvasElement,
  sp: Special | null,
  opts: { headline: boolean; focus: number },
  isCurrent: () => boolean,
): Promise<DrawResult | null> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (!sp) {
    ctx.clearRect(0, 0, W, H);
    return EMPTY_POST;
  }
  await loadFonts();
  let photo: HTMLImageElement | null = null;
  try {
    photo = await loadPhoto(stemOf(sp.img));
  } catch {
    photo = null;
  }
  const logo = await loadLogo();
  if (!isCurrent()) return null; /* a newer draw has started */

  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.wash;
  ctx.fillRect(0, 0, W, H);
  if (photo) drawCover(ctx, photo, opts.focus / 100);
  const logoBottom = logo ? drawLogo(ctx, logo) : 44;
  if (sp.isNew) drawNewRibbon(ctx);
  if (opts.headline) drawHeadline(ctx, sp.name, logoBottom + 28, !!sp.isNew);
  const seal = 440;
  drawSeal(ctx, sp.price, 60, H - 60 - seal, seal);
  if (sp.couva) drawCouva(ctx);
  ctx.restore();

  const label =
    "Preview of the Instagram post: " + sp.name + ", 1 FOR " + dollars(sp.price) + ", TRY ME" +
    (sp.isNew ? ", with a NEW PRODUCT ribbon" : "") + (sp.couva ? ", with a Couva pin" : "") + (opts.headline ? ", with the name as a headline" : "") + ".";

  if (!photo) {
    return { label, download: null, status: { msg: "The product photo did not load, so the post has no picture. Reload the page and try again.", bad: true } };
  }
  try {
    const url = canvas.toDataURL("image/png");
    const notes: string[] = [];
    if (!logo) notes.push("the logo did not load");
    if (fontsMissing()) notes.push("the brand fonts did not load, so a fallback font is used");
    return {
      label,
      download: { url, name: "sfb-" + String(sp.id).replace(/[^\w-]/g, "") + ".png" },
      status: {
        msg: notes.length ? "Ready, but " + notes.join(" and ") + ". Check the internet connection and reload." : "Ready to download: 1080 × 1350 pixels, PNG.",
        bad: notes.length > 0,
      },
    };
  } catch {
    /* some browsers block export after drawing an SVG: retry once with the WebP logo */
    if (logo && /\.svg(\?|$)/i.test(logo.src || "") && !svgLogoBlocked) {
      svgLogoBlocked = true;
      logoPromise = null;
      return drawPost(canvas, sp, opts, isCurrent);
    }
    /* a page opened straight from disk (file://) taints the canvas, so the browser refuses to export it */
    return {
      label,
      download: null,
      status: {
        msg: "This browser will not save the picture from a page opened as a file. Open the site through a local web server (for example python -m http.server) and try again.",
        bad: true,
      },
    };
  }
}
