// The shape of lib/seed.ts and of the copy kept in localStorage (lib/store.ts). Dates are ISO strings: a bare
// YYYY-MM-DD is a local calendar day (see parseDay), a full timestamp is an instant.

/** Who is signed in. customer and applicant are self-service identities; the rest are staff roles, each held through
 *  a Grant (lib/access.ts) that the owner can scope to stores, time-limit or revoke. */
export type Role = "customer" | "applicant" | "employee" | "hr" | "admin" | "marketing" | "owner";
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
  posted: string;
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
