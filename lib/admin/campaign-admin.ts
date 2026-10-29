import { TOPICS, saveCampaign, scheduleCampaign, sendNow, sendTest, type CampaignDraft } from "@/lib/newsletter";
import { byId, load } from "@/lib/store";
import type { Campaign, Session } from "@/lib/types";
import { assertInScope } from "./guard";
import type { Errors } from "./helpers";
import { fromTtInput } from "./tt";

/* The office console's side of the newsletter (lib/newsletter.ts holds the rules): the composer's values and checks,
   and the store-scope check for someone whose access covers some stores only. */

export const TEMPLATE_LABEL: Record<Campaign["template"], string> = {
  "weekly-specials": "This week’s specials",
  offer: "A members’ offer",
  "store-news": "Store news",
};

export const CAMPAIGN_STATE: Record<Campaign["status"], { label: string; tone: "info" | "ok" | "plain" }> = {
  draft: { label: "Draft", tone: "plain" },
  scheduled: { label: "Scheduled", tone: "info" },
  sent: { label: "Sent", tone: "ok" },
};

export type CampaignValues = {
  subject: string;
  preheader: string;
  template: Campaign["template"];
  intro: string;
  specialIds: string[];
  promoId: string;
  allStores: boolean;
  branches: string[];
  topics: string[];
};

export const CAMPAIGN_FIELDS = ["subject", "preheader", "intro", "specials", "promo", "stores"] as const;
export type CampaignField = (typeof CAMPAIGN_FIELDS)[number];

export function blankCampaign(scope: string[] | null): CampaignValues {
  return {
    subject: "",
    preheader: "",
    template: "weekly-specials",
    intro: "",
    specialIds: [],
    promoId: "",
    allStores: !scope,
    branches: scope ? [...scope] : [],
    topics: ["weekly-specials"],
  };
}

export function campaignValues(c: Campaign): CampaignValues {
  return {
    subject: c.subject,
    preheader: c.preheader,
    template: c.template,
    intro: c.intro,
    specialIds: [...c.specialIds],
    promoId: c.promoId || "",
    allStores: !c.segment.branches,
    branches: c.segment.branches ? [...c.segment.branches] : [],
    topics: [...c.segment.topics],
  };
}

const clean = (v: string) => v.trim().replace(/\s+/g, " ");

export function checkCampaign(v: CampaignValues, scope: string[] | null) {
  const e: Errors<CampaignField> = {};
  const subject = clean(v.subject), pre = clean(v.preheader), intro = v.intro.trim();
  if (!subject) e.subject = "Write a subject line, for example “This week: cut veg packs from TT$11.95”.";
  else if (subject.length > 90) e.subject = "Keep the subject to 90 characters or fewer (now " + subject.length + "). Phones cut long ones off.";
  if (pre.length > 120) e.preheader = "Keep the preview line to 120 characters or fewer (now " + pre.length + ").";
  if (!intro) e.intro = "Write a few lines to open the e-mail.";
  else if (intro.length > 600) e.intro = "Keep the opening to 600 characters or fewer (now " + intro.length + ").";
  if (v.template === "weekly-specials" && !v.specialIds.length) e.specials = "Pick at least one special for a weekly specials e-mail.";
  if (v.specialIds.length > 8) e.specials = "Pick eight specials or fewer, so the e-mail stays short.";
  if (v.template === "offer" && !v.promoId) e.promo = "Pick the offer this e-mail is about.";
  if (!v.allStores && !v.branches.length) e.stores = "Choose at least one store, or every store.";
  else if (scope && (v.allStores || v.branches.some((id) => !scope.includes(id)))) e.stores = "Your access covers some stores only. Choose from those.";
  return e;
}

export function campaignDraft(v: CampaignValues): CampaignDraft {
  const topics = TOPICS.map((t) => t.id as string).filter((id) => v.topics.includes(id));
  return {
    subject: clean(v.subject),
    preheader: clean(v.preheader),
    template: v.template,
    intro: v.intro.trim(),
    specialIds: [...v.specialIds],
    promoId: v.promoId || undefined,
    segment: { branches: v.allStores ? null : [...v.branches], topics },
  };
}

/** A schedule field's value as an instant, or the reason it cannot be used. */
export function checkSendTime(v: string, now: number): { at: string } | { error: string } {
  const at = fromTtInput(v);
  if (!at) return { error: "Choose the date and the time, in Trinidad time." };
  if (new Date(at).getTime() <= now + 60000) return { error: "That time has passed. Choose a time later than now." };
  return { at };
}

const OUTSIDE = "This newsletter goes to other stores' shoppers too.";

function scopedCampaign(s: Session | null, id: string) {
  const d = load();
  const c = byId(d.campaigns, id);
  if (c) assertInScope(d, s, c.segment.branches, OUTSIDE);
}

export function saveCampaignScoped(s: Session | null, id: string | null, draft: CampaignDraft) {
  if (id) scopedCampaign(s, id);
  assertInScope(load(), s, draft.segment.branches, "A newsletter for every store is outside it.");
  return saveCampaign(s, id, draft);
}

export function sendTestScoped(s: Session | null, id: string) {
  scopedCampaign(s, id);
  return sendTest(s, id);
}

export function scheduleScoped(s: Session | null, id: string, at: string | null) {
  scopedCampaign(s, id);
  scheduleCampaign(s, id, at);
}

export function sendNowScoped(s: Session | null, id: string) {
  scopedCampaign(s, id);
  return sendNow(s, id);
}
