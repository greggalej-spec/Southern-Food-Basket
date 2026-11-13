// Builds the brand direction boards: one HTML page per option, each 1400 x 2200, ready to be photographed by a
// headless browser (see render.sh). Run: node docs/brand-options/build.mjs
// Each option is the same set of assets (logo lockups, palette, type, cards, a table, buttons) in a different
// dress, so the marketing lead compares like with like. Colours named "brand" are the logo's own pink and green.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LOGO = "../../public/assets/img/sfb-logo.svg";

const OPTIONS = [
  {
    id: "a", name: "Market Fresh", idea: "The logo's pink and green, turned up. Solid colour cards, sunny yellow for prices, soft blush and mint in the tables.",
    fonts: { head: "Plus Jakarta Sans", body: "Inter", link: "Plus+Jakarta+Sans:wght@600;800&family=Inter:wght@400;600" },
    bg: "#FFF6F1", surface: "#FFFFFF", text: "#20141A", muted: "#6A5560", line: "#F0DDE2", radius: 22,
    palette: [["Raspberry", "#E3336F", "#fff", "Brand. Buttons, highlights"], ["Leaf green", "#1D6B35", "#fff", "Brand. Headers, success"], ["Deep leaf", "#123F22", "#fff", "Sidebar, footers"], ["Sun", "#FFD21A", "#20141A", "Prices, badges"], ["Blush", "#FCE4EC", "#20141A", "Table band, tints"], ["Mint", "#E3F2E6", "#20141A", "Table band, tints"], ["Paper", "#FFFFFF", "#20141A", "Cards"]],
    plates: ["#FFFFFF", "#FCE4EC", "#123F22"],
    cards: [["#E3336F", "#fff"], ["#1D6B35", "#fff"], ["#FFD21A", "#20141A"], ["#FFFFFF", "#20141A"]],
    thead: ["#1D6B35", "#fff"], rowA: "#FCE4EC", rowB: "#E3F2E6", rowText: "#20141A",
    primary: ["#E3336F", "#fff"], secondary: ["#1D6B35", "#fff"], chip: ["#FFD21A", "#20141A"], bars: ["#E3336F", "#1D6B35", "#FFD21A", "#123F22", "#E3336F", "#1D6B35"],
    side: "#123F22", sideText: "#fff", sideActive: "#E3336F",
    good: "Closest to the logo and the flyers. High energy, reads from across a room.", watch: "Three strong colours need rules, or screens get loud.",
  },
  {
    id: "b", name: "Evergreen and Gold", idea: "A dark, premium look. Deep green surfaces, gold figures, raspberry kept for the one thing that needs you.",
    fonts: { head: "Fraunces", body: "DM Sans", link: "Fraunces:opsz,wght@9..144,600;9..144,700&family=DM+Sans:wght@400;600" },
    bg: "#0B2E19", surface: "#123F22", text: "#F7F2E6", muted: "#B9C9BC", line: "#24553A", radius: 18,
    palette: [["Evergreen", "#0B2E19", "#F7F2E6", "Page"], ["Leaf", "#123F22", "#F7F2E6", "Cards"], ["Moss", "#1D6B35", "#fff", "Table band, buttons"], ["Gold", "#E9B949", "#20141A", "Figures, highlights"], ["Raspberry", "#E3336F", "#fff", "Brand. Needs attention"], ["Cream", "#FBF6EC", "#20141A", "Text, light cards"], ["Fern", "#2F5D3F", "#fff", "Table band"]],
    plates: ["#FBF6EC", "#E9B949", "#123F22"],
    cards: [["#E3336F", "#fff"], ["#E9B949", "#20141A"], ["#1D6B35", "#fff"], ["#FBF6EC", "#20141A"]],
    thead: ["#E9B949", "#20141A"], rowA: "#1A5230", rowB: "#123F22", rowText: "#F7F2E6",
    primary: ["#E9B949", "#20141A"], secondary: ["#E3336F", "#fff"], chip: ["#FBF6EC", "#20141A"], bars: ["#E9B949", "#E3336F", "#FBF6EC", "#E9B949", "#2F918A", "#E9B949"],
    side: "#071F11", sideText: "#F7F2E6", sideActive: "#E9B949",
    good: "Feels expensive and calm. Colour means something because there is so little of it.", watch: "Dark screens are harder to read in a bright shop office. Needs a light mode for print.",
  },
  {
    id: "c", name: "Carnival Bright", idea: "White space with big blocks of colour: pink, orange, yellow, green and teal. Friendly, round, very Trinidad.",
    fonts: { head: "Poppins", body: "Nunito Sans", link: "Poppins:wght@600;700&family=Nunito+Sans:wght@400;700" },
    bg: "#FFFFFF", surface: "#FFF7EF", text: "#1F1A2B", muted: "#6B6478", line: "#F1E4D8", radius: 28,
    palette: [["Raspberry", "#E3336F", "#fff", "Brand. Lead colour"], ["Mango", "#F26A2E", "#1F1A2B", "Attention, offers"], ["Sun", "#FFD21A", "#1F1A2B", "Prices"], ["Leaf", "#2A8A45", "#fff", "Brand. Success"], ["Sea", "#2F918A", "#fff", "Stores, info"], ["Peach", "#FFE9DA", "#1F1A2B", "Table band"], ["Lime mist", "#E5F5E0", "#1F1A2B", "Table band"]],
    plates: ["#FFFFFF", "#FFD21A", "#2F918A"],
    cards: [["#E3336F", "#fff"], ["#F26A2E", "#1F1A2B"], ["#2A8A45", "#fff"], ["#2F918A", "#fff"]],
    thead: ["#E3336F", "#fff"], rowA: "#FFE9DA", rowB: "#E5F5E0", rowText: "#1F1A2B",
    primary: ["#E3336F", "#fff"], secondary: ["#2F918A", "#fff"], chip: ["#FFD21A", "#1F1A2B"], bars: ["#E3336F", "#F26A2E", "#FFD21A", "#2A8A45", "#2F918A", "#E3336F"],
    side: "#1F1A2B", sideText: "#fff", sideActive: "#F26A2E",
    good: "The most visual of the four. Every department can own a colour.", watch: "Five colours can read as playful rather than premium. Best with strict rules on where each goes.",
  },
  {
    id: "d", name: "Clean Counter", idea: "Quiet greys and white with one strong green. Pink only for alerts. The look of a bank's app, with the store's colours.",
    fonts: { head: "Manrope", body: "IBM Plex Sans", link: "Manrope:wght@600;800&family=IBM+Plex+Sans:wght@400;600" },
    bg: "#F3F6F4", surface: "#FFFFFF", text: "#16212B", muted: "#5B6B76", line: "#DDE5E0", radius: 14,
    palette: [["Leaf green", "#1D6B35", "#fff", "Brand. Lead colour"], ["Slate", "#16212B", "#fff", "Text, sidebar"], ["Raspberry", "#DB2F6A", "#fff", "Brand. Alerts only"], ["Mint", "#E4F1E8", "#16212B", "Table band"], ["Rose mist", "#FBE7EE", "#16212B", "Table band"], ["Fog", "#F3F6F4", "#16212B", "Page"], ["White", "#FFFFFF", "#16212B", "Cards"]],
    plates: ["#FFFFFF", "#E4F1E8", "#16212B"],
    cards: [["#1D6B35", "#fff"], ["#FFFFFF", "#16212B"], ["#DB2F6A", "#fff"], ["#16212B", "#fff"]],
    thead: ["#16212B", "#fff"], rowA: "#E4F1E8", rowB: "#FBE7EE", rowText: "#16212B",
    primary: ["#1D6B35", "#fff"], secondary: ["#16212B", "#fff"], chip: ["#FBE7EE", "#9C1747"], bars: ["#1D6B35", "#1D6B35", "#DB2F6A", "#1D6B35", "#1D6B35", "#1D6B35"],
    side: "#16212B", sideText: "#fff", sideActive: "#1D6B35",
    good: "The most professional and the easiest to read for long stretches.", watch: "The least distinctive. Leans on the logo to feel like Southern Food Basket.",
  },
];

const KPIS = [["Requests to decide", "2", "waiting on the director"], ["Sheets checked", "14 / 15", "Divali 2026"], ["Case prices to add", "86", "across open books"], ["People reached", "323k", "up 41% in 4 weeks"]];
const ROWS = [["Fruta 1 L", "SM Jaleel", "2 for 19.95", "11%", "Checked"], ["Cow Brand ghee 2 lb", "Langston", "119.95", "18%", "Checked"], ["Carnation 24 x 250 ml", "Nestle", "3 for 24.95", "23%", "To check"], ["Swiss elbows 300 g", "Acado Foods", "4 for 19.95", "20%", "Checked"], ["Eve ketchup 750 ml", "AS Bryden", "2 for $20", "20%", "Checked"], ["Vita Malt 6-pack", "Carib", "39.95", "Add price", "To check"]];
const NAV = ["Overview", "Supplier specials", "Requests", "Bulk orders", "Marketing figures"];

function page(o) {
  const css = `
  *{box-sizing:border-box;margin:0}
  body{width:1400px;height:2200px;overflow:hidden;background:${o.bg};color:${o.text};font:400 20px/1.5 "${o.fonts.body}",system-ui,sans-serif;padding:56px 60px}
  h1,h2,h3,.h{font-family:"${o.fonts.head}",system-ui,sans-serif;letter-spacing:-.02em;line-height:1.1}
  .top{display:grid;grid-template-columns:1fr auto;gap:40px;align-items:end;margin-bottom:34px}
  .tag{display:inline-block;padding:8px 18px;border-radius:999px;background:${o.primary[0]};color:${o.primary[1]};font:700 18px/1 "${o.fonts.body}";letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px}
  h1{font-size:76px;font-weight:800} .idea{font-size:24px;color:${o.muted};max-width:820px;margin-top:14px}
  .label{font:700 16px/1 "${o.fonts.body}";letter-spacing:.12em;text-transform:uppercase;color:${o.muted};margin:34px 0 14px}
  .plates{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  .plate{height:190px;border-radius:${o.radius}px;display:grid;place-items:center;border:1px solid ${o.line}} .plate img{width:74%;height:auto}
  .pal{display:grid;grid-template-columns:repeat(7,1fr);gap:14px}
  .sw{border-radius:${o.radius}px;padding:18px 16px;height:196px;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid ${o.line}}
  .sw b{font:700 19px/1.2 "${o.fonts.head}"} .sw i{font-style:normal;font:600 16px/1.3 ui-monospace,Consolas,monospace;opacity:.9} .sw span{font-size:14px;line-height:1.25;opacity:.85;margin-top:6px}
  .type{display:grid;grid-template-columns:1.25fr 1fr;gap:28px;align-items:stretch}
  .spec{background:${o.surface};border:1px solid ${o.line};border-radius:${o.radius}px;padding:30px 34px}
  .spec h2{font-size:54px;font-weight:800} .spec h3{font-size:28px;font-weight:600;margin:10px 0;color:${o.muted}} .spec p{font-size:20px}
  .spec .nums{font:800 46px/1 "${o.fonts.head}";font-variant-numeric:tabular-nums;margin-top:16px} .fname{font:700 15px/1 "${o.fonts.body}";letter-spacing:.1em;text-transform:uppercase;color:${o.muted};margin-bottom:14px}
  .ui{display:grid;grid-template-columns:230px 1fr;gap:22px}
  .side{background:${o.side};color:${o.sideText};border-radius:${o.radius}px;padding:22px 16px;display:flex;flex-direction:column;gap:6px}
  .side img{width:150px;background:#fff;border-radius:12px;padding:8px;margin-bottom:14px}
  .side span{padding:12px 14px;border-radius:12px;font:600 17px/1.2 "${o.fonts.body}";opacity:.85} .side .on{background:${o.sideActive};color:${o.id === "b" ? "#20141A" : "#fff"};opacity:1}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px}
  .kpi{border-radius:${o.radius}px;padding:22px;min-height:168px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 14px 30px -20px rgba(0,0,0,.45);border:1px solid rgba(0,0,0,.06)}
  .kpi small{font:700 15px/1.25 "${o.fonts.body}";letter-spacing:.04em;text-transform:uppercase;opacity:.9} .kpi b{font:800 50px/1 "${o.fonts.head}";letter-spacing:-.03em} .kpi em{font-style:normal;font-size:15px;opacity:.9}
  .row2{display:grid;grid-template-columns:1.55fr 1fr;gap:18px}
  table{width:100%;border-collapse:separate;border-spacing:0;border-radius:${o.radius}px;overflow:hidden;font-size:18px;box-shadow:0 14px 30px -22px rgba(0,0,0,.45)}
  th{background:${o.thead[0]};color:${o.thead[1]};text-align:left;padding:15px 16px;font:700 15px/1 "${o.fonts.body}";letter-spacing:.08em;text-transform:uppercase}
  td{padding:14px 16px;color:${o.rowText}} tr:nth-child(odd) td{background:${o.rowA}} tr:nth-child(even) td{background:${o.rowB}} td:first-child{font-weight:700}
  .pill{display:inline-block;white-space:nowrap;padding:5px 12px;border-radius:999px;font:700 14px/1.2 "${o.fonts.body}"} .ok{background:${o.secondary[0]};color:${o.secondary[1]}} .todo{background:${o.primary[0]};color:${o.primary[1]}}
  .chart{background:${o.surface};border:1px solid ${o.line};border-radius:${o.radius}px;padding:22px 24px;display:flex;flex-direction:column}
  .chart h3{font-size:22px;font-weight:700} .bars{flex:1;display:flex;align-items:flex-end;gap:14px;margin-top:16px;min-height:150px} .bars i{flex:1;border-radius:10px 10px 4px 4px}
  .btns{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;align-items:center}
  .btn{padding:14px 24px;border-radius:${Math.min(o.radius, 16)}px;font:700 18px/1 "${o.fonts.body}"} .ghost{border:2px solid ${o.text};color:${o.text}}
  .price{font:800 26px/1 "${o.fonts.head}";padding:10px 18px;border-radius:999px;background:${o.chip[0]};color:${o.chip[1]}}
  .notes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px} .note{border-radius:${o.radius}px;padding:20px 24px;background:${o.surface};border:1px solid ${o.line};font-size:19px} .note b{display:block;font:700 15px/1 "${o.fonts.body}";letter-spacing:.1em;text-transform:uppercase;color:${o.muted};margin-bottom:8px}
  .foot{position:absolute;left:60px;right:60px;bottom:30px;display:flex;justify-content:space-between;font-size:15px;color:${o.muted}}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Option ${o.id.toUpperCase()}: ${o.name}</title>
<link href="https://fonts.googleapis.com/css2?family=${o.fonts.link}&display=block" rel="stylesheet"><style>${css}</style></head><body>
<div class="top"><div><span class="tag">Option ${o.id.toUpperCase()}</span><h1>${o.name}</h1><p class="idea">${o.idea}</p></div></div>
<p class="label">Logo lockups</p>
<div class="plates">${o.plates.map((p) => `<div class="plate" style="background:${p}"><img src="${LOGO}" alt=""></div>`).join("")}</div>
<p class="label">Palette</p>
<div class="pal">${o.palette.map(([n, hex, fg, role]) => `<div class="sw" style="background:${hex};color:${fg}"><b>${n}</b><i>${hex}</i><span>${role}</span></div>`).join("")}</div>
<p class="label">Type</p>
<div class="type"><div class="spec"><p class="fname">Headings: ${o.fonts.head}</p><h2>Fresh food and fair prices, close to home.</h2><h3>Five stores across south Trinidad</h3><p class="nums">TT$24.95 &nbsp; 1,284 &nbsp; 86%</p></div>
<div class="spec"><p class="fname">Text: ${o.fonts.body}</p><p>Every special shows one price and one unit, so nobody has to guess. Type the case price where the company left it off and the margin works itself out.</p><div class="btns"><span class="btn" style="background:${o.primary[0]};color:${o.primary[1]}">Bring in specials</span><span class="btn" style="background:${o.secondary[0]};color:${o.secondary[1]}">Approve</span><span class="btn ghost">Cancel</span><span class="price">1 for $24.95</span></div></div></div>
<p class="label">On the dashboards: cards with contrast, tables in colour</p>
<div class="ui"><div class="side"><img src="${LOGO}" alt="">${NAV.map((n, i) => `<span class="${i === 0 ? "on" : ""}">${n}</span>`).join("")}</div>
<div><div class="kpis">${KPIS.map(([l, v, s], i) => `<div class="kpi" style="background:${o.cards[i][0]};color:${o.cards[i][1]}"><small>${l}</small><b>${v}</b><em>${s}</em></div>`).join("")}</div>
<div class="row2"><table><tr><th>Item</th><th>Company</th><th>Special</th><th>Margin</th><th>Status</th></tr>${ROWS.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><span class="pill ${r[4] === "Checked" ? "ok" : "todo"}">${r[4]}</span></td></tr>`).join("")}</table>
<div class="chart"><h3>Reach by week</h3><div class="bars">${[46, 58, 52, 70, 86, 100].map((h, i) => `<i style="height:${h}%;background:${o.bars[i]}"></i>`).join("")}</div></div></div></div></div>
<div class="notes"><div class="note"><b>Why it works</b>${o.good}</div><div class="note"><b>Watch out for</b>${o.watch}</div></div>
<div class="foot"><span>Southern Food Basket · brand direction ${o.id.toUpperCase()} of ${OPTIONS.length} · for review by marketing</span><span>Prototype. Sample figures.</span></div>
</body></html>`;
}

function overview() {
  const tile = (o) => `<div class="t" style="background:${o.bg};color:${o.text};border-radius:${o.radius}px">
  <span class="tg" style="background:${o.primary[0]};color:${o.primary[1]}">Option ${o.id.toUpperCase()}</span><h2 style="font-family:'${o.fonts.head}'">${o.name}</h2>
  <div class="sws">${o.palette.slice(0, 6).map((p) => `<i style="background:${p[1]}"></i>`).join("")}</div>
  <div class="ks">${o.cards.map((c, i) => `<div style="background:${c[0]};color:${c[1]};border-radius:${Math.min(o.radius, 18)}px"><small>${KPIS[i][0]}</small><b style="font-family:'${o.fonts.head}'">${KPIS[i][1]}</b></div>`).join("")}</div>
  <table>${[["Item", "Special", "Margin"], ...ROWS.slice(0, 4).map((r) => [r[0], r[2], r[3]])].map((r, i) => `<tr>${r.map((c) => (i === 0 ? `<th style="background:${o.thead[0]};color:${o.thead[1]}">${c}</th>` : `<td style="background:${i % 2 ? o.rowA : o.rowB};color:${o.rowText}">${c}</td>`)).join("")}</tr>`).join("")}</table>
  <p style="font-family:'${o.fonts.body}';color:${o.muted}">${o.fonts.head} with ${o.fonts.body}</p></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Brand directions</title>
<link href="https://fonts.googleapis.com/css2?${OPTIONS.map((o) => "family=" + o.fonts.link).join("&")}&display=block" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0} body{width:1400px;height:1510px;overflow:hidden;background:#EDEBE6;padding:50px 54px;font:400 18px/1.4 Inter,system-ui,sans-serif;color:#1c1c1c}
h1{font:800 54px/1.1 "Plus Jakarta Sans",sans-serif;letter-spacing:-.02em} .sub{font-size:22px;color:#555;margin:10px 0 30px;max-width:980px}
.g{display:grid;grid-template-columns:1fr 1fr;gap:26px} .t{padding:30px;box-shadow:0 20px 40px -26px rgba(0,0,0,.5);border:1px solid rgba(0,0,0,.06)}
.tg{display:inline-block;padding:7px 14px;border-radius:999px;font:700 14px/1 Inter;letter-spacing:.08em;text-transform:uppercase} h2{font-size:40px;font-weight:800;margin:12px 0 16px;letter-spacing:-.02em}
.sws{display:flex;height:44px;border-radius:12px;overflow:hidden;margin-bottom:16px} .sws i{flex:1}
.ks{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px} .ks div{padding:14px;min-height:112px;display:flex;flex-direction:column;justify-content:space-between} .ks small{font:700 11px/1.2 Inter;text-transform:uppercase;letter-spacing:.04em} .ks b{font-size:30px;font-weight:800}
table{width:100%;border-collapse:separate;border-spacing:0;border-radius:14px;overflow:hidden;font-size:16px} th,td{padding:11px 14px;text-align:left} th{font:700 13px/1 Inter;letter-spacing:.06em;text-transform:uppercase} td:first-child{font-weight:700}
.t p{margin-top:14px;font-size:16px}</style></head><body>
<h1>Southern Food Basket: four brand directions</h1><p class="sub">The same logo, cards and table in four different dresses. Pick one, or mix: the palette from one and the type from another.</p>
<div class="g">${OPTIONS.map(tile).join("")}</div></body></html>`;
}

for (const o of OPTIONS) writeFileSync(join(here, `option-${o.id}.html`), page(o));
writeFileSync(join(here, "overview.html"), overview());
console.log("built", OPTIONS.length, "options and the overview");
