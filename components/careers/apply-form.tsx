"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { FileMeta, Thumb, UploadButton, usePreviews } from "@/components/careers/parts";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import {
  AVAILABILITY,
  STEPS,
  blankDraft,
  branchName,
  clearDraft,
  fileProblem,
  formatsLabel,
  loadDraft,
  saveDraft,
  stepFromHash,
  todayIso,
  validate,
  type Consent,
  type Draft,
  type FieldError,
} from "@/lib/careers/helpers";
import { fmtDate } from "@/lib/format";
import { DOC_PLAIN } from "@/lib/hr/plain";
import { addApplicant, byId, login, nowIso, requiredDocsFor, useData, useHydrated } from "@/lib/store";
import type { DocRecord, Job, KycDoc } from "@/lib/types";

// Ported from careers.js renderApply (careers/apply.html?id=): the five-step application. The step lives in the
// hash (#step-1…#step-5) and every hash change is user navigation, as before; the draft is saved to
// sfb-apply-draft-<jobId> on every edit; consent is never saved. The card prerenders as step 1 of a blank draft and
// picks up the hash and the saved draft once hydrated.

/** Before the application is sent nothing has been checked yet, so the badge says only whether a file is added. */
function AddedBadge({ has }: { has: boolean }) {
  return has ? <Badge variant="info">Added</Badge> : <Badge>Not added yet</Badge>;
}

export function ApplyView({ id }: { id: string }) {
  const d = useData();
  const hydrated = useHydrated();
  const job = byId(d.jobs, id);
  const open = !!job && job.status === "open";
  const title = open ? "Apply: " + job.title + " · Southern Food Basket" : "Apply · Careers · Southern Food Basket";
  useEffect(() => {
    if (hydrated) document.title = title;
  }, [hydrated, title]);

  if (!job || !open) {
    return (
      <div className="empty">
        <h2 style={{ fontSize: "1.5rem" }}>{job ? "This role is no longer open" : "We could not find that role"}</h2>
        <p style={{ marginInline: "auto" }}>Pick a role from the careers page to start an application.</p>
        <Link className="btn btn-sign" href="/careers">
          See open roles
        </Link>
      </div>
    );
  }
  const jobHref = "/careers/" + encodeURIComponent(job.id);
  return (
    <>
      <div className="apply-head">
        <p className="eyebrow">Apply</p>
        <h1>{job.title}</h1>
        <p className="muted">
          {branchName(d, job.branchId) + " · " + job.type + "  ·  "}
          <Link href={jobHref}>Role details</Link>
        </p>
      </div>
      <ApplyCard job={job} jobHref={jobHref} />
    </>
  );
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="field" data-err={id}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
      <ErrorText msg={error} />
    </div>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  return msg ? (
    <p className="error-text" role="alert">
      {msg}
    </p>
  ) : null;
}

function ReviewKv({ pairs }: { pairs: [string, React.ReactNode][] }) {
  return (
    <dl className="review-kv">
      {pairs.map(([k, v]) => (
        <Fragment key={k}>
          <dt>{k}</dt>
          <dd>{v || <span className="muted">Not given</span>}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function ApplyCard({ job, jobHref }: { job: Job; jobHref: string }) {
  const d = useData();
  const router = useRouter();
  const hydrated = useHydrated();
  const [live, setLive] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState<Consent>({ truth: false, process: false });
  const [errs, setErrs] = useState<{ list: FieldError[] } | null>(null);
  const [navSeq, setNavSeq] = useState(0);
  // Step 4 rows are rebuilt after every file change or removal, as the static re-render rebuilt them.
  const [docSeq, setDocSeq] = useState(0);
  const [rowErrs, setRowErrs] = useState<Record<string, string>>({});
  const [focusDoc, setFocusDoc] = useState<{ id: string } | null>(null);
  const { previews, setPreview, clearPreviews } = usePreviews();
  const panelRef = useRef<HTMLDivElement>(null);

  if (hydrated && !live) {
    setLive(true);
    setDraft(loadDraft(job.id));
    setStep(stepFromHash());
  }

  useEffect(() => {
    function onHash() {
      setStep(stepFromHash());
      setErrs(null);
      setRowErrs({});
      setNavSeq((n) => n + 1);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!navSeq) return;
    const h = panelRef.current?.querySelector<HTMLElement>(".step-title");
    if (h) {
      h.focus({ preventScroll: true });
      panelRef.current?.closest("#apply-root")?.scrollIntoView({ block: "start" });
    }
  }, [navSeq]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!errs || !errs.list.length || !panel) return;
    const id = errs.list[0].id;
    const field = panel.querySelector<HTMLElement>("#" + CSS.escape(id));
    const host = panel.querySelector<HTMLElement>('[data-err="' + CSS.escape(id) + '"]') || field?.closest<HTMLElement>(".field, .check, fieldset") || null;
    const first = field || host;
    if (first) {
      first.focus({ preventScroll: false });
      first.scrollIntoView({ block: "center" });
    }
  }, [errs]);

  useEffect(() => {
    if (focusDoc) panelRef.current?.querySelector<HTMLElement>('[data-doc="' + CSS.escape(focusDoc.id) + '"] [data-doc-file]')?.focus();
  }, [focusDoc]);

  const today = live ? todayIso() : "";
  const req = requiredDocsFor(d, { jobId: job.id, nonNational: !draft.personal.national });
  const hasPid = !!draft.docs["photo-id"]?.fileName;
  const errFor = (id: string) => (errs ? errs.list.find((e) => e.id === id)?.msg : undefined);
  const invalid = (id: string) => (errFor(id) ? true : undefined);

  function edit(fn: (x: Draft) => void) {
    const next = structuredClone(draft);
    fn(next);
    setDraft(next);
    saveDraft(job.id, next);
  }

  function go(n: number) {
    if (stepFromHash() === n) {
      setStep(n);
      setErrs(null);
      setRowErrs({});
      setNavSeq((s) => s + 1);
    } else location.hash = "step-" + n;
  }

  function docChanged(docId: string, next: Draft) {
    setDraft(next);
    saveDraft(job.id, next);
    setRowErrs({});
    setDocSeq((s) => s + 1);
    setFocusDoc({ id: docId });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>, doc: KycDoc) {
    const input = e.currentTarget;
    const file = input.files && input.files[0];
    if (!file) return;
    const problem = fileProblem(file, doc);
    if (problem) {
      setRowErrs({ ...rowErrs, [doc.id]: problem });
      toast(problem, "bad");
      input.value = "";
      return;
    }
    const expiryEl = input.closest(".doc-row")?.querySelector<HTMLInputElement>("[data-doc-expiry]");
    const prev = draft.docs[doc.id];
    setPreview(doc.id, file);
    const next = structuredClone(draft);
    next.docs[doc.id] = { fileName: file.name, size: file.size, type: file.type || "", expiry: expiryEl?.value || prev?.expiry || "", state: "uploaded" };
    docChanged(doc.id, next);
  }

  function onRemove(docId: string) {
    setPreview(docId, null);
    const next = structuredClone(draft);
    delete next.docs[docId];
    docChanged(docId, next);
  }

  /** An expiry edit saves in place, with no rebuild, so the date input keeps focus. */
  function onExpiry(docId: string, value: string) {
    edit((x) => {
      if (x.docs[docId]) x.docs[docId].expiry = value;
      else if (value) x.docs[docId] = { expiry: value, state: "missing" };
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    saveDraft(job.id, draft);
    const now = todayIso();
    if (step < 5) {
      const list = validate(step, draft, consent, now);
      if (list.length) {
        setErrs({ list });
        return;
      }
      go(step + 1);
      return;
    }
    for (let n = 1; n <= 3; n++) {
      const list = validate(n, draft, consent, now);
      if (list.length) {
        toast("Step " + n + " needs attention.", "bad");
        go(n);
        setTimeout(() => setErrs({ list }), 50);
        return;
      }
    }
    const list = validate(5, draft, consent, now);
    if (list.length) {
      setErrs({ list });
      return;
    }
    submitApplication();
  }

  function submitApplication() {
    const a = draft.account,
      p = draft.personal,
      x = draft.experience;
    const docs: Record<string, DocRecord> = {};
    Object.keys(draft.docs).forEach((id) => {
      const m = draft.docs[id];
      if (!m || !m.fileName) return;
      docs[id] = { fileName: m.fileName, size: m.size, type: m.type || "", state: "uploaded", updatedAt: nowIso() };
      if (m.expiry) docs[id].expiry = m.expiry;
    });
    const app = addApplicant({
      name: a.name.trim(),
      email: a.email.trim(),
      phone: a.phone.trim(),
      jobId: job.id,
      personal: { address: p.address.trim(), dob: p.dob, nonNational: !p.national },
      experience: { summary: x.summary.trim(), availability: x.availability.slice(), startDate: x.startDate },
      docs,
    });
    login("applicant", app.id);
    clearDraft(job.id);
    clearPreviews();
    toast("Application submitted", "ok");
    router.push("/careers/me?submitted=1");
  }

  function renderAccount() {
    const a = draft.account;
    return (
      <>
        <h2 className="step-title" tabIndex={-1}>
          Your details
        </h2>
        <p className="step-intro">How we reach you about this application.</p>
        <p className="demo-note">Demo: no account is created and nothing is sent.</p>
        <Field id="f-name" label="Full name" error={errFor("f-name")}>
          <input
            type="text"
            id="f-name"
            autoComplete="name"
            value={a.name}
            required
            aria-invalid={invalid("f-name")}
            onChange={(e) => {
              const v = e.target.value;
              edit((x) => {
                x.account.name = v;
              });
            }}
          />
        </Field>
        <div className="form-row">
          <Field id="f-email" label="Email" error={errFor("f-email")}>
            <input
              type="email"
              id="f-email"
              autoComplete="email"
              value={a.email}
              required
              aria-invalid={invalid("f-email")}
              onChange={(e) => {
                const v = e.target.value;
                edit((x) => {
                  x.account.email = v;
                });
              }}
            />
          </Field>
          <Field id="f-phone" label="Phone" error={errFor("f-phone")}>
            <input
              type="tel"
              id="f-phone"
              autoComplete="tel"
              value={a.phone}
              placeholder="(868) 000-0000"
              required
              aria-invalid={invalid("f-phone")}
              onChange={(e) => {
                const v = e.target.value;
                edit((x) => {
                  x.account.phone = v;
                });
              }}
            />
          </Field>
        </div>
      </>
    );
  }

  function renderPersonal() {
    const p = draft.personal;
    return (
      <>
        <h2 className="step-title" tabIndex={-1}>
          About you
        </h2>
        <p className="step-intro">Where you live, your age and your right to work. This decides which documents we ask for.</p>
        <Field id="f-address" label="Home address" hint="Street, village or town." error={errFor("f-address")}>
          <input
            type="text"
            id="f-address"
            autoComplete="street-address"
            value={p.address}
            required
            aria-invalid={invalid("f-address")}
            onChange={(e) => {
              const v = e.target.value;
              edit((x) => {
                x.personal.address = v;
              });
            }}
          />
        </Field>
        <Field id="f-dob" label="Date of birth" hint="You must be at least 16." error={errFor("f-dob")}>
          <input
            type="date"
            id="f-dob"
            autoComplete="bday"
            value={p.dob}
            max={today}
            required
            aria-invalid={invalid("f-dob")}
            onChange={(e) => {
              const v = e.target.value;
              edit((x) => {
                x.personal.dob = v;
              });
            }}
          />
        </Field>
        <div className="field" data-err="f-national">
          <label className="check">
            <input
              type="checkbox"
              id="f-national"
              checked={p.national}
              onChange={(e) => {
                const v = e.target.checked;
                edit((x) => {
                  x.personal.national = v;
                });
              }}
            />
            <span>I am a national of Trinidad and Tobago or hold a CARICOM skills certificate</span>
          </label>
          <p className="hint">Leave this unticked if neither applies; we will then ask for a work permit in the Documents step.</p>
        </div>
      </>
    );
  }

  function renderExperience() {
    const x = draft.experience;
    return (
      <>
        <h2 className="step-title" tabIndex={-1}>
          Experience and availability
        </h2>
        <p className="step-intro">A few lines about your work so far and when you can work.</p>
        <Field
          id="f-summary"
          label="Your experience"
          error={errFor("f-summary")}
          hint={
            <>
              {"At least 40 characters. Jobs, training, or anything that shows you can do this role. "}
              <span id="summary-count">{x.summary.trim().length}</span>
              {" characters so far."}
            </>
          }
        >
          <textarea
            id="f-summary"
            rows={5}
            required
            minLength={40}
            value={x.summary}
            aria-invalid={invalid("f-summary")}
            onChange={(e) => {
              const v = e.target.value;
              edit((y) => {
                y.experience.summary = v;
              });
            }}
          />
        </Field>
        <fieldset data-err="f-avail" id="f-avail">
          <legend>Availability</legend>
          <div className="avail">
            {AVAILABILITY.map((opt, i) => (
              <label className="check" key={opt}>
                <input
                  type="checkbox"
                  name="avail"
                  value={opt}
                  id={"avail-" + i}
                  checked={x.availability.includes(opt)}
                  onChange={(e) => {
                    const on = e.target.checked;
                    edit((y) => {
                      y.experience.availability = AVAILABILITY.filter((o) => (o === opt ? on : y.experience.availability.includes(o)));
                    });
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          <ErrorText msg={errFor("f-avail")} />
        </fieldset>
        <Field id="f-start" label="Earliest start date" error={errFor("f-start")}>
          <input
            type="date"
            id="f-start"
            value={x.startDate}
            min={today}
            required
            aria-invalid={invalid("f-start")}
            onChange={(e) => {
              const v = e.target.value;
              edit((y) => {
                y.experience.startDate = v;
              });
            }}
          />
        </Field>
      </>
    );
  }

  function docRow(doc: KycDoc) {
    const meta = draft.docs[doc.id];
    const has = !!(meta && meta.fileName);
    return (
      <div className="doc-row" data-doc={doc.id} key={doc.id + ":" + docSeq}>
        <div className="doc-main">
          <Thumb meta={meta} preview={previews[doc.id]} />
          <div className="doc-text">
            <div className="doc-name">
              {doc.name}
              {doc.id === "photo-id" && (
                <>
                  {" "}
                  <span className="small muted" style={{ fontWeight: 500 }}>
                    (required to submit)
                  </span>
                </>
              )}
            </div>
            <div className="doc-desc">{(DOC_PLAIN[doc.id] || doc.desc) + " Accepted: " + formatsLabel(doc.formats) + "."}</div>
            <FileMeta meta={meta} />
            {doc.expires && (
              <label className="doc-expiry">
                {"Expiry date "}
                <input type="date" data-doc-expiry={doc.id} defaultValue={(meta && meta.expiry) || ""} min={today} onChange={(e) => onExpiry(doc.id, e.target.value)} />
              </label>
            )}
            <ErrorText msg={rowErrs[doc.id]} />
          </div>
        </div>
        <AddedBadge has={has} />
        <div className="doc-actions">
          <UploadButton doc={doc} label={has ? "Replace" : "Upload"} onFile={(e) => onFile(e, doc)} />
          {has && (
            <button className="btn btn-ghost btn-sm" type="button" data-doc-remove={doc.id} onClick={() => onRemove(doc.id)}>
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderDocuments() {
    return (
      <>
        <h2 className="step-title" tabIndex={-1}>
          Your documents
        </h2>
        <p className="step-intro">HR checks that each document is clear, current and in your name. Upload what you have now. Anything missing stays on your list, and you can add it from your applicant page after you apply.</p>
        <div className="doc-list" id="doc-list">
          {req.map(docRow)}
          <div className="doc-foot">
            <p className="hint">Files are previewed in your browser only. In this demo nothing is uploaded or stored.</p>
          </div>
        </div>
        {!hasPid && (
          <div className="alert alert-warn" style={{ marginTop: "var(--s4)" }}>
            <Icon name="shield" />
            <span>Your government photo ID is required before you can submit. The other documents can wait.</span>
          </div>
        )}
      </>
    );
  }

  function renderReview() {
    const a = draft.account,
      p = draft.personal,
      x = draft.experience;
    const editLink = (n: number) => (
      <a href={"#step-" + n} className="small">
        Edit
      </a>
    );
    return (
      <>
        <h2 className="step-title" tabIndex={-1}>
          Review and submit
        </h2>
        <p className="step-intro">Check everything once more. You can change any step before you submit.</p>
        <section className="review-section">
          <div className="review-head">
            <h3>Your details</h3>
            {editLink(1)}
          </div>
          <ReviewKv
            pairs={[
              ["Name", a.name],
              ["Email", a.email],
              ["Phone", a.phone],
            ]}
          />
        </section>
        <section className="review-section">
          <div className="review-head">
            <h3>About you</h3>
            {editLink(2)}
          </div>
          <ReviewKv
            pairs={[
              ["Address", p.address],
              ["Date of birth", p.dob ? fmtDate(p.dob) : ""],
              ["Right to work", p.national ? "National of Trinidad and Tobago or CARICOM skills certificate" : "Work permit needed"],
            ]}
          />
        </section>
        <section className="review-section">
          <div className="review-head">
            <h3>Experience and availability</h3>
            {editLink(3)}
          </div>
          <ReviewKv
            pairs={[
              ["Experience", x.summary ? <span className="summary-text">{x.summary}</span> : ""],
              ["Availability", x.availability.join(", ")],
              ["Earliest start", x.startDate ? fmtDate(x.startDate) : ""],
            ]}
          />
        </section>
        <section className="review-section">
          <div className="review-head">
            <h3>Documents</h3>
            {editLink(4)}
          </div>
          <ul className="review-docs">
            {req.map((doc) => {
              const m = draft.docs[doc.id];
              const has = !!(m && m.fileName);
              return (
                <li key={doc.id}>
                  <span>
                    {doc.name}
                    {has && (
                      <>
                        {" "}
                        <span className="muted small">{m.fileName}</span>
                      </>
                    )}
                  </span>
                  <AddedBadge has={has} />
                </li>
              );
            })}
          </ul>
          {!hasPid && (
            <div className="alert alert-warn" style={{ marginTop: "var(--s3)" }} data-err="photo-id">
              <Icon name="shield" />
              <span>
                {"Government photo ID is required. "}
                <a href="#step-4">Add it in the Documents step</a>.
              </span>
              <ErrorText msg={errFor("photo-id")} />
            </div>
          )}
        </section>
        <div className="consent">
          <label className="check" data-err="f-true">
            <input
              type="checkbox"
              id="f-true"
              checked={consent.truth}
              aria-invalid={invalid("f-true")}
              onChange={(e) => setConsent({ ...consent, truth: e.target.checked })}
            />
            <span>The information I have given is true and complete.</span>
            <ErrorText msg={errFor("f-true")} />
          </label>
          <label className="check" data-err="f-consent">
            <input
              type="checkbox"
              id="f-consent"
              checked={consent.process}
              aria-invalid={invalid("f-consent")}
              onChange={(e) => setConsent({ ...consent, process: e.target.checked })}
            />
            <span>I consent to Southern Food Basket processing these details to assess my application (demo).</span>
            <ErrorText msg={errFor("f-consent")} />
          </label>
        </div>
        <p className="hint">Submitting creates a demo application in this browser only and signs you in to the applicant dashboard.</p>
      </>
    );
  }

  return (
    <div className="card apply-card">
      <ol className="stepper" id="stepper" aria-label="Application steps">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const inner = (
            <>
              {n + ". "}
              <span>{s.label}</span>
            </>
          );
          return (
            <li key={s.id} className={n < step ? "is-done" : n === step ? "is-current" : ""} aria-current={n === step ? "step" : undefined}>
              {n < step ? (
                <button type="button" data-go={n} aria-label={"Back to step " + n + ": " + s.label} onClick={() => go(n)}>
                  {inner}
                </button>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
      <form id="apply-form" noValidate onSubmit={onSubmit}>
        <div id="step-panel" ref={panelRef}>
          {step === 1 ? renderAccount() : step === 2 ? renderPersonal() : step === 3 ? renderExperience() : step === 4 ? renderDocuments() : renderReview()}
        </div>
        <div className="step-nav" id="step-nav">
          {step > 1 ? (
            <button
              className="btn btn-ghost"
              type="button"
              id="prev-btn"
              onClick={() => {
                saveDraft(job.id, draft);
                go(step - 1);
              }}
            >
              Back
            </button>
          ) : (
            <Link className="btn btn-ghost" href={jobHref}>
              Cancel
            </Link>
          )}
          <span className="spacer"></span>
          {step < 5 ? (
            <button className="btn btn-sign" type="submit">
              {"Continue "}
              <Icon name="arrow" />
            </button>
          ) : (
            <button className="btn btn-sign" type="submit" id="submit-btn">
              Submit application
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
