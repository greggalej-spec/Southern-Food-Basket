"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icon";
import { activeGrant } from "@/lib/access";
import { grantLine } from "@/lib/admin/access-admin";
import { buildQueue, watching, type QueueItem } from "@/lib/admin/today";
import { currentEmployee, useData, useSession } from "@/lib/store";

// Today: a work queue, not a row of numbers. Each line is something this person can act on, given their access, with
// a link straight to it. It ends with what their access is.

const AREA_ICON: Record<string, IconName> = {
  Offers: "gift", Newsletter: "file", Requests: "gift", "Sell-out reports": "check", Specials: "tag", "Supplier specials": "book", Website: "brush",
  "Bulk orders": "boxes", Codes: "tag", "Customer feedback": "phone", "Audit log": "shield", "Staff access": "lock", "Your tasks": "tasks",
};
const RANK = { bad: 0, warn: 1, info: 2, ok: 3, plain: 4 } as const;

const href = (l: QueueItem["link"]) => "#" + l.tab + (l.item ? "/" + encodeURIComponent(l.item) : "");

export function TodayPanel() {
  const d = useData();
  const s = useSession();
  const [now] = useState(() => Date.now());
  const items = buildQueue(d, s, now);
  const g = activeGrant(d, s);
  const me = currentEmployee(d, s);
  const watch = watching(d, s);
  // One card for each area, the most pressing area first and the most pressing line first inside it.
  const byArea = new Map<string, QueueItem[]>();
  items.forEach((it) => byArea.set(it.area, [...(byArea.get(it.area) || []), it]));
  const rank = (t: string) => RANK[t as keyof typeof RANK] ?? 4;
  const groups = [...byArea.entries()].map(([area, list]) => [area, list.slice().sort((x, y) => rank(x.tone) - rank(y.tone))] as const).sort((x, y) => rank(x[1][0].tone) - rank(y[1][0].tone) || y[1].length - x[1].length);
  const urgent = items.filter((it) => it.tone === "warn" || it.tone === "bad").length;

  return (
    <div className="today" data-tour="admin-today">
      {items.length ? (
        <>
          <div className="today-sum" aria-label="Summary">
            <p>
              <b>{items.length}</b>
              {items.length === 1 ? "thing needs you" : "things need you"}
            </p>
            <p className="is-act">
              <b>{urgent}</b>
              to act on
            </p>
            <p className="is-info">
              <b>{items.length - urgent}</b>
              to know about
            </p>
            <p>
              <b>{groups.length}</b>
              {groups.length === 1 ? "area" : "areas"}
            </p>
          </div>
          <h2 id="today-h" className="visually-hidden">
            Needs your attention
          </h2>
          <div className="today-grid">
            {groups.map(([area, list]) => (
              <section key={area} className={"today-card tone-" + list[0].tone} aria-label={area}>
                <header>
                  <span className="today-icon" aria-hidden="true">
                    <Icon name={AREA_ICON[area] || "bell"} />
                  </span>
                  <h3>{area}</h3>
                  <span className="today-count">{list.length}</span>
                </header>
                <ol className="queue">
                  {list.map((it) => (
                    <li key={it.key} className={"queue-item tone-" + it.tone}>
                      <p className="queue-text">{it.text}</p>
                      {it.quote ? <blockquote className="queue-quote">{it.quote}</blockquote> : null}
                      <a className="today-go" href={href(it.link)}>
                        {it.link.label}
                        <Icon name="arrow" />
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="empty today-empty">
          <p>
            <strong>Nothing needs you right now.</strong>
          </p>
          <p>{"This page fills in as work comes up: " + watch.join("; ") + ". Each line links straight to the thing that needs you."}</p>
        </div>
      )}
      {g ? (
        <p className="your-access">
          <strong>Your access</strong>
          {(me ? me.name + ": " : "") + grantLine(d, g) + ((g.extra || []).includes("codes.redeem") ? ", with till access" : "") + "."}
          {g.expires ? " After that date the console signs you out; ask the owner’s office to extend it." : ""}
        </p>
      ) : null}
    </div>
  );
}
