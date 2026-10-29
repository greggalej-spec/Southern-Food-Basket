"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldHint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearLeftNote, currentCustomer, finishLeaving, leavingPending, loadShopperTier, requestSignInLink, useLeftNote, useShopperTier, useVerifyResult, verifyOnce } from "@/lib/account";
import { destinationFor } from "@/lib/portal/login";
import { safeNext, useData, useHydrated, useSession } from "@/lib/store";

// The shopper's passwordless sign-in (PRD 9.3): /account/sign-in asks for an e-mail address and sends a one-time
// link; /account/verify uses it. The reply is the same whether or not an account exists for the address, and asking
// for a link to a new address makes the account, so nothing here tells a visitor who shops with us.

const DEMO_SHOPPER = "marisa.singh@example.com";

/* ---------- /account/sign-in ---------- */

export function SignInForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const d = useData();
  const s = useSession();
  const hydrated = useHydrated();
  const left = useLeftNote();
  useShopperTier(s);
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<{ field: "email" | "rate"; message: string } | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  // Signing out of /account, or deleting it, ends here (lib/account.ts leaveAccount).
  useEffect(() => {
    finishLeaving();
  }, []);

  const me = hydrated && !leavingPending() ? currentCustomer(d, s) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // The accounts join first, so an address that already shops with us gets its own account's link, not a new one.
    await loadShopperTier();
    const r = requestSignInLink(email, name, next);
    if (r.ok) {
      setError(null);
      setSent(r.email);
      clearLeftNote();
      return;
    }
    setError(r);
    if (r.field === "email") emailRef.current?.focus();
  }

  const emailErr = error?.field === "email" ? error.message : null;
  return (
    <div className="card signin-card" data-tour="signin-form">
      {left ? (
        <p className="member-alert" role="status">
          <Icon name="check" />
          {left === "deleted" ? "Your account is deleted. Codes you had not used are cancelled." : "You are signed out."}
        </p>
      ) : null}
      {me ? (
        <p className="member-alert">
          <Icon name="user" />
          <span>
            {"You are signed in as " + (me.name || me.email) + ". "}
            <Link href={destinationFor("customer", next)}>{next && next.startsWith("/offers") ? "Back to the offer" : "Go to My offers"}</Link>
          </span>
        </p>
      ) : null}

      {sent ? (
        <div className="signin-sent" role="status">
          <h2>Check your e-mail</h2>
          <p>
            We sent a sign-in link to <strong>{sent}</strong>. It works once, for 15 minutes. Open it on this device and you are signed in.
          </p>
          <p className="note">This demo sends no e-mail. The link is waiting in the demo outbox.</p>
          <div className="cluster">
            <Link className="btn btn-sign" href={"/outbox?to=" + encodeURIComponent(sent)}>
              Open the demo outbox
            </Link>
            <button type="button" className="link-btn" onClick={() => setSent(null)}>
              Use a different address
            </button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={submit}>
          <h2>{me ? "Sign in with another address" : "Sign in with your e-mail"}</h2>
          <Field>
            <Label htmlFor={id + "-email"}>Your e-mail address</Label>
            <Input
              ref={emailRef}
              id={id + "-email"}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              aria-invalid={emailErr ? true : undefined}
              aria-describedby={emailErr ? id + "-email-err" : undefined}
            />
            {emailErr ? <FieldError id={id + "-email-err"}>{emailErr}</FieldError> : null}
          </Field>
          <Field>
            <Label htmlFor={id + "-name"}>Your first name (optional)</Label>
            <Input id={id + "-name"} autoComplete="given-name" value={name} onChange={(e) => setName(e.currentTarget.value)} aria-describedby={id + "-name-hint"} maxLength={80} />
            <FieldHint id={id + "-name-hint"}>Only used to greet you. A new account starts with it.</FieldHint>
          </Field>
          <Button variant="sign" type="submit" disabled={!hydrated}>
            Send me a sign-in link
          </Button>
          {error?.field === "rate" ? (
            <p className="error-text" role="alert">
              {error.message}
            </p>
          ) : null}
          <p className="note signin-demo">
            Trying the demo? Use <strong>{DEMO_SHOPPER}</strong>: that shopper already holds two codes.
          </p>
        </form>
      )}
    </div>
  );
}

/* ---------- /account/verify ---------- */

function VerifyFrame({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section className="page-hero" aria-labelledby="verify-title">
      <div className="container narrow">
        <p className="eyebrow">Members’ offers</p>
        <h1 id="verify-title">{title}</h1>
        {children}
      </div>
    </section>
  );
}

/** The prerendered page, and the Suspense fallback until the query is read. */
export function VerifyWaiting() {
  return <VerifyFrame title="Signing you in" />;
}

export function Verify() {
  const params = useSearchParams();
  const token = params.get("token");
  const next = params.get("next");
  const hydrated = useHydrated();
  const s = useSession();
  const router = useRouter();

  // Uses the link once per tab (strict mode runs this twice; verifyOnce keeps the first answer).
  useEffect(() => {
    if (hydrated && token) void loadShopperTier().then(() => verifyOnce(token));
  }, [hydrated, token]);
  const r = useVerifyResult(token);

  // A result from earlier in this tab counts only while that shopper is still the one signed in: going Back to
  // this page after signing out must not look like a sign-in.
  const ok = !!r && r.ok && s?.role === "customer" && s.userId === r.customer.id;
  const dest = destinationFor("customer", next);
  useEffect(() => {
    if (ok) router.replace(dest);
  }, [ok, dest, router]);

  const again = "/account/sign-in" + (safeNext(next) ? "?next=" + encodeURIComponent(safeNext(next)!) : "");
  if (!hydrated || (token && !r)) return <VerifyWaiting />;
  if (ok) {
    return (
      <VerifyFrame title="You are signed in">
        <p className="lede">Taking you to {dest.startsWith("/offers") ? "the offer" : "My offers"} now.</p>
        <Link className="btn btn-sign" href={dest}>
          {dest.startsWith("/offers") ? "Go to the offer" : "Go to My offers"}
        </Link>
      </VerifyFrame>
    );
  }
  return (
    <VerifyFrame title={token ? "This link has run out" : "This link is not complete"}>
      <p className="lede">
        {token
          ? "Sign-in links work once, for 15 minutes. This one has been used or has expired, so it signs nobody in."
          : "Part of the link is missing. Copy the whole link from the e-mail, or ask for a new one."}
      </p>
      <Link className="btn btn-sign" href={again}>
        Send me a new link
      </Link>
    </VerifyFrame>
  );
}
