"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/icon";
import { FactItem } from "@/components/site/fact";
import { toast } from "@/components/ui/sonner";
import { branchName } from "@/lib/site/deals";
import { useData } from "@/lib/store";

// site.js wholesale(): the three lists and the trade-account enquiry, from this browser's copy of the data (the seed
// until hydration). The enquiry is a mock, as before: nothing is sent and nothing is stored.

export function WholesaleLines() {
  return (useData().wholesale.lines || []).map((t, i) => (
    <li key={i}>
      <Icon name="check" />
      <span>{t}</span>
    </li>
  ));
}

export function CustomerTypes() {
  return (useData().wholesale.customerTypes || []).map((t, i) => (
    <li key={i}>
      <Icon name="basket" />
      <span>{t}</span>
    </li>
  ));
}

export function WholesaleSourced() {
  return (useData().wholesale.sourced || []).map((f, i) => <FactItem f={f} key={i} />);
}

const RULES = {
  business: (v: string) => (v.length >= 2 ? "" : "Enter your business name."),
  contact: (v: string) => (v.length >= 2 ? "" : "Enter a contact name."),
  phone: (v: string) => (/^[\d\s()+\-]{7,20}$/.test(v) ? "" : "Enter a phone or WhatsApp number, digits only."),
  branch: (v: string) => (v ? "" : "Choose the store nearest you."),
  buys: (v: string) => (v.length >= 10 ? "" : "Tell us a little about what you buy (at least 10 characters)."),
};
type Name = keyof typeof RULES;
const NAMES = Object.keys(RULES) as Name[];

type Errors = Partial<Record<Name, string>>;
type Sent = { business: string; contact: string; branch: string };

export function EnquiryForm() {
  const d = useData();
  const form = useRef<HTMLFormElement>(null);
  const success = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<Sent | null>(null);
  const [done, setDone] = useState(false);

  const field = (name: Name) => form.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  const value = (name: Name) => field(name)?.value.trim() ?? "";

  // A field shows its error until it is valid again; it is re-checked as the visitor types.
  function recheck(name: Name, v: string) {
    if (errors[name]) setErrors((e) => ({ ...e, [name]: RULES[name](v.trim()) }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Errors = {};
    let firstBad: Name | null = null;
    for (const name of NAMES) {
      const msg = RULES[name](value(name));
      next[name] = msg;
      if (msg && !firstBad) firstBad = name;
    }
    // The fields carry aria-invalid before focus moves to the first bad one.
    flushSync(() => setErrors(next));
    if (firstBad) {
      field(firstBad)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    flushSync(() => {
      setSent({ business: value("business"), contact: value("contact"), branch: branchName(d, value("branch")) });
      setDone(true);
    });
    success.current?.focus();
    toast("Demo enquiry noted. Nothing was sent.", "ok");
  }

  function again() {
    form.current?.reset();
    flushSync(() => {
      setErrors({});
      setDone(false);
    });
    field("business")?.focus();
  }

  // The ids and attributes the static form had, with aria-invalid and aria-describedby set only while it is wrong.
  const wire = (name: Name, id: string) => ({
    id,
    name,
    "aria-invalid": errors[name] ? ("true" as const) : undefined,
    "aria-describedby": errors[name] ? id + "-err" : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => recheck(name, e.currentTarget.value),
  });
  const error = (name: Name, id: string) => (
    <p className="error-text" id={id + "-err"} data-error-for={name} hidden={!errors[name]}>
      {errors[name] || ""}
    </p>
  );

  return (
    <>
      <form className="card enquiry-card" data-enquiry="" noValidate ref={form} onSubmit={onSubmit} hidden={done}>
        <div className="form-row">
          <div className="field">
            <label htmlFor="e-business">Business name</label>
            <input {...wire("business", "e-business")} type="text" autoComplete="organization" required />
            {error("business", "e-business")}
          </div>
          <div className="field">
            <label htmlFor="e-contact">Contact name</label>
            <input {...wire("contact", "e-contact")} type="text" autoComplete="name" required />
            {error("contact", "e-contact")}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="e-phone">Phone or WhatsApp</label>
            <input {...wire("phone", "e-phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="(868) 000-0000" required />
            {error("phone", "e-phone")}
          </div>
          <div className="field">
            <label htmlFor="e-branch">Nearest branch</label>
            <select {...wire("branch", "e-branch")} required>
              <option value="">Choose a store</option>
              {d.branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {error("branch", "e-branch")}
          </div>
        </div>
        <div className="field">
          <label htmlFor="e-buys">What do you buy, and roughly how much in a week?</label>
          <textarea {...wire("buys", "e-buys")} required placeholder="For example: 10 bags of rice, 4 cases of chicken, oil and flour" />
          {error("buys", "e-buys")}
        </div>
        <div className="enquiry-actions">
          <button className="btn btn-sign" type="submit">
            Send enquiry
          </button>
          <p className="hint">Demo form: nothing is sent.</p>
        </div>
      </form>
      <div className="card success" data-enquiry-success="" role="status" hidden={!done} tabIndex={sent ? -1 : undefined} ref={success}>
        {sent ? (
          <>
            <h3>
              <Icon name="check" />
              Enquiry noted (demo)
            </h3>
            <p>
              {"In the real thing the trade desk would call "}
              <span data-contact="">{sent.contact}</span>
              {" back. This is a prototype: nothing was sent and nothing was stored."}
            </p>
            <dl>
              <dt>Business</dt>
              <dd data-business="">{sent.business}</dd>
              <dt>Nearest store</dt>
              <dd data-branch="">{sent.branch}</dd>
            </dl>
            <button className="btn btn-ghost btn-sm" type="button" data-again="" onClick={again}>
              Send another enquiry
            </button>
          </>
        ) : null}
      </div>
    </>
  );
}
