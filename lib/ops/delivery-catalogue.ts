import type { DeliveryUnit } from "@/lib/types";

/* The Deliveries catalogue (17 Nov 2026): the standard items an office orders, by type of good, each with a picture
   and its usual sizes, plus ready-made sets. There is no live stock behind it (the stores' counts are not accurate
   yet), so nothing here promises a brand, a price or that Couva has it: the customer picks the kind of item and the
   size, and the quotation names the exact product. Anything not listed goes in as the customer's own line.

   DEMO: the items follow the staff meeting's list (coffee, tea, sugar, creamer, water, drinks, cleaning supplies);
   the sizes are common pack sizes standing in until Couva's own range is listed. The pictures are stock photographs
   of the type of item (Unsplash licence), not the company's products: public/assets/img/stock/deliveries, sources in
   docs/SOURCES.md. No module here imports the store, so server pages can read it. */

export type GoodsType = { id: string; name: string; short: string; cover: string };

export const GOODS_TYPES: GoodsType[] = [
  { id: "hot", name: "Coffee and tea", short: "Coffee and tea", cover: "coffee-instant" },
  { id: "sweet", name: "Sugar, milk and creamer", short: "Sugar and milk", cover: "sugar-white" },
  { id: "water", name: "Water", short: "Water", cover: "water-small" },
  { id: "drinks", name: "Juice and soft drinks", short: "Juice and drinks", cover: "juice-small" },
  { id: "snacks", name: "Biscuits and snacks", short: "Snacks", cover: "crackers" },
  { id: "paper", name: "Cups and paper", short: "Cups and paper", cover: "cups" },
  { id: "clean", name: "Cleaning", short: "Cleaning", cover: "disinfectant" },
];
/** Lines the customer typed themselves and did not put under a type. */
export const OTHER_TYPE = { id: "other", name: "Other items" };

export type CatalogueSize = { size: string; unit: DeliveryUnit; label: string };
export type CatalogueItem = {
  id: string;
  type: string;
  name: string;
  /** What the photograph shows, for people who cannot see it. */
  alt: string;
  sizes: CatalogueSize[];
  /** Names older orders and typed lists use for the same thing. */
  aka?: string[];
};

const each = (size: string): CatalogueSize => ({ size, unit: "each", label: size });
const pack = (size: string, label: string): CatalogueSize => ({ size, unit: "pack", label });
const cs = (size: string, label: string): CatalogueSize => ({ size, unit: "case", label });

export const CATALOGUE: CatalogueItem[] = [
  { id: "coffee-instant", type: "hot", name: "Instant coffee", alt: "Instant coffee granules in a glass jar with a spoon", sizes: [each("200 g jar"), each("100 g jar")] },
  { id: "coffee-ground", type: "hot", name: "Ground coffee", alt: "A small heap of ground coffee", sizes: [each("250 g bag"), each("500 g bag")] },
  { id: "tea", type: "hot", name: "Tea bags", alt: "A tea bag with its string and tag", sizes: [pack("100 bags", "Box of 100 bags"), pack("25 bags", "Box of 25 bags")] },
  { id: "choc", type: "hot", name: "Hot chocolate", alt: "Hot chocolate being poured into a cup", sizes: [each("400 g tin"), each("200 g tin")], aka: ["Chocolate drink", "Cocoa"] },

  { id: "sugar-white", type: "sweet", name: "White sugar", alt: "White sugar with a spoon in it", sizes: [each("2 kg"), each("1 kg")], aka: ["Sugar"] },
  { id: "sugar-brown", type: "sweet", name: "Brown sugar", alt: "Brown sugar, close up", sizes: [each("2 kg"), each("1 kg")] },
  { id: "creamer", type: "sweet", name: "Coffee creamer", alt: "Creamer being poured into a glass of tea", sizes: [each("1 kg"), each("400 g")], aka: ["Creamer"] },
  { id: "milk-powder", type: "sweet", name: "Powdered milk", alt: "Powdered milk with a measuring scoop", sizes: [each("1 kg"), each("400 g")], aka: ["Milk powder"] },

  { id: "water-small", type: "water", name: "Bottled water, small bottles", alt: "Rows of small bottles of water seen from above", sizes: [cs("500 ml × 24", "Case of 24 (500 ml)"), cs("355 ml × 24", "Case of 24 (355 ml)")], aka: ["Bottled water", "Water"] },
  { id: "water-large", type: "water", name: "Bottled water, large bottles", alt: "A large bottle of water with a blue cap", sizes: [cs("1.5 L × 12", "Case of 12 (1.5 L)"), each("5 L bottle")] },

  { id: "soft", type: "drinks", name: "Soft drinks", alt: "Three drink cans side by side", sizes: [cs("355 ml cans × 24", "Case of 24 cans (355 ml)"), cs("2 L bottles × 6", "Case of 6 bottles (2 L)")] },
  { id: "juice-small", type: "drinks", name: "Juice, small", alt: "A small bottle of orange juice among cut oranges", sizes: [cs("250 ml × 24", "Case of 24 (250 ml)")], aka: ["Juice"] },
  { id: "juice-large", type: "drinks", name: "Juice, 1 litre", alt: "A carafe of orange juice", sizes: [cs("1 L × 12", "Case of 12 (1 L)"), each("1 L carton")] },

  { id: "crackers", type: "snacks", name: "Crackers", alt: "A stack of square crackers", sizes: [pack("family pack", "Family pack"), pack("12 small packs", "Box of 12 small packs")] },
  { id: "cookies", type: "snacks", name: "Sweet biscuits", alt: "A stack of round biscuits", sizes: [pack("family pack", "Family pack"), pack("12 small packs", "Box of 12 small packs")], aka: ["Biscuits", "Cookies"] },
  { id: "nuts", type: "snacks", name: "Peanuts", alt: "Shelled peanuts", sizes: [pack("24 small packs", "Box of 24 small packs"), each("400 g tin")], aka: ["Nuts"] },

  { id: "cups", type: "paper", name: "Paper cups", alt: "Paper cups standing in a group", sizes: [pack("8 oz × 50", "Pack of 50 (8 oz)"), pack("12 oz × 50", "Pack of 50 (12 oz)")] },
  { id: "napkins", type: "paper", name: "Napkins", alt: "Paper napkins standing in a glass", sizes: [pack("100 napkins", "Pack of 100"), pack("500 napkins", "Pack of 500")] },
  { id: "paper-towels", type: "paper", name: "Paper towels", alt: "A thick roll of paper towel", sizes: [pack("6 rolls", "Pack of 6 rolls"), pack("2 rolls", "Pack of 2 rolls")] },
  { id: "toilet-paper", type: "paper", name: "Toilet paper", alt: "A pile of toilet paper rolls", sizes: [pack("12 rolls", "Pack of 12 rolls"), pack("24 rolls", "Pack of 24 rolls")] },

  { id: "dish-soap", type: "clean", name: "Dish soap", alt: "A pump bottle of dish soap beside a bowl", sizes: [each("1 L"), each("500 ml")], aka: ["Dishwashing liquid"] },
  { id: "sponges", type: "clean", name: "Sponges and scourers", alt: "A yellow sponge, two steel scourers and a cloth", sizes: [pack("3 sponges", "Pack of 3"), pack("10 sponges", "Pack of 10")], aka: ["Sponges"] },
  { id: "hand-soap", type: "clean", name: "Hand soap", alt: "A hand holding a pump bottle of hand soap", sizes: [each("500 ml"), each("3.8 L refill")] },
  { id: "bleach", type: "clean", name: "Bleach", alt: "A plain white bottle of bleach", sizes: [each("3.8 L"), each("1 L")] },
  { id: "disinfectant", type: "clean", name: "Disinfectant cleaner", alt: "A gloved hand holding a yellow spray bottle", sizes: [each("750 ml spray"), each("3.8 L")], aka: ["Disinfectant", "All-purpose cleaner"] },
  { id: "garbage-bags", type: "clean", name: "Garbage bags", alt: "A full black garbage bag, tied at the top", sizes: [pack("30 large", "Pack of 30 large"), pack("50 small", "Pack of 50 small")], aka: ["Bin bags", "Trash bags"] },
];

const BY_ID = new Map(CATALOGUE.map((c) => [c.id, c]));
const BY_NAME = new Map(CATALOGUE.flatMap((c) => [c.name, ...(c.aka || [])].map((n) => [n.toLowerCase(), c] as const)));
const TYPE_BY_ID = new Map(GOODS_TYPES.map((t) => [t.id, t]));

export const catalogueItem = (id: string | undefined) => (id ? BY_ID.get(id) : undefined);
export const photoOf = (id: string) => "/assets/img/stock/deliveries/" + id + ".webp";
export const itemsOfType = (type: string) => CATALOGUE.filter((c) => c.type === type);
export const isGoodsType = (id: string | undefined): id is string => !!id && TYPE_BY_ID.has(id);

type LineLike = { sku?: string; cat?: string; item: string };

/** The catalogue item behind a line: by its code, or by its name for orders typed in or saved before the catalogue. */
export function itemOfLine(l: LineLike): CatalogueItem | undefined {
  return catalogueItem(l.sku) || BY_NAME.get(l.item.trim().toLowerCase());
}
export function typeOfLine(l: LineLike): { id: string; name: string } {
  const it = itemOfLine(l);
  return TYPE_BY_ID.get(it?.type || l.cat || "") || OTHER_TYPE;
}
export function sizeLabel(it: CatalogueItem | undefined, size: string) {
  return it?.sizes.find((s) => s.size === size)?.label || size;
}

/** Lines in the order a picker walks them: by type of good, in the catalogue's order, the customer's own lines last. */
export function groupLines<T extends LineLike>(lines: T[]): { type: { id: string; name: string }; lines: T[] }[] {
  const order = [...GOODS_TYPES.map((t) => t.id), OTHER_TYPE.id];
  const groups = new Map<string, { type: { id: string; name: string }; lines: T[] }>();
  for (const l of lines) {
    const type = typeOfLine(l);
    if (!groups.has(type.id)) groups.set(type.id, { type, lines: [] });
    groups.get(type.id)!.lines.push(l);
  }
  return order.flatMap((id) => (groups.has(id) ? [groups.get(id)!] : []));
}

/** Ready-made sets: a start the customer then changes. [item, which size, how many]. */
export type GoodsSet = { id: string; name: string; blurb: string; lines: [string, number, number][] };
export const GOODS_SETS: GoodsSet[] = [
  { id: "coffee-station", name: "Coffee station", blurb: "What a tea point runs on.", lines: [["coffee-instant", 0, 2], ["tea", 0, 1], ["sugar-white", 0, 2], ["creamer", 0, 1], ["cups", 0, 2]] },
  { id: "meeting", name: "Meeting room", blurb: "Drinks and a bite for visitors.", lines: [["water-small", 0, 2], ["juice-small", 0, 1], ["soft", 0, 1], ["cookies", 0, 2], ["napkins", 0, 1]] },
  { id: "washroom", name: "Washroom", blurb: "Paper, soap and something to clean with.", lines: [["toilet-paper", 0, 2], ["hand-soap", 0, 2], ["paper-towels", 0, 2], ["bleach", 0, 1], ["disinfectant", 0, 1]] },
  { id: "kitchen", name: "Kitchen clean-up", blurb: "For the sink and the bin.", lines: [["dish-soap", 0, 2], ["sponges", 0, 2], ["paper-towels", 0, 1], ["garbage-bags", 0, 2]] },
];
