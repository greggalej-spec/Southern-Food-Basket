"use client";

import { useState } from "react";
import { Change, Seg, Stat } from "@/components/admin/bits";
import { Bars, PLATFORM_COLOR, TrendChart, compact } from "@/components/admin/chart";
import { Icon } from "@/components/icon";
import { Flow } from "@/components/viz";
import { branchName } from "@/lib/admin/helpers";
import { fmtDate } from "@/lib/format";
import { PLATFORM, change, compare, connected, engagement, engagementRate, insights, series, topPosts, weeks, type PostSort } from "@/lib/ops/social";
import { promoStats } from "@/lib/promo";
import { useData } from "@/lib/store";
import type { Platform, Seed } from "@/lib/types";

/* Marketing figures. Built to be read by eye: four figure cards with their own small charts, one trend chart whose
   time frame zooms (4, 8 or 12 weeks), the three posts that did best as cards, then the full ranking. Everything
   is demo data until the accounts are connected (Social accounts), and one line at the top says so. */

const SPANS = [
  { id: "4", label: "4 weeks" },
  { id: "8", label: "8 weeks" },
  { id: "12", label: "12 weeks" },
] as const;

const SORTS: { id: PostSort; label: string; unit: string }[] = [
  { id: "views", label: "Most watched", unit: "views" },
  { id: "reach", label: "Most reached", unit: "reached" },
  { id: "engagement", label: "Most engagement", unit: "reactions" },
  { id: "rate", label: "Best rate", unit: "engaged" },
  { id: "clicks", label: "Most taps to site", unit: "taps" },
];

/** The last `n` weeks of one measure, summed across the connected social accounts (or the website alone). */
function weekly(d: Seed, n: number, pick: "reach" | "engagements" | "followers", site = false) {
  const on = connected(d);
  return weeks(d)
    .slice(-n)
    .map((w) => (d.socialWeeks || []).filter((r) => r.week === w && on.has(r.platform) && (site ? r.platform === "website" : r.platform !== "website")).reduce((t, r) => t + r[pick], 0));
}

export function AnalyticsPanel() {
  const d = useData();
  const [span, setSpan] = useState<"4" | "8" | "12">("8");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState<PostSort>("views");
  const n = Number(span);
  const cmp = compare(d, n);
  const on = connected(d);
  const lines = series(d, 12).map((l) => ({ id: l.platform, name: PLATFORM[l.platform].name, points: l.points }));
  const weekLabels = weeks(d).slice(-12).map((w) => fmtDate(w, { year: false }));
  const posts = topPosts(d, { platform, kind, sort, since: cmp.from });
  const said = insights(d, cmp.from);
  const pages = (d.sitePages || []).slice().sort((a, b) => b.views - a.views).slice(0, 6);
  const clicks = topPosts(d, { platform: "all", kind: "all", sort: "clicks", since: cmp.from }).reduce((t, p) => t + p.clicks, 0);
  const promos = (d.promotions || []).filter((p) => p.status === "approved").map((p) => promoStats(d, p));
  const claimed = promos.reduce((t, st) => t + st.claimed, 0);
  const used = promos.reduce((t, st) => t + Object.values(st.byBranch).reduce((a, b) => a + b, 0), 0);
  const off = (d.socialAccounts || []).filter((a) => !a.connected);
  const unit = SORTS.find((x) => x.id === sort)!.unit;
  const score = (p: (typeof posts)[number]) => (sort === "engagement" ? engagement(p) : sort === "rate" ? engagementRate(p) : sort === "views" ? p.views || p.reach : p[sort]);
  const top = Math.max(1, ...posts.map(score));
  const show = (v: number) => (sort === "rate" ? (v * 100).toFixed(1) + "%" : Math.round(v).toLocaleString("en-US"));

  return (
    <div className="section-stack">
      <Flow id="analytics" />

      <div className="toolbar">
        <Seg label="Time frame" value={span} onChange={setSpan} options={[...SPANS]} />
        <p className="small muted toolbar-count">{cmp.from ? fmtDate(cmp.from, { year: false }) + " to " + fmtDate(cmp.to) : ""}</p>
        <span className="grow" />
        <p className="demo-note" role="note">
          Demo figures until the accounts are connected
        </p>
      </div>

      <div className="stats" data-tour="analytics-stats">
        <Stat icon="users" label="People reached" value={cmp.now.reach} spark={weekly(d, 12, "reach")} sub={<Change value={change(cmp.now.reach, cmp.before.reach, cmp.complete)} />} />
        <Stat icon="star" tone="pink" label="Likes, comments, shares" value={cmp.now.engagements} spark={weekly(d, 12, "engagements")} sub={<Change value={change(cmp.now.engagements, cmp.before.engagements, cmp.complete)} />} />
        <Stat icon="user" label="Followers" value={cmp.now.followers} spark={weekly(d, 12, "followers")} sub={(cmp.now.followers - cmp.before.followers >= 0 ? "+" : "") + (cmp.now.followers - cmp.before.followers).toLocaleString("en-US") + " new"} />
        <Stat icon="home" tone="pink" label="Website visitors" value={cmp.now.visits} spark={weekly(d, 12, "reach", true)} sub={<Change value={change(cmp.now.visits, cmp.before.visits, cmp.complete)} />} />
      </div>

      <section className="panel" aria-labelledby="an-chart-h">
        <div className="panel-head">
          <h2 id="an-chart-h">People reached each week</h2>
          <Seg label="Zoom" value={span} onChange={setSpan} options={[...SPANS]} />
        </div>
        <div className="panel-body" data-tour="analytics-chart">
          <TrendChart lines={lines} labels={weekLabels} span={n} title="People reached each week, by account" unit="people in the week" />
          {off.length ? <p className="small muted chart-off">{"Not connected: " + off.map((a) => a.name).join(", ")}</p> : null}
        </div>
      </section>

      <section aria-labelledby="an-posts-h" data-tour="analytics-posts">
        <div className="toolbar posts-toolbar">
          <h2 id="an-posts-h" className="admin-h2">
            What worked
          </h2>
          <span className="grow" />
          <Seg label="Rank by" value={sort} onChange={setSort} options={SORTS.map((x) => ({ id: x.id, label: x.label }))} />
        </div>
        <div className="top-posts">
          {posts.slice(0, 3).map((p, i) => (
            <article className="top-post" key={p.id} style={{ "--c": PLATFORM_COLOR[p.platform] } as React.CSSProperties}>
              <span className="top-rank">{i + 1}</span>
              <h3>{p.title}</h3>
              <p className="top-num">
                {show(score(p))}
                <small>{unit}</small>
              </p>
              <span className="bar-cell has-tip" tabIndex={0} data-tip={show(score(p)) + " " + unit + "\n" + Math.round((score(p) / top) * 100) + "% of the best post"}>
                <span style={{ width: (score(p) / top) * 100 + "%" }} />
              </span>
              <p className="top-meta">
                <span>
                  <span className="chart-key" style={{ background: PLATFORM_COLOR[p.platform] }} />
                  {PLATFORM[p.platform].name}
                </span>
                <span>
                  <Icon name={p.kind === "Video" ? "camera" : "file"} />
                  {p.kind}
                </span>
                <span>{fmtDate(p.postedAt.slice(0, 10), { year: false })}</span>
                {p.branchId ? (
                  <span>
                    <Icon name="pin" />
                    {branchName(d, p.branchId)}
                  </span>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="panel" aria-labelledby="an-all-h">
          <div className="panel-head">
            <h2 id="an-all-h">Every post</h2>
            <div className="cluster">
              <div>
                <label className="visually-hidden" htmlFor="an-plat">
                  Account
                </label>
                <select id="an-plat" value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "all")}>
                  <option value="all">Every account</option>
                  {(["instagram", "tiktok", "facebook"] as const)
                    .filter((p) => on.has(p))
                    .map((p) => (
                      <option key={p} value={p}>
                        {PLATFORM[p].name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="visually-hidden" htmlFor="an-kind">
                  Kind of post
                </label>
                <select id="an-kind" value={kind} onChange={(e) => setKind(e.target.value)} data-tour="analytics-sort">
                  <option value="all">Videos and photos</option>
                  <option>Video</option>
                  <option>Photo</option>
                  <option>Carousel</option>
                </select>
              </div>
            </div>
          </div>
          <div className="table-wrap flat">
            <table className="stack-table posts-table">
              <caption className="visually-hidden">Posts in the period, ranked</caption>
              <thead>
                <tr>
                  <th scope="col">Post</th>
                  <th scope="col" className="num">
                    Views
                  </th>
                  <th scope="col" className="num">
                    Reached
                  </th>
                  <th scope="col" className="num">
                    Engaged
                  </th>
                  <th scope="col" className="num">
                    To site
                  </th>
                </tr>
              </thead>
              <tbody>
                {posts.length ? (
                  posts.map((p, i) => (
                    <tr key={p.id} style={{ "--c": PLATFORM_COLOR[p.platform] } as React.CSSProperties}>
                      <th scope="row">
                        <span className="cell-title">
                          <span className="rank num">{i + 1}</span>
                          {p.title}
                        </span>
                        <span className="meta">
                          <span className="chart-key" style={{ background: PLATFORM_COLOR[p.platform] }} />
                          {PLATFORM[p.platform].name + " · " + p.kind + " · " + fmtDate(p.postedAt.slice(0, 10), { year: false })}
                        </span>
                        <span className="bar-cell has-tip" tabIndex={0} data-tip={show(score(p)) + " " + unit + "\n" + Math.round((score(p) / top) * 100) + "% of the best post"}>
                          <span style={{ width: (score(p) / top) * 100 + "%" }} />
                        </span>
                      </th>
                      <td className="num" data-label="Views">
                        {p.views ? compact(p.views) : "—"}
                      </td>
                      <td className="num" data-label="Reached">
                        {compact(p.reach)}
                      </td>
                      <td className="num" data-label="Engaged">
                        {(engagementRate(p) * 100).toFixed(1) + "%"}
                      </td>
                      <td className="num" data-label="To site">
                        {p.clicks.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No posts match. Choose a longer time frame.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="section-stack">
          <section className="panel" aria-labelledby="an-till-h">
            <div className="panel-head">
              <h2 id="an-till-h">From screen to till</h2>
            </div>
            <div className="panel-body">
              <ol className="steps-funnel">
                {[
                  { icon: "users" as const, label: "Reached", value: cmp.now.reach },
                  { icon: "link" as const, label: "Taps to site", value: clicks },
                  { icon: "tag" as const, label: "Codes taken", value: claimed },
                  { icon: "check" as const, label: "Used at a till", value: used },
                ].map((st, i, all) => (
                  <li key={st.label} className="has-tip" tabIndex={0} data-tip={st.label + ": " + st.value.toLocaleString("en-US") + (i > 0 && all[0].value ? "\n" + ((st.value / all[0].value) * 100).toFixed(st.value / all[0].value < 0.1 ? 2 : 0) + "% of everyone reached" : "\nThe start of the path")}>
                    <span className="sf-icon">
                      <Icon name={st.icon} />
                    </span>
                    <strong className="num">{compact(st.value)}</strong>
                    <span>{st.label}</span>
                    {i > 0 && all[i - 1].value ? <em>{((st.value / all[i - 1].value) * 100).toFixed(st.value / all[i - 1].value < 0.1 ? 1 : 0) + "% of the step before"}</em> : null}
                  </li>
                ))}
              </ol>
            </div>
          </section>
          <section className="panel" aria-labelledby="an-pages-h">
            <div className="panel-head">
              <h2 id="an-pages-h">Pages people open</h2>
            </div>
            <div className="panel-body">
              <Bars rows={pages.map((p) => ({ label: p.title, value: p.views }))} />
            </div>
          </section>
          <section className="panel" aria-labelledby="an-say-h">
            <div className="panel-head">
              <h2 id="an-say-h">In plain words</h2>
            </div>
            <ul className="list say-list">
              {said.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
