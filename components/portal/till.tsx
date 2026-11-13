"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icon";
import { AccessError, can, scopeOf } from "@/lib/access";
import { fmtTT, formatCode, lockedUntil, normalizeCode, redeemCode, type RedeemReason, type RedeemResult } from "@/lib/promo";
import { byId, useData, useRequireRole } from "@/lib/store";
import type { Role, Seed, Session } from "@/lib/types";

// The till code check (PRD 9.5): the shopper shows a code, the cashier types it here, and a passing code is recorded
// as used at this store. Built for a queue: the cursor starts in the box, Enter checks, the box empties after every
// try, and the answer is one large panel that says what to do. Every rule (store, dates, used once, the lockout after
// five misses) lives in redeemCode(); this screen only shows its answer.

const TILL_ROLES: Role[] = ["employee", "hr", "admin", "purchasing", "marketing", "owner"];
const BRANCH_KEY = "sfb-till-branch";

const HEADLINE: Record<Exclude<RedeemReason, "recorded">, string> = {
  used: "Already used",
  ended: "This offer has ended",
  "not-started": "This offer has not started",
  "wrong-store": "Not for this store",
  unknown: "No code matches",
  format: "That is not a code",
  void: "This code was cancelled",
  locked: "Code checks are paused",
  "no-access": "No till access",
};

/** "K7QM4X" → "K7QM-4X" while typing; at most 8 characters. */
function asTyped(v: string) {
  const n = normalizeCode(v).slice(0, 8);
  return n.length > 4 ? formatCode(n) : n;
}

function readBranch(allowed: string[]) {
  try {
    const v = sessionStorage.getItem(BRANCH_KEY);
    if (v && allowed.includes(v)) return v;
  } catch {}
  return allowed.length === 1 ? allowed[0] : "";
}

export function PortalTill() {
  const s = useRequireRole(TILL_ROLES);
  const d = useData();
  return (
    <AppShell app="portal" active="till" title="Check a code" css={["app", "portal"]} page="till">
      {s ? can(d, s, "codes.redeem") ? <TillDesk key={s.userId} s={s} d={d} /> : <NoTillAccess /> : null}
    </AppShell>
  );
}

function NoTillAccess() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Check a code</h1>
        </div>
      </div>
      <div className="panel">
        <div className="panel-body">
          <h2>You do not have till access</h2>
          <p>Checking shoppers’ codes needs till access on your account. Ask the owner&apos;s office to add it.</p>
        </div>
      </div>
    </>
  );
}

function TillDesk({ s, d }: { s: Session; d: Seed }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const scope = scopeOf(d, s);
  const stores = scope ? d.branches.filter((b) => scope.includes(b.id)) : d.branches;
  const allowedIds = stores.map((b) => b.id);
  const [branch, setBranch] = useState(() => readBranch(allowedIds));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const staffId = s.userId || "";
  const until = lockedUntil(d, staffId, now);

  // While checks are paused, count down to the time they unlock.
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  // The box is disabled while paused, which drops focus; put the cursor back when checks start again.
  useEffect(() => {
    if (!until) input.current?.focus();
  }, [until]);

  function pickBranch(v: string) {
    setBranch(v);
    setResult(null);
    try {
      sessionStorage.setItem(BRANCH_KEY, v);
    } catch {}
    input.current?.focus();
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!branch) {
      setProblem("Choose the store you are working at first.");
      return;
    }
    if (!normalizeCode(code)) {
      setProblem("Type the code the shopper shows you.");
      input.current?.focus();
      return;
    }
    setProblem(null);
    setBusy(true);
    let r: RedeemResult;
    try {
      r = await redeemCode(s, branch, code);
    } catch (err) {
      if (!(err instanceof AccessError)) throw err;
      r = { ok: false, reason: "no-access", message: "You cannot record codes at this store. Ask the owner's office for till access." };
    }
    setBusy(false);
    setResult(r);
    setCode("");
    setNow(Date.now());
    input.current?.focus();
  }

  const branchName = byId(d.branches, branch)?.name;
  const shiftStart = new Date(s.at).getTime();
  const recent = (d.redemptions || []).filter((r) => r.by === staffId && new Date(r.at).getTime() >= shiftStart).slice(0, 5);
  const wait = until ? Math.max(0, Math.ceil((new Date(until).getTime() - now) / 1000)) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Check a code</h1>
          <p className="muted">Type the shopper’s code before they pay. A code that passes is recorded as used at this store.</p>
        </div>
      </div>

      <div className="till">
        <form className="panel till-panel" noValidate onSubmit={check}>
          <div className="panel-body">
            {stores.length > 1 ? (
              <div className="field">
                <label htmlFor={id + "-store"}>Your store today</label>
                <select id={id + "-store"} value={branch} onChange={(e) => pickBranch(e.currentTarget.value)}>
                  {branch ? null : <option value="">Choose a store</option>}
                  {stores.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="till-store">
                <Icon name="store" />
                <span>{"Checking codes at " + (branchName || "your store")}</span>
              </p>
            )}

            <label htmlFor={id + "-code"} className="till-label">
              Shopper’s code
            </label>
            <input
              ref={input}
              id={id + "-code"}
              className="till-input"
              data-tour="till-input"
              type="text"
              value={code}
              onChange={(e) => setCode(asTyped(e.currentTarget.value))}
              placeholder="XXXX-XXXX"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="go"
              disabled={!!until}
              aria-describedby={id + "-code-hint" + (problem ? " " + id + "-problem" : "")}
            />
            <p className="hint" id={id + "-code-hint"}>
              8 letters and numbers. Capitals or not, with or without the dash. Codes never use 0, O, 1, I, L, 2, Z, 5, S, 8 or B.
            </p>
            {problem ? (
              <p className="error-text" id={id + "-problem"} role="alert">
                {problem}
              </p>
            ) : null}
            <button className="btn btn-primary till-go" type="submit" disabled={busy || !!until}>
              <Icon name="check" />
              {busy ? "Checking" : "Check and record"}
            </button>
          </div>
        </form>

        <div className="till-result-wrap" aria-live="polite" data-tour="till-result">
          {until ? (
            <div className="till-result is-stop">
              <p className="till-verdict">{HEADLINE.locked}</p>
              <p>{"Too many codes did not match. Checks at this till start again at " + fmtTT(until, true).split(", ").pop() + "."}</p>
              <p className="till-count">{"In " + Math.floor(wait / 60) + " min " + String(wait % 60).padStart(2, "0") + " s"}</p>
              <p>Do not apply any discount until then. If a shopper is waiting, ask a supervisor.</p>
            </div>
          ) : result ? (
            <Verdict r={result} />
          ) : (
            <div className="till-result is-idle">
              <p className="till-verdict">Ready for a code</p>
              <p>The answer shows here. Green means apply the offer. Anything else means do not.</p>
            </div>
          )}
        </div>
      </div>

      <section className="panel till-recent" aria-labelledby="till-recent-h">
        <div className="panel-head">
          <h2 id="till-recent-h">Your last checks this shift</h2>
        </div>
        {recent.length ? (
          <ul className="list">
            {recent.map((r) => (
              <li key={r.id}>
                <span className={"till-dot " + (r.ok ? "is-ok" : "is-no")} aria-hidden="true" />
                <div className="grow">
                  <strong>{(r.ok ? "Recorded" : "Refused: " + r.reason.toLowerCase()) + " · code ending " + r.last4}</strong>
                  <div className="meta">{fmtTT(r.at, true) + " · " + (byId(d.branches, r.branchId)?.name || r.branchId)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel-body">
            <p className="muted" style={{ margin: 0 }}>
              No codes checked since you signed in.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function Verdict({ r }: { r: RedeemResult }) {
  if (r.ok) {
    return (
      <div className="till-result is-go">
        <p className="till-verdict">
          <Icon name="check" />
          {"Recorded: " + (r.promo?.benefit || "the offer") + ". Apply it now."}
        </p>
        {r.last4 ? <p>{"Code ending " + r.last4 + " is now used. It cannot be used again."}</p> : null}
      </div>
    );
  }
  const head = HEADLINE[r.reason as Exclude<RedeemReason, "recorded">] || "Not recorded";
  // redeemCode's messages often open with the same words as the headline ("No code matches. Check each character...");
  // show only the part that adds something, so the cashier reads each fact once.
  const detail = r.message.startsWith(head + ".")
    ? r.message.slice(head.length + 1).trim()
    : r.reason === "used"
      ? r.message.replace(/^Already used/, "Used")
      : r.message;
  return (
    <div className={"till-result " + (r.reason === "format" || r.reason === "unknown" ? "is-check" : "is-stop")}>
      <p className="till-verdict">
        <Icon name="close" />
        {head}
      </p>
      {detail ? <p>{detail}</p> : null}
      {r.promo ? <p className="till-promo">{"Offer: " + r.promo.benefit + (r.last4 ? " · code ending " + r.last4 : "")}</p> : null}
      <p className="till-dont">Do not apply the discount.</p>
    </div>
  );
}
