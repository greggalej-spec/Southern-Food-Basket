"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/icon";

/* Search for the staff console: a small box in the top bar with its shortcut written on it, and a list that opens
   on a click or on Ctrl K (Cmd K on a Mac). Type a few letters, move with the arrow keys, Enter opens the section.
   It lists exactly what the person's menu lists, so it never offers a screen they cannot use. */

export type PaletteItem = { id: string; label: string; href: string; icon: IconName; group: string | null };

export function CommandPalette({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      input.current?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  const needle = q.trim().toLowerCase();
  const list = items.filter((i) => !needle || (i.label + " " + (i.group || "")).toLowerCase().includes(needle));
  const pick = Math.min(at, Math.max(0, list.length - 1));
  const shut = () => {
    setOpen(false);
    setQ("");
    setAt(0);
  };
  // a plain address change, as the menu's own links make: the console listens for the #tab
  const go = (i: PaletteItem) => {
    shut();
    location.assign(i.href);
  };

  return (
    <>
      <button type="button" className="cmdk-btn" onClick={() => setOpen(true)} aria-label="Search the console. Shortcut: Control K">
        <Icon name="search" />
        <span>Search</span>
        <kbd>Ctrl K</kbd>
      </button>
      <dialog
        ref={dlg}
        className="cmdk"
        aria-label="Go to a section"
        onClose={shut}
        onClick={(e) => {
          if (e.target === dlg.current) shut();
        }}
      >
        <div className="cmdk-box">
          <label className="cmdk-field">
            <Icon name="search" />
            <span className="visually-hidden">Go to a section</span>
            <input
              ref={input}
              type="text"
              value={q}
              placeholder="Go to a section…"
              autoComplete="off"
              aria-controls="cmdk-list"
              onChange={(e) => {
                setQ(e.target.value);
                setAt(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setAt(Math.max(0, Math.min(list.length - 1, pick + (e.key === "ArrowDown" ? 1 : -1))));
                } else if (e.key === "Enter" && list[pick]) {
                  e.preventDefault();
                  go(list[pick]);
                }
              }}
            />
          </label>
          {list.length ? (
            <ul id="cmdk-list" role="listbox" aria-label="Sections">
              {list.map((i, k) => (
                <li key={i.id + i.href} role="option" aria-selected={k === pick}>
                  <button type="button" className={k === pick ? "is-at" : undefined} onClick={() => go(i)} onPointerEnter={() => setAt(k)} tabIndex={-1}>
                    <Icon name={i.icon} />
                    <span>{i.label}</span>
                    {i.group ? <small>{i.group}</small> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="cmdk-none">Nothing matches “{q}”.</p>
          )}
          <p className="cmdk-hint">
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move <kbd>Enter</kbd> to open <kbd>Esc</kbd> to close
          </p>
        </div>
      </dialog>
    </>
  );
}
