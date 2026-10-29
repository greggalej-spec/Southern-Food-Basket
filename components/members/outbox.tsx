"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import "@/lib/mailing";
import { emailOk, normalizeEmail } from "@/lib/newsletter";
import { fmtTT } from "@/lib/promo";
import { safeNext, useData, useHydrated } from "@/lib/store";
import type { OutboxMessage } from "@/lib/types";

// The demo outbox (/outbox): where this site's e-mails land instead of being sent. It is not everyone's mail: the
// visitor types an address (or arrives with ?to= from a "check your e-mail" screen) and sees only the messages to
// that address. The address is remembered for this tab in sessionStorage and taken out of the address bar.

const KEY = "sfb-outbox-to";

const KIND: Record<OutboxMessage["kind"], { label: string; variant: "info" | "clay" | "green" }> = {
  transactional: { label: "Account e-mail", variant: "info" },
  marketing: { label: "Weekly e-mail", variant: "clay" },
  internal: { label: "Staff update", variant: "green" },
};

function remembered() {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

function remember(v: string) {
  try {
    sessionStorage.setItem(KEY, v);
  } catch {}
}

/** The prerendered page and the Suspense fallback: the form, empty. */
export function OutboxWaiting() {
  return <div className="outbox-wait" aria-busy="true" />;
}

export function Outbox() {
  const hydrated = useHydrated();
  const to = useSearchParams().get("to");
  if (!hydrated) return <OutboxWaiting />;
  return <OutboxInner to={to} />;
}

function OutboxInner({ to }: { to: string | null }) {
  const d = useData();
  const router = useRouter();
  const id = useId();
  const [start] = useState(() => (to && emailOk(to) ? normalizeEmail(to) : remembered()));
  const [draft, setDraft] = useState(start);
  const [shown, setShown] = useState(start);
  const [error, setError] = useState<string | null>(null);
  const [seenTo, setSeenTo] = useState(to);
  if (to !== seenTo) {
    // A new ?to= while the page is open (a "check your e-mail" link from the footer, say).
    setSeenTo(to);
    if (to && emailOk(to)) {
      setDraft(normalizeEmail(to));
      setShown(normalizeEmail(to));
      setError(null);
    }
  }

  // Keep the address for this tab, and out of the address bar and the history.
  useEffect(() => {
    if (shown) remember(shown);
  }, [shown]);
  useEffect(() => {
    if (to) router.replace("/outbox", { scroll: false });
  }, [to, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOk(draft)) {
      setError("Enter an e-mail address like name@example.com.");
      return;
    }
    setError(null);
    setShown(normalizeEmail(draft));
  }

  const mail = shown ? (d.outbox || []).filter((m) => normalizeEmail(m.to) === shown).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()) : [];

  return (
    <>
      <form className="card outbox-form" noValidate onSubmit={submit}>
        <label htmlFor={id + "-to"}>Show the e-mails sent to</label>
        <div className="outbox-row">
          <input
            id={id + "-to"}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? id + "-err" : id + "-hint"}
          />
          <button className="btn btn-primary" type="submit">
            <Icon name="search" />
            Show
          </button>
        </div>
        {error ? (
          <p className="error-text" id={id + "-err"}>
            {error}
          </p>
        ) : (
          <p className="hint" id={id + "-hint"}>
            Only messages to this one address are shown.
          </p>
        )}
      </form>

      {shown ? (
        <section className="outbox" aria-labelledby="outbox-h" data-tour="outbox-list">
          <h2 id="outbox-h" className="outbox-h" aria-live="polite">
            {mail.length ? mail.length + (mail.length === 1 ? " e-mail to " : " e-mails to ") + shown : "No e-mails to " + shown + " yet"}
          </h2>
          {mail.length ? (
            <ol className="mail-list">
              {mail.map((m) => (
                <li key={m.id}>
                  <MailItem m={m} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">Sign-up and sign-in e-mails appear here a moment after you ask for them. Check the address is spelled the same way.</p>
          )}
        </section>
      ) : null}
    </>
  );
}

function MailItem({ m }: { m: OutboxMessage }) {
  const href = m.action ? safeNext(m.action.href) : null;
  const kind = KIND[m.kind] || KIND.transactional;
  return (
    <article className="mail" aria-labelledby={"mail-" + m.id}>
      <header className="mail-head">
        <div className="mail-from">
          <img className="mail-mark" src="/assets/img/sfb-mark.svg" alt="" width="40" height="40" decoding="async" />
          <div>
            <p className="mail-sender">Southern Food Basket</p>
            <p className="mail-to">{"To " + m.to}</p>
          </div>
        </div>
        <p className="mail-when">
          <time dateTime={m.at}>{fmtTT(m.at, true)}</time>
        </p>
      </header>
      <h3 className="mail-subject" id={"mail-" + m.id}>
        {m.subject}
      </h3>
      <Badge variant={kind.variant}>{kind.label}</Badge>
      <div className="mail-body">
        {m.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {m.action && href ? (
        <p className="mail-action">
          <Link className="btn btn-sign" href={href}>
            {m.action.label}
          </Link>
        </p>
      ) : null}
    </article>
  );
}
