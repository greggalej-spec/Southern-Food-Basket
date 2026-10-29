import { can, scopeOf, type Permission } from "@/lib/access";
import { audience } from "@/lib/newsletter";
import { approveBlock, lockedUntil, promoState } from "@/lib/promo";
import { byId } from "@/lib/store";
import type { Seed, Session } from "@/lib/types";
import { SOON_DAYS, grantState } from "./access-admin";
import { personName, storeNames } from "./guard";
import { canon, plural, type AdminTab } from "./helpers";
import { shippedData } from "./publish";
import { clockTT, dayTT, daysLeft, ttDay, whenTT } from "./tt";

/* The Today section's work queue: what needs this person's attention, worked out from their permissions. Each item
   is one sentence with a link straight to the thing. Decisions come first, then what is about to happen, then
   housekeeping. Nothing here writes. */

export type QueueTone = "warn" | "bad" | "info" | "ok" | "plain";

export type QueueItem = {
  key: string;
  area: string;
  tone: QueueTone;
  text: string;
  /** Someone else's words (a reviewer's note), shown as a quote under the sentence. */
  quote?: string;
  link: { label: string; tab: AdminTab; item?: string };
};

const DAY = 86400000;
/** A special older than this is worth a second look: specials carry the day they were posted, not an end date. */
export const STALE_DAYS = 28;

const quoted = (v: string) => "“" + v + "”";
const where = (d: Seed, ids: string[] | null) => (ids ? "at " + storeNames(d, ids) : "at every store");
const inDays = (n: number) => (n <= 0 ? "today" : n === 1 ? "tomorrow" : "in " + n + " days");

export function buildQueue(d: Seed, s: Session | null, now: number): QueueItem[] {
  const out: QueueItem[] = [];
  const has = (p: Permission) => can(d, s, p);
  const me = s?.userId || "";
  const scope = scopeOf(d, s);
  const atMyStores = (branchId: string) => !scope || scope.includes(branchId);
  const nowDate = new Date(now);
  const promos = (d.promotions || []).map((p) => ({ p, state: promoState(d, p, nowDate) }));

  /* 1. decisions */
  if (has("promos.approve")) {
    promos
      .filter((x) => x.state === "review")
      .forEach(({ p }) => {
        const block = approveBlock(d, s, p);
        const when = p.submittedAt ? " on " + dayTT(p.submittedAt) : "";
        if (!block) {
          out.push({
            key: "approve-" + p.id,
            area: "Offers",
            tone: "warn",
            text: personName(d, p.createdBy) + " sent " + quoted(p.title) + " for your approval" + when + ". It would run " + dayTT(p.starts) + " to " + dayTT(p.ends) + " " + where(d, p.branchIds) + ".",
            link: { label: "Review it", tab: "promos", item: p.id },
          });
        } else if (p.createdBy === me) {
          out.push({
            key: "own-review-" + p.id,
            area: "Offers",
            tone: "info",
            text: quoted(p.title) + " is waiting for approval" + when + ". You drafted it, so someone else in the owner's office approves it.",
            link: { label: "See it", tab: "promos", item: p.id },
          });
        }
      });
  }
  if (has("promos.draft")) {
    promos
      .filter((x) => x.p.createdBy === me)
      .forEach(({ p, state }) => {
        if (state === "rejected") {
          out.push({
            key: "rejected-" + p.id,
            area: "Offers",
            tone: "bad",
            text: "The owner's office sent " + quoted(p.title) + " back to you. Change it and send it again.",
            quote: p.reviewNote,
            link: { label: "Edit it", tab: "promos", item: p.id },
          });
        } else if (state === "draft") {
          out.push({
            key: "draft-" + p.id,
            area: "Offers",
            tone: "plain",
            text: quoted(p.title) + " is still a draft. Send it for approval when it is ready; it is meant to start " + dayTT(p.starts) + ".",
            link: { label: "Open the draft", tab: "promos", item: p.id },
          });
        } else if (state === "review" && !has("promos.approve")) {
          out.push({
            key: "review-" + p.id,
            area: "Offers",
            tone: "info",
            text: quoted(p.title) + " is with the owner's office for approval" + (p.submittedAt ? ", sent " + dayTT(p.submittedAt) : "") + ".",
            link: { label: "See it", tab: "promos", item: p.id },
          });
        }
      });
  }

  /* 2. what is about to happen */
  if (has("codes.view")) {
    const staff = Array.from(new Set((d.redemptions || []).filter((r) => atMyStores(r.branchId)).map((r) => r.by)));
    staff.forEach((id) => {
      const until = lockedUntil(d, id, now);
      if (!until) return;
      out.push({
        key: "lock-" + id,
        area: "Codes",
        tone: "bad",
        text: "Code checks for " + personName(d, id) + " are locked until " + clockTT(until) + ": five codes in ten minutes did not match. It unlocks by itself.",
        link: { label: "See the checks", tab: "codes" },
      });
    });
    const today = ttDay(now);
    const todays = (d.redemptions || []).filter((r) => ttDay(r.at) === today && atMyStores(r.branchId));
    const ok = todays.filter((r) => r.ok), refused = todays.length - ok.length;
    if (todays.length) {
      const byStore = new Map<string, number>();
      ok.forEach((r) => byStore.set(r.branchId, (byStore.get(r.branchId) || 0) + 1));
      const stores = Array.from(byStore, ([id, n]) => (byId(d.branches, id)?.name || "Another store") + " " + n).join(", ");
      out.push({
        key: "codes-today",
        area: "Codes",
        tone: refused ? "warn" : "ok",
        text:
          (ok.length ? plural(ok.length, "code was", "codes were") + " recorded at the tills today (" + stores + ")" : "No codes were recorded at the tills today") +
          (refused ? ", and " + plural(refused, "check was", "checks were") + " refused." : "."),
        link: { label: "See the checks", tab: "codes" },
      });
    }
  }
  if (has("promos.draft") || has("promos.approve") || has("codes.view")) {
    promos.forEach(({ p, state }) => {
      const left = daysLeft(p.ends, now);
      if (state === "live" && new Date(p.ends).getTime() - now < 7 * DAY) {
        out.push({
          key: "ending-" + p.id,
          area: "Offers",
          tone: "warn",
          text: quoted(p.title) + " ends " + inDays(left) + ", on " + whenTT(p.ends) + ". Codes stop working at the till after that.",
          link: { label: "See its codes", tab: "codes" },
        });
      } else if (state === "full") {
        out.push({
          key: "full-" + p.id,
          area: "Offers",
          tone: "warn",
          text: "All " + p.limits.total + " codes for " + quoted(p.title) + " are claimed, so shoppers can no longer get one. It runs until " + dayTT(p.ends) + ".",
          link: { label: "Open it", tab: "promos", item: p.id },
        });
      } else if (state === "scheduled" && new Date(p.starts).getTime() - now < 7 * DAY) {
        out.push({
          key: "starting-" + p.id,
          area: "Offers",
          tone: "info",
          text: quoted(p.title) + " starts " + inDays(daysLeft(p.starts, now)) + ", on " + whenTT(p.starts) + ".",
          link: { label: "Open it", tab: "promos", item: p.id },
        });
      }
    });
  }
  if (has("newsletter.view")) {
    const camps = d.campaigns || [];
    const next = camps
      .filter((c) => c.status === "scheduled" && c.scheduledFor)
      .sort((a, b) => String(a.scheduledFor).localeCompare(String(b.scheduledFor)))[0];
    if (next) {
      const n = audience(d, next.segment).length;
      out.push({
        key: "nl-next",
        area: "Newsletter",
        tone: n ? "info" : "warn",
        text:
          quoted(next.subject) + " goes out on " + whenTT(next.scheduledFor) + " Trinidad time, to " + plural(n, "confirmed subscriber") + "." +
          (n ? "" : " Nobody matches its stores and topics, so check the audience."),
        link: { label: "Check it", tab: "newsletter", item: next.id },
      });
    } else if (has("newsletter.compose")) {
      const last = camps.filter((c) => c.status === "sent" && c.sentAt).sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)))[0];
      out.push({
        key: "nl-none",
        area: "Newsletter",
        tone: "warn",
        text: "No newsletter is scheduled." + (last ? " The last one went out on " + dayTT(last.sentAt) + "." : " None has gone out yet."),
        link: { label: "Write one", tab: "newsletter" },
      });
    }
    if (has("newsletter.send")) {
      const drafts = camps.filter((c) => c.status === "draft");
      if (drafts.length) {
        out.push({
          key: "nl-drafts",
          area: "Newsletter",
          tone: "plain",
          text: (drafts.length === 1 ? quoted(drafts[0].subject) + " is a draft and not scheduled." : plural(drafts.length, "newsletter draft") + " are not scheduled yet."),
          link: { label: drafts.length === 1 ? "Open the draft" : "See the drafts", tab: "newsletter", item: drafts.length === 1 ? drafts[0].id : undefined },
        });
      }
    }
  }

  /* 3. housekeeping */
  if (has("specials.edit")) {
    const old = (d.specials || []).filter((sp) => now - new Date(sp.posted + "T00:00:00-04:00").getTime() > STALE_DAYS * DAY);
    if (old.length) {
      out.push({
        key: "stale-specials",
        area: "Specials",
        tone: "plain",
        text:
          plural(old.length, "special was", "specials were") + " posted more than four weeks ago. Check " + (old.length === 1 ? "it is" : "they are") + " still on offer, or take " + (old.length === 1 ? "it" : "them") + " off the Specials page.",
        link: { label: "Review specials", tab: "deals" },
      });
    }
  }
  if (has("site.publish")) {
    const shipped = shippedData();
    const changed = [
      { key: "specials", label: "specials" },
      { key: "branches", label: "store hours" },
    ].filter((x) => canon((d as unknown as Record<string, unknown>)[x.key]) !== canon(shipped[x.key]));
    if (changed.length) {
      out.push({
        key: "publish",
        area: "Website",
        tone: "plain",
        text: "Your changes to " + changed.map((x) => x.label).join(" and ") + " are only in this browser. Download the data file so the web team can put them on the website.",
        link: { label: "Go to Publish", tab: "publish" },
      });
    }
  }
  if (has("access.manage")) {
    (d.grants || [])
      .filter((g) => grantState(g, now) === "soon")
      .sort((a, b) => String(a.expires).localeCompare(String(b.expires)))
      .forEach((g) => {
        out.push({
          key: "grant-" + g.id,
          area: "Staff access",
          tone: "warn",
          text: personName(d, g.userId) + "’s " + roleWord(g.role) + " access ends " + inDays(daysLeft(g.expires!, now)) + ", on " + dayTT(g.expires) + ". Extend it, or let it end.",
          link: { label: "Open their access", tab: "access", item: g.userId },
        });
      });
  }
  if (has("audit.view")) {
    const refused = (d.audit || []).filter((e) => !e.ok && now - new Date(e.at).getTime() < 7 * DAY);
    if (refused.length) {
      out.push({
        key: "refused",
        area: "Audit log",
        tone: "plain",
        text: plural(refused.length, "action was", "actions were") + " refused in the last seven days. Most are mistyped codes at a till; look for anything else.",
        link: { label: "Read them", tab: "audit", item: "refused" },
      });
    }
  }
  return out;
}

const ROLE_WORD: Record<string, string> = { employee: "employee", hr: "HR", admin: "store admin", marketing: "marketing", owner: "owner's office" };
const roleWord = (r: string) => ROLE_WORD[r] || r;

/** What Today watches for this person, for its empty state. */
export function watching(d: Seed, s: Session | null) {
  const w: string[] = [];
  const has = (p: Permission) => can(d, s, p);
  if (has("promos.approve")) w.push("offers waiting for your approval");
  if (has("promos.draft")) w.push("your offers that were sent back, and drafts not yet sent");
  if (has("codes.view")) w.push("code checks at the tills today, and any till that is locked");
  if (has("newsletter.view")) w.push("the next newsletter to go out");
  if (has("specials.edit")) w.push("specials posted more than four weeks ago");
  if (has("site.publish")) w.push("website changes not yet handed to the web team");
  if (has("access.manage")) w.push("staff access that ends within " + SOON_DAYS + " days");
  if (has("audit.view")) w.push("refused actions in the audit log");
  return w;
}
