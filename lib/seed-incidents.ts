import type { Incident } from "./types";

// Demo incidents for the office console's Today queue (Gregg, 16 Nov 2026: "a water leak in the warehouse can be a
// very critical one"). Invented, like every person, job and order in the demo. They join as their own tier
// (lib/private.ts), so a browser that already holds the staff demo picks them up without losing its edits.
export const INCIDENTS: Incident[] = [
  {
    id: "inc-ptown-leak",
    branchId: "ptown",
    title: "Water leak in the Princes Town warehouse",
    detail: "Water is coming through the roof over the dry-goods racks; Andre has moved the flour and rice off the floor. A plumber has not been called yet.",
    level: "critical",
    reportedAt: "2026-11-16T07:40:00-04:00",
    reportedBy: "emp-andre",
    status: "open",
  },
  {
    id: "inc-couva-freezer",
    branchId: "couva",
    title: "Freezer 3 at Couva is running warm",
    detail: "It is holding at -12 °C instead of -18 °C. The engineer is booked for tomorrow morning; ice cream has gone to freezer 2.",
    level: "urgent",
    reportedAt: "2026-11-16T09:15:00-04:00",
    reportedBy: "emp-keisha",
    status: "open",
  },
];
