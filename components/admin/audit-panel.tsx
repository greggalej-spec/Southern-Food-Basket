"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { actorOf, areaLabel, areaOf, detailOf, eventSentence } from "@/lib/admin/audit-text";
import { plural } from "@/lib/admin/helpers";
import { whenTT } from "@/lib/admin/tt";
import { useData } from "@/lib/store";

// The audit log (audit.view), newest first, as sentences: who, what, when, and whether it was refused. Filters by
// area, person and result. "#audit/refused" opens it on the refused attempts (the Today queue links there).

const PAGE = 100;

export function AuditPanel({ item }: { item: string | null }) {
  const d = useData();
  const [area, setArea] = useState("all");
  const [who, setWho] = useState("all");
  const [result, setResult] = useState<"all" | "ok" | "refused">(item === "refused" ? "refused" : "all");
  const [linked, setLinked] = useState(item);
  const [limit, setLimit] = useState(PAGE);
  if (item !== linked) {
    setLinked(item);
    if (item === "refused") setResult("refused");
  }

  const events = (d.audit || []).slice().sort((a, b) => b.at.localeCompare(a.at));
  const areas = Array.from(new Set(events.map((e) => areaOf(e.action)))).sort((a, b) => areaLabel(a).localeCompare(areaLabel(b)));
  const actors = Array.from(new Map(events.map((e) => [e.actor, actorOf(d, e)])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const shown = events.filter((e) => (area === "all" || areaOf(e.action) === area) && (who === "all" || e.actor === who) && (result === "all" || (result === "ok") === e.ok));
  const refused = events.filter((e) => !e.ok).length;

  return (
    <div className="section-stack">
      <section className="panel" aria-labelledby="audit-h">
        <div className="panel-head">
          <h2 id="audit-h">Events</h2>
          <span className="small muted">{plural(events.length, "event") + ", " + refused + " refused"}</span>
        </div>
        <div className="panel-body">
          <div className="toolbar">
            <div>
              <label className="visually-hidden" htmlFor="au-area">
                Show events by area
              </label>
              <select id="au-area" value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="all">Every area</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {areaLabel(a)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="visually-hidden" htmlFor="au-who">
                Show events by person
              </label>
              <select id="au-who" value={who} onChange={(e) => setWho(e.target.value)}>
                <option value="all">Everyone</option>
                {actors.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="visually-hidden" htmlFor="au-result">
                Show events by result
              </label>
              <select id="au-result" value={result} onChange={(e) => setResult(e.target.value as typeof result)}>
                <option value="all">Done and refused</option>
                <option value="ok">Done</option>
                <option value="refused">Refused</option>
              </select>
            </div>
            <p className="small muted toolbar-count" aria-live="polite">
              {plural(shown.length, "event")}
            </p>
          </div>
          <p className="hint">The log never holds a full code, an e-mail address or a document.</p>
        </div>
        {shown.length ? (
          <ol className="audit-log" data-tour="audit-log">
            {shown.slice(0, limit).map((e) => {
              const detail = detailOf(e);
              return (
                <li key={e.id} className={e.ok ? undefined : "is-refused"}>
                  <div className="audit-when">
                    <time dateTime={e.at}>{whenTT(e.at)}</time>
                    <span className="meta">{areaLabel(areaOf(e.action))}</span>
                  </div>
                  <div className="grow">
                    <p>
                      <strong>{actorOf(d, e)}</strong> {eventSentence(e)}
                    </p>
                    {detail ? <p className="meta">{detail}</p> : null}
                  </div>
                  {e.ok ? null : <Badge variant="bad">Refused</Badge>}
                </li>
              );
            })}
          </ol>
        ) : (
          <div data-tour="audit-log">
            <p className="panel-empty">{events.length ? "No events match. Choose Every area, Everyone, and Done and refused." : "Nothing has happened yet. Every change and every refused attempt shows here."}</p>
          </div>
        )}
        {shown.length > limit ? (
          <div className="panel-body">
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setLimit((n) => n + PAGE)}>
              {"Show " + Math.min(PAGE, shown.length - limit) + " older"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
