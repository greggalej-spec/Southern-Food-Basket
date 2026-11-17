import type { VatCode } from "@/lib/types";

/* The Deliveries terms and constants, kept apart from lib/ops/deliveries.ts (which reads the browser store) so the
   server-rendered /deliveries page can print them. */

/* ---------- the terms (PROPOSED for the directors to confirm; the public page and the documents read them here) ---------- */

/** Who the documents come from. The legal name is from the Dun & Bradstreet profile (SITE.md); the VAT registration
 *  number is not public, so the documents say it is to be added until accounts supply it. */
export const SUPPLIER = { name: "Southern Food Basket Limited", store: "Couva", address: "696 Southern Main Road, Couva", vatNo: "" };
/** Trinidad and Tobago's standard VAT rate (IRD, ird.gov.tt/VAT). */
export const VAT_RATE = 0.125;
export const VAT: Record<VatCode, { label: string; short: string; rate: number }> = {
  S: { label: "VAT 12.5%", short: "12.5%", rate: VAT_RATE },
  Z: { label: "Zero-rated", short: "0%", rate: 0 },
  E: { label: "Exempt", short: "Exempt", rate: 0 },
};
export const REPLY_HOURS = 24;
export const QUOTE_DAYS = 7;
export const CLAIM_HOURS = 24;
export const PAY_DAYS = [0, 7, 15, 30];
export const payText = (days: number) => (days ? days + " days from the invoice date" : "on delivery or collection");

/** Delivery areas from Couva. DEMO fees: the directors set the real ones (the meeting: "based on the geographical
 *  location", enough for the driver, fuel and van, "but not too exorbitant"). null = quoted case by case. */
export const ZONES: { id: string; label: string; fee: number | null }[] = [
  { id: "lisas", label: "Point Lisas Industrial Estate", fee: 40 },
  { id: "couva", label: "Couva, California or Preysal", fee: 50 },
  { id: "other", label: "Somewhere else", fee: null },
];
export const zoneLabel = (id: string | undefined) => ZONES.find((z) => z.id === id)?.label || "Not given";
