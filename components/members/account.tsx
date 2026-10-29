"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { CodeTicket, ticketFor } from "@/components/members/code-ticket";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { currentCustomer, leaveAccount, saveProfile, walletFor } from "@/lib/account";
import "@/lib/members";
import { logout, useData, useRequireRole } from "@/lib/store";
import type { Customer, Seed, Session } from "@/lib/types";

// The shopper's account (PRD 9.3): My offers (the wallet of codes), the profile, a pointer to the newsletter (an
// account never joins the mailing list by itself), and the ways out. Shown only to a signed-in shopper; anyone else
// goes to /account/sign-in and comes back here after the link.

export function AccountPage() {
  const s = useRequireRole(["customer"], "/account/sign-in");
  const d = useData();
  const me = currentCustomer(d, s);

  // A session whose shopper record is gone (deleted in another tab): end it, and the guard sends them to sign in.
  useEffect(() => {
    if (s && !me) logout();
  }, [s, me]);

  if (!s || !me) return <div className="account-wait" aria-busy="true" />;
  return <AccountBody key={me.id} me={me} d={d} s={s} />;
}

function AccountBody({ me, d, s }: { me: Customer; d: Seed; s: Session }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const now = new Date();
  const items = walletFor(d, me).map((it) => ({ it, t: ticketFor(d, it, now) }));
  const ready = items.filter((x) => x.t.status === "ready");
  const spent = items.filter((x) => x.t.status !== "ready");
  const first = me.name.trim().split(/\s+/)[0];

  async function remove() {
    const ok = await confirm({
      title: "Delete your account?",
      body:
        "Your name, e-mail address and store go. Any codes you have not used are cancelled and stop working at the till. Codes you already used stay in our counts, without your name. This does not change the weekly e-mail: unsubscribe from any of those e-mails.",
      okLabel: "Delete my account",
      danger: true,
    });
    if (ok) leaveAccount("deleted", router.push);
  }

  return (
    <>
      <section className="page-hero" aria-labelledby="account-title">
        <div className="container">
          <p className="eyebrow">Your account</p>
          <h1 id="account-title">My offers</h1>
          <p className="lede">
            {(first ? "Hello " + first + ". " : "") + "Show a code at the till before you pay. The cashier types it in and records it, and the money comes off your shop."}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container account-layout">
          <div className="account-wallet" data-tour="account-wallet">
            <h2 className="account-h">Ready to use</h2>
            {ready.length ? (
              <ul className="wallet">
                {ready.map(({ it, t }) => (
                  <li key={it.entitlement?.id || it.code}>
                    <CodeTicket {...t} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <p>You have no codes to use right now.</p>
                <Link className="btn btn-sign btn-sm" href="/offers">
                  See members’ offers
                </Link>
              </div>
            )}
            {spent.length ? (
              <>
                <h2 className="account-h">Used and ended</h2>
                <ul className="wallet wallet-spent">
                  {spent.map(({ it, t }) => (
                    <li key={it.entitlement?.id || it.code}>
                      <CodeTicket {...t} />
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="note">
              <Link href="/offers">See every members’ offer</Link>
            </p>
          </div>

          <div className="account-side">
            <Profile me={me} d={d} s={s} />

            <section className="card" aria-labelledby="acct-news">
              <h2 id="acct-news" className="card-h">The weekly e-mail</h2>
              <p>Your account does not sign you up for e-mails. To get the weekly specials and new offers, sign up on the specials page. It takes one tick and a confirmation.</p>
              <Link className="btn btn-outline" href="/specials#newsletter">
                Sign up for the e-mail
              </Link>
            </section>

            <section className="card" aria-labelledby="acct-out">
              <h2 id="acct-out" className="card-h">Your account</h2>
              <p className="account-email">
                <Icon name="user" />
                <span>{me.email}</span>
              </p>
              <div className="cluster">
                <Button variant="outline" type="button" onClick={() => leaveAccount("signed-out", router.push)}>
                  <Icon name="logout" />
                  Sign out
                </Button>
                <Button variant="danger" type="button" onClick={remove}>
                  Delete my account
                </Button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

function Profile({ me, d, s }: { me: Customer; d: Seed; s: Session }) {
  const id = useId();
  const [name, setName] = useState(me.name);
  const [store, setStore] = useState(me.preferredBranch || "");

  function save(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(s, { name, preferredBranch: store });
    toast("Saved.", "ok");
  }

  return (
    <section className="card" aria-labelledby="acct-profile">
      <h2 id="acct-profile" className="card-h">Your details</h2>
      <form noValidate onSubmit={save}>
        <Field>
          <Label htmlFor={id + "-name"}>Your name</Label>
          <Input id={id + "-name"} autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.currentTarget.value)} />
        </Field>
        <Field>
          <Label htmlFor={id + "-store"}>Your usual store</Label>
          <select id={id + "-store"} value={store} onChange={(e) => setStore(e.currentTarget.value)} aria-describedby={id + "-store-hint"}>
            <option value="">No preference</option>
            {d.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <p className="hint" id={id + "-store-hint"}>
            Only for your own reference. Codes work at the stores each offer names.
          </p>
        </Field>
        <Button variant="primary" type="submit">
          Save my details
        </Button>
      </form>
    </section>
  );
}
