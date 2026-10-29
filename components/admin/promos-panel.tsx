"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { PromoComposer } from "@/components/admin/promo-composer";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { can } from "@/lib/access";
import { attempt, inScope, personName } from "@/lib/admin/guard";
import { goToTab, plural } from "@/lib/admin/helpers";
import { KIND_LABEL, sortedPromos } from "@/lib/admin/promo-admin";
import { whenTT } from "@/lib/admin/tt";
import { PROMO_STATE, approveBlock, archivePromo, decidePromo, endPromo, fmtTT, promoState, promoStats, storesLabel, submitPromo, type PromoState } from "@/lib/promo";
import { byId, useData, useSession } from "@/lib/store";
import type { Promotion } from "@/lib/types";

// Promotions (promos.draft or promos.approve). Approvers see what waits for them first; everyone sees every offer
// with its state, and drafters get the composer. "#promos/<id>" opens one offer in a drawer: its details, the
// revision history and the actions this person may take on it.

export function StateBadge({ state }: { state: PromoState }) {
  const st = PROMO_STATE[state];
  return st.tone === "plain" ? <Badge plain>{st.label}</Badge> : <Badge variant={st.tone}>{st.label}</Badge>;
}

const runs = (p: Promotion) => fmtTT(p.starts) + " to " + fmtTT(p.ends);
const limits = (p: Promotion) => plural(p.limits.perCustomer, "code") + " per shopper, " + (p.limits.total === null ? "no limit in all" : p.limits.total.toLocaleString("en-US") + " in all");

/** Approve and send back, used in the approvals list and in the drawer. */
function useDecisions() {
  const s = useSession();
  const { confirm, prompt } = useConfirm();
  async function approve(p: Promotion) {
    const ok = await confirm({
      title: "Approve " + p.title + "?",
      body: "It goes on the Offers page on " + whenTT(p.starts) + ", and shoppers can claim codes until " + whenTT(p.ends) + ". " + "The person who drafted it is told on their Today page.",
      okLabel: "Approve offer",
    });
    if (!ok) return false;
    const r = attempt(s, "promo.approve", p.title, () => decidePromo(s, p.id, true, ""));
    if (!r.ok) {
      toast(r.message, "bad");
      return false;
    }
    toast("Approved. " + p.title + " goes live on " + whenTT(p.starts) + ".", "ok");
    return true;
  }
  async function sendBack(p: Promotion) {
    const note = await prompt({
      title: "Send " + p.title + " back",
      body: "Say what needs to change. The person who drafted it sees your note on their Today page and in the offer.",
      label: "What needs to change",
      placeholder: "For example: make the minimum spend TT$250, as we agreed.",
      okLabel: "Send back",
    });
    if (note === null) return false;
    if (!note.trim()) {
      toast("Add a note saying what to change. An offer cannot be sent back without one.", "bad");
      return false;
    }
    const r = attempt(s, "promo.reject", p.title, () => decidePromo(s, p.id, false, note.trim().replace(/\s+/g, " ").slice(0, 400)));
    if (!r.ok) {
      toast(r.message, "bad");
      return false;
    }
    toast("Sent back with your note.", "ok");
    return true;
  }
  return { approve, sendBack };
}

function Approvals() {
  const d = useData();
  const s = useSession();
  const { approve, sendBack } = useDecisions();
  const waiting = (d.promotions || []).filter((p) => promoState(d, p) === "review");
  return (
    <section className="panel" aria-labelledby="approve-h" data-tour="promo-approve">
      <div className="panel-head">
        <h2 id="approve-h">Waiting for approval</h2>
        <span className="small muted">{plural(waiting.length, "offer")}</span>
      </div>
      <div className="panel-body flush">
        {waiting.length ? (
          <ul className="list">
            {waiting.map((p) => {
              const block = approveBlock(d, s, p);
              return (
                <li key={p.id} className="approve-row">
                  <div className="grow">
                    <strong>{p.title}</strong>
                    <p className="row-line">{p.benefit}</p>
                    <div className="meta">{runs(p) + " · " + storesLabel(d, p.branchIds) + " · " + limits(p)}</div>
                    <div className="meta">{"Drafted by " + personName(d, p.createdBy) + (p.submittedAt ? ", sent " + fmtTT(p.submittedAt, true) : "")}</div>
                    {block ? <p className="block-note">{block}</p> : null}
                  </div>
                  <div className="row-actions">
                    {!block ? (
                      <>
                        <button className="btn btn-primary btn-sm" type="button" onClick={() => approve(p)}>
                          Approve<span className="visually-hidden">{" " + p.title}</span>
                        </button>
                        <button className="btn btn-ghost btn-sm" type="button" onClick={() => sendBack(p)}>
                          Send back<span className="visually-hidden">{" " + p.title}</span>
                        </button>
                      </>
                    ) : null}
                    <a className="btn btn-ghost btn-sm" href={"#promos/" + encodeURIComponent(p.id)}>
                      Details<span className="visually-hidden">{" of " + p.title}</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="panel-empty">Nothing is waiting for approval. Offers sent for approval show here, oldest first.</p>
        )}
      </div>
    </section>
  );
}

function PromoDetail({ p, onEdit, onDone }: { p: Promotion; onEdit: (id: string) => void; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const { approve, sendBack } = useDecisions();
  const state = promoState(d, p);
  const canDraft = can(d, s, "promos.draft"), canApprove = can(d, s, "promos.approve");
  const mine = inScope(d, s, p.branchIds);
  const block = canApprove && state === "review" ? approveBlock(d, s, p) : null;
  const stats = p.status === "approved" ? promoStats(d, p) : null;
  const canEdit = canDraft && mine && state !== "archived";
  const canSend = canDraft && mine && (state === "draft" || state === "rejected");
  const canEnd = canApprove && mine && (state === "live" || state === "full");
  // Archiving an approved offer that has not ended takes it off the site: that is the owner's office's call.
  const canArchive = canDraft && mine && (["draft", "rejected", "ended"].includes(state) || (canApprove && ["scheduled", "full"].includes(state)));

  function send() {
    const r = attempt(s, "promo.submit", p.title, () => submitPromo(s, p.id));
    if (!r.ok) return toast(r.message, "bad");
    toast("Sent for approval. It shows on the owner’s office Today page.", "ok");
  }
  async function end() {
    const ok = await confirm({
      title: "End " + p.title + " now?",
      body: "It comes off the Offers page straight away, and codes shoppers already hold stop working at the till. This cannot be undone; a new offer would need approval again.",
      okLabel: "End the offer now",
      danger: true,
    });
    if (!ok) return;
    const r = attempt(s, "promo.end", p.title, () => endPromo(s, p.id));
    if (!r.ok) return toast(r.message, "bad");
    toast(p.title + " has ended. Its codes no longer work at the till.", "ok");
  }
  async function archive() {
    const ok = await confirm({
      title: "Archive " + p.title + "?",
      body:
        p.status === "approved" && state !== "ended"
          ? "It comes off the Offers page and any codes shoppers hold stop working at the till. It stays in this list as archived."
          : "It moves to the bottom of this list as archived. Nothing changes on the website.",
      okLabel: "Archive offer",
    });
    if (!ok) return;
    const r = attempt(s, "promo.archive", p.title, () => archivePromo(s, p.id));
    if (!r.ok) return toast(r.message, "bad");
    toast("Archived.", "ok");
    onDone();
  }

  return (
    <div className="promo-detail">
      <div className="cluster">
        <StateBadge state={state} />
        <span className="small muted">{KIND_LABEL[p.kind]}</span>
      </div>
      {p.status === "rejected" && p.reviewNote ? (
        <div className="alert alert-bad">
          <p>
            <strong>Sent back: </strong>
            {p.reviewNote}
          </p>
        </div>
      ) : null}
      <dl className="kv">
        <dt>Shopper gets</dt>
        <dd>{p.benefit}</dd>
        <dt>Summary</dt>
        <dd>{p.summary || "None"}</dd>
        <dt>Stores</dt>
        <dd>{storesLabel(d, p.branchIds)}</dd>
        <dt>Runs</dt>
        <dd>{whenTT(p.starts) + " to " + whenTT(p.ends) + ", Trinidad time"}</dd>
        <dt>Limits</dt>
        <dd>{limits(p)}</dd>
        <dt>Drafted by</dt>
        <dd>{personName(d, p.createdBy) + ", " + fmtTT(p.createdAt)}</dd>
        {p.approvedBy ? (
          <>
            <dt>Approved by</dt>
            <dd>{personName(d, p.approvedBy) + (p.approvedAt ? ", " + fmtTT(p.approvedAt) : "")}</dd>
          </>
        ) : null}
        {stats ? (
          <>
            <dt>Codes</dt>
            <dd>{stats.claimed + " claimed, " + stats.redeemed + " used" + (stats.left === null ? "" : ", " + stats.left + " left")}</dd>
          </>
        ) : null}
      </dl>
      {p.terms.length ? (
        <>
          <h3 className="sub-h">Terms</h3>
          <ul className="plain-list">
            {p.terms.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </>
      ) : null}
      <h3 className="sub-h">History</h3>
      <ol className="timeline">
        {p.revisions
          .slice()
          .reverse()
          .map((r, i) => (
            <li key={i}>
              <time dateTime={r.at}>{fmtTT(r.at, true)}</time>
              {personName(d, r.by) + ": " + r.summary}
            </li>
          ))}
      </ol>
      {!mine ? <p className="block-note">This offer runs at stores outside your access, so you can read it but not change it.</p> : null}
      {block ? <p className="block-note">{block}</p> : null}
      <div className="cluster detail-actions">
        {canApprove && state === "review" && !block ? (
          <>
            <button className="btn btn-primary" type="button" onClick={async () => (await approve(p)) && onDone()}>
              Approve
            </button>
            <button className="btn btn-ghost" type="button" onClick={async () => (await sendBack(p)) && onDone()}>
              Send back
            </button>
          </>
        ) : null}
        {canSend ? (
          <button className="btn btn-primary" type="button" onClick={send}>
            Send for approval
          </button>
        ) : null}
        {canEdit ? (
          <button className="btn btn-ghost" type="button" onClick={() => onEdit(p.id)}>
            Edit
          </button>
        ) : null}
        {canEnd ? (
          <button className="btn btn-ghost" type="button" onClick={end}>
            End now
          </button>
        ) : null}
        {canArchive ? (
          <button className="btn btn-ghost" type="button" onClick={archive}>
            Archive
          </button>
        ) : null}
      </div>
    </div>
  );
}

const FILTERS: PromoState[] = ["review", "rejected", "draft", "scheduled", "live", "full", "ended", "archived"];

export function PromosPanel({ item }: { item: string | null }) {
  const d = useData();
  const s = useSession();
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState<"all" | PromoState>("all");
  const [edit, setEdit] = useState<{ id: string | null; seq: number }>({ id: null, seq: 0 });
  // The drawer keeps showing its offer while it slides out after the hash moves on.
  const [shown, setShown] = useState<string | null>(item);
  if (item && item !== shown) setShown(item);

  const canDraft = can(d, s, "promos.draft"), canApprove = can(d, s, "promos.approve");
  const rows = sortedPromos(d, new Date(now));
  const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.state] = (a[r.state] || 0) + 1), a), {});
  const list = filter === "all" ? rows : rows.filter((r) => r.state === filter);
  const open = item ? byId(d.promotions, item) : null;
  const detail = shown ? byId(d.promotions, shown) : null;

  // Edit, from the drawer: once it has closed, focus goes to the composer instead of back to the list.
  const toComposer = useRef(false);
  function startEdit(id: string | null) {
    flushSync(() => setEdit((e) => ({ id, seq: e.seq + 1 })));
    if (item) {
      toComposer.current = true;
      goToTab("promos");
    }
    requestAnimationFrame(() => {
      document.getElementById("promo-composer")?.scrollIntoView({ block: "start" });
      if (!toComposer.current) document.getElementById("pf-title")?.focus({ preventScroll: true });
    });
  }
  function afterClose(): HTMLElement | false {
    if (toComposer.current) {
      toComposer.current = false;
      return document.getElementById("pf-title") || false;
    }
    return (shown && document.querySelector<HTMLElement>('.promo-list a[href="#promos/' + encodeURIComponent(shown) + '"]')) || false;
  }

  return (
    <div className="section-stack">
      {item && !open ? (
        <div className="alert alert-warn">
          <p>No offer matches that link. It may have been removed in another tab.</p>
        </div>
      ) : null}
      {canApprove ? <Approvals /> : null}

      <section className="panel" aria-labelledby="promo-list-h">
        <div className="panel-head">
          <h2 id="promo-list-h">All offers</h2>
          <div className="cluster">
            <label className="visually-hidden" htmlFor="promo-filter">
              Show offers by state
            </label>
            <select id="promo-filter" value={filter} onChange={(e) => setFilter(e.target.value as "all" | PromoState)}>
              <option value="all">{"Every state (" + rows.length + ")"}</option>
              {FILTERS.filter((f) => counts[f]).map((f) => (
                <option key={f} value={f}>
                  {PROMO_STATE[f].label + " (" + counts[f] + ")"}
                </option>
              ))}
            </select>
            {canDraft ? (
              <button className="btn btn-primary btn-sm" type="button" onClick={() => startEdit(null)}>
                New offer
              </button>
            ) : null}
          </div>
        </div>
        <div className="panel-body flush">
          {list.length ? (
            <ul className="list promo-list">
              {list.map(({ p, state }) => {
                const st = p.status === "approved" ? promoStats(d, p) : null;
                return (
                  <li key={p.id}>
                    <div className="grow">
                      <strong>{p.title}</strong>
                      <p className="row-line">{p.benefit}</p>
                      <div className="meta">
                        {runs(p) + " · " + storesLabel(d, p.branchIds) + (st ? " · " + st.claimed + (p.limits.total === null ? "" : " of " + p.limits.total) + " codes claimed" : "")}
                      </div>
                    </div>
                    <StateBadge state={state} />
                    <a className="btn btn-ghost btn-sm" href={"#promos/" + encodeURIComponent(p.id)}>
                      Open<span className="visually-hidden">{" " + p.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="panel-empty">
              {rows.length ? "No offers in that state. Choose Every state to see them all." : canDraft ? "No offers yet. Write the first one below; it stays a draft until you send it for approval." : "No offers yet."}
            </p>
          )}
        </div>
      </section>

      {canDraft ? <PromoComposer editId={edit.id} seq={edit.seq} onSaved={(id) => setEdit((e) => ({ id, seq: e.seq + 1 }))} onNew={() => startEdit(null)} /> : null}

      <SideSheet
        open={!!open}
        onClose={() => goToTab("promos")}
        title={detail ? detail.title : "Offer"}
        sub={detail ? detail.benefit : undefined}
        finalFocus={afterClose}
      >
        {detail ? <PromoDetail p={detail} onEdit={startEdit} onDone={() => goToTab("promos")} /> : null}
      </SideSheet>
    </div>
  );
}
