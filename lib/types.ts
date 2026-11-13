// The shape of lib/seed.ts and of the copy kept in localStorage (lib/store.ts). Dates are ISO strings: a bare
// YYYY-MM-DD is a local calendar day (see parseDay), a full timestamp is an instant.

/** Who is signed in. customer and applicant are self-service identities; the rest are staff roles, each held through
 *  a Grant (lib/access.ts) that the owner can scope to stores, time-limit or revoke. */
export type Role = "customer" | "applicant" | "employee" | "hr" | "admin" | "purchasing" | "marketing" | "owner";
export type Tone = "info" | "warn" | "ok" | "bad" | "plain";
export type DocState = "missing" | "uploaded" | "verified" | "flagged" | "expired";
export type LeaveType = "Annual" | "Sick" | "Casual";
export type LeaveStatus = "pending" | "approved" | "declined";

export interface Settings {
  currency: string;
  brand: string;
  short: string;
  tagline: string;
  founded: number;
  phone: string;
  whatsappChannel: string;
  tiktok: string;
  facebook: string;
  email: string;
  careersEmail: string;
  instagram: { handle: string; url: string };
  dealsNote: string;
  demo: boolean;
}

/** hours[0] is Monday to Saturday, hours[1] is Sunday: [label, time]. */
export type HoursRow = [label: string, time: string];

export interface Branch {
  id: string;
  name: string;
  short: string;
  address: string;
  plusCode: string;
  listing: string;
  placeId: string;
  lat: number;
  lng: number;
  phone: string;
  hours: HoursRow[];
  source: string;
  services: string[];
  servicesSource?: string;
}

export interface Department {
  id: string;
  name: string;
  short: string;
  img: string;
  alt: string;
  blurb: string;
}

/** img is a stem: /assets/img/photos/<img>.webp */
export interface Special {
  id: string;
  name: string;
  dept: string;
  price: number;
  img: string;
  /** The first day it runs, "YYYY-MM-DD". */
  posted: string;
  /** The last day it runs. Absent: it runs until someone ends it. */
  to?: string;
  couva?: boolean;
  isNew?: boolean;
  alt?: string;
}

export interface Sourced {
  text: string;
  source: string;
}

export interface KycDoc {
  id: string;
  name: string;
  desc: string;
  formats: string[];
  expires: boolean;
  conditional?: boolean;
}

export interface Stage {
  id: string;
  label: string;
  tone: Tone;
}

export interface Job {
  id: string;
  title: string;
  dept: string;
  branchId: string;
  type: string;
  shift: string;
  posted: string;
  status: "open" | "closed";
  summary: string;
  responsibilities: string[];
  requirements: string[];
  kyc: string[];
}

/** What the store keeps for an uploaded document: never the file's bytes. */
export interface DocRecord {
  state: DocState;
  fileName?: string;
  size?: number;
  type?: string;
  expiry?: string;
  reason?: string;
  updatedAt?: string;
}

export interface Note {
  at: string;
  author: string;
  text: string;
}

export interface Message {
  at: string;
  from: string;
  text: string;
}

export interface TimelineEntry {
  at: string;
  text: string;
}

/** An HR decision the applicant has not opened yet. The tracker shows "An update on your application" until they do. */
export interface Outcome {
  kind: "offer" | "not-selected";
  at: string;
  openedAt?: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  stage: string;
  submittedAt: string;
  personal: { address: string; dob: string; nonNational: boolean };
  experience: { summary: string; availability: string[]; startDate: string };
  interview?: { at: string; where: string; with: string };
  offer?: { startDate: string; pay: number; payUnit: string; sentAt: string; status: string; respondedAt?: string };
  outcome?: Outcome;
  docs: Record<string, DocRecord>;
  notes: Note[];
  messages: Message[];
  timeline: TimelineEntry[];
}

export interface LeaveBalance {
  annualEntitled: number;
  annualUsed: number;
  sickEntitled: number;
  sickUsed: number;
  casualEntitled: number;
  casualUsed: number;
}

export interface LeaveRequest {
  id: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
}

export interface SwapRequest {
  id: string;
  shiftDate: string;
  note: string;
  status: string;
  requestedAt: string;
}

export interface Shift {
  date: string;
  start: string;
  end: string;
  role: string;
}

export interface PayLine {
  label: string;
  amount: number;
}

export interface Payslip {
  id: string;
  period: string;
  from: string;
  to: string;
  paidOn: string;
  earnings: PayLine[];
  deductions: PayLine[];
  gross: number;
  net: number;
}

export interface Training {
  id: string;
  name: string;
  done: boolean;
  completedAt?: string | null;
  due?: string;
  minutes: number;
}

export interface ComplianceDoc extends Partial<Omit<DocRecord, "state">> {
  docId: string;
  state: DocState;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dept: string;
  branchId: string;
  startDate: string;
  employeeNo: string;
  email: string;
  phone: string;
  address: string;
  emergency: { name: string; relation: string; phone: string };
  bank: { bank: string; masked: string };
  leave: LeaveBalance;
  leaveRequests: LeaveRequest[];
  swapRequests: SwapRequest[];
  /** Where the person stands with HR. Absent means active. */
  status?: "active" | "probation" | "on-leave";
  shifts: Shift[];
  payslips: Payslip[];
  training: Training[];
  compliance: ComplianceDoc[];
}

export interface Announcement {
  id: string;
  branchId: string | null;
  date: string;
  title: string;
  body: string;
}

export interface Policy {
  id: string;
  title: string;
  summary: string;
  updated: string;
}

export interface Content {
  hero: { headline: string; sub: string };
  values: { title: string; text: string }[];
  facts: Sourced[];
  community: { title: string; text: string; source: string; img: string; alt: string };
  careersWhy: { title: string; text: string }[];
}

export interface Seed {
  version: number;
  /** The private tiers (lib/seed-private.ts) already merged into this copy: "members", "staff". */
  _tiers?: string[];
  settings: Settings;
  branches: Branch[];
  storeServices: string[];
  departments: Department[];
  specials: Special[];
  wholesale: { sourced: Sourced[]; lines: string[]; customerTypes: string[] };
  jobDepts: string[];
  kycDocs: KycDoc[];
  stages: Stage[];
  jobs: Job[];
  applicants: Applicant[];
  employees: Employee[];
  announcements: Announcement[];
  policies: Policy[];
  content: Content;
  promotions: Promotion[];
  grants: Grant[];
  customers: Customer[];
  entitlements: Entitlement[];
  redemptions: RedeemAttempt[];
  subscribers: Subscriber[];
  consents: ConsentEvent[];
  campaigns: Campaign[];
  staffUpdates: StaffUpdate[];
  outbox: OutboxMessage[];
  audit: AuditEvent[];
  /** What the website studio controls: the season, the notice bar and which home bands show. Public. */
  site: SiteConfig;
  /* Operations (lib/seed-ops.ts, staff tier) */
  suppliers: Supplier[];
  specialsBooks: SpecialsBook[];
  supplierSheets: SupplierSheet[];
  sellouts: SelloutReport[];
  requests: CommunityRequest[];
  bulkOrders: BulkOrder[];
  tasks: Task[];
  resources: ResourceDoc[];
  socialAccounts: SocialAccount[];
  socialPosts: SocialPost[];
  socialWeeks: MetricWeek[];
  sitePages: SitePage[];
  plan: PlanItem[];
  /** What shoppers send with the Feedback button. A ticket made on a public page lives here; the seeded ones join with the staff tier. */
  feedback: FeedbackTicket[];
  /** What is on, for the public Events page, and the designer's flyers that lead the Specials page. Public. */
  events: StoreEvent[];
  flyers: Flyer[];
}

export interface Session {
  role: Role;
  userId: string | null;
  at: string;
}

/* Access (lib/access.ts) */

/** A staff role held by one person. branchIds null = every store. Revoked or expired grants sign nobody in. */
export interface Grant {
  id: string;
  userId: string;
  role: Exclude<Role, "customer" | "applicant">;
  branchIds: string[] | null;
  /** Permissions this person holds on top of the role's own (Permission names from lib/access.ts). */
  extra?: string[];
  grantedBy: string;
  grantedAt: string;
  expires?: string;
  revokedAt?: string;
  revokedBy?: string;
}

/** One line of the audit log. detail never holds a full code, an e-mail address or a document. */
export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: Role | "guest";
  action: string;
  target: string;
  detail: string;
  ok: boolean;
}

/* Promotions and codes (lib/promo.ts) */

/** Stored status. "live", "scheduled" and "ended" are worked out from an approved promotion's dates (promoState). */
export type PromoStatus = "draft" | "review" | "approved" | "rejected" | "archived";

export interface Promotion {
  id: string;
  slug: string;
  title: string;
  /** What the shopper gets, in one line: "TT$25 off a shop of TT$250 or more". */
  benefit: string;
  summary: string;
  terms: string[];
  kind: "member-code" | "flash";
  /** Photo stem under /assets/img/photos, or none. */
  img?: string;
  alt?: string;
  branchIds: string[] | null;
  /** Trinidad local time, written with its offset: 2026-10-27T00:00:00-04:00. */
  starts: string;
  ends: string;
  limits: { perCustomer: number; total: number | null };
  status: PromoStatus;
  createdBy: string;
  createdAt: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewNote?: string;
  revisions: { at: string; by: string; summary: string }[];
}

/** A shopper's claim on a promotion. The code itself is never stored here: only its SHA-256 and the last four
 *  characters for staff screens. The shopper's own copy lives on their Customer record. */
export interface Entitlement {
  id: string;
  promoId: string;
  customerId: string;
  codeHash: string;
  last4: string;
  claimedAt: string;
  status: "claimed" | "redeemed" | "void";
  redeemedAt?: string;
  redeemedBy?: string;
  redeemedBranch?: string;
}

/** Every code check at a till, passed or refused. Feeds the lockout and the audit log. */
export interface RedeemAttempt {
  id: string;
  at: string;
  by: string;
  branchId: string;
  ok: boolean;
  reason: string;
  last4: string;
  entitlementId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt?: string;
  preferredBranch?: string;
  createdAt: string;
  /** A one-time sign-in link's token while one is outstanding (lib/account.ts). */
  signInToken?: string;
  signInExpires?: string;
  /** The shopper's own codes. Shown only to them. */
  wallet: { entitlementId: string; code: string }[];
}

/* Newsletter (lib/newsletter.ts) */

export type SubscriberStatus = "pending" | "active" | "unsubscribed" | "suppressed";

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  branches: string[];
  topics: string[];
  source: string;
  createdAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
  /** Opaque token for the confirm, preferences and unsubscribe links. */
  token: string;
}

/** Append-only consent ledger (PRD MKT-040s): who agreed to what wording, where and when. */
export interface ConsentEvent {
  id: string;
  subscriberId: string;
  action: "requested" | "confirmed" | "updated" | "withdrawn" | "suppressed";
  wording: string;
  source: string;
  at: string;
}

export type CampaignStatus = "draft" | "scheduled" | "sent";

export interface Campaign {
  id: string;
  subject: string;
  preheader: string;
  template: "weekly-specials" | "offer" | "store-news";
  intro: string;
  specialIds: string[];
  promoId?: string;
  segment: { branches: string[] | null; topics: string[] };
  status: CampaignStatus;
  scheduledFor?: string;
  sentAt?: string;
  sentTo?: number;
  createdBy: string;
  createdAt: string;
  testSends: { at: string; to: string }[];
}

/** What the site would have e-mailed. Nothing is sent: the demo outbox (/outbox) shows these instead. */
export interface OutboxMessage {
  id: string;
  at: string;
  to: string;
  /** internal: a staff update to a work address (lib/staff-updates.ts), never to the shoppers' list. */
  kind: "transactional" | "marketing" | "internal";
  subject: string;
  body: string[];
  action?: { label: string; href: string };
  campaignId?: string;
  staffUpdateId?: string;
}

/* Staff updates (lib/staff-updates.ts): the internal newsletter, e-mailed to work addresses and kept in each
   person's portal. Separate from the shoppers' newsletter and from the one-line store notices. */

export type StaffUpdateStatus = "draft" | "scheduled" | "sent";

export interface StaffUpdate {
  id: string;
  subject: string;
  /** One line under the subject: the inbox preview. */
  summary: string;
  /** Paragraphs. */
  body: string[];
  /** Asks each person to press "I have read this" (a new policy, a safety change). */
  needsAck: boolean;
  /** Who it goes to. null = every store / every team. A sender scoped to some stores can pick only those. */
  audience: { branches: string[] | null; teams: string[] | null };
  status: StaffUpdateStatus;
  scheduledFor?: string;
  sentAt?: string;
  /** Fixed when it is sent, so people who join later do not appear as unread. */
  recipientIds?: string[];
  reads: { employeeId: string; at: string }[];
  acks: { employeeId: string; at: string }[];
  createdBy: string;
  createdAt: string;
  sentBy?: string;
  testSends: { at: string; to: string }[];
}

/* ---------- Website studio (lib/ops/site.ts). Public: the pages read it to dress the site. ---------- */

export type SeasonId = "none" | "christmas" | "divali" | "carnival" | "easter";

export interface SiteConfig {
  season: {
    id: SeasonId;
    /** off: the everyday site. on: dressed now. dates: dressed between from and to (Trinidad days, inclusive). */
    mode: "off" | "on" | "dates";
    from: string;
    to: string;
    /** The string of lights under the header. */
    lights: boolean;
    /** The greeting ribbon across the top of every public page. Empty hides it. */
    greeting: string;
  };
  /** One line above the header on every public page: a closure, a late opening, a sale. */
  notice: { on: boolean; text: string; linkLabel: string; href: string };
  /** Home page bands switched off (their section ids: highlights, deals, careers, aisles, stores). */
  hiddenBands: string[];
}

/* ---------- Administration (lib/ops/admin-ops.ts) ---------- */

/** What the demo keeps of an uploaded file: never its bytes. */
export interface FileMeta {
  fileName: string;
  size: number;
  type: string;
}

export interface LogLine {
  at: string;
  by: string;
  text: string;
}

export interface Supplier {
  id: string;
  name: string;
  rep: string;
  phone: string;
  /** How their specials usually arrive. */
  channel: "WhatsApp" | "E-mail" | "Rep visit";
  /** Whether they ask for a sell-out report after a special. */
  wantsSellout: boolean;
  addedAt: string;
}

/** One round of specials, as the office keeps one workbook today: "Divali 2026", "Christmas 2026", "November 2026". */
export interface SpecialsBook {
  id: string;
  title: string;
  from: string;
  to: string;
  /** closed: the round is over. It stays on record and can still be read. */
  status: "open" | "closed";
  createdAt: string;
}

/** One row, in the columns the office already uses: item, count, case price, VAT, special, notes. */
export interface SupplierLine {
  id: string;
  item: string;
  /** As written: "24", "12 X 454G". */
  count: string;
  /** Suppliers often leave it off; the office looks it up and types it in. */
  casePrice: number | null;
  vat: "Y" | "N" | "";
  /** The shelf special as written: "3 FOR 24.95", "7.95 PER LB", "19.95". */
  special: string;
  /** The trade deal, when there is one: "Sell in 10 cs, get 5 cs free". */
  deal?: string;
  /** When it runs, as the company wrote it: "5 Oct - 11 Nov". */
  valid?: string;
  note?: string;
  /** The heading it sits under on the company's sheet: "Canned vegetables". */
  group?: string;
  /** On the key specials sheet. */
  key?: boolean;
}

/** One company's specials inside a book, read from the file they sent. */
export interface SupplierSheet {
  id: string;
  bookId: string;
  supplierId: string;
  source: (FileMeta & { via: "WhatsApp" | "E-mail" | "Scan" | "Typed in" | "Workbook" }) | null;
  importedAt: string;
  importedBy: string;
  /** to-check: the system read it and a person has not confirmed it yet. */
  status: "to-check" | "checked";
  checkedAt?: string;
  checkedBy?: string;
  lines: SupplierLine[];
}

export interface SelloutReport {
  id: string;
  supplierId: string;
  bookId: string;
  /** compiled: the numbers are in. sent: the company has them. */
  status: "compiled" | "sent";
  lines: { item: string; units: number; special: string }[];
  /** The notebook page or till print-out it was taken from. */
  scan?: FileMeta;
  compiledAt: string;
  compiledBy: string;
  sentAt?: string;
  note?: string;
}

export type RequestKind = "donation" | "sponsorship" | "partnership" | "promotion";
export type RequestStatus = "new" | "reviewing" | "with-owner" | "approved" | "declined" | "done";

export interface RequestMessage {
  at: string;
  /** An employee id, or "requester" for a reply from the organisation. */
  by: string;
  /** internal: only staff see it. outbound: it went to the requester by e-mail. inbound: they wrote back. */
  kind: "internal" | "outbound" | "inbound";
  text: string;
}

/** A request from outside for the store's help or to work together: a school asking for hampers, a charity drive,
 *  a club's sponsorship, a brand's in-store promotion. One log for all of them, wherever they came in. */
export interface CommunityRequest {
  id: string;
  /** "RQ-0142", what the office quotes on the phone. */
  ref: string;
  kind: RequestKind;
  org: string;
  /** "Primary school", "Charity", "Sports club", "Religious body", "Supplier", "Community group" */
  orgType: string;
  contact: string;
  phone: string;
  email: string;
  via: "Letter" | "WhatsApp" | "E-mail" | "Walk-in" | "Website";
  /** The store it came through or is about, or null for head office. */
  branchId: string | null;
  receivedAt: string;
  ask: string;
  purpose: string;
  neededBy?: string;
  status: RequestStatus;
  /** Who in the office is looking after it. */
  owner?: string;
  /** What was agreed, in words: "2 hampers and 4 cases of juice". */
  give?: string;
  value?: number;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
  doneAt?: string;
  letter?: FileMeta;
  messages: RequestMessage[];
}

export type EventKind = "promotion" | "event" | "community" | "notice";

/** Something running that a customer should know about. It shows on the Events page from `from` to `to`. */
export interface StoreEvent {
  id: string;
  kind: EventKind;
  title: string;
  /** First and last day, "YYYY-MM-DD". A one-day event has the same date twice. */
  from: string;
  to: string;
  /** "8:00 am to 11:00 am", when the time matters. */
  time?: string;
  /** The stores it is at, or null for every store. */
  branchIds: string[] | null;
  /** One sentence. Detail goes in `points`, three short lines at most. */
  summary: string;
  points?: string[];
  /** A site path or an uploaded picture (a data URL). */
  img?: string;
  href?: string;
  cta?: string;
  featured?: boolean;
  /** No posted end date: it runs until taken down (`to` is then a far-off date, for sorting). */
  ongoing?: boolean;
  /** The main promotion: the big banner on the home page while it runs. One at a time. */
  spotlight?: boolean;
}

/** A finished picture from the graphic designer: a weekly specials flyer or a post. */
export interface Flyer {
  id: string;
  title: string;
  img: string;
  addedBy: string;
  addedAt: string;
  from?: string;
  to?: string;
  /** Featured flyers lead the public Specials page. */
  featured: boolean;
}

export type FeedbackKind = "compliment" | "suggestion" | "question" | "complaint";

/** One message from a shopper, sent with the Feedback button on the public site, and what customer service did with it. */
export interface FeedbackTicket {
  id: string;
  /** "FB-0231", what the customer is shown and can quote. */
  ref: string;
  kind: FeedbackKind;
  /** The store it is about, or null when it is not about one store. */
  branchId: string | null;
  message: string;
  name: string;
  /** A phone number or an e-mail address, as the customer typed it. May be empty. */
  contact: string;
  wantsReply: boolean;
  receivedAt: string;
  status: "new" | "in-progress" | "resolved";
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
  messages: RequestMessage[];
}

export type BulkStatus ="collecting" | "ordered" | "received" | "shared";

export interface BulkOrder {
  id: string;
  /** "Christmas 2026" */
  season: string;
  item: string;
  supplierName: string;
  /** "case of 6" */
  unit: string;
  unitCost: number;
  /** Stores give their numbers by this day. */
  orderBy: string;
  expected?: string;
  status: BulkStatus;
  orderedAt?: string;
  receivedAt?: string;
  allocations: { branchId: string; qty: number; confirmedBy?: string; confirmedAt?: string }[];
  createdBy: string;
  createdAt: string;
  note?: string;
  log: LogLine[];
}

export type Area = "admin" | "marketing" | "hr" | "website" | "owner";

export interface Task {
  id: string;
  title: string;
  detail: string;
  area: Area;
  assignedTo: string;
  assignedBy: string;
  due: string;
  status: "open" | "done";
  createdAt: string;
  doneAt?: string;
}

/** A template, form or guide the office keeps to hand. The text is the document. */
export interface ResourceDoc {
  id: string;
  area: "admin" | "hr" | "marketing";
  kind: "Template" | "Form" | "Contact list" | "Guide" | "Checklist";
  title: string;
  summary: string;
  updated: string;
  body: string[];
}

/* ---------- Marketing analytics (lib/ops/social.ts). Every figure is DEMO until the accounts are connected. ---------- */

export type Platform = "instagram" | "tiktok" | "facebook" | "website";

export interface SocialAccount {
  id: Platform;
  name: string;
  handle: string;
  url: string;
  connected: boolean;
  connectedAt?: string;
  connectedBy?: string;
  /** What the store has to do to connect it, in one sentence. */
  needs: string;
  /** What comes back once it is connected. */
  gives: string;
}

export interface SocialPost {
  id: string;
  platform: Exclude<Platform, "website">;
  kind: "Video" | "Photo" | "Carousel";
  title: string;
  postedAt: string;
  branchId?: string | null;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  /** Taps through to the website. */
  clicks: number;
}

/** One platform's week. `week` is its Monday. For the website, reach is visitors and engagements are page views. */
export interface MetricWeek {
  id: string;
  week: string;
  platform: Platform;
  followers: number;
  reach: number;
  engagements: number;
}

export interface SitePage {
  id: string;
  path: string;
  title: string;
  views: number;
  visitors: number;
}

export interface PlanItem {
  id: string;
  date: string;
  platforms: Platform[];
  title: string;
  kind: "Video" | "Photo" | "Carousel" | "E-mail" | "Website";
  status: "idea" | "planned" | "posted";
  owner: string;
  note?: string;
}
