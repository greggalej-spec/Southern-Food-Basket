import type { TourChapter } from "./tour";

/* The guided tour's script. Each step opens a page as a given person and rings one element (its data-tour
   attribute). The people and codes are the demo's own (lib/seed-staff.ts, lib/seed-members.ts); "Reset the demo"
   on /tour puts them back, so every chapter starts the same way. */

const shopper = { role: "customer" as const, userId: "cust-marisa" };
const keisha = { role: "employee" as const, userId: "emp-keisha" };
const tricia = { role: "marketing" as const, userId: "emp-tricia" };
const vishala = { role: "owner" as const, userId: "emp-vishala" };
const devon = { role: "hr" as const, userId: "emp-devon" };
const marsha = { role: "admin" as const, userId: "emp-marsha" };

export const CHAPTERS: TourChapter[] = [
  {
    id: "shop",
    title: "The shop",
    summary: "The public site: specials, the weekly e-mail and members’ offers.",
    cast: "Any shopper",
    steps: [
      {
        path: "/",
        as: "signed-out",
        title: "The front door",
        body: [
          "The home page is the shop front: this week’s specials, worded as the store’s own posts word them, and all five stores with today’s hours.",
          "The tour moves on to the pages behind it. Come back and scroll it later.",
        ],
      },
      {
        path: "/specials",
        target: "newsletter-signup",
        title: "Specials, and the weekly e-mail",
        body: [
          "Every special shows one price and one unit, so nobody has to guess.",
          "Under them, shoppers can ask for the weekly e-mail. The box is never ticked for them, and nothing is sent until they confirm from their inbox.",
        ],
        try: "Sign up with any address. The confirmation e-mail lands in the demo outbox.",
      },
      {
        path: "/offers",
        target: "offers-list",
        title: "Members’ offers",
        body: [
          "Offers that need a code live here. Anyone can read them; taking a code needs a free sign-in with an e-mail address, and no password.",
          "Each offer says which stores take it and until when, in Trinidad time.",
        ],
      },
    ],
  },
  {
    id: "code",
    title: "A code, from phone to till",
    summary: "A shopper takes a code; the cashier checks it. Wrong store, used or ended codes are refused.",
    cast: "Marisa, a shopper · Keisha, on the San Fernando till",
    steps: [
      {
        path: "/offers/cake-offer",
        as: "signed-out",
        target: "offer-claim",
        title: "One code per shopper",
        body: [
          "Signed out, the offer explains itself and asks the shopper to sign in.",
          "There is no password to forget: a link arrives by e-mail and works once, for 15 minutes.",
        ],
      },
      {
        path: "/account",
        as: shopper,
        target: "account-wallet",
        title: "Marisa’s codes",
        body: [
          "The tour has signed you in as Marisa Singh, who took two codes this week. Each is big enough to read across a counter.",
          "The site keeps only a fingerprint of each code, so not even staff can read one back. Only Marisa’s account shows it.",
        ],
      },
      {
        path: "/portal/till",
        as: keisha,
        target: "till-input",
        title: "At the till",
        body: [
          "Now you are Keisha Ramlogan on the San Fernando till. Beyond her own shifts and pay, her access covers one thing: checking codes, at her store only.",
          "Marisa’s veg code is for the Couva store.",
        ],
        fill: { target: "till-input", value: "P4NF-7GAE", label: "Fill in P4NF-7GAE" },
        try: "Fill in the Couva code, then press Check and record.",
      },
      {
        path: "/portal/till",
        target: "till-result",
        title: "Refused, and why",
        body: [
          "A code for another store is turned away with the reason in plain words, and the try is logged.",
          "Five wrong tries in ten minutes pause this till’s code check for five minutes.",
        ],
        fill: { target: "till-input", value: "K7QM-4XDP", label: "Fill in K7QM-4XDP" },
        try: "Now fill in the cake code and record it. Try it a second time too.",
      },
      {
        path: "/admin#codes",
        as: vishala,
        target: "codes-table",
        title: "What the office sees",
        body: [
          "The owner’s office sees claims and redemptions by store, and each till check with who made it.",
          "Codes only ever appear as their last four characters.",
        ],
      },
    ],
  },
  {
    id: "approve",
    title: "An offer, drafted and approved",
    summary: "Marketing drafts an offer; someone else approves it. Nobody approves their own.",
    cast: "Tricia, marketing · Vishala, the owner’s office",
    steps: [
      {
        path: "/admin#today",
        as: tricia,
        target: "admin-today",
        title: "Tricia’s day starts with a list",
        body: [
          "The office opens on what needs doing, for this person only: offers sent back, a newsletter going out, offers about to end.",
          "Tricia sees no applicants and no payroll. Her menu shows only what her job uses.",
        ],
      },
      {
        path: "/admin#promos",
        target: "promo-composer",
        title: "Drafting an offer",
        body: [
          "An offer has a benefit, the stores that take it, dates, limits, and a preview of how shoppers will see it.",
          "Tricia can draft an offer and send it for approval. She cannot approve it.",
        ],
      },
      {
        path: "/admin#promos",
        as: vishala,
        target: "promo-approve",
        title: "A second pair of eyes",
        body: [
          "Tricia’s Christmas offer is waiting. Vishala approves it, or sends it back with a note Tricia will see.",
          "Whoever wrote an offer can never approve it, and both moves go in the audit log.",
        ],
        try: "Approve the Christmas shop offer, or send it back with a note.",
      },
    ],
  },
  {
    id: "newsletter",
    title: "The weekly e-mail",
    summary: "A newsletter built from the specials, sent only to people who confirmed.",
    cast: "Tricia, marketing · Vishala, the owner’s office",
    steps: [
      {
        path: "/admin#newsletter",
        as: tricia,
        target: "newsletter-composer",
        title: "Built from the specials",
        body: [
          "A newsletter starts from this week’s specials and, when there is one, a live offer.",
          "The preview is the e-mail as it will arrive, with an unsubscribe link in every one.",
        ],
      },
      {
        path: "/admin#newsletter",
        target: "newsletter-audience",
        title: "Who gets it",
        body: [
          "The count is confirmed subscribers only, for the stores and topics chosen.",
          "Addresses still waiting to confirm, unsubscribed or bouncing are never sent to.",
        ],
        try: "Send a test. It goes only to your own work address, and shows up in the demo outbox.",
      },
      {
        path: "/admin#list",
        target: "list-table",
        title: "The list, with addresses hidden",
        body: ["Marketing sees who is on the list by store and status, but not the full addresses, and cannot export them."],
      },
      {
        path: "/admin#list",
        as: vishala,
        target: "list-table",
        title: "Full addresses, logged",
        body: [
          "The owner’s office sees full addresses and can export the list.",
          "An export goes in the audit log, with who made it and how many rows it held.",
        ],
      },
    ],
  },
  {
    id: "staffnews",
    title: "Staff updates, the internal newsletter",
    summary: "News for staff by store and team, with a record of who has read it.",
    cast: "Vishala, the owner’s office · Marsha, store admin for Princes Town",
    steps: [
      {
        path: "/admin?update=su-till-codes#staffnews",
        as: vishala,
        target: "staff-receipts",
        title: "Who has read it",
        body: [
          "Staff updates go to work addresses and into each person’s portal, never to the shoppers’ list.",
          "This one asked the checkout team to confirm they had read it. Remind sends it again only to the people still waiting.",
        ],
      },
      {
        path: "/admin#staffnews",
        target: "staff-composer",
        title: "Writing one",
        body: [
          "A subject, a one-line summary and plain paragraphs. The preview is the e-mail as staff will get it.",
          "Pick stores and teams, and the count shows who it reaches before anything goes out. A test goes only to your own work address.",
        ],
        try: "Write a short update and send yourself a test.",
      },
      {
        path: "/admin#staffnews",
        as: marsha,
        target: "staff-audience",
        title: "Only her own store",
        body: [
          "Marsha covers store admin at Princes Town until 15 November. She can write only to Princes Town staff, and sees only the updates aimed there.",
          "Her bakery deep-clean draft is in her list.",
        ],
      },
    ],
  },
  {
    id: "hiring",
    title: "Hiring, with care",
    summary: "Plain stages for applicants, and decisions that arrive as a sealed update.",
    cast: "Aaliyah, Kwame and Shanice, applicants · Devon, HR",
    steps: [
      {
        path: "/careers/me",
        as: { role: "applicant", userId: "app-aaliyah" },
        target: "applicant-stages",
        title: "Where my application is",
        body: [
          "Applicants see plain stages, with what happens at each and how long it usually takes.",
          "Aaliyah’s documents are being checked. Anything that needs fixing says what to do.",
        ],
      },
      {
        path: "/careers/me",
        as: { role: "applicant", userId: "app-kwame" },
        target: "applicant-update-sealed",
        title: "An update, not a verdict",
        body: [
          "When HR decides, the applicant gets an e-mail saying only that there is an update.",
          "The page shows a sealed card that looks the same whatever is inside, so nobody reads bad news in a subject line.",
        ],
        try: "Open Kwame’s update.",
      },
      {
        path: "/careers/me",
        target: "applicant-update-open",
        title: "Said with care",
        body: [
          "Kwame was not selected. He is told plainly and kindly, thanked for his time, and given real next steps: other open roles near him, and when his documents are deleted.",
        ],
      },
      {
        path: "/careers/me",
        as: { role: "applicant", userId: "app-shanice" },
        target: "applicant-update-sealed",
        title: "The same card, a different letter",
        body: ["Shanice’s card looks just like Kwame’s until she opens it. Hers is an offer, with the pay, the start date and what to bring."],
        try: "Open Shanice’s update.",
      },
      {
        path: "/hr#pipeline",
        as: devon,
        target: "hr-pipeline",
        title: "HR’s side",
        body: [
          "Devon sees every application by stage. Opening one shows the documents to check and, at the end, a Decision step.",
          "The Decision step previews exactly what the applicant will read, and keeps HR’s own reason separate from the message.",
        ],
        try: "Open an application and go to its Decision step.",
      },
    ],
  },
  {
    id: "staff",
    title: "An employee’s week",
    summary: "Shifts, staff updates and pay, for the person they belong to.",
    cast: "Keisha, Checkout Supervisor",
    steps: [
      {
        path: "/portal/home",
        as: keisha,
        target: "portal-home",
        title: "Keisha’s portal",
        body: ["Today’s shift, notices for her store, and anything she needs to do, such as a document about to expire or a staff update to read."],
      },
      {
        path: "/portal/updates",
        target: "portal-updates",
        title: "Her staff updates",
        body: [
          "Keisha has one new update, and one she has opened but not yet confirmed. Each also went to her work address.",
          "Opening an update marks it read. Pressing I have read this is the record that she was told.",
        ],
        try: "Open “New at the till” and press I have read this.",
      },
      {
        path: "/portal/schedule",
        target: "portal-schedule",
        title: "The rota",
        body: ["Her week of shifts, with a swap request when something comes up."],
      },
      {
        path: "/portal/pay",
        target: "portal-pay",
        title: "Payslips",
        body: ["Each payslip in TT$, with NIS, PAYE and health surcharge lines, ready to print. Only Keisha sees hers."],
      },
    ],
  },
  {
    id: "access",
    title: "Who can see what",
    summary: "Access by person, store and end date; revoking it; the audit log.",
    cast: "Vishala, the owner’s office",
    steps: [
      {
        path: "/admin#access",
        as: vishala,
        target: "access-table",
        title: "Access, person by person",
        body: [
          "Each grant says what someone can do, at which stores, and until when.",
          "Marsha covers store admin at Princes Town until 15 November. Ria’s old HR access was revoked and stays on record.",
        ],
        try: "Revoke someone’s access, then look for their card on the staff sign-in.",
      },
      {
        path: "/admin#audit",
        target: "audit-log",
        title: "Everything is written down",
        body: [
          "Approvals, exports, till checks, sign-ins and access changes all land here, with who and when.",
          "Codes and full addresses never do.",
        ],
      },
      {
        path: "/portal",
        as: "signed-out",
        target: "role-marketing",
        title: "One honest note",
        body: [
          "Each sign-in card says what that person can and cannot see, and a card whose access was revoked cannot be used.",
          "This demo runs in your browser. In production the same rules run on the server for every request, so they hold however the site is reached.",
        ],
      },
    ],
  },
];
