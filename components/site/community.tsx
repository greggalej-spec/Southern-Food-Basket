"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { KIND, KINDS, ORG_TYPES, submitRequest, type RequestForm } from "@/lib/ops/requests";
import { useData } from "@/lib/store";
import type { RequestKind } from "@/lib/types";

/* The public request form: schools, charities, clubs and companies ask the store for a donation, a sponsorship, a
   partnership or an in-store promotion. It writes one request into the office's list (lib/ops/requests.ts) and
   shows the reference to quote. In this prototype nothing is sent anywhere: the acknowledgement e-mail lands in
   the demo outbox. */

const EMPTY: RequestForm = { kind: "donation", org: "", orgType: "Primary school", contact: "", phone: "", email: "", branchId: null, ask: "", purpose: "", neededBy: undefined };
type Errs = Partial<Record<"org" | "contact" | "reach" | "ask" | "purpose", string>>;

const STEPS = [
  { icon: "file" as const, title: "Tell us what you need", text: "One short form. It takes about three minutes." },
  { icon: "search" as const, title: "We read every request", text: "Our office checks the details and passes it to our director." },
  { icon: "check" as const, title: "You hear back", text: "A yes or a no, by e-mail or phone, within ten working days." },
];

export function CommunityForm() {
  const d = useData();
  const [v, setV] = useState<RequestForm>(EMPTY);
  const [errs, setErrs] = useState<Errs>({});
  const [ref, setRef] = useState("");
  const set = <K extends keyof RequestForm>(k: K, val: RequestForm[K]) => setV((p) => ({ ...p, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errs = {};
    if (!v.org.trim()) er.org = "Enter the name of your school, charity, club or company.";
    if (!v.contact.trim()) er.contact = "Enter the name of the person we should reply to.";
    if (!v.phone.trim() && !v.email.trim()) er.reach = "Enter a phone number or an e-mail address so we can reply.";
    else if (v.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) er.reach = "Check the e-mail address: it should look like name@example.com.";
    if (!v.ask.trim()) er.ask = "Say what you are asking for, for example “30 hampers” or “a sampling table”.";
    if (!v.purpose.trim()) er.purpose = "Say what it is for and when.";
    setErrs(er);
    const first = Object.keys(er)[0];
    if (first) {
      document.getElementById("cm-" + (first === "reach" ? "phone" : first))?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    setRef(submitRequest({ ...v, org: v.org.trim(), contact: v.contact.trim(), phone: v.phone.trim(), email: v.email.trim(), ask: v.ask.trim(), purpose: v.purpose.trim() }));
    setV(EMPTY);
  }

  return (
    <>
      <ol className="how-steps" aria-label="How it works">
        {STEPS.map((st, i) => (
          <li key={st.title}>
            <span className="how-num" aria-hidden="true">
              <Icon name={st.icon} />
            </span>
            <div>
              <strong>{i + 1 + ". " + st.title}</strong>
              <p>{st.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {ref ? (
        <div className="card request-done" role="status" data-tour="community-done">
          <span className="done-tick" aria-hidden="true">
            <Icon name="check" />
          </span>
          <h2>Thank you. We have your request.</h2>
          <p>
            Your reference is <strong className="request-ref">{ref}</strong>. Quote it if you call us.
          </p>
          <p className="muted">We reply to every request within ten working days. In this prototype nothing is sent: the acknowledgement is in the demo outbox, and the request is now in the office’s list.</p>
          <div className="cluster">
            <button className="btn btn-outline" type="button" onClick={() => setRef("")}>
              Send another request
            </button>
            <Link className="link-btn" href="/outbox">
              See the acknowledgement
            </Link>
          </div>
        </div>
      ) : (
        <form className="card request-form" onSubmit={submit} noValidate data-tour="community-form">
          <h2>Send us your request</h2>
          <fieldset className="kind-pick">
            <legend>What are you asking for?</legend>
            {KINDS.map((k) => (
              <label key={k} className={"kind-option" + (v.kind === k ? " is-on" : "")}>
                <input type="radio" name="kind" value={k} checked={v.kind === k} onChange={() => set("kind", k as RequestKind)} />
                <span>
                  <strong>{KIND[k].label}</strong>
                  <small>{KIND[k].hint}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="form-row">
            <div className="field">
              <label htmlFor="cm-org">Organisation</label>
              <input id="cm-org" type="text" value={v.org} onChange={(e) => set("org", e.target.value)} autoComplete="organization" aria-invalid={errs.org ? "true" : undefined} aria-describedby={errs.org ? "cm-org-e" : undefined} />
              {errs.org ? (
                <p className="error-text" id="cm-org-e">
                  {errs.org}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="cm-type">What kind of organisation</label>
              <select id="cm-type" value={v.orgType} onChange={(e) => set("orgType", e.target.value)}>
                {ORG_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="cm-contact">Your name</label>
            <input id="cm-contact" type="text" value={v.contact} onChange={(e) => set("contact", e.target.value)} autoComplete="name" aria-invalid={errs.contact ? "true" : undefined} aria-describedby={errs.contact ? "cm-contact-e" : undefined} />
            {errs.contact ? (
              <p className="error-text" id="cm-contact-e">
                {errs.contact}
              </p>
            ) : null}
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="cm-phone">Phone</label>
              <input id="cm-phone" type="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" aria-invalid={errs.reach ? "true" : undefined} aria-describedby={errs.reach ? "cm-reach-e" : undefined} />
            </div>
            <div className="field">
              <label htmlFor="cm-email">E-mail</label>
              <input id="cm-email" type="email" value={v.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={errs.reach ? "true" : undefined} aria-describedby={errs.reach ? "cm-reach-e" : undefined} />
            </div>
          </div>
          {errs.reach ? (
            <p className="error-text" id="cm-reach-e">
              {errs.reach}
            </p>
          ) : null}
          <div className="field">
            <label htmlFor="cm-ask">What you are asking for</label>
            <textarea id="cm-ask" rows={3} value={v.ask} onChange={(e) => set("ask", e.target.value)} aria-invalid={errs.ask ? "true" : undefined} aria-describedby={errs.ask ? "cm-ask-e" : "cm-ask-h"} />
            <p className="hint" id="cm-ask-h">
              Be as exact as you can: how many, of what.
            </p>
            {errs.ask ? (
              <p className="error-text" id="cm-ask-e">
                {errs.ask}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="cm-purpose">What it is for</label>
            <textarea id="cm-purpose" rows={3} value={v.purpose} onChange={(e) => set("purpose", e.target.value)} aria-invalid={errs.purpose ? "true" : undefined} aria-describedby={errs.purpose ? "cm-purpose-e" : undefined} />
            {errs.purpose ? (
              <p className="error-text" id="cm-purpose-e">
                {errs.purpose}
              </p>
            ) : null}
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="cm-store">Your nearest store</label>
              <select id="cm-store" value={v.branchId || ""} onChange={(e) => set("branchId", e.target.value || null)}>
                <option value="">Not sure</option>
                {d.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cm-needed">Needed by</label>
              <input id="cm-needed" type="date" value={v.neededBy || ""} onChange={(e) => set("neededBy", e.target.value || undefined)} aria-describedby="cm-needed-h" />
              <p className="hint" id="cm-needed-h">
                Please ask at least three weeks ahead.
              </p>
            </div>
          </div>
          <button className="btn btn-sign" type="submit">
            Send my request
          </button>
          <p className="hint">We use these details only to answer this request.</p>
        </form>
      )}
    </>
  );
}
