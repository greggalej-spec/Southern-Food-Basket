import type { Flyer, StoreEvent } from "./types";

/* What is on, for the public Events and promotions page, and the flyers on the Specials page. REAL: every entry is
   taken from the company's own Facebook and Instagram posts, read on 2026-11-13 (dates, stores, wording and prices as
   posted; the images are the company's own artwork from those posts). An event with no posted end date is marked
   `ongoing` and carries a far-off `to` so it sorts as running. Public tier: read without a sign-in. */

const SOCIAL = "/assets/img/social/";
const OPEN_END = "2099-12-31";

export const EVENTS: StoreEvent[] = [
  { id: "ev-flash-sale", kind: "promotion", title: "Flash Sale: three days only", from: "2026-11-13", to: "2026-11-15", branchIds: null, featured: true,
    img: SOCIAL + "flash-1.webp", summary: "Big savings on everyday essentials, Friday to Sunday, at every Southern Food Basket.",
    points: ["Pepsi 500 ml, 6 for $19.95", "Catelli pasta cuts 300 g, 5 for $19.95", "Golden Brand margarine 227 g, 4 for $18.95"], href: "/specials", cta: "See the flyers" },
  { id: "ev-escape-on-wheels", kind: "promotion", title: "Escape on Wheels: win a BYD Song Pro", from: "2026-09-17", to: OPEN_END, ongoing: true, branchIds: null, featured: true, spotlight: true,
    img: SOCIAL + "escape-on-wheels.webp", summary: "We are celebrating 35 Years of Rewards, and the keys to a brand-new BYD Song Pro are up for grabs. Approved by the NLCB.",
    points: ["Spend $300 to receive an entry form", "Fill out the entry form", "Deposit it into the entry box"], href: "/locations", cta: "Find a store" },
  { id: "ev-christmas", kind: "event", title: "Christmas is coming", from: "2026-11-11", to: OPEN_END, ongoing: true, branchIds: null,
    summary: "It’s time. Christmas is coming to Southern Food Basket, and you will not want to miss what we have in store. Stay tuned." },
  { id: "ev-kinder-joy", kind: "promotion", title: "Kinder Joy: the Stranger Things collection", from: "2026-11-13", to: OPEN_END, ongoing: true, branchIds: null,
    summary: "Ready to collect them all? Explore the Upside Down with Kinder Joy’s Stranger Things collection." },
  { id: "ev-hiring-custodian", kind: "notice", title: "We’re hiring: Custodian, Penal", from: "2026-11-11", to: "2026-11-18", branchIds: ["penal"],
    img: SOCIAL + "hiring-custodian.webp", summary: "A keen eye for cleanliness, janitorial experience and a strong work ethic. Join the Southern Food Basket family.",
    points: ["S.S. Erin Road, Penal", "Résumé to foodbasketjobs@gmail.com", "Apply by 18 November"], href: "/careers", cta: "See careers" },
  { id: "ev-colour-me-divali", kind: "event", title: "Colour Me Divali", from: "2026-11-06", to: "2026-11-07", time: "Until 3:00 pm", branchIds: ["sando", "couva"],
    summary: "Two days of colouring for our little artists, with prizes to be won and Divali goodie bags.",
    points: ["Day 1: Coffee Street, San Fernando", "Day 2: Couva", "All supplies provided"] },
  { id: "ev-divali-hours", kind: "notice", title: "Divali opening hours", from: "2026-11-08", to: "2026-11-09", branchIds: null,
    img: SOCIAL + "divali-hours.webp", summary: "Every branch opened on Sunday 8 and Monday 9 November, with adjusted hours.",
    points: ["Couva: 7 am to 10 pm both days", "Coffee Street: 7 am to 8 pm both days", "Point Fortin and Penal: 7 am to 7 pm"] },
  { id: "ev-shubh-divali", kind: "community", title: "Shubh Divali", from: "2026-11-08", to: "2026-11-08", branchIds: null,
    img: SOCIAL + "diwali.webp", summary: "May your day be filled with brightness, happiness and togetherness. From the management and staff of Southern Food Basket." },
];

export const FLYERS: Flyer[] = [
  { id: "fl-flash-1", title: "Flash Sale: duck, cheese, ice cream, margarine", img: SOCIAL + "flash-1.webp", addedBy: "emp-addae", addedAt: "2026-11-12T16:04:00-04:00", from: "2026-11-13", to: "2026-11-15", featured: true },
  { id: "fl-flash-2", title: "Flash Sale: Chubby, Aqua Pur, Pepsi, 7UP", img: SOCIAL + "flash-2.webp", addedBy: "emp-addae", addedAt: "2026-11-12T16:04:00-04:00", from: "2026-11-13", to: "2026-11-15", featured: true },
  { id: "fl-flash-3", title: "Flash Sale: Catelli pasta, ketchup, Cole Cold", img: SOCIAL + "flash-3.webp", addedBy: "emp-addae", addedAt: "2026-11-12T16:04:00-04:00", from: "2026-11-13", to: "2026-11-15", featured: true },
  { id: "fl-escape", title: "Escape on Wheels: win a BYD Song Pro", img: SOCIAL + "escape-on-wheels.webp", addedBy: "emp-addae", addedAt: "2026-09-17T10:00:00-04:00", from: "2026-09-17", featured: true },
];
