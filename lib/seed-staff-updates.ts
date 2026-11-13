import type { StaffUpdate } from "./types";

/* Staff updates in the "staff" tier (registered with it in lib/private.ts). DEMO: invented people and wording.
   Keisha has one unread update and one she has read but not yet confirmed, so her portal shows both states.
   Bump SEED.version in lib/seed.ts when this changes. */

const EVERYONE = ["emp-keisha", "emp-devon", "emp-marsha", "emp-ria", "emp-tricia", "emp-vishala", "emp-andre"];

export const STAFF_UPDATES: StaffUpdate[] = [
  {
    id: "su-leave-reminder",
    subject: "Reminder: Christmas leave requests open tomorrow",
    summary: "Requests open Wednesday 4 November, in the portal under Leave.",
    body: [
      "Christmas leave requests open tomorrow, Wednesday 4 November, in the staff portal under Leave.",
      "Each store decides requests in the order they arrive. You will hear back within a week.",
    ],
    needsAck: false,
    audience: { branches: null, teams: null },
    status: "scheduled",
    scheduledFor: "2026-11-03T08:00:00-04:00",
    reads: [],
    acks: [],
    createdBy: "emp-devon",
    createdAt: "2026-10-28T11:15:00-04:00",
    testSends: [{ at: "2026-10-28T11:20:00-04:00", to: "faith@sfb.example" }],
  },
  {
    id: "su-ptown-bakery",
    subject: "Princes Town: bakery deep clean, Saturday 7 November",
    summary: "The bakery closes at 2 pm that day. The cake counter stays open.",
    body: [
      "The Princes Town bakery closes at 2 pm on Saturday 7 November for a deep clean.",
      "Bakery staff on the late shift help with the clean and are paid as normal. The cake counter stays open with what is already baked.",
    ],
    needsAck: false,
    audience: { branches: ["ptown"], teams: null },
    status: "draft",
    reads: [],
    acks: [],
    createdBy: "emp-marsha",
    createdAt: "2026-10-28T15:40:00-04:00",
    testSends: [],
  },
  {
    id: "su-october",
    subject: "Staff update, October: Christmas leave and badge renewals",
    summary: "Christmas leave requests open 4 November. Check the date on your Food Handler’s Badge.",
    body: [
      "Christmas leave requests open on Wednesday 4 November, in the staff portal under Leave. Each store decides requests in the order they arrive, and you will hear back within a week.",
      "If you handle food, check the expiry date on your Food Handler’s Badge under Documents & training. If it ends before 31 December, book your renewal now. HR covers the time for the course.",
      "Questions about any of this go to Faith in HR.",
    ],
    needsAck: false,
    audience: { branches: null, teams: null },
    status: "sent",
    sentAt: "2026-10-26T08:00:00-04:00",
    sentBy: "emp-devon",
    recipientIds: EVERYONE,
    reads: [
      { employeeId: "emp-devon", at: "2026-10-26T08:05:00-04:00" },
      { employeeId: "emp-vishala", at: "2026-10-26T09:12:00-04:00" },
      { employeeId: "emp-marsha", at: "2026-10-26T13:30:00-04:00" },
      { employeeId: "emp-ria", at: "2026-10-27T07:48:00-04:00" },
    ],
    acks: [],
    createdBy: "emp-devon",
    createdAt: "2026-10-23T14:00:00-04:00",
    testSends: [{ at: "2026-10-23T14:10:00-04:00", to: "faith@sfb.example" }],
  },
  {
    id: "su-till-codes",
    subject: "New at the till: checking members’ codes",
    summary: "How to check a shopper’s code, and what to say if it is refused. Please confirm you have read it.",
    body: [
      "Shoppers can now show a members’ code from their phone. Use Check a code in your staff portal: type the code, press Check and record, and record it only once the item is rung up.",
      "If a code is refused, the screen says why: already used, ended, or for another store. Tell the shopper the reason in those words, and show them the stores and dates on their offer. Do not ring the discount in by hand.",
      "Five wrong tries in ten minutes pause the check on that till for five minutes. Call your supervisor if that happens.",
    ],
    needsAck: true,
    audience: { branches: null, teams: ["Checkout"] },
    status: "sent",
    sentAt: "2026-10-21T07:30:00-04:00",
    sentBy: "emp-vishala",
    recipientIds: ["emp-keisha"],
    reads: [{ employeeId: "emp-keisha", at: "2026-10-21T12:02:00-04:00" }],
    acks: [],
    createdBy: "emp-vishala",
    createdAt: "2026-10-20T16:00:00-04:00",
    testSends: [],
  },
];
