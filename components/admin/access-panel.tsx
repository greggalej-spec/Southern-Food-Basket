"use client";

import { useEffect, useState } from "react";
import { SideSheet } from "@/components/admin/side-sheet";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { PERMISSIONS, ROLE_NAME, ROLE_PERMS, STAFF_ROLES, type Permission, type StaffRole } from "@/lib/access";
import {
  GRANT_STATE,
  addGrant,
  grantLine,
  grantState,
  lockoutBlock,
  restoreGrant,
  revokeGrant,
  setGrantExpiry,
  setGrantStores,
  setTillAccess,
} from "@/lib/admin/access-admin";
import { attempt, personName } from "@/lib/admin/guard";
import { branchName } from "@/lib/admin/helpers";
import { dayTT, endOfTtDay, ttDay } from "@/lib/admin/tt";
import { byId, load, useData, useSession } from "@/lib/store";
import type { Grant, Seed } from "@/lib/types";

// Staff access (access.manage, the owner's office). Grants are grouped by person. Every write is a helper in
// lib/admin/access-admin.ts that checks access inside update() and keeps the lockout guard: nobody changes their own
// owner's office access, and the last live one cannot be revoked or limited. "#access/<userId>" scrolls to a person.

const TILL: Permission = "codes.redeem";
const hasTill = (g: Grant) => (g.extra || []).includes(TILL);

function GrantBadge({ g, now }: { g: Grant; now: number }) {
  const st = GRANT_STATE[grantState(g, now)];
  return st.tone === "plain" ? <Badge plain>{st.label}</Badge> : <Badge variant={st.tone}>{st.label}</Badge>;
}

/** The reason given when a grant was revoked: it lives in the audit line (Grant has no field for it). */
function revokeReason(d: Seed, g: Grant) {
  const head = ROLE_NAME[g.role] + " revoked. Reason: ";
  const e = (d.audit || []).find((x) => x.action === "access.revoke" && x.ok && x.target === personName(d, g.userId) && x.detail.startsWith(head));
  return e ? e.detail.slice(head.length) : "";
}

function StorePicker({
  idPrefix,
  all,
  ids,
  disabled,
  onChange,
}: {
  idPrefix: string;
  all: boolean;
  ids: string[];
  disabled?: boolean;
  onChange: (all: boolean, ids: string[]) => void;
}) {
  const d = useData();
  return (
    <>
      <label className="check">
        <input id={idPrefix + "-all"} type="checkbox" checked={all} disabled={disabled} onChange={(e) => onChange(e.target.checked, ids)} />
        <span>Every store</span>
      </label>
      <div className="check-grid">
        {(d.branches || []).map((b) => (
          <label className="check" key={b.id}>
            <input
              type="checkbox"
              checked={all || ids.includes(b.id)}
              disabled={disabled || all}
              onChange={(e) => onChange(false, e.target.checked ? [...ids, b.id] : ids.filter((x) => x !== b.id))}
            />
            <span>{b.name}</span>
          </label>
        ))}
      </div>
    </>
  );
}

/** The edit drawer for one grant: stores, end date and, for an employee, till access. */
function GrantEditor({ g, onDone }: { g: Grant; onDone: () => void }) {
  const d = useData();
  const s = useSession();
  const [all, setAll] = useState(!g.branchIds);
  const [ids, setIds] = useState<string[]>(g.branchIds ? [...g.branchIds] : []);
  const [ends, setEnds] = useState(g.expires ? ttDay(g.expires) : "");
  const [till, setTill] = useState(hasTill(g));
  const [error, setError] = useState("");
  const [today] = useState(() => ttDay(Date.now()));
  const limitBlock = lockoutBlock(d, s, g, "limit");

  function save() {
    if (!all && !ids.length) return setError("Choose at least one store, or every store.");
    const expires = ends ? endOfTtDay(ends) : null;
    if (ends && !expires) return setError("Choose a whole date for the end, or clear it.");
    setError("");
    const who = personName(d, g.userId);
    const steps: [boolean, string, () => void][] = [
      [all !== !g.branchIds || (!all && JSON.stringify(ids.slice().sort()) !== JSON.stringify((g.branchIds || []).slice().sort())), "access.scope", () => setGrantStores(s, g.id, all ? null : ids)],
      [(expires || null) !== (g.expires || null), "access.expiry", () => setGrantExpiry(s, g.id, expires)],
      [g.role === "employee" && till !== hasTill(g), "access.extra", () => setTillAccess(s, g.id, till)],
    ];
    const todo = steps.filter(([changed]) => changed);
    if (!todo.length) return onDone();
    for (const [, action, fn] of todo) {
      const r = attempt(s, action, who, fn);
      if (!r.ok) return setError(r.message);
    }
    // useData() catches up on the next render, so read the saved grant back from the store for the message.
    const after = load();
    toast("Saved. " + who + "’s access is now " + grantLine(after, byId(after.grants, g.id) || g) + ".", "ok");
    onDone();
  }

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {limitBlock ? (
        <div className="alert alert-info">
          <p>{limitBlock}</p>
        </div>
      ) : null}
      <fieldset>
        <legend>Stores it covers</legend>
        <StorePicker
          idPrefix="ge-stores"
          all={all}
          ids={ids}
          disabled={!!limitBlock}
          onChange={(a, next) => {
            setAll(a);
            setIds(next);
          }}
        />
      </fieldset>
      <div className="field">
        <label htmlFor="ge-ends">Ends after</label>
        <div className="cluster">
          <input id="ge-ends" type="date" value={ends} min={today} disabled={!!limitBlock} onChange={(e) => setEnds(e.target.value)} aria-describedby="ge-ends-hint" />
          {ends && !limitBlock ? (
            <button className="link-btn" type="button" onClick={() => setEnds("")}>
              No end date
            </button>
          ) : null}
        </div>
        <p className="hint" id="ge-ends-hint">
          Access stops at 11:59 pm Trinidad time on that day. Leave it empty for no end date.
        </p>
      </div>
      {g.role === "employee" ? (
        <label className="check">
          <input type="checkbox" checked={till} onChange={(e) => setTill(e.target.checked)} />
          <span>
            Can record shoppers’ codes at the till
            <span className="hint">{" Only at the stores above."}</span>
          </span>
        </label>
      ) : null}
      <p className="error-text" role="alert" hidden={!error}>
        {error}
      </p>
      <div className="cluster">
        <button className="btn btn-primary" type="submit">
          Save changes
        </button>
        <button className="btn btn-ghost" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddGrant() {
  const d = useData();
  const s = useSession();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<StaffRole>("employee");
  const [all, setAll] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [ends, setEnds] = useState("");
  const [till, setTill] = useState(false);
  const [error, setError] = useState("");
  const [today] = useState(() => ttDay(Date.now()));
  const staff = (d.employees || []).slice().sort((a, b) => a.name.localeCompare(b.name));

  function pickPerson(id: string) {
    setUserId(id);
    const e = byId(d.employees, id);
    if (e && !all && !ids.length) setIds([e.branchId]);
  }

  function submit() {
    if (!userId) return setError("Choose a member of staff.");
    if (!all && !ids.length) return setError("Choose at least one store, or every store.");
    const expires = ends ? endOfTtDay(ends) : null;
    if (ends && !expires) return setError("Choose a whole date for the end, or leave it empty.");
    setError("");
    const who = personName(d, userId);
    const r = attempt(s, "access.grant", who, () => addGrant(s, { userId, role, branchIds: all ? null : ids, expires, till: role === "employee" && till }));
    if (!r.ok) return setError(r.message);
    toast(who + " now has " + ROLE_NAME[role] + " access. It works from their next click.", "ok");
    setUserId("");
    setRole("employee");
    setAll(false);
    setIds([]);
    setEnds("");
    setTill(false);
  }

  return (
    <section className="panel" aria-labelledby="add-grant-h">
      <div className="panel-head">
        <h2 id="add-grant-h">Give access</h2>
      </div>
      <form
        className="panel-body stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="form-row">
          <div className="field">
            <label htmlFor="ag-person">Who</label>
            <select id="ag-person" value={userId} onChange={(e) => pickPerson(e.target.value)}>
              <option value="">Choose a member of staff</option>
              {staff.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name + ", " + e.role}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ag-role">Role</label>
            <select id="ag-role" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_NAME[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset>
          <legend>Stores it covers</legend>
          <StorePicker
            idPrefix="ag-stores"
            all={all}
            ids={ids}
            onChange={(a, next) => {
              setAll(a);
              setIds(next);
            }}
          />
        </fieldset>
        <div className="field">
          <label htmlFor="ag-ends">Ends after (optional)</label>
          <input id="ag-ends" type="date" value={ends} min={today} onChange={(e) => setEnds(e.target.value)} aria-describedby="ag-ends-hint" />
          <p className="hint" id="ag-ends-hint">
            For cover while someone is away. Access stops at 11:59 pm Trinidad time on that day.
          </p>
        </div>
        {role === "employee" ? (
          <label className="check">
            <input type="checkbox" checked={till} onChange={(e) => setTill(e.target.checked)} />
            <span>Can record shoppers’ codes at the till</span>
          </label>
        ) : null}
        <p className="error-text" role="alert" hidden={!error}>
          {error}
        </p>
        <div className="cluster">
          <button className="btn btn-primary" type="submit">
            Give access
          </button>
        </div>
      </form>
    </section>
  );
}

function Matrix() {
  const perms = Object.keys(PERMISSIONS) as Permission[];
  return (
    <details className="matrix-box">
      <summary>What each role can do</summary>
      <p className="hint">Till access adds “{PERMISSIONS[TILL]}” to one employee, at the stores their access covers.</p>
      <div className="table-wrap">
        <table className="matrix">
          <caption className="visually-hidden">Permissions by role</caption>
          <thead>
            <tr>
              <th scope="col">Permission</th>
              {STAFF_ROLES.map((r) => (
                <th scope="col" key={r}>
                  {ROLE_NAME[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {perms.map((p) => (
              <tr key={p}>
                <th scope="row">{PERMISSIONS[p]}</th>
                {STAFF_ROLES.map((r) => {
                  const yes = ROLE_PERMS[r].includes(p);
                  return (
                    <td key={r} className={yes ? "is-yes" : "is-no"}>
                      {yes ? <Icon name="check" /> : <span aria-hidden="true">–</span>}
                      <span className="visually-hidden">{yes ? "Yes" : "No"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function AccessPanel({ item }: { item: string | null }) {
  const d = useData();
  const s = useSession();
  const { confirm, prompt } = useConfirm();
  const [now] = useState(() => Date.now());
  const [editing, setEditing] = useState<string | null>(null);
  const [seq, setSeq] = useState(0);
  // The drawer keeps its grant while it slides out.
  const [shown, setShown] = useState<string | null>(null);
  if (editing && editing !== shown) setShown(editing);

  useEffect(() => {
    if (!item) return;
    const el = document.getElementById("person-" + item);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    el.focus({ preventScroll: true });
  }, [item]);

  const grants = d.grants || [];
  const people = Array.from(new Set(grants.map((g) => g.userId)))
    .map((id) => ({ id, name: personName(d, id), emp: byId(d.employees, id), list: grants.filter((g) => g.userId === id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const editGrant = shown ? byId(d.grants, shown) : null;

  async function revoke(g: Grant) {
    const who = personName(d, g.userId);
    const reason = await prompt({
      title: "Revoke " + who + "’s " + ROLE_NAME[g.role] + " access?",
      body: "It stops working on their next click, in every tab they have open. The grant stays on record, so it can be restored.",
      label: "Reason (goes in the audit log)",
      placeholder: "For example: cover ended, or moved to another store",
      okLabel: "Revoke access",
    });
    if (reason === null) return;
    if (!reason) return toast("Give a reason for revoking. It goes in the audit log.", "bad");
    const r = attempt(s, "access.revoke", who, () => revokeGrant(s, g.id, reason));
    if (!r.ok) return toast(r.message, "bad");
    toast(who + "’s " + ROLE_NAME[g.role] + " access is revoked.", "ok");
  }

  async function restore(g: Grant) {
    const who = personName(d, g.userId);
    const expired = !!g.expires && new Date(g.expires).getTime() <= Date.now();
    const ok = await confirm({
      title: "Restore " + who + "’s " + ROLE_NAME[g.role] + " access?",
      body: grantLine(d, g) + "." + (expired ? " Its end date has passed, so it signs nobody in until you give it a later end date." : " It works from their next click."),
      okLabel: "Restore access",
    });
    if (!ok) return;
    const r = attempt(s, "access.restore", who, () => restoreGrant(s, g.id));
    if (!r.ok) return toast(r.message, "bad");
    toast(who + "’s " + ROLE_NAME[g.role] + " access is restored.", "ok");
  }

  return (
    <div className="section-stack">
      <div className="alert alert-info">
        <p>
          A change takes effect on that person’s next click, in every tab they have open: revoked or expired access signs them out of that role. Nothing here deletes a grant; a revoked one stays on record and can be
          restored. Nobody can change their own owner’s office access, and the last live owner’s office access cannot be revoked or limited.
        </p>
      </div>

      <section className="panel" aria-labelledby="people-h">
        <div className="panel-head">
          <h2 id="people-h">Who has access</h2>
          <span className="small muted">{people.length + " people"}</span>
        </div>
        <div className="panel-body flush" data-tour="access-table">
          <ul className="people">
            {people.map((p) => (
              <li key={p.id} id={"person-" + p.id} tabIndex={-1} className={"person" + (item === p.id ? " is-current" : "")} aria-labelledby={"person-" + p.id + "-h"}>
                <div className="person-head">
                  <h3 id={"person-" + p.id + "-h"}>{p.name}</h3>
                  {p.emp ? <span className="meta">{p.emp.role + " · " + branchName(d, p.emp.branchId)}</span> : null}
                </div>
                <ul className="grant-list">
                  {p.list.map((g) => {
                    const block = lockoutBlock(d, s, g, "revoke");
                    const reason = g.revokedAt ? revokeReason(d, g) : "";
                    return (
                      <li key={g.id} className="grant">
                        <div className="grow">
                          <div className="grant-line">
                            <strong>{grantLine(d, g)}</strong>
                            <GrantBadge g={g} now={now} />
                          </div>
                          {hasTill(g) ? <p className="row-line">Can record shoppers’ codes at the till.</p> : null}
                          <div className="meta">
                            {"Given by " + personName(d, g.grantedBy) + " on " + dayTT(g.grantedAt)}
                            {g.revokedAt ? "; revoked by " + personName(d, g.revokedBy) + " on " + dayTT(g.revokedAt) + (reason ? ". Reason: " + reason : "") : ""}
                          </div>
                          {!g.revokedAt && block ? <p className="block-note">{block}</p> : null}
                        </div>
                        <div className="row-actions">
                          {g.revokedAt ? (
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => restore(g)}>
                              Restore<span className="visually-hidden">{" " + p.name + "’s " + ROLE_NAME[g.role] + " access"}</span>
                            </button>
                          ) : (
                            <>
                              <button className="btn btn-ghost btn-sm" type="button" onClick={() => {
                                  setEditing(g.id);
                                  setSeq((n) => n + 1);
                                }}>
                                Change<span className="visually-hidden">{" " + p.name + "’s " + ROLE_NAME[g.role] + " access"}</span>
                              </button>
                              {block ? null : (
                                <button className="btn btn-ghost btn-sm" type="button" onClick={() => revoke(g)}>
                                  Revoke<span className="visually-hidden">{" " + p.name + "’s " + ROLE_NAME[g.role] + " access"}</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AddGrant />
      <Matrix />

      <SideSheet
        open={!!editing && !!editGrant}
        onClose={() => setEditing(null)}
        title={editGrant ? "Change " + personName(d, editGrant.userId) + "’s access" : "Change access"}
        sub={editGrant ? grantLine(d, editGrant) : undefined}
        finalFocus={() => (shown && document.getElementById("person-" + (byId(d.grants, shown)?.userId || ""))) || false}
      >
        {editGrant ? <GrantEditor key={editGrant.id + ":" + seq} g={editGrant} onDone={() => setEditing(null)} /> : null}
      </SideSheet>
    </div>
  );
}
