"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { EmailPreview } from "@/components/admin/email-preview";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { can, scopeOf } from "@/lib/access";
import {
  CAMPAIGN_FIELDS,
  CAMPAIGN_STATE,
  TEMPLATE_LABEL,
  blankCampaign,
  campaignDraft,
  campaignValues,
  checkCampaign,
  checkSendTime,
  saveCampaignScoped,
  scheduleScoped,
  sendNowScoped,
  sendTestScoped,
  type CampaignField,
  type CampaignValues,
} from "@/lib/admin/campaign-admin";
import { attempt, inScope, personName, scopeNote } from "@/lib/admin/guard";
import { describedBy, firstError, goToTab, newestFirst, plural, type Errors } from "@/lib/admin/helpers";
import { toTtInput, whenTT } from "@/lib/admin/tt";
import { money } from "@/lib/format";
import { TOPICS, audience, sendDue } from "@/lib/newsletter";
import { fmtTT, promoState } from "@/lib/promo";
import { byId, useData, useSession } from "@/lib/store";
import type { Campaign } from "@/lib/types";

// Newsletter. Reading needs newsletter.view; writing and test sends need newsletter.compose; scheduling and sending
// need newsletter.send. A scheduled newsletter whose time has come goes out when this section opens (sendDue); in
// production a scheduled job does that. "#newsletter/<id>" opens one newsletter in the composer.

const FIELD_ID: Record<CampaignField, string> = {
  subject: "nf-subject",
  preheader: "nf-pre",
  intro: "nf-intro",
  specials: "nf-specials",
  promo: "nf-promo",
  stores: "nf-all-stores",
};
const MAX_SPECIALS = 8;

function CampaignBadge({ c }: { c: Campaign }) {
  const st = CAMPAIGN_STATE[c.status];
  return st.tone === "plain" ? <Badge plain>{st.label}</Badge> : <Badge variant={st.tone}>{st.label}</Badge>;
}

function statusLine(c: Campaign) {
  if (c.status === "sent") return "Sent " + whenTT(c.sentAt) + " to " + plural(c.sentTo || 0, "subscriber");
  if (c.status === "scheduled") return "Goes out " + whenTT(c.scheduledFor) + ", Trinidad time";
  return "Draft, started " + fmtTT(c.createdAt);
}

function Err({ id, msg }: { id: string; msg?: string }) {
  return (
    <p className="error-text" id={id} hidden={!msg}>
      {msg || ""}
    </p>
  );
}

/** The live audience line: who this would reach, and who is never counted. */
function Audience({ v }: { v: CampaignValues }) {
  const d = useData();
  const n = audience(d, campaignDraft(v).segment).length;
  const subs = d.subscribers || [];
  const by = (st: string) => subs.filter((x) => x.status === st).length;
  return (
    <div className={"audience" + (n ? "" : " is-empty")} data-tour="newsletter-audience" aria-live="polite">
      <p className="audience-count">
        <strong>{plural(n, "confirmed subscriber")}</strong>
        {n ? " would get this." : ": nobody matches these stores and topics."}
      </p>
      <p className="hint">
        {"Counts confirmed subscribers only. " +
          plural(by("pending"), "sign-up") +
          " not yet confirmed, " +
          by("unsubscribed") +
          " unsubscribed and " +
          by("suppressed") +
          " suppressed are never sent to."}
      </p>
    </div>
  );
}

function SentView({ c }: { c: Campaign }) {
  const d = useData();
  return (
    <section className="panel" aria-labelledby="nl-sent-h">
      <div className="panel-head">
        <h2 id="nl-sent-h">{c.subject}</h2>
        <CampaignBadge c={c} />
      </div>
      <div className="panel-body composer">
        <div>
          <p>{statusLine(c) + ". A sent newsletter cannot be changed."}</p>
          <dl className="kv">
            <dt>Kind</dt>
            <dd>{TEMPLATE_LABEL[c.template]}</dd>
            <dt>Written by</dt>
            <dd>{personName(d, c.createdBy)}</dd>
            <dt>Tests</dt>
            <dd>{c.testSends.length ? c.testSends.map((t) => fmtTT(t.at, true)).join("; ") : "None"}</dd>
          </dl>
        </div>
        <div className="composer-preview">
          <EmailPreview d={d} v={campaignValues(c)} />
        </div>
      </div>
    </section>
  );
}

function Composer({ c, seq }: { c: Campaign | null; seq: number }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const scope = scopeOf(d, s);
  const canSend = can(d, s, "newsletter.send");
  const key = (c?.id || "new") + ":" + seq;
  const init = () => (c ? campaignValues(c) : blankCampaign(scope));
  const [loaded, setLoaded] = useState(key);
  const [v, setV] = useState<CampaignValues>(init);
  const [at, setAt] = useState(() => toTtInput(c?.scheduledFor));
  const [atError, setAtError] = useState("");
  const [errors, setErrors] = useState<Errors<CampaignField>>({});
  if (key !== loaded) {
    setLoaded(key);
    setV(init());
    setAt(toTtInput(c?.scheduledFor));
    setAtError("");
    setErrors({});
  }

  const specials = newestFirst(d.specials || []);
  const offers = (d.promotions || []).filter((p) => ["live", "scheduled"].includes(promoState(d, p)) && inScope(d, s, p.branchIds));
  const fid = (k: string) => "nf-" + k;
  const bad = (k: CampaignField) => (errors[k] ? ("true" as const) : undefined);

  function set<K extends keyof CampaignValues>(name: K, value: CampaignValues[K]) {
    const next = { ...v, [name]: value };
    setV(next);
    const touched = (Object.keys(errors) as CampaignField[]).filter((k) => errors[k]);
    if (touched.length) {
      const e = checkCampaign(next, scope);
      setErrors(Object.fromEntries(touched.map((k) => [k, e[k]])) as Errors<CampaignField>);
    }
  }
  const toggle = (list: string[], id: string, on: boolean) => (on ? [...list, id] : list.filter((x) => x !== id));

  /** Checks and saves the form; returns the newsletter's id, or null when it did not save. */
  function save(quiet = false) {
    const errs = checkCampaign(v, scope);
    flushSync(() => setErrors(errs));
    const first = firstError(CAMPAIGN_FIELDS, errs);
    if (first) {
      document.getElementById(FIELD_ID[first])?.focus();
      toast("Check the highlighted fields.", "bad");
      return null;
    }
    const r = attempt(s, c ? "newsletter.edit" : "newsletter.create", v.subject.trim() || "New newsletter", () => saveCampaignScoped(s, c?.id || null, campaignDraft(v)));
    if (!r.ok) {
      toast(r.message, "bad");
      return null;
    }
    if (!quiet) toast(c?.status === "scheduled" ? "Saved. It still goes out " + whenTT(c.scheduledFor) + "." : "Saved as a draft.", "ok");
    if (!c) goToTab("newsletter", r.value);
    return r.value;
  }

  function test() {
    const id = save(true);
    if (!id) return;
    const r = attempt(s, "newsletter.test", v.subject.trim(), () => sendTestScoped(s, id));
    if (!r.ok) return toast(r.message, "bad");
    if (!r.value) return toast("Your staff record has no work address, so the test could not go out.", "bad");
    toast("Saved, and a test went to your work address, " + r.value + ". It is in the demo outbox.", "ok");
  }

  function schedule() {
    const t = checkSendTime(at, Date.now());
    if ("error" in t) {
      setAtError(t.error);
      document.getElementById(fid("at"))?.focus();
      return;
    }
    setAtError("");
    const id = save(true);
    if (!id) return;
    const r = attempt(s, "newsletter.schedule", v.subject.trim(), () => scheduleScoped(s, id, t.at));
    if (!r.ok) return toast(r.message, "bad");
    toast("Scheduled for " + whenTT(t.at) + ", Trinidad time.", "ok");
  }

  function unschedule() {
    if (!c) return;
    const r = attempt(s, "newsletter.unschedule", c.subject, () => scheduleScoped(s, c.id, null));
    if (!r.ok) return toast(r.message, "bad");
    toast("Taken off the schedule. It is a draft again.", "ok");
  }

  async function sendNowClick() {
    const n = audience(d, campaignDraft(v).segment).length;
    if (!n) return toast("Nobody matches these stores and topics, so there is nobody to send it to.", "bad");
    const ok = await confirm({
      title: "Send it now to " + plural(n, "confirmed subscriber") + "?",
      body: "“" + v.subject.trim() + "” goes out straight away. A sent newsletter cannot be changed or called back.",
      okLabel: "Send to " + n + " now",
    });
    if (!ok) return;
    const id = save(true);
    if (!id) return;
    const r = attempt(s, "newsletter.send", v.subject.trim(), () => sendNowScoped(s, id));
    if (!r.ok) return toast(r.message, "bad");
    toast("Sent to " + plural(r.value, "subscriber") + ".", "ok");
  }

  if (c && !inScope(d, s, c.segment.branches)) {
    return (
      <section className="panel" aria-labelledby="nf-h" data-tour="newsletter-composer">
        <div className="panel-head">
          <h2 id="nf-h">{c.subject}</h2>
          <CampaignBadge c={c} />
        </div>
        <div className="panel-body">
          <p>{scopeNote(d, s) + " This newsletter goes to other stores’ shoppers too, so someone with every store changes it."}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="nf-h" data-tour="newsletter-composer" id="nl-composer">
      <div className="panel-head">
        <h2 id="nf-h">{c ? "Edit newsletter" : "New newsletter"}</h2>
        {c ? <CampaignBadge c={c} /> : null}
      </div>
      <div className="panel-body composer">
        <form
          className="composer-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="field">
            <label htmlFor={fid("subject")}>Subject line</label>
            <input id={fid("subject")} type="text" maxLength={120} autoComplete="off" value={v.subject} onChange={(e) => set("subject", e.target.value)} aria-invalid={bad("subject")} aria-describedby={describedBy(null, fid("subject-err"), errors.subject)} />
            <Err id={fid("subject-err")} msg={errors.subject} />
          </div>
          <div className="field">
            <label htmlFor={fid("pre")}>Preview line</label>
            <input id={fid("pre")} type="text" maxLength={140} autoComplete="off" value={v.preheader} onChange={(e) => set("preheader", e.target.value)} aria-invalid={bad("preheader")} aria-describedby={describedBy(fid("pre-hint"), fid("pre-err"), errors.preheader)} />
            <p className="hint" id={fid("pre-hint")}>
              Most inboxes show it after the subject.
            </p>
            <Err id={fid("pre-err")} msg={errors.preheader} />
          </div>
          <div className="field">
            <label htmlFor={fid("template")}>Kind of e-mail</label>
            <select id={fid("template")} value={v.template} onChange={(e) => set("template", e.target.value as CampaignValues["template"])}>
              {(Object.keys(TEMPLATE_LABEL) as CampaignValues["template"][]).map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={fid("intro")}>Opening</label>
            <textarea id={fid("intro")} rows={4} maxLength={700} value={v.intro} onChange={(e) => set("intro", e.target.value)} aria-invalid={bad("intro")} aria-describedby={describedBy(fid("intro-hint"), fid("intro-err"), errors.intro)} />
            <p className="hint" id={fid("intro-hint")}>
              A few friendly lines. Leave a blank line between paragraphs.
            </p>
            <Err id={fid("intro-err")} msg={errors.intro} />
          </div>

          <fieldset id={fid("specials")} tabIndex={-1} aria-describedby={describedBy(fid("specials-hint"), fid("specials-err"), errors.specials)}>
            <legend>Specials to show</legend>
            <p className="hint" id={fid("specials-hint")}>
              {v.specialIds.length + " of up to " + MAX_SPECIALS + " picked, shown in the order you tick them."}
            </p>
            <div className="pick-list">
              {specials.map((sp) => (
                <label className="check" key={sp.id}>
                  <input type="checkbox" checked={v.specialIds.includes(sp.id)} disabled={!v.specialIds.includes(sp.id) && v.specialIds.length >= MAX_SPECIALS} onChange={(e) => set("specialIds", toggle(v.specialIds, sp.id, e.target.checked))} />
                  <span>
                    {sp.name}
                    <span className="muted">{" · " + money(sp.price)}</span>
                  </span>
                </label>
              ))}
            </div>
            <Err id={fid("specials-err")} msg={errors.specials} />
          </fieldset>

          <div className="field">
            <label htmlFor={fid("promo")}>Members’ offer</label>
            <select id={fid("promo")} value={v.promoId} onChange={(e) => set("promoId", e.target.value)} aria-invalid={bad("promo")} aria-describedby={describedBy(fid("promo-hint"), fid("promo-err"), errors.promo)}>
              <option value="">No offer</option>
              {offers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title + (promoState(d, p) === "scheduled" ? " (starts " + fmtTT(p.starts) + ")" : "")}
                </option>
              ))}
              {v.promoId && !offers.some((p) => p.id === v.promoId) ? <option value={v.promoId}>An offer that is no longer live</option> : null}
            </select>
            <p className="hint" id={fid("promo-hint")}>
              Approved offers that are live or about to start.
            </p>
            <Err id={fid("promo-err")} msg={errors.promo} />
          </div>

          <fieldset aria-describedby={describedBy(scope ? fid("stores-hint") : null, fid("stores-err"), errors.stores)}>
            <legend>Which stores’ shoppers</legend>
            <label className="check">
              <input id={fid("all-stores")} type="checkbox" checked={v.allStores} disabled={!!scope} onChange={(e) => set("allStores", e.target.checked)} aria-invalid={bad("stores")} />
              <span>Every store</span>
            </label>
            <div className="check-grid">
              {(d.branches || []).map((b) => (
                <label className="check" key={b.id}>
                  <input type="checkbox" checked={v.allStores || v.branches.includes(b.id)} disabled={v.allStores || (!!scope && !scope.includes(b.id))} onChange={(e) => set("branches", toggle(v.branches, b.id, e.target.checked))} />
                  <span>{b.name}</span>
                </label>
              ))}
            </div>
            {scope ? (
              <p className="hint" id={fid("stores-hint")}>
                {scopeNote(d, s)}
              </p>
            ) : null}
            <Err id={fid("stores-err")} msg={errors.stores} />
          </fieldset>

          <fieldset aria-describedby={fid("topics-hint")}>
            <legend>Topics it counts as</legend>
            {TOPICS.map((t) => (
              <label className="check" key={t.id}>
                <input type="checkbox" checked={v.topics.includes(t.id)} onChange={(e) => set("topics", toggle(v.topics, t.id, e.target.checked))} />
                <span>{t.label}</span>
              </label>
            ))}
            <p className="hint" id={fid("topics-hint")}>
              Subscribers who asked for any ticked topic get it. Tick none to send it to every confirmed subscriber at those stores.
            </p>
          </fieldset>

          <Audience v={v} />

          <div className="cluster composer-actions">
            <button className="btn btn-primary" type="submit">
              Save draft
            </button>
            <button className="btn btn-ghost" type="button" onClick={test}>
              Send a test to me
            </button>
          </div>

          {canSend ? (
            <div className="send-box">
              <h3 className="sub-h">Send it</h3>
              {c?.status === "scheduled" ? (
                <p className="send-state">
                  {"Scheduled for " + whenTT(c.scheduledFor) + ", Trinidad time. "}
                  <button className="link-btn" type="button" onClick={unschedule}>
                    Take it off the schedule
                  </button>
                </p>
              ) : null}
              <div className="field">
                <label htmlFor={fid("at")}>{c?.status === "scheduled" ? "Move it to" : "Send at"}</label>
                <input
                  id={fid("at")}
                  type="datetime-local"
                  value={at}
                  onChange={(e) => {
                    setAt(e.target.value);
                    if (atError) setAtError("");
                  }}
                  aria-invalid={atError ? "true" : undefined}
                  aria-describedby={describedBy(fid("at-hint"), fid("at-err"), atError)}
                />
                <p className="hint" id={fid("at-hint")}>
                  Trinidad time. The weekly e-mail usually goes at 7:00 am.
                </p>
                <Err id={fid("at-err")} msg={atError} />
              </div>
              <div className="cluster">
                <button className="btn btn-outline" type="button" onClick={schedule}>
                  {c?.status === "scheduled" ? "Move the send time" : "Schedule"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={sendNowClick}>
                  Send now
                </button>
              </div>
            </div>
          ) : (
            <p className="hint">Scheduling and sending need newsletter sending access. Save it and ask the owner’s office, or someone who can send, to schedule it.</p>
          )}
        </form>
        <div className="composer-preview">
          <EmailPreview d={d} v={v} />
        </div>
      </div>
    </section>
  );
}

export function NewsletterPanel({ item }: { item: string | null }) {
  const d = useData();
  const s = useSession();
  const [seq, setSeq] = useState(0);
  const ran = useRef(false);
  const canCompose = can(d, s, "newsletter.compose");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const n = sendDue();
    if (n) toast(plural(n, "scheduled newsletter was", "scheduled newsletters were") + " due, and went out just now.", "ok");
  }, []);

  const list = (d.campaigns || []).slice().sort((a, b) => {
    const order = { scheduled: 0, draft: 1, sent: 2 };
    return order[a.status] - order[b.status] || String(b.sentAt || b.scheduledFor || b.createdAt).localeCompare(String(a.sentAt || a.scheduledFor || a.createdAt));
  });
  const c = item ? byId(d.campaigns, item) : null;

  function startNew() {
    setSeq((n) => n + 1);
    goToTab("newsletter");
    requestAnimationFrame(() => document.getElementById("nf-subject")?.focus());
  }

  return (
    <div className="section-stack">
      {item && !c ? (
        <div className="alert alert-warn">
          <p>No newsletter matches that link. It may have been removed.</p>
        </div>
      ) : null}
      <section className="panel" aria-labelledby="nl-list-h">
        <div className="panel-head">
          <h2 id="nl-list-h">Newsletters</h2>
          {canCompose ? (
            <button className="btn btn-primary btn-sm" type="button" onClick={startNew}>
              New newsletter
            </button>
          ) : null}
        </div>
        <div className="panel-body flush">
          {list.length ? (
            <ul className="list">
              {list.map((x) => (
                <li key={x.id} className={x.id === c?.id ? "is-current" : undefined}>
                  <div className="grow">
                    <strong>{x.subject}</strong>
                    <div className="meta">{TEMPLATE_LABEL[x.template] + " · " + statusLine(x)}</div>
                  </div>
                  <CampaignBadge c={x} />
                  <a className="btn btn-ghost btn-sm" href={"#newsletter/" + encodeURIComponent(x.id)} aria-current={x.id === c?.id ? "true" : undefined}>
                    {x.status === "sent" || !canCompose ? "View" : "Open"}
                    <span className="visually-hidden">{" " + x.subject}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="panel-empty">No newsletters yet. {canCompose ? "Write the first one below." : ""}</p>
          )}
        </div>
      </section>

      {c && (c.status === "sent" || !canCompose) ? (
        <SentView c={c} />
      ) : canCompose ? (
        <Composer c={c} seq={seq} />
      ) : (
        <p className="scope-note">Open a newsletter to read it. Writing them needs newsletter writing access; ask the owner’s office.</p>
      )}
    </div>
  );
}
