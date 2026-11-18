import { money } from "./format";
import { itemOfLine } from "./ops/delivery-catalogue";
import { sums } from "./ops/deliveries";
import { person } from "./seed-ops";
import type { DeliveryLine, DeliveryOrder, Employee, Grant, VatCode } from "./types";

/* The Couva deliveries trial (staff meeting, 17 Nov 2026): the supervisor who looks after it, his access, and a week of
   orders at every step. Its own tier, so a browser that saved the staff demo earlier picks it up without a reset.
   Narindra's first name, his role (Supervisor) and his store come from the meeting; his start date and number are
   demo stand-ins. The companies, contacts, lists, prices, VAT codes, purchase orders and invoices are DEMO: invented
   for the prototype (the VAT code of a real line comes from the till). */

export const NARINDRA: Employee = person("emp-narindra", "Narindra", "Supervisor", "Management", "couva", "2026-08-24", 491);

export const NARINDRA_GRANTS: Grant[] = [
  { id: "g-narindra", userId: "emp-narindra", role: "employee", branchIds: ["couva"], extra: ["deliveries.handle"], grantedBy: "emp-vishala", grantedAt: "2026-11-17T08:00:00-04:00" },
];

const N = "emp-narindra";
const PICKER = "emp-kiran";
const t = (day: string, time: string) => "2026-11-" + day + "T" + time + ":00-04:00";
let n = 0;
const line = (item: string, size: string, qty: number, unit: DeliveryLine["unit"], price?: number | null, vat: VatCode = "S", more: Partial<DeliveryLine> = {}): DeliveryLine => ({
  id: "dl-seed-" + ++n, item, size, qty, unit, ...(itemOfLine({ item }) ? { sku: itemOfLine({ item })!.id } : {}), ...(price !== undefined ? { price, vat: price === null ? undefined : vat } : {}), ...more,
});
const note = (at: string, text: string, by = N) => ({ at, by, kind: "internal" as const, text });
const done = { picked: true, checked: true };

const ORDERS: DeliveryOrder[] = [
  {
    id: "dv-0007", ref: "DL-0007", company: "Savonetta Process Services Ltd", contact: "Renee Baptiste, Office Administrator", phone: "(868) 000-0701", email: "admin@savonettaprocess.example",
    via: "Website", branchId: "couva", receivedAt: t("17", "14:10"), fulfil: "delivery", zone: "lisas", address: "Building 4, Savonetta Boulevard, Point Lisas Industrial Estate", wantedBy: "2026-11-20",
    swaps: true, payment: "account", site: "Security hut at the front gate; the driver shows ID and signs in. Receiving 8 am to 3 pm.",
    billing: { name: "Savonetta Process Services Limited", address: "Building 4, Savonetta Boulevard, Point Lisas Industrial Estate, Couva", email: "accounts@savonettaprocess.example" },
    list: { fileName: "office-pantry-november.xlsx", size: 18400, type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    lines: [line("Instant coffee", "200 g jar", 6, "each"), line("Tea bags", "100 bags", 4, "pack"), line("Brown sugar", "2 kg", 4, "each"), line("Coffee creamer", "1 kg", 3, "each"), line("Bottled water", "500 ml × 24", 10, "case"), line("Paper cups", "8 oz × 50", 6, "pack")],
    status: "new", owner: N, messages: [],
  },
  {
    id: "dv-0006", ref: "DL-0006", company: "Harbour Point Coatings Ltd", contact: "Dwayne Ali, Stores Supervisor", phone: "(868) 000-0702", email: "stores@harbourpointcoatings.example",
    via: "WhatsApp", branchId: "couva", receivedAt: t("17", "09:30"), fulfil: "collect", swaps: false, payment: "card", notes: "They will send a driver to collect.",
    billing: { name: "Harbour Point Coatings Limited", address: "Factory Road, Couva", email: "stores@harbourpointcoatings.example" },
    lines: [line("Dish soap", "1 L", 6, "each"), line("Garbage bags", "30 large", 4, "pack"), line("Paper towels", "6 rolls", 5, "pack"), line("Bleach", "3.8 L", 4, "each"), line("Hand soap", "500 ml", 8, "each")],
    status: "new", owner: N, messages: [note(t("17", "09:34"), "Came by WhatsApp to the Couva phone. Typed in from his message.")],
  },
  {
    id: "dv-0005", ref: "DL-0005", company: "Gulf View Logistics Ltd", contact: "Anika Ramsaran, HR and Admin", phone: "(868) 000-0703", email: "admin@gulfviewlogistics.example",
    via: "Website", branchId: "couva", receivedAt: t("15", "10:05"), fulfil: "delivery", zone: "couva", address: "12 Camden Road, Couva", wantedBy: "2026-11-21", swaps: true, payment: "account",
    billing: { name: "Gulf View Logistics Limited", address: "12 Camden Road, Couva", email: "payables@gulfviewlogistics.example" },
    lines: [line("Instant coffee", "200 g jar", 4, "each", 43.5), line("White sugar", "2 kg", 3, "each", 17.95, "Z"), line("Juice", "250 ml boxes × 24", 3, "case", 60.4), line("Biscuits", "family pack", 10, "pack", null, "S", { swap: "the 400 g assorted tin at TTD 31.05 before VAT" })],
    status: "quoted", owner: N, quote: { at: t("16", "11:20"), by: N, fee: 50, feeVat: "S", validUntil: "2026-11-23", payDays: 30 },
    messages: [],
  },
  {
    id: "dv-0004", ref: "DL-0004", company: "Lisas Bay Fabrication Ltd", contact: "Kevon Charles, Site Office", phone: "(868) 000-0704", email: "office@lisasbayfab.example",
    via: "E-mail", branchId: "couva", receivedAt: t("13", "08:45"), fulfil: "collect", swaps: true, payment: "account",
    billing: { name: "Lisas Bay Fabrication Limited", address: "Lot 12, Point Lisas Industrial Estate, Couva", email: "ap@lisasbayfab.example" },
    lines: [line("Bottled water", "500 ml × 24", 20, "case", 37.35), line("Soft drinks", "355 ml cans × 24", 4, "case", 84.45), line("Paper cups", "8 oz × 50", 10, "pack", 19.55)],
    status: "accepted", owner: N, quote: { at: t("13", "15:10"), by: N, fee: 0, feeVat: "S", validUntil: "2026-11-20", payDays: 30 },
    po: { number: "LBF-PO-0932", at: t("16", "09:00"), via: "E-mail", file: { fileName: "LBF-PO-0932.pdf", size: 96000, type: "application/pdf" } },
    messages: [note(t("16", "09:05"), "Purchase order LBF-PO-0932 received by e-mail.")],
  },
  {
    id: "dv-0003", ref: "DL-0003", company: "Isle Steel Fabricators Ltd", contact: "Marsha Gopaul, Accounts", phone: "(868) 000-0705", email: "accounts@islesteelfab.example",
    via: "Website", branchId: "couva", receivedAt: t("12", "13:30"), fulfil: "delivery", zone: "lisas", address: "Rivulet Road, Point Lisas Industrial Estate", swaps: true, payment: "account",
    site: "Main gate on Rivulet Road. Safety boots and a hi-vis vest past the gate.",
    billing: { name: "Isle Steel Fabricators Limited", address: "Rivulet Road, Point Lisas Industrial Estate, Couva", email: "accounts@islesteelfab.example" },
    lines: [line("Instant coffee", "200 g jar", 3, "each", 43.5, "S", { picked: true }), line("Tea bags", "100 bags", 2, "pack", 26.2, "S", { picked: true }), line("Coffee creamer", "1 kg", 2, "each", 46.2, "S", { picked: true }), line("Toilet paper", "12 rolls", 6, "pack", 51.55, "S", { picked: true, supplied: 4 })],
    status: "checking", owner: N, quote: { at: t("13", "10:15"), by: N, fee: 40, feeVat: "S", validUntil: "2026-11-20", payDays: 30 },
    po: { number: "ISF-7716", at: t("16", "14:30"), via: "Website", file: { fileName: "ISF-7716.pdf", size: 81000, type: "application/pdf" } },
    pickedBy: PICKER, pickedAt: t("17", "10:40"),
    messages: [
      { at: t("16", "14:30"), by: "requester", kind: "inbound", text: "Accepted the quote with purchase order ISF-7716 (ISF-7716.pdf)." },
      note(t("17", "08:30"), "Pick list given to Kiran Seepersad."),
      note(t("17", "10:40"), "Picked. Waiting for the check against the purchase order. Short: Toilet paper (4 of 6)."),
      { at: t("17", "10:42"), by: N, kind: "outbound", text: "We are short on part of DL-0003: 6 packs × Toilet paper, 12 rolls, we have 4. The rest is on its way, and your invoice will only charge what we deliver." },
    ],
  },
  {
    id: "dv-0002", ref: "DL-0002", company: "Caroni Bay Instrumentation Ltd", contact: "Joanne Persad, Office Manager", phone: "(868) 000-0706", email: "office@caronibayinst.example",
    via: "Website", branchId: "couva", receivedAt: t("11", "09:00"), fulfil: "delivery", zone: "lisas", address: "Atlantic Avenue, Point Lisas Industrial Estate", swaps: false, payment: "card",
    billing: { name: "Caroni Bay Instrumentation Limited", address: "Atlantic Avenue, Point Lisas Industrial Estate, Couva", email: "office@caronibayinst.example" },
    lines: [line("Bottled water", "500 ml × 24", 8, "case", 37.35, "S", done), line("Brown sugar", "2 kg", 2, "each", 16.5, "Z", done), line("Instant coffee", "200 g jar", 2, "each", 43.5, "S", done)],
    status: "ready", owner: N, quote: { at: t("11", "14:00"), by: N, fee: 40, feeVat: "S", validUntil: "2026-11-18", payDays: 0 }, po: { number: "CBI-4471", at: t("12", "10:20"), via: "E-mail" },
    pickedBy: PICKER, pickedAt: t("17", "08:10"), checkedBy: N, checkedAt: t("17", "08:35"), readyAt: t("17", "08:35"), handover: "Panel van, two staff (eight cases of water). Card machine on board.",
    messages: [note(t("12", "10:25"), "Purchase order CBI-4471 received by e-mail."), note(t("17", "08:35"), "Checked against purchase order CBI-4471, best-before dates included. Out for delivery.")],
  },
  {
    id: "dv-0001", ref: "DL-0001", company: "Orange Valley Marine Ltd", contact: "Shareef Khan, Operations", phone: "(868) 000-0707", email: "ops@orangevalleymarine.example",
    via: "Phone", branchId: "couva", receivedAt: t("10", "08:20"), fulfil: "delivery", zone: "couva", address: "Orange Valley Road, Couva", swaps: true, payment: "card",
    billing: { name: "Orange Valley Marine Limited", address: "Orange Valley Road, Couva", email: "ops@orangevalleymarine.example" },
    lines: [line("Instant coffee", "200 g jar", 2, "each", 43.5, "S", done), line("White sugar", "2 kg", 2, "each", 17.95, "Z", done), line("Dish soap", "1 L", 3, "each", 22.2, "S", done), line("Garbage bags", "30 large", 2, "pack", 28.45, "S", done)],
    status: "done", owner: N, quote: { at: t("10", "13:30"), by: N, fee: 50, feeVat: "S", validUntil: "2026-11-17", payDays: 0 }, po: { number: "OVM-PO-1182", at: t("11", "08:00"), via: "E-mail" },
    pickedBy: PICKER, pickedAt: t("12", "09:30"), checkedBy: N, checkedAt: t("12", "09:50"), readyAt: t("12", "09:50"), handover: "Panel van",
    doneAt: t("12", "11:15"), pod: { receivedBy: "Shareef Khan", at: t("12", "11:15"), paidByCard: true }, invoice: { no: "CV-INV-0001", at: t("12", "11:15"), due: "2026-11-12" },
    issue: { at: t("12", "15:40"), text: "One pack of garbage bags was split open in the box. Bags are fine but the pack is torn." },
    messages: [
      note(t("11", "08:05"), "Purchase order OVM-PO-1182 received by e-mail."),
      note(t("12", "11:15"), "Delivered, signed for by Shareef Khan. Tax invoice CV-INV-0001, paid by card."),
      { at: t("12", "15:40"), by: "requester", kind: "inbound", text: "Reported a problem: One pack of garbage bags was split open in the box. Bags are fine but the pack is torn." },
    ],
  },
];

/* The "Quote sent" line on each quoted order, worked out from its own lines so the thread always matches the sums. */
export const DELIVERIES: DeliveryOrder[] = ORDERS.map((o) => {
  if (!o.quote) return o;
  const q = sums(o);
  const sent = { at: o.quote.at, by: o.quote.by, kind: "outbound" as const, text: "Quote sent: " + money(q.total) + " including VAT" + (q.missing ? ", " + q.missing + " line" + (q.missing === 1 ? "" : "s") + " we cannot supply" : "") + "." };
  return { ...o, messages: [sent, ...o.messages].sort((a, b) => a.at.localeCompare(b.at)) };
});
