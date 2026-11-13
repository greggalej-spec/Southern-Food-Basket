import { assertCan } from "@/lib/access";
import { audit, update } from "@/lib/store";
import type { SeasonId, Session, SiteConfig } from "@/lib/types";

/* The website studio's settings: the seasonal look, the notice bar, which home bands show and which specials lead.
   They sit in the public part of the data because the public pages read them; the studio (site.customize) writes
   them. A season is a layer over the everyday site: it changes colours and adds ornament, and never touches the
   content underneath, so switching it off puts the site back exactly as it was. */

export const SEASONS: Record<Exclude<SeasonId, "none">, { name: string; blurb: string; greeting: string; from: string; to: string; palette: [string, string][] }> = {
  christmas: {
    name: "Christmas",
    blurb: "Falling snow, the sleigh across the front page, snow on every card, candy canes, gingerbread, reindeer, presents and stockings.",
    greeting: "Merry Christmas from all of us at Southern Food Basket",
    from: "11-20",
    to: "01-02",
    palette: [["Sorrel red", "#A3122A"], ["Pine green", "#0F4A2A"], ["Gold", "#E9B949"], ["Poinsettia", "#D62839"]],
  },
  divali: {
    name: "Divali",
    blurb: "Marigold and deep magenta, a row of deyas under the header, and a rangoli mark beside the logo.",
    greeting: "Shubh Divali from all of us at Southern Food Basket",
    from: "10-25",
    to: "11-09",
    palette: [["Marigold", "#E08A00"], ["Magenta", "#8E1556"], ["Flame", "#F4B400"], ["Henna", "#6B2D14"]],
  },
  carnival: {
    name: "Carnival",
    blurb: "Magenta, teal and sun yellow, confetti over every page, flags strung under the header, feathers on the price seals, and a steelpan, a shak-shak and a mask to tap.",
    greeting: "Happy Carnival from all of us at Southern Food Basket",
    from: "01-25",
    to: "02-09",
    palette: [["Magenta", "#E3336F"], ["Teal", "#2F918A"], ["Sun", "#FFD21A"], ["Plum", "#8E1556"]],
  },
  easter: {
    name: "Easter",
    blurb: "Sky blue, pink and chick yellow, petals drifting down, a garland of eggs under the header, kites over the front page, and an egg, a bunny and a chick to tap.",
    greeting: "Happy Easter from all of us at Southern Food Basket",
    from: "03-21",
    to: "03-29",
    palette: [["Sky", "#7CC6E8"], ["Pink", "#F4A6C0"], ["Chick", "#FFD21A"], ["Leaf", "#2A8A45"]],
  },
  // The seven below are data-driven looks (lib/season-kits.ts), added 13 Nov 2026.
  newyear: {
    name: "New Year",
    blurb: "Midnight blue and gold, confetti, stars under the header, and a firework, a balloon and a party hat to tap.",
    greeting: "Happy New Year from all of us at Southern Food Basket",
    from: "12-29",
    to: "01-05",
    palette: [["Midnight", "#1B2A5C"], ["Gold", "#F4C542"], ["Pink", "#E3336F"], ["Silver", "#D9DEE8"]],
  },
  valentine: {
    name: "Valentine’s Day",
    blurb: "Reds and pinks, rose petals drifting down, hearts strung under the header, and a heart, a rose and a love letter to tap.",
    greeting: "Happy Valentine’s Day from all of us at Southern Food Basket",
    from: "02-07",
    to: "02-14",
    palette: [["Rose red", "#D62839"], ["Pink", "#F4A6C0"], ["Magenta", "#E3336F"], ["Deep red", "#A3122A"]],
  },
  mothers: {
    name: "Mother’s Day",
    blurb: "Soft pink and lilac, petals drifting down, hearts under the header, and a flower, a heart and a present to tap.",
    greeting: "Happy Mother’s Day from all of us at Southern Food Basket",
    from: "05-01",
    to: "05-09",
    palette: [["Pink", "#E86A9A"], ["Lilac", "#B79AE0"], ["Sun", "#FFD21A"], ["Plum", "#8E1556"]],
  },
  fathers: {
    name: "Father’s Day",
    blurb: "Navy, sky blue and gold, confetti, flags under the header, and a tie, a mug and a medal to tap.",
    greeting: "Happy Father’s Day from all of us at Southern Food Basket",
    from: "06-12",
    to: "06-20",
    palette: [["Navy", "#1F4E79"], ["Blue", "#2F6FA3"], ["Gold", "#E9B949"], ["Sky", "#7CC6E8"]],
  },
  independence: {
    name: "Independence Day",
    blurb: "The national colours, red, white and black: flags under the header, and the flag, a steelpan and a balloon to tap. 31 August.",
    greeting: "Happy Independence Day, Trinidad and Tobago",
    from: "08-24",
    to: "08-31",
    palette: [["Red", "#D3202D"], ["White", "#FFFFFF"], ["Black", "#20141A"], ["Gold", "#E9B949"]],
  },
  republic: {
    name: "Republic Day",
    blurb: "Red, white and black with gold: flags under the header, and the flag, a rosette and a star to tap. 24 September.",
    greeting: "Happy Republic Day, Trinidad and Tobago",
    from: "09-17",
    to: "09-24",
    palette: [["Red", "#D3202D"], ["Black", "#20141A"], ["Gold", "#E9B949"], ["White", "#FFFFFF"]],
  },
  eid: {
    name: "Eid",
    blurb: "Emerald and gold, stars under the header, and a crescent moon, a lantern and a present to tap. Eid moves each year: set its dates when the day is announced.",
    greeting: "Eid Mubarak from all of us at Southern Food Basket",
    from: "03-06",
    to: "03-11",
    palette: [["Emerald", "#0F5A3E"], ["Green", "#1F7A5C"], ["Gold", "#E9B949"], ["Cream", "#FFE08A"]],
  },
};

export const SEASON_IDS = Object.keys(SEASONS) as Exclude<SeasonId, "none">[];

/** The home page bands the studio can switch off. The memorial card and the stores are not on the list. */
export const BANDS: { id: string; label: string; what: string }[] = [
  { id: "highlights", label: "Highlights carousel", what: "The three large slides under the store front." },
  { id: "deals", label: "This week’s specials", what: "The shelf of specials with their price seals." },
  { id: "careers", label: "Careers", what: "“Be a part of the family” and the open roles." },
  { id: "aisles", label: "Departments", what: "The department tiles and the six counters." },
];

/** Trinidad's calendar day for an instant: the island keeps UTC-4 all year. */
export function ttToday(now: number) {
  return new Date(now - 4 * 3600000).toISOString().slice(0, 10);
}

/** The season the site is wearing right now: the chosen one when it is switched on, or inside its dates. */
export function activeSeason(site: SiteConfig | undefined, now: number): SeasonId {
  const se = site?.season;
  if (!se || se.id === "none" || se.mode === "off") return "none";
  if (se.mode === "on") return se.id;
  const today = ttToday(now);
  return today >= se.from && today <= se.to ? se.id : "none";
}

/** "starts in 8 days", "on until 2 Jan", "ended": where a dated season stands. */
export function seasonState(site: SiteConfig, now: number): "off" | "on" | "waiting" | "over" {
  const se = site.season;
  if (se.id === "none" || se.mode === "off") return "off";
  if (se.mode === "on") return "on";
  const today = ttToday(now);
  return today < se.from ? "waiting" : today > se.to ? "over" : "on";
}

export function saveSite(s: Session | null, next: SiteConfig, what: string) {
  update((d) => {
    assertCan(d, s, "site.customize");
    d.site = next;
    audit(d, s, "site.customize", "Website", what);
  });
}

/** The seasons' icon sheets, for the studio: every piece of each season's artwork (lib/season-art.ts). Carnival and
 *  Easter were finished on 2026-11-13 and can be put on the site like Christmas and Divali. */
export const SEASON_SHEETS: { id: "christmas" | "carnival" | "easter"; name: string; when: string; status: "Ready" | "In design"; note: string; palette: [string, string][] }[] = [
  { id: "christmas", name: "Christmas", when: "20 November to 2 January", status: "Ready", note: "Snow, the sleigh, snow-capped cards, and gifts that shake when touched.", palette: [["Red", "#C8102E"], ["Pine", "#0F5A2E"], ["Gold", "#F4C542"], ["Snow", "#FFFFFF"]] },
  { id: "carnival", name: "Carnival", when: "The weeks before Carnival Monday and Tuesday", status: "Ready", note: "Confetti, flags under the header, a feather on every price seal, and a steelpan, shak-shak and mask that answer a tap.", palette: [["Magenta", "#E3336F"], ["Teal", "#2F918A"], ["Sun", "#FFD21A"], ["Plum", "#8E1556"]] },
  { id: "easter", name: "Easter", when: "Holy Week to Easter Monday", status: "Ready", note: "Drifting petals, a garland of eggs under the header, kites over the front page, and an egg, bunny and chick that answer a tap.", palette: [["Sky", "#7CC6E8"], ["Pink", "#F4A6C0"], ["Chick", "#FFD21A"], ["Leaf", "#2A8A45"]] },
];
