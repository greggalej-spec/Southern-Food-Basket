// Font boards for the two chosen directions: A "Market Fresh" as the light mode, B "Evergreen and Gold" as the dark
// mode (decided 13 Nov 2026). Each board is one font pairing shown in both modes, side by side, with the same
// heading, text, figures, buttons, cards and table, so the only thing that changes from board to board is the type.
// Run: node docs/brand-options/fonts.mjs, then photograph each page at 1400 x 1250 (the overview at 1400 x 1960).

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOGO = "../../public/assets/img/sfb-logo.svg";

const SETS = [
  { id: 1, head: "Plus Jakarta Sans", body: "Inter", link: "Plus+Jakarta+Sans:wght@600;800&family=Inter:wght@400;600;700", feel: "Modern and friendly", note: "Rounded, confident headings over the most readable screen text there is. The pairing on the first boards." },
  { id: 2, head: "Fraunces", body: "DM Sans", link: "Fraunces:opsz,wght@9..144,600;9..144,700&family=DM+Sans:wght@400;600;700", feel: "Warm and premium", note: "A soft serif for headings, close in spirit to the logo's lettering, with a clean sans for everything read at length." },
  { id: 3, head: "Outfit", body: "Inter", link: "Outfit:wght@600;700&family=Inter:wght@400;600;700", feel: "Geometric and clean", note: "Even, circular letterforms. Looks like a current app; numbers are especially tidy." },
  { id: 4, head: "Manrope", body: "IBM Plex Sans", link: "Manrope:wght@600;800&family=IBM+Plex+Sans:wght@400;600;700", feel: "Precise and professional", note: "The most businesslike of the six. Reads like banking or logistics software." },
  { id: 5, head: "Bricolage Grotesque", body: "Inter", link: "Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Inter:wght@400;600;700", feel: "Characterful", note: "Headings with a little personality in the curves, so the brand is recognisable without the logo." },
  { id: 6, head: "Poppins", body: "Nunito Sans", link: "Poppins:wght@600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,700", feel: "Round and approachable", note: "The friendliest. Popular with shoppers' apps; a touch wider, so headings take more room." },
];

const MODES = [
  { name: "Light mode", sub: "Market Fresh", bg: "#FFF6F1", surface: "#FFFFFF", text: "#20141A", muted: "#6A5560", line: "#F0DDE2",
    cards: [["#E3336F", "#fff"], ["#1D6B35", "#fff"], ["#FFD21A", "#20141A"], ["#FFFFFF", "#20141A"]], thead: ["#1D6B35", "#fff"], rowA: "#FCE4EC", rowB: "#E3F2E6", rowText: "#20141A",
    primary: ["#E3336F", "#fff"], secondary: ["#1D6B35", "#fff"], chip: ["#FFD21A", "#20141A"], plate: "#FFFFFF" },
  { name: "Dark mode", sub: "Evergreen and Gold", bg: "#0B2E19", surface: "#123F22", text: "#F7F2E6", muted: "#B9C9BC", line: "#24553A",
    cards: [["#E3336F", "#fff"], ["#E9B949", "#20141A"], ["#1D6B35", "#fff"], ["#FBF6EC", "#20141A"]], thead: ["#E9B949", "#20141A"], rowA: "#1A5230", rowB: "#123F22", rowText: "#F7F2E6",
    primary: ["#E9B949", "#20141A"], secondary: ["#E3336F", "#fff"], chip: ["#FBF6EC", "#20141A"], plate: "#FBF6EC" },
];

const KPIS = [["To decide", "2"], ["Sheets checked", "14 / 15"], ["Prices to add", "86"], ["Reached", "323k"]];
const ROWS = [["Fruta 1 L", "2 for 19.95", "11%"], ["Cow Brand ghee 2 lb", "119.95", "18%"], ["Carnation 24 x 250 ml", "3 for 24.95", "23%"], ["Swiss elbows 300 g", "4 for 19.95", "20%"]];

const panel = (s, m) => `<section class="p" style="background:${m.bg};color:${m.text}">
  <div class="ph"><span class="md" style="background:${m.primary[0]};color:${m.primary[1]}">${m.name}</span><span class="sb" style="color:${m.muted}">${m.sub}</span><img src="${LOGO}" alt="" style="background:${m.plate}"></div>
  <h2 style="font-family:'${s.head}'">Fresh food and fair prices, close to home.</h2>
  <h3 style="font-family:'${s.head}';color:${m.muted}">Five stores across south Trinidad</h3>
  <p style="font-family:'${s.body}'">Every special shows one price and one unit, so nobody has to guess. Type the case price where the company left it off and the margin works itself out.</p>
  <p class="nums" style="font-family:'${s.head}'">TT$24.95 &nbsp; 1,284 &nbsp; 86%</p>
  <div class="btns" style="font-family:'${s.body}'"><span class="btn" style="background:${m.primary[0]};color:${m.primary[1]}">Bring in specials</span><span class="btn" style="background:${m.secondary[0]};color:${m.secondary[1]}">Approve</span><span class="price" style="font-family:'${s.head}';background:${m.chip[0]};color:${m.chip[1]}">1 for $24.95</span></div>
  <div class="ks">${KPIS.map(([l, v], i) => `<div style="background:${m.cards[i][0]};color:${m.cards[i][1]}"><small style="font-family:'${s.body}'">${l}</small><b style="font-family:'${s.head}'">${v}</b></div>`).join("")}</div>
  <table style="font-family:'${s.body}'"><tr>${["Item", "Special", "Margin"].map((h) => `<th style="background:${m.thead[0]};color:${m.thead[1]}">${h}</th>`).join("")}</tr>${ROWS.map((r, i) => `<tr>${r.map((c) => `<td style="background:${i % 2 ? m.rowB : m.rowA};color:${m.rowText}">${c}</td>`).join("")}</tr>`).join("")}</table>
  <p class="abc" style="font-family:'${s.head}';color:${m.muted}">Aa Bb Cc Gg Qq Rr 0123456789</p>
</section>`;

const CSS = `*{box-sizing:border-box;margin:0} body{width:1400px;height:1250px;overflow:hidden;background:#E9E6E0;padding:44px 48px;font:400 18px/1.5 Inter,system-ui,sans-serif;color:#1c1c1c}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:24px} .n{display:inline-block;padding:7px 16px;border-radius:999px;background:#1c1c1c;color:#fff;font:700 15px/1 Inter;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
h1{font-size:54px;line-height:1.05;letter-spacing:-.02em;font-weight:800} .feel{font:600 24px/1.2 Inter;color:#444;margin-top:8px} .note{max-width:520px;font-size:18px;color:#555;text-align:right}
.g{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.p{border-radius:26px;padding:30px 32px 26px;box-shadow:0 24px 44px -28px rgba(0,0,0,.55)}
.ph{display:flex;align-items:center;gap:12px;margin-bottom:22px} .md{padding:7px 14px;border-radius:999px;font:700 14px/1 Inter;letter-spacing:.08em;text-transform:uppercase} .sb{font:600 16px/1 Inter} .ph img{margin-left:auto;height:54px;border-radius:10px;padding:5px 8px}
h2{font-size:50px;line-height:1.08;letter-spacing:-.02em;font-weight:800} h3{font-size:25px;font-weight:600;margin:10px 0 14px;letter-spacing:-.01em} .p p{font-size:19px;line-height:1.5}
.nums{font-size:44px !important;font-weight:800;line-height:1 !important;margin:20px 0 4px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.btns{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:18px 0 22px} .btn{padding:13px 20px;border-radius:14px;font-weight:700;font-size:17px;line-height:1} .price{padding:9px 16px;border-radius:999px;font-weight:800;font-size:23px;line-height:1}
.ks{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px} .ks div{border-radius:18px;padding:14px;min-height:108px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid rgba(0,0,0,.06)} .ks small{font-weight:700;font-size:12px;line-height:1.2;letter-spacing:.05em;text-transform:uppercase} .ks b{font-size:32px;font-weight:800;line-height:1;letter-spacing:-.03em}
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;font-size:17px} th,td{padding:12px 14px;text-align:left} th{font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase} td:first-child{font-weight:700}
.abc{font-size:26px !important;font-weight:600;margin-top:18px;letter-spacing:0}
.foot{position:absolute;left:48px;right:48px;bottom:22px;display:flex;justify-content:space-between;font-size:14px;color:#666}`;

const page = (s) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Font set ${s.id}</title>
<link href="https://fonts.googleapis.com/css2?family=${s.link}&family=Inter:wght@400;600;700&display=block" rel="stylesheet"><style>${CSS}</style></head><body>
<div class="top"><div><span class="n">Font set ${s.id} of ${SETS.length}</span><h1 style="font-family:'${s.head}'">${s.head} <span style="font-weight:600;opacity:.55">with</span> <span style="font-family:'${s.body}';font-weight:600">${s.body}</span></h1><p class="feel">${s.feel}</p></div><p class="note">${s.note}</p></div>
<div class="g">${MODES.map((m) => panel(s, m)).join("")}</div>
<div class="foot"><span>Southern Food Basket · light mode is direction A, dark mode is direction B · for review by marketing</span><span>Prototype. Sample figures.</span></div></body></html>`;

const overview = () => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Font sets</title>
<link href="https://fonts.googleapis.com/css2?${SETS.map((s) => "family=" + s.link).join("&")}&display=block" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0} body{width:1400px;height:1960px;overflow:hidden;background:#E9E6E0;padding:44px 48px;font:400 18px/1.4 Inter,system-ui,sans-serif;color:#1c1c1c}
h1{font:800 50px/1.1 "Plus Jakarta Sans",sans-serif;letter-spacing:-.02em} .sub{font-size:21px;color:#555;margin:8px 0 24px}
.r{display:grid;grid-template-columns:230px 1fr 1fr;gap:16px;align-items:stretch;margin-bottom:16px}
.who{display:flex;flex-direction:column;justify-content:center} .who b{font:700 14px/1 Inter;letter-spacing:.1em;text-transform:uppercase;color:#666} .who strong{font-size:27px;line-height:1.15;margin:8px 0 4px;letter-spacing:-.01em} .who span{font-size:16px;color:#555}
.c{border-radius:22px;padding:22px 26px;min-height:268px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 18px 34px -24px rgba(0,0,0,.5)}
.c h2{font-size:36px;line-height:1.08;letter-spacing:-.02em;font-weight:800} .c p{font-size:16.5px;line-height:1.45;margin-top:8px}
.c .x{display:flex;align-items:center;gap:12px;margin-top:12px} .c .num{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums} .c .bt{padding:10px 16px;border-radius:12px;font-weight:700;font-size:15px;line-height:1;margin-left:auto}</style></head><body>
<h1>Six font sets, in light and dark</h1><p class="sub">Same words, same colours. Light mode is direction A (Market Fresh); dark mode is direction B (Evergreen and Gold).</p>
${SETS.map((s) => `<div class="r"><div class="who"><b>Set ${s.id}</b><strong style="font-family:'${s.head}'">${s.head}</strong><span>with ${s.body}<br>${s.feel}</span></div>${MODES.map((m) => `<div class="c" style="background:${m.bg};color:${m.text}"><div><h2 style="font-family:'${s.head}'">Fresh food and fair prices, close to home.</h2><p style="font-family:'${s.body}';color:${m.muted}">Every special shows one price and one unit, so nobody has to guess.</p></div><div class="x"><span class="num" style="font-family:'${s.head}'">TT$24.95 · 86%</span><span class="bt" style="font-family:'${s.body}';background:${m.primary[0]};color:${m.primary[1]}">Bring in specials</span></div></div>`).join("")}</div>`).join("")}
</body></html>`;

for (const s of SETS) writeFileSync(join(here, `font-set-${s.id}.html`), page(s));
writeFileSync(join(here, "font-overview.html"), overview());
console.log("built", SETS.length, "font sets and the overview");
