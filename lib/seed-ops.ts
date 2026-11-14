import { SELLOUTS, SPECIALS_BOOKS, SUPPLIERS, SUPPLIER_SHEETS } from "./seed-specials";
import type { AuditEvent, BulkOrder, CommunityRequest, Employee, FeedbackTicket, Grant, MetricWeek, PlanItem, Platform, ResourceDoc, Seed, SitePage, SocialAccount, SocialPost, Task } from "./types";

/* The "ops" part of the staff tier: what the administration, marketing and owner dashboards read. Everything here is
   DEMO (invented organisations, people, orders and figures) except the supplier specials, which come from the office
   workbook (lib/seed-specials.ts). Only signed-in pages import it, through lib/private.ts.
   Bump SEED.version in lib/seed.ts when this changes. */

/* ---------- staff at all five stores (HR's People list). The seven people with full records are in seed-staff. ---------- */

function person(id: string, name: string, role: string, dept: string, branchId: string, startDate: string, no: number, extra: Partial<Employee> = {}): Employee {
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".");
  return {
    id, name, role, dept, branchId, startDate, employeeNo: "SFB-" + String(no).padStart(4, "0"),
    email: slug + "@sfb.example", phone: "(868) 000-0" + (300 + no % 600), address: "Demo address",
    emergency: { name: "On file", relation: "Next of kin", phone: "(868) 000-0000" },
    bank: { bank: "Demo Bank", masked: "•••• " + String(1000 + ((no * 37) % 9000)) },
    leave: { annualEntitled: 14, annualUsed: no % 9, sickEntitled: 14, sickUsed: no % 3, casualEntitled: 3, casualUsed: no % 2 },
    leaveRequests: [], swapRequests: [], shifts: [], payslips: [],
    training: [{ id: "tr-cust", name: "Customer care refresher 2026", done: no % 3 !== 0, completedAt: no % 3 !== 0 ? "2026-09-02" : null, due: "2026-11-30", minutes: 25 }],
    compliance: [{ docId: "photo-id", state: "verified", expiry: "2029-0" + (1 + (no % 9)) + "-15" }, { docId: "nis", state: "verified" }, { docId: "bir", state: "verified" }],
    ...extra,
  };
}

const food = (expiry: string) => [{ docId: "photo-id", state: "verified" as const, expiry: "2029-05-15" }, { docId: "nis", state: "verified" as const }, { docId: "bir", state: "verified" as const }, { docId: "food-badge", state: "verified" as const, expiry }];

export const MORE_PEOPLE: Employee[] = [
  person("emp-nigel", "Nigel Sookram", "Purchasing Officer", "Head office", "ptown", "2018-08-13", 141),
  // The graphic designer, part of the marketing team: he makes the flyers and posts that go on the public site.
  person("emp-addae", "Addae", "Graphic Designer", "Head office", "sando", "2025-02-03", 388),
  person("emp-vanessa", "Vanessa Ali", "Accounts Clerk", "Head office", "ptown", "2020-02-03", 198),
  person("emp-sunil", "Sunil Ragoonanan", "Store Manager", "Management", "ptown", "2009-04-20", 22),
  person("emp-cheryl", "Cheryl Thomas", "Customer Service Clerk", "Checkout", "ptown", "2023-07-10", 356),
  person("emp-kareem", "Kareem Hamid", "Wholesale Clerk", "Warehouse", "ptown", "2022-10-03", 301),
  person("emp-ravi", "Ravi Deonarine", "Store Manager", "Management", "sando", "2011-06-01", 31),
  person("emp-shelly", "Shelly-Ann Pierre", "Cashier", "Checkout", "sando", "2024-03-18", 402),
  person("emp-joel", "Joel Ramkissoon", "Butcher", "Perishables", "sando", "2019-09-09", 166, { compliance: food("2026-12-05") }),
  person("emp-candice", "Candice Hosein", "Bakery Assistant", "Bakery", "sando", "2026-09-01", 495, { status: "probation", compliance: food("2027-08-20") }),
  person("emp-anand", "Anand Maharaj", "Store Manager", "Management", "couva", "2015-01-12", 87),
  person("emp-latoya", "Latoya George", "Cashier", "Checkout", "couva", "2026-08-24", 489, { status: "probation" }),
  person("emp-kiran", "Kiran Seepersad", "Produce Clerk", "Perishables", "couva", "2026-08-24", 490, { status: "probation", compliance: food("2027-07-30") }),
  person("emp-daniel", "Daniel Williams", "Restaurant Cook", "Bakery", "couva", "2026-08-31", 492, { compliance: food("2026-11-28") }),
  person("emp-alicia", "Alicia Mungal", "Pharmacy Assistant", "Pharmacy", "couva", "2026-09-07", 496),
  person("emp-rajesh", "Rajesh Boodoo", "Store Manager", "Management", "penal", "2013-03-04", 58),
  person("emp-tamika", "Tamika Noel", "Cashier", "Checkout", "penal", "2022-05-16", 288),
  person("emp-sasha", "Sasha Rampaul", "Produce Lead", "Perishables", "penal", "2017-11-06", 119, { compliance: food("2027-03-12") }),
  person("emp-curtis", "Curtis James", "Stock Clerk", "Warehouse", "penal", "2025-01-20", 441, { status: "on-leave" }),
  person("emp-michelle", "Michelle Forde", "Store Manager", "Management", "pfortin", "2016-07-18", 104),
  person("emp-darren", "Darren Lalla", "Cashier", "Checkout", "pfortin", "2023-02-06", 331),
  person("emp-nisha", "Nisha Jaggernauth", "Bakery Assistant", "Bakery", "pfortin", "2021-10-11", 252, { compliance: food("2026-10-31") }),
  person("emp-kwesi", "Kwesi Thomas", "Stock Clerk", "Warehouse", "pfortin", "2024-11-04", 428),
];

const since = (userId: string, branchId: string, at: string): Grant => ({ id: "g-" + userId.slice(4), userId, role: "employee", branchIds: [branchId], grantedBy: "emp-devon", grantedAt: at + "T08:00:00-04:00" });

export const MORE_GRANTS: Grant[] = [
  { id: "g-nigel-purchasing", userId: "emp-nigel", role: "purchasing", branchIds: null, grantedBy: "emp-vishala", grantedAt: "2026-11-02T08:00:00-04:00" },
  { id: "g-addae-marketing", userId: "emp-addae", role: "marketing", branchIds: null, grantedBy: "emp-vishala", grantedAt: "2025-02-03T08:00:00-04:00" },
  // Store managers give their own store's numbers for a bulk order, and nothing else in the office.
  ...(["emp-sunil:ptown", "emp-ravi:sando", "emp-anand:couva", "emp-rajesh:penal", "emp-michelle:pfortin"] as const).map((x): Grant => {
    const [userId, branchId] = x.split(":");
    return { id: "g-" + userId.slice(4), userId, role: "employee", branchIds: [branchId], extra: ["bulk.store"], grantedBy: "emp-vishala", grantedAt: "2024-01-08T08:00:00-04:00" };
  }),
  ...MORE_PEOPLE.filter((p) => p.role !== "Store Manager" && p.id !== "emp-nigel" && p.id !== "emp-addae").map((p) => since(p.id, p.branchId, p.startDate)),
  since("emp-nigel", "ptown", "2018-08-13"),
  since("emp-addae", "sando", "2025-02-03"),
];

/* ---------- partnership, promotion and donation requests ---------- */

const REQUESTS: CommunityRequest[] = [
  { id: "rq-0148", ref: "RQ-0148", kind: "donation", org: "Barrackpore Presbyterian Primary School", orgType: "Primary school", contact: "Mrs. Indra Sammy, Principal", phone: "(868) 000-0611", email: "office@barrackporepres.example",
    via: "Website", branchId: "penal", receivedAt: "2026-11-11", ask: "40 snack packs and 6 cases of juice for the Christmas treat", purpose: "End-of-term Christmas treat for 212 pupils on 4 December.", neededBy: "2026-12-02",
    status: "new", messages: [] },
  { id: "rq-0147", ref: "RQ-0147", kind: "sponsorship", org: "Princes Town Youth Cricket League", orgType: "Sports club", contact: "Marlon Baksh, Secretary", phone: "(868) 000-0612", email: "secretary@ptycl.example",
    via: "Letter", branchId: "ptown", receivedAt: "2026-11-09", ask: "Sponsorship of TT$5,000 toward the under-13 season, with the store’s name on the kit", purpose: "The 2027 season runs January to April with eight clubs from Princes Town and Moruga.", neededBy: "2026-12-15",
    status: "with-owner", owner: "emp-ria", letter: { fileName: "ptycl-sponsorship-letter.pdf", size: 412000, type: "application/pdf" },
    messages: [
      { at: "2026-11-09T10:15:00-04:00", by: "emp-ria", kind: "internal", text: "Letter dropped at the Princes Town customer service desk. Scanned and attached. They sponsored with another supermarket last year." },
      { at: "2026-11-09T10:40:00-04:00", by: "emp-ria", kind: "outbound", text: "Thank you for your letter. It is with our director for a decision and we will reply by 20 November." },
      { at: "2026-11-10T08:30:00-04:00", by: "emp-ria", kind: "internal", text: "Sent to Mellisa for a decision. Budget line: community sponsorships." },
    ] },
  { id: "rq-0146", ref: "RQ-0146", kind: "donation", org: "Hope Centre Children’s Home", orgType: "Charity", contact: "Sister Agnes Charles", phone: "(868) 000-0613", email: "hopecentre@example.org",
    via: "WhatsApp", branchId: "sando", receivedAt: "2026-11-06", ask: "Groceries for Christmas hampers for 30 families", purpose: "The home’s yearly hamper drive for families in Marabella and Vistabella.", neededBy: "2026-12-12",
    status: "approved", owner: "emp-ria", give: "30 hampers (rice, flour, oil, milk, sugar, juice), packed at Coffee Street", value: 5400, decidedBy: "emp-vishala", decidedAt: "2026-11-08T16:20:00-04:00", decisionNote: "Yes. Same as last year. Pack at Coffee Street and let Ravi know.",
    messages: [
      { at: "2026-11-06T13:05:00-04:00", by: "emp-ria", kind: "internal", text: "Came in on the office WhatsApp. Same request as 2025 (25 hampers then)." },
      { at: "2026-11-08T16:20:00-04:00", by: "emp-vishala", kind: "internal", text: "Approved: 30 hampers. Pack at Coffee Street and let Ravi know." },
      { at: "2026-11-09T09:00:00-04:00", by: "emp-ria", kind: "outbound", text: "Good news: Southern Food Basket will give 30 hampers. They will be ready for collection at our Coffee Street store from 10 December. Please bring this reference: RQ-0146." },
      { at: "2026-11-09T11:42:00-04:00", by: "requester", kind: "inbound", text: "Thank you so much. We will collect on Friday 11 December in the morning." },
    ] },
  { id: "rq-0145", ref: "RQ-0145", kind: "promotion", org: "Caribbean Bottlers", orgType: "Supplier", contact: "Trade marketing team", phone: "(868) 000-0614", email: "trade@cbottlers.example",
    via: "E-mail", branchId: null, receivedAt: "2026-11-05", ask: "Floor displays and a sampling table at all five stores for the two weekends before Christmas", purpose: "Seasonal drinks promotion. They supply the displays, the stock for sampling and two promoters per store.", neededBy: "2026-11-25",
    status: "reviewing", owner: "emp-tricia",
    messages: [
      { at: "2026-11-05T14:10:00-04:00", by: "emp-ria", kind: "internal", text: "Passed to marketing: needs floor space agreed with each store manager before it goes to Mellisa." },
      { at: "2026-11-07T09:25:00-04:00", by: "emp-tricia", kind: "internal", text: "Couva, San Fernando and Princes Town have space by the entrance. Penal and Point Fortin can take a half display only." },
    ] },
  { id: "rq-0144", ref: "RQ-0144", kind: "partnership", org: "South Central Diabetes Association", orgType: "Charity", contact: "Dr. Kavita Ramnarine", phone: "(868) 000-0615", email: "info@scda.example",
    via: "E-mail", branchId: "couva", receivedAt: "2026-11-03", ask: "A free blood-sugar screening morning at the Couva pharmacy counter, once a month", purpose: "They bring two nurses and the test kits; they ask for a table, two chairs and a notice in store.", neededBy: "2026-12-01",
    status: "approved", owner: "emp-ria", give: "Table by the pharmacy counter, first Saturday of each month, 8 am to 12 noon, from December", decidedBy: "emp-vishala", decidedAt: "2026-11-05T11:00:00-04:00", decisionNote: "Good for the store. Start in December and review in March.",
    messages: [
      { at: "2026-11-05T11:00:00-04:00", by: "emp-vishala", kind: "internal", text: "Approved. Start in December and review in March." },
      { at: "2026-11-05T15:30:00-04:00", by: "emp-ria", kind: "outbound", text: "We would be glad to host the screening mornings at Couva, on the first Saturday of each month from 5 December. Anand Maharaj, the store manager, will meet your team at 7:30 am." },
    ] },
  { id: "rq-0143", ref: "RQ-0143", kind: "donation", org: "Point Fortin Seniors’ Fellowship", orgType: "Community group", contact: "Mr. Clyde Joseph", phone: "(868) 000-0616", email: "",
    via: "Walk-in", branchId: "pfortin", receivedAt: "2026-10-27", ask: "Drinks and snacks for a Divali lunch for 60 seniors", purpose: "Their Divali lunch on 7 November at the community centre.", neededBy: "2026-11-06",
    status: "done", owner: "emp-ria", give: "6 cases of soft drink, 4 cases of water, 60 snack packs", value: 620, decidedBy: "emp-vishala", decidedAt: "2026-10-29T09:10:00-04:00", doneAt: "2026-11-06T10:30:00-04:00",
    messages: [
      { at: "2026-10-29T09:10:00-04:00", by: "emp-vishala", kind: "internal", text: "Approved." },
      { at: "2026-11-06T10:30:00-04:00", by: "emp-ria", kind: "internal", text: "Collected at Point Fortin by Mr. Joseph. Michelle signed it out." },
    ] },
  { id: "rq-0142", ref: "RQ-0142", kind: "sponsorship", org: "Southern Stars Dance Academy", orgType: "Community group", contact: "Ms. Renee Garcia", phone: "(868) 000-0617", email: "renee@southernstars.example",
    via: "Letter", branchId: "sando", receivedAt: "2026-10-20", ask: "TT$10,000 title sponsorship of the Christmas recital", purpose: "Recital at Naparima Bowl on 19 December.", neededBy: "2026-11-15",
    status: "declined", owner: "emp-ria", decidedBy: "emp-vishala", decidedAt: "2026-10-24T14:00:00-04:00", decisionNote: "Not this year: the sponsorship budget is committed. Offer refreshments for the cast instead.",
    messages: [
      { at: "2026-10-24T14:00:00-04:00", by: "emp-vishala", kind: "internal", text: "Decline the title sponsorship; the budget is committed. Offer refreshments for the cast instead." },
      { at: "2026-10-26T09:20:00-04:00", by: "emp-ria", kind: "outbound", text: "Thank you for thinking of us. We cannot take the title sponsorship this year, but we would like to provide refreshments for the cast on the night. Let us know if that would help." },
    ] },
  { id: "rq-0141", ref: "RQ-0141", kind: "donation", org: "Penal Rock Road Hindu School PTA", orgType: "Primary school", contact: "Mrs. Sunita Balkaran", phone: "(868) 000-0618", email: "pta@penalrockhindu.example",
    via: "Letter", branchId: "penal", receivedAt: "2026-10-12", ask: "Deyas, oil and sweets ingredients for the school’s Divali celebration", purpose: "School Divali programme on 6 November.", neededBy: "2026-11-04",
    status: "done", owner: "emp-ria", give: "10 dozen deyas, 2 cases of coconut oil, methai mix and ghee", value: 780, decidedBy: "emp-vishala", decidedAt: "2026-10-14T10:00:00-04:00", doneAt: "2026-11-03T13:00:00-04:00",
    messages: [{ at: "2026-11-03T13:00:00-04:00", by: "emp-ria", kind: "internal", text: "Delivered with the Penal store’s van. Thank-you letter received and filed." }] },
];

/* ---------- bulk orders ---------- */

const alloc = (rows: [string, number, string?][]) => rows.map(([branchId, qty, by]) => (by ? { branchId, qty, confirmedBy: by, confirmedAt: "2026-11-10T09:00:00-04:00" } : { branchId, qty }));

const BULK: BulkOrder[] = [
  { id: "bo-turkey-2026", season: "Christmas 2026", item: "Frozen whole turkey, 10–12 lb", supplierName: "Hadco", unit: "case of 4", unitCost: 612, orderBy: "2026-11-18", expected: "2026-12-04", status: "collecting",
    allocations: alloc([["sando", 60, "emp-ravi"], ["couva", 45, "emp-anand"], ["ptown", 70, "emp-sunil"], ["penal", 0], ["pfortin", 0]]),
    createdBy: "emp-vishala", createdAt: "2026-11-04T08:30:00-04:00", note: "Last year we ran out at Princes Town by 20 December.",
    log: [{ at: "2026-11-04T08:30:00-04:00", by: "emp-vishala", text: "Opened. Stores to give numbers by 18 November." }] },
  { id: "bo-cookies-2026", season: "Christmas 2026", item: "Danish butter cookies, 454 g tin", supplierName: "AMCO", unit: "case of 12", unitCost: 318, orderBy: "2026-11-06", expected: "2026-11-27", status: "ordered", orderedAt: "2026-11-07T10:10:00-04:00",
    allocations: alloc([["sando", 40, "emp-ravi"], ["couva", 30, "emp-anand"], ["ptown", 45, "emp-sunil"], ["penal", 20, "emp-rajesh"], ["pfortin", 18, "emp-michelle"]]),
    createdBy: "emp-vishala", createdAt: "2026-10-26T09:00:00-04:00",
    log: [{ at: "2026-10-26T09:00:00-04:00", by: "emp-vishala", text: "Opened." }, { at: "2026-11-07T10:10:00-04:00", by: "emp-vishala", text: "Ordered 153 cases from AMCO." }] },
  { id: "bo-oil-2026", season: "Christmas 2026", item: "Soyabean oil, 1 L", supplierName: "National Canners", unit: "case of 12", unitCost: 198, orderBy: "2026-11-20", status: "collecting",
    allocations: alloc([["sando", 120, "emp-ravi"], ["couva", 0], ["ptown", 150, "emp-sunil"], ["penal", 80, "emp-rajesh"], ["pfortin", 0]]),
    createdBy: "emp-ria", createdAt: "2026-11-09T11:00:00-04:00", log: [{ at: "2026-11-09T11:00:00-04:00", by: "emp-ria", text: "Opened for Mellisa." }] },
  { id: "bo-ghee-2026", season: "Divali 2026", item: "Cow Brand ghee, 2 lb", supplierName: "Langston", unit: "case of 12", unitCost: 1180, orderBy: "2026-09-25", expected: "2026-10-09", status: "shared", orderedAt: "2026-09-26T09:00:00-04:00", receivedAt: "2026-10-08T14:00:00-04:00",
    allocations: alloc([["sando", 14, "emp-ravi"], ["couva", 10, "emp-anand"], ["ptown", 18, "emp-sunil"], ["penal", 22, "emp-rajesh"], ["pfortin", 8, "emp-michelle"]]),
    createdBy: "emp-vishala", createdAt: "2026-09-14T09:00:00-04:00", log: [{ at: "2026-10-08T14:00:00-04:00", by: "emp-ria", text: "Received at Princes Town and shared to the stores." }] },
  { id: "bo-deyas-2026", season: "Divali 2026", item: "Clay deyas", supplierName: "SFB own lines", unit: "case of 300", unitCost: 240, orderBy: "2026-09-25", status: "shared", orderedAt: "2026-09-26T09:00:00-04:00", receivedAt: "2026-10-12T10:00:00-04:00",
    allocations: alloc([["sando", 20, "emp-ravi"], ["couva", 16, "emp-anand"], ["ptown", 24, "emp-sunil"], ["penal", 30, "emp-rajesh"], ["pfortin", 12, "emp-michelle"]]),
    createdBy: "emp-vishala", createdAt: "2026-09-14T09:00:00-04:00", log: [] },
  { id: "bo-turkey-2025", season: "Christmas 2025", item: "Frozen whole turkey, 10–12 lb", supplierName: "Hadco", unit: "case of 4", unitCost: 585, orderBy: "2025-11-17", status: "shared", orderedAt: "2025-11-18T09:00:00-04:00", receivedAt: "2025-12-05T09:00:00-04:00",
    allocations: alloc([["sando", 55, "emp-ravi"], ["couva", 30, "emp-anand"], ["ptown", 60, "emp-sunil"], ["penal", 35, "emp-rajesh"], ["pfortin", 25, "emp-michelle"]]),
    createdBy: "emp-vishala", createdAt: "2025-11-03T09:00:00-04:00", note: "Princes Town sold out by 20 December; Point Fortin had 6 cases left in January.", log: [] },
  { id: "bo-cookies-2025", season: "Christmas 2025", item: "Danish butter cookies, 454 g tin", supplierName: "AMCO", unit: "case of 12", unitCost: 296, orderBy: "2025-11-07", status: "shared", orderedAt: "2025-11-08T09:00:00-04:00", receivedAt: "2025-11-28T09:00:00-04:00",
    allocations: alloc([["sando", 36, "emp-ravi"], ["couva", 20, "emp-anand"], ["ptown", 40, "emp-sunil"], ["penal", 18, "emp-rajesh"], ["pfortin", 16, "emp-michelle"]]),
    createdBy: "emp-vishala", createdAt: "2025-10-27T09:00:00-04:00", log: [] },
];

/* ---------- tasks and office resources ---------- */

const TASKS: Task[] = [
  { id: "tk-1", title: "Enter case prices on the Carib Christmas sheet", detail: "Four lines came in by WhatsApp without case prices.", area: "admin", assignedTo: "emp-ria", assignedBy: "emp-vishala", due: "2026-11-13", status: "open", createdAt: "2026-11-10T14:30:00-04:00" },
  { id: "tk-2", title: "Send the Nestle sell-out report for Divali", detail: "Compiled on 12 November; the rep asked for it by Friday.", area: "admin", assignedTo: "emp-ria", assignedBy: "emp-vishala", due: "2026-11-13", status: "open", createdAt: "2026-11-12T08:45:00-04:00" },
  { id: "tk-3", title: "Get turkey numbers from Penal and Point Fortin", detail: "Both stores have not given a quantity. The order closes on 18 November.", area: "admin", assignedTo: "emp-nigel", assignedBy: "emp-vishala", due: "2026-11-16", status: "open", createdAt: "2026-11-10T09:30:00-04:00" },
  { id: "tk-4", title: "Christmas theme: check it on a phone before it goes live", detail: "Set to start on 20 November in the website studio.", area: "website", assignedTo: "emp-tricia", assignedBy: "emp-vishala", due: "2026-11-18", status: "open", createdAt: "2026-11-09T10:00:00-04:00" },
  { id: "tk-5", title: "Reply to Caribbean Bottlers about floor space", detail: "Request RQ-0145. Penal and Point Fortin can take a half display.", area: "marketing", assignedTo: "emp-tricia", assignedBy: "emp-ria", due: "2026-11-14", status: "open", createdAt: "2026-11-07T09:30:00-04:00" },
  { id: "tk-6", title: "Renew food badges expiring this month", detail: "Three badges expire before 5 December. See People.", area: "hr", assignedTo: "emp-devon", assignedBy: "emp-vishala", due: "2026-11-20", status: "open", createdAt: "2026-11-05T09:00:00-04:00" },
  { id: "tk-7", title: "File thank-you letter from Penal Rock Road Hindu School", detail: "Attach to RQ-0141.", area: "admin", assignedTo: "emp-ria", assignedBy: "emp-ria", due: "2026-11-05", status: "done", createdAt: "2026-11-03T13:10:00-04:00", doneAt: "2026-11-04T09:00:00-04:00" },
];

const RESOURCES: ResourceDoc[] = [
  { id: "res-reply-yes", area: "admin", kind: "Template", title: "Reply: request approved", summary: "The e-mail or letter that goes to a school, charity or club when the answer is yes.", updated: "2026-10-01",
    body: ["Dear [contact],", "Thank you for writing to Southern Food Basket. We are glad to help with [what was agreed].", "It will be ready at our [store] store from [date]. Please bring this reference when you collect: [reference].", "With best wishes for [event],", "Southern Food Basket"] },
  { id: "res-reply-no", area: "admin", kind: "Template", title: "Reply: not this time", summary: "A kind no, with the reason in one line and an invitation to ask again.", updated: "2026-10-01",
    body: ["Dear [contact],", "Thank you for thinking of Southern Food Basket. We get many requests and cannot say yes to all of them; this time we are not able to help with [what was asked].", "Please do write to us again for your next event. Requests reach us fastest through the form on our website, at least three weeks ahead.", "With best wishes,", "Southern Food Basket"] },
  { id: "res-month-end", area: "admin", kind: "Checklist", title: "Closing a specials book", summary: "What to finish before a round of specials is closed.", updated: "2026-11-02",
    body: ["Every company sheet is marked checked.", "Every key special has a case price.", "Sell-out reports are compiled for the companies that ask for them, and sent.", "Specials that carry over are copied into the next book.", "Close the book. It stays on record; nothing is deleted."] },
  { id: "res-bulk", area: "admin", kind: "Checklist", title: "Running a bulk order", summary: "From opening the order to sharing the stock.", updated: "2026-10-20",
    body: ["Open the order with the item, the company, the unit and the cost.", "Each store manager gives a quantity before the closing day. Last year’s numbers show beside theirs.", "Place the order once every store has answered, or on the closing day.", "Mark it received when the stock reaches Princes Town, then shared when it leaves for the stores."] },
  { id: "res-sellout", area: "admin", kind: "Guide", title: "Sell-out reports: who wants one", summary: "The companies that ask for units sold after a special, and where the numbers come from.", updated: "2026-11-02",
    body: ["Shine, Bryden pi, AS Bryden, Nestle and SM Jaleel ask for a sell-out report after each round.", "Units come from the till report for the dates of the special, all five stores added together.", "A photo of the notebook page can be attached to the report as its record."] },
  { id: "res-onboarding", area: "hr", kind: "Checklist", title: "A new starter’s first week", summary: "What HR and the store manager do before and after day one.", updated: "2026-09-15",
    body: ["Before day one: documents verified, uniform size taken, portal sign-in created, first rota posted.", "Day one: store walk-through, health and safety briefing, till or counter buddy named.", "First week: food safety level 1 booked for food-handling roles; customer care refresher assigned.", "End of month three: probation review with the store manager."] },
  { id: "res-interview", area: "hr", kind: "Guide", title: "Interview guide", summary: "The same six questions for every candidate for a floor role, and how to score them.", updated: "2026-08-04",
    body: ["Tell us about a time you helped a customer who was upset.", "What would you do if your till was short at the end of a shift?", "Which shifts can you work, and how do you get to the store?", "What do you know about food safety?", "Tell us about working in a team.", "What questions do you have for us?", "Score each answer 1 to 4 and write one line of evidence. Pay is discussed only after the interview."] },
  { id: "res-probation", area: "hr", kind: "Form", title: "Probation review form", summary: "For the store manager at the end of month three.", updated: "2026-08-04",
    body: ["Attendance and punctuality.", "Customer care.", "Knowledge of the role.", "Working with the team.", "Recommendation: confirm, extend by one month, or end.", "Signed by the store manager and by HR."] },
  { id: "res-holidays", area: "hr", kind: "Guide", title: "Public holidays and store hours", summary: "How holiday rotas are set. Dates are confirmed each year against the official list.", updated: "2026-10-05",
    body: ["Holiday hours for each store are set in Stores and hours by the office at least two weeks ahead.", "The holiday rota is posted in each person’s Schedule; swap requests close the Friday before.", "Religious holidays whose dates move each year (Divali, Eid-ul-Fitr) are added once the date is announced."] },
  { id: "res-post-check", area: "marketing", kind: "Checklist", title: "Before a post goes out", summary: "Five checks for every special that is posted.", updated: "2026-10-12",
    body: ["The price matches the specials book.", "The photo is the store’s own.", "The dates and the stores are on the post.", "The caption says “while stocks last” where it applies.", "It is on the content calendar."] },
];

/* ---------- marketing: accounts, posts and twelve weeks of figures. All DEMO until the accounts are connected. ---------- */

const ACCOUNTS: SocialAccount[] = [
  { id: "instagram", name: "Instagram", handle: "@southernfoodbasket", url: "https://www.instagram.com/southernfoodbasket/", connected: true, connectedAt: "2026-10-30T09:20:00-04:00", connectedBy: "emp-tricia",
    needs: "The owner of the Instagram business account signs in with Facebook once and approves read-only access to insights.", gives: "Followers, reach, plays, likes, comments, shares and saves for every post and reel." },
  { id: "tiktok", name: "TikTok", handle: "@southernfoodbasket", url: "https://www.tiktok.com/@southernfoodbasket", connected: true, connectedAt: "2026-10-30T09:26:00-04:00", connectedBy: "emp-tricia",
    needs: "The account owner signs in to TikTok once and approves read-only access to the account’s videos and their figures.", gives: "Followers and, for every video, views, likes, comments and shares." },
  { id: "facebook", name: "Facebook", handle: "Southernfoodbasket", url: "https://www.facebook.com/Southernfoodbasket/", connected: false,
    needs: "A page admin signs in with Facebook once and picks the Southern Food Basket page.", gives: "Page followers, post reach, reactions, comments and shares." },
  { id: "website", name: "This website", handle: "southernfoodbasket.example", url: "/", connected: true, connectedAt: "2026-10-30T09:00:00-04:00", connectedBy: "emp-tricia",
    needs: "Nothing: the site counts its own visits, without cookies and without following anyone to other sites.", gives: "Visitors and page views by page, and how many came from each social account." },
];

const post = (id: string, platform: SocialPost["platform"], kind: SocialPost["kind"], title: string, postedAt: string, n: [number, number, number, number, number, number, number], branchId: string | null = null): SocialPost =>
  ({ id, platform, kind, title, postedAt, branchId, views: n[0], reach: n[1], likes: n[2], comments: n[3], shares: n[4], saves: n[5], clicks: n[6] });

const POSTS: SocialPost[] = [
  post("sp-01", "tiktok", "Video", "Divali sweets table at Penal: ghee, methai mix and deyas", "2026-11-04T17:30:00-04:00", [48200, 39100, 3120, 214, 890, 0, 410], "penal"),
  post("sp-02", "instagram", "Video", "Divali sweets table at Penal: ghee, methai mix and deyas", "2026-11-04T17:35:00-04:00", [21400, 16800, 1480, 96, 310, 402, 265], "penal"),
  post("sp-03", "tiktok", "Video", "Red velvet cake, sliced: 9-inch double layer", "2026-10-30T12:10:00-04:00", [36900, 30200, 2760, 188, 540, 0, 356]),
  post("sp-04", "instagram", "Carousel", "This week’s cakes: red velvet, chocolate, sponge", "2026-10-30T12:00:00-04:00", [0, 12600, 902, 61, 144, 388, 301]),
  post("sp-05", "tiktok", "Video", "Couva store walk-through: bakery to pharmacy", "2026-10-23T18:00:00-04:00", [29800, 24100, 1890, 143, 420, 0, 198], "couva"),
  post("sp-06", "instagram", "Photo", "Cut veg packs, ready to cook, from $11.95", "2026-10-21T09:00:00-04:00", [0, 8900, 512, 28, 77, 196, 174]),
  post("sp-07", "facebook", "Photo", "Employee of the month, October", "2026-10-19T10:00:00-04:00", [0, 7400, 618, 122, 54, 0, 22]),
  post("sp-08", "tiktok", "Video", "Flag truck on the road in Point Fortin", "2026-10-17T16:45:00-04:00", [18300, 15200, 1210, 77, 260, 0, 61], "pfortin"),
  post("sp-09", "instagram", "Video", "How the bakery makes hops bread at 5 am", "2026-10-15T06:30:00-04:00", [17600, 13900, 1320, 84, 265, 311, 142], "ptown"),
  post("sp-10", "facebook", "Video", "Divali opening hours at all five stores", "2026-11-06T08:00:00-04:00", [5200, 9800, 402, 38, 141, 0, 186]),
  post("sp-11", "instagram", "Photo", "Body wash specials: 1 for $34.95", "2026-10-12T11:00:00-04:00", [0, 5100, 248, 9, 21, 64, 58]),
  post("sp-12", "tiktok", "Video", "Three snacks under $20 this week", "2026-10-09T15:20:00-04:00", [14200, 11800, 960, 52, 170, 0, 133]),
  post("sp-13", "facebook", "Photo", "Prize giveaway winners, San Fernando", "2026-10-05T13:00:00-04:00", [0, 6100, 540, 96, 61, 0, 14], "sando"),
  post("sp-14", "instagram", "Carousel", "Divali specials: oil, ghee, split peas, parsad flour", "2026-10-28T08:30:00-04:00", [0, 14300, 1010, 72, 388, 640, 472]),
  post("sp-15", "tiktok", "Video", "Packing 30 hampers for a children’s home", "2026-09-24T14:00:00-04:00", [22700, 18400, 2240, 131, 480, 0, 88], "sando"),
  post("sp-16", "instagram", "Photo", "Fresh parsley, $5.95 a bunch", "2026-09-18T09:10:00-04:00", [0, 3900, 201, 6, 12, 40, 31]),
];

const WEEKS = ["2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"];
/* followers at the start, weekly growth, base reach, engagement rate, then a lift per week (the Divali weeks run high) */
const SHAPE: Record<Platform, [number, number, number, number]> = {
  instagram: [11840, 96, 21000, 0.071],
  tiktok: [8420, 188, 34000, 0.092],
  facebook: [15260, 31, 12500, 0.048],
  website: [0, 0, 3900, 2.6],
};
const LIFT = [0.86, 0.9, 0.97, 0.93, 1.0, 1.12, 0.98, 1.05, 1.1, 1.24, 1.46, 1.58];
const WOBBLE: Record<Platform, number[]> = {
  instagram: [1, 0.96, 1.05, 1, 0.94, 1.02, 1.08, 0.97, 1.03, 1, 1.06, 0.98],
  tiktok: [0.9, 1.1, 0.95, 1.2, 0.92, 1.05, 0.9, 1.15, 1, 1.1, 1.18, 1.22],
  facebook: [1.02, 1, 0.98, 1, 1.01, 0.97, 1, 1.02, 0.99, 1, 1.04, 1.07],
  website: [0.95, 1, 1.02, 0.98, 1, 1.04, 1.01, 1.03, 1.08, 1.1, 1.2, 1.31],
};

const METRICS: MetricWeek[] = (Object.keys(SHAPE) as Platform[]).flatMap((platform) => {
  const [start, grow, base, rate] = SHAPE[platform];
  return WEEKS.map((week, i) => {
    const reach = Math.round((base * LIFT[i] * WOBBLE[platform][i]) / 10) * 10;
    return { id: platform + "-" + week, week, platform, followers: start ? start + Math.round(grow * i * (1 + i / 30)) : 0, reach, engagements: Math.round(reach * rate) };
  });
});

const PAGES: SitePage[] = [
  { id: "pg-specials", path: "/specials", title: "Specials", views: 9420, visitors: 5310 },
  { id: "pg-home", path: "/", title: "Home", views: 7880, visitors: 5120 },
  { id: "pg-locations", path: "/locations", title: "Store locations", views: 4610, visitors: 3540 },
  { id: "pg-offers", path: "/offers", title: "Members’ offers", views: 2970, visitors: 1880 },
  { id: "pg-careers", path: "/careers", title: "Careers", views: 2240, visitors: 1410 },
  { id: "pg-departments", path: "/departments", title: "Departments", views: 1320, visitors: 960 },
  { id: "pg-wholesale", path: "/wholesale", title: "Wholesale", views: 870, visitors: 640 },
  { id: "pg-community", path: "/community", title: "Community and partnerships", views: 590, visitors: 470 },
  { id: "pg-about", path: "/about", title: "About", views: 540, visitors: 430 },
];

const PLAN: PlanItem[] = [
  { id: "pl-1", date: "2026-11-13", platforms: ["instagram", "tiktok"], title: "Christmas specials book opens: first look at the hams", kind: "Video", status: "planned", owner: "emp-tricia" },
  { id: "pl-2", date: "2026-11-16", platforms: ["instagram", "facebook"], title: "Monday specials carousel", kind: "Carousel", status: "planned", owner: "emp-tricia" },
  { id: "pl-3", date: "2026-11-18", platforms: ["website"], title: "Members’ cake offer ends: take the banner down", kind: "Website", status: "planned", owner: "emp-tricia" },
  { id: "pl-4", date: "2026-11-20", platforms: ["website", "instagram", "facebook", "tiktok"], title: "Christmas look goes live on the website", kind: "Website", status: "planned", owner: "emp-tricia", note: "Set in the website studio to start by itself." },
  { id: "pl-5", date: "2026-11-21", platforms: ["tiktok"], title: "Black cake fruit: what to soak and when", kind: "Video", status: "idea", owner: "emp-tricia" },
  { id: "pl-6", date: "2026-11-27", platforms: ["instagram", "facebook"], title: "Butter cookies are in: all five stores", kind: "Photo", status: "idea", owner: "emp-tricia", note: "Depends on the bulk order arriving on the 27th." },
  { id: "pl-7", date: "2026-11-30", platforms: ["website"], title: "Weekly e-mail: Christmas shop", kind: "E-mail", status: "idea", owner: "emp-tricia" },
  { id: "pl-8", date: "2026-11-10", platforms: ["instagram", "facebook"], title: "Monday specials carousel", kind: "Carousel", status: "posted", owner: "emp-tricia" },
  { id: "pl-9", date: "2026-11-06", platforms: ["facebook"], title: "Divali opening hours", kind: "Video", status: "posted", owner: "emp-tricia" },
  // Looking back and ahead, so the calendar has a history to page through. The dated posts from September to
  // 13 November are the company's real posts (lib/seed-events.ts says where each came from); the rest are demo plans.
  { id: "pl-10", date: "2026-09-17", platforms: ["instagram", "facebook"], title: "Escape on Wheels launch: win a BYD Song Pro", kind: "Photo", status: "posted", owner: "emp-addae" },
  { id: "pl-12", date: "2026-10-07", platforms: ["instagram"], title: "Snack specials: 1 FOR posts", kind: "Carousel", status: "posted", owner: "emp-tricia" },
  { id: "pl-13", date: "2026-10-26", platforms: ["instagram", "facebook"], title: "A closer look at the BYD Song Pro", kind: "Carousel", status: "posted", owner: "emp-addae" },
  { id: "pl-14", date: "2026-11-07", platforms: ["instagram", "facebook", "tiktok"], title: "Colour Me Divali: Couva recap reel", kind: "Video", status: "posted", owner: "emp-tricia" },
  { id: "pl-15", date: "2026-11-08", platforms: ["instagram", "facebook"], title: "Shubh Divali greeting", kind: "Photo", status: "posted", owner: "emp-addae" },
  { id: "pl-16", date: "2026-11-11", platforms: ["instagram", "facebook"], title: "We are hiring: Custodian, Penal", kind: "Photo", status: "posted", owner: "emp-addae" },
  { id: "pl-17", date: "2026-11-12", platforms: ["instagram", "facebook"], title: "Flash Sale flyers: 13 to 15 November", kind: "Carousel", status: "posted", owner: "emp-addae" },
  { id: "pl-18", date: "2026-11-13", platforms: ["instagram", "facebook", "tiktok"], title: "Flash Savings reel", kind: "Video", status: "posted", owner: "emp-tricia" },
  { id: "pl-19", date: "2026-12-04", platforms: ["instagram", "facebook"], title: "Christmas hampers: what is in each one", kind: "Carousel", status: "idea", owner: "emp-tricia" },
  { id: "pl-20", date: "2026-12-11", platforms: ["instagram", "tiktok"], title: "Sorrel and ginger beer: a quick how-to", kind: "Video", status: "idea", owner: "emp-tricia" },
  { id: "pl-21", date: "2026-12-18", platforms: ["website", "facebook"], title: "Christmas opening hours", kind: "Website", status: "planned", owner: "emp-tricia" },
  { id: "pl-22", date: "2026-12-24", platforms: ["instagram", "facebook"], title: "Merry Christmas greeting", kind: "Photo", status: "planned", owner: "emp-addae" },
  { id: "pl-23", date: "2027-01-01", platforms: ["instagram", "facebook"], title: "Happy New Year greeting", kind: "Photo", status: "idea", owner: "emp-addae" },
  { id: "pl-24", date: "2027-01-25", platforms: ["website"], title: "Carnival look goes live on the website", kind: "Website", status: "idea", owner: "emp-tricia" },
  { id: "pl-25", date: "2027-02-08", platforms: ["instagram", "facebook", "tiktok"], title: "Carnival Monday: store hours and a road-ready shop", kind: "Video", status: "idea", owner: "emp-tricia" },
];

/* ---------- customer feedback (demo tickets: the people and the messages are made up) ---------- */

const FEEDBACK: FeedbackTicket[] = [
  { id: "fb-0230", ref: "FB-0230", kind: "complaint", branchId: "penal", name: "Kavita R.", contact: "kavita.r@example.com", wantsReply: true, receivedAt: "2026-11-12T17:42:00-04:00", status: "new",
    message: "The shelf said $18.95 for the 2 L orange juice but the till charged $21.50. The cashier was polite but could not change it. I have the bill.", messages: [] },
  { id: "fb-0229", ref: "FB-0229", kind: "question", branchId: null, name: "Marlon", contact: "868 555 0142", wantsReply: true, receivedAt: "2026-11-12T10:15:00-04:00", status: "new",
    message: "Are you taking orders for Christmas hams this year, and from when?", messages: [] },
  { id: "fb-0228", ref: "FB-0228", kind: "complaint", branchId: "ptown", name: "Mrs. Ali", contact: "868 555 0177", wantsReply: true, receivedAt: "2026-11-11T13:05:00-04:00", status: "in-progress", assignedTo: "emp-ria",
    message: "Only two tills were open on Saturday afternoon and the line reached the freezers. I waited about 25 minutes.",
    messages: [
      { at: "2026-11-11T14:20:00-04:00", by: "emp-ria", kind: "internal", text: "Asked the store manager for Saturday’s rota. Two cashiers were out sick." },
      { at: "2026-11-11T15:02:00-04:00", by: "emp-ria", kind: "outbound", text: "Called Mrs. Ali, apologised and explained. She would like to know it will not happen in December." },
    ] },
  { id: "fb-0227", ref: "FB-0227", kind: "suggestion", branchId: "sando", name: "", contact: "", wantsReply: false, receivedAt: "2026-11-10T19:30:00-04:00", status: "in-progress", assignedTo: "emp-ria",
    message: "Please stock gluten-free flour and pasta. I drive to San Fernando for them now.",
    messages: [{ at: "2026-11-11T09:10:00-04:00", by: "emp-ria", kind: "internal", text: "Passed to Nigel in purchasing to price two brands." }] },
  { id: "fb-0226", ref: "FB-0226", kind: "compliment", branchId: "couva", name: "Deborah", contact: "deborah.j@example.com", wantsReply: false, receivedAt: "2026-11-09T11:48:00-04:00", status: "resolved", assignedTo: "emp-ria", resolvedAt: "2026-11-09T15:00:00-04:00", resolution: "Shared with the store manager and read out at the morning meeting.",
    message: "The young man packing at till 3 carried my bags to the car in the rain without being asked. Please thank him.",
    messages: [{ at: "2026-11-09T15:00:00-04:00", by: "emp-ria", kind: "internal", text: "Resolved. Shared with the store manager and read out at the morning meeting." }] },
  { id: "fb-0225", ref: "FB-0225", kind: "complaint", branchId: "penal", name: "Anil", contact: "anil.s@example.com", wantsReply: true, receivedAt: "2026-11-06T08:55:00-04:00", status: "resolved", assignedTo: "emp-ria", resolvedAt: "2026-11-07T10:30:00-04:00", resolution: "Refunded at the customer service desk and the batch was taken off the shelf.",
    message: "The bread I bought on Thursday evening was past its date. I only saw it at home.",
    messages: [
      { at: "2026-11-06T09:40:00-04:00", by: "emp-ria", kind: "outbound", text: "We are sorry about this. Please bring the loaf or the bill to the customer service desk for a refund and a fresh loaf." },
      { at: "2026-11-06T12:15:00-04:00", by: "requester", kind: "inbound", text: "Thank you, I will pass tomorrow." },
      { at: "2026-11-07T10:30:00-04:00", by: "emp-ria", kind: "internal", text: "Resolved. Refunded at the customer service desk and the batch was taken off the shelf." },
    ] },
];

const AUDIT: AuditEvent[] = [
  { id: "au-o1", at: "2026-11-12T09:05:00-04:00", actor: "emp-ria", role: "admin", action: "sellout.send", target: "SM Jaleel, Divali 2026", detail: "Marked as sent to the company", ok: true },
  { id: "au-o2", at: "2026-11-10T14:05:00-04:00", actor: "emp-ria", role: "admin", action: "suppliers.import", target: "Carib, Christmas 2026", detail: "Read 4 lines from a PDF sent by WhatsApp", ok: true },
  { id: "au-o3", at: "2026-11-08T16:20:00-04:00", actor: "emp-vishala", role: "owner", action: "requests.decide", target: "RQ-0146 Hope Centre Children’s Home", detail: "Approved: 30 hampers", ok: true },
  { id: "au-o4", at: "2026-11-07T10:10:00-04:00", actor: "emp-vishala", role: "owner", action: "bulk.order", target: "Danish butter cookies, Christmas 2026", detail: "Ordered 153 cases", ok: true },
  { id: "au-o5", at: "2026-11-02T08:00:00-04:00", actor: "emp-vishala", role: "owner", action: "access.grant", target: "Nigel Sookram", detail: "Purchasing, every store", ok: true },
];

export const OPS_TIER: Partial<Seed> = {
  suppliers: SUPPLIERS,
  specialsBooks: SPECIALS_BOOKS,
  supplierSheets: SUPPLIER_SHEETS,
  sellouts: SELLOUTS,
  requests: REQUESTS,
  bulkOrders: BULK,
  tasks: TASKS,
  resources: RESOURCES,
  socialAccounts: ACCOUNTS,
  socialPosts: POSTS,
  socialWeeks: METRICS,
  sitePages: PAGES,
  plan: PLAN,
  feedback: FEEDBACK,
};

export const OPS_AUDIT = AUDIT;
