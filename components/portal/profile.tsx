"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useRef, useState } from "react";
import { DocBadge } from "@/components/badges";
import { Icon } from "@/components/icon";
import { EmptyRow, PortalPage } from "@/components/portal/portal-page";
import { toast } from "@/components/ui/sonner";
import { daysUntil, docDisplayState, parseDay } from "@/lib/format";
import { branchName, docName, fmtDay, isDay, plural } from "@/lib/portal/format";
import { signOutTo } from "@/lib/portal/login";
import { updateEmployee } from "@/lib/store";
import type { Employee, Seed } from "@/lib/types";

// The employee's record, emergency contact, payroll bank (masked) and identity documents (portal/profile.html,
// renderProfile in portal.js).

/** Reads the clock. */
function service(start: string) {
  if (!isDay(start)) return "";
  const s = parseDay(start), n = new Date();
  let months = (n.getFullYear() - s.getFullYear()) * 12 + (n.getMonth() - s.getMonth());
  if (n.getDate() < s.getDate()) months -= 1;
  if (months < 1) return "less than a month of service";
  const y = Math.floor(months / 12), mo = months % 12;
  if (y < 1) return plural(mo, "month") + " of service";
  return plural(y, "year") + (mo ? " " + plural(mo, "month") : "") + " of service";
}

function Kv({ id, pairs }: { id: string; pairs: [string, string | null | undefined][] }) {
  return (
    <dl className="kv" id={id}>
      {pairs.map(([k, v]) => (
        <Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v ? v : <span className="muted">Not recorded</span>}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

type EmField = "name" | "phone";

function EmergencyForm({ me }: { me: Employee }) {
  const em = me.emergency || { name: "", relation: "", phone: "" };
  const [name, setName] = useState(em.name || "");
  const [relation, setRelation] = useState(em.relation || "");
  const [phone, setPhone] = useState(em.phone || "");
  const [error, setError] = useState<{ msg: string; field: EmField } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  function fail(msg: string, field: EmField) {
    setError({ msg, field });
    (field === "name" ? nameRef : phoneRef).current?.focus();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const v = { name: name.trim(), relation: relation.trim(), phone: phone.trim() };
    if (!v.name) return fail("Enter the contact’s name.", "name");
    if (!v.phone) return fail("Enter a phone number.", "phone");
    if (!/^[\d\s()+\-]{7,30}$/.test(v.phone)) return fail("Enter a phone number using digits, spaces, brackets, + or -.", "phone");
    updateEmployee(me.id, (emp) => {
      emp.emergency = v;
    });
    toast("Emergency contact saved.", "ok");
    // fillForm(): show what was stored, trimmed.
    setName(v.name);
    setRelation(v.relation);
    setPhone(v.phone);
  }

  return (
    <form className="panel-body" id="em-form" noValidate onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="em-name">Name</label>
          <input
            ref={nameRef}
            type="text"
            id="em-name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            aria-invalid={error?.field === "name" ? true : undefined}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="em-relation">Relationship</label>
          <input type="text" id="em-relation" name="relation" maxLength={40} autoComplete="off" placeholder="Spouse, parent, friend" value={relation} onChange={(e) => setRelation(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="em-phone">Phone</label>
        <input
          ref={phoneRef}
          type="tel"
          id="em-phone"
          name="phone"
          required
          maxLength={30}
          autoComplete="off"
          placeholder="(868) 000-0000"
          value={phone}
          aria-invalid={error?.field === "phone" ? true : undefined}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <p className="error-text" id="em-error" role="alert" hidden={!error}>
        {error?.msg}
      </p>
      <div className="form-actions">
        <button className="btn btn-primary" type="submit">
          Save contact
        </button>
      </div>
    </form>
  );
}

function ProfileBody({ me, d }: { me: Employee; d: Seed }) {
  const router = useRouter();
  const comp = me.compliance || [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">What we have on record for you. Ask HR to change anything you cannot edit here.</p>
        </div>
        <button className="btn btn-ghost" type="button" id="signout" onClick={() => signOutTo((href) => router.push(href))}>
          <span data-icon="logout" aria-hidden="true">
            <Icon name="logout" />
          </span>{" "}
          Sign out
        </button>
      </div>
      <div className="two-col">
        <div className="stack stack-lg">
          <section className="panel" aria-labelledby="h-det">
            <div className="panel-head">
              <h2 id="h-det">Details</h2>
            </div>
            <div className="panel-body">
              <Kv
                id="details"
                pairs={[
                  ["Name", me.name],
                  ["Employee number", me.employeeNo],
                  ["Role", me.role],
                  ["Department", me.dept],
                  ["Branch", branchName(d, me.branchId)],
                  ["Start date", me.startDate ? fmtDay(me.startDate) + " · " + service(me.startDate) : ""],
                  ["Email", me.email],
                  ["Phone", me.phone],
                  ["Address", me.address],
                ]}
              />
            </div>
          </section>
          <section className="panel" aria-labelledby="h-em">
            <div className="panel-head">
              <h2 id="h-em">Emergency contact</h2>
            </div>
            <EmergencyForm me={me} />
          </section>
        </div>
        <div className="stack stack-lg">
          <section className="panel" aria-labelledby="h-bank">
            <div className="panel-head">
              <h2 id="h-bank">Bank for payroll</h2>
            </div>
            <div className="panel-body">
              <Kv
                id="bank"
                pairs={[
                  ["Bank", me.bank && me.bank.bank],
                  ["Account", me.bank && me.bank.masked],
                ]}
              />
              <p className="hint">To change your bank details, bring a bank letter or voided cheque to HR. Bank changes are not made in the portal.</p>
            </div>
          </section>
          <section className="panel" aria-labelledby="h-id">
            <div className="panel-head">
              <h2 id="h-id">Identity documents</h2>
              <Link href="/portal/docs#documents">Manage</Link>
            </div>
            <ul className="list" id="id-docs">
              {comp.length ? (
                comp.map((c) => {
                  const n = c.expiry ? daysUntil(c.expiry) : null;
                  return (
                    <li key={c.docId}>
                      <div className="grow">
                        <strong>{docName(d, c.docId)}</strong>
                        {c.expiry ? <div className="meta">{(n != null && n < 0 ? "Expired " : "Expires ") + fmtDay(c.expiry)}</div> : null}
                      </div>
                      <DocBadge state={docDisplayState(c)} />
                    </li>
                  );
                })
              ) : (
                <EmptyRow text="No documents on file." />
              )}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

export function PortalProfile() {
  return (
    <PortalPage active="profile" title="Profile" page="profile">
      {(me, d) => <ProfileBody me={me} d={d} />}
    </PortalPage>
  );
}
