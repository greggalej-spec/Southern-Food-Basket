"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { maskEmail } from "@/lib/access";
import "@/lib/mailing";
import { CONSENT, confirmSubscription, subscribe, subscriberByToken, TOPICS, unsubscribe, updatePreferences } from "@/lib/newsletter";
import { fmtTT } from "@/lib/promo";
import { load, useData, useHydrated } from "@/lib/store";
import type { Seed, Subscriber } from "@/lib/types";

// The three pages the weekly e-mail links to (PRD 9.4): confirm, preferences and unsubscribe. None needs an account;
// the token in the link is the key. Each reads this browser's mailing list, so each renders after hydration, and the
// two that change something (confirm, unsubscribe) do it once, from an effect, only when the address is in a state
// that change applies to: an old confirm link never re-subscribes an address that unsubscribed, and nothing here
// touches a suppressed one.

function Frame({ eyebrow = "The weekly e-mail", title, lede, children }: { eyebrow?: string; title: string; lede?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      <section className="page-hero" aria-labelledby="nl-page-title">
        <div className="container narrow">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="nl-page-title">{title}</h1>
          {lede ? <p className="lede">{lede}</p> : null}
        </div>
      </section>
      {children ? (
        <section className="section nl-page">
          <div className="container narrow">{children}</div>
        </section>
      ) : null}
    </>
  );
}

/** Prerendered, and the Suspense fallback until the query is read. */
export function NewsletterWaiting() {
  return <Frame title="One moment" />;
}

function BadLink() {
  return (
    <Frame title="This link does not work" lede="It may be out of date, or part of it may be missing. Sign up again and we will send you a fresh link.">
      <Link className="btn btn-sign" href="/specials#newsletter">
        Sign up again
      </Link>
    </Frame>
  );
}

function Suppressed() {
  return (
    <Frame
      title="We do not send to this address"
      lede="This address is on our do-not-send list, so no e-mail from us goes to it. This link changes nothing, and you do not need to do anything."
    />
  );
}

function storeNames(d: Seed, ids: string[]) {
  if (!ids.length) return "every store";
  const names = ids.map((id) => d.branches.find((b) => b.id === id)?.name || id);
  return names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
}

function topicNames(ids: string[]) {
  return TOPICS.filter((t) => ids.includes(t.id)).map((t) => t.label.charAt(0).toLowerCase() + t.label.slice(1));
}

function prefsHref(token: string) {
  return "/newsletter/preferences?token=" + encodeURIComponent(token);
}

/** The token and its subscriber, read after hydration. */
function useSubscriber() {
  const token = useSearchParams().get("token");
  const d = useData();
  const hydrated = useHydrated();
  return { token, d, hydrated, sub: hydrated ? subscriberByToken(d, token) : null };
}

/* ---------- /newsletter/confirm ---------- */

export function NewsletterConfirm() {
  const { token, d, hydrated, sub } = useSubscriber();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !token || done.current === token) return;
    done.current = token;
    if (subscriberByToken(load(), token)?.status === "pending") confirmSubscription(token);
  }, [hydrated, token]);

  if (!hydrated || sub?.status === "pending") return <NewsletterWaiting />;
  if (!token || !sub) return <BadLink />;
  if (sub.status === "suppressed") return <Suppressed />;
  if (sub.status === "unsubscribed") {
    return (
      <Frame
        title="This link no longer works"
        lede={"You unsubscribed from these e-mails" + (sub.unsubscribedAt ? " on " + fmtTT(sub.unsubscribedAt) : "") + ", so this old link does not sign you up again."}
      >
        <p>To get them again, open your preferences and sign up there. You tick the box and confirm by e-mail, as before.</p>
        <Link className="btn btn-outline" href={prefsHref(sub.token)}>
          Open my preferences
        </Link>
      </Frame>
    );
  }
  const topics = topicNames(sub.topics);
  return (
    <Frame title="You are on the list" lede="Thank you. Your address is confirmed.">
      <div className="card nl-card">
        <h2>What arrives, and when</h2>
        <ul className="nl-facts">
          <li>
            <Icon name="calendar" />
            <span>About one e-mail a week.</span>
          </li>
          <li>
            <Icon name="tag" />
            <span>{"With " + (topics.length ? topics.join(", ").replace(/, ([^,]*)$/, " and $1") : "this week’s specials") + "."}</span>
          </li>
          <li>
            <Icon name="pin" />
            <span>{"For " + storeNames(d, sub.branches) + "."}</span>
          </li>
          <li>
            <Icon name="check" />
            <span>Every e-mail has a link to change what you get or to unsubscribe in one click.</span>
          </li>
        </ul>
        <div className="cluster">
          <Link className="btn btn-sign" href="/specials">
            See this week’s specials
          </Link>
          <Link className="btn btn-outline" href={prefsHref(sub.token)}>
            Change what you get
          </Link>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- /newsletter/unsubscribe ---------- */

export function NewsletterUnsubscribe() {
  const { token, hydrated, sub } = useSubscriber();
  const done = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !token || done.current === token) return;
    done.current = token;
    const st = subscriberByToken(load(), token)?.status;
    if (st === "active" || st === "pending") unsubscribe(token);
  }, [hydrated, token]);

  if (!hydrated || sub?.status === "active" || sub?.status === "pending") return <NewsletterWaiting />;
  if (!token || !sub) return <BadLink />;
  if (sub.status === "suppressed") return <Suppressed />;
  return (
    <Frame title="You are unsubscribed" lede={"We will not send the weekly e-mail to " + maskEmail(sub.email) + " again. You do not need to do anything else."}>
      <p>Clicked by mistake? Open your preferences to sign up again. You tick the box and confirm by e-mail, so nobody can sign you up by accident.</p>
      <Link className="btn btn-outline" href={prefsHref(sub.token)}>
        Open my preferences
      </Link>
    </Frame>
  );
}

/* ---------- /newsletter/preferences ---------- */

export function NewsletterPreferences() {
  const { token, d, hydrated, sub } = useSubscriber();
  // Signing up again gives the address a new token, so this page's link stops matching: remember the address here.
  const [resent, setResent] = useState<string | null>(null);
  if (resent) {
    return (
      <Frame title="Check your e-mail to confirm" lede={"We sent a link to " + maskEmail(resent) + ". The e-mails start again once you click it."}>
        <p className="note">This demo sends no e-mail: the link is in the demo outbox.</p>
        <Link className="btn btn-sign" href={"/outbox?to=" + encodeURIComponent(resent)}>
          Open the demo outbox
        </Link>
      </Frame>
    );
  }
  if (!hydrated) return <NewsletterWaiting />;
  if (!token || !sub) return <BadLink />;
  if (sub.status === "suppressed") return <Suppressed />;
  if (sub.status === "unsubscribed") return <Resubscribe key={sub.id + sub.status} sub={sub} onSent={setResent} />;
  return <Preferences key={sub.id + sub.status} sub={sub} d={d} />;
}

function Preferences({ sub, d }: { sub: Subscriber; d: Seed }) {
  const id = useId();
  const [stores, setStores] = useState<string[]>(sub.branches);
  const [topics, setTopics] = useState<string[]>(sub.topics);
  const [error, setError] = useState<string | null>(null);
  const toggle = (list: string[], v: string, on: boolean) => (on ? [...list.filter((x) => x !== v), v] : list.filter((x) => x !== v));

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!topics.length) {
      setError("Pick at least one kind of e-mail. To stop them all, unsubscribe below.");
      return;
    }
    setError(null);
    updatePreferences(sub.token, stores, topics);
    toast("Saved. Your next e-mail follows these choices.", "ok");
  }

  return (
    <Frame title="Your e-mail preferences" lede={"For " + maskEmail(sub.email) + ". Choose what we send, or stop it all."}>
      {sub.status === "pending" ? (
        <p className="member-alert">
          <Icon name="bell" />
          <span>
            {"You have not confirmed this address yet, so nothing is sent. Click the link in the confirmation e-mail. "}
            <Link href={"/outbox?to=" + encodeURIComponent(sub.email)}>Open the demo outbox</Link>
          </span>
        </p>
      ) : null}
      <form className="card nl-card" noValidate onSubmit={save}>
        <fieldset aria-describedby={id + "-stores-hint"}>
          <legend>Your stores</legend>
          <p className="hint" id={id + "-stores-hint"}>
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
        <fieldset aria-describedby={error ? id + "-topics-err" : undefined}>
          <legend>What to send</legend>
          <div className="nl-checks">
            {TOPICS.map((t) => (
              <label className="check" key={t.id}>
                <input type="checkbox" checked={topics.includes(t.id)} onChange={(e) => setTopics(toggle(topics, t.id, e.currentTarget.checked))} />
                {t.label}
              </label>
            ))}
          </div>
          {error ? (
            <p className="error-text" id={id + "-topics-err"} role="alert">
              {error}
            </p>
          ) : null}
        </fieldset>
        <Button variant="sign" type="submit">
          Save my choices
        </Button>
      </form>

      <div className="card nl-card nl-stop">
        <h2>Stop all these e-mails</h2>
        <p>One click and we stop. No sign-in, and no questions.</p>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            unsubscribe(sub.token);
            toast("You are unsubscribed.", "ok");
          }}
        >
          Unsubscribe from everything
        </Button>
      </div>
    </Frame>
  );
}

function Resubscribe({ sub, onSent }: { sub: Subscriber; onSent: (email: string) => void }) {
  const id = useId();
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = subscribe({ email: sub.email, branches: sub.branches, topics: sub.topics, consent: agree, source: "Preferences page" });
    if (r.ok) onSent(sub.email);
    else setError(r.message);
  }

  return (
    <Frame title="You are unsubscribed" lede={"We send nothing to " + maskEmail(sub.email) + ". To get the weekly e-mail again, tick the box and confirm by e-mail."}>
      <form className="card nl-card" noValidate onSubmit={submit}>
        <label className="check" htmlFor={id + "-consent"}>
          <input
            id={id + "-consent"}
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.currentTarget.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? id + "-consent-err" : undefined}
          />
          <span>{CONSENT.text}</span>
        </label>
        {error ? (
          <p className="error-text" id={id + "-consent-err"} role="alert">
            {error}
          </p>
        ) : null}
        <Button variant="sign" type="submit">
          Sign me up again
        </Button>
      </form>
    </Frame>
  );
}
