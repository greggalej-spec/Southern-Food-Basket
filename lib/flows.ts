import type { IconName } from "@/components/icon";

/* Every process in the system, as a flow: its stages in order, who does each, and what happens there. One script
   feeds three places: the animated guide at the top of each console section (components/viz.tsx <Flow>), the
   "How it all flows" page (/how-it-works), and the guided tour's wording. Keep a stage's label to two or three
   words: it sits under a small node. */

export type FlowStage = {
  icon: IconName;
  label: string;
  /** Who does this step: a role, or "The system". */
  who: string;
  text: string;
};

export type FlowDef = {
  id: string;
  /** The department it belongs to, for /how-it-works. */
  dept: "Administration" | "Marketing" | "Website" | "HR" | "Owner’s office" | "Everyone";
  title: string;
  /** One line for the department map. */
  summary: string;
  stages: FlowStage[];
  /** Something to try in the demo. */
  tryIt?: string;
  /** Where the flow lives. */
  href: string;
};

export const FLOWS: FlowDef[] = [
  {
    id: "suppliers",
    dept: "Administration",
    title: "Supplier specials, from a message to the shelf list",
    summary: "What each company sends becomes one checked table, with nothing typed twice.",
    href: "/admin#suppliers",
    stages: [
      { icon: "book", label: "Open a book", who: "Administration", text: "One book for each round: Divali, Christmas, or a plain month. Old books are kept, so nothing is ever overwritten to save space." },
      { icon: "upload", label: "Bring it in", who: "Administration", text: "Upload the whole Excel workbook, one company’s file, or paste the text of a WhatsApp message or e-mail." },
      { icon: "search", label: "System reads it", who: "The system", text: "Items, counts, specials and dates are filled into the six columns the office already uses. Each company gets its own sheet." },
      { icon: "wallet", label: "Add case price", who: "Administration or Purchasing", text: "The one cell companies leave off. Type it in and the unit cost and the margin at the special appear by themselves." },
      { icon: "star", label: "Star key lines", who: "Administration", text: "Starred lines gather on the key specials sheet. Nobody copies them across by hand." },
      { icon: "check", label: "Mark checked", who: "Administration", text: "A person confirms every sheet. Marketing then draws on the checked list for posts and the website." },
    ],
    tryIt: "open Christmas 2026, choose Carib, and type a case price into an empty cell. Then press “Bring in specials” and upload your own Divali Specials workbook.",
  },
  {
    id: "sellout",
    dept: "Administration",
    title: "Sell-out reports, owed to sent",
    summary: "Which companies want units sold after a special, and where each report stands.",
    href: "/admin#sellout",
    stages: [
      { icon: "tag", label: "Special runs", who: "The stores", text: "A company that asks for sell-out reports has specials in the book." },
      { icon: "clock", label: "Report owed", who: "The system", text: "When the round has their lines in it, a report shows as owed. Nothing is forgotten in a notebook." },
      { icon: "tasks", label: "Record units", who: "Administration", text: "The lines come from their sheet. Type the units sold; the value at the special adds itself up." },
      { icon: "camera", label: "Attach the page", who: "Administration", text: "A photo of the notebook page or till print-out rides along as the record." },
      { icon: "arrow", label: "Send it", who: "Administration", text: "Mark it sent once the company has it. The list shows what is still owed at a glance." },
    ],
    tryIt: "open the report owed to AS Bryden for Divali 2026, enter a few units, and save.",
  },
  {
    id: "requests",
    dept: "Administration",
    title: "A request, from the letter to the handover",
    summary: "Schools, charities, clubs and companies ask; one pipeline carries each request to a decision.",
    href: "/admin#requests",
    stages: [
      { icon: "gift", label: "They ask", who: "A school, charity, club or company", text: "Through the form on the public site, or by letter, WhatsApp or a visit that the office logs. Every request gets a reference." },
      { icon: "search", label: "Office picks it up", who: "Administration", text: "The office gets what is missing and checks with the store it concerns." },
      { icon: "user", label: "Director decides", who: "Owner’s office", text: "Approve or decline on the card, with what is being given and a note. No chat thread to scroll back through." },
      { icon: "file", label: "Reply goes out", who: "Administration", text: "The reply is written on the card and e-mailed. Notes between staff stay on the same thread, marked as internal." },
      { icon: "check", label: "Handed over", who: "The store", text: "Marked done when the goods leave or the event is held. The year’s total gives adds up by itself." },
    ],
    tryIt: "open the cricket league’s card under “With the director”. Signed in as the administration you can add a note; signed in as Mellisa you can approve it.",
  },
  {
    id: "events",
    dept: "Marketing",
    title: "From the designer’s desk to the customer’s phone",
    summary: "Flyers, events and promotions go on the public site the moment they are saved.",
    href: "/admin#events",
    stages: [
      { icon: "camera", label: "Flyers in", who: "Graphic designer", text: "Drop the week’s finished flyers in, several at once. They are made light enough for phones and lead the Specials page." },
      { icon: "tag", label: "Specials in", who: "Marketing or Administration", text: "Paste the week’s price list and every special is added in one go, each in its department." },
      { icon: "calendar", label: "On now", who: "The system", text: "An event shows on the Events page from its first day to its last. Nobody has to remember to take it down." },
      { icon: "clock", label: "Coming up", who: "Marketing", text: "Plan ahead: a date, one sentence, up to three points, and the stores it is at." },
    ],
    tryIt: "drop two pictures into the flyer box, then open the Specials page. Add an event for next week and find it under “Coming up” on the Events page.",
  },
  {
    id: "feedback",
    dept: "Administration",
    title: "Customer feedback, from the button to the answer",
    summary: "A shopper taps Feedback on the website; customer service answers and closes it in one place.",
    href: "/admin#feedback",
    stages: [
      { icon: "phone", label: "Customer writes", who: "A shopper", text: "The Feedback button sits at the bottom right of every public page: a compliment, a suggestion, a question or a complaint, with the store it is about." },
      { icon: "bell", label: "Ticket arrives", who: "The system", text: "It gets a reference, the customer gets an acknowledgement, and it appears in the office’s list. Complaints sit at the top." },
      { icon: "user", label: "Someone picks it up", who: "Customer service", text: "One named person looks after it, with notes for staff kept on the same card." },
      { icon: "file", label: "Reply goes out", who: "Customer service", text: "The reply is written on the card and e-mailed, or the call is recorded. What the customer says back is kept too." },
      { icon: "check", label: "Resolved", who: "Customer service", text: "Closed with a line on how it ended, so the same problem can be counted, not remembered." },
    ],
    tryIt: "open any public page, press Feedback at the bottom right and send a message. Then sign in as the administration and open Customer feedback: your message is at the top.",
  },
  {
    id: "bulk",
    dept: "Administration",
    title: "One bulk order for five stores",
    summary: "Turkeys, butter cookies, oil: each store gives a number, one order is placed, the record stays.",
    href: "/admin#bulk",
    stages: [
      { icon: "boxes", label: "Open the order", who: "Owner’s office or Administration", text: "The item, the company, the unit and its cost, and the day the stores must answer by." },
      { icon: "store", label: "Stores answer", who: "Each store manager", text: "Each manager types their store’s number. Last time’s figure sits beside it, so nobody orders blind." },
      { icon: "truck", label: "Order placed", who: "Owner’s office", text: "The total and the cost add up as the numbers come in. Place it once the stores have answered." },
      { icon: "check", label: "Received", who: "Administration", text: "Marked received when the stock reaches the warehouse." },
      { icon: "swap", label: "Shared out", who: "Administration", text: "Marked shared when it leaves for the stores. This order becomes “last time” for next year." },
    ],
    tryIt: "the turkey order is still waiting for Penal and Point Fortin. Type a number in for each, then place the order.",
  },
  {
    id: "tasks",
    dept: "Administration",
    title: "Handing work over",
    summary: "Who, what and by when, plus the letters and checklists the office reuses.",
    href: "/admin#tasks",
    stages: [
      { icon: "tasks", label: "Hand it out", who: "Owner’s office or Administration", text: "Give a task to a person with a date." },
      { icon: "bell", label: "It reaches them", who: "The system", text: "It shows on their Today page until it is done, and turns red when it is late." },
      { icon: "check", label: "Ticked off", who: "Whoever it was given to", text: "They tick it off. Whoever handed it out sees it done." },
      { icon: "book", label: "Reuse the text", who: "Everyone in the office", text: "Reply letters and checklists are kept as resources: open, copy, or change for everyone." },
    ],
  },
  {
    id: "analytics",
    dept: "Marketing",
    title: "From a post to the till",
    summary: "The accounts feed one page of figures, so the team can see what worked.",
    href: "/admin#analytics",
    stages: [
      { icon: "camera", label: "Post goes out", who: "Marketing", text: "A video, photo or carousel on Instagram, TikTok or Facebook, planned on the content calendar." },
      { icon: "link", label: "Figures fetched", who: "The system", text: "Each night the connected accounts hand over views, reach, likes, comments and shares. The history builds up here." },
      { icon: "chart", label: "One page", who: "Marketing", text: "Four figures answer “are we growing”; the chart shows where; the table ranks the posts that did it." },
      { icon: "tag", label: "Codes at the till", who: "The stores", text: "Offer codes taken online and used at a till are counted by the system, so one figure reaches the shop floor." },
      { icon: "star", label: "Do more of it", who: "Marketing", text: "“What the figures say” puts the main points in plain words for the next plan." },
    ],
    tryIt: "sort the posts by “Best engagement rate”, then filter to Video.",
  },
  {
    id: "social",
    dept: "Marketing",
    title: "Connecting an account",
    summary: "A one-time, read-only sign-in on the platform’s own page.",
    href: "/admin#social",
    stages: [
      { icon: "user", label: "Owner signs in", who: "Whoever owns the account", text: "On that platform’s own page. The password never passes through this system." },
      { icon: "lock", label: "Read-only", who: "The platform", text: "They approve access to the figures only. The system cannot post, message or change anything." },
      { icon: "clock", label: "Nightly fetch", who: "The system", text: "New figures arrive each night and are kept, even though the platforms only show recent weeks." },
      { icon: "chart", label: "On the page", who: "Marketing", text: "The account’s line joins the chart. Disconnect at any time from here or from the platform." },
    ],
    tryIt: "connect Facebook, then open Marketing figures: its line joins the chart.",
  },
  {
    id: "plan",
    dept: "Marketing",
    title: "The content calendar",
    summary: "Posts, e-mails and website changes on the day they go out.",
    href: "/admin#plan",
    stages: [
      { icon: "star", label: "Idea", who: "Marketing", text: "Put each post, e-mail and website change on the day it should go out." },
      { icon: "calendar", label: "Planned", who: "Marketing", text: "Marked planned once it is ready, with where it is going." },
      { icon: "camera", label: "Posted", who: "Marketing", text: "Marked posted when it is out. It then shows up in the figures." },
      { icon: "brush", label: "Site in step", who: "Marketing", text: "Website changes sit here too, so a seasonal look goes live the same day as the posts about it." },
    ],
  },
  {
    id: "studio",
    dept: "Website",
    title: "Dressing the website for a season",
    summary: "A seasonal look is a layer: it goes on and comes off without touching the content.",
    href: "/admin#studio",
    stages: [
      { icon: "brush", label: "Choose a look", who: "Marketing", text: "Christmas, Divali, or the everyday site. Each look changes colours and adds ornament over the same pages." },
      { icon: "search", label: "Preview", who: "Marketing", text: "See it on the real home page before anyone else does, on a phone-sized or full-sized screen." },
      { icon: "calendar", label: "Set the dates", who: "Marketing", text: "Put it on now, or give it a first and last day so it starts and ends by itself." },
      { icon: "check", label: "Live", who: "The system", text: "Every public page wears the look. Switching it off puts the site back exactly as it was." },
    ],
    tryIt: "choose Christmas, press “Put it on now”, and open the home page.",
  },
  {
    id: "hiring",
    dept: "HR",
    title: "Hiring, from the advert to day one",
    summary: "One application form, a document checklist, and a decision delivered with care.",
    href: "/hr#pipeline",
    stages: [
      { icon: "briefcase", label: "Job opens", who: "HR", text: "HR opens a role for a store. It appears on the careers page straight away." },
      { icon: "file", label: "They apply", who: "The applicant", text: "One form on a phone, with the documents the role needs. It saves as they go." },
      { icon: "shield", label: "Documents checked", who: "HR", text: "Each document is verified, or flagged with a reason the applicant sees and can fix." },
      { icon: "users", label: "Interview", who: "HR and the store manager", text: "Booked from the application, with the place and the person to ask for." },
      { icon: "check", label: "Decision", who: "HR", text: "The applicant gets “an update”, and opens a letter written with care, whichever way it went." },
      { icon: "user", label: "Joins the team", who: "HR", text: "A hire moves to People with their documents, and gets a first-week checklist." },
    ],
  },
  {
    id: "people",
    dept: "HR",
    title: "Looking after the team",
    summary: "Everyone at all five stores, their documents and training, and what is about to expire.",
    href: "/hr#people",
    stages: [
      { icon: "users", label: "One list", who: "HR", text: "Every person at every store, by store and by team, with who is on probation or on leave." },
      { icon: "shield", label: "Documents", who: "The system", text: "Food badges and IDs carry expiry dates. The ones running out are flagged before they lapse." },
      { icon: "calendar", label: "Leave", who: "Employees and HR", text: "People ask for leave in their portal; HR approves and the balance updates." },
      { icon: "book", label: "Resources", who: "HR", text: "Checklists, the interview guide and review forms are kept to hand as HR resources." },
    ],
  },
  {
    id: "overview",
    dept: "Owner’s office",
    title: "What reaches the owner",
    summary: "Every department on one page, with the decisions only the owner can make at the top.",
    href: "/admin#overview",
    stages: [
      { icon: "grid", label: "Departments work", who: "Administration, Marketing, HR", text: "Each department works in its own area and sees only what its job needs." },
      { icon: "bell", label: "Decisions surface", who: "The system", text: "A request to approve, an offer to sign off, an order ready to place: they rise to the top of the owner’s page." },
      { icon: "check", label: "Owner decides", who: "Owner’s office", text: "One click from the overview to the card, and the decision is recorded with who made it and when." },
      { icon: "clock", label: "Everything logged", who: "The system", text: "Every change by every person is in the activity log, with refused attempts beside it." },
    ],
  },
  {
    id: "signin",
    dept: "Everyone",
    title: "Signing in",
    summary: "A password, then a code on the phone, and access that matches the job.",
    href: "/portal",
    stages: [
      { icon: "user", label: "Work e-mail", who: "Each member of staff", text: "Everyone has their own sign-in. Nobody shares one." },
      { icon: "lock", label: "Password", who: "Each member of staff", text: "Checked by the sign-in service, never stored by the website itself." },
      { icon: "phone", label: "Code on the phone", who: "The system", text: "A six-digit code confirms it is really them, each time on a new device." },
      { icon: "shield", label: "Their own access", who: "Owner’s office", text: "They land on their own dashboard. Access is given by job, limited to stores, and can be ended at once." },
    ],
  },
];

export const flow = (id: string) => FLOWS.find((f) => f.id === id);
export const DEPTS = ["Administration", "Marketing", "Website", "HR", "Owner’s office", "Everyone"] as const;
