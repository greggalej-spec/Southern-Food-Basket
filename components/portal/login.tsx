"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/components/app-shell";
import { Icon, type IconName } from "@/components/icon";
import { SiteFrame } from "@/components/site-frame";
import { toast } from "@/components/ui/sonner";
import { activeGrant, isStaff } from "@/lib/access";
import { destinationFor, finishSignOut, queryParam, roleParam, signOutPending } from "@/lib/portal/login";
import "@/lib/private";
import { currentApplicant, currentEmployee, login, logout, useData, useHydrated, useSession } from "@/lib/store";
import type { Role } from "@/lib/types";

// The demo sign-in (portal/index.html and renderLogin in portal.js): one click per role, no password. A staff card
// works only while that person's grant is live (lib/access.ts), so revoking access in the owner's office shows here.

type RoleCard = { role: Exclude<Role, "customer">; user: string; icon: IconName; who: string; can: string };

const ROLE_CARDS: RoleCard[] = [
  { role: "applicant", user: "app-aaliyah", icon: "file", who: "Aaliyah Persad · applying for Checkout Associate, San Fernando", can: "Her own application and documents." },
  { role: "employee", user: "emp-keisha", icon: "user", who: "Keisha Ramlogan · Checkout Supervisor, San Fernando", can: "Her shifts, leave and pay, and checking members’ codes at her till." },
  { role: "hr", user: "emp-devon", icon: "shield", who: "Devon Baptiste · HR Manager, Princes Town", can: "Applications, jobs and staff documents. Not the mailing list." },
  { role: "admin", user: "emp-ria", icon: "store", who: "Ria Mohammed · Store Operations Lead, head office", can: "Specials, store hours and notices. Not applicants or the list." },
  { role: "marketing", user: "emp-tricia", icon: "tag", who: "Tricia Baboolal · Marketing Coordinator, head office", can: "Drafts offers and newsletters; cannot approve her own offers." },
  { role: "owner", user: "emp-vishala", icon: "grid", who: "Vishala Rampersad · Operations Director, head office", can: "Approves offers, manages staff access, reads the audit log." },
];

const userFor = (role: Role) => ROLE_CARDS.find((c) => c.role === role)?.user ?? null;

export function PortalLogin() {
  const d = useData();
  const s = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  // Set while a role card's sign-in navigates away, so the "signed in as" note does not flash up first.
  const [leaving, setLeaving] = useState(false);

  // ?as=applicant|employee|hr|admin signs straight in as that demo role (shareable prototype links).
  useEffect(() => {
    finishSignOut();
    const as = roleParam(queryParam("as"));
    // Shoppers sign in with an e-mail link, never from here.
    if (!as || as === "customer") return;
    login(as, userFor(as));
    router.replace(destinationFor(as, queryParam("next")));
  }, [router]);

  function choose(role: Role, user: string) {
    setLeaving(true);
    login(role, user);
    router.push(destinationFor(role, queryParam("next")));
  }

  const u = !s ? null : s.role === "applicant" ? currentApplicant(d, s) : s.role === "customer" ? (d.customers || []).find((c) => c.id === s.userId) : currentEmployee(d, s);
  // A staff card whose grant was revoked or has run out cannot be used (applicants have no grant). Checked once the
  // browser has the demo data: the server prerender has neither the data nor a clock it may read.
  const live = (c: RoleCard) => !hydrated || !isStaff(c.role) || !!activeGrant(d, { role: c.role, userId: c.user });
  const note = s && u && !leaving && !signOutPending() && !(hydrated && roleParam(queryParam("as")));

  return (
    <SiteFrame active="portal" css={["app", "portal"]} page="login" banner>
      <section className="section">
        <div className="container login-wrap">
          <p className="eyebrow">Staff portal</p>
          <h1>Sign in to the demo.</h1>
          <p className="lede">This is a prototype. Pick a role to continue; there is no password.</p>
          <div id="session-note">
            {note ? (
              <div className="alert alert-info session-alert">
                <Icon name="user" />
                <p className="grow">
                  You are signed in as <strong>{u.name}</strong> ({ROLE_LABEL[s.role] || s.role}).
                </p>
                <div className="cluster" style={{ "--gap": "8px" } as React.CSSProperties}>
                  <Link className="btn btn-primary btn-sm" href={destinationFor(s.role, queryParam("next"))}>
                    Continue
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    id="note-signout"
                    onClick={() => {
                      logout();
                      toast("Signed out of the demo.");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="role-cards">
            {ROLE_CARDS.map((c) => {
              const ok = live(c);
              return (
                <button
                  key={c.role}
                  className="role-card"
                  type="button"
                  data-role={c.role}
                  data-user={c.user}
                  data-tour={"role-" + c.role}
                  disabled={!ok}
                  onClick={() => choose(c.role, c.user)}
                >
                  <span data-icon={c.icon} aria-hidden="true">
                    <Icon name={c.icon} />
                  </span>
                  <strong>{ROLE_LABEL[c.role]}</strong>
                  <span className="who">{c.who}</span>
                  <span className="can">{ok ? c.can : "Access revoked. The owner’s office can restore it."}</span>
                </button>
              );
            })}
          </div>
          <p className="login-shopper">
            Shopping with us? <Link href="/account">Sign in to your account</Link> to see your members’ codes.
          </p>
          <div className="card login-about">
            <h2>How access works</h2>
            <ul>
              <li>Each person gets only what their job needs. Marketing never sees applicants; HR never sees the mailing list.</li>
              <li>Access can be limited to one store and given an end date, and the owner’s office can revoke it at once.</li>
              <li>Whoever drafts an offer cannot approve it. Every approval, export and code check is written to the audit log.</li>
            </ul>
            <p className="muted small">
              Nothing you enter leaves this browser. <Link href="/tour">Take the guided tour</Link> to see each role in turn.
            </p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
