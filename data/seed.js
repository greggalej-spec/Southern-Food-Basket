/* Southern Food Basket — seed data for the concept site.
   Two kinds of data, kept apart:
   - SOURCED: deals, prices, post dates, department lines and the Couva location come from the company's own
     public Instagram posts (photos supplied by Gregg, 2026-10-23); company facts and three branch addresses come
     from public directories (unverified). Each sourced item says where it came from.
   - DEMO: every person, job, document, hour, phone number and e-mail is invented for the prototype.
   Bump `version` when the seed changes so stale localStorage copies are replaced. */
window.SFB_DATA = {
  version: 6,
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
    { id: 'fresh', name: 'Fresh produce and cut veg', short: 'Fresh and cut veg', img: 'assets/img/photos/veg-chunky.webp', alt: 'A tray of chunky cut vegetables: carrot, broccoli, cauliflower, sweet peppers and purple cabbage',
      blurb: 'Fruit and vegetables, plus ready-cut packs for chow mein, stir fry and a chunky veg mix, and bunches of fresh herbs.' },
    { id: 'bakery', name: 'Cakes and bakery', short: 'Cakes', img: 'assets/img/photos/cake-red-velvet.webp', alt: 'A 9‑inch red velvet cake with white frosting in a clear cake box',
      blurb: 'Double-layer cakes in 7‑inch and 9‑inch sizes: sponge, chocolate, coconut, almond crumble and red velvet.' },
    { id: 'chilled', name: 'Dairy and chilled', short: 'Chilled', img: 'assets/img/photos/chobani-flip.webp', alt: 'Chobani Flip yogurt cups on a chilled shelf',
      blurb: 'Yogurts and chilled treats, from Chobani cups to Go-Gurt tubes for the lunch kit.' },
    { id: 'snacks', name: 'Snacks and sweets', short: 'Snacks', img: 'assets/img/photos/snacks-basket.webp', alt: 'A shopping basket full of chips, brownies and popcorn',
      blurb: 'Chips, popcorn, brownies and pudding cups, local brands and imports, with new flavours as they land.' },
    { id: 'health', name: 'Health and fitness', short: 'Health', img: 'assets/img/photos/protein-chips.webp', alt: 'A bag of Applied Nutrition protein chips held up in an aisle',
      blurb: 'Protein chips, bars and cookies, protein water, plant protein and creatine.' },
    { id: 'care', name: 'Personal care', short: 'Personal care', img: 'assets/img/photos/st-ives.webp', alt: 'A bottle of St. Ives citrus and cherry blossom body wash in front of a toiletries shelf',
      blurb: 'Body washes and toiletries from St. Ives, Dove, Tone, Old Spice and Irish Spring.' },
    { id: 'wholesale', name: 'Bulk and wholesale', short: 'Wholesale', img: 'assets/img/photos/store-produce.webp', alt: 'The fruits and vegetables section of a Southern Food Basket store, with plantain priced at $8.95',
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
    { id: 'sp-dove', name: 'Dove body wash, glowing', dept: 'care', price: 42.95, img: 'dove', posted: '2026-09-08', alt: 'A white bottle of Dove glowing body wash' }
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

  /* demo applicants. docs: { docId: { state, fileName, size, type, expiry, reason } } — never file bytes */
  applicants: [
    { id: 'app-aaliyah', name: 'Aaliyah Persad', email: 'aaliyah.persad@example.com', phone: '(868) 000-0201', jobId: 'job-checkout-sando', stage: 'kyc', submittedAt: '2026-10-14T10:12:00',
      personal: { address: 'Demo Street, Marabella', dob: '2001-06-14', nonNational: false },
      experience: { summary: 'Two years as a cashier at a pharmacy in Marabella; comfortable with card terminals and end-of-day reconciliation.', availability: ['Weekdays', 'Saturdays'], startDate: '2026-11-02' },
      docs: {
        'photo-id': { state: 'uploaded', fileName: 'national-id.jpg', size: 412000, type: 'image/jpeg', expiry: '2029-03-14', updatedAt: '2026-10-14T10:20:00' },
        'bir': { state: 'verified', fileName: 'bir-letter.pdf', size: 88000, type: 'application/pdf', updatedAt: '2026-10-16T09:00:00' },
        'nis': { state: 'verified', fileName: 'nis-card.jpg', size: 230000, type: 'image/jpeg', updatedAt: '2026-10-16T09:02:00' },
        'coc': { state: 'uploaded', fileName: 'certificate-of-character.pdf', size: 540000, type: 'application/pdf', expiry: '2027-03-01', updatedAt: '2026-10-15T18:40:00' },
        'address': { state: 'flagged', fileName: 'tt-electricity-bill.pdf', size: 150000, type: 'application/pdf', reason: 'Bill is older than three months. Please upload a recent one.', updatedAt: '2026-10-16T09:10:00' },
        'refs': { state: 'uploaded', fileName: 'references.pdf', size: 60000, type: 'application/pdf', updatedAt: '2026-10-14T10:25:00' }
      },
      notes: [{ at: '2026-10-16T09:12:00', author: 'Devon Baptiste', text: 'Strong cash-handling background. Chasing a recent proof of address, then schedule interview at Coffee Street.' }],
      messages: [{ at: '2026-10-16T09:15:00', from: 'HR', text: 'Hi Aaliyah, thanks for applying. Your proof of address is older than three months. Please upload a bill or statement from the last three months and we will move you to interview.' }],
      timeline: [
        { at: '2026-10-14T10:12:00', text: 'Application submitted' },
        { at: '2026-10-15T14:00:00', text: 'Moved to Screening' },
        { at: '2026-10-16T09:00:00', text: 'Moved to KYC review' },
        { at: '2026-10-16T09:10:00', text: 'Proof of address: flagged — Bill is older than three months' }
      ] },
    { id: 'app-jerome', name: 'Jerome Phillip', email: 'jerome.phillip@example.com', phone: '(868) 000-0202', jobId: 'job-bakery-ptown', stage: 'interview', submittedAt: '2026-10-13T08:40:00',
      personal: { address: 'Demo Trace, Princes Town', dob: '1998-11-02', nonNational: false },
      experience: { summary: 'Three years at a family bakery in Princes Town; hops bread, sweetbread and pastry. Holds a current food badge.', availability: ['Early mornings', 'Saturdays'], startDate: '2026-11-09' },
      interview: { at: '2026-10-27T10:00:00', where: 'Princes Town head office', with: 'Marsha Gopaul, Bakery Lead' },
      docs: {
        'photo-id': { state: 'verified', fileName: 'drivers-permit.jpg', size: 380000, type: 'image/jpeg', expiry: '2028-01-20' },
        'bir': { state: 'verified', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' },
        'nis': { state: 'verified', fileName: 'nis.pdf', size: 65000, type: 'application/pdf' },
        'coc': { state: 'verified', fileName: 'coc.pdf', size: 520000, type: 'application/pdf', expiry: '2027-02-10' },
        'address': { state: 'verified', fileName: 'wasa-bill.pdf', size: 140000, type: 'application/pdf' },
        'refs': { state: 'verified', fileName: 'refs.pdf', size: 50000, type: 'application/pdf' },
        'bank': { state: 'uploaded', fileName: 'bank-letter.pdf', size: 90000, type: 'application/pdf' },
        'food-badge': { state: 'verified', fileName: 'food-badge.jpg', size: 300000, type: 'image/jpeg', expiry: '2027-08-31' }
      },
      notes: [{ at: '2026-10-19T11:00:00', author: 'Devon Baptiste', text: 'All documents in. Interview booked with Marsha for Mon 27 Oct.' }],
      messages: [{ at: '2026-10-19T11:05:00', from: 'HR', text: 'Hi Jerome, your interview is on Monday 27 October at 10:00 am at the Princes Town head office. Ask for Marsha at the wholesale desk.' }],
      timeline: [
        { at: '2026-10-13T08:40:00', text: 'Application submitted' },
        { at: '2026-10-14T09:30:00', text: 'Moved to Screening' },
        { at: '2026-10-15T10:00:00', text: 'Moved to KYC review' },
        { at: '2026-10-19T11:00:00', text: 'Moved to Interview' }
      ] },
    { id: 'app-priya', name: 'Priya Maharaj', email: 'priya.maharaj@example.com', phone: '(868) 000-0203', jobId: 'job-wholesale-sando', stage: 'screening', submittedAt: '2026-10-18T16:05:00',
      personal: { address: 'Demo Avenue, Debe', dob: '1994-03-22', nonNational: false },
      experience: { summary: 'Four years selling beverages to bars and mini-marts across the south for a distributor. Own car, Class 3 permit.', availability: ['Weekdays'], startDate: '2026-11-16' },
      docs: { 'photo-id': { state: 'uploaded', fileName: 'passport.jpg', size: 400000, type: 'image/jpeg', expiry: '2031-05-02' } },
      notes: [], messages: [],
      timeline: [{ at: '2026-10-18T16:05:00', text: 'Application submitted' }, { at: '2026-10-20T09:00:00', text: 'Moved to Screening' }] },
    { id: 'app-marcus', name: 'Marcus Joseph', email: 'marcus.joseph@example.com', phone: '(868) 000-0204', jobId: 'job-warehouse-ptown', stage: 'submitted', submittedAt: '2026-10-21T19:30:00',
      personal: { address: 'Demo Road, Moruga', dob: '2003-09-09', nonNational: false },
      experience: { summary: 'Loaded trucks for a hardware store for a year. Fit, reliable, wants forklift training.', availability: ['Any shift'], startDate: '2026-11-02' },
      docs: {}, notes: [], messages: [],
      timeline: [{ at: '2026-10-21T19:30:00', text: 'Application submitted' }] },
    { id: 'app-shanice', name: 'Shanice Lewis', email: 'shanice.lewis@example.com', phone: '(868) 000-0205', jobId: 'job-perish-penal', stage: 'offer', submittedAt: '2026-10-02T09:00:00',
      personal: { address: 'Demo Street, Penal', dob: '1999-12-30', nonNational: false },
      experience: { summary: 'Two years in produce at a Siparia supermarket. Knows the Penal farmers by name.', availability: ['Early mornings', 'Sundays'], startDate: '2026-11-02' },
      offer: { startDate: '2026-11-02', pay: 4300, payUnit: 'month', sentAt: '2026-10-20T15:00:00', status: 'sent' },
      docs: {
        'photo-id': { state: 'verified', fileName: 'id.jpg', size: 350000, type: 'image/jpeg', expiry: '2030-06-15' },
        'bir': { state: 'verified', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' },
        'nis': { state: 'verified', fileName: 'nis.pdf', size: 65000, type: 'application/pdf' },
        'coc': { state: 'verified', fileName: 'coc.pdf', size: 500000, type: 'application/pdf', expiry: '2027-01-15' },
        'address': { state: 'verified', fileName: 'bill.pdf', size: 120000, type: 'application/pdf' },
        'refs': { state: 'verified', fileName: 'refs.pdf', size: 50000, type: 'application/pdf' },
        'bank': { state: 'verified', fileName: 'bank.pdf', size: 80000, type: 'application/pdf' },
        'food-badge': { state: 'verified', fileName: 'badge.jpg', size: 280000, type: 'image/jpeg', expiry: '2027-04-30' }
      },
      notes: [{ at: '2026-10-20T15:00:00', author: 'Devon Baptiste', text: 'Offer sent at TTD 4,300 / month, start 2 Nov.' }],
      messages: [{ at: '2026-10-20T15:02:00', from: 'HR', text: 'Hi Shanice, we would like to offer you the Perishables Attendant role at Penal. The offer letter is in your dashboard. Reply by Friday 24 October.' }],
      timeline: [
        { at: '2026-10-02T09:00:00', text: 'Application submitted' }, { at: '2026-10-05T10:00:00', text: 'Moved to Screening' },
        { at: '2026-10-07T10:00:00', text: 'Moved to KYC review' }, { at: '2026-10-13T10:00:00', text: 'Moved to Interview' },
        { at: '2026-10-20T15:00:00', text: 'Moved to Offer' }
      ] },
    { id: 'app-kwame', name: 'Kwame Alexander', email: 'kwame.alexander@example.com', phone: '(868) 000-0206', jobId: 'job-it-ptown', stage: 'not-selected', submittedAt: '2026-09-22T11:00:00',
      personal: { address: 'Demo Street, San Fernando', dob: '1996-04-18', nonNational: false },
      experience: { summary: 'Help-desk experience at a call centre; no POS background.', availability: ['Weekdays'], startDate: '2026-10-19' },
      docs: { 'photo-id': { state: 'verified', fileName: 'id.jpg', size: 350000, type: 'image/jpeg', expiry: '2029-09-01' } },
      notes: [{ at: '2026-10-03T12:00:00', author: 'Devon Baptiste', text: 'Role filled internally. Keep on file for the next support opening.' }],
      messages: [{ at: '2026-10-03T12:05:00', from: 'HR', text: 'Hi Kwame, thank you for applying. The role has been filled. We will keep your application on file for six months.' }],
      timeline: [{ at: '2026-09-22T11:00:00', text: 'Application submitted' }, { at: '2026-09-25T10:00:00', text: 'Moved to Screening' }, { at: '2026-10-03T12:00:00', text: 'Moved to Not selected — role filled internally' }] },
    { id: 'app-nadia', name: 'Nadia Ali', email: 'nadia.ali@example.com', phone: '(868) 000-0207', jobId: 'job-checkout-penal', stage: 'submitted', submittedAt: '2026-10-22T08:15:00',
      personal: { address: 'Demo Trace, Penal', dob: '2005-02-11', nonNational: false },
      experience: { summary: 'Sixth-form student looking for evening and weekend work.', availability: ['Evenings', 'Weekends'], startDate: '2026-11-02' },
      docs: {}, notes: [], messages: [], timeline: [{ at: '2026-10-22T08:15:00', text: 'Application submitted' }] },
    { id: 'app-rishi', name: 'Rishi Boodram', email: 'rishi.boodram@example.com', phone: '(868) 000-0208', jobId: 'job-dispatch-sando', stage: 'screening', submittedAt: '2026-10-17T13:45:00',
      personal: { address: 'Demo Street, Gasparillo', dob: '1992-07-07', nonNational: false },
      experience: { summary: 'Five years driving and dispatching for a courier; knows every back road from Claxton Bay to Moruga.', availability: ['Weekdays', 'Saturdays'], startDate: '2026-11-09' },
      docs: { 'photo-id': { state: 'uploaded', fileName: 'permit.jpg', size: 390000, type: 'image/jpeg', expiry: '2027-11-30' }, 'bir': { state: 'uploaded', fileName: 'bir.pdf', size: 70000, type: 'application/pdf' } },
      notes: [], messages: [], timeline: [{ at: '2026-10-17T13:45:00', text: 'Application submitted' }, { at: '2026-10-20T09:05:00', text: 'Moved to Screening' }] }
  ],

  /* demo employees. Keisha is the Employee demo login; Devon is the HR demo login. */
  employees: [
    { id: 'emp-keisha', name: 'Keisha Ramlogan', role: 'Checkout Supervisor', dept: 'Checkout', branchId: 'sando', startDate: '2021-03-08', employeeNo: 'SFB-0412',
      email: 'keisha.ramlogan@sfb.example', phone: '(868) 000-0101', address: 'Demo Street, Marabella',
      emergency: { name: 'Anil Ramlogan', relation: 'Spouse', phone: '(868) 000-0102' },
      bank: { bank: 'Demo Bank', masked: '•••• 4821' },
      leave: { annualEntitled: 14, annualUsed: 5, sickEntitled: 14, sickUsed: 2, casualEntitled: 3, casualUsed: 1 },
      leaveRequests: [
        { id: 'lv-1', type: 'Annual', from: '2026-12-22', to: '2026-12-24', days: 3, reason: 'Christmas with family', status: 'pending', requestedAt: '2026-10-20T08:00:00' },
        { id: 'lv-2', type: 'Annual', from: '2026-08-10', to: '2026-08-14', days: 5, reason: 'Family trip', status: 'approved', requestedAt: '2026-07-12T09:00:00' },
        { id: 'lv-3', type: 'Sick', from: '2026-09-03', to: '2026-09-04', days: 2, reason: 'Flu', status: 'approved', requestedAt: '2026-09-03T06:30:00' },
        { id: 'lv-4', type: 'Casual', from: '2026-06-19', to: '2026-06-19', days: 1, reason: 'School meeting', status: 'approved', requestedAt: '2026-06-10T10:00:00' }
      ],
      swapRequests: [],
      shifts: [
        { date: '2026-10-19', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-20', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-22', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-23', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-24', start: '08:00', end: '16:00', role: 'Front end lead' },
        { date: '2026-10-26', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-27', start: '07:00', end: '15:00', role: 'Front end lead' },
        { date: '2026-10-28', start: '07:00', end: '15:00', role: 'Till training (new starters)' },
        { date: '2026-10-30', start: '12:00', end: '20:00', role: 'Front end lead' },
        { date: '2026-10-31', start: '08:00', end: '16:00', role: 'Front end lead' },
        { date: '2026-11-01', start: '08:00', end: '13:00', role: 'Front end lead' }
      ],
      payslips: [
        { id: 'ps-2026-09', period: 'September 2026', from: '2026-09-01', to: '2026-09-30', paidOn: '2026-09-30',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6200, net: 5873 },
        { id: 'ps-2026-08', period: 'August 2026', from: '2026-08-01', to: '2026-08-31', paidOn: '2026-08-31',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }, { label: 'Overtime (12.5 h)', amount: 312.5 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6512.5, net: 6185.5 },
        { id: 'ps-2026-07', period: 'July 2026', from: '2026-07-01', to: '2026-07-31', paidOn: '2026-07-31',
          earnings: [{ label: 'Basic salary', amount: 5800 }, { label: 'Supervisor allowance', amount: 400 }],
          deductions: [{ label: 'NIS (employee share)', amount: 294 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 0 }],
          gross: 6200, net: 5873 }
      ],
      training: [
        { id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2025-02-10', minutes: 45 },
        { id: 'tr-cash', name: 'Cash handling and till procedures', done: true, completedAt: '2025-03-01', minutes: 30 },
        { id: 'tr-cust', name: 'Customer care refresher 2026', done: false, due: '2026-11-30', minutes: 25 },
        { id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-12-15', minutes: 20 }
      ],
      compliance: [
        { docId: 'photo-id', state: 'verified', expiry: '2028-06-30' },
        { docId: 'nis', state: 'verified' },
        { docId: 'bir', state: 'verified' },
        { docId: 'food-badge', state: 'verified', expiry: '2026-11-18' }
      ] },
    { id: 'emp-devon', name: 'Devon Baptiste', role: 'HR Manager', dept: 'HR', branchId: 'ptown', startDate: '2019-01-14', employeeNo: 'SFB-0117',
      email: 'devon.baptiste@sfb.example', phone: '(868) 000-0103', address: 'Demo Avenue, Princes Town',
      emergency: { name: 'Carla Baptiste', relation: 'Sister', phone: '(868) 000-0104' },
      bank: { bank: 'Demo Bank', masked: '•••• 7730' },
      leave: { annualEntitled: 20, annualUsed: 8, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [{ id: 'lv-d1', type: 'Annual', from: '2026-07-20', to: '2026-07-24', days: 5, reason: 'Tobago', status: 'approved', requestedAt: '2026-06-01T09:00:00' }],
      swapRequests: [],
      shifts: [
        { date: '2026-10-19', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-20', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-21', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-22', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-23', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-26', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-27', start: '08:00', end: '16:30', role: 'Interviews, Princes Town' }, { date: '2026-10-28', start: '08:00', end: '16:30', role: 'Head office' },
        { date: '2026-10-29', start: '08:00', end: '16:30', role: 'Branch visit, Penal' }, { date: '2026-10-30', start: '08:00', end: '16:30', role: 'Head office' }
      ],
      payslips: [
        { id: 'ps-d-2026-09', period: 'September 2026', from: '2026-09-01', to: '2026-09-30', paidOn: '2026-09-30',
          earnings: [{ label: 'Basic salary', amount: 11500 }, { label: 'Travel allowance', amount: 600 }],
          deductions: [{ label: 'NIS (employee share)', amount: 414.3 }, { label: 'Health surcharge', amount: 33 }, { label: 'PAYE', amount: 1125 }],
          gross: 12100, net: 10527.7 }
      ],
      training: [
        { id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2024-01-15', minutes: 45 },
        { id: 'tr-cust', name: 'Customer care refresher 2026', done: true, completedAt: '2026-09-02', minutes: 25 },
        { id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-12-15', minutes: 20 }
      ],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2029-11-02' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-marsha', name: 'Marsha Gopaul', role: 'Bakery Lead', dept: 'Bakery', branchId: 'ptown', startDate: '2017-05-02', employeeNo: 'SFB-0063',
      email: 'marsha.gopaul@sfb.example', phone: '(868) 000-0105', address: 'Demo Road, Princes Town',
      emergency: { name: 'Ravi Gopaul', relation: 'Brother', phone: '(868) 000-0106' },
      bank: { bank: 'Demo Bank', masked: '•••• 1190' },
      leave: { annualEntitled: 18, annualUsed: 10, sickEntitled: 14, sickUsed: 3, casualEntitled: 3, casualUsed: 2 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '05:30', end: '13:30', role: 'Bakery' }, { date: '2026-10-23', start: '05:30', end: '13:30', role: 'Bakery' }, { date: '2026-10-24', start: '05:30', end: '13:30', role: 'Bakery' }],
      payslips: [],
      training: [{ id: 'tr-food', name: 'Food safety, level 1', done: true, completedAt: '2023-02-01', minutes: 45 }, { id: 'tr-cust', name: 'Customer care refresher 2026', done: false, due: '2026-11-30', minutes: 25 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2027-02-28' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }, { docId: 'food-badge', state: 'verified', expiry: '2026-09-30' }] },
    { id: 'emp-ria', name: 'Ria Mohammed', role: 'Marketing and Store Operations', dept: 'Head office', branchId: 'sando', startDate: '2022-02-01', employeeNo: 'SFB-0233',
      email: 'ria.mohammed@sfb.example', phone: '(868) 000-0109', address: 'Demo Street, San Fernando',
      emergency: { name: 'Sameer Mohammed', relation: 'Brother', phone: '(868) 000-0110' },
      bank: { bank: 'Demo Bank', masked: '•••• 3307' },
      leave: { annualEntitled: 16, annualUsed: 4, sickEntitled: 14, sickUsed: 1, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-23', start: '08:00', end: '16:30', role: 'Head office' }, { date: '2026-10-26', start: '08:00', end: '16:30', role: 'Head office' }],
      payslips: [], training: [{ id: 'tr-cust', name: 'Customer care refresher 2026', done: true, completedAt: '2026-08-14', minutes: 25 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2031-04-30' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'verified' }] },
    { id: 'emp-andre', name: 'Andre Charles', role: 'Warehouse Attendant', dept: 'Warehouse', branchId: 'ptown', startDate: '2026-09-15', employeeNo: 'SFB-0498',
      email: 'andre.charles@sfb.example', phone: '(868) 000-0107', address: 'Demo Trace, Moruga',
      emergency: { name: 'Patricia Charles', relation: 'Mother', phone: '(868) 000-0108' },
      bank: { bank: 'Demo Bank', masked: '•••• 5502' },
      leave: { annualEntitled: 14, annualUsed: 0, sickEntitled: 14, sickUsed: 0, casualEntitled: 3, casualUsed: 0 },
      leaveRequests: [], swapRequests: [],
      shifts: [{ date: '2026-10-22', start: '14:00', end: '22:00', role: 'Warehouse' }, { date: '2026-10-23', start: '14:00', end: '22:00', role: 'Warehouse' }],
      payslips: [],
      training: [{ id: 'tr-hs', name: 'Health and safety: manual handling', done: false, due: '2026-10-31', minutes: 20 }, { id: 'tr-forklift', name: 'Forklift certification', done: false, due: '2026-12-01', minutes: 480 }],
      compliance: [{ docId: 'photo-id', state: 'verified', expiry: '2030-01-10' }, { docId: 'nis', state: 'verified' }, { docId: 'bir', state: 'uploaded' }, { docId: 'address', state: 'missing' }, { docId: 'coc', state: 'missing' }] }
  ],

  announcements: [
    { id: 'an-1', branchId: null, date: '2026-10-21', title: 'Public holiday rota is up', body: 'The rota for the next public holiday is posted in Schedule. Raise any swap requests by Friday so branch managers can confirm cover.' },
    { id: 'an-2', branchId: 'sando', date: '2026-10-20', title: 'Coffee Street car park works', body: 'Staff parking moves to the rear lot from Monday 26 October for two weeks while the front car park is resurfaced.' },
    { id: 'an-3', branchId: null, date: '2026-10-15', title: 'Customer care refresher due 30 November', body: 'Everyone on the front end completes the 25-minute refresher in Documents & training before 30 November.' },
    { id: 'an-4', branchId: 'ptown', date: '2026-10-12', title: 'Bakery ovens serviced Tuesday', body: 'Both ovens at Princes Town are serviced on Tuesday 28 October from 2:00 pm. The afternoon bake moves to San Fernando.' }
  ],

  policies: [
    { id: 'pol-conduct', title: 'Code of conduct', summary: 'How we treat customers, suppliers and each other. Straight dealing, no exceptions.', updated: '2026-01-10' },
    { id: 'pol-leave', title: 'Leave policy', summary: 'Annual, sick and casual leave entitlements, how to request, notice periods and public holidays.', updated: '2026-01-10' },
    { id: 'pol-food', title: 'Food safety and hygiene', summary: 'Badges, hand-washing, temperature logs, allergen handling and what to do when something is wrong.', updated: '2026-03-02' },
    { id: 'pol-hs', title: 'Health and safety', summary: 'Manual handling, equipment, incident reporting and first aid at every branch and the distribution centre.', updated: '2026-03-02' },
    { id: 'pol-uniform', title: 'Uniform and appearance', summary: 'What we wear on the floor, in the bakery and on the road, and who supplies it.', updated: '2025-11-01' },
    { id: 'pol-grievance', title: 'Grievance procedure', summary: 'How to raise a concern, who hears it and how quickly you get an answer.', updated: '2025-11-01' }
  ],

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
      { text: 'Supermarket and wholesale, with import and export activity in produce and frozen meats.', source: 'Panjiva shipment records; ExportersIndia listing' },
      { text: 'Posts its deals as “1 FOR $x · TRY ME”; posts from September and October 2026 are tagged Couva.', source: 'The company’s Instagram, June to October 2026' }
    ],
    community: {
      title: 'Out in the community',
      text: 'You will see the pink-and-green flags on the music truck around the south, and the team in red shirts running prize giveaways on the shop floor.',
      source: 'The company’s Instagram, October 2026',
      img: 'assets/img/photos/flags-car.webp', alt: 'Southern Food Basket flags flying from a vehicle on the road'
    },
    careersWhy: [
      // Only what this portal itself does: pay and training terms are the company's to state (see docs/audit).
      { title: 'Apply in about ten minutes', text: 'One form on your phone or computer. It saves as you go, so you can stop and come back.' },
      { title: 'Know what to bring', text: 'Each job lists the documents it needs, such as a Food Handler’s Badge for food-handling roles.' },
      { title: 'Close to home', text: 'Five stores, from Couva to Point Fortin, so you can work near where you live.' },
      { title: 'A straight process', text: 'You see every stage of your application and every document we still need. No chasing, no silence.' }
    ]
  }
};
