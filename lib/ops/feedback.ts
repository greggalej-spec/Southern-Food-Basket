import { assertCan } from "@/lib/access";
import { mail } from "@/lib/newsletter";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { FeedbackKind, FeedbackTicket, Seed, Session, Tone } from "@/lib/types";

/* Customer feedback. The button at the bottom right of every public page opens a short form: a compliment, a
   suggestion, a question, or a complaint about a visit or a purchase. Each one becomes a ticket in the office's
   Customer feedback section, with the same kind of thread the requests have: notes for staff, replies to the
   customer, and what the customer said back. Complaints are flagged so they are answered first. */

export const FB_KIND: Record<FeedbackKind, { label: string; hint: string }> = {
  compliment: { label: "Compliment", hint: "Something or someone we got right" },
  suggestion: { label: "Suggestion", hint: "An idea, or a product you would like us to stock" },
  question: { label: "Question", hint: "Something you want to know" },
  complaint: { label: "Complaint", hint: "A problem with a visit, a price or a purchase" },
};
export const FB_KINDS = Object.keys(FB_KIND) as FeedbackKind[];

export const FB_STATUS: Record<FeedbackTicket["status"], { label: string; tone: Tone }> = {
  new: { label: "New", tone: "warn" },
  "in-progress": { label: "Being handled", tone: "info" },
  resolved: { label: "Resolved", tone: "ok" },
};

function nextRef(d: Seed) {
  const max = (d.feedback || []).reduce((n, t) => Math.max(n, Number(String(t.ref).replace(/\D/g, "")) || 0), 230);
  return "FB-" + String(max + 1).padStart(4, "0");
}

export type FeedbackForm = Pick<FeedbackTicket, "kind" | "branchId" | "message" | "name" | "contact" | "wantsReply">;

/** The public form. No sign-in. Returns the reference the customer is shown. */
export function submitFeedback(form: FeedbackForm) {
  let ref = "";
  update((d) => {
    ref = nextRef(d);
    d.feedback = [{ id: uid("fb"), ref, receivedAt: nowIso(), status: "new", messages: [], ...form }, ...(d.feedback || [])];
    if (form.contact.includes("@")) {
      mail(d, { to: form.contact, kind: "transactional", subject: "Thank you for your feedback (" + ref + ")", body: ["We have your message and a member of our team will read it.", form.wantsReply ? "You asked for a reply. We aim to answer within two working days." : "You did not ask for a reply, so we will not write unless we need to check something.", "Reference: " + ref + "."] });
    }
    audit(d, null, "feedback.submit", ref, FB_KIND[form.kind].label + " sent through the website");
  });
  return ref;
}

function find(d: Seed, id: string) {
  const t = byId(d.feedback, id);
  if (!t) throw new Error("That ticket is no longer there.");
  return t;
}

export function setFeedbackStatus(s: Session | null, id: string, status: FeedbackTicket["status"], resolution?: string) {
  update((d) => {
    assertCan(d, s, "feedback.handle");
    const t = find(d, id);
    t.status = status;
    if (!t.assignedTo && s?.userId) t.assignedTo = s.userId;
    if (status === "resolved") {
      t.resolvedAt = nowIso();
      t.resolution = resolution || t.resolution;
    }
    t.messages.push({ at: nowIso(), by: s?.userId || "", kind: "internal", text: status === "resolved" ? "Resolved." + (resolution ? " " + resolution : "") : status === "in-progress" ? "Picked up." : "Reopened." });
    audit(d, s, "feedback.status", t.ref, "Marked " + FB_STATUS[status].label.toLowerCase());
  });
}

export function addFeedbackMessage(s: Session | null, id: string, kind: "internal" | "outbound" | "inbound", text: string) {
  update((d) => {
    assertCan(d, s, "feedback.handle");
    const t = find(d, id);
    t.messages.push({ at: nowIso(), by: kind === "inbound" ? "requester" : s?.userId || "", kind, text });
    if (t.status === "new") t.status = "in-progress";
    if (kind === "outbound" && t.contact.includes("@")) mail(d, { to: t.contact, kind: "transactional", subject: "About your feedback to Southern Food Basket (" + t.ref + ")", body: [text] });
    audit(d, s, "feedback.message", t.ref, kind === "internal" ? "Added a note" : kind === "outbound" ? "Replied to the customer" : "Recorded the customer's reply");
  });
}

export function assignFeedback(s: Session | null, id: string, who: string) {
  update((d) => {
    assertCan(d, s, "feedback.handle");
    const t = find(d, id);
    t.assignedTo = who || undefined;
    audit(d, s, "feedback.assign", t.ref, who ? "Given to " + (byId(d.employees, who)?.name || "someone") : "Left with nobody");
  });
}

export function feedbackCounts(d: Seed) {
  const list = d.feedback || [];
  const open = list.filter((t) => t.status !== "resolved");
  return { all: list.length, new: list.filter((t) => t.status === "new").length, handling: list.filter((t) => t.status === "in-progress").length, resolved: list.filter((t) => t.status === "resolved").length, complaints: open.filter((t) => t.kind === "complaint").length, wantsReply: open.filter((t) => t.wantsReply).length, compliments: list.filter((t) => t.kind === "compliment").length };
}
