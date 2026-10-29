"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { DocBadge } from "@/components/badges";
import { useConfirm } from "@/components/confirm";
import { DecisionForm } from "@/components/hr/decision-form";
import { DecisionStatus, HrStageBadge } from "@/components/hr/hr-bits";
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
  moveStage,
  movesAwayFromDecision,
  scheduleInterview,
  verifyDoc,
  type ActionForm,
  type DrawerTab,
} from "@/lib/hr/hr";
import { DECISION_STAGES, isSealed } from "@/lib/hr/outcome";
import { hrStageLabel, stageIdForLabel } from "@/lib/hr/plain";
import { addMessage, addNote, byId, requiredDocsFor, useData, useSession } from "@/lib/store";
import type { Applicant, DocRecord, Job, Outcome, Seed } from "@/lib/types";

// The applicant drawer from hr.js: details, documents (verify, or flag with a note the applicant reads), notes,
// messages and the timeline, plus the interview form, the Decision step and the stage list in the footer. Each open
// starts on Details. Decisions are made only in the Decision step, so every one is previewed and reaches the
// applicant as a sealed update (lib/hr/hr.ts, decide).

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

function offerReply(a: Applicant) {
  const o = a.offer;
  if (!o) return "";
  // respondedAt is written by lib/hr/hr.ts (acceptOffer, declineOffer); lib/types.ts does not declare it.
  const at = (o as { respondedAt?: string }).respondedAt;
  if (o.status === "accepted") return "Accepted" + (at ? " " + fmtDateTime(at) : "");
  if (o.status === "declined") return "Declined" + (at ? " " + fmtDateTime(at) : "");
  return "Waiting for a reply";
}

function Details({ a }: { a: Applicant }) {
  const p = a.personal || {}, x = a.experience || {};
  const o = a.outcome;
  return (
    <>
      {o ? (
        <section className="decision-summary" aria-labelledby="dd-decision-h">
          <h3 style={{ ...H3, marginTop: 0 }} id="dd-decision-h">
            Decision
          </h3>
          <dl className="kv">
            <dt>Decided</dt>
            <dd>{o.kind === "offer" ? "Offer the job" : "Not this time (not selected)"}</dd>
            <dt>Update sent</dt>
            <dd>{fmtDateTime(o.at)}</dd>
            <dt>Opened</dt>
            <dd>{o.openedAt ? fmtDateTime(o.openedAt) : <span className="muted">Not opened yet</span>}</dd>
            {o.kind === "offer" && a.offer ? (
              <>
                <dt>Pay</dt>
                <dd>{money(a.offer.pay, a.offer.payUnit)}</dd>
                <dt>Start</dt>
                <dd>{fmtDay(a.offer.startDate)}</dd>
                <dt>Reply</dt>
                <dd>{offerReply(a)}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}
      <dl className="kv">
        <dt>E-mail</dt>
        <dd>
          <a href={"mailto:" + encodeURIComponent(a.email).replace("%40", "@")}>{a.email}</a>
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
      {a.offer && !o ? (
        <>
          <h3 style={H3}>Earlier offer</h3>
          <dl className="kv">
            <dt>Pay</dt>
            <dd>{money(a.offer.pay, a.offer.payUnit)}</dd>
            <dt>Start</dt>
            <dd>{fmtDay(a.offer.startDate)}</dd>
            <dt>Reply</dt>
            <dd>{offerReply(a) + (a.offer.sentAt ? " · sent " + fmtDateTime(a.offer.sentAt) : "")}</dd>
          </dl>
        </>
      ) : null}
    </>
  );
}

function Documents({ d, a, onVerify, onFlag }: { d: Seed; a: Applicant; onVerify: (docId: string) => void; onFlag: (docId: string) => void }) {
  const req = requiredDocsFor(d, a);
  if (!req.length) return <p className="muted">No documents are required for this job.</p>;
  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        Verify a document when it is clear, current and in the applicant’s name. Flag it to ask for a new copy: your note shows under the document on
        their page.
      </p>
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
              {state === "flagged" && m && m.reason ? <div className="doc-reason">{"Your note to the applicant: " + m.reason}</div> : null}
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

type Entry = { at: string; who: string; text: string; tag?: string };

function Entries({ items, empty }: { items: Entry[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  return (
    <ul className="list" style={LIST}>
      {items.map((n, i) => (
        <li key={n.at + i}>
          <div className="grow">
            <strong>{n.who || "HR"}</strong>
            <div className="meta">
              {fmtDateTime(n.at)}
              {n.tag ? " · " + n.tag : ""}
            </div>
            <p style={ENTRY} className="summary-text">
              {n.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Composer({
  id,
  textId,
  label,
  hint,
  button,
  onSend,
}: {
  id: string;
  textId: string;
  label: string;
  hint?: string;
  button: string;
  onSend: (text: string) => void;
}) {
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
      <textarea id={textId} required aria-describedby={hint ? textId + "-hint" : undefined}></textarea>
      {hint ? (
        <p className="hint" id={textId + "-hint"}>
          {hint}
        </p>
      ) : null}
      <div className="actions">
        <Button size="sm" type="submit">
          {button}
        </Button>
      </div>
    </form>
  );
}

const MOVED = /^Moved to (.+?)( — .*)?$/;

/** Timeline lines are written with the seed's stage labels; HR reads them in its own words. */
function hrLine(d: Seed, text: string) {
  const m = MOVED.exec(text);
  if (!m) return text;
  const id = stageIdForLabel(d, m[1]);
  return id ? "Moved to " + hrStageLabel(d, id) + (m[2] || "") : text;
}

function Timeline({ d, a }: { d: Seed; a: Applicant }) {
  const tl = byNewest(a.timeline);
  if (!tl.length) return <p className="muted">Nothing yet.</p>;
  return (
    <ol className="timeline">
      {tl.map((t, i) => (
        <li key={t.at + i}>
          <time dateTime={t.at}>{fmtDateTime(t.at)}</time>
          {hrLine(d, t.text)}
        </li>
      ))}
    </ol>
  );
}

const field = (f: HTMLFormElement, id: string) => (f.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";

function InterviewForm({ d, a, job, who, onCancel, onDone }: { d: Seed; a: Applicant; job: Job | null; who: string; onCancel: () => void; onDone: () => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const at = field(f, "iv-at"), where = field(f, "iv-where").trim(), by = field(f, "iv-with").trim();
    if (!at || !where || !by) {
      toast("Fill in the date, place and interviewer.", "bad");
      return;
    }
    scheduleInterview(a, at, where, by);
    onDone();
    toast("Interview saved. " + firstName(a) + " has a message with the details.", "ok");
  }
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
        {"Saving moves " + firstName(a) + " to Interview and sends them a message with these details."}
      </p>
      <div className="actions">
        <Button size="sm" type="submit">
          Save interview
        </Button>
        <Button variant="ghost" size="sm" data-cancel-action="" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const TAB_LABEL: Record<DrawerTab, string> = { details: "Details", documents: "Documents", notes: "Notes", messages: "Messages", timeline: "Timeline" };

function DrawerBody({ id, closeRef, onClose }: { id: string; closeRef: RefObject<HTMLButtonElement | null>; onClose: () => void }) {
  const d = useData();
  const s = useSession();
  const { prompt, confirm } = useConfirm();
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("details");
  const [actionForm, setActionForm] = useState<ActionForm>(null);
  const [decisionKind, setDecisionKind] = useState<Outcome["kind"] | null>(null);
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
  const first = firstName(a);
  const sealed = isSealed(a);
  const activeTab = "dtab-" + drawerTab;
  const canDecide = a.stage !== "hired" && a.stage !== "withdrawn";

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
      title: "Ask for a new copy of the " + docName(d, docId).toLowerCase(),
      body: first + " sees your note under the document, with “Needs a new copy”. Say what is wrong and what would be accepted.",
      label: "Note to " + first,
      placeholder: "For example: the bill is older than three months. Please upload one from the last three months.",
      okLabel: "Flag document",
    });
    if (reason == null) return;
    if (!reason) {
      toast("Add a note so " + first + " knows what to fix.", "bad");
      return;
    }
    focusAfter(activeTab);
    flagDoc(d, id, docId, reason);
    toast(docName(d, docId) + " flagged. " + first + " can see your note.");
  }

  function openInterview() {
    setActionForm("interview");
    setFormSeq((n) => n + 1);
    focusAfter("iv-at");
  }

  function openDecision(kind: Outcome["kind"] | null) {
    setActionForm("decision");
    setDecisionKind(kind);
    setFormSeq((n) => n + 1);
    const k = kind ?? a?.outcome?.kind ?? null;
    focusAfter(k === "not-selected" ? "dc-not" : "dc-offer");
  }

  function closeForm() {
    setActionForm(null);
    focusAfter("drawer-close");
  }

  async function pickStage(stage: string) {
    if (!a || !stage || stage === a.stage) return;
    // Offer and not selected are decisions: they go through the Decision step so the applicant gets a sealed update.
    if (DECISION_STAGES.includes(stage)) {
      openDecision(stage as Outcome["kind"]);
      return;
    }
    const prev = a.outcome;
    if (prev && movesAwayFromDecision(a, stage)) {
      const ok = await confirm({
        title: "Withdraw the decision?",
        body: prev.openedAt
          ? "Moving " + first + " to " + hrStageLabel(d, stage) + " withdraws the decision they opened on " + fmtDateTime(prev.openedAt) + ". Send them a message to explain."
          : "Moving " + first + " to " + hrStageLabel(d, stage) + " withdraws the update sent on " + fmtDateTime(prev.at) + ". They have not opened it, so they will never see it; the letter moves to the notes.",
        okLabel: "Withdraw and move",
      });
      if (!ok) return;
    }
    try {
      moveStage(a, stage, who);
    } catch (err) {
      toast(err instanceof Error ? err.message : "The stage did not change. Try again.", "bad");
      return;
    }
    focusAfter("move-stage");
    toast(a.name + " moved to " + hrStageLabel(d, stage), "ok");
  }

  const notes = byNewest(a.notes).map((n) => ({ at: n.at, who: n.author, text: n.text }));
  const msgs: Entry[] = byNewest(a.messages).map((m) => ({
    at: m.at,
    who: m.from,
    text: m.text,
    tag: a.outcome && m.at === a.outcome.at ? (a.outcome.openedAt ? "Decision letter, opened" : "Decision letter, not opened yet") : undefined,
  }));
  const label = (t: DrawerTab) =>
    TAB_LABEL[t] + (t === "notes" && (a.notes || []).length ? " (" + a.notes.length + ")" : t === "messages" && (a.messages || []).length ? " (" + a.messages.length + ")" : "");

  return (
    <>
      <SheetHeader>
        <div>
          <SheetTitle id="drawer-title">{a.name}</SheetTitle>
          <p className="who">{jobLine(d, a)}</p>
          <div className="badge-row">
            <HrStageBadge stage={a.stage} />
            {a.personal && a.personal.nonNational ? <Badge variant="warn">Work permit</Badge> : null}
          </div>
          <DecisionStatus a={a} />
        </div>
        <button className="icon-btn" type="button" id="drawer-close" aria-label="Close applicant details" ref={closeRef} onClick={onClose}>
          <Icon name="close" />
        </button>
      </SheetHeader>

      <SheetBody>
        {actionForm === "interview" ? <InterviewForm key={formSeq} d={d} a={a} job={job} who={who} onCancel={closeForm} onDone={closeForm} /> : null}
        {actionForm === "decision" ? (
          <DecisionForm key={formSeq} d={d} a={a} job={job} who={who} initialKind={decisionKind} onCancel={closeForm} onDone={closeForm} />
        ) : null}
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
                label="Add a note (HR only, never shown to the applicant)"
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
                label={"Message to " + first + " (shown on their applicant page)"}
                hint={sealed ? first + " has not opened their update yet. New messages show on their page after they open it, so they never give the decision away." : undefined}
                button="Send message"
                onSend={(text) => {
                  focusAfter("msg-text");
                  addMessage(a.id, text, "HR");
                  toast("Message sent to " + first, "ok");
                }}
              />
            </>
          ) : null}
          {drawerTab === "timeline" ? <Timeline d={d} a={a} /> : null}
        </div>
      </SheetBody>

      <SheetFooter>
        <label className="visually-hidden" htmlFor="move-stage">
          Move to stage
        </label>
        <select id="move-stage" aria-label="Move to stage" value={a.stage} onChange={(e) => void pickStage(e.target.value)}>
          {(d.stages || []).map((st) => (
            <option key={st.id} value={st.id}>
              {hrStageLabel(d, st.id) + (DECISION_STAGES.includes(st.id) && st.id !== a.stage ? " (opens the Decision step)" : "")}
            </option>
          ))}
        </select>
        {!closed && a.stage !== "hired" ? (
          <Button variant="ghost" size="sm" data-action="interview" onClick={openInterview}>
            <Icon name="calendar" />
            {" Schedule interview"}
          </Button>
        ) : null}
        {canDecide ? (
          <Button size="sm" data-action="decision" data-tour="hr-decision-open" onClick={() => openDecision(null)}>
            {a.outcome ? "Change the decision" : "Make the decision"}
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
