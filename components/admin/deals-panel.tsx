"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Seg, act } from "@/components/admin/bits";
import { BulkDeals } from "@/components/admin/bulk-deals";
import { DealDrawer } from "@/components/admin/deal-drawer";
import { useConfirm } from "@/components/confirm";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/sonner";
import { attempt } from "@/lib/admin/guard";
import { cssEsc, dept, photoSrc, plural, retailDepts, shownDeals, todayIso } from "@/lib/admin/helpers";
import { DEAL_STATE, dealCounts, dealState, endDeal, endMonth, monthName, rerunDeal, type DealState } from "@/lib/ops/deals";
import { removeDeal } from "@/lib/admin/writes";
import { fmtDate, money } from "@/lib/format";
import { KEY, byId, load, useData, useSession } from "@/lib/store";

// The Specials tab from admin.js (section 1): filter and search the deals, add, edit and remove them, and the
// "saved" note that leads to the Specials page or the post maker.

type Saved = { id: string; name: string; dept: string };

export function DealsPanel({ onMakePost }: { onMakePost: (id: string) => void }) {
  const [bulk, setBulk] = useState(false);
  // Which specials the list shows: what is running now, what is scheduled, or the history of what has ended.
  const [view, setView] = useState<DealState | "all">("running");
  const [month, setMonth] = useState("all");
  const [today] = useState(() => todayIso());
  const d = useData();
  const s = useSession();
  const { confirm } = useConfirm();
  const [deptSel, setDeptSel] = useState("all");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  // The drawer keeps its last request after closing, so the content stays put while it slides out.
  const [drawer, setDrawer] = useState<{ seq: number; id: string | null } | null>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const restore = useRef(true);
  const rowsRef = useRef<HTMLTableSectionElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  const depts = retailDepts(d);
  const all = d.specials || [];
  const deptId = depts.some((x) => x.id === deptSel) ? deptSel : "all";
  const counts = dealCounts(d, today);
  const matched = shownDeals(d, deptId, query);
  const inView = matched.filter((sp) => view === "all" || dealState(sp, today) === view);
  // The history's months, newest first, each with how many specials ended in it.
  const months = Array.from(new Set(matched.filter((sp) => dealState(sp, today) === "ended").map(endMonth))).sort().reverse();
  const monthOn = view === "ended" && months.includes(month) ? month : "all";
  const shown = (monthOn === "all" ? inView : inView.filter((sp) => endMonth(sp) === monthOn)).slice().sort((a, b) => (view === "ended" ? endMonth(b).localeCompare(endMonth(a)) || (b.to || "").localeCompare(a.to || "") : 0));

  function openDealDrawer(id: string | null, from: HTMLElement | null) {
    if (id && !byId(load().specials, id)) {
      toast("That deal is no longer in the list.", "bad");
      return;
    }
    lastFocus.current = from || (document.activeElement as HTMLElement | null);
    restore.current = true;
    openRef.current = true;
    setDrawer({ seq: (drawer?.seq ?? 0) + 1, id });
    setOpen(true);
  }
  function closeDrawer(restoreFocus = true) {
    if (!openRef.current) return;
    openRef.current = false;
    restore.current = restoreFocus;
    setOpen(false);
  }
  // Base UI calls this once the drawer has slid out.
  function returnFocus() {
    if (!restore.current) return false as const;
    let back = lastFocus.current;
    if (drawer?.id && (!back || !document.contains(back))) back = rowsRef.current?.querySelector<HTMLElement>('[data-edit="' + cssEsc(drawer.id) + '"]') ?? null;
    return back && document.contains(back) ? back : (false as const);
  }

  // A tab change, or another tab of this site changing the data, closes the drawer without moving focus.
  useEffect(() => {
    const close = () => {
      if (!openRef.current) return;
      openRef.current = false;
      restore.current = false;
      setOpen(false);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) close();
    };
    window.addEventListener("hashchange", close);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", close);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  async function remove(id: string, opener: HTMLElement | null) {
    const sp = byId(load().specials, id);
    if (!sp) return;
    const ok = await confirm({ title: "Remove this deal?", body: sp.name + " comes off the Specials page and the home page in this browser.", okLabel: "Remove deal", danger: true });
    if (!ok) {
      if (opener && document.contains(opener)) opener.focus();
      return;
    }
    const rows = Array.from(rowsRef.current?.querySelectorAll("tr[data-id]") ?? []);
    const i = rows.findIndex((r) => r.getAttribute("data-id") === id);
    const neighbour = rows[i + 1] || rows[i - 1];
    const nextId = neighbour ? neighbour.getAttribute("data-id") : null;
    let refused = "";
    flushSync(() => {
      const r = attempt(s, "specials.remove", sp.name, () => removeDeal(s, id));
      if (!r.ok) refused = r.message;
      closeDrawer(false);
      if (r.ok) setSaved(null);
    });
    if (refused) {
      toast(refused, "bad");
      if (opener && document.contains(opener)) opener.focus();
      return;
    }
    toast("Removed. " + sp.name + " is off the Specials page in this browser.", "ok");
    const target = nextId ? rowsRef.current?.querySelector<HTMLElement>('[data-edit="' + cssEsc(nextId) + '"]') : null;
    (target || addRef.current)?.focus();
  }

  function onSaved(savedId: string) {
    const after = load(), sp = byId(after.specials, savedId);
    flushSync(() => {
      closeDrawer(false);
      /* make sure the saved row is visible before focusing it */
      if (!shownDeals(after, deptId, query).some((x) => x.id === savedId)) {
        setDeptSel("all");
        setQuery("");
      }
      setSaved(sp ? { id: sp.id, name: sp.name, dept: sp.dept } : null);
    });
    toast("Saved. It is live on the Specials page in this browser.", "ok");
    rowsRef.current?.querySelector<HTMLElement>('[data-edit="' + cssEsc(savedId) + '"]')?.focus();
  }

  function showAll() {
    flushSync(() => {
      setDeptSel("all");
      setQuery("");
    });
    rowsRef.current?.querySelector<HTMLElement>("[data-edit]")?.focus();
  }

  return (
    <>
      <div id="deal-saved">
        {saved ? (
          <div className="alert alert-ok">
            <Icon name="check" />
            <p>
              <strong>{saved.name}</strong>
              {" is saved and live on the Specials page in this browser. "}
              <a href={"/specials?" + new URLSearchParams({ dept: saved.dept }).toString()} target="_blank" rel="noopener">
                Open the Specials page<span className="visually-hidden"> (opens in a new tab)</span>
              </a>
              {" · "}
              <button className="link-btn" type="button" data-make-post={saved.id} onClick={() => onMakePost(saved.id)}>
                Make an Instagram post of it
              </button>
            </p>
          </div>
        ) : null}
      </div>
      <div className="toolbar deal-views">
        <Seg
          label="Show"
          value={view}
          onChange={setView}
          options={[
            { id: "running", label: "Running", count: counts.running },
            { id: "soon", label: "Scheduled", count: counts.soon },
            { id: "ended", label: "History", count: counts.ended },
            { id: "all", label: "All" },
          ]}
        />
        {view === "ended" && months.length ? (
          <div>
            <label className="visually-hidden" htmlFor="deal-month">
              Month it ended
            </label>
            <select id="deal-month" value={monthOn} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">Every month</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthName(m) + " (" + matched.filter((sp) => dealState(sp, today) === "ended" && endMonth(sp) === m).length + ")"}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div className="toolbar">
        <div>
          <label className="visually-hidden" htmlFor="deal-dept">
            Filter by department
          </label>
          <select id="deal-dept" value={deptId} onChange={(e) => setDeptSel(e.target.value)}>
            <option value="all">{"All departments (" + all.length + ")"}</option>
            {depts.map((x) => (
              <option key={x.id} value={x.id}>
                {x.short + " (" + all.filter((sp) => sp.dept === x.id).length + ")"}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-search">
          <label className="visually-hidden" htmlFor="deal-search">
            Search deals by name
          </label>
          <input type="search" id="deal-search" placeholder="Search by name" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="small muted toolbar-count" id="deal-count" aria-live="polite">
          {shown.length === all.length ? plural(all.length, "deal") : shown.length + " of " + plural(all.length, "deal")}
        </p>
        <button className="btn btn-outline" type="button" onClick={() => setBulk(true)}>
          Add many at once
        </button>
        <button className="btn btn-primary" type="button" id="deal-add" ref={addRef} onClick={(e) => openDealDrawer(null, e.currentTarget)}>
          Add a deal
        </button>
      </div>
      <div className="table-wrap">
        <table className="deals-table">
          <caption className="visually-hidden">Specials</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Photo</span>
              </th>
              <th scope="col">Deal</th>
              <th scope="col">Department</th>
              <th scope="col" className="num">
                Price
              </th>
              <th scope="col">Runs</th>
              <th scope="col">Tags</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody id="deal-rows" ref={rowsRef}>
            {shown.length ? (
              shown.map((sp, i) => {
                const st = dealState(sp, today);
                const head = view === "ended" && (i === 0 || endMonth(shown[i - 1]) !== endMonth(sp)) ? endMonth(sp) : null;
                return [
                  head ? (
                    <tr key={"m-" + head} className="month-row">
                      <th scope="colgroup" colSpan={7}>
                        {monthName(head)}
                        <span>{plural(shown.filter((x) => endMonth(x) === head).length, "special")}</span>
                      </th>
                    </tr>
                  ) : null,
                <tr key={sp.id} data-id={sp.id} className={"is-" + st}>
                  <td className="col-photo">
                    <img className="admin-thumb" src={photoSrc(sp.img)} alt="" width={64} height={64} loading="lazy" decoding="async" />
                  </td>
                  <td className="deal-cell-name">{sp.name}</td>
                  <td className="dept-cell">{dept(d, sp.dept).short}</td>
                  <td className="num price-cell">{money(sp.price)}</td>
                  <td className="posted-cell">
                    <span className={"badge " + DEAL_STATE[st].badge}>{DEAL_STATE[st].label}</span>
                    <span className="run-dates">{fmtDate(sp.posted, { year: false }) + (sp.to ? " to " + fmtDate(sp.to) : " · no end date")}</span>
                  </td>
                  <td className="tag-cell">
                    {sp.isNew ? <span className="badge badge-clay">New</span> : null}
                    {sp.couva ? <span className="badge badge-green">Couva</span> : null}
                  </td>
                  <td className="actions-cell">
                    <button className="btn btn-ghost btn-sm" type="button" data-edit={sp.id} onClick={(e) => openDealDrawer(sp.id, e.currentTarget)}>
                      Edit<span className="visually-hidden">{" " + sp.name}</span>
                    </button>
                    {st === "running" ? (
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => act(s, "specials.end", sp.name, () => endDeal(s, sp.id, today), "Today is its last day. It moves to the history tomorrow.")}>
                        End today<span className="visually-hidden">{" " + sp.name}</span>
                      </button>
                    ) : null}
                    {st === "ended" ? (
                      <button className="btn btn-ghost btn-sm" type="button" onClick={() => { if (act(s, "specials.rerun", sp.name, () => rerunDeal(s, sp.id, today), "Running again from today.")) setView("running"); }}>
                        Run again<span className="visually-hidden">{" " + sp.name}</span>
                      </button>
                    ) : null}
                    <button className="btn btn-ghost btn-sm" type="button" data-remove={sp.id} onClick={(e) => remove(sp.id, e.currentTarget)}>
                      Remove<span className="visually-hidden">{" " + sp.name}</span>
                    </button>
                  </td>
                </tr>,
                ];
              })
            ) : (
              <tr>
                <td className="empty-cell" colSpan={7}>
                  <p>{all.length ? (view === "soon" ? "Nothing is scheduled. Add a special with a start date ahead." : view === "ended" ? "Nothing in the history matches." : "No specials match. Clear the search, pick All departments, or choose All.") : "There are no deals yet. Add the first one."}</p>
                  {all.length ? (
                    <button className="btn btn-ghost btn-sm" type="button" data-show-all="" onClick={showAll}>
                      Show every deal
                    </button>
                  ) : null}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DealDrawer
        open={open}
        req={drawer}
        defaultDept={deptId}
        onClose={() => closeDrawer()}
        returnFocus={returnFocus}
        onSaved={onSaved}
        onRemove={(id, opener) => remove(id, opener)}
      />
      {bulk ? <BulkDeals onClose={() => setBulk(false)} /> : null}
    </>
  );
}
