"use client";

import { useState } from "react";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { can, maskEmail, scopeOf } from "@/lib/access";
import { attempt, scopeNote, storeNames } from "@/lib/admin/guard";
import { goToTab, plural } from "@/lib/admin/helpers";
import { dayTT, ttDay, whenTT } from "@/lib/admin/tt";
import { CONSENT, SUB_STATE, TOPICS, exportSubscribersCsv } from "@/lib/newsletter";
import { byId, useData, useSession } from "@/lib/store";
import type { ConsentEvent, Seed, Subscriber, SubscriberStatus } from "@/lib/types";

// The mailing list (newsletter.view). Addresses show masked (r•••@example.com) unless the session can export the
// list (subscribers.export, the owner's office); the CSV export is that permission too, and it is logged.
// "#list/<id>" opens one subscriber's consent history.

const STATUSES: SubscriberStatus[] = ["active", "pending", "unsubscribed", "suppressed"];

const ACTION: Record<ConsentEvent["action"], string> = {
  requested: "Signed up, and was sent a link to confirm",
  confirmed: "Confirmed the address from the link",
  updated: "Changed which stores or topics they get",
  withdrawn: "Unsubscribed",
  suppressed: "Suppressed: we stopped sending",
};

function StatusBadge({ status }: { status: SubscriberStatus }) {
  const st = SUB_STATE[status];
  return st.tone === "plain" ? <Badge plain>{st.label}</Badge> : <Badge variant={st.tone}>{st.label}</Badge>;
}

const topicNames = (ids: string[]) => TOPICS.filter((t) => ids.includes(t.id)).map((t) => t.label).join(", ") || "Everything";
const storesOf = (d: Seed, x: Subscriber) => (x.branches.length ? storeNames(d, x.branches) : "Any store");

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function History({ x, full }: { x: Subscriber; full: boolean }) {
  const d = useData();
  const events = (d.consents || []).filter((c) => c.subscriberId === x.id).sort((a, b) => a.at.localeCompare(b.at));
  return (
    <>
      <dl className="kv">
        <dt>Status</dt>
        <dd>
          <StatusBadge status={x.status} />
        </dd>
        <dt>Address</dt>
        <dd className="code-cell">{full ? x.email : maskEmail(x.email)}</dd>
        <dt>Stores</dt>
        <dd>{storesOf(d, x)}</dd>
        <dt>Topics</dt>
        <dd>{topicNames(x.topics)}</dd>
        <dt>Signed up on</dt>
        <dd>{x.source}</dd>
      </dl>
      <h3 className="sub-h">Consent history</h3>
      {events.length ? (
        <ol className="timeline">
          {events.map((e) => (
            <li key={e.id}>
              <time dateTime={e.at}>{whenTT(e.at)}</time>
              {ACTION[e.action]}
              <span className="meta">{" · " + e.source}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint">No consent events on record for this address.</p>
      )}
      <h3 className="sub-h">The wording they agreed to</h3>
      <blockquote className="consent-text">
        <p>{CONSENT.text}</p>
      </blockquote>
      <p className="hint">
        {"Version " + CONSENT.version + ". Each line above records the version shown at the time" + (events.some((e) => e.wording !== CONSENT.version) ? "; some lines record an older version." : ".")}
      </p>
    </>
  );
}

export function ListPanel({ item }: { item: string | null }) {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [status, setStatus] = useState<"all" | SubscriberStatus>("all");
  const [store, setStore] = useState("all");
  const [shown, setShown] = useState<string | null>(item);
  if (item && item !== shown) setShown(item);

  const full = can(d, s, "subscribers.export");
  const scope = scopeOf(d, s);
  // A subscriber with no stores picked hears about every store, so every scope sees them.
  const mine = (d.subscribers || []).filter((x) => !scope || !x.branches.length || x.branches.some((b) => scope.includes(b)));
  const count = (st: SubscriberStatus) => mine.filter((x) => x.status === st).length;
  const rows = mine
    .filter((x) => (status === "all" || x.status === status) && (store === "all" || !x.branches.length || x.branches.includes(store)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const branches = (d.branches || []).filter((b) => !scope || scope.includes(b.id));
  const open = item ? byId(d.subscribers, item) : null;
  const detail = shown ? byId(d.subscribers, shown) : null;

  async function exportCsv() {
    const total = (d.subscribers || []).length;
    const ok = await confirm({
      title: "Download the whole list with full addresses?",
      body:
        "The file holds " +
        plural(total, "e-mail address", "e-mail addresses") +
        ", every status and every store. Keep it on the office computer, not on a shared drive or a phone, and delete it when you are done. The download is written in the audit log under your name.",
      okLabel: "Download the CSV",
    });
    if (!ok) return;
    const r = attempt(s, "subscribers.export", "Mailing list", () => exportSubscribersCsv(s));
    if (!r.ok) return toast(r.message, "bad");
    download(r.value, "sfb-mailing-list-" + ttDay(Date.now()) + ".csv");
    toast("Downloaded. It is in your downloads folder, and the audit log has a line for it.", "ok");
  }

  return (
    <div className="section-stack">
      {item && !open ? (
        <div className="alert alert-warn">
          <p>No subscriber matches that link.</p>
        </div>
      ) : null}
      {scope ? <p className="scope-note">{scopeNote(d, s) + " This list shows people who chose one of your stores, or any store."}</p> : null}

      <section className="panel" aria-labelledby="list-h">
        <div className="panel-head">
          <h2 id="list-h">Subscribers</h2>
          {full ? (
            <button className="btn btn-outline btn-sm" type="button" onClick={exportCsv}>
              Export CSV
            </button>
          ) : null}
        </div>
        <div className="panel-body">
          <div className="status-filter" role="group" aria-label="Show subscribers by status">
            <button className="btn btn-ghost btn-sm" type="button" aria-pressed={status === "all"} onClick={() => setStatus("all")}>
              {"Everyone "}
              <span className="num">{mine.length}</span>
            </button>
            {STATUSES.map((st) => (
              <button key={st} className="btn btn-ghost btn-sm" type="button" aria-pressed={status === st} onClick={() => setStatus(st)}>
                {SUB_STATE[st].label + " "}
                <span className="num">{count(st)}</span>
              </button>
            ))}
          </div>
          <div className="toolbar">
            <div>
              <label className="visually-hidden" htmlFor="list-store">
                Show subscribers by store
              </label>
              <select id="list-store" value={store} onChange={(e) => setStore(e.target.value)}>
                <option value="all">{scope ? "All your stores" : "Every store"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="small muted toolbar-count" aria-live="polite">
              {plural(rows.length, "subscriber")}
            </p>
          </div>
          <p className="hint">
            {full
              ? "You see full addresses because your access includes exporting the list."
              : "Addresses are masked. Seeing them in full, and exporting the list, is for the owner’s office."}
            {" Only confirmed subscribers are ever sent the newsletter."}
          </p>
        </div>
        <div className="table-wrap flat" data-tour="list-table">
          <table className="list-table stack-table">
            <caption className="visually-hidden">Mailing list subscribers, newest sign-up first</caption>
            <thead>
              <tr>
                <th scope="col">Address</th>
                <th scope="col">Status</th>
                <th scope="col">Stores</th>
                <th scope="col">Topics</th>
                <th scope="col">Signed up</th>
                <th scope="col">
                  <span className="visually-hidden">Consent history</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((x) => (
                  <tr key={x.id}>
                    <th scope="row" className="code-cell">
                      {full ? x.email : maskEmail(x.email)}
                    </th>
                    <td data-label="Status">
                      <StatusBadge status={x.status} />
                    </td>
                    <td data-label="Stores">{storesOf(d, x)}</td>
                    <td data-label="Topics">{topicNames(x.topics)}</td>
                    <td data-label="Signed up">
                      <time dateTime={x.createdAt}>{dayTT(x.createdAt)}</time>
                      <span className="meta">{" · " + x.source}</span>
                    </td>
                    <td>
                      <a className="btn btn-ghost btn-sm" href={"#list/" + encodeURIComponent(x.id)}>
                        History<span className="visually-hidden">{" for " + (full ? x.email : maskEmail(x.email))}</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    {mine.length ? "Nobody matches. Choose Everyone and every store." : "Nobody has signed up yet. Sign-ups from the newsletter forms on the site show here once they are made."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SideSheet
        open={!!open}
        onClose={() => goToTab("list")}
        title={detail ? (full ? detail.email : maskEmail(detail.email)) : "Subscriber"}
        sub={detail ? "Signed up " + dayTT(detail.createdAt) : undefined}
        finalFocus={() => (shown && document.querySelector<HTMLElement>('.list-table a[href="#list/' + encodeURIComponent(shown) + '"]')) || false}
      >
        {detail ? <History x={detail} full={full} /> : null}
      </SideSheet>
    </div>
  );
}
