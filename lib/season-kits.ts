import { ART, artUri } from "./season-art";
import type { SeasonId } from "./types";

/* Seven more seasonal looks, each described as data (Gregg, 13 Nov 2026): New Year, Valentine's Day, Mother's Day,
   Father's Day, Independence Day, Republic Day and Eid. A "kit" is everything a look needs: its colours, the ribbon,
   the row that hangs under the header, the mark beside the logo, the sprig on the price seals, three things in the
   corner that answer a tap, and what falls over the page. components/season-layer.tsx applies a kit by setting CSS
   variables, so a new season is one more entry here and no new stylesheet rules.

   Every drawing is made here from a few simple shapes, in the same style as lib/season-art.ts (rounded, one dark
   outline). Independence Day and Republic Day use the national colours and the flag of Trinidad and Tobago;
   Independence also borrows the steelpan from the Carnival set (Gregg found a flower too childish for it). */

const O = "#3A1B12";
const svg = (body: string, box = "0 0 48 48") => artUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">${body}</svg>`);
const line = `stroke="${O}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

/* ---------- the shapes ---------- */
const HEART = "M24 42C12 33 5 25 5 16a10 10 0 0 1 19-4 10 10 0 0 1 19 4c0 9-7 17-19 26Z";
const STAR = "M24 4l5.9 12.6 13.8 1.7-10.2 9.5 2.7 13.6L24 34.7l-12.2 6.7 2.7-13.6-10.2-9.5 13.8-1.7Z";
const heart = (fill: string) => svg(`<path d="${HEART}" fill="${fill}" ${line}/><path d="M13 14c1-3 4-4 6-3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`);
const star = (fill: string) => svg(`<path d="${STAR}" fill="${fill}" ${line}/>`);
const gift = (box: string, lid: string, bow: string) =>
  svg(`<g ${line}><rect x="8" y="20" width="32" height="22" rx="2" fill="${box}"/><rect x="5.5" y="13" width="37" height="9" rx="2" fill="${lid}"/><rect x="20.5" y="13" width="7" height="29" fill="${bow}"/><path d="M24 13c-3-7-10-8-12-4s5 5 12 4ZM24 13c3-7 10-8 12-4s-5 5-12 4Z" fill="${bow}"/></g>`);
const balloon = (fill: string) =>
  svg(`<g ${line}><path d="M24 36c2 3-3 4-1 8" fill="none"/><ellipse cx="24" cy="19" rx="13" ry="16" fill="${fill}"/><path d="M21 34h6l-3 4Z" fill="${fill}"/></g><path d="M16 14c1-4 4-6 7-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`);
const flower = (petal: string, centre: string) =>
  svg(`<path d="M24 30v15M24 40c-5 0-8-2-9-5" fill="none" stroke="#2A8A45" stroke-width="3" stroke-linecap="round"/><g fill="${petal}" ${line}><circle cx="24" cy="12" r="7"/><circle cx="33.5" cy="18.9" r="7"/><circle cx="29.9" cy="30.1" r="7"/><circle cx="18.1" cy="30.1" r="7"/><circle cx="14.5" cy="18.9" r="7"/></g><circle cx="24" cy="22" r="5.5" fill="${centre}" ${line}/>`);
/** The flag of Trinidad and Tobago: red, with a black band edged in white from the top of the hoist to the foot of the fly. */
const FLAG = svg(`<clipPath id="f"><rect x="4" y="10" width="40" height="27" rx="2"/></clipPath><g clip-path="url(#f)"><rect x="4" y="10" width="40" height="27" fill="#D3202D"/><path d="M4 10h13l27 27H31Z" fill="#fff"/><path d="M7 10h7l27 27h-7Z" fill="#20141A"/></g><rect x="4" y="10" width="40" height="27" rx="2" fill="none" ${line}/>`);
const rosette = (outer: string, inner: string) =>
  svg(`<g ${line}><path d="M17 28 12 45l8-5 4 5 4-5 8 5-5-17Z" fill="${outer}"/><circle cx="24" cy="19" r="14" fill="${outer}"/><circle cx="24" cy="19" r="8.5" fill="#fff"/></g><path d="${STAR}" fill="${inner}" transform="translate(24 19) scale(.3) translate(-24 -24)"/>`);
const firework = svg(`<g fill="none" stroke-width="3" stroke-linecap="round"><path d="M24 20V6M24 28v14M20 24H6M28 24h14" stroke="#F4C542"/><path d="M21 21 11 11M27 27l10 10M27 21 37 11M21 27 11 37" stroke="#E3336F"/></g><g fill="#fff" ${line}><circle cx="24" cy="24" r="4.5"/></g><g fill="#F4C542"><circle cx="24" cy="4" r="2.2"/><circle cx="44" cy="24" r="2.2"/><circle cx="24" cy="44" r="2.2"/><circle cx="4" cy="24" r="2.2"/></g>`);
const partyHat = svg(`<g ${line}><path d="M24 7 39 41H9Z" fill="#1B2A5C"/><path d="M19.5 17l9 4M15 27l18 8" fill="none" stroke="#F4C542" stroke-width="3"/><rect x="6" y="38" width="36" height="6" rx="3" fill="#F4C542"/><circle cx="24" cy="6" r="4" fill="#E3336F"/></g>`);
const envelope = svg(`<g ${line}><rect x="5" y="12" width="38" height="26" rx="3" fill="#fff"/><path d="M5 15l19 13 19-13" fill="none"/></g><path d="${HEART}" fill="#D62839" stroke="${O}" stroke-width="5" stroke-linejoin="round" transform="translate(24 29) scale(.26) translate(-24 -24)"/>`);
const rose = svg(`<path d="M24 28v17M24 38c5 0 8-2 9-6" fill="none" stroke="#2A8A45" stroke-width="3" stroke-linecap="round"/><g ${line}><circle cx="24" cy="17" r="12.5" fill="#D62839"/><path d="M24 17c-4-1-6 2-5 5 1 4 8 4 10-1 2-6-5-11-11-7-5 4-3 12 4 14" fill="none" stroke="#7A0E20"/></g>`);
const tie = (fill: string, stripe: string) =>
  svg(`<g ${line}><path d="M19 5h10l2 8H17Z" fill="${fill}"/><path d="M18 13h12l4 23-10 9-10-9Z" fill="${fill}"/><path d="M17 22l13 6M15.5 30l13 6" fill="none" stroke="${stripe}" stroke-width="3"/></g>`);
const mug = (fill: string) =>
  svg(`<g ${line}><path d="M33 21h4a5.5 5.5 0 0 1 0 11h-4" fill="none" stroke-width="3"/><rect x="9" y="15" width="24" height="26" rx="4" fill="${fill}"/><path d="M16 10c-2-3 2-4 0-7M24 10c-2-3 2-4 0-7" fill="none"/></g><path d="${HEART}" fill="#fff" transform="translate(21 28) scale(.26) translate(-24 -24)"/>`);
const crescent = svg(`<g ${line}><path d="M30 5a19 19 0 1 0 13 31A16 16 0 0 1 30 5Z" fill="#F4C542"/></g><path d="${STAR}" fill="#F4C542" stroke="${O}" stroke-width="6" stroke-linejoin="round" transform="translate(35 17) scale(.24) translate(-24 -24)"/>`);
const lantern = svg(`<g ${line}><path d="M24 3v5" fill="none"/><path d="M19 8h10l2 5H17Z" fill="#E9B949"/><path d="M17 13h14l4 8v12l-4 7H17l-4-7V21Z" fill="#0F5A3E"/><path d="M20 19h8v15h-8Z" fill="#FFE08A"/><path d="M18 40h12l-2 5h-8Z" fill="#E9B949"/></g>`);

/* ---------- the row under the header: a string with things hanging from it, 64 wide so it repeats cleanly ---------- */
const flagStrip = (a: string, b: string, c: string) =>
  svg(`<path d="M0 4Q32 12 64 4" fill="none" stroke="${O}" stroke-width="1.6"/><g stroke="${O}" stroke-width="1.4" stroke-linejoin="round"><path d="M4 5.5 16 8 9 22Z" fill="${a}"/><path d="M25 9h14l-7 15Z" fill="${b}"/><path d="M48 8 60 5.5 55 22Z" fill="${c}"/></g>`, "0 0 64 28");
const hang = (shape: string, a: string, b: string) =>
  svg(`<path d="M0 3Q32 9 64 3" fill="none" stroke="${O}" stroke-width="1.4"/><path d="M16 6v4M48 7v3" stroke="${O}" stroke-width="1.2"/><path d="${shape}" fill="${a}" stroke="${O}" stroke-width="4" stroke-linejoin="round" transform="translate(16 17) scale(.34) translate(-24 -24)"/><path d="${shape}" fill="${b}" stroke="${O}" stroke-width="4" stroke-linejoin="round" transform="translate(48 17) scale(.34) translate(-24 -24)"/>`, "0 0 64 28");

/** The wave ribbon between sections, in the season's own colours. */
const ribbon = (a: string, b: string, dot: string) =>
  'url("' + artUri(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="24" viewBox="0 0 360 24"><path d="M0 9C45 1 135 1 180 9S315 17 360 9" fill="none" stroke="${a}" stroke-width="6"/><path d="M0 17C45 9 135 9 180 17S315 25 360 17" fill="none" stroke="${b}" stroke-width="3"/><g fill="${dot}"><circle cx="30" cy="20" r="3"/><circle cx="120" cy="4" r="3"/><circle cx="210" cy="21" r="3"/><circle cx="300" cy="5" r="3"/></g></svg>`) + '")';

export type Kit = {
  /** The colour variables the public pages read (styles/tokens.css and the home page's own set). */
  vars: Record<string, string>;
  mark: string; seal: string; strip: string;
  gifts: { id: string; src: string; label: string }[];
  falling: { colours: string[]; petal?: boolean };
};

/** accent: ribbons and decoration. ink, dark: text accents. sign: the main button (white text sits on it). */
const kit = (c: { accent: string; ink: string; dark: string; wash: string; red: string; sign: string; yellow: string; gold: string; greet: [string, string]; glow: [string, string]; ribbon: [string, string, string] }) => ({
  "--pink": c.accent, "--pink-ink": c.ink, "--clay": c.ink, "--clay-dark": c.dark, "--pink-wash": c.wash, "--red": c.red, "--sign": c.sign, "--yellow": c.yellow, "--gold": c.gold,
  "--season-greet-bg": c.greet[0], "--season-greet-on": c.greet[1], "--season-wash": c.wash, "--season-glow-a": c.glow[0], "--season-glow-b": c.glow[1],
  "--ribbon": ribbon(...c.ribbon),
});

export const KITS: Partial<Record<SeasonId, Kit>> = {
  newyear: {
    vars: kit({ accent: "#C9920E", ink: "#1B2A5C", dark: "#111B3D", wash: "#EEF1FB", red: "#C8102E", sign: "#1B2A5C", yellow: "#FFD21A", gold: "#F4C542", greet: ["#111B3D", "#F8E7AE"], glow: ["rgba(27,42,92,.20)", "rgba(244,197,66,.24)"], ribbon: ["#1B2A5C", "#F4C542", "#E3336F"] }),
    mark: firework, seal: star("#F4C542"), strip: hang(STAR, "#F4C542", "#E3336F"),
    gifts: [{ id: "firework", src: firework, label: "Set off the firework" }, { id: "balloon", src: balloon("#F4C542"), label: "Bounce the balloon" }, { id: "hat", src: partyHat, label: "Tip the party hat" }],
    falling: { colours: ["#F4C542", "#D9DEE8", "#1B2A5C", "#FFFFFF", "#E3336F"] },
  },
  valentine: {
    vars: kit({ accent: "#E3336F", ink: "#A3122A", dark: "#7A0E20", wash: "#FDE7EC", red: "#D62839", sign: "#C2185B", yellow: "#FFD21A", gold: "#F7B2C4", greet: ["#A3122A", "#FFE3EA"], glow: ["rgba(214,40,57,.18)", "rgba(244,166,192,.34)"], ribbon: ["#D62839", "#F4A6C0", "#FFFFFF"] }),
    mark: heart("#D62839"), seal: heart("#E3336F"), strip: hang(HEART, "#D62839", "#F4A6C0"),
    gifts: [{ id: "heart", src: heart("#D62839"), label: "Tap the heart" }, { id: "rose", src: rose, label: "Smell the rose" }, { id: "letter", src: envelope, label: "Open the love letter" }],
    falling: { colours: ["#D62839", "#F4A6C0", "#FFFFFF", "#E3336F", "#F9C9DA"], petal: true },
  },
  mothers: {
    vars: kit({ accent: "#E86A9A", ink: "#8E1556", dark: "#6B0F41", wash: "#FCE9F1", red: "#D9486E", sign: "#A6246B", yellow: "#FFD21A", gold: "#F5C330", greet: ["#F9D5E3", "#5B0F3B"], glow: ["rgba(232,106,154,.22)", "rgba(201,170,235,.30)"], ribbon: ["#E86A9A", "#B79AE0", "#FFD21A"] }),
    mark: flower("#F4A6C0", "#FFD21A"), seal: heart("#E86A9A"), strip: hang(HEART, "#E86A9A", "#B79AE0"),
    gifts: [{ id: "flower", src: flower("#F4A6C0", "#FFD21A"), label: "Pick the flower" }, { id: "heart", src: heart("#E86A9A"), label: "Tap the heart" }, { id: "gift", src: gift("#B79AE0", "#C9AAEB", "#FFD21A"), label: "Shake the present" }],
    falling: { colours: ["#F4A6C0", "#FFFFFF", "#D9C2F0", "#F9C9DA", "#FFE9A8"], petal: true },
  },
  fathers: {
    vars: kit({ accent: "#2F6FA3", ink: "#1F4E79", dark: "#143654", wash: "#E8F1F8", red: "#C8102E", sign: "#1F4E79", yellow: "#FFD21A", gold: "#E9B949", greet: ["#143654", "#F8E7AE"], glow: ["rgba(47,111,163,.22)", "rgba(233,185,73,.24)"], ribbon: ["#1F4E79", "#E9B949", "#7CC6E8"] }),
    mark: tie("#1F4E79", "#E9B949"), seal: star("#E9B949"), strip: flagStrip("#1F4E79", "#E9B949", "#7CC6E8"),
    gifts: [{ id: "tie", src: tie("#1F4E79", "#E9B949"), label: "Straighten the tie" }, { id: "mug", src: mug("#2F6FA3"), label: "Lift the mug" }, { id: "medal", src: rosette("#E9B949", "#1F4E79"), label: "Polish the medal" }],
    falling: { colours: ["#1F4E79", "#7CC6E8", "#E9B949", "#FFFFFF", "#2F6FA3"] },
  },
  independence: {
    vars: kit({ accent: "#D3202D", ink: "#A3122A", dark: "#20141A", wash: "#FCE8E9", red: "#D3202D", sign: "#C8102E", yellow: "#FFD21A", gold: "#E9B949", greet: ["#20141A", "#FFFFFF"], glow: ["rgba(211,32,45,.18)", "rgba(32,20,26,.12)"], ribbon: ["#D3202D", "#20141A", "#FFFFFF"] }),
    mark: FLAG, seal: star("#D3202D"), strip: flagStrip("#D3202D", "#FFFFFF", "#20141A"),
    gifts: [{ id: "flag", src: FLAG, label: "Wave the flag" }, { id: "pan", src: artUri(ART.carnival.pan), label: "Play the steelpan" }, { id: "balloon", src: balloon("#D3202D"), label: "Bounce the balloon" }],
    falling: { colours: ["#D3202D", "#FFFFFF", "#20141A", "#D3202D", "#FFFFFF"] },
  },
  republic: {
    vars: kit({ accent: "#D3202D", ink: "#A3122A", dark: "#20141A", wash: "#FFF4DB", red: "#D3202D", sign: "#A3122A", yellow: "#FFD21A", gold: "#E9B949", greet: ["#C8102E", "#FFFFFF"], glow: ["rgba(233,185,73,.26)", "rgba(211,32,45,.16)"], ribbon: ["#20141A", "#D3202D", "#E9B949"] }),
    mark: rosette("#D3202D", "#20141A"), seal: star("#E9B949"), strip: flagStrip("#20141A", "#D3202D", "#FFFFFF"),
    gifts: [{ id: "flag", src: FLAG, label: "Wave the flag" }, { id: "rosette", src: rosette("#D3202D", "#20141A"), label: "Pin on the rosette" }, { id: "star", src: star("#E9B949"), label: "Catch the star" }],
    falling: { colours: ["#D3202D", "#FFFFFF", "#20141A", "#E9B949", "#FFFFFF"] },
  },
  eid: {
    vars: kit({ accent: "#1F7A5C", ink: "#0F5A3E", dark: "#0B3D2B", wash: "#E7F4EE", red: "#C4421A", sign: "#0F5A3E", yellow: "#F4C542", gold: "#E9B949", greet: ["#0B3D2B", "#F8E7AE"], glow: ["rgba(31,122,92,.22)", "rgba(233,185,73,.26)"], ribbon: ["#0F5A3E", "#E9B949", "#FFFFFF"] }),
    mark: crescent, seal: star("#F4C542"), strip: hang(STAR, "#F4C542", "#FFFFFF"),
    gifts: [{ id: "crescent", src: crescent, label: "Tap the crescent moon" }, { id: "lantern", src: lantern, label: "Light the lantern" }, { id: "gift", src: gift("#0F5A3E", "#1F7A5C", "#F4C542"), label: "Shake the Eid present" }],
    falling: { colours: ["#F4C542", "#FFFFFF", "#1F7A5C", "#E9B949", "#FFE08A"] },
  },
};

/** Every variable a kit may set, so the page can clear them when the season changes. */
export const KIT_VARS = ["--pink", "--pink-ink", "--clay", "--clay-dark", "--pink-wash", "--red", "--sign", "--yellow", "--gold", "--season-greet-bg", "--season-greet-on", "--season-wash", "--season-glow-a", "--season-glow-b", "--ribbon"];
