"use client";

import "@/styles/public-extras.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FB_KIND, FB_KINDS, submitFeedback, type FeedbackForm } from "@/lib/ops/feedback";
import { useData, useHydrated } from "@/lib/store";
import type { FeedbackKind } from "@/lib/types";

/* The feedback button: bottom right on every public page. It opens a short form (what kind of message, which
   store, the message, and how to reach the customer if they want an answer) and files a ticket for customer
   service (lib/ops/feedback.ts, /admin#feedback). Staff screens do not show it. It is self-contained (its own
   styles in styles/public-extras.css) because the home page is a separate document without the site's dialogs. */

const STAFF = /^\/(admin|hr|portal|outbox|tour|how-it-works)(\/|$)|^\/careers\/me/;
const EMPTY: FeedbackForm = { kind: "compliment", branchId: null, message: "", name: "", contact: "", wantsReply: false };

export function FeedbackButton() {
  const d = useData();
  const hydrated = useHydrated();
  const path = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<FeedbackForm>(EMPTY);
  const [err, setErr] = useState("");
  const [ref, setRef] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("input, textarea, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!hydrated || STAFF.test(path)) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.message.trim().length < 5) return setErr("Tell us a little more, so we can act on it.");
    if (v.wantsReply && !v.contact.trim()) return setErr("Add a phone number or an e-mail address so we can reply.");
    setErr("");
    setRef(submitFeedback({ ...v, message: v.message.trim(), name: v.name.trim(), contact: v.contact.trim() }));
    setV(EMPTY);
  }

  return (
    <div className={"fb" + (open ? " is-open" : "")}>
      {open ? (
        <div className="fb-panel" ref={panel} role="dialog" aria-label="Send us feedback">
          <div className="fb-head">
            <strong>{ref ? "Thank you" : "Tell us how we did"}</strong>
            <button type="button" className="fb-x" aria-label="Close" onClick={() => { setOpen(false); setRef(""); btn.current?.focus(); }}>
              ×
            </button>
          </div>
          {ref ? (
            <div className="fb-done" role="status">
              <span className="fb-tick" aria-hidden="true" />
              <p>
                Your message is with our customer service team. Reference <b>{ref}</b>.
              </p>
              <button type="button" className="fb-send" onClick={() => setRef("")}>
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="fb-kinds" role="radiogroup" aria-label="What kind of message">
                {FB_KINDS.map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={v.kind === k} className={"fb-kind fb-" + k} onClick={() => setV({ ...v, kind: k as FeedbackKind, wantsReply: k === "complaint" || k === "question" ? true : v.wantsReply })}>
                    {FB_KIND[k].label}
                  </button>
                ))}
              </div>
              <p className="fb-hint">{FB_KIND[v.kind].hint}</p>
              <label>
                <span>Your message</span>
                <textarea rows={4} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} maxLength={1200} />
              </label>
              <label>
                <span>Which store</span>
                <select value={v.branchId || ""} onChange={(e) => setV({ ...v, branchId: e.target.value || null })}>
                  <option value="">Not about one store</option>
                  {d.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="fb-two">
                <label>
                  <span>Your name</span>
                  <input type="text" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoComplete="name" />
                </label>
                <label>
                  <span>Phone or e-mail</span>
                  <input type="text" value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} />
                </label>
              </div>
              <label className="fb-check">
                <input type="checkbox" checked={v.wantsReply} onChange={(e) => setV({ ...v, wantsReply: e.target.checked })} />
                <span>I would like a reply</span>
              </label>
              {err ? (
                <p className="fb-err" role="alert">
                  {err}
                </p>
              ) : null}
              <button type="submit" className="fb-send">
                Send to customer service
              </button>
            </form>
          )}
        </div>
      ) : null}
      <button ref={btn} type="button" className="fb-btn" aria-expanded={open} onClick={() => setOpen(!open)} data-tour="feedback-button">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>Feedback</span>
      </button>
    </div>
  );
}
