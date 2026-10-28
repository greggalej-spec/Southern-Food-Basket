"use client";

import { useEffect, useRef } from "react";
import { useConfirm } from "@/components/confirm";
import { toast } from "@/components/ui/sonner";
import { canon, todayIso } from "@/lib/admin/helpers";
import { fmtDate } from "@/lib/format";
import { SEED } from "@/lib/seed";
import { load, login, reset, useData } from "@/lib/store";

// The Publish tab from admin.js (section 5): what differs from the website as shipped, the data file for the web
// team, and the reset.

const AREAS = [
  { keys: ["specials"], label: "Specials" },
  { keys: ["branches"], label: "Store hours and phone numbers" },
  { keys: ["announcements"], label: "Staff notices" },
];

function ChangeRow({ label, unchanged }: { label: string; unchanged: boolean }) {
  return (
    <li>
      <span>{label}</span>
      {unchanged ? <span className="badge">Same as shipped</span> : <span className="badge badge-warn">Changed in this browser</span>}
    </li>
  );
}

export function PublishPanel() {
  const d = useData();
  const { confirm } = useConfirm();
  const pending = useRef<{ urls: Set<string>; timers: Set<number> }>({ urls: new Set(), timers: new Set() });

  // Revoke any download link still waiting for its timer when the page goes away.
  useEffect(() => {
    const p = pending.current;
    return () => {
      p.timers.forEach((t) => clearTimeout(t));
      p.urls.forEach((u) => URL.revokeObjectURL(u));
      p.timers.clear();
      p.urls.clear();
    };
  }, []);

  const data = d as unknown as Record<string, unknown>, seed = SEED as unknown as Record<string, unknown>;
  const same = (k: string) => canon(data[k]) === canon(seed[k]);
  const mine = AREAS.reduce<string[]>((a, x) => a.concat(x.keys), ["version"]);
  const otherKeys = Object.keys(Object.assign({}, seed, data)).filter((k) => mine.indexOf(k) === -1);

  function downloadFile() {
    const out = JSON.parse(JSON.stringify(load()));
    out.version = (Number(out.version) || 0) + 1;
    // The export has lib/seed.ts's shape, so the web team can drop it in place of that file.
    const header =
      'import type { Seed } from "./types";\n\n' +
      "/* Southern Food Basket — seed data for the concept site.\n" +
      "   Exported from the store admin on " + fmtDate(todayIso()) + " (version " + out.version + ").\n" +
      "   Two kinds of data, kept apart:\n" +
      "   - SOURCED: deals, prices, post dates, department lines and the Couva location come from the company's own\n" +
      "     public Instagram posts; company facts and branch addresses come from public directories (unverified).\n" +
      "   - DEMO: every person, job, document, hour, phone number and e-mail is invented for the prototype.\n" +
      "   This export keeps the data only. The notes on where each item came from live in the original lib/seed.ts.\n" +
      "   Bump `version` when the seed changes so stale localStorage copies are replaced. */\n";
    const text = header + "export const SEED: Seed = " + JSON.stringify(out, null, 2) + ";\n";
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "seed.ts";
      a.hidden = true;
      document.body.appendChild(a);
      a.click();
      a.remove();
      const p = pending.current;
      p.urls.add(url);
      const t = window.setTimeout(() => {
        URL.revokeObjectURL(url);
        p.urls.delete(url);
        p.timers.delete(t);
      }, 4000);
      p.timers.add(t);
      toast("Downloaded seed.ts (version " + out.version + "). Send it to the web team.", "ok");
    } catch {
      toast("The download did not start. Try another browser, or ask the web team for help.", "bad");
    }
  }

  async function discard() {
    const ok = await confirm({
      title: "Discard every change in this browser?",
      body: "Deals, hours, notices and anything changed in the other demo portals go back to how the website shipped. This cannot be undone.",
      okLabel: "Discard my changes",
      danger: true,
    });
    if (!ok) return;
    reset();
    login("admin", "emp-ria");
    location.reload();
  }

  return (
    <div className="publish-stack">
      <section className="panel" aria-labelledby="pub-how-h">
        <div className="panel-head">
          <h3 id="pub-how-h">Where your changes live</h3>
        </div>
        <div className="panel-body">
          <p>In this prototype, every change you make here is saved in this browser only. You see it on the public pages in this browser straight away, but nobody else does.</p>
          <p>In a real build, the Save buttons would publish to the live website for every shopper and member of staff.</p>
          <h4>Compared with the website as shipped</h4>
          <ul className="list change-list" id="pub-changes">
            {AREAS.map((a) => (
              <ChangeRow key={a.label} label={a.label} unchanged={a.keys.every(same)} />
            ))}
            <ChangeRow label="Everything else (jobs, applications, staff records)" unchanged={otherKeys.every(same)} />
          </ul>
        </div>
      </section>
      <section className="panel" aria-labelledby="pub-file-h">
        <div className="panel-head">
          <h3 id="pub-file-h">Hand your changes to the web team</h3>
        </div>
        <div className="panel-body">
          <p>
            Download a data file with everything in this browser. The web team puts it in place of <code>lib/seed.ts</code> and the next deploy carries your changes.
          </p>
          <button className="btn btn-primary" type="button" id="pub-download" onClick={downloadFile}>
            Download data file
          </button>
        </div>
      </section>
      <section className="panel" aria-labelledby="pub-reset-h">
        <div className="panel-head">
          <h3 id="pub-reset-h">Start again</h3>
        </div>
        <div className="panel-body">
          <p>Throw away every change made in this browser, including deals, hours, notices and anything changed in the other demo portals. You stay signed in as the store admin.</p>
          <button className="btn btn-danger" type="button" id="pub-reset" onClick={discard}>
            Discard my changes
          </button>
        </div>
      </section>
    </div>
  );
}
