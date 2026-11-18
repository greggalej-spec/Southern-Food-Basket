import type { DeliveryForm } from "@/lib/ops/deliveries";
import type { FileMeta } from "@/lib/types";

/* Pieces the order steps (delivery-order.tsx) and "Your order" (deliveries.tsx) both use. */

/** The delivery, invoice and payment details a customer fills in, apart from the list itself. */
export type DetailsForm = Omit<DeliveryForm, "lines" | "list" | "billing"> & { billName: string; billAddress: string; billEmail: string; billSame: boolean };
export const EMPTY_DETAILS: DetailsForm = { company: "", contact: "", phone: "", email: "", fulfil: "delivery", zone: "lisas", address: "", wantedBy: undefined, swaps: true, notes: "", site: "", payment: "account", billName: "", billAddress: "", billEmail: "", billSame: true };

/** "Order the same again" on a customer's order refills the order steps through this event. */
export const REORDER_EVENT = "sfb-reorder";
export type Reorder = { form: Partial<DetailsForm>; lines: DeliveryForm["lines"] };

export const MAX_FILE = 10 * 1024 * 1024;
export const LIST_TYPES = ".pdf,.jpg,.jpeg,.png,.heic,.xlsx,.xls,.csv,.doc,.docx";
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A picked file's name, size and type; the file itself stays on the device in this prototype. */
export function fileMeta(f: File | undefined | null): FileMeta | undefined {
  return f ? { fileName: f.name, size: f.size, type: f.type || "application/octet-stream" } : undefined;
}
