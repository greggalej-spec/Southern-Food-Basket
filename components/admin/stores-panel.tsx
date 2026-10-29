"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { can, scopeOf } from "@/lib/access";
import { attempt, scopeNote } from "@/lib/admin/guard";
import { STORE_FIELDS, checkStore, cssEsc, describedBy, firstError, type Errors, type StoreField, type StoreValues } from "@/lib/admin/helpers";
import { saveStore } from "@/lib/admin/writes";
import { mapsDir, mapsView, todayHours } from "@/lib/format";
import { KEY, useData, useSession } from "@/lib/store";
import type { Branch } from "@/lib/types";

// The Stores and hours tab from admin.js (section 3): each store's listing details, and a form for its hours and
// phone. Saving re-renders only that store, so unsaved edits in the other forms survive. Someone whose access covers
// some stores only sees the others read-only: can(stores.edit, { branchId }) decides, and saveStore checks it again.

function HoursField({
  fid,
  name,
  label,
  value,
  type,
  hint,
  error,
  onInput,
}: {
  fid: string;
  name: StoreField;
  label: string;
  value: string;
  type: "text" | "tel";
  hint: string;
  error?: string;
  onInput: (name: StoreField) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={fid}>{label}</label>
      <input
        type={type}
        id={fid}
        name={name}
        defaultValue={value}
        maxLength={type === "tel" ? 20 : 60}
        autoComplete="off"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy(hint ? fid + "-hint" : null, fid + "-err", error)}
        onChange={() => onInput(name)}
      />
      {hint ? (
        <p className="hint" id={fid + "-hint"}>
          {hint}
        </p>
      ) : null}
      <p className="error-text" id={fid + "-err"} hidden={!error}>
        {error || ""}
      </p>
    </div>
  );
}

function StorePanel({ b, editable, onSaved }: { b: Branch; editable: boolean; onSaved: (id: string, name: string) => void }) {
  const s = useSession();
  const rows = b.hours || [];
  const msLabel = (rows[0] && rows[0][0]) || "Mon – Sat", sunLabel = (rows[1] && rows[1][0]) || "Sunday";
  const ms = (rows[0] && rows[0][1]) || "", sun = (rows[1] && rows[1][1]) || "";
  const [now] = useState(() => new Date());
  const today = todayHours(b, now);
  const [errors, setErrors] = useState<Errors<StoreField>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fid = (key: string) => "st-" + b.id + "-" + key;

  function values(): StoreValues {
    const f = formRef.current?.elements;
    const val = (n: StoreField) => (f?.namedItem(n) as HTMLInputElement | null)?.value ?? "";
    return { ms: val("ms"), sun: val("sun"), phone: val("phone") };
  }
  /* once a field has been marked invalid, re-check it as the user types */
  function onInput(name: StoreField) {
    if (!errors[name]) return;
    const e = checkStore(values());
    setErrors((prev) => ({ ...prev, [name]: e[name] }));
  }
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = checkStore(values());
    flushSync(() => setErrors(errs));
    const first = firstError(STORE_FIELDS, errs);
    if (first) {
      (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      toast("Check the highlighted fields.", "bad");
      return;
    }
    const v = values(), norm = (s: string) => s.trim().replace(/\s+/g, " ");
    const r = attempt(s, "stores.edit", b.name, () => saveStore(s, b.id, norm(v.ms), norm(v.sun), norm(v.phone)));
    if (!r.ok) {
      toast(r.message, "bad");
      return;
    }
    const name = r.value;
    if (!name) {
      toast("That store is no longer listed. Reload the page.", "bad");
      return;
    }
    onSaved(b.id, name);
  }

  return (
    <section className="panel" data-store-panel={b.id} aria-labelledby={fid("h")}>
      <div className="panel-head">
        <h3 id={fid("h")}>{b.name}</h3>
        <span className="store-head-sub">{b.short || ""}</span>
      </div>
      <div className="panel-body">
        <div className="store-split">
          <div>
            <dl className="kv">
              <dt>Address</dt>
              <dd>{b.address || "Not recorded"}</dd>
              <dt>Phone</dt>
              <dd className="num">{b.phone || "Not recorded"}</dd>
              <dt>Plus code</dt>
              <dd>{b.plusCode || "Not recorded"}</dd>
              <dt>Open today</dt>
              <dd>{today || "Not recorded"}</dd>
            </dl>
            <div className="cluster store-links">
              <a className="btn btn-ghost btn-sm" href={mapsDir(b)} target="_blank" rel="noopener">
                <Icon name="pin" />
                Directions<span className="visually-hidden">{" to " + b.name + " (opens Google Maps in a new tab)"}</span>
              </a>
              <a className="btn btn-ghost btn-sm" href={mapsView(b)} target="_blank" rel="noopener">
                <Icon name="search" />
                View on Google Maps<span className="visually-hidden">{": " + b.name + " (opens in a new tab)"}</span>
              </a>
            </div>
            {b.source ? <p className="store-source">{"Source: " + b.source + "."}</p> : null}
          </div>
          {editable ? (
          <form className="store-form" data-branch={b.id} noValidate ref={formRef} onSubmit={submit}>
            <h4>Edit hours and phone</h4>
            <HoursField fid={fid("ms")} name="ms" label={msLabel + " hours"} value={ms} type="text" hint="For example “7:00 am – 10:00 pm”." error={errors.ms} onInput={onInput} />
            <HoursField
              fid={fid("sun")}
              name="sun"
              label={sunLabel + " hours"}
              value={sun}
              type="text"
              hint="Public holidays follow the Sunday hours on the Store locations page."
              error={errors.sun}
              onInput={onInput}
            />
            <HoursField fid={fid("phone")} name="phone" label="Phone" value={b.phone || ""} type="tel" hint="" error={errors.phone} onInput={onInput} />
            <button className="btn btn-primary" type="submit">
              {"Save " + b.name}
            </button>
          </form>
          ) : (
            <div className="store-form store-readonly">
              <h4>Hours and phone</h4>
              <dl className="kv">
                <dt>{msLabel}</dt>
                <dd>{ms || "Not recorded"}</dd>
                <dt>{sunLabel}</dt>
                <dd>{sun || "Not recorded"}</dd>
              </dl>
              <p className="hint">This store is outside your access, so you can read it but not change it. Ask the owner’s office if you look after it.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function StoresPanel() {
  const d = useData();
  const s = useSession();
  const branches = d.branches || [];
  const scope = scopeOf(d, s);
  // A store's form is rebuilt from the saved data after its own save (gen) or when another tab changes the data (all).
  const [gen, setGen] = useState<Record<string, number>>({});
  const [all, setAll] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) setAll((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function onSaved(id: string, name: string) {
    flushSync(() => setGen((g) => ({ ...g, [id]: (g[id] || 0) + 1 })));
    toast("Saved. " + name + " hours and phone are live on the Store locations page in this browser.", "ok");
    document.querySelector<HTMLElement>('form[data-branch="' + cssEsc(id) + '"] button[type="submit"]')?.focus();
  }

  return (
    <div className="store-stack" id="store-list">
      {scope ? <p className="scope-note">{scopeNote(d, s) + " Your stores come first; the others are read-only."}</p> : null}
      {branches.length ? (
        branches
          .map((b) => ({ b, editable: can(d, s, "stores.edit", { branchId: b.id }) }))
          .sort((x, y) => Number(y.editable) - Number(x.editable))
          .map(({ b, editable }) => <StorePanel key={b.id + ":" + all + ":" + (gen[b.id] || 0)} b={b} editable={editable} onSaved={onSaved} />)
      ) : (
        <div className="empty">
          <p>No stores are listed.</p>
        </div>
      )}
    </div>
  );
}
