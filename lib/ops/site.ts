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

/** Seasons being designed. Their artwork exists (lib/season-art.ts) and shows in the studio; they cannot be put on
 *  the site until the look is finished. Christmas is listed so its pieces can be seen beside them. */
export const SEASON_SHEETS: { id: "christmas" | "carnival" | "easter"; name: string; when: string; status: "Ready" | "In design"; note: string; palette: [string, string][] }[] = [
  { id: "christmas", name: "Christmas", when: "20 November to 2 January", status: "Ready", note: "Snow, the sleigh, snow-capped cards, and gifts that shake when touched.", palette: [["Red", "#C8102E"], ["Pine", "#0F5A2E"], ["Gold", "#F4C542"], ["Snow", "#FFFFFF"]] },
  { id: "carnival", name: "Carnival", when: "The weeks before Carnival Monday and Tuesday", status: "In design", note: "Feathers fanning out behind the header, masks on the price seals, a steelpan that plays when tapped.", palette: [["Magenta", "#E3336F"], ["Teal", "#2F918A"], ["Sun", "#FFD21A"], ["Plum", "#8E1556"]] },
  { id: "easter", name: "Easter", when: "Holy Week to Easter Monday", status: "In design", note: "Eggs hidden around each page to find, bunnies and chicks on the cards, kites flying over the front page.", palette: [["Sky", "#7CC6E8"], ["Pink", "#F4A6C0"], ["Chick", "#FFD21A"], ["Leaf", "#2A8A45"]] },
];
