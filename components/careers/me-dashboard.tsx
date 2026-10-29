"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { OutcomeCard } from "@/components/careers/outcome-card";
import { FileMeta, Thumb, UploadButton, usePreviews } from "@/components/careers/parts";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { branchName, fileProblem } from "@/lib/careers/helpers";
import { docDisplayState, fmtDate, fmtDateTime } from "@/lib/format";
import { applicantBadge, applicantClosed, applicantMessages, applicantSteps, applicantTimeline, isSealed } from "@/lib/hr/outcome";
import { DOC_LEGEND, DOC_PLAIN, DOC_STATE_PLAIN } from "@/lib/hr/plain";
import { byId, currentApplicant, requiredDocsFor, setDocState, setStage, update, useData, useRequireRole, useSession } from "@/lib/store";
import type { KycDoc } from "@/lib/types";

// Ported from careers.js renderMe (careers/me.html): the applicant's decision card, status tracker, documents,
// messages, interview and timeline, all in plain words (lib/hr/plain.ts). Applicants only; nothing renders until the
// session is known. ?submitted=1 shows the thanks note once and is dropped from the address bar, as before.
//
// While an HR decision is sealed (lib/hr/outcome.ts), this page must not hint at it: the badge, tracker, messages,
// timeline, uploads and the withdraw link behave the same for an offer and for not selected until it is opened.

export function MeDashboard() {
  const s = useRequireRole(["applicant"]);
  if (!s) return null;
  return (
    <Suspense fallback={null}>
      <MeView />
    </Suspense>
  );
}

const stackStyle = { "--stack": "var(--s5)" } as React.CSSProperties;

function MeView() {
  const params = useSearchParams();
  const submitted = params.get("submitted") === "1";
  const [thanks, setThanks] = useState(submitted);
  const d = useData();
  const a = currentApplicant(d, useSession());
  const { confirm } = useConfirm();
  // Bumped wherever the static page called render(): the document rows are rebuilt and the thanks note goes.
  const [seq, setSeq] = useState(0);
  const [rowErrs, setRowErrs] = useState<Record<string, string>>({});
  const [badgeFocus, setBadgeFocus] = useState<{ id: string } | null>(null);
  const { previews, setPreview } = usePreviews();
  const docsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!submitted) return;
    try {
      history.replaceState(null, "", location.pathname);
    } catch {}
  }, [submitted]);

  useEffect(() => {
    if (!badgeFocus) return;
    const badge = docsRef.current?.querySelector<HTMLElement>('[data-doc="' + CSS.escape(badgeFocus.id) + '"] .badge');
    if (badge) {
      badge.setAttribute("tabindex", "-1");
      badge.focus();
    }
  }, [badgeFocus]);

  if (!a) {
    return (
      <div className="empty">
        <h2 style={{ fontSize: "1.5rem" }}>No application found</h2>
        <p style={{ marginInline: "auto" }}>
          This demo session is not linked to an application. Browse the open roles to start one, or switch role from the demo login.
        </p>
        <p>
          <Link className="btn btn-sign" href="/careers">
            Browse roles
          </Link>{" "}
          <Link className="btn btn-ghost" href="/portal">
            Demo login
          </Link>
        </p>
      </div>
    );
  }
  const ap = a;

  function rerender() {
    setThanks(false);
    setRowErrs({});
    setSeq((n) => n + 1);
  }

  const job = byId(d.jobs, ap.jobId);
  const branch = job ? branchName(d, job.branchId) : "";
  const sealed = isSealed(ap);
  const closed = applicantClosed(ap);
  const req = requiredDocsFor(d, ap);
  const docs = ap.docs || {};
  const verified = req.filter((doc) => docDisplayState(docs[doc.id]) === "verified").length;
  const badge = applicantBadge(ap);
  const steps = applicantSteps(d, ap);

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
    const prev = docs[doc.id];
    setPreview(doc.id, file);
    const expiry = expiryEl?.value || prev?.expiry || "";
    // metadata only; `reason: undefined` clears an old flag reason and is dropped by JSON
    setDocState(ap.id, doc.id, "uploaded", { fileName: file.name, size: file.size, type: file.type || "", expiry: expiry || undefined, reason: undefined });
    toast("Document added. HR will check it.", "ok");
    rerender();
    setBadgeFocus({ id: doc.id });
  }

  function onExpiry(docId: string, value: string) {
    update((dd) => {
      const rec = byId(dd.applicants, ap.id)?.docs?.[docId];
      if (rec) rec.expiry = value;
    });
  }

  async function withdraw() {
    const ok = await confirm({
      title: "Withdraw your application?",
      body: "Your application for " + (job ? job.title : "this role") + " is closed and HR is told. You can apply again for another role.",
      okLabel: "Withdraw",
      danger: true,
    });
    if (!ok) return;
    setStage(ap.id, "withdrawn", "Withdrawn by applicant");
    toast("Application withdrawn.");
    rerender();
  }

  const messages = applicantMessages(ap)
    .slice()
    .sort((x, y) => (y.at || "").localeCompare(x.at || ""));
  const timeline = applicantTimeline(d, ap);
  const canWithdraw = !sealed && !closed && ap.stage !== "hired";

  return (
    <>
      {thanks && (
        <p className="alert alert-ok" style={{ marginBottom: "var(--s5)" }}>
          <Icon name="check" />
          <span>Thanks, your application is in. We will write to you here when it moves.</span>
        </p>
      )}
      <div className="page-head me-head">
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>
            My application
          </p>
          <h1>{job ? job.title : "Application"}</h1>
          <p className="muted">{branch + (job ? " · " + job.type : "") + " · Applied " + fmtDate(ap.submittedAt)}</p>
        </div>
        <div>{badge.tone === "plain" ? <Badge plain>{badge.label}</Badge> : <Badge variant={badge.tone}>{badge.label}</Badge>}</div>
      </div>
      <OutcomeCard d={d} a={ap} onChange={rerender} />
      <div className="two-col">
        <div className="stack" style={stackStyle}>
          <section className="panel" aria-labelledby="status-h">
            <div className="panel-head">
              <h2 id="status-h">Where your application is</h2>
            </div>
            <div className="panel-body">
              <ol className="tracker tracker-plain" data-tour="applicant-stages">
                {steps.map((st) => (
                  <li key={st.id} className={"is-" + st.state}>
                    <span className="dot" aria-hidden="true">
                      {st.state === "done" ? <Icon name="check" /> : null}
                    </span>
                    <div>
                      <strong>
                        {st.label}
                        {st.state === "current" ? <span className="visually-hidden"> (you are here)</span> : null}
                        {st.state === "skipped" ? <span className="visually-hidden"> (not needed)</span> : null}
                      </strong>
                      {st.at && (st.state === "done" || st.state === "current" || st.state === "closed") ? (
                        <span className="meta">{fmtDateTime(st.at)}</span>
                      ) : null}
                      {st.state !== "skipped" ? <span className="tracker-hint">{st.hint}</span> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <section className="panel" aria-labelledby="docs-h" ref={docsRef} data-tour="applicant-documents">
            <div className="panel-head">
              <h2 id="docs-h">Your documents</h2>
              <span className="small muted">{verified + " of " + req.length + " checked"}</span>
            </div>
            <div className="panel-body flush">
              <dl className="doc-legend" aria-label="What the labels mean">
                {DOC_LEGEND.map((l) => (
                  <div key={l.label}>
                    <dt>{l.label}:</dt>
                    <dd>{l.text}</dd>
                  </div>
                ))}
              </dl>
              {req.map((doc) => {
                const m = docs[doc.id];
                const state = docDisplayState(m);
                const plain = DOC_STATE_PLAIN[state] ?? DOC_STATE_PLAIN.missing;
                const has = !!(m && m.fileName);
                const canUpload = !closed && (state === "missing" || state === "flagged" || state === "expired");
                return (
                  <div className="doc-row" data-doc={doc.id} key={doc.id + ":" + seq}>
                    <div className="doc-main">
                      <Thumb meta={m} preview={previews[doc.id]} />
                      <div className="doc-text">
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-desc">{DOC_PLAIN[doc.id] || doc.desc}</div>
                        <FileMeta meta={m} />
                        {canUpload && doc.expires && (
                          <label className="doc-expiry">
                            {"Expiry date "}
                            <input type="date" data-doc-expiry={doc.id} defaultValue={(m && m.expiry) || ""} onChange={(e) => onExpiry(doc.id, e.target.value)} />
                          </label>
                        )}
                        {rowErrs[doc.id] && (
                          <p className="error-text" role="alert">
                            {rowErrs[doc.id]}
                          </p>
                        )}
                      </div>
                    </div>
                    {plain.variant === "neutral" ? <Badge>{plain.label}</Badge> : <Badge variant={plain.variant}>{plain.label}</Badge>}
                    <div className="doc-actions">
                      {canUpload && <UploadButton doc={doc} label={has ? "Upload a new copy" : "Upload"} onFile={(e) => onFile(e, doc)} />}
                    </div>
                    {state === "flagged" && (
                      <div className="doc-reason doc-reason-plain">
                        <strong>{"HR’s note: "}</strong>
                        {m && m.reason ? m.reason : "This copy could not be accepted."}
                        <span className="doc-reason-next">Upload a new copy and HR will check it again.</span>
                      </div>
                    )}
                    {state === "expired" && <div className="doc-reason doc-reason-plain">This document has expired. Upload a current one and HR will check it again.</div>}
                  </div>
                );
              })}
              <div className="doc-foot">
                <p className="hint">Files are previewed in your browser only. In this demo nothing is uploaded or stored.</p>
              </div>
            </div>
          </section>
        </div>
        <div className="stack" style={stackStyle}>
          <section className="panel" aria-labelledby="msg-h" data-tour="applicant-messages">
            <div className="panel-head">
              <h2 id="msg-h">Messages</h2>
            </div>
            {messages.length ? (
              <ul className="list">
                {messages.map((m, i) => (
                  <li key={i}>
                    <div className="grow">
                      <strong>{m.from}</strong>
                      <div className="meta">{fmtDateTime(m.at)}</div>
                      <p className="summary-text" style={{ margin: "6px 0 0", fontSize: ".9375rem" }}>
                        {m.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="panel-body">
                <p className="muted" style={{ margin: 0 }}>
                  No messages yet. HR will write here when they need something from you.
                </p>
              </div>
            )}
          </section>
          {ap.interview && (
            <div className="card">
              <p className="eyebrow bare">Interview</p>
              <h3 style={{ fontSize: "1.25rem" }}>{fmtDateTime(ap.interview.at)}</h3>
              <dl className="kv">
                <dt>Where</dt>
                <dd>{ap.interview.where}</dd>
                <dt>With</dt>
                <dd>{ap.interview.with}</dd>
              </dl>
            </div>
          )}
          <section className="panel" aria-labelledby="tl-h">
            <div className="panel-head">
              <h2 id="tl-h">What has happened so far</h2>
            </div>
            <div className="panel-body">
              <ol className="timeline">
                {timeline.map((t, i) => (
                  <li key={i}>
                    <time dateTime={t.at}>{fmtDateTime(t.at)}</time>
                    {t.text}
                  </li>
                ))}
              </ol>
            </div>
          </section>
          {canWithdraw && (
            <p className="withdraw-row">
              <button className="link-btn" type="button" id="withdraw-btn" onClick={withdraw}>
                Withdraw application
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
