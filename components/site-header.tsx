"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

// Design D's floating top bar (app/(home)/page.tsx), with page links where the home has #anchors. The home is its own
// document, so this is a second copy of that markup; DESIGN.md "One design" keeps the two in step.
export const SITE_NAV = [
  { id: "careers", label: "Careers", href: "/careers" },
  { id: "specials", label: "Specials", href: "/specials" },
  { id: "events", label: "What’s on", href: "/events" },
  { id: "offers", label: "Offers", href: "/offers" },
  { id: "locations", label: "Stores", href: "/locations" },
  { id: "departments", label: "Departments", href: "/departments" },
  { id: "wholesale", label: "Wholesale", href: "/wholesale" },
  { id: "about", label: "About us", href: "/about" },
  { id: "portal", label: "Staff portal", href: "/portal" },
] as const;

export type SiteNavId = (typeof SITE_NAV)[number]["id"];

/** The real logo, traced to SVG from the company's own artwork (docs/SOURCES.md). */
export function Logo() {
  return <img src="/assets/img/sfb-logo.svg" alt="Southern Food Basket" width="861" height="393" decoding="async" />;
}

export function SiteHeader({ active }: { active?: SiteNavId }) {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (refocus: boolean) => {
      setOpen(false);
      if (refocus) btn.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    // a tap anywhere outside the bar closes the menu, as the home's does
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const current = (id: SiteNavId) => (id === active ? ("page" as const) : undefined);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="topbar" ref={bar}>
        <Link className="brand" href="/" aria-label="Southern Food Basket, home">
          <Logo />
        </Link>
        <nav className="topnav" aria-label="Main">
          {SITE_NAV.map((n) => (
            <Link key={n.id} href={n.href} aria-current={current(n.id)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <nav className="quick" aria-label="Quick links">
          <Link className="quick-jobs" href="/careers" aria-current={current("careers")}>
            Careers
          </Link>
          <Link className="quick-stores" href="/locations" aria-current={current("locations")}>
            <Icon name="pin" />
            <span className="qs-label">Stores</span>
          </Link>
        </nav>
        <button ref={btn} className="menu-btn" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
          <span className="bars" aria-hidden="true" />
          <span className="label">{open ? "Close" : "Menu"}</span>
        </button>
        <nav className={open ? "mobile-menu is-open" : "mobile-menu"} id="mobile-menu" aria-label="Main">
          <Link href="/">
            <span>Home</span>
            <Icon name="arrow" />
          </Link>
          {SITE_NAV.map((n) => (
            <Link key={n.id} href={n.href} aria-current={current(n.id)}>
              <span>{n.label}</span>
              <Icon name="arrow" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
