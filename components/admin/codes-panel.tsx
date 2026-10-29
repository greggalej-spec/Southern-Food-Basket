"use client";

import { useState } from "react";
import { StateBadge } from "@/components/admin/promos-panel";
import { Badge } from "@/components/ui/badge";
import { scopeOf } from "@/lib/access";
import { personName, scopeNote } from "@/lib/admin/guard";
import { branchName, plural } from "@/lib/admin/helpers";
import { clockTT, whenTT } from "@/lib/admin/tt";
import { lockedUntil, promoState, promoStats } from "@/lib/promo";
import { useData, useSession } from "@/lib/store";

// Codes and redemptions (codes.view): per offer, how many codes were claimed, used and are left, and where they were
// used; then every check at the tills. Staff screens only ever see a code's last four characters: the full code is
// on the shopper's own account and nowhere else.

/** The till's reasons, in plain words. */
const REASON: Record<string, string> = {
  Recorded: "Recorded",
  "Already used": "Already used",
  "No match": "No code matches",
  "Not a code": "Not a code (wrong shape)",
  Cancelled: "The code was cancelled",
  "Not started": "The offer has not started",
  Ended: "The offer has ended",
  "Wrong store": "The code is for another store",
  Locked: "Till checks were locked",
};

const SHOW = 40;

export function CodesPanel() {
  const d = useData();
  const s = useSession();
  const [now] = useState(() => Date.now());
  const [result, setResult] = useState<"all" | "ok" | "refused">("all");
  const [store, setStore] = useState("all");
  const [more, setMore] = useState(false);
  const scope = scopeOf(d, s);
  const atMine = (id: string) => !scope || scope.includes(id);
  const branches = (d.branches || []).filter((b) => atMine(b.id));

  const offers = (d.promotions || [])
    .filter((p) => p.status === "approved" && (!scope || !p.branchIds || p.branchIds.some(atMine)))
    .map((p) => ({ p, state: promoState(d, p, new Date(now)), st: promoStats(d, p) }))
    .sort((a, b) => b.p.starts.localeCompare(a.p.starts));

  const checks = (d.redemptions || []).filter((r) => atMine(r.branchId));
  const shown = checks.filter((r) => (result === "all" || (result === "ok") === r.ok) && (store === "all" || r.branchId === store));
  const cashiers = Array.from(new Set(checks.map((r) => r.by)));
  const locks = cashiers.map((id) => ({ id, until: lockedUntil(d, id, now) })).filter((x) => x.until);

  return (
    <div className="section-stack">
      {scope ? (
        <p className="scope-note">{scopeNote(d, s) + " Codes are claimed online, not at a store, so claimed and left count every store; used counts and till checks are for your stores."}</p>
      ) : null}

      <section className="panel" aria-labelledby="codes-h">
        <div className="panel-head">
          <h2 id="codes-h">Codes by offer</h2>
          <span className="small muted">Approved offers, newest first</span>
        </div>
        <div className="table-wrap flat" data-tour="codes-table">
          <table className="codes-table stack-table">
            <caption className="visually-hidden">Codes claimed, used and left for each approved offer, with where they were used</caption>
            <thead>
              <tr>
                <th scope="col">Offer</th>
                <th scope="col" className="num">
                  Claimed
                </th>
                <th scope="col" className="num">
                  Used
                </th>
                <th scope="col" className="num">
                  Left
                </th>
                <th scope="col">Used at</th>
              </tr>
            </thead>
            <tbody>
              {offers.length ? (
                offers.map(({ p, state, st }) => {
                  const where = Object.entries(st.byBranch).filter(([id]) => atMine(id));
                  return (
                    <tr key={p.id}>
                      <th scope="row">
                        <span className="cell-title">{p.title}</span>
                        <StateBadge state={state} />
                      </th>
                      <td className="num" data-label="Claimed">
                        {st.claimed.toLocaleString("en-US")}
                      </td>
                      <td className="num" data-label="Used">
                        {where.reduce((n, [, c]) => n + c, 0).toLocaleString("en-US")}
                      </td>
                      <td className="num" data-label="Left">
                        {st.left === null ? "No limit" : st.left.toLocaleString("en-US")}
                      </td>
                      <td data-label="Used at">{where.length ? where.map(([id, n]) => branchName(d, id) + " " + n).join(", ") : "Not used yet"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No approved offers yet. Once one is approved, its claims and redemptions show here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="checks-h">
        <div className="panel-head">
          <h2 id="checks-h">Till checks</h2>
          <span className="small muted">{plural(checks.length, "check")}</span>
        </div>
        <div className="panel-body">
          {locks.length ? (
            locks.map((x) => (
              <div className="alert alert-bad" key={x.id} role="status">
                <p>
                  <strong>{personName(d, x.id) + " is locked out of code checks until " + clockTT(x.until!) + "."}</strong>
                  {" Five checks in ten minutes did not match. It unlocks by itself; if someone is guessing codes, speak to them first."}
                </p>
              </div>
            ))
          ) : (
            <p className="hint lock-rule">Nobody is locked out. A cashier whose checks fail five times in ten minutes is locked out of code checks for five minutes.</p>
          )}
          <div className="toolbar">
            <div>
              <label className="visually-hidden" htmlFor="chk-result">
                Show checks by result
              </label>
              <select id="chk-result" value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
                <option value="all">Every result</option>
                <option value="ok">Recorded</option>
                <option value="refused">Refused</option>
              </select>
            </div>
            <div>
              <label className="visually-hidden" htmlFor="chk-store">
                Show checks by store
              </label>
              <select id="chk-store" value={store} onChange={(e) => setStore(e.target.value)}>
                <option value="all">{scope ? "Your stores" : "Every store"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="small muted toolbar-count" aria-live="polite">
              {plural(shown.length, "check")}
            </p>
          </div>
        </div>
        <div className="table-wrap flat">
          <table className="checks-table stack-table">
            <caption className="visually-hidden">Code checks at the tills, newest first</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Store</th>
                <th scope="col">Cashier</th>
                <th scope="col">Code</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {shown.length ? (
                shown.slice(0, more ? shown.length : SHOW).map((r) => (
                  <tr key={r.id}>
                    <td data-label="When">
                      <time dateTime={r.at}>{whenTT(r.at)}</time>
                    </td>
                    <td data-label="Store">{branchName(d, r.branchId)}</td>
                    <td data-label="Cashier">{personName(d, r.by)}</td>
                    <td data-label="Code" className="code-cell">
                      <span aria-label={"Code ending " + r.last4}>{"•••• " + r.last4}</span>
                    </td>
                    <td data-label="Result">
                      {r.ok ? (
                        <Badge variant="ok">Recorded</Badge>
                      ) : (
                        <span className="result-refused">
                          <Badge variant="bad">Refused</Badge>
                          <span>{REASON[r.reason] || r.reason}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    {checks.length ? "No checks match. Choose Every result and every store." : "No codes have been checked at a till yet. Each check, passed or refused, shows here."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {shown.length > SHOW && !more ? (
          <div className="panel-body">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setMore(true)}>
              {"Show all " + shown.length + " checks"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
