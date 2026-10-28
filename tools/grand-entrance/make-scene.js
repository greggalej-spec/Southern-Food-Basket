// Builds the Option D storefront scene as one inline SVG (the Couva store: gold and teal glass gable,
// red sign letters on light-teal glass, arched fanlights, canopy, sliding doors, staff in red polos, flags, lot).
const fs = require('fs'); const out = process.argv[2];
const f = n => +n.toFixed(1);
const MUL = '#F7F3EA';
let s = '';
const fanPanes = (() => { let p = ''; const n = 9; for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI; p += `<path d="M100 100L${f(100 + 98 * Math.cos(a0))} ${f(100 + 98 * Math.sin(a0))}A98 98 0 0 1 ${f(100 + 98 * Math.cos(a1))} ${f(100 + 98 * Math.sin(a1))}Z" fill="url(#${i % 2 ? 'gold2' : 'gold'})" stroke="${MUL}" stroke-width="3"/>`; } return p; })();
// One coconut-palm crown, reused by every palm. Each frond is a curved midrib with fine leaflets off both sides,
// angled toward the tip and pulled down by their own weight, shortening to the tip; two dead fronds hang under the nuts.
const frond = (deg, L, col, w) => {
  const a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), C = [.55 * L * c, -.55 * L * sn - 20], T = [L * c, -.6 * L * sn + 18];
  let d = `M0 0Q${f(C[0])} ${f(C[1])} ${f(T[0])} ${f(T[1])}`;
  for (let i = 2, N = 15; i < N; i++) {
    const t = i / N, u = 1 - t, P = [2 * u * t * C[0] + t * t * T[0], 2 * u * t * C[1] + t * t * T[1]];
    const D = [2 * u * C[0] + 2 * t * (T[0] - C[0]), 2 * u * C[1] + 2 * t * (T[1] - C[1])], m = Math.hypot(D[0], D[1]) || 1, dx = D[0] / m, dy = D[1] / m;
    const len = 22 * Math.min(1, t * 3.5) * (1 - .72 * t);
    for (const sd of [1, -1]) {
      const lx = dx * .45 - sd * dy * .7, ly = dy * .45 + sd * dx * .7 + 1, q = Math.hypot(lx, ly);
      const jit = .8 + .4 * ((Math.sin(i * 12.99 + deg * .37 + sd * 4.1) * 43758.5 % 1 + 1) % 1); // no two leaflets alike
      d += `M${f(P[0])} ${f(P[1])}l${f(lx / q * len * jit)} ${f(ly / q * len * jit)}`;
    }
  }
  return `<path d="${d}" stroke="${col}" stroke-width="${w || 1.5}" stroke-linecap="round" fill="none"/>`;
};
const crown = [[262, 50, '#8E7B4C', 1.3], [-80, 48, '#9A8655', 1.3], [210, 82, '#2C5636'], [-30, 84, '#2C5636'], [168, 90, '#33663F'], [12, 92, '#33663F'], [130, 80, '#2F6139'], [50, 82, '#2F6139']].map(([d, L, c, w]) => frond(d, L, c, w)).join('') +
  '<g fill="#5B4A24"><circle cx="-4" cy="6" r="4.2"/><circle cx="4" cy="7" r="4.2"/><circle cx="0" cy="10.5" r="4"/></g>' +
  [[92, 72, '#4A8550'], [146, 86, '#4F8B4F'], [36, 88, '#4F8B4F'], [190, 80, '#5B9150'], [-10, 82, '#5B9150'], [232, 68, '#6E8B47'], [-52, 66, '#6E8B47']].map(([d, L, c]) => frond(d, L, c)).join('');
const defs = `<defs>
<linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="700"><stop offset="0" stop-color="#6FB8EA"/><stop offset=".55" stop-color="#BFE3F7"/><stop offset="1" stop-color="#EAF6FB"/></linearGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".95"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBEBB4"/><stop offset=".35" stop-color="#E9C460"/><stop offset=".68" stop-color="#C99A35"/><stop offset="1" stop-color="#F1D684"/></linearGradient>
<linearGradient id="gold2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDF2CC"/><stop offset=".5" stop-color="#F2D57E"/><stop offset="1" stop-color="#DBB24E"/></linearGradient>
<linearGradient id="teal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C2ECE4"/><stop offset=".42" stop-color="#5BBAAE"/><stop offset=".75" stop-color="#2F918A"/><stop offset="1" stop-color="#7FCFC3"/></linearGradient>
<linearGradient id="tealDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6FAFAA"/><stop offset=".5" stop-color="#2F6F72"/><stop offset="1" stop-color="#4E9692"/></linearGradient>
<linearGradient id="signGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D9F2EF"/><stop offset=".6" stop-color="#A3DCD5"/><stop offset="1" stop-color="#C6EAE5"/></linearGradient>
<linearGradient id="cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F0E3"/><stop offset="1" stop-color="#E9DFC9"/></linearGradient>
<linearGradient id="asphalt" gradientUnits="userSpaceOnUse" x1="0" y1="762" x2="0" y2="1300"><stop offset="0" stop-color="#9AA0A3"/><stop offset="1" stop-color="#7C8285"/></linearGradient>
<radialGradient id="warm" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#FFF8E4"/><stop offset=".7" stop-color="#F7E2AE"/><stop offset="1" stop-color="#E9C77E"/></radialGradient>
<clipPath id="doorway"><rect x="736" y="636" width="128" height="76"/></clipPath>
<symbol id="fan" viewBox="0 0 200 100">${fanPanes}<path d="M72 100A28 28 0 0 1 128 100Z" fill="url(#teal)" stroke="${MUL}" stroke-width="3"/><path d="M2 100A98 98 0 0 1 198 100" fill="none" stroke="${MUL}" stroke-width="5"/></symbol>
<linearGradient id="shop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6DD"/><stop offset="1" stop-color="#EAD6A6"/></linearGradient>
<pattern id="stock" patternUnits="userSpaceOnUse" x="0" y="652" width="42" height="12"><rect width="42" height="12" fill="#E8D3A2"/><rect x="1" y="3" width="5" height="7" fill="#D3202D"/><rect x="7" y="2" width="6" height="8" fill="#F2C14E"/><rect x="14" y="4" width="4" height="6" fill="#2A8A45"/><rect x="19" y="3" width="6" height="7" fill="#E3336F"/><rect x="26" y="2" width="5" height="8" fill="#F7F3EA"/><rect x="32" y="4" width="4" height="6" fill="#3A86A8"/><rect x="37" y="3" width="4" height="7" fill="#E07B2E"/><rect y="10" width="42" height="2" fill="#B8975F"/></pattern>
<pattern id="tiles" patternUnits="userSpaceOnUse" x="0" y="722" width="64" height="17"><rect width="64" height="17" fill="#D9D6CE"/><path d="M.5 0V17M0 .5H64" stroke="#C6C2B6" stroke-width="1.2"/></pattern>
<g id="crown">${crown}</g>
</defs>`;

// sky, sun, clouds. The sky runs far past any camera frame (tall phones look up to y≈-1320), and the sun glow is
// an ellipse whose gradient reaches zero exactly at its edge: a clipped rect left a hard seam in the sky.
s += `<rect x="-4000" y="-4000" width="9600" height="5000" fill="url(#sky)"/><ellipse cx="1312" cy="84" rx="800" ry="350" fill="url(#sun)"/>`;
const cloud = (x, y, k, o) => `<g opacity="${o}" transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="0" rx="90" ry="34" fill="#fff"/><ellipse cx="60" cy="-22" rx="62" ry="40" fill="#fff"/><ellipse cx="-50" cy="-12" rx="52" ry="30" fill="#fff"/><ellipse cx="120" cy="2" rx="58" ry="26" fill="#fff"/></g>`;
s += `<g class="clouds">${cloud(240, 150, 1.1, .95)}${cloud(720, 90, .8, .85)}${cloud(1240, 170, 1.25, .95)}${cloud(1500, 70, .7, .8)}${cloud(-40, 300, .9, .7)}${cloud(-520, 120, 1.2, .9)}${cloud(1950, 210, 1.1, .9)}${cloud(2300, 60, .9, .8)}${cloud(-900, 260, 1, .8)}${cloud(500, -160, 1.3, .85)}${cloud(1300, -260, 1.1, .8)}</g>`;
// a few birds riding the breeze (living.js flaps and drifts them)
s += `<g class="birds" fill="none" stroke="#35505E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${[[420, 210, 1], [470, 236, .8], [1040, 150, .9]].map(([x, y, k]) => `<path class="bird" transform="translate(${x} ${y}) scale(${k})" d="M-9 0Q-4.5 -5 0 0Q4.5 -5 9 0"/>`).join('')}</g>`;
// distant greenery and palms
let tree = 'M-1400 560'; for (let x = -1400; x <= 3000; x += 40) tree += `Q${x + 20} ${520 + ((x * 7) % 23)} ${x + 40} ${548 + ((x * 3) % 17)}`; tree += 'L3000 600L-1400 600Z';
s += `<path d="${tree}" fill="#5E9A6A"/><path d="${tree}" fill="#467E54" transform="translate(0 18)"/>`;
// slender leaning trunks with a swollen base, a shaded side and faint leaf-scar rings; mirrored palms lean the other
// way (data-dir tells living.js), and the crown sits in .sway so it can rock about the trunk top
const palm = (x, y, h, k, flip) => `<g class="palm" data-dir="${flip ? -1 : 1}" transform="translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}">` +
  `<path d="M-6.5 0Q-3.6 -5 -3.8 -14Q1.6 ${f(-h / 2)} -.6 ${-h}L4.6 ${-h}Q8.4 ${f(-h / 2)} 3.8 -14Q3.4 -5 6 0Z" fill="#83735C"/>` +
  `<path d="M1.6 -12Q6.4 ${f(-h / 2)} 2.6 ${-h}L4.6 ${-h}Q8.4 ${f(-h / 2)} 3.8 -14Z" fill="#665843" opacity=".55"/>` +
  `<path d="M0 -8Q5 ${f(-h / 2)} 2 ${-h + 3}" stroke="#5E513C" stroke-width="5.6" stroke-dasharray=".9 4.2" opacity=".5" fill="none"/>` +
  `<g transform="translate(2 ${-h})"><g class="sway"><use href="#crown" transform="scale(${k})"/></g></g></g>`;
s += palm(70, 600, 150, 1, 0) + palm(1530, 600, 170, 1.08, 1) + palm(1460, 612, 120, .82, 0) + palm(-260, 604, 160, 1.02, 1) + palm(-620, 600, 140, .94, 0) + palm(1860, 606, 150, 1, 1) + palm(2240, 600, 170, 1.06, 0);

// wings
s += `<rect x="150" y="360" width="460" height="352" fill="url(#cream)"/><rect x="990" y="360" width="460" height="352" fill="url(#cream)"/>`;
s += `<rect x="140" y="348" width="480" height="30" fill="#DCCDAA"/><rect x="980" y="348" width="480" height="30" fill="#DCCDAA"/><rect x="140" y="378" width="480" height="4" fill="#C7B68D"/><rect x="980" y="378" width="480" height="4" fill="#C7B68D"/>`;
// left wing: two arched windows, gold fanlight over teal glass
const arch = x => `<g><rect x="${x}" y="470" width="120" height="118" fill="url(#teal)"/>${[1, 2].map(i => `<rect x="${x + i * 40 - 2}" y="470" width="4" height="118" fill="${MUL}"/>`).join('')}<rect x="${x}" y="528" width="120" height="4" fill="${MUL}"/><use href="#fan" x="${x}" y="410" width="120" height="60"/><rect x="${x - 4}" y="466" width="128" height="6" fill="${MUL}"/><rect x="${x - 6}" y="586" width="132" height="8" fill="#DCCDAA"/></g>`;
s += arch(215) + arch(400);
// right wing: light-teal glass sign band with red serif capitals
s += `<rect x="1020" y="398" width="410" height="112" fill="url(#signGlass)"/>${[1, 2, 3, 4].map(i => `<rect x="${1020 + i * 82 - 1.5}" y="398" width="3" height="112" fill="${MUL}" opacity=".9"/>`).join('')}<rect x="1014" y="392" width="422" height="124" fill="none" stroke="${MUL}" stroke-width="6"/>`;
s += `<text x="1225" y="448" text-anchor="middle" font-family="'Alfa Slab One', Rockwell, Georgia, serif" font-size="40" fill="#D11F3A" letter-spacing="2">SOUTHERN</text><text x="1225" y="496" text-anchor="middle" font-family="'Alfa Slab One', Rockwell, Georgia, serif" font-size="40" fill="#D11F3A" letter-spacing="2">FOOD BASKET</text>`;
s += `<rect x="1020" y="528" width="410" height="60" fill="url(#tealDark)" opacity=".85"/>${[1, 2, 3, 4, 5].map(i => `<rect x="${1020 + i * 68 - 1.5}" y="528" width="3" height="60" fill="${MUL}"/>`).join('')}`;
// wall detail: shadow under the parapet, a skirting course, downpipes with brackets, and teal sconces between the windows
s += [150, 990].map(x => `<rect x="${x}" y="382" width="460" height="7" fill="#7A6A44" opacity=".1"/><rect x="${x}" y="690" width="460" height="22" fill="#DDD0B2"/><rect x="${x}" y="689" width="460" height="2" fill="#C9B994"/>`).join('');
s += [160, 596, 1002, 1436].map(x => `<rect x="${x}" y="384" width="6" height="306" fill="#D2C3A0"/>${[440, 540, 640].map(y => `<rect x="${x - 2}" y="${y}" width="10" height="4" rx="1" fill="#BFAE87"/>`).join('')}`).join('');
s += [190, 367, 545].map(x => `<ellipse cx="${x}" cy="474" rx="11" ry="7" fill="#FFF3C4" opacity=".4"/><path d="M${x - 6} 454h12l-2 -5h-8z" fill="#245A5C"/><rect x="${x - 4}" y="454" width="8" height="12" rx="2" fill="#2F6F72"/>`).join('');
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
s += `<path d="M${ax0 - 12} ${ay + 2}L800 ${apex[1] - 14}L${ax1 + 12} ${ay + 2}" fill="none" stroke="#3A86A8" stroke-width="14" stroke-linejoin="miter"/><rect x="${ax0 - 8}" y="${ay}" width="10" height="350" fill="${MUL}"/><rect x="${ax1 - 2}" y="${ay}" width="10" height="350" fill="${MUL}"/>`;
// canopy with the cornucopia mark on the fascia
s += `<rect x="520" y="598" width="560" height="30" fill="#F5EFE2"/><rect x="520" y="628" width="560" height="8" fill="#CDBF9F"/><rect x="520" y="596" width="560" height="4" fill="#E4D6B6"/>`;
s += `<image href="/assets/img/sfb-mark.svg" x="785" y="599" width="30" height="28"/>`;
// storefront glass, now with the shop behind it: ceiling lights and stocked shelf runs seen through a teal tint
s += `<rect x="470" y="636" width="660" height="76" fill="url(#shop)"/>${[500, 590, 680, 920, 1010, 1080].map(x => `<rect x="${x}" y="641" width="34" height="2.5" rx="1" fill="#FFFDF2"/>`).join('')}` +
  `<rect x="478" y="652" width="246" height="48" fill="url(#stock)"/><rect x="876" y="652" width="246" height="48" fill="url(#stock)"/><rect x="470" y="700" width="660" height="12" fill="#D9C08C"/>`;
s += `<rect x="470" y="636" width="660" height="76" fill="url(#tealDark)" opacity=".62"/>`;
for (let x = 470; x <= 1130; x += 66) if (x < 730 || x > 870) s += `<rect x="${x - 2}" y="636" width="4" height="76" fill="${MUL}"/>`;
// doorway interior: warm light, shelves, and the crew
s += `<g clip-path="url(#doorway)"><rect x="736" y="636" width="128" height="76" fill="url(#warm)"/>`;
s += `<rect x="742" y="650" width="30" height="42" rx="2" fill="#E9D3A0"/><rect x="828" y="650" width="30" height="42" rx="2" fill="#E9D3A0"/>${[656, 664, 672, 680].map(y => `<rect x="744" y="${y}" width="26" height="3" fill="#D36A3C" opacity=".55"/><rect x="830" y="${y}" width="26" height="3" fill="#3E8F5C" opacity=".55"/>`).join('')}<rect x="736" y="700" width="128" height="12" fill="#C8A676" opacity=".5"/>`;
// The crew, drawn to hold up when the camera reaches the door. Each arm is a shoulder → elbow → wrist chain, every
// segment drawn hanging straight down from its joint, so living.js can turn the joints (j-sh, j-el, j-wr) and give each
// person their own tempo, reach and pauses (data-*). The transforms written here are the still pose for no-JS and
// reduced motion: one arm up, mid-wave.
const shade = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
const RED = '#D3202D', RED_D = '#A9151F';
const hand = (skin, sk, side) => `<g stroke="${skin}" stroke-width="1.2" stroke-linecap="round">${[-1.5, -.5, .5, 1.5].map(x => `<path d="M${x} 3.4L${f(x * 1.3)} ${Math.abs(x) > 1 ? 6.2 : 7}"/>`).join('')}<path d="M${f(side * 1.9)} 1.2L${f(side * 3.5)} 3.6"/></g>` +
  `<ellipse cx="0" cy="2.5" rx="2.3" ry="2.5" fill="${skin}"/><path d="M-1.3 3.4Q0 4.3 1.3 3.4" stroke="${sk}" stroke-width=".5" fill="none"/>`;
const arm = (cls, side, a1, a2, skin, sk) => `<g class="${cls}" transform="translate(${f(side * 8.6)} -44.6)"><g class="j-sh" transform="rotate(${f(a1)})">` +
  `<path d="M0 5L0 9.5" stroke="${skin}" stroke-width="3.6" stroke-linecap="round"/>` +
  `<g transform="translate(0 9.5)"><g class="j-el" transform="rotate(${f(a2)})"><path d="M0 0L0 8.6" stroke="${skin}" stroke-width="3.3" stroke-linecap="round"/>` +
  `<g transform="translate(0 8.6)"><g class="j-wr">${hand(skin, sk, side)}</g></g></g></g>` +
  `<path d="M-3 -1.2Q-3.6 3.4 -3.3 5.8L3.3 5.8Q3.6 3.4 3 -1.2Q0 -2.8 -3 -1.2Z" fill="${RED}"/><path d="M-3.3 5.8H3.3" stroke="${RED_D}" stroke-width="1"/></g></g>`;
const HAIR = {
  crop: h => ({ front: `<path d="M-7.3 -56.5Q-7.8 -63.8 0 -64.3Q7.8 -63.8 7.3 -56.5Q6.4 -60.4 3.4 -61.2Q0 -60.4 -3.4 -61.2Q-6.4 -60.4 -7.3 -56.5Z" fill="${h}"/>`,
    beard: `<path d="M-6.9 -55Q-6.6 -48.4 0 -47.8Q6.6 -48.4 6.9 -55Q6.4 -51.6 3.4 -50.6Q0 -51.4 -3.4 -50.6Q-6.4 -51.6 -6.9 -55Z" fill="${h}" opacity=".85"/>` }),
  pony: h => ({ back: `<g class="j-pony"><path d="M3.6 -61.5Q11 -60 10.4 -52Q10 -46 7.4 -44.2Q8.4 -50 6.6 -55Q5.6 -58.6 3.6 -58.6Z" fill="${h}"/><circle cx="5.6" cy="-60.4" r="1.5" fill="#E3336F"/></g>`,
    front: `<path d="M-7.6 -54.2Q-8.4 -65 0 -64.8Q8.4 -65 7.6 -54.2Q7.2 -59.4 4.2 -61Q-.8 -59.4 -4.6 -61.6Q-6.8 -59.4 -7.6 -54.2Z" fill="${h}"/>`, studs: 1 }),
  afro: h => ({ back: `<ellipse cx="0" cy="-59.4" rx="9.8" ry="8.4" fill="${h}"/>`, front: `<path d="M-7.4 -57.2Q-6.8 -62.8 0 -63Q6.8 -62.8 7.4 -57.2Q4 -60.8 0 -61Q-4 -60.8 -7.4 -57.2Z" fill="${h}"/>` }),
  cap: h => ({ back: `<path d="M-7.6 -57Q-9.4 -49 -6.8 -45.6L-3.6 -47.6Q-6.2 -51 -5.8 -56ZM7.6 -57Q9.4 -49 6.8 -45.6L3.6 -47.6Q6.2 -51 5.8 -56Z" fill="${h}"/>`,
    front: `<path d="M-7.5 -59Q-7.6 -67.4 0 -67.4Q7.6 -67.4 7.5 -59Z" fill="#C81D2A"/><path d="M-8.6 -59.6Q0 -58 8.6 -59.6Q9.8 -58.6 9.1 -57.7Q0 -56.8 -9.1 -57.7Q-9.8 -58.6 -8.6 -59.6Z" fill="${RED_D}"/><circle cx="0" cy="-63.4" r="1.6" fill="#FBF7EF"/>`, noBrows: 1 })
};
const person = o => {
  const { x, k, skin, hair, style, side, reach, open } = o, sk = shade(skin, .84), H = HAIR[style](hair);
  return `<g class="staff" transform="translate(${x} 712) scale(${k})" data-side="${side}" data-reach="${reach}" data-tempo="${o.tempo}" data-swing="${o.swing}" data-burst="${o.burst}" data-rest="${o.rest}">` +
    `<ellipse cx="0" cy="0" rx="11" ry="1.8" fill="#3B2A10" opacity=".22"/><g class="j-body">` +
    // trousers, shoes, neck, polo (shaded side, collar, placket, logo patch, name badge), belt
    `<path d="M-6.4 -24.5H-.7L-1 -2.2H-5.8Z" fill="#2A2C3B"/><path d="M.7 -24.5H6.4L5.8 -2.2H1Z" fill="#23252F"/>` +
    `<path d="M-6.6 -2.6H-.6Q.2 -2.6 .2 -.8V0H-7.6Q-7.8 -1.8 -6.6 -2.6ZM.6 -2.6H6.6Q7.8 -1.8 7.6 0H-.2V-.8Q-.2 -2.6 .6 -2.6Z" fill="#141418"/>` +
    `<rect x="-2.5" y="-50.6" width="5" height="4" rx="1.6" fill="${sk}"/>` +
    `<path d="M-10.4 -25.2Q-11.4 -36 -9.6 -44.2Q-7 -47.6 -3.4 -47.8H3.4Q7 -47.6 9.6 -44.2Q11.4 -36 10.4 -25.2Z" fill="${RED}"/>` +
    `<path d="M4.6 -47.5Q8.6 -46.4 9.6 -44.2Q11.4 -36 10.4 -25.2H6.8Q8.2 -34 7.2 -41Z" fill="${RED_D}" opacity=".5"/>` +
    `<path d="M-3.2 -47.8L0 -44.2L3.2 -47.8Z" fill="${sk}"/><path d="M-3.8 -48.1L0 -46.4L-1.2 -43.4L-4.9 -46.3ZM3.8 -48.1L0 -46.4L1.2 -43.4L4.9 -46.3Z" fill="#E43744"/>` +
    `<path d="M0 -44.2V-39.6" stroke="${RED_D}" stroke-width=".8"/><circle cx="0" cy="-42.4" r=".55" fill="#F3E2E2"/><circle cx="0" cy="-40.4" r=".55" fill="#F3E2E2"/>` +
    `<rect x="3" y="-43.8" width="4.6" height="2.8" rx=".6" fill="#FBF7EF"/><rect x="3" y="-43.8" width="4.6" height=".8" fill="#E3336F"/><rect x="3" y="-41.8" width="4.6" height=".8" fill="#2A8A45"/><rect x="-7.4" y="-42.6" width="3.8" height="1.8" rx=".4" fill="#F6D24A"/>` +
    `<rect x="-7.2" y="-26.4" width="14.4" height="2" fill="#141418"/><rect x="-1.2" y="-26.6" width="2.4" height="2.4" rx=".4" fill="#C9A14A"/>` +
    arm('arm-rest', -side, side * 10, -side * 8, skin, sk) + arm('arm-wave', side, -side * reach, -side * (180 - reach) + 6, skin, sk) +
    // head: back hair, ears, face with a shaded side, front hair, brows, eyes (blink group), nose, mouth, cheeks
    `<g class="j-head">${H.back || ''}<ellipse cx="-7" cy="-55" rx="1.5" ry="2.1" fill="${skin}"/><ellipse cx="7" cy="-55" rx="1.5" ry="2.1" fill="${sk}"/>` +
    (H.studs ? `<circle cx="-7.3" cy="-53.4" r=".6" fill="#E9C460"/><circle cx="7.3" cy="-53.4" r=".6" fill="#E9C460"/>` : '') +
    `<ellipse cx="0" cy="-55.4" rx="7" ry="7.6" fill="${skin}"/><path d="M3.4 -62.2Q7.6 -59 7 -54.4Q6.4 -49.4 2 -47.9Q5.4 -51.4 5.2 -55.4Q5 -59.6 3.4 -62.2Z" fill="${sk}" opacity=".45"/>` +
    (H.beard || '') + H.front +
    (H.noBrows ? '' : `<path d="M-4.2 -59.2Q-2.6 -60.2 -1.1 -59.3M1.1 -59.3Q2.6 -60.2 4.2 -59.2" stroke="${hair}" stroke-width="1" fill="none" stroke-linecap="round"/>`) +
    `<g class="j-eyes"><ellipse cx="-2.5" cy="-56.4" rx=".95" ry="1.2" fill="#24161A"/><ellipse cx="2.5" cy="-56.4" rx=".95" ry="1.2" fill="#24161A"/><circle cx="-2.15" cy="-56.85" r=".33" fill="#fff"/><circle cx="2.85" cy="-56.85" r=".33" fill="#fff"/></g>` +
    `<path d="M-.9 -54Q0 -53.1 .9 -54" stroke="${sk}" stroke-width=".8" fill="none" stroke-linecap="round"/>` +
    (open ? `<path d="M-2.9 -51.8Q0 -48.6 2.9 -51.8Q0 -51.1 -2.9 -51.8Z" fill="#6E2129"/><path d="M-2.3 -51.6Q0 -51 2.3 -51.6L2 -51.05Q0 -50.6 -2 -51.05Z" fill="#fff"/>`
      : `<path d="M-2.6 -51.6Q0 -49.6 2.6 -51.6" stroke="#6E2129" stroke-width=".95" fill="none" stroke-linecap="round"/>`) +
    `<circle cx="-4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".25"/><circle cx="4.4" cy="-53.2" r="1.5" fill="#E5736A" opacity=".25"/></g></g></g>`;
};
// outer wavers raise the outside arm; tempo in Hz, swing and reach in degrees, burst/rest as seconds "min max"
s += `<g class="crew">` + [
  { x: 758, k: 1.02, skin: '#8D5524', hair: '#1F1410', style: 'crop', side: -1, reach: 140, tempo: 1.7, swing: 24, burst: '2.6 4.4', rest: '.7 1.4', open: 1 },
  { x: 785, k: .95, skin: '#C68642', hair: '#2B1B12', style: 'pony', side: 1, reach: 150, tempo: 1.25, swing: 18, burst: '2.2 3.6', rest: '1 2', open: 1 },
  { x: 813, k: 1, skin: '#5C3A24', hair: '#121012', style: 'afro', side: 1, reach: 138, tempo: 1, swing: 14, burst: '1.8 3', rest: '1.6 2.8', open: 0 },
  { x: 841, k: .97, skin: '#E0AC69', hair: '#3A2416', style: 'cap', side: 1, reach: 146, tempo: 1.45, swing: 22, burst: '2.4 4', rest: '.9 1.8', open: 1 }
].map(person).join('') + `</g></g>`;
// sliding doors (moved apart by the scroll script)
const door = (x, cls, hx) => `<g class="door ${cls}"><rect x="${x}" y="636" width="64" height="76" fill="url(#teal)" opacity=".82"/><rect x="${x}" y="636" width="64" height="76" fill="none" stroke="#E8E2D4" stroke-width="4"/><rect x="${hx}" y="666" width="3" height="16" rx="1.5" fill="#E8E2D4"/></g>`;
s += door(736, 'door-l', 790) + door(800, 'door-r', 807);
s += `<rect x="730" y="632" width="140" height="6" fill="#E8E2D4"/><rect id="door-target" x="736" y="636" width="128" height="76" fill="none"/>`;
// plinth, sidewalk, parking lot
s += `<rect x="140" y="712" width="1320" height="10" fill="#CFC4AC"/><rect x="-1400" y="722" width="4400" height="34" fill="#D9D6CE"/><rect x="-1400" y="756" width="4400" height="6" fill="#BDB9AE"/><rect x="-1400" y="762" width="4400" height="1400" fill="url(#asphalt)"/>`;
for (let i = -12; i < 24; i++) { const x = 60 + i * 130; s += `<path d="M${x} 790L${x - 60} 1000" stroke="#F3F1EA" stroke-width="6" opacity=".85"/><path d="M${x - 90} 1110L${x - 150} 1320" stroke="#F3F1EA" stroke-width="6" opacity=".75"/>`; }
s += `<rect x="700" y="770" width="200" height="14" fill="#F3F1EA" opacity=".8"/><rect x="700" y="790" width="200" height="14" fill="#F3F1EA" opacity=".8"/><rect x="700" y="810" width="200" height="14" fill="#F3F1EA" opacity=".8"/>`;
// company flags on the wing roofs, drawn after the real ones (team-flags.webp): white field, a swept pink edge top and
// bottom each with a green line inside, the full logo across the middle, a black sleeve on the pole.
// lib/home/living.ts drapes this same design (FLAG, vTop, vBot) on a cloth simulation; this flat cloth is the
// no-JS and reduced-motion version. Cloth 150×100, hoist pinned 4 units right of the pole.
const FLAG = { w: 150, h: 100, top: 194 };
const vTop = u => .15 - .06 * u + .012 * Math.sin(Math.PI * u), vBot = u => .89 - .07 * u + .012 * Math.sin(Math.PI * u);
const flag = x => {
  const pt = (u, v) => [x + 4 + u * FLAG.w * .97, FLAG.top + v * FLAG.h + 4 * u * Math.sin(Math.PI * 2.2 * u - .6) + 7 * u * u];
  const band = (a, b) => { const top = [], bot = []; for (let i = 0; i <= 12; i++) { const u = i / 12; top.push(pt(u, a(u))); bot.push(pt(u, b(u))); } return 'M' + top.concat(bot.reverse()).map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z'; };
  const k = v => () => v, L = [pt(.1, .236), pt(.9, .236), pt(.1, .784)];
  const m = [(L[1][0] - L[0][0]) / 861, (L[1][1] - L[0][1]) / 861, (L[2][0] - L[0][0]) / 393, (L[2][1] - L[0][1]) / 393, L[0][0], L[0][1]].map(n => +n.toFixed(4));
  return `<g class="flag" data-pole="${x}"><rect x="${x - 3}" y="186" width="6" height="164" fill="#C9CCCF"/><circle cx="${x}" cy="184" r="6" fill="#E9C460"/>` +
    `<g class="cloth"><path d="${band(k(0), k(1))}" fill="#fff"/><path d="${band(k(0), vTop)}${band(vBot, k(1))}" fill="#E3336F"/>` +
    `<path d="${band(vTop, u => vTop(u) + .035)}${band(u => vBot(u) - .035, vBot)}" fill="#2A8A45"/>` +
    `<image href="/assets/img/sfb-logo.webp" width="861" height="393" transform="matrix(${m.join(' ')})"/></g>` +
    `<rect class="sleeve" x="${x - 4}" y="${FLAG.top - 2}" width="8" height="${FLAG.h + 4}" rx="2" fill="#1E1A1C"/></g>`;
};
s += flag(330) + flag(1150);
// pink light poles
const lamp = x => `<g><rect x="${x - 6}" y="560" width="12" height="380" fill="#E1307A"/><rect x="${x - 4}" y="560" width="70" height="8" rx="4" fill="#E1307A"/><rect x="${x + 50}" y="566" width="26" height="9" rx="3" fill="#F5F5F0"/><rect x="${x - 14}" y="932" width="28" height="14" rx="3" fill="#C92668"/></g>`;
s += lamp(110) + lamp(1490);
// cars
const car = (x, y, col, k) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-70" y="-30" width="140" height="34" rx="12" fill="${col}"/><path d="M-44 -30 Q-36 -58 -8 -58 L22 -58 Q44 -58 52 -30 Z" fill="${col}"/><path d="M-34 -32 Q-28 -52 -8 -52 L4 -52 L4 -32 Z M10 -32 L10 -52 L22 -52 Q38 -52 44 -32 Z" fill="#BFE0EE" opacity=".9"/><circle cx="-40" cy="4" r="13" fill="#2A2C3B"/><circle cx="40" cy="4" r="13" fill="#2A2C3B"/><circle cx="-40" cy="4" r="5" fill="#9AA0A3"/><circle cx="40" cy="4" r="5" fill="#9AA0A3"/></g>`;
s += car(300, 880, '#F2F2EE', 1) + car(1290, 900, '#C6CDD3', 1.05) + car(1520, 960, '#D3202D', 1.15);

const svg = `<svg class="storefront" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration of the Southern Food Basket store front in Couva: a gabled atrium of gold and teal glass, the sign SOUTHERN FOOD BASKET, company flags, and staff in red shirts waving at the door" xmlns="http://www.w3.org/2000/svg">${defs}${s}</svg>`;
fs.writeFileSync(out, svg); console.log('scene bytes', svg.length);
