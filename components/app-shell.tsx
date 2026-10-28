"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ConceptBanner } from "@/components/concept-banner";
import { Icon, type IconName } from "@/components/icon";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { Scope, type CssName } from "@/components/scope";
import { DISCLAIMER, initials } from "@/lib/format";
import { currentApplicant, currentEmployee, useData, useSession } from "@/lib/store";
import type { Role } from "@/lib/types";

type NavItem = { id: string; label: string; href: string; icon: IconName } | { group: string };

const MY_PORTAL: NavItem[] = [
  { id: "home", label: "Home", href: "/portal/home", icon: "home" },
  { id: "schedule", label: "Schedule", href: "/portal/schedule", icon: "calendar" },
  { id: "leave", label: "Leave", href: "/portal/leave", icon: "sun" },
  { id: "pay", label: "Pay", href: "/portal/pay", icon: "wallet" },
  { id: "docs", label: "Documents & training", href: "/portal/docs", icon: "folder" },
  { id: "profile", label: "Profile", href: "/portal/profile", icon: "user" },
];

export const APP_NAV: Record<Role, NavItem[]> = {
  applicant: [
    { id: "me", label: "My application", href: "/careers/me", icon: "file" },
    { id: "jobs", label: "Browse jobs", href: "/careers", icon: "search" },
  ],
  employee: MY_PORTAL,
  hr: [
    { id: "pipeline", label: "Hiring pipeline", href: "/hr#pipeline", icon: "briefcase" },
    { id: "roles", label: "Jobs", href: "/hr#roles", icon: "grid" },
    { id: "compliance", label: "Compliance", href: "/hr#compliance", icon: "shield" },
    { group: "My portal" },
    ...MY_PORTAL,
  ],
  admin: [
    { id: "deals", label: "Specials", href: "/admin#deals", icon: "tag" },
    { id: "posts", label: "Post maker", href: "/admin#posts", icon: "camera" },
    { id: "stores", label: "Stores and hours", href: "/admin#stores", icon: "store" },
    { id: "notices", label: "Staff notices", href: "/admin#notices", icon: "bell" },
    { id: "publish", label: "Publish", href: "/admin#publish", icon: "upload" },
    { group: "My portal" },
    ...MY_PORTAL,
  ],
};

export const ROLE_LABEL: Record<Role, string> = { applicant: "Applicant", employee: "Employee", hr: "HR", admin: "Store admin" };

export type AppSection = "portal" | "hr" | "admin" | "careers";
const SECTION_ROLE: Record<AppSection, Role> = { portal: "employee", hr: "hr", admin: "admin", careers: "applicant" };

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
  const user = role === "applicant" ? currentApplicant(d, s) : currentEmployee(d, s);
  const name = user ? user.name : ROLE_LABEL[role];

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
              Southern Food Basket<small>{ROLE_LABEL[role]} portal</small>
            </span>
          </Link>
          <nav className="app-nav" aria-label="Portal">
            {APP_NAV[role].map((n) => {
              if ("group" in n) {
                return (
                  <p className="app-nav-group" key={n.group}>
                    {n.group}
                  </p>
                );
              }
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
            })}
          </nav>
          <div className="app-sidebar-foot">
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
