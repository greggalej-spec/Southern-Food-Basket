"use client";

import { useEffect, useRef } from "react";
import { useConfirm } from "@/components/confirm";
import { toast } from "@/components/ui/sonner";
import { ROLE_NAME } from "@/lib/access";
import { attempt } from "@/lib/admin/guard";
import { canon } from "@/lib/admin/helpers";
import { exportSeed, privateKeys, shippedData } from "@/lib/admin/publish";
import { login, reset, session, useData, useSession } from "@/lib/store";

// The Publish section (site.publish): what differs from the website as shipped, the data file for the web team, and
// the reset. The data file is lib/seed.ts, which every visitor's browser downloads, so lib/admin/publish.ts writes
// public data only: every staff and shopper collection empty, and approved offers without their notes or history.

const AREAS = [
  { keys: ["specials"], label: "Specials" },
  { keys: ["branches"], label: "Store hours and phone numbers" },
  { keys: ["promotions"], label: "Members’ offers" },
];

function ChangeRow({ label, unchanged }: { label: string; unchanged: boolean }) {
  return (
    <li>
      <span className="grow">{label}</span>
      {unchanged ? <span className="badge">Same as shipped</span> : <span className="badge badge-warn">Changed in this browser</span>}
    </li>
  );
}

export function PublishPanel() {
  const d = useData();
  const s = useSession();
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

  const data = d as unknown as Record<string, unknown>;
  const shipped = shippedData();
  const same = (k: string) => canon(data[k]) === canon(shipped[k]);
  const hidden = new Set([...privateKeys(), "version", "_tiers"]);
  const mine = new Set(AREAS.flatMap((a) => a.keys));
  const privateChanged = privateKeys().some((k) => k in data && !same(k));
  const otherKeys = Object.keys(Object.assign({}, shipped, data)).filter((k) => !mine.has(k) && !hidden.has(k));

  function downloadFile() {
    const r = attempt(s, "site.publish", "Website data file", () => exportSeed(s));
    if (!r.ok) return toast(r.message, "bad");
    try {
      const url = URL.createObjectURL(new Blob([r.value.text], { type: "text/plain;charset=utf-8" }));
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
      toast("Downloaded seed.ts (version " + r.value.version + "). Send it to the web team.", "ok");
    } catch {
      toast("The download did not start. Try another browser, or ask the web team for help.", "bad");
    }
  }

  async function discard() {
    const ok = await confirm({
      title: "Discard every change in this browser?",
      body: "Deals, hours, offers, newsletters, access changes and anything changed in the other demo portals go back to how the website shipped, and the audit log starts again. This cannot be undone.",
      okLabel: "Discard my changes",
      danger: true,
    });
    if (!ok) return;
    const cur = session();
    reset();
    if (cur) login(cur.role, cur.userId);
    location.reload();
  }

  return (
    <div className="publish-stack">
      <section className="panel" aria-labelledby="pub-how-h">
        <div className="panel-head">
          <h2 id="pub-how-h">Where your changes live</h2>
        </div>
        <div className="panel-body">
          <p>In this prototype, every change you make here is saved in this browser only. You see it on the public pages in this browser straight away, but nobody else does.</p>
          <p>In a real build, the Save buttons would publish to the live website for every shopper and member of staff.</p>
          <h3 className="sub-h">Compared with the website as shipped</h3>
          <ul className="list change-list" id="pub-changes">
            {AREAS.map((a) => (
              <ChangeRow key={a.label} label={a.label} unchanged={a.keys.every(same)} />
            ))}
            <ChangeRow label="Everything else on the public site (departments, jobs, settings)" unchanged={otherKeys.every(same)} />
            <ChangeRow label="Staff and shopper records (never in the data file)" unchanged={!privateChanged} />
          </ul>
        </div>
      </section>
      <section className="panel" aria-labelledby="pub-file-h">
        <div className="panel-head">
          <h2 id="pub-file-h">Hand your changes to the web team</h2>
        </div>
        <div className="panel-body">
          <p>
            Download a data file of the public website: specials, store hours and phone numbers, departments, jobs and approved offers. The web team puts it in place of <code>lib/seed.ts</code> and the next deploy carries
            your changes.
          </p>
          <p>
            Every visitor’s browser downloads that file, so it leaves out everything private. Applicants, staff records, staff notices and updates, access, shoppers, codes, till checks, the mailing list, newsletters
            and the audit log are written as empty lists; in a real build they live in the database. Offers go in only once approved, without the reviewer’s note, the edit history or who drafted them.
          </p>
          <p className="hint">The download is written in the audit log.</p>
          <button className="btn btn-primary" type="button" id="pub-download" onClick={downloadFile}>
            Download data file
          </button>
        </div>
      </section>
      <section className="panel" aria-labelledby="pub-reset-h">
        <div className="panel-head">
          <h2 id="pub-reset-h">Start again</h2>
        </div>
        <div className="panel-body">
          <p>{"Throw away every change made in this browser, in the console and in the other demo portals. You stay signed in" + (s ? " as " + ROLE_NAME[s.role] : "") + "."}</p>
          <button className="btn btn-ghost" type="button" id="pub-reset" onClick={discard}>
            Discard my changes
          </button>
        </div>
      </section>
    </div>
  );
}
