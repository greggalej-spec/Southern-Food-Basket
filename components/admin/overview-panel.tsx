"use client";

import { useState } from "react";
import { Change, Seg, Stat } from "@/components/admin/bits";
import { PLATFORM_COLOR, TrendChart, compact } from "@/components/admin/chart";
import { Icon, type IconName } from "@/components/icon";
import { Ring, Spark } from "@/components/viz";
import { actorOf, detailOf, eventSentence } from "@/lib/admin/audit-text";
import { branchName, dollars, plural, type AdminTab } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { BULK_STAGE, bulkCost, bulkTotal, bulkWaiting } from "@/lib/ops/office";
import { KIND, requestCounts } from "@/lib/ops/requests";
import { SEASONS, activeSeason, seasonState } from "@/lib/ops/site";
import { PLATFORM, change, compare, series, topPosts, weeks } from "@/lib/ops/social";
import { selloutState, sheetGaps, sheetsIn } from "@/lib/ops/specials";
import { promoState } from "@/lib/promo";
import { fmtDate } from "@/lib/format";
import { currentEmployee, useData, useSession } from "@/lib/store";
import type { Seed } from "@/lib/types";

/* The owner's overview: every department on one page. It leads with the decisions only the owner can make, then a
   tile for each department with its two or three live figures, then the five stores side by side, then what
   changed most recently. Every tile opens the section behind it. Staff files stay with HR: this page shows head
   counts, never a person's record. */

type Decision = { key: string; area: string; title: string; text: string; href: string; cta: string };

function decisions(d: Seed, now: number): Decision[] {
  const out: Decision[] = [];
  (d.requests || [])
    .filter((r) => r.status === "with-owner")
    .forEach((r) => out.push({ key: r.id, area: KIND[r.kind].label + " request", title: r.org, text: r.ask, href: "#requests/" + r.id, cta: "Decide" }));
  (d.promotions || [])
    .filter((p) => promoState(d, p, new Date(now)) === "review")
    .forEach((p) => out.push({ key: p.id, area: "Offer to approve", title: p.title, text: p.benefit, href: "#promos/" + p.id, cta: "Review" }));
  (d.bulkOrders || [])
    .filter((o) => o.status === "collecting" && !bulkWaiting(o).length)
    .forEach((o) => out.push({ key: o.id, area: "Bulk order ready", title: o.item, text: "Every store has answered: " + bulkTotal(o) + " in all, " + dollars(bulkCost(o)), href: "#bulk", cta: "Place it" }));
  return out;
}

function greeting(now: number) {
  const h = new Date(now - 4 * 3600000).getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Tile({ icon, title, tab, children, foot, stacked }: { icon: IconName; title: string; tab: AdminTab; children: React.ReactNode; foot: string; stacked?: boolean }) {
  return (
    <a className="dept-tile" href={"#" + tab}>
      <header>
        <span className="dept-icon">
          <Icon name={icon} />
        </span>
        <h3>{title}</h3>
      </header>
      <div className={"dept-body" + (stacked ? " is-stacked" : "")}>{children}</div>
      <p className="dept-foot">
        {foot} <Icon name="arrow" />
      </p>
    </a>
  );
}

function Fig({ n, label }: { n: React.ReactNode; label: string }) {
  return (
    <p className="fig">
      <strong className="num">{n}</strong>
      <span>{label}</span>
    </p>
  );
}

export function OverviewPanel() {
  const d = useData();
  const s = useSession();
  const me = currentEmployee(d, s);
  const [now] = useState(() => Date.now());
  const [span, setSpan] = useState<"4" | "8" | "12">("12");
  const need = decisions(d, now);

  /* administration */
  const book = (d.specialsBooks || []).filter((b) => b.status === "open").sort((a, b) => sheetsIn(d, b.id).length - sheetsIn(d, a.id).length)[0];
  const sheets = book ? sheetsIn(d, book.id) : [];
  const checked = sheets.filter((x) => x.status === "checked").length;
  const gaps = (d.supplierSheets || []).filter((x) => (d.specialsBooks || []).some((b) => b.id === x.bookId && b.status === "open")).reduce((n, x) => n + sheetGaps(x), 0);
  const owed = (d.specialsBooks || []).filter((b) => b.status === "open").reduce((n, b) => n + selloutState(d, b.id).filter((r) => r.state === "owed").length, 0);
  const rq = requestCounts(d);
  const openBulk = (d.bulkOrders || []).filter((o) => o.status !== "shared");
  const collecting = openBulk.filter((o) => o.status === "collecting");
  const asked = collecting.reduce((n, o) => n + o.allocations.length, 0);
  const answered = asked - collecting.reduce((n, o) => n + bulkWaiting(o).length, 0);

  /* marketing */
  const cmp = compare(d, 4);
  const all = weeks(d).slice(-12);
  const reach = all.map((w) => (d.socialWeeks || []).filter((r) => r.week === w && r.platform !== "website").reduce((n, r) => n + r.reach, 0));
  const best = topPosts(d, { platform: "all", kind: "all", sort: "views", since: cmp.from })[0];

  /* HR: counts only */
  const staff = d.employees || [];
  const openJobs = d.jobs.filter((j) => j.status === "open").length;
  const active = d.applicants.filter((a) => !["hired", "not-selected", "withdrawn"].includes(a.stage)).length;
  const probation = staff.filter((e) => e.status === "probation").length;

  /* website */
  const wearing = activeSeason(d.site, now);
  const sState = seasonState(d.site, now);

  const audit = (d.audit || []).slice(0, 8);

  return (
    <div className="section-stack overview">
      <section className="hero" aria-labelledby="ov-hero-h" data-tour="overview-hero">
        <div>
          <p className="hero-date">{new Date(now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Port_of_Spain" })}</p>
          <h2 id="ov-hero-h">{greeting(now) + (me ? ", " + me.name.split(" ")[0] : "")}</h2>
          <p className="hero-line">{need.length ? plural(need.length, "decision is", "decisions are") + " waiting for you. Everything else is moving." : "Nothing is waiting for you. Everything is moving."}</p>
          <div className="hero-chips">
            <a className="hero-chip" href="#requests">
              <Icon name="gift" />
              Requests <b>{rq.open}</b>
            </a>
            <a className="hero-chip" href="#bulk">
              <Icon name="boxes" />
              Bulk orders <b>{openBulk.length}</b>
            </a>
            <a className="hero-chip" href="#suppliers">
              <Icon name="book" />
              Sheets to check <b>{sheets.length - checked}</b>
            </a>
            <a className="hero-chip" href="#audit">
              <Icon name="clock" />
              Activity log
            </a>
          </div>
        </div>
        <div className="hero-rings">
          <Ring value={checked} of={Math.max(sheets.length, 1)} label="Supplier sheets checked" tone="gold" size={128} />
          <Ring value={answered} of={Math.max(asked, 1)} label="Store answers in" tone="clay" size={128} />
          <Ring value={rq.approved + rq.done + rq.declined} of={Math.max((d.requests || []).length, 1)} label="Requests decided" tone="teal" size={128} />
        </div>
      </section>

      {need.length ? (
        <div className="decide-cards" data-tour="overview-decisions">
          {need.map((n) => (
            <a className="decide-card" key={n.key} href={n.href}>
              <p className="queue-area">{n.area}</p>
              <strong>{n.title}</strong>
              <span>{n.text}</span>
              <span className="decide-go">
                {n.cta} <Icon name="arrow" />
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <div className="dept-grid" data-tour="overview-depts">
        <Tile icon="book" title="Administration" tab="suppliers" foot="Open supplier specials">
          <Ring value={checked} of={Math.max(sheets.length, 1)} label={book ? "Sheets checked, " + book.title : "Sheets checked"} />
          <div className="figs">
            <Fig n={gaps} label="case prices to add" />
            <Fig n={owed} label="sell-out reports owed" />
            <Fig n={rq.open} label="requests in hand" />
            <Fig n={openBulk.length} label="bulk orders under way" />
          </div>
        </Tile>

        <Tile icon="chart" title="Marketing" tab="analytics" foot="Open marketing figures" stacked>
          <div className="spark-box">
            <Spark points={reach} color={PLATFORM_COLOR.instagram} label="People reached each week, twelve weeks" />
            <p className="small muted">People reached, 12 weeks</p>
          </div>
          <div className="figs">
            <Fig n={compact(cmp.now.reach)} label="reached in 4 weeks" />
            <Fig n={cmp.now.followers.toLocaleString("en-US")} label="followers" />
            <p className="fig-note">
              <Change value={change(cmp.now.reach, cmp.before.reach)} />
            </p>
            {best ? <p className="fig-note">{"Top post: “" + best.title + "”"}</p> : null}
          </div>
        </Tile>

        <Tile icon="users" title="HR" tab="today" foot="Head counts only. Staff files stay with HR">
          <Ring value={staff.length - probation} of={Math.max(staff.length, 1)} label="Confirmed staff" tone="teal" />
          <div className="figs">
            <Fig n={staff.length} label="people at five stores" />
            <Fig n={openJobs} label="open roles" />
            <Fig n={active} label="applicants in progress" />
            <Fig n={probation} label="on probation" />
          </div>
        </Tile>

        <Tile icon="brush" title="Website" tab="studio" foot="Open the website studio">
          <div className={"season-chip season-" + wearing}>
            <strong>{wearing === "none" ? "Everyday look" : SEASONS[wearing].name + " look"}</strong>
            <span>{sState === "on" ? "live now" : sState === "waiting" ? "scheduled" : "no season on"}</span>
          </div>
          <div className="figs">
            <Fig n={(d.specials || []).length} label="specials on the site" />
            <Fig n={(d.promotions || []).filter((p) => promoState(d, p, new Date(now)) === "live").length} label="members’ offers live" />
            <Fig n={d.site.notice.on && d.site.notice.text ? "On" : "Off"} label="notice bar" />
            <Fig n={(d.subscribers || []).filter((x) => x.status === "active").length} label="e-mail subscribers" />
          </div>
        </Tile>
      </div>

      <div className="stats">
        <Stat icon="gift" tone="pink" label="Requests agreed" value={rq.agreedThisYear} sub={dollars(rq.valueThisYear) + " given this year"} />
        <Stat icon="boxes" label="On order in bulk" value={"$" + Math.round(openBulk.reduce((n, o) => n + bulkCost(o), 0)).toLocaleString("en-US")} sub={plural(openBulk.length, "order") + " not yet shared out"} />
        <Stat icon="users" label="People reached, 4 weeks" value={cmp.now.reach} spark={reach} sub={<Change value={change(cmp.now.reach, cmp.before.reach)} />} />
        <Stat icon="home" tone="pink" label="Website visitors, 4 weeks" value={cmp.now.visits} sub={<Change value={change(cmp.now.visits, cmp.before.visits)} />} />
      </div>

      <section className="panel" aria-labelledby="ov-trend-h">
        <div className="panel-head">
          <h2 id="ov-trend-h">Reach, week by week</h2>
          <Seg label="Zoom" value={span} onChange={setSpan} options={[{ id: "4", label: "4 weeks" }, { id: "8", label: "8 weeks" }, { id: "12", label: "12 weeks" }]} />
        </div>
        <div className="panel-body">
          <TrendChart lines={series(d, 12).map((l) => ({ id: l.platform, name: PLATFORM[l.platform].name, points: l.points }))} labels={all.map((w) => fmtDate(w, { year: false }))} span={Number(span)} title="People reached each week, by account" unit="people in the week" />
        </div>
      </section>

      <section className="panel" aria-labelledby="ov-stores-h">
        <div className="panel-head">
          <h2 id="ov-stores-h">The five stores</h2>
          <span className="small muted">Side by side</span>
        </div>
        <div className="table-wrap flat">
          <table className="stack-table stores-table" data-tour="overview-stores">
            <caption className="visually-hidden">Each store: staff, open roles, requests and bulk orders</caption>
            <thead>
              <tr>
                <th scope="col">Store</th>
                <th scope="col" className="num">
                  Staff
                </th>
                <th scope="col" className="num">
                  Open roles
                </th>
                <th scope="col" className="num">
                  Requests this year
                </th>
                <th scope="col">Bulk orders under way</th>
              </tr>
            </thead>
            <tbody>
              {d.branches.map((b) => {
                const n = staff.filter((e) => e.branchId === b.id).length;
                const max = Math.max(1, ...d.branches.map((x) => staff.filter((e) => e.branchId === x.id).length));
                const waiting = openBulk.filter((o) => bulkWaiting(o).some((a) => a.branchId === b.id));
                return (
                  <tr key={b.id}>
                    <th scope="row">
                      <span className="cell-title">{b.name}</span>
                      <span className="meta">{b.short}</span>
                    </th>
                    <td className="num" data-label="Staff">
                      <span className="mini-bar has-tip" tabIndex={0} data-tip={n + " staff at " + b.name + "\n" + Math.round((n / max) * 100) + "% of the largest store"}>
                        <span style={{ width: (n / max) * 100 + "%" }} />
                      </span>
                      {n}
                    </td>
                    <td className="num" data-label="Open roles">
                      {d.jobs.filter((j) => j.status === "open" && j.branchId === b.id).length}
                    </td>
                    <td className="num" data-label="Requests this year">
                      {(d.requests || []).filter((r) => r.branchId === b.id).length}
                    </td>
                    <td data-label="Bulk orders under way">
                      {waiting.length ? (
                        <span className="store-wait">{"Still to answer: " + waiting.map((o) => o.item.split(",")[0]).join("; ")}</span>
                      ) : openBulk.length ? (
                        <span className="muted">{"All answered · " + openBulk.filter((o) => o.status !== "collecting").map((o) => BULK_STAGE[o.status].label.toLowerCase()).slice(0, 1).join("")}</span>
                      ) : (
                        <span className="is-blank">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" aria-labelledby="ov-log-h">
        <div className="panel-head">
          <h2 id="ov-log-h">What changed most recently</h2>
          <a className="btn btn-ghost btn-sm" href="#audit">
            Open the full log
          </a>
        </div>
        <ol className="list activity" data-tour="overview-activity">
          {audit.map((e) => (
            <li key={e.id} className={e.ok ? undefined : "is-refused"}>
              <span className="activity-dot" aria-hidden="true" />
              <div className="grow">
                <p className="activity-line">
                  <strong>{actorOf(d, e)}</strong> {eventSentence(e)} {detailOf(e)}
                </p>
                <time className="meta" dateTime={e.at}>
                  {whenTT(e.at)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <p className="small muted">{"Stores: " + d.branches.map((b) => branchName(d, b.id)).join(", ") + "."}</p>
    </div>
  );
}
