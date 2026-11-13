import type { Flyer, StoreEvent } from "./types";

/* What is on, for the public Events page, and the flyers the graphic designer makes. DEMO: the events and dates are
   made up to show the page; the photos are the company's own Instagram posts already used on the site. Public tier:
   the Events and Specials pages read these without a sign-in. */

export const EVENTS: StoreEvent[] = [
  { id: "ev-cake-offer", kind: "promotion", title: "Members’ cake offer", from: "2026-11-01", to: "2026-11-15", branchIds: null, featured: true,
    img: "/assets/img/photos/cake-red-velvet.webp", summary: "A double-layer cake at the members’ price, at every store.",
    points: ["Join free with your e-mail", "Show your code at the till", "One cake per code"], href: "/offers", cta: "See the offer" },
  { id: "ev-hamper-drive", kind: "community", title: "Christmas hamper drive", from: "2026-11-09", to: "2026-12-12", branchIds: ["sando"],
    img: "/assets/img/photos/snacks-basket.webp", summary: "Drop a tin or a packet in the box by the door. It goes to 30 families through a children’s home.",
    points: ["Box at the San Fernando entrance", "Tins, rice, flour, juice", "Collected 12 December"] },
  { id: "ev-cut-veg", kind: "promotion", title: "Fresh-cut veg, ready to cook", from: "2026-11-02", to: "2026-11-30", branchIds: ["couva"],
    img: "/assets/img/photos/veg-stir-fry.webp", summary: "Stir-fry, chow mein and chunky packs cut fresh each morning at Couva.", points: ["From $11.95 a pack", "Cut daily"], href: "/specials", cta: "See specials" },
  { id: "ev-screening", kind: "community", title: "Free blood-sugar screening", from: "2026-12-05", to: "2026-12-05", time: "8:00 am to 11:00 am", branchIds: ["couva"],
    summary: "Two nurses at the pharmacy counter. No appointment, no charge.", points: ["Takes five minutes", "Come before breakfast if you can"] },
  { id: "ev-christmas-shop", kind: "promotion", title: "Christmas shop: TT$30 off TT$300", from: "2026-12-10", to: "2026-12-24", branchIds: null, featured: true,
    img: "/assets/img/photos/cake-chocolate.webp", summary: "Members take TT$30 off a shop of TT$300 or more, once, at any store.", points: ["Members only", "One use per member", "Ends Christmas Eve"], href: "/offers", cta: "Join free" },
  { id: "ev-sampling", kind: "event", title: "Seasonal drinks sampling", from: "2026-12-12", to: "2026-12-20", time: "Saturdays and Sundays, 10:00 am to 4:00 pm", branchIds: null,
    summary: "Taste the season’s drinks at a table in every store, two weekends running.", points: ["12 to 13 December", "19 to 20 December"] },
  { id: "ev-music-truck", kind: "event", title: "The music truck comes out", from: "2026-12-20", to: "2026-12-20", time: "From 2:00 pm", branchIds: ["penal", "ptown"],
    img: "/assets/img/photos/flags-car.webp", summary: "Pink and green flags, music and giveaways through Penal and Princes Town." },
  { id: "ev-holiday-hours", kind: "notice", title: "Christmas opening hours", from: "2026-12-24", to: "2026-12-26", branchIds: null,
    summary: "Every store closes early on Christmas Eve and stays closed on Christmas Day.", points: ["24 Dec: close at 6:00 pm", "25 Dec: closed", "26 Dec: 9:00 am to 2:00 pm"], href: "/locations", cta: "Store hours" },
  { id: "ev-divali", kind: "promotion", title: "Divali specials", from: "2026-10-05", to: "2026-11-11", branchIds: null,
    summary: "Ghee, flour, split peas and sweets for the season, at every store.", href: "/specials", cta: "See specials" },
];

export const FLYERS: Flyer[] = [
  { id: "fl-cakes", title: "This week’s cakes", img: "/assets/img/photos/cake-chocolate.webp", addedBy: "emp-addae", addedAt: "2026-11-09T09:20:00-04:00", from: "2026-11-09", to: "2026-11-15", featured: true },
  { id: "fl-snacks", title: "Snacks under $20", img: "/assets/img/photos/snacks-basket.webp", addedBy: "emp-addae", addedAt: "2026-11-09T09:22:00-04:00", from: "2026-11-09", to: "2026-11-15", featured: true },
  { id: "fl-veg", title: "Cut veg, ready to cook", img: "/assets/img/photos/veg-stir-fry.webp", addedBy: "emp-addae", addedAt: "2026-11-09T09:25:00-04:00", from: "2026-11-09", to: "2026-11-30", featured: true },
  { id: "fl-care", title: "Body wash, 1 for $34.95", img: "/assets/img/photos/dove.webp", addedBy: "emp-addae", addedAt: "2026-11-05T14:10:00-04:00", from: "2026-11-05", to: "2026-11-19", featured: true },
  { id: "fl-lays", title: "Lay’s limited flavours", img: "/assets/img/photos/lays-limited.webp", addedBy: "emp-addae", addedAt: "2026-10-28T10:00:00-04:00", from: "2026-10-28", to: "2026-11-08", featured: false },
];
