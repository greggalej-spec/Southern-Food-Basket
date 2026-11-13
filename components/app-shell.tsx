"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ConceptBanner } from "@/components/concept-banner";
import { Icon, type IconName } from "@/components/icon";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { Scope, type CssName } from "@/components/scope";
import { ThemeToggle } from "@/components/theme-toggle";
import { activeGrant, can, isStaff, ROLE_NAME, type Permission } from "@/lib/access";
import { DISCLAIMER, fmtDate, initials } from "@/lib/format";
import "@/lib/private";
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

/** The office console, one list for store admin, marketing and the owner's office; each sees only what its access
 *  allows. The ids are the console's sections (components/admin/admin-console.tsx). */
const OFFICE: NavItem[] = [
  { id: "today", label: "Today", href: "/admin#today", icon: "home" },
  { id: "overview", label: "Overview", href: "/admin#overview", icon: "grid", perm: "overview.view" },
  { group: "Administration" },
  { id: "suppliers", label: "Supplier specials", href: "/admin#suppliers", icon: "book", perm: ["suppliers.view", "suppliers.edit"] },
  { id: "sellout", label: "Sell-out reports", href: "/admin#sellout", icon: "check", perm: "sellout.log" },
  { id: "requests", label: "Partnerships and donations", href: "/admin#requests", icon: "gift", perm: ["requests.log", "requests.decide"] },
  { id: "feedback", label: "Customer feedback", href: "/admin#feedback", icon: "phone", perm: "feedback.handle" },
  { id: "bulk", label: "Bulk orders", href: "/admin#bulk", icon: "boxes", perm: ["bulk.manage", "bulk.store"] },
  { id: "tasks", label: "Tasks and resources", href: "/admin#tasks", icon: "tasks" },
  { group: "Website" },
  { id: "studio", label: "Website studio", href: "/admin#studio", icon: "brush", perm: "site.customize" },
  { id: "deals", label: "Specials", href: "/admin#deals", icon: "tag", perm: "specials.edit" },
  { id: "posts", label: "Post maker", href: "/admin#posts", icon: "camera", perm: "posts.make" },
  { id: "stores", label: "Stores and hours", href: "/admin#stores", icon: "store", perm: "stores.edit" },
  { id: "publish", label: "Publish", href: "/admin#publish", icon: "upload", perm: "site.publish" },
  { group: "Marketing" },
  { id: "analytics", label: "Marketing figures", href: "/admin#analytics", icon: "chart", perm: "analytics.view" },
  { id: "social", label: "Social accounts", href: "/admin#social", icon: "link", perm: ["social.connect", "analytics.view"] },
  { id: "plan", label: "Content calendar", href: "/admin#plan", icon: "calendar", perm: "plan.edit" },
  { id: "promos", label: "Promotions", href: "/admin#promos", icon: "basket", perm: ["promos.draft", "promos.approve"] },
  { id: "codes", label: "Codes and redemptions", href: "/admin#codes", icon: "tag", perm: "codes.view" },
  { id: "newsletter", label: "Newsletter", href: "/admin#newsletter", icon: "file", perm: "newsletter.view" },
  { id: "list", label: "Mailing list", href: "/admin#list", icon: "user", perm: "newsletter.view" },
  { group: "Staff" },
  { id: "staffnews", label: "Staff updates", href: "/admin#staffnews", icon: "file", perm: "staff.updates" },
  { id: "notices", label: "Staff notices", href: "/admin#notices", icon: "bell", perm: "notices.post" },
  { group: "Owner’s office" },
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
function subscribeWide(cb: () => void) {
  const mq = matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
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
  const link = (n: NavLink) => {
    const inner = (
      <>
        <Icon name={n.icon} />
        <span>{n.label}</span>
      </>
    );
    const current = n.id === active ? ("page" as const) : undefined;
    return n.href.includes("#") ? (
      <a key={n.id} href={n.href} aria-current={current}>
        {inner}
      </a>
    ) : (
      <Link key={n.id} href={n.href} aria-current={current}>
        {inner}
      </Link>
    );
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
      <ConceptBanner />
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
        <aside className="app-sidebar" id="app-sidebar" aria-label="Portal menu" inert={!wide && !open}>
          <Link className="app-brand" href="/">
            <img className="sfb-mark" src="/assets/img/sfb-mark.svg" alt="" width="96" height="96" decoding="async" />
            <span>
              Southern Food Basket<small>{isStaff(role) ? "Staff portal" : ROLE_LABEL[role]}</small>
            </span>
          </Link>
          <nav className="app-nav" aria-label="Portal">
            {sections.map((sec) => {
              if (!sec.group) return sec.items.map(link);
              const shut = closed.has(sec.group);
              const group = sec.group;
              const id = "nav-" + group.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              const holdsCurrent = sec.items.some((n) => n.id === active);
              return (
                <div className={"app-nav-sec" + (shut ? " is-shut" : "")} key={group}>
                  <button type="button" className={"app-nav-group" + (shut && holdsCurrent ? " has-current" : "")} aria-expanded={!shut} aria-controls={id} onClick={() => toggleNavGroup(group)}>
                    <span>{group}</span>
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
        <div className="app-body">
          <header className="app-topbar">
            <button ref={btn} className="app-menu-btn" type="button" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(!open)}>
              <Icon name={open ? "close" : "menu"} />
              <span>{open ? "Close" : "Menu"}</span>
            </button>
            <div className="app-topbar-title">
              <span className="eyebrow bare" style={{ margin: 0 }}>
                {ROLE_LABEL[role]}
              </span>
              <strong>{title}</strong>
            </div>
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
