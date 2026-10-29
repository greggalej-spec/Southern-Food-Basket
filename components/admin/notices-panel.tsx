"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useConfirm } from "@/components/confirm";
import { toast } from "@/components/ui/sonner";
import { scopeOf } from "@/lib/access";
import { attempt, inScope, scopeNote } from "@/lib/admin/guard";
import { NOTICE_FIELDS, branchName, checkNotice, cssEsc, describedBy, firstError, plural, todayIso, type Errors, type NoticeField, type NoticeValues } from "@/lib/admin/helpers";
import { postNotice, removeNotice } from "@/lib/admin/writes";
import { fmtDate } from "@/lib/format";
import { byId, load, useData, useSession } from "@/lib/store";

// The Staff notices tab from admin.js (section 4): the posted notices, newest first, and the form to post one for
// every store or for one store. Someone whose access covers some stores only posts for one of those, and removes
// only notices for their own stores; postNotice and removeNotice check the same thing again.

export function NoticesPanel() {
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [branchSel, setBranchSel] = useState("");
  const [date, setDate] = useState(() => todayIso());
  const [errors, setErrors] = useState<Errors<NoticeField>>({});
  const listRef = useRef<HTMLUListElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const scope = scopeOf(d, s);
  const branches = (d.branches || []).filter((b) => !scope || scope.includes(b.id));
  const branch = branches.some((b) => b.id === branchSel) ? branchSel : scope ? branches[0]?.id || "" : "";
  const list = (d.announcements || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  /* once a field has been marked invalid, re-check it as the user types */
  function change(name: keyof NoticeValues, value: string) {
    const next: NoticeValues = { title, body, branch, date, [name]: value };
    if (name === "title") setTitle(value);
    else if (name === "body") setBody(value);
    else if (name === "branch") setBranchSel(value);
    else setDate(value);
    if (name !== "branch" && errors[name]) {
      const e = checkNotice(next);
      setErrors((prev) => ({ ...prev, [name]: e[name] }));
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = checkNotice({ title, body, branch, date });
    flushSync(() => setErrors(errs));
    const first = firstError(NOTICE_FIELDS, errs);
    if (first) {
      document.getElementById("n-" + first)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    const rec = { branchId: branch || null, date, title: title.trim().replace(/\s+/g, " "), body: body.trim() };
    let refused = "";
    flushSync(() => {
      const r = attempt(s, "notices.post", rec.title, () => postNotice(s, rec));
      if (!r.ok) {
        refused = r.message;
        return;
      }
      setTitle("");
      setBody("");
      setDate(todayIso());
    });
    if (refused) {
      toast(refused, "bad");
      return;
    }
    toast("Posted. " + (rec.branchId ? "Staff at " + branchName(load(), rec.branchId) : "Staff at every store") + " see it on the employee portal home in this browser.", "ok");
    titleRef.current?.focus();
  }

  async function remove(id: string, btn: HTMLElement) {
    const a = byId(load().announcements, id);
    if (!a) return;
    const ok = await confirm({ title: "Remove this notice?", body: a.title + " comes off the employee portal home in this browser.", okLabel: "Remove notice", danger: true });
    if (!ok) {
      if (document.contains(btn)) btn.focus();
      return;
    }
    const items = Array.from(listRef.current?.querySelectorAll("li[data-id]") ?? []);
    const i = items.findIndex((li) => li.getAttribute("data-id") === id);
    const neighbour = items[i + 1] || items[i - 1];
    const nextId = neighbour ? neighbour.getAttribute("data-id") : null;
    let refused = "";
    flushSync(() => {
      const r = attempt(s, "notices.remove", a.title, () => removeNotice(s, id));
      if (!r.ok) refused = r.message;
    });
    if (refused) {
      toast(refused, "bad");
      if (document.contains(btn)) btn.focus();
      return;
    }
    toast("Removed. The notice is off the employee portal in this browser.", "ok");
    const next = nextId ? listRef.current?.querySelector<HTMLElement>('[data-remove-notice="' + cssEsc(nextId) + '"]') : null;
    (next || titleRef.current)?.focus();
  }

  return (
    <div className="two-col">
      <section className="panel" aria-labelledby="notice-list-h">
        <div className="panel-head">
          <h3 id="notice-list-h">Posted notices</h3>
          <span className="small muted" id="notice-count">
            {plural(list.length, "notice")}
          </span>
        </div>
        <div className="panel-body flush">
          <ul className="list" id="notice-list" ref={listRef}>
            {list.length ? (
              list.map((a) => (
                <li key={a.id} data-id={a.id}>
                  <div className="grow">
                    <strong>{a.title}</strong>
                    <div className="meta">{(a.branchId ? branchName(d, a.branchId) : "All stores") + " · " + fmtDate(a.date)}</div>
                    <p className="notice-body">{a.body}</p>
                  </div>
                  {inScope(d, s, a.branchId) ? (
                    <button className="btn btn-ghost btn-sm" type="button" data-remove-notice={a.id} onClick={(e) => remove(a.id, e.currentTarget)}>
                      Remove<span className="visually-hidden">{" notice: " + a.title}</span>
                    </button>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="empty-row">No notices yet. Post one with the form.</li>
            )}
          </ul>
        </div>
      </section>
      <section className="panel" aria-labelledby="notice-form-h">
        <div className="panel-head">
          <h3 id="notice-form-h">Post a notice</h3>
        </div>
        <div className="panel-body">
          <form id="notice-form" noValidate onSubmit={submit}>
            <div className="field">
              <label htmlFor="n-title">Title</label>
              <input
                type="text"
                id="n-title"
                name="title"
                maxLength={100}
                autoComplete="off"
                ref={titleRef}
                value={title}
                onChange={(e) => change("title", e.target.value)}
                aria-invalid={errors.title ? "true" : undefined}
                aria-describedby={describedBy(null, "n-title-err", errors.title)}
              />
              <p className="error-text" id="n-title-err" hidden={!errors.title}>
                {errors.title || ""}
              </p>
            </div>
            <div className="field">
              <label htmlFor="n-body">Message</label>
              <textarea
                id="n-body"
                name="body"
                maxLength={400}
                value={body}
                onChange={(e) => change("body", e.target.value)}
                aria-invalid={errors.body ? "true" : undefined}
                aria-describedby={describedBy("n-body-hint", "n-body-err", errors.body)}
              />
              <p className="hint" id="n-body-hint">
                <span id="n-body-count">{String(body.length)}</span> of 400 characters
              </p>
              <p className="error-text" id="n-body-err" hidden={!errors.body}>
                {errors.body || ""}
              </p>
            </div>
            <div className="field">
              <label htmlFor="n-branch">Who sees it</label>
              <select id="n-branch" name="branch" value={branch} onChange={(e) => change("branch", e.target.value)} aria-describedby={scope ? "n-branch-hint" : undefined}>
                {scope ? null : <option value="">All stores</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name + " only"}
                  </option>
                ))}
              </select>
              {scope ? (
                <p className="hint" id="n-branch-hint">
                  {scopeNote(d, s) + " A notice for every store comes from someone with every store."}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="n-date">Date</label>
              <input
                type="date"
                id="n-date"
                name="date"
                value={date}
                onChange={(e) => change("date", e.target.value)}
                aria-invalid={errors.date ? "true" : undefined}
                aria-describedby={describedBy(null, "n-date-err", errors.date)}
              />
              <p className="error-text" id="n-date-err" hidden={!errors.date}>
                {errors.date || ""}
              </p>
            </div>
            <button className="btn btn-primary" type="submit">
              Post notice
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
