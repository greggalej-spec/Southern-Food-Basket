// The shape of lib/seed.ts and of the copy kept in localStorage (lib/store.ts). Dates are ISO strings: a bare
// YYYY-MM-DD is a local calendar day (see parseDay), a full timestamp is an instant.

export type Role = "applicant" | "employee" | "hr" | "admin";
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
  offer?: { startDate: string; pay: number; payUnit: string; sentAt: string; status: string };
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
}

export interface Session {
  role: Role;
  userId: string | null;
  at: string;
}
