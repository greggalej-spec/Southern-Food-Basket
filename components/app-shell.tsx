"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/icon";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { Scope, type CssName } from "@/components/scope";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNowMinute } from "@/components/use-today";
import { EdgeBump } from "@/components/edge-bump";
import { applyQuiet, clearQuiet, fingerprint, setQuiet, tomorrowMorning, useQuiet } from "@/lib/nav-quiet";
import { navSignals, SIGNAL_RANK, SIGNAL_WORD, type NavSignal, type SignalLevel } from "@/lib/nav-signals";
import { activeGrant, can, isStaff, ROLE_NAME, type Permission } from "@/lib/access";
import { DISCLAIMER, fmtDate, initials } from "@/lib/format";
import "@/lib/private";
import "@/styles/sidebar.css";
import { currentApplicant, currentEmployee, useData, useSession } from "@/lib/store";
import type { Role, Seed, Session } from "@/lib/types";

/** `perm` hides an item the session cannot use (any one of a list will do). Hiding is for tidiness only: every
 *  screen and every write checks access again (lib/access.ts). */
type NavItem = { id: string; label: string; href: string; icon: IconName; perm?: Permission | Permission[] } | { group: string };
type NavLink = Extract<NavItem, { id: string }>;

/* The sidebar's headings are dropdowns. Which ones are closed is kept in this browser, as a "|"-joined list. */
const NAV_KEY = "sfb.navClosed";
const navListeners = new Set<() => void>();
function subscribeNav(fn: () => void) {
  navListeners.add(fn);
  return () => {
    navListeners.delete(fn);
  };
}
function readNav() {
  try {
    return localStorage.getItem(NAV_KEY) || "";
  } catch {
    return "";
  }
}
function toggleNavGroup(group: string) {
  const cur = new Set(readNav().split("|").filter(Boolean));
  if (cur.has(group)) cur.delete(group);
  else cur.add(group);
  try {
    localStorage.setItem(NAV_KEY, [...cur].join("|"));
  } catch {
    /* private window: the menu simply stays open */
  }
  navListeners.forEach((l) => l());
}

const MY_PORTAL: NavItem[] = [
  { id: "home", label: "Home", href: "/portal/home", icon: "home" },
  { id: "updates", label: "Staff updates", href: "/portal/updates", icon: "bell" },
  { id: "till", label: "Check a code", href: "/portal/till", icon: "tag", perm: "codes.redeem" },
  { id: "schedule", label: "Schedule", href: "/portal/schedule", icon: "calendar" },
  { id: "leave", label: "Leave", href: "/portal/leave", icon: "sun" },
  { id: "pay", label: "Pay", href: "/portal/pay", icon: "wallet" },
  { id: "docs", label: "Documents & training", href: "/portal/docs", icon: "folder" },
  { id: "profile", label: "Profile", href: "/portal/profile", icon: "user" },
];

/** The office console, one list for store admin, marketing and the Managing Director; each sees only what its access
 *  allows. The ids are the console's sections (components/admin/admin-console.tsx). */
const OFFICE: NavItem[] = [
  { id: "today", label: "Today", href: "/admin#today", icon: "home", perm: "office.desk" },
  { id: "overview", label: "Overview", href: "/admin#overview", icon: "grid", perm: "overview.view" },
  { group: "Administration" },
  { id: "suppliers", label: "Supplier specials", href: "/admin#suppliers", icon: "book", perm: ["suppliers.view", "suppliers.edit"] },
  { id: "sellout", label: "Sell-out reports", href: "/admin#sellout", icon: "check", perm: "sellout.log" },
  { id: "requests", label: "Partnerships and donations", href: "/admin#requests", icon: "gift", perm: ["requests.log", "requests.decide"] },
  { id: "feedback", label: "Customer feedback", href: "/admin#feedback", icon: "phone", perm: "feedback.handle" },
  { id: "bulk", label: "Bulk orders", href: "/admin#bulk", icon: "boxes", perm: ["bulk.manage", "bulk.store"] },
  { id: "tasks", label: "Tasks and resources", href: "/admin#tasks", icon: "tasks", perm: "office.desk" },
  { group: "Website" },
  { id: "customize", label: "Customize", href: "/admin#customize", icon: "sun", perm: "site.customize" },
  { id: "studio", label: "Website studio", href: "/admin#studio", icon: "brush", perm: "site.customize" },
  { id: "events", label: "Events and flyers", href: "/admin#events", icon: "calendar", perm: "events.manage" },
  { id: "deals", label: "Specials", href: "/admin#deals", icon: "tag", perm: "specials.edit" },
  { id: "posts", label: "Post maker", href: "/admin#posts", icon: "camera", perm: "posts.make" },
  { id: "stores", label: "Stores and hours", href: "/admin#stores", icon: "store", perm: "stores.edit" },
  { id: "publish", label: "Publish", href: "/admin#publish", icon: "upload", perm: "site.publish" },
  { group: "Marketing" },
  { id: "analytics", label: "Marketing figures", href: "/admin#analytics", icon: "chart", perm: "analytics.view" },
  { id: "social", label: "Social accounts", href: "/admin#social", icon: "link", perm: ["social.connect", "analytics.view"] },
  { id: "plan", label: "Content calendar", href: "/admin#plan", icon: "calendar", perm: "plan.edit" },
  { id: "radio", label: "Radio", href: "/admin#radio", icon: "radio", perm: "radio.manage" },
  { id: "promos", label: "Promotions", href: "/admin#promos", icon: "basket", perm: ["promos.draft", "promos.approve"] },
  { id: "codes", label: "Codes and redemptions", href: "/admin#codes", icon: "tag", perm: "codes.view" },
  { id: "newsletter", label: "Newsletter", href: "/admin#newsletter", icon: "file", perm: "newsletter.view" },
  { id: "list", label: "Mailing list", href: "/admin#list", icon: "user", perm: "newsletter.view" },
  { group: "Staff" },
  { id: "staffnews", label: "Staff updates", href: "/admin#staffnews", icon: "file", perm: "staff.updates" },
  { id: "notices", label: "Staff notices", href: "/admin#notices", icon: "bell", perm: "notices.post" },
  { group: "Managing Director’s console" },
  { id: "access", label: "Staff access", href: "/admin#access", icon: "shield", perm: "access.manage" },
  { id: "audit", label: "Audit log", href: "/admin#audit", icon: "clock", perm: "audit.view" },
  { group: "My portal" },
  ...MY_PORTAL,
];

export const APP_NAV: Record<Role, NavItem[]> = {
  applicant: [
    { id: "me", label: "My application", href: "/careers/me", icon: "file" },
    { id: "jobs", label: "Browse jobs", href: "/careers", icon: "search" },
  ],
  // A store manager gives his store's numbers for bulk orders from his own portal.
  employee: [...MY_PORTAL.slice(0, 3), { id: "bulk", label: "Bulk orders", href: "/portal/bulk", icon: "boxes", perm: "bulk.store" }, ...MY_PORTAL.slice(3)],
  hr: [
    { id: "pipeline", label: "Hiring pipeline", href: "/hr#pipeline", icon: "briefcase", perm: "hr.pipeline" },
    { id: "roles", label: "Jobs", href: "/hr#roles", icon: "grid", perm: "hr.jobs" },
    { id: "log", label: "Hiring log", href: "/hr#log", icon: "clock", perm: "hr.pipeline" },
    { id: "people", label: "People", href: "/hr#people", icon: "users", perm: "hr.people" },
    { id: "compliance", label: "Compliance", href: "/hr#compliance", icon: "shield", perm: "hr.compliance" },
    { id: "resources", label: "HR resources", href: "/hr#resources", icon: "book", perm: "hr.people" },
    { id: "hr-updates", label: "Staff updates", href: "/hr#updates", icon: "file", perm: "staff.updates" },
    { group: "My portal" },
    ...MY_PORTAL,
  ],
  admin: OFFICE,
  purchasing: OFFICE,
  marketing: OFFICE,
  owner: OFFICE,
  customer: [{ id: "account", label: "My offers", href: "/account", icon: "tag" }],
};

/** The nav a session may see: items it lacks access to are dropped, then any group left with nothing under it. */
/** The icon and the department heading of a console section, read off the sidebar list, so a section's banner
 *  always matches its menu entry. */
export function officeMeta(id: string): { icon: IconName; group: string | null } | null {
  let group: string | null = null;
  for (const n of OFFICE) {
    if ("group" in n) group = n.group;
    else if (n.id === id) return { icon: n.icon, group };
  }
  return null;
}

export function navFor(d: Seed, s: Session | null, role: Role) {
  const allowed = (n: NavItem) => "group" in n || !n.perm || [n.perm].flat().some((p) => can(d, s, p));
  const items = APP_NAV[role].filter(allowed);
  return items.filter((n, i) => !("group" in n) || (i + 1 < items.length && !("group" in items[i + 1])));
}

export const ROLE_LABEL = ROLE_NAME;

export type AppSection = "portal" | "hr" | "admin" | "careers";
const SECTION_ROLE: Record<AppSection, Role> = { portal: "employee", hr: "hr", admin: "admin", careers: "applicant" };

/** "All stores" or "Princes Town", plus the end date of a time-limited grant. */
function scopeLine(d: Seed, s: Session | null) {
  const g = activeGrant(d, s);
  if (!g) return null;
  const stores = g.branchIds ? g.branchIds.map((id) => d.branches.find((b) => b.id === id)?.short || id).join(", ") : "All stores";
  return stores + (g.expires ? " · until " + fmtDate(g.expires) : "");
}

const WIDE = "(min-width: 910px)";
/** Where a put-away edge swell is remembered (lib/nav-quiet.ts), beside the lights. */
const BUMP_KEY = "__edge-swell";
function subscribeWide(cb: () => void) {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** What a light can be told: got it (a critical one stops blinking), pause for a while, or done until something new
 *  arrives. Kept in this browser (lib/nav-quiet.ts); Today itself is unchanged. */
function LightMenu({ x, y, label, sig, now, onPick }: { x: number; y: number; label: string; sig: NavSignal & { acked?: boolean }; now: number; onPick: (q: Parameters<typeof setQuiet>[1]) => void }) {
  const fp = fingerprint(sig);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const HOUR = 3600000;
  const style = { left: Math.min(x + 8, (typeof innerWidth === "number" ? innerWidth : 400) - 268), top: Math.max(8, Math.min(y - 8, (typeof innerHeight === "number" ? innerHeight : 800) - 300)) };
  return (
    <div className={"sig-menu is-" + sig.level} role="menu" aria-label={"Options for the light on " + label} style={style}>
      <p className="sig-menu-head">
        <i className={"nav-sig is-" + sig.level} aria-hidden="true" />
        <b>{SIGNAL_WORD[sig.level]}</b>
        <span>{label}</span>
      </p>
      <p className="sig-menu-text">{sig.text}</p>
      {(sig.level === "critical" || sig.level === "urgent") && !sig.acked ? (
        <button ref={first} type="button" role="menuitem" onClick={() => onPick({ ack: fp })}>
          <b>Got it</b>
          <small>Stop the blinking; it stays red until it is dealt with</small>
        </button>
      ) : null}
      <button ref={(sig.level === "critical" || sig.level === "urgent") && !sig.acked ? undefined : first} type="button" role="menuitem" onClick={() => onPick({ until: now + HOUR })}>
        <b>Pause for an hour</b>
      </button>
      <button type="button" role="menuitem" onClick={() => onPick({ until: tomorrowMorning(now) })}>
        <b>Pause until tomorrow</b>
        <small>Back at 7:00 am</small>
      </button>
      <button type="button" role="menuitem" onClick={() => onPick({ until: now + 72 * HOUR })}>
        <b>Pause for 3 days</b>
      </button>
      <button type="button" role="menuitem" className="is-done" onClick={() => onPick({ done: fp })}>
        <b>Mark as done</b>
        <small>Off until something new comes in here</small>
      </button>
    </div>
  );
}

/** Red entries out of sight in the open sidebar: a strip held at its foot names them, each with an arrow pointing to
 *  where it sits, at most three at a time and the rest behind "more", which cascades open. Tapping one takes you to
 *  it. Measured again on every scroll, resize and group opening or shutting, so the arrows always point the right way. */
function NavAlerts({ items, aside, onGo }: { items: { id: string; label: string; level: SignalLevel }[]; aside: React.RefObject<HTMLElement | null>; onGo: (id: string) => void }) {
  const [away, setAway] = useState<Record<string, "up" | "down">>({});
  const [more, setMore] = useState(false);
  const key = items.map((i) => i.id).join("|");
  useEffect(() => {
    const root = aside.current;
    if (!root || !key) return;
    const ids = key.split("|");
    let frame = 0;
    // Where each red entry sits against the sidebar's visible part (less the strip's own height at the foot).
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = root.getBoundingClientRect();
        const next: Record<string, "up" | "down"> = {};
        ids.forEach((id) => {
          const el = root.querySelector<HTMLElement>('[data-nav-id="' + id + '"]');
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.top >= box.top && r.bottom <= box.bottom - 72) return;
          next[id] = r.top < box.top ? "up" : "down";
        });
        setAway((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      });
    };
    measure();
    root.addEventListener("scroll", measure, { passive: true });
    addEventListener("resize", measure);
    // groups opening and shutting change the heights without a scroll
    const ro = new ResizeObserver(measure);
    root.querySelectorAll(".app-nav-items > div").forEach((el) => ro.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("scroll", measure);
      removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [aside, key]);
  const list = items.filter((i) => away[i.id]);
  if (!list.length) return null;
  const first = more ? list : list.slice(0, 3);
  return (
    <div className="nav-alerts" role="region" aria-label="Alerts further along the menu">
      <ul>
        {first.map((i, k) => (
          <li key={i.id} style={{ "--k": k } as React.CSSProperties}>
            <button type="button" className={"is-" + i.level} onClick={() => onGo(i.id)}>
              <svg className={"nav-arrow" + (away[i.id] === "up" ? " is-up" : "")} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
              <i className={"nav-sig is-" + i.level} aria-hidden="true" />
              <span>{i.label}</span>
              <small>{SIGNAL_WORD[i.level]}</small>
            </button>
          </li>
        ))}
      </ul>
      {list.length > 3 ? (
        <button type="button" className="nav-alerts-more" aria-expanded={more} onClick={() => setMore(!more)}>
          {more ? "Show fewer" : "+" + (list.length - 3) + " more"}
        </button>
      ) : null}
    </div>
  );
}

/** The portal frame: sidebar, top bar and demo banner around the page's <main>. Hash links (HR and admin tabs) are
 *  plain anchors, so the browser fires hashchange as it did on the static site; page links are client-side. */
export function AppShell({
  app,
  active,
  title,
  css,
  page,
  children,
}: {
  app: AppSection;
  active: string;
  title: string;
  css: CssName[];
  page?: string;
  children: React.ReactNode;
}) {
  const d = useData();
  const s = useSession();
  const role = s?.role ?? SECTION_ROLE[app];
  const user = role === "applicant" ? currentApplicant(d, s) : role === "customer" ? (d.customers || []).find((c) => c.id === s?.userId) : currentEmployee(d, s);
  const name = user ? user.name : ROLE_LABEL[role];
  const scope = isStaff(role) ? scopeLine(d, s) : null;

  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  // The server cannot know the width; it renders the sidebar inert, as a phone sees it closed.
  const wide = useSyncExternalStore(subscribeWide, () => matchMedia(WIDE).matches, () => false);
  const [wasWide, setWasWide] = useState(wide);
  if (wide !== wasWide) {
    // Crossing the breakpoint closes the off-canvas sidebar.
    setWasWide(wide);
    setOpen(false);
  }

  // The menu in sections: what comes before the first heading stands alone; each heading opens and closes its items.
  const closedRaw = useSyncExternalStore(subscribeNav, readNav, () => "");
  const closed = new Set(closedRaw.split("|").filter(Boolean));
  const sections: { group: string | null; items: NavLink[] }[] = [];
  for (const n of navFor(d, s, role)) {
    if ("group" in n) sections.push({ group: n.group, items: [] });
    else {
      if (!sections.length) sections.push({ group: null, items: [] });
      sections[sections.length - 1].items.push(n);
    }
  }
  // The lights beside each entry (lib/nav-signals.ts). They read the clock, so they arrive after the first paint.
  const now = useNowMinute();
  const quiet = useQuiet();
  // paused and done lights are dropped here; "got it" ones stay, holding still (lib/nav-quiet.ts)
  const { lights: signals, off } = now && s ? applyQuiet(navSignals(d, s, now), quiet, now) : { lights: {} as Record<string, NavSignal & { acked?: boolean }>, off: 0 };
  const acked = Object.values(signals).some((x) => x.acked);
  const shown = sections.flatMap((sec) => sec.items.map((n) => ({ ...n, group: sec.group })));
  const loud = shown
    .filter((n) => signals[n.id] && SIGNAL_RANK[signals[n.id].level] <= SIGNAL_RANK.urgent)
    .sort((a, b) => SIGNAL_RANK[signals[a.id].level] - SIGNAL_RANK[signals[b.id].level]);
  // the section itself, rather than Today, which only gathers everything
  const crit = loud.filter((n) => signals[n.id].level === "critical" && !signals[n.id].acked);
  const critical = crit.find((n) => n.id !== "today") || crit[0] || null;
  // how many critical things the edge swell carries: Today gathers them all, so it counts once
  const critCount = signals.today && !signals.today.acked && signals.today.critical ? signals.today.critical : crit.reduce((a, n) => a + (signals[n.id].critical || 1), 0);
  const bumpPrint = crit.map((n) => n.id + ":" + signals[n.id].critical + ":" + signals[n.id].text).join("|");
  const alarm: SignalLevel | null = critical ? "critical" : loud.length ? "urgent" : null;

  // The small menu a light opens: got it, pause, or done.
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!menu) return;
    const shut = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e.type === "pointerdown" && (e.target as Element).closest?.(".sig-menu, .nav-sig-btn")) return;
      setMenu(null);
    };
    document.addEventListener("pointerdown", shut);
    document.addEventListener("keydown", shut);
    aside.current?.addEventListener("scroll", shut, { passive: true });
    const box = aside.current;
    return () => {
      document.removeEventListener("pointerdown", shut);
      document.removeEventListener("keydown", shut);
      box?.removeEventListener("scroll", shut);
    };
  }, [menu]);

  const link = (n: NavLink) => {
    const sig = signals[n.id];
    const inner = (
      <>
        <Icon name={n.icon} />
        <span>{n.label}</span>
        {sig ? <span className="visually-hidden">{", " + SIGNAL_WORD[sig.level].toLowerCase()}</span> : null}
      </>
    );
    const current = n.id === active ? ("page" as const) : undefined;
    const props = { "data-nav-id": n.id, className: sig ? "sig-" + sig.level + (sig.acked ? " is-acked" : "") : undefined, "aria-current": current };
    const a = n.href.includes("#") ? (
      <a key={n.id} href={n.href} {...props}>
        {inner}
      </a>
    ) : (
      <Link key={n.id} href={n.href} {...props}>
        {inner}
      </Link>
    );
    if (!sig) return a;
    // the light is a button of its own beside the link: it opens the menu to quiet it
    return (
      <div className="nav-row" key={n.id}>
        {a}
        <button
          type="button"
          className="nav-sig-btn"
          aria-label={SIGNAL_WORD[sig.level] + " in " + n.label + ": " + sig.text + " Options for this light"}
          aria-haspopup="menu"
          aria-expanded={menu?.id === n.id}
          title={SIGNAL_WORD[sig.level] + ": " + sig.text}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setMenu(menu?.id === n.id ? null : { id: n.id, x: r.right, y: r.top });
          }}
        >
          <i className={"nav-sig is-" + sig.level + (sig.acked ? " is-acked" : "")} />
        </button>
      </div>
    );
  };

  // Bring an entry into view: open its group if it is shut, scroll to it, and let it flash.
  const aside = useRef<HTMLElement>(null);
  const reveal = (id: string) => {
    const item = shown.find((n) => n.id === id);
    if (item?.group && closed.has(item.group)) toggleNavGroup(item.group);
    const go = () => {
      const el = aside.current?.querySelector<HTMLElement>('[data-nav-id="' + id + '"]');
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el.animate?.([{ boxShadow: "0 0 0 0 rgba(255, 59, 48, .9)" }, { boxShadow: "0 0 0 10px rgba(255, 59, 48, 0)" }], { duration: 900, iterations: 2 });
    };
    setTimeout(go, 320);
  };
  // the edge was tapped: once the sidebar is open, take them to the critical entry
  const revealOnOpen = useRef<string | null>(null);
  useEffect(() => {
    if (!open || !revealOnOpen.current) return;
    const id = revealOnOpen.current;
    revealOnOpen.current = null;
    reveal(id);
  });

  const swipe = useRef<{ x: number; y: number; dx: number; live: boolean } | null>(null);
  const closeMenu = () => {
    setOpen(false);
    btn.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <Scope css={css} page={page}>
      <div
        className={open ? "app sidebar-open" : "app"}
        onClick={(e) => {
          // the dimmed area around the open sidebar is the shell itself
          if (e.target !== e.currentTarget || !open) return;
          setOpen(false);
          btn.current?.focus();
        }}
      >
        <a className="skip-link" href="#app-main">
          Skip to content
        </a>
        {/* a closed off-canvas sidebar must leave the tab order and the accessibility tree */}
        <aside
          ref={aside}
          className="app-sidebar"
          id="app-sidebar"
          aria-label="Portal menu"
          inert={!wide && !open}
          // On a phone the open sidebar also closes with a swipe to the left: it follows the finger, and goes if
          // pulled far enough, or springs back.
          onPointerDown={(e) => {
            if (wide || !open || e.pointerType !== "touch") return;
            swipe.current = { x: e.clientX, y: e.clientY, dx: 0, live: false };
          }}
          onPointerMove={(e) => {
            const sw = swipe.current;
            if (!sw) return;
            const dx = Math.min(0, e.clientX - sw.x);
            if (!sw.live && Math.abs(e.clientY - sw.y) > Math.abs(dx)) {
              swipe.current = null; // a scroll, not a swipe
              return;
            }
            sw.live = sw.live || dx < -8;
            if (!sw.live) return;
            sw.dx = dx;
            e.currentTarget.style.transition = "none";
            e.currentTarget.style.transform = "translateX(" + dx + "px)";
          }}
          onPointerUp={(e) => {
            const sw = swipe.current;
            swipe.current = null;
            if (!sw || !sw.live) return;
            e.currentTarget.style.transition = "";
            e.currentTarget.style.transform = "";
            if (sw.dx < -70) closeMenu();
          }}
          onPointerCancel={(e) => {
            swipe.current = null;
            e.currentTarget.style.transition = "";
            e.currentTarget.style.transform = "";
          }}
        >
          <div className="app-sidebar-head">
            <Link className="app-brand" href="/">
              <img className="sfb-mark" src="/assets/img/sfb-mark.svg" alt="" width="96" height="96" decoding="async" />
              <span>
                Southern Food Basket<small>{isStaff(role) ? "Staff portal" : ROLE_LABEL[role]}</small>
              </span>
            </Link>
            {/* phones and narrow tablets only (styles/staff-theme.css): the top bar's Close sits under the open sidebar */}
            <button type="button" className="app-sidebar-close" aria-label="Close the menu" onClick={closeMenu}>
              <Icon name="close" />
              <span>Close</span>
            </button>
          </div>
          <nav className="app-nav" aria-label="Portal">
            {sections.map((sec) => {
              if (!sec.group) return sec.items.map(link);
              const shut = closed.has(sec.group);
              const group = sec.group;
              const id = "nav-" + group.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const holdsCurrent = sec.items.some((n) => n.id === active);
              // a shut heading shows the strongest light of what is inside it
              const inside = sec.items
                .map((n) => signals[n.id])
                .filter(Boolean)
                .sort((a, b) => SIGNAL_RANK[a.level] - SIGNAL_RANK[b.level])[0];
              return (
                <div className={"app-nav-sec" + (shut ? " is-shut" : "")} key={group}>
                  <button type="button" className={"app-nav-group" + (shut && holdsCurrent ? " has-current" : "") + (shut && inside ? " sig-" + inside.level : "")} aria-expanded={!shut} aria-controls={id} onClick={() => toggleNavGroup(group)}>
                    <span>{group}</span>
                    {shut && inside ? (
                      <i className={"nav-sig is-" + inside.level}>
                        <span className="visually-hidden">{", " + SIGNAL_WORD[inside.level].toLowerCase() + " inside"}</span>
                      </i>
                    ) : null}
                    <svg className="app-nav-chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {/* a closed group leaves the tab order, like the closed sidebar does */}
                  <div className="app-nav-items" id={id} inert={shut}>
                    <div>{sec.items.map(link)}</div>
                  </div>
                </div>
              );
            })}
          </nav>
          {off || acked ? (
            <button type="button" className="nav-quiet-reset" onClick={clearQuiet}>
              {off ? "Turn " + off + (off === 1 ? " light" : " lights") + " back on" : "Let the lights blink again"}
            </button>
          ) : null}
          <NavAlerts items={loud.map((n) => ({ id: n.id, label: n.label, level: signals[n.id].level }))} aside={aside} onGo={reveal} />
          <div className="app-sidebar-foot">
            {scope && (
              <p className="app-scope small">
                <span>Your access</span>
                {ROLE_LABEL[role]} · {scope}
              </p>
            )}
            <Link href="/portal">
              <Icon name="swap" />
              <span>Switch role</span>
            </Link>
            <ResetDemoButton>
              <Icon name="logout" />
              <span>Reset demo</span>
            </ResetDemoButton>
            <p className="small">{DISCLAIMER}</p>
          </div>
        </aside>
        {/* Something critical while the sidebar is shut: the sidebar's skin swells out of the screen's edge and the
            notification bursts out of it (components/edge-bump.tsx). Tapping it opens the menu at that entry. */}
        {critical && !wide && !open && quiet[BUMP_KEY]?.done !== bumpPrint ? (
          <EdgeBump
            count={critCount}
            label={critCount + (critCount === 1 ? " critical thing" : " critical things") + ", in " + critical.label}
            onOpen={() => {
              revealOnOpen.current = critical.id;
              setOpen(true);
            }}
            // put away: it stays gone until the set of critical things changes
            onDismiss={() => setQuiet(BUMP_KEY, { done: bumpPrint })}
          />
        ) : null}
        {menu && signals[menu.id] ? (
          <LightMenu
            x={menu.x}
            y={menu.y}
            label={shown.find((n) => n.id === menu.id)?.label || ""}
            sig={signals[menu.id]}
            onPick={(q) => {
              setQuiet(menu.id, q);
              setMenu(null);
            }}
            now={now}
          />
        ) : null}
        <div className="app-body">
          <header className="app-topbar">
            <button ref={btn} className="app-menu-btn" type="button" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(!open)}>
              <Icon name={open ? "close" : "menu"} />
              <span>{open ? "Close" : "Menu"}</span>
              {alarm && !open ? (
                <i className={"menu-sig is-" + alarm}>
                  <span className="visually-hidden">{", " + SIGNAL_WORD[alarm].toLowerCase() + " inside"}</span>
                </i>
              ) : null}
            </button>
            <div className="app-topbar-title">
              <span className="eyebrow bare" style={{ margin: 0 }}>
                {ROLE_LABEL[role]}
              </span>
              <strong>{title}</strong>
            </div>
            <CommandPalette items={sections.flatMap((sec) => sec.items.map((i) => ({ id: i.id, label: i.label, href: i.href, icon: i.icon, group: sec.group })))} />
            <ThemeToggle />
            <div className="app-user">
              <span className="app-avatar" aria-hidden="true">
                {initials(name)}
              </span>
              <span className="app-user-name">{name}</span>
            </div>
          </header>
          <main id="app-main" className="app-main">
            {children}
          </main>
        </div>
      </div>
    </Scope>
  );
}
