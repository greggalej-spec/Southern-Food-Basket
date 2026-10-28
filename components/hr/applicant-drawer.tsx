"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { DocBadge, StageBadge } from "@/components/badges";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/sonner";
import { docDisplayState, fileSize, fmtDateTime, money } from "@/lib/format";
import {
  CLOSED_STAGES,
  DRAWER_TABS,
  branchName,
  daysLabel,
  docName,
  firstName,
  flagDoc,
  fmtDay,
  hrName,
  jobLine,
  markNotSelected,
  scheduleInterview,
  sendOffer,
  verifyDoc,
  type ActionForm,
  type DrawerTab,
} from "@/lib/hr/hr";
import { addMessage, addNote, byId, requiredDocsFor, setStage, stageLabel, useData, useSession } from "@/lib/store";
import type { Applicant, DocRecord, Job, Seed } from "@/lib/types";

// The applicant drawer from hr.js: details, KYC documents (verify or flag with a reason), notes, messages and the
// timeline, plus the interview and offer forms and the stage controls in the footer. Each open starts on Details.

const H3 = { fontSize: "1rem", margin: "var(--s5) 0 var(--s2)" };
const LIST = { border: "1px solid var(--line)", borderRadius: "var(--r)" };
const ENTRY = { margin: "6px 0 0", fontSize: ".9375rem" };
const byNewest = <T extends { at: string }>(xs: T[]) => (xs || []).slice().sort((x, y) => (y.at || "").localeCompare(x.at || ""));

function FileMeta({ m }: { m: DocRecord | undefined }) {
  if (!m || !m.fileName) return null;
  const bits = [m.fileName];
  if (m.size != null) bits.push(fileSize(m.size));
  if (m.expiry) bits.push("Expires " + fmtDay(m.expiry));
  if (m.updatedAt) bits.push("Updated " + fmtDateTime(m.updatedAt));
  return (
    <div className="doc-file">
      {bits.map((b, i) => (
        <Fragment key={i}>
          {i ? <span aria-hidden="true">·</span> : null}
          <span>{b}</span>
        </Fragment>
      ))}
    </div>
  );
}

function Details({ a }: { a: Applicant }) {
  const p = a.personal || {}, x = a.experience || {};
  return (
    <>
      <dl className="kv">
        <dt>Email</dt>
        <dd>
          <a href={"mailto:" + encodeURIComponent(a.email)}>{a.email}</a>
        </dd>
        <dt>Phone</dt>
        <dd>{a.phone}</dd>
        <dt>Address</dt>
        <dd>{p.address || ""}</dd>
        <dt>Date of birth</dt>
        <dd>{p.dob ? fmtDay(p.dob) : <span className="muted">Not given</span>}</dd>
        <dt>Right to work</dt>
        <dd>{p.nonNational ? <Badge variant="warn">Work permit required</Badge> : "National of Trinidad and Tobago or CARICOM skills certificate"}</dd>
        <dt>Availability</dt>
        <dd>{(x.availability || []).join(", ") || "—"}</dd>
        <dt>Earliest start</dt>
        <dd>{x.startDate ? fmtDay(x.startDate) : "—"}</dd>
        <dt>Applied</dt>
        <dd>{fmtDateTime(a.submittedAt)}</dd>
      </dl>
      <h3 style={H3}>Experience</h3>
      <p className="summary-text" style={{ fontSize: ".9375rem" }}>
        {x.summary || "—"}
      </p>
      {a.interview ? (
        <>
          <h3 style={H3}>Interview</h3>
          <dl className="kv">
            <dt>When</dt>
            <dd>{fmtDateTime(a.interview.at)}</dd>
            <dt>Where</dt>
            <dd>{a.interview.where}</dd>
            <dt>With</dt>
            <dd>{a.interview.with}</dd>
          </dl>
        </>
      ) : null}
      {a.offer ? (
        <>
          <h3 style={H3}>Offer</h3>
          <dl className="kv">
            <dt>Pay</dt>
            <dd>{money(a.offer.pay, a.offer.payUnit)}</dd>
            <dt>Start</dt>
            <dd>{fmtDay(a.offer.startDate)}</dd>
            <dt>Status</dt>
            <dd>
              {(a.offer.status === "accepted" ? "Accepted" : a.offer.status === "declined" ? "Declined" : "Sent, awaiting reply") +
                (a.offer.sentAt ? " · sent " + fmtDateTime(a.offer.sentAt) : "")}
            </dd>
          </dl>
        </>
      ) : null}
    </>
  );
}

function Documents({ d, a, onVerify, onFlag }: { d: Seed; a: Applicant; onVerify: (docId: string) => void; onFlag: (docId: string) => void }) {
  const req = requiredDocsFor(d, a);
  if (!req.length) return <p className="muted">No documents are required for this role.</p>;
  return (
    <>
      <div className="doc-list">
        {req.map((doc) => {
          const m = (a.docs || {})[doc.id];
          const state = docDisplayState(m);
          const has = !!(m && m.fileName);
          const raw = (m && m.state) || "missing"; // actions key off the stored state; the badge shows the derived one
          return (
            <div key={doc.id} className="doc-row" data-doc={doc.id}>
              <div className="doc-main">
                {has ? (
                  <span className="doc-ph" aria-hidden="true">
                    <Icon name="file" />
                  </span>
                ) : null}
                <div className="doc-text">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-desc">{doc.desc}</div>
                  <FileMeta m={m} />
                  {!has ? <div className="doc-file">Not provided yet.</div> : null}
                </div>
              </div>
              <DocBadge state={state} />
              <div className="doc-actions">
                {has && raw !== "verified" ? (
                  <Button size="sm" data-verify={doc.id} onClick={() => onVerify(doc.id)}>
                    Verify
                  </Button>
                ) : null}
                {has && raw !== "flagged" ? (
                  <Button variant="ghost" size="sm" data-flag={doc.id} onClick={() => onFlag(doc.id)}>
                    Flag
                  </Button>
                ) : null}
              </div>
              {state === "flagged" && m && m.reason ? <div className="doc-reason">{m.reason}</div> : null}
              {state === "expired" ? <div className="doc-reason">{"Expired " + fmtDay(m?.expiry) + ". Ask for a current copy."}</div> : null}
              {state === "expiring" ? (
                <div className="doc-reason" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}>
                  {"Expires " + fmtDay(m?.expiry) + " (" + daysLabel(m?.expiry) + ")."}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="hint" style={{ marginTop: "var(--s3)" }}>
        Metadata only: file names, sizes and dates. This demo never stores or shows file contents.
      </p>
    </>
  );
}

function Entries({ items, empty }: { items: { at: string; who: string; text: string }[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <ul className="list" style={LIST}>
      {items.map((n, i) => (
        <li key={n.at + i}>
          <div className="grow">
            <strong>{n.who || "HR"}</strong>
            <div className="meta">{fmtDateTime(n.at)}</div>
            <p style={ENTRY} className="summary-text">
              {n.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Composer({ id, textId, label, button, onSend }: { id: string; textId: string; label: string; button: string; onSend: (text: string) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const ta = e.currentTarget.querySelector("textarea");
    if (!ta) return;
    const text = ta.value.trim();
    if (!text) {
      ta.focus();
      return;
    }
    onSend(text);
    ta.value = "";
  }
  return (
    <form className="composer" id={id} onSubmit={submit}>
      <label htmlFor={textId}>{label}</label>
      <textarea id={textId} required></textarea>
      <div className="actions">
        <Button size="sm" type="submit">
          {button}
        </Button>
      </div>
    </form>
  );
}

function Timeline({ a }: { a: Applicant }) {
  const tl = byNewest(a.timeline);
  if (!tl.length) return <p className="muted">Nothing yet.</p>;
  return (
    <ol className="timeline">
      {tl.map((t, i) => (
        <li key={t.at + i}>
          <time dateTime={t.at}>{fmtDateTime(t.at)}</time>
          {t.text}
        </li>
      ))}
    </ol>
  );
}

const field = (f: HTMLFormElement, id: string) => (f.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";

function ActionPanel({ form, d, a, job, who, onCancel, onDone }: { form: ActionForm; d: Seed; a: Applicant; job: Job | null; who: string; onCancel: () => void; onDone: () => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (form === "interview") {
      const at = field(f, "iv-at"), where = field(f, "iv-where").trim(), by = field(f, "iv-with").trim();
      if (!at || !where || !by) {
        toast("Fill in the date, place and interviewer.", "bad");
        return;
      }
      scheduleInterview(a, at, where, by);
      onDone();
      toast("Interview scheduled and applicant messaged", "ok");
    } else if (form === "offer") {
      const pay = Number(field(f, "of-pay")), payUnit = field(f, "of-unit"), startDate = field(f, "of-start");
      if (!(pay > 0) || !startDate) {
        toast("Enter the pay and a start date.", "bad");
        return;
      }
      sendOffer(d, a, job, pay, payUnit, startDate);
      onDone();
      toast("Offer sent and applicant messaged", "ok");
    }
  }
  const actions = (label: string) => (
    <div className="actions">
      <Button size="sm" type="submit">
        {label}
      </Button>
      <Button variant="ghost" size="sm" data-cancel-action="" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );

  if (form === "interview") {
    const iv = a.interview;
    return (
      <form className="drawer-action" id="action-form" onSubmit={submit}>
        <h3>Schedule interview</h3>
        <div className="field">
          <label htmlFor="iv-at">Date and time</label>
          <input type="datetime-local" id="iv-at" defaultValue={(iv?.at || "").slice(0, 16)} required />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="iv-where">Where</label>
            <input type="text" id="iv-where" defaultValue={iv?.where || (job ? branchName(d, job.branchId) + " branch" : "")} required />
          </div>
          <div className="field">
            <label htmlFor="iv-with">With</label>
            <input type="text" id="iv-with" defaultValue={iv?.with || who} required />
          </div>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          Saving moves the applicant to Interview and sends them a message with these details.
        </p>
        {actions("Save interview")}
      </form>
    );
  }
  if (form === "offer") {
    const o = a.offer;
    return (
      <form className="drawer-action" id="action-form" onSubmit={submit}>
        <h3>Send offer</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="of-pay">Pay (TTD)</label>
            <input type="number" id="of-pay" min="0" step="0.01" defaultValue={o?.pay != null ? o.pay : ""} required />
          </div>
          <div className="field">
            <label htmlFor="of-unit">Per</label>
            <select id="of-unit" defaultValue={o?.payUnit || "month"}>
              <option value="month">Month</option>
              <option value="hour">Hour</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="of-start">Start date</label>
          <input type="date" id="of-start" defaultValue={o?.startDate || (a.experience && a.experience.startDate) || ""} required />
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          Pay is agreed with the applicant after the interview and is never shown on the job listing. Saving moves the applicant to Offer and messages
          them.
        </p>
        {actions("Send offer")}
      </form>
    );
  }
  return null;
}

const TAB_LABEL: Record<DrawerTab, string> = { details: "Details", documents: "Documents", notes: "Notes", messages: "Messages", timeline: "Timeline" };

function DrawerBody({ id, closeRef, onClose }: { id: string; closeRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const d = useData();
  const s = useSession();
  const { prompt } = useConfirm();
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
  const [actionForm, setActionForm] = useState<ActionForm>(null);
  const [formSeq, setFormSeq] = useState(0);

  // hr.js re-rendered the drawer after every action and then focused the requested control, else the active tab.
  const focusId = useRef<string | null>(null);
  useEffect(() => {
    if (!focusId.current) return;
    document.getElementById(focusId.current)?.focus();
    focusId.current = null;
  });
  const focusAfter = (fid: string) => {
    focusId.current = fid;
  };

  const a = byId(d.applicants, id);
  if (!a) return null;
  const job = byId(d.jobs, a.jobId);
  const closed = CLOSED_STAGES.includes(a.stage);
  const who = hrName(d, s);
  const activeTab = "dtab-" + drawerTab;

  function pickTab(t: DrawerTab) {
    setDrawerTab(t);
    focusAfter("dtab-" + t);
  }

  function verify(docId: string) {
    focusAfter(activeTab);
    verifyDoc(id, docId);
    toast(docName(d, docId) + " verified", "ok");
  }

  async function flag(docId: string) {
    const reason = await prompt({
      title: "Flag " + docName(d, docId),
      body: "The reason is shown to the applicant so they know what to fix.",
      label: "Reason",
      placeholder: "For example: the bill is older than three months. Please upload a recent one.",
      okLabel: "Flag document",
    });
    if (reason == null) return;
    if (!reason) {
      toast("Add a reason so the applicant knows what to fix.", "bad");
      return;
    }
    focusAfter(activeTab);
    flagDoc(d, id, docId, reason);
    toast(docName(d, docId) + " flagged");
  }

  function openForm(f: Exclude<ActionForm, null>) {
    setActionForm(f);
    setFormSeq((n) => n + 1);
    focusAfter(f === "interview" ? "iv-at" : "of-pay");
  }

  async function notSelected(ap: Applicant) {
    const reason = await prompt({
      title: "Mark " + ap.name + " as not selected",
      body: "The reason goes into the timeline and the message to the applicant. Keep it short and kind.",
      label: "Reason",
      placeholder: "For example: the role has been filled.",
      okLabel: "Confirm",
    });
    if (reason == null) return;
    focusAfter(activeTab);
    markNotSelected(ap, job, reason);
    toast(ap.name + " marked not selected");
  }

  const notes = byNewest(a.notes).map((n) => ({ at: n.at, who: n.author, text: n.text }));
  const msgs = byNewest(a.messages).map((m) => ({ at: m.at, who: m.from, text: m.text }));
  const label = (t: DrawerTab) =>
    TAB_LABEL[t] + (t === "notes" && (a.notes || []).length ? " (" + a.notes.length + ")" : t === "messages" && (a.messages || []).length ? " (" + a.messages.length + ")" : "");

  return (
    <>
      <SheetHeader>
        <div>
          <SheetTitle id="drawer-title">{a.name}</SheetTitle>
          <p className="who">{jobLine(d, a)}</p>
          <div className="badge-row">
            <StageBadge stage={a.stage} />
            {a.personal && a.personal.nonNational ? <Badge variant="warn">Work permit</Badge> : null}
          </div>
        </div>
        <button className="icon-btn" type="button" id="drawer-close" aria-label="Close applicant details" ref={closeRef} onClick={onClose}>
          <Icon name="close" />
        </button>
      </SheetHeader>

      <SheetBody>
        <ActionPanel
          key={formSeq}
          form={actionForm}
          d={d}
          a={a}
          job={job}
          who={who}
          onCancel={() => {
            setActionForm(null);
            focusAfter("drawer-close");
          }}
          onDone={() => {
            setActionForm(null);
            focusAfter("drawer-close");
          }}
        />
        <div
          className="tabs"
          role="tablist"
          aria-label="Applicant sections"
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const i = DRAWER_TABS.indexOf(drawerTab);
            pickTab(DRAWER_TABS[(i + (e.key === "ArrowRight" ? 1 : DRAWER_TABS.length - 1)) % DRAWER_TABS.length]);
          }}
        >
          {DRAWER_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={"dtab-" + t}
              data-dtab={t}
              aria-selected={drawerTab === t}
              aria-controls={"dpanel-" + t}
              tabIndex={drawerTab === t ? undefined : -1}
              onClick={() => pickTab(t)}
            >
              {label(t)}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={"dpanel-" + drawerTab} aria-labelledby={"dtab-" + drawerTab}>
          {drawerTab === "details" ? <Details a={a} /> : null}
          {drawerTab === "documents" ? <Documents d={d} a={a} onVerify={verify} onFlag={flag} /> : null}
          {drawerTab === "notes" ? (
            <>
              <Entries items={notes} empty="No internal notes yet." />
              <Composer
                id="note-form"
                textId="note-text"
                label="Add a note (internal, not shown to the applicant)"
                button="Add note"
                onSend={(text) => {
                  focusAfter("note-text");
                  addNote(a.id, text, who);
                  toast("Note added", "ok");
                }}
              />
            </>
          ) : null}
          {drawerTab === "messages" ? (
            <>
              <Entries items={msgs} empty="No messages yet." />
              <Composer
                id="msg-form"
                textId="msg-text"
                label={"Message to " + firstName(a) + " (shown in their dashboard)"}
                button="Send message"
                onSend={(text) => {
                  focusAfter("msg-text");
                  addMessage(a.id, text, "HR");
                  toast("Message sent to " + firstName(a), "ok");
                }}
              />
            </>
          ) : null}
          {drawerTab === "timeline" ? <Timeline a={a} /> : null}
        </div>
      </SheetBody>

      <SheetFooter>
        <label className="visually-hidden" htmlFor="move-stage">
          Move to stage
        </label>
        <select
          id="move-stage"
          aria-label="Move to stage"
          value={a.stage}
          onChange={(e) => {
            const stage = e.target.value;
            if (!stage || stage === a.stage) return;
            focusAfter("move-stage");
            setStage(a.id, stage, "by " + who);
            toast(a.name + " moved to " + stageLabel(d, stage), "ok");
          }}
        >
          {(d.stages || []).map((st) => (
            <option key={st.id} value={st.id}>
              {st.label}
            </option>
          ))}
        </select>
        {!closed && a.stage !== "hired" ? (
          <Button variant="ghost" size="sm" data-action="interview" onClick={() => openForm("interview")}>
            <Icon name="calendar" />
            {" Schedule interview"}
          </Button>
        ) : null}
        {!closed && (a.stage === "interview" || a.stage === "offer") ? (
          <Button size="sm" data-action="offer" onClick={() => openForm("offer")}>
            <Icon name="check" />
            {" " + (a.offer ? "Resend offer" : "Send offer")}
          </Button>
        ) : null}
        {!closed && a.stage !== "hired" ? (
          <Button variant="danger" size="sm" data-action="not-selected" onClick={() => notSelected(a)}>
            Not selected
          </Button>
        ) : null}
      </SheetFooter>
    </>
  );
}

// A confirm or prompt opened from the drawer takes Escape first, as hr.js left it to the open <dialog>.
const promptOpen = () => !!document.querySelector('[data-slot="dialog-content"]');

export function ApplicantDrawer({
  target,
  open,
  onClose,
  returnFocus,
}: {
  target: { id: string; seq: number } | null;
  open: boolean;
  onClose: () => void;
  returnFocus: () => HTMLElement | null;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        if (details.reason === "escape-key" && promptOpen()) {
          details.cancel();
          return;
        }
        onClose();
      }}
    >
      <SheetContent render={<aside />} id="drawer" aria-modal="true" initialFocus={closeRef} finalFocus={returnFocus}>
        {target ? <DrawerBody key={target.seq} id={target.id} closeRef={closeRef} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  );
}
