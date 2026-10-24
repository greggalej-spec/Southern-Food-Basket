// Builds the Option D storefront scene as one inline SVG (the Couva store: gold and teal glass gable,
// red sign letters on light-teal glass, arched fanlights, canopy, sliding doors, staff in red polos, flags, lot).
const fs = require('fs'); const out = process.argv[2];
const f = n => +n.toFixed(1);
const MUL = '#F7F3EA';
let s = '';
const fanPanes = (() => { let p = ''; const n = 9; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI; p += `<path d="M100 100L${f(100 + 98 * Math.cos(a0))} ${f(100 + 98 * Math.sin(a0))}A98 98 0 0 1 ${f(100 + 98 * Math.cos(a1))} ${f(100 + 98 * Math.sin(a1))}Z" fill="url(#${i % 2 ? 'gold2' : 'gold'})" stroke="${MUL}" stroke-width="3"/>`; } return p; })();
const defs = `<defs>
<linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="700"><stop offset="0" stop-color="#6FB8EA"/><stop offset=".55" stop-color="#BFE3F7"/><stop offset="1" stop-color="#EAF6FB"/></linearGradient>
<radialGradient id="sun" cx=".82" cy=".12" r=".5"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".95"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBEBB4"/><stop offset=".35" stop-color="#E9C460"/><stop offset=".68" stop-color="#C99A35"/><stop offset="1" stop-color="#F1D684"/></linearGradient>
<linearGradient id="gold2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDF2CC"/><stop offset=".5" stop-color="#F2D57E"/><stop offset="1" stop-color="#DBB24E"/></linearGradient>
<linearGradient id="teal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C2ECE4"/><stop offset=".42" stop-color="#5BBAAE"/><stop offset=".75" stop-color="#2F918A"/><stop offset="1" stop-color="#7FCFC3"/></linearGradient>
<linearGradient id="tealDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FAFAA"/><stop offset=".5" stop-color="#2F6F72"/><stop offset="1" stop-color="#4E9692"/></linearGradient>
<linearGradient id="signGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9F2EF"/><stop offset=".6" stop-color="#A3DCD5"/><stop offset="1" stop-color="#C6EAE5"/></linearGradient>
<linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F0E3"/><stop offset="1" stop-color="#E9DFC9"/></linearGradient>
<linearGradient id="asphalt" gradientUnits="userSpaceOnUse" x1="0" y1="762" x2="0" y2="1300"><stop offset="0" stop-color="#9AA0A3"/><stop offset="1" stop-color="#7C8285"/></linearGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2=".55"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".44" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".42"/><stop offset=".57" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="warm" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#FFF8E4"/><stop offset=".7" stop-color="#F7E2AE"/><stop offset="1" stop-color="#E9C77E"/></radialGradient>
<clipPath id="doorway"><rect x="736" y="636" width="128" height="76"/></clipPath>
<symbol id="fan" viewBox="0 0 200 100">${fanPanes}<path d="M72 100A28 28 0 0 1 128 100Z" fill="url(#teal)" stroke="${MUL}" stroke-width="3"/><path d="M2 100A98 98 0 0 1 198 100" fill="none" stroke="${MUL}" stroke-width="5"/></symbol>
</defs>`;

// sky, sun, clouds
s += `<rect x="-1400" y="-1200" width="4400" height="2200" fill="url(#sky)"/><rect width="1600" height="700" fill="url(#sun)"/>`;
const cloud = (x, y, k, o) => `<g opacity="${o}" transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="90" ry="34" fill="#fff"/><ellipse cx="60" cy="-22" rx="62" ry="40" fill="#fff"/><ellipse cx="-50" cy="-12" rx="52" ry="30" fill="#fff"/><ellipse cx="120" cy="2" rx="58" ry="26" fill="#fff"/></g>`;
s += `<g class="clouds">${cloud(240, 150, 1.1, .95)}${cloud(720, 90, .8, .85)}${cloud(1240, 170, 1.25, .95)}${cloud(1500, 70, .7, .8)}${cloud(-40, 300, .9, .7)}${cloud(-520, 120, 1.2, .9)}${cloud(1950, 210, 1.1, .9)}${cloud(2300, 60, .9, .8)}${cloud(-900, 260, 1, .8)}${cloud(500, -160, 1.3, .85)}${cloud(1300, -260, 1.1, .8)}</g>`;
// distant greenery and palms
let tree = 'M-1400 560'; for (let x = -1400; x <= 3000; x += 40) tree += `Q${x + 20} ${520 + ((x * 7) % 23)} ${x + 40} ${548 + ((x * 3) % 17)}`; tree += 'L3000 600L-1400 600Z';
s += `<path d="${tree}" fill="#5E9A6A"/><path d="${tree}" fill="#467E54" transform="translate(0 18)"/>`;
const palm = (x, y, h) => `<g transform="translate(${x} ${y})"><path d="M0 0Q6 ${-h / 2} 2 ${-h}" stroke="#6B5A3E" stroke-width="7" fill="none"/>${[-70, -35, 0, 35, 70, 110, -110, 150].map(a => `<path d="M2 ${-h}q${f(40 * Math.cos(a * Math.PI / 180))} ${f(-18 + 26 * Math.sin(a * Math.PI / 180))} ${f(78 * Math.cos(a * Math.PI / 180))} ${f(10 + 30 * Math.sin(a * Math.PI / 180))}" stroke="#3F7A4A" stroke-width="9" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
s += palm(70, 600, 150) + palm(1530, 600, 170) + palm(1460, 612, 120) + palm(-260, 604, 160) + palm(-620, 600, 140) + palm(1860, 606, 150) + palm(2240, 600, 170);

// wings
s += `<rect x="150" y="360" width="460" height="352" fill="url(#cream)"/><rect x="990" y="360" width="460" height="352" fill="url(#cream)"/>`;
s += `<rect x="140" y="348" width="480" height="30" fill="#DCCDAA"/><rect x="980" y="348" width="480" height="30" fill="#DCCDAA"/><rect x="140" y="378" width="480" height="4" fill="#C7B68D"/><rect x="980" y="378" width="480" height="4" fill="#C7B68D"/>`;
// left wing: two arched windows, gold fanlight over teal glass
const arch = x => `<g><rect x="${x}" y="470" width="120" height="118" fill="url(#teal)"/><rect x="${x}" y="470" width="120" height="118" fill="url(#sheen)"/>${[1, 2].map(i => `<rect x="${x + i * 40 - 2}" y="470" width="4" height="118" fill="${MUL}"/>`).join('')}<rect x="${x}" y="528" width="120" height="4" fill="${MUL}"/><use href="#fan" x="${x}" y="410" width="120" height="60"/><rect x="${x - 4}" y="466" width="128" height="6" fill="${MUL}"/><rect x="${x - 6}" y="586" width="132" height="8" fill="#DCCDAA"/></g>`;
s += arch(215) + arch(400);
// right wing: light-teal glass sign band with red serif capitals
s += `<rect x="1020" y="398" width="410" height="112" fill="url(#signGlass)"/><rect x="1020" y="398" width="410" height="112" fill="url(#sheen)"/>${[1, 2, 3, 4].map(i => `<rect x="${1020 + i * 82 - 1.5}" y="398" width="3" height="112" fill="${MUL}" opacity=".9"/>`).join('')}<rect x="1014" y="392" width="422" height="124" fill="none" stroke="${MUL}" stroke-width="6"/>`;
s += `<text x="1225" y="448" text-anchor="middle" font-family="'Alfa Slab One', Rockwell, Georgia, serif" font-size="40" fill="#D11F3A" letter-spacing="2">SOUTHERN</text><text x="1225" y="496" text-anchor="middle" font-family="'Alfa Slab One', Rockwell, Georgia, serif" font-size="40" fill="#D11F3A" letter-spacing="2">FOOD BASKET</text>`;
s += `<rect x="1020" y="528" width="410" height="60" fill="url(#tealDark)" opacity=".85"/><rect x="1020" y="528" width="410" height="60" fill="url(#sheen)"/>${[1, 2, 3, 4, 5].map(i => `<rect x="${1020 + i * 68 - 1.5}" y="528" width="3" height="60" fill="${MUL}"/>`).join('')}`;
// central gabled glass atrium
const ax0 = 610, ax1 = 990, ay = 250, apex = [800, 108];
const cols = 4, rows = 4, cw = (ax1 - ax0) / cols, rh = 350 / rows;
const tealCells = new Set(['0,2', '1,1', '2,2', '3,1', '1,3', '2,3', '0,3', '3,3', '2,0', '1,2']);
for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) s += `<rect x="${f(ax0 + c * cw)}" y="${f(ay + r * rh)}" width="${f(cw)}" height="${f(rh)}" fill="url(#${tealCells.has(c + ',' + r) ? 'teal' : (c + r) % 2 ? 'gold2' : 'gold'})"/>`;
const edge = []; const N = 10;
for (let i = 0; i <= N / 2; i++) { const t = i / (N / 2); edge.push([ax0 + (apex[0] - ax0) * t, ay + (apex[1] - ay) * t]); }
for (let i = 1; i <= N / 2; i++) { const t = i / (N / 2); edge.push([apex[0] + (ax1 - apex[0]) * t, apex[1] + (ay - apex[1]) * t]); }
for (let i = 0; i < edge.length - 1; i++) s += `<path d="M800 ${ay}L${f(edge[i][0])} ${f(edge[i][1])}L${f(edge[i + 1][0])} ${f(edge[i + 1][1])}Z" fill="url(#${i === 3 || i === 6 ? 'teal' : i % 2 ? 'gold2' : 'gold'})" stroke="${MUL}" stroke-width="4" stroke-linejoin="round"/>`;
s += `<path d="M752 ${ay}A48 48 0 0 1 848 ${ay}Z" fill="url(#teal)" stroke="${MUL}" stroke-width="4"/>`;
for (let c = 1; c < cols; c++) s += `<rect x="${f(ax0 + c * cw - 2.5)}" y="${ay}" width="5" height="350" fill="${MUL}"/>`;
for (let r = 0; r <= rows; r++) s += `<rect x="${ax0}" y="${f(ay + r * rh - 2.5)}" width="${ax1 - ax0}" height="5" fill="${MUL}"/>`;
s += `<path d="M${ax0} ${ay}L800 ${apex[1]}L${ax1} ${ay}V600H${ax0}Z" fill="url(#sheen)"/>`;
s += `<path d="M${ax0 - 12} ${ay + 2}L800 ${apex[1] - 14}L${ax1 + 12} ${ay + 2}" fill="none" stroke="#3A86A8" stroke-width="14" stroke-linejoin="miter"/><rect x="${ax0 - 8}" y="${ay}" width="10" height="350" fill="${MUL}"/><rect x="${ax1 - 2}" y="${ay}" width="10" height="350" fill="${MUL}"/>`;
// canopy with the cornucopia mark on the fascia
s += `<rect x="520" y="598" width="560" height="30" fill="#F5EFE2"/><rect x="520" y="628" width="560" height="8" fill="#CDBF9F"/><rect x="520" y="596" width="560" height="4" fill="#E4D6B6"/>`;
s += `<image href="assets/img/sfb-mark.svg" x="785" y="599" width="30" height="28"/>`;
// storefront glass
s += `<rect x="470" y="636" width="660" height="76" fill="url(#tealDark)"/><rect x="470" y="636" width="660" height="76" fill="url(#sheen)"/>`;
for (let x = 470; x <= 1130; x += 66) if (x < 730 || x > 870) s += `<rect x="${x - 2}" y="636" width="4" height="76" fill="${MUL}"/>`;
// doorway interior: warm light, shelves, and the crew
s += `<g clip-path="url(#doorway)"><rect x="736" y="636" width="128" height="76" fill="url(#warm)"/>`;
s += `<rect x="742" y="650" width="30" height="42" rx="2" fill="#E9D3A0"/><rect x="828" y="650" width="30" height="42" rx="2" fill="#E9D3A0"/>${[656, 664, 672, 680].map(y => `<rect x="744" y="${y}" width="26" height="3" fill="#D36A3C" opacity=".55"/><rect x="830" y="${y}" width="26" height="3" fill="#3E8F5C" opacity=".55"/>`).join('')}<rect x="736" y="700" width="128" height="12" fill="#C8A676" opacity=".5"/>`;
const person = (x, skin, hair, phase, k) => `<g class="staff" transform="translate(${x} 712) scale(${k || 1})">` +
  `<rect x="-6" y="-24" width="5" height="24" rx="2" fill="#2A2C3B"/><rect x="1" y="-24" width="5" height="24" rx="2" fill="#2A2C3B"/>` +
  `<path d="M-10 -24 Q-11 -44 -6 -47 L6 -47 Q11 -44 10 -24 Z" fill="#D3202D"/><path d="M-3 -47 L0 -42 L3 -47 Z" fill="#A9151F"/><circle cx="4.5" cy="-40" r="1.5" fill="#F6D24A"/>` +
  `<path d="M-10 -44 Q-15 -34 -13 -27" stroke="${skin}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` +
  `<g class="wave" style="animation-delay:${phase}s"><path d="M9 -45 Q16 -52 17 -62" stroke="${skin}" stroke-width="3.6" fill="none" stroke-linecap="round"/><circle cx="17" cy="-63.5" r="2.4" fill="${skin}"/></g>` +
  `<path d="M9 -44 Q12 -47 13 -48" stroke="#D3202D" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-9 -44 Q-12 -46 -12.5 -42" stroke="#D3202D" stroke-width="5" fill="none" stroke-linecap="round"/>` +
  `<circle cx="0" cy="-55" r="7.2" fill="${skin}"/>${hair}<circle cx="-2.4" cy="-55.5" r=".9" fill="#2A1A1F"/><circle cx="2.4" cy="-55.5" r=".9" fill="#2A1A1F"/><path d="M-2.6 -52.4 Q0 -50.2 2.6 -52.4" stroke="#2A1A1F" stroke-width=".9" fill="none" stroke-linecap="round"/></g>`;
s += `<g class="crew">` +
  person(760, '#8D5524', `<path d="M-7.4 -56 Q-7 -64 0 -64 Q7 -64 7.4 -56 Q4 -60 0 -60 Q-4 -60 -7.4 -56Z" fill="#1F1410"/>`, 0) +
  person(786, '#C68642', `<path d="M-7.6 -54 Q-8 -65 0 -64.5 Q8 -65 7.6 -54 L7.8 -49 Q6 -55 5 -58 Q0 -60 -5 -58 Q-6 -55 -7.8 -49Z" fill="#2B1B12"/>`, .35, .96) +
  person(812, '#5C3A24', `<path d="M-7.2 -57 Q-6 -63.5 0 -63.8 Q6 -63.5 7.2 -57 Q3 -59.5 0 -59.5 Q-3 -59.5 -7.2 -57Z" fill="#111"/>`, .7) +
  person(838, '#E0AC69', `<path d="M-7.6 -55 Q-8 -64.5 0 -64.5 Q8 -64.5 7.6 -55 Q8 -50 6.5 -46 Q6 -55 0 -59 Q-6 -55 -6.5 -46 Q-8 -50 -7.6 -55Z" fill="#3A2416"/>`, 1.05, .97) +
  `</g></g>`;
// sliding doors (moved apart by the scroll script)
const door = (x, cls, hx) => `<g class="door ${cls}"><rect x="${x}" y="636" width="64" height="76" fill="url(#teal)" opacity=".82"/><rect x="${x}" y="636" width="64" height="76" fill="url(#sheen)"/><rect x="${x}" y="636" width="64" height="76" fill="none" stroke="#E8E2D4" stroke-width="4"/><rect x="${hx}" y="666" width="3" height="16" rx="1.5" fill="#E8E2D4"/></g>`;
s += door(736, 'door-l', 790) + door(800, 'door-r', 807);
s += `<rect x="730" y="632" width="140" height="6" fill="#E8E2D4"/><rect id="door-target" x="736" y="636" width="128" height="76" fill="none"/>`;
// plinth, sidewalk, parking lot
s += `<rect x="140" y="712" width="1320" height="10" fill="#CFC4AC"/><rect x="-1400" y="722" width="4400" height="34" fill="#D9D6CE"/><rect x="-1400" y="756" width="4400" height="6" fill="#BDB9AE"/><rect x="-1400" y="762" width="4400" height="1400" fill="url(#asphalt)"/>`;
for (let i = -12; i < 24; i++) { const x = 60 + i * 130; s += `<path d="M${x} 790L${x - 60} 1000" stroke="#F3F1EA" stroke-width="6" opacity=".85"/><path d="M${x - 90} 1110L${x - 150} 1320" stroke="#F3F1EA" stroke-width="6" opacity=".75"/>`; }
s += `<rect x="700" y="770" width="200" height="14" fill="#F3F1EA" opacity=".8"/><rect x="700" y="790" width="200" height="14" fill="#F3F1EA" opacity=".8"/><rect x="700" y="810" width="200" height="14" fill="#F3F1EA" opacity=".8"/>`;
// company flags either side of the entrance
const flag = (x, d) => `<g class="flag" style="animation-delay:${d}s"><rect x="${x - 2}" y="520" width="4" height="202" fill="#C9CCCF"/><g class="cloth"><path d="M${x + 2} 524 q22 -8 44 0 t44 0 v40 q-22 -8 -44 0 t-44 0 Z" fill="#fff"/><path d="M${x + 2} 524 q22 -8 44 0 t44 0 v9 q-22 -8 -44 0 t-44 0 Z" fill="#E3336F"/><path d="M${x + 2} 555 q22 -8 44 0 t44 0 v9 q-22 -8 -44 0 t-44 0 Z" fill="#E3336F"/><path d="M${x + 2} 536 q22 -8 44 0 t44 0 v3 q-22 -8 -44 0 t-44 0 Z" fill="#2A8A45"/><path d="M${x + 2} 549 q22 -8 44 0 t44 0 v3 q-22 -8 -44 0 t-44 0 Z" fill="#2A8A45"/><image href="assets/img/sfb-mark.svg" x="${x + 34}" y="532" width="22" height="22"/></g></g>`;
s += flag(470, 0) + flag(1130, .6);
// pink light poles
const lamp = x => `<g><rect x="${x - 6}" y="560" width="12" height="380" fill="#E1307A"/><rect x="${x - 4}" y="560" width="70" height="8" rx="4" fill="#E1307A"/><rect x="${x + 50}" y="566" width="26" height="9" rx="3" fill="#F5F5F0"/><rect x="${x - 14}" y="932" width="28" height="14" rx="3" fill="#C92668"/></g>`;
s += lamp(110) + lamp(1490);
// cars
const car = (x, y, col, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-70" y="-30" width="140" height="34" rx="12" fill="${col}"/><path d="M-44 -30 Q-36 -58 -8 -58 L22 -58 Q44 -58 52 -30 Z" fill="${col}"/><path d="M-34 -32 Q-28 -52 -8 -52 L4 -52 L4 -32 Z M10 -32 L10 -52 L22 -52 Q38 -52 44 -32 Z" fill="#BFE0EE" opacity=".9"/><circle cx="-40" cy="4" r="13" fill="#2A2C3B"/><circle cx="40" cy="4" r="13" fill="#2A2C3B"/><circle cx="-40" cy="4" r="5" fill="#9AA0A3"/><circle cx="40" cy="4" r="5" fill="#9AA0A3"/></g>`;
s += car(300, 880, '#F2F2EE', 1) + car(1290, 900, '#C6CDD3', 1.05) + car(1520, 960, '#D3202D', 1.15);

const svg = `<svg class="storefront" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of the Southern Food Basket store front in Couva: a gabled atrium of gold and teal glass, the sign SOUTHERN FOOD BASKET, company flags, and staff in red shirts waving at the door" xmlns="http://www.w3.org/2000/svg">${defs}${s}</svg>`;
fs.writeFileSync(out, svg); console.log('scene bytes', svg.length);
