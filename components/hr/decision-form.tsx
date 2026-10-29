"use client";

import { useState, type FormEvent } from "react";
import { OpenedLetter, SealedLetter } from "@/components/careers/outcome-card";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { fmtDateTime } from "@/lib/format";
import { UPDATE_SUBJECT, branchName, firstName, markNotSelected, sendOffer, updateMailBody } from "@/lib/hr/hr";
import { defaultLetter, outcomeView } from "@/lib/hr/outcome";
import { nowIso } from "@/lib/store";
import type { Applicant, Job, Outcome, Seed } from "@/lib/types";

// The Decision step in the applicant drawer (PRD 6.6, 8.4: template-based messages, previewed before sending). HR
// picks offer or not selected, edits a kind template, and keeps the reason in a separate HR-only field. The preview
// is the applicant's own card (components/careers/outcome-card.tsx) and the e-mail, word for word.

type Kind = Outcome["kind"];

export function DecisionForm({
  d,
  a,
  job,
  who,
  initialKind,
  onCancel,
  onDone,
}: {
  d: Seed;
  a: Applicant;
  job: Job | null;
  who: string;
  initialKind: Kind | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { confirm } = useConfirm();
  const first = firstName(a);
  const store = job ? branchName(d, job.branchId) : "";
  const template = (k: Kind) => defaultLetter(k, { first, job: job ? job.title : "this", store, from: who, interviewed: !!a.interview });

  const [kind, setKind] = useState<Kind | null>(initialKind ?? a.outcome?.kind ?? null);
  const [letters, setLetters] = useState<Record<Kind, string>>(() => ({ offer: template("offer"), "not-selected": template("not-selected") }));
  const [reason, setReason] = useState("");
  const [pay, setPay] = useState(a.offer?.pay != null ? String(a.offer.pay) : "");
  const [unit, setUnit] = useState(a.offer?.payUnit || "month");
  const [start, setStart] = useState(a.offer?.startDate || a.experience?.startDate || "");
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [previewAt] = useState(nowIso);

  const letter = kind ? letters[kind] : "";
  const offerReady = Number(pay) > 0 && !!start;
  const v = kind
    ? outcomeView(d, a, { kind, at: previewAt, from: who, letter, offer: kind === "offer" && offerReady ? { pay: Number(pay), payUnit: unit, startDate: start } : undefined })
    : null;
  const prev = a.outcome;

  function setLetter(text: string) {
    if (!kind) return;
    setLetters({ ...letters, [kind]: text });
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!kind) next["dc-offer"] = "Choose offer or not selected.";
    if (kind === "offer" && !(Number(pay) > 0)) next["dc-pay"] = "Enter the pay.";
    if (kind === "offer" && !start) next["dc-start"] = "Enter a start date.";
    if (kind && !letter.trim()) next["dc-letter"] = "Write the message " + first + " will read.";
    if (kind === "not-selected" && !reason.trim()) next["dc-reason"] = "Add a short reason for the file. Only HR sees it.";
    setErrs(next);
    const firstBad = Object.keys(next)[0];
    if (firstBad) {
      document.getElementById(firstBad)?.focus();
      return;
    }
    const ok = await confirm({
      title: "Send this decision to " + first + "?",
      body:
        first +
        " gets an e-mail saying there is an update on their application. The e-mail does not say what you decided: " +
        first +
        " reads that on the applicant page after opening the update, and you will see here when they have." +
        (prev
          ? " This replaces the update you sent on " +
            fmtDateTime(prev.at) +
            (prev.openedAt ? ", which they have already opened." : ". They have not opened that one, so they will never see it; it moves to the notes.")
          : ""),
      okLabel: "Send the decision",
    });
    if (!ok) return;
    try {
      if (kind === "offer") sendOffer(d, a, job, Number(pay), unit, start, { message: letter, reason, from: who });
      else markNotSelected(d, a, job, reason, { message: letter, from: who });
    } catch (err) {
      toast(err instanceof Error ? err.message : "The decision was not sent. Try again.", "bad");
      return;
    }
    toast("Decision sent. " + first + " gets an e-mail saying there is an update.", "ok");
    onDone();
  }

  const err = (id: string) =>
    errs[id] ? (
      <p className="error-text" id={id + "-err"}>
        {errs[id]}
      </p>
    ) : null;
  const described = (id: string, hint?: string) => [hint, errs[id] ? id + "-err" : ""].filter(Boolean).join(" ") || undefined;

  return (
    <form className="drawer-action decision-form" id="action-form" data-tour="hr-decision" onSubmit={submit} noValidate>
      <h3>Decision</h3>
      <p className="hint decision-intro">
        {first + " first gets a sealed update: an e-mail and a card that say only that there is news. Your decision shows when " + first + " opens it."}
      </p>

      <fieldset className="decision-kind">
        <legend>What have you decided?</legend>
        <label className="check">
          <input
            type="radio"
            name="dc-kind"
            id="dc-offer"
            checked={kind === "offer"}
            onChange={() => setKind("offer")}
            aria-describedby={described("dc-offer")}
          />
          <span>Offer the job</span>
        </label>
        <label className="check">
          <input type="radio" name="dc-kind" id="dc-not" checked={kind === "not-selected"} onChange={() => setKind("not-selected")} />
          <span>Not this time (not selected)</span>
        </label>
        {err("dc-offer")}
      </fieldset>

      {kind === "offer" ? (
        <>
          <div className="form-row">
            <div className="field">
              <label htmlFor="dc-pay">Pay (TTD)</label>
              <input
                type="number"
                id="dc-pay"
                min="0"
                step="0.01"
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                aria-invalid={errs["dc-pay"] ? true : undefined}
                aria-describedby={described("dc-pay")}
              />
              {err("dc-pay")}
            </div>
            <div className="field">
              <label htmlFor="dc-unit">Per</label>
              <select id="dc-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="month">Month</option>
                <option value="hour">Hour</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="dc-start">Start date</label>
            <input
              type="date"
              id="dc-start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-invalid={errs["dc-start"] ? true : undefined}
              aria-describedby={described("dc-start", "dc-start-hint")}
            />
            <p className="hint" id="dc-start-hint">
              Pay is agreed after the interview and never shown on the job listing.
            </p>
            {err("dc-start")}
          </div>
        </>
      ) : null}

      {kind ? (
        <>
          <div className="field">
            <label htmlFor="dc-letter">{"Message to " + first}</label>
            <textarea
              id="dc-letter"
              rows={9}
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              aria-invalid={errs["dc-letter"] ? true : undefined}
              aria-describedby={described("dc-letter", "dc-letter-hint")}
            />
            <p className="hint" id="dc-letter-hint">
              {first + " reads exactly this. Keep it kind and plain. "}
              <button className="link-btn" type="button" onClick={() => kind && setLetters({ ...letters, [kind]: template(kind) })}>
                Start again from the template
              </button>
            </p>
            {err("dc-letter")}
          </div>
          <div className="field">
            <label htmlFor="dc-reason" className="decision-hr-label">
              <span>{kind === "offer" ? "Note for the file (optional)" : "Reason for the decision"}</span>
              <Badge variant="clay">HR only</Badge>
            </label>
            <textarea
              id="dc-reason"
              className="decision-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={kind === "offer" ? "For example: pay agreed with Marsha after the interview." : "For example: the role was filled by an internal move."}
              aria-invalid={errs["dc-reason"] ? true : undefined}
              aria-describedby={described("dc-reason", "dc-reason-hint")}
            />
            <p className="hint" id="dc-reason-hint">
              {"Saved in the notes. Never shown to " + first + " and never put in the e-mail."}
            </p>
            {err("dc-reason")}
          </div>

          {v ? (
            <div className="decision-preview" data-tour="hr-decision-preview">
              <h4>{"What " + first + " will see"}</h4>
              <ol className="decision-preview-steps">
                <li>
                  <p className="decision-step">The e-mail</p>
                  <div className="mail-preview">
                    <p className="mail-meta">
                      <span>To</span> {a.email}
                    </p>
                    <p className="mail-meta">
                      <span>Subject</span> {UPDATE_SUBJECT}
                    </p>
                    {updateMailBody(first, job ? job.title : "a job", store).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    <span className="btn btn-primary btn-sm is-inert" aria-hidden="true">
                      Open your update
                    </span>
                  </div>
                </li>
                <li>
                  <p className="decision-step">{"The applicant page, before " + first + " opens it"}</p>
                  <SealedLetter v={v} inert />
                </li>
                <li>
                  <p className="decision-step">After opening</p>
                  <OpenedLetter v={v} inert />
                </li>
              </ol>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="actions">
        <Button size="sm" type="submit" data-tour="hr-decision-send">
          Send the decision
        </Button>
        <Button variant="ghost" size="sm" data-cancel-action="" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
