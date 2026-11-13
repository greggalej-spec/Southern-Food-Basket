import { assertCan } from "@/lib/access";
import { audit, byId, nowIso, uid, update } from "@/lib/store";
import type { MetricWeek, PlanItem, Platform, Seed, Session, SocialPost } from "@/lib/types";

/* Marketing analytics. In the prototype the figures are seeded (lib/seed-ops.ts) and labelled as demo; in production
   a nightly job pulls each connected account's own figures and stores one row per post and per week, so this file
   stays the same: it only adds up what is stored. Nothing here reads the clock: "the last four weeks" means the four
   newest weeks in the data. */

export const PLATFORM: Record<Platform, { name: string; noun: string }> = {
  instagram: { name: "Instagram", noun: "post" },
  tiktok: { name: "TikTok", noun: "video" },
  facebook: { name: "Facebook", noun: "post" },
  website: { name: "Website", noun: "page" },
};
/** Fixed order: colour follows the platform, never its rank (components/admin/chart.tsx). */
export const PLATFORMS: Platform[] = ["instagram", "facebook", "website", "tiktok"];

export const engagement = (p: SocialPost) => p.likes + p.comments + p.shares + p.saves;
export const engagementRate = (p: SocialPost) => (p.reach ? engagement(p) / p.reach : 0);

export function weeks(d: Seed) {
  return Array.from(new Set((d.socialWeeks || []).map((w) => w.week))).sort();
}

/** The accounts whose figures may be shown: connected ones only. */
export function connected(d: Seed) {
  return new Set((d.socialAccounts || []).filter((a) => a.connected).map((a) => a.id));
}

export type Totals = { reach: number; engagements: number; followers: number; visits: number };

function sum(rows: MetricWeek[], on: Set<Platform>, weekSet: string[], lastWeek: string | undefined): Totals {
  const inRange = rows.filter((r) => weekSet.includes(r.week) && on.has(r.platform));
  const social = inRange.filter((r) => r.platform !== "website");
  return {
    reach: social.reduce((n, r) => n + r.reach, 0),
    engagements: social.reduce((n, r) => n + r.engagements, 0),
    followers: rows.filter((r) => r.week === lastWeek && on.has(r.platform) && r.platform !== "website").reduce((n, r) => n + r.followers, 0),
    visits: inRange.filter((r) => r.platform === "website").reduce((n, r) => n + r.reach, 0),
  };
}

/** The newest `span` weeks against the `span` before them. */
export function compare(d: Seed, span: number) {
  const all = weeks(d), on = connected(d);
  const now = all.slice(-span), before = all.slice(-2 * span, -span);
  return { now: sum(d.socialWeeks || [], on, now, now[now.length - 1]), before: sum(d.socialWeeks || [], on, before, before[before.length - 1]), weeks: now, from: now[0], to: now[now.length - 1], complete: before.length === now.length };
}

/** The change on the period before, or null when there is no full period before to compare with. */
export const change = (now: number, before: number, complete = true) => (complete && before ? (now - before) / before : null);

/** One line per connected platform for the trend chart: reach (visitors, for the website) per week. */
export function series(d: Seed, span: number) {
  const all = weeks(d).slice(-span), on = connected(d);
  return PLATFORMS.filter((p) => on.has(p)).map((platform) => ({
    platform,
    points: all.map((week) => (d.socialWeeks || []).find((r) => r.week === week && r.platform === platform)?.reach ?? 0),
  }));
}

export type PostSort = "views" | "reach" | "engagement" | "rate" | "clicks";

export function topPosts(d: Seed, opts: { platform: Platform | "all"; kind: string; sort: PostSort; since?: string }) {
  const on = connected(d);
  const score = (p: SocialPost) => (opts.sort === "engagement" ? engagement(p) : opts.sort === "rate" ? engagementRate(p) : opts.sort === "views" ? p.views || p.reach : p[opts.sort]);
  return (d.socialPosts || [])
    .filter((p) => on.has(p.platform) && (opts.platform === "all" || p.platform === opts.platform) && (opts.kind === "all" || p.kind === opts.kind) && (!opts.since || p.postedAt.slice(0, 10) >= opts.since))
    .sort((a, b) => score(b) - score(a));
}

/** What the figures say in plain words, worked out from the posts on screen. */
export function insights(d: Seed, since?: string) {
  const posts = topPosts(d, { platform: "all", kind: "all", sort: "reach", since });
  const out: string[] = [];
  if (!posts.length) return out;
  const avg = (list: SocialPost[], f: (p: SocialPost) => number) => (list.length ? list.reduce((n, p) => n + f(p), 0) / list.length : 0);
  const video = posts.filter((p) => p.kind === "Video"), still = posts.filter((p) => p.kind !== "Video");
  if (video.length && still.length) {
    const ratio = avg(video, (p) => p.reach) / (avg(still, (p) => p.reach) || 1);
    if (ratio >= 1.2) out.push("Videos reach " + ratio.toFixed(1) + " times as many people as photos and carousels.");
    else if (ratio <= 0.8) out.push("Photos and carousels reach more people than videos right now.");
  }
  const best = posts[0];
  out.push("The furthest-reaching post was “" + best.title + "” on " + PLATFORM[best.platform].name + ": " + best.reach.toLocaleString("en-US") + " people.");
  const clicks = posts.slice().sort((a, b) => b.clicks - a.clicks)[0];
  if (clicks && clicks.clicks && clicks.id !== best.id) out.push("“" + clicks.title + "” sent the most people to the website: " + clicks.clicks.toLocaleString("en-US") + " taps.");
  const store = posts.filter((p) => p.branchId), general = posts.filter((p) => !p.branchId);
  if (store.length >= 2 && general.length >= 2) {
    const r = avg(store, engagementRate) / (avg(general, engagementRate) || 1);
    if (r >= 1.15) out.push("Posts filmed in a named store get " + Math.round((r - 1) * 100) + "% more engagement than general ones.");
  }
  return out;
}

/* ---------- writes ---------- */

export function setConnected(s: Session | null, platform: Platform, on: boolean) {
  update((d) => {
    assertCan(d, s, "social.connect");
    const a = byId(d.socialAccounts, platform);
    if (!a) return;
    a.connected = on;
    a.connectedAt = on ? nowIso() : undefined;
    a.connectedBy = on ? s?.userId || "" : undefined;
    audit(d, s, on ? "social.connect" : "social.disconnect", a.name, on ? "Connected the account (read-only)" : "Disconnected the account");
  });
}

export type PlanForm = Pick<PlanItem, "date" | "platforms" | "title" | "kind" | "status" | "note">;

export function savePlanItem(s: Session | null, id: string | null, form: PlanForm) {
  update((d) => {
    assertCan(d, s, "plan.edit");
    const cur = id ? byId(d.plan, id) : null;
    if (cur) Object.assign(cur, form);
    else d.plan = [...(d.plan || []), { id: uid("pl"), owner: s?.userId || "", ...form }];
    audit(d, s, "plan.save", form.title, cur ? "Changed the calendar entry" : "Added to the content calendar for " + form.date);
  });
}

export function removePlanItem(s: Session | null, id: string) {
  update((d) => {
    assertCan(d, s, "plan.edit");
    const cur = byId(d.plan, id);
    d.plan = (d.plan || []).filter((x) => x.id !== id);
    if (cur) audit(d, s, "plan.remove", cur.title, "Removed from the content calendar");
  });
}
