"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { telHref, todayHours } from "@/lib/format";
import { useData, useHydrated } from "@/lib/store";

export const SITE_NAV = [
  { id: "home", label: "Home", href: "/" },
  { id: "specials", label: "Specials", href: "/specials" },
  { id: "departments", label: "Departments", href: "/departments" },
  { id: "wholesale", label: "Wholesale", href: "/wholesale" },
  { id: "locations", label: "Store locations", href: "/locations" },
  { id: "about", label: "About us", href: "/about" },
  { id: "careers", label: "Careers", href: "/careers" },
] as const;

export type SiteNavId = (typeof SITE_NAV)[number]["id"];

/** The real logo, traced to SVG from the company's own artwork (public/assets/img/SOURCES.md). */
export function Logo() {
  return <img src="/assets/img/sfb-logo.svg" alt="Southern Food Basket" width="861" height="393" decoding="async" />;
}

export function SiteHeader({ active }: { active?: SiteNavId }) {
  const d = useData();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const first = d.branches[0];
  // The clock is read only after hydration; the prerendered page shows the Mon–Sat hours.
  const hrs = todayHours(first, hydrated ? new Date() : null);
  const count = d.branches.length;

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

  const current = (id: SiteNavId) => (id === active ? ("page" as const) : undefined);

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="utility">
        <div className="container">
          <p>
            <Icon name="clock" />
            {hrs ? (
              <span>
                Open today <strong>{hrs}</strong>
              </span>
            ) : (
              <span>See store hours</span>
            )}
            {first?.phone && (
              <a className="utility-phone" href={telHref(first.phone)}>
                {first.phone}
              </a>
            )}
          </p>
          <nav className="utility-links" aria-label="Quick links">
            <Link href="/locations">{count ? count + " store locations" : "Store locations"}</Link>
            <Link href="/careers">Careers</Link>
            <Link href="/portal">Staff portal</Link>
          </nav>
        </div>
      </div>
      <div className="masthead">
        <div className="container">
          <Link className="brand" href="/" aria-label="Southern Food Basket, home">
            <Logo />
          </Link>
          <div className="masthead-actions">
            <Link className="btn btn-ghost" href="/locations">
              <Icon name="pin" />
              Find a store
            </Link>
            <Link className="btn btn-accent" href="/specials">
              <Icon name="tag" />
              Specials
            </Link>
          </div>
          <button ref={btn} className="menu-btn" type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
            <Icon name={open ? "close" : "menu"} />
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>
      <nav className="navband" aria-label="Main">
        <div className="container">
          <ul>
            {SITE_NAV.map((n) => (
              <li key={n.id}>
                <Link href={n.href} aria-current={current(n.id)}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <nav className={open ? "mobile-nav is-open" : "mobile-nav"} id="mobile-nav" aria-label="Main">
        <ul>
          {SITE_NAV.map((n) => (
            <li key={n.id}>
              <Link href={n.href} aria-current={current(n.id)}>
                <span>{n.label}</span>
                <Icon name="arrow" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mobile-cta">
          <Link className="btn btn-accent" href="/specials">
            <Icon name="tag" />
            Specials
          </Link>
          <Link className="btn btn-ghost" href="/portal">
            <Icon name="user" />
            Staff portal
          </Link>
        </div>
      </nav>
      <div className="ribbon" aria-hidden="true" />
    </header>
  );
}
