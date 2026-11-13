import type { TourChapter } from "./tour";

/* The tour's chapters for the department dashboards: the owner's overview, supplier specials, requests, bulk
   orders, marketing figures, the website's seasons, the team, and signing in. They come first in the tour because
   they are what a manager deciding on the system wants to see. Same rules as lib/tour-chapters.ts: each step opens
   a page as a given person and rings one element by its data-tour attribute. */

const melissa = { role: "owner" as const, userId: "emp-vishala" };
const ria = { role: "admin" as const, userId: "emp-ria" };
const nigel = { role: "purchasing" as const, userId: "emp-nigel" };
const tricia = { role: "marketing" as const, userId: "emp-tricia" };
const devon = { role: "hr" as const, userId: "emp-devon" };
const ravi = { role: "employee" as const, userId: "emp-ravi" };

export const OPS_CHAPTERS: TourChapter[] = [
  {
    id: "owner",
    title: "The owner’s morning",
    summary: "Every department on one page, with the decisions only the owner can make at the top.",
    cast: "Melissa, the director",
    steps: [
      {
        path: "/admin#overview",
        as: melissa,
        target: "overview-decisions",
        title: "Decisions first",
        body: [
          "Melissa signs in and lands here. Whatever is waiting on her alone sits at the top: a sponsorship request, an offer to approve, a bulk order ready to place.",
          "Each line opens the thing itself. Nothing has to be found in a chat.",
        ],
        try: "Press “Decide” on the cricket league’s request.",
      },
      {
        path: "/admin#overview",
        target: "overview-depts",
        title: "Every department, live",
        body: [
          "Four tiles, one for each department, each with its two or three figures as they stand right now.",
          "The rings and the line move because the numbers behind them do: check a supplier sheet, and the ring fills.",
        ],
      },
      {
        path: "/admin#overview",
        target: "overview-stores",
        title: "The five stores, side by side",
        body: ["Staff, open roles, requests and bulk orders for each store in one table. A store that has not answered a bulk order shows here by name."],
      },
      {
        path: "/admin#overview",
        target: "overview-activity",
        title: "Who did what",
        body: [
          "The latest changes across the whole system, in plain sentences, with the person and the time.",
          "The full log is one click away, and it keeps refused attempts too.",
        ],
      },
    ],
  },
  {
    id: "specials",
    title: "Supplier specials, without the retyping",
    summary: "The office’s Excel workbook as a system: companies’ specials read in, case prices added, key lines starred.",
    cast: "Ria, administration · Nigel, purchasing",
    steps: [
      {
        path: "/admin#suppliers",
        as: ria,
        target: "flow-suppliers",
        title: "The workbook, as a system",
        body: [
          "Today the specials live in one Excel file per round, with a tab for each company. This is that file, kept in one place that everyone with access can open from any store.",
          "The diagram shows the six steps and runs by itself. Every section has one.",
        ],
      },
      {
        path: "/admin#suppliers",
        target: "sheet-table",
        title: "The same six columns",
        body: [
          "Item, count, case price, VAT, special, notes: the columns the office already uses, filled from the real Divali workbook.",
          "Two things are new. The unit cost and the margin at the special work themselves out, and a star puts a line on the key specials sheet with no copying.",
        ],
        try: "Open Christmas 2026 at the top, choose Carib, and type a case price into an empty cell.",
      },
      {
        path: "/admin#suppliers",
        target: "import-open",
        title: "Bring in what they send",
        body: [
          "A company’s specials arrive by WhatsApp or e-mail. Paste the message, or upload the file, and the table is filled for a person to check.",
          "A whole workbook goes in at once: every company tab becomes a sheet.",
        ],
        try: "Press it, then “Paste a sample message” and “Read the text”. Or upload the real Divali Specials workbook.",
      },
      {
        path: "/admin#suppliers",
        as: nigel,
        target: "section-suppliers",
        title: "Purchasing sees this, and only this",
        body: [
          "Nigel in purchasing has access to the supplier specials so he can check and correct them.",
          "Look at his menu: requests, marketing and staff files are not there. Access follows the job.",
        ],
      },
      {
        path: "/admin#sellout",
        as: ria,
        target: "sellout-table",
        title: "Sell-out reports, owed to sent",
        body: [
          "Some companies ask how many units sold after a special. These used to be tracked in a notebook.",
          "Now each one shows as owed, compiled or sent, and a photo of the notebook page can be attached as the record.",
        ],
        try: "Record the report owed to AS Bryden.",
      },
    ],
  },
  {
    id: "requests",
    title: "A request, from a school to a yes",
    summary: "Donations, sponsorships, partnerships and promotions in one pipeline, with the conversation on the card.",
    cast: "A school principal · Ria, administration · Melissa, the director",
    steps: [
      {
        path: "/community",
        as: "signed-out",
        target: "community-form",
        title: "They ask on the website",
        body: [
          "A school, charity, club or company fills in one short form. It asks what they need, what for, and by when.",
          "They get a reference straight away, and the request is in the office’s list before the page has closed.",
        ],
        try: "Send a request. Then carry on: it will be waiting in the pipeline.",
      },
      {
        path: "/admin#requests",
        as: ria,
        target: "request-pipeline",
        title: "One pipeline for all of them",
        body: [
          "Letters, WhatsApp messages and visits are logged into the same list, so nothing sits in one person’s phone.",
          "Each card moves left to right: new, being looked at, with the director, approved, closed.",
        ],
        try: "Open a card and add a note for staff. It stays on the card’s thread.",
      },
      {
        path: "/admin#requests/rq-0147",
        as: melissa,
        target: "request-actions",
        title: "The director says yes or no on the card",
        body: [
          "Melissa sees what was asked, the office’s notes and the letter, and decides here.",
          "Only her office has the Approve and Decline buttons. The decision is recorded with her name and the time.",
        ],
        try: "Approve it, with what the store will give.",
      },
    ],
  },
  {
    id: "bulk",
    title: "One bulk order, five stores",
    summary: "Each store gives its number, the office places one order, and last time’s figures sit alongside.",
    cast: "Melissa, the director · Ravi, store manager at San Fernando",
    steps: [
      {
        path: "/admin#bulk",
        as: melissa,
        target: "bulk-orders",
        title: "The Christmas orders",
        body: [
          "Turkeys, butter cookies and oil, each with a row for every store. The total and the cost add up as the stores answer.",
          "Last Christmas sits in the next column, with the note that Princes Town ran out by 20 December.",
        ],
        try: "Type numbers for Penal and Point Fortin on the turkey order, then place it.",
      },
      {
        path: "/portal/bulk",
        as: ravi,
        target: "bulk-orders",
        title: "A store manager’s view",
        body: ["Ravi manages San Fernando. He can change his own store’s number and nobody else’s, from his phone, without a WhatsApp group."],
      },
    ],
  },
  {
    id: "figures",
    title: "What worked, and where",
    summary: "The website and the social accounts on one page, down to which video did best.",
    cast: "Tricia, marketing",
    steps: [
      {
        path: "/admin#analytics",
        as: tricia,
        target: "analytics-stats",
        title: "Are we growing?",
        body: ["Four figures, each compared with the four weeks before. The numbers count up as the page opens.", "They are demo figures until the accounts are connected; the page says so at the top."],
      },
      {
        path: "/admin#analytics",
        target: "analytics-chart",
        title: "Where it happened",
        body: ["People reached each week, a line for each account. Point at a week to read every value, or switch to a table."],
      },
      {
        path: "/admin#analytics",
        target: "analytics-posts",
        title: "Which posts did it",
        body: ["Every post ranked. “Most watched” finds the videos that worked; “Most taps to the website” finds the ones that brought people in."],
        try: "Sort by “Best engagement rate” and filter to Video.",
      },
      {
        path: "/admin#social",
        target: "social-accounts",
        title: "Connecting an account",
        body: ["Each account is connected once, read-only, on the platform’s own sign-in page. The system can count; it can never post."],
        try: "Connect Facebook, then go back to the figures: its line joins the chart.",
      },
      {
        path: "/admin#plan",
        target: "plan-agenda",
        title: "What goes out next",
        body: ["Posts, e-mails and website changes on one calendar, so the Christmas look and the posts about it land on the same day."],
      },
    ],
  },
  {
    id: "season",
    title: "Christmas, in one click",
    summary: "A seasonal look goes over the whole public site and comes off again without touching the content.",
    cast: "Tricia, marketing · any shopper",
    steps: [
      {
        path: "/admin#studio",
        as: tricia,
        target: "studio-looks",
        title: "Choose a look",
        body: [
          "The everyday site, Christmas or Divali. Christmas is a Trinidad Christmas: sorrel red, deep green, poinsettias and a string of lights.",
          "A look is a layer. It changes colours and adds ornament over the same pages, so nothing has to be rebuilt.",
        ],
        try: "Choose Christmas.",
      },
      {
        path: "/admin#studio",
        target: "studio-preview",
        title: "See it before anyone else does",
        body: ["The real home page, wearing the look, on a computer or a phone. Nothing has changed for shoppers yet."],
      },
      {
        path: "/admin#studio",
        target: "studio-on",
        title: "Put it on, or set the dates",
        body: ["On now, or between two dates so it starts and ends by itself. Either way the change is logged."],
        try: "Press “Put it on now”.",
      },
      {
        path: "/specials",
        as: "signed-out",
        title: "The store, dressed",
        body: [
          "Every public page now wears the season: the greeting, the lights under the header, the sprig on each price seal.",
          "Take it off in the studio and the site is exactly as it was.",
        ],
      },
    ],
  },
  {
    id: "team",
    title: "The team at five stores",
    summary: "Everyone in one list, what needs attention on each file, and every application since it arrived.",
    cast: "Devon, HR",
    steps: [
      {
        path: "/hr#people",
        as: devon,
        target: "people-table",
        title: "Everyone, by store and team",
        body: ["The whole team across the five stores, with who is on probation or on leave.", "A food badge about to expire is flagged before it lapses."],
        try: "Filter to Couva, then open a person.",
      },
      {
        path: "/hr#log",
        target: "hiring-log",
        title: "The hiring log",
        body: ["Every application in one table: when it came in, where it stands and the last thing that happened, with the funnel beside it."],
      },
      {
        path: "/hr#pipeline",
        target: "flow-hiring",
        title: "From the advert to day one",
        body: ["The numbers on the diagram are live: how many applications sit at each stage right now."],
      },
    ],
  },
  {
    id: "signin",
    title: "Signing in",
    summary: "A password, a code on the phone, and access that matches the job.",
    cast: "Anyone on staff",
    steps: [
      {
        path: "/portal",
        as: "signed-out",
        target: "signin-card",
        title: "Three steps, as a real one has",
        body: [
          "Work e-mail and password, then a six-digit code sent to the person’s phone, then their own dashboard.",
          "This is a placeholder: nothing is checked or sent, and the page says so. It shows where the real sign-in service goes.",
        ],
        try: "Choose a person on the right, press Sign in, then “Fill it in” for the code.",
      },
    ],
  },
];
