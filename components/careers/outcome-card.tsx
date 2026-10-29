"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { fmtDate, fmtDateTime, money, telHref } from "@/lib/format";
import { acceptOffer, declineOffer, openOutcome } from "@/lib/hr/hr";
import { RETENTION_DAYS, hrWho, outcomeView, type OutcomeView } from "@/lib/hr/outcome";
import type { Applicant, Seed } from "@/lib/types";

/* The applicant's decision card. An HR decision arrives sealed ("An update on your application"), and the sealed card
   is the same for an offer and for not selected: same colours, same words, no icon. Opening it is a short reveal (the
   flap lifts, the letter rises, about 400 ms, ease-out); with reduced motion it is an instant swap. Focus moves to the
   letter's heading and a polite live region says it is open. After that the card stays on the page as "Decision".

   SealedLetter and OpenedLetter are also HR's preview (components/hr/decision-form.tsx), with `inert` set: the same
   markup the applicant gets, with buttons that do nothing. */

function Flap() {
  return (
    <svg className="outcome-flap" viewBox="0 0 400 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 0H400L200 62Z" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A button that looks the same in HR's preview but cannot be pressed there. */
function Act({ inert, className, onClick, children, id }: { inert?: boolean; className: string; onClick?: () => void; children: ReactNode; id?: string }) {
  if (inert)
    return (
      <span className={className + " is-inert"} aria-hidden="true">
        {children}
      </span>
    );
  return (
    <button type="button" className={className} onClick={onClick} id={id}>
      {children}
    </button>
  );
}

export function SealedLetter({ v, onOpen, inert, headingId }: { v: OutcomeView; onOpen?: () => void; inert?: boolean; headingId?: string }) {
  return (
    <div className="outcome is-sealed" data-tour={inert ? undefined : "applicant-update-sealed"}>
      <Flap />
      <div className="outcome-inner">
        <p className="outcome-kicker">Southern Food Basket HR</p>
        <h2 className="outcome-title" id={headingId}>
          An update on your application
        </h2>
        <p className="outcome-job">{v.jobTitle + (v.store ? " · " + v.store : "")}</p>
        <p className="outcome-date">{"Sent " + fmtDate(v.at)}</p>
        <p className="outcome-line">{capital(hrWho(v.from)) + " has an update for you. Open it when you are ready."}</p>
        <Act inert={inert} className="btn btn-primary" onClick={onOpen} id={inert ? undefined : "outcome-open"}>
          Open your update
        </Act>
        <p className="outcome-foot">It stays on this page after you open it.</p>
      </div>
    </div>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Letter({ v }: { v: OutcomeView }) {
  return (
    <figure className="outcome-note">
      <figcaption>{"From " + (v.from === "HR" ? "the HR team" : v.from + ", HR") + " · " + fmtDate(v.at)}</figcaption>
      <p className="summary-text">{v.letter}</p>
    </figure>
  );
}

function Contact({ v }: { v: OutcomeView }) {
  return (
    <>
      <a href={"mailto:" + encodeURIComponent(v.contact.email).replace("%40", "@")}>{v.contact.email}</a>
      {" or call "}
      <a href={telHref(v.contact.phone)}>{v.contact.phone}</a>
    </>
  );
}

type OpenedProps = {
  v: OutcomeView;
  inert?: boolean;
  revealing?: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onAccept?: () => void;
  onDecline?: () => void;
};

export function OpenedLetter({ v, inert, revealing, headingRef, onAccept, onDecline }: OpenedProps) {
  const who = hrWho(v.from);
  const cls = "outcome is-open" + (revealing ? " is-revealing" : "");
  const tour = inert ? undefined : "applicant-update-open";
  const kicker = (
    <p className="outcome-kicker">{"Decision · sent " + fmtDate(v.at) + (v.openedAt ? " · opened " + fmtDateTime(v.openedAt) : "")}</p>
  );

  if (v.kind === "offer") {
    const o = v.offer;
    const status = o?.status || "sent";
    return (
      <div className={cls} data-tour={tour} data-kind="offer">
        {revealing ? <Flap /> : null}
        <div className="outcome-inner">
          {kicker}
          <h2 className="outcome-title" tabIndex={-1} ref={headingRef}>
            We’d like you to join the team
          </h2>
          <p className="outcome-job">{v.jobTitle + (v.store ? " · " + v.store : "")}</p>
          <Letter v={v} />
          {o ? (
            <dl className="kv outcome-terms">
              <dt>Pay</dt>
              <dd className="outcome-pay">{money(o.pay, o.payUnit)}</dd>
              <dt>Start date</dt>
              <dd>{fmtDate(o.startDate, { weekday: true })}</dd>
              <dt>Store</dt>
              <dd>{v.store + (v.storeAddress ? ", " + v.storeAddress : "")}</dd>
              {v.jobType ? (
                <>
                  <dt>Job</dt>
                  <dd>{v.jobType}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
          <h3 className="outcome-h3">What happens next</h3>
          <ol className="outcome-steps">
            <li>
              {"Read the details and decide. If anything is unclear, write to "}
              <Contact v={v} />
              {" first."}
            </li>
            <li>{"When you accept, " + who + " calls you within two working days (typical) to confirm your first day and your shift."}</li>
            {v.bring.length ? <li>{"On your first day, bring the originals of: " + v.bring.join(", ") + ". HR checks them in person."}</li> : null}
          </ol>
          {status === "sent" ? (
            <>
              <div className="outcome-actions">
                <Act inert={inert} className="btn btn-primary" onClick={onAccept} id={inert ? undefined : "offer-accept"}>
                  Accept the offer
                </Act>
                <Act inert={inert} className="btn btn-ghost" onClick={onDecline} id={inert ? undefined : "offer-decline"}>
                  I’d like to decline
                </Act>
              </div>
              <ul className="outcome-after">
                <li>
                  <strong>If you accept:</strong>
                  {" your start date" + (o ? " of " + fmtDate(o.startDate) : "") + " is confirmed and " + who + " calls you about your first day."}
                </li>
                <li>
                  <strong>If you decline:</strong> this application closes and HR is told. You can still apply for other jobs.
                </li>
              </ul>
            </>
          ) : status === "accepted" ? (
            <p className="alert alert-ok outcome-status">
              <Icon name="check" />
              <span>{"You accepted this offer" + (o?.respondedAt ? " on " + fmtDate(o.respondedAt) : "") + ". " + capital(who) + " will call you to confirm your first day."}</span>
            </p>
          ) : (
            <p className="outcome-status outcome-quiet">
              {"You declined this offer" + (o?.respondedAt ? " on " + fmtDate(o.respondedAt) : "") + ", so this application is closed. You are welcome to "}
              <Link href="/careers">apply for other jobs</Link>
              {" at any time."}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cls} data-tour={tour} data-kind="not-selected">
      {revealing ? <Flap /> : null}
      <div className="outcome-inner">
        {kicker}
        <h2 className="outcome-title" tabIndex={-1} ref={headingRef}>
          This time, we won’t be offering you the job
        </h2>
        <p className="outcome-job">{v.jobTitle + (v.store ? " · " + v.store : "")}</p>
        <Letter v={v} />
        <p className="outcome-kind">
          Thank you for the time you gave us. This decision is about this one job and who applied for it this time. It is not a judgement of you as a
          person.
        </p>
        <h3 className="outcome-h3">What you can do next</h3>
        <ul className="outcome-next">
          <li>
            <strong>Look at other open jobs</strong>
            {v.others.length ? (
              <>
                <span>{"These are open now" + (v.store ? " at " + v.store + " or" : "") + " in the same department:"}</span>
                <ul className="outcome-jobs">
                  {v.others.map((j) =>
                    inert ? (
                      <li key={j.id}>{j.title + " · " + j.store}</li>
                    ) : (
                      <li key={j.id}>
                        <Link href={"/careers/" + encodeURIComponent(j.id)}>{j.title + " · " + j.store}</Link>
                      </li>
                    ),
                  )}
                </ul>
              </>
            ) : (
              <span>{"Nothing else is open" + (v.store ? " at " + v.store : "") + " or in the same department right now. New jobs appear on the careers page."}</span>
            )}
            {inert ? <span>See every open job</span> : <Link href="/careers">See every open job</Link>}
          </li>
          <li>
            <strong>Apply again whenever you like</strong>
            <span>You can apply for any open job, and for this kind of job when it is posted again.</span>
          </li>
          <li>
            <strong>Your documents</strong>
            <span>
              {"We delete this application and the documents you added " + RETENTION_DAYS + " days after this decision, on " + fmtDate(v.deleteOn) + "."}
            </span>
            <span className="outcome-demo">Demo retention period: the store sets the real one.</span>
          </li>
          <li>
            <strong>Questions</strong>
            <span>
              {"Write to "}
              <Contact v={v} />
              {" and ask for HR."}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** The live card on the applicant's dashboard. Renders nothing without an outcome. */
export function OutcomeCard({ d, a, onChange }: { d: Seed; a: Applicant; onChange?: () => void }) {
  const { confirm, prompt } = useConfirm();
  const [revealing, setRevealing] = useState(false);
  const [announce, setAnnounce] = useState("");
  const headRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (revealing) headRef.current?.focus();
  }, [revealing]);

  const v = outcomeView(d, a);
  if (!a.outcome || !v) return null;
  const sealed = !a.outcome.openedAt;

  function open() {
    openOutcome(a.id);
    setRevealing(true);
    setAnnounce("Your update is open.");
  }

  async function accept() {
    const o = v?.offer;
    if (!o) return;
    const ok = await confirm({
      title: "Accept this offer?",
      body: money(o.pay, o.payUnit) + ", starting " + fmtDate(o.startDate) + (v.store ? ", at " + v.store : "") + ". " + capital(hrWho(v.from)) + " is told straight away and will call you to confirm your first day.",
      okLabel: "Accept the offer",
    });
    if (!ok) return;
    acceptOffer(a.id);
    toast("Offer accepted. Welcome to the team.", "ok");
    onChange?.();
  }

  async function decline() {
    if (!v?.offer) return;
    const reason = await prompt({
      title: "Decline this offer?",
      body: "HR is told and this application closes. You can still apply for other jobs. If you like, tell us why: it is optional, and only HR reads it.",
      label: "Why you are declining (optional)",
      placeholder: "For example: I have taken another job.",
      okLabel: "Decline the offer",
    });
    if (reason == null) return;
    declineOffer(a.id, reason);
    toast("Offer declined. HR has been told.");
    onChange?.();
  }

  return (
    <section className="outcome-wrap" aria-label="Decision">
      <p className="visually-hidden" aria-live="polite">
        {announce}
      </p>
      {sealed ? (
        <SealedLetter v={v} onOpen={open} headingId="outcome-sealed-h" />
      ) : (
        <OpenedLetter v={v} revealing={revealing} headingRef={headRef} onAccept={accept} onDecline={decline} />
      )}
    </section>
  );
}
