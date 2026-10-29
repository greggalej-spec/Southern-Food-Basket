"use client";

import { useState } from "react";
import { activeGrant } from "@/lib/access";
import { grantLine } from "@/lib/admin/access-admin";
import { plural } from "@/lib/admin/helpers";
import { buildQueue, watching, type QueueItem } from "@/lib/admin/today";
import { currentEmployee, useData, useSession } from "@/lib/store";

// Today: a work queue, not a row of numbers. Each line is something this person can act on, given their access, with
// a link straight to it. It ends with what their access is.

const href = (l: QueueItem["link"]) => "#" + l.tab + (l.item ? "/" + encodeURIComponent(l.item) : "");

export function TodayPanel() {
  const d = useData();
  const s = useSession();
  const [now] = useState(() => Date.now());
  const items = buildQueue(d, s, now);
  const g = activeGrant(d, s);
  const me = currentEmployee(d, s);
  const watch = watching(d, s);

  return (
    <div className="today" data-tour="admin-today">
      {items.length ? (
        <section className="panel" aria-labelledby="today-h">
          <div className="panel-head">
            <h2 id="today-h">Needs your attention</h2>
            <span className="small muted">{plural(items.length, "item")}</span>
          </div>
          <ol className="list queue">
            {items.map((it) => (
              <li key={it.key} className={"queue-item tone-" + it.tone}>
                <div className="grow">
                  <p className="queue-area">{it.area}</p>
                  <p className="queue-text">{it.text}</p>
                  {it.quote ? <blockquote className="queue-quote">{it.quote}</blockquote> : null}
                </div>
                <a className="btn btn-ghost btn-sm" href={href(it.link)}>
                  {it.link.label}
                </a>
              </li>
            ))}
          </ol>
        </section>
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
