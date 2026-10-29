"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { CONSENT, normalizeEmail, subscribe, TOPICS } from "@/lib/newsletter";
import { useData, useHydrated } from "@/lib/store";

// The weekly e-mail sign-up (PRD 6.4): compact in the footer, full on the specials page. It sits on public pages, so it
// imports neither shopper tier: subscribe() writes to this browser's data, and the mailing tier merges in when a
// newsletter page loads (lib/store.ts). The box is never ticked for the visitor, and the reply is the same whether or
// not the address was already on the list.
// The submit button stays disabled until the page has hydrated: a form sent before then would go as a plain GET and
// put the address in the URL.

type Source = "Footer" | "Specials page" | "Home page";
type FieldName = "email" | "consent" | "rate" | "topics";

const ALL_TOPICS = TOPICS.map((t) => t.id as string);

export function NewsletterSignup({ source, compact = false, id }: { source: Source; compact?: boolean; id?: string }) {
  const d = useData();
  const hydrated = useHydrated();
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [stores, setStores] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>(ALL_TOPICS);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<{ field: FieldName; message: string } | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const toggle = (list: string[], v: string, on: boolean) => (on ? [...list.filter((x) => x !== v), v] : list.filter((x) => x !== v));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!compact && !topics.length) {
      setError({ field: "topics", message: "Pick at least one kind of e-mail." });
      return;
    }
    const r = subscribe({ email, branches: compact ? [] : stores, topics: compact ? ALL_TOPICS : topics, consent: agree, source });
    if (r.ok) {
      setError(null);
      setSent(normalizeEmail(email));
      return;
    }
    setError(r);
    if (r.field === "email") emailRef.current?.focus();
    if (r.field === "consent") consentRef.current?.focus();
  }

  const err = (f: FieldName) => (error?.field === f ? error.message : null);
  const cls = "nl" + (compact ? " nl-compact" : " nl-full");

  if (sent) {
    return (
      <div className={cls} id={id} data-tour="newsletter-signup">
        <div className="nl-sent" role="status">
          <h2 className="nl-title">Check your e-mail to confirm</h2>
          <p>
            If <strong>{sent}</strong> is new to our list, a link to confirm is on its way. Nothing else arrives until you click it.
          </p>
          <p className="nl-small">This demo sends no e-mail: the link is in the demo outbox.</p>
          <p className="nl-actions">
            <Link className="btn btn-sign btn-sm" href={"/outbox?to=" + encodeURIComponent(sent)}>
              Open the demo outbox
            </Link>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setSent(null);
                setEmail("");
                setAgree(false);
              }}
            >
              Use another address
            </button>
          </p>
        </div>
      </div>
    );
  }

  const emailErr = err("email");
  const consentErr = err("consent");
  const topicsErr = err("topics");
  return (
    <div className={cls} id={id} data-tour="newsletter-signup">
      <div className="nl-intro">
        <h2 className="nl-title">{compact ? "The weekly specials, by e-mail" : "Get the specials by e-mail"}</h2>
        <p>{compact ? "About one e-mail a week. No account needed." : "About one e-mail a week with the new specials and members’ offers. No account needed, and you can stop any time."}</p>
      </div>
      <form className="nl-form" noValidate onSubmit={submit} aria-label="Sign up for the weekly e-mail">
        <div className="nl-field">
          <label htmlFor={uid + "-email"}>Your e-mail address</label>
          <input
            ref={emailRef}
            id={uid + "-email"}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            aria-invalid={emailErr ? true : undefined}
            aria-describedby={emailErr ? uid + "-email-err" : undefined}
          />
          {emailErr ? (
            <p className="nl-error" id={uid + "-email-err"}>
              {emailErr}
            </p>
          ) : null}
        </div>

        {compact ? null : (
          <div className="nl-choices">
            <fieldset aria-describedby={uid + "-stores-hint"}>
              <legend>Your stores (optional)</legend>
              <p className="hint" id={uid + "-stores-hint"}>
                Leave them all unticked to hear about every store.
              </p>
              <div className="nl-checks">
                {d.branches.map((b) => (
                  <label className="check" key={b.id}>
                    <input type="checkbox" checked={stores.includes(b.id)} onChange={(e) => setStores(toggle(stores, b.id, e.currentTarget.checked))} />
                    {b.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset aria-describedby={topicsErr ? uid + "-topics-err" : undefined}>
              <legend>What to send</legend>
              <div className="nl-checks">
                {TOPICS.map((t) => (
                  <label className="check" key={t.id}>
                    <input type="checkbox" checked={topics.includes(t.id)} onChange={(e) => setTopics(toggle(topics, t.id, e.currentTarget.checked))} />
                    {t.label}
                  </label>
                ))}
              </div>
              {topicsErr ? (
                <p className="nl-error" id={uid + "-topics-err"} role="alert">
                  {topicsErr}
                </p>
              ) : null}
            </fieldset>
          </div>
        )}

        <div className="nl-consent" data-tour="newsletter-consent">
          <label className="check" htmlFor={uid + "-consent"}>
            <input
              ref={consentRef}
              id={uid + "-consent"}
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.currentTarget.checked)}
              aria-invalid={consentErr ? true : undefined}
              aria-describedby={consentErr ? uid + "-consent-err" : undefined}
            />
            <span>{CONSENT.text}</span>
          </label>
          {consentErr ? (
            <p className="nl-error" id={uid + "-consent-err"}>
              {consentErr}
            </p>
          ) : null}
        </div>

        <div className="nl-submit">
          <button className="btn btn-sign" type="submit" disabled={!hydrated}>
            <Icon name="bell" />
            Sign me up
          </button>
          {error?.field === "rate" ? (
            <p className="nl-error" role="alert">
              {error.message}
            </p>
          ) : null}
        </div>
        <p className="nl-small">We use your address only for these e-mails. Every one has a link to change what you get or to unsubscribe.</p>
      </form>
    </div>
  );
}
