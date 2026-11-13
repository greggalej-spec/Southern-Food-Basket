// Type systems across font genres (13 Nov 2026). The first font boards all sat in one family of modern sans; these
// eight cover the range: classic serif, editorial serif, slab, rounded, corporate grotesque, condensed flyer,
// homey serif with handwriting, and modern tech. Each is a system of four voices, one per kind of information:
//   Display  headings and page titles          Text    sentences, labels, buttons
//   Data     prices, figures, table numbers    Accent  price tags, greetings, notes
// Every board shows the four voices alone, then applied in light mode (direction A) and dark mode (direction B).
// Run: node docs/brand-options/type-systems.mjs, then photograph each page at 1400 x 1200 (overview 1400 x 2010).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOGO = "../../public/assets/img/sfb-logo.svg";

// f: [family, css weight, italic?]. corp: 0 homey .. 100 corporate. modern: 0 classic .. 100 modern.
const SETS = [
  { id: 1, genre: "Classic serif", corp: 78, modern: 15, blurb: "The voice of a bank or a newspaper. Trust and tradition; the sans underneath keeps long text easy.",
    link: "Playfair+Display:ital,wght@0,600;0,800;1,600&family=Source+Sans+3:wght@400;600;700", display: ["Playfair Display", 800], text: ["Source Sans 3", 400], data: ["Source Sans 3", 700], accent: ["Playfair Display", 600, true] },
  { id: 2, genre: "Editorial serif", corp: 60, modern: 55, blurb: "A magazine look: a sharp, high-contrast serif for headings and a typewriter-style face for figures.",
    link: "DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;500", display: ["DM Serif Display", 400], text: ["DM Sans", 400], data: ["DM Mono", 500], accent: ["DM Serif Display", 400, true] },
  { id: 3, genre: "Sturdy slab", corp: 55, modern: 40, blurb: "Blocky serifs like a market sign or a price ticket. Solid, honest, and close to the store's own flyers.",
    link: "Roboto+Slab:wght@500;800&family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;600", display: ["Roboto Slab", 800], text: ["Roboto", 400], data: ["Roboto Mono", 600], accent: ["Roboto Slab", 500] },
  { id: 4, genre: "Round and homey", corp: 12, modern: 60, blurb: "Soft, rounded letters and a handwritten accent. The friendliest of the eight: a neighbour, not a company.",
    link: "Baloo+2:wght@600;800&family=Nunito:wght@400;700;800&family=Caveat:wght@600;700", display: ["Baloo 2", 800], text: ["Nunito", 400], data: ["Nunito", 800], accent: ["Caveat", 700] },
  { id: 5, genre: "Corporate grotesque", corp: 95, modern: 70, blurb: "One engineered family for everything, with its own typewriter face for figures. Reads like head-office software.",
    link: "IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Serif:ital,wght@1,500", display: ["IBM Plex Sans", 700], text: ["IBM Plex Sans", 400], data: ["IBM Plex Mono", 600], accent: ["IBM Plex Serif", 500, true] },
  { id: 6, genre: "Flyer condensed", corp: 45, modern: 50, blurb: "Tall, tight capitals like a supermarket flyer. Shouts a price well and fits long item names in narrow columns.",
    link: "Barlow+Condensed:wght@600;800&family=Barlow:wght@400;600&family=Barlow+Semi+Condensed:wght@600;700", display: ["Barlow Condensed", 800], text: ["Barlow", 400], data: ["Barlow Semi Condensed", 700], accent: ["Barlow Condensed", 600] },
  { id: 7, genre: "Homey serif and hand", corp: 22, modern: 20, blurb: "A warm bookish serif with real handwriting for notes and greetings. A family shop that has been there for years.",
    link: "Lora:wght@600;700&family=Karla:wght@400;700&family=Kalam:wght@400;700", display: ["Lora", 700], text: ["Karla", 400], data: ["Karla", 700], accent: ["Kalam", 700] },
  { id: 8, genre: "Modern tech", corp: 70, modern: 96, blurb: "Geometric, slightly quirky headings and a coder's face for figures. Looks like a start-up's app.",
    link: "Space+Grotesk:wght@500;700&family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700", display: ["Space Grotesk", 700], text: ["Inter", 400], data: ["JetBrains Mono", 700], accent: ["Space Grotesk", 500] },
];

const MODES = [
  { name: "Light mode", bg: "#FFF6F1", surface: "#FFFFFF", text: "#20141A", muted: "#6A5560", cards: [["#E3336F", "#fff"], ["#1D6B35", "#fff"], ["#FFD21A", "#20141A"]], thead: ["#1D6B35", "#fff"], rowA: "#FCE4EC", rowB: "#E3F2E6", rowText: "#20141A", primary: ["#E3336F", "#fff"], chip: ["#FFD21A", "#20141A"], plate: "#FFFFFF", note: "#B8195A" },
  { name: "Dark mode", bg: "#0B2E19", surface: "#123F22", text: "#F7F2E6", muted: "#B9C9BC", cards: [["#E3336F", "#fff"], ["#E9B949", "#20141A"], ["#1D6B35", "#fff"]], thead: ["#E9B949", "#20141A"], rowA: "#1A5230", rowB: "#123F22", rowText: "#F7F2E6", primary: ["#E9B949", "#20141A"], chip: ["#FBF6EC", "#20141A"], plate: "#FBF6EC", note: "#E9B949" },
];

const ff = (f) => `font-family:'${f[0]}',system-ui,sans-serif;font-weight:${f[1]};${f[2] ? "font-style:italic;" : ""}`;
const KPIS = [["To decide", "2"], ["Sheets checked", "14 / 15"], ["Prices to add", "86"]];
const ROWS = [["Fruta 1 L", "2 for 19.95", "11%"], ["Cow Brand ghee 2 lb", "119.95", "18%"], ["Carnation 24 x 250 ml", "3 for 24.95", "23%"]];
const slider = (label, a, b, v, c) => `<div class="sl"><span>${a}</span><i><b style="left:${v}%;background:${c}"></b></i><span>${b}</span></div>`;

const applied = (s, m) => `<section class="p" style="background:${m.bg};color:${m.text}">
  <div class="ph"><span class="md" style="background:${m.primary[0]};color:${m.primary[1]}">${m.name}</span><img src="${LOGO}" alt="" style="background:${m.plate}"></div>
  <h2 style="${ff(s.display)}">Supplier specials</h2>
  <p style="${ff(s.text)};color:${m.muted}">Each company's specials for the round. Type the case price and the margin works itself out.</p>
  <div class="ks">${KPIS.map(([l, v], i) => `<div style="background:${m.cards[i][0]};color:${m.cards[i][1]}"><small style="${ff(s.text)};font-weight:700">${l}</small><b style="${ff(s.data)}">${v}</b></div>`).join("")}</div>
  <table><tr>${["Item", "Special", "Margin"].map((h) => `<th style="${ff(s.text)};font-weight:700;background:${m.thead[0]};color:${m.thead[1]}">${h}</th>`).join("")}</tr>${ROWS.map((r, i) => `<tr>${r.map((c, j) => `<td style="${j ? ff(s.data) : ff(s.text) + "font-weight:700;"}background:${i % 2 ? m.rowB : m.rowA};color:${m.rowText}">${c}</td>`).join("")}</tr>`).join("")}</table>
  <div class="btns"><span class="btn" style="${ff(s.text)};font-weight:700;background:${m.primary[0]};color:${m.primary[1]}">Bring in specials</span><span class="price" style="${ff(s.data)};background:${m.chip[0]};color:${m.chip[1]}">1 for $24.95</span><span class="acc" style="${ff(s.accent)};color:${m.note}">Merry Christmas from all of us!</span></div>
</section>`;

const CSS = `*{box-sizing:border-box;margin:0} body{width:1400px;height:1200px;overflow:hidden;background:#E9E6E0;padding:42px 48px;font:400 18px/1.5 system-ui,sans-serif;color:#1c1c1c}
.top{display:grid;grid-template-columns:1fr 400px;gap:36px;align-items:end;margin-bottom:22px} .n{display:inline-block;padding:7px 16px;border-radius:999px;background:#1c1c1c;color:#fff;font:700 15px/1 system-ui;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
h1{font-size:62px;line-height:1.02;letter-spacing:-.01em} .blurb{font-size:20px;color:#444;margin-top:10px;max-width:800px}
.sl{display:grid;grid-template-columns:96px 1fr 96px;align-items:center;gap:10px;font:600 15px/1.2 system-ui;color:#444;margin-top:12px} .sl span:last-child{text-align:right} .sl i{position:relative;height:8px;border-radius:99px;background:#cfcabf} .sl b{position:absolute;top:-7px;width:22px;height:22px;margin-left:-11px;border-radius:50%;box-shadow:0 0 0 4px #E9E6E0}
.roles{display:grid;grid-template-columns:1.25fr 1.15fr 1fr 1fr;gap:14px;margin-bottom:16px}
.role{background:#fff;border-radius:20px;padding:20px 22px;min-height:236px;display:flex;flex-direction:column;box-shadow:0 14px 28px -22px rgba(0,0,0,.5)}
.role small{font:700 13px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;color:#B8195A} .role em{font:600 15px/1.3 system-ui;font-style:normal;color:#666;margin:6px 0 12px} .role .s{margin-top:auto;color:#20141A}
.d1{font-size:40px;line-height:1.05} .t1{font-size:17.5px;line-height:1.5} .n1{font-size:34px;line-height:1.15;font-variant-numeric:tabular-nums} .n2{font-size:17px;line-height:1.5;color:#555;font-variant-numeric:tabular-nums} .a1{font-size:34px;line-height:1.1;color:#B8195A} .a2{font-size:18px;margin-top:8px;color:#1D6B35}
.g{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.p{border-radius:24px;padding:24px 28px 22px;box-shadow:0 24px 44px -28px rgba(0,0,0,.55)}
.ph{display:flex;align-items:center;margin-bottom:12px} .md{padding:7px 14px;border-radius:999px;font:700 14px/1 system-ui;letter-spacing:.08em;text-transform:uppercase} .ph img{margin-left:auto;height:46px;border-radius:10px;padding:4px 8px}
h2{font-size:44px;line-height:1.08} .p p{font-size:18px;line-height:1.45;margin:6px 0 16px}
.ks{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px} .ks div{border-radius:16px;padding:14px 16px;min-height:104px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid rgba(0,0,0,.06)} .ks small{font-size:13px;line-height:1.2;letter-spacing:.05em;text-transform:uppercase} .ks b{font-size:34px;line-height:1}
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:14px;overflow:hidden;font-size:17px} th,td{padding:11px 14px;text-align:left} th{font-size:13px;letter-spacing:.08em;text-transform:uppercase} td{font-variant-numeric:tabular-nums}
.btns{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-top:16px} .btn{padding:13px 20px;border-radius:14px;font-size:17px;line-height:1} .price{padding:9px 16px;border-radius:999px;font-size:21px;line-height:1} .acc{font-size:25px;line-height:1.1}
.foot{position:absolute;left:48px;right:48px;bottom:20px;display:flex;justify-content:space-between;font-size:14px;color:#666}`;

const page = (s) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Type system ${s.id}: ${s.genre}</title>
<link href="https://fonts.googleapis.com/css2?family=${s.link}&display=block" rel="stylesheet"><style>${CSS}</style></head><body>
<div class="top"><div><span class="n">Type system ${s.id} of ${SETS.length}</span><h1 style="${ff(s.display)}">${s.genre}</h1><p class="blurb">${s.blurb}</p></div>
<div>${slider("", "Homey", "Corporate", s.corp, "#E3336F")}${slider("", "Classic", "Modern", s.modern, "#1D6B35")}</div></div>
<div class="roles">
  <div class="role"><small>Display</small><em>${s.display[0]} · headings and page titles</em><div class="s d1" style="${ff(s.display)}">Fresh food and fair prices</div></div>
  <div class="role"><small>Text</small><em>${s.text[0]} · sentences, labels, buttons</em><div class="s t1" style="${ff(s.text)}">Every special shows one price and one unit, so nobody has to guess. All five stores open at 7:00 am.</div></div>
  <div class="role"><small>Data</small><em>${s.data[0]} · prices, figures, tables</em><div class="s"><div class="n1" style="${ff(s.data)}">TT$24.95<br>1,284 · 86%</div><div class="n2" style="${ff(s.data)}">0123456789 · 14 / 15</div></div></div>
  <div class="role"><small>Accent</small><em>${s.accent[0]} · price tags, greetings, notes</em><div class="s"><div class="a1" style="${ff(s.accent)}">1 for $24.95. Try me!</div><div class="a2" style="${ff(s.accent)}">New this week at Couva</div></div></div>
</div>
<div class="g">${MODES.map((m) => applied(s, m)).join("")}</div>
<div class="foot"><span>Southern Food Basket · type system ${s.id} of ${SETS.length} · light is direction A, dark is direction B · for review by marketing</span><span>Prototype. Sample figures.</span></div></body></html>`;

const overview = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Type systems</title>
<link href="https://fonts.googleapis.com/css2?${SETS.map((s) => "family=" + s.link).join("&")}&display=block" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0} body{width:1400px;height:2010px;overflow:hidden;background:#E9E6E0;padding:42px 48px;font:400 18px/1.4 system-ui,sans-serif;color:#1c1c1c}
h1{font:800 50px/1.1 system-ui;letter-spacing:-.02em} .sub{font-size:21px;color:#555;margin:8px 0 22px;max-width:1100px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.t{background:#FFF6F1;color:#20141A;border-radius:24px;padding:24px 28px;min-height:420px;display:flex;flex-direction:column;box-shadow:0 18px 34px -24px rgba(0,0,0,.5)}
.t.dark{background:#0B2E19;color:#F7F2E6}
.k{display:flex;align-items:center;justify-content:space-between;font:700 13px/1 system-ui;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-bottom:10px}
.t h2{font-size:44px;line-height:1.05} .t p{font-size:17.5px;line-height:1.45;margin:10px 0 0;opacity:.85}
.row{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;margin-top:14px} .num{font-size:30px;line-height:1;font-variant-numeric:tabular-nums} .ac{font-size:27px;line-height:1.1}
.fs{margin-top:auto;padding-top:14px;font:600 14.5px/1.4 system-ui;opacity:.75}
.sl{display:grid;grid-template-columns:70px 1fr 82px;align-items:center;gap:8px;font:600 13px/1.2 system-ui;margin-top:8px;opacity:.9} .sl span:last-child{text-align:right} .sl i{position:relative;height:6px;border-radius:99px;background:rgba(128,128,128,.35)} .sl b{position:absolute;top:-6px;width:18px;height:18px;margin-left:-9px;border-radius:50%}</style></head><body>
<h1>Eight type systems, across the range</h1><p class="sub">From corporate to homey and from classic to modern. Each has four voices: display for headings, text for reading, data for prices and figures, accent for tags and greetings. Odd tiles are shown in light mode, even in dark.</p>
<div class="g">${SETS.map((s, i) => `<div class="t${i % 2 ? " dark" : ""}"><div class="k"><span>${s.id} · ${s.genre}</span></div>
<h2 style="${ff(s.display)}">Fresh food and fair prices, close to home.</h2><p style="${ff(s.text)}">Every special shows one price and one unit, so nobody has to guess.</p>
<div class="row"><span class="num" style="${ff(s.data)}">TT$24.95 · 1,284 · 86%</span></div><div class="row"><span class="ac" style="${ff(s.accent)};color:${i % 2 ? "#E9B949" : "#B8195A"}">1 for $24.95. Try me!</span></div>
<div class="fs">${[s.display[0], s.text[0], s.data[0], s.accent[0]].filter((v, j, a) => a.indexOf(v) === j).join(" · ")}${slider("", "Homey", "Corporate", s.corp, i % 2 ? "#E9B949" : "#E3336F")}${slider("", "Classic", "Modern", s.modern, i % 2 ? "#F7F2E6" : "#1D6B35")}</div></div>`).join("")}</div>
</body></html>`;

for (const s of SETS) writeFileSync(join(here, `type-system-${s.id}.html`), page(s));
writeFileSync(join(here, "type-overview.html"), overview());
console.log("built", SETS.length, "type systems and the overview");
