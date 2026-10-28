"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MetaItem } from "@/components/careers/parts";
import { Icon } from "@/components/icon";
import { branchName } from "@/lib/careers/helpers";
import { fmtDate } from "@/lib/format";
import { jobs, useData } from "@/lib/store";

// Ported from careers.js renderIndex (careers/index.html): the "why work here" cards, the branch and department
// filters kept in ?branch=&dept= with history.replaceState, and the open roles. The filters are read from
// location.search after hydration, so the prerendered page lists every open role and narrows once it is live.

export function WhyCards() {
  const d = useData();
  return (
    <div className="grid" id="why-grid" style={{ "--min": "240px" } as React.CSSProperties}>
      {(d.content.careersWhy || []).map((w) => (
        <article className="card" key={w.title}>
          <h3>{w.title}</h3>
          <p style={{ margin: 0 }}>{w.text}</p>
        </article>
      ))}
    </div>
  );
}

const searchListeners = new Set<() => void>();
function subscribeSearch(cb: () => void) {
  searchListeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    searchListeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}
const getSearch = () => location.search;
const getServerSearch = () => "";

export function RolesBoard() {
  const d = useData();
  const search = useSyncExternalStore(subscribeSearch, getSearch, getServerSearch);
  const params = new URLSearchParams(search);
  const b0 = params.get("branch"),
    d0 = params.get("dept");
  const branchId = b0 && d.branches.some((b) => b.id === b0) ? b0 : "all";
  const dept = d0 && (d.jobDepts || []).includes(d0) ? d0 : "all";

  function apply(branch: string, department: string) {
    const p = new URLSearchParams();
    if (branch !== "all") p.set("branch", branch);
    if (department !== "all") p.set("dept", department);
    const q = p.toString();
    try {
      history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
    } catch {}
    searchListeners.forEach((l) => l());
  }

  const list = jobs(d, { status: "open", branchId, dept })
    .slice()
    .sort((a, b) => (b.posted || "").localeCompare(a.posted || ""));

  return (
    <>
      <form
        className="roles-toolbar"
        id="roles-filter"
        aria-label="Filter roles"
        onSubmit={(e) => {
          e.preventDefault();
          apply(branchId, dept);
        }}
      >
        <div className="field">
          <label htmlFor="f-branch">Branch</label>
          <select id="f-branch" name="branch" value={branchId} onChange={(e) => apply(e.target.value, dept)}>
            <option value="all">All branches</option>
            {d.branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-dept">Department</label>
          <select id="f-dept" name="dept" value={dept} onChange={(e) => apply(branchId, e.target.value)}>
            <option value="all">All departments</option>
            {(d.jobDepts || []).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>
        <p className="roles-count" id="roles-count" aria-live="polite">
          {list.length === 0 ? "No open roles match these filters." : list.length + (list.length === 1 ? " open role" : " open roles")}
        </p>
      </form>
      <div className="role-list" id="role-list">
        {list.length === 0 ? (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            <p>No open roles match these filters. Try another branch or department, or check back next week.</p>
            <button className="btn btn-ghost btn-sm" type="button" id="clear-filters" onClick={() => apply("all", "all")}>
              Show all roles
            </button>
          </div>
        ) : (
          list.map((j) => {
            const branch = branchName(d, j.branchId);
            return (
              <article className="card job-card" key={j.id}>
                <div>
                  <p className="eyebrow bare">{j.dept}</p>
                  <h3>{j.title}</h3>
                </div>
                <ul className="role-meta">
                  <MetaItem icon="pin" text={branch} />
                  <MetaItem icon="briefcase" text={j.type} />
                  <MetaItem icon="clock" text={j.shift} />
                </ul>
                <div className="role-foot">
                  <span className="role-pay-note">Pay discussed at interview</span>
                  <Link className="btn btn-outline btn-sm" href={"/careers/" + encodeURIComponent(j.id)} aria-label={"View role: " + j.title + ", " + branch}>
                    {"View role "}
                    <Icon name="arrow" />
                  </Link>
                </div>
                <p className="role-posted">{"Posted " + fmtDate(j.posted)}</p>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
