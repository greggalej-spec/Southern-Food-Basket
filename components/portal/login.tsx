"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROLE_LABEL } from "@/components/app-shell";
import { Icon, type IconName } from "@/components/icon";
import { SiteFrame } from "@/components/site-frame";
import { toast } from "@/components/ui/sonner";
import { Flow, Working } from "@/components/viz";
import { activeGrant, grantLive, isStaff } from "@/lib/access";
import { destinationFor, finishSignOut, queryParam, roleParam, signOutPending } from "@/lib/portal/login";
import "@/lib/private";
import { audit, byId, currentApplicant, currentEmployee, login, logout, update, useData, useHydrated, useSession } from "@/lib/store";
import type { Role } from "@/lib/types";

/* The staff sign-in. It walks the three steps a real sign-in has: work e-mail and password, a six-digit code sent to
   the person's phone, then their own dashboard. It is a placeholder: no password is checked and no message is sent,
   the page says so at each step, and the code is shown on screen. What it does do for real is what comes after: a
   staff account works only while that person's access is live (lib/access.ts), so revoking access in the owner's
   office shuts the account out here.

   For now (Gregg, 16 Nov 2026) tapping a demo account signs straight in as that person, with no password or phone
   code, so switching between accounts is one tap. Typing a demo e-mail into the form still walks all three steps.
   A revoked account's card stays disabled. "?as=<role>" also signs straight in, for the guided tour and the guide. */

type Account = { key: string; role: Exclude<Role, "customer">; user: string; icon: IconName; who: string; can: string };

const ACCOUNTS: Account[] = [
  { key: "owner", role: "owner", user: "emp-vishala", icon: "grid", who: "Mellisa · Managing Director", can: "The overview of every department, approvals, staff access and the activity log." },
  { key: "owner2", role: "owner", user: "emp-jameel", icon: "grid", who: "Jameel Mohammed · Managing Director", can: "The same as Mellisa: every department, approvals, staff access and the activity log." },
  { key: "admin", role: "admin", user: "emp-ria", icon: "book", who: "Alexia · Executive Assistant", can: "Supplier specials, sell-out reports, requests, customer feedback, bulk orders, tasks." },
  { key: "marketing", role: "marketing", user: "emp-tricia", icon: "chart", who: "Isabel · Marketing", can: "Marketing figures, social accounts, the calendar, offers, events and flyers, posts and the website studio." },
  { key: "hr", role: "hr", user: "emp-devon", icon: "users", who: "Faith · HR Manager", can: "Applications, jobs, the team at all five stores, HR resources." },
  { key: "purchasing", role: "purchasing", user: "emp-sadia", icon: "tag", who: "Sadia · Point of Sale", can: "The supplier specials, to view only. They cannot change anything." },
  { key: "employee", role: "employee", user: "emp-keisha", icon: "user", who: "Keisha Ramlogan · Checkout Supervisor, San Fernando", can: "Her shifts, leave and pay, and checking members’ codes at her till." },
  { key: "applicant", role: "applicant", user: "app-aaliyah", icon: "file", who: "Aaliyah Persad · applying for Checkout Associate", can: "Her own application and documents." },
];

const TITLE: Record<string, string> = { owner: "Managing Director’s console", owner2: "Managing Director’s console", admin: "Administration", marketing: "Marketing", hr: "HR", purchasing: "Point of Sale", employee: "Employee", applicant: "Applicant" };
const DEMO_CODE = "482615";
const userFor = (role: Role) => ACCOUNTS.find((c) => c.role === role)?.user ?? null;

/** Departments shown as one card with every person on it (Gregg, 16 Nov 2026): tap a name to sign in as them. */
const TEAMS: Record<string, string[]> = {
  marketing: ["emp-tricia", "emp-addae"],
  purchasing: ["emp-sadia", "emp-akili", "emp-patricia", "emp-josann", "emp-adrianna", "emp-requelle"],
};

/** A department card with its people as buttons: tap a name to sign in as that person. */
function TeamCard({ c, people, pick, live }: { c: Account; people: string[]; pick: (a: Account) => void; live: (a: Account) => boolean }) {
  const d = useData();
  return (
    <div className="role-card team-card" data-role={c.role} data-tour={"role-" + c.key}>
      <span data-icon={c.icon} aria-hidden="true">
        <Icon name={c.icon} />
      </span>
      <strong>{TITLE[c.key]}</strong>
      <span className="can">{c.can}</span>
      <span className="team-people" role="group" aria-label={TITLE[c.key] + ": choose a person"}>
        {people.map((id) => {
          const e = byId(d.employees, id);
          if (!e) return null;
          const a: Account = { ...c, user: id, who: e.name + " · " + TITLE[c.key] };
          const ok = live(a);
          return (
            <button key={id} type="button" className="btn btn-ghost btn-sm" data-user={id} disabled={!ok} title={ok ? "Sign in as " + e.name : "Access revoked"} onClick={() => pick(a)}>
              {e.name}
            </button>
          );
        })}
      </span>
    </div>
  );
}

type Step = "account" | "checking" | "code" | "verifying" | "done";

export function PortalLogin() {
  const d = useData();
  const s = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [picked, setPicked] = useState<Account | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("account");
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  // ?as=<role> signs straight in as that demo person (the tour and the guide's links use it).
  useEffect(() => {
    finishSignOut();
    const as = roleParam(queryParam("as"));
    if (!as || as === "customer") return;
    login(as, userFor(as));
    router.replace(destinationFor(as, queryParam("next")));
  }, [router]);

  const emailOf = (a: Account) => (a.role === "applicant" ? byId(d.applicants, a.user)?.email : byId(d.employees, a.user)?.email) || "";
  const live = (a: Account) => !hydrated || !isStaff(a.role) || !!activeGrant(d, { role: a.role, userId: a.user });
  const phoneOf = (a: Account) => ((a.role === "applicant" ? byId(d.applicants, a.user)?.phone : byId(d.employees, a.user)?.phone) || "").slice(-4) || "0000";

  /** One tap: straight into that person's dashboard, skipping the password and the phone code. */
  function quick(a: Account) {
    if (!live(a)) return;
    setPicked(a);
    setError("");
    setStep("done");
    setLeaving(true);
    const sess = login(a.role, a.user);
    if (isStaff(a.role)) update((dd) => audit(dd, sess, "auth.signin", a.who.split(" · ")[0], "Demo account picked on the sign-in page"));
    setTimeout(() => router.push(destinationFor(a.role, queryParam("next"))), 450);
  }

  /** Anyone on staff with live access, by work e-mail, not only the people on the cards (the Point of Sale team, for
   *  one). Their office role wins over the plain employee grant everyone has. */
  function staffByEmail(typed: string): Account | null {
    const e = (d.employees || []).find((x) => (x.email || "").toLowerCase() === typed);
    if (!e) return null;
    const order: Account["role"][] = ["owner", "hr", "admin", "marketing", "purchasing", "employee"];
    const g = (d.grants || []).filter((x) => x.userId === e.id && grantLive(x)).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role))[0];
    if (!g) return null;
    return { key: g.role, role: g.role, user: e.id, icon: "user", who: e.name + " · " + e.role, can: "" };
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    const typed = email.trim().toLowerCase();
    const acc = (picked && emailOf(picked).toLowerCase() === typed ? picked : null) || ACCOUNTS.find((a) => emailOf(a).toLowerCase() === typed) || staffByEmail(typed);
    if (!acc) return setError("No demo account uses that e-mail address. Choose a person from the list to fill it in.");
    if (!password) return setError("Enter a password. In this prototype any password is accepted.");
    if (!live(acc)) return setError("This account’s access has been revoked. The Managing Director can restore it.");
    setPicked(acc);
    setError("");
    setStep("checking");
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/\D/g, "") !== DEMO_CODE) return setError("That code does not match. In this prototype the code is shown below the box.");
    setError("");
    setStep("verifying");
  }

  function finish() {
    if (!picked) return;
    setStep("done");
    setLeaving(true);
    const sess = login(picked.role, picked.user);
    if (isStaff(picked.role)) update((dd) => audit(dd, sess, "auth.signin", picked.who.split(" · ")[0], "Password and phone code accepted"));
    setTimeout(() => router.push(destinationFor(picked.role, queryParam("next"))), 700);
  }

  const u = !s ? null : s.role === "applicant" ? currentApplicant(d, s) : s.role === "customer" ? (d.customers || []).find((c) => c.id === s.userId) : currentEmployee(d, s);
  const note = s && u && !leaving && !signOutPending() && !(hydrated && roleParam(queryParam("as")));
  const stepNo = step === "account" || step === "checking" ? 1 : step === "code" || step === "verifying" ? 2 : 3;

  return (
    <SiteFrame active="portal" css={["app", "portal", "ops"]} page="login" banner>
      <section className="section">
        <div className="container">
          <p className="eyebrow">Staff portal</p>
          <h1>Sign in</h1>
          <p className="lede">Everyone signs in as themselves and lands on their own dashboard. Tap a person under Demo accounts to go straight to theirs.</p>
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
                      toast("Signed out.");
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="signin">
            <div className="signin-card" data-tour="signin-card">
              <ol className="signin-steps" aria-label={"Step " + stepNo + " of 3"}>
                {[1, 2, 3].map((n) => (
                  <li key={n} className={n <= stepNo ? "is-on" : undefined} />
                ))}
              </ol>

              {step === "account" ? (
                <form onSubmit={submitAccount} noValidate>
                  <h2>Your work account</h2>
                  {error ? (
                    <div className="alert alert-bad" role="alert">
                      <p>{error}</p>
                    </div>
                  ) : null}
                  <div className="field">
                    <label htmlFor="si-email">Work e-mail</label>
                    <input id="si-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@sfb.example" data-tour="signin-email" />
                  </div>
                  <div className="field">
                    <label htmlFor="si-password">Password</label>
                    <input id="si-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <button className="btn btn-primary" type="submit" data-tour="signin-go">
                    <Icon name="lock" />
                    Sign in
                  </button>
                  <p className="signin-links">
                    <button className="link-btn" type="button" onClick={() => setHelp(!help)} aria-expanded={help}>
                      Forgot your password?
                    </button>
                    <Link href="/account">Shopper sign-in</Link>
                  </p>
                  {help ? <p className="demo-hint">In the real system this sends a reset link to your work e-mail, and HR can reset it for you in person. Five wrong tries lock the account for fifteen minutes.</p> : null}
                  <p className="demo-hint">
                    <strong>Prototype.</strong> No password is checked. Tap a demo account to sign straight in, or type its e-mail here to see the full sign-in with the phone code.
                  </p>
                </form>
              ) : null}

              {step === "checking" ? (
                <>
                  <h2>Checking your account</h2>
                  <Working steps={["Finding your account", "Checking the password", "Sending a code to your phone"]} onDone={() => { setStep("code"); setTimeout(() => codeRef.current?.focus(), 50); }} />
                </>
              ) : null}

              {step === "code" && picked ? (
                <form onSubmit={submitCode} noValidate>
                  <h2>Enter the code from your phone</h2>
                  <p className="muted">{"We sent a six-digit code to the phone ending " + phoneOf(picked) + ". It works once, for ten minutes."}</p>
                  {error ? (
                    <div className="alert alert-bad" role="alert">
                      <p>{error}</p>
                    </div>
                  ) : null}
                  <div className="field">
                    <label htmlFor="si-code">Six-digit code</label>
                    <div className="code-boxes">
                      <input id="si-code" ref={codeRef} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} data-tour="signin-code" />
                    </div>
                  </div>
                  <button className="btn btn-primary" type="submit">
                    Confirm
                  </button>
                  <p className="demo-hint">
                    <strong>Prototype.</strong> No message is sent. The code is <strong>{DEMO_CODE}</strong>.{" "}
                    <button className="link-btn" type="button" onClick={() => setCode(DEMO_CODE)} data-tour="signin-fill">
                      Fill it in
                    </button>
                  </p>
                  <p className="signin-links">
                    <button className="link-btn" type="button" onClick={() => { setStep("account"); setCode(""); setError(""); }}>
                      Use a different account
                    </button>
                  </p>
                </form>
              ) : null}

              {step === "verifying" ? (
                <>
                  <h2>Almost there</h2>
                  <Working steps={["Checking the code", "Loading your access", "Opening your dashboard"]} onDone={finish} />
                </>
              ) : null}

              {step === "done" && picked ? (
                <div className="signin-ok" role="status">
                  <span className="tick" aria-hidden="true">
                    <Icon name="check" />
                  </span>
                  <h2>{"Welcome, " + picked.who.split(" · ")[0].split(" ")[0]}</h2>
                  <p className="muted">{"Opening the " + TITLE[picked.key].toLowerCase() + " dashboard."}</p>
                </div>
              ) : null}
            </div>

            <div>
              <h2 className="admin-h2" style={{ font: "800 1.125rem/1.3 var(--ui)", marginBottom: 12 }}>
                Demo accounts
              </h2>
              <div className="people-pick role-cards">
                {ACCOUNTS.map((c) => {
                  const ok = live(c);
                  if (TEAMS[c.key]) return <TeamCard key={c.key} c={c} people={TEAMS[c.key]} pick={quick} live={live} />;
                  return (
                    <button key={c.key} className="role-card" type="button" data-role={c.role} data-user={c.user} data-tour={"role-" + c.key} disabled={!ok} aria-pressed={picked?.key === c.key} onClick={() => quick(c)}>
                      <span data-icon={c.icon} aria-hidden="true">
                        <Icon name={c.icon} />
                      </span>
                      <strong>{TITLE[c.key]}</strong>
                      <span className="who">{c.who}</span>
                      <span className="can">{ok ? c.can : "Access revoked. The Managing Director can restore it."}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <Flow id="signin" always />
          </div>

          <div className="card login-about" style={{ marginTop: 24 }}>
            <h2>How access works</h2>
            <ul>
              <li>Each person gets only what their job needs. Marketing never sees applicants; HR never sees the mailing list; Point of Sale sees the supplier specials and nothing else.</li>
              <li>Access can be limited to one store and given an end date, and the Managing Director can revoke it at once.</li>
              <li>Whoever drafts an offer cannot approve it. Every approval, export, decision and sign-in is written to the activity log.</li>
            </ul>
            <p className="muted small">
              Nothing you enter leaves this browser. <Link href="/tour">Take the guided tour</Link> to see each role in turn, or <Link href="/how-it-works">see how it all flows</Link>.
            </p>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
