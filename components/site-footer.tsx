"use client";

import Link from "next/link";
import { NewsletterSignup } from "@/components/members/newsletter-signup";
import { Logo } from "@/components/site-header";
import { ResetDemoButton } from "@/components/reset-demo-button";
import { SocialLinks } from "@/components/social-links";
import { DISCLAIMER, telHref } from "@/lib/format";
import { useData } from "@/lib/store";

export function SiteFooter() {
  const d = useData();
  return (
    <footer className="site-footer">
      <div className="facade-band" aria-hidden="true" />
      <div className="container">
        <div className="footer-news">
          <NewsletterSignup source="Footer" compact />
        </div>
        <div className="footer-grid">
          <div>
            <Link className="brand" href="/" aria-label="Southern Food Basket, home">
              <Logo />
            </Link>
            <p style={{ marginTop: 16 }}>We’ve got the food for your basket.</p>
            {d.settings.phone && (
              <p>
                <a href={telHref(d.settings.phone)}>{d.settings.phone}</a>
              </p>
            )}
          </div>
          <div>
            <h4>Our stores</h4>
            <ul>
              {d.branches.map((b) => (
                <li className="footer-branch" key={b.id}>
                  <Link href={"/locations#" + b.id}>
                    <strong>{b.name}</strong>
                  </Link>
                  <span>{b.short || b.address}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link href="/specials">Specials</Link></li>
              <li><Link href="/events">Events and promotions</Link></li>
              <li><Link href="/departments">Departments</Link></li>
              <li><Link href="/restaurant">Restaurant and bakery</Link></li>
              <li><Link href="/locations">A store near me</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About us</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/community">Community and partnerships</Link></li>
              <li><Link href="/portal">Staff portal</Link></li>
              <li><Link href="/how-it-works">How the system works</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-social">
          <span>Follow us</span>
          <SocialLinks settings={d.settings} compact />
        </div>
        <div className="footer-bottom">
          <p>{DISCLAIMER}</p>
          <p>
            <span className="concept-pill">Prototype</span> &nbsp;{" "}
            <ResetDemoButton className="link-btn" style={{ color: "#F3EBDD" }}>
              Reset demo data
            </ResetDemoButton>
          </p>
        </div>
      </div>
    </footer>
  );
}
