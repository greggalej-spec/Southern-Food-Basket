"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { DocBadge, StageBadge } from "@/components/badges";
import { FileMeta, Thumb, UploadButton, usePreviews } from "@/components/careers/parts";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { CLOSED_STAGES, MAIN_STAGES, STAGE_HINT, branchName, fileProblem } from "@/lib/careers/helpers";
import { docDisplayState, fmtDate, fmtDateTime, money } from "@/lib/format";
import {
  byId,
  currentApplicant,
  nowIso,
  requiredDocsFor,
  setDocState,
  setStage,
  stageLabel,
  update,
  updateApplicant,
  useData,
  useRequireRole,
  useSession,
} from "@/lib/store";
import type { KycDoc } from "@/lib/types";

// Ported from careers.js renderMe (careers/me.html): the applicant's status tracker, documents, messages, interview,
// offer and timeline. Applicants only; nothing renders until the session is known. ?submitted=1 shows the thanks
// note once and is dropped from the address bar, as before.

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
          <Link className="btn btn-primary" href="/careers">
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
  const closed = CLOSED_STAGES.includes(ap.stage);
  const req = requiredDocsFor(d, ap);
  const docs = ap.docs || {};
  const verified = req.filter((doc) => docDisplayState(docs[doc.id]) === "verified").length;

  /* tracker */
  const reached = new Set(["submitted"]);
  (ap.timeline || []).forEach((t) => {
    const m = /^Moved to (.+?)( —|$)/.exec(t.text || "");
    if (!m) return;
    const st = (d.stages || []).find((x) => x.label === m[1]);
    if (st) reached.add(st.id);
  });
  const curIdx = MAIN_STAGES.indexOf(ap.stage);
  const whenFor = (id: string) => {
    if (id === "submitted") return ap.submittedAt;
    const label = stageLabel(d, id);
    const t = (ap.timeline || []).find((x) => (x.text || "").startsWith("Moved to " + label));
    return t ? t.at : null;
  };

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
    toast("Document added. HR will review it.", "ok");
    rerender();
    setBadgeFocus({ id: doc.id });
  }

  function onExpiry(docId: string, value: string) {
    update((dd) => {
      const rec = byId(dd.applicants, ap.id)?.docs?.[docId];
      if (rec) rec.expiry = value;
    });
  }

  async function accept() {
    const o = ap.offer;
    if (!o) return;
    const ok = await confirm({
      title: "Accept this offer?",
      body: money(o.pay, o.payUnit) + ", starting " + fmtDate(o.startDate) + ". HR will be told and your start date is confirmed.",
      okLabel: "Accept offer",
    });
    if (!ok) return;
    updateApplicant(ap.id, { offer: Object.assign({}, o, { status: "accepted", respondedAt: nowIso() }) });
    setStage(ap.id, "hired", "Offer accepted by applicant");
    toast("Offer accepted. Welcome to the team.", "ok");
    rerender();
  }

  async function decline() {
    const o = ap.offer;
    if (!o) return;
    const ok = await confirm({ title: "Decline this offer?", body: "HR will be told. You can still be considered for other roles.", okLabel: "Decline offer", danger: true });
    if (!ok) return;
    updateApplicant(ap.id, { offer: Object.assign({}, o, { status: "declined", respondedAt: nowIso() }) });
    update((dd) => {
      byId(dd.applicants, ap.id)?.timeline.push({ at: nowIso(), text: "Offer declined by applicant" });
    });
    toast("Offer declined.");
    rerender();
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

  const messages = (ap.messages || []).slice().sort((x, y) => (y.at || "").localeCompare(x.at || ""));
  const timeline = (ap.timeline || []).slice().sort((x, y) => (y.at || "").localeCompare(x.at || ""));
  const o = ap.offer;
  const canWithdraw = !closed && ap.stage !== "hired";

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
        <div>
          <StageBadge stage={ap.stage} />
        </div>
      </div>
      <div className="two-col">
        <div className="stack" style={stackStyle}>
          <section className="panel" aria-labelledby="status-h">
            <div className="panel-head">
              <h2 id="status-h">Status</h2>
            </div>
            <div className="panel-body">
              <ol className="tracker">
                {MAIN_STAGES.map((id, i) => {
                  let cls = "";
                  if (closed) cls = reached.has(id) ? "is-done" : "";
                  else if (i < curIdx || (i === curIdx && id === "hired")) cls = "is-done";
                  else if (i === curIdx) cls = "is-current";
                  const when = whenFor(id);
                  return (
                    <li key={id} className={cls}>
                      <span className="dot" aria-hidden="true">
                        {cls === "is-done" && <Icon name="check" />}
                      </span>
                      <div>
                        <strong>
                          {stageLabel(d, id)}
                          {cls === "is-current" && (
                            <>
                              {" "}
                              <span className="visually-hidden">(current)</span>
                            </>
                          )}
                        </strong>
                        <span className="meta">{when && cls ? fmtDateTime(when) : STAGE_HINT[id]}</span>
                      </div>
                    </li>
                  );
                })}
                {closed && (
                  <li className="is-bad">
                    <span className="dot" aria-hidden="true">
                      <Icon name="close" />
                    </span>
                    <div>
                      <strong>{stageLabel(d, ap.stage)}</strong>
                      <span className="meta">{fmtDateTime(whenFor(ap.stage) || (ap.timeline || []).slice(-1)[0]?.at)}</span>
                    </div>
                  </li>
                )}
              </ol>
            </div>
          </section>
          <section className="panel" aria-labelledby="docs-h" ref={docsRef}>
            <div className="panel-head">
              <h2 id="docs-h">Documents</h2>
              <span className="small muted">{verified + " of " + req.length + " verified"}</span>
            </div>
            <div className="panel-body flush">
              {req.map((doc) => {
                const m = docs[doc.id];
                const state = docDisplayState(m);
                const has = !!(m && m.fileName);
                const canUpload = !closed && (state === "missing" || state === "flagged" || state === "expired");
                return (
                  <div className="doc-row" data-doc={doc.id} key={doc.id + ":" + seq}>
                    <div className="doc-main">
                      <Thumb meta={m} preview={previews[doc.id]} />
                      <div className="doc-text">
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-desc">{doc.desc}</div>
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
                    <DocBadge state={state} />
                    <div className="doc-actions">
                      {canUpload && <UploadButton doc={doc} label={has ? "Replace" : "Upload"} onFile={(e) => onFile(e, doc)} />}
                    </div>
                    {state === "flagged" && m && m.reason && <div className="doc-reason">{m.reason}</div>}
                    {state === "expired" && <div className="doc-reason">This document has expired. Upload a current one.</div>}
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
          <section className="panel" aria-labelledby="msg-h">
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
                      <p style={{ margin: "6px 0 0", fontSize: ".9375rem" }}>{m.text}</p>
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
              <p className="eyebrow">Interview</p>
              <h3 style={{ fontSize: "1.25rem" }}>{fmtDateTime(ap.interview.at)}</h3>
              <dl className="kv">
                <dt>Where</dt>
                <dd>{ap.interview.where}</dd>
                <dt>With</dt>
                <dd>{ap.interview.with}</dd>
              </dl>
            </div>
          )}
          {o && (
            <div className="card offer-card">
              <div className="badge-row" style={{ justifyContent: "space-between" }}>
                <p className="eyebrow" style={{ margin: 0 }}>
                  Offer
                </p>
                {o.status === "accepted" ? (
                  <span className="badge badge-ok">Accepted</span>
                ) : o.status === "declined" ? (
                  <span className="badge badge-bad">Declined</span>
                ) : (
                  <span className="badge badge-info">Awaiting your reply</span>
                )}
              </div>
              <p className="offer-pay" style={{ marginTop: "var(--s3)" }}>
                {money(o.pay, o.payUnit)}
              </p>
              <dl className="kv">
                <dt>Role</dt>
                <dd>{job ? job.title : ""}</dd>
                <dt>Branch</dt>
                <dd>{branch}</dd>
                <dt>Start date</dt>
                <dd>{fmtDate(o.startDate)}</dd>
                <dt>Sent</dt>
                <dd>{fmtDateTime(o.sentAt)}</dd>
              </dl>
              {o.status === "sent" && !closed && (
                <div className="actions">
                  <button className="btn btn-primary" type="button" id="offer-accept" onClick={accept}>
                    Accept offer
                  </button>
                  <button className="btn btn-ghost" type="button" id="offer-decline" onClick={decline}>
                    Decline
                  </button>
                </div>
              )}
            </div>
          )}
          <section className="panel" aria-labelledby="tl-h">
            <div className="panel-head">
              <h2 id="tl-h">Timeline</h2>
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
