"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/components/app-shell";
import { Icon, type IconName } from "@/components/icon";
import { SiteFrame } from "@/components/site-frame";
import { toast } from "@/components/ui/sonner";
import { destinationFor, finishSignOut, queryParam, roleParam, signOutPending } from "@/lib/portal/login";
import { currentApplicant, currentEmployee, login, logout, useData, useHydrated, useSession } from "@/lib/store";
import type { Role } from "@/lib/types";

// The demo sign-in (portal/index.html and renderLogin in portal.js): one click per role, no password.

const ROLE_CARDS: { role: Role; user: string; icon: IconName; who: string }[] = [
  { role: "applicant", user: "app-aaliyah", icon: "file", who: "Aaliyah Persad · applying for Checkout Associate, San Fernando" },
  { role: "employee", user: "emp-keisha", icon: "user", who: "Keisha Ramlogan · Checkout Supervisor, San Fernando" },
  { role: "hr", user: "emp-devon", icon: "shield", who: "Devon Baptiste · HR Manager, Princes Town" },
  { role: "admin", user: "emp-ria", icon: "store", who: "Ria Mohammed · Marketing and Store Operations, head office" },
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
    if (!as) return;
    login(as, userFor(as));
    router.replace(destinationFor(as, queryParam("next")));
  }, [router]);

  function choose(role: Role, user: string) {
    setLeaving(true);
    login(role, user);
    router.push(destinationFor(role, queryParam("next")));
  }

  const u = !s ? null : s.role === "applicant" ? currentApplicant(d, s) : currentEmployee(d, s);
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
            {ROLE_CARDS.map((c) => (
              <button key={c.role} className="role-card" type="button" data-role={c.role} data-user={c.user} onClick={() => choose(c.role, c.user)}>
                <span data-icon={c.icon} aria-hidden="true">
                  <Icon name={c.icon} />
                </span>
                <strong>{ROLE_LABEL[c.role]}</strong>
                <span className="who">{c.who}</span>
              </button>
            ))}
          </div>
          <div className="card login-about">
            <h2>What this demo shows</h2>
            <ul>
              <li>
                <strong>Applicant:</strong> a KYC document checklist with upload states, review flags and a stage tracker.
              </li>
              <li>
                <strong>Employee:</strong> schedule, leave balances and requests, payslips, training and compliance documents.
              </li>
              <li>
                <strong>HR:</strong> the hiring pipeline, open roles and compliance across five stores.
              </li>
              <li>
                <strong>Store admin:</strong> post and edit specials, make the Instagram deal post, update store hours and staff notices.
              </li>
            </ul>
            <p className="muted small">Nothing you enter leaves this browser.</p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
