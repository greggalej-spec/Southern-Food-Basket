import { EVENTS, FLYERS } from "./seed-events";
import type { Promotion, Seed } from "./types";

/* DEMO promotions: invented for the prototype, built on two real specials. Only approved promotions that have already
   started are in this public file; lib/seed-private.ts holds the rest. */
const PUBLIC_PROMOTIONS: Promotion[] = [
  { id: 'promo-cake', slug: 'cake-offer', title: 'Members’ cake offer', benefit: 'TT$15 off any 9-inch double-layer cake', kind: 'member-code',
    summary: 'Red velvet, chocolate or sponge. Sign in, take your code, show it at the till.',
    terms: ['One code per shopper.', 'Show the code at the till before you pay. The cashier checks it and records it.', 'Not with any other offer.', 'The offer does not promise stock: cakes sell out.'],
    img: 'cake-red-velvet', alt: 'Red velvet cake with white frosting and red crumb topping',
    branchIds: null, starts: '2026-10-26T00:00:00-04:00', ends: '2026-11-15T21:00:00-04:00', limits: { perCustomer: 1, total: 500 },
    status: 'approved', createdBy: 'emp-tricia', createdAt: '2026-10-21T10:00:00-04:00', submittedAt: '2026-10-22T09:00:00-04:00', approvedBy: 'emp-vishala', approvedAt: '2026-10-23T08:15:00-04:00',
    revisions: [{ at: '2026-10-21T10:00:00-04:00', by: 'emp-tricia', summary: 'Drafted' }, { at: '2026-10-23T08:15:00-04:00', by: 'emp-vishala', summary: 'Approved' }] },
  { id: 'promo-veg-couva', slug: 'couva-cut-veg', title: 'Couva cut-veg offer', benefit: 'TT$5 off two ready-cut veg packs', kind: 'member-code',
    summary: 'Chunky, stir fry or chow mein packs, at the Couva store only.',
    terms: ['One code per shopper.', 'Couva store only: 696 Southern Main Road.', 'Any two ready-cut veg packs in one shop.'],
    img: 'veg-stir-fry', alt: 'Tray of broccoli, carrot sticks, celery and sweet peppers for stir fry',
    branchIds: ['couva'], starts: '2026-10-20T00:00:00-04:00', ends: '2026-11-08T21:00:00-04:00', limits: { perCustomer: 1, total: 200 },
    status: 'approved', createdBy: 'emp-tricia', createdAt: '2026-10-16T13:00:00-04:00', submittedAt: '2026-10-16T15:00:00-04:00', approvedBy: 'emp-vishala', approvedAt: '2026-10-17T09:30:00-04:00',
    revisions: [{ at: '2026-10-16T13:00:00-04:00', by: 'emp-tricia', summary: 'Drafted' }, { at: '2026-10-17T09:30:00-04:00', by: 'emp-vishala', summary: 'Approved' }] },
];

// Ported from data/seed.js (the static site) with image paths made root-relative. Edit it here from now on.
/* Southern Food Basket — seed data for the concept site.
   Two kinds of data, kept apart:
   - SOURCED: deals, prices, post dates, department lines and the Couva location come from the company's own
     public Instagram posts (photos supplied by Gregg, 2026-10-23); company facts and three branch addresses come
     from public directories (unverified). Each sourced item says where it came from.
   - DEMO: every person, job, document, hour, phone number and e-mail is invented for the prototype.
   Bump `version` when the seed changes so stale localStorage copies are replaced. */
export const SEED: Seed = {
  version: 16,
  settings: {
    currency: 'TTD',
    brand: 'Southern Food Basket',
    short: 'SFB',
    tagline: 'The south’s neighbourhood grocer',
    founded: 1998, /* source: Del Risco company record (1998); ExportersIndia lists 2000 */
    phone: '+1 868-225-4732', /* head office line, Facebook page and Google Maps */
    whatsappChannel: 'https://whatsapp.com/channel/0029Vb6ReXbKgsNmzhxABT42', tiktok: 'https://www.tiktok.com/@southernfoodbasket', facebook: 'https://www.facebook.com/Southernfoodbasket/', /* from the Facebook page intro */
    email: 'hello@sfb.example', careersEmail: 'careers@sfb.example',
    instagram: { handle: '@southernfoodbasket', url: 'https://www.instagram.com/southernfoodbasket/' }, /* handle from the downloaded post files; verify */
    dealsNote: 'Prices as posted on Southern Food Basket’s Instagram between June and October 2026. Shelf prices may have changed since.',
    demo: true
  },

  /* Five stores. The company's own Facebook post of September 2026 (employee of the month) names them:
     Couva, Coffee Street San Fernando, Point Fortin, Penal, St Charles Village Princes Town.
     Addresses, phone numbers, plus codes, place IDs and opening hours come from each store's Google Maps
     listing, read on 2026-10-23. hours[0] = Mon–Sat, hours[1] = Sunday; public holiday hours are not published. */
  branches: [
    { id: 'sando', name: 'San Fernando', short: 'Coffee Street', address: 'Coffee Street, San Fernando',
      plusCode: '7GGR+QF San Fernando', listing: 'Southern Food Basket Market Place', placeId: 'ChIJAzjej_iMNYwRsvY960nc1-s', lat: 10.276923, lng: -61.4587919,
      phone: '+1 868-225-4732', hours: [['Mon – Sat', '7:00 am – 10:00 pm'], ['Sunday', '7:00 am – 7:00 pm']],
      source: 'Google Maps listing “Southern Food Basket Market Place”, Coffee St, read 23 Oct 2026', services: [] },
    { id: 'couva', name: 'Couva', short: '696 Southern Main Road', address: '696 Southern Main Road, Couva',
      plusCode: 'CG8J+M2 Couva', listing: 'Southern Food Basket Market Place', placeId: 'ChIJEd6aBQDxNYwRB30ofcl7tHo', lat: 10.4166444, lng: -61.4699211,
      phone: '+1 868-225-4732', hours: [['Mon – Sat', '7:00 am – 10:00 pm'], ['Sunday', '7:00 am – 7:00 pm']],
      source: 'Google Maps listing, 696 Southern Main Rd, read 23 Oct 2026; the newest store',
      services: ['In-store bakery', 'Restaurant', 'Meat section', 'Fresh-cut veg packs', 'Health and fitness range'],
      servicesSource: 'Google reviews of the Couva store and the company’s posts tagged Couva' },
    { id: 'ptown', name: 'Princes Town', short: 'St Charles Village', address: 'St Charles Junction, Manahambre Road, Princes Town',
      plusCode: '7H4Q+C4 Woodlands', listing: 'Southern Food Basket Supermarket', placeId: 'ChIJu1WbOoyLNYwRubyL3YjHXM4', lat: 10.2560144, lng: -61.4122009,
      phone: '+1 868-225-4732', hours: [['Mon – Sat', '7:00 am – 10:00 pm'], ['Sunday', '7:00 am – 7:00 pm']],
      source: 'Google Maps listing “Southern Food Basket Supermarket”, Manahambre Rd, read 23 Oct 2026. A second listing, “Market Place” on St Charles Rd (+1 868-655-8092, Saturday to 8:00 pm), sits about 60 m away',
      services: [] },
    { id: 'penal', name: 'Penal', short: 'S.S. Erin Road', address: 'S.S. Erin Road, Penal',
      plusCode: '5G9R+9R5 Penal', listing: 'Southern Food Basket Market Place', placeId: 'ChIJSaRiqHGPNYwR746VSEW35EI', lat: 10.1683834, lng: -61.4579007,
      phone: '+1 868-225-4732', hours: [['Mon – Sat', '7:00 am – 10:00 pm'], ['Sunday', '7:00 am – 7:00 pm']],
      source: 'Google Maps listing, S.S. Erin Rd, read 23 Oct 2026', services: [] },
    { id: 'pfortin', name: 'Point Fortin', short: '38–40 Point Fortin Main Road', address: '38–40 Point Fortin Main Road, Point Fortin',
      plusCode: '58G8+2H Point Fortin', listing: 'Southern Food Basket Market Place', placeId: 'ChIJtYwrnEuZNYwRaM_Ury-pNws', lat: 10.1750099, lng: -61.6836083,
      phone: '+1 868-653-4808', hours: [['Mon – Sat', '7:00 am – 10:00 pm'], ['Sunday', '7:00 am – 7:00 pm']],
      source: 'Google Maps listing, 38–40 Point Fortin Main Rd, read 23 Oct 2026', services: [] }
  ],

  /* counters the company lists on its Facebook page (not every store has every counter) */
  storeServices: ['In-house bakery', 'Restaurant', 'Fresh fruit and vegetables', 'Butcher shop', 'Household department', 'Pharmacy'],

  /* department lines are described from what the company's posts show; images are the company's own photos */
  departments: [
    { id: 'fresh', name: 'Fresh produce and cut veg', short: 'Fresh and cut veg', img: '/assets/img/photos/veg-chunky.webp', alt: 'A tray of chunky cut vegetables: carrot, broccoli, cauliflower, sweet peppers and purple cabbage',
      blurb: 'Fruit and vegetables, plus ready-cut packs for chow mein, stir fry and a chunky veg mix, and bunches of fresh herbs.' },
    { id: 'bakery', name: 'Cakes and bakery', short: 'Cakes', img: '/assets/img/photos/cake-red-velvet.webp', alt: 'A 9‑inch red velvet cake with white frosting in a clear cake box',
      blurb: 'Double-layer cakes in 7‑inch and 9‑inch sizes: sponge, chocolate, coconut, almond crumble and red velvet.' },
    { id: 'chilled', name: 'Dairy and chilled', short: 'Chilled', img: '/assets/img/photos/chobani-flip.webp', alt: 'Chobani Flip yogurt cups on a chilled shelf',
      blurb: 'Yogurts and chilled treats, from Chobani cups to Go-Gurt tubes for the lunch kit.' },
    { id: 'snacks', name: 'Snacks and sweets', short: 'Snacks', img: '/assets/img/photos/snacks-basket.webp', alt: 'A shopping basket full of chips, brownies and popcorn',
      blurb: 'Chips, popcorn, brownies and pudding cups, local brands and imports, with new flavours as they land.' },
    { id: 'health', name: 'Health and fitness', short: 'Health', img: '/assets/img/photos/protein-chips.webp', alt: 'A bag of Applied Nutrition protein chips held up in an aisle',
      blurb: 'Protein chips, bars and cookies, protein water, plant protein and creatine.' },
    { id: 'care', name: 'Personal care', short: 'Personal care', img: '/assets/img/photos/st-ives.webp', alt: 'A bottle of St. Ives citrus and cherry blossom body wash in front of a toiletries shelf',
      blurb: 'Body washes and toiletries from St. Ives, Dove, Tone, Old Spice and Irish Spring.' },
    { id: 'wholesale', name: 'Bulk and wholesale', short: 'Wholesale', img: '/assets/img/photos/store-produce.webp', alt: 'The fruits and vegetables section of a Southern Food Basket store, with plantain priced at $8.95',
      blurb: 'Case and pallet supply for shops, restaurants and caterers, from the Princes Town trade desk.' }
  ],

  /* "1 FOR $x · TRY ME" deals as posted on the company's Instagram. price is TTD, one unit each.
     posted = the post date (from the post timestamp); isNew = the post carried a "NEW PRODUCT" corner;
     couva = the post carried the Couva location tag. */
  specials: [
    { id: 'sp-veg-chunky', name: 'Chunky veg pack', dept: 'fresh', price: 24.95, img: 'veg-chunky', posted: '2026-10-08', couva: true, alt: 'Tray of chunky cut carrot, broccoli, cauliflower, sweet pepper and cabbage' },
    { id: 'sp-veg-stir-fry', name: 'Stir fry veggie pack', dept: 'fresh', price: 24.95, img: 'veg-stir-fry', posted: '2026-10-08', couva: true, alt: 'Tray of broccoli, carrot sticks, celery and sweet peppers for stir fry' },
    { id: 'sp-veg-chow-mein', name: 'Chow mein pack', dept: 'fresh', price: 11.95, img: 'veg-chow-mein', posted: '2026-10-08', couva: true, alt: 'Tray of shredded carrot, cabbage, purple cabbage and peppers for chow mein' },
    { id: 'sp-parsley', name: 'Parsley, fresh bunch', dept: 'fresh', price: 15.00, img: 'parsley', posted: '2026-10-08', couva: true, alt: 'A wrapped tray of fresh curly parsley' },
    { id: 'sp-cake-red-velvet', name: 'Red velvet cake, 9‑inch double layer', dept: 'bakery', price: 145.00, img: 'cake-red-velvet', posted: '2026-09-09', couva: true, alt: 'Red velvet cake with white frosting and red crumb topping' },
    { id: 'sp-cake-chocolate', name: 'Chocolate cake, 9‑inch double layer', dept: 'bakery', price: 100.00, img: 'cake-chocolate', posted: '2026-09-09', couva: true, alt: 'Chocolate cake ringed with yellow piped frosting flowers' },
    { id: 'sp-cake-sponge', name: 'Sponge cake, 9‑inch double layer', dept: 'bakery', price: 100.00, img: 'cake-sponge', posted: '2026-09-09', couva: true, alt: 'Sponge cake with blue piped border and white frosting roses' },
    { id: 'sp-cake-coconut', name: 'Coconut cake, 7‑inch double layer', dept: 'bakery', price: 100.00, img: 'cake-coconut', posted: '2026-09-09', couva: true, alt: 'Coconut cake covered in white frosting and coconut' },
    { id: 'sp-cake-almond', name: 'Almond crumble cake, 7‑inch double layer', dept: 'bakery', price: 100.00, img: 'cake-almond-crumble', posted: '2026-09-09', couva: true, alt: 'Cream cake topped with a ring of almond crumble' },
    { id: 'sp-chobani-creations', name: 'Chobani Creations Greek yogurt, caramel sundae', dept: 'chilled', price: 24.95, img: 'chobani-creations', posted: '2026-07-08', alt: 'A cup of Chobani Creations caramel sundae yogurt held on an open hand' },
    { id: 'sp-chobani-flip', name: 'Chobani Flip, almond coco loco', dept: 'chilled', price: 19.95, img: 'chobani-flip', posted: '2026-07-08', alt: 'Chobani Flip almond coco loco yogurt cups' },
    { id: 'sp-gogurt', name: 'Go-Gurt yogurt tubes', dept: 'chilled', price: 44.95, img: 'gogurt', posted: '2026-07-08', alt: 'A box of Go-Gurt yogurt tubes with Spider-Man packaging' },
    { id: 'sp-snack-pack', name: 'Snack Pack pudding cups', dept: 'snacks', price: 22.95, img: 'snack-pack', posted: '2026-07-08', alt: 'A four-pack of Snack Pack chocolate and vanilla pudding cups' },
    { id: 'sp-ripples', name: 'Ripples potato chips', dept: 'snacks', price: 6.00, img: 'ripples', posted: '2026-10-07', alt: 'A bag of Ripples potato chips' },
    { id: 'sp-mr-brownie', name: 'Mr. Brownie brownies', dept: 'snacks', price: 17.95, img: 'mr-brownie', posted: '2026-10-07', alt: 'Two packs of Mr. Brownie brownies hanging on a shelf hook' },
    { id: 'sp-popcorn', name: 'Coconut Crunch popcorn', dept: 'snacks', price: 6.00, img: 'coconut-popcorn', posted: '2026-10-07', alt: 'A bag of Coconut Crunch popcorn' },
    { id: 'sp-chee-zees', name: 'Chee Zees, kick of spice', dept: 'snacks', price: 6.00, img: 'chee-zees', posted: '2026-07-15', isNew: true, alt: 'A bag of Chee Zees kick of spice with cheese puffs flying out' },
    { id: 'sp-lays', name: 'Lay’s chips, limited edition', dept: 'snacks', price: 7.95, img: 'lays-limited', posted: '2026-06-12', isNew: true, alt: 'A limited edition bag of Lay’s chips framed between two hands' },
    { id: 'sp-protein-chips', name: 'Protein chips, sour cream and onion', dept: 'health', price: 19.95, img: 'protein-chips', posted: '2026-09-14', isNew: true, couva: true, alt: 'A green bag of Applied Nutrition protein chips' },
    { id: 'sp-protein-crunch', name: 'Protein Crunch bar', dept: 'health', price: 18.95, img: 'protein-crunch', posted: '2026-09-14', isNew: true, couva: true, alt: 'Two Protein Crunch bars held in a hand' },
    { id: 'sp-st-ives', name: 'St. Ives body wash, citrus and cherry blossom, 650 ml', dept: 'care', price: 56.95, img: 'st-ives', posted: '2026-09-08', alt: 'A bottle of St. Ives citrus and cherry blossom body wash' },
    { id: 'sp-old-spice', name: 'Old Spice body wash, Captain', dept: 'care', price: 74.95, img: 'old-spice', posted: '2026-09-08', alt: 'A red bottle of Old Spice Captain body wash' },
    { id: 'sp-irish-spring', name: 'Irish Spring body wash, aloe mist', dept: 'care', price: 52.95, img: 'irish-spring', posted: '2026-09-08', alt: 'A green bottle of Irish Spring aloe mist body wash' },
    { id: 'sp-tone', name: 'Tone body wash, Miami glow up', dept: 'care', price: 44.95, img: 'tone', posted: '2026-09-08', alt: 'A green bottle of Tone Miami glow up body wash' },
    { id: 'sp-dove', name: 'Dove body wash, glowing', dept: 'care', price: 42.95, img: 'dove', posted: '2026-09-08', alt: 'A white bottle of Dove glowing body wash' },
    // One posted special scheduled to come back at its posted price, to show the Scheduled view.
    { id: 'sp-veg-chunky-xmas', name: 'Chunky veg pack', dept: 'fresh', price: 24.95, img: 'veg-chunky', posted: '2026-11-20', to: '2026-12-24', couva: true, alt: 'Tray of chunky cut carrot, broccoli, cauliflower, sweet pepper and cabbage' },
    /* DEMO history: ended specials, made up so the History view has months to look back through. They never
       show on the public pages, because they have ended. */
    { id: 'sp-h-sponge', name: 'Sponge cake, Divali', dept: 'bakery', price: 59.95, img: 'cake-sponge', posted: '2026-10-05', to: '2026-11-11', alt: 'A sponge cake in a clear box' },
    { id: 'sp-h-coconut', name: 'Coconut cake, Divali', dept: 'bakery', price: 64.95, img: 'cake-coconut', posted: '2026-10-05', to: '2026-11-11', alt: 'A coconut cake in a clear box' },
    { id: 'sp-h-ripples', name: 'Ripples chips, Divali', dept: 'snacks', price: 7.95, img: 'ripples', posted: '2026-10-05', to: '2026-11-11', alt: 'A bag of Ripples chips' },
    { id: 'sp-h-flip', name: 'Chobani Flip, two for', dept: 'chilled', price: 27.95, img: 'chobani-flip', posted: '2026-10-12', to: '2026-10-25', alt: 'Chobani Flip yogurt cups' },
    { id: 'sp-h-crunch', name: 'Protein crunch bar', dept: 'health', price: 18.95, img: 'protein-crunch', posted: '2026-10-12', to: '2026-10-25', alt: 'A protein crunch bar held up in an aisle' },
    { id: 'sp-h-cheezees', name: 'Chee Zees, back to school', dept: 'snacks', price: 9.95, img: 'chee-zees', posted: '2026-09-01', to: '2026-09-13', alt: 'A bag of Chee Zees' },
    { id: 'sp-h-gogurt', name: 'Go-Gurt tubes, back to school', dept: 'chilled', price: 21.95, img: 'gogurt', posted: '2026-09-01', to: '2026-09-13', alt: 'A box of Go-Gurt tubes' },
    { id: 'sp-h-snackpack', name: 'Snack Pack pudding, back to school', dept: 'snacks', price: 16.95, img: 'snack-pack', posted: '2026-09-01', to: '2026-09-13', alt: 'Snack Pack pudding cups' },
    { id: 'sp-h-oldspice', name: 'Old Spice body wash', dept: 'care', price: 39.95, img: 'old-spice', posted: '2026-08-17', to: '2026-08-31', alt: 'A bottle of Old Spice body wash' },
    { id: 'sp-h-irish', name: 'Irish Spring, three bars', dept: 'care', price: 24.95, img: 'irish-spring', posted: '2026-08-17', to: '2026-08-31', alt: 'A pack of Irish Spring soap' },
    { id: 'sp-h-parsley', name: 'Parsley, a bunch', dept: 'fresh', price: 4.95, img: 'parsley', posted: '2026-07-20', to: '2026-07-31', alt: 'A bunch of fresh parsley' },
  ],

  /* wholesale: sourced product lines, kept apart from demo copy */
  wholesale: {
    sourced: [
      { text: 'US customs shipment records list table potatoes, cabbage, frozen beef and raisins among imports to the San Fernando address.', source: 'Panjiva' },
      { text: 'An exporter directory lists beans, fresh fruit, frozen meats and vegetables as supply lines.', source: 'ExportersIndia' },
      { text: 'Registered company: Southern Food Basket Limited, Princes Town.', source: 'Dun & Bradstreet' }
    ],
    lines: ['Rice, peas, beans and channa by the bag or pallet', 'Fresh and frozen meats by the case', 'Produce in field crates for restaurants and caterers', 'Cooking oils, flour and sugar in trade sizes', 'Paper goods and cleaning supplies for shops and offices'],
    customerTypes: ['Mini-marts and parlours', 'Restaurants, roti shops and caterers', 'Schools and canteens', 'Bars and rum shops', 'Offices and NGOs']
  },

  jobDepts: ['Bakery', 'Checkout', 'Perishables', 'Warehouse', 'Dispatch', 'Wholesale Sales', 'HR', 'IT'],

  /* KYC vocabulary shared by applicants and employees. "expires" docs carry an expiry date. */
  kycDocs: [
    { id: 'photo-id', name: 'Government photo ID', desc: 'National ID card, Driver’s Permit or Passport. Must be current.', formats: ['pdf', 'jpg', 'png'], expires: true },
    { id: 'bir', name: 'BIR file number', desc: 'Board of Inland Revenue file number letter or card.', formats: ['pdf', 'jpg', 'png'], expires: false },
    { id: 'nis', name: 'NIS registration', desc: 'National Insurance registration card or letter.', formats: ['pdf', 'jpg', 'png'], expires: false },
    { id: 'coc', name: 'Certificate of Character', desc: 'Issued by the Trinidad and Tobago Police Service, dated within the last six months.', formats: ['pdf', 'jpg', 'png'], expires: true },
    { id: 'address', name: 'Proof of address', desc: 'Utility bill or bank statement from the last three months.', formats: ['pdf', 'jpg', 'png'], expires: false },
    { id: 'refs', name: 'Two references', desc: 'Names and contact details of two referees; one professional where possible.', formats: ['pdf'], expires: false },
    { id: 'bank', name: 'Bank account for payroll', desc: 'Bank letter or voided cheque. Account details are masked once verified.', formats: ['pdf', 'jpg', 'png'], expires: false },
    { id: 'food-badge', name: 'Food Handler’s Badge', desc: 'Ministry of Health food badge, required before the start date for food-handling roles.', formats: ['pdf', 'jpg', 'png'], expires: true },
    { id: 'work-permit', name: 'Work permit', desc: 'Only if you are not a national of Trinidad and Tobago or CARICOM skilled-certificate holder.', formats: ['pdf', 'jpg', 'png'], expires: true, conditional: true }
  ],

  stages: [
    { id: 'submitted', label: 'Submitted', tone: 'info' },
    { id: 'screening', label: 'Screening', tone: 'info' },
    { id: 'kyc', label: 'KYC review', tone: 'warn' },
    { id: 'interview', label: 'Interview', tone: 'info' },
    { id: 'offer', label: 'Offer', tone: 'ok' },
    { id: 'hired', label: 'Hired', tone: 'ok' },
    { id: 'not-selected', label: 'Not selected', tone: 'bad' },
    { id: 'withdrawn', label: 'Withdrawn', tone: 'plain' }
  ],

  jobs: [
    { id: 'job-bakery-ptown', title: 'Bakery Attendant', dept: 'Bakery', branchId: 'ptown', type: 'Full-time', shift: 'Early shift from 5:30 am, rota includes Saturdays', posted: '2026-10-12', status: 'open',
      summary: 'Bake, pack and present the morning range, keep the bakery spotless and tell customers what came out of the oven.',
      responsibilities: ['Prepare and bake hops bread, sweetbread and loaves to the daily plan', 'Pack, label and date every item; rotate stock', 'Keep the bakery to food-safety standard throughout the shift', 'Serve customers at the bakery counter'],
      requirements: ['Food Handler’s Badge before start date', 'Comfortable with a 5:30 am start', 'Able to lift 20 kg flour bags', 'Bakery or kitchen experience welcome, not required'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'food-badge', 'work-permit'] },
    { id: 'job-checkout-sando', title: 'Checkout Associate', dept: 'Checkout', branchId: 'sando', type: 'Full-time', shift: 'Rotating 8-hour shifts, including weekends', posted: '2026-10-08', status: 'open',
      summary: 'The last face a customer sees. Scan, bag, handle cash and card accurately, and keep the queue moving.',
      responsibilities: ['Operate the till and card terminal; balance your float at shift end', 'Bag with care, heavy to light, cold together', 'Spot price mismatches and report them', 'Help with front-end restocking during quiet periods'],
      requirements: ['Numerate and accurate under pressure', 'Clear, polite communication', 'Able to stand for long periods', 'Retail or cash-handling experience welcome'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-checkout-penal', title: 'Checkout Associate', dept: 'Checkout', branchId: 'penal', type: 'Part-time', shift: 'Evenings and weekends, 20–25 hours a week', posted: '2026-10-15', status: 'open',
      summary: 'Evening and weekend till cover at our Penal branch.',
      responsibilities: ['Operate the till and card terminal', 'Bag with care', 'Keep the front end tidy'],
      requirements: ['Available evenings and weekends', 'Numerate and accurate', 'Able to stand for long periods'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-perish-penal', title: 'Perishables Attendant', dept: 'Perishables', branchId: 'penal', type: 'Full-time', shift: 'Day shift from 6:30 am, rota includes Sundays', posted: '2026-10-10', status: 'open',
      summary: 'Receive the morning produce, build the displays and keep the chill chain unbroken.',
      responsibilities: ['Receive and check produce and dairy deliveries', 'Build and refresh displays; cull and record waste', 'Monitor fridge temperatures and log them', 'Advise customers on what is fresh today'],
      requirements: ['Food Handler’s Badge before start date', 'Able to lift 25 kg crates', 'Eye for quality and detail'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'food-badge', 'work-permit'] },
    { id: 'job-warehouse-ptown', title: 'Warehouse Attendant', dept: 'Warehouse', branchId: 'ptown', type: 'Full-time', shift: 'Two shifts: 6 am – 2 pm or 2 pm – 10 pm', posted: '2026-10-05', status: 'open',
      summary: 'Pick, pack and load wholesale and branch orders at the Princes Town distribution centre.',
      responsibilities: ['Pick orders accurately against the pick list', 'Operate pallet jacks; forklift after certification', 'Receive containers and put away stock by location', 'Keep the floor clear and safe'],
      requirements: ['Able to lift 25 kg repeatedly', 'Comfortable working to targets', 'Forklift licence a plus, training provided'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-dispatch-sando', title: 'Delivery Dispatcher', dept: 'Dispatch', branchId: 'sando', type: 'Full-time', shift: 'Day shift, Monday to Saturday', posted: '2026-10-14', status: 'open',
      summary: 'Plan the day’s deliveries, brief the drivers and keep customers told when their order will land.',
      responsibilities: ['Build daily routes for three vans', 'Confirm orders with wholesale customers by phone and WhatsApp', 'Track proof of delivery and resolve shortages', 'Keep vehicle checks and fuel logs current'],
      requirements: ['Organised and calm on the phone', 'Knows the roads of south Trinidad', 'Basic spreadsheet skills', 'Driver’s Permit, Class 3 welcome'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-wholesale-sando', title: 'Wholesale Sales Representative', dept: 'Wholesale Sales', branchId: 'sando', type: 'Full-time', shift: 'Day shift, on the road three days a week', posted: '2026-10-01', status: 'open',
      summary: 'Grow and look after trade accounts across the south: mini-marts, restaurants, canteens and caterers.',
      responsibilities: ['Visit and open trade accounts', 'Quote from the wholesale price list and take orders', 'Hand orders to dispatch and follow through', 'Report weekly on pipeline and collections'],
      requirements: ['Two years in sales or trade supply', 'Own transport and a valid Driver’s Permit', 'Comfortable with quotes, margins and credit terms'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-hr-ptown', title: 'HR Assistant', dept: 'HR', branchId: 'ptown', type: 'Full-time', shift: 'Office hours, Monday to Friday', posted: '2026-09-28', status: 'open',
      summary: 'Keep hiring, onboarding and employee records moving for five stores and the distribution centre.',
      responsibilities: ['Screen applications and schedule interviews', 'Check onboarding documents and chase gaps', 'Maintain leave, training and compliance records', 'Prepare payroll inputs'],
      requirements: ['Diploma or certificate in HR or business', 'Careful with confidential information', 'Confident with spreadsheets'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] },
    { id: 'job-it-ptown', title: 'IT Support Technician', dept: 'IT', branchId: 'ptown', type: 'Full-time', shift: 'Office hours with an on-call rota', posted: '2026-09-20', status: 'closed',
      summary: 'Keep tills, scales, scanners and the back office running across five stores.',
      responsibilities: ['First-line support for POS and back office', 'Maintain network and Wi-Fi at each branch', 'Manage user accounts and backups'],
      requirements: ['Two years of IT support', 'POS experience a plus', 'Own transport'],
      kyc: ['photo-id', 'bir', 'nis', 'coc', 'address', 'refs', 'bank', 'work-permit'] }
  ],

  /* Staff-only and member-only collections are empty here and filled from lib/seed-private.ts, which only the
     portals import, so the public pages' scripts carry no applicant, payroll or mailing-list data. */
  applicants: [],
  employees: [],
  announcements: [],
  policies: [],
  grants: [],
  customers: [],
  entitlements: [],
  redemptions: [],
  subscribers: [],
  consents: [],
  campaigns: [],
  staffUpdates: [],
  outbox: [],
  audit: [],

  /* The website studio's settings (lib/ops/site.ts). The season is switched off here: the studio turns it on. */
  site: {
    season: { id: 'christmas', mode: 'off', from: '2026-11-20', to: '2027-01-02', lights: true, greeting: 'Merry Christmas from all of us at Southern Food Basket' },
    notice: { on: false, text: '', linkLabel: '', href: '' },
    hiddenBands: []
  },
  /* Operations: filled by the staff tier (lib/seed-ops.ts), never shipped to public pages. */
  suppliers: [], specialsBooks: [], supplierSheets: [], sellouts: [], requests: [], bulkOrders: [], tasks: [], resources: [],
  socialAccounts: [], socialPosts: [], socialWeeks: [], sitePages: [], plan: [], feedback: [],
  events: EVENTS, flyers: FLYERS,

  content: {
    hero: { headline: 'Fresh food and fair prices, close to home.', sub: 'Groceries, fresh-cut veg, double-layer cakes and specials at five stores: San Fernando, Couva, Princes Town, Penal and Point Fortin.' },
    values: [
      { title: 'Fresh, and ready to cook', text: 'Ready-cut veg packs and fresh herbs sit next to the whole produce, so dinner takes less time.' },
      { title: 'Prices you can see', text: 'Every special is posted with its price, in store and on Instagram, before you come in.' },
      { title: 'Here for the south', text: 'San Fernando, Couva, Princes Town, Penal and Point Fortin. We hire from the communities we serve.' },
      { title: 'Part of the community', text: 'The flag truck on the road, and prize giveaways on the shop floor.' }
    ],
    facts: [
      { text: 'Southern Food Basket Limited, registered in Princes Town, Trinidad and Tobago.', source: 'Dun & Bradstreet company profile' },
      { text: 'Founded 1998.', source: 'Del Risco company record (an exporter directory gives 2000)' },
      { text: 'Supermarket and wholesale, with import and export activity in produce and frozen meats.', source: 'Panjiva shipment records; ExportersIndia listing' }
    ],
    community: {
      title: 'Out in the community',
      text: 'You will see the pink-and-green flags on the music truck around the south, and the team in red shirts running prize giveaways on the shop floor.',
      source: 'The company’s Instagram, October 2026',
      img: '/assets/img/photos/flags-car.webp', alt: 'Southern Food Basket flags flying from a vehicle on the road'
    },
    careersWhy: [
      // Only what this portal itself does: pay and training terms are the company's to state (see docs/audit).
      { title: 'Apply in about ten minutes', text: 'One form on your phone or computer. It saves as you go, so you can stop and come back.' },
      { title: 'Know what to bring', text: 'Each job lists the documents it needs, such as a Food Handler’s Badge for food-handling roles.' },
      { title: 'Close to home', text: 'Five stores, from Couva to Point Fortin, so you can work near where you live.' },
      { title: 'A straight process', text: 'You see every stage of your application and every document we still need. No chasing, no silence.' }
    ]
  },

  /* Promotions are DEMO: the company has not announced a members' offer. Only promotions that are approved and
     already running sit in this public file; drafts and scheduled ones are in lib/seed-private.ts. */
  promotions: PUBLIC_PROMOTIONS
};
