import { claimsFor, promoState, type PromoDraft, type PromoState } from "@/lib/promo";
import type { Promotion, Seed } from "@/lib/types";
import type { Errors } from "./helpers";
import { fromTtInput, toTtInput } from "./tt";

/* The office console's side of the promotion workflow (lib/promo.ts holds the rules). This file adds what the
   composer needs: its field values and the checks with their messages. The store-scope rules for a grant that
   covers some stores only are in lib/promo.ts, so no screen can skip them. */

export type PromoValues = {
  title: string;
  benefit: string;
  summary: string;
  terms: string[];
  kind: Promotion["kind"];
  img: string;
  alt: string;
  allStores: boolean;
  branchIds: string[];
  starts: string;
  ends: string;
  perCustomer: string;
  total: string;
};

export const PROMO_FIELDS = ["title", "benefit", "summary", "terms", "alt", "stores", "starts", "ends", "perCustomer", "total"] as const;
export type PromoField = (typeof PROMO_FIELDS)[number];

export const KIND_LABEL: Record<Promotion["kind"], string> = {
  "member-code": "Members’ code",
  flash: "Flash sale",
};

export function blankPromo(scope: string[] | null): PromoValues {
  return {
    title: "",
    benefit: "",
    summary: "",
    terms: ["One code per shopper.", "Show the code at the till before you pay. The cashier checks it and records it."],
    kind: "member-code",
    img: "",
    alt: "",
    allStores: !scope,
    branchIds: scope ? [...scope] : [],
    starts: "",
    ends: "",
    perCustomer: "1",
    total: "",
  };
}

export function valuesOf(p: Promotion): PromoValues {
  return {
    title: p.title,
    benefit: p.benefit,
    summary: p.summary,
    terms: p.terms.length ? [...p.terms] : [""],
    kind: p.kind,
    img: p.img || "",
    alt: p.alt || "",
    allStores: !p.branchIds,
    branchIds: p.branchIds ? [...p.branchIds] : [],
    starts: toTtInput(p.starts),
    ends: toTtInput(p.ends),
    perCustomer: String(p.limits.perCustomer),
    total: p.limits.total === null ? "" : String(p.limits.total),
  };
}

const clean = (v: string) => v.trim().replace(/\s+/g, " ");

/** The checks, in form order. `claimed` is how many codes are already out, so a total cannot drop below it. */
export function checkPromo(v: PromoValues, scope: string[] | null, claimed: number, now: number) {
  const e: Errors<PromoField> = {};
  const title = clean(v.title), benefit = clean(v.benefit), summary = clean(v.summary);
  const terms = v.terms.map(clean).filter(Boolean);
  if (!title) e.title = "Give the offer a short name, for example “Christmas shop”.";
  else if (title.length > 60) e.title = "Keep the name to 60 characters or fewer (now " + title.length + ").";
  if (!benefit) e.benefit = "Say what the shopper gets, for example “TT$30 off a shop of TT$300 or more”.";
  else if (benefit.length > 80) e.benefit = "Keep it to 80 characters or fewer (now " + benefit.length + ").";
  if (!summary) e.summary = "Add one line on who it is for and where, for example “At the pharmacy counter, for signed-in shoppers”.";
  else if (summary.length > 160) e.summary = "Keep the summary to 160 characters or fewer (now " + summary.length + ").";
  if (!terms.length) e.terms = "Add at least one term, for example “One code per shopper.”";
  else if (terms.some((t) => t.length > 140)) e.terms = "Keep each term to 140 characters or fewer.";
  if (v.img && !clean(v.alt)) e.alt = "Describe the photo in a few words for people who use screen readers.";
  if (!v.allStores && !v.branchIds.length) e.stores = "Choose at least one store, or every store.";
  else if (scope && (v.allStores || v.branchIds.some((id) => !scope.includes(id)))) e.stores = "Your access covers some stores only. Choose from those.";
  const starts = fromTtInput(v.starts), ends = fromTtInput(v.ends);
  if (!starts) e.starts = "Choose the date and time the offer starts.";
  if (!ends) e.ends = "Choose the date and time the offer ends.";
  else if (starts && new Date(ends).getTime() <= new Date(starts).getTime()) e.ends = "The end has to be after the start.";
  else if (new Date(ends).getTime() <= now) e.ends = "That end time has passed. Choose a later one.";
  const per = Number(v.perCustomer);
  if (!/^\d+$/.test(v.perCustomer.trim()) || per < 1 || per > 10) e.perCustomer = "Enter a whole number from 1 to 10.";
  const totalRaw = v.total.trim();
  if (totalRaw) {
    const total = Number(totalRaw);
    if (!/^\d+$/.test(totalRaw) || total < 1) e.total = "Enter a whole number above 0, or leave it empty for no limit.";
    else if (total > 100000) e.total = "Enter 100,000 or fewer.";
    else if (!e.perCustomer && total < per) e.total = "The total cannot be smaller than the limit per shopper.";
    else if (total < claimed) e.total = claimed + " codes are already claimed, so the total cannot go below that.";
  }
  return e;
}

/** The draft savePromo() takes. Keeps the stored slug when editing, so the offer's link does not change. */
export function draftOf(v: PromoValues, slug: string): PromoDraft {
  const draft: PromoDraft = {
    slug,
    title: clean(v.title),
    benefit: clean(v.benefit),
    summary: clean(v.summary),
    terms: v.terms.map(clean).filter(Boolean),
    kind: v.kind,
    branchIds: v.allStores ? null : [...v.branchIds],
    starts: fromTtInput(v.starts) || "",
    ends: fromTtInput(v.ends) || "",
    limits: { perCustomer: Number(v.perCustomer), total: v.total.trim() ? Number(v.total) : null },
  };
  if (v.img) {
    draft.img = v.img;
    draft.alt = clean(v.alt);
  }
  return draft;
}

/** The order the list shows: what needs a decision first, archived last. */
const ORDER: PromoState[] = ["review", "rejected", "draft", "live", "full", "scheduled", "ended", "archived"];

export function sortedPromos(d: Seed, now: Date) {
  return (d.promotions || [])
    .map((p) => ({ p, state: promoState(d, p, now) }))
    .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state) || b.p.starts.localeCompare(a.p.starts));
}

export function claimedCount(d: Seed, id: string) {
  return claimsFor(d, id).length;
}
